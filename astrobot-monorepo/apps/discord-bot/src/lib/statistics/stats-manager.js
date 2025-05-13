/**
 * Statistics Manager
 * Tracks and manages usage statistics for the bot
 */

const { Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');

// Path to statistics file
const STATS_FILE = path.join(process.cwd(), 'data', 'statistics.json');

// Default statistics structure
const DEFAULT_STATS = {
  global: {
    commands: {
      executed: 0,
      success: 0,
      failed: 0
    },
    messages: {
      processed: 0,
      triggers: 0
    },
    features: {
      commands: {},
      events: {}
    },
    mostUsedCommands: {},
    uptime: {
      start: null,
      restarts: 0
    }
  },
  guilds: {}
};

// In-memory storage for statistics
let statistics = { ...DEFAULT_STATS };

/**
 * Initialize statistics manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing statistics manager...');
    
    // Load existing statistics
    await loadStatistics();
    
    // Update uptime
    if (!statistics.global.uptime.start) {
      statistics.global.uptime.start = new Date().toISOString();
    } else {
      statistics.global.uptime.restarts += 1;
    }
    
    // Save updated statistics
    await saveStatistics();
    
    logger.info('Statistics manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing statistics manager:', error);
    return false;
  }
}

/**
 * Load statistics from disk
 * @returns {Promise<void>}
 */
async function loadStatistics() {
  try {
    // Check if file exists
    try {
      await fs.access(STATS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveStatistics();
      return;
    }
    
    // Read file
    const data = await fs.readFile(STATS_FILE, 'utf8');
    
    // Parse JSON
    const loadedStats = JSON.parse(data);
    
    // Merge with default structure to ensure all properties exist
    statistics = {
      global: {
        ...DEFAULT_STATS.global,
        ...loadedStats.global
      },
      guilds: {
        ...loadedStats.guilds
      }
    };
    
    logger.debug('Statistics loaded from disk');
  } catch (error) {
    logger.error('Error loading statistics:', error);
    throw error;
  }
}

/**
 * Save statistics to disk
 * @returns {Promise<void>}
 */
async function saveStatistics() {
  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(STATS_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(STATS_FILE, JSON.stringify(statistics, null, 2));
    
    logger.debug('Statistics saved to disk');
  } catch (error) {
    logger.error('Error saving statistics:', error);
    throw error;
  }
}

/**
 * Get global bot statistics
 * @returns {Object} Global statistics
 */
function getGlobalStats() {
  return { ...statistics.global };
}

/**
 * Get guild-specific statistics
 * @param {string} guildId - The guild ID
 * @returns {Object} Guild statistics
 */
function getGuildStats(guildId) {
  if (!statistics.guilds[guildId]) {
    statistics.guilds[guildId] = {
      commands: {
        executed: 0,
        success: 0,
        failed: 0
      },
      messages: {
        processed: 0,
        triggers: 0
      },
      features: {
        commands: {},
        events: {}
      },
      mostUsedCommands: {},
      joinedAt: new Date().toISOString()
    };
  }
  
  return { ...statistics.guilds[guildId] };
}

/**
 * Track a command execution
 * @param {Object} options - Command information
 * @param {string} options.guildId - The guild ID
 * @param {string} options.commandName - The command name
 * @param {boolean} options.success - Whether the command was successful
 * @returns {Promise<void>}
 */
async function trackCommand({ guildId, commandName, success = true }) {
  try {
    // Update global stats
    statistics.global.commands.executed += 1;
    statistics.global.commands[success ? 'success' : 'failed'] += 1;
    
    // Track command usage globally
    if (!statistics.global.mostUsedCommands[commandName]) {
      statistics.global.mostUsedCommands[commandName] = 0;
    }
    statistics.global.mostUsedCommands[commandName] += 1;
    
    // Track feature usage
    if (!statistics.global.features.commands[commandName]) {
      statistics.global.features.commands[commandName] = 0;
    }
    statistics.global.features.commands[commandName] += 1;
    
    // Update guild stats if available
    if (guildId) {
      const guildStats = getGuildStats(guildId);
      
      statistics.guilds[guildId].commands.executed += 1;
      statistics.guilds[guildId].commands[success ? 'success' : 'failed'] += 1;
      
      // Track command usage in guild
      if (!statistics.guilds[guildId].mostUsedCommands[commandName]) {
        statistics.guilds[guildId].mostUsedCommands[commandName] = 0;
      }
      statistics.guilds[guildId].mostUsedCommands[commandName] += 1;
      
      // Track feature usage
      if (!statistics.guilds[guildId].features.commands[commandName]) {
        statistics.guilds[guildId].features.commands[commandName] = 0;
      }
      statistics.guilds[guildId].features.commands[commandName] += 1;
    }
    
    // Save periodically (only on successful commands to reduce disk writes)
    if (success && Math.random() < 0.1) { // 10% chance to save
      await saveStatistics();
    }
  } catch (error) {
    logger.error('Error tracking command execution:', error);
  }
}

/**
 * Track a message being processed
 * @param {Object} options - Message information
 * @param {string} options.guildId - The guild ID
 * @param {boolean} options.triggered - Whether the message triggered something
 * @returns {Promise<void>}
 */
async function trackMessage({ guildId, triggered = false }) {
  try {
    // Update global stats
    statistics.global.messages.processed += 1;
    if (triggered) {
      statistics.global.messages.triggers += 1;
    }
    
    // Update guild stats if available
    if (guildId) {
      const guildStats = getGuildStats(guildId);
      
      statistics.guilds[guildId].messages.processed += 1;
      if (triggered) {
        statistics.guilds[guildId].messages.triggers += 1;
      }
    }
    
    // Save periodically to reduce disk writes
    if (Math.random() < 0.01) { // 1% chance to save
      await saveStatistics();
    }
  } catch (error) {
    logger.error('Error tracking message:', error);
  }
}

/**
 * Track a feature being used
 * @param {Object} options - Feature information
 * @param {string} options.guildId - The guild ID
 * @param {string} options.feature - The feature name
 * @param {string} options.type - The feature type (event, etc.)
 * @returns {Promise<void>}
 */
async function trackFeature({ guildId, feature, type = 'events' }) {
  try {
    // Update global stats
    if (!statistics.global.features[type][feature]) {
      statistics.global.features[type][feature] = 0;
    }
    statistics.global.features[type][feature] += 1;
    
    // Update guild stats if available
    if (guildId) {
      const guildStats = getGuildStats(guildId);
      
      if (!statistics.guilds[guildId].features[type][feature]) {
        statistics.guilds[guildId].features[type][feature] = 0;
      }
      statistics.guilds[guildId].features[type][feature] += 1;
    }
    
    // Save periodically to reduce disk writes
    if (Math.random() < 0.05) { // 5% chance to save
      await saveStatistics();
    }
  } catch (error) {
    logger.error('Error tracking feature usage:', error);
  }
}

/**
 * Reset all statistics
 * @returns {Promise<void>}
 */
async function resetStatistics() {
  try {
    // Reset to default structure but keep uptime start
    const uptimeStart = statistics.global.uptime.start;
    const restarts = statistics.global.uptime.restarts;
    
    statistics = { ...DEFAULT_STATS };
    statistics.global.uptime.start = uptimeStart;
    statistics.global.uptime.restarts = restarts;
    
    // Save to disk
    await saveStatistics();
    
    logger.info('Statistics reset successfully');
  } catch (error) {
    logger.error('Error resetting statistics:', error);
    throw error;
  }
}

/**
 * Get top commands for a guild or globally
 * @param {Object} options - Options
 * @param {string} [options.guildId] - The guild ID (optional, for global stats)
 * @param {number} [options.limit=10] - Number of top commands to return
 * @returns {Array} Array of [command, count] pairs
 */
function getTopCommands({ guildId, limit = 10 }) {
  const commands = guildId 
    ? statistics.guilds[guildId]?.mostUsedCommands || {}
    : statistics.global.mostUsedCommands;
  
  return Object.entries(commands)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

/**
 * Get feature usage statistics
 * @param {Object} options - Options
 * @param {string} [options.guildId] - The guild ID (optional, for global stats)
 * @param {string} [options.type='commands'] - Feature type
 * @returns {Object} Feature usage stats
 */
function getFeatureUsage({ guildId, type = 'commands' }) {
  return guildId 
    ? { ...(statistics.guilds[guildId]?.features[type] || {}) }
    : { ...(statistics.global.features[type] || {}) };
}

/**
 * Get uptime statistics
 * @returns {Object} Uptime statistics
 */
function getUptime() {
  const start = statistics.global.uptime.start 
    ? new Date(statistics.global.uptime.start)
    : new Date();
    
  const uptime = Date.now() - start.getTime();
  const uptimeSeconds = Math.floor(uptime / 1000);
  const uptimeMinutes = Math.floor(uptimeSeconds / 60);
  const uptimeHours = Math.floor(uptimeMinutes / 60);
  const uptimeDays = Math.floor(uptimeHours / 24);
  
  return {
    start: statistics.global.uptime.start,
    seconds: uptimeSeconds,
    minutes: uptimeMinutes,
    hours: uptimeHours,
    days: uptimeDays,
    restarts: statistics.global.uptime.restarts
  };
}

module.exports = {
  initialize,
  getGlobalStats,
  getGuildStats,
  trackCommand,
  trackMessage,
  trackFeature,
  resetStatistics,
  getTopCommands,
  getFeatureUsage,
  getUptime,
  saveStatistics
};