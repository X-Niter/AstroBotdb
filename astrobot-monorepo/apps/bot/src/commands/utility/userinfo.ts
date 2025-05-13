import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember, User } from 'discord.js';
import { Command } from '../../types/discord';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Displays information about a user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to show information about')
        .setRequired(false)),
    
  async execute(interaction: ChatInputCommandInteraction) {
    // Get the target user (mentioned user or command user)
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    // Get guild member if in a guild
    let targetMember: GuildMember | null = null;
    if (interaction.guild) {
      targetMember = interaction.options.getMember('user') as GuildMember || 
                     await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    }
    
    // Create base embed
    const embed = new EmbedBuilder()
      .setColor(targetMember?.displayColor || 0x3366FF)
      .setTitle(`User Information: ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '📋 User ID', value: targetUser.id, inline: true },
        { name: '🤖 Bot', value: targetUser.bot ? 'Yes' : 'No', inline: true }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();
    
    // Add account creation date
    const createdTimestamp = Math.floor(targetUser.createdTimestamp / 1000);
    embed.addFields({
      name: '📅 Account Created',
      value: `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`,
      inline: false
    });
    
    // Add member-specific information if in a guild
    if (targetMember) {
      // Add join date
      const joinedTimestamp = targetMember.joinedTimestamp ? Math.floor(targetMember.joinedTimestamp / 1000) : null;
      if (joinedTimestamp) {
        embed.addFields({
          name: '📥 Server Joined',
          value: `<t:${joinedTimestamp}:F> (<t:${joinedTimestamp}:R>)`,
          inline: false
        });
      }
      
      // Add roles (excluding @everyone)
      const roles = targetMember.roles.cache
        .filter(role => role.id !== interaction.guild!.id)
        .sort((a, b) => b.position - a.position)
        .map(role => `<@&${role.id}>`)
        .join(', ');
      
      if (roles) {
        embed.addFields({
          name: `📝 Roles (${targetMember.roles.cache.size - 1})`,
          value: roles || 'No roles',
          inline: false
        });
      }
      
      // Add nickname if present
      if (targetMember.nickname) {
        embed.addFields({
          name: '📝 Nickname',
          value: targetMember.nickname,
          inline: true
        });
      }
      
      // Add boosting information if available
      if (targetMember.premiumSince) {
        const boostTimestamp = Math.floor(targetMember.premiumSince.getTime() / 1000);
        embed.addFields({
          name: '🚀 Boosting Since',
          value: `<t:${boostTimestamp}:F> (<t:${boostTimestamp}:R>)`,
          inline: true
        });
      }
    }
    
    // Send the embed
    await interaction.reply({ embeds: [embed] });
  },
} as Command;