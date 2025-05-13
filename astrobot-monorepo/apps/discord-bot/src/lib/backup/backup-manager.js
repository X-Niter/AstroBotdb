/**
 * Backup Manager
 * Handles server backups (roles, channels, settings, etc.)
 */

const fs = require('fs').promises;
const path = require('path');
const { Collection, EmbedBuilder, PermissionsBitField } = require('discord.js');
const logger = require('../logger');

// Main backup directory
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backups');

// Guild backups (guildId -> Array<Object>)
const guildBackups = new Collection();

// Maximum number of backups per server
const MAX_BACKUPS_PER_GUILD = 10;

/**
 * Initialize the backup manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing backup manager...');
    
    // Ensure backup directory exists
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    
    // Load guild backups
    await loadGuildBackups();
    
    logger.info('Backup manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing backup manager:', error);
    return false;
  }
}

/**
 * Load all guild backups
 * @returns {Promise<void>}
 */
async function loadGuildBackups() {
  try {
    // Clear collection
    guildBackups.clear();
    
    // Get directories in backup folder (each folder is a guild ID)
    const dirs = await fs.readdir(BACKUP_DIR, { withFileTypes: true });
    
    // Process each guild directory
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const guildId = dir.name;
        
        try {
          // Load guild backups
          const backups = await loadBackupsForGuild(guildId);
          guildBackups.set(guildId, backups);
        } catch (guildError) {
          logger.error(`Error loading backups for guild ${guildId}:`, guildError);
        }
      }
    }
    
    logger.debug('Guild backups loaded successfully');
  } catch (error) {
    logger.error('Error loading guild backups:', error);
    throw error;
  }
}

/**
 * Load backups for a specific guild
 * @param {string} guildId - The guild ID
 * @returns {Promise<Array<Object>>} Array of backup metadata
 */
async function loadBackupsForGuild(guildId) {
  const guildDir = path.join(BACKUP_DIR, guildId);
  
  // Ensure guild directory exists
  await fs.mkdir(guildDir, { recursive: true });
  
  // Get files in guild directory
  const files = await fs.readdir(guildDir);
  
  // Filter backup files (*.json)
  const backupFiles = files.filter(file => file.endsWith('.json'));
  
  // Load backup metadata
  const backups = [];
  
  for (const file of backupFiles) {
    try {
      // Read backup file
      const data = await fs.readFile(path.join(guildDir, file), 'utf8');
      
      // Parse JSON
      const backup = JSON.parse(data);
      
      // Add to array
      backups.push({
        id: path.basename(file, '.json'),
        name: backup.name || `Backup ${backups.length + 1}`,
        createdAt: backup.createdAt,
        createdBy: backup.createdBy,
        description: backup.description || '',
        size: data.length,
        statistics: backup.statistics || {}
      });
    } catch (fileError) {
      logger.error(`Error loading backup file ${file} for guild ${guildId}:`, fileError);
    }
  }
  
  // Sort by creation date (newest first)
  backups.sort((a, b) => b.createdAt - a.createdAt);
  
  return backups;
}

/**
 * Create a backup of a guild
 * @param {Guild} guild - The Discord guild
 * @param {Object} options - Backup options
 * @returns {Promise<Object>} The created backup
 */
