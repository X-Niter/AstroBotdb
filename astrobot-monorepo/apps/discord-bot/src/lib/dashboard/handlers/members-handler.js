/**
 * Members API Handler
 * Handles requests for guild member information
 */

const logger = require('../../logger');

/**
 * Format a member object for API response
 * @param {GuildMember} member - The Discord.js GuildMember object
 * @returns {Object} Formatted member data
 */
function formatMember(member) {
  return {
    id: member.id,
    user: {
      id: member.user.id,
      username: member.user.username,
      displayName: member.user.displayName,
      discriminator: member.user.discriminator || null,
      avatar: member.user.displayAvatarURL({ dynamic: true }),
      bot: member.user.bot,
      system: member.user.system,
      createdAt: member.user.createdAt
    },
    nickname: member.nickname,
    displayName: member.displayName,
    roles: member.roles.cache.map(role => ({
      id: role.id,
      name: role.name,
      color: role.hexColor,
      position: role.position,
      permissions: role.permissions.bitfield.toString()
    })),
    joinedAt: member.joinedAt,
    premiumSince: member.premiumSince,
    communicationDisabledUntil: member.communicationDisabledUntil,
    pending: member.pending,
    avatar: member.avatarURL({ dynamic: true })
  };
}

/**
 * Handle requests for member information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
async function handleMembersRequest(req, res) {
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
      
      // Check if specific member ID is requested
      const memberId = req.params.memberId;
      
      if (memberId) {
        // Get specific member
        try {
          const member = await guild.members.fetch(memberId);
          
          if (!member) {
            return res.status(404).json({ error: 'Member not found' });
          }
          
          const formattedMember = formatMember(member);
          
          return res.json(formattedMember);
        } catch (error) {
          logger.error(`Error fetching member ${memberId}:`, error);
          return res.status(404).json({ error: 'Member not found' });
        }
      }
      
      // Get query parameters
      const limit = parseInt(req.query.limit) || 100;
      const after = req.query.after || null;
      const searchTerm = req.query.search || null;
      const roleId = req.query.role || null;
      
      // Fetch members with options
      try {
        const options = {
          limit,
          after
        };
        
        const members = await guild.members.list(options);
        
        // Filter members if search term is provided
        let filteredMembers = Array.from(members.values());
        
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredMembers = filteredMembers.filter(member => 
            member.user.username.toLowerCase().includes(searchLower) ||
            (member.nickname && member.nickname.toLowerCase().includes(searchLower)) ||
            member.user.id === searchTerm
          );
        }
        
        // Filter by role if provided
        if (roleId) {
          filteredMembers = filteredMembers.filter(member => 
            member.roles.cache.has(roleId)
          );
        }
        
        // Format and return members
        const formattedMembers = filteredMembers.map(member => formatMember(member));
        
        return res.json(formattedMembers);
      } catch (error) {
        logger.error(`Error listing members for guild ${guildId}:`, error);
        
        // Fallback: Use cache instead of API if rate limited
        const cachedMembers = Array.from(guild.members.cache.values());
        const formattedMembers = cachedMembers.map(member => formatMember(member));
        
        // Add warning header
        res.set('X-Cache-Fallback', 'true');
        
        return res.json(formattedMembers);
      }
    } catch (error) {
      logger.error(`Error fetching guild ${guildId}:`, error);
      return res.status(404).json({ error: 'Guild not found' });
    }
  } catch (error) {
    logger.error('Error handling members request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  handleMembersRequest
};