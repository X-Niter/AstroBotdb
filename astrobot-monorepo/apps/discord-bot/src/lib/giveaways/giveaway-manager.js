/**
 * Giveaway Manager
 * Manages server giveaways with entry tracking and winner selection
 */

const { Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../logger');

// Path to giveaways file
const GIVEAWAYS_FILE = path.join(process.cwd(), 'data', 'giveaways.json');

// Giveaways collection (giveawayId -> giveaway)
const giveaways = new Collection();

// Giveaway timers (giveawayId -> timer)
const giveawayTimers = new Collection();

// Duration options in milliseconds
const DURATION_OPTIONS = {
  ONE_MINUTE: 60 * 1000, // For testing
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
  SIX_HOURS: 6 * 60 * 60 * 1000,
  TWELVE_HOURS: 12 * 60 * 60 * 1000,
  ONE_DAY: 24 * 60 * 60 * 1000,
  THREE_DAYS: 3 * 24 * 60 * 60 * 1000,
  ONE_WEEK: 7 * 24 * 60 * 60 * 1000
};

/**
 * Initialize the giveaway manager
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function initialize() {
  try {
    logger.info('Initializing giveaway manager...');
    
    // Load giveaways
    await loadGiveaways();
    
    // Set up timers for active giveaways
    const now = Date.now();
    
    for (const [giveawayId, giveaway] of giveaways.entries()) {
      if (!giveaway.ended) {
        const timeUntilEnd = giveaway.endTime - now;
        
        if (timeUntilEnd > 0) {
          // Schedule giveaway end
          scheduleGiveaway(giveawayId, timeUntilEnd);
        } else {
          // Giveaway is past end time, end it now
          setTimeout(() => endGiveaway(giveawayId), 0);
        }
      }
    }
    
    // Cleanup old giveaways (ended more than 30 days ago)
    const cleanupCount = await cleanupGiveaways(30 * 24 * 60 * 60 * 1000);
    
    if (cleanupCount > 0) {
      logger.info(`Cleaned up ${cleanupCount} old giveaways`);
    }
    
    logger.info('Giveaway manager initialized successfully');
    return true;
  } catch (error) {
    logger.error('Error initializing giveaway manager:', error);
    return false;
  }
}

/**
 * Load giveaways from disk
 * @returns {Promise<void>}
 */
async function loadGiveaways() {
  try {
    // Clear collection
    giveaways.clear();
    
    // Check if file exists
    try {
      await fs.access(GIVEAWAYS_FILE);
    } catch (error) {
      // File doesn't exist, create it
      await saveGiveaways();
      return;
    }
    
    // Read file
    const data = await fs.readFile(GIVEAWAYS_FILE, 'utf8');
    
    // Parse JSON
    const giveawayData = JSON.parse(data);
    
    // Load giveaways
    for (const [giveawayId, giveaway] of Object.entries(giveawayData)) {
      giveaways.set(giveawayId, giveaway);
    }
    
    logger.debug('Giveaways loaded from disk');
  } catch (error) {
    logger.error('Error loading giveaways:', error);
    throw error;
  }
}

/**
 * Save giveaways to disk
 * @returns {Promise<void>}
 */
async function saveGiveaways() {
  try {
    // Create data object
    const giveawayData = {};
    
    for (const [giveawayId, giveaway] of giveaways.entries()) {
      giveawayData[giveawayId] = giveaway;
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(GIVEAWAYS_FILE), { recursive: true });
    
    // Write file
    await fs.writeFile(GIVEAWAYS_FILE, JSON.stringify(giveawayData, null, 2));
    
    logger.debug('Giveaways saved to disk');
  } catch (error) {
    logger.error('Error saving giveaways:', error);
    throw error;
  }
}

/**
 * Create a giveaway
 * @param {Object} options - Giveaway options
 * @returns {Promise<Object>} The created giveaway
 */
async function createGiveaway(options) {
  try {
    const { 
      prize, 
      description,
      winnerCount,
      duration, 
      channelId, 
      guildId, 
      hostId,
      requiredRole,
      client 
    } = options;
    
    // Generate giveaway ID
    const giveawayId = uuidv4();
    
    // Get host username and avatar
    const host = await client.users.fetch(hostId);
    
    // Create giveaway object
    const giveaway = {
      id: giveawayId,
      prize,
      description: description || '', // Optional description
      winnerCount: winnerCount || 1, // Default to 1 winner
      duration,
      channelId,
      guildId,
      hostId,
      hostTag: host.tag,
      hostAvatar: host.displayAvatarURL(),
      requiredRole: requiredRole || null, // Optional required role
      createdAt: Date.now(),
      endTime: Date.now() + duration,
      ended: false,
      entries: [],
      winners: [],
      messageId: null
    };
    
    // Add to collection
    giveaways.set(giveawayId, giveaway);
    
    // Post giveaway to channel
    const message = await postGiveaway(giveaway, client);
    
    // Save message ID
    giveaway.messageId = message.id;
    
    // Schedule giveaway end
    scheduleGiveaway(giveawayId, duration);
    
    // Save giveaways
    await saveGiveaways();
    
    return giveaway;
  } catch (error) {
    logger.error('Error creating giveaway:', error);
    throw error;
  }
}

/**
 * Post a giveaway to a channel
 * @param {Object} giveaway - The giveaway to post
 * @param {Client} client - The Discord client
 * @returns {Promise<Message>} The sent message
 */
async function postGiveaway(giveaway, client) {
  try {
    // Get channel
    const channel = await client.channels.fetch(giveaway.channelId);
    
    if (!channel || !channel.isTextBased()) {
      throw new Error('Channel not found or not text-based');
    }
    
    // Create embed
    const embed = createGiveawayEmbed(giveaway);
    
    // Create entry button
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(`giveaway_enter_${giveaway.id}`)
          .setLabel('Enter Giveaway')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎉')
      );
    
    // Send message
    const message = await channel.send({
      embeds: [embed],
      components: [row]
    });
    
    return message;
  } catch (error) {
    logger.error('Error posting giveaway:', error);
    throw error;
  }
}

