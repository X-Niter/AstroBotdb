const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const aiService = require('../../lib/ai-service');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat with AstroBot\'s AI')
    .addStringOption(option => 
      option.setName('message')
        .setDescription('Your message to the AI')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('private')
        .setDescription('Whether to show the response only to you')
        .setRequired(false))
    .addStringOption(option =>
      option.setName('model')
        .setDescription('AI model to use')
        .setRequired(false)
        .addChoices(
          { name: 'Claude (Anthropic)', value: 'claude' },
          { name: 'GPT (OpenAI)', value: 'gpt' }
        ))
    .addBooleanOption(option =>
      option.setName('reset')
        .setDescription('Reset your conversation history')
        .setRequired(false)),
  
  // Cooldown in seconds (to prevent API spam)
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    // Get user input and options
    const userMessage = interaction.options.getString('message');
    const isPrivate = interaction.options.getBoolean('private') || false;
    const requestedModel = interaction.options.getString('model');
    const resetHistory = interaction.options.getBoolean('reset') || false;
    
    // Get user ID
    const userId = interaction.user.id;
    
    // Reset conversation history if requested
    if (resetHistory) {
      aiService.clearConversationHistory(userId);
    }
    
    // Determine which AI model to use
    let useModel = 'gpt'; // Default to GPT
    
    if (requestedModel) {
      // User explicitly selected a model
      useModel = requestedModel;
    } else {
      // Auto-select based on availability
      if (aiService.isAnthropicAvailable) {
        useModel = 'claude';
      } else if (aiService.isOpenAIAvailable) {
        useModel = 'gpt';
      }
    }
    
    // Check if the requested model is available
    if (useModel === 'claude' && !aiService.isAnthropicAvailable) {
      return await interaction.reply({
        content: 'Claude AI is currently unavailable. Please try GPT model instead.',
        ephemeral: true
      });
    }
    
    if (useModel === 'gpt' && !aiService.isOpenAIAvailable) {
      return await interaction.reply({
        content: 'GPT AI is currently unavailable. Please try Claude model instead.',
        ephemeral: true
      });
    }
    
    // Defer reply as API calls can take time
    await interaction.deferReply({
      ephemeral: isPrivate
    });
    
    try {
      // Prepare context about the user and server
      const context = `You're chatting with ${interaction.user.username} in the server ${interaction.guild.name}.`;
      
      // Generate AI response with the selected model
      let aiResponse;
      if (useModel === 'claude') {
        aiResponse = await aiService.generateClaudeResponse(userId, userMessage, context);
      } else {
        aiResponse = await aiService.generateGPTResponse(userId, userMessage, context);
      }
      
      // Create an embed for the response
      const responseEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setAuthor({
          name: useModel === 'claude' ? 'AstroBot AI (Claude)' : 'AstroBot AI (GPT)',
          iconURL: client.user.displayAvatarURL()
        })
        .setDescription(aiResponse)
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();
      
      // Send the response
      await interaction.editReply({
        embeds: [responseEmbed]
      });
    } catch (error) {
      logger.error('Error in chat command:', error);
      
      let errorMessage = 'There was an error processing your request.';
      
      // Provide more specific error messages for common issues
      if (error.message?.includes('Rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (error.message?.includes('Request timeout') || error.message?.includes('timed out')) {
        errorMessage = 'The request timed out. Please try again with a shorter message.';
      } else if (error.message?.includes('invalid_api_key') || error.message?.includes('not initialized')) {
        errorMessage = 'The AI service is misconfigured. Please contact the bot administrator.';
      }
      
      await interaction.editReply({
        content: errorMessage,
        ephemeral: true
      });
    }
  }
};