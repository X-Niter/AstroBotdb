/**
 * Bot Statistics API Routes
 * Endpoints for retrieving bot statistics
 */

const express = require('express');
const logger = require('../../logger');
const { isAuthenticated } = require('../middleware/auth-middleware');
const statsManager = require('../../statistics/stats-manager');

const router = express.Router();

/**
 * GET /api/statistics
 * Retrieve bot statistics
 */
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { guildId } = req.query;
    
    // Get global statistics
    const globalStats = statsManager.getGlobalStats();
    const topCommands = statsManager.getTopCommands({ limit: 10 });
    const uptime = statsManager.getUptime();
    
    const response = {
      global: {
        commands: globalStats.commands,
        messages: globalStats.messages,
        mostUsedCommands: Object.fromEntries(topCommands),
        uptime
      }
    };
    
    // Add guild-specific statistics if requested
    if (guildId) {
      const guildStats = statsManager.getGuildStats(guildId);
      const guildTopCommands = statsManager.getTopCommands({ guildId, limit: 10 });
      
      response.guild = {
        commands: guildStats.commands,
        messages: guildStats.messages,
        mostUsedCommands: Object.fromEntries(guildTopCommands),
        joinedAt: guildStats.joinedAt
      };
    }
    
    res.json(response);
  } catch (error) {
    logger.error('Error retrieving statistics:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

/**
 * POST /api/statistics/reset
 * Reset bot statistics (admin only)
 */
router.post('/reset', isAuthenticated, async (req, res) => {
  try {
    // Check if user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized: Admin privileges required' });
    }
    
    // Reset statistics
    await statsManager.resetStatistics();
    
    res.json({ success: true, message: 'Statistics reset successfully' });
  } catch (error) {
    logger.error('Error resetting statistics:', error);
    res.status(500).json({ error: 'Failed to reset statistics' });
  }
});

module.exports = router;