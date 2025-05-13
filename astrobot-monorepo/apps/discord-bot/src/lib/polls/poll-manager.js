/**
 * Poll Manager
 * Manages interactive polls with voting
 */

const { Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');

// Path to polls file
const POLLS_FILE = path.join(process.cwd(), 'data', 'polls.json');

// Polls collection (pollId -> poll)
const polls = new Collection();

// Poll timers (pollId -> timer)
const pollTimers = new Collection();

// Poll types
const POLL_TYPES = {
  YES_NO: 'YES_NO',
  MULTIPLE_CHOICE: 'MULTIPLE_CHOICE',
  RATING: 'RATING'
};

// Duration options in milliseconds
const DURATION_OPTIONS = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  THREE_HOURS: 3 * 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  TWELVE_HOURS: 12 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  THREE_DAYS: 3 * 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000
};

/**
 * Initialize the poll manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing poll manager...');
    
    // Load polls
    await loadPolls();
    
    // Set up timers for active polls
    const now = Date.now();
    
    for (const [pollId, poll] of polls.entries()) {
      if (!poll.ended) {
        const timeUntilEnd = poll.endTime - now;
        
        if (timeUntilEnd > 0) {
          // Schedule poll end
          schedulePoll(pollId, timeUntilEnd);
        } else {
          // Poll is past end time, end it now
          setTimeout(() => endPoll(pollId), 0);
        }
      }
    }
    
    // Cleanup old polls (ended more than 7 days ago)
    const cleanupCount = await cleanupPolls(7 * 24 * 60 * 60 * 1000);
    
    if (cleanupCount > 0) {
      logger.info(`Cleaned up ${cleanupCount} old polls`);
    }
    
    logger.info('Poll manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing poll manager:', error);
    return false;
  }
}

/**
 * Load polls from disk
 * @returns {Promise<void>}
 */
