const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove a role from a user')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a role to a user')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to add the role to')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The role to add')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a role from a user')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to remove the role from')
            .setRequired(true))
        .addRoleOption(option => 
          option.setName('role')
            .setDescription('The role to remove')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all roles of a user')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to list roles for')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
  
  // Required permissions (checked manually)
  permissions: ['ManageRoles'],
  
  // Cooldown in seconds
  cooldown: 3,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    // Get the subcommand
    const subcommand = interaction.options.getSubcommand();
    
    // Handle each subcommand
    switch (subcommand) {
      case 'add':
        await addRole(interaction);
        break;
      case 'remove':
        await removeRole(interaction);
        break;
      case 'list':
        await listRoles(interaction);
        break;
      default:
        await interaction.reply({ content: 'Invalid subcommand.', ephemeral: true });
    }
  }
};

/**
 * Add a role to a user
 * @param {CommandInteraction} interaction - The interaction that triggered the command
 */
async function addRole(interaction) {
  // Get the user and role
  const targetUser = interaction.options.getUser('user');
  const role = interaction.options.getRole('role');
  
  // Defer reply in case this takes some time
  await interaction.deferReply();
  
  try {
    // Get the target member
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    
    // Check if the bot can manage the role
    if (role.managed) {
      return await interaction.editReply(`I cannot assign the ${role.name} role as it is managed by an integration.`);
    }
    
    // Check if the role is too high in the hierarchy for the bot
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
      return await interaction.editReply(`I cannot assign the ${role.name} role as it is higher than or equal to my highest role.`);
    }
    
    // Check if the user already has the role
    if (targetMember.roles.cache.has(role.id)) {
      return await interaction.editReply(`${targetUser.tag} already has the ${role.name} role.`);
    }
    
    // Check if the role is higher than the command user's highest role
    if (
      role.position >= interaction.member.roles.highest.position &&
      interaction.guild.ownerId !== interaction.user.id
    ) {
      return await interaction.editReply(`You cannot assign the ${role.name} role as it is higher than or equal to your highest role.`);
    }
    
    // Add the role
    await targetMember.roles.add(role, `Role added by ${interaction.user.tag}`);
    
    // Log the role addition
    logger.info(`Role ${role.name} (${role.id}) was added to ${targetUser.tag} (${targetUser.id}) by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guild.name} (${interaction.guild.id})`);
    
    // Send confirmation message
    await interaction.editReply(`Successfully added the ${role.name} role to ${targetUser.tag}.`);
  } catch (error) {
    logger.error(`Error adding role:`, error);
    await interaction.editReply(`There was an error adding the role: ${error.message}`);
  }
}

/**
 * Remove a role from a user
 * @param {CommandInteraction} interaction - The interaction that triggered the command
 */
async function removeRole(interaction) {
  // Get the user and role
  const targetUser = interaction.options.getUser('user');
  const role = interaction.options.getRole('role');
  
  // Defer reply in case this takes some time
  await interaction.deferReply();
  
  try {
    // Get the target member
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    
    // Check if the bot can manage the role
    if (role.managed) {
      return await interaction.editReply(`I cannot remove the ${role.name} role as it is managed by an integration.`);
    }
    
    // Check if the role is too high in the hierarchy for the bot
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
      return await interaction.editReply(`I cannot remove the ${role.name} role as it is higher than or equal to my highest role.`);
    }
    
    // Check if the user doesn't have the role
    if (!targetMember.roles.cache.has(role.id)) {
      return await interaction.editReply(`${targetUser.tag} doesn't have the ${role.name} role.`);
    }
    
    // Check if the role is higher than the command user's highest role
    if (
      role.position >= interaction.member.roles.highest.position &&
      interaction.guild.ownerId !== interaction.user.id
    ) {
      return await interaction.editReply(`You cannot remove the ${role.name} role as it is higher than or equal to your highest role.`);
    }
    
    // Remove the role
    await targetMember.roles.remove(role, `Role removed by ${interaction.user.tag}`);
    
    // Log the role removal
    logger.info(`Role ${role.name} (${role.id}) was removed from ${targetUser.tag} (${targetUser.id}) by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guild.name} (${interaction.guild.id})`);
    
    // Send confirmation message
    await interaction.editReply(`Successfully removed the ${role.name} role from ${targetUser.tag}.`);
  } catch (error) {
    logger.error(`Error removing role:`, error);
    await interaction.editReply(`There was an error removing the role: ${error.message}`);
  }
}

/**
 * List all roles of a user
 * @param {CommandInteraction} interaction - The interaction that triggered the command
 */
async function listRoles(interaction) {
  // Get the user
  const targetUser = interaction.options.getUser('user');
  
  try {
    // Get the target member
    const targetMember = await interaction.guild.members.fetch(targetUser.id);
    
    // Get the roles
    const roles = targetMember.roles.cache
      .sort((a, b) => b.position - a.position) // Sort by position (highest first)
      .filter(role => role.id !== interaction.guild.id) // Filter out @everyone role
      .map(role => `<@&${role.id}> (${role.name})`)
      .join('\n');
    
    // Send message with roles
    if (roles.length === 0) {
      await interaction.reply(`${targetUser.tag} doesn't have any roles.`);
    } else {
      await interaction.reply(`**Roles for ${targetUser.tag}**:\n${roles}`);
    }
  } catch (error) {
    logger.error(`Error listing roles:`, error);
    await interaction.reply({ content: `There was an error listing the roles: ${error.message}`, ephemeral: true });
  }
}