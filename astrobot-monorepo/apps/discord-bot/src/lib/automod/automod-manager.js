/**
 * AutoMod Manager
 * Handles automatic moderation of messages and users
 */

const { Collection, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');

// Path to automod rules file
const AUTOMOD_RULES_FILE = path.join(process.cwd(), 'data', 'automod-rules.json');

// Guild automod rules (guildId -> rules)
const guildRules = new Collection();

// User warnings (userId -> { guildId -> warnings })
const userWarnings = new Collection();

// Rule types
const RULE_TYPES = {
  KEYWORD: 'KEYWORD',     // Match specific keywords
  SPAM: 'SPAM',           // Detect message spam
  MENTION_SPAM: 'MENTION_SPAM', // Detect @mention spam
  CAPS: 'CAPS',           // Excessive caps
  INVITE: 'INVITE',       // Discord invite links
  LINK: 'LINK',           // External links
  ATTACHMENT: 'ATTACHMENT', // Message attachments
  REGEX: 'REGEX',         // Regular expression matching
  AI_TOXICITY: 'AI_TOXICITY' // AI-based toxicity detection
};

// Rule actions
const RULE_ACTIONS = {
  DELETE: 'DELETE',       // Delete the message
  WARN: 'WARN',           // Warn the user
  TIMEOUT: 'TIMEOUT',     // Timeout the user
  KICK: 'KICK',           // Kick the user
  BAN: 'BAN',             // Ban the user
  LOG: 'LOG'              // Just log the violation
};

// Default automod config
const DEFAULT_CONFIG = {
  enabled: false,
  logChannelId: null,
  rules: []
};

/**
 * Initialize the automod manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing automod manager...');
    
    // Load automod rules
    await loadAutomodRules();
    
    logger.info('Automod manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing automod manager:', error);
    return false;
  }
}

/**
 * Load automod rules from disk
 * @returns {Promise<void>}
 */
async function loadAutomodRules() {
  try {
    // Clear collections
    guildRules.clear();
    userWarnings.clear();
    
    // Check if file exists
    try {
      await fs.access(AUTOMOD_RULES_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveAutomodRules();
      return;
    }
    
    // Read file
    const data = await fs.readFile(AUTOMOD_RULES_FILE, 'utf8');
    
    // Parse JSON
    const rulesData = JSON.parse(data);
    
    // Load guild rules
    if (rulesData.guilds) {
      for (const [guildId, guildConfig] of Object.entries(rulesData.guilds)) {
        guildRules.set(guildId, guildConfig);
      }
    }
    
    // Load user warnings
    if (rulesData.warnings) {
      for (const [userId, guildWarnings] of Object.entries(rulesData.warnings)) {
        userWarnings.set(userId, guildWarnings);
      }
    }
    
    logger.debug('Automod rules loaded from disk');
  } catch (error) {
    logger.error('Error loading automod rules:', error);
    throw error;
  }
}

/**
 * Save automod rules to disk
 * @returns {Promise<void>}
 */
async function saveAutomodRules() {
  try {
    // Create data object
    const rulesData = {
      guilds: {},
      warnings: {}
    };
    
    // Add guild rules
    for (const [guildId, guildConfig] of guildRules.entries()) {
      rulesData.guilds[guildId] = guildConfig;
    }
    
    // Add user warnings
    for (const [userId, guildWarnings] of userWarnings.entries()) {
      rulesData.warnings[userId] = guildWarnings;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(AUTOMOD_RULES_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(AUTOMOD_RULES_FILE, JSON.stringify(rulesData, null, 2));
    
    logger.debug('Automod rules saved to disk');
  } catch (error) {
    logger.error('Error saving automod rules:', error);
    throw error;
  }
}

/**
 * Get automod config for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The guild automod config
 */
function getGuildConfig(guildId) {
  return guildRules.get(guildId) || { ...DEFAULT_CONFIG };
}

/**
 * Update automod config for a guild
 * @param {string} guildId - The guild ID
 * @param {Object} config - The new config
 * @returns {Promise<Object>} The updated config
 */
async function updateGuildConfig(guildId, config) {
  try {
    // Get current config
    const currentConfig = getGuildConfig(guildId);
    
    // Update config
    const updatedConfig = {
      ...currentConfig,
      ...config
    };
    
    // Save to collection
    guildRules.set(guildId, updatedConfig);
    
    // Save to disk
    await saveAutomodRules();
    
    return updatedConfig;
  } catch (error) {
    logger.error(`Error updating automod config for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Enable automod for a guild
 * @param {string} guildId - The guild ID
 * @param {string} logChannelId - The log channel ID
 * @returns {Promise<Object>} The updated config
 */
async function enableAutomod(guildId, logChannelId) {
  return updateGuildConfig(guildId, {
    enabled: true,
    logChannelId
  });
}

/**
 * Disable automod for a guild
 * @param {string} guildId - The guild ID
 * @returns {Promise<Object>} The updated config
 */
async function disableAutomod(guildId) {
  return updateGuildConfig(guildId, {
    enabled: false
  });
}

/**
 * Create an automod rule
 * @param {string} guildId - The guild ID
 * @param {Object} ruleData - The rule data
 * @returns {Promise<Object>} The created rule
 */
async function createRule(guildId, ruleData) {
  try {
    // Validate rule type
    if (!Object.values(RULE_TYPES).includes(ruleData.type)) {
      throw new Error(`Invalid rule type: ${ruleData.type}`);
    }
    
    // Validate rule actions
    if (!Array.isArray(ruleData.actions) || ruleData.actions.length === 0) {
      throw new Error('Rule must have at least one action');
    }
    
    for (const action of ruleData.actions) {
      if (!Object.values(RULE_ACTIONS).includes(action.type)) {
        throw new Error(`Invalid action type: ${action.type}`);
      }
    }
    
    // Get current config
    const config = getGuildConfig(guildId);
    
    // Create rule object
    const rule = {
      id: Date.now().toString(),
      name: ruleData.name,
      type: ruleData.type,
      enabled: ruleData.enabled !== false, // Enabled by default
      actions: ruleData.actions,
      content: ruleData.content,
      settings: ruleData.settings || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add rule to config
    config.rules.push(rule);
    
    // Save config
    await updateGuildConfig(guildId, config);
    
    return rule;
  } catch (error) {
    logger.error(`Error creating automod rule in guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Update an automod rule
 * @param {string} guildId - The guild ID
 * @param {string} ruleId - The rule ID
 * @param {Object} updates - The updates to the rule
 * @returns {Promise<Object|null>} The updated rule or null if not found
 */
async function updateRule(guildId, ruleId, updates) {
  try {
    // Get current config
    const config = getGuildConfig(guildId);
    
    // Find rule
    const ruleIndex = config.rules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex === -1) {
      return null;
    }
    
    // Update rule
    const rule = config.rules[ruleIndex];
    
    // Apply updates
    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Update in array
    config.rules[ruleIndex] = updatedRule;
    
    // Save config
    await updateGuildConfig(guildId, config);
    
    return updatedRule;
  } catch (error) {
    logger.error(`Error updating automod rule ${ruleId} in guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Delete an automod rule
 * @param {string} guildId - The guild ID
 * @param {string} ruleId - The rule ID
 * @returns {Promise<boolean>} Whether the rule was deleted
 */
async function deleteRule(guildId, ruleId) {
  try {
    // Get current config
    const config = getGuildConfig(guildId);
    
    // Find rule
    const ruleIndex = config.rules.findIndex(rule => rule.id === ruleId);
    
    if (ruleIndex === -1) {
      return false;
    }
    
    // Remove rule
    config.rules.splice(ruleIndex, 1);
    
    // Save config
    await updateGuildConfig(guildId, config);
    
    return true;
  } catch (error) {
    logger.error(`Error deleting automod rule ${ruleId} in guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Check message against automod rules
 * @param {Message} message - The message to check
 * @returns {Promise<Object|null>} The triggered rule or null if none triggered
 */
async function checkMessage(message) {
  try {
    // Skip if not in a guild
    if (!message.guild) return null;
    
    // Skip if bot or webhook
    if (message.author.bot || message.webhookId) return null;
    
    // Get guild config
    const guildId = message.guild.id;
    const config = getGuildConfig(guildId);
    
    // Skip if automod is disabled
    if (!config.enabled) return null;
    
    // Get member permissions
    const member = message.member;
    
    // Skip if member has manage messages permission
    if (member && member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return null;
    }
    
    // Check each rule
    for (const rule of config.rules) {
      // Skip disabled rules
      if (!rule.enabled) continue;
      
      // Check rule
      const triggered = await checkRule(message, rule);
      
      if (triggered) {
        // Apply actions
        await applyRuleActions(message, rule);
        return rule;
      }
    }
    
    return null;
  } catch (error) {
    logger.error(`Error checking message against automod rules:`, error);
    return null;
  }
}

/**
 * Check if a message triggers a specific rule
 * @param {Message} message - The message to check
 * @param {Object} rule - The rule to check
 * @returns {Promise<boolean>} Whether the rule was triggered
 */
async function checkRule(message, rule) {
  try {
    const content = message.content.toLowerCase();
    
    switch (rule.type) {
      case RULE_TYPES.KEYWORD:
        // Check for keywords
        if (!rule.content || !Array.isArray(rule.content)) return false;
        
        for (const keyword of rule.content) {
          // Check if keyword is present
          if (content.includes(keyword.toLowerCase())) {
            return true;
          }
        }
        break;
        
      case RULE_TYPES.SPAM:
        // Spam detection requires additional context
        // Simple implementation: check for repeating characters
        if (rule.settings.checkRepeatingChars) {
          // Check for repeating characters
          if (/(.)\1{9,}/.test(content)) {
            return true;
          }
        }
        break;
        
      case RULE_TYPES.MENTION_SPAM:
        // Check for excessive mentions
        const mentionCount = (content.match(/<@!?\d+>/g) || []).length;
        const mentionLimit = rule.settings.mentionLimit || 5;
        
        if (mentionCount >= mentionLimit) {
          return true;
        }
        break;
        
      case RULE_TYPES.CAPS:
        // Check for excessive caps
        const capsMatch = content.match(/[A-Z]/g);
        const totalLength = content.length;
        
        if (totalLength >= 8) { // Only check messages with some substance
          const capsPercentage = capsMatch ? (capsMatch.length / totalLength) : 0;
          const capsLimit = rule.settings.capsPercentage || 0.7; // 70% by default
          
          if (capsPercentage >= capsLimit) {
            return true;
          }
        }
        break;
        
      case RULE_TYPES.INVITE:
        // Check for Discord invite links
        const inviteRegex = /(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+/i;
        
        if (inviteRegex.test(content)) {
          return true;
        }
        break;
        
      case RULE_TYPES.LINK:
        // Check for external links
        const linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/i;
        
        if (linkRegex.test(content)) {
          // Check if any allowed domains
          if (rule.settings.allowedDomains && Array.isArray(rule.settings.allowedDomains)) {
            // Extract domains from the message
            const matches = content.match(linkRegex);
            
            if (matches) {
              // Check each match
              for (const match of matches) {
                try {
                  const url = new URL(match);
                  const domain = url.hostname;
                  
                  // Check if domain is allowed
                  const isAllowed = rule.settings.allowedDomains.some(allowedDomain => 
                    domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
                  );
                  
                  if (!isAllowed) {
                    return true;
                  }
                } catch (e) {
                  // Invalid URL, ignore
                }
              }
            }
          } else {
            // No allowed domains specified, trigger on any link
            return true;
          }
        }
        break;
        
      case RULE_TYPES.ATTACHMENT:
        // Check for attachments
        if (message.attachments.size > 0) {
          if (!rule.settings.allowedTypes || !Array.isArray(rule.settings.allowedTypes)) {
            return true;
          }
          
          // Check attachment types
          for (const [, attachment] of message.attachments) {
            const fileExtension = path.extname(attachment.name).toLowerCase().substring(1);
            
            // Check if extension is allowed
            if (!rule.settings.allowedTypes.includes(fileExtension)) {
              return true;
            }
          }
        }
        break;
        
      case RULE_TYPES.REGEX:
        // Check with regular expression
        if (!rule.content) return false;
        
        try {
          const regex = new RegExp(rule.content, 'i');
          
          if (regex.test(content)) {
            return true;
          }
        } catch (error) {
          logger.error(`Invalid regex in automod rule: ${error.message}`);
        }
        break;
        
      case RULE_TYPES.AI_TOXICITY:
        // AI toxicity detection would require external API
        // Not implemented in this version
        break;
        
      default:
        logger.warn(`Unknown rule type: ${rule.type}`);
    }
    
    return false;
  } catch (error) {
    logger.error(`Error checking rule ${rule.id}:`, error);
    return false;
  }
}

/**
 * Apply actions for a triggered rule
 * @param {Message} message - The message that triggered the rule
 * @param {Object} rule - The triggered rule
 * @returns {Promise<void>}
 */
async function applyRuleActions(message, rule) {
  try {
    // Get guild config
    const guildId = message.guild.id;
    const config = getGuildConfig(guildId);
    
    // Process each action
    for (const action of rule.actions) {
      switch (action.type) {
        case RULE_ACTIONS.DELETE:
          // Delete message
          await message.delete().catch(err => {
            logger.error(`Error deleting message: ${err.message}`);
          });
          break;
          
        case RULE_ACTIONS.WARN:
          // Warn user
          await warnUser(message.guild, message.author.id, rule.name);
          
          // Send DM
          try {
            await message.author.send({
              content: `You have been warned in ${message.guild.name} for violating the rule: **${rule.name}**`
            });
          } catch (error) {
            logger.warn(`Could not send warning DM to user ${message.author.id}: ${error.message}`);
          }
          break;
          
        case RULE_ACTIONS.TIMEOUT:
          // Apply timeout
          const duration = action.duration || 5 * 60 * 1000; // Default 5 minutes
          
          await message.member.timeout(duration, `Automod rule: ${rule.name}`).catch(err => {
            logger.error(`Error timing out user: ${err.message}`);
          });
          break;
          
        case RULE_ACTIONS.KICK:
          // Kick user
          await message.member.kick(`Automod rule: ${rule.name}`).catch(err => {
            logger.error(`Error kicking user: ${err.message}`);
          });
          break;
          
        case RULE_ACTIONS.BAN:
          // Ban user
          await message.guild.members.ban(message.author.id, {
            reason: `Automod rule: ${rule.name}`,
            deleteMessageSeconds: 86400 // 24 hours
          }).catch(err => {
            logger.error(`Error banning user: ${err.message}`);
          });
          break;
          
        case RULE_ACTIONS.LOG:
          // Just log the violation
          // This is handled below
          break;
          
        default:
          logger.warn(`Unknown action type: ${action.type}`);
      }
    }
    
    // Log the violation
    if (config.logChannelId) {
      const logChannel = await message.guild.channels.fetch(config.logChannelId).catch(() => null);
      
      if (logChannel) {
        await logChannel.send({
          content: `**Automod Rule Triggered**\nRule: ${rule.name}\nUser: <@${message.author.id}> (${message.author.tag})\nChannel: <#${message.channel.id}>\nMessage: ${message.content.substring(0, 1000)}`
        }).catch(err => {
          logger.error(`Error sending log message: ${err.message}`);
        });
      }
    }
  } catch (error) {
    logger.error(`Error applying rule actions:`, error);
  }
}

/**
 * Add a warning to a user
 * @param {Guild} guild - The guild
 * @param {string} userId - The user ID
 * @param {string} reason - The reason for the warning
 * @returns {Promise<Object>} The warning
 */
async function warnUser(guild, userId, reason) {
  try {
    // Get user warnings
    let warnings = userWarnings.get(userId);
    
    if (!warnings) {
      warnings = {};
      userWarnings.set(userId, warnings);
    }
    
    // Get guild warnings
    let guildWarnings = warnings[guild.id];
    
    if (!guildWarnings) {
      guildWarnings = [];
      warnings[guild.id] = guildWarnings;
    }
    
    // Create warning
    const warning = {
      id: Date.now().toString(),
      guildId: guild.id,
      userId,
      reason,
      timestamp: new Date().toISOString()
    };
    
    // Add warning
    guildWarnings.push(warning);
    
    // Save warnings
    await saveAutomodRules();
    
    // Get guild config
    const config = getGuildConfig(guild.id);
    
    // Check warning threshold
    if (config.settings && config.settings.warningThreshold) {
      const threshold = config.settings.warningThreshold;
      
      if (guildWarnings.length >= threshold) {
        // Take action based on threshold
        const action = config.settings.warningAction || RULE_ACTIONS.TIMEOUT;
        
        // Get member
        const member = await guild.members.fetch(userId).catch(() => null);
        
        if (member) {
          switch (action) {
            case RULE_ACTIONS.TIMEOUT:
              // Apply timeout
              const duration = config.settings.warningActionDuration || 5 * 60 * 1000; // Default 5 minutes
              
              await member.timeout(duration, `Automod warning threshold reached`).catch(err => {
                logger.error(`Error timing out user: ${err.message}`);
              });
              break;
              
            case RULE_ACTIONS.KICK:
              // Kick user
              await member.kick(`Automod warning threshold reached`).catch(err => {
                logger.error(`Error kicking user: ${err.message}`);
              });
              break;
              
            case RULE_ACTIONS.BAN:
              // Ban user
              await guild.members.ban(userId, {
                reason: `Automod warning threshold reached`,
                deleteMessageSeconds: 86400 // 24 hours
              }).catch(err => {
                logger.error(`Error banning user: ${err.message}`);
              });
              break;
          }
        }
      }
    }
    
    return warning;
  } catch (error) {
    logger.error(`Error warning user ${userId} in guild ${guild.id}:`, error);
    throw error;
  }
}

/**
 * Get user warnings in a guild
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @returns {Array<Object>} The warnings
 */
function getUserWarnings(guildId, userId) {
  // Get user warnings
  const warnings = userWarnings.get(userId);
  
  if (!warnings) {
    return [];
  }
  
  // Get guild warnings
  const guildWarnings = warnings[guildId];
  
  if (!guildWarnings) {
    return [];
  }
  
  return [...guildWarnings];
}

/**
 * Clear user warnings in a guild
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Whether the warnings were cleared
 */
async function clearUserWarnings(guildId, userId) {
  try {
    // Get user warnings
    const warnings = userWarnings.get(userId);
    
    if (!warnings) {
      return false;
    }
    
    // Check if user has warnings in this guild
    if (!warnings[guildId]) {
      return false;
    }
    
    // Clear warnings
    delete warnings[guildId];
    
    // If no more warnings, remove user from collection
    if (Object.keys(warnings).length === 0) {
      userWarnings.delete(userId);
    } else {
      userWarnings.set(userId, warnings);
    }
    
    // Save warnings
    await saveAutomodRules();
    
    return true;
  } catch (error) {
    logger.error(`Error clearing warnings for user ${userId} in guild ${guildId}:`, error);
    return false;
  }
}

module.exports = {
  initialize,
  getGuildConfig,
  updateGuildConfig,
  enableAutomod,
  disableAutomod,
  createRule,
  updateRule,
  deleteRule,
  checkMessage,
  getUserWarnings,
  clearUserWarnings,
  RULE_TYPES,
  RULE_ACTIONS
};