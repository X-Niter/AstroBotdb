import { Client, Events } from 'discord.js';
import { logger } from '../utils/logger';
import { Event } from '../types/discord';

// ready.ts - This event runs when the bot connects and is ready
export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    if (!client.user) return;

    logger.info(`Connected to Discord as ${client.user.tag}!`);
    
    // Set bot status
    client.user.setPresence({
      activities: [
        {
          name: 'to your commands',
          type: 2, // "Listening to"
        },
      ],
      status: 'online',
    });

    // Log total number of servers the bot is in
    logger.info(`Serving ${client.guilds.cache.size} Discord servers`);
    
    // Server count stats
    const totalMembers = client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0);
    logger.info(`Watching over ${totalMembers} members`);
  },
} as Event;