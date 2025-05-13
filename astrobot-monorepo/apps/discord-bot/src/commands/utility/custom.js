const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const commandManager = require('../../lib/custom-commands/command-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('custom')
    .setDescription('Manage custom commands')
    .addSubcommand(subcommand =>
      subcommand.setName('create')
        .setDescription('Create a new custom command')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The command name')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('response')
            .setDescription('The command response (supports placeholders like {user}, {username}, {server}, etc.)')
            .setRequired(true))
        .addNumberOption(option =>
          option.setName('cooldown')
            .setDescription('Cooldown in seconds (0 for no cooldown)')
            .setMinValue(0)
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('delete-trigger')
            .setDescription('Whether to delete the message that triggered the command')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('restricted')
            .setDescription('Whether the command is restricted to certain roles')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('role1')
            .setDescription('A role that can use this command')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('role2')
            .setDescription('A role that can use this command')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('role3')
            .setDescription('A role that can use this command')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('edit')
        .setDescription('Edit an existing custom command')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The command name to edit')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('response')
            .setDescription('The new command response')
            .setRequired(false))
        .addNumberOption(option =>
          option.setName('cooldown')
            .setDescription('Cooldown in seconds (0 for no cooldown)')
            .setMinValue(0)
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('delete-trigger')
            .setDescription('Whether to delete the message that triggered the command')
            .setRequired(false))
        .addBooleanOption(option =>
          option.setName('restricted')
            .setDescription('Whether the command is restricted to certain roles')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('role1')
            .setDescription('A role that can use this command')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('role2')
            .setDescription('A role that can use this command')
            .setRequired(false))
        .addRoleOption(option =>
          option.setName('role3')
            .setDescription('A role that can use this command')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand.setName('delete')
        .setDescription('Delete a custom command')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The command name to delete')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('list')
        .setDescription('List all custom commands'))
    .addSubcommand(subcommand =>
      subcommand.setName('info')
        .setDescription('View information about a custom command')
        .addStringOption(option =>
          option.setName('name')
            .setDescription('The command name')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand.setName('help')
        .setDescription('Get help with custom commands')),
  
  // Cooldown in seconds
  cooldown: 3,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      const subcommand = interaction.options.getSubcommand();
      
      switch (subcommand) {
        case 'create':
          await handleCreateCommand(interaction);
          break;
          
        case 'edit':
          await handleEditCommand(interaction);
          break;
          
        case 'delete':
          await handleDeleteCommand(interaction);
          break;
          
        case 'list':
          await handleListCommands(interaction);
          break;
          
        case 'info':
          await handleCommandInfo(interaction);
          break;
          
        case 'help':
          await handleCommandHelp(interaction);
          break;
          
        default:
          await interaction.reply({
            content: 'Unknown subcommand.',
            ephemeral: true
          });
      }
    } catch (error) {
      logger.error('Error executing custom command:', error);
      
      // Handle already replied or deferred
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(`An error occurred: ${error.message}`);
      } else {
        await interaction.reply({
          content: `An error occurred: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }
};

/**
 * Handle creating a custom command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleCreateCommand(interaction) {
  try {
    // Get options
    const name = interaction.options.getString('name');
    const response = interaction.options.getString('response');
    const cooldown = interaction.options.getNumber('cooldown') || 0;
    const deleteCommand = interaction.options.getBoolean('delete-trigger') || false;
    const restricted = interaction.options.getBoolean('restricted') || false;
    
    // Get roles
    const allowedRoles = [];
    
    for (let i = 1; i <= 3; i++) {
      const role = interaction.options.getRole(`role${i}`);
      
      if (role && !allowedRoles.includes(role.id) && role.id !== interaction.guild.id) {
        allowedRoles.push(role.id);
      }
    }
    
    // Validate name
    if (!/^[\w-]{1,32}$/.test(name)) {
      return interaction.reply({
        content: 'Command name must be 1-32 characters and only contain letters, numbers, underscores, and hyphens.',
        ephemeral: true
      });
    }
    
    // Check if restricted but no roles
    if (restricted && allowedRoles.length === 0) {
      return interaction.reply({
        content: 'You must specify at least one allowed role for a restricted command.',
        ephemeral: true
      });
    }
    
    // Create command
    const command = await commandManager.createCommand(interaction.guild.id, name, response, {
      createdBy: interaction.user.id,
      cooldown,
      deleteCommand,
      restricted,
      allowedRoles
    });
    
    // Format roles
    let rolesText = 'None (anyone can use)';
    
    if (restricted && allowedRoles.length > 0) {
      rolesText = allowedRoles
        .map(roleId => {
          const role = interaction.guild.roles.cache.get(roleId);
          return role ? role.toString() : `Unknown Role (${roleId})`;
        })
        .join(', ');
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Custom Command Created')
      .setDescription(`The command \`!${name}\` has been created.`)
      .addFields(
        { name: 'Response', value: response, inline: false },
        { name: 'Cooldown', value: cooldown > 0 ? `${cooldown} seconds` : 'None', inline: true },
        { name: 'Delete Trigger', value: deleteCommand ? 'Yes' : 'No', inline: true },
        { name: 'Restricted', value: restricted ? 'Yes' : 'No', inline: true },
        { name: 'Allowed Roles', value: rolesText, inline: false }
      )
      .setFooter({ text: `Created by ${interaction.user.tag}` })
      .setTimestamp();
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} created custom command ${name} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error creating custom command:', error);
    
    // If command already exists, give a friendly error
    if (error.message && error.message.includes('already exists')) {
      await interaction.reply({
        content: `A command with the name "${interaction.options.getString('name')}" already exists. Please choose a different name or edit the existing command.`,
        ephemeral: true
      });
      return;
    }
    
    throw error;
  }
}

