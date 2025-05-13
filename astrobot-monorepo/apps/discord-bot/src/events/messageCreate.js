const autoMod = require('../lib/auto-mod');
const leveling = require('../lib/leveling');
const customCommands = require('../lib/custom-commands');
const logger = require('../lib/logger');

module.exports = {
  name: 'messageCreate',
  once: false,
  /**
   * Handle the messageCreate event
   * @param {Message} message - The message that was created
   */
  async execute(message) {
    try {
      // Ignore messages from bots and webhooks
      if (message.author.bot || message.webhookId) return;
      
      // Ignore messages in DMs
      if (!message.guild) return;
      
      // Process message for auto-moderation
      const violation = await autoMod.processMessage(message);
      
      // If violation, don't process further
      if (violation) return;
      
      // Process for leveling
      await leveling.handleMessage(message);
      
      // Check for custom commands
      const prefix = '!'; // TODO: Make this configurable per guild
      
      if (message.content.startsWith(prefix)) {
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();
        
        // Check if this is a custom command
        const executed = await customCommands.executeCommand(
          message, 
          commandName, 
          args.join(' ')
        );
        
        if (executed) return; // Command was executed, don't process further
      }
      
      // Additional message processing can be added here
    } catch (error) {
      logger.error('Error handling messageCreate event:', error);
    }
  }
};