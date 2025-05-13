/**
 * Audio Filter Manager
 * Manages audio filters for music playback
 */

const { createAudioResource } = require('@discordjs/voice');
const prism = require('prism-media');
const fs = require('fs').promises;
const path = require('path');
const logger = require('../../logger');

// Path to filters configuration file
const FILTERS_CONFIG_FILE = path.join(process.cwd(), 'data', 'audio-filters.json');

// Default filters
const DEFAULT_FILTERS = {
  bassboost: {
    name: 'Bass Boost',
    description: 'Enhance bass frequencies',
    ffmpegArgs: ['-af', 'bass=g=10:f=110:w=0.8']
  },
  nightcore: {
    name: 'Nightcore',
    description: 'Speed up and pitch shift',
    ffmpegArgs: ['-af', 'asetrate=48000*1.25,aresample=48000,atempo=0.8']
  },
  vaporwave: {
    name: 'Vaporwave',
    description: 'Slow down and pitch shift',
    ffmpegArgs: ['-af', 'asetrate=48000*0.8,aresample=48000,atempo=1.1']
  },
  treble: {
    name: 'Treble Boost',
    description: 'Enhance high frequencies',
    ffmpegArgs: ['-af', 'treble=g=5:f=3000:w=0.3']
  },
  normalizer: {
    name: 'Normalizer',
    description: 'Balance audio levels',
    ffmpegArgs: ['-af', 'dynaudnorm=f=200:g=5:r=0.9']
  },
  surrounding: {
    name: 'Surrounding',
    description: 'Create a surround sound effect',
    ffmpegArgs: ['-af', 'stereotools=mlev=0.15:mode=ms>lr']
  },
  pulsator: {
    name: 'Pulsator',
    description: 'Add a pulsating effect',
    ffmpegArgs: ['-af', 'apulsator=hz=0.08:mode=sine']
  },
  mono: {
    name: 'Mono',
    description: 'Convert to mono audio',
    ffmpegArgs: ['-af', 'pan=1c|c0=0.5*c0+0.5*c1']
  },
  compression: {
    name: 'Compression',
    description: 'Dynamic range compression',
    ffmpegArgs: ['-af', 'acompressor=threshold=-8dB:ratio=4:attack=200:release=1000']
  },
  distortion: {
    name: 'Distortion',
    description: 'Add distortion effect',
    ffmpegArgs: ['-af', 'acrusher=.1:1:64:0:log']
  }
};

// Available filters
let availableFilters = { ...DEFAULT_FILTERS };

// Custom filter presets (userId -> presets)
const customPresets = new Map();

/**
 * Initialize the filter manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing audio filter manager...');
    
    // Load filters configuration
    await loadFiltersConfig();
    
    logger.info('Audio filter manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing audio filter manager:', error);
    return false;
  }
}

/**
 * Load filters configuration from disk
 * @returns {Promise<void>}
 */
async function loadFiltersConfig() {
  try {
    // Check if file exists
    try {
      await fs.access(FILTERS_CONFIG_FILE);
    } catch (error) {
      // File doesn't exist, create default
      await saveFiltersConfig();
      return;
    }
    
    // Read file
    const data = await fs.readFile(FILTERS_CONFIG_FILE, 'utf8');
    const config = JSON.parse(data);
    
    // Load filters
    if (config.filters) {
      availableFilters = {
        ...DEFAULT_FILTERS,
        ...config.filters
      };
    }
    
    // Load custom presets
    if (config.customPresets) {
      customPresets.clear();
      
      for (const [userId, presets] of Object.entries(config.customPresets)) {
        customPresets.set(userId, presets);
      }
    }
    
    logger.debug('Filters configuration loaded');
  } catch (error) {
    logger.error('Error loading filters configuration:', error);
    
    // Reset to defaults
    availableFilters = { ...DEFAULT_FILTERS };
    customPresets.clear();
    
    throw error;
  }
}

/**
 * Save filters configuration to disk
 * @returns {Promise<void>}
 */
