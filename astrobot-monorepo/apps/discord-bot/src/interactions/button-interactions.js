/**
 * Button Interaction Handler
 * Handles button interactions from Discord
 */

const logger = require('../lib/logger');
const ticketManager = require('../lib/tickets/ticket-manager');
const reactionRoleManager = require('../lib/reaction-roles/reaction-role-manager');
const pollManager = require('../lib/polls/poll-manager');
const giveawayManager = require('../lib/giveaways/giveaway-manager');

/**
 * Handle a button interaction
 * @param {Client} client - The Discord client
 * @param {ButtonInteraction} interaction - The button interaction
 */
async function handleButtonInteraction(client, interaction) {
  try {
    const { customId } = interaction;
    
    // Check if this is a ticket button
    if (customId.startsWith('ticket_')) {
      // Handle ticket button interaction
      await ticketManager.handleButtonInteraction(interaction);
      return;
    }
    
    // Check if this is a reaction role button
    if (customId.startsWith('role_')) {
      // Handle reaction role button interaction
      await reactionRoleManager.handleButtonInteraction(interaction);
      return;
    }
    
    // Check if this is a poll vote button
    if (customId.startsWith('poll_vote_')) {
      // Handle poll vote interaction
      await pollManager.handleVote(interaction);
      return;
    }
    
    // Check if this is a giveaway entry button
    if (customId.startsWith('giveaway_enter_')) {
      // Handle giveaway entry interaction
      await giveawayManager.handleEntry(interaction);
      return;
    }
    
    // Handle other button interactions here
    
    // If no handler was found, reply with an error
    await interaction.reply({
      content: 'This button is no longer valid or the command has expired.',
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error handling button interaction:', error);
    
    // Try to respond to the interaction
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `An error occurred: ${error.message}`,
          ephemeral: true
        });
      } else if (interaction.deferred) {
        await interaction.editReply({
          content: `An error occurred: ${error.message}`
        });
      }
    } catch (replyError) {
      logger.error('Error replying to interaction:', replyError);
    }
  }
}

module.exports = {
  handleButtonInteraction
};