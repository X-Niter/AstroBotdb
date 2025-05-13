const tickets = require('../lib/tickets/ticket-manager');
const logger = require('../lib/logger');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction) {
    try {
      // Check if it's a button interaction related to tickets
      if (interaction.isButton() && interaction.customId.startsWith('ticket_')) {
        await tickets.handleTicketButton(interaction);
      }
    } catch (error) {
      logger.error('Error handling ticket interaction:', error);
    }
  }
};