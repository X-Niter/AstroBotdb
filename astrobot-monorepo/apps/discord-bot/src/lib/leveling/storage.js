const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');

// Path to the user levels storage file
const USER_LEVELS_FILE = path.join(process.cwd(), 'data', 'user-levels.json');

// Path to the level settings storage file
const LEVEL_SETTINGS_FILE = path.join(process.cwd(), 'data', 'level-settings.json');

/**
 * Save user levels to disk
 * @param {Map<string, Map<string, Object>>} guildUserLevels - Map of guild ID to map of user ID to level data
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveUserLevels(guildUserLevels) {
  try {
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(USER_LEVELS_FILE), { recursive: true });
    
    // Convert the maps to a serializable object
    const data = {};
    
    for (const [guildId, userLevels] of guildUserLevels.entries()) {
      data[guildId] = {};
      
      for (const [userId, levelData] of userLevels.entries()) {
        data[guildId][userId] = {
          ...levelData,
          lastMessageTime: levelData.lastMessageTime instanceof Date 
            ? levelData.lastMessageTime.toISOString() 
            : levelData.lastMessageTime
        };
      }
    }
    
    // Write to file
    await fs.writeFile(USER_LEVELS_FILE, JSON.stringify(data, null, 2));
    
    logger.debug(`Saved user levels to disk`);
    return true;
  } catch (error) {
    logger.error('Error saving user levels:', error);
    return false;
  }
}

/**
 * Load user levels from disk
 * @returns {Promise<Map<string, Map<string, Object>>>} Map of guild ID to map of user ID to level data
 */
async function loadUserLevels() {
  try {
    const guildUserLevels = new Map();
    
    // Check if the file exists
    try {
      await fs.access(USER_LEVELS_FILE);
    } catch (error) {
      logger.warn('User levels file does not exist, creating an empty one');
      await saveUserLevels(guildUserLevels);
      return guildUserLevels;
    }
    
    // Read the file
    const data = await fs.readFile(USER_LEVELS_FILE, 'utf8');
    
    // Parse the JSON
    const parsedData = JSON.parse(data);
    
    // Convert the object to maps
    for (const [guildId, userLevels] of Object.entries(parsedData)) {
      const userLevelsMap = new Map();
      
      for (const [userId, levelData] of Object.entries(userLevels)) {
        userLevelsMap.set(userId, {
          ...levelData,
          lastMessageTime: levelData.lastMessageTime ? new Date(levelData.lastMessageTime) : null
        });
      }
      
      guildUserLevels.set(guildId, userLevelsMap);
    }
    
    logger.debug(`Loaded user levels from disk`);
    return guildUserLevels;
  } catch (error) {
    logger.error('Error loading user levels:', error);
    return new Map();
  }
}

/**
 * Save level settings to disk
 * @param {Map<string, Object>} levelSettings - Map of guild ID to level settings
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveLevelSettings(levelSettings) {
  try {
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(LEVEL_SETTINGS_FILE), { recursive: true });
    
    // Convert the map to a serializable object
    const data = {};
    
    for (const [guildId, settings] of levelSettings.entries()) {
      data[guildId] = settings;
    }
    
    // Write to file
    await fs.writeFile(LEVEL_SETTINGS_FILE, JSON.stringify(data, null, 2));
    
    logger.debug(`Saved level settings to disk`);
    return true;
  } catch (error) {
    logger.error('Error saving level settings:', error);
    return false;
  }
}

/**
 * Load level settings from disk
 * @returns {Promise<Map<string, Object>>} Map of guild ID to level settings
 */
async function loadLevelSettings() {
  try {
    const levelSettings = new Map();
    
    // Check if the file exists
    try {
      await fs.access(LEVEL_SETTINGS_FILE);
    } catch (error) {
      logger.warn('Level settings file does not exist, creating an empty one');
      await saveLevelSettings(levelSettings);
      return levelSettings;
    }
    
    // Read the file
    const data = await fs.readFile(LEVEL_SETTINGS_FILE, 'utf8');
    
    // Parse the JSON
    const parsedData = JSON.parse(data);
    
    // Convert the object to a map
    for (const [guildId, settings] of Object.entries(parsedData)) {
      levelSettings.set(guildId, settings);
    }
    
    logger.debug(`Loaded level settings from disk`);
    return levelSettings;
  } catch (error) {
    logger.error('Error loading level settings:', error);
    return new Map();
  }
}

module.exports = {
  saveUserLevels,
  loadUserLevels,
  saveLevelSettings,
  loadLevelSettings
};