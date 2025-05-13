const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const scheduler = require('../../lib/scheduler');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('schedule-list')
    .setDescription('List all scheduled messages for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get schedules for this guild
      const schedules = scheduler.getSchedulesForGuild(interaction.guildId);
      
      if (schedules.length === 0) {
        return await interaction.reply({
          content: 'There are no scheduled messages for this server.',
          ephemeral: true
        });
      }
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Scheduled Messages')
        .setDescription(`Found ${schedules.length} scheduled message${schedules.length === 1 ? '' : 's'} for this server.`);
      
      // Sort schedules by date
      schedules.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Add fields for each schedule
      schedules.forEach((schedule, index) => {
        // Format the date
        const formattedDate = formatDate(schedule.date);
        
        // Format the message preview
        const messagePreview = schedule.message.length > 50 
          ? schedule.message.substring(0, 47) + '...' 
          : schedule.message;
        
        // Create field value
        let fieldValue = `ID: \`${schedule.id}\`\n`;
        fieldValue += `Type: ${schedule.type === scheduler.ScheduleType.ONCE ? 'One-time' : 'Recurring'}\n`;
        fieldValue += `Date: ${formattedDate}\n`;
        
        if (schedule.type === scheduler.ScheduleType.RECURRING) {
          fieldValue += `Interval: ${schedule.interval}\n`;
        }
        
        fieldValue += `Channel: <#${schedule.channelId}>\n`;
        fieldValue += `Status: ${schedule.active ? 'Active' : 'Inactive'}\n`;
        fieldValue += `Message: ${messagePreview}`;
        
        embed.addFields({ 
          name: `Schedule #${index + 1}`, 
          value: fieldValue 
        });
      });
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing schedule-list command:', error);
      
      await interaction.reply({
        content: `There was an error listing schedules: ${error.message}`,
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