const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const pollManager = require('../../lib/polls/poll-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create and manage polls')
    .addSubcommand(subcommand =>
      subcommand.setName('create')
        .setDescription('Create a new poll')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('The type of poll')
            .setRequired(true)
            .addChoices(
              { name: 'Yes/No', value: 'YES_NO' },
              { name: 'Multiple Choice', value: 'MULTIPLE_CHOICE' },
              { name: 'Rating (1-5 stars)', value: 'RATING' }
            ))
        .addStringOption(option =>
          option.setName('title')
            .setDescription('The poll title')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('The poll description')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('options')
            .setDescription('Options for multiple choice polls (comma-separated)')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('duration')
            .setDescription('How long the poll should last')
            .setRequired(true)
            .addChoices(
              { name: '1 minute', value: 'ONE_MINUTE' },
              { name: '5 minutes', value: 'FIVE_MINUTES' },
              { name: '15 minutes', value: 'FIFTEEN_MINUTES' },
              { name: '30 minutes', value: 'THIRTY_MINUTES' },
              { name: '1 hour', value: 'ONE_HOUR' },
              { name: '3 hours', value: 'THREE_HOURS' },
              { name: '6 hours', value: 'SIX_HOURS' },
              { name: '12 hours', value: 'TWELVE_HOURS' },
              { name: '1 day', value: 'ONE_DAY' },
              { name: '3 days', value: 'THREE_DAYS' },
              { name: '1 week', value: 'ONE_WEEK' }
            ))
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to post the poll in (defaults to current channel)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List active polls in this server'))
    .addSubcommand(subcommand =>
      subcommand.setName('end')
        .setDescription('End a poll early')
        .addStringOption(option =>
          option.setName('poll-id')
            .setDescription('The ID of the poll to end')
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
        case 'create':
          await handleCreatePoll(client, interaction);
          break;
          
        case 'list':
          await handleListPolls(interaction);
          break;
          
        case 'end':
          await handleEndPoll(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing poll command:', error);
      
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
 * Handle creating a poll
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleCreatePoll(client, interaction) {
  try {
    // Get options
    const type = interaction.options.getString('type');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const options = interaction.options.getString('options');
    const duration = interaction.options.getString('duration');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    
    // Validate options
    if (type === pollManager.POLL_TYPES.MULTIPLE_CHOICE && !options) {
      return interaction.reply({
        content: 'Multiple choice polls require options.',
        ephemeral: true
      });
    }
    
    // Parse options for multiple choice polls
    let pollOptions = [];
    
    if (type === pollManager.POLL_TYPES.MULTIPLE_CHOICE) {
      pollOptions = options.split(',').map(option => option.trim());
      
      // Check for duplicate options
      const uniqueOptions = [...new Set(pollOptions)];
      
      if (uniqueOptions.length !== pollOptions.length) {
        return interaction.reply({
          content: 'Multiple choice polls cannot have duplicate options.',
          ephemeral: true
        });
      }
      
      // Check option length
      for (const option of pollOptions) {
        if (option.length === 0) {
          return interaction.reply({
            content: 'Options cannot be empty.',
            ephemeral: true
          });
        }
        
        if (option.length > 80) {
          return interaction.reply({
            content: 'Options cannot be longer than 80 characters.',
            ephemeral: true
          });
        }
      }
      
      // Validate number of options
      if (pollOptions.length < 2 || pollOptions.length > 10) {
        return interaction.reply({
          content: 'Multiple choice polls must have between 2 and 10 options.',
          ephemeral: true
        });
      }
    }
    
    // Check if channel is a text channel
    if (!channel.isTextBased() || channel.isVoiceBased() || channel.isThread()) {
      return interaction.reply({
        content: 'The channel must be a text channel.',
        ephemeral: true
      });
    }
    
    // Check if bot has permission to send messages in the channel
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    
    if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.reply({
        content: 'I need permission to send messages and embeds in the specified channel.',
        ephemeral: true
      });
    }
    
    // Defer reply
    await interaction.deferReply();
    
    // Create poll
    const poll = await pollManager.createPoll({
      type,
      title,
      description,
      options: pollOptions,
      duration: pollManager.DURATION_OPTIONS[duration],
      channelId: channel.id,
      guildId: interaction.guildId,
      authorId: interaction.user.id,
      client
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Poll Created')
      .setDescription(`Your poll **${title}** has been created in ${channel}.`)
      .addFields(
        { name: 'Type', value: formatPollType(type), inline: true },
        { name: 'Duration', value: formatDuration(duration), inline: true },
        { name: 'Poll ID', value: poll.id, inline: false }
      )
      .setFooter({ text: 'Use /poll end to end the poll early' });
    
    // Add options field for multiple choice polls
    if (type === pollManager.POLL_TYPES.MULTIPLE_CHOICE) {
      embed.addFields({
        name: 'Options',
        value: pollOptions.map((option, index) => `${index + 1}. ${option}`).join('\n'),
        inline: false
      });
    }
    
    // Send reply
    await interaction.editReply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} created a ${formatPollType(type)} poll in ${channel.name}`);
  } catch (error) {
    logger.error('Error creating poll:', error);
    
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

/**
 * Handle listing active polls
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListPolls(interaction) {
  try {
    // Get active polls
    const activePolls = pollManager.getActivePolls(interaction.guildId);
    
    if (activePolls.length === 0) {
      return interaction.reply({
        content: 'There are no active polls in this server.',
        ephemeral: true
      });
    }
    
    // Format poll list
    let description = '';
    
    for (const poll of activePolls) {
      const channel = interaction.guild.channels.cache.get(poll.channelId);
      const channelName = channel ? `<#${channel.id}>` : 'Unknown Channel';
      const timeRemaining = formatTimeRemaining(poll.endTime - Date.now());
      
      description += `**${poll.title}**\n`;
      description += `Type: ${formatPollType(poll.type)}\n`;
      description += `Channel: ${channelName}\n`;
      description += `ID: \`${poll.id}\`\n`;
      description += `Time remaining: ${timeRemaining}\n\n`;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Active Polls')
      .setDescription(description)
      .setFooter({ text: `${activePolls.length} active poll(s)` });
    
    // Send reply
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error('Error listing polls:', error);
    throw error;
  }
}

/**
 * Handle ending a poll early
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleEndPoll(interaction) {
  try {
    // Get options
    const pollId = interaction.options.getString('poll-id');
    
    // Get poll
    const poll = Array.from(pollManager.getActivePolls(interaction.guildId))
      .find(p => p.id === pollId);
    
    if (!poll) {
      return interaction.reply({
        content: 'Poll not found. Make sure you entered the correct ID and that the poll is still active.',
        ephemeral: true
      });
    }
    
    // Check if user is authorized to end the poll
    if (poll.authorId !== interaction.user.id && !interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({
        content: 'You can only end polls that you created, unless you have the "Manage Channels" permission.',
        ephemeral: true
      });
    }
    
    // End poll
    const success = await pollManager.endPollEarly(pollId);
    
    if (!success) {
      return interaction.reply({
        content: 'Failed to end the poll. It may have already ended.',
        ephemeral: true
      });
    }
    
    // Send reply
    await interaction.reply({
      content: `Poll **${poll.title}** has been ended.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} ended poll ${pollId}`);
  } catch (error) {
    logger.error('Error ending poll:', error);
    throw error;
  }
}

/**
 * Format poll type for display
 * @param {string} type - The poll type
 * @returns {string} The formatted poll type
 */
function formatPollType(type) {
  switch (type) {
    case pollManager.POLL_TYPES.MULTIPLE_CHOICE:
      return 'Multiple Choice';
      
    case pollManager.POLL_TYPES.YES_NO:
      return 'Yes/No';
      
    case pollManager.POLL_TYPES.RATING:
      return 'Rating (1-5 stars)';
      
    default:
      return type;
  }
}

/**
 * Format duration for display
 * @param {string} duration - The duration key
 * @returns {string} The formatted duration
 */
function formatDuration(duration) {
  switch (duration) {
    case 'ONE_MINUTE':
      return '1 minute';
      
    case 'FIVE_MINUTES':
      return '5 minutes';
      
    case 'FIFTEEN_MINUTES':
      return '15 minutes';
      
    case 'THIRTY_MINUTES':
      return '30 minutes';
      
    case 'ONE_HOUR':
      return '1 hour';
      
    case 'THREE_HOURS':
      return '3 hours';
      
    case 'SIX_HOURS':
      return '6 hours';
      
    case 'TWELVE_HOURS':
      return '12 hours';
      
    case 'ONE_DAY':
      return '1 day';
      
    case 'THREE_DAYS':
      return '3 days';
      
    case 'ONE_WEEK':
      return '1 week';
      
    default:
      return duration;
  }
}

/**
 * Format time remaining
 * @param {number} ms - The time remaining in milliseconds
 * @returns {string} The formatted time
 */
function formatTimeRemaining(ms) {
  if (ms <= 0) {
    return 'Ended';
  }
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
}