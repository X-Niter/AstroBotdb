const { EmbedBuilder } = require('discord.js');
const logger = require('./logger');

// Default moderation settings
const DEFAULT_SETTINGS = {
  enabled: false,
  filterProfanity: false,
  filterInvites: false,
  filterLinks: false,
  filterSpam: false,
  maxMentions: 5,
  maxLines: 10,
  maxCharacters: 2000,
  warnOnViolation: true,
  deleteOnViolation: true,
  timeoutOnMaxViolations: true,
  violationsBeforeTimeout: 3,
  timeoutDuration: 300, // 5 minutes
  exemptRoles: [], // Array of role IDs
  logToChannel: true // Whether to log to moderation log channel
};

// Cache to store guild settings and violation counts
const guildSettings = new Map();
const userViolations = new Map();

/**
 * Initialize auto-moderation for a guild
 * @param {Guild} guild - The Discord guild
 * @param {object} settings - Custom settings to override defaults
 */
function initGuild(guild, settings = {}) {
  // Merge default settings with any custom settings
  guildSettings.set(guild.id, {
    ...DEFAULT_SETTINGS,
    ...settings
  });
  
  logger.info(`Auto-moderation initialized for guild ${guild.name} (${guild.id})`);
}

/**
 * Check if a user is exempt from auto-moderation
 * @param {Message} message - The message to check
 * @returns {boolean} Whether the user is exempt
 */
