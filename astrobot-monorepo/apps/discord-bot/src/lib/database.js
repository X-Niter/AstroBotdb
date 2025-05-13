// Database connection and management
const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Connect to the MongoDB database
 * @returns {Promise<mongoose.Connection>} The database connection
 */
async function connectDatabase() {
  try {
    // Get database URL from environment variable
    const dbUrl = process.env.MONGODB_URI;
    
    if (!dbUrl) {
      throw new Error('MONGODB_URI environment variable is not set');
    }
    
    logger.info('Connecting to database...');
    
    // Configure mongoose
    mongoose.set('strictQuery', false);
    
    // Connect to the database
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info('Successfully connected to database');
    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    throw error;
  }
}

/**
 * Disconnect from the MongoDB database
 * @returns {Promise<void>}
 */
async function disconnectDatabase() {
  try {
    logger.info('Disconnecting from database...');
    await mongoose.disconnect();
    logger.info('Successfully disconnected from database');
  } catch (error) {
    logger.error('Failed to disconnect from database:', error);
    throw error;
  }
}

/**
 * Check if the database connection is established
 * @returns {boolean} True if connected, false otherwise
 */
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

// Export database-related functions
module.exports = {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  connection: mongoose.connection
};