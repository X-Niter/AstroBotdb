/**
 * Message Events
 * Handles events related to messages
 */

const { Events } = require('discord.js');
const levelManager = require('../lib/levels/level-manager');
const commandManager = require('../lib/custom-commands/command-manager');
const guildConfigManager = require('../lib/config/guild-config-manager');
const logger = require('../lib/logger');

/**
 * Register message events
 * @param {Client} client - The Discord client
 */
function registerEvents(client) {
  // Message create event
  client.on(Events.MessageCreate, async (message) => {
    try {
      // Skip if message is from a bot or in a DM
      if (message.author.bot || !message.guild) {
        return;
      }
      
      // Award XP for message
      await levelManager.awardXpForMessage(message);
      
      // Get guild-specific prefix
      const prefix = guildConfigManager.getCommandPrefix(message.guild.id);
      
      // Process custom commands
      await commandManager.processMessage(message, prefix);
      
      // Process auto responses
      await guildConfigManager.processAutoResponses(message);
      
    } catch (error) {
      logger.error(`Error handling message create for ${message.author.tag}:`, error);
    }
  });
  
  // Message update event
  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    try {
      // Skip if message is from a bot or in a DM
      if (newMessage.author?.bot || !newMessage.guild) {
        return;
      }
      
      // Only process commands if the content changed
      if (oldMessage.content !== newMessage.content) {
        // Get guild-specific prefix
        const prefix = guildConfigManager.getCommandPrefix(newMessage.guild.id);
        
        // Process custom commands on edited messages
        await commandManager.processMessage(newMessage, prefix);
        
        // Process auto responses on edited messages
        await guildConfigManager.processAutoResponses(newMessage);
      }
      
    } catch (error) {
      logger.error(`Error handling message update for ${newMessage.author?.tag || 'unknown user'}:`, error);
    }
  });
  
  // Message delete event
  client.on(Events.MessageDelete, async (message) => {
    try {
      // Skip if message is from a bot, in a DM, or if author is not cached
      if (message.author?.bot || !message.guild) {
        return;
      }
      
      // Process message deletions here if needed
      
    } catch (error) {
      logger.error(`Error handling message delete for ${message.author?.tag || 'unknown user'}:`, error);
    }
  });
}

module.exports = {
  registerEvents
};