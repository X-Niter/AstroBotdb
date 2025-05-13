const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const twitchManager = require('../../lib/twitch/twitch-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('twitch-remove')
    .setDescription('Remove a Twitch streamer from notifications')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => 
      option.setName('username')
        .setDescription('The Twitch username to remove')
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
      
      // Get all streamers for this guild
      const streamers = twitchManager.listStreamers(interaction.guildId);
      
      // Filter based on input
      const filtered = streamers
        .filter(streamer => 
          streamer.twitchUsername.toLowerCase().includes(focusedValue) ||
          streamer.twitchDisplayName.toLowerCase().includes(focusedValue)
        )
        .slice(0, 25); // Discord only allows 25 choices
      
      // Return results
      await interaction.respond(
        filtered.map(streamer => ({
          name: streamer.twitchDisplayName,
          value: streamer.twitchUsername
        }))
      );
    } catch (error) {
      logger.error('Error handling twitch-remove autocomplete:', error);
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
      const username = interaction.options.getString('username');
      
      // Get streamer details before removing
      const streamers = twitchManager.listStreamers(interaction.guildId);
      const streamer = streamers.find(s => s.twitchUsername.toLowerCase() === username.toLowerCase());
      
      if (!streamer) {
        return await interaction.reply({
          content: `Streamer "${username}" not found in notifications list.`,
          ephemeral: true
        });
      }
      
      // Remove the streamer
      const success = await twitchManager.removeStreamer(interaction.guildId, username);
      
      if (!success) {
        return await interaction.reply({
          content: `Failed to remove streamer "${username}".`,
          ephemeral: true
        });
      }
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Twitch Streamer Removed')
        .setDescription(`Removed notifications for **${streamer.twitchDisplayName}**`)
        .addFields(
          { name: 'Channel', value: `<#${streamer.channelId}>`, inline: true },
          { name: 'Added At', value: new Date(streamer.addedAt).toLocaleDateString(), inline: true }
        )
        .setFooter({ text: 'AstroBot Twitch Notifications' })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing twitch-remove command:', error);
      
      await interaction.reply({
        content: `Error removing Twitch streamer: ${error.message}`,
        ephemeral: true
      });
    }
  }
};