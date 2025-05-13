const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Moderation commands')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand(subcommand =>
      subcommand.setName('kick')
        .setDescription('Kick a member from the server')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to kick')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('The reason for kicking')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('ban')
        .setDescription('Ban a member from the server')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to ban')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('The reason for banning')
            .setRequired(false))
        .addIntegerOption(option =>
          option.setName('days')
            .setDescription('Number of days of messages to delete (0-7)')
            .setMinValue(0)
            .setMaxValue(7)
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
          option.setName('user-id')
            .setDescription('The ID of the user to unban')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('The reason for unbanning')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('timeout')
        .setDescription('Timeout a member')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to timeout')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('duration')
            .setDescription('The duration of the timeout in minutes')
            .setMinValue(1)
            .setMaxValue(40320) // 28 days (maximum Discord allows)
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('The reason for the timeout')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('untimeout')
        .setDescription('Remove timeout from a member')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to remove timeout from')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('The reason for removing the timeout')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('clear')
        .setDescription('Clear messages from a channel')
        .addIntegerOption(option =>
          option.setName('amount')
            .setDescription('Number of messages to delete (1-100)')
            .setMinValue(1)
            .setMaxValue(100)
            .setRequired(true))
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Only delete messages from this user')
            .setRequired(false))),
  
  // Cooldown in seconds
  cooldown: 3,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get subcommand
      const subcommand = interaction.options.getSubcommand();
      
      // Check if user has permissions
      const requiredPermission = getRequiredPermission(subcommand);
      
      if (!interaction.memberPermissions.has(requiredPermission)) {
        return interaction.reply({
          content: `You need the "${formatPermission(requiredPermission)}" permission to use this command.`,
          ephemeral: true
        });
      }
      
      // Check if bot has permissions
      if (!interaction.guild.members.me.permissions.has(requiredPermission)) {
        return interaction.reply({
          content: `I need the "${formatPermission(requiredPermission)}" permission to use this command.`,
          ephemeral: true
        });
      }
      
      // Handle subcommand
      switch (subcommand) {
        case 'kick':
          await handleKick(interaction);
          break;
          
        case 'ban':
          await handleBan(interaction);
          break;
          
        case 'unban':
          await handleUnban(interaction);
          break;
          
        case 'timeout':
          await handleTimeout(interaction);
          break;
          
        case 'untimeout':
          await handleRemoveTimeout(interaction);
          break;
          
        case 'clear':
          await handleClear(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing mod command:', error);
      
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
 * Get required permission for a subcommand
 * @param {string} subcommand - The subcommand
 * @returns {PermissionFlagsBits} The required permission
 */
function getRequiredPermission(subcommand) {
  switch (subcommand) {
    case 'kick':
      return PermissionFlagsBits.KickMembers;
      
    case 'ban':
    case 'unban':
      return PermissionFlagsBits.BanMembers;
      
    case 'timeout':
    case 'untimeout':
      return PermissionFlagsBits.ModerateMembers;
      
    case 'clear':
      return PermissionFlagsBits.ManageMessages;
      
    default:
      return PermissionFlagsBits.ModerateMembers;
  }
}

/**
 * Format a permission flag
 * @param {PermissionFlagsBits} permission - The permission flag
 * @returns {string} The formatted permission name
 */
function formatPermission(permission) {
  const permissionNames = {
    [PermissionFlagsBits.KickMembers]: 'Kick Members',
    [PermissionFlagsBits.BanMembers]: 'Ban Members',
    [PermissionFlagsBits.ModerateMembers]: 'Timeout Members',
    [PermissionFlagsBits.ManageMessages]: 'Manage Messages'
  };
  
  return permissionNames[permission] || 'Unknown Permission';
}

/**
 * Handle kicking a member
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleKick(interaction) {
  try {
    // Get options
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if user is kickable
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    
    if (!member) {
      return interaction.reply({
        content: 'That user is not in this server.',
        ephemeral: true
      });
    }
    
    if (!member.kickable) {
      return interaction.reply({
        content: 'I cannot kick that user. They may have higher permissions than me.',
        ephemeral: true
      });
    }
    
    // Kick the member
    await member.kick(reason);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Member Kicked')
      .setDescription(`${user} has been kicked from the server.`)
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: false },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: false }
      )
      .setTimestamp();
    
    // Send logs to moderation channel if available
    const modLogChannel = findModLogChannel(interaction.guild);
    
    if (modLogChannel) {
      await modLogChannel.send({ embeds: [embed] }).catch(() => null);
    }
    
    // Reply to interaction
    await interaction.reply({
      embeds: [embed]
    });
    
    // Try to DM the user
    try {
      await user.send({
        content: `You have been kicked from ${interaction.guild.name}. Reason: ${reason}`
      });
    } catch (error) {
      logger.warn(`Could not DM user ${user.id}: ${error.message}`);
    }
    
    logger.info(`User ${interaction.user.tag} kicked ${user.tag} from ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error kicking user:', error);
    throw error;
  }
}

/**
 * Handle banning a member
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleBan(interaction) {
  try {
    // Get options
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const days = interaction.options.getInteger('days') || 1;
    
    // Check if user is bannable (if in server)
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    
    if (member && !member.bannable) {
      return interaction.reply({
        content: 'I cannot ban that user. They may have higher permissions than me.',
        ephemeral: true
      });
    }
    
    // Ban the user
    await interaction.guild.members.ban(user, {
      reason,
      deleteMessageSeconds: days * 86400 // Convert days to seconds
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('User Banned')
      .setDescription(`${user} has been banned from the server.`)
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: false },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Message Deletion', value: `${days} day(s)`, inline: false },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: false }
      )
      .setTimestamp();
    
    // Send logs to moderation channel if available
    const modLogChannel = findModLogChannel(interaction.guild);
    
    if (modLogChannel) {
      await modLogChannel.send({ embeds: [embed] }).catch(() => null);
    }
    
    // Reply to interaction
    await interaction.reply({
      embeds: [embed]
    });
    
    // Try to DM the user
    try {
      await user.send({
        content: `You have been banned from ${interaction.guild.name}. Reason: ${reason}`
      });
    } catch (error) {
      logger.warn(`Could not DM user ${user.id}: ${error.message}`);
    }
    
    logger.info(`User ${interaction.user.tag} banned ${user.tag} from ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error banning user:', error);
    throw error;
  }
}

/**
 * Handle unbanning a user
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleUnban(interaction) {
  try {
    // Get options
    const userId = interaction.options.getString('user-id');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if the user ID is valid
    if (!/^\d{17,19}$/.test(userId)) {
      return interaction.reply({
        content: 'That does not appear to be a valid user ID. Please enter the user\'s ID (a sequence of 17-19 digits).',
        ephemeral: true
      });
    }
    
    // Check if the user is banned
    const bans = await interaction.guild.bans.fetch();
    const ban = bans.find(ban => ban.user.id === userId);
    
    if (!ban) {
      return interaction.reply({
        content: 'That user is not banned from this server.',
        ephemeral: true
      });
    }
    
    // Unban the user
    await interaction.guild.members.unban(userId, reason);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('User Unbanned')
      .setDescription(`<@${userId}> has been unbanned from the server.`)
      .addFields(
        { name: 'User ID', value: userId, inline: false },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: false }
      )
      .setTimestamp();
    
    // Send logs to moderation channel if available
    const modLogChannel = findModLogChannel(interaction.guild);
    
    if (modLogChannel) {
      await modLogChannel.send({ embeds: [embed] }).catch(() => null);
    }
    
    // Reply to interaction
    await interaction.reply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} unbanned user ${userId} from ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error unbanning user:', error);
    throw error;
  }
}

/**
 * Handle timing out a member
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleTimeout(interaction) {
  try {
    // Get options
    const user = interaction.options.getUser('user');
    const durationMinutes = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if user exists in server
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    
    if (!member) {
      return interaction.reply({
        content: 'That user is not in this server.',
        ephemeral: true
      });
    }
    
    // Check if user is moderatable
    if (!member.moderatable) {
      return interaction.reply({
        content: 'I cannot timeout that user. They may have higher permissions than me.',
        ephemeral: true
      });
    }
    
    // Apply timeout
    const durationMs = durationMinutes * 60 * 1000; // Convert minutes to milliseconds
    await member.timeout(durationMs, reason);
    
    // Calculate end time
    const endTime = new Date(Date.now() + durationMs);
    const formattedEndTime = `<t:${Math.floor(endTime.getTime() / 1000)}:R>`; // Discord timestamp format
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle('Member Timed Out')
      .setDescription(`${user} has been timed out.`)
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: false },
        { name: 'Duration', value: `${durationMinutes} minute(s) (until ${formattedEndTime})`, inline: false },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: false }
      )
      .setTimestamp();
    
    // Send logs to moderation channel if available
    const modLogChannel = findModLogChannel(interaction.guild);
    
    if (modLogChannel) {
      await modLogChannel.send({ embeds: [embed] }).catch(() => null);
    }
    
    // Reply to interaction
    await interaction.reply({
      embeds: [embed]
    });
    
    // Try to DM the user
    try {
      await user.send({
        content: `You have been timed out in ${interaction.guild.name} for ${durationMinutes} minute(s). Reason: ${reason}`
      });
    } catch (error) {
      logger.warn(`Could not DM user ${user.id}: ${error.message}`);
    }
    
    logger.info(`User ${interaction.user.tag} timed out ${user.tag} in ${interaction.guild.name} for ${durationMinutes} minutes`);
  } catch (error) {
    logger.error('Error timing out user:', error);
    throw error;
  }
}

/**
 * Handle removing timeout from a member
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRemoveTimeout(interaction) {
  try {
    // Get options
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if user exists in server
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    
    if (!member) {
      return interaction.reply({
        content: 'That user is not in this server.',
        ephemeral: true
      });
    }
    
    // Check if user is timed out
    if (!member.communicationDisabledUntil) {
      return interaction.reply({
        content: 'That user is not currently timed out.',
        ephemeral: true
      });
    }
    
    // Check if user is moderatable
    if (!member.moderatable) {
      return interaction.reply({
        content: 'I cannot remove the timeout from that user. They may have higher permissions than me.',
        ephemeral: true
      });
    }
    
    // Remove timeout (setting it to null)
    await member.timeout(null, reason);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Timeout Removed')
      .setDescription(`Timeout has been removed from ${user}.`)
      .addFields(
        { name: 'User', value: `${user.tag} (${user.id})`, inline: false },
        { name: 'Reason', value: reason, inline: false },
        { name: 'Moderator', value: `${interaction.user.tag}`, inline: false }
      )
      .setTimestamp();
    
    // Send logs to moderation channel if available
    const modLogChannel = findModLogChannel(interaction.guild);
    
    if (modLogChannel) {
      await modLogChannel.send({ embeds: [embed] }).catch(() => null);
    }
    
    // Reply to interaction
    await interaction.reply({
      embeds: [embed]
    });
    
    // Try to DM the user
    try {
      await user.send({
        content: `Your timeout in ${interaction.guild.name} has been removed. Reason: ${reason}`
      });
    } catch (error) {
      logger.warn(`Could not DM user ${user.id}: ${error.message}`);
    }
    
    logger.info(`User ${interaction.user.tag} removed timeout from ${user.tag} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error removing timeout from user:', error);
    throw error;
  }
}

/**
 * Handle clearing messages
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleClear(interaction) {
  try {
    // Get options
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');
    
    // Defer reply (this might take a moment)
    await interaction.deferReply({ ephemeral: true });
    
    // Fetch messages
    const messages = await interaction.channel.messages.fetch({ limit: 100 });
    
    // Filter messages
    let messagesToDelete = messages.filter(msg => {
      // Only messages within the last 14 days can be bulk deleted
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      return msg.createdTimestamp > twoWeeksAgo;
    });
    
    // Filter by user if specified
    if (user) {
      messagesToDelete = messagesToDelete.filter(msg => msg.author.id === user.id);
    }
    
    // Limit to requested amount
    messagesToDelete = messagesToDelete.first(amount);
    
    // Check if any messages to delete
    if (messagesToDelete.length === 0) {
      return interaction.editReply({
        content: 'No messages found that can be deleted. Messages must be less than 14 days old.',
        ephemeral: true
      });
    }
    
    // Delete messages
    const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Messages Cleared')
      .setDescription(`Successfully deleted ${deleted.size} message(s).`)
      .setTimestamp();
    
    if (user) {
      embed.addFields({ name: 'User Filter', value: `${user.tag}`, inline: true });
    }
    
    // Reply to interaction
    await interaction.editReply({
      embeds: [embed],
      ephemeral: true
    });
    
    // Log to mod log
    const modLogChannel = findModLogChannel(interaction.guild);
    
    if (modLogChannel) {
      // Create log embed
      const logEmbed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle('Messages Cleared')
        .setDescription(`${interaction.user.tag} cleared ${deleted.size} message(s) in ${interaction.channel}.`)
        .addFields(
          { name: 'Channel', value: `${interaction.channel}`, inline: true },
          { name: 'Amount', value: `${deleted.size}`, inline: true }
        )
        .setTimestamp();
      
      if (user) {
        logEmbed.addFields({ name: 'User Filter', value: `${user.tag} (${user.id})`, inline: true });
      }
      
      await modLogChannel.send({ embeds: [logEmbed] }).catch(() => null);
    }
    
    logger.info(`User ${interaction.user.tag} cleared ${deleted.size} messages in #${interaction.channel.name} (${interaction.guild.name})`);
  } catch (error) {
    logger.error('Error clearing messages:', error);
    
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({
        content: `Error clearing messages: ${error.message}`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `Error clearing messages: ${error.message}`,
        ephemeral: true
      });
    }
  }
}

/**
 * Find the moderation log channel
 * @param {Guild} guild - The guild
 * @returns {TextChannel|null} The moderation log channel or null if not found
 */
function findModLogChannel(guild) {
  // Try common names for moderation log channels
  const commonNames = ['mod-log', 'mod-logs', 'modlog', 'modlogs', 'mod_log', 'mod_logs', 'moderator-log', 'moderator-logs', 'audit-log', 'audit-logs'];
  
  // Find channel by name
  for (const name of commonNames) {
    const channel = guild.channels.cache.find(channel => 
      channel.name.toLowerCase() === name && channel.isTextBased()
    );
    
    if (channel) {
      return channel;
    }
  }
  
  return null;
}