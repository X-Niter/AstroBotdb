const fs = require('fs').promises;
const path = require('path');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../logger');

// Path to the custom commands storage file
const CUSTOM_COMMANDS_FILE = path.join(process.cwd(), 'data', 'custom-commands.json');

// In-memory storage
const guildCommands = new Map();

// Auto-save interval (5 minutes in ms)
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;

// Permission levels
const PermissionLevel = {
  EVERYONE: 'everyone',
  MODERATOR: 'moderator',
  ADMINISTRATOR: 'administrator'
};

// Response types
const ResponseType = {
  TEXT: 'text',
  EMBED: 'embed',
  RANDOM: 'random',
  CODE: 'code'
};

/**
 * Initialize the custom commands manager
 */
async function initialize() {
  try {
    // Load commands
    await loadCommands();
    
    logger.info('Custom commands manager initialized');
    
    // Set up auto-save interval
    setInterval(async () => {
      await saveCommands();
    }, AUTO_SAVE_INTERVAL);
  } catch (error) {
    logger.error('Error initializing custom commands manager:', error);
  }
}

/**
 * Create a custom command
 * @param {Object} options - Command options
 * @param {string} options.guildId - The guild ID
 * @param {string} options.name - The command name
 * @param {string} options.response - The command response
 * @param {string} options.createdBy - The ID of the user who created the command
 * @param {string} [options.permissionLevel=PermissionLevel.EVERYONE] - The permission level required to use the command
 * @param {string} [options.responseType=ResponseType.TEXT] - The type of response
 * @param {Array<string>} [options.responses] - Array of responses for random response type
 * @param {Object} [options.embed] - Embed data for embed response type
 * @returns {Promise<Object>} The created command
 */
async function createCommand(options) {
  try {
    // Validate options
    if (!options.guildId || !options.name || !options.createdBy) {
      throw new Error('Missing required command options');
    }
    
    // If using random response type, ensure responses array is provided
    if (options.responseType === ResponseType.RANDOM && (!options.responses || !Array.isArray(options.responses) || options.responses.length === 0)) {
      throw new Error('Random response type requires a non-empty responses array');
    }
    
    // If using embed response type, ensure embed data is provided
    if (options.responseType === ResponseType.EMBED && !options.embed) {
      throw new Error('Embed response type requires embed data');
    }
    
    // Normalize command name
    const name = options.name.toLowerCase().trim();
    
    // Check if name is valid
    if (!/^[a-z0-9_-]+$/.test(name)) {
      throw new Error('Command name can only contain lowercase letters, numbers, hyphens, and underscores');
    }
    
    // Ensure command doesn't conflict with a built-in command
    // This would ideally check against the bot's command list, but for simplicity we'll use a blacklist
    const reservedCommands = ['help', 'ping', 'info', 'custom', 'cmd', 'command'];
    if (reservedCommands.includes(name)) {
      throw new Error(`'${name}' is a reserved command name and cannot be used for custom commands`);
    }
    
    // Get or create guild commands
    if (!guildCommands.has(options.guildId)) {
      guildCommands.set(options.guildId, new Map());
    }
    
    const commandsForGuild = guildCommands.get(options.guildId);
    
    // Check if command already exists
    if (commandsForGuild.has(name)) {
      throw new Error(`Command '${name}' already exists in this server`);
    }
    
    // Create the command object
    const command = {
      name,
      response: options.response || '',
      createdBy: options.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      permissionLevel: options.permissionLevel || PermissionLevel.EVERYONE,
      responseType: options.responseType || ResponseType.TEXT,
      responses: options.responses || [],
      embed: options.embed || null,
      usageCount: 0
    };
    
    // Store the command
    commandsForGuild.set(name, command);
    
    // Save commands
    await saveCommands();
    
    return command;
  } catch (error) {
    logger.error('Error creating custom command:', error);
    throw error;
  }
}

/**
 * Update a custom command
 * @param {Object} options - Update options
 * @param {string} options.guildId - The guild ID
 * @param {string} options.name - The command name
 * @param {string} [options.response] - The updated response
 * @param {string} [options.permissionLevel] - The updated permission level
 * @param {string} [options.responseType] - The updated response type
 * @param {Array<string>} [options.responses] - Updated array of random responses
 * @param {Object} [options.embed] - Updated embed data
 * @returns {Promise<Object>} The updated command
 */
