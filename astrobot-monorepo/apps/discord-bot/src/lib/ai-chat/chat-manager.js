/**
 * AI Chat Manager
 * Manages chat sessions and routes messages to the appropriate AI model
 */

const fs = require('fs').promises;
const path = require('path');
const { Collection } = require('discord.js');
const openaiClient = require('./openai-client');
const anthropicClient = require('./anthropic-client');
const personaManager = require('./persona-manager');
const logger = require('../logger');

// Path to chat history storage file
const CHAT_HISTORY_FILE = path.join(process.cwd(), 'data', 'ai-chat-history.json');

// Maximum history length per user (conversation turns)
const MAX_HISTORY_LENGTH = 20;

// Chat sessions (user ID -> messages)
const chatSessions = new Collection();

// User preferences (user ID -> preferences)
const userPreferences = new Collection();

/**
 * Initialize the chat manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    // Initialize clients
    const openaiInitialized = openaiClient.initialize();
    const anthropicInitialized = anthropicClient.initialize();
    
    // At least one client must be available
    if (!openaiInitialized && !anthropicInitialized) {
      logger.warn('No AI chat clients initialized. Chat functionality will be limited.');
    }
    
    // Initialize persona manager
    await personaManager.initialize();
    
    // Load chat history
    await loadChatHistory();
    
    logger.info('Chat manager initialized');
    return true;
  } catch (error) {
    logger.error('Error initializing chat manager:', error);
    return false;
  }
}

/**
 * Send a chat message to the AI
 * @param {string} userId - The user ID
 * @param {string} message - The message content
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} The AI response
 */
