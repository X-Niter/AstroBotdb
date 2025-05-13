/**
 * Reminder Manager
 * Manages user reminders
 */

const { Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const chrono = require('chrono-node');
const logger = require('../logger');

// Path to reminders file
const REMINDERS_FILE = path.join(process.cwd(), 'data', 'reminders.json');

// Reminders collection (reminderId -> reminder)
const reminders = new Collection();

// Reminder timers (reminderId -> timer)
const reminderTimers = new Collection();

/**
 * Initialize the reminder manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing reminder manager...');
    
    // Load reminders
    await loadReminders();
    
    // Set up timers for future reminders
    const now = Date.now();
    
    for (const [reminderId, reminder] of reminders.entries()) {
      if (!reminder.completed) {
        const timeUntilReminder = reminder.timestamp - now;
        
        if (timeUntilReminder > 0) {
          // Schedule reminder
          scheduleReminder(reminderId, timeUntilReminder);
        } else {
          // Reminder is in the past, send it now
          setTimeout(() => sendReminder(reminderId), 0);
        }
      }
    }
    
    logger.info('Reminder manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing reminder manager:', error);
    return false;
  }
}

/**
 * Load reminders from disk
 * @returns {Promise<void>}
 */
async function loadReminders() {
  try {
    // Clear collection
    reminders.clear();
    
    // Check if file exists
    try {
      await fs.access(REMINDERS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveReminders();
      return;
    }
    
    // Read file
    const data = await fs.readFile(REMINDERS_FILE, 'utf8');
    
    // Parse JSON
    const reminderData = JSON.parse(data);
    
    // Load reminders
    for (const [reminderId, reminder] of Object.entries(reminderData)) {
      reminders.set(reminderId, reminder);
    }
    
    logger.debug('Reminders loaded from disk');
  } catch (error) {
    logger.error('Error loading reminders:', error);
    throw error;
  }
}

/**
 * Save reminders to disk
 * @returns {Promise<void>}
 */
async function saveReminders() {
  try {
    // Create data object
    const reminderData = {};
    
    for (const [reminderId, reminder] of reminders.entries()) {
      reminderData[reminderId] = reminder;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(REMINDERS_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(REMINDERS_FILE, JSON.stringify(reminderData, null, 2));
    
    logger.debug('Reminders saved to disk');
  } catch (error) {
    logger.error('Error saving reminders:', error);
    throw error;
  }
}

/**
 * Create a reminder
 * @param {Object} options - Reminder options
 * @returns {Promise<Object>} The created reminder
 */
async function createReminder(options) {
  try {
    const { userId, guildId, channelId, content, timeString, client } = options;
    
    // Parse time
    const parsedTime = chrono.parseDate(timeString, new Date(), { forwardDate: true });
    
    if (!parsedTime) {
      throw new Error('Unable to parse time from the provided string');
    }
    
    const timestamp = parsedTime.getTime();
    
    // Ensure time is in the future
    if (timestamp <= Date.now()) {
      throw new Error('Reminder time must be in the future');
    }
    
    // Create reminder object
    const reminderId = Date.now().toString();
    
    const reminder = {
      id: reminderId,
      userId,
      guildId,
      channelId,
      content,
      timestamp,
      completed: false,
      createdAt: Date.now()
    };
    
    // Add to collection
    reminders.set(reminderId, reminder);
    
    // Schedule reminder
    const timeUntilReminder = timestamp - Date.now();
    scheduleReminder(reminderId, timeUntilReminder);
    
    // Save reminders
    await saveReminders();
    
    return reminder;
  } catch (error) {
    logger.error('Error creating reminder:', error);
    throw error;
  }
}

/**
 * Schedule a reminder
 * @param {string} reminderId - The reminder ID
 * @param {number} delay - The delay in milliseconds
 */
function scheduleReminder(reminderId, delay) {
  // Cap delay at maximum setTimeout value if necessary (around 24.8 days)
  const MAX_TIMEOUT = 2147483647;
  
  if (delay > MAX_TIMEOUT) {
    // Schedule an intermediate timeout
    const timer = setTimeout(() => {
      scheduleReminder(reminderId, delay - MAX_TIMEOUT);
    }, MAX_TIMEOUT);
    
    reminderTimers.set(reminderId, timer);
  } else {
    // Schedule the actual reminder
    const timer = setTimeout(() => {
      sendReminder(reminderId);
    }, delay);
    
    reminderTimers.set(reminderId, timer);
  }
}

/**
 * Send a reminder
 * @param {string} reminderId - The reminder ID
 * @returns {Promise<boolean>} Whether the reminder was sent
 */
async function sendReminder(reminderId) {
  try {
    // Get reminder
    const reminder = reminders.get(reminderId);
    
    if (!reminder || reminder.completed) {
      return false;
    }
    
    // Mark as completed
    reminder.completed = true;
    
    // Clear timer if exists
    if (reminderTimers.has(reminderId)) {
      clearTimeout(reminderTimers.get(reminderId));
      reminderTimers.delete(reminderId);
    }
    
    // Save changes
    await saveReminders();
    
    // Send DM to user
    try {
      const client = require('../../bot-client').getClient();
      const user = await client.users.fetch(reminder.userId);
      
      if (user) {
        await user.send({
          content: `⏰ **Reminder:** ${reminder.content}`
        });
        
        logger.info(`Sent reminder ${reminderId} to user ${user.tag}`);
      }
    } catch (error) {
      logger.error(`Error sending reminder DM to user ${reminder.userId}:`, error);
    }
    
    // Try to send message in original channel if in a guild
    try {
      if (reminder.guildId && reminder.channelId) {
        const client = require('../../bot-client').getClient();
        const guild = await client.guilds.fetch(reminder.guildId);
        
        if (guild) {
          const channel = await guild.channels.fetch(reminder.channelId);
          
          if (channel && channel.isTextBased()) {
            await channel.send({
              content: `<@${reminder.userId}> ⏰ **Reminder:** ${reminder.content}`
            });
            
            logger.info(`Sent reminder ${reminderId} to channel ${channel.name}`);
          }
        }
      }
    } catch (error) {
      logger.error(`Error sending reminder to channel ${reminder.channelId}:`, error);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error sending reminder ${reminderId}:`, error);
    return false;
  }
}

/**
 * Get user reminders
 * @param {string} userId - The user ID
 * @param {boolean} includeCompleted - Whether to include completed reminders
 * @returns {Array<Object>} The user's reminders
 */
function getUserReminders(userId, includeCompleted = false) {
  return Array.from(reminders.values())
    .filter(reminder => 
      reminder.userId === userId && 
      (includeCompleted || !reminder.completed)
    )
    .sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Cancel a reminder
 * @param {string} reminderId - The reminder ID
 * @param {string} userId - The user ID requesting cancellation
 * @returns {Promise<boolean>} Whether the reminder was cancelled
 */
async function cancelReminder(reminderId, userId) {
  try {
    // Get reminder
    const reminder = reminders.get(reminderId);
    
    if (!reminder || reminder.completed) {
      return false;
    }
    
    // Check if user owns the reminder
    if (reminder.userId !== userId) {
      return false;
    }
    
    // Mark as completed
    reminder.completed = true;
    
    // Clear timer if exists
    if (reminderTimers.has(reminderId)) {
      clearTimeout(reminderTimers.get(reminderId));
      reminderTimers.delete(reminderId);
    }
    
    // Save changes
    await saveReminders();
    
    return true;
  } catch (error) {
    logger.error(`Error cancelling reminder ${reminderId}:`, error);
    return false;
  }
}

/**
 * Clean up old completed reminders
 * @param {number} maxAgeMs - Maximum age in milliseconds for completed reminders
 * @returns {Promise<number>} Number of reminders cleaned up
 */
async function cleanupReminders(maxAgeMs = 7 * 24 * 60 * 60 * 1000) { // Default: 7 days
  try {
    const now = Date.now();
    let count = 0;
    
    // Get completed reminders older than maxAgeMs
    const oldReminders = Array.from(reminders.entries())
      .filter(([, reminder]) => 
        reminder.completed && 
        now - reminder.timestamp > maxAgeMs
      );
    
    // Remove old reminders
    for (const [reminderId] of oldReminders) {
      reminders.delete(reminderId);
      count++;
    }
    
    // Save changes if any reminders were removed
    if (count > 0) {
      await saveReminders();
    }
    
    logger.debug(`Cleaned up ${count} old reminders`);
    
    return count;
  } catch (error) {
    logger.error('Error cleaning up reminders:', error);
    return 0;
  }
}

/**
 * Parse a relative time string to a timestamp
 * @param {string} timeString - The time string
 * @returns {Object|null} The parsed time or null if invalid
 */
function parseTime(timeString) {
  try {
    const parsedTime = chrono.parseDate(timeString, new Date(), { forwardDate: true });
    
    if (!parsedTime) {
      return null;
    }
    
    const timestamp = parsedTime.getTime();
    
    // Calculate time from now
    const timeFromNow = timestamp - Date.now();
    
    if (timeFromNow <= 0) {
      return null;
    }
    
    return {
      timestamp,
      timeFromNow,
      formatted: formatTimeUntil(timeFromNow)
    };
  } catch (error) {
    logger.error('Error parsing time:', error);
    return null;
  }
}

/**
 * Format time until a future time
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time
 */
function formatTimeUntil(ms) {
  if (ms <= 0) {
    return 'now';
  }
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * Format a timestamp for display
 * @param {number} timestamp - The timestamp
 * @returns {string} Formatted timestamp for Discord
 */
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return `<t:${Math.floor(date.getTime() / 1000)}:F> (<t:${Math.floor(date.getTime() / 1000)}:R>)`;
}

module.exports = {
  initialize,
  createReminder,
  getUserReminders,
  cancelReminder,
  cleanupReminders,
  parseTime,
  formatTimestamp
};