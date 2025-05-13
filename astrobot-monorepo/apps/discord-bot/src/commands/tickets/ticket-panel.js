const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const tickets = require('../../lib/tickets/ticket-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Create a panel for users to create tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The channel to post the panel in')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('title')
        .setDescription('The title of the panel')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('description')
        .setDescription('The description of the panel')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('include-all-categories')
        .setDescription('Include all ticket categories in this panel')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('categories')
        .setDescription('Comma-separated list of category IDs to include (ignored if include-all-categories is true)')
        .setRequired(false)
        .setAutocomplete(true)),
  
  // Cooldown in seconds
  cooldown: 10,
  
  /**
   * Handle autocomplete interactions
   * @param {Client} client - The Discord client
   * @param {AutocompleteInteraction} interaction - The autocomplete interaction
   */
  async autocomplete(client, interaction) {
    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      
      // Get settings
      const settings = tickets.getGuildSettings(interaction.guildId);
      
      // No categories found
      if (!settings.categories || settings.categories.length === 0) {
        return await interaction.respond([]);
      }
      
      // Filter categories based on input
      const filtered = settings.categories.filter(category => 
        category.id.toLowerCase().includes(focusedValue) ||
        category.name.toLowerCase().includes(focusedValue)
      ).slice(0, 25); // Discord only allows 25 choices
      
      await interaction.respond(
        filtered.map(category => ({
          name: `${category.name} (${category.id})`,
          value: category.id
        }))
      );
    } catch (error) {
      logger.error('Error handling ticket-panel autocomplete:', error);
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
      const channel = interaction.options.getChannel('channel');
      const title = interaction.options.getString('title');
      const description = interaction.options.getString('description');
      const includeAllCategories = interaction.options.getBoolean('include-all-categories') || false;
      const categoriesStr = interaction.options.getString('categories');
      
      // Validate
      if (!channel.isTextBased()) {
        return await interaction.reply({
          content: 'The channel must be a text channel.',
          ephemeral: true
        });
      }
      
      // Get settings
      const settings = tickets.getGuildSettings(interaction.guildId);
      
      // Check if ticket system is enabled
      if (!settings.enabled) {
        return await interaction.reply({
          content: 'The ticket system is currently disabled. Enable it with `/ticket-setup enable`.',
          ephemeral: true
        });
      }
      
      // Check if there are any categories
      if (!settings.categories || settings.categories.length === 0) {
        return await interaction.reply({
          content: 'No ticket categories found. Create at least one category with `/ticket-setup category-add`.',
          ephemeral: true
        });
      }
      
      // Get categories to include
      let categoryIds = [];
      
      if (includeAllCategories) {
        categoryIds = settings.categories.map(c => c.id);
      } else if (categoriesStr) {
        categoryIds = categoriesStr.split(',').map(id => id.trim());
        
        // Validate categories
        const validCategoryIds = settings.categories.map(c => c.id);
        const invalidCategoryIds = categoryIds.filter(id => !validCategoryIds.includes(id));
        
        if (invalidCategoryIds.length > 0) {
          return await interaction.reply({
            content: `Invalid category IDs: ${invalidCategoryIds.join(', ')}`,
            ephemeral: true
          });
        }
      } else {
        // Default to first category
        categoryIds = [settings.categories[0].id];
      }
      
      // Create panel options
      const options = {
        guildId: interaction.guildId,
        channelId: channel.id,
        title,
        description,
        categoryIds
      };
      
      // Create panel
      await interaction.deferReply({ ephemeral: true });
      
      const message = await tickets.createTicketPanel(options);
      
      // Get category names
      const categoryNames = categoryIds.map(id => {
        const category = settings.categories.find(c => c.id === id);
        return category ? category.name : id;
      });
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Ticket Panel Created')
        .setDescription(`A ticket panel has been created in ${channel}!`)
        .addFields(
          { name: 'Title', value: title, inline: true },
          { name: 'Categories', value: categoryNames.join(', '), inline: true },
          { name: 'Message Link', value: `[Click here](${message.url})` }
        );
      
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing ticket-panel command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: `Error creating ticket panel: ${error.message}`,
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content: `Error creating ticket panel: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }
};