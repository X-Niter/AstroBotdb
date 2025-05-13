const { logMemberLeave } = require('../lib/mod-logger');
const logger = require('../lib/logger');

module.exports = {
  name: 'guildMemberRemove',
  
  /**
   * Handler for the guildMemberRemove event
   * @param {Client} client - The Discord client
   * @param {GuildMember} member - The member who left
   */
  async execute(client, member) {
    try {
      // Log member leave for analytics
      logger.info(`${member.user.tag} left ${member.guild.name} (${member.guild.id})`);
      
      // Log to moderation logs
      await logMemberLeave(member);
    } catch (error) {
      logger.error(`Error handling member leave for ${member.user.id} in ${member.guild.id}:`, error);
    }
  }
};