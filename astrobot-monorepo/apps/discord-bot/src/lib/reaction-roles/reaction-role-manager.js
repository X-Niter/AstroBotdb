/**
 * Reaction Role Manager
 * Handles the creation and management of reaction roles
 */

const { Collection, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');

// Path to reaction roles storage file
const REACTION_ROLES_FILE = path.join(process.cwd(), 'data', 'reaction-roles.json');

// Reaction role messages
const reactionRoleMessages = new Collection();

// Reaction role menus
const reactionRoleMenus = new Collection();

// Role button types (for button ID generation)
const ROLE_BUTTON_TYPES = {
  STANDARD: 'std', // Standard button (toggle a single role)
  EXCLUSIVE: 'exc' // Exclusive button (select one role from a group)
};

/**
 * Initialize the reaction role manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing reaction role manager...');
    
    // Load reaction roles
    await loadReactionRoles();
    
    logger.info('Reaction role manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing reaction role manager:', error);
    return false;
  }
}

/**
 * Load reaction roles from disk
 * @returns {Promise<void>}
 */
async function loadReactionRoles() {
  try {
    // Clear collections
    reactionRoleMessages.clear();
    reactionRoleMenus.clear();
    
    // Check if file exists
    try {
      await fs.access(REACTION_ROLES_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveReactionRoles();
      return;
    }
    
    // Read file
    const data = await fs.readFile(REACTION_ROLES_FILE, 'utf8');
    
    // Parse JSON
    const rolesData = JSON.parse(data);
    
    // Load reaction role messages
    if (rolesData.messages) {
      for (const [messageId, messageData] of Object.entries(rolesData.messages)) {
        reactionRoleMessages.set(messageId, messageData);
      }
    }
    
    // Load reaction role menus
    if (rolesData.menus) {
      for (const [menuId, menuData] of Object.entries(rolesData.menus)) {
        reactionRoleMenus.set(menuId, menuData);
      }
    }
    
    logger.debug('Reaction roles loaded from disk');
  } catch (error) {
    logger.error('Error loading reaction roles:', error);
    throw error;
  }
}

/**
 * Save reaction roles to disk
 * @returns {Promise<void>}
 */
async function saveReactionRoles() {
  try {
    // Create data object
    const rolesData = {
      messages: {},
      menus: {}
    };
    
    // Add reaction role messages
    for (const [messageId, messageData] of reactionRoleMessages.entries()) {
      rolesData.messages[messageId] = messageData;
    }
    
    // Add reaction role menus
    for (const [menuId, menuData] of reactionRoleMenus.entries()) {
      rolesData.menus[menuId] = menuData;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(REACTION_ROLES_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(REACTION_ROLES_FILE, JSON.stringify(rolesData, null, 2));
    
    logger.debug('Reaction roles saved to disk');
  } catch (error) {
    logger.error('Error saving reaction roles:', error);
    throw error;
  }
}

/**
 * Create a reaction role message
 * @param {Object} options - The options for the reaction role message
 * @returns {Promise<Object>} The created reaction role message
 */
async function createReactionRoleMessage(options) {
  try {
    const { guild, channel, roles, title, description, color, style } = options;
    
    // Validate roles format
    if (!Array.isArray(roles) || roles.length === 0) {
      throw new Error('Roles must be a non-empty array');
    }
    
    // Validate roles
    for (const role of roles) {
      if (!role.roleId || !role.emoji || !role.label) {
        throw new Error('Each role must have a roleId, emoji, and label');
      }
      
      // Check if role exists
      const guildRole = await guild.roles.fetch(role.roleId).catch(() => null);
      
      if (!guildRole) {
        throw new Error(`Role with ID ${role.roleId} not found`);
      }
      
      // Check if bot has permission to manage the role
      if (guildRole.position >= guild.members.me.roles.highest.position) {
        throw new Error(`Cannot manage role "${guildRole.name}" as it is higher than or equal to my highest role`);
      }
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(title || 'Reaction Roles')
      .setDescription(description || 'React to get roles')
      .setColor(color || '#5865F2')
      .setFooter({ text: 'Click the buttons below to get or remove roles' });
    
    // Create buttons
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonsInRow = 0;
    
    for (const role of roles) {
      // Create button
      const button = new ButtonBuilder()
        .setCustomId(`role_${ROLE_BUTTON_TYPES.STANDARD}_${role.roleId}`)
        .setLabel(role.label)
        .setStyle(role.style || ButtonStyle.Primary);
      
      // Add emoji if provided
      if (role.emoji) {
        button.setEmoji(role.emoji);
      }
      
      // Add button to row
      currentRow.addComponents(button);
      buttonsInRow++;
      
      // Create new row if current one is full (max 5 buttons per row)
      if (buttonsInRow === 5 && roles.indexOf(role) < roles.length - 1) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
        buttonsInRow = 0;
      }
    }
    
    // Add last row if not empty
    if (buttonsInRow > 0) {
      rows.push(currentRow);
    }
    
    // Send message
    const message = await channel.send({
      embeds: [embed],
      components: rows
    });
    
    // Save reaction role message
    const reactionRoleMessage = {
      messageId: message.id,
      channelId: channel.id,
      guildId: guild.id,
      roles: roles.map(role => ({
        roleId: role.roleId,
        emoji: role.emoji,
        label: role.label,
        style: role.style || ButtonStyle.Primary
      })),
      createdAt: Date.now(),
      title: title || 'Reaction Roles',
      description: description || 'React to get roles',
      color: color || '#5865F2',
      style: style || 'BUTTONS'
    };
    
    // Add to collection
    reactionRoleMessages.set(message.id, reactionRoleMessage);
    
    // Save to disk
    await saveReactionRoles();
    
    return reactionRoleMessage;
  } catch (error) {
    logger.error('Error creating reaction role message:', error);
    throw error;
  }
}

/**
 * Create a reaction role menu (mutually exclusive roles)
 * @param {Object} options - The options for the reaction role menu
 * @returns {Promise<Object>} The created reaction role menu
 */
async function createReactionRoleMenu(options) {
  try {
    const { guild, channel, roles, title, description, color, placeholder } = options;
    
    // Validate roles format
    if (!Array.isArray(roles) || roles.length === 0) {
      throw new Error('Roles must be a non-empty array');
    }
    
    // Validate roles
    for (const role of roles) {
      if (!role.roleId || !role.label) {
        throw new Error('Each role must have a roleId and label');
      }
      
      // Check if role exists
      const guildRole = await guild.roles.fetch(role.roleId).catch(() => null);
      
      if (!guildRole) {
        throw new Error(`Role with ID ${role.roleId} not found`);
      }
      
      // Check if bot has permission to manage the role
      if (guildRole.position >= guild.members.me.roles.highest.position) {
        throw new Error(`Cannot manage role "${guildRole.name}" as it is higher than or equal to my highest role`);
      }
    }
    
    // Generate menu ID
    const menuId = Date.now().toString();
    
    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(title || 'Role Menu')
      .setDescription(description || 'Select a role from the menu below')
      .setColor(color || '#5865F2')
      .setFooter({ text: 'Click the buttons below to select a role' });
    
    // Create buttons (similar to reaction roles, but one button per role and they're exclusive)
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonsInRow = 0;
    
    for (const role of roles) {
      // Create button
      const button = new ButtonBuilder()
        .setCustomId(`role_${ROLE_BUTTON_TYPES.EXCLUSIVE}_${menuId}_${role.roleId}`)
        .setLabel(role.label)
        .setStyle(role.style || ButtonStyle.Secondary);
      
      // Add emoji if provided
      if (role.emoji) {
        button.setEmoji(role.emoji);
      }
      
      // Add button to row
      currentRow.addComponents(button);
      buttonsInRow++;
      
      // Create new row if current one is full (max 5 buttons per row)
      if (buttonsInRow === 5 && roles.indexOf(role) < roles.length - 1) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
        buttonsInRow = 0;
      }
    }
    
    // Add last row if not empty
    if (buttonsInRow > 0) {
      rows.push(currentRow);
    }
    
    // Send message
    const message = await channel.send({
      embeds: [embed],
      components: rows
    });
    
    // Save reaction role menu
    const reactionRoleMenu = {
      menuId,
      messageId: message.id,
      channelId: channel.id,
      guildId: guild.id,
      roles: roles.map(role => ({
        roleId: role.roleId,
        emoji: role.emoji,
        label: role.label,
        style: role.style || ButtonStyle.Secondary
      })),
      createdAt: Date.now(),
      title: title || 'Role Menu',
      description: description || 'Select a role from the menu below',
      color: color || '#5865F2',
      placeholder: placeholder || 'Select a role'
    };
    
    // Add to collection
    reactionRoleMenus.set(menuId, reactionRoleMenu);
    
    // Save to disk
    await saveReactionRoles();
    
    return reactionRoleMenu;
  } catch (error) {
    logger.error('Error creating reaction role menu:', error);
    throw error;
  }
}

/**
 * Handle a button interaction for a reaction role
 * @param {ButtonInteraction} interaction - The button interaction
 * @returns {Promise<boolean>} Whether the interaction was handled
 */
async function handleButtonInteraction(interaction) {
  try {
    const { customId, member } = interaction;
    
    // Check if this is a role button
    if (!customId.startsWith('role_')) {
      return false;
    }
    
    // Parse custom ID
    const [, buttonType, ...params] = customId.split('_');
    
    // Handle based on button type
    if (buttonType === ROLE_BUTTON_TYPES.STANDARD) {
      // Standard role button (toggle role)
      const roleId = params.join('_'); // In case role ID contains underscores
      
      // Check if message is in our collection
      const reactionRole = reactionRoleMessages.get(interaction.message.id);
      
      if (!reactionRole) {
        return false;
      }
      
      // Check if this role is part of this message
      const roleConfig = reactionRole.roles.find(r => r.roleId === roleId);
      
      if (!roleConfig) {
        return false;
      }
      
      // Toggle role
      const hasRole = member.roles.cache.has(roleId);
      
      if (hasRole) {
        // Remove role
        await member.roles.remove(roleId);
        await interaction.reply({
          content: `Removed the <@&${roleId}> role.`,
          ephemeral: true
        });
      } else {
        // Add role
        await member.roles.add(roleId);
        await interaction.reply({
          content: `Added the <@&${roleId}> role.`,
          ephemeral: true
        });
      }
      
      return true;
    } else if (buttonType === ROLE_BUTTON_TYPES.EXCLUSIVE) {
      // Exclusive role button (select one from group)
      const menuId = params[0];
      const roleId = params.slice(1).join('_'); // In case role ID contains underscores
      
      // Check if menu exists
      const menu = reactionRoleMenus.get(menuId);
      
      if (!menu) {
        return false;
      }
      
      // Get all role IDs in this menu
      const menuRoleIds = menu.roles.map(r => r.roleId);
      
      // Check if this role is part of this menu
      if (!menuRoleIds.includes(roleId)) {
        return false;
      }
      
      // Remove all roles from this menu
      const rolesToRemove = member.roles.cache.filter(role => menuRoleIds.includes(role.id));
      
      if (rolesToRemove.size > 0) {
        await member.roles.remove(rolesToRemove);
      }
      
      // Check if user is trying to deselect the role they already have
      const alreadyHasRole = rolesToRemove.has(roleId);
      
      if (alreadyHasRole) {
        // User is deselecting the role
        await interaction.reply({
          content: `Removed the <@&${roleId}> role.`,
          ephemeral: true
        });
      } else {
        // Add the new role
        await member.roles.add(roleId);
        await interaction.reply({
          content: `Added the <@&${roleId}> role.`,
          ephemeral: true
        });
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error handling reaction role button interaction:', error);
    
    // Try to reply if possible
    try {
      await interaction.reply({
        content: `An error occurred while managing your role: ${error.message}`,
        ephemeral: true
      });
    } catch (replyError) {
      logger.error('Error replying to interaction:', replyError);
    }
    
    return true; // Still mark as handled
  }
}

/**
 * Get all reaction role messages in a guild
 * @param {string} guildId - The guild ID
 * @returns {Array<Object>} The reaction role messages
 */
function getGuildReactionRoleMessages(guildId) {
  return Array.from(reactionRoleMessages.values())
    .filter(message => message.guildId === guildId);
}

/**
 * Get all reaction role menus in a guild
 * @param {string} guildId - The guild ID
 * @returns {Array<Object>} The reaction role menus
 */
function getGuildReactionRoleMenus(guildId) {
  return Array.from(reactionRoleMenus.values())
    .filter(menu => menu.guildId === guildId);
}

/**
 * Delete a reaction role message
 * @param {string} messageId - The message ID
 * @returns {Promise<boolean>} Whether the message was deleted
 */
async function deleteReactionRoleMessage(messageId) {
  try {
    // Check if message exists
    if (!reactionRoleMessages.has(messageId)) {
      return false;
    }
    
    // Remove from collection
    reactionRoleMessages.delete(messageId);
    
    // Save to disk
    await saveReactionRoles();
    
    return true;
  } catch (error) {
    logger.error('Error deleting reaction role message:', error);
    return false;
  }
}

/**
 * Delete a reaction role menu
 * @param {string} menuId - The menu ID
 * @returns {Promise<boolean>} Whether the menu was deleted
 */
async function deleteReactionRoleMenu(menuId) {
  try {
    // Check if menu exists
    if (!reactionRoleMenus.has(menuId)) {
      return false;
    }
    
    // Remove from collection
    reactionRoleMenus.delete(menuId);
    
    // Save to disk
    await saveReactionRoles();
    
    return true;
  } catch (error) {
    logger.error('Error deleting reaction role menu:', error);
    return false;
  }
}

/**
 * Update a reaction role message
 * @param {Object} options - The options for updating the message
 * @returns {Promise<boolean>} Whether the message was updated
 */
async function updateReactionRoleMessage(options) {
  try {
    const { client, messageId, channelId, guildId, roles, title, description, color } = options;
    
    // Check if message exists
    if (!reactionRoleMessages.has(messageId)) {
      return false;
    }
    
    // Get current message data
    const currentData = reactionRoleMessages.get(messageId);
    
    // Get guild and channel
    const guild = await client.guilds.fetch(guildId);
    const channel = await guild.channels.fetch(channelId);
    
    if (!channel) {
      throw new Error('Channel not found');
    }
    
    // Get message
    const message = await channel.messages.fetch(messageId).catch(() => null);
    
    if (!message) {
      throw new Error('Message not found');
    }
    
    // Validate roles if provided
    let updatedRoles = currentData.roles;
    
    if (roles) {
      // Validate roles format
      if (!Array.isArray(roles) || roles.length === 0) {
        throw new Error('Roles must be a non-empty array');
      }
      
      // Validate roles
      for (const role of roles) {
        if (!role.roleId || !role.emoji || !role.label) {
          throw new Error('Each role must have a roleId, emoji, and label');
        }
        
        // Check if role exists
        const guildRole = await guild.roles.fetch(role.roleId).catch(() => null);
        
        if (!guildRole) {
          throw new Error(`Role with ID ${role.roleId} not found`);
        }
        
        // Check if bot has permission to manage the role
        if (guildRole.position >= guild.members.me.roles.highest.position) {
          throw new Error(`Cannot manage role "${guildRole.name}" as it is higher than or equal to my highest role`);
        }
      }
      
      updatedRoles = roles;
    }
    
    // Create updated embed
    const embed = new EmbedBuilder()
      .setTitle(title || currentData.title)
      .setDescription(description || currentData.description)
      .setColor(color || currentData.color)
      .setFooter({ text: 'Click the buttons below to get or remove roles' });
    
    // Create buttons
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonsInRow = 0;
    
    for (const role of updatedRoles) {
      // Create button
      const button = new ButtonBuilder()
        .setCustomId(`role_${ROLE_BUTTON_TYPES.STANDARD}_${role.roleId}`)
        .setLabel(role.label)
        .setStyle(role.style || ButtonStyle.Primary);
      
      // Add emoji if provided
      if (role.emoji) {
        button.setEmoji(role.emoji);
      }
      
      // Add button to row
      currentRow.addComponents(button);
      buttonsInRow++;
      
      // Create new row if current one is full (max 5 buttons per row)
      if (buttonsInRow === 5 && updatedRoles.indexOf(role) < updatedRoles.length - 1) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
        buttonsInRow = 0;
      }
    }
    
    // Add last row if not empty
    if (buttonsInRow > 0) {
      rows.push(currentRow);
    }
    
    // Update message
    await message.edit({
      embeds: [embed],
      components: rows
    });
    
    // Update in collection
    const updatedData = {
      ...currentData,
      roles: updatedRoles,
      title: title || currentData.title,
      description: description || currentData.description,
      color: color || currentData.color
    };
    
    reactionRoleMessages.set(messageId, updatedData);
    
    // Save to disk
    await saveReactionRoles();
    
    return true;
  } catch (error) {
    logger.error('Error updating reaction role message:', error);
    return false;
  }
}

module.exports = {
  initialize,
  createReactionRoleMessage,
  createReactionRoleMenu,
  handleButtonInteraction,
  getGuildReactionRoleMessages,
  getGuildReactionRoleMenus,
  deleteReactionRoleMessage,
  deleteReactionRoleMenu,
  updateReactionRoleMessage,
  ROLE_BUTTON_TYPES
};