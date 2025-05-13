const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const modLogManager = require('../../lib/moderation-log');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for the ban')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('delete_messages')
        .setDescription('Delete message history (days)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7))
    .addBooleanOption(option => 
      option.setName('silent')
        .setDescription('Whether to send the ban silently (only visible to moderators)')
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
      const reason = interaction.options.getString('reason');
      const deleteMessageDays = interaction.options.getInteger('delete_messages') || 0;
      const silent = interaction.options.getBoolean('silent') || false;
      
      // Get member
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      
      // Check if member exists and can be banned
      if (member) {
        // Check if user is moderator or admin (or has a role higher than bot)
        if (member.permissions.has(PermissionFlagsBits.BanMembers) || 
            member.permissions.has(PermissionFlagsBits.Administrator) ||
            member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
          return await interaction.reply({
            content: `I cannot ban ${user.tag} because they are a moderator, administrator, or have a role higher than me.`,
            ephemeral: true
          });
        }
      }
      
      // Create ban embed
      const banEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('User Banned')
        .setDescription(`${user} has been banned from the server.`)
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setTimestamp();
      
      // Add message deletion info if applicable
      if (deleteMessageDays > 0) {
        banEmbed.addFields({
          name: 'Message History',
          value: `Deleted messages from the past ${deleteMessageDays} day(s).`,
          inline: true
        });
      }
      
      // Create DM embed
      const dmEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`You have been banned from ${interaction.guild.name}`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();
      
      // Try to send DM to user before banning
      if (member) {
        try {
          await user.send({ embeds: [dmEmbed] });
        } catch (error) {
          logger.warn(`Could not send DM to ${user.tag}:`, error);
          
          // Add note to ban embed
          banEmbed.addFields({
            name: 'Note',
            value: 'Could not send DM to user.'
          });
        }
      }
      
      // Ban the user
      await interaction.guild.members.ban(user, {
        reason,
        deleteMessageDays
      });
      
      // Log the ban to the moderation log
      modLogManager.logAction({
        guildId: interaction.guildId,
        actionType: modLogManager.ACTION_TYPES.BAN,
        moderatorId: interaction.user.id,
        targetId: user.id,
        reason,
        additionalData: {
          deleteMessageDays
        }
      });
      
      // Reply with ban confirmation
      await interaction.reply({
        embeds: [banEmbed],
        ephemeral: silent
      });
    } catch (error) {
      logger.error('Error executing ban command:', error);
      
      await interaction.reply({
        content: `There was an error banning this user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};