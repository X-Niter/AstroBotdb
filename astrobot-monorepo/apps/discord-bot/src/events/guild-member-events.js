/**
 * Guild Member Events
 * Handles events related to guild members
 */

const { Events } = require('discord.js');
const welcomeManager = require('../lib/welcome/welcome-manager');
const logger = require('../lib/logger');

/**
 * Register guild member events
 * @param {Client} client - The Discord client
 */
function registerEvents(client) {
  // Member join event
  client.on(Events.GuildMemberAdd, async (member) => {
    try {
      logger.debug(`Member joined: ${member.user.tag} in ${member.guild.name}`);
      
      // Handle welcome message, DM, and auto-roles
      await welcomeManager.handleMemberJoin(member);
    } catch (error) {
      logger.error(`Error handling member join for ${member.user.tag}:`, error);
    }
  });
  
  // Member leave event
  client.on(Events.GuildMemberRemove, async (member) => {
    try {
      logger.debug(`Member left: ${member.user.tag} in ${member.guild.name}`);
      
      // Handle goodbye message
      await welcomeManager.handleMemberLeave(member);
    } catch (error) {
      logger.error(`Error handling member leave for ${member.user.tag}:`, error);
    }
  });
  
  // Member roles updated
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    try {
      // Check if roles changed
      const oldRoles = [...oldMember.roles.cache.keys()];
      const newRoles = [...newMember.roles.cache.keys()];
      
      // Skip if roles didn't change
      if (oldRoles.length === newRoles.length && 
          oldRoles.every(role => newRoles.includes(role))) {
        return;
      }
      
      // Log role changes
      const addedRoles = newRoles.filter(role => !oldRoles.includes(role));
      const removedRoles = oldRoles.filter(role => !newRoles.includes(role));
      
      if (addedRoles.length > 0) {
        const roleNames = addedRoles
          .map(roleId => newMember.guild.roles.cache.get(roleId)?.name || 'Unknown Role')
          .join(', ');
        
        logger.debug(`Roles added to ${newMember.user.tag} in ${newMember.guild.name}: ${roleNames}`);
      }
      
      if (removedRoles.length > 0) {
        const roleNames = removedRoles
          .map(roleId => newMember.guild.roles.cache.get(roleId)?.name || 'Unknown Role')
          .join(', ');
        
        logger.debug(`Roles removed from ${newMember.user.tag} in ${newMember.guild.name}: ${roleNames}`);
      }
    } catch (error) {
      logger.error(`Error handling member update for ${newMember.user.tag}:`, error);
    }
  });
}

module.exports = {
  registerEvents
};