async function createBackup(guild, options = {}) {
  try {
    logger.info(`Creating backup of guild ${guild.id} (${guild.name})`);
    
    // Generate backup ID
    const backupId = Date.now().toString();
    
    // Statistics counters
    const statistics = {
      roles: 0,
      categories: 0,
      textChannels: 0,
      voiceChannels: 0,
      settings: 0,
      emojis: 0
    };
    
    // Create backup data
    const backupData = {
      id: backupId,
      name: options.name || `Backup ${new Date().toISOString().split('T')[0]}`,
      description: options.description || '',
      createdAt: Date.now(),
      createdBy: options.userId || null,
      guildId: guild.id,
      guildName: guild.name,
      iconURL: guild.iconURL({ dynamic: true }),
      statistics,
      data: {}
    };
    
    // Add general guild settings
    backupData.data.settings = {
      name: guild.name,
      verificationLevel: guild.verificationLevel,
      explicitContentFilter: guild.explicitContentFilter,
      defaultMessageNotifications: guild.defaultMessageNotifications
    };
    statistics.settings = 1;
    
    // Backup roles (excluding @everyone)
    if (options.includeRoles !== false) {
      backupData.data.roles = guild.roles.cache
        .filter(role => role.id !== guild.id) // Filter out @everyone
        .sort((a, b) => b.position - a.position) // Sort by position
        .map(role => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          hoist: role.hoist,
          mentionable: role.mentionable,
          permissions: role.permissions.bitfield.toString(),
          position: role.position
        }));
      
      statistics.roles = backupData.data.roles.length;
    }
    
    // Backup channels
    if (options.includeChannels !== false) {
      // Get all channels
      const allChannels = guild.channels.cache;
      
      // Backup categories
      const categories = allChannels
        .filter(channel => channel.type === 4) // CategoryChannel
        .sort((a, b) => a.position - b.position);
      
      backupData.data.categories = categories.map(category => ({
        id: category.id,
        name: category.name,
        position: category.position,
        permissionOverwrites: Array.from(category.permissionOverwrites.cache.values()).map(overwrite => ({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.bitfield.toString(),
          deny: overwrite.deny.bitfield.toString()
        }))
      }));
      
      statistics.categories = backupData.data.categories.length;
      
      // Backup text channels
      const textChannels = allChannels
        .filter(channel => channel.type === 0 || channel.type === 5) // TextChannel or AnnouncementChannel
        .sort((a, b) => a.position - b.position);
      
      backupData.data.textChannels = textChannels.map(channel => ({
        id: channel.id,
        name: channel.name,
        topic: channel.topic,
        nsfw: channel.nsfw,
        position: channel.position,
        rateLimitPerUser: channel.rateLimitPerUser,
        parentId: channel.parentId,
        permissionOverwrites: Array.from(channel.permissionOverwrites.cache.values()).map(overwrite => ({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.bitfield.toString(),
          deny: overwrite.deny.bitfield.toString()
        }))
      }));
      
      statistics.textChannels = backupData.data.textChannels.length;
      
      // Backup voice channels
      const voiceChannels = allChannels
        .filter(channel => channel.type === 2) // VoiceChannel
        .sort((a, b) => a.position - b.position);
      
      backupData.data.voiceChannels = voiceChannels.map(channel => ({
        id: channel.id,
        name: channel.name,
        position: channel.position,
        bitrate: channel.bitrate,
        userLimit: channel.userLimit,
        parentId: channel.parentId,
        permissionOverwrites: Array.from(channel.permissionOverwrites.cache.values()).map(overwrite => ({
          id: overwrite.id,
          type: overwrite.type,
          allow: overwrite.allow.bitfield.toString(),
          deny: overwrite.deny.bitfield.toString()
        }))
      }));
      
      statistics.voiceChannels = backupData.data.voiceChannels.length;
    }
    
    // Backup emojis
    if (options.includeEmojis !== false) {
      backupData.data.emojis = guild.emojis.cache.map(emoji => ({
        id: emoji.id,
        name: emoji.name,
        url: emoji.url,
        animated: emoji.animated
      }));
      
      statistics.emojis = backupData.data.emojis.length;
    }
    
    // Backup bot-specific settings if requested
    if (options.includeSettings !== false) {
      // TODO: Back up additional bot settings here (custom commands, automod, etc.)
    }
    
    // Save backup to disk
    const guildDir = path.join(BACKUP_DIR, guild.id);
    await fs.mkdir(guildDir, { recursive: true });
    
    const backupPath = path.join(guildDir, `${backupId}.json`);
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
    
    // Update in-memory collection
    let backups = guildBackups.get(guild.id) || [];
    
    // Add new backup
    backups.unshift({
      id: backupId,
      name: backupData.name,
      createdAt: backupData.createdAt,
      createdBy: backupData.createdBy,
      description: backupData.description,
      size: JSON.stringify(backupData).length,
      statistics: backupData.statistics
    });
    
    // Limit to MAX_BACKUPS_PER_GUILD
    if (backups.length > MAX_BACKUPS_PER_GUILD) {
      // Get backup IDs to remove
      const backupsToRemove = backups.slice(MAX_BACKUPS_PER_GUILD);
      
      // Remove extra backup files
      for (const oldBackup of backupsToRemove) {
        const oldBackupPath = path.join(guildDir, `${oldBackup.id}.json`);
        await fs.unlink(oldBackupPath).catch(error => {
          logger.error(`Error deleting old backup ${oldBackup.id}:`, error);
        });
      }
      
      // Update backups array
      backups = backups.slice(0, MAX_BACKUPS_PER_GUILD);
    }
    
    // Update collection
    guildBackups.set(guild.id, backups);
    
    logger.info(`Backup ${backupId} created for guild ${guild.id} (${guild.name})`);
    
    return backupData;
  } catch (error) {
    logger.error(`Error creating backup for guild ${guild.id}:`, error);
    throw error;
  }
}

