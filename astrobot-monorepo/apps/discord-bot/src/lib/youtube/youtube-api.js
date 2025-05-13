/**
 * YouTube API integration for AstroBot
 * Handles API requests to YouTube Data API v3
 * 
 * Note: This module is designed to be used as a fallback or enhancement
 * to the RSS-based approach, as it consumes API quota.
 */

const axios = require('axios');
const logger = require('../logger');

// YouTube API endpoint
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * Make a request to the YouTube API
 * @param {string} endpoint - The API endpoint
 * @param {Object} params - Query parameters
 * @param {string} apiKey - The YouTube API key to use
 * @returns {Promise<Object>} The API response data
 */
async function makeRequest(endpoint, params, apiKey) {
  try {
    // Check if API key is provided
    if (!apiKey) {
      throw new Error('No YouTube API key provided');
    }
    
    // Add API key to parameters
    const queryParams = {
      ...params,
      key: apiKey
    };
    
    // Make request
    const response = await axios.get(`${YOUTUBE_API_URL}/${endpoint}`, {
      params: queryParams
    });
    
    return response.data;
  } catch (error) {
    // Check if it's a quota exceeded error
    if (error.response && error.response.data && 
        error.response.data.error && 
        error.response.data.error.errors && 
        error.response.data.error.errors.some(e => e.reason === 'quotaExceeded')) {
      throw new Error('YouTube API quota exceeded');
    }
    
    // Handle other errors
    logger.error(`YouTube API request failed: ${endpoint}`, error.message);
    
    if (error.response && error.response.data) {
      throw new Error(`YouTube API error: ${JSON.stringify(error.response.data.error)}`);
    }
    
    throw error;
  }
}

/**
 * Search for YouTube channels
 * @param {string} query - The search query
 * @param {string} apiKey - The YouTube API key to use
 * @param {number} [maxResults=5] - Maximum number of results to return
 * @returns {Promise<Array<Object>>} Array of channel data
 */
async function searchChannels(query, apiKey, maxResults = 5) {
  try {
    const response = await makeRequest('search', {
      part: 'snippet',
      q: query,
      type: 'channel',
      maxResults
    }, apiKey);
    
    // Transform the response into a simpler format
    return response.items.map(item => ({
      id: item.id.channelId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high.url,
      type: 'channel'
    }));
  } catch (error) {
    logger.error(`Error searching for YouTube channels with query "${query}":`, error.message);
    throw error;
  }
}

/**
 * Get channel details by channel ID
 * @param {string} channelId - The YouTube channel ID
 * @param {string} apiKey - The YouTube API key to use
 * @returns {Promise<Object>} Channel data
 */
async function getChannelDetails(channelId, apiKey) {
  try {
    const response = await makeRequest('channels', {
      part: 'snippet,statistics,contentDetails',
      id: channelId
    }, apiKey);
    
    if (!response.items || response.items.length === 0) {
      throw new Error(`Channel not found: ${channelId}`);
    }
    
    const channel = response.items[0];
    
    return {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      customUrl: channel.snippet.customUrl,
      thumbnail: channel.snippet.thumbnails.high.url,
      statistics: channel.statistics,
      uploadsPlaylistId: channel.contentDetails.relatedPlaylists.uploads
    };
  } catch (error) {
    logger.error(`Error getting YouTube channel details for ${channelId}:`, error.message);
    throw error;
  }
}

/**
 * Get recent videos from a channel using the uploads playlist
 * @param {string} uploadsPlaylistId - The uploads playlist ID
 * @param {string} apiKey - The YouTube API key to use
 * @param {number} [maxResults=10] - Maximum number of results to return
 * @returns {Promise<Array<Object>>} Array of video data
 */
async function getRecentVideos(uploadsPlaylistId, apiKey, maxResults = 10) {
  try {
    // Get playlist items
    const playlistResponse = await makeRequest('playlistItems', {
      part: 'snippet,contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults
    }, apiKey);
    
    if (!playlistResponse.items || playlistResponse.items.length === 0) {
      return [];
    }
    
    // Get video details for all videos at once
    const videoIds = playlistResponse.items.map(item => item.contentDetails.videoId).join(',');
    
    const videosResponse = await makeRequest('videos', {
      part: 'snippet,contentDetails,statistics',
      id: videoIds
    }, apiKey);
    
    // Transform the response into a simpler format
    return videosResponse.items.map(video => ({
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      publishedAt: new Date(video.snippet.publishedAt),
      thumbnail: video.snippet.thumbnails.high.url,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      url: `https://www.youtube.com/watch?v=${video.id}`
    }));
  } catch (error) {
    logger.error(`Error getting recent videos for playlist ${uploadsPlaylistId}:`, error.message);
    throw error;
  }
}

/**
 * Get video details by video ID
 * @param {string} videoId - The YouTube video ID
 * @param {string} apiKey - The YouTube API key to use
 * @returns {Promise<Object>} Video data
 */
async function getVideoDetails(videoId, apiKey) {
  try {
    const response = await makeRequest('videos', {
      part: 'snippet,contentDetails,statistics',
      id: videoId
    }, apiKey);
    
    if (!response.items || response.items.length === 0) {
      throw new Error(`Video not found: ${videoId}`);
    }
    
    const video = response.items[0];
    
    return {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      publishedAt: new Date(video.snippet.publishedAt),
      thumbnail: video.snippet.thumbnails.high.url,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
      url: `https://www.youtube.com/watch?v=${video.id}`
    };
  } catch (error) {
    logger.error(`Error getting YouTube video details for ${videoId}:`, error.message);
    throw error;
  }
}

module.exports = {
  searchChannels,
  getChannelDetails,
  getRecentVideos,
  getVideoDetails
};