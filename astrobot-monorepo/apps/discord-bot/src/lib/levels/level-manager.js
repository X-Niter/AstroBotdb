/**
 * Level Manager
 * Manages user levels, experience, and rewards
 */

const { Collection, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const Canvas = require('canvas');
const logger = require('../logger');

// Path to user levels file
const LEVELS_FILE = path.join(process.cwd(), 'data', 'levels.json');

// Guild settings file
const LEVEL_SETTINGS_FILE = path.join(process.cwd(), 'data', 'level-settings.json');

// User levels (guildId -> userId -> userData)
const userLevels = new Collection();

// Guild level settings (guildId -> settings)
const guildSettings = new Collection();

// Default level settings
const DEFAULT_SETTINGS = {
  enabled: true,
  xpGainMin: 15,
  xpGainMax: 25,
  xpCooldown: 60, // seconds
  announceLevelUp: true,
  announcementChannel: null, // null = same channel as message
  roleRewards: {}, // level -> roleId
  excludedChannels: [], // array of channel IDs
  excludedRoles: [] // array of role IDs
};

// XP cooldowns (guildId_userId -> timestamp)
const xpCooldowns = new Collection();

/**
 * Initialize the level manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing level manager...');
    
    // Load user levels
    await loadLevels();
    
    // Load guild settings
    await loadSettings();
    
    logger.info('Level manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing level manager:', error);
    return false;
  }
}

/**
 * Load user levels from disk
 * @returns {Promise<void>}
 */
async function loadLevels() {
  try {
    // Clear collection
    userLevels.clear();
    
    // Check if file exists
    try {
      await fs.access(LEVELS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveLevels();
      return;
    }
    
    // Read file
    const data = await fs.readFile(LEVELS_FILE, 'utf8');
    
    // Parse JSON
    const levelsData = JSON.parse(data);
    
    // Load levels
    for (const [guildId, guildData] of Object.entries(levelsData)) {
      const guildCollection = new Collection();
      
      for (const [userId, userData] of Object.entries(guildData)) {
        guildCollection.set(userId, userData);
      }
      
      userLevels.set(guildId, guildCollection);
    }
    
    logger.debug('User levels loaded from disk');
  } catch (error) {
    logger.error('Error loading user levels:', error);
    throw error;
  }
}

/**
 * Save user levels to disk
 * @returns {Promise<void>}
 */
async function saveLevels() {
  try {
    // Create data object
    const levelsData = {};
    
    for (const [guildId, guildCollection] of userLevels.entries()) {
      levelsData[guildId] = {};
      
      for (const [userId, userData] of guildCollection.entries()) {
        levelsData[guildId][userId] = userData;
      }
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(LEVELS_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(LEVELS_FILE, JSON.stringify(levelsData, null, 2));
    
    logger.debug('User levels saved to disk');
  } catch (error) {
    logger.error('Error saving user levels:', error);
    throw error;
  }
}

/**
 * Load guild settings from disk
 * @returns {Promise<void>}
 */
async function loadSettings() {
  try {
    // Clear collection
    guildSettings.clear();
    
    // Check if file exists
    try {
      await fs.access(LEVEL_SETTINGS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveSettings();
      return;
    }
    
    // Read file
    const data = await fs.readFile(LEVEL_SETTINGS_FILE, 'utf8');
    
    // Parse JSON
    const settings = JSON.parse(data);
    
    // Load settings
    for (const [guildId, guildSetting] of Object.entries(settings)) {
      guildSettings.set(guildId, {
        ...DEFAULT_SETTINGS,
        ...guildSetting
      });
    }
    
    logger.debug('Level settings loaded from disk');
  } catch (error) {
    logger.error('Error loading level settings:', error);
    throw error;
  }
}

/**
 * Save guild settings to disk
 * @returns {Promise<void>}
 */
async function saveSettings() {
  try {
    // Create settings object
    const settings = {};
    
    for (const [guildId, guildSetting] of guildSettings.entries()) {
      settings[guildId] = guildSetting;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(LEVEL_SETTINGS_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(LEVEL_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    
    logger.debug('Level settings saved to disk');
  } catch (error) {
    logger.error('Error saving level settings:', error);
    throw error;
  }
}

/**
 * Get guild level settings
 * @param {string} guildId - The guild ID
 * @returns {Object} The guild level settings
 */
function getGuildSettings(guildId) {
  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, { ...DEFAULT_SETTINGS });
  }
  
  return guildSettings.get(guildId);
}

/**
 * Update guild level settings
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
    await saveSettings();
    
    return updatedSettings;
  } catch (error) {
    logger.error(`Error updating level settings for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Get user data
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @returns {Object} The user data
 */
function getUserData(guildId, userId) {
  // Check if guild exists in collection
  if (!userLevels.has(guildId)) {
    userLevels.set(guildId, new Collection());
  }
  
  const guildCollection = userLevels.get(guildId);
  
  // Check if user exists in guild
  if (!guildCollection.has(userId)) {
    guildCollection.set(userId, {
      xp: 0,
      level: 0,
      lastMessageTimestamp: 0
    });
  }
  
  return guildCollection.get(userId);
}

/**
 * Calculate XP needed for a level
 * @param {number} level - The level
 * @returns {number} The XP needed for the level
 */
function calculateXpForLevel(level) {
  // Formula: 100 * level^2
  return 100 * Math.pow(level, 2);
}

/**
 * Add XP to a user
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @param {number} xpToAdd - The amount of XP to add
 * @returns {Promise<Object>} The user data and level up status
 */
async function addXp(guildId, userId, xpToAdd) {
  try {
    // Get user data
    const userData = getUserData(guildId, userId);
    
    // Add XP
    userData.xp += xpToAdd;
    
    // Calculate current level
    const currentLevel = userData.level;
    
    // Check if user leveled up
    let leveledUp = false;
    let newLevel = currentLevel;
    
    // Check for level ups
    while (userData.xp >= calculateXpForLevel(newLevel + 1)) {
      newLevel++;
      leveledUp = true;
    }
    
    // Update level if changed
    if (leveledUp) {
      userData.level = newLevel;
    }
    
    // Update last message timestamp
    userData.lastMessageTimestamp = Date.now();
    
    // Save levels
    await saveLevels();
    
    return {
      userData,
      leveledUp,
      oldLevel: currentLevel,
      newLevel
    };
  } catch (error) {
    logger.error(`Error adding XP for user ${userId} in guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Award XP for a message
 * @param {Message} message - The Discord message
 * @returns {Promise<Object|null>} The user data and level up info, or null if no XP was awarded
 */
async function awardXpForMessage(message) {
  try {
    const { guild, author, channel, member } = message;
    
    // Skip if no guild, author is a bot, or message is in a DM
    if (!guild || author.bot || !member || !channel) {
      return null;
    }
    
    // Get guild settings
    const settings = getGuildSettings(guild.id);
    
    // Skip if leveling is disabled in this guild
    if (!settings.enabled) {
      return null;
    }
    
    // Skip if channel is excluded
    if (settings.excludedChannels.includes(channel.id)) {
      return null;
    }
    
    // Skip if user has an excluded role
    if (settings.excludedRoles.some(roleId => member.roles.cache.has(roleId))) {
      return null;
    }
    
    // Check cooldown
    const cooldownKey = `${guild.id}_${author.id}`;
    const now = Date.now();
    const cooldownTime = settings.xpCooldown * 1000; // Convert to milliseconds
    
    if (xpCooldowns.has(cooldownKey)) {
      const lastTime = xpCooldowns.get(cooldownKey);
      
      if (now - lastTime < cooldownTime) {
        // Still on cooldown
        return null;
      }
    }
    
    // Set cooldown
    xpCooldowns.set(cooldownKey, now);
    
    // Generate random XP
    const xpToAdd = Math.floor(
      Math.random() * (settings.xpGainMax - settings.xpGainMin + 1) + settings.xpGainMin
    );
    
    // Add XP
    const result = await addXp(guild.id, author.id, xpToAdd);
    
    // Check for level up
    if (result.leveledUp) {
      // Handle level up
      await handleLevelUp(message, result);
    }
    
    return result;
  } catch (error) {
    logger.error('Error awarding XP for message:', error);
    return null;
  }
}

/**
 * Handle a level up event
 * @param {Message} message - The Discord message
 * @param {Object} levelInfo - The level up info
 * @returns {Promise<void>}
 */
async function handleLevelUp(message, levelInfo) {
  try {
    const { guild, author, channel } = message;
    const { userData, newLevel } = levelInfo;
    
    // Get guild settings
    const settings = getGuildSettings(guild.id);
    
    // Check if level up announcements are enabled
    if (!settings.announceLevelUp) {
      return;
    }
    
    // Determine announcement channel
    let announcementChannel = channel;
    
    if (settings.announcementChannel) {
      const targetChannel = await guild.channels.fetch(settings.announcementChannel);
      
      if (targetChannel && targetChannel.isTextBased()) {
        announcementChannel = targetChannel;
      }
    }
    
    // Create level up message
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Level Up!')
      .setDescription(`Congratulations ${author}! You have reached level **${newLevel}**.`)
      .setThumbnail(author.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: 'Total XP', value: `${userData.xp}`, inline: true },
        { name: 'Next Level', value: `${calculateXpForLevel(newLevel + 1) - userData.xp} XP needed`, inline: true }
      )
      .setTimestamp();
    
    // Send level up message
    await announcementChannel.send({ embeds: [embed] });
    
    // Check for role rewards
    await checkRoleRewards(message.member, levelInfo);
  } catch (error) {
    logger.error('Error handling level up:', error);
  }
}

/**
 * Check and award role rewards
 * @param {GuildMember} member - The guild member
 * @param {Object} levelInfo - The level up info
 * @returns {Promise<void>}
 */
async function checkRoleRewards(member, levelInfo) {
  try {
    const { guild } = member;
    const { newLevel, oldLevel } = levelInfo;
    
    // Get guild settings
    const settings = getGuildSettings(guild.id);
    
    // Get role rewards
    const { roleRewards } = settings;
    
    // Check for role rewards for the new level
    const newLevelRoles = [];
    
    for (let level = oldLevel + 1; level <= newLevel; level++) {
      if (roleRewards[level]) {
        newLevelRoles.push(roleRewards[level]);
      }
    }
    
    // Skip if no role rewards
    if (newLevelRoles.length === 0) {
      return;
    }
    
    // Filter valid roles
    const rolesToAdd = [];
    
    for (const roleId of newLevelRoles) {
      const role = await guild.roles.fetch(roleId).catch(() => null);
      
      if (role && !member.roles.cache.has(roleId)) {
        rolesToAdd.push(role);
      }
    }
    
    // Skip if no valid roles
    if (rolesToAdd.length === 0) {
      return;
    }
    
    // Add roles
    await member.roles.add(rolesToAdd);
    
    logger.info(`Awarded ${rolesToAdd.length} role(s) to ${member.user.tag} for reaching level ${newLevel}`);
  } catch (error) {
    logger.error('Error checking role rewards:', error);
  }
}

/**
 * Get a user's rank in the guild
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @returns {number} The user's rank
 */
function getUserRank(guildId, userId) {
  // Check if guild exists in collection
  if (!userLevels.has(guildId)) {
    return 0;
  }
  
  const guildCollection = userLevels.get(guildId);
  
  // Convert to array and sort by XP
  const sortedUsers = Array.from(guildCollection.entries())
    .sort((a, b) => b[1].xp - a[1].xp);
  
  // Find user's rank
  const rank = sortedUsers.findIndex(([id]) => id === userId) + 1;
  
  return rank || 0;
}

/**
 * Get top users in the guild
 * @param {string} guildId - The guild ID
 * @param {number} [limit=10] - The number of users to get
 * @returns {Array<Object>} The top users
 */
function getTopUsers(guildId, limit = 10) {
  // Check if guild exists in collection
  if (!userLevels.has(guildId)) {
    return [];
  }
  
  const guildCollection = userLevels.get(guildId);
  
  // Convert to array and sort by XP
  const sortedUsers = Array.from(guildCollection.entries())
    .sort((a, b) => b[1].xp - a[1].xp)
    .slice(0, limit)
    .map(([userId, userData], index) => ({
      userId,
      rank: index + 1,
      ...userData
    }));
  
  return sortedUsers;
}

/**
 * Create a rank card image
 * @param {GuildMember} member - The guild member
 * @returns {Promise<AttachmentBuilder>} The rank card attachment
 */
async function createRankCard(member) {
  try {
    const { guild, user } = member;
    
    // Get user data
    const userData = getUserData(guild.id, user.id);
    const rank = getUserRank(guild.id, user.id);
    
    // Calculate level progress
    const currentLevelXp = calculateXpForLevel(userData.level);
    const nextLevelXp = calculateXpForLevel(userData.level + 1);
    const levelProgress = (userData.xp - currentLevelXp) / (nextLevelXp - currentLevelXp);
    
    // Create canvas (800x250)
    const canvas = Canvas.createCanvas(800, 250);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#36393F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add rounded corners border
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(4, 20);
    ctx.lineTo(4, canvas.height - 20);
    ctx.quadraticCurveTo(4, canvas.height - 4, 20, canvas.height - 4);
    ctx.lineTo(canvas.width - 20, canvas.height - 4);
    ctx.quadraticCurveTo(canvas.width - 4, canvas.height - 4, canvas.width - 4, canvas.height - 20);
    ctx.lineTo(canvas.width - 4, 20);
    ctx.quadraticCurveTo(canvas.width - 4, 4, canvas.width - 20, 4);
    ctx.lineTo(20, 4);
    ctx.quadraticCurveTo(4, 4, 4, 20);
    ctx.stroke();
    
    // Draw user avatar
    const avatarSize = 120;
    const avatar = await Canvas.loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
    
    // Create circular avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(75 + avatarSize / 2, canvas.height / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Draw avatar
    ctx.drawImage(avatar, 75, canvas.height / 2 - avatarSize / 2, avatarSize, avatarSize);
    ctx.restore();
    
    // Draw username
    ctx.font = '30px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'left';
    ctx.fillText(user.username, 260, 80);
    
    // Draw level
    ctx.font = '25px sans-serif';
    ctx.fillStyle = '#BBBBBB';
    ctx.textAlign = 'left';
    ctx.fillText(`Level: ${userData.level}`, 260, 120);
    
    // Draw rank
    ctx.font = '25px sans-serif';
    ctx.fillStyle = '#BBBBBB';
    ctx.textAlign = 'left';
    ctx.fillText(`Rank: #${rank}`, 400, 120);
    
    // Draw XP
    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#BBBBBB';
    ctx.textAlign = 'left';
    ctx.fillText(`XP: ${userData.xp} / ${nextLevelXp}`, 260, 160);
    
    // Draw XP bar background
    ctx.fillStyle = '#555555';
    ctx.beginPath();
    ctx.arc(260, 190, 10, 0, Math.PI * 2);
    ctx.arc(700, 190, 10, 0, Math.PI * 2);
    ctx.rect(260, 180, 440, 20);
    ctx.fill();
    
    // Draw XP bar progress
    ctx.fillStyle = '#5865F2';
    ctx.beginPath();
    ctx.arc(260, 190, 10, 0, Math.PI * 2);
    if (levelProgress > 0) {
      ctx.rect(260, 180, 440 * levelProgress, 20);
      ctx.arc(260 + 440 * levelProgress, 190, 10, 0, Math.PI * 2);
    }
    ctx.fill();
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Create attachment
    return new AttachmentBuilder(buffer, { name: 'rank.png' });
  } catch (error) {
    logger.error(`Error creating rank card for ${member.user.tag}:`, error);
    throw error;
  }
}

/**
 * Create a leaderboard image
 * @param {Guild} guild - The Discord guild
 * @param {number} [limit=10] - The number of users to display
 * @returns {Promise<AttachmentBuilder>} The leaderboard attachment
 */
async function createLeaderboard(guild, limit = 10) {
  try {
    // Get top users
    const topUsers = getTopUsers(guild.id, limit);
    
    // Skip if no users
    if (topUsers.length === 0) {
      throw new Error('No users to display on leaderboard');
    }
    
    // Calculate canvas height based on number of users
    const rowHeight = 60;
    const padding = 20;
    const headerHeight = 60;
    const canvasHeight = headerHeight + (rowHeight * topUsers.length) + (padding * 2);
    
    // Create canvas (800 x variable height)
    const canvas = Canvas.createCanvas(800, canvasHeight);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#36393F';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add rounded corners border
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(4, 20);
    ctx.lineTo(4, canvas.height - 20);
    ctx.quadraticCurveTo(4, canvas.height - 4, 20, canvas.height - 4);
    ctx.lineTo(canvas.width - 20, canvas.height - 4);
    ctx.quadraticCurveTo(canvas.width - 4, canvas.height - 4, canvas.width - 4, canvas.height - 20);
    ctx.lineTo(canvas.width - 4, 20);
    ctx.quadraticCurveTo(canvas.width - 4, 4, canvas.width - 20, 4);
    ctx.lineTo(20, 4);
    ctx.quadraticCurveTo(4, 4, 4, 20);
    ctx.stroke();
    
    // Draw header
    ctx.fillStyle = '#5865F2';
    ctx.fillRect(10, 10, canvas.width - 20, headerHeight);
    
    // Draw header text
    ctx.font = 'bold 30px sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(`${guild.name} Leaderboard`, canvas.width / 2, 50);
    
    // Draw column headers
    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#BBBBBB';
    ctx.textAlign = 'left';
    ctx.fillText('Rank', 40, padding + headerHeight + 30);
    ctx.fillText('User', 150, padding + headerHeight + 30);
    ctx.fillText('Level', 550, padding + headerHeight + 30);
    ctx.fillText('XP', 680, padding + headerHeight + 30);
    
    // Draw divider
    ctx.beginPath();
    ctx.strokeStyle = '#555555';
    ctx.lineWidth = 2;
    ctx.moveTo(20, padding + headerHeight + 45);
    ctx.lineTo(canvas.width - 20, padding + headerHeight + 45);
    ctx.stroke();
    
    // Draw each user
    for (let i = 0; i < topUsers.length; i++) {
      const user = topUsers[i];
      const yPos = padding + headerHeight + 80 + (i * rowHeight);
      
      // Fetch user
      let member;
      let username = 'Unknown User';
      let avatar = null;
      
      try {
        member = await guild.members.fetch(user.userId);
        username = member.user.username;
        avatar = await Canvas.loadImage(member.user.displayAvatarURL({ extension: 'png', size: 128 }));
      } catch (error) {
        logger.warn(`Could not fetch user ${user.userId} for leaderboard: ${error.message}`);
      }
      
      // Draw rank
      ctx.font = 'bold 25px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(`#${user.rank}`, 40, yPos);
      
      // Draw avatar if available
      if (avatar) {
        // Create circular avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(100, yPos - 15, 20, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Draw avatar
        ctx.drawImage(avatar, 80, yPos - 35, 40, 40);
        ctx.restore();
      }
      
      // Draw username
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'left';
      ctx.fillText(username, 150, yPos);
      
      // Draw level
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(user.level.toString(), 550, yPos);
      
      // Draw XP
      ctx.font = '20px sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.textAlign = 'center';
      ctx.fillText(user.xp.toString(), 680, yPos);
      
      // Draw divider (except for last row)
      if (i < topUsers.length - 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#555555';
        ctx.lineWidth = 1;
        ctx.moveTo(40, yPos + 15);
        ctx.lineTo(canvas.width - 40, yPos + 15);
        ctx.stroke();
      }
    }
    
    // Convert canvas to buffer
    const buffer = canvas.toBuffer('image/png');
    
    // Create attachment
    return new AttachmentBuilder(buffer, { name: 'leaderboard.png' });
  } catch (error) {
    logger.error(`Error creating leaderboard for ${guild.name}:`, error);
    throw error;
  }
}

/**
 * Set a user's XP and level
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @param {number} xp - The new XP value
 * @param {number} level - The new level value
 * @returns {Promise<Object>} The updated user data
 */
async function setUserXp(guildId, userId, xp, level) {
  try {
    // Get user data
    const userData = getUserData(guildId, userId);
    
    // Update values
    userData.xp = xp;
    userData.level = level;
    
    // Save levels
    await saveLevels();
    
    return userData;
  } catch (error) {
    logger.error(`Error setting XP for user ${userId} in guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Add a role reward
 * @param {string} guildId - The guild ID
 * @param {number} level - The level
 * @param {string} roleId - The role ID
 * @returns {Promise<Object>} The updated settings
 */
async function addRoleReward(guildId, level, roleId) {
  try {
    // Get guild settings
    const settings = getGuildSettings(guildId);
    
    // Update role rewards
    settings.roleRewards[level] = roleId;
    
    // Save settings
    return await updateGuildSettings(guildId, settings);
  } catch (error) {
    logger.error(`Error adding role reward for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Remove a role reward
 * @param {string} guildId - The guild ID
 * @param {number} level - The level
 * @returns {Promise<Object>} The updated settings
 */
async function removeRoleReward(guildId, level) {
  try {
    // Get guild settings
    const settings = getGuildSettings(guildId);
    
    // Remove role reward
    delete settings.roleRewards[level];
    
    // Save settings
    return await updateGuildSettings(guildId, settings);
  } catch (error) {
    logger.error(`Error removing role reward for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Get role rewards
 * @param {string} guildId - The guild ID
 * @returns {Object} The role rewards
 */
function getRoleRewards(guildId) {
  const settings = getGuildSettings(guildId);
  return settings.roleRewards;
}

module.exports = {
  initialize,
  getGuildSettings,
  updateGuildSettings,
  getUserData,
  getUserRank,
  getTopUsers,
  awardXpForMessage,
  createRankCard,
  createLeaderboard,
  setUserXp,
  addRoleReward,
  removeRoleReward,
  getRoleRewards,
  calculateXpForLevel
};