async function loadPolls() {
  try {
    // Clear collection
    polls.clear();
    
    // Check if file exists
    try {
      await fs.access(POLLS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await savePolls();
      return;
    }
    
    // Read file
    const data = await fs.readFile(POLLS_FILE, 'utf8');
    
    // Parse JSON
    const pollData = JSON.parse(data);
    
    // Load polls
    for (const [pollId, poll] of Object.entries(pollData)) {
      polls.set(pollId, poll);
    }
    
    logger.debug('Polls loaded from disk');
  } catch (error) {
    logger.error('Error loading polls:', error);
    throw error;
  }
}

/**
 * Save polls to disk
 * @returns {Promise<void>}
 */
async function savePolls() {
  try {
    // Create data object
    const pollData = {};
    
    for (const [pollId, poll] of polls.entries()) {
      pollData[pollId] = poll;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(POLLS_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(POLLS_FILE, JSON.stringify(pollData, null, 2));
    
    logger.debug('Polls saved to disk');
  } catch (error) {
    logger.error('Error saving polls:', error);
    throw error;
  }
}

/**
 * Create a poll
 * @param {Object} options - Poll options
 * @returns {Promise<Object>} The created poll
 */
async function createPoll(options) {
  try {
    const { 
      type, 
      title, 
      description, 
      options: pollOptions = [], 
      duration, 
      channelId, 
      guildId, 
      authorId, 
      client 
    } = options;
    
    // Generate poll ID
    const pollId = uuidv4();
    
    // Create poll object
    const poll = {
      id: pollId,
      type,
      title,
      description,
      options: pollOptions,
      duration,
      channelId,
      guildId,
      authorId,
      createdAt: Date.now(),
      endTime: Date.now() + duration,
      ended: false,
      votes: {},
      messageId: null
    };
    
    // Add to collection
    polls.set(pollId, poll);
    
    // Post poll to channel
    const message = await postPoll(poll, client);
    
    // Save message ID
    poll.messageId = message.id;
    
    // Schedule poll end
    schedulePoll(pollId, duration);
    
    // Save polls
    await savePolls();
    
    return poll;
  } catch (error) {
    logger.error('Error creating poll:', error);
    throw error;
  }
}

/**
 * Post a poll to a channel
 * @param {Object} poll - The poll to post
 * @param {Client} client - The Discord client
 * @returns {Promise<Message>} The sent message
 */
async function postPoll(poll, client) {
  try {
    // Get channel
    const channel = await client.channels.fetch(poll.channelId);
    
    if (!channel || !channel.isTextBased()) {
      throw new Error('Channel not found or not text-based');
    }
    
    // Create embed
    const embed = createPollEmbed(poll);
    
    // Create buttons based on poll type
    const components = createPollButtons(poll);
    
    // Send message
    const message = await channel.send({
      embeds: [embed],
      components
    });
    
    return message;
  } catch (error) {
    logger.error('Error posting poll:', error);
    throw error;
  }
}

/**
 * Create a poll embed
 * @param {Object} poll - The poll
 * @returns {EmbedBuilder} The embed
 */
function createPollEmbed(poll) {
  // Format time remaining
  const timeRemaining = poll.ended ? 'Ended' : 
    formatTimeRemaining(poll.endTime - Date.now());
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle(poll.title)
    .setDescription(poll.description)
    .addFields(
      { name: 'Poll ID', value: poll.id, inline: true },
      { name: 'Time Remaining', value: timeRemaining, inline: true }
    )
    .setFooter({ text: `Poll created by ${poll.author || 'Unknown'}` })
    .setTimestamp(new Date(poll.createdAt));
  
  // Add vote counts
  const voteResults = getVoteResults(poll);
  
  if (poll.type === POLL_TYPES.YES_NO) {
    // Yes/No poll
    const yesCount = voteResults.yes || 0;
    const noCount = voteResults.no || 0;
    const totalVotes = yesCount + noCount;
    
    const yesPercentage = totalVotes > 0 ? Math.round((yesCount / totalVotes) * 100) : 0;
    const noPercentage = totalVotes > 0 ? Math.round((noCount / totalVotes) * 100) : 0;
    
    const yesBar = createProgressBar(yesPercentage);
    const noBar = createProgressBar(noPercentage);
    
    embed.addFields(
      { name: `Yes (${yesCount} votes, ${yesPercentage}%)`, value: yesBar, inline: false },
      { name: `No (${noCount} votes, ${noPercentage}%)`, value: noBar, inline: false }
    );
    
    if (poll.ended) {
      const result = yesCount > noCount 
        ? 'Yes wins!' 
        : (noCount > yesCount ? 'No wins!' : 'It\'s a tie!');
      
      embed.addFields({ name: 'Result', value: result, inline: false });
    }
  } else if (poll.type === POLL_TYPES.MULTIPLE_CHOICE) {
    // Multiple choice poll
    const totalVotes = Object.values(voteResults).reduce((sum, count) => sum + count, 0);
    
    for (let i = 0; i < poll.options.length; i++) {
      const option = poll.options[i];
      const votes = voteResults[i] || 0;
      const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
      const bar = createProgressBar(percentage);
      
      embed.addFields(
        { name: `${i + 1}. ${option} (${votes} votes, ${percentage}%)`, value: bar, inline: false }
      );
    }
    
    if (poll.ended && totalVotes > 0) {
      // Find winning option
      const maxVotes = Math.max(...Object.values(voteResults));
      const winningIndices = Object.entries(voteResults)
        .filter(([, count]) => count === maxVotes)
        .map(([index]) => Number(index));
      
      let resultText;
      
      if (winningIndices.length === 1) {
        const winningIndex = winningIndices[0];
        resultText = `Option "${poll.options[winningIndex]}" wins!`;
      } else {
        const tiedOptions = winningIndices
          .map(index => `"${poll.options[index]}"`)
          .join(', ');
        resultText = `It's a tie between ${tiedOptions}!`;
      }
      
      embed.addFields({ name: 'Result', value: resultText, inline: false });
    }
  } else if (poll.type === POLL_TYPES.RATING) {
    // Rating poll (1-5 stars)
    const votes = [
      voteResults[1] || 0,
      voteResults[2] || 0,
      voteResults[3] || 0,
      voteResults[4] || 0,
      voteResults[5] || 0
    ];
    
    const totalVotes = votes.reduce((sum, count) => sum + count, 0);
    
    // Calculate average rating
    let averageRating = 0;
    
    if (totalVotes > 0) {
      averageRating = (
        (1 * votes[0]) +
        (2 * votes[1]) +
        (3 * votes[2]) +
        (4 * votes[3]) +
        (5 * votes[4])
      ) / totalVotes;
    }
    
    // Display vote distribution
    for (let i = 0; i < 5; i++) {
      const stars = '⭐'.repeat(i + 1);
      const voteCount = votes[i];
      const percentage = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
      const bar = createProgressBar(percentage);
      
      embed.addFields(
        { name: `${stars} (${voteCount} votes, ${percentage}%)`, value: bar, inline: false }
      );
    }
    
    if (totalVotes > 0) {
      embed.addFields(
        { name: 'Average Rating', value: `${averageRating.toFixed(1)} ⭐ (${totalVotes} votes)`, inline: false }
      );
    }
  }
  
  return embed;
}

/**
 * Create buttons for a poll
 * @param {Object} poll - The poll
 * @returns {Array<ActionRowBuilder>} The button rows
 */
function createPollButtons(poll) {
  // Return empty array if poll has ended
  if (poll.ended) {
    return [];
  }
  
  const rows = [];
  
  if (poll.type === POLL_TYPES.YES_NO) {
    // Yes/No poll
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`poll_vote_${poll.id}_yes`)
          .setLabel('Yes')
          .setStyle(ButtonStyle.Success),
        
        new ButtonBuilder()
          .setCustomId(`poll_vote_${poll.id}_no`)
          .setLabel('No')
          .setStyle(ButtonStyle.Danger)
      );
    
    rows.push(row);
  } else if (poll.type === POLL_TYPES.MULTIPLE_CHOICE) {
    // Multiple choice poll
    // Split buttons into multiple rows if needed (max 5 buttons per row)
    const options = poll.options;
    const numRows = Math.ceil(options.length / 5);
    
    for (let i = 0; i < numRows; i++) {
      const row = new ActionRowBuilder();
      const startIdx = i * 5;
      const endIdx = Math.min(startIdx + 5, options.length);
      
      for (let j = startIdx; j < endIdx; j++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_vote_${poll.id}_${j}`)
            .setLabel(`${j + 1}`)
            .setStyle(ButtonStyle.Primary)
        );
      }
      
      rows.push(row);
    }
  } else if (poll.type === POLL_TYPES.RATING) {
    // Rating poll (1-5 stars)
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`poll_vote_${poll.id}_1`)
          .setLabel('⭐')
          .setStyle(ButtonStyle.Secondary),
        
        new ButtonBuilder()
          .setCustomId(`poll_vote_${poll.id}_2`)
          .setLabel('⭐⭐')
          .setStyle(ButtonStyle.Secondary),
        
        new ButtonBuilder()
          .setCustomId(`poll_vote_${poll.id}_3`)
          .setLabel('⭐⭐⭐')
          .setStyle(ButtonStyle.Secondary),
        
        new ButtonBuilder()
          .setCustomId(`poll_vote_${poll.id}_4`)
          .setLabel('⭐⭐⭐⭐')
          .setStyle(ButtonStyle.Secondary),
        
        new ButtonBuilder()
          .setCustomId(`poll_vote_${poll.id}_5`)
          .setLabel('⭐⭐⭐⭐⭐')
          .setStyle(ButtonStyle.Secondary)
      );
    
    rows.push(row);
  }
  
  return rows;
}

/**
 * Handle a vote on a poll
 * @param {ButtonInteraction} interaction - The button interaction
 * @returns {Promise<boolean>} Whether the vote was successful
 */
async function handleVote(interaction) {
  try {
    const { customId, user } = interaction;
    
    // Parse custom ID
    const [, , pollId, voteValue] = customId.split('_');
    
    // Get poll
    const poll = polls.get(pollId);
    
    if (!poll) {
      await interaction.reply({
        content: 'This poll no longer exists.',
        ephemeral: true
      });
      return false;
    }
    
    if (poll.ended) {
      await interaction.reply({
        content: 'This poll has ended.',
        ephemeral: true
      });
      return false;
    }
    
    // Record vote
    poll.votes[user.id] = voteValue;
    
    // Save polls
    await savePolls();
    
    // Update poll message
    await updatePollMessage(poll, interaction.client);
    
    // Create confirmation message
    let confirmationMessage;
    
    if (poll.type === POLL_TYPES.YES_NO) {
      confirmationMessage = `You voted ${voteValue} on the poll "${poll.title}".`;
    } else if (poll.type === POLL_TYPES.MULTIPLE_CHOICE) {
      const optionIndex = parseInt(voteValue, 10);
      const optionText = poll.options[optionIndex];
      confirmationMessage = `You voted for "${optionText}" on the poll "${poll.title}".`;
    } else if (poll.type === POLL_TYPES.RATING) {
      const rating = parseInt(voteValue, 10);
      const stars = '⭐'.repeat(rating);
      confirmationMessage = `You rated ${stars} on the poll "${poll.title}".`;
    }
    
    // Reply to interaction
    await interaction.reply({
      content: confirmationMessage,
      ephemeral: true
    });
    
    return true;
  } catch (error) {
    logger.error('Error handling poll vote:', error);
    
    // Try to reply to interaction
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `An error occurred while recording your vote: ${error.message}`,
          ephemeral: true
        });
      }
    } catch (replyError) {
      logger.error('Error replying to interaction:', replyError);
    }
    
    return false;
  }
}

/**
 * Update a poll message
 * @param {Object} poll - The poll to update
 * @param {Client} client - The Discord client
 * @returns {Promise<boolean>} Whether the update was successful
 */
async function updatePollMessage(poll, client) {
  try {
    // Get channel
    const channel = await client.channels.fetch(poll.channelId);
    
    if (!channel || !channel.isTextBased()) {
      logger.warn(`Channel not found or not text-based for poll ${poll.id}`);
      return false;
    }
    
    // Get message
    const message = await channel.messages.fetch(poll.messageId);
    
    if (!message) {
      logger.warn(`Message not found for poll ${poll.id}`);
      return false;
    }
    
    // Create embed
    const embed = createPollEmbed(poll);
    
    // Create buttons (if poll is active)
    const components = createPollButtons(poll);
    
    // Edit message
    await message.edit({
      embeds: [embed],
      components
    });
    
    return true;
  } catch (error) {
    logger.error(`Error updating poll message for ${poll.id}:`, error);
    return false;
  }
}

/**
 * Schedule a poll to end
 * @param {string} pollId - The poll ID
 * @param {number} delay - The delay in milliseconds
 */
function schedulePoll(pollId, delay) {
  // Cap delay at maximum setTimeout value if necessary (around 24.8 days)
  const MAX_TIMEOUT = 2147483647;
  
  if (delay > MAX_TIMEOUT) {
    // Schedule an intermediate timeout
    const timer = setTimeout(() => {
      schedulePoll(pollId, delay - MAX_TIMEOUT);
    }, MAX_TIMEOUT);
    
    pollTimers.set(pollId, timer);
  } else {
    // Schedule the actual poll end
    const timer = setTimeout(() => {
      endPoll(pollId);
    }, delay);
    
    pollTimers.set(pollId, timer);
  }
}

/**
 * End a poll
 * @param {string} pollId - The poll ID
 * @returns {Promise<boolean>} Whether the poll was ended
 */
async function endPoll(pollId) {
  try {
    // Get poll
    const poll = polls.get(pollId);
    
    if (!poll || poll.ended) {
      return false;
    }
    
    // Mark as ended
    poll.ended = true;
    
    // Clear timer if exists
    if (pollTimers.has(pollId)) {
      clearTimeout(pollTimers.get(pollId));
      pollTimers.delete(pollId);
    }
    
    // Update message
    const client = require('../../bot-client').getClient();
    await updatePollMessage(poll, client);
    
    // Save polls
    await savePolls();
    
    logger.info(`Poll ${pollId} ended`);
    
    return true;
  } catch (error) {
    logger.error(`Error ending poll ${pollId}:`, error);
    return false;
  }
}

/**
 * End a poll early
 * @param {string} pollId - The poll ID
 * @returns {Promise<boolean>} Whether the poll was ended
 */
async function endPollEarly(pollId) {
  return await endPoll(pollId);
}

/**
 * Get active polls in a guild
 * @param {string} guildId - The guild ID
 * @returns {Array<Object>} The active polls
 */
function getActivePolls(guildId) {
  return Array.from(polls.values())
    .filter(poll => poll.guildId === guildId && !poll.ended);
}

/**
 * Get vote results for a poll
 * @param {Object} poll - The poll
 * @returns {Object} The vote results
 */
function getVoteResults(poll) {
  const results = {};
  
  for (const vote of Object.values(poll.votes)) {
    results[vote] = (results[vote] || 0) + 1;
  }
  
  return results;
}

/**
 * Clean up old ended polls
 * @param {number} maxAgeMs - Maximum age in milliseconds for ended polls
 * @returns {Promise<number>} Number of polls cleaned up
 */
async function cleanupPolls(maxAgeMs = 7 * 24 * 60 * 60 * 1000) { // Default: 7 days
  try {
    const now = Date.now();
    let count = 0;
    
    // Get ended polls older than maxAgeMs
    const oldPolls = Array.from(polls.entries())
      .filter(([, poll]) => 
        poll.ended && 
        (now - poll.endTime) > maxAgeMs
      );
    
    // Remove old polls
    for (const [pollId] of oldPolls) {
      polls.delete(pollId);
      count++;
    }
    
    // Save changes if any polls were removed
    if (count > 0) {
      await savePolls();
    }
    
    return count;
  } catch (error) {
    logger.error('Error cleaning up polls:', error);
    return 0;
  }
}

/**
 * Format time remaining
 * @param {number} ms - The time remaining in milliseconds
 * @returns {string} The formatted time
 */
function formatTimeRemaining(ms) {
  if (ms <= 0) {
    return 'Ended';
  }
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h remaining`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m remaining`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s remaining`;
  } else {
    return `${seconds}s remaining`;
  }
}

/**
 * Create a progress bar
 * @param {number} percentage - The percentage (0-100)
 * @returns {string} The progress bar
 */
function createProgressBar(percentage) {
  // Ensure percentage is between 0 and 100
  percentage = Math.max(0, Math.min(100, percentage));
  
  // Calculate number of filled and empty blocks
  const blocks = 10;
  const filledBlocks = Math.round((percentage / 100) * blocks);
  const emptyBlocks = blocks - filledBlocks;
  
  // Create progress bar
  return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks) + ` ${percentage}%`;
}

module.exports = {
  initialize,
  createPoll,
  handleVote,
  endPollEarly,
  getActivePolls,
  POLL_TYPES,
  DURATION_OPTIONS
};