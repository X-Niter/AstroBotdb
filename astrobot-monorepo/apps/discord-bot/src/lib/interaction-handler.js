const { InteractionType } = require('discord.js');
const logger = require('./logger');

/**
 * Handle all types of interactions
 * @param {Client} client - The Discord client
 * @param {Interaction} interaction - The interaction to handle
 */
async function handleInteraction(client, interaction) {
  try {
    // Handle different interaction types
    switch (interaction.type) {
      case InteractionType.ApplicationCommand:
        await handleApplicationCommand(client, interaction);
        break;
      case InteractionType.MessageComponent:
        await handleMessageComponent(client, interaction);
        break;
      case InteractionType.ApplicationCommandAutocomplete:
        await handleAutocomplete(client, interaction);
        break;
      case InteractionType.ModalSubmit:
        await handleModalSubmit(client, interaction);
        break;
      default:
        logger.warn(`Unhandled interaction type: ${interaction.type}`);
    }
  } catch (error) {
    logger.error(`Error handling interaction ${interaction.id}:`, error);
    
    // Try to respond to the interaction if we haven't already
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({
          content: 'An error occurred while processing this interaction. Please try again later.',
          ephemeral: true
        });
      } catch (replyError) {
        logger.error('Failed to send error response:', replyError);
      }
    }
  }
}

/**
 * Handle application commands (slash commands and context menus)
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The command interaction
 */
async function handleApplicationCommand(client, interaction) {
  // Get the command from the appropriate collection
  const command = interaction.commandType === 1
    ? client.slashCommands.get(interaction.commandName)
    : client.contextMenuCommands.get(interaction.commandName);
  
  // If command doesn't exist, ignore
  if (!command) {
    logger.warn(`Command not found: ${interaction.commandName}`);
    return;
  }
  
  // Check if command has required permissions
  if (command.permissions && command.permissions.length > 0) {
    if (!interaction.member.permissions.has(command.permissions)) {
      return await interaction.reply({
        content: `You don't have permission to use this command. Required permissions: ${command.permissions.join(', ')}`,
        ephemeral: true
      });
    }
  }
  
  // Check for cooldown
  if (command.cooldown) {
    const cooldownResult = checkCooldown(client, interaction, command);
    if (cooldownResult) {
      return await interaction.reply(cooldownResult);
    }
  }
  
  // Execute the command
  try {
    await command.execute(client, interaction);
  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);
    
    // Respond to the user if we haven't already
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'There was an error while executing this command.',
        ephemeral: true
      });
    } else if (interaction.deferred && !interaction.replied) {
      await interaction.editReply({
        content: 'There was an error while executing this command.'
      });
    }
  }
}

/**
 * Handle message components (buttons, select menus)
 * @param {Client} client - The Discord client
 * @param {MessageComponentInteraction} interaction - The component interaction
 */
async function handleMessageComponent(client, interaction) {
  const { customId } = interaction;
  
  try {
    // Parse custom ID to determine handler (format: baseId_[action]_[params])
    const [baseId, action, ...params] = customId.split('_');
    
    // Handle buttons
    if (interaction.isButton()) {
      const buttonHandler = client.buttonHandlers.get(baseId) || client.buttonHandlers.get(`${baseId}_${action}`);
      
      if (buttonHandler) {
        await buttonHandler(client, interaction, ...params);
      } else {
        logger.warn(`No handler found for button: ${customId}`);
        await interaction.reply({
          content: 'This button is no longer valid.',
          ephemeral: true
        });
      }
    }
    // Handle select menus
    else if (interaction.isStringSelectMenu()) {
      const selectHandler = client.selectMenuHandlers.get(baseId);
      
      if (selectHandler) {
        await selectHandler(client, interaction, ...params);
      } else {
        logger.warn(`No handler found for select menu: ${customId}`);
        await interaction.reply({
          content: 'This select menu is no longer valid.',
          ephemeral: true
        });
      }
    }
  } catch (error) {
    logger.error(`Error handling component interaction ${customId}:`, error);
    
    if (!interaction.replied) {
      await interaction.reply({
        content: 'There was an error processing this interaction.',
        ephemeral: true
      });
    }
  }
}

/**
 * Handle autocomplete interactions
 * @param {Client} client - The Discord client
 * @param {AutocompleteInteraction} interaction - The autocomplete interaction
 */
async function handleAutocomplete(client, interaction) {
  const command = client.slashCommands.get(interaction.commandName);
  
  // If command doesn't exist or doesn't have an autocomplete function, ignore
  if (!command || !command.autocomplete) {
    return;
  }
  
  try {
    await command.autocomplete(client, interaction);
  } catch (error) {
    logger.error(`Error handling autocomplete for ${interaction.commandName}:`, error);
  }
}

/**
 * Handle modal submissions
 * @param {Client} client - The Discord client
 * @param {ModalSubmitInteraction} interaction - The modal interaction
 */
async function handleModalSubmit(client, interaction) {
  const { customId } = interaction;
  
  try {
    // Parse custom ID to determine handler (format: baseId_[action]_[params])
    const [baseId, action, ...params] = customId.split('_');
    
    const modalHandler = client.modalHandlers.get(baseId) || client.modalHandlers.get(`${baseId}_${action}`);
    
    if (modalHandler) {
      await modalHandler(client, interaction, ...params);
    } else {
      logger.warn(`No handler found for modal: ${customId}`);
      await interaction.reply({
        content: 'This form is no longer valid.',
        ephemeral: true
      });
    }
  } catch (error) {
    logger.error(`Error handling modal submission ${customId}:`, error);
    
    if (!interaction.replied) {
      await interaction.reply({
        content: 'There was an error processing your submission.',
        ephemeral: true
      });
    }
  }
}

/**
 * Check if a command is on cooldown
 * @param {Client} client - The Discord client
 * @param {CommandInteraction} interaction - The command interaction
 * @param {Object} command - The command object
 * @returns {Object|null} Reply object if on cooldown, null otherwise
 */
function checkCooldown(client, interaction, command) {
  if (!client.cooldowns.has(command.data.name)) {
    client.cooldowns.set(command.data.name, new Map());
  }
  
  const now = Date.now();
  const timestamps = client.cooldowns.get(command.data.name);
  const cooldownAmount = (command.cooldown || 3) * 1000;
  
  if (timestamps.has(interaction.user.id)) {
    const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
    
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return {
        content: `Please wait ${timeLeft.toFixed(1)} more second(s) before using the \`${command.data.name}\` command again.`,
        ephemeral: true
      };
    }
  }
  
  timestamps.set(interaction.user.id, now);
  setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);
  
  return null;
}

module.exports = {
  handleInteraction
};