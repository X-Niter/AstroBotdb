const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const githubManager = require('../../lib/github/github-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('github')
    .setDescription('Manage GitHub repository notifications')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand.setName('track')
        .setDescription('Track a GitHub repository for updates')
        .addStringOption(option =>
          option.setName('repository')
            .setDescription('The full repository name (e.g., owner/repo)')
            .setRequired(true))
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send notifications to (defaults to current channel)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('untrack')
        .setDescription('Stop tracking a GitHub repository')
        .addStringOption(option =>
          option.setName('repository')
            .setDescription('The full repository name (e.g., owner/repo)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all tracked GitHub repositories'))
    .addSubcommand(subcommand =>
      subcommand.setName('set-channel')
        .setDescription('Set the channel for GitHub notifications')
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
      // Save client in global scope for the GitHub manager
      global.client = client;
      
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'track':
          await handleTrackRepository(interaction);
          break;
          
        case 'untrack':
          await handleUntrackRepository(interaction);
          break;
          
        case 'list':
          await handleListRepositories(interaction);
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
      logger.error('Error executing github command:', error);
      
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
 * Handle tracking a repository
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleTrackRepository(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });
    
    // Get options
    const repoFullName = interaction.options.getString('repository').trim();
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    
    // Validate repository name
    if (!repoFullName.includes('/')) {
      return interaction.editReply('Invalid repository format. Please use the format "owner/repo".');
    }
    
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
    
    // Check if repository exists
    const exists = await githubManager.checkRepositoryExists(repoFullName);
    
    if (!exists) {
      return interaction.editReply(`Repository "${repoFullName}" not found. Please check the name and try again.`);
    }
    
    // Track repository
    await githubManager.trackRepository(interaction.guild.id, channel.id, repoFullName);
    
    // Create confirmation embed
    const embed = new EmbedBuilder()
      .setColor('#171515') // GitHub black
      .setTitle('GitHub Repository Tracked')
      .setDescription(`Now tracking [${repoFullName}](https://github.com/${repoFullName})`)
      .addFields(
        { name: 'Notifications Channel', value: `${channel}`, inline: true }
      )
      .setThumbnail('https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png')
      .setFooter({ text: 'You will now receive notifications for various events on this repository' });
    
    // Send reply
    await interaction.editReply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} started tracking GitHub repository ${repoFullName} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error tracking GitHub repository:', error);
    throw error;
  }
}

/**
 * Handle untracking a repository
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleUntrackRepository(interaction) {
  try {
    // Get options
    const repoFullName = interaction.options.getString('repository').trim();
    
    // Validate repository name
    if (!repoFullName.includes('/')) {
      return interaction.reply({
        content: 'Invalid repository format. Please use the format "owner/repo".',
        ephemeral: true
      });
    }
    
    // Get tracked repositories
    const config = githubManager.getTrackedRepositories(interaction.guild.id);
    
    // Check if repository is tracked
    if (!config.repositories.includes(repoFullName)) {
      return interaction.reply({
        content: `Repository "${repoFullName}" is not currently being tracked.`,
        ephemeral: true
      });
    }
    
    // Untrack repository
    await githubManager.untrackRepository(interaction.guild.id, repoFullName);
    
    // Send reply
    await interaction.reply({
      content: `Stopped tracking GitHub repository: ${repoFullName}`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} stopped tracking GitHub repository ${repoFullName} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error untracking GitHub repository:', error);
    throw error;
  }
}

/**
 * Handle listing tracked repositories
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListRepositories(interaction) {
  try {
    // Get tracked repositories
    const config = githubManager.getTrackedRepositories(interaction.guild.id);
    
    // Check if any repositories are tracked
    if (config.repositories.length === 0) {
      return interaction.reply({
        content: 'No GitHub repositories are being tracked for this server.',
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
      .setColor('#171515') // GitHub black
      .setTitle('Tracked GitHub Repositories')
      .setDescription(`This server is tracking ${config.repositories.length} GitHub ${config.repositories.length === 1 ? 'repository' : 'repositories'}.`)
      .setThumbnail('https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png');
    
    // Add repository list
    const repoList = config.repositories.map(repo => `• [${repo}](https://github.com/${repo})`);
    
    embed.addFields(
      { name: 'Repositories', value: repoList.join('\n'), inline: false },
      { name: 'Notification Channels', value: channelMentions.length > 0 ? channelMentions.join('\n') : 'No channels set', inline: false }
    );
    
    // Send reply
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error listing GitHub repositories:', error);
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
    
    // Get tracked repositories
    const config = githubManager.getTrackedRepositories(interaction.guild.id);
    
    // Check if any repositories are tracked
    if (config.repositories.length === 0) {
      return interaction.reply({
        content: 'No GitHub repositories are being tracked for this server. Track a repository first using `/github track`.',
        ephemeral: true
      });
    }
    
    // Set notification channel
    await githubManager.setNotificationChannels(interaction.guild.id, [channel.id]);
    
    // Send reply
    await interaction.reply({
      content: `GitHub notification channel has been set to ${channel}.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} set GitHub notification channel to ${channel.name} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error setting GitHub notification channel:', error);
    throw error;
  }
}