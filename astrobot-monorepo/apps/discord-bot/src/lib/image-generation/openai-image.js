/**
 * OpenAI Image Generation API Integration
 * Handles image generation using DALL-E models
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');

// OpenAI API endpoint
const OPENAI_API_URL = 'https://api.openai.com/v1';

// Environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Path to store generated images temporarily
const TEMP_IMAGES_DIR = path.join(process.cwd(), 'data', 'temp-images');

/**
 * Ensure the temporary images directory exists
 * @returns {Promise<void>}
 */
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_IMAGES_DIR, { recursive: true });
  } catch (error) {
    logger.error('Error creating temp images directory:', error);
    throw error;
  }
}

/**
 * Generate an image using OpenAI's DALL-E model
 * @param {string} prompt - The text prompt for image generation
 * @param {Object} options - Generation options
 * @param {string} [options.model='dall-e-3'] - The model to use (dall-e-2 or dall-e-3)
 * @param {string} [options.size='1024x1024'] - Image size (1024x1024, 512x512, etc.)
 * @param {string} [options.quality='standard'] - Image quality (standard or hd)
 * @param {string} [options.style='vivid'] - Image style (vivid or natural)
 * @param {number} [options.n=1] - Number of images to generate (DALL-E 3 only supports 1)
 * @returns {Promise<Object>} The generated image data
 */
async function generateImage(prompt, options = {}) {
  try {
    // Check if API key is available
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set');
    }
    
    // Set default options
    const model = options.model || 'dall-e-3';
    const size = options.size || '1024x1024';
    const quality = options.quality || 'standard';
    const style = options.style || 'vivid';
    // DALL-E 3 only supports n=1
    const n = model === 'dall-e-3' ? 1 : (options.n || 1);
    
    // Create request payload
    const payload = {
      prompt,
      model,
      n,
      size,
      quality,
      style
    };
    
    // Make API request
    const response = await axios.post(`${OPENAI_API_URL}/images/generations`, payload, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data || !response.data.data || response.data.data.length === 0) {
      throw new Error('No image data received from OpenAI');
    }
    
    // Ensure temp directory exists
    await ensureTempDir();
    
    // Download the image(s) and store locally
    const results = await Promise.all(response.data.data.map(async (imgData, index) => {
      // Get image URL
      const imageUrl = imgData.url;
      
      if (!imageUrl) {
        logger.warn('No image URL found in response');
        return null;
      }
      
      // Generate a unique filename
      const filename = `dalle-${uuidv4()}.png`;
      const filepath = path.join(TEMP_IMAGES_DIR, filename);
      
      // Download the image
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      await fs.writeFile(filepath, Buffer.from(imageResponse.data));
      
      // Return image data
      return {
        filepath,
        filename,
        url: imageUrl,
        prompt: imgData.revised_prompt || prompt
      };
    }));
    
    // Filter out any failed downloads
    const validResults = results.filter(r => r !== null);
    
    if (validResults.length === 0) {
      throw new Error('Failed to download and save any images');
    }
    
    // Return results (either single object or array depending on n)
    return n === 1 ? validResults[0] : validResults;
  } catch (error) {
    logger.error('Error generating image with OpenAI:', error);
    
    // Check for specific OpenAI error messages
    if (error.response && error.response.data && error.response.data.error) {
      throw new Error(`OpenAI Error: ${error.response.data.error.message}`);
    }
    
    throw error;
  }
}

/**
 * Clean up temporary image files that are older than the specified time
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 1 hour)
 * @returns {Promise<number>} Number of files deleted
 */
async function cleanupTempImages(maxAgeMs = 60 * 60 * 1000) {
  try {
    // Ensure temp directory exists
    await ensureTempDir();
    
    // Get all files in the temp directory
    const files = await fs.readdir(TEMP_IMAGES_DIR);
    
    // Current time
    const now = Date.now();
    
    // Track deleted files
    let deletedCount = 0;
    
    // Check each file
    for (const file of files) {
      const filepath = path.join(TEMP_IMAGES_DIR, file);
      
      try {
        // Get file stats
        const stats = await fs.stat(filepath);
        
        // Check if file is too old
        if (now - stats.mtimeMs > maxAgeMs) {
          // Delete the file
          await fs.unlink(filepath);
          deletedCount++;
        }
      } catch (fileError) {
        logger.warn(`Error checking file ${filepath}:`, fileError);
      }
    }
    
    logger.debug(`Cleaned up ${deletedCount} temporary image files`);
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up temporary images:', error);
    return 0;
  }
}

module.exports = {
  generateImage,
  cleanupTempImages
};