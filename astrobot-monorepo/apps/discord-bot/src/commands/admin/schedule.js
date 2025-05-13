const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const scheduledEventManager = require('../../lib/scheduler/scheduled-event-manager');
const guildConfigManager = require('../../lib/config/guild-config-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('schedule')
    .setDescription('Manage scheduled announcements and events')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all scheduled events'))
    .addSubcommand(subcommand =>
      subcommand.setName('create')
        .setDescription('Create a scheduled announcement')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The name of the scheduled event')
            .setRequired(true))
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to post the announcement in')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('type')
            .setDescription('The type of schedule')
            .setRequired(true)
            .addChoices(
              { name: 'One-time event', value: 'one-time' },
              { name: 'Recurring event', value: 'recurring' },
              { name: 'Cron expression', value: 'cron' }
            ))
        .addStringOption(option =>
          option.setName('message')
            .setDescription('The message content to post')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('date')
            .setDescription('The date (YYYY-MM-DD) for one-time events'))
        .addStringOption(option =>
          option.setName('time')
            .setDescription('The time (HH:MM) in 24-hour format'))
        .addStringOption(option =>
          option.setName('recurring')
            .setDescription('The recurring interval (for recurring events)')
            .addChoices(
              { name: 'Daily', value: 'daily' },
              { name: 'Weekly', value: 'weekly' },
              { name: 'Monthly', value: 'monthly' }
            ))
        .addStringOption(option =>
          option.setName('day')
            .setDescription('The day of the week (for weekly recurring events)')
            .addChoices(
              { name: 'Monday', value: 'monday' },
              { name: 'Tuesday', value: 'tuesday' },
              { name: 'Wednesday', value: 'wednesday' },
              { name: 'Thursday', value: 'thursday' },
              { name: 'Friday', value: 'friday' },
              { name: 'Saturday', value: 'saturday' },
              { name: 'Sunday', value: 'sunday' }
            ))
        .addIntegerOption(option =>
          option.setName('date-of-month')
            .setDescription('The date of the month (1-31) for monthly recurring events')
            .setMinValue(1)
            .setMaxValue(31))
        .addStringOption(option =>
          option.setName('cron')
            .setDescription('Cron expression (for cron type events)'))
        .addBooleanOption(option =>
          option.setName('allow-mentions')
            .setDescription('Whether to allow mentions in the message')))
    .addSubcommand(subcommand =>
      subcommand.setName('delete')
        .setDescription('Delete a scheduled event')
        .addStringOption(option =>
          option.setName('event-id')
            .setDescription('The ID of the event to delete')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('info')
        .setDescription('Get information about a scheduled event')
        .addStringOption(option =>
          option.setName('event-id')
            .setDescription('The ID of the event to view')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('enable')
        .setDescription('Enable a scheduled event')
        .addStringOption(option =>
          option.setName('event-id')
            .setDescription('The ID of the event to enable')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('disable')
        .setDescription('Disable a scheduled event')
        .addStringOption(option =>
          option.setName('event-id')
            .setDescription('The ID of the event to disable')
            .setRequired(true)
            .setAutocomplete(true))),
  
  // Cooldown in seconds
  cooldown: 3,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      // Save client in global scope for the scheduled event manager
      global.client = client;
      
      switch (subcommand) {
        case 'list':
          await handleListEvents(interaction);
          break;
          
        case 'create':
          await handleCreateEvent(interaction);
          break;
          
        case 'delete':
          await handleDeleteEvent(interaction);
          break;
          
        case 'info':
          await handleEventInfo(interaction);
          break;
          
        case 'enable':
          await handleEnableEvent(interaction);
          break;
          
        case 'disable':
          await handleDisableEvent(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing schedule command:', error);
      
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
  },
  
  /**
   * Handle autocomplete
   * @param {Client} client - The Discord client
   * @param {AutocompleteInteraction} interaction - The interaction
   */
  async autocomplete(client, interaction) {
    try {
      const focusedOption = interaction.options.getFocused(true);
      
      if (focusedOption.name === 'event-id') {
        // Get guild events
        const events = scheduledEventManager.getGuildEvents(interaction.guild.id);
        
        // Filter events based on input
        const filtered = events
          .filter(event => event.name.toLowerCase().includes(focusedOption.value.toLowerCase()))
          .slice(0, 25); // Discord limits to 25 choices
        
        // Create choices
        const choices = filtered.map(event => ({
          name: `${event.name} (ID: ${event.id})`,
          value: event.id
        }));
        
        await interaction.respond(choices);
      }
    } catch (error) {
      logger.error('Error handling autocomplete:', error);
    }
  }
};

/**
 * Handle listing events
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListEvents(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // Get guild events
    const events = scheduledEventManager.getGuildEvents(interaction.guild.id);
    
    // Check if any events exist
    if (events.length === 0) {
      return interaction.editReply({
        content: 'No scheduled events found for this server.'
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Scheduled Events')
      .setDescription(`Found ${events.length} scheduled events for this server.`);
    
    // Group events by type
    const oneTimeEvents = events.filter(e => e.type === 'one-time');
    const recurringEvents = events.filter(e => e.type === 'recurring');
    const cronEvents = events.filter(e => e.type === 'cron');
    
    // Add one-time events
    if (oneTimeEvents.length > 0) {
      const oneTimeList = oneTimeEvents.map(e => {
        const date = new Date(e.schedule.timestamp);
        return `• ${e.enabled ? '✅' : '❌'} **${e.name}** (ID: \`${e.id}\`)
  <t:${Math.floor(date.getTime() / 1000)}:F> in <#${e.channelId}>`;
      });
      
      embed.addFields({
        name: 'One-time Events',
        value: oneTimeList.join('\n'),
        inline: false
      });
    }
    
    // Add recurring events
    if (recurringEvents.length > 0) {
      const recurringList = recurringEvents.map(e => {
        let scheduleText = '';
        
        switch (e.schedule.interval) {
          case 'daily':
            scheduleText = `Daily at ${e.schedule.hour}:${e.schedule.minute.toString().padStart(2, '0')}`;
            break;
          case 'weekly':
            scheduleText = `Every ${e.schedule.day} at ${e.schedule.hour}:${e.schedule.minute.toString().padStart(2, '0')}`;
            break;
          case 'monthly':
            scheduleText = `Monthly on day ${e.schedule.date} at ${e.schedule.hour}:${e.schedule.minute.toString().padStart(2, '0')}`;
            break;
        }
        
        return `• ${e.enabled ? '✅' : '❌'} **${e.name}** (ID: \`${e.id}\`)
  ${scheduleText} in <#${e.channelId}>`;
      });
      
      embed.addFields({
        name: 'Recurring Events',
        value: recurringList.join('\n'),
        inline: false
      });
    }
    
    // Add cron events
    if (cronEvents.length > 0) {
      const cronList = cronEvents.map(e => {
        return `• ${e.enabled ? '✅' : '❌'} **${e.name}** (ID: \`${e.id}\`)
  Cron: \`${e.schedule}\` in <#${e.channelId}>`;
      });
      
      embed.addFields({
        name: 'Advanced (Cron) Events',
        value: cronList.join('\n'),
        inline: false
      });
    }
    
    // Add footer
    embed.setFooter({
      text: 'Use /schedule info <event-id> to view details of a specific event'
    });
    
    // Send reply
    await interaction.editReply({
      embeds: [embed]
    });
  } catch (error) {
    logger.error('Error listing scheduled events:', error);
    throw error;
  }
}

/**
 * Handle creating an event
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleCreateEvent(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // Get options
    const name = interaction.options.getString('name');
    const channel = interaction.options.getChannel('channel');
    const type = interaction.options.getString('type');
    const message = interaction.options.getString('message');
    const allowMentions = interaction.options.getBoolean('allow-mentions') ?? true;
    
    // Check if channel is text-based
    if (!channel.isTextBased() || channel.isVoiceBased() || channel.isThread()) {
      return interaction.editReply('The channel must be a text channel.');
    }
    
    // Check bot permissions
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    
    if (!permissions.has(PermissionFlagsBits.SendMessages) ||
        !permissions.has(PermissionFlagsBits.ViewChannel)) {
      return interaction.editReply('I need permission to send messages and view the channel.');
    }
    
    // Prepare schedule data based on type
    let schedule;
    let validationError = null;
    
    switch (type) {
      case 'one-time':
        try {
          const dateStr = interaction.options.getString('date');
          const timeStr = interaction.options.getString('time');
          
          if (!dateStr || !timeStr) {
            validationError = 'Date and time are required for one-time events.';
            break;
          }
          
          // Parse date and time
          const [year, month, day] = dateStr.split('-').map(Number);
          const [hour, minute] = timeStr.split(':').map(Number);
          
          // Validate components
          if (isNaN(year) || isNaN(month) || isNaN(day) ||
              isNaN(hour) || isNaN(minute) ||
              month < 1 || month > 12 ||
              day < 1 || day > 31 ||
              hour < 0 || hour > 23 ||
              minute < 0 || minute > 59) {
            validationError = 'Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time.';
            break;
          }
          
          // Create date object
          const date = new Date(year, month - 1, day, hour, minute);
          
          // Check if date is in the past
          if (date < new Date()) {
            validationError = 'The scheduled time is in the past. Please choose a future date and time.';
            break;
          }
          
          // Set schedule
          schedule = {
            timestamp: date.toISOString()
          };
        } catch (error) {
          validationError = 'Invalid date or time format. Use YYYY-MM-DD for date and HH:MM for time.';
        }
        break;
        
      case 'recurring':
        try {
          const recurring = interaction.options.getString('recurring');
          const timeStr = interaction.options.getString('time');
          
          if (!recurring || !timeStr) {
            validationError = 'Recurring interval and time are required for recurring events.';
            break;
          }
          
          // Parse time
          const [hour, minute] = timeStr.split(':').map(Number);
          
          // Validate time
          if (isNaN(hour) || isNaN(minute) ||
              hour < 0 || hour > 23 ||
              minute < 0 || minute > 59) {
            validationError = 'Invalid time format. Use HH:MM in 24-hour format.';
            break;
          }
          
          // Prepare base schedule
          schedule = {
            interval: recurring,
            hour,
            minute
          };
          
          // Add specific fields based on interval
          switch (recurring) {
            case 'weekly':
              const day = interaction.options.getString('day');
              
              if (!day) {
                validationError = 'Day of the week is required for weekly recurring events.';
                break;
              }
              
              schedule.day = day;
              break;
              
            case 'monthly':
              const dateOfMonth = interaction.options.getInteger('date-of-month');
              
              if (!dateOfMonth || dateOfMonth < 1 || dateOfMonth > 31) {
                validationError = 'Date of month (1-31) is required for monthly recurring events.';
                break;
              }
              
              schedule.date = dateOfMonth;
              break;
          }
        } catch (error) {
          validationError = 'Invalid recurring schedule. Please check all required fields.';
        }
        break;
        
      case 'cron':
        const cronExpression = interaction.options.getString('cron');
        
        if (!cronExpression) {
          validationError = 'Cron expression is required for cron-type events.';
          break;
        }
        
        // Validate cron expression
        if (!scheduledEventManager.isValidCronExpression(cronExpression)) {
          validationError = 'Invalid cron expression. Please use a valid cron format.';
          break;
        }
        
        // Set schedule
        schedule = cronExpression;
        break;
    }
    
    // Return error if validation failed
    if (validationError) {
      return interaction.editReply(validationError);
    }
    
    // Get guild timezone
    const guildConfig = guildConfigManager.getGuildConfig(interaction.guild.id);
    const timezone = guildConfig.timezone || 'UTC';
    
    // Create event
    const event = await scheduledEventManager.createEvent({
      guildId: interaction.guild.id,
      channelId: channel.id,
      name,
      type,
      schedule,
      content: message,
      messageType: 'text',
      timezone,
      allowMentions,
      enabled: true,
      createdBy: interaction.user.id
    });
    
    // Create success embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Event Scheduled')
      .setDescription(`Your event "${name}" has been scheduled successfully!`)
      .addFields(
        { name: 'ID', value: event.id, inline: true },
        { name: 'Channel', value: `<#${channel.id}>`, inline: true },
        { name: 'Type', value: type, inline: true }
      )
      .setFooter({ text: 'Use /schedule list to view all scheduled events' });
    
    // Add schedule details
    let scheduleDetails = '';
    
    if (type === 'one-time') {
      const date = new Date(event.schedule.timestamp);
      scheduleDetails = `<t:${Math.floor(date.getTime() / 1000)}:F>`;
    } else if (type === 'recurring') {
      switch (event.schedule.interval) {
        case 'daily':
          scheduleDetails = `Daily at ${event.schedule.hour}:${event.schedule.minute.toString().padStart(2, '0')}`;
          break;
        case 'weekly':
          scheduleDetails = `Every ${event.schedule.day} at ${event.schedule.hour}:${event.schedule.minute.toString().padStart(2, '0')}`;
          break;
        case 'monthly':
          scheduleDetails = `Monthly on day ${event.schedule.date} at ${event.schedule.hour}:${event.schedule.minute.toString().padStart(2, '0')}`;
          break;
      }
    } else {
      scheduleDetails = `Cron: \`${event.schedule}\``;
    }
    
    embed.addFields({ name: 'Schedule', value: scheduleDetails, inline: false });
    
    // Add timezone
    embed.addFields({ name: 'Timezone', value: event.timezone, inline: true });
    
    // Add message preview
    if (event.content.length > 100) {
      embed.addFields({ name: 'Message Preview', value: event.content.substring(0, 100) + '...', inline: false });
    } else {
      embed.addFields({ name: 'Message', value: event.content, inline: false });
    }
    
    // Send reply
    await interaction.editReply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} created scheduled event "${name}" in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error creating scheduled event:', error);
    throw error;
  }
}

/**
 * Handle deleting an event
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleDeleteEvent(interaction) {
  try {
    const eventId = interaction.options.getString('event-id');
    
    // Get event
    const event = scheduledEventManager.getEvent(eventId);
    
    // Check if event exists
    if (!event) {
      return interaction.reply({
        content: `No event found with ID ${eventId}.`,
        ephemeral: true
      });
    }
    
    // Check if event belongs to this guild
    if (event.guildId !== interaction.guild.id) {
      return interaction.reply({
        content: 'You can only delete events for this server.',
        ephemeral: true
      });
    }
    
    // Delete event
    await scheduledEventManager.deleteEvent(eventId);
    
    // Send reply
    await interaction.reply({
      content: `Event "${event.name}" has been deleted.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} deleted scheduled event "${event.name}" in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error deleting scheduled event:', error);
    throw error;
  }
}

/**
 * Handle getting event info
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleEventInfo(interaction) {
  try {
    const eventId = interaction.options.getString('event-id');
    
    // Get event
    const event = scheduledEventManager.getEvent(eventId);
    
    // Check if event exists
    if (!event) {
      return interaction.reply({
        content: `No event found with ID ${eventId}.`,
        ephemeral: true
      });
    }
    
    // Check if event belongs to this guild
    if (event.guildId !== interaction.guild.id) {
      return interaction.reply({
        content: 'You can only view events for this server.',
        ephemeral: true
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`Event: ${event.name}`)
      .addFields(
        { name: 'ID', value: event.id, inline: true },
        { name: 'Status', value: event.enabled ? 'Enabled ✅' : 'Disabled ❌', inline: true },
        { name: 'Channel', value: `<#${event.channelId}>`, inline: true },
        { name: 'Type', value: event.type, inline: true },
        { name: 'Timezone', value: event.timezone, inline: true },
        { name: 'Allows Mentions', value: event.allowMentions ? 'Yes' : 'No', inline: true }
      );
    
    // Add schedule details
    let scheduleDetails = '';
    
    if (event.type === 'one-time') {
      const date = new Date(event.schedule.timestamp);
      scheduleDetails = `<t:${Math.floor(date.getTime() / 1000)}:F>`;
    } else if (event.type === 'recurring') {
      switch (event.schedule.interval) {
        case 'daily':
          scheduleDetails = `Daily at ${event.schedule.hour}:${event.schedule.minute.toString().padStart(2, '0')}`;
          break;
        case 'weekly':
          scheduleDetails = `Every ${event.schedule.day} at ${event.schedule.hour}:${event.schedule.minute.toString().padStart(2, '0')}`;
          break;
        case 'monthly':
          scheduleDetails = `Monthly on day ${event.schedule.date} at ${event.schedule.hour}:${event.schedule.minute.toString().padStart(2, '0')}`;
          break;
      }
    } else {
      scheduleDetails = `Cron: \`${event.schedule}\``;
    }
    
    embed.addFields({ name: 'Schedule', value: scheduleDetails, inline: false });
    
    // Add content
    if (event.content) {
      if (event.content.length > 1024) {
        embed.addFields({ name: 'Message Content (Truncated)', value: event.content.substring(0, 1021) + '...', inline: false });
      } else {
        embed.addFields({ name: 'Message Content', value: event.content, inline: false });
      }
    }
    
    // Add creator info if available
    if (event.createdBy) {
      try {
        const creator = await interaction.client.users.fetch(event.createdBy);
        embed.addFields({ name: 'Created By', value: creator.tag, inline: true });
      } catch (error) {
        embed.addFields({ name: 'Created By', value: `Unknown (${event.createdBy})`, inline: true });
      }
    }
    
    // Add timestamps
    embed.addFields({ name: 'Created', value: `<t:${Math.floor(new Date(event.createdAt).getTime() / 1000)}:R>`, inline: true });
    
    if (event.lastUpdated) {
      embed.addFields({ name: 'Last Updated', value: `<t:${Math.floor(new Date(event.lastUpdated).getTime() / 1000)}:R>`, inline: true });
    }
    
    // Add footer
    embed.setFooter({
      text: 'Use /schedule enable or /schedule disable to change the event status'
    });
    
    // Send reply
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error getting event info:', error);
    throw error;
  }
}

/**
 * Handle enabling an event
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleEnableEvent(interaction) {
  try {
    const eventId = interaction.options.getString('event-id');
    
    // Get event
    const event = scheduledEventManager.getEvent(eventId);
    
    // Check if event exists
    if (!event) {
      return interaction.reply({
        content: `No event found with ID ${eventId}.`,
        ephemeral: true
      });
    }
    
    // Check if event belongs to this guild
    if (event.guildId !== interaction.guild.id) {
      return interaction.reply({
        content: 'You can only manage events for this server.',
        ephemeral: true
      });
    }
    
    // Check if already enabled
    if (event.enabled) {
      return interaction.reply({
        content: `Event "${event.name}" is already enabled.`,
        ephemeral: true
      });
    }
    
    // Enable event
    await scheduledEventManager.updateEvent(eventId, { enabled: true });
    
    // Send reply
    await interaction.reply({
      content: `Event "${event.name}" has been enabled.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} enabled scheduled event "${event.name}" in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error enabling scheduled event:', error);
    throw error;
  }
}

/**
 * Handle disabling an event
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleDisableEvent(interaction) {
  try {
    const eventId = interaction.options.getString('event-id');
    
    // Get event
    const event = scheduledEventManager.getEvent(eventId);
    
    // Check if event exists
    if (!event) {
      return interaction.reply({
        content: `No event found with ID ${eventId}.`,
        ephemeral: true
      });
    }
    
    // Check if event belongs to this guild
    if (event.guildId !== interaction.guild.id) {
      return interaction.reply({
        content: 'You can only manage events for this server.',
        ephemeral: true
      });
    }
    
    // Check if already disabled
    if (!event.enabled) {
      return interaction.reply({
        content: `Event "${event.name}" is already disabled.`,
        ephemeral: true
      });
    }
    
    // Disable event
    await scheduledEventManager.updateEvent(eventId, { enabled: false });
    
    // Send reply
    await interaction.reply({
      content: `Event "${event.name}" has been disabled.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} disabled scheduled event "${event.name}" in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error disabling scheduled event:', error);
    throw error;
  }
}