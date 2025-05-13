import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/discord';
import { logger } from '../../utils/logger';
import { prisma } from '../../index';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false))
    .addIntegerOption(option => 
      option.setName('days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
  async execute(interaction: ChatInputCommandInteraction) {
    // Check if the bot has permission to ban members
    if (!interaction.guild?.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.reply({
        content: 'I don\'t have permission to ban members in this server.',
        ephemeral: true
      });
    }
    
    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const days = interaction.options.getInteger('days') || 0;
    
    // Cannot ban the bot itself
    if (targetUser.id === interaction.client.user?.id) {
      return interaction.reply({
        content: 'I cannot ban myself.',
        ephemeral: true
      });
    }
    
    // Cannot ban the server owner
    if (targetUser.id === interaction.guild?.ownerId) {
      return interaction.reply({
        content: 'I cannot ban the server owner.',
        ephemeral: true
      });
    }
    
    try {
      // Fetch the member to check if they exist in the server
      const targetMember = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);
      
      // Check if the target member's role is higher than the bot's role
      if (targetMember) {
        const botRole = interaction.guild?.members.me?.roles.highest;
        if (botRole && targetMember.roles.highest.position >= botRole.position) {
          return interaction.reply({
            content: 'I cannot ban this user as their highest role is above or equal to my highest role.',
            ephemeral: true
          });
        }
        
        // Check if the command user's role is higher than the target's role
        const memberRole = interaction.member?.roles?.highest;
        if (memberRole && targetMember.roles.highest.position >= memberRole.position) {
          return interaction.reply({
            content: 'You cannot ban this user as their highest role is above or equal to your highest role.',
            ephemeral: true
          });
        }
      }
      
      // Ban the user
      await interaction.guild?.members.ban(targetUser, { 
        deleteMessageDays: days, 
        reason: `${reason} - Banned by ${interaction.user.tag}` 
      });
      
      // Create an embed to confirm the ban
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('User Banned')
        .setDescription(`**${targetUser.tag}** has been banned from the server.`)
        .addFields(
          { name: '📋 User ID', value: targetUser.id, inline: true },
          { name: '👤 Banned By', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📝 Reason', value: reason, inline: false },
          { name: '🗑️ Message Deletion', value: `${days} day(s)`, inline: true }
        )
        .setFooter({ text: `Moderator: ${interaction.user.tag}` })
        .setTimestamp();
      
      // Log the ban to the database
      try {
        await prisma.modAction.create({
          data: {
            guildId: interaction.guild?.id || '',
            userId: targetUser.id,
            moderatorId: interaction.user.id,
            type: 'BAN',
            reason: reason,
            metadata: JSON.stringify({
              deleteMessageDays: days
            })
          }
        });
      } catch (dbError) {
        logger.error('Failed to log ban action to database:', dbError);
        // Continue even if database logging fails
      }
      
      // Reply with the ban confirmation
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      logger.error('Error banning user:', error);
      
      await interaction.reply({
        content: `Failed to ban the user. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ephemeral: true
      });
    }
  },
} as Command;