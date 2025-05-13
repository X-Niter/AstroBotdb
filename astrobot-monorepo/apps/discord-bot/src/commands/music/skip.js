const { SlashCommandBuilder } = require('discord.js');
const { player } = require('../../lib/music');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current track'),
  
  // Cooldown in seconds
  cooldown: 2,
  
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
          content: 'There is nothing playing to skip!',
          ephemeral: true
        });
      }
      
      // Get the current track before skipping
      const currentTrack = queue.currentTrack;
      
      // Skip the current track
      const skipped = queue.skip();
      
      if (!skipped) {
        return await interaction.reply({
          content: 'Failed to skip the current track.',
          ephemeral: true
        });
      }
      
      await interaction.reply({
        content: `Skipped **${currentTrack.title}**`
      });
    } catch (error) {
      logger.error('Error executing skip command:', error);
      
      await interaction.reply({
        content: `There was an error skipping the track: ${error.message}`,
        ephemeral: true
      });
    }
  }
};