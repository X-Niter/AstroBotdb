const { logUnban } = require('../lib/mod-logger');
const logger = require('../lib/logger');

module.exports = {
  name: 'guildBanRemove',
  
  /**
   * Handler for the guildBanRemove event
   * @param {Client} client - The Discord client
   * @param {GuildBan} ban - The ban that was removed
   */
  async execute(client, ban) {
    const { guild, user } = ban;
    
    try {
      // Log unban for analytics
      logger.info(`${user.tag} was unbanned from ${guild.name} (${guild.id})`);
      
      // Log to moderation logs
      await logUnban(guild, user);
    } catch (error) {
      logger.error(`Error handling unban for ${user.id} in ${guild.id}:`, error);
    }
  }
};