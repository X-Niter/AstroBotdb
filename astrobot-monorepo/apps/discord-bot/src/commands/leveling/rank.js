const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const levelManager = require('../../lib/leveling');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Check your rank and level')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to check (defaults to yourself)')
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
      // Get settings for this guild
      const settings = levelManager.getGuildSettings(interaction.guildId);
      
      // Check if leveling is enabled
      if (!settings.enabled) {
        return await interaction.reply({
          content: 'Leveling is currently disabled in this server.',
          ephemeral: true
        });
      }
      
      // Get the target user
      const targetUser = interaction.options.getUser('user') || interaction.user;
      
      // Get the user's level data
      const levelData = levelManager.getUserLevel(interaction.guildId, targetUser.id);
      
      // Calculate progress bar
      const progressBarLength = 20;
      const progress = Math.min(1, levelData.currentXP / levelData.requiredXP);
      const progressBars = '█'.repeat(Math.floor(progress * progressBarLength)) + 
        '░'.repeat(Math.ceil((1 - progress) * progressBarLength));
      
      // Format the progress percentage
      const progressPercent = Math.floor(progress * 100);
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${targetUser.username}'s Rank`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: 'Level', value: levelData.level.toString(), inline: true },
          { name: 'Rank', value: `#${levelData.rank}`, inline: true },
          { name: 'Total XP', value: levelData.totalXP.toString(), inline: true },
          { name: 'Progress', value: `${progressBars} ${progressPercent}%\n${levelData.currentXP} / ${levelData.requiredXP} XP`, inline: false },
          { name: 'Messages', value: levelData.messageCount.toString(), inline: true }
        )
        .setFooter({ text: `Level ${levelData.level} → Level ${levelData.level + 1}` })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      logger.error('Error executing rank command:', error);
      
      await interaction.reply({
        content: `There was an error checking your rank: ${error.message}`,
        ephemeral: true
      });
    }
  }
};