const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const levelManager = require('../../lib/leveling');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the server leaderboard')
    .addIntegerOption(option => 
      option.setName('limit')
        .setDescription('Number of users to show (default: 10, max: 25)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(25)),
  
  // Cooldown in seconds
  cooldown: 10,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get settings for this guild
      const settings = levelManager.getGuildSettings(interaction.guildId);
      
      // Check if leveling is enabled
      if (!settings.enabled) {
        return await interaction.reply({
          content: 'Leveling is currently disabled in this server.',
          ephemeral: true
        });
      }
      
      // Get the limit
      const limit = interaction.options.getInteger('limit') || 10;
      
      // Get the leaderboard data
      const leaderboardData = levelManager.getLeaderboard(interaction.guildId, limit);
      
      if (leaderboardData.length === 0) {
        return await interaction.reply({
          content: 'No users have earned XP in this server yet!',
          ephemeral: true
        });
      }
      
      // Defer reply as we might need to fetch users
      await interaction.deferReply();
      
      // Fetch users
      const userPromises = leaderboardData.map(async data => {
        try {
          return await client.users.fetch(data.userId);
        } catch (error) {
          logger.warn(`Could not fetch user ${data.userId}:`, error);
          return { 
            id: data.userId,
            username: 'Unknown User',
            displayAvatarURL: () => null
          };
        }
      });
      
      const users = await Promise.all(userPromises);
      
      // Create description with formatted leaderboard
      let description = '';
      
      for (let i = 0; i < leaderboardData.length; i++) {
        const data = leaderboardData[i];
        const user = users.find(u => u.id === data.userId);
        
        // Skip if user not found (shouldn't happen)
        if (!user) continue;
        
        // Add medal emoji for top 3
        let rankDisplay = `${data.rank}.`;
        if (data.rank === 1) rankDisplay = '🥇';
        else if (data.rank === 2) rankDisplay = '🥈';
        else if (data.rank === 3) rankDisplay = '🥉';
        
        description += `${rankDisplay} **${user.username}** • Level ${data.level} • ${data.totalXP} XP\n`;
      }
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${interaction.guild.name} Leaderboard`)
        .setDescription(description)
        .setFooter({ text: `Showing top ${leaderboardData.length} users` })
        .setTimestamp();
      
      // Add thumbnail of #1 user if available
      if (leaderboardData.length > 0 && users[0]) {
        const topUserAvatar = users[0].displayAvatarURL({ dynamic: true, size: 256 });
        if (topUserAvatar) {
          embed.setThumbnail(topUserAvatar);
        }
      }
      
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error executing leaderboard command:', error);
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: `There was an error fetching the leaderboard: ${error.message}`
        });
      } else {
        await interaction.reply({
          content: `There was an error fetching the leaderboard: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }
};