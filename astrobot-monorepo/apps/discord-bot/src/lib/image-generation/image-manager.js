/**
 * Image Generation Manager
 * 
 * Provides centralized access to different image generation and analysis services:
 * - OpenAI DALL-E for image generation
 * - Anthropic Claude for image analysis
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');
const openaiImage = require('./openai-image');
const anthropicImage = require('./anthropic-image');

// Image services status cache (to avoid repeated checks)
let servicesStatus = {
  openai: null,
  anthropic: null,
  lastChecked: null
};

// How often to refresh the services status cache (in ms)
const STATUS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Initialize the image manager
 */
async function initialize() {
  try {
    // Create necessary directories
    await openaiImage.ensureTempDir();
    
    // Clean up old temporary images
    await openaiImage.cleanupTempImages();
    
    // Check service availability
    await refreshServicesStatus();
    
    logger.info('Image manager initialized');
  } catch (error) {
    logger.error('Error initializing image manager:', error);
  }
}

/**
 * Check if OpenAI image generation is available
 * @returns {Promise<boolean>} Whether OpenAI is available
 */
async function isOpenAIAvailable() {
  // Check cache first
  if (servicesStatus.openai !== null && 
      servicesStatus.lastChecked && 
      Date.now() - servicesStatus.lastChecked < STATUS_CACHE_TTL) {
    return servicesStatus.openai;
  }
  
  // Refresh status
  await refreshServicesStatus();
  return servicesStatus.openai;
}

/**
 * Check if Anthropic image analysis is available
 * @returns {Promise<boolean>} Whether Anthropic is available
 */
async function isAnthropicAvailable() {
  // Check cache first
  if (servicesStatus.anthropic !== null && 
      servicesStatus.lastChecked && 
      Date.now() - servicesStatus.lastChecked < STATUS_CACHE_TTL) {
    return servicesStatus.anthropic;
  }
  
  // Refresh status
  await refreshServicesStatus();
  return servicesStatus.anthropic;
}

/**
 * Refresh the services status cache
 * @returns {Promise<void>}
 */
async function refreshServicesStatus() {
  try {
    // Check OpenAI
    const openaiAvailable = !!process.env.OPENAI_API_KEY;
    
    // Check Anthropic
    const anthropicAvailable = await anthropicImage.checkApiAvailability();
    
    // Update cache
    servicesStatus = {
      openai: openaiAvailable,
      anthropic: anthropicAvailable,
      lastChecked: Date.now()
    };
    
    logger.debug(`Image services status: OpenAI: ${openaiAvailable}, Anthropic: ${anthropicAvailable}`);
  } catch (error) {
    logger.error('Error checking image services status:', error);
  }
}

/**
 * Generate an image using OpenAI's DALL-E
 * @param {string} prompt - The text prompt for image generation
 * @param {Object} options - Generation options (see openai-image.js)
 * @returns {Promise<Object>} The generated image data
 */
async function generateImage(prompt, options = {}) {
  try {
    // Check if OpenAI is available
    if (!await isOpenAIAvailable()) {
      throw new Error('OpenAI image generation is not available');
    }
    
    // Generate image
    return await openaiImage.generateImage(prompt, options);
  } catch (error) {
    logger.error('Error generating image:', error);
    throw error;
  }
}

/**
 * Analyze an image using Anthropic Claude
 * @param {string} imagePath - Path to the local image file
 * @param {string} prompt - Question or instruction about the image
 * @param {Object} options - Options for the API call
 * @returns {Promise<Object>} The analysis result
 */
async function analyzeImage(imagePath, prompt, options = {}) {
  try {
    // Check if Anthropic is available
    if (!await isAnthropicAvailable()) {
      throw new Error('Anthropic image analysis is not available');
    }
    
    // Analyze image
    return await anthropicImage.analyzeImage(imagePath, prompt, options);
  } catch (error) {
    logger.error('Error analyzing image:', error);
    throw error;
  }
}

/**
 * Clean up temporary image files
 * @param {number} maxAgeMs - Maximum age in milliseconds
 * @returns {Promise<number>} Number of files deleted
 */
async function cleanupTempImages(maxAgeMs = 60 * 60 * 1000) {
  return await openaiImage.cleanupTempImages(maxAgeMs);
}

/**
 * Shutdown the image manager
 */
function shutdown() {
  // Clean up resources
  
  logger.info('Image manager shut down');
}

module.exports = {
  initialize,
  shutdown,
  generateImage,
  analyzeImage,
  cleanupTempImages,
  isOpenAIAvailable,
  isAnthropicAvailable
};