/**
 * Create a giveaway embed
 * @param {Object} giveaway - The giveaway
 * @returns {EmbedBuilder} The embed
 */
function createGiveawayEmbed(giveaway) {
  // Format time remaining
  const timeRemaining = giveaway.ended 
    ? 'Ended' 
    : formatTimeRemaining(giveaway.endTime - Date.now());
  
  // Create base embed
  const embed = new EmbedBuilder()
    .setColor(giveaway.ended ? '#FF0000' : '#5865F2')
    .setTitle(`🎉 GIVEAWAY: ${giveaway.prize}`)
    .setThumbnail('https://cdn.discordapp.com/attachments/123456789/giveaway.png') // Placeholder, replace with actual image
    .setTimestamp(new Date(giveaway.createdAt));
  
  // Add description if provided
  if (giveaway.description) {
    embed.setDescription(giveaway.description);
  }
  
  // Add required role if provided
  const requiredRoleText = giveaway.requiredRole 
    ? `\nRequired Role: <@&${giveaway.requiredRole}>`
    : '';
  
  // Add fields
  embed.addFields(
    { name: 'Host', value: `<@${giveaway.hostId}>`, inline: true },
    { name: 'Winners', value: `${giveaway.winnerCount}`, inline: true },
    { name: 'Entered', value: `${giveaway.entries.length} user(s)`, inline: true },
    { name: 'Time Remaining', value: timeRemaining, inline: true }
  );
  
  // Set different footer based on giveaway status
  if (giveaway.ended) {
    if (giveaway.winners.length > 0) {
      const winnerMentions = giveaway.winners.map(id => `<@${id}>`).join(', ');
      embed.addFields(
        { name: '🏆 Winner(s)', value: winnerMentions, inline: false }
      );
      embed.setFooter({ text: 'Giveaway has ended' });
    } else {
      embed.addFields(
        { name: '😢 Result', value: 'No valid winners could be determined.', inline: false }
      );
      embed.setFooter({ text: 'Giveaway has ended with no winners' });
    }
  } else {
    embed.setFooter({ 
      text: `Ends at • ID: ${giveaway.id}${requiredRoleText}`,
      iconURL: giveaway.hostAvatar
    });
  }
  
  return embed;
}

