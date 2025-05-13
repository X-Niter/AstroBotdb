const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const levelManager = require('../../lib/levels/level-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('level')
    .setDescription('View and manage server levels')
    .addSubcommand(subcommand =>
      subcommand.setName('rank')
        .setDescription('View your level rank')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The user to view rank for (defaults to yourself)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('leaderboard')
        .setDescription('View the server leaderboard'))
    .addSubcommandGroup(group =>
      group.setName('admin')
        .setDescription('Level system administration')
        .addSubcommand(subcommand =>
          subcommand.setName('settings')
            .setDescription('View or update level system settings')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addBooleanOption(option =>
              option.setName('enabled')
                .setDescription('Enable or disable the level system')
                .setRequired(false))
            .addIntegerOption(option =>
              option.setName('min-xp')
                .setDescription('Minimum XP gained per message')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(false))
            .addIntegerOption(option =>
              option.setName('max-xp')
                .setDescription('Maximum XP gained per message')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(false))
            .addIntegerOption(option =>
              option.setName('cooldown')
                .setDescription('Cooldown between XP gains in seconds')
                .setMinValue(5)
                .setMaxValue(300)
                .setRequired(false))
            .addBooleanOption(option =>
              option.setName('announce')
                .setDescription('Announce level ups')
                .setRequired(false))
            .addChannelOption(option =>
              option.setName('channel')
                .setDescription('Channel for level up announcements (null = same channel)')
                .setRequired(false)))
        .addSubcommand(subcommand =>
          subcommand.setName('set')
            .setDescription('Set a user\'s level and XP')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addUserOption(option =>
              option.setName('user')
                .setDescription('The user to update')
                .setRequired(true))
            .addIntegerOption(option =>
              option.setName('level')
                .setDescription('The new level')
                .setMinValue(0)
                .setMaxValue(1000)
                .setRequired(true))
            .addIntegerOption(option =>
              option.setName('xp')
                .setDescription('The new XP (defaults to 0)')
                .setMinValue(0)
                .setRequired(false)))
        .addSubcommand(subcommand =>
          subcommand.setName('rewards')
            .setDescription('View role rewards')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild))
        .addSubcommand(subcommand =>
          subcommand.setName('add-reward')
            .setDescription('Add a role reward')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addIntegerOption(option =>
              option.setName('level')
                .setDescription('The level to award the role at')
                .setMinValue(1)
                .setMaxValue(1000)
                .setRequired(true))
            .addRoleOption(option =>
              option.setName('role')
                .setDescription('The role to award')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand.setName('remove-reward')
            .setDescription('Remove a role reward')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addIntegerOption(option =>
              option.setName('level')
                .setDescription('The level to remove the reward from')
                .setMinValue(1)
                .setMaxValue(1000)
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand.setName('exclude-channel')
            .setDescription('Exclude a channel from XP gain')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addChannelOption(option =>
              option.setName('channel')
                .setDescription('The channel to exclude')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand.setName('include-channel')
            .setDescription('Include a previously excluded channel')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addChannelOption(option =>
              option.setName('channel')
                .setDescription('The channel to include')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand.setName('exclude-role')
            .setDescription('Exclude a role from XP gain')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addRoleOption(option =>
              option.setName('role')
                .setDescription('The role to exclude')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand.setName('include-role')
            .setDescription('Include a previously excluded role')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
            .addRoleOption(option =>
              option.setName('role')
                .setDescription('The role to include')
                .setRequired(true)))),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Check if this is a subcommand group
      if (interaction.options.getSubcommandGroup(false)) {
        await handleAdminCommands(interaction);
        return;
      }
      
      // Handle user-level commands
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'rank':
          await handleRankCommand(interaction);
          break;
          
        case 'leaderboard':
          await handleLeaderboardCommand(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing level command:', error);
      
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
 * Handle admin commands
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleAdminCommands(interaction) {
  try {
    const subcommand = interaction.options.getSubcommand();
    
    switch (subcommand) {
      case 'settings':
        await handleSettingsCommand(interaction);
        break;
        
      case 'set':
        await handleSetCommand(interaction);
        break;
        
      case 'rewards':
        await handleRewardsCommand(interaction);
        break;
        
      case 'add-reward':
        await handleAddRewardCommand(interaction);
        break;
        
      case 'remove-reward':
        await handleRemoveRewardCommand(interaction);
        break;
        
      case 'exclude-channel':
        await handleExcludeChannelCommand(interaction);
        break;
        
      case 'include-channel':
        await handleIncludeChannelCommand(interaction);
        break;
        
      case 'exclude-role':
        await handleExcludeRoleCommand(interaction);
        break;
        
      case 'include-role':
        await handleIncludeRoleCommand(interaction);
        break;
        
      default:
        await interaction.reply({
          content: 'Unknown subcommand.',
          ephemeral: true
        });
    }
  } catch (error) {
    logger.error('Error handling admin level commands:', error);
    throw error;
  }
}

/**
 * Handle the rank command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRankCommand(interaction) {
  try {
    // Get options
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    // Check if target user is a bot
    if (targetUser.bot) {
      return interaction.reply({
        content: 'Bots do not have levels.',
        ephemeral: true
      });
    }
    
    // Get member
    const member = await interaction.guild.members.fetch(targetUser.id);
    
    // Defer reply as image generation might take a while
    await interaction.deferReply();
    
    // Create rank card
    const attachment = await levelManager.createRankCard(member);
    
    // Send reply
    await interaction.editReply({
      files: [attachment]
    });
  } catch (error) {
    logger.error('Error handling rank command:', error);
    throw error;
  }
}

/**
 * Handle the leaderboard command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleLeaderboardCommand(interaction) {
  try {
    // Defer reply as image generation might take a while
    await interaction.deferReply();
    
    // Create leaderboard
    const attachment = await levelManager.createLeaderboard(interaction.guild);
    
    // Send reply
    await interaction.editReply({
      files: [attachment]
    });
  } catch (error) {
    logger.error('Error handling leaderboard command:', error);
    
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

/**
 * Handle the settings command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSettingsCommand(interaction) {
  try {
    // Get options
    const enabled = interaction.options.getBoolean('enabled');
    const minXp = interaction.options.getInteger('min-xp');
    const maxXp = interaction.options.getInteger('max-xp');
    const cooldown = interaction.options.getInteger('cooldown');
    const announce = interaction.options.getBoolean('announce');
    const channel = interaction.options.getChannel('channel');
    
    // Get current settings
    let settings = levelManager.getGuildSettings(interaction.guild.id);
    
    // Check if we are updating settings
    if (enabled !== null || minXp !== null || maxXp !== null || cooldown !== null || announce !== null || channel !== null) {
      // Build new settings
      const newSettings = {};
      
      if (enabled !== null) {
        newSettings.enabled = enabled;
      }
      
      if (minXp !== null) {
        newSettings.xpGainMin = minXp;
      }
      
      if (maxXp !== null) {
        newSettings.xpGainMax = maxXp || minXp; // If maxXp is 0, use minXp
      }
      
      if (cooldown !== null) {
        newSettings.xpCooldown = cooldown;
      }
      
      if (announce !== null) {
        newSettings.announceLevelUp = announce;
      }
      
      if (channel !== null) {
        if (channel.isTextBased() && !channel.isVoiceBased() && !channel.isThread()) {
          newSettings.announcementChannel = channel.id;
        } else {
          return interaction.reply({
            content: 'The channel must be a text channel.',
            ephemeral: true
          });
        }
      }
      
      // Validate min/max xp
      if (minXp !== null && maxXp !== null && minXp > maxXp) {
        return interaction.reply({
          content: 'Minimum XP cannot be greater than maximum XP.',
          ephemeral: true
        });
      }
      
      // Update settings
      settings = await levelManager.updateGuildSettings(interaction.guild.id, newSettings);
      
      // Send success message
      await interaction.reply(`Level system settings updated successfully.`);
    } else {
      // Display current settings
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Level System Settings')
        .addFields(
          { name: 'Status', value: settings.enabled ? 'Enabled' : 'Disabled', inline: true },
          { name: 'XP Range', value: `${settings.xpGainMin} - ${settings.xpGainMax} per message`, inline: true },
          { name: 'Cooldown', value: `${settings.xpCooldown} seconds`, inline: true },
          { name: 'Announce Level Ups', value: settings.announceLevelUp ? 'Yes' : 'No', inline: true }
        );
      
      // Add announcement channel if set
      if (settings.announcementChannel) {
        const channel = interaction.guild.channels.cache.get(settings.announcementChannel);
        const channelName = channel ? channel.toString() : 'Unknown Channel';
        
        embed.addFields({ name: 'Announcement Channel', value: channelName, inline: true });
      } else {
        embed.addFields({ name: 'Announcement Channel', value: 'Same channel as message', inline: true });
      }
      
      // Add excluded channels
      if (settings.excludedChannels.length > 0) {
        const channelList = settings.excludedChannels
          .map(id => {
            const channel = interaction.guild.channels.cache.get(id);
            return channel ? channel.toString() : `Unknown Channel (${id})`;
          })
          .join('\n');
        
        embed.addFields({ name: 'Excluded Channels', value: channelList, inline: false });
      }
      
      // Add excluded roles
      if (settings.excludedRoles.length > 0) {
        const roleList = settings.excludedRoles
          .map(id => {
            const role = interaction.guild.roles.cache.get(id);
            return role ? role.toString() : `Unknown Role (${id})`;
          })
          .join('\n');
        
        embed.addFields({ name: 'Excluded Roles', value: roleList, inline: false });
      }
      
      // Send reply
      await interaction.reply({ embeds: [embed] });
    }
  } catch (error) {
    logger.error('Error handling settings command:', error);
    throw error;
  }
}

/**
 * Handle the set command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleSetCommand(interaction) {
  try {
    // Get options
    const user = interaction.options.getUser('user');
    const level = interaction.options.getInteger('level');
    const xp = interaction.options.getInteger('xp') || 0;
    
    // Check if target user is a bot
    if (user.bot) {
      return interaction.reply({
        content: 'Bots cannot have levels.',
        ephemeral: true
      });
    }
    
    // Set user level
    await levelManager.setUserXp(interaction.guild.id, user.id, xp, level);
    
    // Send reply
    await interaction.reply({
      content: `Successfully set ${user}'s level to ${level} with ${xp} XP.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} set ${user.tag}'s level to ${level} with ${xp} XP in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error handling set command:', error);
    throw error;
  }
}

/**
 * Handle the rewards command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRewardsCommand(interaction) {
  try {
    // Get role rewards
    const rewards = levelManager.getRoleRewards(interaction.guild.id);
    
    if (Object.keys(rewards).length === 0) {
      return interaction.reply({
        content: 'No role rewards have been set up for this server.',
        ephemeral: true
      });
    }
    
    // Create description
    let description = '';
    
    // Sort rewards by level
    const sortedRewards = Object.entries(rewards)
      .sort((a, b) => Number(a[0]) - Number(b[0]));
    
    for (const [level, roleId] of sortedRewards) {
      const role = interaction.guild.roles.cache.get(roleId);
      const roleName = role ? role.toString() : `Unknown Role (${roleId})`;
      
      description += `Level ${level}: ${roleName}\n`;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Level Role Rewards')
      .setDescription(description);
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error handling rewards command:', error);
    throw error;
  }
}

/**
 * Handle the add-reward command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleAddRewardCommand(interaction) {
  try {
    // Get options
    const level = interaction.options.getInteger('level');
    const role = interaction.options.getRole('role');
    
    // Check if role is valid
    if (role.managed) {
      return interaction.reply({
        content: 'Cannot use managed roles (e.g., bot roles) as rewards.',
        ephemeral: true
      });
    }
    
    if (role.id === interaction.guild.id) {
      return interaction.reply({
        content: 'Cannot use the @everyone role as a reward.',
        ephemeral: true
      });
    }
    
    // Check bot permissions
    const member = await interaction.guild.members.fetch(interaction.client.user.id);
    
    if (!member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({
        content: 'I need the "Manage Roles" permission to assign role rewards.',
        ephemeral: true
      });
    }
    
    // Check role hierarchy
    if (role.position >= member.roles.highest.position) {
      return interaction.reply({
        content: `I cannot assign the role ${role.name} because it's higher than or equal to my highest role. Please move my role above it.`,
        ephemeral: true
      });
    }
    
    // Add role reward
    await levelManager.addRoleReward(interaction.guild.id, level, role.id);
    
    // Send reply
    await interaction.reply({
      content: `Successfully added role reward: ${role} at level ${level}.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} added role reward ${role.name} at level ${level} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error handling add-reward command:', error);
    throw error;
  }
}

/**
 * Handle the remove-reward command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRemoveRewardCommand(interaction) {
  try {
    // Get options
    const level = interaction.options.getInteger('level');
    
    // Get current rewards
    const rewards = levelManager.getRoleRewards(interaction.guild.id);
    
    // Check if reward exists
    if (!rewards[level]) {
      return interaction.reply({
        content: `No role reward exists for level ${level}.`,
        ephemeral: true
      });
    }
    
    // Get role info for logging
    const roleId = rewards[level];
    const role = interaction.guild.roles.cache.get(roleId);
    const roleName = role ? role.name : `Unknown Role (${roleId})`;
    
    // Remove role reward
    await levelManager.removeRoleReward(interaction.guild.id, level);
    
    // Send reply
    await interaction.reply({
      content: `Successfully removed role reward for level ${level}.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} removed role reward ${roleName} from level ${level} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error handling remove-reward command:', error);
    throw error;
  }
}

/**
 * Handle the exclude-channel command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleExcludeChannelCommand(interaction) {
  try {
    // Get options
    const channel = interaction.options.getChannel('channel');
    
    // Get current settings
    const settings = levelManager.getGuildSettings(interaction.guild.id);
    
    // Check if channel is already excluded
    if (settings.excludedChannels.includes(channel.id)) {
      return interaction.reply({
        content: `${channel} is already excluded from XP gain.`,
        ephemeral: true
      });
    }
    
    // Add channel to excluded channels
    const newSettings = {
      excludedChannels: [...settings.excludedChannels, channel.id]
    };
    
    // Update settings
    await levelManager.updateGuildSettings(interaction.guild.id, newSettings);
    
    // Send reply
    await interaction.reply({
      content: `Successfully excluded ${channel} from XP gain.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} excluded channel ${channel.name} from XP gain in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error handling exclude-channel command:', error);
    throw error;
  }
}

/**
 * Handle the include-channel command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleIncludeChannelCommand(interaction) {
  try {
    // Get options
    const channel = interaction.options.getChannel('channel');
    
    // Get current settings
    const settings = levelManager.getGuildSettings(interaction.guild.id);
    
    // Check if channel is excluded
    if (!settings.excludedChannels.includes(channel.id)) {
      return interaction.reply({
        content: `${channel} is not excluded from XP gain.`,
        ephemeral: true
      });
    }
    
    // Remove channel from excluded channels
    const newSettings = {
      excludedChannels: settings.excludedChannels.filter(id => id !== channel.id)
    };
    
    // Update settings
    await levelManager.updateGuildSettings(interaction.guild.id, newSettings);
    
    // Send reply
    await interaction.reply({
      content: `Successfully included ${channel} in XP gain.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} included channel ${channel.name} in XP gain in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error handling include-channel command:', error);
    throw error;
  }
}

/**
 * Handle the exclude-role command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleExcludeRoleCommand(interaction) {
  try {
    // Get options
    const role = interaction.options.getRole('role');
    
    // Get current settings
    const settings = levelManager.getGuildSettings(interaction.guild.id);
    
    // Check if role is already excluded
    if (settings.excludedRoles.includes(role.id)) {
      return interaction.reply({
        content: `${role} is already excluded from XP gain.`,
        ephemeral: true
      });
    }
    
    // Add role to excluded roles
    const newSettings = {
      excludedRoles: [...settings.excludedRoles, role.id]
    };
    
    // Update settings
    await levelManager.updateGuildSettings(interaction.guild.id, newSettings);
    
    // Send reply
    await interaction.reply({
      content: `Successfully excluded ${role} from XP gain.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} excluded role ${role.name} from XP gain in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error handling exclude-role command:', error);
    throw error;
  }
}

/**
 * Handle the include-role command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleIncludeRoleCommand(interaction) {
  try {
    // Get options
    const role = interaction.options.getRole('role');
    
    // Get current settings
    const settings = levelManager.getGuildSettings(interaction.guild.id);
    
    // Check if role is excluded
    if (!settings.excludedRoles.includes(role.id)) {
      return interaction.reply({
        content: `${role} is not excluded from XP gain.`,
        ephemeral: true
      });
    }
    
    // Remove role from excluded roles
    const newSettings = {
      excludedRoles: settings.excludedRoles.filter(id => id !== role.id)
    };
    
    // Update settings
    await levelManager.updateGuildSettings(interaction.guild.id, newSettings);
    
    // Send reply
    await interaction.reply({
      content: `Successfully included ${role} in XP gain.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} included role ${role.name} in XP gain in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error handling include-role command:', error);
    throw error;
  }
}