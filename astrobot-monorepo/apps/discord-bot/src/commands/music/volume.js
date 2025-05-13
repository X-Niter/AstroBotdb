const { SlashCommandBuilder } = require('discord.js');
const { player } = require('../../lib/music');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Change the playback volume')
    .addIntegerOption(option => 
      option.setName('level')
        .setDescription('Volume level (0-100)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100)),
  
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
      
      if (!queue) {
        return await interaction.reply({
          content: 'There is no active queue to adjust volume!',
          ephemeral: true
        });
      }
      
      // Get the volume level
      const volumeLevel = interaction.options.getInteger('level');
      
      // Set the volume
      queue.setVolume(volumeLevel);
      
      // Get an appropriate emoji for the volume level
      let volumeEmoji;
      if (volumeLevel === 0) {
        volumeEmoji = '🔇';
      } else if (volumeLevel < 30) {
        volumeEmoji = '🔈';
      } else if (volumeLevel < 70) {
        volumeEmoji = '🔉';
      } else {
        volumeEmoji = '🔊';
      }
      
      await interaction.reply({
        content: `${volumeEmoji} Volume set to ${volumeLevel}%`
      });
    } catch (error) {
      logger.error('Error executing volume command:', error);
      
      await interaction.reply({
        content: `There was an error changing the volume: ${error.message}`,
        ephemeral: true
      });
    }
  }
};