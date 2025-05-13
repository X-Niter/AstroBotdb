const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const musicManager = require('../../lib/music/music-manager');
const filterManager = require('../../lib/music/filters/filter-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Apply audio filters to the music')
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all available audio filters'))
    .addSubcommand(subcommand =>
      subcommand.setName('apply')
        .setDescription('Apply an audio filter')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The filter to apply')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('clear')
        .setDescription('Clear the current audio filter'))
    .addSubcommand(subcommand =>
      subcommand.setName('save')
        .setDescription('Save a custom filter preset')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The name for the preset')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('A description for the preset')
            .setRequired(false))),
  
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
      
      if (focusedOption.name === 'name') {
        const focusedValue = focusedOption.value.toLowerCase();
        
        // Get all available filters
        const availableFilters = filterManager.getAvailableFilters();
        
        // Get user presets
        const userPresets = filterManager.getUserPresets(interaction.user.id);
        
        // Create options array
        const options = [];
        
        // Add built-in filters
        for (const [filterId, filter] of Object.entries(availableFilters)) {
          // Skip user presets (they start with custom_)
          if (filterId.startsWith('custom_')) continue;
          
          options.push({
            name: filter.name,
            value: filterId,
            description: filter.description
          });
        }
        
        // Add user presets
        for (const [presetName, preset] of Object.entries(userPresets)) {
          options.push({
            name: `${preset.name} (Custom)`,
            value: `custom_${interaction.user.id}_${presetName}`,
            description: preset.description || 'Custom preset'
          });
        }
        
        // Filter options by focused value
        const filteredOptions = options.filter(option =>
          option.name.toLowerCase().includes(focusedValue) ||
          option.description.toLowerCase().includes(focusedValue)
        );
        
        // Return filtered options (max 25)
        await interaction.respond(
          filteredOptions.slice(0, 25).map(option => ({
            name: option.name,
            value: option.value
          }))
        );
      }
    } catch (error) {
      logger.error('Error handling filter autocomplete:', error);
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
      
      switch (subcommand) {
        case 'list':
          await handleListFilters(interaction);
          break;
          
        case 'apply':
          await handleApplyFilter(interaction);
          break;
          
        case 'clear':
          await handleClearFilter(interaction);
          break;
          
        case 'save':
          await handleSaveFilter(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand!',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing filter command:', error);
      
      await interaction.reply({
        content: `An error occurred: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

/**
 * Handle listing all available filters
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListFilters(interaction) {
  try {
    // Get all available filters
    const availableFilters = filterManager.getAvailableFilters();
    
    // Get user presets
    const userPresets = filterManager.getUserPresets(interaction.user.id);
    
    // Format built-in filters
    let builtInFiltersText = '';
    
    for (const [filterId, filter] of Object.entries(availableFilters)) {
      // Skip user presets (they start with custom_)
      if (filterId.startsWith('custom_')) continue;
      
      builtInFiltersText += `**${filter.name}** - ${filter.description} - \`${filterId}\`\n`;
    }
    
    // Format user presets
    let userPresetsText = '';
    
    if (Object.keys(userPresets).length > 0) {
      for (const [presetName, preset] of Object.entries(userPresets)) {
        userPresetsText += `**${preset.name}** - ${preset.description || 'Custom preset'} - \`custom_${interaction.user.id}_${presetName}\`\n`;
      }
    } else {
      userPresetsText = 'No custom presets. Create one with `/filter save`.';
    }
    
    // Get current queue and filter
    const queue = musicManager.getQueue(interaction.guildId);
    const currentFilter = queue ? queue.filter : null;
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Available Audio Filters')
      .addFields(
        { name: 'Built-in Filters', value: builtInFiltersText, inline: false },
        { name: 'Your Custom Presets', value: userPresetsText, inline: false }
      )
      .setFooter({ text: `Current filter: ${currentFilter || 'None'}`, iconURL: interaction.guild.iconURL({ dynamic: true }) });
    
    // Send response
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error listing filters:', error);
    throw error;
  }
}

/**
 * Handle applying a filter
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleApplyFilter(interaction) {
  try {
    // Get options
    const filterName = interaction.options.getString('name');
    
    // Check if filter exists
    if (!filterManager.isValidFilter(filterName)) {
      return interaction.reply({
        content: 'That filter doesn\'t exist. Use `/filter list` to see available filters.',
        ephemeral: true
      });
    }
    
    // Get queue
    const queue = musicManager.getQueue(interaction.guildId);
    
    if (!queue) {
      return interaction.reply({
        content: 'There is no active music session. Play something first!',
        ephemeral: true
      });
    }
    
    // Check if user is in the same voice channel
    const voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel || queue.voiceChannel.id !== voiceChannel.id) {
      return interaction.reply({
        content: 'You need to be in the same voice channel as the bot to use this command!',
        ephemeral: true
      });
    }
    
    // Defer reply (applying filter can take time)
    await interaction.deferReply();
    
    // Apply filter
    const success = await musicManager.setFilter(interaction.guildId, filterName);
    
    if (!success) {
      return interaction.editReply('Failed to apply the filter. Please try again.');
    }
    
    // Get filter info
    const filters = filterManager.getAvailableFilters();
    const filter = filters[filterName];
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Filter Applied')
      .setDescription(`Applied filter **${filter.name}** to the current playback.`)
      .setFooter({ text: `Use '/filter clear' to remove the filter`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
    
    // Send response
    await interaction.editReply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} applied filter "${filterName}" in guild ${interaction.guildId}`);
  } catch (error) {
    logger.error('Error applying filter:', error);
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(`An error occurred: ${error.message}`);
    } else {
      await interaction.reply({
        content: `An error occurred: ${error.message}`,
        ephemeral: true
      });
    }
  }
}

/**
 * Handle clearing the current filter
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleClearFilter(interaction) {
  try {
    // Get queue
    const queue = musicManager.getQueue(interaction.guildId);
    
    if (!queue) {
      return interaction.reply({
        content: 'There is no active music session.',
        ephemeral: true
      });
    }
    
    // Check if user is in the same voice channel
    const voiceChannel = interaction.member.voice.channel;
    
    if (!voiceChannel || queue.voiceChannel.id !== voiceChannel.id) {
      return interaction.reply({
        content: 'You need to be in the same voice channel as the bot to use this command!',
        ephemeral: true
      });
    }
    
    // Check if a filter is active
    if (!queue.filter) {
      return interaction.reply({
        content: 'No filter is currently active.',
        ephemeral: true
      });
    }
    
    // Defer reply (clearing filter can take time)
    await interaction.deferReply();
    
    // Clear filter
    const success = await musicManager.setFilter(interaction.guildId, null);
    
    if (!success) {
      return interaction.editReply('Failed to clear the filter. Please try again.');
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Filter Cleared')
      .setDescription('Removed the active audio filter from the current playback.')
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
    
    // Send response
    await interaction.editReply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} cleared filter in guild ${interaction.guildId}`);
  } catch (error) {
    logger.error('Error clearing filter:', error);
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(`An error occurred: ${error.message}`);
    } else {
      await interaction.reply({
        content: `An error occurred: ${error.message}`,
        ephemeral: true
      });
    }
  }
}

/**
 * Handle saving a custom filter preset
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSaveFilter(interaction) {
  try {
    // Get options
    const presetName = interaction.options.getString('name');
    const description = interaction.options.getString('description') || '';
    
    // Get queue
    const queue = musicManager.getQueue(interaction.guildId);
    
    if (!queue) {
      return interaction.reply({
        content: 'There is no active music session. Play something and apply filters first!',
        ephemeral: true
      });
    }
    
    // Check if a filter is active
    if (!queue.filter) {
      return interaction.reply({
        content: 'No filter is currently active. Apply a filter first!',
        ephemeral: true
      });
    }
    
    // Get current filter
    const availableFilters = filterManager.getAvailableFilters();
    const currentFilter = availableFilters[queue.filter];
    
    if (!currentFilter) {
      return interaction.reply({
        content: 'Failed to get information about the current filter.',
        ephemeral: true
      });
    }
    
    // Create preset
    const success = await filterManager.createCustomPreset(
      interaction.user.id,
      presetName,
      {
        name: presetName,
        description,
        ffmpegArgs: currentFilter.ffmpegArgs
      }
    );
    
    if (!success) {
      return interaction.reply({
        content: 'Failed to save the filter preset. Please try again.',
        ephemeral: true
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Filter Preset Saved')
      .setDescription(`Saved the current filter as **${presetName}**.\nYou can use it with \`/filter apply\`.`)
      .addFields(
        { name: 'Description', value: description || 'No description provided', inline: false },
        { name: 'Filter ID', value: `custom_${interaction.user.id}_${presetName}`, inline: false }
      )
      .setFooter({ text: `Requested by ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
    
    // Send response
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} saved filter preset "${presetName}" in guild ${interaction.guildId}`);
  } catch (error) {
    logger.error('Error saving filter preset:', error);
    throw error;
  }
}