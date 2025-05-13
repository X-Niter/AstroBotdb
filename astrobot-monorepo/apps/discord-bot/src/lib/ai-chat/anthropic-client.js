/**
 * Anthropic Claude Client
 * Provides access to Anthropic Claude API for chat
 * 
 * Note: The newest Anthropic model is "claude-3-5-sonnet-20241022",
 * which was released October 22, 2024. This is more recent than claude-3-sonnet-20240229
 * and has improved capabilities.
 */

const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../logger');

// Anthropic API client
let anthropic = null;

// Available models
const AVAILABLE_MODELS = {
  CLAUDE_3_5_SONNET: 'claude-3-5-sonnet-20241022',  // Most recent, use this by default
  CLAUDE_3_OPUS: 'claude-3-opus-20240229',
  CLAUDE_3_SONNET: 'claude-3-sonnet-20240229',
  CLAUDE_3_HAIKU: 'claude-3-haiku-20240307',
  CLAUDE_2: 'claude-2.1'
};

// Default options
const DEFAULT_OPTIONS = {
  temperature: 0.7,
  max_tokens: 4000,
  top_p: 1,
  top_k: 5
};

/**
 * Initialize the Anthropic client
 * @returns {boolean} Whether initialization was successful
 */
function initialize() {
  try {
    // Check if API key is available
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!apiKey) {
      logger.warn('ANTHROPIC_API_KEY not found in environment variables');
      return false;
    }
    
    // Create Anthropic client
    anthropic = new Anthropic({
      apiKey
    });
    
    logger.info('Anthropic client initialized');
    return true;
  } catch (error) {
    logger.error('Error initializing Anthropic client:', error);
    return false;
  }
}

/**
 * Check if the Anthropic client is available
 * @returns {boolean} Whether the client is available
 */
function isAvailable() {
  return !!anthropic;
}

/**
 * Convert Discord.js messages to Anthropic format
 * @param {Array<Object>} messages - The messages to convert
 * @returns {Array<Object>} The converted messages
 */
function convertMessages(messages) {
  return messages.map(message => {
    let role = message.role === 'assistant' ? 'assistant' : 'user';
    
    if (message.role === 'system') {
      role = 'system';
    }
    
    return {
      role,
      content: message.content
    };
  });
}

/**
 * Send a chat message to Anthropic Claude
 * @param {Array<Object>} messages - The messages to send
 * @param {Object} options - The chat options
 * @returns {Promise<Object>} The chat completion
 */
async function chat(messages, options = {}) {
  try {
    if (!isAvailable()) {
      throw new Error('Anthropic client not initialized');
    }
    
    // Set default model
    const model = options.model || AVAILABLE_MODELS.CLAUDE_3_5_SONNET;
    
    // Convert messages to Anthropic format
    const convertedMessages = convertMessages(messages);
    
    // Set chat options
    const chatOptions = {
      ...DEFAULT_OPTIONS,
      ...options,
      messages: convertedMessages,
      model
    };
    
    // Remove duplicate fields
    delete chatOptions.model;
    
    // Send request
    const response = await anthropic.messages.create({
      model,
      messages: convertedMessages,
      ...chatOptions
    });
    
    // Return formatted response
    return {
      model: response.model,
      message: {
        role: 'assistant',
        content: response.content[0].text
      },
      usage: response.usage,
      id: response.id,
      created: Date.now() / 1000 // Match OpenAI format
    };
  } catch (error) {
    logger.error('Error sending chat message to Anthropic:', error);
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