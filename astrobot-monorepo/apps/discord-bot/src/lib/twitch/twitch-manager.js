/**
 * Twitch Manager
 * Handles Twitch streamer tracking and live notifications
 */

const { Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const logger = require('../logger');

// Path to Twitch tracking file
const TWITCH_TRACKING_FILE = path.join(process.cwd(), 'data', 'twitch-tracking.json');

// Collection of tracked Twitch channels (guildId -> { channels: [], streamers: [] })
const trackedStreamers = new Collection();

// Cache of live status for each streamer
const streamerStatusCache = new Collection();

// Polling interval (in ms)
const POLLING_INTERVAL = 2 * 60 * 1000; // 2 minutes (Twitch rate limits are stricter)

// Polling timer
let pollingTimer = null;

// Twitch API credentials
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID || null;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET || null;

// Twitch API access token
let accessToken = null;
let tokenExpiry = null;

/**
 * Initialize Twitch manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing Twitch manager...');
    
    // Load tracked streamers
    await loadTrackedStreamers();
    
    // Check if Twitch API credentials are configured
    if (TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET) {
      // Get initial access token
      await getAccessToken();
      
      // Start polling
      startPolling();
      
      logger.info('Twitch polling started');
    } else {
      logger.warn('Twitch API credentials not found. Twitch tracking is disabled.');
    }
    
    logger.info('Twitch manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing Twitch manager:', error);
    return false;
  }
}

/**
 * Shutdown Twitch manager
 */
function shutdown() {
  try {
    logger.info('Shutting down Twitch manager...');
    
    // Stop polling
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
    
    logger.info('Twitch manager shut down successfully');
  } catch (error) {
    logger.error('Error shutting down Twitch manager:', error);
  }
}

/**
 * Load tracked streamers from disk
 * @returns {Promise<void>}
 */
async function loadTrackedStreamers() {
  try {
    // Clear collection
    trackedStreamers.clear();
    
    // Check if file exists
    try {
      await fs.access(TWITCH_TRACKING_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveTrackedStreamers();
      return;
    }
    
    // Read file
    const data = await fs.readFile(TWITCH_TRACKING_FILE, 'utf8');
    
    // Parse JSON
    const parsed = JSON.parse(data);
    
    // Load tracked streamers
    for (const [guildId, config] of Object.entries(parsed)) {
      trackedStreamers.set(guildId, config);
    }
    
    logger.debug('Tracked Twitch streamers loaded from disk');
  } catch (error) {
    logger.error('Error loading tracked Twitch streamers:', error);
    throw error;
  }
}

/**
 * Save tracked streamers to disk
 * @returns {Promise<void>}
 */
async function saveTrackedStreamers() {
  try {
    // Create data object
    const data = {};
    
    for (const [guildId, config] of trackedStreamers.entries()) {
      data[guildId] = config;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(TWITCH_TRACKING_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(TWITCH_TRACKING_FILE, JSON.stringify(data, null, 2));
    
    logger.debug('Tracked Twitch streamers saved to disk');
  } catch (error) {
    logger.error('Error saving tracked Twitch streamers:', error);
    throw error;
  }
}

/**
 * Get Twitch API access token
 * @returns {Promise<string>} The access token
 */
async function getAccessToken() {
  try {
    // Check if we have a valid token
    if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
      return accessToken;
    }
    
    // Check if credentials are configured
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
      throw new Error('Twitch API credentials not configured');
    }
    
    // Get new token
    const response = await axios.post(
      'https://id.twitch.tv/oauth2/token',
      `client_id=${TWITCH_CLIENT_ID}&client_secret=${TWITCH_CLIENT_SECRET}&grant_type=client_credentials`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Save token and expiry
    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 300000; // Subtract 5 minutes for safety
    
    logger.debug('Twitch API access token obtained');
    
    return accessToken;
  } catch (error) {
    logger.error('Error getting Twitch API access token:', error);
    throw error;
  }
}

/**
 * Start polling for Twitch updates
 */
function startPolling() {
  // Clear existing timer
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }
  
  // Check immediately on startup
  checkForUpdates();
  
  // Set timer for periodic checks
  pollingTimer = setInterval(checkForUpdates, POLLING_INTERVAL);
  
  logger.debug('Twitch polling started');
}

/**
 * Check for updates from tracked Twitch streamers
 */
async function checkForUpdates() {
  try {
    logger.debug('Checking for Twitch updates...');
    
    // Skip if no Twitch API credentials
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
      logger.warn('Twitch API credentials not found. Twitch tracking is disabled.');
      return;
    }
    
    // Get all unique streamers across all guilds
    const uniqueStreamers = new Set();
    
    for (const [_, config] of trackedStreamers.entries()) {
      for (const streamer of config.streamers) {
        uniqueStreamers.add(streamer);
      }
    }
    
    // Skip if no streamers to check
    if (uniqueStreamers.size === 0) {
      return;
    }
    
    // Check streamers in batches (Twitch API limits)
    const streamerArray = Array.from(uniqueStreamers);
    const batchSize = 100; // Twitch API limit
    
    for (let i = 0; i < streamerArray.length; i += batchSize) {
      const batch = streamerArray.slice(i, i + batchSize);
      await checkStreamersBatch(batch);
    }
  } catch (error) {
    logger.error('Error checking for Twitch updates:', error);
  }
}

/**
 * Check a batch of streamers for updates
 * @param {Array<string>} streamers - The streamers to check
 */
async function checkStreamersBatch(streamers) {
  try {
    // Get streams
    const streams = await fetchStreams(streamers);
    
    // Process each streamer
    for (const streamer of streamers) {
      try {
        const stream = streams.find(s => s.user_login.toLowerCase() === streamer.toLowerCase());
        
        // Get previous status
        const prevStatus = streamerStatusCache.get(streamer) || {
          isLive: false,
          title: null,
          game: null,
          viewers: 0,
          thumbnailUrl: null,
          startedAt: null
        };
        
        // Current status
        const currentStatus = {
          isLive: !!stream,
          title: stream ? stream.title : null,
          game: stream ? stream.game_name : null,
          viewers: stream ? stream.viewer_count : 0,
          thumbnailUrl: stream ? stream.thumbnail_url.replace('{width}', '640').replace('{height}', '360') : null,
          startedAt: stream ? stream.started_at : null
        };
        
        // Check if went live
        if (currentStatus.isLive && !prevStatus.isLive) {
          await sendLiveNotification(streamer, currentStatus);
        }
        
        // Check if title or game changed while live
        if (currentStatus.isLive && prevStatus.isLive &&
            (currentStatus.title !== prevStatus.title || currentStatus.game !== prevStatus.game)) {
          await sendUpdateNotification(streamer, currentStatus, prevStatus);
        }
        
        // Save current status
        streamerStatusCache.set(streamer, currentStatus);
      } catch (error) {
        logger.error(`Error processing Twitch streamer ${streamer}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error checking Twitch streamers batch:', error);
    throw error;
  }
}

/**
 * Fetch streams for streamers
 * @param {Array<string>} streamers - The streamers to fetch
 * @returns {Promise<Array>} The streams
 */
async function fetchStreams(streamers) {
  try {
    // Get access token
    const token = await getAccessToken();
    
    // Create user_login query params
    const userParams = streamers.map(s => `user_login=${s}`).join('&');
    
    // Call Twitch API to get streams
    const response = await axios.get(
      `https://api.twitch.tv/helix/streams?${userParams}`,
      {
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data.data || [];
  } catch (error) {
    if (error.response) {
      logger.error(`Twitch API error (${error.response.status}):`, error.response.data);
      
      // Handle expired token
      if (error.response.status === 401) {
        // Clear token to force refresh
        accessToken = null;
        tokenExpiry = null;
      }
    } else {
      logger.error('Error fetching Twitch streams:', error);
    }
    
    throw error;
  }
}

/**
 * Send live notification for a streamer
 * @param {string} streamer - The streamer name
 * @param {Object} status - The stream status
 */
async function sendLiveNotification(streamer, status) {
  try {
    logger.info(`Twitch streamer ${streamer} went live`);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#6441a5') // Twitch purple
      .setTitle(`${streamer} is now live on Twitch!`)
      .setURL(`https://twitch.tv/${streamer}`)
      .setDescription(status.title)
      .addFields(
        { name: 'Game', value: status.game || 'Unknown', inline: true },
        { name: 'Viewers', value: status.viewers.toString(), inline: true }
      )
      .setImage(status.thumbnailUrl)
      .setFooter({ text: 'Twitch', iconURL: 'https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png' })
      .setTimestamp(new Date(status.startedAt));
    
    // Find all guilds tracking this streamer
    for (const [guildId, config] of trackedStreamers.entries()) {
      // Skip if guild isn't tracking this streamer
      if (!config.streamers.includes(streamer)) {
        continue;
      }
      
      // Send notification to all channels in the guild
      for (const channelId of config.channels) {
        try {
          // Get channel
          const channel = await global.client.channels.fetch(channelId).catch(() => null);
          
          // Skip if channel not found
          if (!channel) {
            logger.error(`Channel ${channelId} not found for Twitch notification in guild ${guildId}`);
            continue;
          }
          
          // Skip if channel is not text-based
          if (!channel.isTextBased() || channel.isVoiceBased()) {
            logger.error(`Channel ${channelId} is not text-based for Twitch notification in guild ${guildId}`);
            continue;
          }
          
          // Send notification
          await channel.send({
            content: `🔴 **${streamer}** is now live on Twitch!`,
            embeds: [embed]
          });
        } catch (error) {
          logger.error(`Error sending Twitch notification to channel ${channelId} in guild ${guildId}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error(`Error sending live notification for ${streamer}:`, error);
  }
}

/**
 * Send update notification for a streamer
 * @param {string} streamer - The streamer name
 * @param {Object} currentStatus - The current stream status
 * @param {Object} prevStatus - The previous stream status
 */
async function sendUpdateNotification(streamer, currentStatus, prevStatus) {
  try {
    logger.info(`Twitch streamer ${streamer} updated stream info`);
    
    // What changed?
    const titleChanged = currentStatus.title !== prevStatus.title;
    const gameChanged = currentStatus.game !== prevStatus.game;
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#6441a5') // Twitch purple
      .setTitle(`${streamer} updated their stream`)
      .setURL(`https://twitch.tv/${streamer}`)
      .setFooter({ text: 'Twitch', iconURL: 'https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png' })
      .setTimestamp();
    
    // Add fields based on what changed
    if (titleChanged) {
      embed.addFields({ name: 'New Title', value: currentStatus.title || 'Unknown' });
    }
    
    if (gameChanged) {
      embed.addFields({ 
        name: 'Changed Game', 
        value: `${prevStatus.game || 'Unknown'} ➡️ ${currentStatus.game || 'Unknown'}` 
      });
    }
    
    embed.addFields({ name: 'Current Viewers', value: currentStatus.viewers.toString(), inline: true });
    
    // Find all guilds tracking this streamer
    for (const [guildId, config] of trackedStreamers.entries()) {
      // Skip if guild isn't tracking this streamer
      if (!config.streamers.includes(streamer)) {
        continue;
      }
      
      // Skip update notification if guild has disabled it
      if (config.disableUpdates) {
        continue;
      }
      
      // Send notification to all channels in the guild
      for (const channelId of config.channels) {
        try {
          // Get channel
          const channel = await global.client.channels.fetch(channelId).catch(() => null);
          
          // Skip if channel not found
          if (!channel) {
            logger.error(`Channel ${channelId} not found for Twitch notification in guild ${guildId}`);
            continue;
          }
          
          // Skip if channel is not text-based
          if (!channel.isTextBased() || channel.isVoiceBased()) {
            logger.error(`Channel ${channelId} is not text-based for Twitch notification in guild ${guildId}`);
            continue;
          }
          
          // Send notification
          await channel.send({ embeds: [embed] });
        } catch (error) {
          logger.error(`Error sending Twitch update notification to channel ${channelId} in guild ${guildId}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error(`Error sending update notification for ${streamer}:`, error);
  }
}

/**
 * Track a Twitch streamer for a guild
 * @param {string} guildId - The guild ID
 * @param {string} channelId - The channel ID to send notifications to
 * @param {string} streamer - The Twitch username
 * @param {boolean} disableUpdates - Whether to disable update notifications
 * @returns {Promise<Object>} The updated tracking config
 */
async function trackStreamer(guildId, channelId, streamer, disableUpdates = false) {
  try {
    // Normalize streamer name (lowercase)
    streamer = streamer.toLowerCase();
    
    // Get current config or create new one
    const config = trackedStreamers.get(guildId) || {
      channels: [],
      streamers: [],
      disableUpdates: disableUpdates
    };
    
    // Add channel if it doesn't exist
    if (!config.channels.includes(channelId)) {
      config.channels.push(channelId);
    }
    
    // Add streamer if it doesn't exist
    if (!config.streamers.includes(streamer)) {
      config.streamers.push(streamer);
    }
    
    // Update disableUpdates setting
    config.disableUpdates = disableUpdates;
    
    // Update collection
    trackedStreamers.set(guildId, config);
    
    // Save to disk
    await saveTrackedStreamers();
    
    return config;
  } catch (error) {
    logger.error(`Error tracking Twitch streamer ${streamer} for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Untrack a Twitch streamer for a guild
 * @param {string} guildId - The guild ID
 * @param {string} streamer - The Twitch username
 * @returns {Promise<Object>} The updated tracking config
 */
async function untrackStreamer(guildId, streamer) {
  try {
    // Normalize streamer name (lowercase)
    streamer = streamer.toLowerCase();
    
    // Get current config
    const config = trackedStreamers.get(guildId);
    
    // Skip if no config exists
    if (!config) {
      return null;
    }
    
    // Remove streamer
    config.streamers = config.streamers.filter(s => s !== streamer);
    
    // Update collection
    trackedStreamers.set(guildId, config);
    
    // Save to disk
    await saveTrackedStreamers();
    
    return config;
  } catch (error) {
    logger.error(`Error untracking Twitch streamer ${streamer} for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Get all tracked streamers for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The tracking config
 */
function getTrackedStreamers(guildId) {
  return trackedStreamers.get(guildId) || {
    channels: [],
    streamers: [],
    disableUpdates: false
  };
}

/**
 * Set notification channels for a guild
 * @param {string} guildId - The guild ID
 * @param {Array<string>} channelIds - The channel IDs
 * @returns {Promise<Object>} The updated tracking config
 */
async function setNotificationChannels(guildId, channelIds) {
  try {
    // Get current config or create new one
    const config = trackedStreamers.get(guildId) || {
      channels: [],
      streamers: [],
      disableUpdates: false
    };
    
    // Update channels
    config.channels = channelIds;
    
    // Update collection
    trackedStreamers.set(guildId, config);
    
    // Save to disk
    await saveTrackedStreamers();
    
    return config;
  } catch (error) {
    logger.error(`Error setting notification channels for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Set update notification preference
 * @param {string} guildId - The guild ID
 * @param {boolean} disableUpdates - Whether to disable update notifications
 * @returns {Promise<Object>} The updated tracking config
 */
async function setUpdatePreference(guildId, disableUpdates) {
  try {
    // Get current config or create new one
    const config = trackedStreamers.get(guildId) || {
      channels: [],
      streamers: [],
      disableUpdates: false
    };
    
    // Update setting
    config.disableUpdates = disableUpdates;
    
    // Update collection
    trackedStreamers.set(guildId, config);
    
    // Save to disk
    await saveTrackedStreamers();
    
    return config;
  } catch (error) {
    logger.error(`Error setting update preference for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Check if a Twitch streamer exists
 * @param {string} streamer - The Twitch username
 * @returns {Promise<boolean>} Whether the streamer exists
 */
async function checkStreamerExists(streamer) {
  try {
    // Skip if no Twitch API credentials
    if (!TWITCH_CLIENT_ID || !TWITCH_CLIENT_SECRET) {
      throw new Error('Twitch API credentials not configured. Please contact the bot administrator.');
    }
    
    // Get access token
    const token = await getAccessToken();
    
    // Call Twitch API to get user
    const response = await axios.get(
      `https://api.twitch.tv/helix/users?login=${streamer}`,
      {
        headers: {
          'Client-ID': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data.data && response.data.data.length > 0;
  } catch (error) {
    logger.error(`Error checking if Twitch streamer ${streamer} exists:`, error);
    throw error;
  }
}

/**
 * Check if Twitch API is configured correctly
 * @returns {boolean} Whether the API is configured
 */
function isTwitchApiConfigured() {
  return !!(TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET);
}

module.exports = {
  initialize,
  shutdown,
  trackStreamer,
  untrackStreamer,
  getTrackedStreamers,
  setNotificationChannels,
  setUpdatePreference,
  checkStreamerExists,
  isTwitchApiConfigured
};