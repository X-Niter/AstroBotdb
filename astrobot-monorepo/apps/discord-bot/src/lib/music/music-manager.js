/**
 * Music Manager for AstroBot
 * Handles audio playback, queues, and music-related functionality
 */

const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, NoSubscriberBehavior } = require('@discordjs/voice');
const { Collection, EmbedBuilder } = require('discord.js');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../logger');
const playlistManager = require('./playlists/playlist-manager');
const filterManager = require('./filters/filter-manager');

// Guild queues (guildId -> queue)
const queues = new Collection();

// Path to music settings file
const MUSIC_SETTINGS_FILE = path.join(process.cwd(), 'data', 'music-settings.json');

// Default music settings
const DEFAULT_SETTINGS = {
  volume: 100, // Default volume (0-200)
  bassBoost: 0, // Default bass boost level (0-5)
  repeatMode: 'none', // Default repeat mode (none, song, queue)
  maxQueueSize: 100, // Maximum queue size
  defaultTimeout: 60, // Timeout in seconds to leave channel if inactive
  autoplay: false // Autoplay related tracks
};

// Guild settings (guildId -> settings)
const guildSettings = new Collection();

/**
 * Initialize the music manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing music manager...');
    
    // Initialize playlist manager
    await playlistManager.initialize();
    
    // Initialize filter manager
    await filterManager.initialize();
    
    // Load music settings
    await loadMusicSettings();
    
    logger.info('Music manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing music manager:', error);
    return false;
  }
}

/**
 * Load music settings from disk
 * @returns {Promise<void>}
 */
async function loadMusicSettings() {
  try {
    // Check if file exists
    try {
      await fs.access(MUSIC_SETTINGS_FILE);
    } catch (error) {
      // File doesn't exist, create default
      await saveMusicSettings();
      return;
    }
    
    // Read file
    const data = await fs.readFile(MUSIC_SETTINGS_FILE, 'utf8');
    const settings = JSON.parse(data);
    
    // Load settings
    guildSettings.clear();
    
    for (const [guildId, guildSetting] of Object.entries(settings)) {
      guildSettings.set(guildId, {
        ...DEFAULT_SETTINGS,
        ...guildSetting
      });
    }
    
    logger.debug('Music settings loaded');
  } catch (error) {
    logger.error('Error loading music settings:', error);
    throw error;
  }
}

/**
 * Save music settings to disk
 * @returns {Promise<void>}
 */
