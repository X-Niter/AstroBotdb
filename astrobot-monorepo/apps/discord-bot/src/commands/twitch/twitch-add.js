const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const twitchManager = require('../../lib/twitch/twitch-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('twitch-add')
    .setDescription('Add a Twitch streamer for live notifications')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => 
      option.setName('username')
        .setDescription('The Twitch username')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The channel to send notifications to')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('mention-role')
        .setDescription('Role to mention in notifications')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('message')
        .setDescription('Custom message to include in notifications')
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
      const username = interaction.options.getString('username');
      const channel = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('mention-role');
      const message = interaction.options.getString('message');
      
      // Validate channel
      if (!channel.isTextBased()) {
        return await interaction.reply({
          content: 'The notification channel must be a text channel.',
          ephemeral: true
        });
      }
      
      // Defer reply as this might take some time
      await interaction.deferReply({ ephemeral: true });
      
      // Create streamer data
      const streamerData = {
        guildId: interaction.guildId,
        channelId: channel.id,
        twitchUsername: username,
        roleId: role ? role.id : null,
        message: message
      };
      
      // Add the streamer
      const streamer = await twitchManager.addStreamer(streamerData);
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#6441A4') // Twitch purple
        .setTitle('Twitch Streamer Added')
        .setDescription(`Added notifications for [${streamer.twitchDisplayName}](https://twitch.tv/${streamer.twitchUsername})`)
        .setThumbnail(streamer.profileImageUrl)
        .addFields(
          { name: 'Notification Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Mention Role', value: role ? `<@&${role.id}>` : 'None', inline: true }
        )
        .setFooter({ text: 'AstroBot Twitch Notifications' })
        .setTimestamp();
      
      // Add custom message if provided
      if (message) {
        embed.addFields({ name: 'Custom Message', value: message });
      }
      
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing twitch-add command:', error);
      
      const errorMessage = error.message.includes('not found') 
        ? `The Twitch user "${interaction.options.getString('username')}" was not found.` 
        : `Error adding Twitch streamer: ${error.message}`;
      
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