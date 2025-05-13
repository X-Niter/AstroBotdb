/**
 * Twitch API integration for AstroBot
 * Handles authentication and API requests to Twitch
 */

const axios = require('axios');
const logger = require('../logger');

// Twitch API endpoints
const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_API_URL = 'https://api.twitch.tv/helix';

// Environment variables
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

// Token storage
let accessToken = null;
let tokenExpiry = null;

/**
 * Get a valid access token for Twitch API
 * @returns {Promise<string>} The access token
 */
async function getAccessToken() {
  // Check if we have a valid token
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }
  
  try {
    // Request new token
    const response = await axios.post(TWITCH_AUTH_URL, null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials'
      }
    });
    
    // Store token and expiry time
    accessToken = response.data.access_token;
    // Set expiry to slightly before actual expiry to avoid using an expired token
    tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 300000; // 5 minutes buffer
    
    logger.debug('Obtained new Twitch access token');
    return accessToken;
  } catch (error) {
    logger.error('Failed to get Twitch access token:', error.message);
    throw new Error(`Twitch authentication failed: ${error.message}`);
  }
}

/**
 * Make an authenticated request to the Twitch API
 * @param {string} endpoint - The API endpoint (without the base URL)
 * @param {string} method - The HTTP method (GET, POST, etc.)
 * @param {Object} [params] - Query parameters
 * @param {Object} [data] - Request body data
 * @returns {Promise<Object>} The API response data
 */
async function makeRequest(endpoint, method = 'GET', params = {}, data = null) {
  try {
    // Get access token
    const token = await getAccessToken();
    
    // Make request
    const response = await axios({
      method,
      url: `${TWITCH_API_URL}${endpoint}`,
      headers: {
        'Client-ID': TWITCH_CLIENT_ID,
        'Authorization': `Bearer ${token}`
      },
      params,
      data
    });
    
    return response.data;
  } catch (error) {
    logger.error(`Twitch API request failed: ${endpoint}`, error.message);
    
    // Check if it's an API-specific error
    if (error.response) {
      throw new Error(`Twitch API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    
    throw error;
  }
}

/**
 * Get user information by username or user ID
 * @param {Array<string>} usernames - Array of usernames to look up
 * @param {Array<string>} [userIds] - Array of user IDs to look up
 * @returns {Promise<Array<Object>>} Array of user data objects
 */
async function getUsers(usernames = [], userIds = []) {
  const params = {};
  
  // Add usernames
  usernames.forEach(username => {
    params[`login=${username}`] = null;
  });
  
  // Add user IDs
  userIds.forEach(id => {
    params[`id=${id}`] = null;
  });
  
  const queryParams = new URLSearchParams();
  
  // Add login parameters
  usernames.forEach(username => {
    queryParams.append('login', username);
  });
  
  // Add id parameters
  userIds.forEach(id => {
    queryParams.append('id', id);
  });
  
  try {
    const response = await makeRequest('/users', 'GET', queryParams);
    return response.data || [];
  } catch (error) {
    logger.error('Failed to get Twitch users:', error.message);
    throw error;
  }
}

/**
 * Check if a Twitch user is currently streaming
 * @param {string} userId - The Twitch user ID
 * @returns {Promise<Object|null>} Stream data if live, null if not streaming
 */
async function getStreamStatus(userId) {
  try {
    const response = await makeRequest('/streams', 'GET', {
      user_id: userId
    });
    
    // If the user is streaming, data array will have an item
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    logger.error(`Failed to get stream status for user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Get information about a user's channel
 * @param {string} userId - The Twitch user ID
 * @returns {Promise<Object>} Channel data
 */
async function getChannelInfo(userId) {
  try {
    const response = await makeRequest('/channels', 'GET', {
      broadcaster_id: userId
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    throw new Error(`Channel not found for user ID: ${userId}`);
  } catch (error) {
    logger.error(`Failed to get channel info for user ${userId}:`, error.message);
    throw error;
  }
}

/**
 * Get information about a game by ID
 * @param {string} gameId - The Twitch game ID
 * @returns {Promise<Object|null>} Game data if found, null if not
 */
async function getGameInfo(gameId) {
  try {
    const response = await makeRequest('/games', 'GET', {
      id: gameId
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    logger.error(`Failed to get game info for game ${gameId}:`, error.message);
    throw error;
  }
}

/**
 * Search for categories (games) by name
 * @param {string} query - The search query
 * @returns {Promise<Array<Object>>} Array of matching categories
 */
async function searchCategories(query) {
  try {
    const response = await makeRequest('/search/categories', 'GET', {
      query
    });
    
    return response.data || [];
  } catch (error) {
    logger.error(`Failed to search categories with query ${query}:`, error.message);
    throw error;
  }
}

/**
 * Get a clip by ID
 * @param {string} clipId - The Twitch clip ID
 * @returns {Promise<Object|null>} Clip data if found, null if not
 */
async function getClip(clipId) {
  try {
    const response = await makeRequest('/clips', 'GET', {
      id: clipId
    });
    
    if (response.data && response.data.length > 0) {
      return response.data[0];
    }
    
    return null;
  } catch (error) {
    logger.error(`Failed to get clip ${clipId}:`, error.message);
    throw error;
  }
}

/**
 * Get recent clips for a broadcaster
 * @param {string} broadcasterId - The broadcaster's Twitch user ID
 * @param {number} [limit=5] - Maximum number of clips to retrieve
 * @returns {Promise<Array<Object>>} Array of clip data
 */
async function getRecentClips(broadcasterId, limit = 5) {
  try {
    const response = await makeRequest('/clips', 'GET', {
      broadcaster_id: broadcasterId,
      first: limit
    });
    
    return response.data || [];
  } catch (error) {
    logger.error(`Failed to get recent clips for broadcaster ${broadcasterId}:`, error.message);
    throw error;
  }
}

module.exports = {
  getUsers,
  getStreamStatus,
  getChannelInfo,
  getGameInfo,
  searchCategories,
  getClip,
  getRecentClips
};