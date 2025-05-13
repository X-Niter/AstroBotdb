const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const musicManager = require('../../lib/music/music-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('View the current music queue'),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get queue
      const queue = musicManager.getQueue(interaction.guildId);
      
      if (!queue || (!queue.currentSong && !queue.songs.length)) {
        return interaction.reply('There are no songs in the queue!');
      }
      
      // Get songs
      const currentSong = queue.currentSong;
      const songs = queue.songs;
      
      // Format queue message
      let queueString = '';
      
      // Current song
      if (currentSong) {
        queueString += `**Now Playing:**\n`;
        queueString += `[${currentSong.title}](${currentSong.url}) | \`${formatDuration(currentSong.duration)}\` | <@${currentSong.requestedBy.id}>\n\n`;
      }
      
      // Upcoming songs (first 10)
      if (songs.length > 0) {
        queueString += `**Up Next:**\n`;
        
        // Display first 10 songs
        const displaySongs = songs.slice(0, 10);
        
        for (let i = 0; i < displaySongs.length; i++) {
          queueString += `${i + 1}. [${displaySongs[i].title}](${displaySongs[i].url}) | \`${formatDuration(displaySongs[i].duration)}\` | <@${displaySongs[i].requestedBy.id}>\n`;
        }
        
        // If more songs, show count
        if (songs.length > 10) {
          queueString += `\n*and ${songs.length - 10} more song(s)*`;
        }
      }
      
      // Calculate total duration
      const totalDuration = songs.reduce((acc, song) => acc + song.duration, currentSong ? currentSong.duration : 0);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Queue for ${interaction.guild.name}`)
        .setDescription(queueString)
        .addFields(
          { name: 'Songs in Queue', value: `${songs.length + (currentSong ? 1 : 0)}`, inline: true },
          { name: 'Total Duration', value: formatDuration(totalDuration), inline: true },
          { name: 'Volume', value: `${queue.volume}%`, inline: true }
        )
        .setFooter({
          text: `Loop: ${queue.loopMode} | Filter: ${queue.filter || 'None'} | Autoplay: ${queue.autoplay ? 'On' : 'Off'}`,
          iconURL: interaction.guild.iconURL({ dynamic: true })
        });
      
      // Create buttons for queue control
      const skipButton = new ButtonBuilder()
        .setCustomId('queue_skip')
        .setLabel('Skip')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(!currentSong);
      
      const pauseResumeButton = new ButtonBuilder()
        .setCustomId('queue_pause_resume')
        .setLabel(queue.paused ? 'Resume' : 'Pause')
        .setStyle(queue.paused ? ButtonStyle.Success : ButtonStyle.Secondary)
        .setDisabled(!currentSong);
      
      const shuffleButton = new ButtonBuilder()
        .setCustomId('queue_shuffle')
        .setLabel('Shuffle')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(songs.length < 2);
      
      const loopButton = new ButtonBuilder()
        .setCustomId('queue_loop')
        .setLabel('Loop: ' + queue.loopMode)
        .setStyle(ButtonStyle.Secondary);
      
      const stopButton = new ButtonBuilder()
        .setCustomId('queue_stop')
        .setLabel('Stop')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!currentSong && songs.length === 0);
      
      const row = new ActionRowBuilder().addComponents(
        skipButton,
        pauseResumeButton,
        shuffleButton,
        loopButton,
        stopButton
      );
      
      // Send response
      await interaction.reply({
        embeds: [embed],
        components: [row]
      });
      
      // Create collector for button interactions
      const filter = i => {
        return i.user.id === interaction.user.id && i.customId.startsWith('queue_');
      };
      
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 60000 // 1 minute timeout
      });
      
      collector.on('collect', async i => {
        try {
          // Get fresh queue state
          const updatedQueue = musicManager.getQueue(interaction.guildId);
          
          if (!updatedQueue) {
            await i.update({ content: 'The queue no longer exists!', embeds: [], components: [] });
            collector.stop();
            return;
          }
          
          // Handle button clicks
          switch (i.customId) {
            case 'queue_skip':
              // Skip current song
              await musicManager.skipSong(interaction.guildId);
              await i.update({ content: 'Skipped to the next song!', components: [] });
              collector.stop();
              break;
              
            case 'queue_pause_resume':
              // Toggle pause/resume
              if (updatedQueue.paused) {
                musicManager.resumePlayback(interaction.guildId);
                await i.update({ content: 'Resumed playback!', components: [] });
              } else {
                musicManager.pausePlayback(interaction.guildId);
                await i.update({ content: 'Paused playback!', components: [] });
              }
              collector.stop();
              break;
              
            case 'queue_shuffle':
              // Shuffle queue
              musicManager.shuffleQueue(interaction.guildId);
              await i.update({ content: 'Shuffled the queue!', components: [] });
              collector.stop();
              break;
              
            case 'queue_loop':
              // Cycle through loop modes
              let nextMode;
              switch (updatedQueue.loopMode) {
                case 'none':
                  nextMode = 'song';
                  break;
                case 'song':
                  nextMode = 'queue';
                  break;
                case 'queue':
                  nextMode = 'none';
                  break;
                default:
                  nextMode = 'none';
              }
              
              await musicManager.setLoopMode(interaction.guildId, nextMode);
              await i.update({ content: `Loop mode set to: ${nextMode}`, components: [] });
              collector.stop();
              break;
              
            case 'queue_stop':
              // Clear queue and leave voice channel
              musicManager.clearQueue(interaction.guildId);
              musicManager.leaveVoice(interaction.guildId);
              await i.update({ content: 'Stopped playback and cleared the queue!', embeds: [], components: [] });
              collector.stop();
              break;
          }
        } catch (error) {
          logger.error('Error handling queue button interaction:', error);
          await i.update({ content: `An error occurred: ${error.message}`, components: [] });
          collector.stop();
        }
      });
      
      collector.on('end', () => {
        // Remove buttons after timeout
        interaction.editReply({ components: [] }).catch(err => {
          logger.error('Error removing queue buttons after timeout:', err);
        });
      });
      
    } catch (error) {
      logger.error('Error executing queue command:', error);
      
      await interaction.reply({
        content: `An error occurred: ${error.message}`,
        ephemeral: true
      });
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