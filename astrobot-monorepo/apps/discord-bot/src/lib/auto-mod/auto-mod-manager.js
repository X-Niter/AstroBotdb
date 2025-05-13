const fs = require('fs').promises;
const path = require('path');
const { Collection, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const modLogManager = require('../moderation-log');
const logger = require('../logger');

// Path to the auto-mod settings storage file
const AUTO_MOD_SETTINGS_FILE = path.join(process.cwd(), 'data', 'auto-mod-settings.json');

// Path to the auto-mod user violations file
const AUTO_MOD_VIOLATIONS_FILE = path.join(process.cwd(), 'data', 'auto-mod-violations.json');

// In-memory storage
const autoModSettings = new Map();
const userViolations = new Map(); // Map<guildId, Map<userId, Array<violation>>>

// Default filter settings
const DEFAULT_SETTINGS = {
  enabled: false,
  logChannelId: null,
  profanityFilter: {
    enabled: false,
    words: [],
    customWords: [],
    punishment: {
      type: 'delete',
      timeout: 0,
      warnThreshold: 3,
      warnExpiration: 86400000 // 24 hours in ms
    },
    ignoredChannels: [],
    ignoredRoles: []
  },
  inviteFilter: {
    enabled: false,
    allowedGuilds: [],
    punishment: {
      type: 'delete',
      timeout: 0,
      warnThreshold: 3,
      warnExpiration: 86400000
    },
    ignoredChannels: [],
    ignoredRoles: []
  },
  spamFilter: {
    enabled: false,
    messageThreshold: 5,
    timeThreshold: 5000, // 5 seconds in ms
    punishment: {
      type: 'timeout',
      timeout: 300000, // 5 minutes in ms
      warnThreshold: 3,
      warnExpiration: 86400000
    },
    ignoredChannels: [],
    ignoredRoles: []
  },
  mentionSpamFilter: {
    enabled: false,
    mentionThreshold: 5,
    punishment: {
      type: 'timeout',
      timeout: 600000, // 10 minutes in ms
      warnThreshold: 2,
      warnExpiration: 86400000
    },
    ignoredChannels: [],
    ignoredRoles: []
  },
  capsFilter: {
    enabled: false,
    capsPercentage: 70,
    minLength: 10,
    punishment: {
      type: 'delete',
      timeout: 0,
      warnThreshold: 3,
      warnExpiration: 86400000
    },
    ignoredChannels: [],
    ignoredRoles: []
  },
  linkFilter: {
    enabled: false,
    allowedDomains: [],
    punishment: {
      type: 'delete',
      timeout: 0,
      warnThreshold: 3,
      warnExpiration: 86400000
    },
    ignoredChannels: [],
    ignoredRoles: []
  }
};

// Punishment types
const PUNISHMENT_TYPES = {
  DELETE: 'delete',
  WARN: 'warn',
  TIMEOUT: 'timeout',
  KICK: 'kick',
  BAN: 'ban'
};

// Message cache for spam detection
const messageCache = new Collection();

// Auto-save interval (5 minutes in ms)
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;

/**
 * Initialize the auto-mod manager
 */
async function initialize() {
  try {
    // Load settings
    await loadSettings();
    
    // Load violations
    await loadViolations();
    
    logger.info('Auto-moderation manager initialized');
    
    // Set up auto-save interval
    setInterval(async () => {
      await saveSettings();
      await saveViolations();
    }, AUTO_SAVE_INTERVAL);
  } catch (error) {
    logger.error('Error initializing auto-moderation manager:', error);
  }
}

/**
 * Process a message for auto-moderation
 * @param {Message} message - The message to process
 * @returns {Promise<Object|null>} The violation if found, null otherwise
 */
async function processMessage(message) {
  try {
    // Ignore messages from bots
    if (message.author.bot) return null;
    
    // Ignore DMs
    if (!message.guild) return null;
    
    // Get guild settings
    const settings = getGuildSettings(message.guild.id);
    
    // Check if auto-mod is enabled
    if (!settings.enabled) return null;
    
    // Check if user is exempt
    if (isUserExempt(message)) return null;
    
    // Check for violations
    const violations = [];
    
    // Check profanity filter
    const profanityViolation = checkProfanity(message, settings);
    if (profanityViolation) violations.push(profanityViolation);
    
    // Check invite filter
    const inviteViolation = checkInvites(message, settings);
    if (inviteViolation) violations.push(inviteViolation);
    
    // Check spam filter
    const spamViolation = checkSpam(message, settings);
    if (spamViolation) violations.push(spamViolation);
    
    // Check mention spam filter
    const mentionSpamViolation = checkMentionSpam(message, settings);
    if (mentionSpamViolation) violations.push(mentionSpamViolation);
    
    // Check caps filter
    const capsViolation = checkCaps(message, settings);
    if (capsViolation) violations.push(capsViolation);
    
    // Check link filter
    const linkViolation = checkLinks(message, settings);
    if (linkViolation) violations.push(linkViolation);
    
    // If no violations, return null
    if (violations.length === 0) return null;
    
    // Handle violations
    for (const violation of violations) {
      await handleViolation(message, violation);
    }
    
    // Return the first violation
    return violations[0];
  } catch (error) {
    logger.error('Error processing message for auto-moderation:', error);
    return null;
  }
}

/**
 * Check if a user is exempt from auto-moderation
 * @param {Message} message - The message to check
 * @returns {boolean} Whether the user is exempt
 */
function isUserExempt(message) {
  // Check if user is admin or moderator
  if (message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return true;
  }
  
  // Check ignored roles for each filter
  const settings = getGuildSettings(message.guild.id);
  
  // Check all filter types
  for (const filterType of ['profanityFilter', 'inviteFilter', 'spamFilter', 'mentionSpamFilter', 'capsFilter', 'linkFilter']) {
    const filter = settings[filterType];
    
    // Skip if filter is not enabled
    if (!filter || !filter.enabled) continue;
    
    // Check ignored roles
    if (filter.ignoredRoles && filter.ignoredRoles.length > 0) {
      // Check if user has any ignored role
      const hasIgnoredRole = message.member.roles.cache.some(role => 
        filter.ignoredRoles.includes(role.id)
      );
      
      if (hasIgnoredRole) return true;
    }
    
    // Check ignored channels
    if (filter.ignoredChannels && filter.ignoredChannels.includes(message.channel.id)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check message for profanity
 * @param {Message} message - The message to check
 * @param {Object} settings - The guild auto-mod settings
 * @returns {Object|null} The violation if found, null otherwise
 */
function checkProfanity(message, settings) {
  const filter = settings.profanityFilter;
  
  // Skip if filter is not enabled
  if (!filter || !filter.enabled) return null;
  
  // Check ignored channels
  if (filter.ignoredChannels && filter.ignoredChannels.includes(message.channel.id)) {
    return null;
  }
  
  // Check ignored roles
  if (filter.ignoredRoles && filter.ignoredRoles.length > 0) {
    // Check if user has any ignored role
    const hasIgnoredRole = message.member.roles.cache.some(role => 
      filter.ignoredRoles.includes(role.id)
    );
    
    if (hasIgnoredRole) return null;
  }
  
  // Combine default and custom words
  const wordList = [...(filter.words || []), ...(filter.customWords || [])];
  
  // Skip if no words to filter
  if (wordList.length === 0) return null;
  
  // Convert to lowercase for case-insensitive matching
  const content = message.content.toLowerCase();
  
  // Check for banned words
  for (const word of wordList) {
    // Create a regex that matches whole words
    const regex = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
    
    if (regex.test(content)) {
      return {
        type: 'profanity',
        word,
        punishment: filter.punishment
      };
    }
  }
  
  return null;
}

/**
 * Check message for Discord invites
 * @param {Message} message - The message to check
 * @param {Object} settings - The guild auto-mod settings
 * @returns {Object|null} The violation if found, null otherwise
 */
function checkInvites(message, settings) {
  const filter = settings.inviteFilter;
  
  // Skip if filter is not enabled
  if (!filter || !filter.enabled) return null;
  
  // Check ignored channels
  if (filter.ignoredChannels && filter.ignoredChannels.includes(message.channel.id)) {
    return null;
  }
  
  // Check ignored roles
  if (filter.ignoredRoles && filter.ignoredRoles.length > 0) {
    // Check if user has any ignored role
    const hasIgnoredRole = message.member.roles.cache.some(role => 
      filter.ignoredRoles.includes(role.id)
    );
    
    if (hasIgnoredRole) return null;
  }
  
  // Check for Discord invite links
  const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/[a-zA-Z0-9\-]{2,}/i;
  const inviteMatches = message.content.match(inviteRegex);
  
  if (inviteMatches) {
    return {
      type: 'invite',
      invite: inviteMatches[0],
      punishment: filter.punishment
    };
  }
  
  return null;
}

/**
 * Check message for spam
 * @param {Message} message - The message to check
 * @param {Object} settings - The guild auto-mod settings
 * @returns {Object|null} The violation if found, null otherwise
 */
function checkSpam(message, settings) {
  const filter = settings.spamFilter;
  
  // Skip if filter is not enabled
  if (!filter || !filter.enabled) return null;
  
  // Check ignored channels
  if (filter.ignoredChannels && filter.ignoredChannels.includes(message.channel.id)) {
    return null;
  }
  
  // Check ignored roles
  if (filter.ignoredRoles && filter.ignoredRoles.length > 0) {
    // Check if user has any ignored role
    const hasIgnoredRole = message.member.roles.cache.some(role => 
      filter.ignoredRoles.includes(role.id)
    );
    
    if (hasIgnoredRole) return null;
  }
  
  const userId = message.author.id;
  const guildId = message.guild.id;
  const key = `${guildId}-${userId}`;
  
  // Get user's recent messages
  if (!messageCache.has(key)) {
    messageCache.set(key, []);
  }
  
  const userMessages = messageCache.get(key);
  const now = Date.now();
  
  // Add current message
  userMessages.push({
    createdAt: now,
    content: message.content
  });
  
  // Remove old messages
  const timeThreshold = filter.timeThreshold || 5000; // Default: 5 seconds
  const filteredMessages = userMessages.filter(m => now - m.createdAt < timeThreshold);
  messageCache.set(key, filteredMessages);
  
  // Check for spam
  const messageThreshold = filter.messageThreshold || 5; // Default: 5 messages
  
  if (filteredMessages.length >= messageThreshold) {
    // Check if all messages have the same content
    const content = filteredMessages[0].content;
    const allSame = filteredMessages.every(m => m.content === content);
    
    if (allSame) {
      return {
        type: 'spam',
        count: filteredMessages.length,
        punishment: filter.punishment
      };
    }
  }
  
  return null;
}

/**
 * Check message for mention spam
 * @param {Message} message - The message to check
 * @param {Object} settings - The guild auto-mod settings
 * @returns {Object|null} The violation if found, null otherwise
 */
function checkMentionSpam(message, settings) {
  const filter = settings.mentionSpamFilter;
  
  // Skip if filter is not enabled
  if (!filter || !filter.enabled) return null;
  
  // Check ignored channels
  if (filter.ignoredChannels && filter.ignoredChannels.includes(message.channel.id)) {
    return null;
  }
  
  // Check ignored roles
  if (filter.ignoredRoles && filter.ignoredRoles.length > 0) {
    // Check if user has any ignored role
    const hasIgnoredRole = message.member.roles.cache.some(role => 
      filter.ignoredRoles.includes(role.id)
    );
    
    if (hasIgnoredRole) return null;
  }
  
  // Count mentions
  const mentionCount = message.mentions.users.size + message.mentions.roles.size;
  const mentionThreshold = filter.mentionThreshold || 5; // Default: 5 mentions
  
  if (mentionCount >= mentionThreshold) {
    return {
      type: 'mentionSpam',
      count: mentionCount,
      punishment: filter.punishment
    };
  }
  
  return null;
}

/**
 * Check message for excessive caps
 * @param {Message} message - The message to check
 * @param {Object} settings - The guild auto-mod settings
 * @returns {Object|null} The violation if found, null otherwise
 */
function checkCaps(message, settings) {
  const filter = settings.capsFilter;
  
  // Skip if filter is not enabled
  if (!filter || !filter.enabled) return null;
  
  // Check ignored channels
  if (filter.ignoredChannels && filter.ignoredChannels.includes(message.channel.id)) {
    return null;
  }
  
  // Check ignored roles
  if (filter.ignoredRoles && filter.ignoredRoles.length > 0) {
    // Check if user has any ignored role
    const hasIgnoredRole = message.member.roles.cache.some(role => 
      filter.ignoredRoles.includes(role.id)
    );
    
    if (hasIgnoredRole) return null;
  }
  
  const content = message.content;
  const minLength = filter.minLength || 10; // Default: 10 characters
  
  // Skip if message is too short
  if (content.length < minLength) return null;
  
  // Count uppercase letters (excludes non-alphabetic characters)
  const capitalLetters = content.replace(/[^A-Z]/g, '').length;
  const totalLetters = content.replace(/[^a-zA-Z]/g, '').length;
  
  // Skip if no letters
  if (totalLetters === 0) return null;
  
  // Calculate percentage
  const capsPercentage = (capitalLetters / totalLetters) * 100;
  const threshold = filter.capsPercentage || 70; // Default: 70%
  
  if (capsPercentage >= threshold) {
    return {
      type: 'caps',
      percentage: capsPercentage,
      punishment: filter.punishment
    };
  }
  
  return null;
}

/**
 * Check message for links
 * @param {Message} message - The message to check
 * @param {Object} settings - The guild auto-mod settings
 * @returns {Object|null} The violation if found, null otherwise
 */
function checkLinks(message, settings) {
  const filter = settings.linkFilter;
  
  // Skip if filter is not enabled
  if (!filter || !filter.enabled) return null;
  
  // Check ignored channels
  if (filter.ignoredChannels && filter.ignoredChannels.includes(message.channel.id)) {
    return null;
  }
  
  // Check ignored roles
  if (filter.ignoredRoles && filter.ignoredRoles.length > 0) {
    // Check if user has any ignored role
    const hasIgnoredRole = message.member.roles.cache.some(role => 
      filter.ignoredRoles.includes(role.id)
    );
    
    if (hasIgnoredRole) return null;
  }
  
  // Check for URLs
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = message.content.match(urlRegex);
  
  if (!matches) return null;
  
  // Check if URLs are allowed
  const allowedDomains = filter.allowedDomains || [];
  
  for (const match of matches) {
    try {
      const url = new URL(match);
      const domain = url.hostname;
      
      // Check if domain is allowed
      const isAllowed = allowedDomains.some(allowedDomain => 
        domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
      );
      
      if (!isAllowed) {
        return {
          type: 'link',
          url: match,
          domain,
          punishment: filter.punishment
        };
      }
    } catch (error) {
      // Invalid URL, ignore
      continue;
    }
  }
  
  return null;
}

/**
 * Handle a violation
 * @param {Message} message - The message with the violation
 * @param {Object} violation - The violation details
 * @returns {Promise<void>}
 */
async function handleViolation(message, violation) {
  try {
    // Add violation to user's record
    addViolation(message.guild.id, message.author.id, violation);
    
    // Get guild settings
    const settings = getGuildSettings(message.guild.id);
    
    // Get punishment
    const punishment = violation.punishment || { type: 'delete' };
    
    // Check if warning threshold reached
    const warnings = countViolations(message.guild.id, message.author.id, violation.type);
    const warnThreshold = punishment.warnThreshold || 3;
    const thresholdReached = warnings >= warnThreshold;
    
    // Log violation
    await logViolation(message, violation, warnings, thresholdReached);
    
    // Handle punishment based on type
    if (thresholdReached) {
      // Apply actual punishment
      await applyPunishment(message, violation);
    } else {
      // Just delete the message if specified
      if (punishment.type !== 'none' && punishment.type !== 'warn') {
        try {
          await message.delete();
        } catch (error) {
          logger.warn(`Could not delete message for auto-mod violation: ${error.message}`);
        }
      }
      
      // Send warning message to user
      await sendWarningMessage(message, violation, warnings, warnThreshold);
    }
  } catch (error) {
    logger.error('Error handling auto-mod violation:', error);
  }
}

/**
 * Apply punishment for a violation
 * @param {Message} message - The message with the violation
 * @param {Object} violation - The violation details
 * @returns {Promise<void>}
 */
async function applyPunishment(message, violation) {
  const punishment = violation.punishment;
  const punishmentType = punishment.type || PUNISHMENT_TYPES.DELETE;
  
  try {
    // Delete the message
    try {
      await message.delete();
    } catch (error) {
      logger.warn(`Could not delete message for auto-mod violation: ${error.message}`);
    }
    
    switch (punishmentType) {
      case PUNISHMENT_TYPES.WARN:
        // Warning is handled separately
        break;
        
      case PUNISHMENT_TYPES.TIMEOUT:
        // Apply timeout
        const timeoutDuration = punishment.timeout || 300000; // Default: 5 minutes
        await message.member.timeout(timeoutDuration, `Auto-mod violation: ${violation.type}`);
        
        // Log to moderation log
        modLogManager.logAction({
          guildId: message.guild.id,
          actionType: modLogManager.ACTION_TYPES.TIMEOUT,
          moderatorId: message.client.user.id,
          targetId: message.author.id,
          reason: `Auto-mod violation: ${violation.type}`,
          additionalData: {
            duration: timeoutDuration
          }
        });
        break;
        
      case PUNISHMENT_TYPES.KICK:
        // Kick member
        await message.member.kick(`Auto-mod violation: ${violation.type}`);
        
        // Log to moderation log
        modLogManager.logAction({
          guildId: message.guild.id,
          actionType: modLogManager.ACTION_TYPES.KICK,
          moderatorId: message.client.user.id,
          targetId: message.author.id,
          reason: `Auto-mod violation: ${violation.type}`
        });
        break;
        
      case PUNISHMENT_TYPES.BAN:
        // Ban member
        await message.guild.members.ban(message.author, {
          reason: `Auto-mod violation: ${violation.type}`
        });
        
        // Log to moderation log
        modLogManager.logAction({
          guildId: message.guild.id,
          actionType: modLogManager.ACTION_TYPES.BAN,
          moderatorId: message.client.user.id,
          targetId: message.author.id,
          reason: `Auto-mod violation: ${violation.type}`
        });
        break;
    }
    
    // Send notification to the user
    try {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Auto-Moderation Action')
        .setDescription(`You have received a ${getPunishmentName(punishmentType)} in ${message.guild.name}.`)
        .addFields(
          { name: 'Reason', value: `Repeated auto-mod violations (${violation.type})`, inline: false }
        )
        .setTimestamp();
      
      await message.author.send({ embeds: [embed] });
    } catch (error) {
      logger.warn(`Could not send DM to ${message.author.tag}: ${error.message}`);
    }
    
    // Reset violations counter
    resetViolations(message.guild.id, message.author.id, violation.type);
  } catch (error) {
    logger.error(`Error applying punishment for auto-mod violation: ${error.message}`);
  }
}

/**
 * Send a warning message to a user for a violation
 * @param {Message} message - The message with the violation
 * @param {Object} violation - The violation details
 * @param {number} warnings - The number of warnings
 * @param {number} threshold - The warning threshold
 * @returns {Promise<void>}
 */
async function sendWarningMessage(message, violation, warnings, threshold) {
  try {
    const warningsLeft = threshold - warnings;
    
    // Create warning embed
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('Auto-Moderation Warning')
      .setDescription(`Your message was flagged for ${getViolationName(violation.type)}.`)
      .addFields(
        { name: 'Warning Count', value: `${warnings}/${threshold}`, inline: true },
        { name: 'Warnings Left', value: `${warningsLeft}`, inline: true }
      )
      .setFooter({ text: `If you reach the threshold, you will receive a ${getPunishmentName(violation.punishment.type)}.` })
      .setTimestamp();
    
    // Add violation-specific details
    switch (violation.type) {
      case 'profanity':
        embed.addFields({ name: 'Detected Word', value: violation.word, inline: false });
        break;
      case 'invite':
        embed.addFields({ name: 'Invite Link', value: violation.invite, inline: false });
        break;
      case 'spam':
        embed.addFields({ name: 'Detected', value: `${violation.count} messages in rapid succession`, inline: false });
        break;
      case 'mentionSpam':
        embed.addFields({ name: 'Detected', value: `${violation.count} mentions in a single message`, inline: false });
        break;
      case 'caps':
        embed.addFields({ name: 'Detected', value: `${Math.round(violation.percentage)}% capital letters`, inline: false });
        break;
      case 'link':
        embed.addFields({ name: 'Detected URL', value: violation.url, inline: false });
        break;
    }
    
    // Send warning to user
    try {
      await message.author.send({ embeds: [embed] });
    } catch (error) {
      logger.warn(`Could not send DM to ${message.author.tag}: ${error.message}`);
      
      // Try to send warning in the channel
      try {
        const reply = await message.channel.send({
          content: `<@${message.author.id}>, your message was flagged for ${getViolationName(violation.type)}. This is warning ${warnings}/${threshold}.`,
          allowedMentions: { users: [message.author.id] }
        });
        
        // Delete the warning after 5 seconds
        setTimeout(() => {
          reply.delete().catch(() => {});
        }, 5000);
      } catch (channelError) {
        logger.warn(`Could not send warning in channel: ${channelError.message}`);
      }
    }
  } catch (error) {
    logger.error(`Error sending warning message for auto-mod violation: ${error.message}`);
  }
}

/**
 * Log a violation to the specified log channel
 * @param {Message} message - The message with the violation
 * @param {Object} violation - The violation details
 * @param {number} warnings - The number of warnings
 * @param {boolean} thresholdReached - Whether the warning threshold was reached
 * @returns {Promise<void>}
 */
async function logViolation(message, violation, warnings, thresholdReached) {
  try {
    // Get guild settings
    const settings = getGuildSettings(message.guild.id);
    
    // Skip if no log channel specified
    if (!settings.logChannelId) return;
    
    // Get log channel
    const logChannel = await message.guild.channels.fetch(settings.logChannelId).catch(() => null);
    
    if (!logChannel) return;
    
    // Create log embed
    const embed = new EmbedBuilder()
      .setColor(thresholdReached ? '#FF0000' : '#FFA500')
      .setTitle(`Auto-Mod: ${getViolationName(violation.type)}`)
      .setDescription(`A message by ${message.author} was flagged.`)
      .addFields(
        { name: 'User', value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
        { name: 'Warnings', value: `${warnings}/${violation.punishment.warnThreshold || 3}`, inline: true },
        { name: 'Action Taken', value: thresholdReached ? getPunishmentName(violation.punishment.type) : 'Warning', inline: true },
        { name: 'Message Content', value: message.content.substring(0, 1024) || '[No text content]', inline: false }
      )
      .setTimestamp();
    
    // Add violation-specific details
    switch (violation.type) {
      case 'profanity':
        embed.addFields({ name: 'Detected Word', value: violation.word, inline: false });
        break;
      case 'invite':
        embed.addFields({ name: 'Invite Link', value: violation.invite, inline: false });
        break;
      case 'spam':
        embed.addFields({ name: 'Detected', value: `${violation.count} messages in rapid succession`, inline: false });
        break;
      case 'mentionSpam':
        embed.addFields({ name: 'Detected', value: `${violation.count} mentions in a single message`, inline: false });
        break;
      case 'caps':
        embed.addFields({ name: 'Detected', value: `${Math.round(violation.percentage)}% capital letters`, inline: false });
        break;
      case 'link':
        embed.addFields({ name: 'Detected URL', value: violation.url, inline: false });
        break;
    }
    
    // Send log to channel
    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    logger.error(`Error logging auto-mod violation: ${error.message}`);
  }
}

/**
 * Add a violation to a user's record
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @param {Object} violation - The violation details
 */
function addViolation(guildId, userId, violation) {
  // Get guild violations
  if (!userViolations.has(guildId)) {
    userViolations.set(guildId, new Map());
  }
  
  const guildViolations = userViolations.get(guildId);
  
  // Get user violations
  if (!guildViolations.has(userId)) {
    guildViolations.set(userId, []);
  }
  
  const userViolationList = guildViolations.get(userId);
  
  // Add violation
  userViolationList.push({
    type: violation.type,
    timestamp: Date.now(),
    details: violation
  });
  
  // Save violations
  saveViolations();
}

/**
 * Count violations of a specific type for a user
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @param {string} violationType - The violation type
 * @returns {number} The number of violations
 */
function countViolations(guildId, userId, violationType) {
  // Get guild violations
  if (!userViolations.has(guildId)) {
    return 0;
  }
  
  const guildViolations = userViolations.get(guildId);
  
  // Get user violations
  if (!guildViolations.has(userId)) {
    return 0;
  }
  
  const userViolationList = guildViolations.get(userId);
  
  // Get settings
  const settings = getGuildSettings(guildId);
  let expirationTime = 86400000; // Default: 24 hours
  
  // Get filter settings based on violation type
  const filterKey = `${violationType}Filter`;
  
  if (settings[filterKey] && settings[filterKey].punishment) {
    expirationTime = settings[filterKey].punishment.warnExpiration || expirationTime;
  }
  
  // Count non-expired violations of the specified type
  const now = Date.now();
  
  return userViolationList.filter(v => 
    v.type === violationType && 
    (now - v.timestamp) < expirationTime
  ).length;
}

/**
 * Reset violations of a specific type for a user
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @param {string} violationType - The violation type
 */
function resetViolations(guildId, userId, violationType) {
  // Get guild violations
  if (!userViolations.has(guildId)) {
    return;
  }
  
  const guildViolations = userViolations.get(guildId);
  
  // Get user violations
  if (!guildViolations.has(userId)) {
    return;
  }
  
  const userViolationList = guildViolations.get(userId);
  
  // Remove violations of the specified type
  const filteredViolations = userViolationList.filter(v => v.type !== violationType);
  
  // Update user violations
  guildViolations.set(userId, filteredViolations);
  
  // Save violations
  saveViolations();
}

/**
 * Get a user's violations
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @returns {Array<Object>} The user's violations
 */
function getUserViolations(guildId, userId) {
  // Get guild violations
  if (!userViolations.has(guildId)) {
    return [];
  }
  
  const guildViolations = userViolations.get(guildId);
  
  // Get user violations
  if (!guildViolations.has(userId)) {
    return [];
  }
  
  return guildViolations.get(userId);
}

/**
 * Get guild auto-mod settings
 * @param {string} guildId - The guild ID
 * @returns {Object} The guild settings
 */
function getGuildSettings(guildId) {
  // Get or create settings
  if (!autoModSettings.has(guildId)) {
    autoModSettings.set(guildId, { ...DEFAULT_SETTINGS });
  }
  
  return autoModSettings.get(guildId);
}

/**
 * Update guild auto-mod settings
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
  
  // Handle nested filter updates
  for (const key of Object.keys(settings)) {
    if (key.endsWith('Filter') && typeof settings[key] === 'object') {
      updatedSettings[key] = {
        ...currentSettings[key],
        ...settings[key]
      };
      
      // Handle nested punishment updates
      if (settings[key].punishment) {
        updatedSettings[key].punishment = {
          ...currentSettings[key].punishment,
          ...settings[key].punishment
        };
      }
    }
  }
  
  // Save settings
  autoModSettings.set(guildId, updatedSettings);
  await saveSettings();
  
  return updatedSettings;
}

/**
 * Save settings to disk
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveSettings() {
  try {
    // Convert the map to an object
    const settingsObj = {};
    
    for (const [guildId, settings] of autoModSettings.entries()) {
      settingsObj[guildId] = settings;
    }
    
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(AUTO_MOD_SETTINGS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(AUTO_MOD_SETTINGS_FILE, JSON.stringify(settingsObj, null, 2));
    
    logger.debug(`Saved auto-mod settings to disk`);
    return true;
  } catch (error) {
    logger.error('Error saving auto-mod settings:', error);
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
      await fs.access(AUTO_MOD_SETTINGS_FILE);
    } catch (error) {
      logger.warn('Auto-mod settings file does not exist, creating an empty one');
      await saveSettings();
      return;
    }
    
    // Read the file
    const data = await fs.readFile(AUTO_MOD_SETTINGS_FILE, 'utf8');
    
    // Parse the JSON
    const settingsObj = JSON.parse(data);
    
    // Convert the object to a map
    for (const [guildId, settings] of Object.entries(settingsObj)) {
      autoModSettings.set(guildId, {
        ...DEFAULT_SETTINGS,
        ...settings
      });
    }
    
    logger.debug(`Loaded auto-mod settings from disk`);
  } catch (error) {
    logger.error('Error loading auto-mod settings:', error);
  }
}

/**
 * Save violations to disk
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveViolations() {
  try {
    // Convert the map to an object
    const violationsObj = {};
    
    for (const [guildId, guildViolations] of userViolations.entries()) {
      violationsObj[guildId] = {};
      
      for (const [userId, userViolationList] of guildViolations.entries()) {
        violationsObj[guildId][userId] = userViolationList;
      }
    }
    
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(AUTO_MOD_VIOLATIONS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(AUTO_MOD_VIOLATIONS_FILE, JSON.stringify(violationsObj, null, 2));
    
    logger.debug(`Saved auto-mod violations to disk`);
    return true;
  } catch (error) {
    logger.error('Error saving auto-mod violations:', error);
    return false;
  }
}

/**
 * Load violations from disk
 * @returns {Promise<void>}
 */
async function loadViolations() {
  try {
    // Check if the file exists
    try {
      await fs.access(AUTO_MOD_VIOLATIONS_FILE);
    } catch (error) {
      logger.warn('Auto-mod violations file does not exist, creating an empty one');
      await saveViolations();
      return;
    }
    
    // Read the file
    const data = await fs.readFile(AUTO_MOD_VIOLATIONS_FILE, 'utf8');
    
    // Parse the JSON
    const violationsObj = JSON.parse(data);
    
    // Convert the object to a map
    for (const [guildId, guildViolationsObj] of Object.entries(violationsObj)) {
      const guildViolations = new Map();
      
      for (const [userId, userViolationList] of Object.entries(guildViolationsObj)) {
        guildViolations.set(userId, userViolationList);
      }
      
      userViolations.set(guildId, guildViolations);
    }
    
    logger.debug(`Loaded auto-mod violations from disk`);
  } catch (error) {
    logger.error('Error loading auto-mod violations:', error);
  }
}

/**
 * Get a readable name for a violation type
 * @param {string} violationType - The violation type
 * @returns {string} The readable name
 */
function getViolationName(violationType) {
  switch (violationType) {
    case 'profanity':
      return 'Profanity';
    case 'invite':
      return 'Discord Invite';
    case 'spam':
      return 'Message Spam';
    case 'mentionSpam':
      return 'Mention Spam';
    case 'caps':
      return 'Excessive Caps';
    case 'link':
      return 'Unauthorized Link';
    default:
      return violationType.charAt(0).toUpperCase() + violationType.slice(1);
  }
}

/**
 * Get a readable name for a punishment type
 * @param {string} punishmentType - The punishment type
 * @returns {string} The readable name
 */
function getPunishmentName(punishmentType) {
  switch (punishmentType) {
    case PUNISHMENT_TYPES.DELETE:
      return 'Message Deletion';
    case PUNISHMENT_TYPES.WARN:
      return 'Warning';
    case PUNISHMENT_TYPES.TIMEOUT:
      return 'Timeout';
    case PUNISHMENT_TYPES.KICK:
      return 'Kick';
    case PUNISHMENT_TYPES.BAN:
      return 'Ban';
    default:
      return punishmentType.charAt(0).toUpperCase() + punishmentType.slice(1);
  }
}

module.exports = {
  initialize,
  processMessage,
  getGuildSettings,
  updateGuildSettings,
  getUserViolations,
  PUNISHMENT_TYPES
};