const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const twitchService = require('../../lib/twitch-service');
const logger = require('../../lib/logger');

// Map to store stream configurations by guild ID
const streamConfig = new Map();

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('streams')
    .setDescription('Manage Twitch stream notifications')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a Twitch streamer to notifications')
        .addStringOption(option =>
          option.setName('streamer')
            .setDescription('Twitch username of the streamer')
            .setRequired(true))
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('Discord channel for notifications (defaults to current channel)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a Twitch streamer from notifications')
        .addStringOption(option =>
          option.setName('streamer')
            .setDescription('Twitch username of the streamer')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all tracked Twitch streamers'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Check if a Twitch streamer is currently live')
        .addStringOption(option =>
          option.setName('streamer')
            .setDescription('Twitch username of the streamer')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('message')
        .setDescription('Set a custom notification message')
        .addStringOption(option =>
          option.setName('message')
            .setDescription('Custom message (use {streamer}, {game}, {title} as placeholders)')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  // Required permissions (checked manually)
  permissions: ['ManageGuild'],
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    try {
      switch (subcommand) {
        case 'add':
          await addStreamer(client, interaction);
          break;
        case 'remove':
          await removeStreamer(client, interaction);
          break;
        case 'list':
          await listStreamers(client, interaction);
          break;
        case 'check':
          await checkStreamer(client, interaction);
          break;
        case 'message':
          await setMessage(client, interaction);
          break;
        default:
          await interaction.reply({
            content: 'Invalid subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error(`Error executing streams command:`, error);
      await interaction.reply({
        content: `There was an error managing stream notifications: ${error.message}`,
        ephemeral: true
      });
    }
  },
  
  // Export streamConfig for other modules to use
  streamConfig
};

/**
 * Add a Twitch streamer to notifications
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction that triggered the command
 */
async function addStreamer(client, interaction) {
  // Get options
  const streamerName = interaction.options.getString('streamer').toLowerCase();
  const channel = interaction.options.getChannel('channel') || interaction.channel;
  
  // Validate channel is a text channel
  if (channel.type !== 0) {
    return await interaction.reply({
      content: 'Notifications can only be sent to text channels.',
      ephemeral: true
    });
  }
  
  // Check bot permissions in the channel
  if (!channel.permissionsFor(interaction.guild.members.me).has('SendMessages')) {
    return await interaction.reply({
      content: `I don't have permission to send messages in ${channel}.`,
      ephemeral: true
    });
  }
  
  // Defer reply as this can take time
  await interaction.deferReply();
  
  try {
    // Verify streamer exists on Twitch
    const streamers = await twitchService.getStreamers([streamerName]);
    
    if (streamers.length === 0) {
      return await interaction.editReply({
        content: `Could not find Twitch streamer '${streamerName}'. Please check the username and try again.`
      });
    }
    
    // Get streamer data
    const streamer = streamers[0];
    
    // Get or create guild config
    const guildId = interaction.guild.id;
    const config = streamConfig.get(guildId) || {
      channelId: channel.id,
      streamers: []
    };
    
    // Check if streamer is already tracked
    if (config.streamers.some(s => s.toLowerCase() === streamerName)) {
      return await interaction.editReply({
        content: `${streamer.display_name} is already being tracked for notifications.`
      });
    }
    
    // Add streamer to config
    config.channelId = channel.id;
    config.streamers.push(streamerName);
    streamConfig.set(guildId, config);
    
    // Start Twitch check schedule if this is the first streamer
    if (config.streamers.length === 1) {
      twitchService.scheduleStreamChecks(client, streamConfig);
    }
    
    // Log the action
    logger.info(`Added Twitch streamer ${streamerName} to notifications in ${interaction.guild.name} (${guildId})`);
    
    // Create thumbnail URL
    const thumbnailUrl = streamer.profile_image_url;
    
    // Create response embed
    const embed = new EmbedBuilder()
      .setColor(0x6441a5) // Twitch purple
      .setTitle('Twitch Notifications Added')
      .setDescription(`Successfully added **${streamer.display_name}** to stream notifications.`)
      .setThumbnail(thumbnailUrl)
      .addFields(
        { name: 'Channel', value: `<#${channel.id}>`, inline: true },
        { name: 'Twitch Channel', value: `[${streamer.display_name}](https://twitch.tv/${streamerName})`, inline: true }
      )
      .setFooter({
        text: `AstroBot Twitch Integration`,
        iconURL: client.user.displayAvatarURL()
      })
      .setTimestamp();
    
    // Reply with the embed
    await interaction.editReply({
      embeds: [embed]
    });
  } catch (error) {
    logger.error(`Error adding Twitch streamer ${streamerName}:`, error);
    await interaction.editReply({
      content: `There was an error adding the Twitch streamer: ${error.message}`
    });
  }
}

/**
 * Remove a Twitch streamer from notifications
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction that triggered the command
 */
async function removeStreamer(client, interaction) {
  // Get options
  const streamerName = interaction.options.getString('streamer').toLowerCase();
  
  // Get guild config
  const guildId = interaction.guild.id;
  const config = streamConfig.get(guildId);
  
  // Check if guild has any configured streamers
  if (!config || !config.streamers || config.streamers.length === 0) {
    return await interaction.reply({
      content: 'This server does not have any Twitch streamers set up for notifications.',
      ephemeral: true
    });
  }
  
  // Check if streamer is being tracked
  if (!config.streamers.some(s => s.toLowerCase() === streamerName)) {
    return await interaction.reply({
      content: `${streamerName} is not currently being tracked for notifications.`,
      ephemeral: true
    });
  }
  
  // Remove streamer from config
  config.streamers = config.streamers.filter(s => s.toLowerCase() !== streamerName);
  
  // Update or remove guild config
  if (config.streamers.length === 0) {
    streamConfig.delete(guildId);
  } else {
    streamConfig.set(guildId, config);
  }
  
  // Log the action
  logger.info(`Removed Twitch streamer ${streamerName} from notifications in ${interaction.guild.name} (${guildId})`);
  
  // Reply with confirmation
  await interaction.reply({
    content: `Successfully removed **${streamerName}** from stream notifications.`
  });
}

/**
 * List all tracked Twitch streamers
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction that triggered the command
 */
async function listStreamers(client, interaction) {
  // Get guild config
  const guildId = interaction.guild.id;
  const config = streamConfig.get(guildId);
  
  // Check if guild has any configured streamers
  if (!config || !config.streamers || config.streamers.length === 0) {
    return await interaction.reply({
      content: 'This server does not have any Twitch streamers set up for notifications.',
      ephemeral: true
    });
  }
  
  // Get the notification channel
  const channelId = config.channelId;
  const channel = channelId ? interaction.guild.channels.cache.get(channelId) : null;
  
  // Prepare streamer list
  const streamerList = config.streamers.map((streamer, index) => {
    return `${index + 1}. [${streamer}](https://twitch.tv/${streamer})`;
  }).join('\n');
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor(0x6441a5) // Twitch purple
    .setTitle('Twitch Streamers')
    .setDescription(`Here are all the Twitch streamers currently tracked for notifications:`)
    .addFields(
      { name: 'Streamers', value: streamerList },
      { name: 'Notification Channel', value: channel ? `<#${channelId}>` : 'Unknown Channel', inline: true },
      { name: 'Custom Message', value: config.message || 'Default message', inline: true }
    )
    .setFooter({
      text: `AstroBot Twitch Integration`,
      iconURL: client.user.displayAvatarURL()
    })
    .setTimestamp();
  
  // Reply with the embed
  await interaction.reply({
    embeds: [embed]
  });
}

/**
 * Check if a Twitch streamer is currently live
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction that triggered the command
 */
async function checkStreamer(client, interaction) {
  // Get options
  const streamerName = interaction.options.getString('streamer').toLowerCase();
  
  // Defer reply as this can take time
  await interaction.deferReply();
  
  try {
    // Verify streamer exists on Twitch
    const streamers = await twitchService.getStreamers([streamerName]);
    
    if (streamers.length === 0) {
      return await interaction.editReply({
        content: `Could not find Twitch streamer '${streamerName}'. Please check the username and try again.`
      });
    }
    
    // Get streamer data
    const streamer = streamers[0];
    
    // Check if streamer is live
    const liveStreams = await twitchService.getLiveStreams([streamer.id]);
    const isLive = liveStreams.length > 0;
    
    if (!isLive) {
      // Create offline embed
      const embed = new EmbedBuilder()
        .setColor(0x6441a5) // Twitch purple
        .setTitle(`${streamer.display_name} is offline`)
        .setDescription(`**${streamer.display_name}** is not currently streaming on Twitch.`)
        .setThumbnail(streamer.profile_image_url)
        .addFields(
          { name: 'Twitch Channel', value: `[${streamer.display_name}](https://twitch.tv/${streamerName})`, inline: true }
        )
        .setFooter({
          text: `AstroBot Twitch Integration`,
          iconURL: client.user.displayAvatarURL()
        })
        .setTimestamp();
      
      return await interaction.editReply({
        embeds: [embed]
      });
    }
    
    // Get stream data
    const stream = liveStreams[0];
    
    // Get game info
    const gameInfo = stream.game_id ? await twitchService.getGameInfo(stream.game_id) : null;
    const gameName = gameInfo ? gameInfo.name : 'Unknown Game';
    
    // Create thumbnail URL with timestamp to bypass caching
    const thumbnailUrl = stream.thumbnail_url
      .replace('{width}', '1280')
      .replace('{height}', '720') + `?t=${Date.now()}`;
    
    // Create live embed
    const embed = new EmbedBuilder()
      .setColor(0x6441a5) // Twitch purple
      .setTitle(`${streamer.display_name} is LIVE!`)
      .setDescription(`**${streamer.display_name}** is currently streaming **${gameName}** on Twitch!`)
      .setURL(`https://twitch.tv/${streamerName}`)
      .setThumbnail(streamer.profile_image_url)
      .addFields(
        { name: 'Stream Title', value: stream.title, inline: false },
        { name: 'Game', value: gameName, inline: true },
        { name: 'Viewers', value: stream.viewer_count.toString(), inline: true },
        { name: 'Started At', value: `<t:${Math.floor(new Date(stream.started_at).getTime() / 1000)}:R>`, inline: true }
      )
      .setImage(thumbnailUrl)
      .setFooter({
        text: `AstroBot Twitch Integration`,
        iconURL: client.user.displayAvatarURL()
      })
      .setTimestamp();
    
    // Reply with the embed
    await interaction.editReply({
      embeds: [embed]
    });
  } catch (error) {
    logger.error(`Error checking Twitch streamer ${streamerName}:`, error);
    await interaction.editReply({
      content: `There was an error checking the Twitch streamer: ${error.message}`
    });
  }
}

/**
 * Set a custom notification message
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction that triggered the command
 */
async function setMessage(client, interaction) {
  // Get options
  const message = interaction.options.getString('message');
  
  // Get guild config
  const guildId = interaction.guild.id;
  const config = streamConfig.get(guildId) || {
    channelId: interaction.channel.id,
    streamers: []
  };
  
  // Update config
  config.message = message;
  streamConfig.set(guildId, config);
  
  // Log the action
  logger.info(`Set custom Twitch notification message in ${interaction.guild.name} (${guildId})`);
  
  // Create example message
  const exampleMessage = message
    .replace('{streamer}', 'ExampleStreamer')
    .replace('{game}', 'Minecraft')
    .replace('{title}', 'Building a new world!');
  
  // Reply with confirmation
  await interaction.reply({
    content: `Successfully set custom notification message.\n\nExample: ${exampleMessage}`
  });
}