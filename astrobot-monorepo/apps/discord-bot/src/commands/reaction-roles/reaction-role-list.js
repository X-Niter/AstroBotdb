const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const reactionRoleManager = require('../../lib/reaction-roles');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('reaction-role-list')
    .setDescription('List all reaction roles for this server')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get reaction roles for this guild
      const reactionRoles = reactionRoleManager.getReactionRolesForGuild(interaction.guildId);
      
      if (reactionRoles.length === 0) {
        return await interaction.reply({
          content: 'There are no reaction roles for this server.',
          ephemeral: true
        });
      }
      
      // Group reaction roles by message
      const rolesByMessage = {};
      
      for (const role of reactionRoles) {
        if (!rolesByMessage[role.messageId]) {
          rolesByMessage[role.messageId] = [];
        }
        
        rolesByMessage[role.messageId].push(role);
      }
      
      // Create response embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Reaction Roles')
        .setDescription(`Found ${reactionRoles.length} reaction role${reactionRoles.length === 1 ? '' : 's'} for this server.`);
      
      // Add fields for each message
      let messageCounter = 1;
      
      for (const [messageId, roles] of Object.entries(rolesByMessage)) {
        // Try to fetch the first role's channel and message
        const firstRole = roles[0];
        let channelName = `<#${firstRole.channelId}>`;
        let messagePreview = 'Could not fetch message';
        
        // Try to get the channel and message
        try {
          const channel = await interaction.guild.channels.fetch(firstRole.channelId);
          
          if (channel) {
            try {
              const message = await channel.messages.fetch(messageId);
              
              if (message) {
                messagePreview = message.content.length > 50 
                  ? message.content.substring(0, 47) + '...' 
                  : message.content || '*No content (possibly an embed)*';
              }
            } catch (error) {
              logger.warn(`Could not fetch message ${messageId}:`, error);
            }
          }
        } catch (error) {
          logger.warn(`Could not fetch channel ${firstRole.channelId}:`, error);
          channelName = `Channel ID: ${firstRole.channelId}`;
        }
        
        // Create field value
        let fieldValue = `Channel: ${channelName}\n`;
        fieldValue += `Message ID: ${messageId}\n`;
        fieldValue += `Message Preview: ${messagePreview}\n\n`;
        fieldValue += `**Roles:**\n`;
        
        // Add roles to the field value
        for (const role of roles) {
          let roleName = `<@&${role.roleId}>`;
          
          try {
            const guildRole = await interaction.guild.roles.fetch(role.roleId);
            if (!guildRole) {
              roleName = `Role not found (${role.roleId})`;
            }
          } catch (error) {
            logger.warn(`Could not fetch role ${role.roleId}:`, error);
            roleName = `Role not found (${role.roleId})`;
          }
          
          fieldValue += `• ${role.emoji} → ${roleName}`;
          
          if (role.exclusive) {
            fieldValue += ` (Exclusive)`;
          } else if (role.group) {
            fieldValue += ` (Group: ${role.group})`;
          }
          
          fieldValue += `\n`;
        }
        
        embed.addFields({ 
          name: `Message #${messageCounter++}`, 
          value: fieldValue 
        });
      }
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing reaction-role-list command:', error);
      
      await interaction.reply({
        content: `There was an error listing reaction roles: ${error.message}`,
        ephemeral: true
      });
    }
  }
};