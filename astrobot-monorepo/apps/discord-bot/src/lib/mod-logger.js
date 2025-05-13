const { EmbedBuilder, AuditLogEvent } = require('discord.js');
const logger = require('./logger');

// Cache for moderation log channels by guild
const logChannelCache = new Map();

/**
 * Get the moderation log channel for a guild
 * @param {Guild} guild - The guild to get the log channel for
 * @returns {TextChannel|null} The log channel or null if not set
 */
async function getLogChannel(guild) {
  // Check cache first
  if (logChannelCache.has(guild.id)) {
    const channelId = logChannelCache.get(guild.id);
    return guild.channels.cache.get(channelId) || null;
  }
  
  try {
    // Try to find a channel named mod-logs, modlogs, mod-log, or audit-log
    const logChannel = guild.channels.cache.find(channel => 
      channel.type === 0 && // Text channel
      (/^(mod-logs|modlogs|mod-log|audit-log|logs|astrobot-logs)$/i).test(channel.name)
    );
    
    if (logChannel) {
      // Cache the channel ID
      logChannelCache.set(guild.id, logChannel.id);
      return logChannel;
    }
    
    // No log channel found
    return null;
  } catch (error) {
    logger.error(`Error getting log channel for guild ${guild.id}:`, error);
    return null;
  }
}

/**
 * Log a moderation action to the guild's log channel
 * @param {Guild} guild - The guild to log in
 * @param {EmbedBuilder} embed - The embed to send
 */
async function logAction(guild, embed) {
  try {
    const logChannel = await getLogChannel(guild);
    
    if (logChannel) {
      await logChannel.send({ embeds: [embed] });
    }
  } catch (error) {
    logger.error(`Error logging action in guild ${guild.id}:`, error);
  }
}

/**
 * Log a member join event
 * @param {GuildMember} member - The member who joined
 */
async function logMemberJoin(member) {
  const { user, guild, joinedTimestamp } = member;
  
  // Create account age string
  const createdTimestamp = user.createdTimestamp;
  const accountAge = Math.floor((joinedTimestamp - createdTimestamp) / 86400000); // Convert to days
  
  const embed = new EmbedBuilder()
    .setColor('#57F287')
    .setAuthor({
      name: `${user.tag} joined`,
      iconURL: user.displayAvatarURL({ dynamic: true })
    })
    .setDescription(`<@${user.id}> ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
    .addFields(
      { name: 'User ID', value: user.id, inline: true },
      { name: 'Account Created', value: `<t:${Math.floor(createdTimestamp / 1000)}:R>`, inline: true },
      { name: 'Account Age', value: `${accountAge} days`, inline: true }
    )
    .setFooter({ text: `Member #${guild.memberCount}` })
    .setTimestamp();
  
  await logAction(guild, embed);
}

/**
 * Log a member leave event
 * @param {GuildMember} member - The member who left
 */
async function logMemberLeave(member) {
  const { user, guild, joinedTimestamp } = member;
  
  // Calculate how long the user was in the server
  const timeInServer = Math.floor((Date.now() - joinedTimestamp) / 86400000); // Convert to days
  
  const embed = new EmbedBuilder()
    .setColor('#ED4245')
    .setAuthor({
      name: `${user.tag} left`,
      iconURL: user.displayAvatarURL({ dynamic: true })
    })
    .setDescription(`<@${user.id}> ${user.tag}`)
    .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
    .addFields(
      { name: 'User ID', value: user.id, inline: true },
      { name: 'Joined Server', value: `<t:${Math.floor(joinedTimestamp / 1000)}:R>`, inline: true },
      { name: 'Time in Server', value: `${timeInServer} days`, inline: true }
    )
    .setFooter({ text: `Member count: ${guild.memberCount}` })
    .setTimestamp();
  
  await logAction(guild, embed);
}

/**
 * Log a ban event
 * @param {Guild} guild - The guild where the ban occurred
 * @param {User} user - The user who was banned
 */
async function logBan(guild, user) {
  try {
    // Try to fetch audit logs to get ban reason
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberBanAdd,
      limit: 1
    });
    
    const banLog = auditLogs.entries.first();
    const reason = banLog?.reason || 'No reason provided';
    const moderator = banLog?.executor;
    
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setAuthor({
        name: `${user.tag} was banned`,
        iconURL: user.displayAvatarURL({ dynamic: true })
      })
      .setDescription(`<@${user.id}> ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: 'User ID', value: user.id, inline: true },
        { 
          name: 'Moderator', 
          value: moderator ? `<@${moderator.id}> (${moderator.tag})` : 'Unknown', 
          inline: true 
        },
        { name: 'Reason', value: reason }
      )
      .setTimestamp();
    
    await logAction(guild, embed);
  } catch (error) {
    logger.error(`Error logging ban in guild ${guild.id}:`, error);
  }
}

/**
 * Log an unban event
 * @param {Guild} guild - The guild where the unban occurred
 * @param {User} user - The user who was unbanned
 */
async function logUnban(guild, user) {
  try {
    // Try to fetch audit logs to get unban reason
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberBanRemove,
      limit: 1
    });
    
    const unbanLog = auditLogs.entries.first();
    const moderator = unbanLog?.executor;
    
    const embed = new EmbedBuilder()
      .setColor('#2ECC71')
      .setAuthor({
        name: `${user.tag} was unbanned`,
        iconURL: user.displayAvatarURL({ dynamic: true })
      })
      .setDescription(`<@${user.id}> ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: 'User ID', value: user.id, inline: true },
        { 
          name: 'Moderator', 
          value: moderator ? `<@${moderator.id}> (${moderator.tag})` : 'Unknown', 
          inline: true 
        }
      )
      .setTimestamp();
    
    await logAction(guild, embed);
  } catch (error) {
    logger.error(`Error logging unban in guild ${guild.id}:`, error);
  }
}

