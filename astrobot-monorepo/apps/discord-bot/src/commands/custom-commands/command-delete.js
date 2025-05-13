const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const customCommands = require('../../lib/custom-commands');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('command-delete')
    .setDescription('Delete a custom command')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => 
      option.setName('name')
        .setDescription('The name of the command to delete')
        .setRequired(true)
        .setAutocomplete(true)),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Handle autocomplete interactions
   * @param {Client} client - The Discord client
   * @param {AutocompleteInteraction} interaction - The autocomplete interaction
   */
  async autocomplete(client, interaction) {
    try {
      const focusedValue = interaction.options.getFocused().toLowerCase();
      
      // Get commands
      const commands = customCommands.getCommands(interaction.guildId);
      
      // Filter based on input
      const filtered = commands
        .filter(cmd => cmd.name.toLowerCase().includes(focusedValue))
        .slice(0, 25); // Discord only allows 25 choices
      
      await interaction.respond(
        filtered.map(cmd => ({ name: cmd.name, value: cmd.name }))
      );
    } catch (error) {
      logger.error('Error handling command-delete autocomplete:', error);
    }
  },
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get command name
      const name = interaction.options.getString('name');
      
      // Get command
      const command = customCommands.getCommand(interaction.guildId, name);
      
      if (!command) {
        return await interaction.reply({
          content: `Command "${name}" not found.`,
          ephemeral: true
        });
      }
      
      // Check if user has permission to delete the command
      // Allow deletion if the user created the command or has administrator permission
      const isCreator = command.createdBy === interaction.user.id;
      const isAdmin = interaction.member.permissions.has(PermissionFlagsBits.Administrator);
      
      if (!isCreator && !isAdmin) {
        return await interaction.reply({
          content: 'You can only delete commands that you created or if you have Administrator permission.',
          ephemeral: true
        });
      }
      
      // Create confirmation embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Command Deleted')
        .setDescription(`The command **!${command.name}** has been deleted.`)
        .addFields(
          { name: 'Type', value: command.responseType.charAt(0).toUpperCase() + command.responseType.slice(1), inline: true },
          { name: 'Permission', value: command.permissionLevel.charAt(0).toUpperCase() + command.permissionLevel.slice(1), inline: true },
          { name: 'Usage Count', value: command.usageCount.toString(), inline: true },
          { name: 'Created By', value: `<@${command.createdBy}>`, inline: true },
          { name: 'Created At', value: new Date(command.createdAt).toLocaleString(), inline: true }
        );
      
      // Delete the command
      const success = await customCommands.deleteCommand(interaction.guildId, name);
      
      if (!success) {
        return await interaction.reply({
          content: `Error deleting command "${name}".`,
          ephemeral: true
        });
      }
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing command-delete command:', error);
      
      await interaction.reply({
        content: `Error deleting custom command: ${error.message}`,
        ephemeral: true
      });
    }
  }
};