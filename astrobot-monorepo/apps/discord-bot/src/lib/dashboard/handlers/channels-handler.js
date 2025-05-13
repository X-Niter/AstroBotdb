/**
 * Channels API Handler
 * Handles requests for channel information
 */

const logger = require('../../logger');

/**
 * Format a channel object for API response
 * @param {Channel} channel - The Discord.js Channel object
 * @returns {Object} Formatted channel data
 */
function formatChannel(channel) {
  // Base channel data
  const formattedChannel = {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    createdAt: channel.createdAt,
    position: channel.position,
    parentId: channel.parentId,
    guildId: channel.guildId
  };
  
  // Add type-specific properties
  if (channel.isTextBased()) {
    formattedChannel.isTextBased = true;
    formattedChannel.nsfw = channel.nsfw;
    formattedChannel.topic = channel.topic;
    formattedChannel.lastMessageId = channel.lastMessageId;
    formattedChannel.rateLimitPerUser = channel.rateLimitPerUser;
  }
  
  if (channel.isVoiceBased()) {
    formattedChannel.isVoiceBased = true;
    formattedChannel.bitrate = channel.bitrate;
    formattedChannel.userLimit = channel.userLimit;
    formattedChannel.rtcRegion = channel.rtcRegion;
    formattedChannel.members = channel.members?.size || 0;
  }
  
  // Forum channel properties
  if (channel.type === 15) { // GUILD_FORUM
    formattedChannel.availableTags = channel.availableTags;
    formattedChannel.defaultReactionEmoji = channel.defaultReactionEmoji;
    formattedChannel.defaultThreadRateLimitPerUser = channel.defaultThreadRateLimitPerUser;
  }
  
  return formattedChannel;
}

/**
 * Handle requests for channel information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
async function handleChannelsRequest(req, res) {
  try {
    const client = req.discordClient;
    
    if (!client) {
      return res.status(500).json({ error: 'Discord client not available' });
    }
    
    // Get guild ID from request
    const guildId = req.params.guildId;
    
    if (!guildId) {
      return res.status(400).json({ error: 'Guild ID is required' });
    }
    
    // Get guild
    try {
      const guild = await client.guilds.fetch(guildId);
      
      if (!guild) {
        return res.status(404).json({ error: 'Guild not found' });
      }
      
      // Check if specific channel ID is requested
      const channelId = req.params.channelId;
      
      if (channelId) {
        // Get specific channel
        try {
          const channel = await guild.channels.fetch(channelId);
          
          if (!channel) {
            return res.status(404).json({ error: 'Channel not found' });
          }
          
          const formattedChannel = formatChannel(channel);
          
          return res.json(formattedChannel);
        } catch (error) {
          logger.error(`Error fetching channel ${channelId}:`, error);
          return res.status(404).json({ error: 'Channel not found' });
        }
      }
      
      // Get all channels
      const channels = [];
      
      // Fetch all channels and sort by position
      const guildChannels = Array.from(guild.channels.cache.values())
        .sort((a, b) => a.position - b.position);
      
      for (const channel of guildChannels) {
        channels.push(formatChannel(channel));
      }
      
      return res.json(channels);
    } catch (error) {
      logger.error(`Error fetching guild ${guildId}:`, error);
      return res.status(404).json({ error: 'Guild not found' });
    }
  } catch (error) {
    logger.error('Error handling channels request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  handleChannelsRequest
};