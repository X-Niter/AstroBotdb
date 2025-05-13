const { EmbedBuilder } = require('discord.js');
const autoMod = require('../lib/auto-moderation');
const logger = require('../lib/logger');

module.exports = {
  name: 'guildCreate',
  
  /**
   * Handler for the guildCreate event (bot added to a new server)
   * @param {Client} client - The Discord client
   * @param {Guild} guild - The guild the bot was added to
   */
  async execute(client, guild) {
    try {
      // Log guild join
      logger.info(`Bot added to guild: ${guild.name} (${guild.id}) with ${guild.memberCount} members`);
      
      // Initialize auto-moderation with default settings
      autoMod.initGuild(guild);
      
      // Try to find a system channel or general channel to send welcome message
      const channel = guild.systemChannel || 
                      guild.channels.cache.find(ch => 
                        ch.type === 0 && // Text channel
                        (ch.name.includes('general') || ch.name.includes('chat'))
                      );
      
      if (channel) {
        // Create welcome embed
        const welcomeEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('Hello! I\'m AstroBot AI')
          .setDescription(
            'Thanks for adding me to your server! I\'m an AI-powered Discord bot with moderation, ' +
            'fun commands, and advanced chat features.\n\n' +
            'Here\'s how to get started:'
          )
          .addFields(
            { 
              name: '📋 Commands', 
              value: 'Use `/help` to see all available commands'
            },
            { 
              name: '🤖 AI Chat', 
              value: 'Try `/chat` to have a conversation with my AI'
            },
            { 
              name: '🛡️ Moderation', 
              value: 'I have built-in auto-moderation and manual mod commands like `/ban`, `/kick`, and `/timeout`'
            },
            { 
              name: '🎮 Fun', 
              value: 'Check out `/poll` to create interactive polls'
            }
          )
          .setFooter({
            text: 'AstroBot AI',
            iconURL: client.user.displayAvatarURL()
          });
        
        // Send welcome message
        await channel.send({ embeds: [welcomeEmbed] });
      }
      
      // Create a log message to inform admins about key permissions
      // Find a channel for admin logs
      const adminChannel = guild.channels.cache.find(ch => 
        ch.type === 0 && // Text channel
        (ch.name.includes('admin') || ch.name.includes('mod') || ch.name.includes('log'))
      );
      
      if (adminChannel && adminChannel.permissionsFor(guild.members.me).has('SendMessages')) {
        // Check for important permissions
        const me = guild.members.me;
        const missingPermissions = [];
        
        const requiredPermissions = [
          'ManageMessages',
          'KickMembers',
          'BanMembers',
          'ModerateMembers',
          'ManageRoles',
          'SendMessages',
          'EmbedLinks',
          'AttachFiles',
          'ReadMessageHistory',
          'AddReactions'
        ];
        
        for (const perm of requiredPermissions) {
          if (!me.permissions.has(perm)) {
            missingPermissions.push(perm);
          }
        }
        
        // Create admin setup embed
        const adminEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('AstroBot AI - Admin Setup')
          .setDescription(
            'Thanks for adding me to your server! Here\'s some important information for admins:'
          );
        
        // Add permission status
        if (missingPermissions.length > 0) {
          adminEmbed.addFields({
            name: '⚠️ Missing Permissions',
            value: `For full functionality, I need the following permissions:\n• ${missingPermissions.join('\n• ')}`
          });
        } else {
          adminEmbed.addFields({
            name: '✅ Permissions',
            value: 'I have all the permissions I need to function properly!'
          });
        }
        
        // Add moderation setup info
        adminEmbed.addFields({
          name: '🛡️ Auto-Moderation',
          value: 'Auto-moderation is disabled by default. Use the dashboard to configure it.'
        });
        
        // Add logging channel setup info
        const logChannel = guild.channels.cache.find(ch => 
          ch.type === 0 && // Text channel
          (/^(mod-logs|modlogs|mod-log|audit-log|logs|bot-logs)$/i).test(ch.name)
        );
        
        if (logChannel) {
          adminEmbed.addFields({
            name: '📝 Logging',
            value: `I found a log channel: <#${logChannel.id}>. I'll use this for moderation logs.`
          });
        } else {
          adminEmbed.addFields({
            name: '📝 Logging',
            value: 'Create a channel named `mod-logs`, `bot-logs`, or `logs` for me to post moderation activity.'
          });
        }
        
        // Send admin setup message
        await adminChannel.send({ embeds: [adminEmbed] });
      }
    } catch (error) {
      logger.error(`Error handling guild create for ${guild.id}:`, error);
    }
  }
};