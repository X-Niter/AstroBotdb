const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for the kick')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  
  // Required permissions (checked manually)
  permissions: ['KickMembers'],
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    // Get the user to kick
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Defer reply to give time for the kick to process
    await interaction.deferReply();
    
    try {
      // Get the target member from the guild
      const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      // Check if the user is in the guild
      if (!targetMember) {
        return await interaction.editReply(`User ${targetUser.tag} is not in this server.`);
      }
      
      // Check if the user can be kicked
      if (!targetMember.kickable) {
        return await interaction.editReply(`I don't have permission to kick ${targetUser.tag}. They may have higher permissions than me.`);
      }
      
      // Check if the user is trying to kick themselves
      if (targetMember.id === interaction.user.id) {
        return await interaction.editReply(`You cannot kick yourself.`);
      }
      
      // Check if the target has higher roles than the command user
      if (
        targetMember.roles.highest.position >= interaction.member.roles.highest.position &&
        interaction.guild.ownerId !== interaction.user.id
      ) {
        return await interaction.editReply(`You cannot kick ${targetUser.tag} as they have equal or higher roles than you.`);
      }
      
      // Try to DM the user about their kick
      try {
        await targetUser.send(`You have been kicked from **${interaction.guild.name}**${reason ? ` for reason: ${reason}` : ''}`);
      } catch (error) {
        // Couldn't DM the user, ignore
        logger.debug(`Could not DM kick notification to ${targetUser.tag}: ${error.message}`);
      }
      
      // Kick the user
      await targetMember.kick(`Kicked by ${interaction.user.tag}: ${reason}`);
      
      // Log the kick
      logger.info(`${targetUser.tag} (${targetUser.id}) was kicked from ${interaction.guild.name} (${interaction.guild.id}) by ${interaction.user.tag} (${interaction.user.id}) for reason: ${reason}`);
      
      // Send confirmation message
      await interaction.editReply(`Successfully kicked **${targetUser.tag}**${reason ? ` for reason: ${reason}` : ''}`);
    } catch (error) {
      logger.error(`Error executing kick command:`, error);
      await interaction.editReply(`There was an error trying to kick the user: ${error.message}`);
    }
  }
};