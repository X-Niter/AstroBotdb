const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const backupManager = require('../../lib/backup/backup-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Manage server backups')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand.setName('create')
        .setDescription('Create a new server backup')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('Name for the backup')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('Description for the backup')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('roles')
            .setDescription('Include roles in the backup')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('channels')
            .setDescription('Include channels in the backup')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('emojis')
            .setDescription('Include emojis in the backup')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List available backups'))
    .addSubcommand(subcommand =>
      subcommand.setName('info')
        .setDescription('View information about a backup')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('The ID of the backup')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('delete')
        .setDescription('Delete a backup')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('The ID of the backup to delete')
            .setRequired(true)
            .setAutocomplete(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('restore')
        .setDescription('Restore a backup')
        .addStringOption(option =>
          option.setName('id')
            .setDescription('The ID of the backup to restore')
            .setRequired(true)
            .setAutocomplete(true))
        .addStringOption(option =>
          option.setName('level')
            .setDescription('How much to restore')
            .setRequired(false)
            .addChoices(
              { name: 'Safe Mode (only add new items)', value: 'safe' },
              { name: 'Standard (add and update)', value: 'standard' },
              { name: 'Full (complete server restore)', value: 'full' }
            ))
        .addBooleanOption(option =>
          option.setName('roles')
            .setDescription('Restore roles')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('channels')
            .setDescription('Restore channels')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('settings')
            .setDescription('Restore server settings')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('emojis')
            .setDescription('Restore emojis')
            .setRequired(false))),
  
  // Cooldown in seconds
  cooldown: 10,
  
  /**
   * Register autocomplete handler for this command
   * @param {AutocompleteInteraction} interaction - The interaction
   */
  async autocomplete(interaction) {
    const focusedOption = interaction.options.getFocused(true);
    
    if (focusedOption.name === 'id') {
      try {
        // Get all backups for this guild
        const backups = backupManager.getGuildBackups(interaction.guildId);
        
        // Filter backups by name or ID
        const filtered = backups.filter(backup => {
          const input = focusedOption.value.toLowerCase();
          return backup.id.includes(input) || 
                 (backup.name && backup.name.toLowerCase().includes(input)) ||
                 (backup.description && backup.description.toLowerCase().includes(input));
        });
        
        // Respond with matches
        await interaction.respond(
          filtered.map(backup => ({
            name: `${backup.name} (${new Date(backup.createdAt).toLocaleDateString()})`,
            value: backup.id
          })).slice(0, 25)
        );
      } catch (error) {
        logger.error('Error handling backup autocomplete:', error);
        
        // Respond with empty array as fallback
        await interaction.respond([]);
      }
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
        case 'create':
          await handleCreateBackup(interaction);
          break;
          
        case 'list':
          await handleListBackups(interaction);
          break;
          
        case 'info':
          await handleBackupInfo(interaction);
          break;
          
        case 'delete':
          await handleDeleteBackup(interaction);
          break;
          
        case 'restore':
          await handleRestoreBackup(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing backup command:', error);
      
      // Handle already replied or deferred
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
};

/**
 * Handle creating a server backup
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleCreateBackup(interaction) {
  try {
    // Get options
    const name = interaction.options.getString('name') || `Backup ${new Date().toLocaleDateString()}`;
    const description = interaction.options.getString('description') || '';
    const includeRoles = interaction.options.getBoolean('roles') ?? true;
    const includeChannels = interaction.options.getBoolean('channels') ?? true;
    const includeEmojis = interaction.options.getBoolean('emojis') ?? true;
    
    // Validate options
    if (!includeRoles && !includeChannels && !includeEmojis) {
      return interaction.reply({
        content: 'You must include at least one element (roles, channels, or emojis) in the backup.',
        ephemeral: true
      });
    }
    
    // Check bot permissions
    const { guild } = interaction;
    
    if (!guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'I need Administrator permission to create backups.',
        ephemeral: true
      });
    }
    
    // Defer the reply as this operation can take time
    await interaction.deferReply();
    
    // Create backup
    const backup = await backupManager.createBackup(guild, {
      name,
      description,
      userId: interaction.user.id,
      includeRoles,
      includeChannels,
      includeEmojis
    });
    
    // Create embed
    const embed = backupManager.createBackupInfoEmbed(backup, guild);
    
    // Add success header
    embed.setTitle('✅ Backup Created');
    embed.setColor('#00FF00');
    
    // Send reply
    await interaction.editReply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} created backup ${backup.id} for ${guild.name}`);
  } catch (error) {
    logger.error('Error creating backup:', error);
    throw error;
  }
}

/**
 * Handle listing backups
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListBackups(interaction) {
  try {
    // Get backups
    const backups = backupManager.getGuildBackups(interaction.guildId);
    
    if (backups.length === 0) {
      return interaction.reply({
        content: 'No backups have been created for this server.',
        ephemeral: true
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Server Backups')
      .setDescription(`This server has ${backups.length} backup(s). You can store up to ${backupManager.MAX_BACKUPS_PER_GUILD} backups.`);
    
    // Add backup entries
    let backupList = '';
    
    for (const backup of backups) {
      const date = new Date(backup.createdAt).toLocaleDateString();
      const time = new Date(backup.createdAt).toLocaleTimeString();
      
      backupList += `**${backup.name}**\n`;
      backupList += `📅 ${date} ${time}\n`;
      backupList += `🆔 \`${backup.id}\`\n\n`;
    }
    
    embed.addFields({ name: 'Available Backups', value: backupList });
    
    // Send reply
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error listing backups:', error);
    throw error;
  }
}

/**
 * Handle backup info
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleBackupInfo(interaction) {
  try {
    // Get options
    const backupId = interaction.options.getString('id');
    
    // Defer reply
    await interaction.deferReply({ ephemeral: true });
    
    // Get backup
    const backup = await backupManager.getBackup(interaction.guildId, backupId);
    
    if (!backup) {
      return interaction.editReply(`Backup with ID \`${backupId}\` not found.`);
    }
    
    // Create embed
    const embed = backupManager.createBackupInfoEmbed({
      ...backup,
      size: JSON.stringify(backup).length
    }, interaction.guild);
    
    // Send reply
    await interaction.editReply({
      embeds: [embed]
    });
  } catch (error) {
    logger.error('Error getting backup info:', error);
    throw error;
  }
}

/**
 * Handle deleting a backup
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleDeleteBackup(interaction) {
  try {
    // Get options
    const backupId = interaction.options.getString('id');
    
    // Check if backup exists
    const allBackups = backupManager.getGuildBackups(interaction.guildId);
    const backup = allBackups.find(b => b.id === backupId);
    
    if (!backup) {
      return interaction.reply({
        content: `Backup with ID \`${backupId}\` not found.`,
        ephemeral: true
      });
    }
    
    // Confirm deletion
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Confirm Backup Deletion')
      .setDescription(`Are you sure you want to delete the backup **${backup.name}** (ID: \`${backup.id}\`)?`)
      .setFooter({ text: 'This action cannot be undone!' });
    
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
    
    // Get confirmation
    const confirmMessage = await interaction.followUp({
      content: 'Please confirm by typing `confirm` within 30 seconds.',
      ephemeral: true
    });
    
    // Create message collector
    const filter = m => m.author.id === interaction.user.id && m.content.toLowerCase() === 'confirm';
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
    
    collector.on('collect', async () => {
      // Delete backup
      const success = await backupManager.deleteBackup(interaction.guildId, backupId);
      
      if (success) {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#00FF00')
              .setTitle('Backup Deleted')
              .setDescription(`Successfully deleted backup **${backup.name}** (ID: \`${backup.id}\`)`)
          ],
          ephemeral: true
        });
        
        await confirmMessage.delete().catch(() => {});
        logger.info(`User ${interaction.user.tag} deleted backup ${backupId} from ${interaction.guild.name}`);
      } else {
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('Error')
              .setDescription(`Failed to delete backup **${backup.name}** (ID: \`${backup.id}\`)`)
          ],
          ephemeral: true
        });
        
        await confirmMessage.delete().catch(() => {});
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('Deletion Cancelled')
              .setDescription('Backup deletion was cancelled due to timeout.')
          ],
          ephemeral: true
        }).catch(() => {});
        
        confirmMessage.delete().catch(() => {});
      }
    });
  } catch (error) {
    logger.error('Error deleting backup:', error);
    throw error;
  }
}

/**
 * Handle restoring a backup
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRestoreBackup(interaction) {
  try {
    // Get options
    const backupId = interaction.options.getString('id');
    const level = interaction.options.getString('level') || 'standard';
    const restoreRoles = interaction.options.getBoolean('roles') ?? true;
    const restoreChannels = interaction.options.getBoolean('channels') ?? true;
    const restoreSettings = interaction.options.getBoolean('settings') ?? (level === 'full');
    const restoreEmojis = interaction.options.getBoolean('emojis') ?? true;
    
    // Get backup
    const allBackups = backupManager.getGuildBackups(interaction.guildId);
    const backup = allBackups.find(b => b.id === backupId);
    
    if (!backup) {
      return interaction.reply({
        content: `Backup with ID \`${backupId}\` not found.`,
        ephemeral: true
      });
    }
    
    // Check bot permissions
    const { guild } = interaction;
    
    if (!guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({
        content: 'I need Administrator permission to restore backups.',
        ephemeral: true
      });
    }
    
    // Display warning
    const warningEmbed = new EmbedBuilder()
      .setColor('#FF9900')
      .setTitle('⚠️ Warning: Backup Restoration')
      .setDescription('Restoring a backup can potentially overwrite or modify server data. Please confirm this action carefully.')
      .addFields(
        { name: 'Backup', value: `${backup.name} (ID: \`${backup.id}\`)`, inline: false },
        { name: 'Restore Level', value: `${level.charAt(0).toUpperCase() + level.slice(1)}`, inline: true },
        { name: 'Include Roles', value: restoreRoles ? 'Yes' : 'No', inline: true },
        { name: 'Include Channels', value: restoreChannels ? 'Yes' : 'No', inline: true },
        { name: 'Include Settings', value: restoreSettings ? 'Yes' : 'No', inline: true },
        { name: 'Include Emojis', value: restoreEmojis ? 'Yes' : 'No', inline: true }
      )
      .setFooter({ text: 'This action cannot be fully undone!' });
    
    await interaction.reply({
      embeds: [warningEmbed],
      ephemeral: true
    });
    
    // Get confirmation
    const confirmMessage = await interaction.followUp({
      content: 'Please confirm by typing `restore` within 30 seconds.',
      ephemeral: true
    });
    
    // Create message collector
    const filter = m => m.author.id === interaction.user.id && m.content.toLowerCase() === 'restore';
    const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
    
    collector.on('collect', async () => {
      // Defer the operation as it can take time
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Restoring Backup')
            .setDescription(`Beginning restoration of backup **${backup.name}**. This may take some time...`)
        ],
        ephemeral: true
      });
      
      await confirmMessage.delete().catch(() => {});
      
      try {
        // Prepare restore options
        const restoreOptions = {
          restoreRoles,
          restoreChannels,
          restoreSettings,
          restoreEmojis,
          maxRestoreLevel: level,
          createMissing: true,
          updateExisting: level !== 'safe'
        };
        
        // Restore backup
        const result = await backupManager.restoreBackup(guild, backupId, restoreOptions);
        
        // Format results
        const stats = result.totals;
        
        const resultEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('✅ Backup Restored')
          .setDescription(`Successfully restored backup **${backup.name}**`)
          .addFields(
            { name: 'Items Created', value: stats.created.toString(), inline: true },
            { name: 'Items Updated', value: stats.updated.toString(), inline: true },
            { name: 'Items Failed', value: stats.failed.toString(), inline: true },
            { name: 'Detailed Results', value: 
              `**Roles:** ${result.result.roles.created} created, ${result.result.roles.updated} updated, ${result.result.roles.failed} failed\n` +
              `**Categories:** ${result.result.categories.created} created, ${result.result.categories.updated} updated, ${result.result.categories.failed} failed\n` +
              `**Text Channels:** ${result.result.textChannels.created} created, ${result.result.textChannels.updated} updated, ${result.result.textChannels.failed} failed\n` +
              `**Voice Channels:** ${result.result.voiceChannels.created} created, ${result.result.voiceChannels.updated} updated, ${result.result.voiceChannels.failed} failed\n` +
              `**Settings:** ${result.result.settings.updated} updated, ${result.result.settings.failed} failed\n` +
              `**Emojis:** ${result.result.emojis.created} created, ${result.result.emojis.updated} updated, ${result.result.emojis.failed} failed`,
              inline: false
            }
          );
        
        // Send results
        await interaction.editReply({
          embeds: [resultEmbed],
          ephemeral: true
        });
        
        logger.info(`User ${interaction.user.tag} restored backup ${backupId} to ${guild.name}`);
      } catch (error) {
        logger.error(`Error restoring backup ${backupId}:`, error);
        
        await interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('Error Restoring Backup')
              .setDescription(`Failed to restore backup: ${error.message}`)
          ],
          ephemeral: true
        });
      }
    });
    
    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('Restore Cancelled')
              .setDescription('Backup restoration was cancelled due to timeout.')
          ],
          ephemeral: true
        }).catch(() => {});
        
        confirmMessage.delete().catch(() => {});
      }
    });
  } catch (error) {
    logger.error('Error in restore backup handler:', error);
    throw error;
  }
}