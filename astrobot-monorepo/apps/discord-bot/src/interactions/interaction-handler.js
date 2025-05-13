/**
 * Interaction Handler
 * Main handler for all Discord interactions
 */

const { InteractionType } = require('discord.js');
const { handleButtonInteraction } = require('./button-interactions');
const logger = require('../lib/logger');

/**
 * Handle an interaction
 * @param {Client} client - The Discord client
 * @param {BaseInteraction} interaction - The interaction to handle
 */
async function handleInteraction(client, interaction) {
  try {
    // Handle different types of interactions
    if (interaction.isChatInputCommand()) {
      // Command interactions are handled separately
      return;
    } else if (interaction.isButton()) {
      // Button interaction
      await handleButtonInteraction(client, interaction);
    } else if (interaction.isStringSelectMenu()) {
      // Select menu interaction
      // Add handler when needed
    } else if (interaction.isModalSubmit()) {
      // Modal submit interaction
      // Add handler when needed
    } else if (interaction.isAutocomplete()) {
      // Autocomplete interaction
      // These are handled separately
    } else if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      // Another way to check for autocomplete
      // These are handled separately
    } else {
      logger.warn(`Unknown interaction type: ${interaction.type}`);
    }
  } catch (error) {
    logger.error('Error handling interaction:', error);
    
    // Try to respond to the interaction
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: 'An error occurred while processing this interaction.',
          ephemeral: true
        });
      }
    } catch (replyError) {
      logger.error('Error replying to interaction:', replyError);
    }
  }
}

module.exports = {
  handleInteraction
};