const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const logger = require('../../lib/logger');

// Map to store active polls with their vote data
const activePolls = new Map();

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll for users to vote on')
    .addStringOption(option => 
      option.setName('question')
        .setDescription('The poll question')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('option1')
        .setDescription('First option')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('option2')
        .setDescription('Second option')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('option3')
        .setDescription('Third option (optional)')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('option4')
        .setDescription('Fourth option (optional)')
        .setRequired(false))
    .addStringOption(option => 
      option.setName('option5')
        .setDescription('Fifth option (optional)')
        .setRequired(false))
    .addIntegerOption(option => 
      option.setName('duration')
        .setDescription('Poll duration in minutes (default: 60)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(1440)) // Max 24 hours
    .addBooleanOption(option => 
      option.setName('multiple')
        .setDescription('Allow users to vote for multiple options (default: false)')
        .setRequired(false)),
  
  // Cooldown in seconds
  cooldown: 10,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    // Get poll options
    const question = interaction.options.getString('question');
    const options = [];
    
    // Get all defined options
    for (let i = 1; i <= 5; i++) {
      const option = interaction.options.getString(`option${i}`);
      if (option) {
        options.push(option);
      }
    }
    
    // Get other poll settings
    const duration = interaction.options.getInteger('duration') || 60; // Default: 60 minutes
    const allowMultipleVotes = interaction.options.getBoolean('multiple') || false;
    
    // Create poll ID
    const pollId = `poll_${Date.now()}`;
    
    // Create poll data structure
    const pollData = {
      question,
      options,
      allowMultipleVotes,
      votes: options.map(() => new Set()), // Set for each option to track unique voters
      voters: new Set(), // Set to track all voters
      endTime: Date.now() + (duration * 60 * 1000),
      authorId: interaction.user.id,
      channelId: interaction.channel.id,
      guildId: interaction.guild.id
    };
    
    // Create the poll embed
    const pollEmbed = await createPollEmbed(pollData, interaction.user);
    
    // Create buttons for voting
    const rows = createPollButtons(pollId, options);
    
    // Send the poll
    const message = await interaction.reply({
      embeds: [pollEmbed],
      components: rows,
      fetchReply: true
    });
    
    // Store the poll data with the message ID for updating later
    pollData.messageId = message.id;
    activePolls.set(pollId, pollData);
    
    // Register button handlers for this poll
    registerPollButtonHandlers(client, pollId);
    
    // Set timeout to end the poll
    setTimeout(() => endPoll(client, pollId), duration * 60 * 1000);
    
    logger.info(`Poll created by ${interaction.user.tag} (${interaction.user.id}) in ${interaction.guild.name} (${interaction.guild.id})`);
  }
};

/**
 * Create an embed for the poll
 * @param {Object} pollData - Poll data
 * @param {User} author - Poll author
 * @returns {EmbedBuilder} The poll embed
 */
