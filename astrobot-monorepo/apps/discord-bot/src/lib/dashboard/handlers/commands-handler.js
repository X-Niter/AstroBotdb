/**
 * Commands API Handler
 * Handles requests for bot command information
 */

const logger = require('../../logger');

/**
 * Format a command object for API response
 * @param {ApplicationCommand} command - The Discord.js ApplicationCommand object
 * @returns {Object} Formatted command data
 */
function formatCommand(command) {
  return {
    id: command.id,
    name: command.name,
    description: command.description,
    type: command.type,
    guildId: command.guildId,
    options: command.options,
    defaultMemberPermissions: command.defaultMemberPermissions?.bitfield.toString() || null,
    dmPermission: command.dmPermission,
    nsfw: command.nsfw,
    createdAt: command.createdAt,
    applicationId: command.applicationId
  };
}

/**
 * Get all commands (global and guild-specific)
 * @param {Client} client - The Discord client
 * @returns {Promise<Array<Object>>} Array of formatted command objects
 */
async function getAllCommands(client) {
  try {
    // Get global commands
    const globalCommands = await client.application.commands.fetch();
    const formatted = globalCommands.map(cmd => formatCommand(cmd));
    
    // Get guild-specific commands for each guild
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const guildCommands = await guild.commands.fetch();
        formatted.push(...guildCommands.map(cmd => formatCommand(cmd)));
      } catch (error) {
        logger.warn(`Error fetching commands for guild ${guildId}:`, error);
      }
    }
    
    return formatted;
  } catch (error) {
    logger.error('Error getting all commands:', error);
    throw error;
  }
}

/**
 * Handle requests for command information
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
async function handleCommandsRequest(req, res) {
  try {
    const client = req.discordClient;
    
    if (!client) {
      return res.status(500).json({ error: 'Discord client not available' });
    }
    
    // Check if specific command ID is requested
    const commandId = req.params.commandId;
    
    if (commandId) {
      // Try to find command globally
      try {
        const command = await client.application.commands.fetch(commandId);
        
        if (command) {
          return res.json(formatCommand(command));
        }
      } catch (error) {
        // Command not found globally, try in guilds
      }
      
      // Try to find command in each guild
      for (const [guildId, guild] of client.guilds.cache) {
        try {
          const command = await guild.commands.fetch(commandId);
          
          if (command) {
            return res.json(formatCommand(command));
          }
        } catch (error) {
          // Command not found in this guild
        }
      }
      
      // Command not found anywhere
      return res.status(404).json({ error: 'Command not found' });
    }
    
    // Get all commands
    const commands = await getAllCommands(client);
    
    // Apply filters if provided
    let filteredCommands = commands;
    
    // Filter by guild ID
    if (req.query.guildId) {
      filteredCommands = filteredCommands.filter(cmd => 
        cmd.guildId === req.query.guildId
      );
    }
    
    // Filter by command type
    if (req.query.type) {
      filteredCommands = filteredCommands.filter(cmd => 
        cmd.type === parseInt(req.query.type)
      );
    }
    
    // Filter by name contains
    if (req.query.name) {
      const searchTerm = req.query.name.toLowerCase();
      filteredCommands = filteredCommands.filter(cmd => 
        cmd.name.toLowerCase().includes(searchTerm)
      );
    }
    
    return res.json(filteredCommands);
  } catch (error) {
    logger.error('Error handling commands request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  handleCommandsRequest
};