const welcomeManager = require('../lib/welcome');
const logger = require('../lib/logger');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  /**
   * Handle the guildMemberAdd event
   * @param {GuildMember} member - The member who joined
   */
  async execute(member) {
    try {
      // Handle welcome message
      await welcomeManager.handleMemberJoin(member);
      
      // Other member join handling logic can be added here
      logger.info(`${member.user.tag} joined ${member.guild.name}`);
    } catch (error) {
      logger.error('Error handling guildMemberAdd event:', error);
    }
  }
};