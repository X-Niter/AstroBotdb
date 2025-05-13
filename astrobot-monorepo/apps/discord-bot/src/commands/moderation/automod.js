const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const automodManager = require('../../lib/automod/automod-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure automatic moderation')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand.setName('enable')
        .setDescription('Enable automod')
        .addChannelOption(option =>
          option.setName('log-channel')
            .setDescription('Channel to log automod actions')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('disable')
        .setDescription('Disable automod'))
    .addSubcommand(subcommand =>
      subcommand.setName('status')
        .setDescription('Check automod status'))
    .addSubcommandGroup(group =>
      group.setName('rules')
        .setDescription('Manage automod rules')
        .addSubcommand(subcommand =>
          subcommand.setName('list')
            .setDescription('List all automod rules'))
        .addSubcommand(subcommand =>
          subcommand.setName('add')
            .setDescription('Add an automod rule')
            .addStringOption(option =>
              option.setName('name')
                .setDescription('Rule name')
                .setRequired(true))
            .addStringOption(option =>
              option.setName('type')
                .setDescription('Rule type')
                .setRequired(true)
                .addChoices(
                  { name: 'Keywords', value: 'KEYWORD' },
                  { name: 'Spam Detection', value: 'SPAM' },
                  { name: 'Mention Spam', value: 'MENTION_SPAM' },
                  { name: 'Excessive Caps', value: 'CAPS' },
                  { name: 'Discord Invites', value: 'INVITE' },
                  { name: 'External Links', value: 'LINK' },
                  { name: 'Attachments', value: 'ATTACHMENT' },
                  { name: 'Regular Expression', value: 'REGEX' }
                ))
            .addStringOption(option =>
              option.setName('content')
                .setDescription('Rule content (comma-separated keywords, regex pattern)')
                .setRequired(false))
            .addStringOption(option =>
              option.setName('action')
                .setDescription('Primary action to take')
                .setRequired(true)
                .addChoices(
                  { name: 'Delete Message', value: 'DELETE' },
                  { name: 'Warn User', value: 'WARN' },
                  { name: 'Timeout User (5 minutes)', value: 'TIMEOUT' },
                  { name: 'Kick User', value: 'KICK' },
                  { name: 'Ban User', value: 'BAN' },
                  { name: 'Log Only', value: 'LOG' }
                )))
        .addSubcommand(subcommand =>
          subcommand.setName('remove')
            .setDescription('Remove an automod rule')
            .addStringOption(option =>
              option.setName('rule-id')
                .setDescription('Rule ID')
                .setRequired(true)
                .setAutocomplete(true)))
        .addSubcommand(subcommand =>
          subcommand.setName('toggle')
            .setDescription('Enable or disable a rule')
            .addStringOption(option =>
              option.setName('rule-id')
                .setDescription('Rule ID')
                .setRequired(true)
                .setAutocomplete(true))
            .addBooleanOption(option =>
              option.setName('enabled')
                .setDescription('Whether the rule is enabled')
                .setRequired(true))))
    .addSubcommandGroup(group =>
      group.setName('warnings')
        .setDescription('Manage user warnings')
        .addSubcommand(subcommand =>
          subcommand.setName('list')
            .setDescription('List warnings for a user')
            .addUserOption(option =>
              option.setName('user')
                .setDescription('The user to check')
                .setRequired(true)))
        .addSubcommand(subcommand =>
          subcommand.setName('clear')
            .setDescription('Clear warnings for a user')
            .addUserOption(option =>
              option.setName('user')
                .setDescription('The user to clear warnings for')
                .setRequired(true)))),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Handle autocomplete interactions
   * @param {Client} client - The Discord client
   * @param {AutocompleteInteraction} interaction - The autocomplete interaction
   */
  async autocomplete(client, interaction) {
    try {
      const focusedOption = interaction.options.getFocused(true);
      
      if (focusedOption.name === 'rule-id') {
        const guildConfig = automodManager.getGuildConfig(interaction.guildId);
        
        // Return a list of rules
        const choices = guildConfig.rules.map(rule => ({
          name: `${rule.name} (${rule.id})`,
          value: rule.id
        }));
        
        await interaction.respond(choices);
      }
    } catch (error) {
      logger.error('Error handling automod autocomplete:', error);
    }
  },
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Check if user has permissions
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.reply({
          content: 'You need the "Manage Server" permission to use this command.',
          ephemeral: true
        });
      }
      
      const subcommandGroup = interaction.options.getSubcommandGroup(false);
      const subcommand = interaction.options.getSubcommand();
      
      if (subcommandGroup === 'rules') {
        await handleRulesCommands(interaction, subcommand);
      } else if (subcommandGroup === 'warnings') {
        await handleWarningsCommands(interaction, subcommand);
      } else {
        switch (subcommand) {
          case 'enable':
            await handleEnableAutomod(interaction);
            break;
            
          case 'disable':
            await handleDisableAutomod(interaction);
            break;
            
          case 'status':
            await handleAutomodStatus(interaction);
            break;
            
          default:
            await interaction.reply({
              content: 'Unknown subcommand.',
              ephemeral: true
            });
        }
      }
    } catch (error) {
      logger.error('Error executing automod command:', error);
      
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
 * Handle enabling automod
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleEnableAutomod(interaction) {
  try {
    // Get options
    const logChannel = interaction.options.getChannel('log-channel');
    
    // Check channel type
    if (!logChannel.isTextBased() || logChannel.isVoiceBased() || logChannel.isThread()) {
      return interaction.reply({
        content: 'Please select a text channel for logging.',
        ephemeral: true
      });
    }
    
    // Check if bot has permissions in the channel
    const permissions = logChannel.permissionsFor(interaction.guild.members.me);
    
    if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.reply({
        content: 'I need the "Send Messages" and "Embed Links" permissions in that channel.',
        ephemeral: true
      });
    }
    
    // Enable automod
    await automodManager.enableAutomod(interaction.guildId, logChannel.id);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Automod Enabled')
      .setDescription(`Automod has been enabled for this server. Violations will be logged to ${logChannel}.`)
      .setFooter({ text: 'Use /automod rules add to create rules' });
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} enabled automod in guild ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error enabling automod:', error);
    throw error;
  }
}