async function sendMessage(userId, message, options = {}) {
  try {
    // Get user preferences
    const preferences = getUserPreferences(userId);
    
    // Get chat history
    let session = getChatSession(userId);
    
    // Get persona
    const personaId = options.personaId || preferences.personaId || personaManager.DEFAULT_PERSONA.id;
    const persona = personaManager.getPersona(personaId);
    
    if (!persona) {
      throw new Error(`Persona with ID ${personaId} not found`);
    }
    
    // Determine which model to use
    const useModel = options.model || preferences.model || persona.defaultModel;
    const modelProvider = determineProviderForModel(useModel);
    
    if (!modelProvider) {
      throw new Error(`No provider available for model ${useModel}`);
    }
    
    // Add system message if not present
    if (!session.some(m => m.role === 'system')) {
      session.unshift({
        role: 'system',
        content: persona.systemPrompt
      });
    }
    
    // Add user message
    session.push({
      role: 'user',
      content: message
    });
    
    // Create API options
    const apiOptions = {
      model: useModel,
      temperature: options.temperature || preferences.temperature || persona.defaultOptions.temperature,
      max_tokens: options.max_tokens || preferences.max_tokens || persona.defaultOptions.max_tokens
    };
    
    // Send to appropriate provider
    let response;
    
    if (modelProvider === 'openai') {
      if (!openaiClient.isAvailable()) {
        throw new Error('OpenAI client is not available');
      }
      response = await openaiClient.chat(session, apiOptions);
    } else if (modelProvider === 'anthropic') {
      if (!anthropicClient.isAvailable()) {
        throw new Error('Anthropic client is not available');
      }
      response = await anthropicClient.chat(session, apiOptions);
    } else {
      throw new Error(`Unknown provider: ${modelProvider}`);
    }
    
    // Add assistant response to history
    session.push(response.message);
    
    // Trim history if too long
    if (session.length > MAX_HISTORY_LENGTH + 1) { // +1 for system message
      // Remove oldest messages, but keep system message
      const systemMessage = session.shift(); // Remove system message temporarily
      session = session.slice(-MAX_HISTORY_LENGTH); // Keep last N messages
      session.unshift(systemMessage); // Add system message back
    }
    
    // Update chat session
    setChatSession(userId, session);
    
    // Periodically save chat history
    if (Math.random() < 0.1) { // 10% chance to save
      saveChatHistory().catch(err => logger.error('Error saving chat history:', err));
    }
    
    // Return response with additional info
    return {
      ...response,
      persona: {
        id: persona.id,
        name: persona.name
      }
    };
  } catch (error) {
    logger.error(`Error sending message for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Clear chat history for a user
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} Whether the operation was successful
 */
async function clearChat(userId) {
  try {
    // Remove chat session
    chatSessions.delete(userId);
    
    // Save chat history
    await saveChatHistory();
    
    return true;
  } catch (error) {
    logger.error(`Error clearing chat for user ${userId}:`, error);
    return false;
  }
}

/**
 * Set user preferences
 * @param {string} userId - The user ID
 * @param {Object} preferences - The preferences to set
 * @returns {Promise<Object>} The updated preferences
 */
async function setUserPreferences(userId, preferences) {
  try {
    // Get current preferences
    const currentPreferences = getUserPreferences(userId);
    
    // Merge preferences
    const updatedPreferences = {
      ...currentPreferences,
      ...preferences
    };
    
    // Store preferences
    userPreferences.set(userId, updatedPreferences);
    
    // Save chat history (which includes preferences)
    await saveChatHistory();
    
    return updatedPreferences;
  } catch (error) {
    logger.error(`Error setting preferences for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user preferences
 * @param {string} userId - The user ID
 * @returns {Object} The user preferences
 */
function getUserPreferences(userId) {
  return userPreferences.get(userId) || {};
}

/**
 * Get chat session for a user
 * @param {string} userId - The user ID
 * @returns {Array<Object>} The chat session messages
 */
function getChatSession(userId) {
  return chatSessions.get(userId) || [];
}

/**
 * Set chat session for a user
 * @param {string} userId - The user ID
 * @param {Array<Object>} session - The chat session messages
 */
function setChatSession(userId, session) {
  chatSessions.set(userId, session);
}

/**
 * Determine which provider to use for a specific model
 * @param {string} model - The model name
 * @returns {string|null} The provider name ('openai', 'anthropic') or null if unknown
 */
function determineProviderForModel(model) {
  // Check OpenAI models
  const openaiModels = openaiClient.getAvailableModels();
  for (const key in openaiModels) {
    if (openaiModels[key] === model) {
      return 'openai';
    }
  }
  
  // Check Anthropic models
  const anthropicModels = anthropicClient.getAvailableModels();
  for (const key in anthropicModels) {
    if (anthropicModels[key] === model) {
      return 'anthropic';
    }
  }
  
  // Check fallbacks for models not listed by name
  if (model.startsWith('gpt-') || model.startsWith('dall-e-')) {
    return 'openai';
  }
  
  if (model.startsWith('claude-')) {
    return 'anthropic';
  }
  
  return null;
}

/**
 * Get all available models across providers
 * @returns {Object} Object with model providers and their models
 */
function getAvailableModels() {
  const models = {
    openai: openaiClient.isAvailable() ? openaiClient.getAvailableModels() : null,
    anthropic: anthropicClient.isAvailable() ? anthropicClient.getAvailableModels() : null
  };
  
  return models;
}

/**
 * Save chat history to disk
 * @returns {Promise<void>}
 */
async function saveChatHistory() {
  try {
    // Create history object
    const history = {
      sessions: {},
      preferences: {}
    };
    
    // Convert chat sessions
    for (const [userId, session] of chatSessions.entries()) {
      history.sessions[userId] = session;
    }
    
    // Convert user preferences
    for (const [userId, prefs] of userPreferences.entries()) {
      history.preferences[userId] = prefs;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(CHAT_HISTORY_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(history, null, 2));
    
    logger.debug('Chat history saved to disk');
  } catch (error) {
    logger.error('Error saving chat history:', error);
    throw error;
  }
}

/**
 * Load chat history from disk
 * @returns {Promise<void>}
 */
async function loadChatHistory() {
  try {
    // Check if file exists
    try {
      await fs.access(CHAT_HISTORY_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveChatHistory();
      return;
    }
    
    // Read file
    const data = await fs.readFile(CHAT_HISTORY_FILE, 'utf8');
    
    // Parse JSON
    const history = JSON.parse(data);
    
    // Clear current collections
    chatSessions.clear();
    userPreferences.clear();
    
    // Load chat sessions
    if (history.sessions) {
      for (const [userId, session] of Object.entries(history.sessions)) {
        chatSessions.set(userId, session);
      }
    }
    
    // Load user preferences
    if (history.preferences) {
      for (const [userId, prefs] of Object.entries(history.preferences)) {
        userPreferences.set(userId, prefs);
      }
    }
    
    logger.debug('Chat history loaded from disk');
  } catch (error) {
    logger.error('Error loading chat history:', error);
    throw error;
  }
}

module.exports = {
  initialize,
  sendMessage,
  clearChat,
  setUserPreferences,
  getUserPreferences,
  getAvailableModels,
  getChatSession,
  MAX_HISTORY_LENGTH
};