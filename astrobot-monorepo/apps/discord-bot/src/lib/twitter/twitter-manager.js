/**
 * Twitter Manager
 * Handles Twitter user tracking and notifications
 */

const { Collection, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const logger = require('../logger');

// Path to Twitter tracking file
const TWITTER_TRACKING_FILE = path.join(process.cwd(), 'data', 'twitter-tracking.json');

// Collection of tracked Twitter accounts (guildId -> { channels: [], accounts: [] })
const trackedAccounts = new Collection();

// Cache of last tweets for each account
const tweetCache = new Collection();

// Polling interval (in ms)
const POLLING_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Polling timer
let pollingTimer = null;

// Twitter API credentials
const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN || null;

/**
 * Initialize Twitter manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing Twitter manager...');
    
    // Load tracked accounts
    await loadTrackedAccounts();
    
    // Start polling if we have Twitter API credentials
    if (TWITTER_BEARER_TOKEN) {
      startPolling();
      logger.info('Twitter polling started');
    } else {
      logger.warn('Twitter API credentials not found. Twitter tracking is disabled.');
    }
    
    logger.info('Twitter manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing Twitter manager:', error);
    return false;
  }
}

/**
 * Shutdown Twitter manager
 */
function shutdown() {
  try {
    logger.info('Shutting down Twitter manager...');
    
    // Stop polling
    if (pollingTimer) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }
    
    logger.info('Twitter manager shut down successfully');
  } catch (error) {
    logger.error('Error shutting down Twitter manager:', error);
  }
}

/**
 * Load tracked accounts from disk
 * @returns {Promise<void>}
 */
