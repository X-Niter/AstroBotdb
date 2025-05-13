const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const customCommands = require('../../lib/custom-commands');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('command-info')
    .setDescription('Get information about a custom command')
    .addStringOption(option => 
      option.setName('name')
        .setDescription('The name of the command')
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
      logger.error('Error handling command-info autocomplete:', error);
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
      
      // Get user permissions
      const hasPermission = customCommands.hasPermission(interaction.member, command);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Command: !${command.name}`)
        .addFields(
          { name: 'Type', value: command.responseType.charAt(0).toUpperCase() + command.responseType.slice(1), inline: true },
          { name: 'Permission', value: command.permissionLevel.charAt(0).toUpperCase() + command.permissionLevel.slice(1), inline: true },
          { name: 'Can Use', value: hasPermission ? 'Yes ✅' : 'No ❌', inline: true },
          { name: 'Usage Count', value: command.usageCount.toString(), inline: true },
          { name: 'Created By', value: `<@${command.createdBy}>`, inline: true },
          { name: 'Created At', value: new Date(command.createdAt).toLocaleString(), inline: true }
        );
      
      // Add response preview based on command type
      switch (command.responseType) {
        case 'text':
          // For text commands, show the raw response
          const textPreview = command.response.length > 1024 
            ? command.response.substring(0, 1021) + '...' 
            : command.response;
          
          embed.addFields({ name: 'Response', value: textPreview });
          break;
          
        case 'embed':
          // For embed commands, show a description of the embed
          embed.addFields({ 
            name: 'Response', 
            value: 'This command returns an embed. Use the command to see it in action.' 
          });
          
          // Show embed structure
          if (command.embed) {
            const embedInfo = [];
            
            if (command.embed.title) embedInfo.push('Title: Yes');
            if (command.embed.description) embedInfo.push('Description: Yes');
            if (command.embed.fields) embedInfo.push(`Fields: ${command.embed.fields.length}`);
            if (command.embed.image) embedInfo.push('Image: Yes');
            if (command.embed.thumbnail) embedInfo.push('Thumbnail: Yes');
            if (command.embed.footer) embedInfo.push('Footer: Yes');
            
            if (embedInfo.length > 0) {
              embed.addFields({ name: 'Embed Structure', value: embedInfo.join('\n') });
            }
          }
          break;
          
        case 'random':
          // For random commands, show the possible responses
          if (command.responses && command.responses.length > 0) {
            const responseCount = command.responses.length;
            const responsePreview = command.responses
              .slice(0, 5) // Show at most 5 responses
              .map((response, i) => `${i + 1}. ${response}`)
              .join('\n');
            
            embed.addFields({ 
              name: `Random Responses (${responseCount} total)`,
              value: responseCount > 5 
                ? responsePreview + `\n...and ${responseCount - 5} more` 
                : responsePreview
            });
          }
          break;
          
        case 'code':
          // For code commands, show the language and code
          if (command.response) {
            const lines = command.response.split('\n');
            const language = lines[0].trim();
            const code = lines.slice(1).join('\n');
            
            const codePreview = code.length > 1000 
              ? code.substring(0, 997) + '...' 
              : code;
            
            embed.addFields(
              { name: 'Language', value: language, inline: true },
              { name: 'Code', value: `\`\`\`${language}\n${codePreview}\n\`\`\`` }
            );
          }
          break;
      }
      
      // Add note about variables
      embed.addFields({ 
        name: 'Available Variables', 
        value: '`{user}`, `{username}`, `{user.id}`, `{channel}`, `{server}`, `{args}`, `{date}`, `{time}`, `{random:1-100}`'
      });
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing command-info command:', error);
      
      await interaction.reply({
        content: `Error getting command info: ${error.message}`,
        ephemeral: true
      });
    }
  }
};