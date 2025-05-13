/**
 * Represents a music track in the queue
 */
class Track {
  /**
   * Create a new Track
   * @param {Object} options - The track options
   * @param {string} options.url - The URL of the track
   * @param {string} options.title - The title of the track
   * @param {string} options.duration - The duration of the track
   * @param {string} options.thumbnail - The thumbnail URL of the track
   * @param {string} options.requestedBy - The ID of the user who requested the track
   * @param {Object} options.source - The source object with additional data
   */
  constructor({ url, title, duration, thumbnail, requestedBy, source }) {
    this.url = url;
    this.title = title;
    this.duration = duration;
    this.thumbnail = thumbnail;
    this.requestedBy = requestedBy;
    this.source = source; // Original source object (YouTube, Spotify, etc.)
    this.playing = false;
    this.addedAt = Date.now();
  }
  
  /**
   * Convert duration string (e.g. "3:45") to seconds
   * @param {string} duration - The duration string
   * @returns {number} The duration in seconds
   */
  static durationToSeconds(duration) {
    if (!duration) return 0;
    
    // If duration is already in seconds, return it
    if (typeof duration === 'number') return duration;
    
    // Try to parse "HH:MM:SS" or "MM:SS" format
    const parts = duration.split(':').map(Number);
    
    if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 1 && !isNaN(parts[0])) {
      // Just seconds
      return parts[0];
    }
    
    return 0; // Fallback
  }
  
  /**
   * Format seconds to "HH:MM:SS" or "MM:SS"
   * @param {number} seconds - The duration in seconds
   * @returns {string} Formatted duration
   */
  static formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '00:00';
    
    seconds = Math.floor(seconds);
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    // Format with leading zeros
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }
  
  /**
   * Get the formatted duration of the track
   * @returns {string} Formatted duration
   */
  getFormattedDuration() {
    if (typeof this.duration === 'string') {
      return this.duration; // Already formatted
    }
    
    return Track.formatDuration(this.duration);
  }
  
  /**
   * Checks if the track is a live stream
   * @returns {boolean} Whether the track is a live stream
   */
  isLiveStream() {
    // Check common indicators for live streams
    return (
      this.duration === 0 ||
      this.duration === '0:00' ||
      this.duration === 'LIVE' ||
      (this.source && this.source.live === true)
    );
  }
}

module.exports = Track;