import { REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { config } from './config';
import { logger } from './utils/logger';

// Function to deploy commands to Discord
async function deployCommands() {
  const commands = [];
  const commandsPath = join(process.cwd(), 'src', 'commands');
  const commandFolders = readdirSync(commandsPath);

  // Load all command data from files
  for (const folder of commandFolders) {
    const folderPath = join(commandsPath, folder);
    const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = join(folderPath, file);
      const command = require(filePath).default;
      
      if ('data' in command) {
        commands.push(command.data.toJSON());
      } else {
        logger.warn(`The command at ${filePath} is missing a required "data" property.`);
      }
    }
  }

  // Initialize REST client
  const rest = new REST().setToken(config.discord.token);

  try {
    logger.info(`Started refreshing ${commands.length} application (/) commands.`);

    // Deploy commands to specific guild (development) or globally (production)
    let data;
    if (config.isDevelopment && config.discord.guildId) {
      // For development: Deploy commands to a specific guild
      data = await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands },
      );
      logger.info(`Successfully reloaded commands in development guild (${config.discord.guildId})`);
    } else {
      // For production: Deploy commands globally
      data = await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands },
      );
      logger.info('Successfully reloaded commands globally');
    }

    // @ts-ignore
    logger.info(`Registered ${data.length} commands.`);
  } catch (error) {
    logger.error('Error deploying commands:', error);
    process.exit(1);
  }
}

// Execute command deployment
deployCommands();