/**
 * Get backups for a guild
 * @param {string} guildId - The guild ID
 * @returns {Array<Object>} The guild backups
 */
function getGuildBackups(guildId) {
  return guildBackups.get(guildId) || [];
}

/**
 * Get a specific backup
 * @param {string} guildId - The guild ID
 * @param {string} backupId - The backup ID
 * @returns {Promise<Object|null>} The backup data or null if not found
 */
async function getBackup(guildId, backupId) {
  try {
    const backupPath = path.join(BACKUP_DIR, guildId, `${backupId}.json`);
    
    // Check if file exists
    try {
      await fs.access(backupPath);
    } catch (error) {
      return null;
    }
    
    // Read file
    const data = await fs.readFile(backupPath, 'utf8');
    
    // Parse JSON
    return JSON.parse(data);
  } catch (error) {
    logger.error(`Error getting backup ${backupId} for guild ${guildId}:`, error);
    return null;
  }
}

/**
 * Delete a backup
 * @param {string} guildId - The guild ID
 * @param {string} backupId - The backup ID
 * @returns {Promise<boolean>} Whether the backup was deleted
 */
async function deleteBackup(guildId, backupId) {
  try {
    const backupPath = path.join(BACKUP_DIR, guildId, `${backupId}.json`);
    
    // Check if file exists
    try {
      await fs.access(backupPath);
    } catch (error) {
      return false;
    }
    
    // Delete file
    await fs.unlink(backupPath);
    
    // Update in-memory collection
    const backups = guildBackups.get(guildId) || [];
    const updatedBackups = backups.filter(backup => backup.id !== backupId);
    
    guildBackups.set(guildId, updatedBackups);
    
    logger.info(`Backup ${backupId} deleted for guild ${guildId}`);
    
    return true;
  } catch (error) {
    logger.error(`Error deleting backup ${backupId} for guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Restore a backup to a guild
 * @param {Guild} guild - The Discord guild
 * @param {string} backupId - The backup ID
 * @param {Object} options - Restore options
 * @returns {Promise<Object>} The restore result
 */
async function restoreBackup(guild, backupId, options = {}) {
  try {
    // Verify permissions
    if (!guild.members.me.permissions.has(PermissionsBitField.Flags.Administrator)) {
      throw new Error('Bot needs Administrator permission to restore backups');
    }
    
    // Load backup
    const backup = await getBackup(guild.id, backupId);
    
    if (!backup) {
      throw new Error(`Backup ${backupId} not found`);
    }
    
    // Statistics
    const result = {
      roles: { created: 0, updated: 0, failed: 0 },
      categories: { created: 0, updated: 0, failed: 0 },
      textChannels: { created: 0, updated: 0, failed: 0 },
      voiceChannels: { created: 0, updated: 0, failed: 0 },
      settings: { updated: 0, failed: 0 },
      emojis: { created: 0, updated: 0, failed: 0 }
    };
    
    // Update guild settings
    if (options.restoreSettings !== false && backup.data.settings) {
      try {
        if (options.maxRestoreLevel === 'full') {
          await guild.setName(backup.data.settings.name);
          await guild.setVerificationLevel(backup.data.settings.verificationLevel);
          await guild.setExplicitContentFilter(backup.data.settings.explicitContentFilter);
          await guild.setDefaultMessageNotifications(backup.data.settings.defaultMessageNotifications);
        }
        
        result.settings.updated = 1;
      } catch (settingsError) {
        logger.error(`Error restoring settings for guild ${guild.id}:`, settingsError);
        result.settings.failed = 1;
      }
    }
    
    // Restore roles
    if (options.restoreRoles !== false && backup.data.roles) {
      // Get existing roles
      const existingRoles = guild.roles.cache;
      
      // Process each role in backup
      for (const roleData of backup.data.roles) {
        try {
          // Skip managed roles like bot roles
          if (existingRoles.has(roleData.id)) {
            const existingRole = existingRoles.get(roleData.id);
            
            if (existingRole.managed) {
              continue;
            }
          }
          
          // Create or update role
          if (existingRoles.has(roleData.id) && options.updateExisting !== false) {
            // Update existing role
            const existingRole = existingRoles.get(roleData.id);
            
            // Update role properties
            await existingRole.edit({
              name: roleData.name,
              color: roleData.color,
              hoist: roleData.hoist,
              mentionable: roleData.mentionable,
              permissions: BigInt(roleData.permissions)
            });
            
            result.roles.updated++;
          } else if (!existingRoles.has(roleData.id) && options.createMissing !== false) {
            // Create new role
            await guild.roles.create({
              name: roleData.name,
              color: roleData.color,
              hoist: roleData.hoist,
              mentionable: roleData.mentionable,
              permissions: BigInt(roleData.permissions),
              position: roleData.position,
              reason: `Backup Restore: ${backup.id}`
            });
            
            result.roles.created++;
          }
        } catch (roleError) {
          logger.error(`Error restoring role ${roleData.id} (${roleData.name}):`, roleError);
          result.roles.failed++;
        }
      }
    }
    
    // Restore categories
    if (options.restoreChannels !== false && backup.data.categories) {
      // Get existing categories
      const existingCategories = guild.channels.cache.filter(channel => channel.type === 4);
      
      // Process each category in backup
      for (const categoryData of backup.data.categories) {
        try {
          // Convert permission overwrites
          const permissionOverwrites = categoryData.permissionOverwrites.map(overwrite => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: BigInt(overwrite.allow),
            deny: BigInt(overwrite.deny)
          }));
          
          // Create or update category
          if (existingCategories.has(categoryData.id) && options.updateExisting !== false) {
            // Update existing category
            const existingCategory = existingCategories.get(categoryData.id);
            
            // Update category properties
            await existingCategory.edit({
              name: categoryData.name,
              position: categoryData.position,
              permissionOverwrites
            });
            
            result.categories.updated++;
          } else if (!existingCategories.has(categoryData.id) && options.createMissing !== false) {
            // Create new category
            await guild.channels.create({
              name: categoryData.name,
              type: 4, // CategoryChannel
              position: categoryData.position,
              permissionOverwrites,
              reason: `Backup Restore: ${backup.id}`
            });
            
            result.categories.created++;
          }
        } catch (categoryError) {
          logger.error(`Error restoring category ${categoryData.id} (${categoryData.name}):`, categoryError);
          result.categories.failed++;
        }
      }
    }
    
    // Restore text channels
    if (options.restoreChannels !== false && backup.data.textChannels) {
      // Get existing text channels
      const existingTextChannels = guild.channels.cache.filter(channel => 
        channel.type === 0 || channel.type === 5 // TextChannel or AnnouncementChannel
      );
      
      // Process each text channel in backup
      for (const channelData of backup.data.textChannels) {
        try {
          // Convert permission overwrites
          const permissionOverwrites = channelData.permissionOverwrites.map(overwrite => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: BigInt(overwrite.allow),
            deny: BigInt(overwrite.deny)
          }));
          
          // Create or update channel
          if (existingTextChannels.has(channelData.id) && options.updateExisting !== false) {
            // Update existing channel
            const existingChannel = existingTextChannels.get(channelData.id);
            
            // Update channel properties
            await existingChannel.edit({
              name: channelData.name,
              topic: channelData.topic,
              nsfw: channelData.nsfw,
              position: channelData.position,
              rateLimitPerUser: channelData.rateLimitPerUser,
              parentId: channelData.parentId,
              permissionOverwrites
            });
            
            result.textChannels.updated++;
          } else if (!existingTextChannels.has(channelData.id) && options.createMissing !== false) {
            // Create new channel
            await guild.channels.create({
              name: channelData.name,
              type: 0, // TextChannel
              topic: channelData.topic,
              nsfw: channelData.nsfw,
              position: channelData.position,
              rateLimitPerUser: channelData.rateLimitPerUser,
              parent: channelData.parentId,
              permissionOverwrites,
              reason: `Backup Restore: ${backup.id}`
            });
            
            result.textChannels.created++;
          }
        } catch (channelError) {
          logger.error(`Error restoring text channel ${channelData.id} (${channelData.name}):`, channelError);
          result.textChannels.failed++;
        }
      }
    }
    
    // Restore voice channels
    if (options.restoreChannels !== false && backup.data.voiceChannels) {
      // Get existing voice channels
      const existingVoiceChannels = guild.channels.cache.filter(channel => channel.type === 2);
      
      // Process each voice channel in backup
      for (const channelData of backup.data.voiceChannels) {
        try {
          // Convert permission overwrites
          const permissionOverwrites = channelData.permissionOverwrites.map(overwrite => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: BigInt(overwrite.allow),
            deny: BigInt(overwrite.deny)
          }));
          
          // Create or update channel
          if (existingVoiceChannels.has(channelData.id) && options.updateExisting !== false) {
            // Update existing channel
            const existingChannel = existingVoiceChannels.get(channelData.id);
            
            // Update channel properties
            await existingChannel.edit({
              name: channelData.name,
              position: channelData.position,
              bitrate: channelData.bitrate,
              userLimit: channelData.userLimit,
              parentId: channelData.parentId,
              permissionOverwrites
            });
            
            result.voiceChannels.updated++;
          } else if (!existingVoiceChannels.has(channelData.id) && options.createMissing !== false) {
            // Create new channel
            await guild.channels.create({
              name: channelData.name,
              type: 2, // VoiceChannel
              position: channelData.position,
              bitrate: channelData.bitrate,
              userLimit: channelData.userLimit,
              parent: channelData.parentId,
              permissionOverwrites,
              reason: `Backup Restore: ${backup.id}`
            });
            
            result.voiceChannels.created++;
          }
        } catch (channelError) {
          logger.error(`Error restoring voice channel ${channelData.id} (${channelData.name}):`, channelError);
          result.voiceChannels.failed++;
        }
      }
    }
    
    // Restore emojis
    if (options.restoreEmojis !== false && backup.data.emojis) {
      // Get existing emojis
      const existingEmojis = guild.emojis.cache;
      
      // Process each emoji in backup
      for (const emojiData of backup.data.emojis) {
        try {
          // Skip if emoji already exists
          if (existingEmojis.has(emojiData.id)) {
            result.emojis.updated++;
            continue;
          }
          
          // Create emoji
          await guild.emojis.create({
            attachment: emojiData.url,
            name: emojiData.name,
            reason: `Backup Restore: ${backup.id}`
          });
          
          result.emojis.created++;
        } catch (emojiError) {
          logger.error(`Error restoring emoji ${emojiData.id} (${emojiData.name}):`, emojiError);
          result.emojis.failed++;
        }
      }
    }
    
    // Calculate totals
    const totals = {
      created: result.roles.created + result.categories.created + result.textChannels.created + 
               result.voiceChannels.created + result.emojis.created,
      updated: result.roles.updated + result.categories.updated + result.textChannels.updated + 
               result.voiceChannels.updated + result.settings.updated + result.emojis.updated,
      failed: result.roles.failed + result.categories.failed + result.textChannels.failed + 
              result.voiceChannels.failed + result.settings.failed + result.emojis.failed
    };
    
    logger.info(`Backup ${backupId} restored for guild ${guild.id} (${guild.name}). Created: ${totals.created}, Updated: ${totals.updated}, Failed: ${totals.failed}`);
    
    return {
      backup,
      result,
      totals
    };
  } catch (error) {
    logger.error(`Error restoring backup ${backupId} for guild ${guild.id}:`, error);
    throw error;
  }
}

/**
 * Create a backup info embed
 * @param {Object} backup - The backup metadata
 * @param {Guild} guild - The Discord guild
 * @returns {EmbedBuilder} The embed
 */
function createBackupInfoEmbed(backup, guild) {
  // Get creator if available
  let creatorTag = 'Unknown User';
  
  if (backup.createdBy) {
    const creator = guild.client.users.cache.get(backup.createdBy);
    
    if (creator) {
      creatorTag = creator.tag;
    }
  }
  
  // Format size
  const sizeInKB = Math.round(backup.size / 1024);
  const sizeText = sizeInKB > 1024 ? `${(sizeInKB / 1024).toFixed(2)} MB` : `${sizeInKB} KB`;
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`Backup: ${backup.name}`)
    .setDescription(backup.description || '*No description provided*')
    .addFields(
      { name: 'Backup ID', value: backup.id, inline: true },
      { name: 'Created By', value: creatorTag, inline: true },
      { name: 'Created At', value: `<t:${Math.floor(backup.createdAt / 1000)}:F>`, inline: true },
      { name: 'Size', value: sizeText, inline: true }
    );
  
  // Add statistics if available
  if (backup.statistics) {
    const stats = backup.statistics;
    
    let statsText = '';
    
    if (stats.roles) statsText += `Roles: ${stats.roles}\n`;
    if (stats.categories) statsText += `Categories: ${stats.categories}\n`;
    if (stats.textChannels) statsText += `Text Channels: ${stats.textChannels}\n`;
    if (stats.voiceChannels) statsText += `Voice Channels: ${stats.voiceChannels}\n`;
    if (stats.emojis) statsText += `Emojis: ${stats.emojis}\n`;
    
    if (statsText) {
      embed.addFields({ name: 'Contents', value: statsText, inline: false });
    }
  }
  
  return embed;
}

module.exports = {
  initialize,
  createBackup,
  getGuildBackups,
  getBackup,
  deleteBackup,
  restoreBackup,
  createBackupInfoEmbed,
  MAX_BACKUPS_PER_GUILD
};