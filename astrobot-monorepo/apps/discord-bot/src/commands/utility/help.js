const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('List all available commands or get info about a specific command')
    .addStringOption(option => 
      option.setName('command')
        .setDescription('Get info about a specific command')
        .setRequired(false)
        .setAutocomplete(true)),
  
  // Cooldown in seconds
  cooldown: 3,
  
  /**
   * Handle autocomplete for command names
   * @param {Client} client - The Discord client
   * @param {AutocompleteInteraction} interaction - The autocomplete interaction
   */
  async autocomplete(client, interaction) {
    const focusedValue = interaction.options.getFocused().toLowerCase();
    const choices = [...client.slashCommands.keys()];
    
    const filtered = choices.filter(choice => choice.toLowerCase().includes(focusedValue))
      .slice(0, 25); // Discord only allows 25 choices
    
    await interaction.respond(
      filtered.map(choice => ({ name: choice, value: choice }))
    );
  },
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    const commandName = interaction.options.getString('command');
    
    // If a specific command is requested
    if (commandName) {
      return await showCommandHelp(client, interaction, commandName);
    }
    
    // Otherwise show the command categories
    await showCommandCategories(client, interaction);
  }
};

/**
 * Show help for a specific command
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction that triggered the command
 * @param {string} commandName - The name of the command to show help for
 */
async function showCommandHelp(client, interaction, commandName) {
  // Get the command
  const command = client.slashCommands.get(commandName);
  
  // If command doesn't exist
  if (!command) {
    return await interaction.reply({
      content: `Command \`${commandName}\` not found.`,
      ephemeral: true
    });
  }
  
  // Create an embed with command information
  const helpEmbed = new EmbedBuilder()
    .setTitle(`Command: /${command.data.name}`)
    .setDescription(command.data.description)
    .setColor('#5865F2');
  
  // Add cooldown if present
  if (command.cooldown) {
    helpEmbed.addFields({ name: 'Cooldown', value: `${command.cooldown} seconds`, inline: true });
  }
  
  // Add permissions if present
  if (command.permissions && command.permissions.length > 0) {
    helpEmbed.addFields({ 
      name: 'Required Permissions', 
      value: command.permissions.map(p => `\`${p}\``).join(', '), 
      inline: true 
    });
  }
  
  // Add options if present
  const options = command.data.options;
  if (options && options.length > 0) {
    let optionsText = '';
    
    for (const option of options) {
      const required = option.required ? '(required)' : '(optional)';
      optionsText += `\`${option.name}\` - ${option.description} ${required}\n`;
    }
    
    helpEmbed.addFields({ name: 'Options', value: optionsText });
  }
  
  // Add example usage if available
  if (command.examples) {
    helpEmbed.addFields({ 
      name: 'Examples', 
      value: command.examples.map(ex => `\`/${command.data.name} ${ex}\``).join('\n')
    });
  }
  
  await interaction.reply({
    embeds: [helpEmbed]
  });
}

/**
 * Show all command categories
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction that triggered the command
 */
async function showCommandCategories(client, interaction) {
  // Get all command categories (folder names)
  const commandsPath = path.join(__dirname, '../..');
  const categories = fs.readdirSync(commandsPath)
    .filter(dir => fs.statSync(path.join(commandsPath, dir)).isDirectory() && dir !== 'events' && dir !== 'lib')
    .map(dir => ({ name: capitalizeFirstLetter(dir), value: dir }));
  
  // Create an embed with all categories
  const helpEmbed = new EmbedBuilder()
    .setTitle('AstroBot Help')
    .setDescription('Select a category to view available commands.')
    .setColor('#5865F2')
    .setFooter({ text: 'Use /help <command> to get detailed information on a specific command.' });
  
  // Add command count per category
  for (const category of categories) {
    const commandFiles = fs.readdirSync(path.join(commandsPath, category.value))
      .filter(file => file.endsWith('.js'));
    
    helpEmbed.addFields({
      name: category.name,
      value: `${commandFiles.length} commands`,
      inline: true
    });
  }
  
  // Create a dropdown menu for categories
  const dropdown = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('Select a category')
        .addOptions(categories)
    );
  
  await interaction.reply({
    embeds: [helpEmbed],
    components: [dropdown]
  });
  
  // Register the select menu handler
  client.selectMenuHandlers.set('help_category_select', async (client, selectInteraction) => {
    if (selectInteraction.user.id !== interaction.user.id) {
      return await selectInteraction.reply({
        content: 'This menu is not for you.',
        ephemeral: true
      });
    }
    
    const selectedCategory = selectInteraction.values[0];
    await showCategoryCommands(client, selectInteraction, selectedCategory);
  });
}

/**
 * Show commands in a specific category
 * @param {Client} client - The Discord client
 * @param {SelectMenuInteraction} interaction - The select menu interaction
 * @param {string} category - The category to show commands for
 */
async function showCategoryCommands(client, interaction, category) {
  // Get all commands in the category
  const commandsPath = path.join(__dirname, '../..', category);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  // Create an embed with all commands in the category
  const categoryEmbed = new EmbedBuilder()
    .setTitle(`${capitalizeFirstLetter(category)} Commands`)
    .setDescription(`List of all commands in the ${category} category.`)
    .setColor('#5865F2');
  
  // Add each command to the embed
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if (command.data) {
      categoryEmbed.addFields({
        name: `/${command.data.name}`,
        value: command.data.description,
        inline: false
      });
    }
  }
  
  // Create a back button to return to categories
  const backButton = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('help_back')
        .setPlaceholder('Return to categories')
        .addOptions([
          {
            label: 'Back to categories',
            value: 'back',
            description: 'Return to the category selection menu',
            emoji: '⬅️'
          }
        ])
    );
  
  await interaction.update({
    embeds: [categoryEmbed],
    components: [backButton]
  });
  
  // Register the back button handler
  client.selectMenuHandlers.set('help_back', async (client, backInteraction) => {
    if (backInteraction.user.id !== interaction.user.id) {
      return await backInteraction.reply({
        content: 'This menu is not for you.',
        ephemeral: true
      });
    }
    
    await showCommandCategories(client, backInteraction);
  });
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - The string to capitalize
 * @returns {string} The capitalized string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}