const fs = require('fs').promises;
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const logger = require('../logger');

// Path to the moderation log settings storage file
const MOD_LOG_SETTINGS_FILE = path.join(process.cwd(), 'data', 'mod-log-settings.json');

// Path to the moderation log events storage file
const MOD_LOG_EVENTS_FILE = path.join(process.cwd(), 'data', 'mod-log-events.json');

// In-memory storage
const modLogSettings = new Map();
const modLogEvents = new Map(); // Map<guildId, Array<event>>

// Default settings
const DEFAULT_SETTINGS = {
  enabled: false,
  channelId: null,
  logActions: {
    ban: true,
    unban: true,
    kick: true,
    timeout: true,
    warn: true,
    purge: true,
    channelLock: true,
    roleUpdate: true
  }
};

// Moderation action types
const ACTION_TYPES = {
  BAN: 'ban',
  UNBAN: 'unban',
  KICK: 'kick',
  TIMEOUT: 'timeout',
  TIMEOUT_REMOVE: 'timeout_remove',
  WARN: 'warn',
  PURGE: 'purge',
  CHANNEL_LOCK: 'channel_lock',
  CHANNEL_UNLOCK: 'channel_unlock',
  ROLE_ADD: 'role_add',
  ROLE_REMOVE: 'role_remove'
};

// Action color mapping
const ACTION_COLORS = {
  [ACTION_TYPES.BAN]: '#FF0000', // Red
  [ACTION_TYPES.UNBAN]: '#00FF00', // Green
  [ACTION_TYPES.KICK]: '#FFA500', // Orange
  [ACTION_TYPES.TIMEOUT]: '#FFFF00', // Yellow
  [ACTION_TYPES.TIMEOUT_REMOVE]: '#00FFFF', // Cyan
  [ACTION_TYPES.WARN]: '#FF00FF', // Purple
  [ACTION_TYPES.PURGE]: '#800080', // Dark Purple
  [ACTION_TYPES.CHANNEL_LOCK]: '#FF0000', // Red
  [ACTION_TYPES.CHANNEL_UNLOCK]: '#00FF00', // Green
  [ACTION_TYPES.ROLE_ADD]: '#0000FF', // Blue
  [ACTION_TYPES.ROLE_REMOVE]: '#FFA500' // Orange
};

// Max events to keep per guild
const MAX_EVENTS_PER_GUILD = 1000;

// Auto-save interval (5 minutes in ms)
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;

/**
 * Initialize the moderation log manager
 */
async function initialize() {
  try {
    // Load settings
    await loadSettings();
    
    // Load events
    await loadEvents();
    
    logger.info('Moderation log manager initialized');
    
    // Set up auto-save interval
    setInterval(async () => {
      await saveSettings();
      await saveEvents();
    }, AUTO_SAVE_INTERVAL);
  } catch (error) {
    logger.error('Error initializing moderation log manager:', error);
  }
}

/**
 * Get settings for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The guild settings
 */
function getGuildSettings(guildId) {
  // Get or create settings
  if (!modLogSettings.has(guildId)) {
    modLogSettings.set(guildId, { ...DEFAULT_SETTINGS });
  }
  
  return modLogSettings.get(guildId);
}

/**
 * Update settings for a guild
 * @param {string} guildId - The guild ID
 * @param {Object} settings - The settings to update
 * @returns {Promise<Object>} The updated settings
 */
async function updateGuildSettings(guildId, settings) {
  // Get current settings
  const currentSettings = getGuildSettings(guildId);
  
  // Update settings
  const updatedSettings = {
    ...currentSettings,
    ...settings
  };
  
  // Handle nested logActions update
  if (settings.logActions) {
    updatedSettings.logActions = {
      ...currentSettings.logActions,
      ...settings.logActions
    };
  }
  
  // Save settings
  modLogSettings.set(guildId, updatedSettings);
  await saveSettings();
  
  return updatedSettings;
}

/**
 * Log a moderation action
 * @param {Object} options - The log options
 * @param {string} options.guildId - The guild ID
 * @param {string} options.actionType - The action type from ACTION_TYPES
 * @param {string} options.moderatorId - The ID of the moderator who performed the action
 * @param {string} options.targetId - The ID of the user who was the target of the action
 * @param {string} [options.reason] - The reason for the action
 * @param {Object} [options.additionalData] - Additional data about the action
 * @returns {Promise<boolean>} Whether the log was successful
 */
