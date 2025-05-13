import { Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { Command } from '../types/discord';
import { logger } from './logger';

/**
 * Load all command files from the commands directory
 */
export async function loadCommands(client: Client): Promise<void> {
  try {
    const commandsPath = join(process.cwd(), 'src', 'commands');
    const commandFolders = readdirSync(commandsPath);
    let loadedCount = 0;

    for (const folder of commandFolders) {
      const folderPath = join(commandsPath, folder);
      const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      
      for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        const command = require(filePath).default as Command;
        
        // Set a new item in the Collection with the key as the command name and the value as the exported module
        if ('data' in command && 'execute' in command) {
          client.commands.set(command.data.name, command);
          loadedCount++;
        } else {
          logger.warn(`The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      }
    }

    logger.info(`Successfully loaded ${loadedCount} commands.`);
  } catch (error) {
    logger.error('Error loading commands:', error);
  }
}