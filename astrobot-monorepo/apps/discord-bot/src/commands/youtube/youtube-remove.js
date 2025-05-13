const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const youtubeManager = require('../../lib/youtube/youtube-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('youtube-remove')
    .setDescription('Remove a YouTube channel subscription')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => 
      option.setName('channel')
        .setDescription('The YouTube channel to remove')
        .setRequired(true)
        .setAutocomplete(true)),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Handle autocomplete interactions
   * @param {Client} client - The Discord client
   * @param {AutocompleteInteraction} interaction - The autocomplete interaction
   */
  async autocomplete(client, interaction) {
    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      
      // Get all subscribed channels for this guild
      const channels = youtubeManager.listChannels(interaction.guildId);
      
      // Filter based on input
      const filtered = channels
        .filter(channel => 
          channel.youtubeChannelTitle.toLowerCase().includes(focusedValue) ||
          channel.youtubeChannelId.toLowerCase().includes(focusedValue)
        )
        .slice(0, 25); // Discord only allows 25 choices
      
      // Return results
      await interaction.respond(
        filtered.map(channel => ({
          name: channel.youtubeChannelTitle,
          value: channel.youtubeChannelId
        }))
      );
    } catch (error) {
      logger.error('Error handling youtube-remove autocomplete:', error);
    }
  },
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get options
      const youtubeChannelId = interaction.options.getString('channel');
      
      // Get channel details before removing
      const channels = youtubeManager.listChannels(interaction.guildId);
      const channel = channels.find(c => c.youtubeChannelId === youtubeChannelId);
      
      if (!channel) {
        return await interaction.reply({
          content: `YouTube channel not found in subscriptions.`,
          ephemeral: true
        });
      }
      
      // Remove the channel
      const success = await youtubeManager.removeChannel(interaction.guildId, youtubeChannelId);
      
      if (!success) {
        return await interaction.reply({
          content: `Failed to remove YouTube channel "${channel.youtubeChannelTitle}".`,
          ephemeral: true
        });
      }
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000') // YouTube red
        .setTitle('YouTube Channel Removed')
        .setDescription(`Removed notifications for **${channel.youtubeChannelTitle}**`)
        .addFields(
          { name: 'Notification Channel', value: `<#${channel.notificationChannelId}>`, inline: true },
          { name: 'Added At', value: new Date(channel.addedAt).toLocaleDateString(), inline: true }
        )
        .setFooter({ text: 'AstroBot YouTube Notifications' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing youtube-remove command:', error);
      
      await interaction.reply({
        content: `Error removing YouTube channel: ${error.message}`,
        ephemeral: true
      });
    }
  }
};