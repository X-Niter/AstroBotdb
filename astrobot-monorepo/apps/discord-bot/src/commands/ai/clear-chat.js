const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const chatManager = require('../../lib/ai-chat/chat-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('clear-chat')
    .setDescription('Clear your chat history with the AI assistant')
    .addBooleanOption(option => 
      option.setName('private')
        .setDescription('Make the response visible only to you')
        .setRequired(false)),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get options
      const isPrivate = interaction.options.getBoolean('private') || false;
      
      // Clear chat history
      const success = await chatManager.clearChat(interaction.user.id);
      
      if (!success) {
        throw new Error('Failed to clear chat history');
      }
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Chat History Cleared')
        .setDescription('Your chat history with the AI assistant has been cleared. You can start a new conversation with the `/chat` command.')
        .setFooter({
          text: 'AstroBot AI',
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();
      
      // Send response
      await interaction.reply({
        embeds: [embed],
        ephemeral: isPrivate
      });
      
      logger.info(`Chat history cleared for user ${interaction.user.tag}`);
    } catch (error) {
      logger.error('Error executing clear-chat command:', error);
      
      // Send error message
      await interaction.reply({
        content: `Sorry, I encountered an error: ${error.message}`,
        ephemeral: true
      });
    }
  }
};