/**
 * Welcome Manager
 * Manages welcome messages, goodbye messages, and custom member events
 */

const { Collection, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const Canvas = require('canvas');
const logger = require('../logger');

// Path to welcome settings file
const WELCOME_SETTINGS_FILE = path.join(process.cwd(), 'data', 'welcome-settings.json');

// Guild welcome settings (guildId -> settings)
const guildSettings = new Collection();

// Default settings
const DEFAULT_SETTINGS = {
  enabled: false,
  welcomeEnabled: false,
  welcomeChannelId: null,
  welcomeMessage: 'Welcome {user} to {server}! You are member #{memberCount}.',
  welcomeEmbed: false,
  welcomeColor: '#5865F2',
  welcomeImage: false,
  welcomeImageBackground: 'default',
  
  goodbyeEnabled: false,
  goodbyeChannelId: null,
  goodbyeMessage: 'Goodbye {user}! We hope to see you again.',
  goodbyeEmbed: false,
  goodbyeColor: '#FF0000',
  
  dmEnabled: false,
  dmMessage: 'Welcome to {server}! Be sure to check out the rules and have a great time.',
  
  joinRoleIds: []
};

/**
 * Initialize the welcome manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing welcome manager...');
    
    // Load welcome settings
    await loadWelcomeSettings();
    
    logger.info('Welcome manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing welcome manager:', error);
    return false;
  }
}

/**
 * Load welcome settings from disk
 * @returns {Promise<void>}
 */
async function loadWelcomeSettings() {
  try {
    // Clear collection
    guildSettings.clear();
    
    // Check if file exists
    try {
      await fs.access(WELCOME_SETTINGS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveWelcomeSettings();
      return;
    }
    
    // Read file
    const data = await fs.readFile(WELCOME_SETTINGS_FILE, 'utf8');
    
    // Parse JSON
    const settings = JSON.parse(data);
    
    // Load settings
    for (const [guildId, guildSetting] of Object.entries(settings)) {
      guildSettings.set(guildId, {
        ...DEFAULT_SETTINGS,
        ...guildSetting
      });
    }
    
    logger.debug('Welcome settings loaded from disk');
  } catch (error) {
    logger.error('Error loading welcome settings:', error);
    throw error;
  }
}

/**
 * Save welcome settings to disk
 * @returns {Promise<void>}
 */
async function saveWelcomeSettings() {
  try {
    // Create settings object
    const settings = {};
    
    for (const [guildId, guildSetting] of guildSettings.entries()) {
      settings[guildId] = guildSetting;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(WELCOME_SETTINGS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(WELCOME_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    
    logger.debug('Welcome settings saved to disk');
  } catch (error) {
    logger.error('Error saving welcome settings:', error);
    throw error;
  }
}

/**
 * Get welcome settings for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The guild welcome settings
 */
function getGuildSettings(guildId) {
  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, { ...DEFAULT_SETTINGS });
  }
  
  return guildSettings.get(guildId);
}

/**
 * Update welcome settings for a guild
 * @param {string} guildId - The guild ID
 * @param {Object} settings - The settings to update
 * @returns {Promise<Object>} The updated settings
 */
async function updateGuildSettings(guildId, settings) {
  try {
    const currentSettings = getGuildSettings(guildId);
    
    // Update settings
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Save to collection
    guildSettings.set(guildId, updatedSettings);
    
    // Save to disk
    await saveWelcomeSettings();
    
    return updatedSettings;
  } catch (error) {
    logger.error(`Error updating welcome settings for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Handle a member join event
 * @param {GuildMember} member - The member who joined
 * @returns {Promise<void>}
 */
async function handleMemberJoin(member) {
  try {
    const { guild, user } = member;
    const settings = getGuildSettings(guild.id);
    
    // Skip if not enabled
    if (!settings.enabled) {
      return;
    }
    
    // Handle welcome message
    if (settings.welcomeEnabled && settings.welcomeChannelId) {
      await sendWelcomeMessage(member);
    }
    
    // Handle DM message
    if (settings.dmEnabled) {
      await sendDmMessage(member);
    }
    
    // Handle auto roles
    if (settings.joinRoleIds && settings.joinRoleIds.length > 0) {
      await assignJoinRoles(member);
    }
    
    logger.info(`Processed member join for ${user.tag} in ${guild.name}`);
  } catch (error) {
    logger.error(`Error handling member join for ${member.user.tag}:`, error);
  }
}

/**
 * Handle a member leave event
 * @param {GuildMember} member - The member who left
 * @returns {Promise<void>}
 */
async function handleMemberLeave(member) {
  try {
    const { guild, user } = member;
    const settings = getGuildSettings(guild.id);
    
    // Skip if not enabled
    if (!settings.enabled) {
      return;
    }
    
    // Handle goodbye message
    if (settings.goodbyeEnabled && settings.goodbyeChannelId) {
      await sendGoodbyeMessage(member);
    }
    
    logger.info(`Processed member leave for ${user.tag} in ${guild.name}`);
  } catch (error) {
    logger.error(`Error handling member leave for ${member.user.tag}:`, error);
  }
}

/**
 * Send a welcome message
 * @param {GuildMember} member - The member who joined
 * @returns {Promise<boolean>} Whether the message was sent
 */
async function sendWelcomeMessage(member) {
  try {
    const { guild, user } = member;
    const settings = getGuildSettings(guild.id);
    
    // Get welcome channel
    const channel = await guild.channels.fetch(settings.welcomeChannelId);
    
    if (!channel || !channel.isTextBased()) {
      logger.warn(`Welcome channel not found or not text-based in ${guild.name}`);
      return false;
    }
    
    // Format welcome message
    const formattedMessage = formatMessage(settings.welcomeMessage, {
      user: `<@${user.id}>`,
      username: user.username,
      tag: user.tag,
      server: guild.name,
      memberCount: guild.memberCount
    });
    
    // Send message
    if (settings.welcomeEmbed) {
      // Create embed
      const embed = new EmbedBuilder()
        .setColor(settings.welcomeColor)
        .setTitle(`Welcome to ${guild.name}!`)
        .setDescription(formattedMessage)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      
      // Send embed
      await channel.send({ embeds: [embed] });
    } else if (settings.welcomeImage) {
      // Create welcome image
      const attachment = await createWelcomeImage(member, settings);
      
      // Send image with message
      await channel.send({
        content: formattedMessage,
        files: [attachment]
      });
    } else {
      // Send plain message
      await channel.send(formattedMessage);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error sending welcome message for ${member.user.tag}:`, error);
    return false;
  }
}

/**
 * Send a goodbye message
 * @param {GuildMember} member - The member who left
 * @returns {Promise<boolean>} Whether the message was sent
 */
async function sendGoodbyeMessage(member) {
  try {
    const { guild, user } = member;
    const settings = getGuildSettings(guild.id);
    
    // Get goodbye channel
    const channel = await guild.channels.fetch(settings.goodbyeChannelId);
    
    if (!channel || !channel.isTextBased()) {
      logger.warn(`Goodbye channel not found or not text-based in ${guild.name}`);
      return false;
    }
    
    // Format goodbye message
    const formattedMessage = formatMessage(settings.goodbyeMessage, {
      user: user.username, // Can't mention user as they've left
      username: user.username,
      tag: user.tag,
      server: guild.name,
      memberCount: guild.memberCount
    });
    
    // Send message
    if (settings.goodbyeEmbed) {
      // Create embed
      const embed = new EmbedBuilder()
        .setColor(settings.goodbyeColor)
        .setTitle(`Goodbye from ${guild.name}`)
        .setDescription(formattedMessage)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      
      // Send embed
      await channel.send({ embeds: [embed] });
    } else {
      // Send plain message
      await channel.send(formattedMessage);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error sending goodbye message for ${member.user.tag}:`, error);
    return false;
  }
}

/**
 * Send a DM message to a new member
 * @param {GuildMember} member - The member who joined
 * @returns {Promise<boolean>} Whether the message was sent
 */
async function sendDmMessage(member) {
  try {
    const { guild, user } = member;
    const settings = getGuildSettings(guild.id);
    
    // Format DM message
    const formattedMessage = formatMessage(settings.dmMessage, {
      user: user.username,
      username: user.username,
      tag: user.tag,
      server: guild.name,
      memberCount: guild.memberCount
    });
    
    // Send DM
    await user.send(formattedMessage);
    
    return true;
  } catch (error) {
    logger.error(`Error sending DM to ${member.user.tag}:`, error);
    return false;
  }
}

/**
 * Assign join roles to a new member
 * @param {GuildMember} member - The member who joined
 * @returns {Promise<boolean>} Whether the roles were assigned
 */
async function assignJoinRoles(member) {
  try {
    const { guild } = member;
    const settings = getGuildSettings(guild.id);
    
    // Skip if no roles
    if (!settings.joinRoleIds || settings.joinRoleIds.length === 0) {
      return false;
    }
    
    // Filter valid roles (still exist in guild)
    const rolesToAdd = [];
    
    for (const roleId of settings.joinRoleIds) {
      const role = await guild.roles.fetch(roleId).catch(() => null);
      
      if (role && role.id !== guild.id) { // Exclude @everyone role
        rolesToAdd.push(role);
      }
    }
    
    // Skip if no valid roles
    if (rolesToAdd.length === 0) {
      return false;
    }
    
    // Add roles
    await member.roles.add(rolesToAdd);
    
    return true;
  } catch (error) {
    logger.error(`Error assigning join roles to ${member.user.tag}:`, error);
    return false;
  }
}

/**
 * Format a message with variables
 * @param {string} message - The message to format
 * @param {Object} vars - The variables to replace
 * @returns {string} The formatted message
 */
function formatMessage(message, vars) {
  // Replace all variables in the message
  let formattedMessage = message;
  
  for (const [key, value] of Object.entries(vars)) {
    formattedMessage = formattedMessage.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  
  return formattedMessage;
}

/**
 * Create a welcome image
 * @param {GuildMember} member - The member who joined
 * @param {Object} settings - The guild settings
 * @returns {Promise<AttachmentBuilder>} The welcome image attachment
 */
async function createWelcomeImage(member, settings) {
  try {
    const { user, guild } = member;
    
    // Create canvas (1024x500)
    const canvas = Canvas.createCanvas(1024, 500);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    const backgroundPath = getBackgroundPath(settings.welcomeImageBackground);
    const background = await Canvas.loadImage(backgroundPath);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    
    // Add semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw user avatar
    const avatarSize = 200;
    const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: 'png', size: 512 }));
    
    // Create circular avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 150, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Draw avatar
    ctx.drawImage(avatar, (canvas.width / 2) - (avatarSize / 2), 50, avatarSize, avatarSize);
    ctx.restore();
    
    // Draw welcome text
    ctx.font = '60px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('Welcome', canvas.width / 2, 300);
    
    // Draw username
    ctx.font = '40px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(user.tag, canvas.width / 2, 350);
    
    // Draw server name
    ctx.font = '30px sans-serif';
    ctx.fillStyle = '#DDDDDD';
    ctx.textAlign = 'center';
    ctx.fillText(`to ${guild.name}`, canvas.width / 2, 400);
    
    // Draw member count
    ctx.font = '25px sans-serif';
    ctx.fillStyle = '#AAAAAA';
    ctx.textAlign = 'center';
    ctx.fillText(`Member #${guild.memberCount}`, canvas.width / 2, 440);
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Create attachment
    return new AttachmentBuilder(buffer, { name: 'welcome.png' });
  } catch (error) {
    logger.error(`Error creating welcome image for ${member.user.tag}:`, error);
    throw error;
  }
}

/**
 * Get the path to a background image
 * @param {string} background - The background name
 * @returns {string} The path to the background image
 */
function getBackgroundPath(background) {
  // Default to a simple gradient background
  return path.join(process.cwd(), 'assets', 'backgrounds', 'default.png');
}

/**
 * Enable welcome system for a guild
 * @param {string} guildId - The guild ID
 * @param {Object} options - The welcome options
 * @returns {Promise<Object>} The updated settings
 */
async function enableWelcome(guildId, options) {
  try {
    // Get current settings
    const settings = getGuildSettings(guildId);
    
    // Update settings
    const updatedSettings = {
      ...settings,
      enabled: true,
      welcomeEnabled: true,
      ...options
    };
    
    // Save settings
    return await updateGuildSettings(guildId, updatedSettings);
  } catch (error) {
    logger.error(`Error enabling welcome for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Enable goodbye system for a guild
 * @param {string} guildId - The guild ID
 * @param {Object} options - The goodbye options
 * @returns {Promise<Object>} The updated settings
 */
async function enableGoodbye(guildId, options) {
  try {
    // Get current settings
    const settings = getGuildSettings(guildId);
    
    // Update settings
    const updatedSettings = {
      ...settings,
      enabled: true,
      goodbyeEnabled: true,
      ...options
    };
    
    // Save settings
    return await updateGuildSettings(guildId, updatedSettings);
  } catch (error) {
    logger.error(`Error enabling goodbye for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Set auto-roles for a guild
 * @param {string} guildId - The guild ID
 * @param {Array<string>} roleIds - The role IDs
 * @returns {Promise<Object>} The updated settings
 */
async function setJoinRoles(guildId, roleIds) {
  try {
    // Get current settings
    const settings = getGuildSettings(guildId);
    
    // Update settings
    const updatedSettings = {
      ...settings,
      joinRoleIds: roleIds
    };
    
    // Save settings
    return await updateGuildSettings(guildId, updatedSettings);
  } catch (error) {
    logger.error(`Error setting join roles for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Set DM message for a guild
 * @param {string} guildId - The guild ID
 * @param {boolean} enabled - Whether to enable DM messages
 * @param {string} message - The DM message
 * @returns {Promise<Object>} The updated settings
 */
async function setDmMessage(guildId, enabled, message) {
  try {
    // Get current settings
    const settings = getGuildSettings(guildId);
    
    // Update settings
    const updatedSettings = {
      ...settings,
      dmEnabled: enabled,
      dmMessage: message
    };
    
    // Save settings
    return await updateGuildSettings(guildId, updatedSettings);
  } catch (error) {
    logger.error(`Error setting DM message for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Disable welcome system for a guild
 * @param {string} guildId - The guild ID
 * @returns {Promise<Object>} The updated settings
 */
async function disableWelcome(guildId) {
  try {
    // Get current settings
    const settings = getGuildSettings(guildId);
    
    // Update settings
    const updatedSettings = {
      ...settings,
      welcomeEnabled: false
    };
    
    // Check if both welcome and goodbye are disabled
    if (!updatedSettings.goodbyeEnabled) {
      updatedSettings.enabled = false;
    }
    
    // Save settings
    return await updateGuildSettings(guildId, updatedSettings);
  } catch (error) {
    logger.error(`Error disabling welcome for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Disable goodbye system for a guild
 * @param {string} guildId - The guild ID
 * @returns {Promise<Object>} The updated settings
 */
async function disableGoodbye(guildId) {
  try {
    // Get current settings
    const settings = getGuildSettings(guildId);
    
    // Update settings
    const updatedSettings = {
      ...settings,
      goodbyeEnabled: false
    };
    
    // Check if both welcome and goodbye are disabled
    if (!updatedSettings.welcomeEnabled) {
      updatedSettings.enabled = false;
    }
    
    // Save settings
    return await updateGuildSettings(guildId, updatedSettings);
  } catch (error) {
    logger.error(`Error disabling goodbye for guild ${guildId}:`, error);
    throw error;
  }
}

module.exports = {
  initialize,
  getGuildSettings,
  updateGuildSettings,
  handleMemberJoin,
  handleMemberLeave,
  enableWelcome,
  enableGoodbye,
  setJoinRoles,
  setDmMessage,
  disableWelcome,
  disableGoodbye
};