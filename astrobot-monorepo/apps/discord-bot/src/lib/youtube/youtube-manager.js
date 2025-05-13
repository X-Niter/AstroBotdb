/**
 * YouTube Manager for AstroBot
 * Manages YouTube channel subscriptions and notifications
 * 
 * This uses a hybrid approach:
 * 1. RSS feeds as primary method (no API quota limitations)
 * 2. YouTube API as fallback/enhancement when available
 * 3. Support for both global and per-server API keys
 */

const fs = require('fs').promises;
const path = require('path');
const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle
} = require('discord.js');
const youtubeRss = require('./youtube-rss');
const youtubeApi = require('./youtube-api');
const logger = require('../logger');

// Path to the YouTube channels storage file
const CHANNELS_FILE = path.join(process.cwd(), 'data', 'youtube-channels.json');

// In-memory storage
const subscribedChannels = new Map();
const lastVideoCache = new Map();

// Check interval (in ms)
const CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes
const QUOTA_WARNING_THRESHOLD = 0.1; // 10% of daily quota

let checkInterval = null;
let globalApiKey = process.env.YOUTUBE_API_KEY;
let apiQuotaRemaining = null;

/**
 * Initialize the YouTube manager
 */
async function initialize() {
  try {
    // Load subscribed channels
    await loadChannels();
    
    // Start checking for videos
    if (!checkInterval) {
      checkInterval = setInterval(checkNewVideos, CHECK_INTERVAL);
      
      // Initial check
      setTimeout(checkNewVideos, 10000); // 10 seconds after init
    }
    
    logger.info('YouTube manager initialized');
  } catch (error) {
    logger.error('Error initializing YouTube manager:', error);
  }
}

/**
 * Add a YouTube channel subscription
 * @param {Object} channelData - The channel data
 * @param {string} channelData.guildId - The guild ID
 * @param {string} channelData.notificationChannelId - The Discord channel ID to post notifications
 * @param {string} channelData.youtubeChannel - The YouTube channel URL, ID, or username
 * @param {string} [channelData.roleId] - Optional role ID to mention
 * @param {string} [channelData.message] - Optional custom message
 * @param {string} [channelData.apiKey] - Optional server-specific API key
 * @returns {Promise<Object>} The added channel data
 */
async function addChannel(channelData) {
  try {
    // Validate required data
    if (!channelData.guildId || !channelData.notificationChannelId || !channelData.youtubeChannel) {
      throw new Error('Missing required channel data');
    }
    
    // Validate and get channel info using RSS first (no API quota used)
    let channelInfo;
    try {
      channelInfo = await youtubeRss.validateChannel(channelData.youtubeChannel);
    } catch (rssError) {
      logger.warn(`RSS validation failed for ${channelData.youtubeChannel}, trying API:`, rssError.message);
      
      // If RSS fails, try using API as fallback (if available)
      const apiKey = channelData.apiKey || globalApiKey;
      
      if (!apiKey) {
        throw new Error(`Could not validate YouTube channel: ${rssError.message}`);
      }
      
      try {
        // Try to extract a channel ID if it's a URL
        let channelId = channelData.youtubeChannel;
        
        if (channelData.youtubeChannel.includes('youtube.com') || 
            channelData.youtubeChannel.includes('youtu.be')) {
          const url = new URL(channelData.youtubeChannel);
          
          if (url.pathname.includes('/channel/')) {
            channelId = url.pathname.split('/channel/')[1].split('/')[0];
          } else {
            throw new Error('Could not extract channel ID from URL');
          }
        }
        
        // Get channel details using API
        const apiChannelInfo = await youtubeApi.getChannelDetails(channelId, apiKey);
        
        // Convert to common format
        channelInfo = {
          title: apiChannelInfo.title,
          id: apiChannelInfo.id,
          author: apiChannelInfo.title,
          link: `https://www.youtube.com/channel/${apiChannelInfo.id}`,
          type: 'channel',
          identifier: apiChannelInfo.id,
          thumbnail: apiChannelInfo.thumbnail,
          uploadsPlaylistId: apiChannelInfo.uploadsPlaylistId
        };
      } catch (apiError) {
        throw new Error(`Could not validate YouTube channel: ${apiError.message}`);
      }
    }
    
    // Create channel subscription object
    const subscription = {
      guildId: channelData.guildId,
      notificationChannelId: channelData.notificationChannelId,
      youtubeChannelId: channelInfo.id,
      youtubeChannelTitle: channelInfo.title,
      youtubeChannelType: channelInfo.type,
      youtubeChannelIdentifier: channelInfo.identifier,
      youtubeChannelUrl: channelInfo.link || `https://www.youtube.com/channel/${channelInfo.id}`,
      roleId: channelData.roleId || null,
      message: channelData.message || null,
      apiKey: channelData.apiKey || null,
      lastNotified: null,
      addedAt: new Date().toISOString(),
      uploadsPlaylistId: channelInfo.uploadsPlaylistId || null
    };
    
    // Add to map
    if (!subscribedChannels.has(channelData.guildId)) {
      subscribedChannels.set(channelData.guildId, []);
    }
    
    // Check if channel already exists
    const existingIndex = subscribedChannels.get(channelData.guildId)
      .findIndex(s => s.youtubeChannelId === subscription.youtubeChannelId);
    
    if (existingIndex !== -1) {
      // Update existing subscription
      subscribedChannels.get(channelData.guildId)[existingIndex] = subscription;
    } else {
      // Add new subscription
      subscribedChannels.get(channelData.guildId).push(subscription);
    }
    
    // Save to disk
    await saveChannels();
    
    // Immediately check for latest videos to populate cache
    try {
      await checkChannelForNewVideos(subscription, false);
    } catch (error) {
      logger.warn(`Could not get initial videos for ${subscription.youtubeChannelTitle}:`, error.message);
    }
    
    return subscription;
  } catch (error) {
    logger.error('Error adding YouTube channel:', error);
    throw error;
  }
}

