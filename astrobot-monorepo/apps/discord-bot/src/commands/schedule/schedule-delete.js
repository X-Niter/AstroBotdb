const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const scheduler = require('../../lib/scheduler');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('schedule-delete')
    .setDescription('Delete a scheduled message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => 
      option.setName('id')
        .setDescription('The ID of the schedule to delete')
        .setRequired(true)),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get command options
      const scheduleId = interaction.options.getString('id');
      
      // Get the schedule
      const schedule = scheduler.getSchedule(scheduleId);
      
      if (!schedule) {
        return await interaction.reply({
          content: `Schedule with ID \`${scheduleId}\` not found.`,
          ephemeral: true
        });
      }
      
      // Check if the schedule belongs to this guild
      if (schedule.guildId !== interaction.guildId) {
        return await interaction.reply({
          content: `Schedule with ID \`${scheduleId}\` does not belong to this server.`,
          ephemeral: true
        });
      }
      
      // Delete the schedule
      const deleted = scheduler.deleteSchedule(scheduleId);
      
      if (!deleted) {
        return await interaction.reply({
          content: `Failed to delete schedule with ID \`${scheduleId}\`.`,
          ephemeral: true
        });
      }
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Schedule Deleted')
        .setDescription(`Successfully deleted the scheduled message.`)
        .addFields(
          { name: 'Schedule ID', value: scheduleId, inline: true },
          { name: 'Channel', value: `<#${schedule.channelId}>`, inline: true },
          { name: 'Type', value: schedule.type === scheduler.ScheduleType.ONCE ? 'One-time' : 'Recurring', inline: true }
        );
      
      // Add message preview field
      const messagePreview = schedule.message.length > 100 ? schedule.message.substring(0, 97) + '...' : schedule.message;
      embed.addFields({ name: 'Message Preview', value: messagePreview });
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing schedule-delete command:', error);
      
      await interaction.reply({
        content: `There was an error deleting the schedule: ${error.message}`,
        ephemeral: true
      });
    }
  }
};