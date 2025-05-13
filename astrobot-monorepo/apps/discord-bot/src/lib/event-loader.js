const fs = require('fs');
const path = require('path');
const logger = require('./logger');

/**
 * Load all event files from the events directory
 * @param {Client} client - The Discord client
 */
function loadEvents(client) {
  logger.info('Loading events...');
  
  const eventsPath = path.join(__dirname, '../events');
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  let eventCount = 0;
  
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    try {
      const event = require(filePath);
      
      // Validate event
      if (!event.name || !event.execute) {
        logger.warn(`Event at ${filePath} is missing required "name" or "execute" properties.`);
        continue;
      }
      
      // Register event with once or on
      if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
      } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
      }
      
      logger.debug(`Loaded event: ${event.name}`);
      eventCount++;
    } catch (error) {
      logger.error(`Error loading event at ${filePath}:`, error);
    }
  }
  
  logger.info(`Loaded ${eventCount} events`);
  return eventCount;
}

module.exports = {
  loadEvents
};