/**
 * Handle disabling automod
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleDisableAutomod(interaction) {
  try {
    // Get current config
    const config = automodManager.getGuildConfig(interaction.guildId);
    
    if (!config.enabled) {
      return interaction.reply({
        content: 'Automod is already disabled for this server.',
        ephemeral: true
      });
    }
    
    // Disable automod
    await automodManager.disableAutomod(interaction.guildId);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Automod Disabled')
      .setDescription('Automod has been disabled for this server.');
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} disabled automod in guild ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error disabling automod:', error);
    throw error;
  }
}

/**
 * Handle checking automod status
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleAutomodStatus(interaction) {
  try {
    // Get current config
    const config = automodManager.getGuildConfig(interaction.guildId);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor(config.enabled ? '#00FF00' : '#FF0000')
      .setTitle('Automod Status')
      .setDescription(`Automod is currently **${config.enabled ? 'Enabled' : 'Disabled'}** for this server.`);
    
    if (config.enabled) {
      const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
      
      if (logChannel) {
        embed.addFields({ name: 'Log Channel', value: `${logChannel}`, inline: true });
      }
      
      embed.addFields({ name: 'Rules', value: `${config.rules.length}`, inline: true });
    }
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error checking automod status:', error);
    throw error;
  }
}

/**
 * Handle rules commands
 * @param {CommandInteraction} interaction - The interaction
 * @param {string} subcommand - The subcommand
 */
async function handleRulesCommands(interaction, subcommand) {
  try {
    switch (subcommand) {
      case 'list':
        await handleListRules(interaction);
        break;
        
      case 'add':
        await handleAddRule(interaction);
        break;
        
      case 'remove':
        await handleRemoveRule(interaction);
        break;
        
      case 'toggle':
        await handleToggleRule(interaction);
        break;
        
      default:
        await interaction.reply({
          content: 'Unknown subcommand.',
          ephemeral: true
        });
    }
  } catch (error) {
    logger.error('Error handling rules command:', error);
    throw error;
  }
}