/**
 * Update a giveaway message
 * @param {Object} giveaway - The giveaway to update
 * @param {Client} client - The Discord client
 * @returns {Promise<boolean>} Whether the update was successful
 */
async function updateGiveawayMessage(giveaway, client) {
  try {
    // Get channel
    const channel = await client.channels.fetch(giveaway.channelId);
    
    if (!channel || !channel.isTextBased()) {
      logger.warn(`Channel not found or not text-based for giveaway ${giveaway.id}`);
      return false;
    }
    
    // Get message
    const message = await channel.messages.fetch(giveaway.messageId);
    
    if (!message) {
      logger.warn(`Message not found for giveaway ${giveaway.id}`);
      return false;
    }
    
    // Create embed
    const embed = createGiveawayEmbed(giveaway);
    
    // Create entry button (only if giveaway is active)
    const components = [];
    
    if (!giveaway.ended) {
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway_enter_${giveaway.id}`)
            .setLabel('Enter Giveaway')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎉')
        );
      
      components.push(row);
    }
    
    // Edit message
    await message.edit({
      embeds: [embed],
      components
    });
    
    return true;
  } catch (error) {
    logger.error(`Error updating giveaway message for ${giveaway.id}:`, error);
    return false;
  }
}

/**
 * Handle a giveaway entry
 * @param {ButtonInteraction} interaction - The button interaction
 * @returns {Promise<boolean>} Whether the entry was successful
 */
async function handleEntry(interaction) {
  try {
    const { customId, user, guild } = interaction;
    
    // Parse custom ID
    const giveawayId = customId.split('_')[2];
    
    // Get giveaway
    const giveaway = giveaways.get(giveawayId);
    
    if (!giveaway) {
      await interaction.reply({
        content: 'This giveaway no longer exists.',
        ephemeral: true
      });
      return false;
    }
    
    if (giveaway.ended) {
      await interaction.reply({
        content: 'This giveaway has ended.',
        ephemeral: true
      });
      return false;
    }
    
    // Check if user already entered
    if (giveaway.entries.includes(user.id)) {
      await interaction.reply({
        content: 'You have already entered this giveaway.',
        ephemeral: true
      });
      return false;
    }
    
    // Check required role if specified
    if (giveaway.requiredRole) {
      const member = await guild.members.fetch(user.id);
      
      if (!member.roles.cache.has(giveaway.requiredRole)) {
        const role = await guild.roles.fetch(giveaway.requiredRole);
        const roleName = role ? role.name : 'Required Role';
        
        await interaction.reply({
          content: `You need the ${roleName} role to enter this giveaway.`,
          ephemeral: true
        });
        return false;
      }
    }
    
    // Add entry
    giveaway.entries.push(user.id);
    
    // Save giveaways
    await saveGiveaways();
    
    // Update giveaway message
    await updateGiveawayMessage(giveaway, interaction.client);
    
    // Reply to interaction
    await interaction.reply({
      content: `You have entered the giveaway for **${giveaway.prize}**! Good luck!`,
      ephemeral: true
    });
    
    return true;
  } catch (error) {
    logger.error('Error handling giveaway entry:', error);
    
    // Try to reply to interaction
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `An error occurred while entering the giveaway: ${error.message}`,
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
 * Schedule a giveaway to end
 * @param {string} giveawayId - The giveaway ID
 * @param {number} delay - The delay in milliseconds
 */
function scheduleGiveaway(giveawayId, delay) {
  // Cap delay at maximum setTimeout value if necessary (around 24.8 days)
  const MAX_TIMEOUT = 2147483647;
  
  if (delay > MAX_TIMEOUT) {
    // Schedule an intermediate timeout
    const timer = setTimeout(() => {
      scheduleGiveaway(giveawayId, delay - MAX_TIMEOUT);
    }, MAX_TIMEOUT);
    
    giveawayTimers.set(giveawayId, timer);
  } else {
    // Schedule the actual giveaway end
    const timer = setTimeout(() => {
      endGiveaway(giveawayId);
    }, delay);
    
    giveawayTimers.set(giveawayId, timer);
  }
}

/**
 * End a giveaway and select winners
 * @param {string} giveawayId - The giveaway ID
 * @returns {Promise<boolean>} Whether the giveaway was ended
 */
async function endGiveaway(giveawayId) {
  try {
    // Get giveaway
    const giveaway = giveaways.get(giveawayId);
    
    if (!giveaway || giveaway.ended) {
      return false;
    }
    
    // Mark as ended
    giveaway.ended = true;
    
    // Clear timer if exists
    if (giveawayTimers.has(giveawayId)) {
      clearTimeout(giveawayTimers.get(giveawayId));
      giveawayTimers.delete(giveawayId);
    }
    
    // Select winners
    giveaway.winners = selectWinners(giveaway);
    
    // Update message
    const client = require('../../bot-client').getClient();
    await updateGiveawayMessage(giveaway, client);
    
    // Announce winners
    if (giveaway.winners.length > 0) {
      await announceWinners(giveaway, client);
    }
    
    // Save giveaways
    await saveGiveaways();
    
    logger.info(`Giveaway ${giveawayId} ended with ${giveaway.winners.length} winner(s)`);
    
    return true;
  } catch (error) {
    logger.error(`Error ending giveaway ${giveawayId}:`, error);
    return false;
  }
}

/**
 * Select winners for a giveaway
 * @param {Object} giveaway - The giveaway
 * @returns {Array<string>} The winner IDs
 */
function selectWinners(giveaway) {
  // Filter out any duplicates (shouldn't happen, but just in case)
  const entries = [...new Set(giveaway.entries)];
  
  // If fewer entries than winner count, return all entries
  if (entries.length <= giveaway.winnerCount) {
    return entries;
  }
  
  // Randomly select winners
  const winners = [];
  const availableEntries = [...entries];
  
  for (let i = 0; i < giveaway.winnerCount; i++) {
    if (availableEntries.length === 0) break;
    
    // Get random index
    const randomIndex = Math.floor(Math.random() * availableEntries.length);
    
    // Get winner
    const winner = availableEntries[randomIndex];
    
    // Add to winners array
    winners.push(winner);
    
    // Remove from available entries
    availableEntries.splice(randomIndex, 1);
  }
  
  return winners;
}

/**
 * Announce winners
 * @param {Object} giveaway - The giveaway
 * @param {Client} client - The Discord client
 * @returns {Promise<boolean>} Whether the announcement was successful
 */
async function announceWinners(giveaway, client) {
  try {
    // Skip if no winners
    if (giveaway.winners.length === 0) {
      return false;
    }
    
    // Get channel
    const channel = await client.channels.fetch(giveaway.channelId);
    
    if (!channel || !channel.isTextBased()) {
      logger.warn(`Channel not found or not text-based for giveaway ${giveaway.id}`);
      return false;
    }
    
    // Format winner mentions
    const winnerMentions = giveaway.winners.map(id => `<@${id}>`).join(', ');
    
    // Create announcement message
    let announcement = `🎉 Congratulations ${winnerMentions}! You won the giveaway for **${giveaway.prize}**!`;
    
    // Add original message link
    announcement += `\n[Jump to the giveaway](https://discord.com/channels/${giveaway.guildId}/${giveaway.channelId}/${giveaway.messageId})`;
    
    // Send announcement
    await channel.send(announcement);
    
    return true;
  } catch (error) {
    logger.error(`Error announcing winners for giveaway ${giveaway.id}:`, error);
    return false;
  }
}

/**
 * End a giveaway early and select winners
 * @param {string} giveawayId - The giveaway ID
 * @returns {Promise<boolean>} Whether the giveaway was ended
 */
async function endGiveawayEarly(giveawayId) {
  return await endGiveaway(giveawayId);
}

/**
 * Reroll winners for a giveaway
 * @param {string} giveawayId - The giveaway ID
 * @param {number} [winnerCount] - The new winner count (optional)
 * @returns {Promise<boolean>} Whether the winners were rerolled
 */
async function rerollGiveaway(giveawayId, winnerCount = null) {
  try {
    // Get giveaway
    const giveaway = giveaways.get(giveawayId);
    
    if (!giveaway || !giveaway.ended) {
      return false;
    }
    
    // Update winner count if provided
    if (winnerCount !== null) {
      giveaway.winnerCount = winnerCount;
    }
    
    // Select new winners
    giveaway.winners = selectWinners(giveaway);
    
    // Update message
    const client = require('../../bot-client').getClient();
    await updateGiveawayMessage(giveaway, client);
    
    // Announce winners
    if (giveaway.winners.length > 0) {
      await announceWinners(giveaway, client);
    }
    
    // Save giveaways
    await saveGiveaways();
    
    logger.info(`Giveaway ${giveawayId} rerolled with ${giveaway.winners.length} winner(s)`);
    
    return true;
  } catch (error) {
    logger.error(`Error rerolling giveaway ${giveawayId}:`, error);
    return false;
  }
}

/**
 * Get active giveaways in a guild
 * @param {string} guildId - The guild ID
 * @returns {Array<Object>} The active giveaways
 */
function getActiveGiveaways(guildId) {
  return Array.from(giveaways.values())
    .filter(giveaway => giveaway.guildId === guildId && !giveaway.ended);
}

/**
 * Get all giveaways in a guild
 * @param {string} guildId - The guild ID
 * @param {boolean} includeEnded - Whether to include ended giveaways
 * @returns {Array<Object>} The giveaways
 */
function getGuildGiveaways(guildId, includeEnded = true) {
  return Array.from(giveaways.values())
    .filter(giveaway => 
      giveaway.guildId === guildId && 
      (includeEnded || !giveaway.ended)
    );
}

/**
 * Get a specific giveaway
 * @param {string} giveawayId - The giveaway ID
 * @returns {Object|null} The giveaway or null if not found
 */
function getGiveaway(giveawayId) {
  return giveaways.get(giveawayId) || null;
}

/**
 * Clean up old ended giveaways
 * @param {number} maxAgeMs - Maximum age in milliseconds for ended giveaways
 * @returns {Promise<number>} Number of giveaways cleaned up
 */
async function cleanupGiveaways(maxAgeMs = 30 * 24 * 60 * 60 * 1000) { // Default: 30 days
  try {
    const now = Date.now();
    let count = 0;
    
    // Get ended giveaways older than maxAgeMs
    const oldGiveaways = Array.from(giveaways.entries())
      .filter(([, giveaway]) => 
        giveaway.ended && 
        (now - giveaway.endTime) > maxAgeMs
      );
    
    // Remove old giveaways
    for (const [giveawayId] of oldGiveaways) {
      giveaways.delete(giveawayId);
      count++;
    }
    
    // Save changes if any giveaways were removed
    if (count > 0) {
      await saveGiveaways();
    }
    
    return count;
  } catch (error) {
    logger.error('Error cleaning up giveaways:', error);
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

module.exports = {
  initialize,
  createGiveaway,
  handleEntry,
  endGiveawayEarly,
  rerollGiveaway,
  getActiveGiveaways,
  getGuildGiveaways,
  getGiveaway,
  DURATION_OPTIONS
};