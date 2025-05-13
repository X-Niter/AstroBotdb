const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('reaction-role-menu')
    .setDescription('Create a reaction role menu')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option => 
      option.setName('title')
        .setDescription('The title of the menu')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('description')
        .setDescription('The description of the menu')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('color')
        .setDescription('The color of the menu embed (hex code)')
        .setRequired(false))
    .addBooleanOption(option => 
      option.setName('exclusive')
        .setDescription('Whether users can only select one role from this menu')
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
      // Get command options
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const color = interaction.options.getString('color') || '#5865F2';
      const exclusive = interaction.options.getBoolean('exclusive') || false;
      
      // Validate the color
      let embedColor;
      try {
        embedColor = parseInt(color.replace('#', ''), 16);
        
        if (isNaN(embedColor)) {
          throw new Error('Invalid color');
        }
      } catch (error) {
        return await interaction.reply({
          content: 'Invalid color format! Please use a hex color code (e.g., #5865F2).',
          ephemeral: true
        });
      }
      
      // Create the embed
      const embed = new EmbedBuilder()
        .setColor(embedColor)
        .setTitle(title)
        .setDescription(description);
      
      if (exclusive) {
        embed.setFooter({ 
          text: 'You can only select one role from this menu'
        });
      }
      
      // Send the embed
      const message = await interaction.channel.send({ embeds: [embed] });
      
      // Create response embed
      const responseEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Reaction Role Menu Created')
        .setDescription(`Successfully created a reaction role menu.`)
        .addFields(
          { name: 'Message ID', value: message.id, inline: true },
          { name: 'Exclusive', value: exclusive ? 'Yes' : 'No', inline: true }
        )
        .setFooter({
          text: 'Use /reaction-role-create to add roles to this menu'
        });
      
      await interaction.reply({ embeds: [responseEmbed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing reaction-role-menu command:', error);
      
      await interaction.reply({
        content: `There was an error creating the reaction role menu: ${error.message}`,
        ephemeral: true
      });
    }
  }
};