const axios = require('axios');
const logger = require('./logger');

// Cache for Twitch API token
let tokenCache = {
  accessToken: null,
  expiresAt: null
};

// Cache for live streamers to prevent duplicate notifications
const liveStreamers = new Map();

/**
 * Get an OAuth token for the Twitch API
 * @returns {Promise<string>} The access token
 */
async function getAccessToken() {
  try {
    // Check if token is still valid
    if (tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
      return tokenCache.accessToken;
    }

    // If token is missing or expired, fetch a new one
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing Twitch API credentials in environment variables');
    }

    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
    );

    const { access_token, expires_in } = response.data;
    
    // Cache the token
    tokenCache = {
      accessToken: access_token,
      expiresAt: Date.now() + (expires_in * 900) // 90% of the expiry time to be safe
    };

    return access_token;
  } catch (error) {
    logger.error('Error getting Twitch access token:', error);
    throw new Error('Failed to authenticate with Twitch API');
  }
}

/**
 * Get information about Twitch streamers
 * @param {string[]} usernames - Array of Twitch usernames
 * @returns {Promise<Array>} Array of streamer data
 */
async function getStreamers(usernames) {
  try {
    if (!usernames || usernames.length === 0) {
      return [];
    }

    const accessToken = await getAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID;

    // Prepare the user login query string
    const userQuery = usernames.map(name => `login=${name}`).join('&');
    
    // Get user data from Twitch API
    const response = await axios.get(
      `https://api.twitch.tv/helix/users?${userQuery}`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.data.data || [];
  } catch (error) {
    logger.error('Error fetching Twitch streamers:', error);
    return [];
  }
}

/**
 * Get live stream data for Twitch streamers
 * @param {string[]} userIds - Array of Twitch user IDs
 * @returns {Promise<Array>} Array of live stream data
 */
async function getLiveStreams(userIds) {
  try {
    if (!userIds || userIds.length === 0) {
      return [];
    }

    const accessToken = await getAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID;

    // Prepare the user ID query string
    const userQuery = userIds.map(id => `user_id=${id}`).join('&');
    
    // Get stream data from Twitch API
    const response = await axios.get(
      `https://api.twitch.tv/helix/streams?${userQuery}`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    return response.data.data || [];
  } catch (error) {
    logger.error('Error fetching Twitch streams:', error);
    return [];
  }
}

/**
 * Get game information by game ID
 * @param {string} gameId - Twitch game ID
 * @returns {Promise<object|null>} Game data or null if not found
 */
async function getGameInfo(gameId) {
  try {
    const accessToken = await getAccessToken();
    const clientId = process.env.TWITCH_CLIENT_ID;
    
    // Get game data from Twitch API
    const response = await axios.get(
      `https://api.twitch.tv/helix/games?id=${gameId}`,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const games = response.data.data || [];
    return games.length > 0 ? games[0] : null;
  } catch (error) {
    logger.error('Error fetching Twitch game info:', error);
    return null;
  }
}

/**
 * Check for live Twitch streams and return newly live streamers
 * @param {string[]} usernames - Array of Twitch usernames to check
 * @returns {Promise<Array>} Array of newly live stream data
 */
async function checkLiveStreams(usernames) {
  try {
    // Get user data for the streamers
    const streamers = await getStreamers(usernames);
    
    if (streamers.length === 0) {
      return [];
    }
    
    // Get user IDs
    const userIds = streamers.map(streamer => streamer.id);
    
    // Get live streams
    const liveStreams = await getLiveStreams(userIds);
    
    // Filter for newly live streams
    const newlyLive = [];
    
    for (const stream of liveStreams) {
      const streamerId = stream.user_id;
      const streamerLogin = stream.user_login;
      
      // Check if already tracked as live
      if (!liveStreamers.has(streamerId)) {
        // Add to live streamers cache with timestamp
        liveStreamers.set(streamerId, {
          startedAt: stream.started_at,
          title: stream.title,
          gameId: stream.game_id
        });
        
        // Find matching streamer data
        const streamerData = streamers.find(s => s.id === streamerId);
        
        // Add to newly live list
        newlyLive.push({
          ...stream,
          user_data: streamerData
        });
      }
    }
    
    // Check for streamers who went offline
    for (const [streamerId, data] of liveStreamers.entries()) {
      const stillLive = liveStreams.some(stream => stream.user_id === streamerId);
      
      if (!stillLive) {
        // Remove from live streamers cache
        liveStreamers.delete(streamerId);
      }
    }
    
    return newlyLive;
  } catch (error) {
    logger.error('Error checking live Twitch streams:', error);
    return [];
  }
}

/**
 * Schedule regular checks for Twitch streams
 * @param {Client} client - Discord client
 * @param {Map<string, object>} streamConfig - Map of guild configs for streams
 * @param {number} interval - Check interval in minutes
 */
function scheduleStreamChecks(client, streamConfig, interval = 5) {
  if (!streamConfig || streamConfig.size === 0) {
    logger.debug('No stream configurations, not scheduling checks');
    return;
  }
  
  logger.info(`Scheduling Twitch stream checks every ${interval} minutes`);
  
  // Function to check all configured streams
  const checkAllStreams = async () => {
    try {
      // Build a list of all unique streamers across all guilds
      const allStreamers = new Set();
      
      streamConfig.forEach(config => {
        if (config.streamers && Array.isArray(config.streamers)) {
          config.streamers.forEach(streamer => allStreamers.add(streamer.toLowerCase()));
        }
      });
      
      // Convert to array
      const streamerList = [...allStreamers];
      
      if (streamerList.length === 0) {
        return;
      }
      
      // Check for live streams
      const newlyLiveStreams = await checkLiveStreams(streamerList);
      
      if (newlyLiveStreams.length === 0) {
        return;
      }
      
      // Process each newly live stream
      for (const stream of newlyLiveStreams) {
        const streamerName = stream.user_login;
        
        // Find game info if available
        const gameInfo = stream.game_id ? await getGameInfo(stream.game_id) : null;
        
        // Notify all guilds that have this streamer configured
        streamConfig.forEach(async (config, guildId) => {
          if (!config.streamers || !config.streamers.some(s => s.toLowerCase() === streamerName.toLowerCase())) {
            return; // Skip if this guild doesn't follow this streamer
          }
          
          try {
            // Get the guild
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;
            
            // Get the notification channel
            const channelId = config.channelId;
            if (!channelId) return;
            
            const channel = guild.channels.cache.get(channelId);
            if (!channel || !channel.permissionsFor(guild.members.me).has('SendMessages')) {
              return;
            }
            
            // Create notification message
            const streamerDisplayName = stream.user_data.display_name || streamerName;
            const gameName = gameInfo ? gameInfo.name : 'Unknown Game';
            const thumbnailUrl = stream.thumbnail_url
              .replace('{width}', '1280')
              .replace('{height}', '720') + `?t=${Date.now()}`;
            
            // Send the notification
            await channel.send({
              content: config.message
                ? config.message
                    .replace('{streamer}', streamerDisplayName)
                    .replace('{game}', gameName)
                    .replace('{title}', stream.title)
                : `🔴 **${streamerDisplayName}** is now live on Twitch!`,
              embeds: [{
                color: 0x6441a5, // Twitch purple
                author: {
                  name: streamerDisplayName,
                  url: `https://twitch.tv/${streamerName}`,
                  icon_url: stream.user_data.profile_image_url
                },
                title: stream.title,
                url: `https://twitch.tv/${streamerName}`,
                description: `Playing **${gameName}** for ${stream.viewer_count} viewer${stream.viewer_count !== 1 ? 's' : ''}`,
                image: {
                  url: thumbnailUrl
                },
                footer: {
                  text: 'AstroBot Twitch Integration'
                },
                timestamp: new Date(stream.started_at)
              }]
            });
            
            logger.info(`Sent Twitch notification for ${streamerName} to ${guild.name} (${channel.name})`);
          } catch (error) {
            logger.error(`Error sending Twitch notification to guild ${guildId}:`, error);
          }
        });
      }
    } catch (error) {
      logger.error('Error in scheduled Twitch stream check:', error);
    }
  };
  
  // Run an initial check
  checkAllStreams();
  
  // Schedule regular checks
  setInterval(checkAllStreams, interval * 60 * 1000);
}

module.exports = {
  getStreamers,
  getLiveStreams,
  getGameInfo,
  checkLiveStreams,
  scheduleStreamChecks
};