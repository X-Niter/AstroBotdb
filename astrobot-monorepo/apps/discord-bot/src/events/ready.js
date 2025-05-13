const logger = require('../lib/logger');
const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  
  /**
   * Handler for the ready event
   * @param {Client} client - The Discord client
   */
  async execute(client) {
    const serverCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    
    // Log bot information
    logger.info('='.repeat(40));
    logger.info(`Bot is online as ${client.user.tag}!`);
    logger.info(`Serving ${serverCount} servers and ${userCount} users`);
    logger.info('='.repeat(40));
    
    // Set bot status
    setRandomStatus(client);
    
    // Update status every 30 minutes
    setInterval(() => {
      setRandomStatus(client);
    }, 30 * 60 * 1000);
  }
};

/**
 * Set a random status for the bot
 * @param {Client} client - The Discord client
 */
function setRandomStatus(client) {
  const activities = [
    { name: '/help for commands', type: ActivityType.Listening },
    { name: `${client.guilds.cache.size} servers`, type: ActivityType.Watching },
    { name: 'with AI responses', type: ActivityType.Playing },
    { name: 'astrobot.ai', type: ActivityType.Playing },
    { name: 'your server grow', type: ActivityType.Watching }
  ];
  
  const randomActivity = activities[Math.floor(Math.random() * activities.length)];
  
  client.user.setActivity(randomActivity.name, { type: randomActivity.type });
  logger.debug(`Set status to: ${randomActivity.type} ${randomActivity.name}`);
}