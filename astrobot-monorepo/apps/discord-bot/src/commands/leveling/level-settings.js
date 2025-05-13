const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const levelManager = require('../../lib/leveling');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('level-settings')
    .setDescription('Configure leveling system settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current leveling settings'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable the leveling system')
        .addBooleanOption(option => 
          option.setName('enabled')
            .setDescription('Whether the leveling system is enabled')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('announce')
        .setDescription('Enable or disable level up announcements')
        .addBooleanOption(option => 
          option.setName('enabled')
            .setDescription('Whether level up announcements are enabled')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('xp')
        .setDescription('Configure XP settings')
        .addIntegerOption(option => 
          option.setName('min')
            .setDescription('Minimum XP per message')
            .setRequired(true)
            .setMinValue(1))
        .addIntegerOption(option => 
          option.setName('max')
            .setDescription('Maximum XP per message')
            .setRequired(true)
            .setMinValue(1)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('cooldown')
        .setDescription('Set the cooldown between XP rewards (in seconds)')
        .addIntegerOption(option => 
          option.setName('seconds')
            .setDescription('Cooldown in seconds')
            .setRequired(true)
            .setMinValue(0))),
  
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
      const settings = levelManager.getGuildSettings(interaction.guildId);
      
      switch (subcommand) {
        case 'view': {
          // Create settings embed
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Leveling System Settings')
            .addFields(
              { name: 'Enabled', value: settings.enabled ? 'Yes ✅' : 'No ❌', inline: true },
              { name: 'Level Up Announcements', value: settings.announce ? 'Yes ✅' : 'No ❌', inline: true },
              { name: 'XP Per Message', value: `${settings.xpPerMessage.min} - ${settings.xpPerMessage.max}`, inline: true },
              { name: 'Cooldown', value: `${settings.cooldown} seconds`, inline: true }
            );
          
          // Add reward roles if there are any
          if (settings.roles && settings.roles.length > 0) {
            let rolesText = '';
            
            for (const role of settings.roles) {
              rolesText += `Level ${role.level}: <@&${role.roleId}>\n`;
            }
            
            embed.addFields({ name: 'Level Reward Roles', value: rolesText });
          } else {
            embed.addFields({ name: 'Level Reward Roles', value: 'No reward roles configured' });
          }
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'toggle': {
          const enabled = interaction.options.getBoolean('enabled');
          
          // Update setting
          await levelManager.updateGuildSettings(interaction.guildId, { enabled });
          
          await interaction.reply({
            content: `The leveling system has been ${enabled ? 'enabled' : 'disabled'}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'announce': {
          const enabled = interaction.options.getBoolean('enabled');
          
          // Update setting
          await levelManager.updateGuildSettings(interaction.guildId, { announce: enabled });
          
          await interaction.reply({
            content: `Level up announcements have been ${enabled ? 'enabled' : 'disabled'}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'xp': {
          const min = interaction.options.getInteger('min');
          const max = interaction.options.getInteger('max');
          
          // Validate min/max
          if (min > max) {
            return await interaction.reply({
              content: 'Minimum XP cannot be greater than maximum XP!',
              ephemeral: true
            });
          }
          
          // Update setting
          await levelManager.updateGuildSettings(interaction.guildId, { 
            xpPerMessage: { min, max } 
          });
          
          await interaction.reply({
            content: `XP settings updated. Users will now receive ${min} - ${max} XP per message.`,
            ephemeral: true
          });
          break;
        }
        
        case 'cooldown': {
          const seconds = interaction.options.getInteger('seconds');
          
          // Update setting
          await levelManager.updateGuildSettings(interaction.guildId, { cooldown: seconds });
          
          await interaction.reply({
            content: `Cooldown updated. Users will now have a ${seconds} second cooldown between XP rewards.`,
            ephemeral: true
          });
          break;
        }
      }
    } catch (error) {
      logger.error('Error executing level-settings command:', error);
      
      await interaction.reply({
        content: `There was an error updating level settings: ${error.message}`,
        ephemeral: true
      });
    }
  }
};