const { Anthropic } = require('@anthropic-ai/sdk');
const OpenAI = require('openai');
const logger = require('./logger');

// Initialize AI clients
let anthropic;
let openai;

try {
  // Initialize Anthropic
  if (process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  
  // Initialize OpenAI
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
} catch (error) {
  logger.error('Failed to initialize AI services:', error);
}

// Store conversation history for users
const conversationHistory = new Map();

// Max number of messages to keep in history
const MAX_HISTORY = 10;

// Message expiry time in milliseconds (24 hours)
const MESSAGE_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Generate a response using Anthropic's Claude
 * @param {string} userId - User's Discord ID
 * @param {string} message - User's message
 * @param {string} context - Additional context about the user or server
 * @returns {Promise<string>} The AI's response
 */
async function generateClaudeResponse(userId, message, context = '') {
  if (!anthropic) {
    throw new Error('Anthropic service is not initialized');
  }
  
  // Get or initialize user's conversation history
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, {
      messages: [],
      lastInteraction: Date.now()
    });
  }
  
  const userHistory = conversationHistory.get(userId);
  userHistory.lastInteraction = Date.now(); // Update last interaction time
  
  // Prepare conversation history
  const history = userHistory.messages;
  
  // Add user's message to history
  history.push({
    role: 'user',
    content: message
  });
  
  // Truncate history if needed
  if (history.length > MAX_HISTORY * 2) {
    userHistory.messages = history.slice(-MAX_HISTORY * 2);
  }
  
  try {
    // Create system prompt with context
    const systemPrompt = `You are AstroBot, a helpful and friendly Discord assistant. ${context ? `Context about the user and server: ${context}` : ''}
Keep your responses conversational and concise.
You can use Discord-style formatting like **bold** or *italic*.
Current date: ${new Date().toISOString().split('T')[0]}`;

    // Make API call to Anthropic
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022", // The newest Anthropic model which was released October 22, 2024
      max_tokens: 1000,
      system: systemPrompt,
      messages: history
    });
    
    // Get the AI's response
    const aiMessage = response.content[0].text;
    
    // Add AI's response to conversation history
    history.push({
      role: 'assistant',
      content: aiMessage
    });
    
    return aiMessage;
  } catch (error) {
    logger.error(`Error generating Claude response for ${userId}:`, error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

/**
 * Generate a response using OpenAI's GPT models
 * @param {string} userId - User's Discord ID
 * @param {string} message - User's message
 * @param {string} context - Additional context about the user or server
 * @returns {Promise<string>} The AI's response
 */
async function generateGPTResponse(userId, message, context = '') {
  if (!openai) {
    throw new Error('OpenAI service is not initialized');
  }
  
  // Get or initialize user's conversation history
  if (!conversationHistory.has(userId)) {
    conversationHistory.set(userId, {
      messages: [],
      lastInteraction: Date.now()
    });
  }
  
  const userHistory = conversationHistory.get(userId);
  userHistory.lastInteraction = Date.now(); // Update last interaction time
  
  // Prepare conversation history
  const history = userHistory.messages;
  
  // Add user's message to history
  history.push({
    role: 'user',
    content: message
  });
  
  // Truncate history if needed
  if (history.length > MAX_HISTORY * 2) {
    userHistory.messages = history.slice(-MAX_HISTORY * 2);
  }
  
  try {
    // Create system message with context
    const systemMessage = {
      role: 'system', 
      content: `You are AstroBot, a helpful and friendly Discord assistant. ${context ? `Context about the user and server: ${context}` : ''}
Keep your responses conversational and concise.
You can use Discord-style formatting like **bold** or *italic*.
Current date: ${new Date().toISOString().split('T')[0]}`
    };
    
    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // The newest OpenAI model which was released May 13, 2024
      messages: [systemMessage, ...history],
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    // Get the AI's response
    const aiMessage = response.choices[0].message.content;
    
    // Add AI's response to conversation history
    history.push({
      role: 'assistant',
      content: aiMessage
    });
    
    return aiMessage;
  } catch (error) {
    logger.error(`Error generating GPT response for ${userId}:`, error);
    throw new Error(`Failed to generate AI response: ${error.message}`);
  }
}

/**
 * Clear conversation history for a user
 * @param {string} userId - User's Discord ID
 */
function clearConversationHistory(userId) {
  conversationHistory.delete(userId);
}

/**
 * Clean up old conversations
 */
function cleanupConversations() {
  const now = Date.now();
  
  for (const [userId, userData] of conversationHistory.entries()) {
    // If last interaction was more than MESSAGE_EXPIRY ago, delete the conversation
    if (now - userData.lastInteraction > MESSAGE_EXPIRY) {
      conversationHistory.delete(userId);
    }
  }
}

// Run cleanup every hour
setInterval(cleanupConversations, 60 * 60 * 1000);

module.exports = {
  generateClaudeResponse,
  generateGPTResponse,
  clearConversationHistory,
  isOpenAIAvailable: !!openai,
  isAnthropicAvailable: !!anthropic
};