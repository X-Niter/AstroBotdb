const logger = require('../logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Schedule types
 * @enum {string}
 */
const ScheduleType = {
  ONCE: 'once',
  RECURRING: 'recurring'
};

/**
 * Recurring schedule intervals
 * @enum {string}
 */
const RecurringInterval = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  CUSTOM: 'custom' // For custom cron expressions
};

// In-memory storage for schedules
// In a production environment, this would be stored in a database
const schedules = new Map();

// Map of timeouts for one-time schedules
const timeouts = new Map();

// Map of intervals for recurring schedules
const intervals = new Map();

/**
 * Create a new schedule
 * @param {Object} options - Schedule options
 * @param {string} options.guildId - The guild ID
 * @param {string} options.channelId - The channel ID
 * @param {string} options.createdBy - The ID of the user who created the schedule
 * @param {string} options.message - The message to send
 * @param {ScheduleType} options.type - The schedule type (once or recurring)
 * @param {Date|string} options.date - The date to send the message (for type=once)
 * @param {RecurringInterval} [options.interval] - The interval for recurring schedules
 * @param {Object} [options.metadata] - Additional metadata for the schedule
 * @returns {string} The schedule ID
 */
function createSchedule(options) {
  // Validate options
  if (!options.guildId || !options.channelId || !options.message || !options.type) {
    throw new Error('Missing required options');
  }
  
  if (options.type === ScheduleType.ONCE && !options.date) {
    throw new Error('Date is required for one-time schedules');
  }
  
  if (options.type === ScheduleType.RECURRING && !options.interval) {
    throw new Error('Interval is required for recurring schedules');
  }
  
  // Generate a unique ID for the schedule
  const scheduleId = uuidv4();
  
  // Parse the date if it's a string
  let date = options.date;
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  // Create the schedule
  const schedule = {
    id: scheduleId,
    guildId: options.guildId,
    channelId: options.channelId,
    createdBy: options.createdBy,
    message: options.message,
    type: options.type,
    date: date,
    interval: options.interval,
    createdAt: new Date(),
    metadata: options.metadata || {},
    active: true
  };
  
  // Store the schedule
  schedules.set(scheduleId, schedule);
  
  // Schedule the task
  if (options.type === ScheduleType.ONCE) {
    scheduleOnce(scheduleId);
  } else {
    scheduleRecurring(scheduleId);
  }
  
  return scheduleId;
}

/**
 * Schedule a one-time task
 * @param {string} scheduleId - The schedule ID
 */
function scheduleOnce(scheduleId) {
  const schedule = schedules.get(scheduleId);
  if (!schedule) {
    logger.error(`Schedule ${scheduleId} not found`);
    return;
  }
  
  // Calculate the delay
  const now = new Date();
  const delay = schedule.date.getTime() - now.getTime();
  
  if (delay <= 0) {
    logger.warn(`Schedule ${scheduleId} has a past date, executing immediately`);
    executeSchedule(scheduleId);
    return;
  }
  
  // Schedule the task
  const timeout = setTimeout(() => {
    executeSchedule(scheduleId);
  }, delay);
  
  // Store the timeout ID
  timeouts.set(scheduleId, timeout);
  
  logger.debug(`Scheduled one-time task ${scheduleId} for ${schedule.date.toISOString()}`);
}

/**
 * Schedule a recurring task
 * @param {string} scheduleId - The schedule ID
 */
