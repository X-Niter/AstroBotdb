const { EventEmitter } = require('events');
const Track = require('./track');
const logger = require('../logger');

/**
 * Represents a music queue for a guild
 * @extends EventEmitter
 */
class Queue extends EventEmitter {
  /**
   * Create a new Queue
   * @param {Object} options - Queue options
   * @param {string} options.guildId - The ID of the guild
   * @param {Object} options.client - The Discord client
   */
  constructor({ guildId, client }) {
    super();
    
    this.guildId = guildId;
    this.client = client;
    this.tracks = [];
    this.currentTrack = null;
    this.previousTracks = [];
    this.volume = 100;
    this.playing = false;
    this.paused = false;
    this.loopMode = 'OFF'; // OFF, TRACK, QUEUE
    this.filters = [];
    this.leaveOnEmpty = true;
    this.leaveOnStop = true;
    this.timeout = null;
    this.autoplay = false;
    this.textChannelId = null;
    this.voiceChannelId = null;
  }
  
  /**
   * Set the text channel for status messages
   * @param {string} channelId - The ID of the text channel
   * @returns {Queue} The queue instance
   */
  setTextChannel(channelId) {
    this.textChannelId = channelId;
    return this;
  }
  
  /**
   * Set the voice channel
   * @param {string} channelId - The ID of the voice channel
   * @returns {Queue} The queue instance
   */
  setVoiceChannel(channelId) {
    this.voiceChannelId = channelId;
    return this;
  }
  
  /**
   * Get the text channel
   * @returns {TextChannel|null} The text channel
   */
  getTextChannel() {
    if (!this.textChannelId) return null;
    
    const guild = this.client.guilds.cache.get(this.guildId);
    if (!guild) return null;
    
    return guild.channels.cache.get(this.textChannelId);
  }
  
  /**
   * Get the voice channel
   * @returns {VoiceChannel|null} The voice channel
   */
  getVoiceChannel() {
    if (!this.voiceChannelId) return null;
    
    const guild = this.client.guilds.cache.get(this.guildId);
    if (!guild) return null;
    
    return guild.channels.cache.get(this.voiceChannelId);
  }
  
  /**
   * Add a track to the queue
   * @param {Track|Track[]} track - The track or tracks to add
   * @returns {Queue} The queue instance
   */
  add(track) {
    if (Array.isArray(track)) {
      // Add multiple tracks
      this.tracks.push(...track);
      this.emit('tracksAdd', track);
    } else {
      // Add a single track
      this.tracks.push(track);
      this.emit('trackAdd', track);
    }
    
    return this;
  }
  
  /**
   * Remove a track from the queue
   * @param {number} index - The index of the track to remove
   * @returns {Track|null} The removed track or null
   */
  remove(index) {
    if (index < 0 || index >= this.tracks.length) return null;
    
    const track = this.tracks.splice(index, 1)[0];
    this.emit('trackRemove', track);
    
    return track;
  }
  
  /**
   * Clear the queue
   * @returns {Queue} The queue instance
   */
  clear() {
    this.tracks = [];
    this.emit('queueClear');
    
    return this;
  }
  
  /**
   * Shuffle the queue
   * @returns {Queue} The queue instance
   */
  shuffle() {
    // Fisher-Yates shuffle algorithm
    for (let i = this.tracks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
    }
    
    this.emit('queueShuffle');
    
    return this;
  }
  
  /**
   * Set the volume
   * @param {number} volume - The volume (0-200)
   * @returns {Queue} The queue instance
   */
  setVolume(volume) {
    this.volume = Math.min(Math.max(0, volume), 200);
    this.emit('volumeChange', this.volume);
    
    return this;
  }
  
