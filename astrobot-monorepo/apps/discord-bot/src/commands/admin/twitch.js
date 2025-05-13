const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const twitchManager = require('../../lib/twitch/twitch-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('twitch')
    .setDescription('Manage Twitch streamer notifications')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand.setName('track')
        .setDescription('Track a Twitch streamer for live notifications')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('The Twitch username')
            .setRequired(true))
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send notifications to (defaults to current channel)')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('disable-updates')
            .setDescription('Disable notifications for stream title/game changes')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('untrack')
        .setDescription('Stop tracking a Twitch streamer')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('The Twitch username to untrack')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all tracked Twitch streamers'))
    .addSubcommand(subcommand =>
      subcommand.setName('set-channel')
        .setDescription('Set the channel for Twitch notifications')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send notifications to')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('toggle-updates')
        .setDescription('Toggle notifications for stream title/game changes')
        .addBooleanOption(option =>
          option.setName('disable')
            .setDescription('Whether to disable update notifications')
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
      // Save client in global scope for the Twitch manager
      global.client = client;
      
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'track':
          await handleTrackStreamer(interaction);
          break;
          
        case 'untrack':
          await handleUntrackStreamer(interaction);
          break;
          
        case 'list':
          await handleListStreamers(interaction);
          break;
          
        case 'set-channel':
          await handleSetChannel(interaction);
          break;
          
        case 'toggle-updates':
          await handleToggleUpdates(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing twitch command:', error);
      
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
 * Handle tracking a Twitch streamer
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleTrackStreamer(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // Check if Twitch API is configured
    if (!twitchManager.isTwitchApiConfigured()) {
      return interaction.editReply('Twitch API is not configured. Please contact the bot administrator.');
    }
    
    // Get options
    const username = interaction.options.getString('username').trim().toLowerCase();
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const disableUpdates = interaction.options.getBoolean('disable-updates') || false;
    
    // Check if channel is text-based
    if (!channel.isTextBased() || channel.isVoiceBased() || channel.isThread()) {
      return interaction.editReply('The notification channel must be a text channel.');
    }
    
    // Check bot permissions
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    
    if (!permissions.has(PermissionFlagsBits.SendMessages) ||
        !permissions.has(PermissionFlagsBits.ViewChannel) ||
        !permissions.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.editReply('I need permission to send messages, view the channel, and embed links in the notification channel.');
    }
    
    // Check if streamer exists
    const exists = await twitchManager.checkStreamerExists(username);
    
    if (!exists) {
      return interaction.editReply(`Twitch streamer "${username}" not found. Please check the username and try again.`);
    }
    
    // Track streamer
    await twitchManager.trackStreamer(interaction.guild.id, channel.id, username, disableUpdates);
    
    // Create confirmation embed
    const embed = new EmbedBuilder()
      .setColor('#6441a5') // Twitch purple
      .setTitle('Twitch Streamer Tracked')
      .setDescription(`Now tracking [${username}](https://twitch.tv/${username})`)
      .addFields(
        { name: 'Notifications Channel', value: `${channel}`, inline: true },
        { name: 'Update Notifications', value: disableUpdates ? 'Disabled' : 'Enabled', inline: true }
      )
      .setThumbnail('https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png')
      .setFooter({ text: 'You will receive notifications when this streamer goes live' });
    
    // Send reply
    await interaction.editReply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} started tracking Twitch streamer ${username} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error tracking Twitch streamer:', error);
    throw error;
  }
}

/**
 * Handle untracking a Twitch streamer
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleUntrackStreamer(interaction) {
  try {
    // Get options
    const username = interaction.options.getString('username').trim().toLowerCase();
    
    // Get tracked streamers
    const config = twitchManager.getTrackedStreamers(interaction.guild.id);
    
    // Check if streamer is tracked
    if (!config.streamers.includes(username)) {
      return interaction.reply({
        content: `Twitch streamer "${username}" is not currently being tracked.`,
        ephemeral: true
      });
    }
    
    // Untrack streamer
    await twitchManager.untrackStreamer(interaction.guild.id, username);
    
    // Send reply
    await interaction.reply({
      content: `Stopped tracking Twitch streamer: ${username}`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} stopped tracking Twitch streamer ${username} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error untracking Twitch streamer:', error);
    throw error;
  }
}

/**
 * Handle listing tracked Twitch streamers
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListStreamers(interaction) {
  try {
    // Get tracked streamers
    const config = twitchManager.getTrackedStreamers(interaction.guild.id);
    
    // Check if any streamers are tracked
    if (config.streamers.length === 0) {
      return interaction.reply({
        content: 'No Twitch streamers are being tracked for this server.',
        ephemeral: true
      });
    }
    
    // Get notification channels
    const channelMentions = [];
    
    for (const channelId of config.channels) {
      const channel = interaction.guild.channels.cache.get(channelId);
      
      if (channel) {
        channelMentions.push(`${channel}`);
      } else {
        channelMentions.push(`Unknown channel (${channelId})`);
      }
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#6441a5') // Twitch purple
      .setTitle('Tracked Twitch Streamers')
      .setDescription(`This server is tracking ${config.streamers.length} Twitch ${config.streamers.length === 1 ? 'streamer' : 'streamers'}.`)
      .setThumbnail('https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png');
    
    // Add streamer list
    const streamerList = config.streamers.map(streamer => `• [${streamer}](https://twitch.tv/${streamer})`);
    
    embed.addFields(
      { name: 'Streamers', value: streamerList.join('\n'), inline: false },
      { name: 'Notification Channels', value: channelMentions.length > 0 ? channelMentions.join('\n') : 'No channels set', inline: false },
      { name: 'Update Notifications', value: config.disableUpdates ? 'Disabled' : 'Enabled', inline: true }
    );
    
    // Send reply
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error listing Twitch streamers:', error);
    throw error;
  }
}

/**
 * Handle setting the notification channel
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSetChannel(interaction) {
  try {
    // Get options
    const channel = interaction.options.getChannel('channel');
    
    // Check if channel is text-based
    if (!channel.isTextBased() || channel.isVoiceBased() || channel.isThread()) {
      return interaction.reply({
        content: 'The notification channel must be a text channel.',
        ephemeral: true
      });
    }
    
    // Check bot permissions
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    
    if (!permissions.has(PermissionFlagsBits.SendMessages) ||
        !permissions.has(PermissionFlagsBits.ViewChannel) ||
        !permissions.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.reply({
        content: 'I need permission to send messages, view the channel, and embed links in the notification channel.',
        ephemeral: true
      });
    }
    
    // Get tracked streamers
    const config = twitchManager.getTrackedStreamers(interaction.guild.id);
    
    // Check if any streamers are tracked
    if (config.streamers.length === 0) {
      return interaction.reply({
        content: 'No Twitch streamers are being tracked for this server. Track a streamer first using `/twitch track`.',
        ephemeral: true
      });
    }
    
    // Set notification channel
    await twitchManager.setNotificationChannels(interaction.guild.id, [channel.id]);
    
    // Send reply
    await interaction.reply({
      content: `Twitch notification channel has been set to ${channel}.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} set Twitch notification channel to ${channel.name} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error setting Twitch notification channel:', error);
    throw error;
  }
}

/**
 * Handle toggling update notifications
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleToggleUpdates(interaction) {
  try {
    // Get options
    const disable = interaction.options.getBoolean('disable');
    
    // Get tracked streamers
    const config = twitchManager.getTrackedStreamers(interaction.guild.id);
    
    // Check if any streamers are tracked
    if (config.streamers.length === 0) {
      return interaction.reply({
        content: 'No Twitch streamers are being tracked for this server. Track a streamer first using `/twitch track`.',
        ephemeral: true
      });
    }
    
    // Set update preference
    await twitchManager.setUpdatePreference(interaction.guild.id, disable);
    
    // Send reply
    await interaction.reply({
      content: `Twitch stream update notifications have been ${disable ? 'disabled' : 'enabled'}.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} ${disable ? 'disabled' : 'enabled'} Twitch update notifications in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error toggling Twitch update notifications:', error);
    throw error;
  }
}