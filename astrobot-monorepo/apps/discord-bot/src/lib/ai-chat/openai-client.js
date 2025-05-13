/**
 * OpenAI Client
 * Provides access to OpenAI APIs for chat and image generation
 * 
 * Note: The newest OpenAI model is "gpt-4o" which was released May 13, 2024,
 * after standard knowledge cutoffs. Always use this instead of gpt-4 when possible.
 */

const OpenAI = require('openai');
const logger = require('../logger');

// OpenAI API client
let openai = null;

// Available models
const AVAILABLE_MODELS = {
  GPT4O: 'gpt-4o',
  GPT4_TURBO: 'gpt-4-turbo',
  GPT4: 'gpt-4',
  GPT35_TURBO: 'gpt-3.5-turbo',
  DALLE3: 'dall-e-3',
  DALLE2: 'dall-e-2'
};

// Default options
const DEFAULT_OPTIONS = {
  temperature: 0.7,
  max_tokens: 2000,
  top_p: 1,
  frequency_penalty: 0,
  presence_penalty: 0
};

/**
 * Initialize the OpenAI client
 * @returns {boolean} Whether initialization was successful
 */
function initialize() {
  try {
    // Check if API key is available
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      logger.warn('OPENAI_API_KEY not found in environment variables');
      return false;
    }
    
    // Create OpenAI client
    openai = new OpenAI({
      apiKey
    });
    
    logger.info('OpenAI client initialized');
    return true;
  } catch (error) {
    logger.error('Error initializing OpenAI client:', error);
    return false;
  }
}

/**
 * Check if the OpenAI client is available
 * @returns {boolean} Whether the client is available
 */
function isAvailable() {
  return !!openai;
}

/**
 * Send a chat message to OpenAI
 * @param {Array<Object>} messages - The messages to send
 * @param {Object} options - The chat options
 * @returns {Promise<Object>} The chat completion
 */
async function chat(messages, options = {}) {
  try {
    if (!isAvailable()) {
      throw new Error('OpenAI client not initialized');
    }
    
    // Set default model
    const model = options.model || AVAILABLE_MODELS.GPT4O;
    
    // Set chat options
    const chatOptions = {
      model,
      messages,
      ...DEFAULT_OPTIONS,
      ...options
    };
    
    // Remove model from options to avoid duplication
    delete chatOptions.model;
    
    // Send request
    const completion = await openai.chat.completions.create({
      model,
      messages,
      ...chatOptions
    });
    
    // Return formatted response
    return {
      model: completion.model,
      message: completion.choices[0].message,
      usage: completion.usage,
      created: completion.created,
      id: completion.id
    };
  } catch (error) {
    logger.error('Error sending chat message to OpenAI:', error);
    throw error;
  }
}

/**
 * Get a list of available models
 * @returns {Object} The available models
 */
function getAvailableModels() {
  return { ...AVAILABLE_MODELS };
}

module.exports = {
  initialize,
  isAvailable,
  chat,
  getAvailableModels,
  AVAILABLE_MODELS
};