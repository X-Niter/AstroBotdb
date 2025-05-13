/**
 * Roles API Handler
 * Handles requests for guild role information
 */

const logger = require('../../logger');

/**
 * Format a role object for API response
 * @param {Role} role - The Discord.js Role object
 * @returns {Object} Formatted role data
 */
function formatRole(role) {
  return {
    id: role.id,
    name: role.name,
    color: role.hexColor,
    position: role.position,
    hoist: role.hoist,
    mentionable: role.mentionable,
    managed: role.managed,
    permissions: role.permissions.bitfield.toString(),
    tags: role.tags ? {
      botId: role.tags.botId,
      integrationId: role.tags.integrationId,
      premiumSubscriber: role.tags.premiumSubscriber,
      subscriptionListingId: role.tags.subscriptionListingId,
      availableForPurchase: role.tags.availableForPurchase
    } : null,
    createdAt: role.createdAt,
    memberCount: role.members?.size || 0,
    icon: role.iconURL({ dynamic: true }),
    unicodeEmoji: role.unicodeEmoji
  };
}

/**
 * Handle requests for role information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
async function handleRolesRequest(req, res) {
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
      
      // Check if specific role ID is requested
      const roleId = req.params.roleId;
      
      if (roleId) {
        // Get specific role
        try {
          const role = await guild.roles.fetch(roleId);
          
          if (!role) {
            return res.status(404).json({ error: 'Role not found' });
          }
          
          const formattedRole = formatRole(role);
          
          return res.json(formattedRole);
        } catch (error) {
          logger.error(`Error fetching role ${roleId}:`, error);
          return res.status(404).json({ error: 'Role not found' });
        }
      }
      
      // Get all roles and sort by position (higher roles first)
      const roles = Array.from(guild.roles.cache.values())
        .sort((a, b) => b.position - a.position)
        .map(role => formatRole(role));
      
      return res.json(roles);
    } catch (error) {
      logger.error(`Error fetching guild ${guildId}:`, error);
      return res.status(404).json({ error: 'Guild not found' });
    }
  } catch (error) {
    logger.error('Error handling roles request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  handleRolesRequest
};