function isExempt(message) {
  // Get the guild settings
  const settings = guildSettings.get(message.guild.id) || DEFAULT_SETTINGS;
  
  // Exempt server admins and moderators
  if (message.member.permissions.has('Administrator') || 
      message.member.permissions.has('ModerateMembers')) {
    return true;
  }
  
  // Exempt users with exempt roles
  if (settings.exemptRoles.length > 0) {
    const userRoles = message.member.roles.cache.map(role => role.id);
    if (userRoles.some(roleId => settings.exemptRoles.includes(roleId))) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get violation count for a user
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @returns {number} The number of violations
 */
function getViolationCount(guildId, userId) {
  const key = `${guildId}:${userId}`;
  return userViolations.get(key) || 0;
}

/**
 * Add a violation for a user
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @returns {number} The new violation count
 */
function addViolation(guildId, userId) {
  const key = `${guildId}:${userId}`;
  const currentCount = userViolations.get(key) || 0;
  const newCount = currentCount + 1;
  userViolations.set(key, newCount);
  
  // Reset violations after 1 hour
  setTimeout(() => {
    const count = userViolations.get(key) || 0;
    if (count > 0) {
      userViolations.set(key, count - 1);
    }
  }, 60 * 60 * 1000);
  
  return newCount;
}

/**
 * Check a message for violations
 * @param {Message} message - The message to check
 * @returns {object|null} Violation details or null if no violation
 */
function checkMessage(message) {
  // Ignore bot messages and DMs
  if (message.author.bot || !message.guild) return null;
  
  // Get the guild settings
  const settings = guildSettings.get(message.guild.id);
  
  // If no settings or auto-moderation is disabled, skip
  if (!settings || !settings.enabled) return null;
  
  // Skip exempt users
  if (isExempt(message)) return null;
  
  // Check for violations
  const violations = [];
  
  // Check for profanity
  if (settings.filterProfanity && containsProfanity(message.content)) {
    violations.push('profanity');
  }
  
  // Check for Discord invites
  if (settings.filterInvites && containsInvites(message.content)) {
    violations.push('invites');
  }
  
  // Check for links
  if (settings.filterLinks && containsLinks(message.content)) {
    violations.push('links');
  }
  
  // Check for spam characteristics
  if (settings.filterSpam && isSpam(message.content)) {
    violations.push('spam');
  }
  
  // Check for excessive mentions
  if (settings.maxMentions > 0 && message.mentions.users.size > settings.maxMentions) {
    violations.push('excessive_mentions');
  }
  
  // Check for excessive lines
  if (settings.maxLines > 0) {
    const lineCount = message.content.split('\n').length;
    if (lineCount > settings.maxLines) {
      violations.push('excessive_lines');
    }
  }
  
  // Check for excessive characters
  if (settings.maxCharacters > 0 && message.content.length > settings.maxCharacters) {
    violations.push('excessive_characters');
  }
  
  // Return null if no violations
  if (violations.length === 0) return null;
  
  // Return violation details
  return {
    user: message.author,
    content: message.content,
    violations: violations,
    timestamp: message.createdTimestamp
  };
}

/**
 * Handle a message violation
 * @param {Message} message - The message that violated rules
 * @param {object} violationData - Violation details
 */
async function handleViolation(message, violationData) {
  const { guild, author, channel } = message;
  const settings = guildSettings.get(guild.id) || DEFAULT_SETTINGS;
  
  // Log the violation
  logger.info(`Auto-moderation violation by ${author.tag} in ${guild.name}: ${violationData.violations.join(', ')}`);
  
  // Add to user's violation count
  const violationCount = addViolation(guild.id, author.id);
  
  // Delete the message if enabled
  if (settings.deleteOnViolation) {
    try {
      await message.delete();
    } catch (error) {
      logger.error(`Failed to delete message ${message.id}:`, error);
    }
  }
  
  // Warn the user if enabled
  if (settings.warnOnViolation) {
    try {
      // Format violations for display
      const formattedViolations = violationData.violations.map(v => {
        switch (v) {
          case 'profanity': return 'use of profanity';
          case 'invites': return 'Discord invite links';
          case 'links': return 'external links';
          case 'spam': return 'spam characteristics';
          case 'excessive_mentions': return `excessive mentions (>${settings.maxMentions})`;
          case 'excessive_lines': return `excessive lines (>${settings.maxLines})`;
          case 'excessive_characters': return `excessive message length (>${settings.maxCharacters} characters)`;
          default: return v;
        }
      }).join(', ');
      
      // Send a warning message
      const warningMessage = await channel.send({
        content: `<@${author.id}>, your message was flagged for ${formattedViolations}. Please review our server rules. This is warning ${violationCount}/${settings.violationsBeforeTimeout}.`
      });
      
      // Delete the warning after 10 seconds
      setTimeout(async () => {
        try {
          await warningMessage.delete();
        } catch (error) {
          // Ignore errors from trying to delete (might already be deleted)
        }
      }, 10000);
    } catch (error) {
      logger.error(`Failed to warn user ${author.id}:`, error);
    }
  }
  
  // Timeout the user if they exceeded the maximum violations
  if (settings.timeoutOnMaxViolations && violationCount >= settings.violationsBeforeTimeout) {
    try {
      const member = await guild.members.fetch(author.id);
      
      if (member && member.moderatable) {
        await member.timeout(
          settings.timeoutDuration * 1000,
          `Auto-moderation: Exceeded maximum violations (${violationCount}/${settings.violationsBeforeTimeout})`
        );
        
        logger.info(`Auto-timeout applied to ${author.tag} in ${guild.name} for ${settings.timeoutDuration} seconds`);
        
        // Reset violation count after timeout
        userViolations.set(`${guild.id}:${author.id}`, 0);
        
        // Send timeout notification
        await channel.send({
          content: `<@${author.id}> has been timed out for ${formatDuration(settings.timeoutDuration)} due to multiple rule violations.`
        });
      }
    } catch (error) {
      logger.error(`Failed to timeout user ${author.id}:`, error);
    }
  }
  
  // Log to moderation channel if enabled
  if (settings.logToChannel) {
    try {
      // Find the moderation log channel
      const logChannel = guild.channels.cache.find(ch => 
        ch.type === 0 && // Text channel
        (/^(mod-logs|modlogs|mod-log|audit-log|logs|bot-logs)$/i).test(ch.name)
      );
      
      if (logChannel) {
        // Create embed for the violation
        const embed = new EmbedBuilder()
          .setColor('#FF9900')
          .setTitle('Auto-Moderation')
          .setDescription(`Message from ${author.tag} was flagged for moderation`)
          .addFields(
            { name: 'User', value: `<@${author.id}> (${author.tag})`, inline: true },
            { name: 'Channel', value: `<#${channel.id}>`, inline: true },
            { name: 'Violations', value: violationData.violations.join(', '), inline: false },
            { name: 'Content', value: truncateString(message.content, 1024) || '(no text content)', inline: false }
          )
          .setFooter({ text: `User ID: ${author.id} | Violation Count: ${violationCount}/${settings.violationsBeforeTimeout}` })
          .setTimestamp();
        
        await logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      logger.error(`Failed to log violation to channel:`, error);
    }
  }
}

// Moderation helper functions:

/**
 * Check if a string contains profanity
 * @param {string} content - The content to check
 * @returns {boolean} Whether the content contains profanity
 */
function containsProfanity(content) {
  // Basic list of profanity patterns to check
  // This is intentionally simplistic and would need a more comprehensive list in production
  const profanityPatterns = [
    /f+[u\*]+c+k+/i,
    /s+h+[i\*]+t+/i,
    /b+[i\*]+t+c+h+/i,
    /a+s+s+h+[o\*]+l+e+/i,
    /c+u+n+t+/i,
    /d+[i\*]+c+k+/i,
    /p+[u\*]+s+s+y+/i,
    /n+[i\*]+g+g+[e\*]+r+/i,
    /f+a+g+g+[o\*]+t+/i,
    /r+e+t+a+r+d+/i
  ];

  return profanityPatterns.some(pattern => pattern.test(content));
}

/**
 * Check if a string contains Discord invite links
 * @param {string} content - The content to check
 * @returns {boolean} Whether the content contains invite links
 */
function containsInvites(content) {
  const invitePattern = /(discord\.(gg|io|me|li)|discordapp\.com\/invite|discord\.com\/invite)\/[\w-]+/i;
  return invitePattern.test(content);
}

/**
 * Check if a string contains external links
 * @param {string} content - The content to check
 * @returns {boolean} Whether the content contains links
 */
function containsLinks(content) {
  const linkPattern = /https?:\/\/[^\s]+/i;
  return linkPattern.test(content);
}

/**
 * Check if content shows spam characteristics
 * @param {string} content - The content to check
 * @returns {boolean} Whether the content appears to be spam
 */
function isSpam(content) {
  // Check for repeated characters
  if (/(.)\1{9,}/i.test(content)) {
    return true;
  }
  
  // Check for repeated words
  if (/(\b\w+\b)(?:[\s.,;!?]*\1){5,}/i.test(content)) {
    return true;
  }
  
  // Check for excessive capitalization (if message is long enough)
  if (content.length > 15) {
    const capitalLetters = content.replace(/[^A-Z]/g, '').length;
    const totalLetters = content.replace(/[^a-zA-Z]/g, '').length;
    
    if (totalLetters > 8 && capitalLetters / totalLetters > 0.7) {
      return true;
    }
  }
  
  // Check for excessive emoji
  const emojiPattern = /[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojis = content.match(emojiPattern) || [];
  
  if (emojis.length > 10 || (content.length > 0 && emojis.length / content.length > 0.3)) {
    return true;
  }
  
  return false;
}

/**
 * Truncate a string to a maximum length
 * @param {string} str - The string to truncate
 * @param {number} maxLength - The maximum length
 * @returns {string} The truncated string
 */
function truncateString(str, maxLength) {
  if (!str) return '';
  
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Format a duration in seconds to a human-readable string
 * @param {number} seconds - The duration in seconds
 * @returns {string} The formatted duration
 */
function formatDuration(seconds) {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  } else {
    const days = Math.floor(seconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''}`;
  }
}

/**
 * Get auto-moderation settings for a guild
 * @param {string} guildId - The guild ID
 * @returns {object} The guild's auto-moderation settings
 */
function getGuildSettings(guildId) {
  return guildSettings.get(guildId) || { ...DEFAULT_SETTINGS, enabled: false };
}

module.exports = {
  initGuild,
  checkMessage,
  handleViolation,
  getGuildSettings
};