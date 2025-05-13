const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');

// Path to the schedules storage file
const SCHEDULES_FILE = path.join(process.cwd(), 'data', 'schedules.json');

/**
 * Save schedules to disk
 * @param {Map<string, Object>} schedules - The schedules map
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveSchedules(schedules) {
  try {
    // Convert the map to an array
    const schedulesArray = Array.from(schedules.values());
    
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(SCHEDULES_FILE), { recursive: true });
    
    // Convert Date objects to ISO strings for serialization
    const serializedSchedules = schedulesArray.map(schedule => ({
      ...schedule,
      date: schedule.date instanceof Date ? schedule.date.toISOString() : schedule.date,
      createdAt: schedule.createdAt instanceof Date ? schedule.createdAt.toISOString() : schedule.createdAt
    }));
    
    // Write to file
    await fs.writeFile(SCHEDULES_FILE, JSON.stringify(serializedSchedules, null, 2));
    
    logger.debug(`Saved ${serializedSchedules.length} schedules to disk`);
    return true;
  } catch (error) {
    logger.error('Error saving schedules:', error);
    return false;
  }
}

/**
 * Load schedules from disk
 * @returns {Promise<Array<Object>>} The loaded schedules
 */
async function loadSchedules() {
  try {
    // Check if the file exists
    try {
      await fs.access(SCHEDULES_FILE);
    } catch (error) {
      logger.warn('Schedules file does not exist, creating an empty one');
      await saveSchedules(new Map());
      return [];
    }
    
    // Read the file
    const data = await fs.readFile(SCHEDULES_FILE, 'utf8');
    
    // Parse the JSON
    const schedules = JSON.parse(data);
    
    // Convert ISO strings back to Date objects
    const deserializedSchedules = schedules.map(schedule => ({
      ...schedule,
      date: new Date(schedule.date),
      createdAt: new Date(schedule.createdAt)
    }));
    
    logger.debug(`Loaded ${deserializedSchedules.length} schedules from disk`);
    return deserializedSchedules;
  } catch (error) {
    logger.error('Error loading schedules:', error);
    return [];
  }
}

module.exports = {
  saveSchedules,
  loadSchedules
};