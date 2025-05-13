const { InteractionType, ComponentType } = require('discord.js');
const logger = require('../lib/logger');
const pollManager = require('../lib/polls');

module.exports = {
  name: 'interactionCreate',
  once: false,
  /**
   * Handle the interactionCreate event
   * @param {Interaction} interaction - The interaction that was created
   */
  async execute(interaction) {
    try {
      // Handle slash commands
      if (interaction.type === InteractionType.ApplicationCommand) {
        const { client } = interaction;
        const command = client.commands.get(interaction.commandName);
        
        if (!command) {
          logger.warn(`Command ${interaction.commandName} not found`);
          return;
        }
        
        try {
          await command.execute(client, interaction);
        } catch (error) {
          logger.error(`Error executing command ${interaction.commandName}:`, error);
          
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
              content: 'There was an error executing this command!',
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: 'There was an error executing this command!',
              ephemeral: true
            });
          }
        }
      }
      // Handle buttons
      else if (interaction.type === InteractionType.MessageComponent && 
               interaction.componentType === ComponentType.Button) {
        // Check if it's a poll button
        if (interaction.customId.startsWith('poll_')) {
          await pollManager.handlePollButton(interaction);
        }
        
        // Add other button handlers here
      }
      // Handle other interaction types as needed
    } catch (error) {
      logger.error('Error handling interaction:', error);
    }
  }
};