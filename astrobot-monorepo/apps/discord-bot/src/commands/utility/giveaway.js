const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const giveawayManager = require('../../lib/giveaways/giveaway-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Create and manage giveaways')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand.setName('create')
        .setDescription('Create a new giveaway')
        .addStringOption(option =>
          option.setName('prize')
            .setDescription('The prize for the giveaway')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Additional description for the giveaway')
            .setRequired(false))
        .addIntegerOption(option =>
          option.setName('winners')
            .setDescription('Number of winners (default: 1)')
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false))
        .addStringOption(option =>
          option.setName('duration')
            .setDescription('How long the giveaway should last')
            .setRequired(true)
            .addChoices(
              { name: '1 minute', value: 'ONE_MINUTE' },
              { name: '5 minutes', value: 'FIVE_MINUTES' },
              { name: '15 minutes', value: 'FIFTEEN_MINUTES' },
              { name: '30 minutes', value: 'THIRTY_MINUTES' },
              { name: '1 hour', value: 'ONE_HOUR' },
              { name: '6 hours', value: 'SIX_HOURS' },
              { name: '12 hours', value: 'TWELVE_HOURS' },
              { name: '1 day', value: 'ONE_DAY' },
              { name: '3 days', value: 'THREE_DAYS' },
              { name: '1 week', value: 'ONE_WEEK' }
            ))
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to post the giveaway in (defaults to current channel)')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('required-role')
            .setDescription('Role required to enter the giveaway (optional)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List active giveaways in this server'))
    .addSubcommand(subcommand =>
      subcommand.setName('end')
        .setDescription('End a giveaway early')
        .addStringOption(option =>
          option.setName('giveaway-id')
            .setDescription('The ID of the giveaway to end')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('reroll')
        .setDescription('Reroll a giveaway to select new winners')
        .addStringOption(option =>
          option.setName('giveaway-id')
            .setDescription('The ID of the giveaway to reroll')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('winners')
            .setDescription('Number of winners to select (optional)')
            .setMinValue(1)
            .setMaxValue(10)
            .setRequired(false))),
  
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
          await handleCreateGiveaway(client, interaction);
          break;
          
        case 'list':
          await handleListGiveaways(interaction);
          break;
          
        case 'end':
          await handleEndGiveaway(interaction);
          break;
          
        case 'reroll':
          await handleRerollGiveaway(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing giveaway command:', error);
      
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
 * Handle creating a giveaway
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleCreateGiveaway(client, interaction) {
  try {
    // Get options
    const prize = interaction.options.getString('prize');
    const description = interaction.options.getString('description');
    const winnerCount = interaction.options.getInteger('winners') || 1;
    const duration = interaction.options.getString('duration');
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const requiredRole = interaction.options.getRole('required-role');
    
    // Validate channel
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
    
    // Create giveaway
    const giveaway = await giveawayManager.createGiveaway({
      prize,
      description,
      winnerCount,
      duration: giveawayManager.DURATION_OPTIONS[duration],
      channelId: channel.id,
      guildId: interaction.guildId,
      hostId: interaction.user.id,
      requiredRole: requiredRole ? requiredRole.id : null,
      client
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Giveaway Created')
      .setDescription(`Your giveaway for **${prize}** has been created in ${channel}.`)
      .addFields(
        { name: 'Winners', value: `${winnerCount}`, inline: true },
        { name: 'Duration', value: formatDuration(duration), inline: true },
        { name: 'Giveaway ID', value: giveaway.id, inline: false }
      )
      .setFooter({ text: 'Use /giveaway end to end the giveaway early' });
    
    // Add description field if provided
    if (description) {
      embed.addFields({ name: 'Description', value: description, inline: false });
    }
    
    // Add required role field if provided
    if (requiredRole) {
      embed.addFields({ name: 'Required Role', value: requiredRole.toString(), inline: false });
    }
    
    // Send reply
    await interaction.editReply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} created a giveaway in ${channel.name}`);
  } catch (error) {
    logger.error('Error creating giveaway:', error);
    
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
 * Handle listing active giveaways
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListGiveaways(interaction) {
  try {
    // Get active giveaways
    const activeGiveaways = giveawayManager.getActiveGiveaways(interaction.guildId);
    
    if (activeGiveaways.length === 0) {
      return interaction.reply({
        content: 'There are no active giveaways in this server.',
        ephemeral: true
      });
    }
    
    // Format giveaway list
    let description = '';
    
    for (const giveaway of activeGiveaways) {
      const channel = interaction.guild.channels.cache.get(giveaway.channelId);
      const channelName = channel ? `<#${channel.id}>` : 'Unknown Channel';
      const timeRemaining = formatTimeRemaining(giveaway.endTime - Date.now());
      
      description += `**Prize:** ${giveaway.prize}\n`;
      description += `**Channel:** ${channelName}\n`;
      description += `**Winners:** ${giveaway.winnerCount}\n`;
      description += `**Entries:** ${giveaway.entries.length}\n`;
      description += `**ID:** \`${giveaway.id}\`\n`;
      description += `**Time remaining:** ${timeRemaining}\n\n`;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Active Giveaways')
      .setDescription(description)
      .setFooter({ text: `${activeGiveaways.length} active giveaway(s)` });
    
    // Send reply
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error('Error listing giveaways:', error);
    throw error;
  }
}

/**
 * Handle ending a giveaway early
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleEndGiveaway(interaction) {
  try {
    // Get options
    const giveawayId = interaction.options.getString('giveaway-id');
    
    // Get giveaway
    const giveaway = giveawayManager.getGiveaway(giveawayId);
    
    if (!giveaway) {
      return interaction.reply({
        content: 'Giveaway not found. Make sure you entered the correct ID.',
        ephemeral: true
      });
    }
    
    if (giveaway.ended) {
      return interaction.reply({
        content: 'This giveaway has already ended.',
        ephemeral: true
      });
    }
    
    // Check if user is authorized to end the giveaway
    if (giveaway.hostId !== interaction.user.id && !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: 'You can only end giveaways that you created, unless you have the "Manage Server" permission.',
        ephemeral: true
      });
    }
    
    // Defer reply
    await interaction.deferReply();
    
    // End giveaway
    const success = await giveawayManager.endGiveawayEarly(giveawayId);
    
    if (!success) {
      return interaction.editReply('Failed to end the giveaway. It may have already ended.');
    }
    
    // Send reply
    await interaction.editReply(`Giveaway for **${giveaway.prize}** has been ended.`);
    
    logger.info(`User ${interaction.user.tag} ended giveaway ${giveawayId}`);
  } catch (error) {
    logger.error('Error ending giveaway:', error);
    throw error;
  }
}

/**
 * Handle rerolling a giveaway
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRerollGiveaway(interaction) {
  try {
    // Get options
    const giveawayId = interaction.options.getString('giveaway-id');
    const winnerCount = interaction.options.getInteger('winners');
    
    // Get giveaway
    const giveaway = giveawayManager.getGiveaway(giveawayId);
    
    if (!giveaway) {
      return interaction.reply({
        content: 'Giveaway not found. Make sure you entered the correct ID.',
        ephemeral: true
      });
    }
    
    if (!giveaway.ended) {
      return interaction.reply({
        content: 'This giveaway has not ended yet. You can only reroll ended giveaways.',
        ephemeral: true
      });
    }
    
    // Check if user is authorized to reroll the giveaway
    if (giveaway.hostId !== interaction.user.id && !interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: 'You can only reroll giveaways that you created, unless you have the "Manage Server" permission.',
        ephemeral: true
      });
    }
    
    // Check if there are enough entries
    if (giveaway.entries.length === 0) {
      return interaction.reply({
        content: 'This giveaway has no entries, so it cannot be rerolled.',
        ephemeral: true
      });
    }
    
    // Defer reply
    await interaction.deferReply();
    
    // Reroll giveaway
    const success = await giveawayManager.rerollGiveaway(giveawayId, winnerCount);
    
    if (!success) {
      return interaction.editReply('Failed to reroll the giveaway.');
    }
    
    // Send reply
    await interaction.editReply(`Giveaway for **${giveaway.prize}** has been rerolled with new winners.`);
    
    logger.info(`User ${interaction.user.tag} rerolled giveaway ${giveawayId}`);
  } catch (error) {
    logger.error('Error rerolling giveaway:', error);
    throw error;
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