function createPollEmbed(pollData, author) {
  const { question, options, votes, endTime, allowMultipleVotes } = pollData;
  
  // Calculate total votes
  const totalVotes = Array.from(votes).reduce((sum, optionVotes) => sum + optionVotes.size, 0);
  
  // Create the embed
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(`📊 Poll: ${question}`)
    .setFooter({
      text: `Created by ${author.tag} | ${allowMultipleVotes ? 'Multiple votes allowed' : 'One vote per user'}`,
      iconURL: author.displayAvatarURL()
    })
    .setTimestamp();
  
  // Add remaining time
  const timeRemaining = endTime - Date.now();
  if (timeRemaining > 0) {
    const minutes = Math.floor(timeRemaining / 60000);
    embed.setDescription(`This poll will end in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
  } else {
    embed.setDescription('This poll has ended.');
  }
  
  // Add options with vote counts and progress bars
  for (let i = 0; i < options.length; i++) {
    const optionVotes = votes[i].size;
    const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
    
    // Create progress bar
    const barLength = 15;
    const filledBars = Math.round((percentage / 100) * barLength);
    const progressBar = '█'.repeat(filledBars) + '░'.repeat(barLength - filledBars);
    
    embed.addFields({
      name: `${getOptionEmoji(i)} ${options[i]}`,
      value: `${progressBar} (${optionVotes} vote${optionVotes !== 1 ? 's' : ''}, ${percentage.toFixed(1)}%)`
    });
  }
  
  embed.addFields({
    name: 'Total Votes',
    value: `${totalVotes} vote${totalVotes !== 1 ? 's' : ''}`
  });
  
  return embed;
}

/**
 * Create buttons for the poll
 * @param {string} pollId - Poll ID
 * @param {string[]} options - Poll options
 * @returns {ActionRowBuilder[]} Button rows
 */
function createPollButtons(pollId, options) {
  const rows = [];
  let currentRow = new ActionRowBuilder();
  
  // Create a button for each option
  for (let i = 0; i < options.length; i++) {
    // Discord allows a maximum of 5 buttons per row
    if (i > 0 && i % 5 === 0) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder();
    }
    
    // Truncate option text if too long
    const buttonLabel = options[i].length > 80 ? options[i].substring(0, 77) + '...' : options[i];
    
    // Create the button
    const button = new ButtonBuilder()
      .setCustomId(`${pollId}_option_${i}`)
      .setLabel(buttonLabel)
      .setEmoji(getOptionEmoji(i))
      .setStyle(ButtonStyle.Primary);
    
    currentRow.addComponents(button);
  }
  
  // Add the current row if it has buttons
  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }
  
  return rows;
}

/**
 * Register button handlers for the poll
 * @param {Client} client - Discord client
 * @param {string} pollId - Poll ID
 */
function registerPollButtonHandlers(client, pollId) {
  // Register handlers for each option button
  client.buttonHandlers.set(`${pollId}_option`, async (client, interaction, optionIndex) => {
    // Parse option index
    const index = parseInt(optionIndex, 10);
    
    // Get poll data
    const pollData = activePolls.get(pollId);
    if (!pollData) {
      return await interaction.reply({
        content: 'This poll is no longer active.',
        ephemeral: true
      });
    }
    
    // Check if poll has ended
    if (Date.now() > pollData.endTime) {
      return await interaction.reply({
        content: 'This poll has ended.',
        ephemeral: true
      });
    }
    
    // Get user ID
    const userId = interaction.user.id;
    
    // Handle single vote (remove previous votes)
    if (!pollData.allowMultipleVotes) {
      // Check if already voted for this option
      if (pollData.votes[index].has(userId)) {
        // Remove vote
        pollData.votes[index].delete(userId);
        pollData.voters.delete(userId);
        
        await interaction.reply({
          content: `You've removed your vote for **${pollData.options[index]}**.`,
          ephemeral: true
        });
      } else {
        // Remove any existing votes
        for (const optionVotes of pollData.votes) {
          optionVotes.delete(userId);
        }
        
        // Add new vote
        pollData.votes[index].add(userId);
        pollData.voters.add(userId);
        
        await interaction.reply({
          content: `You've voted for **${pollData.options[index]}**.`,
          ephemeral: true
        });
      }
    } 
    // Handle multiple votes
    else {
      // Toggle vote for this option
      if (pollData.votes[index].has(userId)) {
        // Remove vote
        pollData.votes[index].delete(userId);
        
        // Check if user has any votes left
        let hasVotes = false;
        for (const optionVotes of pollData.votes) {
          if (optionVotes.has(userId)) {
            hasVotes = true;
            break;
          }
        }
        
        // Remove user from voters if they have no more votes
        if (!hasVotes) {
          pollData.voters.delete(userId);
        }
        
        await interaction.reply({
          content: `You've removed your vote for **${pollData.options[index]}**.`,
          ephemeral: true
        });
      } else {
        // Add vote
        pollData.votes[index].add(userId);
        pollData.voters.add(userId);
        
        await interaction.reply({
          content: `You've voted for **${pollData.options[index]}**.`,
          ephemeral: true
        });
      }
    }
    
    try {
      // Get the channel and message
      const channel = await client.channels.fetch(pollData.channelId);
      const message = await channel.messages.fetch(pollData.messageId);
      
      // Get poll author for recreating the embed
      const author = await client.users.fetch(pollData.authorId);
      
      // Update the poll embed
      const updatedEmbed = createPollEmbed(pollData, author);
      
      // Update the message
      await message.edit({
        embeds: [updatedEmbed],
        components: message.components
      });
    } catch (error) {
      logger.error(`Error updating poll ${pollId}:`, error);
    }
  });
}

/**
 * End the poll
 * @param {Client} client - Discord client
 * @param {string} pollId - Poll ID
 */
async function endPoll(client, pollId) {
  // Get poll data
  const pollData = activePolls.get(pollId);
  if (!pollData) {
    return;
  }
  
  try {
    // Get the channel and message
    const channel = await client.channels.fetch(pollData.channelId);
    const message = await channel.messages.fetch(pollData.messageId);
    
    // Get poll author for recreating the embed
    const author = await client.users.fetch(pollData.authorId);
    
    // Update the poll embed
    const finalEmbed = createPollEmbed(pollData, author);
    finalEmbed.setDescription('This poll has ended.');
    finalEmbed.setColor('#2F3136');
    
    // Determine the winning option(s)
    const maxVotes = Math.max(...pollData.votes.map(votes => votes.size));
    const winningIndices = pollData.votes
      .map((votes, index) => ({ index, count: votes.size }))
      .filter(option => option.count === maxVotes)
      .map(option => option.index);
    
    // Add results field
    if (winningIndices.length > 0 && maxVotes > 0) {
      if (winningIndices.length === 1) {
        const winningOption = pollData.options[winningIndices[0]];
        finalEmbed.addFields({
          name: '🏆 Result',
          value: `**${winningOption}** won with ${maxVotes} vote${maxVotes !== 1 ? 's' : ''}!`
        });
      } else {
        const winningOptions = winningIndices.map(i => pollData.options[i]).join('** and **');
        finalEmbed.addFields({
          name: '🏆 Result',
          value: `**${winningOptions}** tied with ${maxVotes} vote${maxVotes !== 1 ? 's' : ''} each!`
        });
      }
    } else {
      finalEmbed.addFields({
        name: '🏆 Result',
        value: 'No votes were cast.'
      });
    }
    
    // Update the message with disabled buttons
    await message.edit({
      embeds: [finalEmbed],
      components: [] // Remove buttons
    });
    
    // Send a message about the poll ending
    await channel.send({
      content: `📊 The poll "${pollData.question}" has ended!`,
      components: []
    });
    
    // Clean up
    activePolls.delete(pollId);
    logger.info(`Poll ${pollId} ended`);
  } catch (error) {
    logger.error(`Error ending poll ${pollId}:`, error);
  }
}

/**
 * Get emoji for option index
 * @param {number} index - Option index
 * @returns {string} Emoji
 */
function getOptionEmoji(index) {
  const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  return emojis[index] || `${index + 1}`;
}