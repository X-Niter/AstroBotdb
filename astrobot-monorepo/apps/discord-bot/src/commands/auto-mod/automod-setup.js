const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const autoMod = require('../../lib/auto-mod');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('automod-setup')
    .setDescription('Configure auto-moderation features')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand(subcommand =>
      subcommand
        .setName('toggle')
        .setDescription('Enable or disable auto-moderation')
        .addBooleanOption(option => 
          option.setName('enabled')
            .setDescription('Whether auto-moderation is enabled')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('log-channel')
        .setDescription('Set the log channel for auto-moderation actions')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to log auto-moderation actions in')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('profanity')
        .setDescription('Configure profanity filter')
        .addBooleanOption(option => 
          option.setName('enabled')
            .setDescription('Whether the profanity filter is enabled')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('punishment')
            .setDescription('The punishment for profanity')
            .setRequired(false)
            .addChoices(
              { name: 'Delete Message', value: 'delete' },
              { name: 'Warning', value: 'warn' },
              { name: 'Timeout', value: 'timeout' },
              { name: 'Kick', value: 'kick' },
              { name: 'Ban', value: 'ban' }
            ))
        .addIntegerOption(option => 
          option.setName('threshold')
            .setDescription('Warnings before punishment (default: 3)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10))
        .addIntegerOption(option => 
          option.setName('timeout')
            .setDescription('Timeout duration in minutes (if punishment is timeout)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10080)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('word-add')
        .setDescription('Add a word to the profanity filter')
        .addStringOption(option => 
          option.setName('word')
            .setDescription('The word to add to the filter')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('word-remove')
        .setDescription('Remove a word from the profanity filter')
        .addStringOption(option => 
          option.setName('word')
            .setDescription('The word to remove from the filter')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('word-list')
        .setDescription('List all words in the profanity filter'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('invite-filter')
        .setDescription('Configure Discord invite filter')
        .addBooleanOption(option => 
          option.setName('enabled')
            .setDescription('Whether the invite filter is enabled')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('punishment')
            .setDescription('The punishment for posting invites')
            .setRequired(false)
            .addChoices(
              { name: 'Delete Message', value: 'delete' },
              { name: 'Warning', value: 'warn' },
              { name: 'Timeout', value: 'timeout' },
              { name: 'Kick', value: 'kick' },
              { name: 'Ban', value: 'ban' }
            ))
        .addIntegerOption(option => 
          option.setName('threshold')
            .setDescription('Warnings before punishment (default: 3)')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('spam-filter')
        .setDescription('Configure spam filter')
        .addBooleanOption(option => 
          option.setName('enabled')
            .setDescription('Whether the spam filter is enabled')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('threshold')
            .setDescription('Number of messages in quick succession to trigger (default: 5)')
            .setRequired(false)
            .setMinValue(3)
            .setMaxValue(20))
        .addIntegerOption(option => 
          option.setName('time')
            .setDescription('Time window in seconds (default: 5)')
            .setRequired(false)
            .setMinValue(2)
            .setMaxValue(60))
        .addStringOption(option => 
          option.setName('punishment')
            .setDescription('The punishment for spamming')
            .setRequired(false)
            .addChoices(
              { name: 'Delete Message', value: 'delete' },
              { name: 'Warning', value: 'warn' },
              { name: 'Timeout', value: 'timeout' },
              { name: 'Kick', value: 'kick' },
              { name: 'Ban', value: 'ban' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('mention-filter')
        .setDescription('Configure mention spam filter')
        .addBooleanOption(option => 
          option.setName('enabled')
            .setDescription('Whether the mention spam filter is enabled')
            .setRequired(true))
        .addIntegerOption(option => 
          option.setName('threshold')
            .setDescription('Number of mentions to trigger (default: 5)')
            .setRequired(false)
            .setMinValue(3)
            .setMaxValue(20))
        .addStringOption(option => 
          option.setName('punishment')
            .setDescription('The punishment for mention spam')
            .setRequired(false)
            .addChoices(
              { name: 'Delete Message', value: 'delete' },
              { name: 'Warning', value: 'warn' },
              { name: 'Timeout', value: 'timeout' },
              { name: 'Kick', value: 'kick' },
              { name: 'Ban', value: 'ban' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('ignore-channel')
        .setDescription('Add or remove a channel from auto-mod ignore list')
        .addChannelOption(option => 
          option.setName('channel')
            .setDescription('The channel to ignore/unignore')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('filter')
            .setDescription('The filter to ignore the channel for')
            .setRequired(true)
            .addChoices(
              { name: 'Profanity', value: 'profanity' },
              { name: 'Invites', value: 'invite' },
              { name: 'Spam', value: 'spam' },
              { name: 'Mention Spam', value: 'mention' },
              { name: 'Caps', value: 'caps' },
              { name: 'Links', value: 'link' },
              { name: 'All Filters', value: 'all' }
            ))
        .addBooleanOption(option => 
          option.setName('ignore')
            .setDescription('Whether to ignore or unignore the channel')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('ignore-role')
        .setDescription('Add or remove a role from auto-mod ignore list')
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The role to ignore/unignore')
            .setRequired(true))
        .addStringOption(option => 
          option.setName('filter')
            .setDescription('The filter to ignore the role for')
            .setRequired(true)
            .addChoices(
              { name: 'Profanity', value: 'profanity' },
              { name: 'Invites', value: 'invite' },
              { name: 'Spam', value: 'spam' },
              { name: 'Mention Spam', value: 'mention' },
              { name: 'Caps', value: 'caps' },
              { name: 'Links', value: 'link' },
              { name: 'All Filters', value: 'all' }
            ))
        .addBooleanOption(option => 
          option.setName('ignore')
            .setDescription('Whether to ignore or unignore the role')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View current auto-moderation settings')),
  
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
      const settings = autoMod.getGuildSettings(interaction.guildId);
      
      switch (subcommand) {
        case 'toggle': {
          const enabled = interaction.options.getBoolean('enabled');
          
          // Update setting
          await autoMod.updateGuildSettings(interaction.guildId, { enabled });
          
          await interaction.reply({
            content: `Auto-moderation has been ${enabled ? 'enabled' : 'disabled'}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'log-channel': {
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
          await autoMod.updateGuildSettings(interaction.guildId, { logChannelId: channel.id });
          
          await interaction.reply({
            content: `Auto-moderation log channel set to ${channel}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'profanity': {
          const enabled = interaction.options.getBoolean('enabled');
          const punishment = interaction.options.getString('punishment');
          const threshold = interaction.options.getInteger('threshold');
          const timeout = interaction.options.getInteger('timeout');
          
          // Create update object
          const updates = { profanityFilter: { enabled } };
          
          // Add optional parameters
          if (punishment) {
            updates.profanityFilter.punishment = { type: punishment };
            
            // If punishment is timeout, add duration
            if (punishment === 'timeout' && timeout) {
              updates.profanityFilter.punishment.timeout = timeout * 60 * 1000; // Convert to ms
            }
          }
          
          // Add threshold if provided
          if (threshold) {
            if (!updates.profanityFilter.punishment) {
              updates.profanityFilter.punishment = {};
            }
            
            updates.profanityFilter.punishment.warnThreshold = threshold;
          }
          
          // Update settings
          await autoMod.updateGuildSettings(interaction.guildId, updates);
          
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Profanity Filter Settings')
            .setDescription(`Profanity filter has been ${enabled ? 'enabled' : 'disabled'}.`)
            .addFields(
              { name: 'Status', value: enabled ? 'Enabled ✅' : 'Disabled ❌', inline: true }
            );
          
          if (enabled) {
            // Add additional settings if enabled
            const punishmentType = punishment || settings.profanityFilter.punishment?.type || 'delete';
            const warnThreshold = threshold || settings.profanityFilter.punishment?.warnThreshold || 3;
            
            embed.addFields(
              { name: 'Punishment', value: punishmentType.charAt(0).toUpperCase() + punishmentType.slice(1), inline: true },
              { name: 'Warning Threshold', value: warnThreshold.toString(), inline: true }
            );
            
            if (punishmentType === 'timeout') {
              const timeoutDuration = timeout || (settings.profanityFilter.punishment?.timeout || 300000) / (60 * 1000);
              embed.addFields({ name: 'Timeout Duration', value: `${timeoutDuration} minute(s)`, inline: true });
            }
          }
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'word-add': {
          const word = interaction.options.getString('word').toLowerCase();
          
          // Update settings
          const customWords = [...(settings.profanityFilter.customWords || [])];
          
          // Check if word already exists
          if (customWords.includes(word) || (settings.profanityFilter.words && settings.profanityFilter.words.includes(word))) {
            return await interaction.reply({
              content: `The word "${word}" is already in the profanity filter.`,
              ephemeral: true
            });
          }
          
          // Add word
          customWords.push(word);
          
          await autoMod.updateGuildSettings(interaction.guildId, {
            profanityFilter: { customWords }
          });
          
          await interaction.reply({
            content: `Added "${word}" to the profanity filter.`,
            ephemeral: true
          });
          break;
        }
        
        case 'word-remove': {
          const word = interaction.options.getString('word').toLowerCase();
          
          // Update settings
          const customWords = [...(settings.profanityFilter.customWords || [])];
          
          // Check if word exists
          const index = customWords.indexOf(word);
          
          if (index === -1) {
            // Check if it's a default word
            if (settings.profanityFilter.words && settings.profanityFilter.words.includes(word)) {
              return await interaction.reply({
                content: `The word "${word}" is a default filtered word and cannot be removed. You can disable the profanity filter instead.`,
                ephemeral: true
              });
            }
            
            return await interaction.reply({
              content: `The word "${word}" is not in the profanity filter.`,
              ephemeral: true
            });
          }
          
          // Remove word
          customWords.splice(index, 1);
          
          await autoMod.updateGuildSettings(interaction.guildId, {
            profanityFilter: { customWords }
          });
          
          await interaction.reply({
            content: `Removed "${word}" from the profanity filter.`,
            ephemeral: true
          });
          break;
        }
        
        case 'word-list': {
          const defaultWords = settings.profanityFilter.words || [];
          const customWords = settings.profanityFilter.customWords || [];
          
          // Create embed
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Profanity Filter Word List');
          
          // Add default words field if any
          if (defaultWords.length > 0) {
            embed.addFields({
              name: 'Default Words',
              value: `\`\`\`${defaultWords.join(', ')}\`\`\``
            });
          }
          
          // Add custom words field if any
          if (customWords.length > 0) {
            embed.addFields({
              name: 'Custom Words',
              value: `\`\`\`${customWords.join(', ')}\`\`\``
            });
          }
          
          // If no words, add note
          if (defaultWords.length === 0 && customWords.length === 0) {
            embed.setDescription('No words have been added to the profanity filter.');
          }
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'invite-filter': {
          const enabled = interaction.options.getBoolean('enabled');
          const punishment = interaction.options.getString('punishment');
          const threshold = interaction.options.getInteger('threshold');
          
          // Create update object
          const updates = { inviteFilter: { enabled } };
          
          // Add optional parameters
          if (punishment) {
            updates.inviteFilter.punishment = { type: punishment };
          }
          
          // Add threshold if provided
          if (threshold) {
            if (!updates.inviteFilter.punishment) {
              updates.inviteFilter.punishment = {};
            }
            
            updates.inviteFilter.punishment.warnThreshold = threshold;
          }
          
          // Update settings
          await autoMod.updateGuildSettings(interaction.guildId, updates);
          
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Invite Filter Settings')
            .setDescription(`Invite filter has been ${enabled ? 'enabled' : 'disabled'}.`)
            .addFields(
              { name: 'Status', value: enabled ? 'Enabled ✅' : 'Disabled ❌', inline: true }
            );
          
          if (enabled) {
            // Add additional settings if enabled
            const punishmentType = punishment || settings.inviteFilter.punishment?.type || 'delete';
            const warnThreshold = threshold || settings.inviteFilter.punishment?.warnThreshold || 3;
            
            embed.addFields(
              { name: 'Punishment', value: punishmentType.charAt(0).toUpperCase() + punishmentType.slice(1), inline: true },
              { name: 'Warning Threshold', value: warnThreshold.toString(), inline: true }
            );
          }
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'spam-filter': {
          const enabled = interaction.options.getBoolean('enabled');
          const messageThreshold = interaction.options.getInteger('threshold');
          const timeThreshold = interaction.options.getInteger('time');
          const punishment = interaction.options.getString('punishment');
          
          // Create update object
          const updates = { spamFilter: { enabled } };
          
          // Add optional parameters
          if (messageThreshold) {
            updates.spamFilter.messageThreshold = messageThreshold;
          }
          
          if (timeThreshold) {
            updates.spamFilter.timeThreshold = timeThreshold * 1000; // Convert to ms
          }
          
          if (punishment) {
            updates.spamFilter.punishment = { type: punishment };
          }
          
          // Update settings
          await autoMod.updateGuildSettings(interaction.guildId, updates);
          
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Spam Filter Settings')
            .setDescription(`Spam filter has been ${enabled ? 'enabled' : 'disabled'}.`)
            .addFields(
              { name: 'Status', value: enabled ? 'Enabled ✅' : 'Disabled ❌', inline: true }
            );
          
          if (enabled) {
            // Add additional settings if enabled
            const msgThreshold = messageThreshold || settings.spamFilter.messageThreshold || 5;
            const timeInSec = (timeThreshold || (settings.spamFilter.timeThreshold || 5000) / 1000);
            const punishmentType = punishment || settings.spamFilter.punishment?.type || 'timeout';
            
            embed.addFields(
              { name: 'Message Threshold', value: msgThreshold.toString(), inline: true },
              { name: 'Time Window', value: `${timeInSec} seconds`, inline: true },
              { name: 'Punishment', value: punishmentType.charAt(0).toUpperCase() + punishmentType.slice(1), inline: true }
            );
          }
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'mention-filter': {
          const enabled = interaction.options.getBoolean('enabled');
          const threshold = interaction.options.getInteger('threshold');
          const punishment = interaction.options.getString('punishment');
          
          // Create update object
          const updates = { mentionSpamFilter: { enabled } };
          
          // Add optional parameters
          if (threshold) {
            updates.mentionSpamFilter.mentionThreshold = threshold;
          }
          
          if (punishment) {
            updates.mentionSpamFilter.punishment = { type: punishment };
          }
          
          // Update settings
          await autoMod.updateGuildSettings(interaction.guildId, updates);
          
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Mention Spam Filter Settings')
            .setDescription(`Mention spam filter has been ${enabled ? 'enabled' : 'disabled'}.`)
            .addFields(
              { name: 'Status', value: enabled ? 'Enabled ✅' : 'Disabled ❌', inline: true }
            );
          
          if (enabled) {
            // Add additional settings if enabled
            const mentionThreshold = threshold || settings.mentionSpamFilter.mentionThreshold || 5;
            const punishmentType = punishment || settings.mentionSpamFilter.punishment?.type || 'timeout';
            
            embed.addFields(
              { name: 'Mention Threshold', value: mentionThreshold.toString(), inline: true },
              { name: 'Punishment', value: punishmentType.charAt(0).toUpperCase() + punishmentType.slice(1), inline: true }
            );
          }
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
        
        case 'ignore-channel': {
          const channel = interaction.options.getChannel('channel');
          const filter = interaction.options.getString('filter');
          const ignore = interaction.options.getBoolean('ignore');
          
          // Update ignore list for the specified filter(s)
          if (filter === 'all') {
            // Update all filters
            for (const filterType of ['profanityFilter', 'inviteFilter', 'spamFilter', 'mentionSpamFilter', 'capsFilter', 'linkFilter']) {
              await updateIgnoreChannel(interaction.guildId, filterType, channel.id, ignore);
            }
          } else {
            // Map filter string to filter type
            const filterTypeMap = {
              'profanity': 'profanityFilter',
              'invite': 'inviteFilter',
              'spam': 'spamFilter',
              'mention': 'mentionSpamFilter',
              'caps': 'capsFilter',
              'link': 'linkFilter'
            };
            
            const filterType = filterTypeMap[filter];
            
            if (!filterType) {
              return await interaction.reply({
                content: 'Invalid filter type.',
                ephemeral: true
              });
            }
            
            await updateIgnoreChannel(interaction.guildId, filterType, channel.id, ignore);
          }
          
          await interaction.reply({
            content: `${channel} will ${ignore ? 'now' : 'no longer'} be ignored by ${filter === 'all' ? 'all auto-moderation filters' : `the ${filter} filter`}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'ignore-role': {
          const role = interaction.options.getRole('role');
          const filter = interaction.options.getString('filter');
          const ignore = interaction.options.getBoolean('ignore');
          
          // Update ignore list for the specified filter(s)
          if (filter === 'all') {
            // Update all filters
            for (const filterType of ['profanityFilter', 'inviteFilter', 'spamFilter', 'mentionSpamFilter', 'capsFilter', 'linkFilter']) {
              await updateIgnoreRole(interaction.guildId, filterType, role.id, ignore);
            }
          } else {
            // Map filter string to filter type
            const filterTypeMap = {
              'profanity': 'profanityFilter',
              'invite': 'inviteFilter',
              'spam': 'spamFilter',
              'mention': 'mentionSpamFilter',
              'caps': 'capsFilter',
              'link': 'linkFilter'
            };
            
            const filterType = filterTypeMap[filter];
            
            if (!filterType) {
              return await interaction.reply({
                content: 'Invalid filter type.',
                ephemeral: true
              });
            }
            
            await updateIgnoreRole(interaction.guildId, filterType, role.id, ignore);
          }
          
          await interaction.reply({
            content: `The role ${role} will ${ignore ? 'now' : 'no longer'} be ignored by ${filter === 'all' ? 'all auto-moderation filters' : `the ${filter} filter`}.`,
            ephemeral: true
          });
          break;
        }
        
        case 'view': {
          // Create settings embed
          const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('Auto-Moderation Settings')
            .addFields(
              { name: 'Status', value: settings.enabled ? 'Enabled ✅' : 'Disabled ❌', inline: true },
              { name: 'Log Channel', value: settings.logChannelId ? `<#${settings.logChannelId}>` : 'Not set', inline: true }
            );
          
          // Filter statuses
          const filterStatuses = [];
          
          // Add profanity filter status
          filterStatuses.push(`**Profanity Filter:** ${settings.profanityFilter.enabled ? 'Enabled ✅' : 'Disabled ❌'}`);
          if (settings.profanityFilter.enabled) {
            const wordCount = (settings.profanityFilter.words?.length || 0) + (settings.profanityFilter.customWords?.length || 0);
            filterStatuses.push(`- Words: ${wordCount}`);
            filterStatuses.push(`- Punishment: ${getPunishmentName(settings.profanityFilter.punishment?.type)}`);
            filterStatuses.push(`- Warning Threshold: ${settings.profanityFilter.punishment?.warnThreshold || 3}`);
          }
          
          // Add invite filter status
          filterStatuses.push(`**Invite Filter:** ${settings.inviteFilter.enabled ? 'Enabled ✅' : 'Disabled ❌'}`);
          if (settings.inviteFilter.enabled) {
            filterStatuses.push(`- Punishment: ${getPunishmentName(settings.inviteFilter.punishment?.type)}`);
            filterStatuses.push(`- Warning Threshold: ${settings.inviteFilter.punishment?.warnThreshold || 3}`);
          }
          
          // Add spam filter status
          filterStatuses.push(`**Spam Filter:** ${settings.spamFilter.enabled ? 'Enabled ✅' : 'Disabled ❌'}`);
          if (settings.spamFilter.enabled) {
            filterStatuses.push(`- Message Threshold: ${settings.spamFilter.messageThreshold || 5}`);
            filterStatuses.push(`- Time Window: ${(settings.spamFilter.timeThreshold || 5000) / 1000} seconds`);
            filterStatuses.push(`- Punishment: ${getPunishmentName(settings.spamFilter.punishment?.type)}`);
          }
          
          // Add mention spam filter status
          filterStatuses.push(`**Mention Spam Filter:** ${settings.mentionSpamFilter.enabled ? 'Enabled ✅' : 'Disabled ❌'}`);
          if (settings.mentionSpamFilter.enabled) {
            filterStatuses.push(`- Mention Threshold: ${settings.mentionSpamFilter.mentionThreshold || 5}`);
            filterStatuses.push(`- Punishment: ${getPunishmentName(settings.mentionSpamFilter.punishment?.type)}`);
          }
          
          // Add caps filter status
          filterStatuses.push(`**Excessive Caps Filter:** ${settings.capsFilter.enabled ? 'Enabled ✅' : 'Disabled ❌'}`);
          if (settings.capsFilter.enabled) {
            filterStatuses.push(`- Caps Percentage Threshold: ${settings.capsFilter.capsPercentage || 70}%`);
            filterStatuses.push(`- Minimum Message Length: ${settings.capsFilter.minLength || 10} characters`);
            filterStatuses.push(`- Punishment: ${getPunishmentName(settings.capsFilter.punishment?.type)}`);
          }
          
          // Add link filter status
          filterStatuses.push(`**Link Filter:** ${settings.linkFilter.enabled ? 'Enabled ✅' : 'Disabled ❌'}`);
          if (settings.linkFilter.enabled) {
            filterStatuses.push(`- Allowed Domains: ${settings.linkFilter.allowedDomains?.length || 0}`);
            filterStatuses.push(`- Punishment: ${getPunishmentName(settings.linkFilter.punishment?.type)}`);
          }
          
          // Add filter statuses to embed
          embed.addFields({ name: 'Filters', value: filterStatuses.join('\n') });
          
          // Add ignored channels/roles if any
          const ignoredItems = [];
          
          for (const filterType of ['profanityFilter', 'inviteFilter', 'spamFilter', 'mentionSpamFilter', 'capsFilter', 'linkFilter']) {
            const filter = settings[filterType];
            
            if (filter.ignoredChannels?.length > 0) {
              ignoredItems.push(`**${getFilterName(filterType)} - Ignored Channels:** ${filter.ignoredChannels.map(id => `<#${id}>`).join(', ')}`);
            }
            
            if (filter.ignoredRoles?.length > 0) {
              ignoredItems.push(`**${getFilterName(filterType)} - Ignored Roles:** ${filter.ignoredRoles.map(id => `<@&${id}>`).join(', ')}`);
            }
          }
          
          if (ignoredItems.length > 0) {
            embed.addFields({ name: 'Ignored Channels & Roles', value: ignoredItems.join('\n') });
          }
          
          await interaction.reply({ embeds: [embed], ephemeral: true });
          break;
        }
      }
    } catch (error) {
      logger.error('Error executing automod-setup command:', error);
      
      await interaction.reply({
        content: `There was an error configuring auto-moderation: ${error.message}`,
        ephemeral: true
      });
    }
  }
};

/**
 * Update the ignoredChannels list for a filter
 * @param {string} guildId - The guild ID
 * @param {string} filterType - The filter type
 * @param {string} channelId - The channel ID
 * @param {boolean} ignore - Whether to ignore or unignore the channel
 * @returns {Promise<void>}
 */
async function updateIgnoreChannel(guildId, filterType, channelId, ignore) {
  // Get current settings
  const settings = autoMod.getGuildSettings(guildId);
  
  // Get current ignored channels
  const ignoredChannels = [...(settings[filterType]?.ignoredChannels || [])];
  
  if (ignore) {
    // Add channel if not already ignored
    if (!ignoredChannels.includes(channelId)) {
      ignoredChannels.push(channelId);
    }
  } else {
    // Remove channel if ignored
    const index = ignoredChannels.indexOf(channelId);
    
    if (index !== -1) {
      ignoredChannels.splice(index, 1);
    }
  }
  
  // Update settings
  const update = {};
  update[filterType] = { ignoredChannels };
  
  await autoMod.updateGuildSettings(guildId, update);
}

/**
 * Update the ignoredRoles list for a filter
 * @param {string} guildId - The guild ID
 * @param {string} filterType - The filter type
 * @param {string} roleId - The role ID
 * @param {boolean} ignore - Whether to ignore or unignore the role
 * @returns {Promise<void>}
 */
async function updateIgnoreRole(guildId, filterType, roleId, ignore) {
  // Get current settings
  const settings = autoMod.getGuildSettings(guildId);
  
  // Get current ignored roles
  const ignoredRoles = [...(settings[filterType]?.ignoredRoles || [])];
  
  if (ignore) {
    // Add role if not already ignored
    if (!ignoredRoles.includes(roleId)) {
      ignoredRoles.push(roleId);
    }
  } else {
    // Remove role if ignored
    const index = ignoredRoles.indexOf(roleId);
    
    if (index !== -1) {
      ignoredRoles.splice(index, 1);
    }
  }
  
  // Update settings
  const update = {};
  update[filterType] = { ignoredRoles };
  
  await autoMod.updateGuildSettings(guildId, update);
}

/**
 * Get a readable name for a punishment type
 * @param {string} punishmentType - The punishment type
 * @returns {string} The readable name
 */
function getPunishmentName(punishmentType) {
  switch (punishmentType) {
    case 'delete':
      return 'Delete Message';
    case 'warn':
      return 'Warning';
    case 'timeout':
      return 'Timeout';
    case 'kick':
      return 'Kick';
    case 'ban':
      return 'Ban';
    default:
      return 'Delete Message';
  }
}

/**
 * Get a readable name for a filter type
 * @param {string} filterType - The filter type
 * @returns {string} The readable name
 */
function getFilterName(filterType) {
  switch (filterType) {
    case 'profanityFilter':
      return 'Profanity Filter';
    case 'inviteFilter':
      return 'Invite Filter';
    case 'spamFilter':
      return 'Spam Filter';
    case 'mentionSpamFilter':
      return 'Mention Spam Filter';
    case 'capsFilter':
      return 'Caps Filter';
    case 'linkFilter':
      return 'Link Filter';
    default:
      return filterType;
  }
}