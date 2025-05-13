const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const welcomeManager = require('../../lib/welcome');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('welcome-setup')
    .setDescription('Configure welcome messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable welcome messages')
        .addBooleanOption(option => 
          option.setName('enabled')
            .setDescription('Whether welcome messages are enabled')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Set the welcome message channel')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to send welcome messages in')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('message')
        .setDescription('Set the welcome message text')
        .addStringOption(option => 
          option.setName('message')
            .setDescription('The welcome message (use {user}, {server}, {memberCount}, etc.)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('dm')
        .setDescription('Set a welcome message to send as a DM')
        .addStringOption(option => 
          option.setName('message')
            .setDescription('The DM message (or "disable" to turn off)')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('embed')
        .setDescription('Configure the welcome embed')
        .addBooleanOption(option => 
          option.setName('enabled')
            .setDescription('Whether to use an embed')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('color')
            .setDescription('Embed color (hex code)')
            .setRequired(false))
        .addStringOption(option => 
          option.setName('title')
            .setDescription('Embed title')
            .setRequired(false))
        .addStringOption(option => 
          option.setName('description')
            .setDescription('Embed description')
            .setRequired(false))
        .addStringOption(option => 
          option.setName('thumbnail')
            .setDescription('Thumbnail type')
            .setRequired(false)
            .addChoices(
              { name: 'User Avatar', value: 'user' },
              { name: 'Server Icon', value: 'server' },
              { name: 'None', value: 'none' }
            ))
        .addStringOption(option => 
          option.setName('image')
            .setDescription('Image URL for embed')
            .setRequired(false))
        .addStringOption(option => 
          option.setName('footer')
            .setDescription('Footer text')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('autorole')
        .setDescription('Set a role to automatically give to new members')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The role to give (or none to disable)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current welcome settings'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('test')
        .setDescription('Test the welcome message')),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      // Get current settings
      const settings = welcomeManager.getGuildSettings(interaction.guildId);
      
      switch (subcommand) {
        case 'toggle': {
          const enabled = interaction.options.getBoolean('enabled');
          
          // Update setting
          await welcomeManager.updateGuildSettings(interaction.guildId, { enabled });
          
          await interaction.reply({
            content: `Welcome messages have been ${enabled ? 'enabled' : 'disabled'}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'channel': {
          const channel = interaction.options.getChannel('channel');
          
          // Validate channel
          if (!channel.isTextBased()) {
            return await interaction.reply({
              content: 'The welcome channel must be a text channel!',
              ephemeral: true
            });
          }
          
          // Update setting
          await welcomeManager.updateGuildSettings(interaction.guildId, { channelId: channel.id });
          
          await interaction.reply({
            content: `Welcome channel set to ${channel}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'message': {
          const message = interaction.options.getString('message');
          
          // Update setting
          await welcomeManager.updateGuildSettings(interaction.guildId, { message });
          
          // Show preview of the formatted message
          const formattedMessage = message
            .replace(/{user}/g, interaction.user.toString())
            .replace(/{username}/g, interaction.user.username)
            .replace(/{server}/g, interaction.guild.name)
            .replace(/{memberCount}/g, interaction.guild.memberCount.toString())
            .replace(/{date}/g, new Date().toLocaleDateString())
            .replace(/{time}/g, new Date().toLocaleTimeString());
          
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Welcome Message Set')
            .addFields(
              { name: 'Raw Message', value: message, inline: false },
              { name: 'Preview', value: formattedMessage, inline: false }
            )
            .setFooter({ text: 'Available variables: {user}, {username}, {server}, {memberCount}, {date}, {time}' });
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'dm': {
          const message = interaction.options.getString('message');
          
          // Handle disable option
          if (message.toLowerCase() === 'disable') {
            await welcomeManager.updateGuildSettings(interaction.guildId, { dmMessage: null });
            
            await interaction.reply({
              content: 'Welcome DM messages have been disabled.',
              ephemeral: true
            });
            return;
          }
          
          // Update setting
          await welcomeManager.updateGuildSettings(interaction.guildId, { dmMessage: message });
          
          // Show preview of the formatted message
          const formattedMessage = message
            .replace(/{user}/g, interaction.user.toString())
            .replace(/{username}/g, interaction.user.username)
            .replace(/{server}/g, interaction.guild.name)
            .replace(/{memberCount}/g, interaction.guild.memberCount.toString())
            .replace(/{date}/g, new Date().toLocaleDateString())
            .replace(/{time}/g, new Date().toLocaleTimeString());
          
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Welcome DM Message Set')
            .addFields(
              { name: 'Raw Message', value: message, inline: false },
              { name: 'Preview', value: formattedMessage, inline: false }
            )
            .setFooter({ text: 'Available variables: {user}, {username}, {server}, {memberCount}, {date}, {time}' });
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'embed': {
          const enabled = interaction.options.getBoolean('enabled');
          const color = interaction.options.getString('color');
          const title = interaction.options.getString('title');
          const description = interaction.options.getString('description');
          const thumbnail = interaction.options.getString('thumbnail');
          const image = interaction.options.getString('image');
          const footer = interaction.options.getString('footer');
          
          // Create update object
          const updates = { embedEnabled: enabled };
          
          // Add optional fields if provided
          if (color) updates.embedColor = color;
          if (title) updates.embedTitle = title;
          if (description) updates.embedDescription = description;
          if (thumbnail) updates.embedThumbnail = thumbnail;
          if (image) updates.embedImage = image;
          if (footer) updates.embedFooter = footer;
          
          // Update settings
          await welcomeManager.updateGuildSettings(interaction.guildId, updates);
          
          await interaction.reply({
            content: `Welcome embed settings updated. Embed is now ${enabled ? 'enabled' : 'disabled'}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'autorole': {
          const role = interaction.options.getRole('role');
          
          if (!role) {
            // Disable auto role
            await welcomeManager.updateGuildSettings(interaction.guildId, { autoRole: null });
            
            await interaction.reply({
              content: 'Auto role has been disabled.',
              ephemeral: true
            });
            return;
          }
          
          // Validate role
          if (role.managed) {
            return await interaction.reply({
              content: 'Cannot use a managed role (like bot or integration roles).',
              ephemeral: true
            });
          }
          
          if (role.position >= interaction.guild.members.me.roles.highest.position) {
            return await interaction.reply({
              content: `I cannot assign the role ${role.name} because it's higher than my highest role.`,
              ephemeral: true
            });
          }
          
          // Update setting
          await welcomeManager.updateGuildSettings(interaction.guildId, { autoRole: role.id });
          
          await interaction.reply({
            content: `Auto role set to ${role.name}. New members will automatically receive this role.`,
            ephemeral: true
          });
          break;
        }
        
        case 'view': {
          // Create settings embed
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Welcome Message Settings')
            .addFields(
              { name: 'Enabled', value: settings.enabled ? 'Yes ✅' : 'No ❌', inline: true },
              { name: 'Welcome Channel', value: settings.channelId ? `<#${settings.channelId}>` : 'Not set', inline: true },
              { name: 'Auto Role', value: settings.autoRole ? `<@&${settings.autoRole}>` : 'Not set', inline: true },
              { name: 'Welcome Message', value: settings.message || 'Not set', inline: false },
              { name: 'DM Message', value: settings.dmMessage || 'Not set', inline: false }
            );
          
          // Add embed settings if enabled
          if (settings.embedEnabled) {
            embed.addFields(
              { name: 'Embed Settings', value: 'Enabled ✅', inline: false },
              { name: 'Color', value: settings.embedColor || '#5865F2', inline: true },
              { name: 'Title', value: settings.embedTitle || 'Not set', inline: true },
              { name: 'Description', value: settings.embedDescription || 'Not set', inline: false },
              { name: 'Thumbnail', value: settings.embedThumbnail || 'None', inline: true },
              { name: 'Footer', value: settings.embedFooter || 'Not set', inline: true }
            );
            
            if (settings.embedImage) {
              embed.addFields({ name: 'Image URL', value: settings.embedImage, inline: false });
            }
          } else {
            embed.addFields({ name: 'Embed Settings', value: 'Disabled ❌', inline: false });
          }
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'test': {
          // Test welcome message
          if (!settings.enabled) {
            return await interaction.reply({
              content: 'Welcome messages are currently disabled.',
              ephemeral: true
            });
          }
          
          if (!settings.channelId) {
            return await interaction.reply({
              content: 'Welcome channel is not set.',
              ephemeral: true
            });
          }
          
          // Get welcome channel
          const channel = await interaction.guild.channels.fetch(settings.channelId);
          
          if (!channel || !channel.isTextBased()) {
            return await interaction.reply({
              content: 'Welcome channel not found or not a text channel.',
              ephemeral: true
            });
          }
          
          // Get test result
          const testResult = await welcomeManager.testWelcomeMessage(interaction.guild, interaction.user);
          
          // Send test message to welcome channel
          if (settings.embedEnabled && testResult.embed) {
            await channel.send({ 
              content: testResult.message || null, 
              embeds: [testResult.embed] 
            });
          } else {
            await channel.send(testResult.message);
          }
          
          // If DM message is configured, show it in the response
          if (testResult.dmMessage) {
            await interaction.reply({
              content: `Test welcome message sent to ${channel}. DM message would be: "${testResult.dmMessage}"`,
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: `Test welcome message sent to ${channel}.`,
              ephemeral: true
            });
          }
          break;
        }
      }
    } catch (error) {
      logger.error('Error executing welcome-setup command:', error);
      
      await interaction.reply({
        content: `There was an error configuring welcome messages: ${error.message}`,
        ephemeral: true
      });
    }
  }
};