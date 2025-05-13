import { Client } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { Event } from '../types/discord';
import { logger } from './logger';

/**
 * Load all event files from the events directory
 */
export async function loadEvents(client: Client): Promise<void> {
  try {
    const eventsPath = join(process.cwd(), 'src', 'events');
    const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
    let loadedCount = 0;

    for (const file of eventFiles) {
      const filePath = join(eventsPath, file);
      const event = require(filePath).default as Event;
      
      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }
      
      loadedCount++;
    }

    logger.info(`Successfully loaded ${loadedCount} events.`);
  } catch (error) {
    logger.error('Error loading events:', error);
  }
}