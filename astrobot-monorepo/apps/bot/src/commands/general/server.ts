import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/discord';

export default {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Displays information about the current server'),
    
  async execute(interaction: ChatInputCommandInteraction) {
    const { guild } = interaction;
    
    if (!guild) {
      return interaction.reply({
        content: 'This command can only be used in servers.',
        ephemeral: true
      });
    }
    
    // Fetch more guild data if needed
    await guild.fetch();
    
    // Determine verification level string
    const verificationLevels = {
      0: 'None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
      4: 'Very High'
    };
    
    // Calculate member stats
    const memberCount = guild.memberCount;
    const botCount = guild.members.cache.filter(member => member.user.bot).size;
    const humanCount = memberCount - botCount;
    
    // Format creation date
    const createdTimestamp = Math.floor(guild.createdTimestamp / 1000);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x3366FF)
      .setTitle(`${guild.name} Server Info`)
      .setThumbnail(guild.iconURL({ size: 256 }) || '')
      .addFields(
        { name: '📋 Server ID', value: guild.id, inline: true },
        { name: '👑 Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: '🌍 Region', value: guild.preferredLocale || 'Unknown', inline: true },
        { name: '👥 Members', value: `
          Total: ${memberCount}
          Humans: ${humanCount}
          Bots: ${botCount}
        `, inline: true },
        { name: '🔐 Verification', value: verificationLevels[guild.verificationLevel as keyof typeof verificationLevels], inline: true },
        { name: '📅 Created', value: `<t:${createdTimestamp}:F> (<t:${createdTimestamp}:R>)`, inline: false }
      )
      .setFooter({ text: `Requested by ${interaction.user.tag}` })
      .setTimestamp();
      
    // Add boost information if available
    if (guild.premiumTier !== 'NONE') {
      embed.addFields({
        name: '🚀 Server Boost',
        value: `Level ${guild.premiumTier} with ${guild.premiumSubscriptionCount || 0} boosts`,
        inline: false
      });
    }
    
    await interaction.reply({ embeds: [embed] });
  },
} as Command;