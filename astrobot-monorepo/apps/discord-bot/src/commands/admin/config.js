const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const guildConfigManager = require('../../lib/config/guild-config-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure server-specific bot settings')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand.setName('view')
        .setDescription('View current bot configuration'))
    .addSubcommand(subcommand =>
      subcommand.setName('prefix')
        .setDescription('Set the command prefix for custom commands')
        .addStringOption(option =>
          option.setName('prefix')
            .setDescription('The new command prefix (1-5 characters)')
            .setRequired(true)
            .setMaxLength(5)))
    .addSubcommand(subcommand =>
      subcommand.setName('admin-role')
        .setDescription('Add an admin role that can access all bot commands')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to designate as admin')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('remove-admin')
        .setDescription('Remove an admin role')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to remove from admins')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('mod-role')
        .setDescription('Add a moderator role for the bot')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to designate as moderator')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('remove-mod')
        .setDescription('Remove a moderator role')
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to remove from moderators')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('log-channel')
        .setDescription('Set the log channel for the bot')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to use for logs')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('timezone')
        .setDescription('Set the timezone for scheduled events')
        .addStringOption(option =>
          option.setName('timezone')
            .setDescription('The timezone (e.g., America/New_York, Europe/London, UTC)')
            .setRequired(true)))
    .addSubcommandGroup(group =>
      group.setName('autoresponse')
        .setDescription('Manage automatic responses')
        .addSubcommand(subcommand =>
          subcommand.setName('add')
            .setDescription('Add an automatic response')
            .addStringOption(option =>
              option.setName('trigger')
                .setDescription('The trigger phrase (use * for wildcards)')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('response')
                .setDescription('The response message')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand.setName('remove')
            .setDescription('Remove an automatic response')
            .addStringOption(option =>
              option.setName('trigger')
                .setDescription('The trigger phrase to remove')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand.setName('list')
            .setDescription('List all automatic responses'))),
  
  // Cooldown in seconds
  cooldown: 3,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Check if this is a subcommand group
      const group = interaction.options.getSubcommandGroup(false);
      
      if (group === 'autoresponse') {
        return await handleAutoResponseCommands(interaction);
      }
      
      // Handle regular subcommands
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'view':
          await handleViewConfig(interaction);
          break;
          
        case 'prefix':
          await handleSetPrefix(interaction);
          break;
          
        case 'admin-role':
          await handleAddAdminRole(interaction);
          break;
          
        case 'remove-admin':
          await handleRemoveAdminRole(interaction);
          break;
          
        case 'mod-role':
          await handleAddModRole(interaction);
          break;
          
        case 'remove-mod':
          await handleRemoveModRole(interaction);
          break;
          
        case 'log-channel':
          await handleSetLogChannel(interaction);
          break;
          
        case 'timezone':
          await handleSetTimezone(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing config command:', error);
      
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
 * Handle viewing the configuration
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleViewConfig(interaction) {
  try {
    // Get guild config
    const config = guildConfigManager.getGuildConfig(interaction.guild.id);
    
    // Format admin roles
    const adminRoles = config.adminRoles.map(roleId => {
      const role = interaction.guild.roles.cache.get(roleId);
      return role ? role.toString() : `Unknown Role (${roleId})`;
    });
    
    // Format mod roles
    const modRoles = config.modRoles.map(roleId => {
      const role = interaction.guild.roles.cache.get(roleId);
      return role ? role.toString() : `Unknown Role (${roleId})`;
    });
    
    // Format log channel
    let logChannel = 'Not set';
    if (config.logChannel) {
      const channel = interaction.guild.channels.cache.get(config.logChannel);
      logChannel = channel ? channel.toString() : `Unknown Channel (${config.logChannel})`;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Server Configuration')
      .addFields(
        { name: 'Command Prefix', value: config.prefix, inline: true },
        { name: 'Timezone', value: config.timezone, inline: true },
        { name: 'Log Channel', value: logChannel, inline: true },
        { name: 'Admin Roles', value: adminRoles.length > 0 ? adminRoles.join('\n') : 'None', inline: false },
        { name: 'Moderator Roles', value: modRoles.length > 0 ? modRoles.join('\n') : 'None', inline: false },
        { name: 'Auto Responses', value: `${Object.keys(config.autoResponses || {}).length} configured`, inline: true },
        { name: 'Disabled Commands', value: config.disabledCommands.length > 0 ? config.disabledCommands.join(', ') : 'None', inline: false }
      )
      .setFooter({ text: 'Use /config commands to modify settings' });
    
    // Send reply
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error handling view config:', error);
    throw error;
  }
}

/**
 * Handle setting the command prefix
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSetPrefix(interaction) {
  try {
    // Get options
    const prefix = interaction.options.getString('prefix');
    
    // Set prefix
    await guildConfigManager.setCommandPrefix(interaction.guild.id, prefix);
    
    // Send reply
    await interaction.reply({
      content: `Command prefix has been set to \`${prefix}\``,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} set command prefix to "${prefix}" in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error setting command prefix:', error);
    throw error;
  }
}

/**
 * Handle adding an admin role
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleAddAdminRole(interaction) {
  try {
    // Get options
    const role = interaction.options.getRole('role');
    
    // Check if role is @everyone
    if (role.id === interaction.guild.id) {
      return interaction.reply({
        content: 'Cannot set @everyone as an admin role for security reasons.',
        ephemeral: true
      });
    }
    
    // Get current config
    const config = guildConfigManager.getGuildConfig(interaction.guild.id);
    
    // Check if role is already an admin
    if (config.adminRoles.includes(role.id)) {
      return interaction.reply({
        content: `${role} is already an admin role.`,
        ephemeral: true
      });
    }
    
    // Add to admin roles
    await guildConfigManager.updateGuildConfig(interaction.guild.id, {
      adminRoles: [...config.adminRoles, role.id]
    });
    
    // Send reply
    await interaction.reply({
      content: `${role} has been added as an admin role.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} added ${role.name} as admin role in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error adding admin role:', error);
    throw error;
  }
}

/**
 * Handle removing an admin role
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRemoveAdminRole(interaction) {
  try {
    // Get options
    const role = interaction.options.getRole('role');
    
    // Get current config
    const config = guildConfigManager.getGuildConfig(interaction.guild.id);
    
    // Check if role is an admin
    if (!config.adminRoles.includes(role.id)) {
      return interaction.reply({
        content: `${role} is not an admin role.`,
        ephemeral: true
      });
    }
    
    // Remove from admin roles
    await guildConfigManager.updateGuildConfig(interaction.guild.id, {
      adminRoles: config.adminRoles.filter(id => id !== role.id)
    });
    
    // Send reply
    await interaction.reply({
      content: `${role} has been removed as an admin role.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} removed ${role.name} as admin role in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error removing admin role:', error);
    throw error;
  }
}

/**
 * Handle adding a mod role
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleAddModRole(interaction) {
  try {
    // Get options
    const role = interaction.options.getRole('role');
    
    // Check if role is @everyone
    if (role.id === interaction.guild.id) {
      return interaction.reply({
        content: 'Cannot set @everyone as a mod role for security reasons.',
        ephemeral: true
      });
    }
    
    // Get current config
    const config = guildConfigManager.getGuildConfig(interaction.guild.id);
    
    // Check if role is already a mod
    if (config.modRoles.includes(role.id)) {
      return interaction.reply({
        content: `${role} is already a mod role.`,
        ephemeral: true
      });
    }
    
    // Check if role is an admin
    if (config.adminRoles.includes(role.id)) {
      return interaction.reply({
        content: `${role} is already an admin role, which has higher permissions than mods.`,
        ephemeral: true
      });
    }
    
    // Add to mod roles
    await guildConfigManager.updateGuildConfig(interaction.guild.id, {
      modRoles: [...config.modRoles, role.id]
    });
    
    // Send reply
    await interaction.reply({
      content: `${role} has been added as a mod role.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} added ${role.name} as mod role in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error adding mod role:', error);
    throw error;
  }
}

/**
 * Handle removing a mod role
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRemoveModRole(interaction) {
  try {
    // Get options
    const role = interaction.options.getRole('role');
    
    // Get current config
    const config = guildConfigManager.getGuildConfig(interaction.guild.id);
    
    // Check if role is a mod
    if (!config.modRoles.includes(role.id)) {
      return interaction.reply({
        content: `${role} is not a mod role.`,
        ephemeral: true
      });
    }
    
    // Remove from mod roles
    await guildConfigManager.updateGuildConfig(interaction.guild.id, {
      modRoles: config.modRoles.filter(id => id !== role.id)
    });
    
    // Send reply
    await interaction.reply({
      content: `${role} has been removed as a mod role.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} removed ${role.name} as mod role in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error removing mod role:', error);
    throw error;
  }
}

/**
 * Handle setting the log channel
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSetLogChannel(interaction) {
  try {
    // Get options
    const channel = interaction.options.getChannel('channel');
    
    // Check if channel is a text channel
    if (!channel.isTextBased() || channel.isVoiceBased() || channel.isThread()) {
      return interaction.reply({
        content: 'The log channel must be a text channel.',
        ephemeral: true
      });
    }
    
    // Check bot permissions
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    
    if (!permissions.has(PermissionFlagsBits.SendMessages) ||
        !permissions.has(PermissionFlagsBits.ViewChannel) ||
        !permissions.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.reply({
        content: 'I need permission to send messages, view the channel, and embed links in the log channel.',
        ephemeral: true
      });
    }
    
    // Set log channel
    await guildConfigManager.updateGuildConfig(interaction.guild.id, {
      logChannel: channel.id
    });
    
    // Send reply
    await interaction.reply({
      content: `Log channel has been set to ${channel}.`,
      ephemeral: true
    });
    
    // Send test message to log channel
    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Log Channel Set')
          .setDescription('This channel has been set as the log channel for AstroBot.')
          .setFooter({ text: `Set by ${interaction.user.tag}` })
          .setTimestamp()
      ]
    });
    
    logger.info(`User ${interaction.user.tag} set log channel to ${channel.name} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error setting log channel:', error);
    throw error;
  }
}

/**
 * Handle setting the timezone
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSetTimezone(interaction) {
  try {
    // Get options
    const timezone = interaction.options.getString('timezone');
    
    // Validate timezone
    try {
      // Try to create a date with the timezone to validate it
      Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    } catch (error) {
      return interaction.reply({
        content: `Invalid timezone: ${timezone}. Please use a valid IANA timezone like "America/New_York" or "Europe/London".`,
        ephemeral: true
      });
    }
    
    // Set timezone
    await guildConfigManager.updateGuildConfig(interaction.guild.id, {
      timezone
    });
    
    // Get current time in new timezone
    const timeInZone = new Date().toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    
    // Send reply
    await interaction.reply({
      content: `Timezone has been set to \`${timezone}\`. Current time in this timezone: ${timeInZone}`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} set timezone to "${timezone}" in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error setting timezone:', error);
    throw error;
  }
}

/**
 * Handle auto response commands
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleAutoResponseCommands(interaction) {
  try {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'add':
        await handleAddAutoResponse(interaction);
        break;
        
      case 'remove':
        await handleRemoveAutoResponse(interaction);
        break;
        
      case 'list':
        await handleListAutoResponses(interaction);
        break;
        
      default:
        await interaction.reply({
          content: 'Unknown subcommand.',
          ephemeral: true
        });
    }
  } catch (error) {
    logger.error('Error handling auto response commands:', error);
    throw error;
  }
}

/**
 * Handle adding an auto response
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleAddAutoResponse(interaction) {
  try {
    // Get options
    const trigger = interaction.options.getString('trigger');
    const response = interaction.options.getString('response');
    
    // Validate trigger
    if (trigger.length < 2) {
      return interaction.reply({
        content: 'Trigger must be at least 2 characters long.',
        ephemeral: true
      });
    }
    
    // Add auto response
    await guildConfigManager.addAutoResponse(interaction.guild.id, trigger, response);
    
    // Send reply
    await interaction.reply({
      content: `Auto response has been added. When someone says "${trigger}", I'll respond with "${response}".`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} added auto response for "${trigger}" in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error adding auto response:', error);
    throw error;
  }
}

/**
 * Handle removing an auto response
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRemoveAutoResponse(interaction) {
  try {
    // Get options
    const trigger = interaction.options.getString('trigger');
    
    // Get auto responses
    const autoResponses = guildConfigManager.getAutoResponses(interaction.guild.id);
    
    // Check if trigger exists
    if (!autoResponses[trigger]) {
      return interaction.reply({
        content: `No auto response found for trigger "${trigger}".`,
        ephemeral: true
      });
    }
    
    // Remove auto response
    await guildConfigManager.removeAutoResponse(interaction.guild.id, trigger);
    
    // Send reply
    await interaction.reply({
      content: `Auto response for "${trigger}" has been removed.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} removed auto response for "${trigger}" in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error removing auto response:', error);
    throw error;
  }
}

/**
 * Handle listing auto responses
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListAutoResponses(interaction) {
  try {
    // Get auto responses
    const autoResponses = guildConfigManager.getAutoResponses(interaction.guild.id);
    
    // Check if any auto responses exist
    if (Object.keys(autoResponses).length === 0) {
      return interaction.reply({
        content: 'No auto responses have been set up for this server.',
        ephemeral: true
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Auto Responses')
      .setDescription('The following auto responses are configured for this server:');
    
    // Add auto responses
    for (const [trigger, response] of Object.entries(autoResponses)) {
      embed.addFields({
        name: `Trigger: ${trigger}`,
        value: `Response: ${response}`,
        inline: false
      });
    }
    
    // Send reply
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error listing auto responses:', error);
    throw error;
  }
}