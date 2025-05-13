const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const scheduler = require('../../lib/scheduler');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('schedule-create')
    .setDescription('Create a scheduled message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => 
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The channel to send the message in')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('type')
        .setDescription('The schedule type')
        .setRequired(true)
        .addChoices(
          { name: 'One-time', value: 'once' },
          { name: 'Recurring', value: 'recurring' }
        ))
    .addStringOption(option => 
      option.setName('date')
        .setDescription('The date for one-time schedules (ISO format) or first occurrence for recurring schedules')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('interval')
        .setDescription('The interval for recurring schedules')
        .setRequired(false)
        .addChoices(
          { name: 'Daily', value: 'daily' },
          { name: 'Weekly', value: 'weekly' },
          { name: 'Monthly', value: 'monthly' }
        )),
  
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
      const message = interaction.options.getString('message');
      const channel = interaction.options.getChannel('channel');
      const type = interaction.options.getString('type');
      const dateString = interaction.options.getString('date');
      const interval = interaction.options.getString('interval');
      
      // Validate the channel
      if (!channel.isTextBased()) {
        return await interaction.reply({
          content: 'The channel must be a text channel!',
          ephemeral: true
        });
      }
      
      // Validate the date
      let date;
      try {
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid date');
        }
      } catch (error) {
        return await interaction.reply({
          content: 'Invalid date format! Please use ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:MM:SS).',
          ephemeral: true
        });
      }
      
      // Validate the schedule type and options
      if (type === scheduler.ScheduleType.RECURRING && !interval) {
        return await interaction.reply({
          content: 'Interval is required for recurring schedules!',
          ephemeral: true
        });
      }
      
      // Create the schedule
      const scheduleOptions = {
        guildId: interaction.guildId,
        channelId: channel.id,
        createdBy: interaction.user.id,
        message: message,
        type: type,
        date: date
      };
      
      // Add interval for recurring schedules
      if (type === scheduler.ScheduleType.RECURRING) {
        scheduleOptions.interval = interval;
      }
      
      // Create the schedule
      const scheduleId = scheduler.createSchedule(scheduleOptions);
      
      // Format the date and time for display
      const formattedDate = formatDate(date);
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Schedule Created')
        .setDescription(`Successfully created a new scheduled message.`)
        .addFields(
          { name: 'Schedule ID', value: scheduleId, inline: true },
          { name: 'Type', value: type === scheduler.ScheduleType.ONCE ? 'One-time' : 'Recurring', inline: true },
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Date', value: formattedDate, inline: true }
        );
      
      // Add interval field for recurring schedules
      if (type === scheduler.ScheduleType.RECURRING) {
        embed.addFields({ name: 'Interval', value: interval, inline: true });
      }
      
      // Add message preview field
      const messagePreview = message.length > 100 ? message.substring(0, 97) + '...' : message;
      embed.addFields({ name: 'Message Preview', value: messagePreview });
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing schedule-create command:', error);
      
      await interaction.reply({
        content: `There was an error creating the schedule: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

/**
 * Format a date for display
 * @param {Date} date - The date to format
 * @returns {string} The formatted date
 */
function formatDate(date) {
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
}