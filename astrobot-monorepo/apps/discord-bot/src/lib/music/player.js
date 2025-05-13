const { 
  AudioPlayerStatus,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  getVoiceConnection
} = require('@discordjs/voice');
const playdl = require('play-dl');
const ytdl = require('ytdl-core');
const Queue = require('./queue');
const Track = require('./track');
const logger = require('../logger');

// Map of guild IDs to queues
const queues = new Map();

// Map of guild IDs to audio players
const players = new Map();

// Map of guild IDs to voice connections
const connections = new Map();

/**
 * Create or get a queue for a guild
 * @param {string} guildId - The guild ID
 * @param {Object} client - The Discord client
 * @returns {Queue} The queue
 */
function getQueue(guildId, client) {
  if (!queues.has(guildId)) {
    queues.set(guildId, new Queue({ guildId, client }));
  }
  
  return queues.get(guildId);
}

/**
 * Get an audio player for a guild
 * @param {string} guildId - The guild ID
 * @returns {AudioPlayer} The audio player
 */
function getPlayer(guildId) {
  if (!players.has(guildId)) {
    const player = createAudioPlayer();
    
    player.on('error', error => {
      logger.error(`Error in audio player for guild ${guildId}:`, error);
      const queue = queues.get(guildId);
      
      if (queue) {
        // Try to play the next track
        playTrack(guildId);
      }
    });
    
    player.on(AudioPlayerStatus.Idle, () => {
      const queue = queues.get(guildId);
      
      if (queue) {
        // Play the next track when the current one finishes
        playTrack(guildId);
      }
    });
    
    players.set(guildId, player);
  }
  
  return players.get(guildId);
}

/**
 * Join a voice channel
 * @param {string} guildId - The guild ID
 * @param {string} channelId - The voice channel ID
 * @param {Object} client - The Discord client
 * @returns {Promise<boolean>} Whether joining was successful
 */
