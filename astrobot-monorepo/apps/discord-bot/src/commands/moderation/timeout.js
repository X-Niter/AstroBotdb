const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const modLogManager = require('../../lib/moderation-log');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('duration')
        .setDescription('The duration of the timeout')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('time_unit')
        .setDescription('The time unit for the duration')
        .setRequired(true)
        .addChoices(
          { name: 'Seconds', value: 'seconds' },
          { name: 'Minutes', value: 'minutes' },
          { name: 'Hours', value: 'hours' },
          { name: 'Days', value: 'days' }
        ))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for the timeout')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('silent')
        .setDescription('Whether to send the timeout silently (only visible to moderators)')
        .setRequired(false)),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get options
      const user = interaction.options.getUser('user');
      const duration = interaction.options.getInteger('duration');
      const timeUnit = interaction.options.getString('time_unit');
      const reason = interaction.options.getString('reason');
      const silent = interaction.options.getBoolean('silent') || false;
      
      // Get member
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      
      // Check if member exists in the guild
      if (!member) {
        return await interaction.reply({
          content: `Could not find member ${user.tag} in this server.`,
          ephemeral: true
        });
      }
      
      // Check if user is moderator or admin (or has a role higher than bot)
      if (member.permissions.has(PermissionFlagsBits.ModerateMembers) || 
          member.permissions.has(PermissionFlagsBits.Administrator) ||
          member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
        return await interaction.reply({
          content: `I cannot timeout ${user.tag} because they are a moderator, administrator, or have a role higher than me.`,
          ephemeral: true
        });
      }
      
      // Convert duration to milliseconds
      let durationMs;
      switch (timeUnit) {
        case 'seconds':
          durationMs = duration * 1000;
          break;
        case 'minutes':
          durationMs = duration * 60 * 1000;
          break;
        case 'hours':
          durationMs = duration * 60 * 60 * 1000;
          break;
        case 'days':
          durationMs = duration * 24 * 60 * 60 * 1000;
          break;
        default:
          return await interaction.reply({
            content: 'Invalid time unit.',
            ephemeral: true
          });
      }
      
      // Check max timeout duration (28 days)
      const maxTimeoutMs = 28 * 24 * 60 * 60 * 1000;
      if (durationMs > maxTimeoutMs) {
        return await interaction.reply({
          content: 'Timeout duration cannot exceed 28 days.',
          ephemeral: true
        });
      }
      
      // Format duration for display
      const formattedDuration = formatDuration(durationMs);
      
      // Apply timeout
      await member.timeout(durationMs, reason);
      
      // Create timeout embed
      const timeoutEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle('User Timed Out')
        .setDescription(`${user} has been timed out.`)
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Duration', value: formattedDuration, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      
      // Create DM embed
      const dmEmbed = new EmbedBuilder()
        .setColor('#FFFF00')
        .setTitle(`You have been timed out in ${interaction.guild.name}`)
        .addFields(
          { name: 'Duration', value: formattedDuration, inline: true },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();
      
      // Try to send DM to user
      try {
        await user.send({ embeds: [dmEmbed] });
      } catch (error) {
        logger.warn(`Could not send DM to ${user.tag}:`, error);
        
        // Add note to timeout embed
        timeoutEmbed.addFields({
          name: 'Note',
          value: 'Could not send DM to user.'
        });
      }
      
      // Log the timeout to the moderation log
      modLogManager.logAction({
        guildId: interaction.guildId,
        actionType: modLogManager.ACTION_TYPES.TIMEOUT,
        moderatorId: interaction.user.id,
        targetId: user.id,
        reason,
        additionalData: {
          duration: durationMs
        }
      });
      
      // Reply with timeout confirmation
      await interaction.reply({
        embeds: [timeoutEmbed],
        ephemeral: silent
      });
    } catch (error) {
      logger.error('Error executing timeout command:', error);
      
      await interaction.reply({
        content: `There was an error timing out this user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

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
  
  const parts = [];
  
  if (days > 0) {
    parts.push(`${days} day${days === 1 ? '' : 's'}`);
  }
  
  if (hours % 24 > 0) {
    parts.push(`${hours % 24} hour${hours % 24 === 1 ? '' : 's'}`);
  }
  
  if (minutes % 60 > 0) {
    parts.push(`${minutes % 60} minute${minutes % 60 === 1 ? '' : 's'}`);
  }
  
  if (seconds % 60 > 0 && parts.length === 0) {
    parts.push(`${seconds % 60} second${seconds % 60 === 1 ? '' : 's'}`);
  }
  
  return parts.join(', ');
}