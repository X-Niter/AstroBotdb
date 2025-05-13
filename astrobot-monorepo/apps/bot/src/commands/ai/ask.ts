import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/discord';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import OpenAI from 'openai';

// Initialize OpenAI client if API key is available
const openai = config.integrations.openai 
  ? new OpenAI({ apiKey: config.integrations.openai })
  : null;

export default {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask a question to the AI assistant')
    .addStringOption(option => 
      option.setName('question')
        .setDescription('The question or prompt for the AI')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('private')
        .setDescription('Whether to show the response only to you')
        .setRequired(false)),
  
  cooldown: 5, // 5 seconds cooldown between uses
  
  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString('question', true);
    const isPrivate = interaction.options.getBoolean('private') || false;
    
    // Check if OpenAI is configured
    if (!openai) {
      return interaction.reply({
        content: 'This command is currently unavailable. AI features are not configured.',
        ephemeral: true
      });
    }
    
    // Defer reply to allow for longer processing time
    await interaction.deferReply({ ephemeral: isPrivate });
    
    try {
      // Call the OpenAI API
      const response = await openai.chat.completions.create({
        model: 'gpt-4o', // Use the newest model
        messages: [
          {
            role: 'system',
            content: `You are AstroBot, an AI assistant for a Discord server focused on Minecraft modding and server management.
                      Be helpful, friendly, and concise in your answers. The current date is ${new Date().toLocaleDateString()}.
                      If asked about Minecraft, provide accurate information about the game, modding, and server management.
                      Keep responses under 2000 characters to fit within Discord's limits.`
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });
      
      // Get the response text
      const responseText = response.choices[0]?.message?.content || 'No response generated.';
      
      // Create an embed for the response
      const embed = new EmbedBuilder()
        .setColor(0x9C59B6)
        .setTitle('AI Response')
        .setDescription(responseText)
        .setFooter({ text: `Asked by ${interaction.user.tag}` })
        .setTimestamp();
      
      // Send the response
      await interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      logger.error('Error calling OpenAI API:', error);
      
      await interaction.editReply({
        content: 'There was an error processing your request. Please try again later.'
      });
    }
  },
} as Command;