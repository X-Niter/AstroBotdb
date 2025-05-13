const { SlashCommandBuilder } = require('discord.js');
const pollManager = require('../../lib/polls');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('poll-list')
    .setDescription('List all polls in the server')
    .addBooleanOption(option => 
      option.setName('active-only')
        .setDescription('Whether to only show active polls')
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
      // Get command options
      const activeOnly = interaction.options.getBoolean('active-only') || false;
      
      // Get polls
      const polls = activeOnly 
        ? pollManager.getActiveGuildPolls(interaction.guildId)
        : pollManager.getGuildPolls(interaction.guildId);
      
      if (polls.length === 0) {
        return await interaction.reply({
          content: activeOnly 
            ? 'There are no active polls in this server.' 
            : 'There are no polls in this server.',
          ephemeral: true
        });
      }
      
      // Create list of polls
      let pollList = activeOnly 
        ? 'Active polls:\n\n' 
        : 'All polls:\n\n';
      
      for (const poll of polls) {
        // Truncate question if too long
        const question = poll.question.length > 50 
          ? poll.question.substring(0, 47) + '...' 
          : poll.question;
        
        // Get channel name
        let channelName = 'Unknown Channel';
        try {
          const channel = await client.channels.fetch(poll.channelId);
          if (channel) {
            channelName = channel.name;
          }
        } catch (error) {
          logger.warn(`Could not fetch channel ${poll.channelId}:`, error);
        }
        
        // Format dates
        const createdAt = new Date(poll.createdAt).toLocaleString();
        let status = poll.isEnded ? 'Ended' : 'Active';
        
        if (!poll.isEnded && poll.endTime) {
          const now = new Date();
          const timeLeft = poll.endTime - now;
          
          if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / (1000 * 60));
            const hours = Math.floor(minutes / 60);
            const days = Math.floor(hours / 24);
            
            if (days > 0) {
              status = `Ends in ${days}d`;
            } else if (hours > 0) {
              status = `Ends in ${hours}h`;
            } else {
              status = `Ends in ${minutes}m`;
            }
          } else {
            status = 'Ending soon';
          }
        }
        
        // Calculate total votes
        const totalVotes = poll.choices.reduce((acc, choice) => acc + choice.votes.length, 0);
        
        pollList += `**ID**: ${poll.id}\n`;
        pollList += `**Question**: ${question}\n`;
        pollList += `**Channel**: #${channelName}\n`;
        pollList += `**Status**: ${status}\n`;
        pollList += `**Votes**: ${totalVotes}\n`;
        pollList += `**Created**: ${createdAt}\n\n`;
      }
      
      if (!activeOnly) {
        pollList += `Use \`/poll-list active-only:true\` to only show active polls.`;
      }
      
      await interaction.reply({
        content: pollList,
        ephemeral: true
      });
    } catch (error) {
      logger.error('Error executing poll-list command:', error);
      
      await interaction.reply({
        content: `There was an error listing polls: ${error.message}`,
        ephemeral: true
      });
    }
  }
};