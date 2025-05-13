/**
 * AstroBot Discord Startup
 * This file contains functions to initialize different subsystems of the bot.
 */

const logger = require('./lib/logger');
const ticketManager = require('./lib/tickets/ticket-manager');
const twitchManager = require('./lib/twitch/twitch-manager');
const youtubeManager = require('./lib/youtube/youtube-manager');
const imageManager = require('./lib/image-generation/image-manager');
const dashboardApi = require('./lib/dashboard/api-server');
const chatManager = require('./lib/ai-chat/chat-manager');
const reactionRoleManager = require('./lib/reaction-roles/reaction-role-manager');
const musicManager = require('./lib/music/music-manager');
const automodManager = require('./lib/automod/automod-manager');
const pollManager = require('./lib/polls/poll-manager');
const reminderManager = require('./lib/reminders/reminder-manager');
const welcomeManager = require('./lib/welcome/welcome-manager');
const giveawayManager = require('./lib/giveaways/giveaway-manager');
const levelManager = require('./lib/levels/level-manager');
const commandManager = require('./lib/custom-commands/command-manager');
const backupManager = require('./lib/backup/backup-manager');
const guildConfigManager = require('./lib/config/guild-config-manager');
const scheduledEventManager = require('./lib/scheduler/scheduled-event-manager');
const githubManager = require('./lib/github/github-manager');
const twitterManager = require('./lib/twitter/twitter-manager');
const statsManager = require('./lib/statistics/stats-manager');
const eventHandler = require('./events');

/**
 * Initialize bot subsystems
 * @param {Client} client - Discord.js client instance
 */
async function initializeSubsystems(client) {
  try {
    logger.info('Initializing bot subsystems...');
    
    // Store client reference globally for managers that need it
    global.client = client;
    
    // Initialize guild config manager (needs to be early as other managers may depend on it)
    await guildConfigManager.initialize();
    logger.info('Guild config manager initialized');
    
    // Initialize statistics manager for tracking bot usage metrics
    await statsManager.initialize();
    logger.info('Statistics manager initialized');
    
    // Initialize scheduled event manager
    await scheduledEventManager.initialize();
    logger.info('Scheduled event manager initialized');
    
    // Initialize GitHub manager
    await githubManager.initialize();
    logger.info('GitHub manager initialized');
    
    // Initialize Twitter manager
    await twitterManager.initialize();
    logger.info('Twitter manager initialized');
    
    // Initialize ticket manager
    await ticketManager.initialize();
    logger.info('Ticket manager initialized');
    
    // Initialize Twitch manager
    await twitchManager.initialize();
    logger.info('Twitch manager initialized');
    
    // Initialize YouTube manager
    await youtubeManager.initialize();
    logger.info('YouTube manager initialized');
    
    // Initialize Image manager
    await imageManager.initialize();
    logger.info('Image manager initialized');
    
    // Initialize AI Chat manager
    await chatManager.initialize();
    logger.info('AI Chat manager initialized');
    
    // Initialize Reaction Role manager
    await reactionRoleManager.initialize();
    logger.info('Reaction Role manager initialized');
    
    // Initialize Music manager
    await musicManager.initialize();
    logger.info('Music manager initialized');
    
    // Initialize AutoMod manager
    await automodManager.initialize();
    logger.info('AutoMod manager initialized');
    
    // Initialize Poll manager
    await pollManager.initialize();
    logger.info('Poll manager initialized');
    
    // Initialize Reminder manager
    await reminderManager.initialize();
    logger.info('Reminder manager initialized');
    
    // Initialize Welcome manager
    await welcomeManager.initialize();
    logger.info('Welcome manager initialized');
    
    // Initialize Giveaway manager
    await giveawayManager.initialize();
    logger.info('Giveaway manager initialized');
    
    // Initialize Level manager
    await levelManager.initialize();
    logger.info('Level manager initialized');
    
    // Initialize Custom Command manager
    await commandManager.initialize();
    logger.info('Custom Command manager initialized');
    
    // Initialize Backup manager
    await backupManager.initialize();
    logger.info('Backup manager initialized');
    
    // Register event listeners
    eventHandler.registerAllEvents(client);
    logger.info('Event listeners registered');
    
    // Initialize Dashboard API server
    await dashboardApi.initializeApiServer(client);
    logger.info('Dashboard API server initialized');
    
    // Add more subsystem initializations here
    
    logger.info('All subsystems initialized successfully');
  } catch (error) {
    logger.error('Error initializing subsystems:', error);
  }
}

// Handle bot shutdown
function shutdownSubsystems() {
  try {
    logger.info('Shutting down bot subsystems...');
    
    // Shutdown GitHub manager
    githubManager.shutdown();
    
    // Shutdown Twitter manager
    twitterManager.shutdown();
    
    // Shutdown Twitch manager
    twitchManager.shutdown();
    
    // Shutdown YouTube manager
    youtubeManager.shutdown();
    
    // Shutdown Image manager
    imageManager.shutdown();
    
    // Shutdown Music manager
    musicManager.shutdown();
    
    // Shutdown Dashboard API server
    dashboardApi.shutdownApiServer();
    
    // Save chat history one last time
    chatManager.saveChatHistory && chatManager.saveChatHistory()
      .catch(err => logger.error('Error saving chat history during shutdown:', err));
    
    logger.info('All subsystems shut down successfully');
  } catch (error) {
    logger.error('Error shutting down subsystems:', error);
  }
}

module.exports = {
  initializeSubsystems,
  shutdownSubsystems
};