  /**
   * Set the loop mode
   * @param {string} mode - The loop mode (OFF, TRACK, QUEUE)
   * @returns {Queue} The queue instance
   */
  setLoopMode(mode) {
    if (!['OFF', 'TRACK', 'QUEUE'].includes(mode)) {
      throw new Error('Invalid loop mode. Must be OFF, TRACK, or QUEUE');
    }
    
    this.loopMode = mode;
    this.emit('loopModeChange', mode);
    
    return this;
  }
  
  /**
   * Set autoplay mode
   * @param {boolean} enabled - Whether autoplay is enabled
   * @returns {Queue} The queue instance
   */
  setAutoplay(enabled) {
    this.autoplay = enabled;
    this.emit('autoplayChange', enabled);
    
    return this;
  }
  
  /**
   * Skip the current track
   * @returns {boolean} Whether the skip was successful
   */
  skip() {
    if (!this.playing) return false;
    
    this.emit('trackSkip', this.currentTrack);
    return true;
  }
  
  /**
   * Pause playback
   * @returns {boolean} Whether the pause was successful
   */
  pause() {
    if (!this.playing || this.paused) return false;
    
    this.paused = true;
    this.emit('playbackPause');
    
    return true;
  }
  
  /**
   * Resume playback
   * @returns {boolean} Whether the resume was successful
   */
  resume() {
    if (!this.playing || !this.paused) return false;
    
    this.paused = false;
    this.emit('playbackResume');
    
    return true;
  }
  
  /**
   * Stop playback
   * @returns {boolean} Whether the stop was successful
   */
  stop() {
    if (!this.playing) return false;
    
    this.playing = false;
    this.currentTrack = null;
    this.emit('playbackStop');
    
    return true;
  }
  
  /**
   * Play the next track
   * @returns {boolean} Whether the play was successful
   */
  playNext() {
    if (this.currentTrack) {
      // Add current track to previous tracks if not in TRACK loop mode
      if (this.loopMode !== 'TRACK') {
        this.previousTracks.push(this.currentTrack);
        
        // Keep only the last 10 previous tracks
        if (this.previousTracks.length > 10) {
          this.previousTracks.shift();
        }
      }
    }
    
    // If in TRACK loop mode, replay the current track
    if (this.loopMode === 'TRACK' && this.currentTrack) {
      this.emit('trackStart', this.currentTrack);
      return true;
    }
    
    // Get the next track
    const nextTrack = this.tracks.shift();
    
    // If no next track
    if (!nextTrack) {
      // If in QUEUE loop mode, add all previous tracks back to the queue
      if (this.loopMode === 'QUEUE' && this.previousTracks.length > 0) {
        this.tracks = [...this.previousTracks];
        this.previousTracks = [];
        return this.playNext();
      }
      
      // If autoplay is enabled, try to find a related track
      if (this.autoplay && this.currentTrack) {
        this.emit('autoplayRequest', this.currentTrack);
        // The actual autoplay logic will be handled by the player
        return true;
      }
      
      // Otherwise, end playback
      this.playing = false;
      this.currentTrack = null;
      this.emit('queueEnd');
      
      return false;
    }
    
    // Set the new current track
    this.currentTrack = nextTrack;
    this.currentTrack.playing = true;
    this.playing = true;
    
    // Emit trackStart event
    this.emit('trackStart', this.currentTrack);
    
    return true;
  }
  
  /**
   * Get the upcoming tracks
   * @param {number} limit - Maximum number of tracks to return
   * @returns {Track[]} Upcoming tracks
   */
  getUpcomingTracks(limit = 10) {
    return this.tracks.slice(0, limit);
  }
  
  /**
   * Get queue information
   * @returns {Object} Queue information
   */
  getInfo() {
    return {
      guildId: this.guildId,
      volume: this.volume,
      playing: this.playing,
      paused: this.paused,
      loopMode: this.loopMode,
      autoplay: this.autoplay,
      trackCount: this.tracks.length,
      currentTrack: this.currentTrack,
      textChannelId: this.textChannelId,
      voiceChannelId: this.voiceChannelId
    };
  }
}

module.exports = Queue;