async function logAction(options) {
  try {
    const { guildId, actionType, moderatorId, targetId, reason, additionalData } = options;
    
    // Get settings
    const settings = getGuildSettings(guildId);
    
    // Check if this action type should be logged
    if (!settings.enabled) {
      return false;
    }
    
    // Map action type to settings key
    let settingsKey;
    switch (actionType) {
      case ACTION_TYPES.BAN:
        settingsKey = 'ban';
        break;
      case ACTION_TYPES.UNBAN:
        settingsKey = 'unban';
        break;
      case ACTION_TYPES.KICK:
        settingsKey = 'kick';
        break;
      case ACTION_TYPES.TIMEOUT:
      case ACTION_TYPES.TIMEOUT_REMOVE:
        settingsKey = 'timeout';
        break;
      case ACTION_TYPES.WARN:
        settingsKey = 'warn';
        break;
      case ACTION_TYPES.PURGE:
        settingsKey = 'purge';
        break;
      case ACTION_TYPES.CHANNEL_LOCK:
      case ACTION_TYPES.CHANNEL_UNLOCK:
        settingsKey = 'channelLock';
        break;
      case ACTION_TYPES.ROLE_ADD:
      case ACTION_TYPES.ROLE_REMOVE:
        settingsKey = 'roleUpdate';
        break;
      default:
        logger.warn(`Unknown action type: ${actionType}`);
        return false;
    }
    
    // Check if this action type is enabled
    if (!settings.logActions[settingsKey]) {
      return false;
    }
    
    // Create event
    const event = {
      id: generateEventId(),
      guildId,
      actionType,
      moderatorId,
      targetId,
      reason: reason || 'No reason provided',
      timestamp: new Date(),
      additionalData: additionalData || {}
    };
    
    // Add event to memory
    if (!modLogEvents.has(guildId)) {
      modLogEvents.set(guildId, []);
    }
    
    const guildEvents = modLogEvents.get(guildId);
    guildEvents.push(event);
    
    // Limit number of events
    if (guildEvents.length > MAX_EVENTS_PER_GUILD) {
      guildEvents.shift();
    }
    
    // Send to log channel if configured
    if (settings.channelId) {
      await sendToLogChannel(guildId, event);
    }
    
    // Save events
    await saveEvents();
    
    return true;
  } catch (error) {
    logger.error('Error logging moderation action:', error);
    return false;
  }
}

/**
 * Send an event to the log channel
 * @param {string} guildId - The guild ID
 * @param {Object} event - The event to log
 * @returns {Promise<void>}
 */
async function sendToLogChannel(guildId, event) {
  try {
    const settings = getGuildSettings(guildId);
    
    if (!settings.channelId) {
      return;
    }
    
    // Get Discord client from global scope
    const client = global.client;
    
    if (!client) {
      logger.error('Discord client not available');
      return;
    }
    
    // Get guild
    const guild = await client.guilds.fetch(guildId);
    
    if (!guild) {
      logger.error(`Guild ${guildId} not found`);
      return;
    }
    
    // Get channel
    const channel = await guild.channels.fetch(settings.channelId);
    
    if (!channel || !channel.isTextBased()) {
      logger.error(`Channel ${settings.channelId} not found or not text-based`);
      return;
    }
    
    // Create embed
    const embed = await createLogEmbed(guild, event);
    
    // Send to channel
    await channel.send({ embeds: [embed] });
  } catch (error) {
    logger.error('Error sending to log channel:', error);
  }
}

/**
 * Create an embed for a moderation log event
 * @param {Guild} guild - The Discord guild
 * @param {Object} event - The log event
 * @returns {Promise<EmbedBuilder>} The log embed
 */