/**
 * Handle listing automod rules
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListRules(interaction) {
  try {
    // Get current config
    const config = automodManager.getGuildConfig(interaction.guildId);
    
    if (!config.rules || config.rules.length === 0) {
      return interaction.reply({
        content: 'No automod rules have been configured for this server.',
        ephemeral: true
      });
    }
    
    // Format rules
    let rulesText = '';
    
    for (const rule of config.rules) {
      rulesText += `**${rule.name}** (${rule.id})\n`;
      rulesText += `Type: ${rule.type}\n`;
      rulesText += `Status: ${rule.enabled ? 'Enabled' : 'Disabled'}\n`;
      rulesText += `Actions: ${rule.actions.map(a => a.type).join(', ')}\n\n`;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Automod Rules')
      .setDescription(rulesText)
      .setFooter({ text: `${config.rules.length} rules configured` });
    
    // Send reply
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error('Error listing automod rules:', error);
    throw error;
  }
}

/**
 * Handle adding an automod rule
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleAddRule(interaction) {
  try {
    // Get options
    const name = interaction.options.getString('name');
    const type = interaction.options.getString('type');
    const content = interaction.options.getString('content');
    const actionType = interaction.options.getString('action');
    
    // Get current config
    const config = automodManager.getGuildConfig(interaction.guildId);
    
    // Check if automod is enabled
    if (!config.enabled) {
      return interaction.reply({
        content: 'Automod is not enabled for this server. Enable it first with `/automod enable`.',
        ephemeral: true
      });
    }
    
    // Parse content based on rule type
    let parsedContent;
    
    switch (type) {
      case automodManager.RULE_TYPES.KEYWORD:
        // Parse comma-separated keywords
        parsedContent = content ? content.split(',').map(k => k.trim()) : [];
        
        if (parsedContent.length === 0) {
          return interaction.reply({
            content: 'Please provide at least one keyword for this rule type.',
            ephemeral: true
          });
        }
        break;
        
      case automodManager.RULE_TYPES.REGEX:
        // Validate regex
        if (!content) {
          return interaction.reply({
            content: 'Please provide a regular expression pattern for this rule type.',
            ephemeral: true
          });
        }
        
        try {
          new RegExp(content);
        } catch (e) {
          return interaction.reply({
            content: `Invalid regular expression: ${e.message}`,
            ephemeral: true
          });
        }
        
        parsedContent = content;
        break;
        
      case automodManager.RULE_TYPES.SPAM:
      case automodManager.RULE_TYPES.MENTION_SPAM:
      case automodManager.RULE_TYPES.CAPS:
      case automodManager.RULE_TYPES.INVITE:
      case automodManager.RULE_TYPES.LINK:
      case automodManager.RULE_TYPES.ATTACHMENT:
        // These rule types don't require content
        parsedContent = null;
        break;
        
      default:
        return interaction.reply({
          content: `Unknown rule type: ${type}`,
          ephemeral: true
        });
    }
    
    // Create rule actions
    const actions = [{ type: actionType }];
    
    // If action is not delete, add delete as secondary action
    if (actionType !== automodManager.RULE_ACTIONS.DELETE && actionType !== automodManager.RULE_ACTIONS.LOG) {
      actions.push({ type: automodManager.RULE_ACTIONS.DELETE });
    }
    
    // Add log action if not already present
    if (!actions.some(a => a.type === automodManager.RULE_ACTIONS.LOG)) {
      actions.push({ type: automodManager.RULE_ACTIONS.LOG });
    }
    
    // Create rule settings
    let settings = {};
    
    switch (type) {
      case automodManager.RULE_TYPES.SPAM:
        settings = {
          checkRepeatingChars: true
        };
        break;
        
      case automodManager.RULE_TYPES.MENTION_SPAM:
        settings = {
          mentionLimit: 5
        };
        break;
        
      case automodManager.RULE_TYPES.CAPS:
        settings = {
          capsPercentage: 0.7
        };
        break;
    }
    
    // Create rule
    const rule = await automodManager.createRule(interaction.guildId, {
      name,
      type,
      content: parsedContent,
      actions,
      settings
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Automod Rule Created')
      .setDescription(`Rule **${name}** has been created.`)
      .addFields(
        { name: 'Type', value: type, inline: true },
        { name: 'Action', value: actionType, inline: true },
        { name: 'ID', value: rule.id, inline: true }
      );
    
    // Add content field if present
    if (content) {
      embed.addFields({ name: 'Content', value: content, inline: false });
    }
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} created automod rule ${name} in guild ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error adding automod rule:', error);
    throw error;
  }
}

/**
 * Handle removing an automod rule
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleRemoveRule(interaction) {
  try {
    // Get options
    const ruleId = interaction.options.getString('rule-id');
    
    // Get current config
    const config = automodManager.getGuildConfig(interaction.guildId);
    
    // Find rule
    const rule = config.rules.find(r => r.id === ruleId);
    
    if (!rule) {
      return interaction.reply({
        content: 'Rule not found.',
        ephemeral: true
      });
    }
    
    // Delete rule
    const success = await automodManager.deleteRule(interaction.guildId, ruleId);
    
    if (!success) {
      return interaction.reply({
        content: 'Failed to delete the rule.',
        ephemeral: true
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Automod Rule Deleted')
      .setDescription(`Rule **${rule.name}** has been deleted.`);
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} deleted automod rule ${rule.name} in guild ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error removing automod rule:', error);
    throw error;
  }
}

/**
 * Handle toggling an automod rule
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleToggleRule(interaction) {
  try {
    // Get options
    const ruleId = interaction.options.getString('rule-id');
    const enabled = interaction.options.getBoolean('enabled');
    
    // Get current config
    const config = automodManager.getGuildConfig(interaction.guildId);
    
    // Find rule
    const rule = config.rules.find(r => r.id === ruleId);
    
    if (!rule) {
      return interaction.reply({
        content: 'Rule not found.',
        ephemeral: true
      });
    }
    
    // Skip if already in the desired state
    if (rule.enabled === enabled) {
      return interaction.reply({
        content: `Rule **${rule.name}** is already ${enabled ? 'enabled' : 'disabled'}.`,
        ephemeral: true
      });
    }
    
    // Update rule
    const updatedRule = await automodManager.updateRule(interaction.guildId, ruleId, { enabled });
    
    if (!updatedRule) {
      return interaction.reply({
        content: 'Failed to update the rule.',
        ephemeral: true
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor(enabled ? '#00FF00' : '#FF0000')
      .setTitle(`Automod Rule ${enabled ? 'Enabled' : 'Disabled'}`)
      .setDescription(`Rule **${rule.name}** has been ${enabled ? 'enabled' : 'disabled'}.`);
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} ${enabled ? 'enabled' : 'disabled'} automod rule ${rule.name} in guild ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error toggling automod rule:', error);
    throw error;
  }
}

/**
 * Handle warnings commands
 * @param {CommandInteraction} interaction - The interaction
 * @param {string} subcommand - The subcommand
 */