async function updateCommand(options) {
  try {
    // Validate options
    if (!options.guildId || !options.name) {
      throw new Error('Missing required update options');
    }
    
    // If using random response type, ensure responses array is provided
    if (options.responseType === ResponseType.RANDOM && options.responses && (!Array.isArray(options.responses) || options.responses.length === 0)) {
      throw new Error('Random response type requires a non-empty responses array');
    }
    
    // If using embed response type, ensure embed data is provided
    if (options.responseType === ResponseType.EMBED && options.embed === undefined) {
      throw new Error('Embed response type requires embed data');
    }
    
    // Normalize command name
    const name = options.name.toLowerCase().trim();
    
    // Get guild commands
    const commandsForGuild = guildCommands.get(options.guildId);
    
    if (!commandsForGuild) {
      throw new Error(`No commands found for guild ${options.guildId}`);
    }
    
    // Get command
    const command = commandsForGuild.get(name);
    
    if (!command) {
      throw new Error(`Command '${name}' not found in this server`);
    }
    
    // Update command properties
    if (options.response !== undefined) {
      command.response = options.response;
    }
    
    if (options.permissionLevel) {
      command.permissionLevel = options.permissionLevel;
    }
    
    if (options.responseType) {
      command.responseType = options.responseType;
    }
    
    if (options.responses) {
      command.responses = options.responses;
    }
    
    if (options.embed !== undefined) {
      command.embed = options.embed;
    }
    
    // Update timestamp
    command.updatedAt = new Date();
    
    // Save commands
    await saveCommands();
    
    return command;
  } catch (error) {
    logger.error('Error updating custom command:', error);
    throw error;
  }
}

/**
 * Delete a custom command
 * @param {string} guildId - The guild ID
 * @param {string} name - The command name
 * @returns {Promise<boolean>} Whether the deletion was successful
 */
async function deleteCommand(guildId, name) {
  try {
    // Normalize command name
    name = name.toLowerCase().trim();
    
    // Get guild commands
    const commandsForGuild = guildCommands.get(guildId);
    
    if (!commandsForGuild) {
      return false;
    }
    
    // Delete command
    const deleted = commandsForGuild.delete(name);
    
    // Save commands
    if (deleted) {
      await saveCommands();
    }
    
    return deleted;
  } catch (error) {
    logger.error('Error deleting custom command:', error);
    return false;
  }
}

/**
 * Get a custom command
 * @param {string} guildId - The guild ID
 * @param {string} name - The command name
 * @returns {Object|null} The command or null if not found
 */
function getCommand(guildId, name) {
  // Normalize command name
  name = name.toLowerCase().trim();
  
  // Get guild commands
  const commandsForGuild = guildCommands.get(guildId);
  
  if (!commandsForGuild) {
    return null;
  }
  
  // Get command
  return commandsForGuild.get(name) || null;
}

/**
 * Get all custom commands for a guild
 * @param {string} guildId - The guild ID
 * @returns {Array<Object>} Array of commands
 */
function getCommands(guildId) {
  // Get guild commands
  const commandsForGuild = guildCommands.get(guildId);
  
  if (!commandsForGuild) {
    return [];
  }
  
  // Convert to array
  return Array.from(commandsForGuild.values());
}

/**
 * Check if a user has permission to use a command
 * @param {GuildMember} member - The guild member
 * @param {Object} command - The command
 * @returns {boolean} Whether the user has permission
 */
function hasPermission(member, command) {
  switch (command.permissionLevel) {
    case PermissionLevel.EVERYONE:
      return true;
    case PermissionLevel.MODERATOR:
      return member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
             member.permissions.has(PermissionFlagsBits.Administrator);
    case PermissionLevel.ADMINISTRATOR:
      return member.permissions.has(PermissionFlagsBits.Administrator);
    default:
      return false;
  }
}

/**
 * Execute a custom command
 * @param {Message} message - The message that triggered the command
 * @param {string} name - The command name
 * @param {string} args - The command arguments
 * @returns {Promise<boolean>} Whether the command was executed
 */
async function executeCommand(message, name, args) {
  try {
    // Normalize command name
    name = name.toLowerCase().trim();
    
    // Get command
    const command = getCommand(message.guildId, name);
    
    if (!command) {
      return false;
    }
    
    // Check permission
    if (!hasPermission(message.member, command)) {
      await message.reply({
        content: 'You do not have permission to use this command.',
        ephemeral: true
      });
      
      return true;
    }
    
    // Increment usage count
    command.usageCount += 1;
    
    // Process variables in the response
    const processedVars = processVariables(command, message, args);
    
    // Execute command based on response type
    switch (command.responseType) {
      case ResponseType.TEXT:
        await message.channel.send(processedVars);
        break;
      
      case ResponseType.EMBED:
        const embedData = command.embed;
        
        // Clone and process embed data
        const processedEmbed = {
          title: embedData.title ? processVariables(embedData.title, message, args) : undefined,
          description: embedData.description ? processVariables(embedData.description, message, args) : undefined,
          color: embedData.color || 0x5865F2,
          fields: embedData.fields ? embedData.fields.map(field => ({
            name: processVariables(field.name, message, args),
            value: processVariables(field.value, message, args),
            inline: field.inline
          })) : undefined,
          footer: embedData.footer ? { 
            text: processVariables(embedData.footer.text, message, args) 
          } : undefined,
          image: embedData.image ? { url: embedData.image.url } : undefined,
          thumbnail: embedData.thumbnail ? { url: embedData.thumbnail.url } : undefined
        };
        
        const embed = new EmbedBuilder(processedEmbed);
        
        await message.channel.send({ embeds: [embed] });
        break;
      
      case ResponseType.RANDOM:
        if (command.responses.length === 0) {
          await message.channel.send('This command has no responses configured.');
          break;
        }
        
        // Pick a random response
        const randomIndex = Math.floor(Math.random() * command.responses.length);
        const randomResponse = command.responses[randomIndex];
        
        // Process variables in the random response
        const processedRandom = processVariables(randomResponse, message, args);
        
        await message.channel.send(processedRandom);
        break;
      
      case ResponseType.CODE:
        // Format response as code block
        const language = command.response.split('\n')[0].trim();
        const code = command.response.substring(command.response.indexOf('\n') + 1);
        
        // Process variables in the code
        const processedCode = processVariables(code, message, args);
        
        await message.channel.send(`\`\`\`${language}\n${processedCode}\n\`\`\``);
        break;
      
      default:
        await message.channel.send(processedVars);
    }
    
    // Save commands (to update usage count)
    await saveCommands();
    
    return true;
  } catch (error) {
    logger.error(`Error executing custom command '${name}':`, error);
    return false;
  }
}

