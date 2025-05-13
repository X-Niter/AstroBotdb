const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const reminderManager = require('../../lib/reminders/reminder-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set and manage reminders')
    .addSubcommand(subcommand =>
      subcommand.setName('me')
        .setDescription('Set a reminder')
        .addStringOption(option =>
          option.setName('time')
            .setDescription('When to remind you (e.g., "in 5 minutes", "tomorrow at 3pm")')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('content')
            .setDescription('What to remind you about')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List your active reminders'))
    .addSubcommand(subcommand =>
      subcommand.setName('cancel')
        .setDescription('Cancel a reminder')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('The ID of the reminder to cancel')
            .setRequired(true))),
  
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
      
      switch (subcommand) {
        case 'me':
          await handleSetReminder(client, interaction);
          break;
          
        case 'list':
          await handleListReminders(interaction);
          break;
          
        case 'cancel':
          await handleCancelReminder(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing remind command:', error);
      
      // Handle already replied or deferred
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(`An error occurred: ${error.message}`);
      } else {
        await interaction.reply({
          content: `An error occurred: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }
};

/**
 * Handle setting a reminder
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSetReminder(client, interaction) {
  try {
    // Get options
    const timeString = interaction.options.getString('time');
    const content = interaction.options.getString('content');
    
    // Parse time
    const parsedTime = reminderManager.parseTime(timeString);
    
    if (!parsedTime) {
      return interaction.reply({
        content: `I couldn't understand the time "${timeString}". Please provide a clearer time format.`,
        ephemeral: true
      });
    }
    
    // Create reminder
    const reminder = await reminderManager.createReminder({
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      content,
      timeString,
      client
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Reminder Set')
      .setDescription(`I'll remind you: **${content}**`)
      .addFields(
        { name: 'When', value: reminderManager.formatTimestamp(reminder.timestamp), inline: false },
        { name: 'Reminder ID', value: reminder.id, inline: false }
      )
      .setFooter({ text: 'Use /remind cancel to cancel this reminder' });
    
    // Send reply
    await interaction.reply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} set a reminder for ${new Date(reminder.timestamp)}`);
  } catch (error) {
    logger.error('Error setting reminder:', error);
    throw error;
  }
}

/**
 * Handle listing reminders
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListReminders(interaction) {
  try {
    // Get user reminders
    const reminders = reminderManager.getUserReminders(interaction.user.id);
    
    if (reminders.length === 0) {
      return interaction.reply({
        content: 'You have no active reminders.',
        ephemeral: true
      });
    }
    
    // Format reminders
    let description = '';
    
    for (const reminder of reminders) {
      description += `**ID:** ${reminder.id}\n`;
      description += `**When:** ${reminderManager.formatTimestamp(reminder.timestamp)}\n`;
      description += `**Content:** ${reminder.content}\n\n`;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Your Reminders')
      .setDescription(description)
      .setFooter({ text: `${reminders.length} active reminder(s)` });
    
    // Send reply
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error listing reminders:', error);
    throw error;
  }
}

/**
 * Handle cancelling a reminder
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleCancelReminder(interaction) {
  try {
    // Get options
    const reminderId = interaction.options.getString('id');
    
    // Cancel reminder
    const success = await reminderManager.cancelReminder(reminderId, interaction.user.id);
    
    if (!success) {
      return interaction.reply({
        content: 'Reminder not found or already completed. Make sure you entered the correct ID.',
        ephemeral: true
      });
    }
    
    // Send reply
    await interaction.reply({
      content: 'Reminder cancelled successfully.',
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} cancelled reminder ${reminderId}`);
  } catch (error) {
    logger.error('Error cancelling reminder:', error);
    throw error;
  }
}