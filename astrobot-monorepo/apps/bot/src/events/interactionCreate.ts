import { Events, Interaction, Collection } from 'discord.js';
import { Command, Event } from '../types/discord';
import { logger } from '../utils/logger';
import { config } from '../config';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName) as Command;

      if (!command) {
        logger.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      // Handle command cooldowns
      const { cooldowns } = interaction.client;
      const defaultCooldown = config.bot.defaultCooldown;
      const commandCooldown = command.cooldown ?? defaultCooldown;

      if (!cooldowns.has(command.data.name)) {
        cooldowns.set(command.data.name, new Collection());
      }

      const now = Date.now();
      const timestamps = cooldowns.get(command.data.name);
      if (!timestamps) return;
      
      const cooldownAmount = commandCooldown * 1000;

      if (timestamps.has(interaction.user.id)) {
        const expirationTime = timestamps.get(interaction.user.id)! + cooldownAmount;

        if (now < expirationTime) {
          const expiredTimestamp = Math.round(expirationTime / 1000);
          await interaction.reply({
            content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
            ephemeral: true
          });
          return;
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      try {
        // Log command usage
        logger.command(
          interaction.user.id,
          interaction.guild?.id || 'DM',
          interaction.commandName
        );
        
        // Execute the command
        await command.execute(interaction);
      } catch (error) {
        logger.error(`Error executing ${interaction.commandName}:`, error);
        
        const errorMessage = 'There was an error while executing this command.';
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: errorMessage, ephemeral: true });
        } else {
          await interaction.reply({ content: errorMessage, ephemeral: true });
        }
      }
    }
    // Handle other interaction types (buttons, modals, etc.)
    else if (interaction.isButton()) {
      // Handle button interactions
      logger.debug(`Button interaction: ${interaction.customId}`);
    }
    else if (interaction.isModalSubmit()) {
      // Handle modal submissions
      logger.debug(`Modal interaction: ${interaction.customId}`);
    }
    else if (interaction.isSelectMenu()) {
      // Handle select menu interactions
      logger.debug(`Select menu interaction: ${interaction.customId}`);
    }
  },
} as Event;