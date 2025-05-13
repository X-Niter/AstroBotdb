const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const welcomeManager = require('../../lib/welcome/welcome-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Manage welcome and goodbye messages')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand.setName('setup')
        .setDescription('Set up welcome messages')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send welcome messages to')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('message')
            .setDescription('The welcome message (use {user}, {server}, {memberCount})')
            .setRequired(true))
        .addBooleanOption(option =>
          option.setName('embed')
            .setDescription('Whether to use an embed')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('image')
            .setDescription('Whether to use a welcome image')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('goodbye')
        .setDescription('Set up goodbye messages')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send goodbye messages to')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('message')
            .setDescription('The goodbye message (use {user}, {server}, {memberCount})')
            .setRequired(true))
        .addBooleanOption(option =>
          option.setName('embed')
            .setDescription('Whether to use an embed')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('dm')
        .setDescription('Set up welcome DM messages')
        .addStringOption(option =>
          option.setName('message')
            .setDescription('The DM message (use {user}, {server}, {memberCount})')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('autorole')
        .setDescription('Set up automatic role assignment')
        .addRoleOption(option =>
          option.setName('role1')
            .setDescription('Role to automatically assign')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role2')
            .setDescription('Additional role to assign')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('role3')
            .setDescription('Additional role to assign')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('disable')
        .setDescription('Disable welcome or goodbye messages')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('What to disable')
            .setRequired(true)
            .addChoices(
              { name: 'Welcome Messages', value: 'welcome' },
              { name: 'Goodbye Messages', value: 'goodbye' },
              { name: 'Welcome DMs', value: 'dm' },
              { name: 'Auto-Role Assignment', value: 'autorole' },
              { name: 'Everything', value: 'all' }
            )))
    .addSubcommand(subcommand =>
      subcommand.setName('test')
        .setDescription('Test welcome and goodbye messages')
        .addStringOption(option =>
          option.setName('type')
            .setDescription('What to test')
            .setRequired(true)
            .addChoices(
              { name: 'Welcome Message', value: 'welcome' },
              { name: 'Goodbye Message', value: 'goodbye' },
              { name: 'Welcome DM', value: 'dm' }
            )))
    .addSubcommand(subcommand =>
      subcommand.setName('status')
        .setDescription('Show the current welcome settings')),
  
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
      
      switch (subcommand) {
        case 'setup':
          await handleSetupWelcome(interaction);
          break;
          
        case 'goodbye':
          await handleSetupGoodbye(interaction);
          break;
          
        case 'dm':
          await handleSetupDm(interaction);
          break;
          
        case 'autorole':
          await handleSetupAutorole(interaction);
          break;
          
        case 'disable':
          await handleDisable(interaction);
          break;
          
        case 'test':
          await handleTest(client, interaction);
          break;
          
        case 'status':
          await handleStatus(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing welcome command:', error);
      
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
 * Handle setting up welcome messages
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSetupWelcome(interaction) {
  try {
    // Get options
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');
    const useEmbed = interaction.options.getBoolean('embed') || false;
    const useImage = interaction.options.getBoolean('image') || false;
    
    // Validate channel
    if (!channel.isTextBased() || channel.isVoiceBased() || channel.isThread()) {
      return interaction.reply({
        content: 'The channel must be a text channel.',
        ephemeral: true
      });
    }
    
    // Check bot permissions in channel
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    
    if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.reply({
        content: 'I need permission to send messages and embeds in the specified channel.',
        ephemeral: true
      });
    }
    
    // Set up welcome messages
    await welcomeManager.enableWelcome(interaction.guild.id, {
      welcomeChannelId: channel.id,
      welcomeMessage: message,
      welcomeEmbed: useEmbed,
      welcomeImage: useImage
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Welcome Messages Enabled')
      .setDescription(`Welcome messages will be sent to ${channel}.`)
      .addFields(
        { name: 'Message', value: message, inline: false },
        { name: 'Use Embed', value: useEmbed ? 'Yes' : 'No', inline: true },
        { name: 'Use Image', value: useImage ? 'Yes' : 'No', inline: true }
      )
      .setFooter({ text: 'Use /welcome test to see a preview' });
    
    // Send reply
    await interaction.reply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} set up welcome messages in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error setting up welcome messages:', error);
    throw error;
  }
}

/**
 * Handle setting up goodbye messages
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSetupGoodbye(interaction) {
  try {
    // Get options
    const channel = interaction.options.getChannel('channel');
    const message = interaction.options.getString('message');
    const useEmbed = interaction.options.getBoolean('embed') || false;
    
    // Validate channel
    if (!channel.isTextBased() || channel.isVoiceBased() || channel.isThread()) {
      return interaction.reply({
        content: 'The channel must be a text channel.',
        ephemeral: true
      });
    }
    
    // Check bot permissions in channel
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    
    if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.reply({
        content: 'I need permission to send messages and embeds in the specified channel.',
        ephemeral: true
      });
    }
    
    // Set up goodbye messages
    await welcomeManager.enableGoodbye(interaction.guild.id, {
      goodbyeChannelId: channel.id,
      goodbyeMessage: message,
      goodbyeEmbed: useEmbed
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Goodbye Messages Enabled')
      .setDescription(`Goodbye messages will be sent to ${channel}.`)
      .addFields(
        { name: 'Message', value: message, inline: false },
        { name: 'Use Embed', value: useEmbed ? 'Yes' : 'No', inline: true }
      )
      .setFooter({ text: 'Use /welcome test to see a preview' });
    
    // Send reply
    await interaction.reply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} set up goodbye messages in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error setting up goodbye messages:', error);
    throw error;
  }
}

/**
 * Handle setting up welcome DM messages
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSetupDm(interaction) {
  try {
    // Get options
    const message = interaction.options.getString('message');
    
    // Set up DM messages
    await welcomeManager.setDmMessage(interaction.guild.id, true, message);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Welcome DM Messages Enabled')
      .setDescription('New members will receive a DM when they join.')
      .addFields(
        { name: 'Message', value: message, inline: false }
      )
      .setFooter({ text: 'Use /welcome test to see a preview' });
    
    // Send reply
    await interaction.reply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} set up welcome DM messages in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error setting up welcome DM messages:', error);
    throw error;
  }
}

/**
 * Handle setting up auto-roles
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSetupAutorole(interaction) {
  try {
    // Get options
    const role1 = interaction.options.getRole('role1');
    const role2 = interaction.options.getRole('role2');
    const role3 = interaction.options.getRole('role3');
    
    // Collect valid roles
    const roles = [role1, role2, role3].filter(role => 
      role && 
      role.id !== interaction.guild.id && // Filter out @everyone
      !role.managed // Filter out managed roles (e.g., bot roles)
    );
    
    // Check if any valid roles were provided
    if (roles.length === 0) {
      return interaction.reply({
        content: 'No valid roles were provided. Make sure roles are not managed by integrations and are not the @everyone role.',
        ephemeral: true
      });
    }
    
    // Check bot permissions
    const member = await interaction.guild.members.fetch(interaction.client.user.id);
    
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: 'I need the "Manage Roles" permission to assign roles to new members.',
        ephemeral: true
      });
    }
    
    // Check role hierarchy
    const botHighestRole = member.roles.highest;
    
    for (const role of roles) {
      if (role.position >= botHighestRole.position) {
        return interaction.reply({
          content: `I cannot assign the role ${role.name} because it's higher than or equal to my highest role. Please move my role above it.`,
          ephemeral: true
        });
      }
    }
    
    // Set up auto-roles
    await welcomeManager.setJoinRoles(interaction.guild.id, roles.map(role => role.id));
    
    // Format role list
    const roleList = roles.map(role => `<@&${role.id}>`).join(', ');
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Auto-Roles Enabled')
      .setDescription('New members will automatically receive the following roles:')
      .addFields(
        { name: 'Roles', value: roleList, inline: false }
      );
    
    // Send reply
    await interaction.reply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} set up auto-roles in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error setting up auto-roles:', error);
    throw error;
  }
}

/**
 * Handle disabling welcome features
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleDisable(interaction) {
  try {
    // Get options
    const type = interaction.options.getString('type');
    
    // Get current settings
    const settings = welcomeManager.getGuildSettings(interaction.guild.id);
    
    // Disable based on type
    switch (type) {
      case 'welcome':
        await welcomeManager.disableWelcome(interaction.guild.id);
        break;
        
      case 'goodbye':
        await welcomeManager.disableGoodbye(interaction.guild.id);
        break;
        
      case 'dm':
        await welcomeManager.setDmMessage(interaction.guild.id, false, settings.dmMessage);
        break;
        
      case 'autorole':
        await welcomeManager.setJoinRoles(interaction.guild.id, []);
        break;
        
      case 'all':
        await welcomeManager.disableWelcome(interaction.guild.id);
        await welcomeManager.disableGoodbye(interaction.guild.id);
        await welcomeManager.setDmMessage(interaction.guild.id, false, settings.dmMessage);
        await welcomeManager.setJoinRoles(interaction.guild.id, []);
        break;
        
      default:
        return interaction.reply({
          content: 'Invalid type specified.',
          ephemeral: true
        });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Feature Disabled')
      .setDescription(`Successfully disabled ${type === 'all' ? 'all welcome features' : `${type} messages/features`}.`);
    
    // Send reply
    await interaction.reply({
      embeds: [embed]
    });
    
    logger.info(`User ${interaction.user.tag} disabled ${type} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error disabling welcome features:', error);
    throw error;
  }
}

/**
 * Handle testing welcome features
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleTest(client, interaction) {
  try {
    // Get options
    const type = interaction.options.getString('type');
    
    // Get current settings
    const settings = welcomeManager.getGuildSettings(interaction.guild.id);
    
    // Check if enabled
    if (!settings.enabled) {
      return interaction.reply({
        content: 'Welcome system is not enabled. Use `/welcome setup` to enable it.',
        ephemeral: true
      });
    }
    
    // Test based on type
    switch (type) {
      case 'welcome':
        if (!settings.welcomeEnabled) {
          return interaction.reply({
            content: 'Welcome messages are not enabled. Use `/welcome setup` to enable them.',
            ephemeral: true
          });
        }
        
        // Defer reply
        await interaction.deferReply();
        
        // Get welcome channel
        const welcomeChannel = await interaction.guild.channels.fetch(settings.welcomeChannelId);
        
        if (!welcomeChannel || !welcomeChannel.isTextBased()) {
          return interaction.editReply('Welcome channel not found or not text-based.');
        }
        
        // Format message (for display only)
        const welcomeMessage = formatMessage(settings.welcomeMessage, {
          user: interaction.user.toString(),
          username: interaction.user.username,
          tag: interaction.user.tag,
          server: interaction.guild.name,
          memberCount: interaction.guild.memberCount
        });
        
        // Create embed
        const welcomeEmbed = new EmbedBuilder()
          .setColor('#00FF00')
          .setTitle('Welcome Message Test')
          .setDescription(`This is a test of your welcome message. It will appear in ${welcomeChannel}.`)
          .addFields(
            { name: 'Message Preview', value: welcomeMessage, inline: false }
          );
        
        // Send a test welcome message
        await welcomeManager.handleMemberJoin(await interaction.guild.members.fetch(interaction.user.id));
        
        // Edit reply
        await interaction.editReply({
          embeds: [welcomeEmbed]
        });
        break;
        
      case 'goodbye':
        if (!settings.goodbyeEnabled) {
          return interaction.reply({
            content: 'Goodbye messages are not enabled. Use `/welcome goodbye` to enable them.',
            ephemeral: true
          });
        }
        
        // Defer reply
        await interaction.deferReply();
        
        // Get goodbye channel
        const goodbyeChannel = await interaction.guild.channels.fetch(settings.goodbyeChannelId);
        
        if (!goodbyeChannel || !goodbyeChannel.isTextBased()) {
          return interaction.editReply('Goodbye channel not found or not text-based.');
        }
        
        // Format message (for display only)
        const goodbyeMessage = formatMessage(settings.goodbyeMessage, {
          user: interaction.user.username, // Cannot mention in goodbye messages
          username: interaction.user.username,
          tag: interaction.user.tag,
          server: interaction.guild.name,
          memberCount: interaction.guild.memberCount
        });
        
        // Create embed
        const goodbyeEmbed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Goodbye Message Test')
          .setDescription(`This is a test of your goodbye message. It will appear in ${goodbyeChannel}.`)
          .addFields(
            { name: 'Message Preview', value: goodbyeMessage, inline: false }
          );
        
        // Send a test goodbye message
        await welcomeManager.handleMemberLeave(await interaction.guild.members.fetch(interaction.user.id));
        
        // Edit reply
        await interaction.editReply({
          embeds: [goodbyeEmbed]
        });
        break;
        
      case 'dm':
        if (!settings.dmEnabled) {
          return interaction.reply({
            content: 'Welcome DMs are not enabled. Use `/welcome dm` to enable them.',
            ephemeral: true
          });
        }
        
        // Format message (for display only)
        const dmMessage = formatMessage(settings.dmMessage, {
          user: interaction.user.username,
          username: interaction.user.username,
          tag: interaction.user.tag,
          server: interaction.guild.name,
          memberCount: interaction.guild.memberCount
        });
        
        // Create embed
        const dmEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('Welcome DM Test')
          .setDescription('I\'ve sent you a test DM. Please check your direct messages.')
          .addFields(
            { name: 'Message Preview', value: dmMessage, inline: false }
          );
        
        // Send a test DM
        await welcomeManager.sendDmMessage(await interaction.guild.members.fetch(interaction.user.id));
        
        // Send reply
        await interaction.reply({
          embeds: [dmEmbed]
        });
        break;
        
      default:
        return interaction.reply({
          content: 'Invalid type specified.',
          ephemeral: true
        });
    }
    
    logger.info(`User ${interaction.user.tag} tested ${type} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error testing welcome features:', error);
    throw error;
  }
}

/**
 * Handle showing welcome status
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleStatus(interaction) {
  try {
    // Get settings
    const settings = welcomeManager.getGuildSettings(interaction.guild.id);
    
    // Create description
    let description = '';
    
    if (!settings.enabled) {
      description = 'Welcome system is currently disabled. Use `/welcome setup` to enable it.';
    } else {
      description = 'Welcome system is currently enabled with the following settings:';
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Welcome System Status')
      .setDescription(description);
    
    // Add welcome fields
    if (settings.welcomeEnabled) {
      const welcomeChannel = await interaction.guild.channels.fetch(settings.welcomeChannelId).catch(() => null);
      
      embed.addFields(
        { name: '🔹 Welcome Messages', value: 'Enabled', inline: true },
        { name: 'Channel', value: welcomeChannel ? welcomeChannel.toString() : 'Unknown Channel', inline: true },
        { name: 'Style', value: settings.welcomeEmbed ? 'Embed' : (settings.welcomeImage ? 'Image' : 'Text'), inline: true },
        { name: 'Message', value: truncateString(settings.welcomeMessage, 1024), inline: false }
      );
    } else {
      embed.addFields(
        { name: '🔸 Welcome Messages', value: 'Disabled', inline: false }
      );
    }
    
    // Add goodbye fields
    if (settings.goodbyeEnabled) {
      const goodbyeChannel = await interaction.guild.channels.fetch(settings.goodbyeChannelId).catch(() => null);
      
      embed.addFields(
        { name: '🔹 Goodbye Messages', value: 'Enabled', inline: true },
        { name: 'Channel', value: goodbyeChannel ? goodbyeChannel.toString() : 'Unknown Channel', inline: true },
        { name: 'Style', value: settings.goodbyeEmbed ? 'Embed' : 'Text', inline: true },
        { name: 'Message', value: truncateString(settings.goodbyeMessage, 1024), inline: false }
      );
    } else {
      embed.addFields(
        { name: '🔸 Goodbye Messages', value: 'Disabled', inline: false }
      );
    }
    
    // Add DM fields
    if (settings.dmEnabled) {
      embed.addFields(
        { name: '🔹 Welcome DMs', value: 'Enabled', inline: false },
        { name: 'Message', value: truncateString(settings.dmMessage, 1024), inline: false }
      );
    } else {
      embed.addFields(
        { name: '🔸 Welcome DMs', value: 'Disabled', inline: false }
      );
    }
    
    // Add auto-role fields
    if (settings.joinRoleIds && settings.joinRoleIds.length > 0) {
      const roleList = [];
      
      for (const roleId of settings.joinRoleIds) {
        const role = await interaction.guild.roles.fetch(roleId).catch(() => null);
        
        if (role) {
          roleList.push(`<@&${role.id}>`);
        }
      }
      
      embed.addFields(
        { name: '🔹 Auto-Roles', value: 'Enabled', inline: false },
        { name: 'Roles', value: roleList.length > 0 ? roleList.join(', ') : 'No valid roles', inline: false }
      );
    } else {
      embed.addFields(
        { name: '🔸 Auto-Roles', value: 'Disabled', inline: false }
      );
    }
    
    // Send reply
    await interaction.reply({
      embeds: [embed]
    });
  } catch (error) {
    logger.error('Error showing welcome status:', error);
    throw error;
  }
}

/**
 * Format a message with variables for display only
 * @param {string} message - The message to format
 * @param {Object} vars - The variables to replace
 * @returns {string} The formatted message
 */
function formatMessage(message, vars) {
  // Replace all variables in the message
  let formattedMessage = message;
  
  for (const [key, value] of Object.entries(vars)) {
    formattedMessage = formattedMessage.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  
  return formattedMessage;
}

/**
 * Truncate a string if it's too long
 * @param {string} str - The string to truncate
 * @param {number} maxLength - The maximum length
 * @returns {string} The truncated string
 */
function truncateString(str, maxLength) {
  if (str.length <= maxLength) {
    return str;
  }
  
  return str.substring(0, maxLength - 3) + '...';
}