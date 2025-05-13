const reactionRoleManager = require('../lib/reaction-roles');
const logger = require('../lib/logger');

module.exports = {
  name: 'messageReactionRemove',
  once: false,
  /**
   * Handle the messageReactionRemove event
   * @param {MessageReaction} reaction - The reaction that was removed
   * @param {User} user - The user who removed the reaction
   */
  async execute(reaction, user) {
    try {
      // Don't handle partial reactions and users
      if (reaction.partial) {
        // If the reaction is partial, fetch it
        try {
          await reaction.fetch();
        } catch (error) {
          logger.error('Error fetching partial reaction:', error);
          return;
        }
      }
      
      if (user.partial) {
        // If the user is partial, fetch them
        try {
          await user.fetch();
        } catch (error) {
          logger.error('Error fetching partial user:', error);
          return;
        }
      }
      
      // Handle the reaction role
      await reactionRoleManager.handleReactionRemove(reaction, user);
    } catch (error) {
      logger.error('Error handling messageReactionRemove event:', error);
    }
  }
};