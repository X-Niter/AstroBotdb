const { calculateLevelFromXP, calculateRewardRoles } = require('./level-calculator');
const storage = require('./storage');
const logger = require('../logger');

// In-memory storage
const guildUserLevels = new Map(); // Map<guildId, Map<userId, {totalXP, lastMessageTime, messageCount}>>
const levelSettings = new Map(); // Map<guildId, {enabled, announce, xpPerMessage, cooldown, roles}>

// Default settings for a guild
const DEFAULT_SETTINGS = {
  enabled: true,
  announce: true,
  xpPerMessage: {
    min: 15,
    max: 25
  },
  cooldown: 60, // Cooldown in seconds between messages that give XP
  roles: [] // Array of {level, roleId}
};

// Auto-save interval (5 minutes in ms)
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;

/**
 * Initialize the level manager
 */
async function initialize() {
  try {
    // Load user levels
    const loadedUserLevels = await storage.loadUserLevels();
    
    for (const [guildId, userLevels] of loadedUserLevels.entries()) {
      guildUserLevels.set(guildId, userLevels);
    }
    
    // Load level settings
    const loadedSettings = await storage.loadLevelSettings();
    
    for (const [guildId, settings] of loadedSettings.entries()) {
      levelSettings.set(guildId, settings);
    }
    
    logger.info(`Level manager initialized with ${loadedUserLevels.size} guilds`);
    
    // Set up auto-save interval
    setInterval(async () => {
      await storage.saveUserLevels(guildUserLevels);
      await storage.saveLevelSettings(levelSettings);
    }, AUTO_SAVE_INTERVAL);
  } catch (error) {
    logger.error('Error initializing level manager:', error);
  }
}

/**
 * Handle a user message for XP
 * @param {Message} message - The message object
 * @returns {Promise<Object|null>} Level up info if the user leveled up, null otherwise
 */
