const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonStyle } = require('discord.js');
const reactionRoleManager = require('../../lib/reaction-roles/reaction-role-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('role-menu')
    .setDescription('Create a menu with mutually exclusive roles (users can select only one)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand =>
      subcommand.setName('create')
        .setDescription('Create a role menu')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send the menu to')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('title')
            .setDescription('The title of the embed')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('The description of the embed')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('color')
            .setDescription('The color of the embed (hex code)')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('placeholder')
            .setDescription('The placeholder text for the menu')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('add-role')
        .setDescription('Add a role to a role menu')
        .addStringOption(option =>
          option.setName('menu-id')
            .setDescription('The ID of the role menu')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to add')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('label')
            .setDescription('The label for the option')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('emoji')
            .setDescription('The emoji for the option')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('style')
            .setDescription('The style of the button')
            .setRequired(false)
            .addChoices(
              { name: 'Primary (Blue)', value: 'PRIMARY' },
              { name: 'Secondary (Grey)', value: 'SECONDARY' },
              { name: 'Success (Green)', value: 'SUCCESS' },
              { name: 'Danger (Red)', value: 'DANGER' }
            )))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all role menus in this server'))
    .addSubcommand(subcommand =>
      subcommand.setName('delete')
        .setDescription('Delete a role menu')
        .addStringOption(option =>
          option.setName('menu-id')
            .setDescription('The ID of the role menu')
            .setRequired(true))),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get subcommand
      const subcommand = interaction.options.getSubcommand();
      
      // Check if user has permissions
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
          content: 'You need the "Manage Roles" permission to use this command.',
          ephemeral: true
        });
      }
      
      // Check if bot has permissions
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
          content: 'I need the "Manage Roles" permission to use this command.',
          ephemeral: true
        });
      }
      
      switch (subcommand) {
        case 'create':
          await handleCreateRoleMenu(interaction, client);
          break;
          
        case 'add-role':
          await handleAddRoleToMenu(interaction, client);
          break;
          
        case 'list':
          await handleListRoleMenus(interaction);
          break;
          
        case 'delete':
          await handleDeleteRoleMenu(interaction, client);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing role-menu command:', error);
      
      // Handle already replied or deferred
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(`An error occurred: ${error.message}`);
      } else {
        await interaction.reply({
          content: `An error occurred: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }
};

/**
 * Handle creating a role menu
 * @param {CommandInteraction} interaction - The interaction
 * @param {Client} client - The Discord client
 */
async function handleCreateRoleMenu(interaction, client) {
  try {
    // Get options
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color') || '#5865F2';
    const placeholder = interaction.options.getString('placeholder') || 'Select a role';
    
    // Check channel type
    if (!channel.isTextBased() || channel.isVoiceBased() || channel.isThread()) {
      return interaction.reply({
        content: 'Please select a text channel.',
        ephemeral: true
      });
    }
    
    // Check if bot has permissions in the channel
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    
    if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.reply({
        content: 'I need the "Send Messages" and "Embed Links" permissions in that channel.',
        ephemeral: true
      });
    }
    
    // Defer reply
    await interaction.deferReply({ ephemeral: true });
    
    // Create role menu with no roles yet
    const roleMenu = await reactionRoleManager.createReactionRoleMenu({
      guild: interaction.guild,
      channel,
      roles: [],
      title,
      description,
      color,
      placeholder
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Role Menu Created')
      .setDescription(`Role menu created in ${channel}.\nUse \`/role-menu add-role\` to add roles to it.`)
      .addFields(
        { name: 'Menu ID', value: roleMenu.menuId, inline: false },
        { name: 'Message ID', value: roleMenu.messageId, inline: false }
      )
      .setFooter({ text: 'Keep the Menu ID to add roles to the menu' });
    
    // Send reply
    await interaction.editReply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} created role menu in channel ${channel.name}`);
  } catch (error) {
    logger.error('Error creating role menu:', error);
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(`An error occurred: ${error.message}`);
    } else {
      await interaction.reply({
        content: `An error occurred: ${error.message}`,
        ephemeral: true
      });
    }
  }
}

/**
 * Handle adding a role to a role menu
 * @param {CommandInteraction} interaction - The interaction
 * @param {Client} client - The Discord client
 */
async function handleAddRoleToMenu(interaction, client) {
  try {
    // Get options
    const menuId = interaction.options.getString('menu-id');
    const role = interaction.options.getRole('role');
    const label = interaction.options.getString('label');
    const emoji = interaction.options.getString('emoji');
    const style = interaction.options.getString('style') || 'SECONDARY';
    
    // Check if menu exists
    const menus = reactionRoleManager.getGuildReactionRoleMenus(interaction.guildId);
    const menu = menus.find(m => m.menuId === menuId);
    
    if (!menu) {
      return interaction.reply({
        content: 'Role menu not found. Use `/role-menu list` to see all role menus.',
        ephemeral: true
      });
    }
    
    // Check if role is manageable
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content: `I cannot assign the role "${role.name}" as it is higher than or equal to my highest role.`,
        ephemeral: true
      });
    }
    
    // Check if role is already in the menu
    if (menu.roles.some(r => r.roleId === role.id)) {
      return interaction.reply({
        content: `The role "${role.name}" is already in this role menu.`,
        ephemeral: true
      });
    }
    
    // Convert style string to ButtonStyle enum
    let buttonStyle;
    switch (style) {
      case 'PRIMARY':
        buttonStyle = ButtonStyle.Primary;
        break;
      case 'SECONDARY':
        buttonStyle = ButtonStyle.Secondary;
        break;
      case 'SUCCESS':
        buttonStyle = ButtonStyle.Success;
        break;
      case 'DANGER':
        buttonStyle = ButtonStyle.Danger;
        break;
      default:
        buttonStyle = ButtonStyle.Secondary;
    }
    
    // Get message
    const channel = await client.channels.fetch(menu.channelId).catch(() => null);
    
    if (!channel) {
      return interaction.reply({
        content: 'The channel for this role menu no longer exists.',
        ephemeral: true
      });
    }
    
    const message = await channel.messages.fetch(menu.messageId).catch(() => null);
    
    if (!message) {
      return interaction.reply({
        content: 'The message for this role menu no longer exists.',
        ephemeral: true
      });
    }
    
    // Add role to menu
    const updatedRoles = [
      ...menu.roles,
      {
        roleId: role.id,
        emoji,
        label,
        style: buttonStyle
      }
    ];
    
    // Update menu
    const rows = [];
    let currentRow = new ActionRowBuilder();
    let buttonsInRow = 0;
    
    for (const menuRole of updatedRoles) {
      // Create button
      const button = new ButtonBuilder()
        .setCustomId(`role_${reactionRoleManager.ROLE_BUTTON_TYPES.EXCLUSIVE}_${menuId}_${menuRole.roleId}`)
        .setLabel(menuRole.label)
        .setStyle(menuRole.style || ButtonStyle.Secondary);
      
      // Add emoji if provided
      if (menuRole.emoji) {
        button.setEmoji(menuRole.emoji);
      }
      
      // Add button to row
      currentRow.addComponents(button);
      buttonsInRow++;
      
      // Create new row if current one is full (max 5 buttons per row)
      if (buttonsInRow === 5 && updatedRoles.indexOf(menuRole) < updatedRoles.length - 1) {
        rows.push(currentRow);
        currentRow = new ActionRowBuilder();
        buttonsInRow = 0;
      }
    }
    
    // Add last row if not empty
    if (buttonsInRow > 0) {
      rows.push(currentRow);
    }
    
    // Get embed from message
    const embed = EmbedBuilder.from(message.embeds[0]);
    
    // Update message
    await message.edit({
      embeds: [embed],
      components: rows
    });
    
    // Update menu in collection
    menu.roles = updatedRoles;
    await reactionRoleManager.saveReactionRoles();
    
    // Create response embed
    const responseEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Role Added')
      .setDescription(`Added role ${role} to the role menu.`)
      .addFields(
        { name: 'Label', value: label, inline: true },
        { name: 'Emoji', value: emoji || 'None', inline: true },
        { name: 'Style', value: style, inline: true }
      );
    
    // Send reply
    await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
    
    logger.info(`User ${interaction.user.tag} added role ${role.name} to role menu ${menuId}`);
  } catch (error) {
    logger.error('Error adding role to role menu:', error);
    throw error;
  }
}

/**
 * Handle listing role menus
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListRoleMenus(interaction) {
  try {
    // Get menus
    const menus = reactionRoleManager.getGuildReactionRoleMenus(interaction.guildId);
    
    if (menus.length === 0) {
      return interaction.reply({
        content: 'No role menus found in this server.',
        ephemeral: true
      });
    }
    
    // Format menus
    let description = '';
    
    for (const menu of menus) {
      const channel = interaction.guild.channels.cache.get(menu.channelId);
      const channelName = channel ? channel.name : 'Unknown Channel';
      
      description += `**Menu ID:** ${menu.menuId}\n`;
      description += `**Message ID:** ${menu.messageId}\n`;
      description += `**Channel:** ${channel ? `<#${channel.id}>` : 'Unknown Channel'}\n`;
      description += `**Title:** ${menu.title}\n`;
      description += `**Roles:** ${menu.roles.length}\n\n`;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Role Menus')
      .setDescription(description)
      .setFooter({ text: `${menus.length} role menu(s) found` });
    
    // Send reply
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error('Error listing role menus:', error);
    throw error;
  }
}

/**
 * Handle deleting a role menu
 * @param {CommandInteraction} interaction - The interaction
 * @param {Client} client - The Discord client
 */
async function handleDeleteRoleMenu(interaction, client) {
  try {
    // Get options
    const menuId = interaction.options.getString('menu-id');
    
    // Check if menu exists
    const menus = reactionRoleManager.getGuildReactionRoleMenus(interaction.guildId);
    const menu = menus.find(m => m.menuId === menuId);
    
    if (!menu) {
      return interaction.reply({
        content: 'Role menu not found. Use `/role-menu list` to see all role menus.',
        ephemeral: true
      });
    }
    
    // Defer reply
    await interaction.deferReply({ ephemeral: true });
    
    // Try to delete the actual message
    try {
      const channel = await client.channels.fetch(menu.channelId);
      
      if (channel) {
        const message = await channel.messages.fetch(menu.messageId).catch(() => null);
        
        if (message) {
          await message.delete();
        }
      }
    } catch (error) {
      logger.warn(`Could not delete role menu message ${menu.messageId}:`, error);
      // Continue with deletion from the database even if the message can't be deleted
    }
    
    // Delete from manager
    const success = await reactionRoleManager.deleteReactionRoleMenu(menuId);
    
    if (!success) {
      return interaction.editReply('Failed to delete the role menu.');
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Role Menu Deleted')
      .setDescription(`Successfully deleted the role menu with ID ${menuId}.`);
    
    // Send reply
    await interaction.editReply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} deleted role menu ${menuId}`);
  } catch (error) {
    logger.error('Error deleting role menu:', error);
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(`An error occurred: ${error.message}`);
    } else {
      await interaction.reply({
        content: `An error occurred: ${error.message}`,
        ephemeral: true
      });
    }
  }
}