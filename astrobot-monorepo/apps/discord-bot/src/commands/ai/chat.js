const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const chatManager = require('../../lib/ai-chat/chat-manager');
const personaManager = require('../../lib/ai-chat/persona-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat with AstroBot\'s AI assistant')
    .addStringOption(option => 
      option.setName('message')
        .setDescription('Your message to the AI')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('persona')
        .setDescription('Choose a persona for the AI')
        .setRequired(false)
        .setAutocomplete(true))
    .addBooleanOption(option => 
      option.setName('private')
        .setDescription('Make the response visible only to you')
        .setRequired(false))
    .addBooleanOption(option => 
      option.setName('new')
        .setDescription('Start a new conversation')
        .setRequired(false)),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Handle autocomplete interactions
   * @param {Client} client - The Discord client
   * @param {AutocompleteInteraction} interaction - The autocomplete interaction
   */
  async autocomplete(client, interaction) {
    try {
      if (interaction.options.getFocused(true).name === 'persona') {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        const personas = personaManager.getAllPersonas();
        
        const filtered = personas
          .filter(persona => 
            persona.name.toLowerCase().includes(focusedValue) ||
            persona.description.toLowerCase().includes(focusedValue)
          )
          .slice(0, 25); // Discord only allows 25 choices
        
        await interaction.respond(
          filtered.map(persona => ({
            name: persona.name,
            value: persona.id
          }))
        );
      }
    } catch (error) {
      logger.error('Error handling chat autocomplete:', error);
    }
  },
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get options
      const message = interaction.options.getString('message');
      const personaId = interaction.options.getString('persona');
      const isPrivate = interaction.options.getBoolean('private') || false;
      const isNewConversation = interaction.options.getBoolean('new') || false;
      
      // Start new conversation if requested
      if (isNewConversation) {
        await chatManager.clearChat(interaction.user.id);
      }
      
      // Defer reply as AI processing can take time
      await interaction.deferReply({ ephemeral: isPrivate });
      
      // Send message to AI
      const response = await chatManager.sendMessage(interaction.user.id, message, {
        personaId
      });
      
      // Get persona information
      const persona = personaManager.getPersona(personaId || response.persona.id);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(persona ? persona.name : 'AstroBot AI')
        .setDescription(response.message.content)
        .setFooter({
          text: `Model: ${response.model} • ${isNewConversation ? 'New conversation' : 'Continuing conversation'}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();
      
      // Send response
      await interaction.editReply({
        embeds: [embed]
      });
      
      // Log usage
      logger.info(`Chat response sent to ${interaction.user.tag} using model ${response.model}`);
    } catch (error) {
      logger.error('Error executing chat command:', error);
      
      // Send error message
      const errorMessage = `Sorry, I encountered an error: ${error.message}`;
      
      if (interaction.deferred) {
        await interaction.editReply({ content: errorMessage });
      } else {
        await interaction.reply({ content: errorMessage, ephemeral: true });
      }
    }
  }
};