function scheduleRecurring(scheduleId) {
  const schedule = schedules.get(scheduleId);
  if (!schedule) {
    logger.error(`Schedule ${scheduleId} not found`);
    return;
  }
  
  let interval;
  
  switch (schedule.interval) {
    case RecurringInterval.DAILY:
      // Run every day at the same time
      interval = setInterval(() => {
        executeSchedule(scheduleId);
      }, 24 * 60 * 60 * 1000);
      
      // Initial execution based on time
      scheduleInitialRecurring(scheduleId, 24 * 60 * 60 * 1000);
      break;
      
    case RecurringInterval.WEEKLY:
      // Run every week on the same day and time
      interval = setInterval(() => {
        executeSchedule(scheduleId);
      }, 7 * 24 * 60 * 60 * 1000);
      
      // Initial execution based on day and time
      scheduleInitialRecurring(scheduleId, 7 * 24 * 60 * 60 * 1000);
      break;
      
    case RecurringInterval.MONTHLY:
      // For monthly schedules, we need to handle month length differences
      // So we run daily and check if it's the right day of the month
      interval = setInterval(() => {
        const now = new Date();
        const targetDay = schedule.date.getDate();
        
        if (now.getDate() === targetDay) {
          executeSchedule(scheduleId);
        }
      }, 24 * 60 * 60 * 1000);
      
      // Initial execution based on day of month
      const now = new Date();
      const targetDay = schedule.date.getDate();
      const targetHour = schedule.date.getHours();
      const targetMinute = schedule.date.getMinutes();
      
      // Create a date for the next occurrence
      let nextDate = new Date(now.getFullYear(), now.getMonth(), targetDay, targetHour, targetMinute);
      
      // If the day has passed this month, move to next month
      if (nextDate.getTime() <= now.getTime()) {
        nextDate = new Date(now.getFullYear(), now.getMonth() + 1, targetDay, targetHour, targetMinute);
      }
      
      // Schedule the initial execution
      const initialTimeout = setTimeout(() => {
        executeSchedule(scheduleId);
      }, nextDate.getTime() - now.getTime());
      
      // Store the initial timeout
      timeouts.set(`${scheduleId}_initial`, initialTimeout);
      break;
      
    case RecurringInterval.CUSTOM:
      // For custom intervals, we'd use a cron library
      // This is just a placeholder - in a real implementation,
      // we would use a library like node-cron
      logger.warn(`Custom intervals not fully implemented`);
      break;
      
    default:
      logger.error(`Unknown interval: ${schedule.interval}`);
      return;
  }
  
  // Store the interval ID
  intervals.set(scheduleId, interval);
  
  logger.debug(`Scheduled recurring task ${scheduleId} with interval ${schedule.interval}`);
}

/**
 * Schedule the initial execution of a recurring task
 * @param {string} scheduleId - The schedule ID
 * @param {number} fullInterval - The full interval in milliseconds
 */
function scheduleInitialRecurring(scheduleId, fullInterval) {
  const schedule = schedules.get(scheduleId);
  if (!schedule) {
    logger.error(`Schedule ${scheduleId} not found`);
    return;
  }
  
  const now = new Date();
  const targetHour = schedule.date.getHours();
  const targetMinute = schedule.date.getMinutes();
  
  // Create a date for today at the target time
  const targetToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    targetHour,
    targetMinute
  );
  
  // Calculate delay
  let delay = targetToday.getTime() - now.getTime();
  
  // If the time has passed today, schedule for tomorrow
  if (delay <= 0) {
    delay += fullInterval;
  }
  
  // Schedule the initial execution
  const timeout = setTimeout(() => {
    executeSchedule(scheduleId);
  }, delay);
  
  // Store the timeout ID
  timeouts.set(`${scheduleId}_initial`, timeout);
  
  logger.debug(`Scheduled initial execution of recurring task ${scheduleId} in ${delay}ms`);
}

/**
 * Execute a scheduled task
 * @param {string} scheduleId - The schedule ID
 */
async function executeSchedule(scheduleId) {
  const schedule = schedules.get(scheduleId);
  if (!schedule) {
    logger.error(`Schedule ${scheduleId} not found`);
    return;
  }
  
  if (!schedule.active) {
    logger.debug(`Schedule ${scheduleId} is inactive, skipping execution`);
    return;
  }
  
  try {
    logger.info(`Executing schedule ${scheduleId}`);
    
    // Get the Discord client from the global context
    // This assumes the client is available globally
    const client = global.client;
    
    if (!client) {
      throw new Error('Discord client not available');
    }
    
    // Get the guild and channel
    const guild = client.guilds.cache.get(schedule.guildId);
    if (!guild) {
      throw new Error(`Guild ${schedule.guildId} not found`);
    }
    
    const channel = guild.channels.cache.get(schedule.channelId);
    if (!channel) {
      throw new Error(`Channel ${schedule.channelId} not found`);
    }
    
    // Send the message
    await channel.send(schedule.message);
    
    // For one-time schedules, clean up after execution
    if (schedule.type === ScheduleType.ONCE) {
      // Mark the schedule as inactive
      schedule.active = false;
      
      // Clean up the timeout
      clearSchedule(scheduleId);
    }
    
    logger.info(`Successfully executed schedule ${scheduleId}`);
  } catch (error) {
    logger.error(`Error executing schedule ${scheduleId}:`, error);
  }
}

