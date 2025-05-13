const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages at once')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false))
    .addBooleanOption(option => 
      option.setName('include_pinned')
        .setDescription('Include pinned messages in deletion')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  
  // Required permissions (checked manually)
  permissions: ['ManageMessages'],
  
  // Cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    // Get the options
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');
    const includePinned = interaction.options.getBoolean('include_pinned') || false;
    
    // Defer reply as this can take time
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Fetch messages from the channel
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      
      // Filter messages based on options
      let messagesToDelete = messages.filter(msg => {
        // Skip messages older than 14 days (Discord API limitation)
        if (Date.now() - msg.createdTimestamp > 14 * 24 * 60 * 60 * 1000) return false;
        
        // Skip pinned messages unless explicitly included
        if (msg.pinned && !includePinned) return false;
        
        // Filter by user if specified
        if (user && msg.author.id !== user.id) return false;
        
        return true;
      });
      
      // Take only the requested amount
      messagesToDelete = messagesToDelete.first(amount);
      
      // Skip if no messages to delete
      if (messagesToDelete.length === 0) {
        return await interaction.editReply({
          content: 'No messages found that match your criteria.',
          ephemeral: true
        });
      }
      
      // Delete the messages
      let deletedCount = 0;
      
      // Bulk delete if multiple messages and all are newer than 14 days
      if (messagesToDelete.length > 1) {
        try {
          const deleted = await interaction.channel.bulkDelete(messagesToDelete);
          deletedCount = deleted.size;
        } catch (error) {
          // If bulk delete fails (messages too old), fall back to individual deletion
          for (const message of messagesToDelete) {
            try {
              await message.delete();
              deletedCount++;
            } catch (err) {
              logger.error(`Failed to delete individual message ${message.id}:`, err);
            }
          }
        }
      } else {
        // Only one message to delete
        try {
          await messagesToDelete[0].delete();
          deletedCount = 1;
        } catch (error) {
          logger.error(`Failed to delete message ${messagesToDelete[0].id}:`, error);
        }
      }
      
      // Log the purge
      const logMessage = user 
        ? `${interaction.user.tag} purged ${deletedCount} message(s) from ${user.tag} in #${interaction.channel.name}`
        : `${interaction.user.tag} purged ${deletedCount} message(s) in #${interaction.channel.name}`;
      
      logger.info(`[Purge] ${logMessage} (${interaction.guild.name})`);
      
      // Send confirmation message
      await interaction.editReply({
        content: `Successfully deleted ${deletedCount} message(s)${user ? ` from ${user.tag}` : ''}.`,
        ephemeral: true
      });
    } catch (error) {
      logger.error(`Error executing purge command:`, error);
      await interaction.editReply({
        content: `There was an error trying to delete messages: ${error.message}`,
        ephemeral: true
      });
    }
  }
};