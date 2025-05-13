/**
 * Dashboard API Server
 * Provides a REST API for the Next.js dashboard to interact with the Discord bot
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const logger = require('../logger');
const { handleGuildsRequest } = require('./handlers/guilds-handler');
const { handleChannelsRequest } = require('./handlers/channels-handler');
const { handleMembersRequest } = require('./handlers/members-handler');
const { handleRolesRequest } = require('./handlers/roles-handler');
const { handleCommandsRequest } = require('./handlers/commands-handler');
const { handleSettingsRequest } = require('./handlers/settings-handler');
const statisticsRoutes = require('./routes/statistics-routes');
const { verifyToken } = require('./auth');

// Server instance
let server = null;
const API_PORT = process.env.DASHBOARD_API_PORT || 5000;

/**
 * Initialize the API server
 * @param {Client} client - The Discord client
 * @returns {Promise<void>}
 */
async function initializeApiServer(client) {
  try {
    if (server) {
      // Server already running
      return;
    }
    
    // Create Express app
    const app = express();
    
    // Add middleware
    app.use(cors({ origin: true }));
    app.use(bodyParser.json());
    
    // Add authentication middleware
    app.use((req, res, next) => {
      // Skip auth for health check
      if (req.path === '/health') {
        return next();
      }
      
      // Verify token
      const token = req.headers.authorization?.split('Bearer ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }
      
      const isValid = verifyToken(token);
      
      if (!isValid) {
        return res.status(403).json({ error: 'Invalid or expired token' });
      }
      
      // Add client to request object for handlers to use
      req.discordClient = client;
      
      next();
    });
    
    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    
    // API routes
    app.get('/guilds', handleGuildsRequest);
    app.get('/guilds/:guildId', handleGuildsRequest);
    
    app.get('/guilds/:guildId/channels', handleChannelsRequest);
    app.get('/guilds/:guildId/channels/:channelId', handleChannelsRequest);
    
    app.get('/guilds/:guildId/members', handleMembersRequest);
    app.get('/guilds/:guildId/members/:memberId', handleMembersRequest);
    
    app.get('/guilds/:guildId/roles', handleRolesRequest);
    app.get('/guilds/:guildId/roles/:roleId', handleRolesRequest);
    
    app.get('/commands', handleCommandsRequest);
    app.get('/commands/:commandId', handleCommandsRequest);
    
    // Settings routes - used for all bot systems
    app.get('/settings/:guildId', handleSettingsRequest);
    app.post('/settings/:guildId', handleSettingsRequest);
    app.put('/settings/:guildId', handleSettingsRequest);
    
    // Register statistics routes
    app.use('/statistics', statisticsRoutes);
    
    // Start server
    server = app.listen(API_PORT, '0.0.0.0', () => {
      logger.info(`Dashboard API server running on port ${API_PORT}`);
    });
  } catch (error) {
    logger.error('Error initializing API server:', error);
  }
}

/**
 * Shutdown the API server
 * @returns {Promise<void>}
 */
async function shutdownApiServer() {
  try {
    if (server) {
      // Close server
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
      
      server = null;
      logger.info('Dashboard API server shut down');
    }
  } catch (error) {
    logger.error('Error shutting down API server:', error);
  }
}

module.exports = {
  initializeApiServer,
  shutdownApiServer
};