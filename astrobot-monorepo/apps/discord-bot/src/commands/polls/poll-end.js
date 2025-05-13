const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const pollManager = require('../../lib/polls');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('poll-end')
    .setDescription('End an active poll')
    .addStringOption(option => 
      option.setName('id')
        .setDescription('The poll ID (leave empty to see active polls)')
        .setRequired(false))
    .addBooleanOption(option => 
      option.setName('show-results')
        .setDescription('Whether to post the results in the channel')
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
      const pollId = interaction.options.getString('id');
      const showResults = interaction.options.getBoolean('show-results') || false;
      
      // If no poll ID provided, list active polls
      if (!pollId) {
        // Get active polls for this guild
        const activePolls = pollManager.getActiveGuildPolls(interaction.guildId);
        
        if (activePolls.length === 0) {
          return await interaction.reply({
            content: 'There are no active polls in this server.',
            ephemeral: true
          });
        }
        
        // Create list of active polls
        let pollList = 'Active polls:\n\n';
        
        for (const poll of activePolls) {
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
          
          // Format end time
          let endTime = 'No end time';
          if (poll.endTime) {
            endTime = new Date(poll.endTime).toLocaleString();
          }
          
          pollList += `**ID**: ${poll.id}\n`;
          pollList += `**Question**: ${question}\n`;
          pollList += `**Channel**: #${channelName}\n`;
          pollList += `**End Time**: ${endTime}\n\n`;
        }
        
        pollList += `Use \`/poll-end id:[poll_id]\` to end a specific poll.`;
        
        return await interaction.reply({
          content: pollList,
          ephemeral: true
        });
      }
      
      // Get the poll
      const poll = pollManager.getPoll(pollId);
      
      if (!poll) {
        return await interaction.reply({
          content: `Poll with ID ${pollId} not found.`,
          ephemeral: true
        });
      }
      
      // Check if poll is already ended
      if (poll.isEnded) {
        return await interaction.reply({
          content: `Poll with ID ${pollId} has already ended.`,
          ephemeral: true
        });
      }
      
      // Check if user is poll creator or has manage messages permission
      const isCreator = poll.createdBy === interaction.user.id;
      const hasPermission = interaction.member.permissions.has(PermissionFlagsBits.ManageMessages);
      
      if (!isCreator && !hasPermission) {
        return await interaction.reply({
          content: 'You can only end polls that you created or if you have the Manage Messages permission.',
          ephemeral: true
        });
      }
      
      // End the poll
      await pollManager.endPoll(pollId);
      
      // Update the poll message
      await pollManager.updatePollMessage(poll, client);
      
      // Reply
      await interaction.reply({
        content: `Poll has been ended.`,
        ephemeral: !showResults
      });
      
      // Post results if requested
      if (showResults) {
        // Create results embed
        const embed = pollManager.createPollEmbed(poll, true);
        embed.setTitle('Poll Ended');
        
        await interaction.channel.send({
          content: 'Poll results:',
          embeds: [embed]
        });
      }
    } catch (error) {
      logger.error('Error executing poll-end command:', error);
      
      await interaction.reply({
        content: `There was an error ending the poll: ${error.message}`,
        ephemeral: true
      });
    }
  }
};