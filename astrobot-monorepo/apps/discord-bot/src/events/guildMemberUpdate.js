const { logRoleChange } = require('../lib/mod-logger');
const logger = require('../lib/logger');

module.exports = {
  name: 'guildMemberUpdate',
  
  /**
   * Handler for the guildMemberUpdate event
   * @param {Client} client - The Discord client
   * @param {GuildMember} oldMember - The member before the update
   * @param {GuildMember} newMember - The member after the update
   */
  async execute(client, oldMember, newMember) {
    try {
      // Check for role changes
      if (oldMember.roles.cache.size !== newMember.roles.cache.size || 
          !oldMember.roles.cache.every(role => newMember.roles.cache.has(role.id))) {
        
        // Log role change for analytics
        logger.info(`Roles updated for ${newMember.user.tag} in ${newMember.guild.name} (${newMember.guild.id})`);
        
        // Log to moderation logs
        await logRoleChange(newMember, oldMember.roles.cache);
      }
      
      // Check for nickname changes
      if (oldMember.nickname !== newMember.nickname) {
        logger.info(`Nickname changed for ${newMember.user.tag} in ${newMember.guild.name}: ${oldMember.nickname || '(none)'} -> ${newMember.nickname || '(none)'}`);
        
        // Implement nickname change logging if desired
        // ...
      }
      
      // Check for pending status changes (membership screening)
      if (oldMember.pending !== newMember.pending) {
        logger.info(`Member ${newMember.user.tag} completed membership screening in ${newMember.guild.name}`);
        
        // Implement membership screening completion logic if desired
        // ...
      }
      
      // Check for timeout status changes
      if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
        if (newMember.communicationDisabledUntil) {
          logger.info(`Member ${newMember.user.tag} was timed out in ${newMember.guild.name} until ${newMember.communicationDisabledUntil}`);
          
          // Implement timeout logging if desired
          // ...
        } else {
          logger.info(`Timeout removed for ${newMember.user.tag} in ${newMember.guild.name}`);
          
          // Implement timeout removal logging if desired
          // ...
        }
      }
    } catch (error) {
      logger.error(`Error handling member update for ${newMember.user.id} in ${newMember.guild.id}:`, error);
    }
  }
};