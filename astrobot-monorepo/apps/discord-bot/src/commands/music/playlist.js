const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const musicManager = require('../../lib/music/music-manager');
const playlistManager = require('../../lib/music/playlists/playlist-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Manage your music playlists')
    .addSubcommand(subcommand =>
      subcommand.setName('create')
        .setDescription('Create a new playlist')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The name of the playlist')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('A description for the playlist')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('private')
            .setDescription('Whether the playlist is private (only you can see it)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List your playlists'))
    .addSubcommand(subcommand =>
      subcommand.setName('view')
        .setDescription('View the contents of a playlist')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The name or ID of the playlist')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('add')
        .setDescription('Add a song to a playlist')
        .addStringOption(option =>
          option.setName('playlist')
            .setDescription('The name or ID of the playlist')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option =>
          option.setName('query')
            .setDescription('The song to add (URL or search query)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('remove')
        .setDescription('Remove a song from a playlist')
        .addStringOption(option =>
          option.setName('playlist')
            .setDescription('The name or ID of the playlist')
            .setRequired(true)
            .setAutocomplete(true))
        .addIntegerOption(option =>
          option.setName('position')
            .setDescription('The position of the song to remove (1, 2, 3, etc.)')
            .setRequired(true)
            .setMinValue(1)))
    .addSubcommand(subcommand =>
      subcommand.setName('play')
        .setDescription('Play a playlist')
        .addStringOption(option =>
          option.setName('playlist')
            .setDescription('The name or ID of the playlist')
            .setRequired(true)
            .setAutocomplete(true))
        .addBooleanOption(option =>
          option.setName('shuffle')
            .setDescription('Whether to shuffle the playlist')
            .setRequired(false))),
  
  // Cooldown in seconds
  cooldown: 3,
  
  /**
   * Handle autocomplete interactions
   * @param {Client} client - The Discord client
   * @param {AutocompleteInteraction} interaction - The autocomplete interaction
   */
  async autocomplete(client, interaction) {
    try {
      const focusedOption = interaction.options.getFocused(true);
      const focusedValue = focusedOption.value.toLowerCase();
      
      if (['playlist', 'name'].includes(focusedOption.name)) {
        // Get user playlists
        const userPlaylists = playlistManager.getUserPlaylists(interaction.user.id);
        
        // Get server playlists
        const serverPlaylists = playlistManager.getServerPlaylists(interaction.guildId);
        
        // Combine playlists
        const allPlaylists = [...userPlaylists, ...serverPlaylists];
        
        // Filter playlists by name
        const filteredPlaylists = allPlaylists.filter(playlist => 
          playlist.name.toLowerCase().includes(focusedValue) ||
          playlist.description.toLowerCase().includes(focusedValue)
        );
        
        // Return results (max 25)
        await interaction.respond(
          filteredPlaylists.slice(0, 25).map(playlist => ({
            name: `${playlist.name} ${playlist.createdBy === interaction.user.id ? '(Yours)' : '(Server)'}`,
            value: playlist.id
          }))
        );
      }
    } catch (error) {
      logger.error('Error handling playlist autocomplete:', error);
    }
  },
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'create':
          await handleCreatePlaylist(interaction);
          break;
          
        case 'list':
          await handleListPlaylists(interaction);
          break;
          
        case 'view':
          await handleViewPlaylist(interaction);
          break;
          
        case 'add':
          await handleAddToPlaylist(interaction);
          break;
          
        case 'remove':
          await handleRemoveFromPlaylist(interaction);
          break;
          
        case 'play':
          await handlePlayPlaylist(interaction, client);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand!',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing playlist command:', error);
      
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
 * Handle creating a playlist
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleCreatePlaylist(interaction) {
  try {
    // Get options
    const name = interaction.options.getString('name');
    const description = interaction.options.getString('description') || '';
    const isPrivate = interaction.options.getBoolean('private') ?? true;
    
    // Create playlist
    const playlist = await playlistManager.createPlaylist({
      name,
      description,
      createdBy: interaction.user.id,
      isPrivate
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Playlist Created')
      .setDescription(`Successfully created playlist **${playlist.name}**`)
      .addFields(
        { name: 'Description', value: description || 'No description provided', inline: false },
        { name: 'Visibility', value: isPrivate ? 'Private' : 'Public', inline: true },
        { name: 'ID', value: playlist.id, inline: true }
      )
      .setFooter({ text: `Created by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();
    
    // Send response
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} created playlist "${playlist.name}" (${playlist.id})`);
  } catch (error) {
    logger.error('Error creating playlist:', error);
    throw error;
  }
}

/**
 * Handle listing playlists
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListPlaylists(interaction) {
  try {
    // Get playlists
    const userPlaylists = playlistManager.getUserPlaylists(interaction.user.id);
    const serverPlaylists = playlistManager.getServerPlaylists(interaction.guildId);
    
    // Check if user has any playlists
    if (userPlaylists.length === 0 && serverPlaylists.length === 0) {
      return interaction.reply({
        content: 'You don\'t have any playlists yet. Create one with `/playlist create`.',
        ephemeral: true
      });
    }
    
    // Format user playlists
    let userPlaylistsText = '';
    
    if (userPlaylists.length > 0) {
      userPlaylistsText = userPlaylists.map(playlist => {
        const songCount = playlist.songs.length;
        const visibility = playlist.isPrivate ? 'Private' : 'Public';
        return `**${playlist.name}** - ${songCount} song(s) - ${visibility} - \`${playlist.id}\``;
      }).join('\n');
    } else {
      userPlaylistsText = 'No personal playlists.';
    }
    
    // Format server playlists
    let serverPlaylistsText = '';
    
    if (serverPlaylists.length > 0) {
      serverPlaylistsText = serverPlaylists.map(playlist => {
        const songCount = playlist.songs.length;
        return `**${playlist.name}** - ${songCount} song(s) - \`${playlist.id}\``;
      }).join('\n');
    } else {
      serverPlaylistsText = 'No server playlists.';
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Your Playlists')
      .addFields(
        { name: 'Personal Playlists', value: userPlaylistsText, inline: false },
        { name: 'Server Playlists', value: serverPlaylistsText, inline: false }
      )
      .setFooter({ text: `Use /playlist view to see the contents of a playlist`, iconURL: interaction.guild.iconURL({ dynamic: true }) });
    
    // Send response
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error listing playlists:', error);
    throw error;
  }
}

/**
 * Handle viewing a playlist
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleViewPlaylist(interaction) {
  try {
    // Get options
    const playlistId = interaction.options.getString('name');
    
    // Get playlist
    const playlist = playlistManager.getPlaylist(playlistId, interaction.user.id, interaction.guildId);
    
    if (!playlist) {
      return interaction.reply({
        content: 'Playlist not found or you don\'t have access to it.',
        ephemeral: true
      });
    }
    
    // Check if playlist has songs
    if (playlist.songs.length === 0) {
      return interaction.reply({
        content: `Playlist **${playlist.name}** is empty. Add songs with \`/playlist add\`.`,
        ephemeral: false
      });
    }
    
    // Format songs
    let songsText = '';
    
    for (let i = 0; i < Math.min(playlist.songs.length, 20); i++) {
      const song = playlist.songs[i];
      songsText += `${i + 1}. [${song.title}](${song.url}) - \`${formatDuration(song.duration)}\`\n`;
    }
    
    // If more songs, show count
    if (playlist.songs.length > 20) {
      songsText += `\n*and ${playlist.songs.length - 20} more song(s)*`;
    }
    
    // Calculate total duration
    const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration, 0);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`Playlist: ${playlist.name}`)
      .setDescription(playlist.description || 'No description')
      .addFields(
        { name: 'Songs', value: songsText, inline: false },
        { name: 'Total Songs', value: `${playlist.songs.length}`, inline: true },
        { name: 'Total Duration', value: formatDuration(totalDuration), inline: true },
        { name: 'Created By', value: `<@${playlist.createdBy}>`, inline: true }
      )
      .setFooter({ text: `Playlist ID: ${playlist.id}`, iconURL: interaction.guild.iconURL({ dynamic: true }) })
      .setTimestamp(new Date(playlist.updatedAt));
    
    // Create play button as select menu
    const playOptions = new StringSelectMenuBuilder()
      .setCustomId('playlist_play_options')
      .setPlaceholder('Play options...')
      .addOptions([
        {
          label: 'Play Now',
          description: 'Play the playlist now (stops current song)',
          value: 'play_now'
        },
        {
          label: 'Add to Queue',
          description: 'Add the playlist to the end of the queue',
          value: 'add_queue'
        },
        {
          label: 'Shuffle & Play',
          description: 'Shuffle the playlist and play it',
          value: 'shuffle_play'
        }
      ]);
    
    const row = new ActionRowBuilder().addComponents(playOptions);
    
    // Send response
    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true
    });
    
    // Create collector for select menu interactions
    const filter = i => {
      return i.user.id === interaction.user.id && i.customId === 'playlist_play_options';
    };
    
    const collector = response.createMessageComponentCollector({
      filter,
      time: 60000 // 1 minute timeout
    });
    
    collector.on('collect', async i => {
      try {
        const option = i.values[0];
        
        // Handle option
        switch (option) {
          case 'play_now':
            await i.deferUpdate();
            await playPlaylist(interaction, playlist, false, true);
            collector.stop();
            break;
            
          case 'add_queue':
            await i.deferUpdate();
            await playPlaylist(interaction, playlist, false, false);
            collector.stop();
            break;
            
          case 'shuffle_play':
            await i.deferUpdate();
            await playPlaylist(interaction, playlist, true, true);
            collector.stop();
            break;
        }
      } catch (error) {
        logger.error('Error handling playlist play options:', error);
        await i.reply({
          content: `An error occurred: ${error.message}`,
          ephemeral: true
        });
      }
    });
    
    collector.on('end', () => {
      // Remove select menu after timeout
      interaction.editReply({ components: [] }).catch(err => {
        logger.error('Error removing playlist select menu after timeout:', err);
      });
    });
  } catch (error) {
    logger.error('Error viewing playlist:', error);
    throw error;
  }
}

/**
 * Handle adding a song to a playlist
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleAddToPlaylist(interaction) {
  try {
    // Get options
    const playlistId = interaction.options.getString('playlist');
    const query = interaction.options.getString('query');
    
    // Defer reply (song lookup can take time)
    await interaction.deferReply();
    
    // Add song to playlist
    const song = await playlistManager.addSongToPlaylist(
      playlistId,
      interaction.user.id,
      query,
      interaction.guildId
    );
    
    // Get updated playlist
    const playlist = playlistManager.getPlaylist(playlistId, interaction.user.id, interaction.guildId);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Song Added to Playlist')
      .setDescription(`Added **[${song.title}](${song.url})** to playlist **${playlist.name}**`)
      .setThumbnail(song.thumbnail)
      .addFields(
        { name: 'Duration', value: formatDuration(song.duration), inline: true },
        { name: 'Position', value: `${playlist.songs.length}`, inline: true }
      )
      .setFooter({ text: `Playlist ID: ${playlist.id}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
    
    // Send response
    await interaction.editReply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} added song "${song.title}" to playlist "${playlist.name}"`);
  } catch (error) {
    logger.error('Error adding song to playlist:', error);
    
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

/**
 * Handle removing a song from a playlist
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRemoveFromPlaylist(interaction) {
  try {
    // Get options
    const playlistId = interaction.options.getString('playlist');
    const position = interaction.options.getInteger('position');
    
    // Get playlist
    const playlist = playlistManager.getPlaylist(playlistId, interaction.user.id, interaction.guildId);
    
    if (!playlist) {
      return interaction.reply({
        content: 'Playlist not found or you don\'t have access to it.',
        ephemeral: true
      });
    }
    
    // Check if position is valid
    if (position < 1 || position > playlist.songs.length) {
      return interaction.reply({
        content: `Invalid position. The playlist has ${playlist.songs.length} songs.`,
        ephemeral: true
      });
    }
    
    // Get song to remove (position is 1-based, array is 0-based)
    const songToRemove = playlist.songs[position - 1];
    
    // Remove song
    await playlistManager.removeSongFromPlaylist(
      playlistId,
      songToRemove.id,
      interaction.user.id,
      interaction.guildId
    );
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Song Removed from Playlist')
      .setDescription(`Removed **${songToRemove.title}** from playlist **${playlist.name}**`)
      .setFooter({ text: `Playlist ID: ${playlist.id}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
    
    // Send response
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} removed song "${songToRemove.title}" from playlist "${playlist.name}"`);
  } catch (error) {
    logger.error('Error removing song from playlist:', error);
    throw error;
  }
}

/**
 * Handle playing a playlist
 * @param {CommandInteraction} interaction - The interaction
 * @param {Client} client - The Discord client
 */
async function handlePlayPlaylist(interaction, client) {
  try {
    // Get options
    const playlistId = interaction.options.getString('playlist');
    const shuffle = interaction.options.getBoolean('shuffle') || false;
    
    // Get playlist
    const playlist = playlistManager.getPlaylist(playlistId, interaction.user.id, interaction.guildId);
    
    if (!playlist) {
      return interaction.reply({
        content: 'Playlist not found or you don\'t have access to it.',
        ephemeral: true
      });
    }
    
    // Check if user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel) {
      return interaction.reply({
        content: 'You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Defer reply
    await interaction.deferReply();
    
    // Play playlist
    await playPlaylist(interaction, playlist, shuffle, true);
  } catch (error) {
    logger.error('Error playing playlist:', error);
    
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

/**
 * Play a playlist
 * @param {CommandInteraction} interaction - The interaction
 * @param {Object} playlist - The playlist to play
 * @param {boolean} shuffle - Whether to shuffle the playlist
 * @param {boolean} playNow - Whether to play now (vs. add to queue)
 */
async function playPlaylist(interaction, playlist, shuffle = false, playNow = true) {
  try {
    // Check if playlist is empty
    if (playlist.songs.length === 0) {
      throw new Error('The playlist is empty');
    }
    
    // Check if user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel) {
      throw new Error('You need to be in a voice channel');
    }
    
    // Get or create queue
    let queue = musicManager.getQueue(interaction.guildId);
    
    if (!queue) {
      // Join voice channel
      queue = await musicManager.joinVoice({
        guildId: interaction.guildId,
        voiceChannel,
        textChannel: interaction.channel,
        client: interaction.client
      });
      
      if (!queue) {
        throw new Error('Failed to join voice channel');
      }
    }
    
    // Check if user is in the same voice channel
    if (queue.voiceChannel.id !== voiceChannel.id) {
      throw new Error('You need to be in the same voice channel as the bot');
    }
    
    // Add songs to queue
    const songs = [...playlist.songs];
    
    // Shuffle if requested
    if (shuffle) {
      for (let i = songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songs[i], songs[j]] = [songs[j], songs[i]];
      }
    }
    
    let firstSong = null;
    const addedSongs = [];
    
    // Add each song to the queue
    for (let i = 0; i < songs.length; i++) {
      try {
        const song = songs[i];
        
        // Add song to queue (only the first song plays now if playNow is true)
        const addedSong = await musicManager.addSong({
          guildId: interaction.guildId,
          query: song.url,
          requestedBy: interaction.user,
          playNow: playNow && i === 0
        });
        
        if (i === 0) {
          firstSong = addedSong;
        }
        
        addedSongs.push(addedSong);
      } catch (error) {
        logger.error(`Error adding song ${songs[i].title} to queue:`, error);
        // Continue with next song
      }
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`Playing Playlist: ${playlist.name}`)
      .setDescription(`Added ${addedSongs.length} song(s) to the queue${shuffle ? ' (shuffled)' : ''}`)
      .setFooter({ text: `Playlist ID: ${playlist.id}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
    
    // Add first song info if available
    if (firstSong) {
      embed.addFields(
        { name: 'First Song', value: `[${firstSong.title}](${firstSong.url})`, inline: false }
      );
      
      if (firstSong.thumbnail) {
        embed.setThumbnail(firstSong.thumbnail);
      }
    }
    
    // Send response
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [embed] });
    } else {
      await interaction.reply({ embeds: [embed] });
    }
    
    logger.info(`User ${interaction.user.tag} played playlist "${playlist.name}" with ${addedSongs.length} songs`);
  } catch (error) {
    logger.error('Error playing playlist:', error);
    throw error;
  }
}

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