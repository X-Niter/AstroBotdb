const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const customCommands = require('../../lib/custom-commands');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('command-list')
    .setDescription('List all custom commands')
    .addStringOption(option => 
      option.setName('permission')
        .setDescription('Filter commands by permission level')
        .setRequired(false)
        .addChoices(
          { name: 'Everyone', value: 'everyone' },
          { name: 'Moderator', value: 'moderator' },
          { name: 'Administrator', value: 'administrator' }
        )),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get filter option
      const permissionFilter = interaction.options.getString('permission');
      
      // Get commands
      const commands = customCommands.getCommands(interaction.guildId);
      
      // Apply filter if provided
      const filteredCommands = permissionFilter 
        ? commands.filter(cmd => cmd.permissionLevel === permissionFilter)
        : commands;
      
      // Sort commands by name
      filteredCommands.sort((a, b) => a.name.localeCompare(b.name));
      
      if (filteredCommands.length === 0) {
        return await interaction.reply({
          content: permissionFilter 
            ? `No custom commands found with permission level "${permissionFilter}".`
            : 'No custom commands found for this server.',
          ephemeral: true
        });
      }
      
      // Group commands by permission level for better organization
      const commandsByPermission = {
        everyone: [],
        moderator: [],
        administrator: []
      };
      
      for (const command of filteredCommands) {
        commandsByPermission[command.permissionLevel].push(command);
      }
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Custom Commands')
        .setDescription(`Found ${filteredCommands.length} custom command${filteredCommands.length === 1 ? '' : 's'}`);
      
      // Add fields for each permission level that has commands
      for (const [permission, cmds] of Object.entries(commandsByPermission)) {
        if (cmds.length > 0) {
          // Format command list
          const commandListItems = cmds.map(cmd => {
            const typeIndicator = {
              'text': '📝',
              'embed': '🖼️',
              'random': '🎲',
              'code': '💻'
            }[cmd.responseType] || '📝';
            
            return `${typeIndicator} **!${cmd.name}** (Used ${cmd.usageCount} times)`;
          });
          
          const commandList = commandListItems.join('\n');
          
          // Add field for this permission level
          embed.addFields({
            name: `${permission.charAt(0).toUpperCase() + permission.slice(1)} Commands`,
            value: commandList
          });
        }
      }
      
      // Add note about command usage
      embed.setFooter({ 
        text: 'Use /command-info <name> to see details about a specific command' 
      });
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing command-list command:', error);
      
      await interaction.reply({
        content: `Error listing custom commands: ${error.message}`,
        ephemeral: true
      });
    }
  }
};