async function saveFiltersConfig() {
  try {
    // Create configuration object
    const config = {
      filters: availableFilters,
      customPresets: {}
    };
    
    // Convert custom presets
    for (const [userId, presets] of customPresets.entries()) {
      config.customPresets[userId] = presets;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(FILTERS_CONFIG_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(FILTERS_CONFIG_FILE, JSON.stringify(config, null, 2));
    
    logger.debug('Filters configuration saved');
  } catch (error) {
    logger.error('Error saving filters configuration:', error);
    throw error;
  }
}

/**
 * Apply a filter to an audio stream
 * @param {ReadableStream} inputStream - The input audio stream
 * @param {string|null} filterName - The filter name or null to use no filter
 * @returns {ReadableStream} The filtered audio stream
 */
async function applyFilter(inputStream, filterName) {
  try {
    // If no filter, return input stream
    if (!filterName) {
      return inputStream;
    }
    
    // Get filter
    const filter = availableFilters[filterName];
    
    if (!filter) {
      logger.warn(`Filter "${filterName}" not found`);
      return inputStream;
    }
    
    // Apply filter using FFmpeg
    const transcoder = new prism.FFmpeg({
      args: [
        '-i', '-',
        ...filter.ffmpegArgs,
        '-f', 's16le',
        '-ar', '48000',
        '-ac', '2',
        '-'
      ]
    });
    
    // Pipe input stream to transcoder
    inputStream.pipe(transcoder);
    
    return transcoder;
  } catch (error) {
    logger.error(`Error applying filter "${filterName}":`, error);
    
    // Return input stream as fallback
    return inputStream;
  }
}

/**
 * Check if a filter is valid
 * @param {string} filterName - The filter name
 * @returns {boolean} Whether the filter is valid
 */
function isValidFilter(filterName) {
  return !!availableFilters[filterName];
}

/**
 * Get all available filters
 * @returns {Object} The available filters
 */
function getAvailableFilters() {
  return { ...availableFilters };
}

/**
 * Create a custom filter preset
 * @param {string} userId - The user ID
 * @param {string} presetName - The preset name
 * @param {Object} presetData - The preset data
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function createCustomPreset(userId, presetName, presetData) {
  try {
    // Validate
    if (!presetName || !presetData || !presetData.ffmpegArgs || !Array.isArray(presetData.ffmpegArgs)) {
      return false;
    }
    
    // Get user presets
    const userPresets = customPresets.get(userId) || {};
    
    // Create preset
    userPresets[presetName] = {
      name: presetData.name || presetName,
      description: presetData.description || '',
      ffmpegArgs: presetData.ffmpegArgs
    };
    
    // Save to storage
    customPresets.set(userId, userPresets);
    
    // Add to available filters (prefixed with user ID)
    const filterKey = `custom_${userId}_${presetName}`;
    availableFilters[filterKey] = userPresets[presetName];
    
    // Save configuration
    await saveFiltersConfig();
    
    return true;
  } catch (error) {
    logger.error(`Error creating custom preset for user ${userId}:`, error);
    return false;
  }
}

/**
 * Get user custom presets
 * @param {string} userId - The user ID
 * @returns {Object} The user presets
 */
function getUserPresets(userId) {
  return customPresets.get(userId) || {};
}

/**
 * Delete a custom preset
 * @param {string} userId - The user ID
 * @param {string} presetName - The preset name
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function deleteCustomPreset(userId, presetName) {
  try {
    // Get user presets
    const userPresets = customPresets.get(userId);
    
    if (!userPresets || !userPresets[presetName]) {
      return false;
    }
    
    // Delete preset
    delete userPresets[presetName];
    
    // Update storage
    if (Object.keys(userPresets).length === 0) {
      customPresets.delete(userId);
    } else {
      customPresets.set(userId, userPresets);
    }
    
    // Remove from available filters
    const filterKey = `custom_${userId}_${presetName}`;
    delete availableFilters[filterKey];
    
    // Save configuration
    await saveFiltersConfig();
    
    return true;
  } catch (error) {
    logger.error(`Error deleting custom preset for user ${userId}:`, error);
    return false;
  }
}

module.exports = {
  initialize,
  applyFilter,
  isValidFilter,
  getAvailableFilters,
  createCustomPreset,
  getUserPresets,
  deleteCustomPreset
};