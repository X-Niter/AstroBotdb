const { logBan } = require('../lib/mod-logger');
const logger = require('../lib/logger');

module.exports = {
  name: 'guildBanAdd',
  
  /**
   * Handler for the guildBanAdd event
   * @param {Client} client - The Discord client
   * @param {GuildBan} ban - The ban that was added
   */
  async execute(client, ban) {
    const { guild, user } = ban;
    
    try {
      // Log ban for analytics
      logger.info(`${user.tag} was banned from ${guild.name} (${guild.id})`);
      
      // Log to moderation logs
      await logBan(guild, user);
    } catch (error) {
      logger.error(`Error handling ban for ${user.id} in ${guild.id}:`, error);
    }
  }
};