async function handleMessage(message) {
  try {
    // Don't process bot messages or messages in DMs
    if (message.author.bot || !message.guild) return null;
    
    const guildId = message.guild.id;
    const userId = message.author.id;
    
    // Get or create settings for this guild
    const settings = getGuildSettings(guildId);
    
    // Check if leveling is enabled for this guild
    if (!settings.enabled) return null;
    
    // Get or create user data
    const userData = getUserData(guildId, userId);
    
    // Check cooldown
    if (userData.lastMessageTime) {
      const now = new Date();
      const elapsedSeconds = (now - userData.lastMessageTime) / 1000;
      
      if (elapsedSeconds < settings.cooldown) {
        return null;
      }
    }
    
    // Calculate random XP amount
    const xpGain = Math.floor(
      Math.random() * (settings.xpPerMessage.max - settings.xpPerMessage.min + 1) + 
      settings.xpPerMessage.min
    );
    
    // Calculate current level
    const oldLevelData = calculateLevelFromXP(userData.totalXP);
    
    // Add XP
    userData.totalXP += xpGain;
    userData.lastMessageTime = new Date();
    userData.messageCount += 1;
    
    // Calculate new level
    const newLevelData = calculateLevelFromXP(userData.totalXP);
    
    // Check if user leveled up
    const leveledUp = newLevelData.level > oldLevelData.level;
    
    if (leveledUp) {
      logger.debug(`User ${userId} leveled up to ${newLevelData.level} in guild ${guildId}`);
      
      // Check for role rewards
      await updateRoleRewards(message.guild, userId, newLevelData.level);
      
      // Return level up data if announcement is enabled
      if (settings.announce) {
        return {
          oldLevel: oldLevelData.level,
          newLevel: newLevelData.level,
          user: message.author
        };
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error handling message for leveling:', error);
    return null;
  }
}

/**
 * Update role rewards for a user based on their level
 * @param {Guild} guild - The Discord guild object
 * @param {string} userId - The user ID
 * @param {number} level - The user's current level
 */
async function updateRoleRewards(guild, userId, level) {
  try {
    const settings = getGuildSettings(guild.id);
    
    // Check if there are any role rewards
    if (!settings.roles || settings.roles.length === 0) {
      return;
    }
    
    // Get member
    const member = await guild.members.fetch(userId);
    
    if (!member) {
      logger.warn(`Could not find member ${userId} in guild ${guild.id}`);
      return;
    }
    
    // Calculate which roles the user should have
    const rewardRoleIds = calculateRewardRoles(level, settings.roles);
    
    // Add roles that the user should have but doesn't
    for (const roleId of rewardRoleIds) {
      if (!member.roles.cache.has(roleId)) {
        try {
          const role = await guild.roles.fetch(roleId);
          
          if (role) {
            // Check if bot can manage this role
            if (guild.members.me.roles.highest.position > role.position) {
              await member.roles.add(role);
              logger.debug(`Added role ${role.name} (${roleId}) to ${member.user.tag} (${userId})`);
            } else {
              logger.warn(`Cannot add role ${role.name} (${roleId}) to ${member.user.tag} (${userId}) because it's higher than bot's highest role`);
            }
          } else {
            logger.warn(`Role ${roleId} not found in guild ${guild.id}`);
          }
        } catch (error) {
          logger.error(`Error adding role ${roleId} to user ${userId}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error(`Error updating role rewards for user ${userId}:`, error);
  }
}

/**
 * Get a user's level data
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @returns {Object} Level data {level, currentXP, requiredXP, totalXP, rank}
 */
function getUserLevel(guildId, userId) {
  // Get user data
  const userData = getUserData(guildId, userId);
  
  // Calculate level data
  const levelData = calculateLevelFromXP(userData.totalXP);
  
  // Calculate rank (position in sorted list)
  const rank = calculateUserRank(guildId, userId);
  
  return {
    ...levelData,
    totalXP: userData.totalXP,
    messageCount: userData.messageCount,
    rank
  };
}

/**
 * Calculate a user's rank in the guild
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @returns {number} The user's rank (1-based)
 */
function calculateUserRank(guildId, userId) {
  const guildData = guildUserLevels.get(guildId);
  
  if (!guildData) return 1;
  
  // Convert to array and sort by total XP
  const usersSorted = Array.from(guildData.entries())
    .sort((a, b) => b[1].totalXP - a[1].totalXP);
  
  // Find user's position
  const index = usersSorted.findIndex(([id]) => id === userId);
  
  return index === -1 ? usersSorted.length : index + 1;
}

/**
 * Get leaderboard data for a guild
 * @param {string} guildId - The guild ID
 * @param {number} [limit=10] - Maximum number of users to include
 * @returns {Array<Object>} Array of user level data
 */
function getLeaderboard(guildId, limit = 10) {
  const guildData = guildUserLevels.get(guildId);
  
  if (!guildData || guildData.size === 0) {
    return [];
  }
  
  // Convert to array and sort by total XP
  const usersSorted = Array.from(guildData.entries())
    .sort((a, b) => b[1].totalXP - a[1].totalXP)
    .slice(0, limit);
  
  // Convert to level data objects
  return usersSorted.map(([userId, userData], index) => {
    const levelData = calculateLevelFromXP(userData.totalXP);
    
    return {
      userId,
      rank: index + 1,
      ...levelData,
      totalXP: userData.totalXP,
      messageCount: userData.messageCount
    };
  });
}

/**
 * Add XP to a user
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @param {number} amount - The amount of XP to add
 * @returns {Promise<Object>} Level data after adding XP
 */
async function addXP(guildId, userId, amount) {
  // Get user data
  const userData = getUserData(guildId, userId);
  
  // Calculate current level
  const oldLevelData = calculateLevelFromXP(userData.totalXP);
  
  // Add XP
  userData.totalXP += amount;
  
  // Calculate new level
  const newLevelData = calculateLevelFromXP(userData.totalXP);
  
  // Check if user leveled up
  const leveledUp = newLevelData.level > oldLevelData.level;
  
  // Save user levels
  await storage.saveUserLevels(guildUserLevels);
  
  return {
    ...newLevelData,
    totalXP: userData.totalXP,
    leveledUp,
    oldLevel: oldLevelData.level
  };
}

/**
 * Set a user's level
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @param {number} level - The level to set
 * @returns {Promise<Object>} Level data after setting level
 */
async function setLevel(guildId, userId, level) {
  // Get user data
  const userData = getUserData(guildId, userId);
  
  // Calculate total XP for this level with 0 progress towards next level
  const totalXP = 0;
  for (let i = 1; i <= level; i++) {
    totalXP += Math.floor(Math.pow(i, 2) * 25 + 100);
  }
  
  // Set user data
  userData.totalXP = totalXP;
  
  // Calculate level data
  const levelData = calculateLevelFromXP(userData.totalXP);
  
  // Save user levels
  await storage.saveUserLevels(guildUserLevels);
  
  return {
    ...levelData,
    totalXP: userData.totalXP
  };
}

/**
 * Get or create user data for a guild member
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @returns {Object} User data
 */
function getUserData(guildId, userId) {
  // Get or create guild data
  if (!guildUserLevels.has(guildId)) {
    guildUserLevels.set(guildId, new Map());
  }
  
  const guildData = guildUserLevels.get(guildId);
  
  // Get or create user data
  if (!guildData.has(userId)) {
    guildData.set(userId, {
      totalXP: 0,
      lastMessageTime: null,
      messageCount: 0
    });
  }
  
  return guildData.get(userId);
}

/**
 * Get level settings for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} Level settings
 */
function getGuildSettings(guildId) {
  // Get or create settings
  if (!levelSettings.has(guildId)) {
    levelSettings.set(guildId, { ...DEFAULT_SETTINGS });
  }
  
  return levelSettings.get(guildId);
}

/**
 * Update level settings for a guild
 * @param {string} guildId - The guild ID
 * @param {Object} settings - The settings to update
 * @returns {Promise<Object>} Updated settings
 */
async function updateGuildSettings(guildId, settings) {
  // Get current settings
  const currentSettings = getGuildSettings(guildId);
  
  // Update settings
  const updatedSettings = {
    ...currentSettings,
    ...settings
  };
  
  // Save settings
  levelSettings.set(guildId, updatedSettings);
  await storage.saveLevelSettings(levelSettings);
  
  return updatedSettings;
}

/**
 * Add a level role
 * @param {string} guildId - The guild ID
 * @param {number} level - The level required for the role
 * @param {string} roleId - The role ID
 * @returns {Promise<Array<Object>>} Updated roles array
 */
async function addLevelRole(guildId, level, roleId) {
  // Get settings
  const settings = getGuildSettings(guildId);
  
  // Check if role already exists
  const existingIndex = settings.roles.findIndex(role => role.roleId === roleId);
  
  if (existingIndex !== -1) {
    // Update existing role
    settings.roles[existingIndex].level = level;
  } else {
    // Add new role
    settings.roles.push({ level, roleId });
  }
  
  // Sort roles by level (ascending)
  settings.roles.sort((a, b) => a.level - b.level);
  
  // Save settings
  await storage.saveLevelSettings(levelSettings);
  
  return settings.roles;
}

/**
 * Remove a level role
 * @param {string} guildId - The guild ID
 * @param {string} roleId - The role ID
 * @returns {Promise<Array<Object>>} Updated roles array
 */
async function removeLevelRole(guildId, roleId) {
  // Get settings
  const settings = getGuildSettings(guildId);
  
  // Remove role
  settings.roles = settings.roles.filter(role => role.roleId !== roleId);
  
  // Save settings
  await storage.saveLevelSettings(levelSettings);
  
  return settings.roles;
}

module.exports = {
  initialize,
  handleMessage,
  getUserLevel,
  getLeaderboard,
  addXP,
  setLevel,
  getGuildSettings,
  updateGuildSettings,
  addLevelRole,
  removeLevelRole
};