const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const imageManager = require('../../lib/image-generation/image-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('generate')
    .setDescription('Generate an image using AI')
    .addStringOption(option => 
      option.setName('prompt')
        .setDescription('Describe the image you want to generate')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('model')
        .setDescription('The AI model to use')
        .setRequired(false)
        .addChoices(
          { name: 'DALL-E 3', value: 'dall-e-3' },
          { name: 'DALL-E 2', value: 'dall-e-2' }
        ))
    .addStringOption(option => 
      option.setName('size')
        .setDescription('The image size')
        .setRequired(false)
        .addChoices(
          { name: 'Square (1024x1024)', value: '1024x1024' },
          { name: 'Landscape (1792x1024)', value: '1792x1024' },
          { name: 'Portrait (1024x1792)', value: '1024x1792' }
        ))
    .addStringOption(option => 
      option.setName('style')
        .setDescription('The image style (DALL-E 3 only)')
        .setRequired(false)
        .addChoices(
          { name: 'Vivid', value: 'vivid' },
          { name: 'Natural', value: 'natural' }
        ))
    .addBooleanOption(option => 
      option.setName('private')
        .setDescription('Only show the image to you')
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
      // Check if OpenAI is available
      if (!await imageManager.isOpenAIAvailable()) {
        return await interaction.reply({
          content: 'Image generation is currently unavailable. The bot may be missing API keys.',
          ephemeral: true
        });
      }
      
      // Get options
      const prompt = interaction.options.getString('prompt');
      const model = interaction.options.getString('model') || 'dall-e-3';
      const size = interaction.options.getString('size') || '1024x1024';
      const style = interaction.options.getString('style') || 'vivid';
      const isPrivate = interaction.options.getBoolean('private') || false;
      
      // Validate prompt length
      if (prompt.length < 10) {
        return await interaction.reply({
          content: 'Please provide a more detailed prompt (at least 10 characters).',
          ephemeral: true
        });
      }
      
      // Defer reply as image generation can take time
      await interaction.deferReply({ ephemeral: isPrivate });
      
      // Generate image
      const imageResult = await imageManager.generateImage(prompt, {
        model,
        size,
        style,
        quality: 'standard'
      });
      
      // Create attachment from local file
      const attachment = new AttachmentBuilder(imageResult.filepath, {
        name: imageResult.filename
      });
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('AI Generated Image')
        .setDescription(
          imageResult.prompt // Use revised prompt if available
            ? `**Prompt:** ${imageResult.prompt}`
            : `**Prompt:** ${prompt}`
        )
        .setImage(`attachment://${imageResult.filename}`)
        .addFields(
          { name: 'Model', value: model, inline: true },
          { name: 'Size', value: size, inline: true },
          { name: 'Style', value: style, inline: true }
        )
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();
      
      // Send the response
      await interaction.editReply({
        embeds: [embed],
        files: [attachment]
      });
      
      logger.info(`Generated image for ${interaction.user.tag} with prompt: ${prompt}`);
    } catch (error) {
      logger.error('Error executing generate command:', error);
      
      let errorMessage = 'An error occurred while generating the image.';
      
      // Check for specific error types
      if (error.message.includes('content policy')) {
        errorMessage = 'Your prompt was rejected by the content filter. Please try a different prompt.';
      } else if (error.message.includes('quota exceeded')) {
        errorMessage = 'Image generation quota exceeded. Please try again later.';
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