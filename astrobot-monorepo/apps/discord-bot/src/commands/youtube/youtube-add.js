const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const youtubeManager = require('../../lib/youtube/youtube-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('youtube-add')
    .setDescription('Subscribe to a YouTube channel for video notifications')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => 
      option.setName('channel')
        .setDescription('The YouTube channel URL, ID, or username')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('notification-channel')
        .setDescription('The Discord channel to send notifications to')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('mention-role')
        .setDescription('Role to mention in notifications')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('message')
        .setDescription('Custom message to include in notifications (use {channel} for channel name)')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('api-key')
        .setDescription('Custom YouTube API key for this server (optional)')
        .setRequired(false)),
  
  // Cooldown in seconds
  cooldown: 10,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get options
      const youtubeChannel = interaction.options.getString('channel');
      const notificationChannel = interaction.options.getChannel('notification-channel');
      const mentionRole = interaction.options.getRole('mention-role');
      const message = interaction.options.getString('message');
      const apiKey = interaction.options.getString('api-key');
      
      // Validate notification channel
      if (!notificationChannel.isTextBased()) {
        return await interaction.reply({
          content: 'The notification channel must be a text channel.',
          ephemeral: true
        });
      }
      
      // Defer reply as this might take some time
      await interaction.deferReply({ ephemeral: true });
      
      // Create channel data
      const channelData = {
        guildId: interaction.guildId,
        notificationChannelId: notificationChannel.id,
        youtubeChannel: youtubeChannel,
        roleId: mentionRole ? mentionRole.id : null,
        message: message,
        apiKey: apiKey
      };
      
      // Add the channel
      const subscription = await youtubeManager.addChannel(channelData);
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000') // YouTube red
        .setTitle('YouTube Channel Added')
        .setDescription(`Added notifications for [${subscription.youtubeChannelTitle}](${subscription.youtubeChannelUrl})`)
        .addFields(
          { name: 'Notification Channel', value: `<#${notificationChannel.id}>`, inline: true },
          { name: 'Mention Role', value: mentionRole ? `<@&${mentionRole.id}>` : 'None', inline: true }
        )
        .setFooter({ text: 'AstroBot YouTube Notifications' })
        .setTimestamp();
      
      // Add additional info
      if (message) {
        embed.addFields({ name: 'Custom Message', value: message });
      }
      
      if (apiKey) {
        embed.addFields({ name: 'Custom API Key', value: 'Using custom API key for this server ✓' });
      }
      
      // Add RSS feed info
      embed.addFields({ 
        name: 'Notification Method', 
        value: 'Using RSS feeds to avoid API quota limits when possible' 
      });
      
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing youtube-add command:', error);
      
      const errorMessage = error.message.includes('not found') 
        ? `Could not find the YouTube channel. Please check the URL or channel name and try again.` 
        : `Error adding YouTube channel: ${error.message}`;
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: errorMessage,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true
        });
      }
    }
  }
};