/**
 * Handle editing a custom command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleEditCommand(interaction) {
  try {
    // Get options
    const name = interaction.options.getString('name');
    const response = interaction.options.getString('response');
    const cooldown = interaction.options.getNumber('cooldown');
    const deleteCommand = interaction.options.getBoolean('delete-trigger');
    const restricted = interaction.options.getBoolean('restricted');
    
    // Get command
    const command = commandManager.getCommand(interaction.guild.id, name);
    
    if (!command) {
      return interaction.reply({
        content: `Command "${name}" does not exist in this server.`,
        ephemeral: true
      });
    }
    
    // Build updates
    const updates = {
      updatedBy: interaction.user.id
    };
    
    if (response !== null) {
      updates.response = response;
    }
    
    if (cooldown !== null) {
      updates.cooldown = cooldown;
    }
    
    if (deleteCommand !== null) {
      updates.deleteCommand = deleteCommand;
    }
    
    if (restricted !== null) {
      updates.restricted = restricted;
    }
    
    // Get roles if restricted is true or null (use existing)
    if (restricted !== false) {
      // Get roles
      const allowedRoles = [];
      
      for (let i = 1; i <= 3; i++) {
        const role = interaction.options.getRole(`role${i}`);
        
        if (role && !allowedRoles.includes(role.id) && role.id !== interaction.guild.id) {
          allowedRoles.push(role.id);
        }
      }
      
      // Use existing roles if none provided
      if (allowedRoles.length > 0 || restricted) {
        updates.allowedRoles = allowedRoles;
      }
      
      // Check if command is being restricted with no roles
      if (restricted === true && updates.allowedRoles && updates.allowedRoles.length === 0) {
        return interaction.reply({
          content: 'You must specify at least one allowed role for a restricted command.',
          ephemeral: true
        });
      }
    }
    
    // Skip update if no changes
    if (Object.keys(updates).length <= 1) { // Only contains updatedBy
      return interaction.reply({
        content: 'No changes were specified for the command.',
        ephemeral: true
      });
    }
    
    // Edit command
    const updatedCommand = await commandManager.editCommand(interaction.guild.id, name, updates);
    
    // Format roles
    let rolesText = 'None (anyone can use)';
    
    if (updatedCommand.restricted && updatedCommand.allowedRoles && updatedCommand.allowedRoles.length > 0) {
      rolesText = updatedCommand.allowedRoles
        .map(roleId => {
          const role = interaction.guild.roles.cache.get(roleId);
          return role ? role.toString() : `Unknown Role (${roleId})`;
        })
        .join(', ');
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Custom Command Updated')
      .setDescription(`The command \`!${name}\` has been updated.`)
      .addFields(
        { name: 'Response', value: updatedCommand.response, inline: false },
        { name: 'Cooldown', value: updatedCommand.cooldown > 0 ? `${updatedCommand.cooldown} seconds` : 'None', inline: true },
        { name: 'Delete Trigger', value: updatedCommand.deleteCommand ? 'Yes' : 'No', inline: true },
        { name: 'Restricted', value: updatedCommand.restricted ? 'Yes' : 'No', inline: true },
        { name: 'Allowed Roles', value: rolesText, inline: false }
      )
      .setFooter({ text: `Updated by ${interaction.user.tag}` })
      .setTimestamp();
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
    
    logger.info(`User ${interaction.user.tag} updated custom command ${name} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error editing custom command:', error);
    throw error;
  }
}

/**
 * Handle deleting a custom command
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleDeleteCommand(interaction) {
  try {
    // Get options
    const name = interaction.options.getString('name');
    
    // Check if command exists
    const command = commandManager.getCommand(interaction.guild.id, name);
    
    if (!command) {
      return interaction.reply({
        content: `Command "${name}" does not exist in this server.`,
        ephemeral: true
      });
    }
    
    // Delete command
    const success = await commandManager.deleteCommand(interaction.guild.id, name);
    
    if (!success) {
      return interaction.reply({
        content: 'Failed to delete the command.',
        ephemeral: true
      });
    }
    
    // Send reply
    await interaction.reply({
      content: `Successfully deleted custom command \`!${name}\`.`,
      ephemeral: true
    });
    
    logger.info(`User ${interaction.user.tag} deleted custom command ${name} in ${interaction.guild.name}`);
  } catch (error) {
    logger.error('Error deleting custom command:', error);
    throw error;
  }
}

/**
 * Handle listing custom commands
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleListCommands(interaction) {
  try {
    // Get commands
    const commands = commandManager.getGuildCommands(interaction.guild.id);
    
    if (commands.length === 0) {
      return interaction.reply({
        content: 'No custom commands have been created in this server.',
        ephemeral: true
      });
    }
    
    // Sort commands by name
    commands.sort((a, b) => a.name.localeCompare(b.name));
    
    // Group commands by restrictions
    const generalCommands = commands.filter(cmd => !cmd.restricted);
    const restrictedCommands = commands.filter(cmd => cmd.restricted);
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Custom Commands')
      .setDescription(`This server has ${commands.length} custom command(s).`)
      .setFooter({ text: `Use /custom info <name> to see details` })
      .setTimestamp();
    
    // Add general commands
    if (generalCommands.length > 0) {
      const generalList = generalCommands
        .map(cmd => `\`!${cmd.name}\``)
        .join(', ');
      
      embed.addFields({ name: '📝 General Commands', value: generalList, inline: false });
    }
    
    // Add restricted commands
    if (restrictedCommands.length > 0) {
      const restrictedList = restrictedCommands
        .map(cmd => `\`!${cmd.name}\``)
        .join(', ');
      
      embed.addFields({ name: '🔒 Restricted Commands', value: restrictedList, inline: false });
    }
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error listing custom commands:', error);
    throw error;
  }
}

/**
 * Handle command info
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleCommandInfo(interaction) {
  try {
    // Get options
    const name = interaction.options.getString('name');
    
    // Get command
    const command = commandManager.getCommand(interaction.guild.id, name);
    
    if (!command) {
      return interaction.reply({
        content: `Command "${name}" does not exist in this server.`,
        ephemeral: true
      });
    }
    
    // Get creator and updater
    let creatorTag = 'Unknown User';
    let updaterTag = 'Unknown User';
    
    try {
      if (command.createdBy) {
        const creator = await interaction.client.users.fetch(command.createdBy);
        creatorTag = creator.tag;
      }
      
      if (command.updatedBy && command.updatedBy !== command.createdBy) {
        const updater = await interaction.client.users.fetch(command.updatedBy);
        updaterTag = updater.tag;
      } else {
        updaterTag = creatorTag;
      }
    } catch (userError) {
      logger.warn(`Could not fetch user info for command ${name}: ${userError.message}`);
    }
    
    // Format roles
    let rolesText = 'None (anyone can use)';
    
    if (command.restricted && command.allowedRoles && command.allowedRoles.length > 0) {
      rolesText = command.allowedRoles
        .map(roleId => {
          const role = interaction.guild.roles.cache.get(roleId);
          return role ? role.toString() : `Unknown Role (${roleId})`;
        })
        .join(', ');
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`Command Info: !${command.name}`)
      .setDescription(command.response)
      .addFields(
        { name: 'Usage Count', value: `${command.usageCount || 0}`, inline: true },
        { name: 'Cooldown', value: command.cooldown > 0 ? `${command.cooldown} seconds` : 'None', inline: true },
        { name: 'Delete Trigger', value: command.deleteCommand ? 'Yes' : 'No', inline: true },
        { name: 'Restricted', value: command.restricted ? 'Yes' : 'No', inline: true },
        { name: 'Allowed Roles', value: rolesText, inline: false },
        { name: 'Created By', value: creatorTag, inline: true },
        { name: 'Last Updated By', value: updaterTag, inline: true }
      )
      .setTimestamp(new Date(command.updatedAt))
      .setFooter({ text: `Created: ${new Date(command.createdAt).toLocaleDateString()}` });
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error getting command info:', error);
    throw error;
  }
}

/**
 * Handle command help
 * @param {CommandInteraction} interaction - The interaction
 */
async function handleCommandHelp(interaction) {
  try {
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Custom Commands Help')
      .setDescription('Custom commands allow server administrators to create simple commands that respond with predefined messages.')
      .addFields(
        { name: 'Using Custom Commands', value: 'To use a custom command, simply type `!commandname` in any channel.', inline: false },
        { name: 'Placeholders', value: 'You can use placeholders in command responses to include dynamic content:', inline: false },
        { name: 'Available Placeholders', value: 
          '`{user}` - Mentions the user\n' +
          '`{username}` - User\'s username\n' +
          '`{displayname}` - User\'s display name\n' +
          '`{server}` - Server name\n' +
          '`{channel}` - Mentions the channel\n' +
          '`{membercount}` - Number of members\n' +
          '`{userid}` - User\'s ID\n' +
          '`{random:X-Y}` - Random number between X and Y',
          inline: false
        },
        { name: 'Examples', value: 
          '`/custom create name:rules response:Check the rules in {channel}!`\n' +
          '`/custom create name:roll response:You rolled a {random:1-100}`',
          inline: false
        }
      )
      .setFooter({ text: 'Only users with "Manage Server" permission can create/edit commands' });
    
    // Send reply
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error displaying command help:', error);
    throw error;
  }
}