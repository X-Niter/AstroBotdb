const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const aiService = require('../../lib/ai-service');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask AstroBot\'s AI for help with specific tasks')
    .addStringOption(option => 
      option.setName('task')
        .setDescription('The type of task you need help with')
        .setRequired(true)
        .addChoices(
          { name: 'Explain a topic', value: 'explain' },
          { name: 'Generate creative content', value: 'create' },
          { name: 'Help with coding', value: 'code' },
          { name: 'Translate text', value: 'translate' },
          { name: 'Summarize text', value: 'summarize' },
          { name: 'Answer a question', value: 'answer' }
        ))
    .addStringOption(option => 
      option.setName('query')
        .setDescription('Your request details')
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName('private')
        .setDescription('Whether to show the response only to you')
        .setRequired(false)),
  
  // Cooldown in seconds
  cooldown: 10,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    // Get user input and options
    const taskType = interaction.options.getString('task');
    const query = interaction.options.getString('query');
    const isPrivate = interaction.options.getBoolean('private') || false;
    
    // Determine the most suitable AI model for this task
    let useModel;
    
    switch (taskType) {
      case 'explain':
      case 'answer':
      case 'summarize':
        // Claude is good at explanations and factual responses
        useModel = aiService.isAnthropicAvailable ? 'claude' : 'gpt';
        break;
      case 'create':
      case 'translate':
        // GPT is good at creative tasks
        useModel = aiService.isOpenAIAvailable ? 'gpt' : 'claude';
        break;
      case 'code':
        // Both are good at coding, prefer GPT
        useModel = aiService.isOpenAIAvailable ? 'gpt' : 'claude';
        break;
      default:
        // Default to any available model
        useModel = aiService.isOpenAIAvailable ? 'gpt' : 
                  (aiService.isAnthropicAvailable ? 'claude' : null);
    }
    
    // Check if any AI model is available
    if (!useModel) {
      return await interaction.reply({
        content: 'AI services are currently unavailable. Please try again later.',
        ephemeral: true
      });
    }
    
    // Defer reply as API calls can take time
    await interaction.deferReply({
      ephemeral: isPrivate
    });
    
    try {
      // Prepare task-specific system prompts
      let systemPrompt;
      let taskTitle;
      
      switch (taskType) {
        case 'explain':
          systemPrompt = `You are AstroBot, an educational assistant. Provide a clear, concise explanation of the topic. Use analogies where helpful and structure your response with headings if the topic is complex.`;
          taskTitle = `Explanation: ${truncate(query, 50)}`;
          break;
        case 'create':
          systemPrompt = `You are AstroBot, a creative assistant. Generate high-quality creative content based on the request. Be original and engaging.`;
          taskTitle = `Creative Content: ${truncate(query, 50)}`;
          break;
        case 'code':
          systemPrompt = `You are AstroBot, a coding assistant. Provide clean, well-commented code with explanations. Focus on best practices and include usage examples where appropriate.`;
          taskTitle = `Code Help: ${truncate(query, 50)}`;
          break;
        case 'translate':
          systemPrompt = `You are AstroBot, a translation assistant. Translate the provided text accurately while preserving the original meaning and tone as much as possible.`;
          taskTitle = `Translation: ${truncate(query, 50)}`;
          break;
        case 'summarize':
          systemPrompt = `You are AstroBot, a summarization assistant. Provide a concise summary that captures the key points of the text while maintaining its overall meaning.`;
          taskTitle = `Summary: ${truncate(query, 50)}`;
          break;
        case 'answer':
          systemPrompt = `You are AstroBot, a knowledgeable assistant. Provide a direct and informative answer to the question. If uncertain, acknowledge limitations rather than speculating.`;
          taskTitle = `Answer: ${truncate(query, 50)}`;
          break;
        default:
          systemPrompt = `You are AstroBot, a helpful assistant. Respond to the user's request in a clear and informative manner.`;
          taskTitle = `Response: ${truncate(query, 50)}`;
      }
      
      // Generate AI response with the selected model
      let aiResponse;
      if (useModel === 'claude') {
        aiResponse = await aiService.generateClaudeResponse(
          interaction.user.id, 
          query,
          systemPrompt
        );
      } else {
        aiResponse = await aiService.generateGPTResponse(
          interaction.user.id, 
          query,
          systemPrompt
        );
      }
      
      // Create an embed for the response
      const responseEmbed = new EmbedBuilder()
        .setColor(getColorForTask(taskType))
        .setTitle(taskTitle)
        .setAuthor({
          name: useModel === 'claude' ? 'AstroBot AI (Claude)' : 'AstroBot AI (GPT)',
          iconURL: client.user.displayAvatarURL()
        })
        .setDescription(aiResponse)
        .setFooter({
          text: `Requested by ${interaction.user.tag} • Task: ${getTaskName(taskType)}`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();
      
      // Send the response
      await interaction.editReply({
        embeds: [responseEmbed]
      });
    } catch (error) {
      logger.error('Error in ask command:', error);
      
      let errorMessage = 'There was an error processing your request.';
      
      // Provide more specific error messages for common issues
      if (error.message?.includes('Rate limit')) {
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (error.message?.includes('Request timeout') || error.message?.includes('timed out')) {
        errorMessage = 'The request timed out. Please try again with a shorter query.';
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

/**
 * Truncate a string to a maximum length and add ellipsis if needed
 * @param {string} str - The string to truncate
 * @param {number} maxLength - The maximum length
 * @returns {string} The truncated string
 */
function truncate(str, maxLength) {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Get a color for a task type
 * @param {string} taskType - The task type
 * @returns {number} The color as a decimal number
 */
function getColorForTask(taskType) {
  switch (taskType) {
    case 'explain':
      return 0x4285F4; // Blue
    case 'create':
      return 0xEA4335; // Red
    case 'code':
      return 0x34A853; // Green
    case 'translate':
      return 0xFBBC05; // Yellow
    case 'summarize':
      return 0x9C27B0; // Purple
    case 'answer':
      return 0xFF9800; // Orange
    default:
      return 0x5865F2; // Discord blue
  }
}

/**
 * Get a human-readable name for a task type
 * @param {string} taskType - The task type
 * @returns {string} The human-readable name
 */
function getTaskName(taskType) {
  switch (taskType) {
    case 'explain': return 'Explanation';
    case 'create': return 'Creative Content';
    case 'code': return 'Code Help';
    case 'translate': return 'Translation';
    case 'summarize': return 'Summary';
    case 'answer': return 'Question Answering';
    default: return 'General Assistance';
  }
}