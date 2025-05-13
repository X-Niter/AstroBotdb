const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const twitchManager = require('../../lib/twitch/twitch-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('twitch-list')
    .setDescription('List all Twitch streamers with notifications set up'),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get all streamers for this guild
      const streamers = twitchManager.listStreamers(interaction.guildId);
      
      if (streamers.length === 0) {
        return await interaction.reply({
          content: 'No Twitch streamers are set up for notifications in this server.',
          ephemeral: true
        });
      }
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#6441A4') // Twitch purple
        .setTitle('Twitch Notifications')
        .setDescription(`${streamers.length} streamer${streamers.length === 1 ? '' : 's'} set up for notifications in this server.`)
        .setFooter({ text: 'AstroBot Twitch Notifications' })
        .setTimestamp();
      
      // Add streamers (max 25 due to embed field limit)
      const maxStreamers = Math.min(streamers.length, 25);
      
      for (let i = 0; i < maxStreamers; i++) {
        const streamer = streamers[i];
        
        // Get notification details
        const channelMention = `<#${streamer.channelId}>`;
        const roleMention = streamer.roleId ? `<@&${streamer.roleId}>` : 'None';
        
        // Build field value
        let fieldValue = `Channel: ${channelMention}\nMention: ${roleMention}`;
        
        if (streamer.message) {
          const shortMessage = streamer.message.length > 100 
            ? streamer.message.substring(0, 97) + '...' 
            : streamer.message;
          
          fieldValue += `\nMessage: ${shortMessage}`;
        }
        
        // Add field
        embed.addFields({
          name: `${i+1}. ${streamer.twitchDisplayName}`,
          value: fieldValue,
          inline: false
        });
      }
      
      // If there are more streamers than can fit in one embed
      if (streamers.length > maxStreamers) {
        embed.addFields({
          name: 'Note',
          value: `And ${streamers.length - maxStreamers} more streamer${streamers.length - maxStreamers === 1 ? '' : 's'} not shown.`
        });
      }
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing twitch-list command:', error);
      
      await interaction.reply({
        content: `Error listing Twitch streamers: ${error.message}`,
        ephemeral: true
      });
    }
  }
};