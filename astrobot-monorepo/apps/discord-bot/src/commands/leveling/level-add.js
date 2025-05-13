const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const levelManager = require('../../lib/leveling');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('level-add')
    .setDescription('Add XP or levels to a user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to add XP/levels to')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('type')
        .setDescription('What to add')
        .setRequired(true)
        .addChoices(
          { name: 'XP', value: 'xp' },
          { name: 'Levels', value: 'level' }
        ))
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Amount to add')
        .setRequired(true)
        .setMinValue(1)),
  
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
      
      // Get command options
      const targetUser = interaction.options.getUser('user');
      const type = interaction.options.getString('type');
      const amount = interaction.options.getInteger('amount');
      
      // Get current level data
      const currentData = levelManager.getUserLevel(interaction.guildId, targetUser.id);
      
      let levelData;
      
      if (type === 'xp') {
        // Add XP
        levelData = await levelManager.addXP(interaction.guildId, targetUser.id, amount);
        
        // Create embed
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('XP Added')
          .setDescription(`Added ${amount} XP to ${targetUser.toString()}`)
          .addFields(
            { name: 'New Level', value: levelData.level.toString(), inline: true },
            { name: 'Total XP', value: levelData.totalXP.toString(), inline: true }
          );
        
        // Add level up notification if applicable
        if (levelData.leveledUp) {
          embed.addFields({ 
            name: 'Level Up', 
            value: `${targetUser.toString()} leveled up from ${levelData.oldLevel} to ${levelData.level}!`,
            inline: false 
          });
        }
        
        await interaction.reply({ embeds: [embed] });
      } else {
        // Get current level
        const currentLevel = currentData.level;
        
        // Set new level
        const newLevel = currentLevel + amount;
        levelData = await levelManager.setLevel(interaction.guildId, targetUser.id, newLevel);
        
        // Create embed
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('Levels Added')
          .setDescription(`Added ${amount} levels to ${targetUser.toString()}`)
          .addFields(
            { name: 'Previous Level', value: currentLevel.toString(), inline: true },
            { name: 'New Level', value: newLevel.toString(), inline: true },
            { name: 'Total XP', value: levelData.totalXP.toString(), inline: true }
          );
        
        await interaction.reply({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Error executing level-add command:', error);
      
      await interaction.reply({
        content: `There was an error adding XP/levels: ${error.message}`,
        ephemeral: true
      });
    }
  }
};