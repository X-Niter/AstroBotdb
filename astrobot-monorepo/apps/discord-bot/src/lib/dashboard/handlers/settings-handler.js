/**
 * Settings API Handler
 * Handles requests for bot settings
 */

const logger = require('../../logger');
const ticketManager = require('../../tickets/ticket-manager');
const twitchManager = require('../../twitch/twitch-manager');
const youtubeManager = require('../../youtube/youtube-manager');

/**
 * Get settings for a specific module
 * @param {string} guildId - The guild ID
 * @param {string} module - The module name
 * @returns {Promise<Object>} The module settings
 */
async function getModuleSettings(guildId, module) {
  try {
    switch (module) {
      case 'tickets':
        return ticketManager.getGuildSettings(guildId);
        
      case 'twitch':
        return {
          streamers: twitchManager.listStreamers(guildId)
        };
        
      case 'youtube':
        return {
          channels: youtubeManager.listChannels(guildId)
        };
        
      // Add other modules here
        
      default:
        throw new Error(`Module "${module}" not found`);
    }
  } catch (error) {
    logger.error(`Error getting ${module} settings for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Update settings for a specific module
 * @param {string} guildId - The guild ID
 * @param {string} module - The module name
 * @param {Object} data - The new settings data
 * @returns {Promise<Object>} The updated settings
 */
async function updateModuleSettings(guildId, module, data) {
  try {
    switch (module) {
      case 'tickets':
        return await ticketManager.updateGuildSettings(guildId, data);
        
      case 'twitch': {
        // Handle twitch update operations
        const { action, streamerId, streamerData } = data;
        
        if (action === 'add' && streamerData) {
          return await twitchManager.addStreamer({
            ...streamerData,
            guildId
          });
        } else if (action === 'remove' && streamerId) {
          const success = await twitchManager.removeStreamer(guildId, streamerId);
          return { success };
        } else if (action === 'update' && streamerId && streamerData) {
          return await twitchManager.updateStreamer(guildId, streamerId, streamerData);
        } else {
          throw new Error('Invalid Twitch action');
        }
      }
        
      case 'youtube': {
        // Handle YouTube update operations
        const { action, channelId, channelData } = data;
        
        if (action === 'add' && channelData) {
          return await youtubeManager.addChannel({
            ...channelData,
            guildId
          });
        } else if (action === 'remove' && channelId) {
          const success = await youtubeManager.removeChannel(guildId, channelId);
          return { success };
        } else if (action === 'update' && channelId && channelData) {
          return await youtubeManager.updateChannel(guildId, channelId, channelData);
        } else {
          throw new Error('Invalid YouTube action');
        }
      }
        
      // Add other modules here
        
      default:
        throw new Error(`Module "${module}" not found`);
    }
  } catch (error) {
    logger.error(`Error updating ${module} settings for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Get all settings for a guild
 * @param {string} guildId - The guild ID
 * @returns {Promise<Object>} All guild settings
 */
async function getAllSettings(guildId) {
  try {
    // Get all module settings
    const [tickets, twitch, youtube] = await Promise.all([
      getModuleSettings(guildId, 'tickets').catch(err => ({ error: err.message })),
      getModuleSettings(guildId, 'twitch').catch(err => ({ error: err.message })),
      getModuleSettings(guildId, 'youtube').catch(err => ({ error: err.message }))
    ]);
    
    return {
      tickets,
      twitch,
      youtube
      // Add other modules here
    };
  } catch (error) {
    logger.error(`Error getting all settings for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Handle requests for settings
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
async function handleSettingsRequest(req, res) {
  try {
    // Check if guild ID is provided
    const guildId = req.params.guildId;
    
    if (!guildId) {
      return res.status(400).json({ error: 'Guild ID is required' });
    }
    
    // Check if client is available
    const client = req.discordClient;
    
    if (!client) {
      return res.status(500).json({ error: 'Discord client not available' });
    }
    
    // Check if guild exists
    try {
      await client.guilds.fetch(guildId);
    } catch (error) {
      return res.status(404).json({ error: 'Guild not found' });
    }
    
    // Handle GET request (get settings)
    if (req.method === 'GET') {
      try {
        // Check if specific module is requested
        const module = req.query.module;
        
        if (module) {
          const settings = await getModuleSettings(guildId, module);
          return res.json(settings);
        }
        
        // Get all settings
        const settings = await getAllSettings(guildId);
        return res.json(settings);
      } catch (error) {
        logger.error(`Error handling GET settings for guild ${guildId}:`, error);
        return res.status(400).json({ error: error.message });
      }
    }
    
    // Handle POST/PUT requests (update settings)
    if (req.method === 'POST' || req.method === 'PUT') {
      try {
        // Check if module and data are provided
        const { module, data } = req.body;
        
        if (!module || !data) {
          return res.status(400).json({ error: 'Module and data are required' });
        }
        
        // Update settings
        const updatedSettings = await updateModuleSettings(guildId, module, data);
        return res.json(updatedSettings);
      } catch (error) {
        logger.error(`Error handling ${req.method} settings for guild ${guildId}:`, error);
        return res.status(400).json({ error: error.message });
      }
    }
    
    // Handle unsupported methods
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    logger.error('Error handling settings request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  handleSettingsRequest
};