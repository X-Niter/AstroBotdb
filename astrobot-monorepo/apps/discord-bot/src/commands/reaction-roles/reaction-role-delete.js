const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const reactionRoleManager = require('../../lib/reaction-roles');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('reaction-role-delete')
    .setDescription('Delete a reaction role')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(option => 
      option.setName('message_id')
        .setDescription('The ID of the message containing the reaction role')
        .setRequired(true))
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('The channel containing the message')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('emoji')
        .setDescription('The emoji used for the reaction role')
        .setRequired(true)),
  
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
      const emoji = interaction.options.getString('emoji');
      
      // Validate the channel
      if (!channel.isTextBased()) {
        return await interaction.reply({
          content: 'The channel must be a text channel!',
          ephemeral: true
        });
      }
      
      // Generate the reaction role ID
      const id = `${interaction.guildId}-${channel.id}-${messageId}-${emoji}`;
      
      // Get the reaction role
      const reactionRole = reactionRoleManager.getReactionRole(id);
      
      if (!reactionRole) {
        return await interaction.reply({
          content: `Could not find a reaction role with the specified message, channel, and emoji.`,
          ephemeral: true
        });
      }
      
      // Fetch the message and remove the reaction
      try {
        const message = await channel.messages.fetch(messageId);
        
        // Find and remove all reactions with this emoji
        const reactions = message.reactions.cache;
        
        for (const [key, reaction] of reactions) {
          const reactionEmoji = reaction.emoji.id ? 
            `<:${reaction.emoji.name}:${reaction.emoji.id}>` : 
            reaction.emoji.name;
          
          if (reactionEmoji === emoji) {
            await reaction.remove();
            break;
          }
        }
      } catch (error) {
        logger.warn(`Could not remove reaction from message ${messageId}:`, error);
        // Continue with deletion even if removing the reaction fails
      }
      
      // Delete the reaction role
      const deleted = await reactionRoleManager.deleteReactionRole(id);
      
      if (!deleted) {
        return await interaction.reply({
          content: `Failed to delete the reaction role.`,
          ephemeral: true
        });
      }
      
      // Get the role name
      let roleName = `<@&${reactionRole.roleId}>`;
      
      try {
        const role = await interaction.guild.roles.fetch(reactionRole.roleId);
        if (!role) {
          roleName = `Role not found (${reactionRole.roleId})`;
        }
      } catch (error) {
        logger.warn(`Could not fetch role ${reactionRole.roleId}:`, error);
        roleName = `Role not found (${reactionRole.roleId})`;
      }
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Reaction Role Deleted')
        .setDescription(`Successfully deleted the reaction role.`)
        .addFields(
          { name: 'Channel', value: `<#${channel.id}>`, inline: true },
          { name: 'Message ID', value: messageId, inline: true },
          { name: 'Role', value: roleName, inline: true },
          { name: 'Emoji', value: emoji, inline: true }
        );
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing reaction-role-delete command:', error);
      
      await interaction.reply({
        content: `There was an error deleting the reaction role: ${error.message}`,
        ephemeral: true
      });
    }
  }
};