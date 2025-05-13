/**
 * Custom Command Manager
 * Manages custom commands created by server admins
 */

const { Collection } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');

// Path to custom commands file
const COMMANDS_FILE = path.join(process.cwd(), 'data', 'custom-commands.json');

// Custom commands (guildId -> commandName -> commandData)
const guildCommands = new Collection();

// Command cooldowns (guildId_commandName_userId -> timestamp)
const commandCooldowns = new Collection();

/**
 * Initialize the custom command manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing custom command manager...');
    
    // Load commands
    await loadCommands();
    
    logger.info('Custom command manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing custom command manager:', error);
    return false;
  }
}

/**
 * Load commands from disk
 * @returns {Promise<void>}
 */
async function loadCommands() {
  try {
    // Clear collection
    guildCommands.clear();
    
    // Check if file exists
    try {
      await fs.access(COMMANDS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveCommands();
      return;
    }
    
    // Read file
    const data = await fs.readFile(COMMANDS_FILE, 'utf8');
    
    // Parse JSON
    const commandsData = JSON.parse(data);
    
    // Load commands
    for (const [guildId, commands] of Object.entries(commandsData)) {
      const guildCollection = new Collection();
      
      for (const [commandName, commandData] of Object.entries(commands)) {
        guildCollection.set(commandName, commandData);
      }
      
      guildCommands.set(guildId, guildCollection);
    }
    
    logger.debug('Custom commands loaded from disk');
  } catch (error) {
    logger.error('Error loading custom commands:', error);
    throw error;
  }
}

/**
 * Save commands to disk
 * @returns {Promise<void>}
 */
async function saveCommands() {
  try {
    // Create data object
    const commandsData = {};
    
    for (const [guildId, guildCollection] of guildCommands.entries()) {
      commandsData[guildId] = {};
      
      for (const [commandName, commandData] of guildCollection.entries()) {
        commandsData[guildId][commandName] = commandData;
      }
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(COMMANDS_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(COMMANDS_FILE, JSON.stringify(commandsData, null, 2));
    
    logger.debug('Custom commands saved to disk');
  } catch (error) {
    logger.error('Error saving custom commands:', error);
    throw error;
  }
}

/**
 * Create a custom command
 * @param {string} guildId - The guild ID
 * @param {string} name - The command name
 * @param {string} response - The command response
 * @param {Object} options - Command options
 * @returns {Promise<Object>} The created command
 */
async function createCommand(guildId, name, response, options = {}) {
  try {
    // Convert name to lowercase
    name = name.toLowerCase();
    
    // Check if guild exists in collection
    if (!guildCommands.has(guildId)) {
      guildCommands.set(guildId, new Collection());
    }
    
    const guildCollection = guildCommands.get(guildId);
    
    // Check if command exists
    if (guildCollection.has(name)) {
      throw new Error(`Command "${name}" already exists in this server.`);
    }
    
    // Create command data
    const commandData = {
      name,
      response,
      createdAt: Date.now(),
      createdBy: options.createdBy || null,
      updatedAt: Date.now(),
      updatedBy: options.updatedBy || options.createdBy || null,
      cooldown: options.cooldown || 0, // Cooldown in seconds
      deleteCommand: options.deleteCommand || false, // Whether to delete the command message
      restricted: options.restricted || false, // Whether the command is restricted to certain roles
      allowedRoles: options.allowedRoles || [], // Array of role IDs allowed to use the command
      usageCount: 0
    };
    
    // Add to collection
    guildCollection.set(name, commandData);
    
    // Save commands
    await saveCommands();
    
    return commandData;
  } catch (error) {
    logger.error(`Error creating custom command ${name} in guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Edit a custom command
 * @param {string} guildId - The guild ID
 * @param {string} name - The command name
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} The updated command
 */
async function editCommand(guildId, name, updates) {
  try {
    // Convert name to lowercase
    name = name.toLowerCase();
    
    // Check if guild exists in collection
    if (!guildCommands.has(guildId)) {
      throw new Error(`No commands exist in server.`);
    }
    
    const guildCollection = guildCommands.get(guildId);
    
    // Check if command exists
    if (!guildCollection.has(name)) {
      throw new Error(`Command "${name}" does not exist in this server.`);
    }
    
    // Get command data
    const commandData = guildCollection.get(name);
    
    // Update command data
    const updatedData = {
      ...commandData,
      ...updates,
      updatedAt: Date.now()
    };
    
    // Add to collection
    guildCollection.set(name, updatedData);
    
    // Save commands
    await saveCommands();
    
    return updatedData;
  } catch (error) {
    logger.error(`Error editing custom command ${name} in guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Delete a custom command
 * @param {string} guildId - The guild ID
 * @param {string} name - The command name
 * @returns {Promise<boolean>} Whether the command was deleted
 */
async function deleteCommand(guildId, name) {
  try {
    // Convert name to lowercase
    name = name.toLowerCase();
    
    // Check if guild exists in collection
    if (!guildCommands.has(guildId)) {
      return false;
    }
    
    const guildCollection = guildCommands.get(guildId);
    
    // Check if command exists
    if (!guildCollection.has(name)) {
      return false;
    }
    
    // Delete command
    guildCollection.delete(name);
    
    // Save commands
    await saveCommands();
    
    return true;
  } catch (error) {
    logger.error(`Error deleting custom command ${name} in guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Get a custom command
 * @param {string} guildId - The guild ID
 * @param {string} name - The command name
 * @returns {Object|null} The command data or null if not found
 */
function getCommand(guildId, name) {
  // Convert name to lowercase
  name = name.toLowerCase();
  
  // Check if guild exists in collection
  if (!guildCommands.has(guildId)) {
    return null;
  }
  
  const guildCollection = guildCommands.get(guildId);
  
  // Check if command exists
  if (!guildCollection.has(name)) {
    return null;
  }
  
  // Return command data
  return guildCollection.get(name);
}

/**
 * Get all custom commands in a guild
 * @param {string} guildId - The guild ID
 * @returns {Array<Object>} The commands
 */
function getGuildCommands(guildId) {
  // Check if guild exists in collection
  if (!guildCommands.has(guildId)) {
    return [];
  }
  
  const guildCollection = guildCommands.get(guildId);
  
  // Convert to array
  return Array.from(guildCollection.values());
}

/**
 * Check if user can use a command
 * @param {Object} commandData - The command data
 * @param {GuildMember} member - The guild member
 * @returns {boolean} Whether the user can use the command
 */
function canUseCommand(commandData, member) {
  // Unrestricted commands can be used by anyone
  if (!commandData.restricted) {
    return true;
  }
  
  // Check if user has any of the allowed roles
  return commandData.allowedRoles.some(roleId => member.roles.cache.has(roleId));
}

/**
 * Check if a user is on cooldown for a command
 * @param {string} guildId - The guild ID
 * @param {string} commandName - The command name
 * @param {string} userId - The user ID
 * @returns {Object|null} Cooldown info or null if not on cooldown
 */
function checkCooldown(guildId, commandName, userId) {
  // Get command
  const commandData = getCommand(guildId, commandName);
  
  if (!commandData || commandData.cooldown <= 0) {
    return null;
  }
  
  // Check cooldown
  const cooldownKey = `${guildId}_${commandName.toLowerCase()}_${userId}`;
  const now = Date.now();
  const cooldownTime = commandData.cooldown * 1000; // Convert to milliseconds
  
  if (commandCooldowns.has(cooldownKey)) {
    const lastTime = commandCooldowns.get(cooldownKey);
    const timeLeft = lastTime + cooldownTime - now;
    
    if (timeLeft > 0) {
      // Still on cooldown
      return {
        onCooldown: true,
        timeLeft: timeLeft,
        timeLeftSeconds: Math.ceil(timeLeft / 1000)
      };
    }
  }
  
  return null;
}

/**
 * Set cooldown for a user
 * @param {string} guildId - The guild ID
 * @param {string} commandName - The command name
 * @param {string} userId - The user ID
 */
function setCooldown(guildId, commandName, userId) {
  const cooldownKey = `${guildId}_${commandName.toLowerCase()}_${userId}`;
  commandCooldowns.set(cooldownKey, Date.now());
}

/**
 * Execute a custom command
 * @param {Message} message - The message that triggered the command
 * @param {string} commandName - The command name
 * @returns {Promise<boolean>} Whether the command was executed
 */
async function executeCommand(message, commandName) {
  try {
    const { guild, author, member, channel } = message;
    
    // Convert name to lowercase
    commandName = commandName.toLowerCase();
    
    // Get command
    const commandData = getCommand(guild.id, commandName);
    
    if (!commandData) {
      return false;
    }
    
    // Check if user can use command
    if (!canUseCommand(commandData, member)) {
      return false;
    }
    
    // Check cooldown
    const cooldown = checkCooldown(guild.id, commandName, author.id);
    
    if (cooldown && cooldown.onCooldown) {
      await channel.send({
        content: `You need to wait ${cooldown.timeLeftSeconds} second(s) before using this command again.`,
        reply: { messageReference: message }
      });
      
      return true;
    }
    
    // Set cooldown
    setCooldown(guild.id, commandName, author.id);
    
    // Update usage count
    await editCommand(guild.id, commandName, {
      usageCount: (commandData.usageCount || 0) + 1
    });
    
    // Process response placeholders
    let response = processPlaceholders(commandData.response, {
      author,
      channel,
      guild,
      member
    });
    
    // Send response
    await channel.send({
      content: response,
      reply: { messageReference: message }
    });
    
    // Delete command message if configured
    if (commandData.deleteCommand) {
      try {
        await message.delete();
      } catch (deleteError) {
        logger.warn(`Could not delete message for custom command ${commandName}: ${deleteError.message}`);
      }
    }
    
    return true;
  } catch (error) {
    logger.error(`Error executing custom command ${commandName}:`, error);
    return false;
  }
}

/**
 * Process placeholders in command response
 * @param {string} response - The command response
 * @param {Object} context - The context object
 * @returns {string} The processed response
 */
function processPlaceholders(response, context) {
  const { author, channel, guild, member } = context;
  
  // Replace placeholders
  return response
    .replace(/{user}/g, author.toString())
    .replace(/{username}/g, author.username)
    .replace(/{displayname}/g, member.displayName)
    .replace(/{server}/g, guild.name)
    .replace(/{channel}/g, channel.toString())
    .replace(/{membercount}/g, guild.memberCount.toString())
    .replace(/{userid}/g, author.id)
    .replace(/{random:(\d+)-(\d+)}/g, (match, min, max) => {
      min = parseInt(min, 10);
      max = parseInt(max, 10);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    });
}

/**
 * Check if a message is a custom command and execute it
 * @param {Message} message - The message
 * @param {string} prefix - The command prefix
 * @returns {Promise<boolean>} Whether a command was executed
 */
async function processMessage(message, prefix) {
  try {
    // Skip if message is from a bot or in a DM
    if (message.author.bot || !message.guild) {
      return false;
    }
    
    // Check if message starts with prefix
    if (!message.content.startsWith(prefix)) {
      return false;
    }
    
    // Get command name
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    // Execute command
    return await executeCommand(message, commandName);
  } catch (error) {
    logger.error('Error processing message for custom commands:', error);
    return false;
  }
}

module.exports = {
  initialize,
  createCommand,
  editCommand,
  deleteCommand,
  getCommand,
  getGuildCommands,
  canUseCommand,
  checkCooldown,
  executeCommand,
  processMessage
};