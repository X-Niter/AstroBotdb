/**
 * Guild Configuration Manager
 * Manages per-guild configuration settings
 */

const { Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');

// Path to guild config file
const CONFIG_FILE = path.join(process.cwd(), 'data', 'guild-config.json');

// Guild configurations (guildId -> config)
const guildConfigs = new Collection();

// Default configuration
const DEFAULT_CONFIG = {
  prefix: '!',                   // Default command prefix
  adminRoles: [],                // Roles that have admin access to bot commands
  modRoles: [],                  // Roles that have moderator access to bot commands
  logChannel: null,              // Channel for sending log messages
  disabledCommands: [],          // List of disabled command names
  autoResponses: {},             // Trigger word -> response mapping
  timezone: 'UTC',               // Default timezone for schedules
  joinMessage: null,             // Default join message (null = disabled)
  leaveMessage: null,            // Default leave message (null = disabled)
  aiEnabled: true,               // Whether AI chat is enabled
  aiChannels: [],                // Channels where AI chat is enabled (empty = all)
  aiModel: 'gpt-4',              // Default AI model to use
  musicDJRole: null,             // Role ID for DJ permissions
  ticketCategories: [],          // Categories for tickets
  reactionRolesEnabled: true,    // Whether reaction roles are enabled
  automodEnabled: true,          // Whether automod is enabled
  levelSystem: {                 // Level system settings
    enabled: true,
    xpPerMessage: { min: 15, max: 25 },
    xpCooldown: 60,              // Seconds
    announceLevelUp: true,
    announcementChannel: null    // null = same channel as message
  }
};

/**
 * Initialize the guild config manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing guild config manager...');
    
    // Load guild configs
    await loadGuildConfigs();
    
    logger.info('Guild config manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing guild config manager:', error);
    return false;
  }
}

/**
 * Load guild configs from disk
 * @returns {Promise<void>}
 */
async function loadGuildConfigs() {
  try {
    // Clear collection
    guildConfigs.clear();
    
    // Check if file exists
    try {
      await fs.access(CONFIG_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveGuildConfigs();
      return;
    }
    
    // Read file
    const data = await fs.readFile(CONFIG_FILE, 'utf8');
    
    // Parse JSON
    const configs = JSON.parse(data);
    
    // Load configs
    for (const [guildId, config] of Object.entries(configs)) {
      guildConfigs.set(guildId, {
        ...DEFAULT_CONFIG,
        ...config
      });
    }
    
    logger.debug('Guild configs loaded from disk');
  } catch (error) {
    logger.error('Error loading guild configs:', error);
    throw error;
  }
}

/**
 * Save guild configs to disk
 * @returns {Promise<void>}
 */
async function saveGuildConfigs() {
  try {
    // Create data object
    const configs = {};
    
    for (const [guildId, config] of guildConfigs.entries()) {
      configs[guildId] = config;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(CONFIG_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(CONFIG_FILE, JSON.stringify(configs, null, 2));
    
    logger.debug('Guild configs saved to disk');
  } catch (error) {
    logger.error('Error saving guild configs:', error);
    throw error;
  }
}

/**
 * Get config for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The guild config
 */
function getGuildConfig(guildId) {
  if (!guildConfigs.has(guildId)) {
    guildConfigs.set(guildId, { ...DEFAULT_CONFIG });
  }
  
  return guildConfigs.get(guildId);
}

/**
 * Update config for a guild
 * @param {string} guildId - The guild ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} The updated config
 */
async function updateGuildConfig(guildId, updates) {
  try {
    // Get current config
    const currentConfig = getGuildConfig(guildId);
    
    // Apply updates
    const updatedConfig = {
      ...currentConfig,
      ...updates
    };
    
    // Update in-memory collection
    guildConfigs.set(guildId, updatedConfig);
    
    // Save to disk
    await saveGuildConfigs();
    
    return updatedConfig;
  } catch (error) {
    logger.error(`Error updating config for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Get command prefix for a guild
 * @param {string} guildId - The guild ID
 * @returns {string} The command prefix
 */
function getCommandPrefix(guildId) {
  const config = getGuildConfig(guildId);
  return config.prefix;
}

/**
 * Set command prefix for a guild
 * @param {string} guildId - The guild ID
 * @param {string} prefix - The new prefix
 * @returns {Promise<Object>} The updated config
 */
async function setCommandPrefix(guildId, prefix) {
  if (!prefix || typeof prefix !== 'string' || prefix.length > 5) {
    throw new Error('Invalid prefix format. Prefix must be a string of 1-5 characters.');
  }
  
  return await updateGuildConfig(guildId, { prefix });
}

/**
 * Check if user has admin role
 * @param {GuildMember} member - The guild member
 * @returns {boolean} Whether the user has admin role
 */
function hasAdminRole(member) {
  // Always grant access to server administrators
  if (member.permissions.has('Administrator')) {
    return true;
  }
  
  const config = getGuildConfig(member.guild.id);
  
  // Check admin roles
  return config.adminRoles.some(roleId => member.roles.cache.has(roleId));
}

/**
 * Check if user has mod role
 * @param {GuildMember} member - The guild member
 * @returns {boolean} Whether the user has mod role
 */
function hasModRole(member) {
  // Always grant mod access to administrators and server moderators
  if (member.permissions.has('Administrator') || member.permissions.has('ModerateMembers')) {
    return true;
  }
  
  const config = getGuildConfig(member.guild.id);
  
  // Check admin and mod roles
  return config.adminRoles.some(roleId => member.roles.cache.has(roleId)) ||
         config.modRoles.some(roleId => member.roles.cache.has(roleId));
}

/**
 * Get auto responses for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The auto responses
 */
function getAutoResponses(guildId) {
  const config = getGuildConfig(guildId);
  return config.autoResponses || {};
}

/**
 * Add auto response for a guild
 * @param {string} guildId - The guild ID
 * @param {string} trigger - The trigger word/phrase
 * @param {string} response - The response
 * @returns {Promise<Object>} The updated auto responses
 */
async function addAutoResponse(guildId, trigger, response) {
  const config = getGuildConfig(guildId);
  
  const autoResponses = {
    ...config.autoResponses,
    [trigger]: response
  };
  
  await updateGuildConfig(guildId, { autoResponses });
  
  return autoResponses;
}

/**
 * Remove auto response for a guild
 * @param {string} guildId - The guild ID
 * @param {string} trigger - The trigger word/phrase
 * @returns {Promise<Object>} The updated auto responses
 */
async function removeAutoResponse(guildId, trigger) {
  const config = getGuildConfig(guildId);
  
  const autoResponses = { ...config.autoResponses };
  delete autoResponses[trigger];
  
  await updateGuildConfig(guildId, { autoResponses });
  
  return autoResponses;
}

/**
 * Process auto responses for a message
 * @param {Message} message - The Discord message
 * @returns {Promise<boolean>} Whether an auto response was triggered
 */
async function processAutoResponses(message) {
  try {
    // Skip if message is from a bot or in a DM
    if (message.author.bot || !message.guild) {
      return false;
    }
    
    const autoResponses = getAutoResponses(message.guild.id);
    
    // Skip if no auto responses
    if (Object.keys(autoResponses).length === 0) {
      return false;
    }
    
    const content = message.content.toLowerCase();
    
    // Check for triggers
    for (const [trigger, response] of Object.entries(autoResponses)) {
      // Allow wildcards in triggers (* means any characters)
      const triggerRegex = new RegExp(
        `^${trigger.toLowerCase().replace(/\*/g, '.*')}$`
      );
      
      // Exact matches or regex with * wildcard
      if (content === trigger.toLowerCase() || triggerRegex.test(content)) {
        await message.reply(response);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    logger.error('Error processing auto responses:', error);
    return false;
  }
}

module.exports = {
  initialize,
  getGuildConfig,
  updateGuildConfig,
  getCommandPrefix,
  setCommandPrefix,
  hasAdminRole,
  hasModRole,
  getAutoResponses,
  addAutoResponse,
  removeAutoResponse,
  processAutoResponses,
  DEFAULT_CONFIG
};