/**
 * Remove a YouTube channel subscription
 * @param {string} guildId - The guild ID
 * @param {string} youtubeChannelId - The YouTube channel ID
 * @returns {Promise<boolean>} Whether the channel was removed
 */
async function removeChannel(guildId, youtubeChannelId) {
  try {
    // Check if guild has any channels
    if (!subscribedChannels.has(guildId)) {
      return false;
    }
    
    // Get the channels for this guild
    const guildChannels = subscribedChannels.get(guildId);
    
    // Find the channel
    const index = guildChannels.findIndex(c => c.youtubeChannelId === youtubeChannelId);
    
    if (index === -1) {
      return false;
    }
    
    // Remove the channel
    guildChannels.splice(index, 1);
    
    // Check if the guild has no more channels
    if (guildChannels.length === 0) {
      subscribedChannels.delete(guildId);
    }
    
    // Save to disk
    await saveChannels();
    
    // Clean up video cache if no other subscriptions to this channel
    let hasOtherSubscriptions = false;
    
    for (const [gId, channels] of subscribedChannels.entries()) {
      if (channels.some(c => c.youtubeChannelId === youtubeChannelId)) {
        hasOtherSubscriptions = true;
        break;
      }
    }
    
    if (!hasOtherSubscriptions) {
      lastVideoCache.delete(youtubeChannelId);
    }
    
    return true;
  } catch (error) {
    logger.error('Error removing YouTube channel:', error);
    return false;
  }
}

/**
 * List all YouTube channel subscriptions for a guild
 * @param {string} guildId - The guild ID
 * @returns {Array<Object>} The subscribed channels
 */
function listChannels(guildId) {
  return subscribedChannels.has(guildId) ? [...subscribedChannels.get(guildId)] : [];
}

/**
 * Update a channel subscription's settings
 * @param {string} guildId - The guild ID
 * @param {string} youtubeChannelId - The YouTube channel ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object|null>} The updated subscription data or null if not found
 */
async function updateChannel(guildId, youtubeChannelId, updateData) {
  try {
    // Check if guild has any channels
    if (!subscribedChannels.has(guildId)) {
      return null;
    }
    
    // Get the channels for this guild
    const guildChannels = subscribedChannels.get(guildId);
    
    // Find the channel
    const index = guildChannels.findIndex(c => c.youtubeChannelId === youtubeChannelId);
    
    if (index === -1) {
      return null;
    }
    
    // Get the current subscription data
    const subscription = guildChannels[index];
    
    // Update data (only allowed fields)
    if (updateData.notificationChannelId) subscription.notificationChannelId = updateData.notificationChannelId;
    if (updateData.roleId !== undefined) subscription.roleId = updateData.roleId;
    if (updateData.message !== undefined) subscription.message = updateData.message;
    if (updateData.apiKey !== undefined) subscription.apiKey = updateData.apiKey;
    
    // Save to disk
    await saveChannels();
    
    return subscription;
  } catch (error) {
    logger.error('Error updating YouTube channel:', error);
    throw error;
  }
}

