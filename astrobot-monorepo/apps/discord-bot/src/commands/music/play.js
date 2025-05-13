const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const musicManager = require('../../lib/music/music-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song or playlist')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('Song name, URL, or playlist URL')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('next')
        .setDescription('Play this song next in the queue')
        .setRequired(false))
    .addBooleanOption(option => 
      option.setName('now')
        .setDescription('Play this song now (skip current song)')
        .setRequired(false)),
  
  // Cooldown in seconds
  cooldown: 3,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Check if user is in a voice channel
      const voiceChannel = interaction.member.voice.channel;
      
      if (!voiceChannel) {
        return interaction.reply({
          content: 'You need to be in a voice channel to use this command!',
          ephemeral: true
        });
      }
      
      // Get options
      const query = interaction.options.getString('query');
      const playNext = interaction.options.getBoolean('next') || false;
      const playNow = interaction.options.getBoolean('now') || false;
      
      // Defer reply
      await interaction.deferReply();
      
      // Get or create queue
      let queue = musicManager.getQueue(interaction.guildId);
      
      if (!queue) {
        // Join voice channel
        queue = await musicManager.joinVoice({
          guildId: interaction.guildId,
          voiceChannel: voiceChannel,
          textChannel: interaction.channel,
          client
        });
        
        if (!queue) {
          return interaction.editReply('Failed to join voice channel!');
        }
      }
      
      // Check if user is in the same voice channel
      if (queue.voiceChannel.id !== voiceChannel.id) {
        return interaction.editReply('You need to be in the same voice channel as the bot to use this command!');
      }
      
      try {
        let responseMessage;
        
        // Check if it's a playlist URL
        if (query.includes('youtube.com/playlist') || query.includes('open.spotify.com/playlist')) {
          responseMessage = 'Adding playlist to queue... This might take a moment.';
        } else {
          responseMessage = 'Adding song to queue...';
        }
        
        // Add song to queue
        const song = await musicManager.addSong({
          guildId: interaction.guildId,
          query,
          requestedBy: interaction.user,
          playNow
        });
        
        // Create embed
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('Added to Queue')
          .setDescription(`**[${song.title}](${song.url})**`)
          .setThumbnail(song.thumbnail)
          .addFields(
            { name: 'Duration', value: formatDuration(song.duration), inline: true },
            { name: 'Position', value: playNext ? 'Next' : playNow ? 'Now Playing' : `${queue.songs.length + (queue.currentSong ? 1 : 0)}`, inline: true }
          )
          .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
        
        // Send response
        await interaction.editReply({ embeds: [embed] });
        
        logger.info(`Added "${song.title}" to queue in guild ${interaction.guildId}`);
      } catch (error) {
        logger.error(`Error adding song to queue in guild ${interaction.guildId}:`, error);
        
        await interaction.editReply(`Failed to add song to queue: ${error.message}`);
      }
    } catch (error) {
      logger.error('Error executing play command:', error);
      
      // Handle already replied or deferred
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(`An error occurred: ${error.message}`);
      } else {
        await interaction.reply({
          content: `An error occurred: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }
};

/**
 * Format duration in seconds to mm:ss or hh:mm:ss
 * @param {number} seconds - The duration in seconds
 * @returns {string} The formatted duration
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}