async function handleWarningsCommands(interaction, subcommand) {
  try {
    switch (subcommand) {
      case 'list':
        await handleListWarnings(interaction);
        break;
        
      case 'clear':
        await handleClearWarnings(interaction);
        break;
        
      default:
        await interaction.reply({
          content: 'Unknown subcommand.',
          ephemeral: true
        });
    }
  } catch (error) {
    logger.error('Error handling warnings command:', error);
    throw error;
  }
}

/**
 * Handle listing warnings for a user
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListWarnings(interaction) {
  try {
    // Get options
    const user = interaction.options.getUser('user');
    
    // Get warnings
    const warnings = automodManager.getUserWarnings(interaction.guildId, user.id);
    
    if (warnings.length === 0) {
      return interaction.reply({
        content: `${user} has no warnings in this server.`,
        ephemeral: true
      });
    }
    
    // Format warnings
    let warningsText = '';
    
    for (let i = 0; i < warnings.length; i++) {
      const warning = warnings[i];
      const date = new Date(warning.timestamp).toLocaleString();
      
      warningsText += `**${i + 1}.** ${date}: ${warning.reason}\n`;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FF9900')
      .setTitle(`Warnings for ${user.tag}`)
      .setDescription(warningsText)
      .setFooter({ text: `${warnings.length} warning(s) found` });
    
    // Add user avatar
    embed.setThumbnail(user.displayAvatarURL({ dynamic: true }));
    
    // Send reply
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error('Error listing warnings:', error);
    throw error;
  }
}

/**
 * Handle clearing warnings for a user
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleClearWarnings(interaction) {
  try {
    // Get options
    const user = interaction.options.getUser('user');
    
    // Get warnings
    const warnings = automodManager.getUserWarnings(interaction.guildId, user.id);
    
    if (warnings.length === 0) {
      return interaction.reply({
        content: `${user} has no warnings in this server.`,
        ephemeral: true
      });
    }
    
    // Clear warnings
    const success = await automodManager.clearUserWarnings(interaction.guildId, user.id);
    
    if (!success) {
      return interaction.reply({
        content: 'Failed to clear warnings.',
        ephemeral: true
      });
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle(`Warnings Cleared`)
      .setDescription(`Cleared ${warnings.length} warning(s) for ${user}.`);
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} cleared warnings for ${user.tag} in guild ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error clearing warnings:', error);
    throw error;
  }
}