/**
 * Check for new videos from all subscribed channels
 */
async function checkNewVideos() {
  try {
    // If no subscriptions, skip
    if (subscribedChannels.size === 0) {
      return;
    }
    
    logger.debug('Checking for new YouTube videos...');
    
    // We'll check each channel separately to handle errors gracefully
    const allSubscriptions = [];
    
    // Get all unique subscriptions
    for (const [guildId, channels] of subscribedChannels.entries()) {
      allSubscriptions.push(...channels);
    }
    
    // Group by YouTube channel ID to avoid duplicate checks
    const uniqueChannelMap = new Map();
    
    for (const subscription of allSubscriptions) {
      if (!uniqueChannelMap.has(subscription.youtubeChannelId)) {
        uniqueChannelMap.set(subscription.youtubeChannelId, []);
      }
      
      uniqueChannelMap.get(subscription.youtubeChannelId).push(subscription);
    }
    
    // Process each unique channel
    for (const [channelId, subscriptions] of uniqueChannelMap.entries()) {
      try {
        // Check if any subscription has a custom API key
        const subscription = subscriptions.find(s => s.apiKey) || subscriptions[0];
        
        await checkChannelForNewVideos(subscription, true);
      } catch (error) {
        logger.error(`Error checking for new videos from ${channelId}:`, error.message);
      }
    }
  } catch (error) {
    logger.error('Error checking for new YouTube videos:', error);
  }
}

/**
 * Check a specific channel for new videos
 * @param {Object} subscription - The channel subscription object
 * @param {boolean} notify - Whether to send notifications for new videos
 * @returns {Promise<Array<Object>>} Array of new videos
 */
async function checkChannelForNewVideos(subscription, notify = true) {
  try {
    // Choose which API key to use
    const apiKey = getApiKeyForSubscription(subscription);
    
    // Try using RSS feed first (no API quota)
    let videos = [];
    
    try {
      videos = await youtubeRss.getLatestVideos(
        subscription.youtubeChannelType,
        subscription.youtubeChannelIdentifier,
        5
      );
    } catch (rssError) {
      logger.warn(`RSS failed for channel ${subscription.youtubeChannelTitle}:`, rssError.message);
      
      // Fallback to API if RSS fails and an API key is available
      if (apiKey && subscription.uploadsPlaylistId) {
        try {
          videos = await youtubeApi.getRecentVideos(
            subscription.uploadsPlaylistId,
            apiKey,
            5
          );
        } catch (apiError) {
          if (apiError.message.includes('quota exceeded')) {
            apiQuotaRemaining = 0;
          }
          throw apiError;
        }
      } else {
        throw new Error('Could not get videos: RSS failed and no API fallback available');
      }
    }
    
    if (videos.length === 0) {
      logger.debug(`No videos found for ${subscription.youtubeChannelTitle}`);
      return [];
    }
    
    // Get the last video we notified about
    const lastVideo = lastVideoCache.get(subscription.youtubeChannelId);
    
    // If we don't have a last video cached, cache the latest one and don't notify
    if (!lastVideo) {
      lastVideoCache.set(subscription.youtubeChannelId, {
        id: videos[0].id,
        publishedAt: videos[0].publishedAt
      });
      
      logger.debug(`Cached latest video for ${subscription.youtubeChannelTitle}: ${videos[0].title}`);
      return [];
    }
    
    // Find new videos (published after the last one we know about)
    const newVideos = videos.filter(video => 
      video.id !== lastVideo.id && 
      new Date(video.publishedAt) > new Date(lastVideo.publishedAt)
    );
    
    if (newVideos.length === 0) {
      logger.debug(`No new videos for ${subscription.youtubeChannelTitle}`);
      return [];
    }
    
    // Sort by published date (oldest first)
    newVideos.sort((a, b) => new Date(a.publishedAt) - new Date(b.publishedAt));
    
    // Update the cache with the latest video
    lastVideoCache.set(subscription.youtubeChannelId, {
      id: videos[0].id,
      publishedAt: videos[0].publishedAt
    });
    
    logger.debug(`Found ${newVideos.length} new videos for ${subscription.youtubeChannelTitle}`);
    
    // Send notifications if requested
    if (notify) {
      const client = global.client;
      
      if (!client) {
        logger.error('Discord client not available for notifications');
        return newVideos;
      }
      
      // Get subscriptions to notify for this channel
      const subscriptions = [];
      
      for (const [guildId, channels] of subscribedChannels.entries()) {
        subscriptions.push(...channels.filter(s => s.youtubeChannelId === subscription.youtubeChannelId));
      }
      
      // Notify each guild/channel that's subscribed to this YouTube channel
      for (const sub of subscriptions) {
        try {
          // Get guild and channel
          const guild = await client.guilds.fetch(sub.guildId);
          const channel = await guild.channels.fetch(sub.notificationChannelId);
          
          if (!channel || !channel.isTextBased()) {
            logger.error(`Channel ${sub.notificationChannelId} not found or not text-based`);
            continue;
          }
          
          // Send notification for each new video (limit to 3 to avoid spam)
          for (const video of newVideos.slice(0, 3)) {
            await sendVideoNotification(channel, video, sub);
          }
          
          // Update last notified time
          sub.lastNotified = new Date().toISOString();
        } catch (error) {
          logger.error(`Error sending notification to guild ${sub.guildId}:`, error.message);
        }
      }
      
      // Save updated last notified times
      await saveChannels();
    }
    
    return newVideos;
  } catch (error) {
    logger.error(`Error checking for new videos from ${subscription.youtubeChannelTitle}:`, error);
    throw error;
  }
}

