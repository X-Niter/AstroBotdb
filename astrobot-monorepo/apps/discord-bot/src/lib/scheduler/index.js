const scheduleManager = require('./schedule');
const storage = require('./storage');
const logger = require('../logger');

// Auto-save interval (5 minutes in ms)
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;

/**
 * Initialize the scheduler
 * @param {Client} client - The Discord client
 */
async function initialize(client) {
  try {
    // Set the client in the global scope for use in the scheduler
    global.client = client;
    
    // Load schedules from storage
    const savedSchedules = await storage.loadSchedules();
    
    // Initialize schedules
    scheduleManager.initializeSchedules(savedSchedules);
    
    logger.info(`Scheduler initialized with ${savedSchedules.length} schedules`);
    
    // Set up auto-save interval
    setInterval(async () => {
      await storage.saveSchedules(getSchedulesMap());
    }, AUTO_SAVE_INTERVAL);
  } catch (error) {
    logger.error('Error initializing scheduler:', error);
  }
}

/**
 * Get the internal schedules map
 * This is used for saving schedules to disk
 * @returns {Map<string, Object>} The schedules map
 */
function getSchedulesMap() {
  return new Map(
    Object.entries(scheduleManager)
      .filter(([key]) => 
        !['ScheduleType', 'RecurringInterval', 'createSchedule', 'getSchedulesForGuild', 
         'getSchedule', 'updateSchedule', 'deleteSchedule', 'setScheduleActive',
         'executeSchedule', 'initializeSchedules'].includes(key)
      )
      .map(([key, value]) => [key, value])
  );
}

module.exports = {
  initialize,
  ScheduleType: scheduleManager.ScheduleType,
  RecurringInterval: scheduleManager.RecurringInterval,
  createSchedule: scheduleManager.createSchedule,
  getSchedulesForGuild: scheduleManager.getSchedulesForGuild,
  getSchedule: scheduleManager.getSchedule,
  updateSchedule: scheduleManager.updateSchedule,
  deleteSchedule: scheduleManager.deleteSchedule,
  setScheduleActive: scheduleManager.setScheduleActive
};