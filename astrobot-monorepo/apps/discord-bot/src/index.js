const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands, registerCommands } = require('./lib/command-loader');
const { loadEvents } = require('./lib/event-loader');
const autoMod = require('./lib/auto-moderation');
const logger = require('./lib/logger');
require('dotenv').config();

// Initialize Discord client with intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent, // Required for message content access
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel, // Required for DM support
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
  ],
});

// Initialize collections for interaction handlers
client.buttonHandlers = new Collection();
client.selectMenuHandlers = new Collection();
client.modalHandlers = new Collection();

/**
 * Initialize the bot
 */
async function init() {
  try {
    logger.info('Starting AstroBot Discord Bot...');
    
    // Load events
    loadEvents(client);
    
    // Load commands
    await loadCommands(client);
    
    // Login to Discord
    await client.login(process.env.DISCORD_TOKEN);
    
    // Register commands with Discord API
    // Use specific guild ID for testing or null for global registration
    const testGuildId = process.env.TEST_GUILD_ID || null;
    await registerCommands(client, client.user.id, testGuildId);
    
    // Initialize auto-moderation for all guilds
    logger.info('Initializing auto-moderation for all guilds...');
    client.guilds.cache.forEach(guild => {
      autoMod.initGuild(guild);
    });
    
    logger.info('Bot initialization complete');
  } catch (error) {
    logger.error('Error during bot initialization:', error);
    process.exit(1);
  }
}

// Handle process events
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
});

// Start the bot
init();

// Export client for testing
module.exports = client;