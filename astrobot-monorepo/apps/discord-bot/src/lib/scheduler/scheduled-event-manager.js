/**
 * Scheduled Event Manager
 * Handles scheduled announcements and recurring events
 */

const { Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const cron = require('node-cron');
const logger = require('../logger');
const guildConfigManager = require('../config/guild-config-manager');

// Path to scheduled events file
const EVENTS_FILE = path.join(process.cwd(), 'data', 'scheduled-events.json');

// Collection of scheduled jobs
const scheduledJobs = new Collection();

// Collection of scheduled events data
const scheduledEvents = new Collection();

/**
 * Initialize the scheduled event manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing scheduled event manager...');
    
    // Load scheduled events
    await loadEvents();
    
    // Schedule all events
    scheduleAllEvents();
    
    logger.info('Scheduled event manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing scheduled event manager:', error);
    return false;
  }
}

/**
 * Load scheduled events from disk
 * @returns {Promise<void>}
 */
async function loadEvents() {
  try {
    // Clear collection
    scheduledEvents.clear();
    
    // Check if file exists
    try {
      await fs.access(EVENTS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveEvents();
      return;
    }
    
    // Read file
    const data = await fs.readFile(EVENTS_FILE, 'utf8');
    
    // Parse JSON
    const events = JSON.parse(data);
    
    // Load events
    for (const event of events) {
      scheduledEvents.set(event.id, event);
    }
    
    logger.debug(`Loaded ${scheduledEvents.size} scheduled events from disk`);
  } catch (error) {
    logger.error('Error loading scheduled events:', error);
    throw error;
  }
}

/**
 * Save scheduled events to disk
 * @returns {Promise<void>}
 */
async function saveEvents() {
  try {
    // Create data array
    const events = Array.from(scheduledEvents.values());
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(EVENTS_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(EVENTS_FILE, JSON.stringify(events, null, 2));
    
    logger.debug('Scheduled events saved to disk');
  } catch (error) {
    logger.error('Error saving scheduled events:', error);
    throw error;
  }
}

/**
 * Schedule all events
 */
function scheduleAllEvents() {
  // Clear existing jobs
  for (const [id, job] of scheduledJobs.entries()) {
    job.stop();
    scheduledJobs.delete(id);
  }
  
  // Schedule new jobs
  for (const [id, event] of scheduledEvents.entries()) {
    if (event.enabled) {
      scheduleEvent(event);
    }
  }
  
  logger.debug(`Scheduled ${scheduledJobs.size} events`);
}

/**
 * Schedule a single event
 * @param {Object} event - The event to schedule
 */
function scheduleEvent(event) {
  try {
    // Skip if already scheduled
    if (scheduledJobs.has(event.id)) {
      scheduledJobs.get(event.id).stop();
      scheduledJobs.delete(event.id);
    }
    
    // Parse schedule
    let cronExpression;
    
    if (event.type === 'cron') {
      // Use cron expression directly
      cronExpression = event.schedule;
    } else if (event.type === 'recurring') {
      // Convert recurring schedule to cron
      cronExpression = convertRecurringToCron(event.schedule);
    } else {
      // One-time event, use cron to schedule it once
      const date = new Date(event.schedule.timestamp);
      cronExpression = `${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;
    }
    
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      logger.error(`Invalid cron expression for event ${event.id}: ${cronExpression}`);
      return;
    }
    
    // Create job
    const job = cron.schedule(cronExpression, async () => {
      try {
        // Execute event
        await executeEvent(event);
        
        // Handle one-time events
        if (event.type === 'one-time') {
          // Disable event after execution
          event.enabled = false;
          scheduledEvents.set(event.id, event);
          await saveEvents();
          
          // Stop the job
          job.stop();
          scheduledJobs.delete(event.id);
        }
      } catch (error) {
        logger.error(`Error executing scheduled event ${event.id}:`, error);
      }
    }, {
      scheduled: true,
      timezone: event.timezone
    });
    
    // Store job
    scheduledJobs.set(event.id, job);
  } catch (error) {
    logger.error(`Error scheduling event ${event.id}:`, error);
  }
}

/**
 * Convert recurring schedule to cron expression
 * @param {Object} schedule - The recurring schedule
 * @returns {string} The cron expression
 */
function convertRecurringToCron(schedule) {
  let cronExpression = '* * * * *'; // Default to every minute
  
  try {
    // Parse interval
    switch (schedule.interval) {
      case 'minutely':
        cronExpression = `*/${schedule.value} * * * *`;
        break;
        
      case 'hourly':
        cronExpression = `${schedule.minute} */${schedule.value} * * *`;
        break;
        
      case 'daily':
        cronExpression = `${schedule.minute} ${schedule.hour} */${schedule.value} * *`;
        break;
        
      case 'weekly':
        // Convert day names to numbers (0-6, Sunday to Saturday)
        const dayNum = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          .indexOf(schedule.day.toLowerCase());
        
        if (dayNum >= 0) {
          cronExpression = `${schedule.minute} ${schedule.hour} * * ${dayNum}`;
        }
        break;
        
      case 'monthly':
        cronExpression = `${schedule.minute} ${schedule.hour} ${schedule.date} * *`;
        break;
    }
    
    return cronExpression;
  } catch (error) {
    logger.error('Error converting recurring schedule to cron:', error);
    return '0 0 1 1 *'; // Default to once a year as fallback
  }
}

/**
 * Execute a scheduled event
 * @param {Object} event - The event to execute
 */
async function executeEvent(event) {
  try {
    logger.info(`Executing scheduled event ${event.id}: ${event.name}`);
    
    // Get client instance from the first guild's channels cache
    const guild = await global.client.guilds.fetch(event.guildId).catch(() => null);
    
    // Skip if guild not found
    if (!guild) {
      logger.error(`Guild ${event.guildId} not found for event ${event.id}`);
      return;
    }
    
    // Get channel
    const channel = await guild.channels.fetch(event.channelId).catch(() => null);
    
    // Skip if channel not found
    if (!channel) {
      logger.error(`Channel ${event.channelId} not found for event ${event.id}`);
      return;
    }
    
    // Skip if channel is not text-based
    if (!channel.isTextBased() || channel.isVoiceBased()) {
      logger.error(`Channel ${event.channelId} is not text-based for event ${event.id}`);
      return;
    }
    
    // Prepare content and embeds
    let content = event.content || null;
    let embeds = [];
    
    // Create embed if message type is embed
    if (event.messageType === 'embed' && event.embedOptions) {
      const embed = new EmbedBuilder()
        .setColor(event.embedOptions.color || '#5865F2')
        .setTitle(event.embedOptions.title || event.name);
      
      if (event.embedOptions.description) {
        embed.setDescription(event.embedOptions.description);
      }
      
      if (event.embedOptions.footer) {
        embed.setFooter({ text: event.embedOptions.footer });
      }
      
      if (event.embedOptions.timestamp) {
        embed.setTimestamp();
      }
      
      embeds.push(embed);
    }
    
    // Send message
    await channel.send({
      content,
      embeds: embeds.length > 0 ? embeds : undefined,
      allowedMentions: {
        parse: event.allowMentions ? ['everyone', 'roles', 'users'] : []
      }
    });
    
    logger.info(`Successfully executed scheduled event ${event.id}`);
  } catch (error) {
    logger.error(`Error executing scheduled event ${event.id}:`, error);
    throw error;
  }
}

/**
 * Create a new scheduled event
 * @param {Object} eventData - The event data
 * @returns {Promise<Object>} The created event
 */
async function createEvent(eventData) {
  try {
    // Generate ID
    const id = Date.now().toString();
    
    // Create event
    const event = {
      id,
      guildId: eventData.guildId,
      channelId: eventData.channelId,
      name: eventData.name,
      type: eventData.type || 'one-time', // one-time, recurring, cron
      timezone: eventData.timezone || guildConfigManager.getGuildConfig(eventData.guildId).timezone || 'UTC',
      schedule: eventData.schedule,
      content: eventData.content,
      messageType: eventData.messageType || 'text', // text, embed
      embedOptions: eventData.embedOptions || null,
      allowMentions: eventData.allowMentions !== false,
      enabled: eventData.enabled !== false,
      createdAt: new Date().toISOString(),
      createdBy: eventData.createdBy,
      lastUpdated: new Date().toISOString()
    };
    
    // Add to collection
    scheduledEvents.set(id, event);
    
    // Save to disk
    await saveEvents();
    
    // Schedule the event
    if (event.enabled) {
      scheduleEvent(event);
    }
    
    return event;
  } catch (error) {
    logger.error('Error creating scheduled event:', error);
    throw error;
  }
}

/**
 * Get an event by ID
 * @param {string} id - The event ID
 * @returns {Object} The event
 */
function getEvent(id) {
  return scheduledEvents.get(id);
}

/**
 * Update an existing event
 * @param {string} id - The event ID
 * @param {Object} updates - The updates to apply
 * @returns {Promise<Object>} The updated event
 */
async function updateEvent(id, updates) {
  try {
    // Get current event
    const event = scheduledEvents.get(id);
    
    // Check if event exists
    if (!event) {
      throw new Error(`Event ${id} not found`);
    }
    
    // Apply updates
    const updatedEvent = {
      ...event,
      ...updates,
      id, // Ensure ID doesn't change
      lastUpdated: new Date().toISOString()
    };
    
    // Update in collection
    scheduledEvents.set(id, updatedEvent);
    
    // Save to disk
    await saveEvents();
    
    // Reschedule the event
    if (updatedEvent.enabled) {
      scheduleEvent(updatedEvent);
    } else if (scheduledJobs.has(id)) {
      // Stop the job if event is disabled
      scheduledJobs.get(id).stop();
      scheduledJobs.delete(id);
    }
    
    return updatedEvent;
  } catch (error) {
    logger.error(`Error updating event ${id}:`, error);
    throw error;
  }
}

/**
 * Delete an event
 * @param {string} id - The event ID
 * @returns {Promise<boolean>} Whether deletion was successful
 */
async function deleteEvent(id) {
  try {
    // Check if event exists
    if (!scheduledEvents.has(id)) {
      return false;
    }
    
    // Remove from collection
    scheduledEvents.delete(id);
    
    // Save to disk
    await saveEvents();
    
    // Stop the job
    if (scheduledJobs.has(id)) {
      scheduledJobs.get(id).stop();
      scheduledJobs.delete(id);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error deleting event ${id}:`, error);
    throw error;
  }
}

/**
 * Get all events for a guild
 * @param {string} guildId - The guild ID
 * @returns {Array} The events
 */
function getGuildEvents(guildId) {
  return Array.from(scheduledEvents.values())
    .filter(event => event.guildId === guildId);
}

/**
 * Check if a cron expression is valid
 * @param {string} cronExpression - The cron expression to validate
 * @returns {boolean} Whether the expression is valid
 */
function isValidCronExpression(cronExpression) {
  return cron.validate(cronExpression);
}

module.exports = {
  initialize,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  getGuildEvents,
  isValidCronExpression
};