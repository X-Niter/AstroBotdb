const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs').promises;
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const imageManager = require('../../lib/image-generation/image-manager');
const logger = require('../../lib/logger');

// Path to store temporary images
const TEMP_DIR = path.join(process.cwd(), 'data', 'temp-images');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('analyze')
    .setDescription('Analyze an image using AI')
    .addAttachmentOption(option => 
      option.setName('image')
        .setDescription('The image to analyze')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('question')
        .setDescription('What do you want to know about the image?')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('private')
        .setDescription('Only show the analysis to you')
        .setRequired(false)),
  
  // Cooldown in seconds (longer due to API costs)
  cooldown: 60,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Check if Anthropic is available
      if (!await imageManager.isAnthropicAvailable()) {
        return await interaction.reply({
          content: 'Image analysis is currently unavailable. The bot may be missing API keys.',
          ephemeral: true
        });
      }
      
      // Get options
      const attachment = interaction.options.getAttachment('image');
      const question = interaction.options.getString('question');
      const isPrivate = interaction.options.getBoolean('private') || false;
      
      // Validate image
      if (!attachment.contentType?.startsWith('image/')) {
        return await interaction.reply({
          content: 'Please provide a valid image file (JPEG, PNG, etc.).',
          ephemeral: true
        });
      }
      
      // Defer reply as image analysis can take time
      await interaction.deferReply({ ephemeral: isPrivate });
      
      // Download the image
      const imageUrl = attachment.url;
      const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      
      // Ensure temp directory exists
      await fs.mkdir(TEMP_DIR, { recursive: true });
      
      // Save image locally
      const imageFileName = `analysis-${uuidv4()}${path.extname(attachment.name)}`;
      const imageFilePath = path.join(TEMP_DIR, imageFileName);
      await fs.writeFile(imageFilePath, Buffer.from(imageResponse.data));
      
      // Analyze the image
      const analysisResult = await imageManager.analyzeImage(
        imageFilePath,
        question
      );
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Image Analysis')
        .setDescription(analysisResult.text.length > 4000 
          ? analysisResult.text.substring(0, 4000) + '...' 
          : analysisResult.text)
        .setThumbnail(attachment.url)
        .addFields(
          { name: 'Question', value: question }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag} • Powered by Claude`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();
      
      // Send the response
      await interaction.editReply({
        embeds: [embed]
      });
      
      // Clean up the temporary file
      try {
        await fs.unlink(imageFilePath);
      } catch (cleanupError) {
        logger.warn('Failed to delete temporary image file:', cleanupError);
      }
      
      logger.info(`Analyzed image for ${interaction.user.tag} with question: ${question}`);
    } catch (error) {
      logger.error('Error executing analyze command:', error);
      
      let errorMessage = 'An error occurred while analyzing the image.';
      
      // Check for specific error types
      if (error.message.includes('content policy')) {
        errorMessage = 'The image was rejected by the content filter.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: errorMessage,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true
        });
      }
    }
  }
};