async function createLogEmbed(guild, event) {
  // Get action title
  const actionTitle = getActionTitle(event.actionType);
  
  // Create base embed
  const embed = new EmbedBuilder()
    .setColor(ACTION_COLORS[event.actionType] || '#5865F2')
    .setTitle(`Moderation Action: ${actionTitle}`)
    .setTimestamp(new Date(event.timestamp))
    .setFooter({ text: `Case ID: ${event.id}` });
  
  // Try to fetch user data
  let moderator = null;
  let target = null;
  
  try {
    moderator = await guild.client.users.fetch(event.moderatorId);
  } catch (error) {
    logger.warn(`Could not fetch moderator ${event.moderatorId}:`, error);
  }
  
  try {
    target = await guild.client.users.fetch(event.targetId);
  } catch (error) {
    logger.warn(`Could not fetch target ${event.targetId}:`, error);
  }
  
  // Add moderator field
  embed.addFields({ 
    name: 'Moderator', 
    value: moderator ? `${moderator.tag} (${moderator.id})` : `Unknown (${event.moderatorId})`,
    inline: true
  });
  
  // Add target field for user-targeted actions
  if (event.actionType !== ACTION_TYPES.PURGE &&
      event.actionType !== ACTION_TYPES.CHANNEL_LOCK && 
      event.actionType !== ACTION_TYPES.CHANNEL_UNLOCK) {
    embed.addFields({ 
      name: 'User', 
      value: target ? `${target.tag} (${target.id})` : `Unknown (${event.targetId})`,
      inline: true
    });
    
    // Set thumbnail to target avatar if available
    if (target) {
      embed.setThumbnail(target.displayAvatarURL({ dynamic: true }));
    }
  }
  
  // Add reason field
  embed.addFields({ name: 'Reason', value: event.reason || 'No reason provided', inline: false });
  
  // Add action-specific fields
  const additionalData = event.additionalData || {};
  
  switch (event.actionType) {
    case ACTION_TYPES.TIMEOUT:
      if (additionalData.duration) {
        embed.addFields({ name: 'Duration', value: formatDuration(additionalData.duration), inline: true });
      }
      break;
      
    case ACTION_TYPES.PURGE:
      if (additionalData.count) {
        embed.addFields({ name: 'Messages Deleted', value: additionalData.count.toString(), inline: true });
      }
      if (additionalData.channelId) {
        embed.addFields({ name: 'Channel', value: `<#${additionalData.channelId}>`, inline: true });
      }
      break;
      
    case ACTION_TYPES.CHANNEL_LOCK:
    case ACTION_TYPES.CHANNEL_UNLOCK:
      if (additionalData.channelId) {
        embed.addFields({ name: 'Channel', value: `<#${additionalData.channelId}>`, inline: true });
      }
      break;
      
    case ACTION_TYPES.ROLE_ADD:
    case ACTION_TYPES.ROLE_REMOVE:
      if (additionalData.roleId) {
        embed.addFields({ name: 'Role', value: `<@&${additionalData.roleId}>`, inline: true });
      }
      break;
  }
  
  return embed;
}

/**
 * Get a readable title for an action type
 * @param {string} actionType - The action type
 * @returns {string} The readable title
 */
function getActionTitle(actionType) {
  switch (actionType) {
    case ACTION_TYPES.BAN:
      return 'Member Banned';
    case ACTION_TYPES.UNBAN:
      return 'Member Unbanned';
    case ACTION_TYPES.KICK:
      return 'Member Kicked';
    case ACTION_TYPES.TIMEOUT:
      return 'Member Timed Out';
    case ACTION_TYPES.TIMEOUT_REMOVE:
      return 'Timeout Removed';
    case ACTION_TYPES.WARN:
      return 'Member Warned';
    case ACTION_TYPES.PURGE:
      return 'Messages Purged';
    case ACTION_TYPES.CHANNEL_LOCK:
      return 'Channel Locked';
    case ACTION_TYPES.CHANNEL_UNLOCK:
      return 'Channel Unlocked';
    case ACTION_TYPES.ROLE_ADD:
      return 'Role Added';
    case ACTION_TYPES.ROLE_REMOVE:
      return 'Role Removed';
    default:
      return 'Unknown Action';
  }
}

/**
 * Format a duration in milliseconds to a readable string
 * @param {number} ms - The duration in milliseconds
 * @returns {string} The formatted duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  } else {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }
}

/**
 * Generate a unique event ID
 * @returns {string} The generated ID
 */