/**
 * Log a role change event
 * @param {GuildMember} member - The member whose roles changed
 * @param {Collection<string, Role>} oldRoles - The member's previous roles
 */
async function logRoleChange(member, oldRoles) {
  try {
    const { user, guild, roles } = member;
    
    // Find added roles
    const addedRoles = roles.cache.filter(role => !oldRoles.has(role.id));
    
    // Find removed roles
    const removedRoles = oldRoles.filter(role => !roles.cache.has(role.id));
    
    // If no roles were changed, don't log
    if (addedRoles.size === 0 && removedRoles.size === 0) {
      return;
    }
    
    // Try to fetch audit logs to get role change info
    const auditLogs = await guild.fetchAuditLogs({
      type: AuditLogEvent.MemberRoleUpdate,
      limit: 5
    });
    
    // Find the matching audit log entry
    const roleLog = auditLogs.entries.find(entry => 
      entry.target.id === user.id &&
      Date.now() - entry.createdTimestamp < 10000 // Within last 10 seconds
    );
    
    const moderator = roleLog?.executor;
    
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setAuthor({
        name: `${user.tag}'s roles were updated`,
        iconURL: user.displayAvatarURL({ dynamic: true })
      })
      .setDescription(`<@${user.id}> ${user.tag}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields({ name: 'User ID', value: user.id, inline: true });
    
    // Add moderator field if available
    if (moderator) {
      embed.addFields({
        name: 'Updated By',
        value: `<@${moderator.id}> (${moderator.tag})`,
        inline: true
      });
    }
    
    // Add added roles
    if (addedRoles.size > 0) {
      embed.addFields({
        name: 'Added Roles',
        value: addedRoles.map(role => `<@&${role.id}>`).join(', ')
      });
    }
    
    // Add removed roles
    if (removedRoles.size > 0) {
      embed.addFields({
        name: 'Removed Roles',
        value: removedRoles.map(role => `<@&${role.id}>`).join(', ')
      });
    }
    
    embed.setTimestamp();
    
    await logAction(guild, embed);
  } catch (error) {
    logger.error(`Error logging role change for user ${member.id} in guild ${member.guild.id}:`, error);
  }
}

module.exports = {
  logMemberJoin,
  logMemberLeave,
  logBan,
  logUnban,
  logRoleChange
};