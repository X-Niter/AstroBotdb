const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const modLogManager = require('../../lib/moderation-log');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('modlog-view')
    .setDescription('View moderation logs')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(subcommand =>
      subcommand
        .setName('all')
        .setDescription('View all moderation logs')
        .addIntegerOption(option => 
          option.setName('limit')
            .setDescription('Number of logs to show (default: 10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(25))
        .addStringOption(option => 
          option.setName('action')
            .setDescription('Filter by action type')
            .setRequired(false)
            .addChoices(
              { name: 'Ban', value: 'ban' },
              { name: 'Unban', value: 'unban' },
              { name: 'Kick', value: 'kick' },
              { name: 'Timeout', value: 'timeout' },
              { name: 'Timeout Remove', value: 'timeout_remove' },
              { name: 'Warn', value: 'warn' },
              { name: 'Purge', value: 'purge' },
              { name: 'Channel Lock', value: 'channel_lock' },
              { name: 'Channel Unlock', value: 'channel_unlock' },
              { name: 'Role Add', value: 'role_add' },
              { name: 'Role Remove', value: 'role_remove' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('View moderation logs for a specific user')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to view logs for')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('limit')
            .setDescription('Number of logs to show (default: 10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(25)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('moderator')
        .setDescription('View moderation logs by a specific moderator')
        .addUserOption(option => 
          option.setName('moderator')
            .setDescription('The moderator to view logs for')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('limit')
            .setDescription('Number of logs to show (default: 10)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(25))
        .addStringOption(option => 
          option.setName('action')
            .setDescription('Filter by action type')
            .setRequired(false)
            .addChoices(
              { name: 'Ban', value: 'ban' },
              { name: 'Unban', value: 'unban' },
              { name: 'Kick', value: 'kick' },
              { name: 'Timeout', value: 'timeout' },
              { name: 'Timeout Remove', value: 'timeout_remove' },
              { name: 'Warn', value: 'warn' },
              { name: 'Purge', value: 'purge' },
              { name: 'Channel Lock', value: 'channel_lock' },
              { name: 'Channel Unlock', value: 'channel_unlock' },
              { name: 'Role Add', value: 'role_add' },
              { name: 'Role Remove', value: 'role_remove' }
            ))),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      // Get options
      const limit = interaction.options.getInteger('limit') || 10;
      
      // Prepare query options
      const queryOptions = { limit };
      
      // Check if moderation logs are enabled
      const settings = modLogManager.getGuildSettings(interaction.guildId);
      if (!settings.enabled) {
        return await interaction.reply({
          content: 'Moderation logs are currently disabled for this server.',
          ephemeral: true
        });
      }
      
      switch (subcommand) {
        case 'all': {
          // Get action filter if provided
          const actionType = interaction.options.getString('action');
          if (actionType) {
            queryOptions.actionType = actionType;
          }
          
          // Get logs
          const logs = modLogManager.getGuildLogs(interaction.guildId, queryOptions);
          
          if (logs.length === 0) {
            return await interaction.reply({
              content: 'No moderation logs found with the specified filters.',
              ephemeral: true
            });
          }
          
          // Create embed
          const embed = await createLogsEmbed(client, interaction.guild, logs, {
            title: 'Moderation Logs',
            actionType
          });
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'user': {
          // Get user
          const user = interaction.options.getUser('user');
          
          // Update query options
          queryOptions.userId = user.id;
          
          // Get logs
          const logs = modLogManager.getGuildLogs(interaction.guildId, queryOptions);
          
          if (logs.length === 0) {
            return await interaction.reply({
              content: `No moderation logs found for user ${user.tag}.`,
              ephemeral: true
            });
          }
          
          // Create embed
          const embed = await createLogsEmbed(client, interaction.guild, logs, {
            title: `Moderation Logs for ${user.tag}`,
            user
          });
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'moderator': {
          // Get moderator
          const moderator = interaction.options.getUser('moderator');
          
          // Get action filter if provided
          const actionType = interaction.options.getString('action');
          
          // Update query options
          queryOptions.moderatorId = moderator.id;
          if (actionType) {
            queryOptions.actionType = actionType;
          }
          
          // Get logs
          const logs = modLogManager.getGuildLogs(interaction.guildId, queryOptions);
          
          if (logs.length === 0) {
            return await interaction.reply({
              content: `No moderation logs found for moderator ${moderator.tag}.`,
              ephemeral: true
            });
          }
          
          // Create embed
          const embed = await createLogsEmbed(client, interaction.guild, logs, {
            title: `Moderation Logs by ${moderator.tag}`,
            moderator,
            actionType
          });
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
      }
    } catch (error) {
      logger.error('Error executing modlog-view command:', error);
      
      await interaction.reply({
        content: `There was an error viewing moderation logs: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

/**
 * Create an embed for displaying moderation logs
 * @param {Client} client - The Discord client
 * @param {Guild} guild - The Discord guild
 * @param {Array<Object>} logs - The log events
 * @param {Object} options - Additional options
 * @returns {Promise<EmbedBuilder>} The logs embed
 */
async function createLogsEmbed(client, guild, logs, options) {
  const { title, user, moderator, actionType } = options;
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(title)
    .setTimestamp();
  
  // Set thumbnail if user or moderator provided
  if (user) {
    embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
  } else if (moderator) {
    embed.setThumbnail(moderator.displayAvatarURL({ dynamic: true }));
  }
  
  // Add subtitle with filters
  let subtitle = `Showing ${logs.length} log entries`;
  
  if (actionType) {
    subtitle += ` filtered by action: ${getActionTitle(actionType)}`;
  }
  
  if (subtitle) {
    embed.setDescription(subtitle);
  }
  
  // Add log entries
  for (const log of logs) {
    const timestamp = new Date(log.timestamp).toLocaleString();
    const actionTitle = getActionTitle(log.actionType);
    
    // Try to fetch user data
    let moderatorDisplay = `<@${log.moderatorId}>`;
    let targetDisplay = log.targetId ? `<@${log.targetId}>` : 'N/A';
    
    try {
      const modUser = await client.users.fetch(log.moderatorId);
      moderatorDisplay = `${modUser.tag} (${modUser.id})`;
    } catch (error) {
      logger.debug(`Could not fetch moderator ${log.moderatorId}:`, error);
    }
    
    if (log.targetId) {
      try {
        const targetUser = await client.users.fetch(log.targetId);
        targetDisplay = `${targetUser.tag} (${targetUser.id})`;
      } catch (error) {
        logger.debug(`Could not fetch target ${log.targetId}:`, error);
      }
    }
    
    // Format field value
    let fieldValue = `**Moderator:** ${moderatorDisplay}\n`;
    if (log.targetId) {
      fieldValue += `**User:** ${targetDisplay}\n`;
    }
    
    if (log.additionalData) {
      // Add case-specific data
      const additionalData = log.additionalData;
      
      switch (log.actionType) {
        case modLogManager.ACTION_TYPES.PURGE:
          if (additionalData.count) {
            fieldValue += `**Messages:** ${additionalData.count}\n`;
          }
          if (additionalData.channelId) {
            fieldValue += `**Channel:** <#${additionalData.channelId}>\n`;
          }
          break;
          
        case modLogManager.ACTION_TYPES.CHANNEL_LOCK:
        case modLogManager.ACTION_TYPES.CHANNEL_UNLOCK:
          if (additionalData.channelId) {
            fieldValue += `**Channel:** <#${additionalData.channelId}>\n`;
          }
          break;
          
        case modLogManager.ACTION_TYPES.ROLE_ADD:
        case modLogManager.ACTION_TYPES.ROLE_REMOVE:
          if (additionalData.roleId) {
            fieldValue += `**Role:** <@&${additionalData.roleId}>\n`;
          }
          break;
          
        case modLogManager.ACTION_TYPES.TIMEOUT:
          if (additionalData.duration) {
            fieldValue += `**Duration:** ${formatDuration(additionalData.duration)}\n`;
          }
          break;
      }
    }
    
    fieldValue += `**Reason:** ${log.reason}\n`;
    fieldValue += `**Time:** ${timestamp}`;
    
    embed.addFields({ 
      name: `${actionTitle} (Case ${log.id})`, 
      value: fieldValue 
    });
  }
  
  return embed;
}

/**
 * Get a readable title for an action type
 * @param {string} actionType - The action type
 * @returns {string} The readable title
 */
function getActionTitle(actionType) {
  switch (actionType) {
    case 'ban': return 'Ban';
    case 'unban': return 'Unban';
    case 'kick': return 'Kick';
    case 'timeout': return 'Timeout';
    case 'timeout_remove': return 'Timeout Removed';
    case 'warn': return 'Warning';
    case 'purge': return 'Message Purge';
    case 'channel_lock': return 'Channel Lock';
    case 'channel_unlock': return 'Channel Unlock';
    case 'role_add': return 'Role Added';
    case 'role_remove': return 'Role Removed';
    default: return 'Unknown Action';
  }
}

/**
 * Format a duration in milliseconds to a readable string
 * @param {number} ms - The duration in milliseconds
 * @returns {string} The formatted duration
 */
function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days === 1 ? '' : 's'}`;
  } else if (hours > 0) {
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  } else {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }
}