const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const modLogManager = require('../../lib/moderation-log');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('modlog-setup')
    .setDescription('Configure moderation logs')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable moderation logs')
        .addBooleanOption(option => 
          option.setName('enabled')
            .setDescription('Whether moderation logs are enabled')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Set the moderation log channel')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to send moderation logs in')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('actions')
        .setDescription('Configure which actions to log')
        .addBooleanOption(option => 
          option.setName('ban')
            .setDescription('Log ban/unban actions')
            .setRequired(false))
        .addBooleanOption(option => 
          option.setName('kick')
            .setDescription('Log kick actions')
            .setRequired(false))
        .addBooleanOption(option => 
          option.setName('timeout')
            .setDescription('Log timeout actions')
            .setRequired(false))
        .addBooleanOption(option => 
          option.setName('warn')
            .setDescription('Log warn actions')
            .setRequired(false))
        .addBooleanOption(option => 
          option.setName('purge')
            .setDescription('Log message purge actions')
            .setRequired(false))
        .addBooleanOption(option => 
          option.setName('channellock')
            .setDescription('Log channel lock/unlock actions')
            .setRequired(false))
        .addBooleanOption(option => 
          option.setName('roleupdate')
            .setDescription('Log role add/remove actions')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current moderation log settings')),
  
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
      const settings = modLogManager.getGuildSettings(interaction.guildId);
      
      switch (subcommand) {
        case 'toggle': {
          const enabled = interaction.options.getBoolean('enabled');
          
          // Update setting
          await modLogManager.updateGuildSettings(interaction.guildId, { enabled });
          
          await interaction.reply({
            content: `Moderation logs have been ${enabled ? 'enabled' : 'disabled'}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'channel': {
          const channel = interaction.options.getChannel('channel');
          
          // Validate channel
          if (!channel.isTextBased()) {
            return await interaction.reply({
              content: 'The log channel must be a text channel!',
              ephemeral: true
            });
          }
          
          // Check permissions
          const permissions = channel.permissionsFor(interaction.guild.members.me);
          if (!permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
            return await interaction.reply({
              content: 'I need permissions to send messages and embed links in that channel!',
              ephemeral: true
            });
          }
          
          // Update setting
          await modLogManager.updateGuildSettings(interaction.guildId, { channelId: channel.id });
          
          await interaction.reply({
            content: `Moderation log channel set to ${channel}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'actions': {
          // Get options
          const banOption = interaction.options.getBoolean('ban');
          const kickOption = interaction.options.getBoolean('kick');
          const timeoutOption = interaction.options.getBoolean('timeout');
          const warnOption = interaction.options.getBoolean('warn');
          const purgeOption = interaction.options.getBoolean('purge');
          const channelLockOption = interaction.options.getBoolean('channellock');
          const roleUpdateOption = interaction.options.getBoolean('roleupdate');
          
          // Create update object
          const logActions = {};
          
          // Add options if provided
          if (banOption !== null) logActions.ban = banOption;
          if (kickOption !== null) logActions.kick = kickOption;
          if (timeoutOption !== null) logActions.timeout = timeoutOption;
          if (warnOption !== null) logActions.warn = warnOption;
          if (purgeOption !== null) logActions.purge = purgeOption;
          if (channelLockOption !== null) logActions.channelLock = channelLockOption;
          if (roleUpdateOption !== null) logActions.roleUpdate = roleUpdateOption;
          
          // Update settings if any options provided
          if (Object.keys(logActions).length > 0) {
            await modLogManager.updateGuildSettings(interaction.guildId, { logActions });
            
            await interaction.reply({
              content: 'Moderation log action settings updated.',
              ephemeral: true
            });
          } else {
            await interaction.reply({
              content: 'No action settings provided. Use the options to configure which actions to log.',
              ephemeral: true
            });
          }
          break;
        }
        
        case 'view': {
          // Create settings embed
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Moderation Log Settings')
            .addFields(
              { name: 'Enabled', value: settings.enabled ? 'Yes ✅' : 'No ❌', inline: true },
              { name: 'Log Channel', value: settings.channelId ? `<#${settings.channelId}>` : 'Not set', inline: true }
            );
          
          // Add action settings
          const actionSettings = settings.logActions;
          let actionsText = '';
          
          if (actionSettings) {
            actionsText += `Ban/Unban: ${actionSettings.ban ? '✅' : '❌'}\n`;
            actionsText += `Kick: ${actionSettings.kick ? '✅' : '❌'}\n`;
            actionsText += `Timeout: ${actionSettings.timeout ? '✅' : '❌'}\n`;
            actionsText += `Warn: ${actionSettings.warn ? '✅' : '❌'}\n`;
            actionsText += `Purge: ${actionSettings.purge ? '✅' : '❌'}\n`;
            actionsText += `Channel Lock: ${actionSettings.channelLock ? '✅' : '❌'}\n`;
            actionsText += `Role Update: ${actionSettings.roleUpdate ? '✅' : '❌'}`;
          } else {
            actionsText = 'No action settings configured';
          }
          
          embed.addFields({ name: 'Logged Actions', value: actionsText, inline: false });
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
      }
    } catch (error) {
      logger.error('Error executing modlog-setup command:', error);
      
      await interaction.reply({
        content: `There was an error configuring moderation logs: ${error.message}`,
        ephemeral: true
      });
    }
  }
};