/**
 * Send a video notification to a Discord channel
 * @param {TextChannel} channel - The Discord channel
 * @param {Object} video - The video data
 * @param {Object} subscription - The subscription data
 */
async function sendVideoNotification(channel, video, subscription) {
  try {
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000') // YouTube red
      .setTitle(video.title)
      .setURL(video.link)
      .setAuthor({
        name: video.channel?.title || subscription.youtubeChannelTitle,
        iconURL: 'https://www.youtube.com/s/desktop/28b67e7f/img/favicon_144.png',
        url: video.channel?.link || subscription.youtubeChannelUrl
      })
      .setDescription(formatDescription(video.description || ''))
      .setImage(video.thumbnail)
      .setFooter({ text: 'AstroBot YouTube Notifications' })
      .setTimestamp(new Date(video.publishedAt));
    
    // Add video metadata if available
    if (video.viewCount) {
      embed.addFields({ name: 'Views', value: formatNumber(video.viewCount), inline: true });
    }
    
    if (video.likeCount) {
      embed.addFields({ name: 'Likes', value: formatNumber(video.likeCount), inline: true });
    }
    
    if (video.duration) {
      embed.addFields({ name: 'Duration', value: formatDuration(video.duration), inline: true });
    }
    
    // Create buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Watch Video')
        .setStyle(ButtonStyle.Link)
        .setURL(video.link)
    );
    
    // Create content message
    let content = '';
    
    if (subscription.roleId) {
      content += `<@&${subscription.roleId}> `;
    }
    
    if (subscription.message) {
      content += subscription.message.replace('{channel}', subscription.youtubeChannelTitle);
    } else {
      content += `New video from ${subscription.youtubeChannelTitle}!`;
    }
    
    // Send message
    await channel.send({
      content,
      embeds: [embed],
      components: [buttons]
    });
    
    logger.info(`Sent YouTube notification for ${video.title} in guild ${subscription.guildId}`);
  } catch (error) {
    logger.error('Error sending YouTube notification:', error);
    throw error;
  }
}

/**
 * Format a number with commas (e.g. 1,234,567)
 * @param {number|string} num - The number to format
 * @returns {string} The formatted number
 */
function formatNumber(num) {
  return Number(num).toLocaleString();
}

/**
 * Format a video description (truncate if too long)
 * @param {string} description - The video description
 * @returns {string} The formatted description
 */
