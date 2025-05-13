const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ButtonStyle } = require('discord.js');
const reactionRoleManager = require('../../lib/reaction-roles/reaction-role-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('reaction-roles')
    .setDescription('Manage reaction roles')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(subcommand =>
      subcommand.setName('create')
        .setDescription('Create a reaction role message')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to send the message to')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('title')
            .setDescription('The title of the embed')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('description')
            .setDescription('The description of the embed')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('color')
            .setDescription('The color of the embed (hex code)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('add-role')
        .setDescription('Add a role to a reaction role message')
        .addStringOption(option =>
          option.setName('message-id')
            .setDescription('The ID of the reaction role message')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('The role to add')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('label')
            .setDescription('The label for the button')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('emoji')
            .setDescription('The emoji for the button')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('style')
            .setDescription('The style of the button')
            .setRequired(false)
            .addChoices(
              { name: 'Primary (Blue)', value: 'PRIMARY' },
              { name: 'Secondary (Grey)', value: 'SECONDARY' },
              { name: 'Success (Green)', value: 'SUCCESS' },
              { name: 'Danger (Red)', value: 'DANGER' }
            )))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all reaction role messages in this server'))
    .addSubcommand(subcommand =>
      subcommand.setName('delete')
        .setDescription('Delete a reaction role message')
        .addStringOption(option =>
          option.setName('message-id')
            .setDescription('The ID of the reaction role message')
            .setRequired(true))),
  
  // Cooldown in seconds
  cooldown: 5,
  
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
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
          content: 'You need the "Manage Roles" permission to use this command.',
          ephemeral: true
        });
      }
      
      // Check if bot has permissions
      if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.reply({
          content: 'I need the "Manage Roles" permission to use this command.',
          ephemeral: true
        });
      }
      
      switch (subcommand) {
        case 'create':
          await handleCreateReactionRoles(interaction, client);
          break;
          
        case 'add-role':
          await handleAddRole(interaction, client);
          break;
          
        case 'list':
          await handleListReactionRoles(interaction);
          break;
          
        case 'delete':
          await handleDeleteReactionRoles(interaction, client);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing reaction-roles command:', error);
      
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
 * Handle creating reaction roles
 * @param {CommandInteraction} interaction - The interaction
 * @param {Client} client - The Discord client
 */
async function handleCreateReactionRoles(interaction, client) {
  try {
    // Get options
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const description = interaction.options.getString('description');
    const color = interaction.options.getString('color') || '#5865F2';
    
    // Check channel type
    if (!channel.isTextBased() || channel.isVoiceBased() || channel.isThread()) {
      return interaction.reply({
        content: 'Please select a text channel.',
        ephemeral: true
      });
    }
    
    // Check if bot has permissions in the channel
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    
    if (!permissions.has(PermissionFlagsBits.SendMessages) || !permissions.has(PermissionFlagsBits.EmbedLinks)) {
      return interaction.reply({
        content: 'I need the "Send Messages" and "Embed Links" permissions in that channel.',
        ephemeral: true
      });
    }
    
    // Defer reply
    await interaction.deferReply({ ephemeral: true });
    
    // Create reaction roles message with no roles yet
    const reactionRoleMessage = await reactionRoleManager.createReactionRoleMessage({
      guild: interaction.guild,
      channel,
      roles: [],
      title,
      description,
      color
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Reaction Roles Created')
      .setDescription(`Reaction roles message created in ${channel}.\nUse \`/reaction-roles add-role\` to add roles to it.`)
      .addFields(
        { name: 'Message ID', value: reactionRoleMessage.messageId, inline: false }
      )
      .setFooter({ text: 'Keep this message ID to add roles to the message' });
    
    // Send reply
    await interaction.editReply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} created reaction roles message in channel ${channel.name}`);
  } catch (error) {
    logger.error('Error creating reaction roles:', error);
    
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
 * Handle adding a role to a reaction role message
 * @param {CommandInteraction} interaction - The interaction
 * @param {Client} client - The Discord client
 */
async function handleAddRole(interaction, client) {
  try {
    // Get options
    const messageId = interaction.options.getString('message-id');
    const role = interaction.options.getRole('role');
    const label = interaction.options.getString('label');
    const emoji = interaction.options.getString('emoji');
    const style = interaction.options.getString('style') || 'PRIMARY';
    
    // Check if message exists
    const messages = reactionRoleManager.getGuildReactionRoleMessages(interaction.guildId);
    const message = messages.find(msg => msg.messageId === messageId);
    
    if (!message) {
      return interaction.reply({
        content: 'Reaction role message not found. Use `/reaction-roles list` to see all reaction role messages.',
        ephemeral: true
      });
    }
    
    // Check if role is manageable
    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content: `I cannot assign the role "${role.name}" as it is higher than or equal to my highest role.`,
        ephemeral: true
      });
    }
    
    // Check if role is already in the message
    if (message.roles.some(r => r.roleId === role.id)) {
      return interaction.reply({
        content: `The role "${role.name}" is already in this reaction role message.`,
        ephemeral: true
      });
    }
    
    // Convert style string to ButtonStyle enum
    let buttonStyle;
    switch (style) {
      case 'PRIMARY':
        buttonStyle = ButtonStyle.Primary;
        break;
      case 'SECONDARY':
        buttonStyle = ButtonStyle.Secondary;
        break;
      case 'SUCCESS':
        buttonStyle = ButtonStyle.Success;
        break;
      case 'DANGER':
        buttonStyle = ButtonStyle.Danger;
        break;
      default:
        buttonStyle = ButtonStyle.Primary;
    }
    
    // Add role to message
    const updatedRoles = [
      ...message.roles,
      {
        roleId: role.id,
        emoji,
        label,
        style: buttonStyle
      }
    ];
    
    // Update message
    await reactionRoleManager.updateReactionRoleMessage({
      client,
      messageId,
      channelId: message.channelId,
      guildId: interaction.guildId,
      roles: updatedRoles
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Role Added')
      .setDescription(`Added role ${role} to the reaction role message.`)
      .addFields(
        { name: 'Label', value: label, inline: true },
        { name: 'Emoji', value: emoji, inline: true },
        { name: 'Style', value: style, inline: true }
      );
    
    // Send reply
    await interaction.reply({ embeds: [embed], ephemeral: true });
    
    logger.info(`User ${interaction.user.tag} added role ${role.name} to reaction roles message ${messageId}`);
  } catch (error) {
    logger.error('Error adding role to reaction roles:', error);
    throw error;
  }
}

/**
 * Handle listing reaction role messages
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListReactionRoles(interaction) {
  try {
    // Get messages
    const messages = reactionRoleManager.getGuildReactionRoleMessages(interaction.guildId);
    
    if (messages.length === 0) {
      return interaction.reply({
        content: 'No reaction role messages found in this server.',
        ephemeral: true
      });
    }
    
    // Format messages
    let description = '';
    
    for (const message of messages) {
      const channel = interaction.guild.channels.cache.get(message.channelId);
      const channelName = channel ? channel.name : 'Unknown Channel';
      
      description += `**Message ID:** ${message.messageId}\n`;
      description += `**Channel:** ${channel ? `<#${channel.id}>` : 'Unknown Channel'}\n`;
      description += `**Title:** ${message.title}\n`;
      description += `**Roles:** ${message.roles.length}\n\n`;
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Reaction Role Messages')
      .setDescription(description)
      .setFooter({ text: `${messages.length} reaction role message(s) found` });
    
    // Send reply
    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    logger.error('Error listing reaction roles:', error);
    throw error;
  }
}

/**
 * Handle deleting a reaction role message
 * @param {CommandInteraction} interaction - The interaction
 * @param {Client} client - The Discord client
 */
async function handleDeleteReactionRoles(interaction, client) {
  try {
    // Get options
    const messageId = interaction.options.getString('message-id');
    
    // Check if message exists
    const messages = reactionRoleManager.getGuildReactionRoleMessages(interaction.guildId);
    const message = messages.find(msg => msg.messageId === messageId);
    
    if (!message) {
      return interaction.reply({
        content: 'Reaction role message not found. Use `/reaction-roles list` to see all reaction role messages.',
        ephemeral: true
      });
    }
    
    // Defer reply
    await interaction.deferReply({ ephemeral: true });
    
    // Try to delete the actual message
    try {
      const channel = await client.channels.fetch(message.channelId);
      
      if (channel) {
        const botMessage = await channel.messages.fetch(messageId).catch(() => null);
        
        if (botMessage) {
          await botMessage.delete();
        }
      }
    } catch (error) {
      logger.warn(`Could not delete reaction role message ${messageId}:`, error);
      // Continue with deletion from the database even if the message can't be deleted
    }
    
    // Delete from manager
    const success = await reactionRoleManager.deleteReactionRoleMessage(messageId);
    
    if (!success) {
      return interaction.editReply('Failed to delete the reaction role message.');
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Reaction Roles Deleted')
      .setDescription(`Successfully deleted the reaction role message with ID ${messageId}.`);
    
    // Send reply
    await interaction.editReply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} deleted reaction roles message ${messageId}`);
  } catch (error) {
    logger.error('Error deleting reaction roles:', error);
    
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