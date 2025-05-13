const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const logger = require('./logger');

/**
 * Load all command files from the commands directory
 * @param {Client} client - The Discord client
 * @returns {Promise<object>} The loaded commands
 */
async function loadCommands(client) {
  logger.info('Loading commands...');
  
  // Initialize command collections if they don't exist
  client.slashCommands = new Map();
  client.contextMenuCommands = new Map();
  client.cooldowns = new Map();
  
  // Get the commands directory
  const commandsPath = path.join(__dirname, '../commands');
  const commandFolders = fs.readdirSync(commandsPath).filter(folder => 
    fs.statSync(path.join(commandsPath, folder)).isDirectory()
  );
  
  // Load commands from each folder
  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      try {
        // Load the command file
        const command = require(filePath);
        
        // Validate the command
        if (!command.data || !command.execute) {
          logger.warn(`Command at ${filePath} is missing required "data" or "execute" properties.`);
          continue;
        }
        
        // Add the command to the appropriate collection
        switch (command.type) {
          case 'SLASH_COMMAND':
            client.slashCommands.set(command.data.name, command);
            break;
          case 'USER_CONTEXT_MENU':
          case 'MESSAGE_CONTEXT_MENU':
            client.contextMenuCommands.set(command.data.name, command);
            break;
          default:
            logger.warn(`Unknown command type "${command.type}" in ${filePath}`);
            continue;
        }
        
        logger.debug(`Loaded command: ${command.data.name} (${command.type})`);
      } catch (error) {
        logger.error(`Error loading command at ${filePath}:`, error);
      }
    }
  }
  
  logger.info(`Loaded ${client.slashCommands.size} slash commands and ${client.contextMenuCommands.size} context menu commands`);
  return {
    slashCommands: client.slashCommands,
    contextMenuCommands: client.contextMenuCommands
  };
}

/**
 * Register all commands with Discord API
 * @param {Client} client - The Discord client
 * @param {string} clientId - The client ID
 * @param {string} guildId - The guild ID for guild-specific registration (optional)
 */
async function registerCommands(client, clientId, guildId = null) {
  const rest = new REST({ version: '10' }).setToken(client.token);
  
  try {
    // Combine slash commands and context menu commands for registration
    const commands = [
      ...Array.from(client.slashCommands.values()).map(cmd => cmd.data.toJSON()),
      ...Array.from(client.contextMenuCommands.values()).map(cmd => cmd.data.toJSON())
    ];
    
    // If guildId is provided, register commands for a specific guild (faster for testing)
    if (guildId) {
      logger.info(`Registering ${commands.length} commands for guild ${guildId}...`);
      
      await rest.put(
        Routes.applicationGuildCommands(clientId, guildId),
        { body: commands }
      );
      
      logger.info(`Successfully registered commands for guild ${guildId}`);
    } 
    // Otherwise register global commands (takes up to an hour to propagate)
    else {
      logger.info(`Registering ${commands.length} global commands...`);
      
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands }
      );
      
      logger.info('Successfully registered global commands');
    }
  } catch (error) {
    logger.error('Error registering commands:', error);
  }
}

module.exports = {
  loadCommands,
  registerCommands
};