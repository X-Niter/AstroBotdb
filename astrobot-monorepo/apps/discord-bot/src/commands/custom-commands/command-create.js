const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const customCommands = require('../../lib/custom-commands');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('command-create')
    .setDescription('Create a custom command')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(option => 
      option.setName('name')
        .setDescription('The name of the command (without prefix)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('response')
        .setDescription('The response for the command')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('type')
        .setDescription('The type of response')
        .setRequired(false)
        .addChoices(
          { name: 'Text', value: 'text' },
          { name: 'Embed', value: 'embed' },
          { name: 'Random', value: 'random' },
          { name: 'Code', value: 'code' }
        ))
    .addStringOption(option => 
      option.setName('permission')
        .setDescription('The permission required to use this command')
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
      // Get command options
      const name = interaction.options.getString('name');
      const response = interaction.options.getString('response');
      const type = interaction.options.getString('type') || 'text';
      const permission = interaction.options.getString('permission') || 'everyone';
      
      // Depending on the type, we need to handle the response differently
      if (type === 'random') {
        // For random type, interpret response as a list of responses separated by |
        const responses = response.split('|').map(r => r.trim()).filter(r => r.length > 0);
        
        if (responses.length < 2) {
          return await interaction.reply({
            content: 'For random type, you need to provide at least 2 responses separated by | character.',
            ephemeral: true
          });
        }
        
        // Create the command
        await customCommands.createCommand({
          guildId: interaction.guildId,
          name,
          response: responses[0], // First response as the default
          responses,
          createdBy: interaction.user.id,
          permissionLevel: permission,
          responseType: type
        });
      } else if (type === 'embed') {
        // For embed type, parse the response as JSON or provide a simple embed
        let embedData;
        
        try {
          // Try to parse as JSON
          if (response.startsWith('{')) {
            embedData = JSON.parse(response);
          } else {
            // Create a simple embed with the response as description
            embedData = {
              title: 'Command Response',
              description: response
            };
          }
        } catch (error) {
          return await interaction.reply({
            content: 'Invalid JSON for embed. Please provide valid JSON or use a simple text response.',
            ephemeral: true
          });
        }
        
        // Create the command
        await customCommands.createCommand({
          guildId: interaction.guildId,
          name,
          response: response,
          createdBy: interaction.user.id,
          permissionLevel: permission,
          responseType: type,
          embed: embedData
        });
      } else {
        // For text and code types, just use the response as is
        await customCommands.createCommand({
          guildId: interaction.guildId,
          name,
          response,
          createdBy: interaction.user.id,
          permissionLevel: permission,
          responseType: type
        });
      }
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Custom Command Created')
        .addFields(
          { name: 'Name', value: `!${name}`, inline: true },
          { name: 'Type', value: type.charAt(0).toUpperCase() + type.slice(1), inline: true },
          { name: 'Permission', value: permission.charAt(0).toUpperCase() + permission.slice(1), inline: true }
        );
      
      // Add preview of response based on type
      if (type === 'text' || type === 'code') {
        // For text and code, show the raw response
        const preview = response.length > 1024 ? response.substring(0, 1021) + '...' : response;
        embed.addFields({ name: 'Response', value: preview });
      } else if (type === 'random') {
        // For random, show the possible responses
        const responses = response.split('|').map(r => r.trim()).filter(r => r.length > 0);
        const preview = responses.map((r, i) => `${i + 1}. ${r}`).join('\n');
        embed.addFields({ name: 'Possible Responses', value: preview.length > 1024 ? preview.substring(0, 1021) + '...' : preview });
      } else if (type === 'embed') {
        // For embed, indicate that it's an embed response
        embed.addFields({ name: 'Response', value: 'Embed response. Use the command to see it in action.' });
      }
      
      // Add note about variables
      embed.addFields({ 
        name: 'Available Variables', 
        value: '`{user}`, `{username}`, `{user.id}`, `{channel}`, `{server}`, `{args}`, `{date}`, `{time}`, `{random:1-100}`'
      });
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing command-create command:', error);
      
      await interaction.reply({
        content: `Error creating custom command: ${error.message}`,
        ephemeral: true
      });
    }
  }
};