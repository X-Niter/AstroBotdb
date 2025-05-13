/**
 * Event Handler
 * Registers all Discord events
 */

const guildMemberEvents = require('./guild-member-events');
const messageEvents = require('./message-events');
const logger = require('../lib/logger');

/**
 * Register all events
 * @param {Client} client - The Discord client
 */
function registerAllEvents(client) {
  try {
    logger.info('Registering Discord events...');
    
    // Register guild member events
    guildMemberEvents.registerEvents(client);
    
    // Register message events
    messageEvents.registerEvents(client);
    
    // Register other event categories here
    
    logger.info('All events registered successfully');
  } catch (error) {
    logger.error('Error registering events:', error);
  }
}

module.exports = {
  registerAllEvents
};