async function loadTrackedAccounts() {
  try {
    // Clear collection
    trackedAccounts.clear();
    
    // Check if file exists
    try {
      await fs.access(TWITTER_TRACKING_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveTrackedAccounts();
      return;
    }
    
    // Read file
    const data = await fs.readFile(TWITTER_TRACKING_FILE, 'utf8');
    
    // Parse JSON
    const parsed = JSON.parse(data);
    
    // Load tracked accounts
    for (const [guildId, config] of Object.entries(parsed)) {
      trackedAccounts.set(guildId, config);
    }
    
    logger.debug('Tracked Twitter accounts loaded from disk');
  } catch (error) {
    logger.error('Error loading tracked Twitter accounts:', error);
    throw error;
  }
}

/**
 * Save tracked accounts to disk
 * @returns {Promise<void>}
 */
async function saveTrackedAccounts() {
  try {
    // Create data object
    const data = {};
    
    for (const [guildId, config] of trackedAccounts.entries()) {
      data[guildId] = config;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(TWITTER_TRACKING_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(TWITTER_TRACKING_FILE, JSON.stringify(data, null, 2));
    
    logger.debug('Tracked Twitter accounts saved to disk');
  } catch (error) {
    logger.error('Error saving tracked Twitter accounts:', error);
    throw error;
  }
}

/**
 * Start polling for Twitter updates
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
  
  logger.debug('Twitter polling started');
}

/**
 * Check for updates from tracked Twitter accounts
 */
async function checkForUpdates() {
  try {
    logger.debug('Checking for Twitter updates...');
    
    // Skip if no Twitter API credentials
    if (!TWITTER_BEARER_TOKEN) {
      logger.warn('Twitter API credentials not found. Twitter tracking is disabled.');
      return;
    }
    
    // Get all unique accounts across all guilds
    const uniqueAccounts = new Set();
    
    for (const [_, config] of trackedAccounts.entries()) {
      for (const account of config.accounts) {
        uniqueAccounts.add(account);
      }
    }
    
    // Check each account
    for (const username of uniqueAccounts) {
      try {
        await checkUserTweets(username);
      } catch (error) {
        logger.error(`Error checking tweets for ${username}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error checking for Twitter updates:', error);
  }
}

/**
 * Check tweets for a user
 * @param {string} username - The Twitter username
 */
async function checkUserTweets(username) {
  try {
    // Get tweets
    const tweets = await fetchUserTweets(username);
    
    // Skip if no tweets
    if (!tweets || tweets.length === 0) {
      return;
    }
    
    // Get cached tweets
    const cachedTweets = tweetCache.get(username) || [];
    
    // Find new tweets (tweets that weren't in the cache)
    const cachedTweetIds = new Set(cachedTweets.map(t => t.id));
    const newTweets = tweets.filter(tweet => !cachedTweetIds.has(tweet.id));
    
    // Skip if no new tweets
    if (newTweets.length === 0) {
      return;
    }
    
    // Update cache with new tweets
    tweetCache.set(username, tweets.slice(0, 20)); // Keep last 20 tweets
    
    // Process new tweets (newest first)
    for (const tweet of newTweets.reverse()) {
      await processTweet(username, tweet);
    }
  } catch (error) {
    logger.error(`Error checking tweets for user ${username}:`, error);
    throw error;
  }
}

/**
 * Fetch tweets for a user
 * @param {string} username - The Twitter username
 * @returns {Promise<Array>} The tweets
 */
async function fetchUserTweets(username) {
  try {
    // Call Twitter API to get user tweets
    // Twitter API v2 endpoint
    const response = await axios.get(
      `https://api.twitter.com/2/tweets/search/recent?query=from:${username}&max_results=10&tweet.fields=created_at,public_metrics,entities,attachments,referenced_tweets&expansions=author_id,attachments.media_keys&user.fields=profile_image_url,verified&media.fields=url,preview_image_url`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.data || [];
  } catch (error) {
    if (error.response) {
      logger.error(`Twitter API error (${error.response.status}):`, error.response.data);
      
      // Handle rate limiting
      if (error.response.status === 429) {
        logger.error('Twitter API rate limit exceeded.');
      }
    } else {
      logger.error(`Error fetching tweets for user ${username}:`, error);
    }
    
    throw error;
  }
}

/**
 * Process a tweet
 * @param {string} username - The Twitter username
 * @param {Object} tweet - The tweet to process
 */
async function processTweet(username, tweet) {
  try {
    // Skip retweets and replies if we're tracking the original author
    if (tweet.referenced_tweets) {
      const isRetweet = tweet.referenced_tweets.some(ref => ref.type === 'retweeted');
      
      // Skip retweets
      if (isRetweet) {
        return;
      }
    }
    
    // Prepare notification
    const embed = createTweetEmbed(username, tweet);
    
    // Skip if embed couldn't be created
    if (!embed) {
      return;
    }
    
    // Find all guilds tracking this account
    for (const [guildId, config] of trackedAccounts.entries()) {
      // Skip if guild isn't tracking this account
      if (!config.accounts.includes(username)) {
        continue;
      }
      
      // Send notification to all channels in the guild
      for (const channelId of config.channels) {
        try {
          // Get channel
          const channel = await global.client.channels.fetch(channelId).catch(() => null);
          
          // Skip if channel not found
          if (!channel) {
            logger.error(`Channel ${channelId} not found for Twitter notification in guild ${guildId}`);
            continue;
          }
          
          // Skip if channel is not text-based
          if (!channel.isTextBased() || channel.isVoiceBased()) {
            logger.error(`Channel ${channelId} is not text-based for Twitter notification in guild ${guildId}`);
            continue;
          }
          
          // Send notification
          await channel.send({ embeds: [embed] });
        } catch (error) {
          logger.error(`Error sending Twitter notification to channel ${channelId} in guild ${guildId}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error(`Error processing tweet for ${username}:`, error);
  }
}

/**
 * Create an embed for a tweet
 * @param {string} username - The Twitter username
 * @param {Object} tweet - The tweet
 * @returns {EmbedBuilder} The embed
 */
function createTweetEmbed(username, tweet) {
  try {
    // Get media (if any)
    let imageUrl = null;
    if (tweet.attachments && tweet.attachments.media_keys && tweet.attachments.media_keys.length > 0) {
      const mediaKey = tweet.attachments.media_keys[0];
      // Find media with this key
      if (tweet.includes && tweet.includes.media) {
        const media = tweet.includes.media.find(m => m.media_key === mediaKey);
        if (media && (media.url || media.preview_image_url)) {
          imageUrl = media.url || media.preview_image_url;
        }
      }
    }
    
    // Get user information
    const user = tweet.includes && tweet.includes.users ? 
      tweet.includes.users.find(u => u.id === tweet.author_id) : null;
    
    const verified = user ? user.verified : false;
    const profileImageUrl = user ? user.profile_image_url : null;
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#1DA1F2') // Twitter blue
      .setTitle(`New Tweet from @${username}${verified ? ' ✓' : ''}`)
      .setURL(`https://twitter.com/${username}/status/${tweet.id}`)
      .setDescription(tweet.text)
      .setTimestamp(new Date(tweet.created_at));
    
    // Add author with profile image if available
    if (profileImageUrl) {
      embed.setAuthor({
        name: `@${username}${verified ? ' ✓' : ''}`,
        iconURL: profileImageUrl,
        url: `https://twitter.com/${username}`
      });
    }
    
    // Add image if available
    if (imageUrl) {
      embed.setImage(imageUrl);
    }
    
    // Add tweet stats
    const likes = tweet.public_metrics ? tweet.public_metrics.like_count : 0;
    const retweets = tweet.public_metrics ? tweet.public_metrics.retweet_count : 0;
    const replies = tweet.public_metrics ? tweet.public_metrics.reply_count : 0;
    
    embed.addFields(
      { name: 'Likes', value: likes.toString(), inline: true },
      { name: 'Retweets', value: retweets.toString(), inline: true },
      { name: 'Replies', value: replies.toString(), inline: true }
    );
    
    // Add footer
    embed.setFooter({
      text: 'Twitter',
      iconURL: 'https://abs.twimg.com/icons/apple-touch-icon-192x192.png'
    });
    
    return embed;
  } catch (error) {
    logger.error(`Error creating embed for tweet:`, error);
    return null;
  }
}

/**
 * Track a Twitter account for a guild
 * @param {string} guildId - The guild ID
 * @param {string} channelId - The channel ID to send notifications to
 * @param {string} username - The Twitter username
 * @returns {Promise<Object>} The updated tracking config
 */
async function trackAccount(guildId, channelId, username) {
  try {
    // Normalize username (remove @ if present)
    username = username.startsWith('@') ? username.substring(1) : username;
    
    // Get current config or create new one
    const config = trackedAccounts.get(guildId) || {
      channels: [],
      accounts: []
    };
    
    // Add channel if it doesn't exist
    if (!config.channels.includes(channelId)) {
      config.channels.push(channelId);
    }
    
    // Add account if it doesn't exist
    if (!config.accounts.includes(username)) {
      config.accounts.push(username);
    }
    
    // Update collection
    trackedAccounts.set(guildId, config);
    
    // Save to disk
    await saveTrackedAccounts();
    
    // Seed initial data for the account
    if (TWITTER_BEARER_TOKEN) {
      try {
        const tweets = await fetchUserTweets(username);
        
        if (tweets && tweets.length > 0) {
          tweetCache.set(username, tweets.slice(0, 20)); // Keep last 20 tweets
        }
      } catch (error) {
        logger.error(`Error seeding tweets for account ${username}:`, error);
      }
    }
    
    return config;
  } catch (error) {
    logger.error(`Error tracking Twitter account ${username} for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Untrack a Twitter account for a guild
 * @param {string} guildId - The guild ID
 * @param {string} username - The Twitter username
 * @returns {Promise<Object>} The updated tracking config
 */
async function untrackAccount(guildId, username) {
  try {
    // Normalize username (remove @ if present)
    username = username.startsWith('@') ? username.substring(1) : username;
    
    // Get current config
    const config = trackedAccounts.get(guildId);
    
    // Skip if no config exists
    if (!config) {
      return null;
    }
    
    // Remove account
    config.accounts = config.accounts.filter(account => account !== username);
    
    // Update collection
    trackedAccounts.set(guildId, config);
    
    // Save to disk
    await saveTrackedAccounts();
    
    return config;
  } catch (error) {
    logger.error(`Error untracking Twitter account ${username} for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Get all tracked accounts for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The tracking config
 */
function getTrackedAccounts(guildId) {
  return trackedAccounts.get(guildId) || {
    channels: [],
    accounts: []
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
    const config = trackedAccounts.get(guildId) || {
      channels: [],
      accounts: []
    };
    
    // Update channels
    config.channels = channelIds;
    
    // Update collection
    trackedAccounts.set(guildId, config);
    
    // Save to disk
    await saveTrackedAccounts();
    
    return config;
  } catch (error) {
    logger.error(`Error setting notification channels for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Check if a Twitter account exists
 * @param {string} username - The Twitter username
 * @returns {Promise<boolean>} Whether the account exists
 */
async function checkAccountExists(username) {
  try {
    // Skip if no Twitter API credentials
    if (!TWITTER_BEARER_TOKEN) {
      throw new Error('Twitter API credentials not configured. Please contact the bot administrator.');
    }
    
    // Normalize username (remove @ if present)
    username = username.startsWith('@') ? username.substring(1) : username;
    
    // Call Twitter API to get user
    const response = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.status === 200 && response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      // Account not found
      return false;
    }
    
    logger.error(`Error checking if Twitter account ${username} exists:`, error);
    throw error;
  }
}

/**
 * Check if Twitter API is configured correctly
 * @returns {boolean} Whether the API is configured
 */
function isTwitterApiConfigured() {
  return !!TWITTER_BEARER_TOKEN;
}

module.exports = {
  initialize,
  shutdown,
  trackAccount,
  untrackAccount,
  getTrackedAccounts,
  setNotificationChannels,
  checkAccountExists,
  isTwitterApiConfigured
};