/**
 * Process variables in a string
 * @param {string} text - The text to process
 * @param {Message} message - The message that triggered the command
 * @param {string} args - The command arguments
 * @returns {string} The processed text
 */
function processVariables(text, message, args) {
  if (!text) return '';
  
  return text
    // User variables
    .replace(/{user}/g, message.author.toString())
    .replace(/{username}/g, message.author.username)
    .replace(/{user\.id}/g, message.author.id)
    .replace(/{user\.tag}/g, message.author.tag)
    
    // Message variables
    .replace(/{message}/g, message.content)
    .replace(/{message\.id}/g, message.id)
    
    // Channel variables
    .replace(/{channel}/g, message.channel.toString())
    .replace(/{channel\.name}/g, message.channel.name)
    .replace(/{channel\.id}/g, message.channel.id)
    
    // Server variables
    .replace(/{server}/g, message.guild.name)
    .replace(/{server\.id}/g, message.guild.id)
    .replace(/{server\.memberCount}/g, message.guild.memberCount.toString())
    
    // Arguments
    .replace(/{args}/g, args)
    
    // Time variables
    .replace(/{date}/g, new Date().toLocaleDateString())
    .replace(/{time}/g, new Date().toLocaleTimeString())
    
    // Random number
    .replace(/{random:(\d+)-(\d+)}/g, (match, min, max) => {
      const minNum = parseInt(min);
      const maxNum = parseInt(max);
      return Math.floor(Math.random() * (maxNum - minNum + 1) + minNum).toString();
    });
}

/**
 * Save commands to disk
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveCommands() {
  try {
    // Convert the map to an object
    const commandsObj = {};
    
    for (const [guildId, commands] of guildCommands.entries()) {
      commandsObj[guildId] = {};
      
      for (const [name, command] of commands.entries()) {
        commandsObj[guildId][name] = {
          ...command,
          createdAt: command.createdAt instanceof Date ? command.createdAt.toISOString() : command.createdAt,
          updatedAt: command.updatedAt instanceof Date ? command.updatedAt.toISOString() : command.updatedAt
        };
      }
    }
    
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(CUSTOM_COMMANDS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(CUSTOM_COMMANDS_FILE, JSON.stringify(commandsObj, null, 2));
    
    logger.debug(`Saved custom commands to disk`);
    return true;
  } catch (error) {
    logger.error('Error saving custom commands:', error);
    return false;
  }
}

/**
 * Load commands from disk
 * @returns {Promise<void>}
 */
async function loadCommands() {
  try {
    // Check if the file exists
    try {
      await fs.access(CUSTOM_COMMANDS_FILE);
    } catch (error) {
      logger.warn('Custom commands file does not exist, creating an empty one');
      await saveCommands();
      return;
    }
    
    // Read the file
    const data = await fs.readFile(CUSTOM_COMMANDS_FILE, 'utf8');
    
    // Parse the JSON
    const commandsObj = JSON.parse(data);
    
    // Convert to maps
    for (const [guildId, guildCommandsObj] of Object.entries(commandsObj)) {
      const commandsMap = new Map();
      
      for (const [name, command] of Object.entries(guildCommandsObj)) {
        commandsMap.set(name, {
          ...command,
          createdAt: new Date(command.createdAt),
          updatedAt: new Date(command.updatedAt)
        });
      }
      
      guildCommands.set(guildId, commandsMap);
    }
    
    logger.debug(`Loaded custom commands from disk`);
  } catch (error) {
    logger.error('Error loading custom commands:', error);
  }
}

module.exports = {
  initialize,
  createCommand,
  updateCommand,
  deleteCommand,
  getCommand,
  getCommands,
  executeCommand,
  hasPermission,
  PermissionLevel,
  ResponseType
};