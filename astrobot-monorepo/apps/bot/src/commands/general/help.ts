import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, ComponentType } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { Command } from '../../types/discord';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows all available bot commands')
    .addStringOption(option => 
      option.setName('category')
        .setDescription('Specific category of commands to view')
        .setRequired(false)
        .addChoices(
          { name: 'General', value: 'general' },
          { name: 'Minecraft', value: 'minecraft' },
          { name: 'Moderation', value: 'moderation' },
          { name: 'AI', value: 'ai' },
          { name: 'Utility', value: 'utility' }
        )),
    
  async execute(interaction: ChatInputCommandInteraction) {
    // Get the commands directory
    const commandsPath = join(process.cwd(), 'src', 'commands');
    const commandFolders = readdirSync(commandsPath);
    
    // Initialize empty category map to store commands by category
    const categoryMap: Record<string, { name: string; description: string }[]> = {};
    
    // Get command data for each category
    for (const folder of commandFolders) {
      const folderPath = join(commandsPath, folder);
      const commandFiles = readdirSync(folderPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));
      
      categoryMap[folder] = [];
      
      for (const file of commandFiles) {
        const filePath = join(folderPath, file);
        const command = require(filePath).default;
        
        if ('data' in command) {
          categoryMap[folder].push({
            name: command.data.name,
            description: command.data.description
          });
        }
      }
    }
    
    // Get the requested category or default to displaying the category menu
    const category = interaction.options.getString('category');
    
    if (category) {
      return sendCategoryEmbed(interaction, category, categoryMap);
    }
    
    // Create the main embed
    const embed = new EmbedBuilder()
      .setColor(0x3366FF)
      .setTitle('AstroBot Command Help')
      .setDescription('Welcome to the help menu! Select a category below to see available commands.')
      .addFields(
        { 
          name: 'Categories', 
          value: commandFolders.map(folder => `• **${folder.charAt(0).toUpperCase() + folder.slice(1)}**`).join('\n'),
          inline: false 
        }
      )
      .setFooter({ text: 'Use the dropdown menu to navigate categories' })
      .setTimestamp();
    
    // Create dropdown for category selection
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('help-category')
          .setPlaceholder('Select a category')
          .addOptions(commandFolders.map(folder => {
            return {
              label: folder.charAt(0).toUpperCase() + folder.slice(1),
              value: folder,
              description: `View ${folder} commands`,
            };
          }))
      );
    
    const response = await interaction.reply({
      embeds: [embed],
      components: [row],
      fetchReply: true
    });
    
    // Create collector for dropdown menu
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 120000 // 2 minutes
    });
    
    collector.on('collect', async (selectInteraction: StringSelectMenuInteraction) => {
      const selectedCategory = selectInteraction.values[0];
      
      // Check if the user who interacted is the one who initiated the command
      if (selectInteraction.user.id !== interaction.user.id) {
        return selectInteraction.reply({
          content: 'This menu is not for you.',
          ephemeral: true
        });
      }
      
      await sendCategoryEmbed(selectInteraction, selectedCategory, categoryMap);
    });
    
    collector.on('end', () => {
      // Disable the row when the collector ends
      row.components[0].setDisabled(true);
      interaction.editReply({ components: [row] }).catch(() => {});
    });
  },
} as Command;

// Helper function to send category embed
async function sendCategoryEmbed(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction,
  category: string,
  categoryMap: Record<string, { name: string; description: string }[]>
) {
  // Check if the category exists
  if (!categoryMap[category]) {
    return interaction.reply({
      content: `Category '${category}' not found.`,
      ephemeral: true
    });
  }
  
  // Get the commands for this category
  const commands = categoryMap[category];
  
  // Create embed for this category
  const embed = new EmbedBuilder()
    .setColor(0x3366FF)
    .setTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} Commands`)
    .setDescription(`Here are all available commands in the ${category} category.`)
    .setFooter({ text: `${commands.length} command(s) in this category` })
    .setTimestamp();
  
  // Add each command to the embed
  for (const cmd of commands) {
    embed.addFields({
      name: `/${cmd.name}`,
      value: cmd.description,
      inline: false
    });
  }
  
  if (interaction.isStringSelectMenu()) {
    await interaction.update({ embeds: [embed] });
  } else {
    await interaction.reply({ embeds: [embed] });
  }
}