function formatDescription(description) {
  if (!description) return '';
  
  const maxLength = 200;
  
  if (description.length <= maxLength) {
    return description;
  }
  
  return description.substring(0, maxLength) + '...';
}

/**
 * Format an ISO 8601 duration string to a human-readable format
 * @param {string} isoDuration - The ISO 8601 duration string
 * @returns {string} The formatted duration
 */
function formatDuration(isoDuration) {
  // Handle non-ISO durations or fallbacks
  if (!isoDuration || !isoDuration.includes('PT')) {
    return isoDuration || 'Unknown';
  }
  
  const duration = isoDuration.replace('PT', '');
  
  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  
  // Extract hours
  if (duration.includes('H')) {
    const parts = duration.split('H');
    hours = parseInt(parts[0].replace(/[^0-9]/g, ''), 10);
    if (isNaN(hours)) hours = 0;
  }
  
  // Extract minutes
  if (duration.includes('M')) {
    const parts = duration.includes('H') 
      ? duration.split('H')[1].split('M') 
      : duration.split('M');
    minutes = parseInt(parts[0].replace(/[^0-9]/g, ''), 10);
    if (isNaN(minutes)) minutes = 0;
  }
  
  // Extract seconds
  if (duration.includes('S')) {
    const parts = duration.split('S')[0];
    const secondsPart = parts.includes('M') 
      ? parts.split('M')[1] 
      : (parts.includes('H') ? parts.split('H')[1] : parts);
    seconds = parseInt(secondsPart.replace(/[^0-9]/g, ''), 10);
    if (isNaN(seconds)) seconds = 0;
  }
  
  // Format output
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Get the API key to use for a subscription
 * @param {Object} subscription - The subscription object
 * @returns {string|null} The API key to use, or null if none available
 */
function getApiKeyForSubscription(subscription) {
  // Check if the subscription has its own API key
  if (subscription.apiKey) {
    return subscription.apiKey;
  }
  
  // Fall back to global API key
  return globalApiKey;
}

/**
 * Set a global YouTube API key
 * @param {string} apiKey - The API key
 */
function setGlobalApiKey(apiKey) {
  globalApiKey = apiKey;
}

/**
 * Save channels to disk
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveChannels() {
  try {
    // Convert map to object
    const channelsObj = {};
    
    for (const [guildId, guildChannels] of subscribedChannels.entries()) {
      channelsObj[guildId] = guildChannels;
    }
    
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(CHANNELS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(CHANNELS_FILE, JSON.stringify(channelsObj, null, 2));
    
    logger.debug('Saved YouTube channels to disk');
    return true;
  } catch (error) {
    logger.error('Error saving YouTube channels:', error);
    return false;
  }
}

/**
 * Load channels from disk
 * @returns {Promise<void>}
 */
async function loadChannels() {
  try {
    // Check if the file exists
    try {
      await fs.access(CHANNELS_FILE);
    } catch (error) {
      logger.warn('YouTube channels file does not exist, creating an empty one');
      await saveChannels();
      return;
    }
    
    // Read the file
    const data = await fs.readFile(CHANNELS_FILE, 'utf8');
    
    // Parse the JSON
    const channelsObj = JSON.parse(data);
    
    // Convert to map
    for (const [guildId, guildChannels] of Object.entries(channelsObj)) {
      subscribedChannels.set(guildId, guildChannels);
      
      // Cache the last video for each channel
      for (const subscription of guildChannels) {
        if (subscription.lastNotified && !lastVideoCache.has(subscription.youtubeChannelId)) {
          // We don't have the actual video ID, but we can use this to avoid sending old notifications
          lastVideoCache.set(subscription.youtubeChannelId, {
            id: 'unknown',
            publishedAt: subscription.lastNotified
          });
        }
      }
    }
    
    logger.debug(`Loaded YouTube channels from disk`);
  } catch (error) {
    logger.error('Error loading YouTube channels:', error);
  }
}

/**
 * Shutdown the YouTube manager
 */
function shutdown() {
  // Clear check interval
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
  
  logger.info('YouTube manager shut down');
}

module.exports = {
  initialize,
  shutdown,
  addChannel,
  removeChannel,
  listChannels,
  updateChannel,
  checkNewVideos,
  setGlobalApiKey
};