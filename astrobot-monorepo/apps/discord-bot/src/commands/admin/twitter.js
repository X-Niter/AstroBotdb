const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const twitterManager = require('../../lib/twitter/twitter-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('twitter')
    .setDescription('Manage Twitter account notifications')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand.setName('track')
        .setDescription('Track a Twitter account for updates')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('The Twitter username (with or without @)')
            .setRequired(true))
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send notifications to (defaults to current channel)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('untrack')
        .setDescription('Stop tracking a Twitter account')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('The Twitter username to untrack')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all tracked Twitter accounts'))
    .addSubcommand(subcommand =>
      subcommand.setName('set-channel')
        .setDescription('Set the channel for Twitter notifications')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send notifications to')
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
      // Save client in global scope for the Twitter manager
      global.client = client;
      
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'track':
          await handleTrackAccount(interaction);
          break;
          
        case 'untrack':
          await handleUntrackAccount(interaction);
          break;
          
        case 'list':
          await handleListAccounts(interaction);
          break;
          
        case 'set-channel':
          await handleSetChannel(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing twitter command:', error);
      
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
 * Handle tracking a Twitter account
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleTrackAccount(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // Check if Twitter API is configured
    if (!twitterManager.isTwitterApiConfigured()) {
      return interaction.editReply('Twitter API is not configured. Please contact the bot administrator.');
    }
    
    // Get options
    const username = interaction.options.getString('username').trim();
    const normalizedUsername = username.startsWith('@') ? username.substring(1) : username;
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    
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
    
    // Check if account exists
    const exists = await twitterManager.checkAccountExists(normalizedUsername);
    
    if (!exists) {
      return interaction.editReply(`Twitter account "${normalizedUsername}" not found. Please check the username and try again.`);
    }
    
    // Track account
    await twitterManager.trackAccount(interaction.guild.id, channel.id, normalizedUsername);
    
    // Create confirmation embed
    const embed = new EmbedBuilder()
      .setColor('#1DA1F2') // Twitter blue
      .setTitle('Twitter Account Tracked')
      .setDescription(`Now tracking [@${normalizedUsername}](https://twitter.com/${normalizedUsername})`)
      .addFields(
        { name: 'Notifications Channel', value: `${channel}`, inline: true }
      )
      .setThumbnail('https://abs.twimg.com/icons/apple-touch-icon-192x192.png')
      .setFooter({ text: 'You will now receive notifications for new tweets from this account' });
    
    // Send reply
    await interaction.editReply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} started tracking Twitter account @${normalizedUsername} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error tracking Twitter account:', error);
    throw error;
  }
}

/**
 * Handle untracking a Twitter account
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleUntrackAccount(interaction) {
  try {
    // Get options
    const username = interaction.options.getString('username').trim();
    const normalizedUsername = username.startsWith('@') ? username.substring(1) : username;
    
    // Get tracked accounts
    const config = twitterManager.getTrackedAccounts(interaction.guild.id);
    
    // Check if account is tracked
    if (!config.accounts.includes(normalizedUsername)) {
      return interaction.reply({
        content: `Twitter account "@${normalizedUsername}" is not currently being tracked.`,
        ephemeral: true
      });
    }
    
    // Untrack account
    await twitterManager.untrackAccount(interaction.guild.id, normalizedUsername);
    
    // Send reply
    await interaction.reply({
      content: `Stopped tracking Twitter account: @${normalizedUsername}`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} stopped tracking Twitter account @${normalizedUsername} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error untracking Twitter account:', error);
    throw error;
  }
}

/**
 * Handle listing tracked Twitter accounts
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListAccounts(interaction) {
  try {
    // Get tracked accounts
    const config = twitterManager.getTrackedAccounts(interaction.guild.id);
    
    // Check if any accounts are tracked
    if (config.accounts.length === 0) {
      return interaction.reply({
        content: 'No Twitter accounts are being tracked for this server.',
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
      .setColor('#1DA1F2') // Twitter blue
      .setTitle('Tracked Twitter Accounts')
      .setDescription(`This server is tracking ${config.accounts.length} Twitter ${config.accounts.length === 1 ? 'account' : 'accounts'}.`)
      .setThumbnail('https://abs.twimg.com/icons/apple-touch-icon-192x192.png');
    
    // Add account list
    const accountList = config.accounts.map(account => `• [@${account}](https://twitter.com/${account})`);
    
    embed.addFields(
      { name: 'Accounts', value: accountList.join('\n'), inline: false },
      { name: 'Notification Channels', value: channelMentions.length > 0 ? channelMentions.join('\n') : 'No channels set', inline: false }
    );
    
    // Send reply
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error listing Twitter accounts:', error);
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
    
    // Get tracked accounts
    const config = twitterManager.getTrackedAccounts(interaction.guild.id);
    
    // Check if any accounts are tracked
    if (config.accounts.length === 0) {
      return interaction.reply({
        content: 'No Twitter accounts are being tracked for this server. Track an account first using `/twitter track`.',
        ephemeral: true
      });
    }
    
    // Set notification channel
    await twitterManager.setNotificationChannels(interaction.guild.id, [channel.id]);
    
    // Send reply
    await interaction.reply({
      content: `Twitter notification channel has been set to ${channel}.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} set Twitter notification channel to ${channel.name} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error setting Twitter notification channel:', error);
    throw error;
  }
}