async function saveMusicSettings() {
  try {
    // Create settings object
    const settings = {};
    
    for (const [guildId, guildSetting] of guildSettings.entries()) {
      settings[guildId] = guildSetting;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(MUSIC_SETTINGS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(MUSIC_SETTINGS_FILE, JSON.stringify(settings, null, 2));
    
    logger.debug('Music settings saved');
  } catch (error) {
    logger.error('Error saving music settings:', error);
    throw error;
  }
}

/**
 * Get music settings for a guild
 * @param {string} guildId - The guild ID
 * @returns {Object} The guild music settings
 */
function getGuildSettings(guildId) {
  if (!guildSettings.has(guildId)) {
    guildSettings.set(guildId, { ...DEFAULT_SETTINGS });
  }
  
  return guildSettings.get(guildId);
}

/**
 * Update music settings for a guild
 * @param {string} guildId - The guild ID
 * @param {Object} settings - The settings to update
 * @returns {Promise<Object>} The updated settings
 */
async function updateGuildSettings(guildId, settings) {
  try {
    const currentSettings = getGuildSettings(guildId);
    
    // Update settings
    const updatedSettings = {
      ...currentSettings,
      ...settings
    };
    
    // Save to collection
    guildSettings.set(guildId, updatedSettings);
    
    // Save to disk
    await saveMusicSettings();
    
    return updatedSettings;
  } catch (error) {
    logger.error(`Error updating music settings for guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Get a guild's queue
 * @param {string} guildId - The guild ID
 * @returns {Object|null} The guild queue or null if not found
 */
function getQueue(guildId) {
  return queues.get(guildId) || null;
}

/**
 * Create a queue for a guild
 * @param {Object} options - Queue options
 * @param {string} options.guildId - The guild ID
 * @param {Object} options.textChannel - The text channel for messages
 * @param {Object} options.voiceChannel - The voice channel to join
 * @returns {Object} The created queue
 */
function createQueue({ guildId, textChannel, voiceChannel, client }) {
  // Get guild settings
  const settings = getGuildSettings(guildId);
  
  // Create audio player
  const player = createAudioPlayer({
    behaviors: {
      noSubscriber: NoSubscriberBehavior.Pause,
    }
  });
  
  // Create queue object
  const queue = {
    guildId,
    textChannel,
    voiceChannel,
    connection: null,
    player,
    songs: [],
    volume: settings.volume,
    filter: null,
    playing: false,
    paused: false,
    currentSong: null,
    loopMode: settings.repeatMode,
    autoplay: settings.autoplay,
    timeout: null,
    client
  };
  
  // Set up player event listeners
  player.on(AudioPlayerStatus.Idle, () => {
    handleSongFinish(guildId);
  });
  
  player.on(AudioPlayerStatus.Playing, () => {
    queue.playing = true;
    queue.paused = false;
    clearTimeout(queue.timeout);
  });
  
  player.on(AudioPlayerStatus.Paused, () => {
    queue.paused = true;
  });
  
  player.on('error', (error) => {
    logger.error(`Error in audio player for guild ${guildId}:`, error);
    
    // Send error message to channel
    const embed = new EmbedBuilder()
      .setTitle('Playback Error')
      .setDescription(`An error occurred during playback: ${error.message}`)
      .setColor('#FF0000');
    
    textChannel.send({ embeds: [embed] }).catch(err => {
      logger.error('Error sending error message:', err);
    });
    
    // Skip to next song
    playSong(guildId, true);
  });
  
  // Save queue
  queues.set(guildId, queue);
  
  return queue;
}

/**
 * Join a voice channel
 * @param {Object} options - Join options
 * @param {string} options.guildId - The guild ID
 * @param {Object} options.voiceChannel - The voice channel to join
 * @param {Object} options.textChannel - The text channel for messages
 * @returns {Promise<Object|null>} The queue or null if failed
 */
async function joinVoice({ guildId, voiceChannel, textChannel, client }) {
  try {
    // Check if already in queue
    let queue = getQueue(guildId);
    
    if (queue) {
      // If already in this voice channel, return queue
      if (queue.voiceChannel.id === voiceChannel.id) {
        return queue;
      }
      
      // If in a different voice channel, destroy current queue
      leaveVoice(guildId);
    }
    
    // Create new queue
    queue = createQueue({ guildId, textChannel, voiceChannel, client });
    
    // Join voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });
    
    // Set connection in queue
    queue.connection = connection;
    
    // Set up connection event listeners
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        // Try to reconnect
        await Promise.race([
          new Promise(resolve => {
            connection.once(VoiceConnectionStatus.Ready, resolve);
          }),
          new Promise((_, reject) => {
            setTimeout(() => reject('Connection timed out'), 5000);
          })
        ]);
      } catch (error) {
        // Destroy queue on failed reconnection
        leaveVoice(guildId);
      }
    });
    
    connection.on(VoiceConnectionStatus.Destroyed, () => {
      leaveVoice(guildId);
    });
    
    connection.on('error', error => {
      logger.error(`Voice connection error in guild ${guildId}:`, error);
      
      // Send error message to channel
      const embed = new EmbedBuilder()
        .setTitle('Voice Connection Error')
        .setDescription(`An error occurred with the voice connection: ${error.message}`)
        .setColor('#FF0000');
      
      textChannel.send({ embeds: [embed] }).catch(err => {
        logger.error('Error sending error message:', err);
      });
      
      // Try to reconnect or destroy
      connection.rejoin();
    });
    
    // Subscribe player to connection
    connection.subscribe(queue.player);
    
    return queue;
  } catch (error) {
    logger.error(`Error joining voice channel in guild ${guildId}:`, error);
    
    // Send error message to channel
    const embed = new EmbedBuilder()
      .setTitle('Voice Connection Error')
      .setDescription(`An error occurred joining the voice channel: ${error.message}`)
      .setColor('#FF0000');
    
    textChannel.send({ embeds: [embed] }).catch(err => {
      logger.error('Error sending error message:', err);
    });
    
    return null;
  }
}

/**
 * Leave a voice channel
 * @param {string} guildId - The guild ID
 * @returns {boolean} Whether the operation was successful
 */
function leaveVoice(guildId) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      return false;
    }
    
    // Stop player
    queue.player.stop();
    
    // Clear timeout
    if (queue.timeout) {
      clearTimeout(queue.timeout);
    }
    
    // Destroy connection
    if (queue.connection) {
      queue.connection.destroy();
    }
    
    // Remove queue
    queues.delete(guildId);
    
    return true;
  } catch (error) {
    logger.error(`Error leaving voice channel in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Add a song to the queue
 * @param {Object} options - Add options
 * @param {string} options.guildId - The guild ID
 * @param {string} options.query - The search query or URL
 * @param {Object} options.requestedBy - The user who requested the song
 * @param {boolean} options.playNow - Whether to play the song immediately
 * @returns {Promise<Object|null>} The song object or null if failed
 */
async function addSong({ guildId, query, requestedBy, playNow = false }) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      throw new Error('Not connected to a voice channel');
    }
    
    // Get guild settings
    const settings = getGuildSettings(guildId);
    
    // Check if queue is full
    if (queue.songs.length >= settings.maxQueueSize) {
      throw new Error(`Queue is full (max ${settings.maxQueueSize} songs)`);
    }
    
    // Get song info
    let song;
    
    // Check if is YouTube URL
    if (ytdl.validateURL(query)) {
      const info = await ytdl.getInfo(query);
      
      song = {
        title: info.videoDetails.title,
        url: info.videoDetails.video_url,
        duration: parseInt(info.videoDetails.lengthSeconds),
        thumbnail: info.videoDetails.thumbnails[0].url,
        requestedBy,
        addedAt: Date.now()
      };
    } else {
      // Search for song
      const searchResults = await ytSearch(query);
      
      if (!searchResults.videos.length) {
        throw new Error('No songs found');
      }
      
      const video = searchResults.videos[0];
      
      song = {
        title: video.title,
        url: video.url,
        duration: video.seconds,
        thumbnail: video.thumbnail,
        requestedBy,
        addedAt: Date.now()
      };
    }
    
    // Add song to queue
    if (playNow) {
      queue.songs.unshift(song);
      playSong(guildId, true);
    } else {
      queue.songs.push(song);
      
      // Start playing if not already
      if (!queue.playing && !queue.paused) {
        playSong(guildId);
      }
    }
    
    return song;
  } catch (error) {
    logger.error(`Error adding song to queue in guild ${guildId}:`, error);
    throw error;
  }
}

/**
 * Play a song from the queue
 * @param {string} guildId - The guild ID
 * @param {boolean} skip - Whether to skip the current song
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function playSong(guildId, skip = false) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      return false;
    }
    
    // If skipping, handle differently based on loop mode
    if (skip) {
      if (queue.loopMode === 'song') {
        // Song loop - Play the same song again
        return playSongFromUrl(guildId, queue.currentSong.url);
      } else if (queue.loopMode === 'queue') {
        // Queue loop - Move current song to the end
        if (queue.currentSong) {
          queue.songs.push(queue.currentSong);
        }
      }
    }
    
    // If no songs in queue
    if (!queue.songs.length) {
      // If in autoplay mode, get a related song
      if (queue.autoplay && queue.currentSong) {
        try {
          // Get related songs
          const info = await ytdl.getInfo(queue.currentSong.url);
          const related = info.related_videos[0];
          
          if (related) {
            const relatedInfo = await ytdl.getInfo(related.id);
            
            const song = {
              title: relatedInfo.videoDetails.title,
              url: relatedInfo.videoDetails.video_url,
              duration: parseInt(relatedInfo.videoDetails.lengthSeconds),
              thumbnail: relatedInfo.videoDetails.thumbnails[0].url,
              requestedBy: queue.currentSong.requestedBy,
              addedAt: Date.now(),
              autoplay: true
            };
            
            queue.songs.push(song);
            
            // Announce autoplay
            const embed = new EmbedBuilder()
              .setTitle('Autoplay')
              .setDescription(`Adding related song: **${song.title}**`)
              .setColor('#5865F2')
              .setThumbnail(song.thumbnail);
            
            queue.textChannel.send({ embeds: [embed] }).catch(err => {
              logger.error('Error sending autoplay message:', err);
            });
          }
        } catch (error) {
          logger.error(`Error getting related song in guild ${guildId}:`, error);
        }
      }
      
      // If still no songs, start timeout to leave
      if (!queue.songs.length) {
        queue.playing = false;
        queue.currentSong = null;
        
        // Start timeout to leave if inactive
        const settings = getGuildSettings(guildId);
        
        queue.timeout = setTimeout(() => {
          // Send message that we're leaving due to inactivity
          const embed = new EmbedBuilder()
            .setTitle('Leaving Voice Channel')
            .setDescription(`Leaving voice channel due to inactivity (${settings.defaultTimeout} seconds)`)
            .setColor('#5865F2');
          
          queue.textChannel.send({ embeds: [embed] }).catch(err => {
            logger.error('Error sending leave message:', err);
          });
          
          // Leave voice channel
          leaveVoice(guildId);
        }, settings.defaultTimeout * 1000);
        
        return false;
      }
    }
    
    // Get next song
    const song = queue.songs.shift();
    queue.currentSong = song;
    
    // Play song
    return playSongFromUrl(guildId, song.url);
  } catch (error) {
    logger.error(`Error playing song in guild ${guildId}:`, error);
    
    // Try to play next song
    const queue = getQueue(guildId);
    
    if (queue && queue.songs.length) {
      return playSong(guildId, true);
    }
    
    return false;
  }
}

/**
 * Play a song from a URL
 * @param {string} guildId - The guild ID
 * @param {string} url - The song URL
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function playSongFromUrl(guildId, url) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      return false;
    }
    
    // Get stream
    const stream = ytdl(url, {
      filter: 'audioonly',
      quality: 'highestaudio',
      highWaterMark: 1<<25, // 32MB buffer to prevent stuttering
      dlChunkSize: 0 // Disable chunking to prevent stuttering
    });
    
    // Apply audio filters if set
    const filteredStream = await filterManager.applyFilter(stream, queue.filter);
    
    // Create resource
    const resource = createAudioResource(filteredStream, {
      inlineVolume: true
    });
    
    // Set volume
    resource.volume.setVolume(queue.volume / 100);
    
    // Play resource
    queue.player.play(resource);
    
    // Send now playing message
    if (queue.currentSong) {
      const embed = new EmbedBuilder()
        .setTitle('Now Playing')
        .setDescription(`**${queue.currentSong.title}**`)
        .setColor('#5865F2')
        .setThumbnail(queue.currentSong.thumbnail)
        .addFields(
          { name: 'Duration', value: formatDuration(queue.currentSong.duration), inline: true },
          { name: 'Requested By', value: `<@${queue.currentSong.requestedBy.id}>`, inline: true }
        )
        .setFooter({ text: `Queue: ${queue.songs.length} song(s)` });
      
      queue.textChannel.send({ embeds: [embed] }).catch(err => {
        logger.error('Error sending now playing message:', err);
      });
    }
    
    return true;
  } catch (error) {
    logger.error(`Error playing song from URL in guild ${guildId}:`, error);
    
    // Get queue
    const queue = getQueue(guildId);
    
    if (queue) {
      // Send error message
      const embed = new EmbedBuilder()
        .setTitle('Playback Error')
        .setDescription(`An error occurred playing the song: ${error.message}`)
        .setColor('#FF0000');
      
      queue.textChannel.send({ embeds: [embed] }).catch(err => {
        logger.error('Error sending error message:', err);
      });
      
      // Try to play next song
      if (queue.songs.length) {
        return playSong(guildId, true);
      }
    }
    
    return false;
  }
}

/**
 * Handle song finish
 * @param {string} guildId - The guild ID
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function handleSongFinish(guildId) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      return false;
    }
    
    // Handle based on loop mode
    if (queue.loopMode === 'song' && queue.currentSong) {
      // Song loop - Play the same song again
      return playSongFromUrl(guildId, queue.currentSong.url);
    } else if (queue.loopMode === 'queue' && queue.currentSong) {
      // Queue loop - Add current song to end of queue
      queue.songs.push(queue.currentSong);
    }
    
    // Play next song
    return playSong(guildId);
  } catch (error) {
    logger.error(`Error handling song finish in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Skip the current song
 * @param {string} guildId - The guild ID
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function skipSong(guildId) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue || !queue.player) {
      return false;
    }
    
    // Stop current playback (will trigger idle event and next song)
    queue.player.stop();
    
    return true;
  } catch (error) {
    logger.error(`Error skipping song in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Pause playback
 * @param {string} guildId - The guild ID
 * @returns {boolean} Whether the operation was successful
 */
function pausePlayback(guildId) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue || !queue.player || !queue.playing || queue.paused) {
      return false;
    }
    
    // Pause player
    queue.player.pause();
    queue.paused = true;
    
    return true;
  } catch (error) {
    logger.error(`Error pausing playback in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Resume playback
 * @param {string} guildId - The guild ID
 * @returns {boolean} Whether the operation was successful
 */
function resumePlayback(guildId) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue || !queue.player || !queue.paused) {
      return false;
    }
    
    // Resume player
    queue.player.unpause();
    queue.paused = false;
    
    return true;
  } catch (error) {
    logger.error(`Error resuming playback in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Set volume
 * @param {string} guildId - The guild ID
 * @param {number} volume - The volume (0-200)
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function setVolume(guildId, volume) {
  try {
    // Validate volume
    volume = Math.max(0, Math.min(200, volume));
    
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      return false;
    }
    
    // Set volume
    queue.volume = volume;
    
    // Update current resource volume if playing
    if (queue.player.state.resource) {
      queue.player.state.resource.volume.setVolume(volume / 100);
    }
    
    // Update guild settings
    await updateGuildSettings(guildId, { volume });
    
    return true;
  } catch (error) {
    logger.error(`Error setting volume in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Set loop mode
 * @param {string} guildId - The guild ID
 * @param {string} mode - The loop mode (none, song, queue)
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function setLoopMode(guildId, mode) {
  try {
    // Validate mode
    if (!['none', 'song', 'queue'].includes(mode)) {
      return false;
    }
    
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      return false;
    }
    
    // Set loop mode
    queue.loopMode = mode;
    
    // Update guild settings
    await updateGuildSettings(guildId, { repeatMode: mode });
    
    return true;
  } catch (error) {
    logger.error(`Error setting loop mode in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Toggle autoplay
 * @param {string} guildId - The guild ID
 * @returns {Promise<boolean>} Whether autoplay is now enabled
 */
async function toggleAutoplay(guildId) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      return false;
    }
    
    // Toggle autoplay
    queue.autoplay = !queue.autoplay;
    
    // Update guild settings
    await updateGuildSettings(guildId, { autoplay: queue.autoplay });
    
    return queue.autoplay;
  } catch (error) {
    logger.error(`Error toggling autoplay in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Remove a song from the queue
 * @param {string} guildId - The guild ID
 * @param {number} index - The song index
 * @returns {Object|null} The removed song or null if failed
 */
function removeSong(guildId, index) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue || index < 0 || index >= queue.songs.length) {
      return null;
    }
    
    // Remove song
    const removed = queue.songs.splice(index, 1)[0];
    
    return removed;
  } catch (error) {
    logger.error(`Error removing song in guild ${guildId}:`, error);
    return null;
  }
}

/**
 * Shuffle the queue
 * @param {string} guildId - The guild ID
 * @returns {boolean} Whether the operation was successful
 */
function shuffleQueue(guildId) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue || queue.songs.length < 2) {
      return false;
    }
    
    // Shuffle songs
    for (let i = queue.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
    }
    
    return true;
  } catch (error) {
    logger.error(`Error shuffling queue in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Clear the queue
 * @param {string} guildId - The guild ID
 * @returns {boolean} Whether the operation was successful
 */
function clearQueue(guildId) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      return false;
    }
    
    // Clear songs
    queue.songs = [];
    
    return true;
  } catch (error) {
    logger.error(`Error clearing queue in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Get queue status
 * @param {string} guildId - The guild ID
 * @returns {Object|null} The queue status or null if no queue
 */
function getQueueStatus(guildId) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      return null;
    }
    
    // Create status object
    const status = {
      playing: queue.playing,
      paused: queue.paused,
      volume: queue.volume,
      loopMode: queue.loopMode,
      autoplay: queue.autoplay,
      filter: queue.filter,
      currentSong: queue.currentSong,
      queueLength: queue.songs.length,
      queue: queue.songs.slice(0, 10) // First 10 songs
    };
    
    return status;
  } catch (error) {
    logger.error(`Error getting queue status in guild ${guildId}:`, error);
    return null;
  }
}

/**
 * Set audio filter
 * @param {string} guildId - The guild ID
 * @param {string|null} filter - The filter name or null to clear
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function setFilter(guildId, filter) {
  try {
    // Get queue
    const queue = getQueue(guildId);
    
    if (!queue) {
      return false;
    }
    
    // Validate filter
    if (filter && !filterManager.isValidFilter(filter)) {
      return false;
    }
    
    // Set filter
    queue.filter = filter;
    
    // Restart current song with filter if playing
    if (queue.playing && queue.currentSong) {
      return playSongFromUrl(guildId, queue.currentSong.url);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error setting filter in guild ${guildId}:`, error);
    return false;
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

/**
 * Shutdown music manager
 */
function shutdown() {
  try {
    // Leave all voice channels
    for (const [guildId] of queues) {
      leaveVoice(guildId);
    }
    
    // Save settings
    saveMusicSettings().catch(err => {
      logger.error('Error saving music settings during shutdown:', err);
    });
    
    logger.info('Music manager shut down');
  } catch (error) {
    logger.error('Error shutting down music manager:', error);
  }
}

module.exports = {
  initialize,
  joinVoice,
  leaveVoice,
  addSong,
  playSong,
  skipSong,
  pausePlayback,
  resumePlayback,
  setVolume,
  setLoopMode,
  toggleAutoplay,
  removeSong,
  shuffleQueue,
  clearQueue,
  getQueueStatus,
  setFilter,
  getGuildSettings,
  updateGuildSettings,
  shutdown
};