const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const reactionRoleManager = require('../../lib/reaction-roles');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('reaction-role-create')
    .setDescription('Create a reaction role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option => 
      option.setName('message_id')
        .setDescription('The ID of the message to add the reaction role to')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The channel containing the message')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('role')
        .setDescription('The role to assign')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('emoji')
        .setDescription('The emoji to use for the reaction')
        .setRequired(true))
    .addBooleanOption(option => 
      option.setName('exclusive')
        .setDescription('Whether this reaction role is exclusive (users can only select one role from this message)')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('group')
        .setDescription('Optional group name to make this role exclusive with other roles in the same group')
        .setRequired(false)),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get command options
      const messageId = interaction.options.getString('message_id');
      const channel = interaction.options.getChannel('channel');
      const role = interaction.options.getRole('role');
      const emoji = interaction.options.getString('emoji');
      const exclusive = interaction.options.getBoolean('exclusive') || false;
      const group = interaction.options.getString('group');
      
      // Validate the channel
      if (!channel.isTextBased()) {
        return await interaction.reply({
          content: 'The channel must be a text channel!',
          ephemeral: true
        });
      }
      
      // Check if the bot has permission to add reactions
      const botPermissions = channel.permissionsFor(interaction.guild.members.me);
      if (!botPermissions.has('AddReactions')) {
        return await interaction.reply({
          content: 'I need permission to add reactions in that channel!',
          ephemeral: true
        });
      }
      
      // Check if the bot has permission to manage roles
      if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
        return await interaction.reply({
          content: 'I need permission to manage roles!',
          ephemeral: true
        });
      }
      
      // Check if the role is manageable by the bot
      if (role.position >= interaction.guild.members.me.roles.highest.position) {
        return await interaction.reply({
          content: `I cannot assign the role ${role.name} because it's higher than my highest role!`,
          ephemeral: true
        });
      }
      
      // Fetch the message
      let message;
      try {
        message = await channel.messages.fetch(messageId);
      } catch (error) {
        return await interaction.reply({
          content: `Could not find a message with ID ${messageId} in ${channel}!`,
          ephemeral: true
        });
      }
      
      // Create the reaction role
      const id = await reactionRoleManager.createReactionRole({
        guildId: interaction.guildId,
        channelId: channel.id,
        messageId: message.id,
        roleId: role.id,
        emoji: emoji,
        createdBy: interaction.user.id,
        exclusive: exclusive,
        group: group
      });
      
      // Add the reaction to the message
      try {
        await message.react(emoji);
      } catch (error) {
        await reactionRoleManager.deleteReactionRole(id);
        
        return await interaction.reply({
          content: `Could not add reaction with emoji ${emoji}. Make sure it's a valid emoji that I have access to!`,
          ephemeral: true
        });
      }
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Reaction Role Created')
        .setDescription(`Successfully created a reaction role.`)
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Message ID', value: message.id, inline: true },
          { name: 'Role', value: `<@&${role.id}>`, inline: true },
          { name: 'Emoji', value: emoji, inline: true },
          { name: 'Exclusive', value: exclusive ? 'Yes' : 'No', inline: true }
        );
      
      if (group) {
        embed.addFields({ name: 'Group', value: group, inline: true });
      }
      
      // Add message preview
      const messagePreview = message.content.length > 100 
        ? message.content.substring(0, 97) + '...' 
        : message.content || '*No content (possibly an embed)*';
      
      embed.addFields({ name: 'Message Preview', value: messagePreview });
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing reaction-role-create command:', error);
      
      await interaction.reply({
        content: `There was an error creating the reaction role: ${error.message}`,
        ephemeral: true
      });
    }
  }
};