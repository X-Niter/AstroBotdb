/**
 * AI Persona Manager
 * Manages personas for AI chat models
 */

const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');

// Path to personas storage file
const PERSONAS_FILE = path.join(process.cwd(), 'data', 'ai-personas.json');

// In-memory storage
const personas = new Map();

// Default AstroBot persona
const DEFAULT_PERSONA = {
  id: 'default',
  name: 'AstroBot',
  description: 'AstroBot is a helpful, friendly AI assistant developed for Discord.',
  systemPrompt: 'You are AstroBot, a helpful and friendly AI assistant for Discord. You provide accurate, concise, and helpful responses to users. You should be respectful, avoid controversial topics, and refuse to generate harmful content. When you don\'t know something, admit it rather than making up information.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  isBuiltIn: true,
  defaultModel: 'claude-3-5-sonnet-20241022', // Use Claude 3.5 as default
  defaultOptions: {
    temperature: 0.7,
    max_tokens: 2000
  }
};

/**
 * Initialize the persona manager
 * @returns {Promise<void>}
 */
async function initialize() {
  try {
    // Load personas
    await loadPersonas();
    
    // If no personas, add default
    if (personas.size === 0) {
      personas.set(DEFAULT_PERSONA.id, DEFAULT_PERSONA);
      await savePersonas();
    }
    
    logger.info('Persona manager initialized');
  } catch (error) {
    logger.error('Error initializing persona manager:', error);
  }
}

/**
 * Get all personas
 * @returns {Array<Object>} Array of personas
 */
function getAllPersonas() {
  return Array.from(personas.values());
}

/**
 * Get a persona by ID
 * @param {string} id - The persona ID
 * @returns {Object|null} The persona or null if not found
 */
function getPersona(id) {
  return personas.get(id) || null;
}

/**
 * Create a new persona
 * @param {Object} personaData - The persona data
 * @returns {Promise<Object>} The created persona
 */
async function createPersona(personaData) {
  try {
    // Validate
    if (!personaData.name || !personaData.systemPrompt) {
      throw new Error('Name and system prompt are required');
    }
    
    // Create persona object
    const persona = {
      id: uuidv4(),
      name: personaData.name,
      description: personaData.description || '',
      systemPrompt: personaData.systemPrompt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isBuiltIn: false,
      defaultModel: personaData.defaultModel || DEFAULT_PERSONA.defaultModel,
      defaultOptions: {
        ...DEFAULT_PERSONA.defaultOptions,
        ...(personaData.defaultOptions || {})
      }
    };
    
    // Add to storage
    personas.set(persona.id, persona);
    
    // Save to disk
    await savePersonas();
    
    return persona;
  } catch (error) {
    logger.error('Error creating persona:', error);
    throw error;
  }
}

/**
 * Update a persona
 * @param {string} id - The persona ID
 * @param {Object} personaData - The updated persona data
 * @returns {Promise<Object>} The updated persona
 */
async function updatePersona(id, personaData) {
  try {
    // Get persona
    const persona = personas.get(id);
    
    if (!persona) {
      throw new Error(`Persona with ID ${id} not found`);
    }
    
    // Cannot update built-in personas
    if (persona.isBuiltIn) {
      throw new Error('Cannot update built-in personas');
    }
    
    // Update persona
    const updatedPersona = {
      ...persona,
      name: personaData.name || persona.name,
      description: personaData.description || persona.description,
      systemPrompt: personaData.systemPrompt || persona.systemPrompt,
      defaultModel: personaData.defaultModel || persona.defaultModel,
      defaultOptions: {
        ...persona.defaultOptions,
        ...(personaData.defaultOptions || {})
      },
      updatedAt: new Date().toISOString()
    };
    
    // Save to storage
    personas.set(id, updatedPersona);
    
    // Save to disk
    await savePersonas();
    
    return updatedPersona;
  } catch (error) {
    logger.error('Error updating persona:', error);
    throw error;
  }
}

/**
 * Delete a persona
 * @param {string} id - The persona ID
 * @returns {Promise<boolean>} Whether the persona was deleted
 */
async function deletePersona(id) {
  try {
    // Get persona
    const persona = personas.get(id);
    
    if (!persona) {
      throw new Error(`Persona with ID ${id} not found`);
    }
    
    // Cannot delete built-in personas
    if (persona.isBuiltIn) {
      throw new Error('Cannot delete built-in personas');
    }
    
    // Remove from storage
    personas.delete(id);
    
    // Save to disk
    await savePersonas();
    
    return true;
  } catch (error) {
    logger.error('Error deleting persona:', error);
    throw error;
  }
}

/**
 * Save personas to disk
 * @returns {Promise<void>}
 */
async function savePersonas() {
  try {
    // Create personas object
    const personasObj = {};
    
    for (const [id, persona] of personas.entries()) {
      personasObj[id] = persona;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(PERSONAS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(PERSONAS_FILE, JSON.stringify(personasObj, null, 2));
    
    logger.debug('Personas saved to disk');
  } catch (error) {
    logger.error('Error saving personas:', error);
    throw error;
  }
}

/**
 * Load personas from disk
 * @returns {Promise<void>}
 */
async function loadPersonas() {
  try {
    // Check if file exists
    try {
      await fs.access(PERSONAS_FILE);
    } catch (error) {
      // File doesn't exist, add default persona
      personas.set(DEFAULT_PERSONA.id, DEFAULT_PERSONA);
      await savePersonas();
      return;
    }
    
    // Read file
    const data = await fs.readFile(PERSONAS_FILE, 'utf8');
    
    // Parse JSON
    const personasObj = JSON.parse(data);
    
    // Clear current personas
    personas.clear();
    
    // Add personas
    for (const [id, persona] of Object.entries(personasObj)) {
      personas.set(id, persona);
    }
    
    // Ensure default persona exists
    if (!personas.has(DEFAULT_PERSONA.id)) {
      personas.set(DEFAULT_PERSONA.id, DEFAULT_PERSONA);
      await savePersonas();
    }
    
    logger.debug('Personas loaded from disk');
  } catch (error) {
    logger.error('Error loading personas:', error);
    throw error;
  }
}

module.exports = {
  initialize,
  getAllPersonas,
  getPersona,
  createPersona,
  updatePersona,
  deletePersona,
  DEFAULT_PERSONA
};