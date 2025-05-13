const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const tickets = require('../../lib/tickets/ticket-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Configure ticket system settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable the ticket system')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable the ticket system')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('category-add')
        .setDescription('Add a new ticket category')
        .addStringOption(option => 
          option.setName('id')
            .setDescription('ID for the category (letters, numbers, and dashes only)')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('name')
            .setDescription('Display name for the category')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('description')
            .setDescription('Description of the category')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('emoji')
            .setDescription('Emoji for the category button')
            .setRequired(false))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('category-delete')
        .setDescription('Delete a ticket category')
        .addStringOption(option => 
          option.setName('id')
            .setDescription('ID of the category to delete')
            .setRequired(true)
            .setAutocomplete(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('staff-role-add')
        .setDescription('Add a staff role to a ticket category')
        .addStringOption(option => 
          option.setName('category-id')
            .setDescription('ID of the category')
            .setRequired(true)
            .setAutocomplete(true))
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The staff role to add')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('staff-role-remove')
        .setDescription('Remove a staff role from a ticket category')
        .addStringOption(option => 
          option.setName('category-id')
            .setDescription('ID of the category')
            .setRequired(true)
            .setAutocomplete(true))
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The staff role to remove')
            .setRequired(true))
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-discord-category')
        .setDescription('Set the Discord category for tickets')
        .addStringOption(option => 
          option.setName('category-id')
            .setDescription('ID of the ticket category')
            .setRequired(true)
            .setAutocomplete(true))
        .addChannelOption(option => 
          option.setName('discord-category')
            .setDescription('The Discord category to use for tickets')
            .setRequired(true))
    ),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Handle autocomplete interactions
   * @param {Client} client - The Discord client
   * @param {AutocompleteInteraction} interaction - The autocomplete interaction
   */
  async autocomplete(client, interaction) {
    try {
      const focusedOption = interaction.options.getFocused(true);
      
      if (focusedOption.name === 'id' || focusedOption.name === 'category-id') {
        // Get settings
        const settings = tickets.getGuildSettings(interaction.guildId);
        
        // Get categories
        const categories = settings.categories || [];
        
        // Filter categories by search
        const filtered = categories.filter(category => 
          category.id.toLowerCase().includes(focusedOption.value.toLowerCase()) ||
          category.name.toLowerCase().includes(focusedOption.value.toLowerCase())
        );
        
        // Return results
        await interaction.respond(
          filtered.map(category => ({
            name: `${category.name} (${category.id})`,
            value: category.id
          }))
        );
      }
    } catch (error) {
      logger.error('Error handling ticket-setup autocomplete:', error);
    }
  },
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      // Get current settings
      const settings = tickets.getGuildSettings(interaction.guildId);
      
      // Handle subcommand
      switch (subcommand) {
        case 'enable':
          return await handleEnable(interaction, settings);
        case 'disable':
          return await handleDisable(interaction, settings);
        case 'category-add':
          return await handleCategoryAdd(interaction, settings);
        case 'category-delete':
          return await handleCategoryDelete(interaction, settings);
        case 'staff-role-add':
          return await handleStaffRoleAdd(interaction, settings);
        case 'staff-role-remove':
          return await handleStaffRoleRemove(interaction, settings);
        case 'set-discord-category':
          return await handleSetDiscordCategory(interaction, settings);
      }
    } catch (error) {
      logger.error('Error executing ticket-setup command:', error);
      
      await interaction.reply({
        content: `Error: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

/**
 * Handle enable subcommand
 * @param {CommandInteraction} interaction - The interaction
 * @param {Object} settings - The current settings
 * @returns {Promise<void>}
 */
async function handleEnable(interaction, settings) {
  await tickets.updateGuildSettings(interaction.guildId, {
    enabled: true
  });
  
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Ticket System Enabled')
    .setDescription('The ticket system has been enabled!')
    .addFields(
      { name: 'Next Steps', value: 'Create ticket categories and panels for users to create tickets.' }
    );
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Handle disable subcommand
 * @param {CommandInteraction} interaction - The interaction
 * @param {Object} settings - The current settings
 * @returns {Promise<void>}
 */
async function handleDisable(interaction, settings) {
  await tickets.updateGuildSettings(interaction.guildId, {
    enabled: false
  });
  
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('Ticket System Disabled')
    .setDescription('The ticket system has been disabled!')
    .addFields(
      { name: 'Important', value: 'Existing tickets will remain open, but new tickets cannot be created.' }
    );
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Handle category-add subcommand
 * @param {CommandInteraction} interaction - The interaction
 * @param {Object} settings - The current settings
 * @returns {Promise<void>}
 */
async function handleCategoryAdd(interaction, settings) {
  const id = interaction.options.getString('id');
  const name = interaction.options.getString('name');
  const description = interaction.options.getString('description');
  const emoji = interaction.options.getString('emoji') || '🎫';
  
  // Validate ID format
  if (!/^[a-zA-Z0-9-]+$/.test(id)) {
    return await interaction.reply({
      content: 'Invalid ID format. Use only letters, numbers, and dashes.',
      ephemeral: true
    });
  }
  
  // Check if ID already exists
  if (settings.categories.some(c => c.id === id)) {
    return await interaction.reply({
      content: `A category with ID "${id}" already exists.`,
      ephemeral: true
    });
  }
  
  // Add category
  const updatedSettings = await tickets.addTicketCategory(interaction.guildId, {
    id,
    name,
    description,
    emoji
  });
  
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Ticket Category Added')
    .setDescription(`Added new ticket category: ${name}`)
    .addFields(
      { name: 'ID', value: id, inline: true },
      { name: 'Emoji', value: emoji, inline: true },
      { name: 'Description', value: description },
      { name: 'Next Steps', value: 'Add staff roles to this category and create a ticket panel for users.' }
    );
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Handle category-delete subcommand
 * @param {CommandInteraction} interaction - The interaction
 * @param {Object} settings - The current settings
 * @returns {Promise<void>}
 */
async function handleCategoryDelete(interaction, settings) {
  const id = interaction.options.getString('id');
  
  // Check if category exists
  const category = settings.categories.find(c => c.id === id);
  
  if (!category) {
    return await interaction.reply({
      content: `Category with ID "${id}" not found.`,
      ephemeral: true
    });
  }
  
  // Remove category
  await tickets.removeTicketCategory(interaction.guildId, id);
  
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('Ticket Category Deleted')
    .setDescription(`Deleted ticket category: ${category.name}`)
    .addFields(
      { name: 'Important', value: 'Existing tickets in this category will not be affected, but new tickets cannot be created in this category.' }
    );
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Handle staff-role-add subcommand
 * @param {CommandInteraction} interaction - The interaction
 * @param {Object} settings - The current settings
 * @returns {Promise<void>}
 */
async function handleStaffRoleAdd(interaction, settings) {
  const categoryId = interaction.options.getString('category-id');
  const role = interaction.options.getRole('role');
  
  // Check if category exists
  const categoryIndex = settings.categories.findIndex(c => c.id === categoryId);
  
  if (categoryIndex === -1) {
    return await interaction.reply({
      content: `Category with ID "${categoryId}" not found.`,
      ephemeral: true
    });
  }
  
  // Get category
  const category = settings.categories[categoryIndex];
  
  // Check if role is already added
  if (category.staffRoles && category.staffRoles.includes(role.id)) {
    return await interaction.reply({
      content: `Role ${role.name} is already a staff role for category "${category.name}".`,
      ephemeral: true
    });
  }
  
  // Add role
  const staffRoles = [...(category.staffRoles || []), role.id];
  
  await tickets.updateTicketCategory(interaction.guildId, categoryId, {
    staffRoles
  });
  
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Staff Role Added')
    .setDescription(`Added ${role} as a staff role for category "${category.name}"`)
    .addFields(
      { name: 'Total Staff Roles', value: staffRoles.length.toString(), inline: true }
    );
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Handle staff-role-remove subcommand
 * @param {CommandInteraction} interaction - The interaction
 * @param {Object} settings - The current settings
 * @returns {Promise<void>}
 */
async function handleStaffRoleRemove(interaction, settings) {
  const categoryId = interaction.options.getString('category-id');
  const role = interaction.options.getRole('role');
  
  // Check if category exists
  const categoryIndex = settings.categories.findIndex(c => c.id === categoryId);
  
  if (categoryIndex === -1) {
    return await interaction.reply({
      content: `Category with ID "${categoryId}" not found.`,
      ephemeral: true
    });
  }
  
  // Get category
  const category = settings.categories[categoryIndex];
  
  // Check if role is a staff role
  if (!category.staffRoles || !category.staffRoles.includes(role.id)) {
    return await interaction.reply({
      content: `Role ${role.name} is not a staff role for category "${category.name}".`,
      ephemeral: true
    });
  }
  
  // Remove role
  const staffRoles = category.staffRoles.filter(r => r !== role.id);
  
  await tickets.updateTicketCategory(interaction.guildId, categoryId, {
    staffRoles
  });
  
  const embed = new EmbedBuilder()
    .setColor('#FF0000')
    .setTitle('Staff Role Removed')
    .setDescription(`Removed ${role} as a staff role for category "${category.name}"`)
    .addFields(
      { name: 'Total Staff Roles', value: staffRoles.length.toString(), inline: true }
    );
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}

/**
 * Handle set-discord-category subcommand
 * @param {CommandInteraction} interaction - The interaction
 * @param {Object} settings - The current settings
 * @returns {Promise<void>}
 */
async function handleSetDiscordCategory(interaction, settings) {
  const categoryId = interaction.options.getString('category-id');
  const discordCategory = interaction.options.getChannel('discord-category');
  
  // Check if category exists
  const categoryIndex = settings.categories.findIndex(c => c.id === categoryId);
  
  if (categoryIndex === -1) {
    return await interaction.reply({
      content: `Category with ID "${categoryId}" not found.`,
      ephemeral: true
    });
  }
  
  // Check if discord category is a category
  if (discordCategory.type !== 4) { // ChannelType.GuildCategory
    return await interaction.reply({
      content: `${discordCategory.name} is not a category channel.`,
      ephemeral: true
    });
  }
  
  // Get category
  const category = settings.categories[categoryIndex];
  
  // Update category
  await tickets.updateTicketCategory(interaction.guildId, categoryId, {
    defaultCategory: discordCategory.id
  });
  
  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Discord Category Set')
    .setDescription(`Set ${discordCategory.name} as the Discord category for "${category.name}" tickets`)
    .addFields(
      { name: 'Note', value: 'New tickets in this category will be created under this Discord category.' }
    );
  
  await interaction.reply({ embeds: [embed], ephemeral: true });
}