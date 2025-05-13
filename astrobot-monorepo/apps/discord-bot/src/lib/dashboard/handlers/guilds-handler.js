/**
 * Guilds API Handler
 * Handles requests for guild (server) information
 */

const logger = require('../../logger');

/**
 * Format a guild object for API response
 * @param {Guild} guild - The Discord.js Guild object
 * @returns {Object} Formatted guild data
 */
function formatGuild(guild) {
  return {
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL({ dynamic: true }),
    memberCount: guild.memberCount,
    owner: guild.ownerId,
    features: guild.features,
    description: guild.description,
    createdAt: guild.createdAt,
    joined: guild.joinedAt,
    boostLevel: guild.premiumTier,
    boostCount: guild.premiumSubscriptionCount,
    vanityURL: guild.vanityURLCode,
    preferredLocale: guild.preferredLocale,
    shardId: guild.shardId,
    
    // Include basic permissions
    permissions: {
      administrator: guild.members.me?.permissions.has('Administrator'),
      manageGuild: guild.members.me?.permissions.has('ManageGuild'),
      manageRoles: guild.members.me?.permissions.has('ManageRoles'),
      manageChannels: guild.members.me?.permissions.has('ManageChannels'),
      manageMessages: guild.members.me?.permissions.has('ManageMessages')
    }
  };
}

/**
 * Handle requests for guild information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
async function handleGuildsRequest(req, res) {
  try {
    const client = req.discordClient;
    
    if (!client) {
      return res.status(500).json({ error: 'Discord client not available' });
    }
    
    // Check if specific guild ID is requested
    const guildId = req.params.guildId;
    
    if (guildId) {
      // Get specific guild
      try {
        const guild = await client.guilds.fetch(guildId);
        
        if (!guild) {
          return res.status(404).json({ error: 'Guild not found' });
        }
        
        const formattedGuild = formatGuild(guild);
        
        return res.json(formattedGuild);
      } catch (error) {
        logger.error(`Error fetching guild ${guildId}:`, error);
        return res.status(404).json({ error: 'Guild not found' });
      }
    }
    
    // Get all guilds
    const guilds = [];
    
    for (const [id, guild] of client.guilds.cache) {
      guilds.push(formatGuild(guild));
    }
    
    return res.json(guilds);
  } catch (error) {
    logger.error('Error handling guilds request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  handleGuildsRequest
};