function generateEventId() {
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Get moderation logs for a guild
 * @param {string} guildId - The guild ID
 * @param {Object} [options] - Query options
 * @param {number} [options.limit=100] - Max number of logs to return
 * @param {string} [options.actionType] - Filter by action type
 * @param {string} [options.userId] - Filter by target user ID
 * @param {string} [options.moderatorId] - Filter by moderator ID
 * @returns {Array<Object>} Array of log events
 */
function getGuildLogs(guildId, options = {}) {
  const { limit = 100, actionType, userId, moderatorId } = options;
  
  // Get events for this guild
  const events = modLogEvents.get(guildId) || [];
  
  // Apply filters
  let filteredEvents = [...events];
  
  if (actionType) {
    filteredEvents = filteredEvents.filter(event => event.actionType === actionType);
  }
  
  if (userId) {
    filteredEvents = filteredEvents.filter(event => event.targetId === userId);
  }
  
  if (moderatorId) {
    filteredEvents = filteredEvents.filter(event => event.moderatorId === moderatorId);
  }
  
  // Sort by timestamp (newest first) and limit
  return filteredEvents
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

/**
 * Save settings to disk
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveSettings() {
  try {
    // Convert the map to an object
    const settingsObj = {};
    
    for (const [guildId, settings] of modLogSettings.entries()) {
      settingsObj[guildId] = settings;
    }
    
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(MOD_LOG_SETTINGS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(MOD_LOG_SETTINGS_FILE, JSON.stringify(settingsObj, null, 2));
    
    logger.debug(`Saved moderation log settings to disk`);
    return true;
  } catch (error) {
    logger.error('Error saving moderation log settings:', error);
    return false;
  }
}

/**
 * Load settings from disk
 * @returns {Promise<void>}
 */
async function loadSettings() {
  try {
    // Check if the file exists
    try {
      await fs.access(MOD_LOG_SETTINGS_FILE);
    } catch (error) {
      logger.warn('Moderation log settings file does not exist, creating an empty one');
      await saveSettings();
      return;
    }
    
    // Read the file
    const data = await fs.readFile(MOD_LOG_SETTINGS_FILE, 'utf8');
    
    // Parse the JSON
    const settingsObj = JSON.parse(data);
    
    // Convert the object to a map
    for (const [guildId, settings] of Object.entries(settingsObj)) {
      modLogSettings.set(guildId, {
        ...DEFAULT_SETTINGS,
        ...settings
      });
    }
    
    logger.debug(`Loaded moderation log settings from disk`);
  } catch (error) {
    logger.error('Error loading moderation log settings:', error);
  }
}

/**
 * Save events to disk
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveEvents() {
  try {
    // Convert the map to an object
    const eventsObj = {};
    
    for (const [guildId, events] of modLogEvents.entries()) {
      eventsObj[guildId] = events.map(event => ({
        ...event,
        timestamp: event.timestamp instanceof Date ? event.timestamp.toISOString() : event.timestamp
      }));
    }
    
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(MOD_LOG_EVENTS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(MOD_LOG_EVENTS_FILE, JSON.stringify(eventsObj, null, 2));
    
    logger.debug(`Saved moderation log events to disk`);
    return true;
  } catch (error) {
    logger.error('Error saving moderation log events:', error);
    return false;
  }
}

/**
 * Load events from disk
 * @returns {Promise<void>}
 */
async function loadEvents() {
  try {
    // Check if the file exists
    try {
      await fs.access(MOD_LOG_EVENTS_FILE);
    } catch (error) {
      logger.warn('Moderation log events file does not exist, creating an empty one');
      await saveEvents();
      return;
    }
    
    // Read the file
    const data = await fs.readFile(MOD_LOG_EVENTS_FILE, 'utf8');
    
    // Parse the JSON
    const eventsObj = JSON.parse(data);
    
    // Convert the object to a map
    for (const [guildId, events] of Object.entries(eventsObj)) {
      modLogEvents.set(guildId, events.map(event => ({
        ...event,
        timestamp: new Date(event.timestamp)
      })));
    }
    
    logger.debug(`Loaded moderation log events from disk`);
  } catch (error) {
    logger.error('Error loading moderation log events:', error);
  }
}

module.exports = {
  initialize,
  ACTION_TYPES,
  getGuildSettings,
  updateGuildSettings,
  logAction,
  getGuildLogs
};