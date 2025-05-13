/**
 * YouTube RSS Feed Parser
 * Uses RSS feeds to get YouTube channel updates without API quota limits
 */

const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const logger = require('../logger');

// YouTube RSS feed URL format
const YOUTUBE_RSS_URL = 'https://www.youtube.com/feeds/videos.xml';

/**
 * Get the RSS feed URL for a YouTube channel
 * @param {string} channelType - Type of channel identifier ('channel', 'user', or 'id')
 * @param {string} channelId - The channel identifier
 * @returns {string} The RSS feed URL
 */
function getRssFeedUrl(channelType, channelId) {
  switch (channelType) {
    case 'channel':
      return `${YOUTUBE_RSS_URL}?channel_id=${channelId}`;
    case 'user':
      return `${YOUTUBE_RSS_URL}?user=${channelId}`;
    case 'id':
      return `${YOUTUBE_RSS_URL}?playlist_id=UU${channelId.substring(2)}`;
    default:
      throw new Error(`Invalid channel type: ${channelType}`);
  }
}

/**
 * Get the latest videos from a YouTube channel using RSS
 * @param {string} channelType - Type of channel identifier ('channel', 'user', or 'id')
 * @param {string} channelId - The channel identifier
 * @param {number} limit - Maximum number of videos to retrieve
 * @returns {Promise<Array<Object>>} Array of video data
 */
async function getLatestVideos(channelType, channelId, limit = 10) {
  try {
    // Get RSS feed URL
    const feedUrl = getRssFeedUrl(channelType, channelId);
    
    // Fetch RSS feed
    const response = await axios.get(feedUrl);
    
    // Parse XML to JSON
    const result = await parseStringPromise(response.data, {
      explicitArray: false,
      ignoreAttrs: false
    });
    
    // Check if feed has entries
    if (!result.feed || !result.feed.entry) {
      return [];
    }
    
    // Normalize to array even if there's only one entry
    const entries = Array.isArray(result.feed.entry) ? result.feed.entry : [result.feed.entry];
    
    // Extract channel info
    const channelInfo = {
      title: result.feed.title?._,
      id: result.feed['yt:channelId'],
      author: result.feed.author?.name,
      link: result.feed.author?.uri
    };
    
    // Transform entries to video objects
    const videos = entries
      .slice(0, limit)
      .map(entry => {
        // Get video ID from yt:videoId or from media:group
        const videoId = entry['yt:videoId'] || 
                      (entry['media:group'] && entry['media:group']['yt:videoId']);
        
        // Get video thumbnail
        let thumbnailUrl = null;
        
        if (entry['media:group'] && entry['media:group']['media:thumbnail']) {
          thumbnailUrl = entry['media:group']['media:thumbnail']['$']?.url;
        }
        
        if (!thumbnailUrl && videoId) {
          // Default YouTube thumbnail URL
          thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }
        
        return {
          id: videoId,
          title: entry.title?._,
          link: entry.link?.$?.href || `https://www.youtube.com/watch?v=${videoId}`,
          author: entry.author?.name,
          publishedAt: new Date(entry.published),
          updatedAt: new Date(entry.updated),
          thumbnail: thumbnailUrl,
          description: entry['media:group']?.['media:description']?._,
          channel: channelInfo
        };
      });
    
    return videos;
  } catch (error) {
    logger.error(`Error fetching YouTube RSS feed for ${channelType}/${channelId}:`, error.message);
    throw error;
  }
}

/**
 * Check if a channel ID is valid and get its RSS feed
 * @param {string} channelId - The channel ID, username, or URL to check
 * @returns {Promise<Object>} Channel information and correct identifier type
 */
async function validateChannel(channelId) {
  try {
    // Handle different formats of channel identifiers
    
    // Format 1: Full URL (extract ID)
    if (channelId.includes('youtube.com') || channelId.includes('youtu.be')) {
      // Extract channel ID from URL
      let url = new URL(channelId);
      
      // Channel URL: youtube.com/channel/UC...
      if (url.pathname.includes('/channel/')) {
        const id = url.pathname.split('/channel/')[1].split('/')[0];
        return await tryChannelId('channel', id);
      }
      
      // User URL: youtube.com/user/username
      if (url.pathname.includes('/user/')) {
        const username = url.pathname.split('/user/')[1].split('/')[0];
        return await tryChannelId('user', username);
      }
      
      // Custom URL: youtube.com/c/customname
      if (url.pathname.includes('/c/')) {
        const customName = url.pathname.split('/c/')[1].split('/')[0];
        return await tryChannelId('user', customName);
      }
      
      // Handle @username format: youtube.com/@username
      if (url.pathname.includes('/@')) {
        const username = url.pathname.split('/@')[1].split('/')[0];
        return await tryChannelId('user', username);
      }
    }
    
    // Format 2: Channel ID directly
    if (channelId.startsWith('UC')) {
      return await tryChannelId('channel', channelId);
    }
    
    // Format 3: Username directly
    return await tryChannelId('user', channelId);
  } catch (error) {
    logger.error(`Error validating YouTube channel ${channelId}:`, error.message);
    throw new Error(`Could not validate YouTube channel: ${error.message}`);
  }
}

/**
 * Try to get a channel's RSS feed using a specific identifier type
 * @param {string} type - Type of identifier ('channel' or 'user')
 * @param {string} id - The identifier
 * @returns {Promise<Object>} Channel information and type
 */
async function tryChannelId(type, id) {
  try {
    // Get RSS feed URL
    const feedUrl = getRssFeedUrl(type, id);
    
    // Fetch RSS feed
    const response = await axios.get(feedUrl);
    
    // Parse XML to JSON
    const result = await parseStringPromise(response.data, {
      explicitArray: false,
      ignoreAttrs: false
    });
    
    // Check if feed exists and has required data
    if (!result.feed || !result.feed.title) {
      throw new Error('Invalid RSS feed');
    }
    
    // Extract channel info
    return {
      title: result.feed.title?._,
      id: result.feed['yt:channelId'],
      author: result.feed.author?.name,
      link: result.feed.author?.uri,
      type,
      identifier: id
    };
  } catch (error) {
    // If it's a 404, the channel doesn't exist or the identifier is invalid
    if (error.response && error.response.status === 404) {
      throw new Error(`YouTube channel not found with ${type} ${id}`);
    }
    
    throw error;
  }
}

module.exports = {
  getLatestVideos,
  validateChannel
};