async function joinChannel(guildId, channelId, client) {
  try {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) throw new Error('Guild not found');
    
    const channel = guild.channels.cache.get(channelId);
    if (!channel) throw new Error('Voice channel not found');
    
    if (channel.type !== 2) throw new Error('Channel is not a voice channel');
    
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true
    });
    
    // Handle connection errors
    connection.on('error', error => {
      logger.error(`Error in voice connection for guild ${guildId}:`, error);
      leaveChannel(guildId);
    });
    
    // Handle disconnection
    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      try {
        // Try to reconnect
        await Promise.race([
          entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
          entersState(connection, VoiceConnectionStatus.Connecting, 5_000)
        ]);
      } catch (error) {
        // If reconnection fails, destroy the connection
        connection.destroy();
        connections.delete(guildId);
        
        const queue = queues.get(guildId);
        if (queue) {
          queue.stop();
        }
      }
    });
    
    // Store the connection
    connections.set(guildId, connection);
    
    // Subscribe to the audio player
    const player = getPlayer(guildId);
    connection.subscribe(player);
    
    return true;
  } catch (error) {
    logger.error(`Error joining voice channel in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Leave a voice channel
 * @param {string} guildId - The guild ID
 * @returns {boolean} Whether leaving was successful
 */
function leaveChannel(guildId) {
  try {
    const connection = connections.get(guildId);
    if (connection) {
      connection.destroy();
      connections.delete(guildId);
    }
    
    const player = players.get(guildId);
    if (player) {
      player.stop();
      players.delete(guildId);
    }
    
    const queue = queues.get(guildId);
    if (queue) {
      queue.stop();
      queues.delete(guildId);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error leaving voice channel in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Play a track from the queue
 * @param {string} guildId - The guild ID
 * @returns {Promise<boolean>} Whether playing was successful
 */
async function playTrack(guildId) {
  try {
    const queue = queues.get(guildId);
    if (!queue) return false;
    
    // Start playing the next track
    const success = queue.playNext();
    if (!success) return false;
    
    const currentTrack = queue.currentTrack;
    if (!currentTrack) return false;
    
    // Check if we're in a voice channel
    const connection = connections.get(guildId);
    if (!connection) {
      // Try to join the voice channel
      const voiceChannelId = queue.voiceChannelId;
      if (!voiceChannelId) {
        logger.error(`No voice channel set for guild ${guildId}`);
        return false;
      }
      
      const joined = await joinChannel(guildId, voiceChannelId, queue.client);
      if (!joined) return false;
    }
    
    // Create an audio resource from the track URL
    let resource;
    
    // Handle different types of URLs
    if (currentTrack.url.includes('youtube.com') || currentTrack.url.includes('youtu.be')) {
      // YouTube URL
      try {
        // Try to use play-dl first (better quality and less issues)
        const stream = await playdl.stream(currentTrack.url);
        resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true
        });
      } catch (error) {
        // Fallback to ytdl-core
        logger.warn(`play-dl failed, falling back to ytdl-core for ${currentTrack.url}:`, error);
        
        const stream = ytdl(currentTrack.url, {
          filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1 << 25 // 32MB buffer
        });
        
        resource = createAudioResource(stream, {
          inlineVolume: true
        });
      }
    } else if (currentTrack.url.includes('spotify.com')) {
      // Spotify URL
      try {
        // Convert Spotify URL to a YouTube URL
        const spotifyInfo = await playdl.spotify(currentTrack.url);
        const searchResults = await playdl.search(
          `${spotifyInfo.name} ${spotifyInfo.artists.map(a => a.name).join(' ')}`,
          { limit: 1 }
        );
        
        if (searchResults.length > 0) {
          const stream = await playdl.stream(searchResults[0].url);
          resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true
          });
        } else {
          throw new Error('No search results found for Spotify track');
        }
      } catch (error) {
        logger.error(`Error playing Spotify track ${currentTrack.url}:`, error);
        // Skip to the next track
        return playTrack(guildId);
      }
    } else {
      // Direct URL (assume it's a valid audio file)
      resource = createAudioResource(currentTrack.url, {
        inlineVolume: true
      });
    }
    
    // Set the volume
    if (resource.volume) {
      resource.volume.setVolume(queue.volume / 100);
    }
    
    // Play the track
    const player = getPlayer(guildId);
    player.play(resource);
    
    return true;
  } catch (error) {
    logger.error(`Error playing track in guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Search for tracks
 * @param {string} query - The search query
 * @param {string} requestedBy - The ID of the user who requested the search
 * @param {string} searchType - The type of search (youtube, spotify, soundcloud, etc.)
 * @returns {Promise<Track[]>} The search results
 */
async function searchTracks(query, requestedBy, searchType = 'youtube') {
  try {
    let results = [];
    
    // Check if the query is a URL
    if (query.startsWith('http')) {
      // Direct URL
      if (query.includes('youtube.com') || query.includes('youtu.be')) {
        // YouTube URL
        const info = await ytdl.getInfo(query);
        
        results.push(new Track({
          url: query,
          title: info.videoDetails.title,
          duration: parseInt(info.videoDetails.lengthSeconds),
          thumbnail: info.videoDetails.thumbnails[0]?.url || '',
          requestedBy,
          source: {
            type: 'youtube',
            videoId: info.videoDetails.videoId,
            channelId: info.videoDetails.channelId,
            channelName: info.videoDetails.author.name
          }
        }));
      } else if (query.includes('spotify.com')) {
        // Spotify URL
        const spotifyInfo = await playdl.spotify(query);
        
        if (spotifyInfo.type === 'track') {
          // Single track
          results.push(new Track({
            url: query,
            title: spotifyInfo.name,
            duration: Math.floor(spotifyInfo.durationInSec),
            thumbnail: spotifyInfo.thumbnail?.url || '',
            requestedBy,
            source: {
              type: 'spotify',
              trackId: spotifyInfo.id,
              artists: spotifyInfo.artists.map(a => a.name).join(', ')
            }
          }));
        } else if (spotifyInfo.type === 'playlist' || spotifyInfo.type === 'album') {
          // Playlist or album
          const tracks = await spotifyInfo.all_tracks();
          
          results = tracks.map(track => new Track({
            url: track.url,
            title: track.name,
            duration: Math.floor(track.durationInSec),
            thumbnail: track.thumbnail?.url || '',
            requestedBy,
            source: {
              type: 'spotify',
              trackId: track.id,
              artists: track.artists.map(a => a.name).join(', ')
            }
          }));
        }
      } else {
        // Other URL - assume it's a valid audio file
        results.push(new Track({
          url: query,
          title: 'Unknown Track',
          duration: 0,
          thumbnail: '',
          requestedBy,
          source: {
            type: 'url'
          }
        }));
      }
    } else {
      // Search query
      const searchResults = await playdl.search(query, { limit: 10 });
      
      results = searchResults.map(result => new Track({
        url: result.url,
        title: result.title,
        duration: result.durationInSec,
        thumbnail: result.thumbnails[0]?.url || '',
        requestedBy,
        source: {
          type: 'youtube',
          videoId: result.id,
          channelId: result.channelId,
          channelName: result.channel.name
        }
      }));
    }
    
    return results;
  } catch (error) {
    logger.error(`Error searching for tracks:`, error);
    return [];
  }
}

module.exports = {
  getQueue,
  joinChannel,
  leaveChannel,
  playTrack,
  searchTracks
};