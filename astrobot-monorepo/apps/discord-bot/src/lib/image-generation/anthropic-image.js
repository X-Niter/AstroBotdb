/**
 * Anthropic Claude Vision API Integration
 * Handles image analysis and descriptions
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const FormData = require('form-data');
const logger = require('../logger');

// Anthropic API endpoint
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1';

// Environment variables
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// The newest model is claude-3-5-sonnet-20241022, not claude-3-sonnet-20240229
// claude-3-5-sonnet-20241022 was released October 22, 2024
const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Analyze an image using Anthropic Claude's vision capabilities
 * @param {string} imagePath - Path to the local image file
 * @param {string} prompt - Question or instruction about the image
 * @param {Object} options - Options for the API call
 * @param {string} [options.model=DEFAULT_MODEL] - Claude model to use
 * @param {number} [options.maxTokens=1000] - Maximum tokens in the response
 * @returns {Promise<Object>} The analysis result
 */
async function analyzeImage(imagePath, prompt, options = {}) {
  try {
    // Check if API key is available
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    
    // Set default options
    const model = options.model || DEFAULT_MODEL;
    const maxTokens = options.maxTokens || 1000;
    
    // Read the image file
    const imageData = await fs.readFile(imagePath);
    
    // Convert image to base64
    const base64Image = imageData.toString('base64');
    
    // Create request payload
    const payload = {
      model,
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: getMediaType(imagePath),
                data: base64Image
              }
            }
          ]
        }
      ]
    };
    
    // Make API request
    const response = await axios.post(`${ANTHROPIC_API_URL}/messages`, payload, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      }
    });
    
    // Process and return the results
    if (!response.data || !response.data.content) {
      throw new Error('Invalid response from Anthropic API');
    }
    
    return {
      text: response.data.content
        .filter(item => item.type === 'text')
        .map(item => item.text)
        .join('\n'),
      model: response.data.model,
      id: response.data.id,
      usage: response.data.usage
    };
  } catch (error) {
    logger.error('Error analyzing image with Anthropic:', error);
    
    if (error.response && error.response.data) {
      throw new Error(`Anthropic API Error: ${error.response.data.error?.message || JSON.stringify(error.response.data)}`);
    }
    
    throw error;
  }
}

/**
 * Get the media type (MIME type) based on file extension
 * @param {string} filePath - Path to the file
 * @returns {string} The MIME type
 */
function getMediaType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.gif':
      return 'image/gif';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

/**
 * Check if the Anthropic API is available and the key is valid
 * @returns {Promise<boolean>} Whether the API is available
 */
async function checkApiAvailability() {
  try {
    // Check if API key is available
    if (!ANTHROPIC_API_KEY) {
      return false;
    }
    
    // Make a simple API request
    const response = await axios.get(`${ANTHROPIC_API_URL}/models`, {
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      }
    });
    
    // Check if we got a valid response
    return response.status === 200 && Array.isArray(response.data.models);
  } catch (error) {
    logger.error('Error checking Anthropic API availability:', error);
    return false;
  }
}

module.exports = {
  analyzeImage,
  checkApiAvailability
};