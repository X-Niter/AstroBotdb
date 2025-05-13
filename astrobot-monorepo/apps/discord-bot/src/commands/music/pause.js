const { SlashCommandBuilder } = require('discord.js');
const { player } = require('../../lib/music');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or resume playback'),
  
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
          content: 'There is nothing playing to pause!',
          ephemeral: true
        });
      }
      
      // Toggle pause state
      if (queue.paused) {
        // Resume playback
        const resumed = queue.resume();
        
        if (!resumed) {
          return await interaction.reply({
            content: 'Failed to resume playback.',
            ephemeral: true
          });
        }
        
        await interaction.reply({
          content: '▶️ Resumed playback'
        });
      } else {
        // Pause playback
        const paused = queue.pause();
        
        if (!paused) {
          return await interaction.reply({
            content: 'Failed to pause playback.',
            ephemeral: true
          });
        }
        
        await interaction.reply({
          content: '⏸️ Paused playback'
        });
      }
    } catch (error) {
      logger.error('Error executing pause command:', error);
      
      await interaction.reply({
        content: `There was an error pausing/resuming playback: ${error.message}`,
        ephemeral: true
      });
    }
  }
};