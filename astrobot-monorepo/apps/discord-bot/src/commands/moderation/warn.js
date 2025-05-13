const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const modLogManager = require('../../lib/moderation-log');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for the warning')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('silent')
        .setDescription('Whether to send the warning silently (only visible to moderators)')
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
      
      // Create warning embed
      const warnEmbed = new EmbedBuilder()
        .setColor('#FF00FF')
        .setTitle('Warning')
        .setDescription(`${user} has been warned.`)
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setTimestamp();
      
      // Create DM embed
      const dmEmbed = new EmbedBuilder()
        .setColor('#FF00FF')
        .setTitle(`You have been warned in ${interaction.guild.name}`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: 'Moderator', value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();
      
      // Try to send DM to user
      try {
        await user.send({ embeds: [dmEmbed] });
      } catch (error) {
        logger.warn(`Could not send DM to ${user.tag}:`, error);
        
        // Add note to warning embed
        warnEmbed.addFields({
          name: 'Note',
          value: 'Could not send DM to user.'
        });
      }
      
      // Log the warning to the moderation log
      modLogManager.logAction({
        guildId: interaction.guildId,
        actionType: modLogManager.ACTION_TYPES.WARN,
        moderatorId: interaction.user.id,
        targetId: user.id,
        reason
      });
      
      // Reply with warning confirmation
      await interaction.reply({
        embeds: [warnEmbed],
        ephemeral: silent
      });
    } catch (error) {
      logger.error('Error executing warn command:', error);
      
      await interaction.reply({
        content: `There was an error warning this user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};