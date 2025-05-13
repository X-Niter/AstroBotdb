const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const youtubeManager = require('../../lib/youtube/youtube-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('youtube-list')
    .setDescription('List all YouTube channel subscriptions'),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get all subscribed channels for this guild
      const channels = youtubeManager.listChannels(interaction.guildId);
      
      if (channels.length === 0) {
        return await interaction.reply({
          content: 'No YouTube channel subscriptions found for this server.',
          ephemeral: true
        });
      }
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000') // YouTube red
        .setTitle('YouTube Subscriptions')
        .setDescription(`${channels.length} YouTube channel${channels.length === 1 ? '' : 's'} set up for notifications in this server.`)
        .setFooter({ text: 'AstroBot YouTube Notifications' })
        .setTimestamp();
      
      // Add channels (max 25 due to embed field limit)
      const maxChannels = Math.min(channels.length, 25);
      
      for (let i = 0; i < maxChannels; i++) {
        const channel = channels[i];
        
        // Get notification details
        const notificationChannel = `<#${channel.notificationChannelId}>`;
        const mentionRole = channel.roleId ? `<@&${channel.roleId}>` : 'None';
        
        // Build field value
        let fieldValue = `Discord Channel: ${notificationChannel}\nMention: ${mentionRole}`;
        
        if (channel.message) {
          const shortMessage = channel.message.length > 100 
            ? channel.message.substring(0, 97) + '...' 
            : channel.message;
          
          fieldValue += `\nMessage: ${shortMessage}`;
        }
        
        if (channel.apiKey) {
          fieldValue += '\nCustom API Key: ✓';
        }
        
        // Add field
        embed.addFields({
          name: `${i+1}. ${channel.youtubeChannelTitle}`,
          value: fieldValue,
          inline: false
        });
      }
      
      // If there are more channels than can fit in one embed
      if (channels.length > maxChannels) {
        embed.addFields({
          name: 'Note',
          value: `And ${channels.length - maxChannels} more channel${channels.length - maxChannels === 1 ? '' : 's'} not shown.`
        });
      }
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing youtube-list command:', error);
      
      await interaction.reply({
        content: `Error listing YouTube channels: ${error.message}`,
        ephemeral: true
      });
    }
  }
};