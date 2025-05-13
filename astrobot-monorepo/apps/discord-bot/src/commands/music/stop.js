const { SlashCommandBuilder } = require('discord.js');
const { player } = require('../../lib/music');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback and clear the queue'),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Check if the user is in a voice channel
      if (!interaction.member.voice.channelId) {
        return await interaction.reply({
          content: 'You need to join a voice channel first!',
          ephemeral: true
        });
      }
      
      // Check if the user is in the same voice channel as the bot
      const botVoiceChannel = interaction.guild.members.me.voice.channelId;
      if (botVoiceChannel && interaction.member.voice.channelId !== botVoiceChannel) {
        return await interaction.reply({
          content: 'You need to be in the same voice channel as the bot!',
          ephemeral: true
        });
      }
      
      // Get the queue for this guild
      const queue = player.getQueue(interaction.guildId, client);
      
      if (!queue || !queue.playing) {
        return await interaction.reply({
          content: 'There is nothing playing to stop!',
          ephemeral: true
        });
      }
      
      // Clear the queue and stop playback
      queue.clear();
      queue.stop();
      
      // Leave the voice channel
      player.leaveChannel(interaction.guildId);
      
      await interaction.reply({
        content: '⏹️ Stopped playback and cleared the queue'
      });
    } catch (error) {
      logger.error('Error executing stop command:', error);
      
      await interaction.reply({
        content: `There was an error stopping playback: ${error.message}`,
        ephemeral: true
      });
    }
  }
};