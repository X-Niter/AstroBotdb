/**
 * Playlist Manager
 * Manages user playlists for music playback
 */

const fs = require('fs').promises;
const path = require('path');
const { Collection } = require('discord.js');
const { v4: uuidv4 } = require('uuid');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const logger = require('../../logger');

// Path to playlists file
const PLAYLISTS_FILE = path.join(process.cwd(), 'data', 'playlists.json');

// User playlists (userId -> playlists)
const userPlaylists = new Collection();

// Server playlists (guildId -> playlists)
const serverPlaylists = new Collection();

/**
 * Initialize playlist manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing playlist manager...');
    
    // Load playlists
    await loadPlaylists();
    
    logger.info('Playlist manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing playlist manager:', error);
    return false;
  }
}

/**
 * Load playlists from disk
 * @returns {Promise<void>}
 */
async function loadPlaylists() {
  try {
    // Check if file exists
    try {
      await fs.access(PLAYLISTS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await savePlaylists();
      return;
    }
    
    // Read file
    const data = await fs.readFile(PLAYLISTS_FILE, 'utf8');
    
    // Parse JSON
    const playlists = JSON.parse(data);
    
    // Clear collections
    userPlaylists.clear();
    serverPlaylists.clear();
    
    // Load user playlists
    if (playlists.userPlaylists) {
      for (const [userId, userPlaylistsData] of Object.entries(playlists.userPlaylists)) {
        userPlaylists.set(userId, userPlaylistsData);
      }
    }
    
    // Load server playlists
    if (playlists.serverPlaylists) {
      for (const [guildId, serverPlaylistsData] of Object.entries(playlists.serverPlaylists)) {
        serverPlaylists.set(guildId, serverPlaylistsData);
      }
    }
    
    logger.debug('Playlists loaded from disk');
  } catch (error) {
    logger.error('Error loading playlists:', error);
    throw error;
  }
}

/**
 * Save playlists to disk
 * @returns {Promise<void>}
 */
async function savePlaylists() {
  try {
    // Create playlists object
    const playlists = {
      userPlaylists: {},
      serverPlaylists: {}
    };
    
    // Add user playlists
    for (const [userId, userPlaylistsData] of userPlaylists.entries()) {
      playlists.userPlaylists[userId] = userPlaylistsData;
    }
    
    // Add server playlists
    for (const [guildId, serverPlaylistsData] of serverPlaylists.entries()) {
      playlists.serverPlaylists[guildId] = serverPlaylistsData;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(PLAYLISTS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(PLAYLISTS_FILE, JSON.stringify(playlists, null, 2));
    
    logger.debug('Playlists saved to disk');
  } catch (error) {
    logger.error('Error saving playlists:', error);
    throw error;
  }
}

/**
 * Create a new playlist
 * @param {Object} options - Playlist options
 * @param {string} options.name - The playlist name
 * @param {string} options.description - The playlist description
 * @param {string} options.createdBy - The user ID who created the playlist
 * @param {string} [options.guildId] - The guild ID if server playlist
 * @param {boolean} [options.isPrivate=true] - Whether the playlist is private
 * @returns {Promise<Object>} The created playlist
 */
async function createPlaylist({ name, description, createdBy, guildId, isPrivate = true }) {
  try {
    // Validate
    if (!name || !createdBy) {
      throw new Error('Name and creator are required');
    }
    
    // Create playlist object
    const playlist = {
      id: uuidv4(),
      name,
      description: description || '',
      createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPrivate,
      songs: []
    };
    
    // Add to appropriate collection
    if (guildId) {
      // Server playlist
      const guildPlaylists = serverPlaylists.get(guildId) || {};
      guildPlaylists[playlist.id] = playlist;
      serverPlaylists.set(guildId, guildPlaylists);
    } else {
      // User playlist
      const userPlaylistsData = userPlaylists.get(createdBy) || {};
      userPlaylistsData[playlist.id] = playlist;
      userPlaylists.set(createdBy, userPlaylistsData);
    }
    
    // Save playlists
    await savePlaylists();
    
    return playlist;
  } catch (error) {
    logger.error('Error creating playlist:', error);
    throw error;
  }
}

/**
 * Get a playlist by ID
 * @param {string} playlistId - The playlist ID
 * @param {string} userId - The user ID requesting the playlist
 * @param {string} [guildId] - The guild ID if checking server playlists
 * @returns {Object|null} The playlist or null if not found or not accessible
 */
function getPlaylist(playlistId, userId, guildId) {
  try {
    // Try user playlists first
    for (const [playlistUserId, userPlaylistsData] of userPlaylists.entries()) {
      if (playlistId in userPlaylistsData) {
        const playlist = userPlaylistsData[playlistId];
        
        // Check if user has access (creator or public playlist)
        if (playlistUserId === userId || !playlist.isPrivate) {
          return playlist;
        }
      }
    }
    
    // Try server playlists if guild ID provided
    if (guildId && serverPlaylists.has(guildId)) {
      const guildPlaylists = serverPlaylists.get(guildId);
      
      if (playlistId in guildPlaylists) {
        return guildPlaylists[playlistId];
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error getting playlist:', error);
    return null;
  }
}

/**
 * Get user playlists
 * @param {string} userId - The user ID
 * @returns {Array<Object>} The user playlists
 */
function getUserPlaylists(userId) {
  try {
    const userPlaylistsData = userPlaylists.get(userId) || {};
    return Object.values(userPlaylistsData);
  } catch (error) {
    logger.error(`Error getting playlists for user ${userId}:`, error);
    return [];
  }
}

/**
 * Get server playlists
 * @param {string} guildId - The guild ID
 * @returns {Array<Object>} The server playlists
 */
function getServerPlaylists(guildId) {
  try {
    const guildPlaylists = serverPlaylists.get(guildId) || {};
    return Object.values(guildPlaylists);
  } catch (error) {
    logger.error(`Error getting playlists for guild ${guildId}:`, error);
    return [];
  }
}

/**
 * Delete a playlist
 * @param {string} playlistId - The playlist ID
 * @param {string} userId - The user ID requesting deletion
 * @param {string} [guildId] - The guild ID if deleting a server playlist
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function deletePlaylist(playlistId, userId, guildId) {
  try {
    // Try user playlists first
    if (userPlaylists.has(userId)) {
      const userPlaylistsData = userPlaylists.get(userId);
      
      if (playlistId in userPlaylistsData) {
        // Delete playlist
        delete userPlaylistsData[playlistId];
        
        // Update storage
        if (Object.keys(userPlaylistsData).length === 0) {
          userPlaylists.delete(userId);
        } else {
          userPlaylists.set(userId, userPlaylistsData);
        }
        
        // Save playlists
        await savePlaylists();
        
        return true;
      }
    }
    
    // Try server playlists if guild ID provided
    if (guildId && serverPlaylists.has(guildId)) {
      const guildPlaylists = serverPlaylists.get(guildId);
      
      if (playlistId in guildPlaylists) {
        // Check if user is creator or has permission
        const playlist = guildPlaylists[playlistId];
        
        if (playlist.createdBy !== userId) {
          // TODO: Check if user has manage server permission
          // For now, only creator can delete
          return false;
        }
        
        // Delete playlist
        delete guildPlaylists[playlistId];
        
        // Update storage
        if (Object.keys(guildPlaylists).length === 0) {
          serverPlaylists.delete(guildId);
        } else {
          serverPlaylists.set(guildId, guildPlaylists);
        }
        
        // Save playlists
        await savePlaylists();
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    logger.error(`Error deleting playlist ${playlistId}:`, error);
    return false;
  }
}

/**
 * Add a song to a playlist
 * @param {string} playlistId - The playlist ID
 * @param {string} userId - The user ID requesting the addition
 * @param {string} query - The song query or URL
 * @param {string} [guildId] - The guild ID if adding to a server playlist
 * @returns {Promise<Object|null>} The added song or null if failed
 */
async function addSongToPlaylist(playlistId, userId, query, guildId) {
  try {
    // Get playlist
    const playlist = getPlaylist(playlistId, userId, guildId);
    
    if (!playlist) {
      throw new Error('Playlist not found or not accessible');
    }
    
    // Check if user is creator or has permission
    if (playlist.createdBy !== userId) {
      // TODO: Check if user has manage server permission for server playlists
      // For now, only creator can add songs
      throw new Error('Only the playlist creator can add songs');
    }
    
    // Get song info
    let song;
    
    // Check if is YouTube URL
    if (ytdl.validateURL(query)) {
      const info = await ytdl.getInfo(query);
      
      song = {
        id: uuidv4(),
        title: info.videoDetails.title,
        url: info.videoDetails.video_url,
        duration: parseInt(info.videoDetails.lengthSeconds),
        thumbnail: info.videoDetails.thumbnails[0].url,
        addedBy: userId,
        addedAt: new Date().toISOString()
      };
    } else {
      // Search for song
      const searchResults = await ytSearch(query);
      
      if (!searchResults.videos.length) {
        throw new Error('No songs found');
      }
      
      const video = searchResults.videos[0];
      
      song = {
        id: uuidv4(),
        title: video.title,
        url: video.url,
        duration: video.seconds,
        thumbnail: video.thumbnail,
        addedBy: userId,
        addedAt: new Date().toISOString()
      };
    }
    
    // Add song to playlist
    playlist.songs.push(song);
    playlist.updatedAt = new Date().toISOString();
    
    // Update playlist in collection
    if (guildId) {
      const guildPlaylists = serverPlaylists.get(guildId);
      guildPlaylists[playlistId] = playlist;
      serverPlaylists.set(guildId, guildPlaylists);
    } else {
      const userPlaylistsData = userPlaylists.get(playlist.createdBy);
      userPlaylistsData[playlistId] = playlist;
      userPlaylists.set(playlist.createdBy, userPlaylistsData);
    }
    
    // Save playlists
    await savePlaylists();
    
    return song;
  } catch (error) {
    logger.error(`Error adding song to playlist ${playlistId}:`, error);
    throw error;
  }
}

/**
 * Remove a song from a playlist
 * @param {string} playlistId - The playlist ID
 * @param {string} songId - The song ID
 * @param {string} userId - The user ID requesting the removal
 * @param {string} [guildId] - The guild ID if removing from a server playlist
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function removeSongFromPlaylist(playlistId, songId, userId, guildId) {
  try {
    // Get playlist
    const playlist = getPlaylist(playlistId, userId, guildId);
    
    if (!playlist) {
      throw new Error('Playlist not found or not accessible');
    }
    
    // Check if user is creator or has permission
    if (playlist.createdBy !== userId) {
      // TODO: Check if user has manage server permission for server playlists
      // For now, only creator can remove songs
      throw new Error('Only the playlist creator can remove songs');
    }
    
    // Find song index
    const songIndex = playlist.songs.findIndex(song => song.id === songId);
    
    if (songIndex === -1) {
      throw new Error('Song not found in playlist');
    }
    
    // Remove song
    playlist.songs.splice(songIndex, 1);
    playlist.updatedAt = new Date().toISOString();
    
    // Update playlist in collection
    if (guildId) {
      const guildPlaylists = serverPlaylists.get(guildId);
      guildPlaylists[playlistId] = playlist;
      serverPlaylists.set(guildId, guildPlaylists);
    } else {
      const userPlaylistsData = userPlaylists.get(playlist.createdBy);
      userPlaylistsData[playlistId] = playlist;
      userPlaylists.set(playlist.createdBy, userPlaylistsData);
    }
    
    // Save playlists
    await savePlaylists();
    
    return true;
  } catch (error) {
    logger.error(`Error removing song from playlist ${playlistId}:`, error);
    throw error;
  }
}

/**
 * Update playlist details
 * @param {string} playlistId - The playlist ID
 * @param {Object} updates - The updates to apply
 * @param {string} userId - The user ID requesting the update
 * @param {string} [guildId] - The guild ID if updating a server playlist
 * @returns {Promise<Object|null>} The updated playlist or null if failed
 */
async function updatePlaylist(playlistId, updates, userId, guildId) {
  try {
    // Get playlist
    const playlist = getPlaylist(playlistId, userId, guildId);
    
    if (!playlist) {
      throw new Error('Playlist not found or not accessible');
    }
    
    // Check if user is creator or has permission
    if (playlist.createdBy !== userId) {
      // TODO: Check if user has manage server permission for server playlists
      // For now, only creator can update
      throw new Error('Only the playlist creator can update the playlist');
    }
    
    // Update playlist
    const updatedPlaylist = {
      ...playlist,
      name: updates.name || playlist.name,
      description: updates.description !== undefined ? updates.description : playlist.description,
      isPrivate: updates.isPrivate !== undefined ? updates.isPrivate : playlist.isPrivate,
      updatedAt: new Date().toISOString()
    };
    
    // Update playlist in collection
    if (guildId) {
      const guildPlaylists = serverPlaylists.get(guildId);
      guildPlaylists[playlistId] = updatedPlaylist;
      serverPlaylists.set(guildId, guildPlaylists);
    } else {
      const userPlaylistsData = userPlaylists.get(playlist.createdBy);
      userPlaylistsData[playlistId] = updatedPlaylist;
      userPlaylists.set(playlist.createdBy, userPlaylistsData);
    }
    
    // Save playlists
    await savePlaylists();
    
    return updatedPlaylist;
  } catch (error) {
    logger.error(`Error updating playlist ${playlistId}:`, error);
    throw error;
  }
}

/**
 * Shuffle a playlist
 * @param {string} playlistId - The playlist ID
 * @param {string} userId - The user ID requesting the shuffle
 * @param {string} [guildId] - The guild ID if updating a server playlist
 * @returns {Promise<Object|null>} The shuffled playlist or null if failed
 */
async function shufflePlaylist(playlistId, userId, guildId) {
  try {
    // Get playlist
    const playlist = getPlaylist(playlistId, userId, guildId);
    
    if (!playlist) {
      throw new Error('Playlist not found or not accessible');
    }
    
    // Check if user is creator or has permission
    if (playlist.createdBy !== userId) {
      // TODO: Check if user has manage server permission for server playlists
      // For now, only creator can update
      throw new Error('Only the playlist creator can shuffle the playlist');
    }
    
    // Shuffle songs
    const songs = [...playlist.songs];
    
    for (let i = songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [songs[i], songs[j]] = [songs[j], songs[i]];
    }
    
    // Update playlist
    const shuffledPlaylist = {
      ...playlist,
      songs,
      updatedAt: new Date().toISOString()
    };
    
    // Update playlist in collection
    if (guildId) {
      const guildPlaylists = serverPlaylists.get(guildId);
      guildPlaylists[playlistId] = shuffledPlaylist;
      serverPlaylists.set(guildId, guildPlaylists);
    } else {
      const userPlaylistsData = userPlaylists.get(playlist.createdBy);
      userPlaylistsData[playlistId] = shuffledPlaylist;
      userPlaylists.set(playlist.createdBy, userPlaylistsData);
    }
    
    // Save playlists
    await savePlaylists();
    
    return shuffledPlaylist;
  } catch (error) {
    logger.error(`Error shuffling playlist ${playlistId}:`, error);
    throw error;
  }
}

/**
 * Import a YouTube playlist
 * @param {string} playlistUrl - The YouTube playlist URL
 * @param {Object} options - Import options
 * @param {string} options.name - The playlist name
 * @param {string} options.description - The playlist description
 * @param {string} options.userId - The user ID importing the playlist
 * @param {string} [options.guildId] - The guild ID if importing as a server playlist
 * @param {boolean} [options.isPrivate=true] - Whether the playlist is private
 * @returns {Promise<Object|null>} The imported playlist or null if failed
 */
async function importYouTubePlaylist(playlistUrl, { name, description, userId, guildId, isPrivate = true }) {
  try {
    // Validate URL
    if (!playlistUrl.includes('youtube.com/playlist') && !playlistUrl.includes('youtube.com/watch?v=') && !playlistUrl.includes('youtu.be/')) {
      throw new Error('Invalid YouTube playlist URL');
    }
    
    // Extract playlist ID
    let playlistId;
    
    if (playlistUrl.includes('list=')) {
      const match = playlistUrl.match(/list=([^&]+)/);
      playlistId = match ? match[1] : null;
    }
    
    if (!playlistId) {
      throw new Error('Could not extract playlist ID from URL');
    }
    
    // Get playlist information
    const results = await ytSearch({ listId: playlistId });
    
    if (!results || !results.videos || !results.videos.length) {
      throw new Error('Playlist not found or is empty');
    }
    
    // Create playlist
    const playlist = await createPlaylist({
      name: name || results.title || 'Imported Playlist',
      description: description || results.description || '',
      createdBy: userId,
      guildId,
      isPrivate
    });
    
    // Add songs
    for (const video of results.videos) {
      playlist.songs.push({
        id: uuidv4(),
        title: video.title,
        url: video.url,
        duration: video.seconds,
        thumbnail: video.thumbnail,
        addedBy: userId,
        addedAt: new Date().toISOString()
      });
    }
    
    // Update timestamp
    playlist.updatedAt = new Date().toISOString();
    
    // Update playlist in collection
    if (guildId) {
      const guildPlaylists = serverPlaylists.get(guildId);
      guildPlaylists[playlist.id] = playlist;
      serverPlaylists.set(guildId, guildPlaylists);
    } else {
      const userPlaylistsData = userPlaylists.get(userId);
      userPlaylistsData[playlist.id] = playlist;
      userPlaylists.set(userId, userPlaylistsData);
    }
    
    // Save playlists
    await savePlaylists();
    
    return playlist;
  } catch (error) {
    logger.error('Error importing YouTube playlist:', error);
    throw error;
  }
}

/**
 * Get all accessible playlists for a user
 * @param {string} userId - The user ID
 * @param {string} [guildId] - The guild ID if including server playlists
 * @returns {Array<Object>} The accessible playlists
 */
function getAccessiblePlaylists(userId, guildId) {
  try {
    const playlists = [];
    
    // Get user's own playlists
    const userPlaylistsData = userPlaylists.get(userId) || {};
    playlists.push(...Object.values(userPlaylistsData));
    
    // Get public playlists from other users
    for (const [otherUserId, otherUserPlaylists] of userPlaylists.entries()) {
      if (otherUserId !== userId) {
        const publicPlaylists = Object.values(otherUserPlaylists).filter(playlist => !playlist.isPrivate);
        playlists.push(...publicPlaylists);
      }
    }
    
    // Get server playlists if guildId provided
    if (guildId && serverPlaylists.has(guildId)) {
      const guildPlaylists = serverPlaylists.get(guildId);
      playlists.push(...Object.values(guildPlaylists));
    }
    
    return playlists;
  } catch (error) {
    logger.error(`Error getting accessible playlists for user ${userId}:`, error);
    return [];
  }
}

module.exports = {
  initialize,
  createPlaylist,
  getPlaylist,
  getUserPlaylists,
  getServerPlaylists,
  getAccessiblePlaylists,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  updatePlaylist,
  shufflePlaylist,
  importYouTubePlaylist
};