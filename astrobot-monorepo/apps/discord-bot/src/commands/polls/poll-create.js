const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pollManager = require('../../lib/polls');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('poll-create')
    .setDescription('Create a new poll')
    .addStringOption(option => 
      option.setName('question')
        .setDescription('The poll question')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('choice1')
        .setDescription('Choice 1')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('choice2')
        .setDescription('Choice 2')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('choice3')
        .setDescription('Choice 3')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('choice4')
        .setDescription('Choice 4')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('choice5')
        .setDescription('Choice 5')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('choice6')
        .setDescription('Choice 6')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('choice7')
        .setDescription('Choice 7')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('choice8')
        .setDescription('Choice 8')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('choice9')
        .setDescription('Choice 9')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('choice10')
        .setDescription('Choice 10')
        .setRequired(false))
    .addIntegerOption(option => 
      option.setName('duration')
        .setDescription('Poll duration in minutes (0 for never-ending)')
        .setRequired(false)
        .setMinValue(0))
    .addBooleanOption(option => 
      option.setName('multiple')
        .setDescription('Whether users can vote for multiple options')
        .setRequired(false)),
  
  // Cooldown in seconds
  cooldown: 10,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get command options
      const question = interaction.options.getString('question');
      const duration = interaction.options.getInteger('duration') || 0;
      const multiple = interaction.options.getBoolean('multiple') || false;
      
      // Collect choices
      const choices = [];
      
      for (let i = 1; i <= 10; i++) {
        const choice = interaction.options.getString(`choice${i}`);
        
        if (choice) {
          choices.push(choice);
        }
      }
      
      // Create the poll
      const poll = await pollManager.createPoll({
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        question,
        choices,
        createdBy: interaction.user.id,
        duration,
        allowMultiple: multiple
      });
      
      // Create poll embed and buttons
      const embed = pollManager.createPollEmbed(poll);
      const components = pollManager.createPollButtons(poll);
      
      // Send the poll message
      const message = await interaction.reply({
        embeds: [embed],
        components,
        fetchReply: true
      });
      
      // Store the message ID in the poll
      poll.messageId = message.id;
      
      // Display help information in an ephemeral message
      await interaction.followUp({
        content: 'Poll created! Users can vote by clicking the buttons. ' +
                 'To end the poll early, use `/poll-end`.',
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error executing poll-create command:', error);
      
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: `There was an error creating the poll: ${error.message}`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `There was an error creating the poll: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }
};