/**
 * Get all schedules for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object[]} Array of schedules
 */
function getSchedulesForGuild(guildId) {
  return Array.from(schedules.values())
    .filter(schedule => schedule.guildId === guildId);
}

/**
 * Get a schedule by ID
 * @param {string} scheduleId - The schedule ID
 * @returns {Object|null} The schedule or null if not found
 */
function getSchedule(scheduleId) {
  return schedules.get(scheduleId) || null;
}

/**
 * Update a schedule
 * @param {string} scheduleId - The schedule ID
 * @param {Object} updates - The updates to apply
 * @returns {boolean} Whether the update was successful
 */
function updateSchedule(scheduleId, updates) {
  const schedule = schedules.get(scheduleId);
  if (!schedule) {
    logger.error(`Schedule ${scheduleId} not found`);
    return false;
  }
  
  // Apply updates
  Object.assign(schedule, updates);
  
  // If the date or interval changed, reschedule
  if ((updates.date && schedule.type === ScheduleType.ONCE) || 
      (updates.interval && schedule.type === ScheduleType.RECURRING)) {
    // Clear existing schedules
    clearSchedule(scheduleId);
    
    // Reschedule
    if (schedule.type === ScheduleType.ONCE) {
      scheduleOnce(scheduleId);
    } else {
      scheduleRecurring(scheduleId);
    }
  }
  
  return true;
}

/**
 * Delete a schedule
 * @param {string} scheduleId - The schedule ID
 * @returns {boolean} Whether the deletion was successful
 */
function deleteSchedule(scheduleId) {
  const schedule = schedules.get(scheduleId);
  if (!schedule) {
    logger.error(`Schedule ${scheduleId} not found`);
    return false;
  }
  
  // Clear existing timeouts and intervals
  clearSchedule(scheduleId);
  
  // Remove from storage
  schedules.delete(scheduleId);
  
  return true;
}

/**
 * Activate or deactivate a schedule
 * @param {string} scheduleId - The schedule ID
 * @param {boolean} active - Whether to activate or deactivate
 * @returns {boolean} Whether the operation was successful
 */
function setScheduleActive(scheduleId, active) {
  const schedule = schedules.get(scheduleId);
  if (!schedule) {
    logger.error(`Schedule ${scheduleId} not found`);
    return false;
  }
  
  // Update active state
  schedule.active = active;
  
  if (!active) {
    // Clear existing timeouts and intervals
    clearSchedule(scheduleId);
  } else if (schedule.type === ScheduleType.ONCE) {
    // Reschedule one-time tasks
    scheduleOnce(scheduleId);
  } else {
    // Reschedule recurring tasks
    scheduleRecurring(scheduleId);
  }
  
  return true;
}

/**
 * Clear a schedule's timeouts and intervals
 * @param {string} scheduleId - The schedule ID
 */
function clearSchedule(scheduleId) {
  // Clear timeouts
  if (timeouts.has(scheduleId)) {
    clearTimeout(timeouts.get(scheduleId));
    timeouts.delete(scheduleId);
  }
  
  // Clear initial timeout for recurring schedules
  if (timeouts.has(`${scheduleId}_initial`)) {
    clearTimeout(timeouts.get(`${scheduleId}_initial`));
    timeouts.delete(`${scheduleId}_initial`);
  }
  
  // Clear intervals
  if (intervals.has(scheduleId)) {
    clearInterval(intervals.get(scheduleId));
    intervals.delete(scheduleId);
  }
}

/**
 * Initialize schedules from persistent storage
 * @param {Object[]} savedSchedules - The saved schedules
 */
function initializeSchedules(savedSchedules) {
  for (const schedule of savedSchedules) {
    schedules.set(schedule.id, schedule);
    
    if (schedule.active) {
      if (schedule.type === ScheduleType.ONCE) {
        scheduleOnce(schedule.id);
      } else {
        scheduleRecurring(schedule.id);
      }
    }
  }
}

module.exports = {
  ScheduleType,
  RecurringInterval,
  createSchedule,
  getSchedulesForGuild,
  getSchedule,
  updateSchedule,
  deleteSchedule,
  setScheduleActive,
  executeSchedule,
  initializeSchedules
};