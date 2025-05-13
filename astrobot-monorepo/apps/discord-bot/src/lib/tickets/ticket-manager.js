const fs = require('fs').promises;
const path = require('path');
const { 
  ChannelType, 
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Collection
} = require('discord.js');
const logger = require('../logger');

// Path to the tickets storage file
const TICKETS_FILE = path.join(process.cwd(), 'data', 'tickets.json');

// Path to the ticket settings storage file
const TICKET_SETTINGS_FILE = path.join(process.cwd(), 'data', 'ticket-settings.json');

// In-memory storage
const tickets = new Map();
const ticketSettings = new Map();
const activeTicketUsers = new Collection(); // Recent users who created tickets (for cooldown)

// Auto-save interval (5 minutes in ms)
const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;

// Default settings
const DEFAULT_SETTINGS = {
  enabled: false,
  categories: [{
    id: 'general',
    name: 'General Support',
    description: 'General questions and help',
    emoji: '❓',
    staffRoles: [],
    channelName: 'ticket-{username}',
    welcomeMessage: 'Thanks for creating a ticket. Please describe your issue and wait for a staff member to respond.',
    defaultCategory: null, // Discord category ID
    ticketLimit: 1,
    cooldown: 300 // 5 minutes in seconds
  }]
};

// Ticket status
const TicketStatus = {
  OPEN: 'open',
  CLOSED: 'closed'
};

/**
 * Initialize the ticket manager
 */
async function initialize() {
  try {
    // Load tickets and settings
    await loadTickets();
    await loadSettings();
    
    logger.info('Ticket manager initialized');
    
    // Set up auto-save interval
    setInterval(async () => {
      await saveTickets();
      await saveSettings();
    }, AUTO_SAVE_INTERVAL);
  } catch (error) {
    logger.error('Error initializing ticket manager:', error);
  }
}

/**
 * Create a ticket panel
 * @param {Object} options - Ticket panel options
 * @param {string} options.guildId - The guild ID
 * @param {string} options.channelId - The channel ID where the panel will be created
 * @param {string} options.title - The panel title
 * @param {string} options.description - The panel description
 * @param {Array<string>} [options.categoryIds] - The ticket category IDs to include (defaults to all)
 * @returns {Promise<Object>} The created panel message
 */
async function createTicketPanel(options) {
  try {
    // Validate options
    if (!options.guildId || !options.channelId || !options.title) {
      throw new Error('Missing required options');
    }
    
    // Get guild settings
    const settings = getGuildSettings(options.guildId);
    
    if (!settings.enabled) {
      throw new Error('Ticket system is disabled for this guild');
    }
    
    // Get the channel
    const client = global.client;
    
    if (!client) {
      throw new Error('Discord client not available');
    }
    
    const guild = await client.guilds.fetch(options.guildId);
    const channel = await guild.channels.fetch(options.channelId);
    
    if (!channel || !channel.isTextBased()) {
      throw new Error('Channel not found or not a text channel');
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(options.title)
      .setDescription(options.description || 'Click a button below to create a ticket')
      .setFooter({ text: 'AstroBot Ticket System' })
      .setTimestamp();
    
    // Get categories to include
    const categoriesToInclude = options.categoryIds 
      ? settings.categories.filter(c => options.categoryIds.includes(c.id))
      : settings.categories;
    
    if (categoriesToInclude.length === 0) {
      throw new Error('No valid ticket categories specified');
    }
    
    // Create buttons
    const rows = [];
    const buttons = [];
    
    for (const category of categoriesToInclude) {
      const button = new ButtonBuilder()
        .setCustomId(`ticket_create_${category.id}`)
        .setLabel(category.name)
        .setEmoji(category.emoji || '🎫')
        .setStyle(ButtonStyle.Primary);
      
      buttons.push(button);
      
      // Discord only allows 5 buttons per row
      if (buttons.length === 5 || categoriesToInclude.indexOf(category) === categoriesToInclude.length - 1) {
        rows.push(new ActionRowBuilder().addComponents(buttons.splice(0, buttons.length)));
      }
    }
    
    // Send message
    const message = await channel.send({
      embeds: [embed],
      components: rows
    });
    
    return message;
  } catch (error) {
    logger.error('Error creating ticket panel:', error);
    throw error;
  }
}

/**
 * Handle a ticket button interaction
 * @param {ButtonInteraction} interaction - The button interaction
 * @returns {Promise<void>}
 */
async function handleTicketButton(interaction) {
  try {
    // Get the button custom ID
    const customId = interaction.customId;
    
    // Parse the custom ID
    const parts = customId.split('_');
    const action = parts[1];
    
    // Handle based on action
    switch (action) {
      case 'create':
        return await handleTicketCreate(interaction, parts[2]);
      case 'close':
        return await handleTicketClose(interaction);
      case 'reopen':
        return await handleTicketReopen(interaction);
      case 'delete':
        return await handleTicketDelete(interaction);
      case 'transcript':
        return await handleTicketTranscript(interaction);
      case 'claim':
        return await handleTicketClaim(interaction);
    }
  } catch (error) {
    logger.error('Error handling ticket button:', error);
    
    await interaction.reply({
      content: `Error: ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Handle ticket creation
 * @param {ButtonInteraction} interaction - The button interaction
 * @param {string} categoryId - The ticket category ID
 * @returns {Promise<void>}
 */
async function handleTicketCreate(interaction, categoryId) {
  try {
    // Get guild settings
    const settings = getGuildSettings(interaction.guildId);
    
    if (!settings.enabled) {
      return await interaction.reply({
        content: 'Ticket system is currently disabled.',
        ephemeral: true
      });
    }
    
    // Get the category
    const category = settings.categories.find(c => c.id === categoryId);
    
    if (!category) {
      return await interaction.reply({
        content: 'Invalid ticket category.',
        ephemeral: true
      });
    }
    
    // Check if user is on cooldown
    const userId = interaction.user.id;
    const now = Date.now();
    
    if (activeTicketUsers.has(userId)) {
      const userData = activeTicketUsers.get(userId);
      const cooldownTime = category.cooldown || 300; // Default: 5 minutes
      const expirationTime = userData.timestamp + (cooldownTime * 1000);
      
      if (now < expirationTime) {
        const timeLeft = Math.ceil((expirationTime - now) / 1000);
        
        return await interaction.reply({
          content: `Please wait ${timeLeft} seconds before creating another ticket.`,
          ephemeral: true
        });
      }
    }
    
    // Check if user has reached ticket limit for this category
    const userTickets = getUserActiveTickets(interaction.guildId, userId, categoryId);
    const ticketLimit = category.ticketLimit || 1;
    
    if (userTickets.length >= ticketLimit) {
      return await interaction.reply({
        content: `You already have ${userTickets.length} active tickets in this category. Please close them before creating a new one.`,
        ephemeral: true
      });
    }
    
    // Defer reply as channel creation can take time
    await interaction.deferReply({ ephemeral: true });
    
    // Generate ticket ID
    const ticketId = generateTicketId(interaction.guildId);
    const ticketNumber = getNextTicketNumber(interaction.guildId);
    
    // Create channel name
    const channelName = (category.channelName || 'ticket-{username}')
      .replace('{username}', interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, ''))
      .replace('{userid}', interaction.user.id)
      .replace('{ticketid}', ticketId)
      .replace('{number}', ticketNumber);
    
    // Get or create category channel
    let categoryChannel = null;
    
    if (category.defaultCategory) {
      try {
        categoryChannel = await interaction.guild.channels.fetch(category.defaultCategory);
      } catch (error) {
        logger.warn(`Could not fetch category channel ${category.defaultCategory}:`, error);
      }
    }
    
    // Create permissions array
    const permissions = [
      // Base permissions
      {
        id: interaction.guild.id, // @everyone role
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: interaction.client.user.id, // Bot
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.ManageMessages
        ]
      },
      {
        id: interaction.user.id, // Ticket creator
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory
        ]
      }
    ];
    
    // Add staff role permissions
    for (const roleId of category.staffRoles || []) {
      permissions.push({
        id: roleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.ReadMessageHistory
        ]
      });
    }
    
    // Create ticket channel
    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: categoryChannel,
      permissionOverwrites: permissions,
      topic: `Ticket: ${category.name} | Created by: ${interaction.user.tag} | ID: ${ticketId}`
    });
    
    // Create ticket object
    const ticket = {
      id: ticketId,
      number: ticketNumber,
      guildId: interaction.guildId,
      channelId: channel.id,
      userId: interaction.user.id,
      categoryId: category.id,
      status: TicketStatus.OPEN,
      createdAt: new Date(),
      closedAt: null,
      closedBy: null,
      claimedBy: null,
      participants: [interaction.user.id]
    };
    
    // Store ticket
    if (!tickets.has(interaction.guildId)) {
      tickets.set(interaction.guildId, new Map());
    }
    
    tickets.get(interaction.guildId).set(ticketId, ticket);
    
    // Store user in cooldown collection
    activeTicketUsers.set(userId, {
      timestamp: now,
      categoryId
    });
    
    // Create welcome message
    const welcomeEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(`${category.name} Ticket`)
      .setDescription(category.welcomeMessage || 'Thanks for creating a ticket. Please describe your issue and wait for a staff member to respond.')
      .addFields(
        { name: 'Ticket ID', value: ticketId, inline: true },
        { name: 'Created By', value: `${interaction.user}`, inline: true }
      )
      .setFooter({ text: 'AstroBot Ticket System' })
      .setTimestamp();
    
    // Create action buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('Claim Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✋')
    );
    
    // Send welcome message
    await channel.send({
      content: `${interaction.user}`,
      embeds: [welcomeEmbed],
      components: [buttons]
    });
    
    // Save tickets
    await saveTickets();
    
    // Reply to interaction
    await interaction.editReply({
      content: `Your ticket has been created in ${channel}!`,
      ephemeral: true
    });
  } catch (error) {
    logger.error('Error creating ticket:', error);
    
    if (interaction.deferred) {
      await interaction.editReply({
        content: `There was an error creating your ticket: ${error.message}`,
        ephemeral: true
      });
    } else {
      await interaction.reply({
        content: `There was an error creating your ticket: ${error.message}`,
        ephemeral: true
      });
    }
  }
}

/**
 * Handle ticket close
 * @param {ButtonInteraction} interaction - The button interaction
 * @returns {Promise<void>}
 */
async function handleTicketClose(interaction) {
  try {
    // Get ticket
    const ticket = getTicketByChannelId(interaction.guildId, interaction.channelId);
    
    if (!ticket) {
      return await interaction.reply({
        content: 'This is not a valid ticket channel.',
        ephemeral: true
      });
    }
    
    // Check if ticket is already closed
    if (ticket.status === TicketStatus.CLOSED) {
      return await interaction.reply({
        content: 'This ticket is already closed.',
        ephemeral: true
      });
    }
    
    // Check if user has permission to close ticket
    const isCreator = ticket.userId === interaction.user.id;
    const isStaff = await checkStaffPermission(interaction.member, ticket.categoryId);
    
    if (!isCreator && !isStaff) {
      return await interaction.reply({
        content: 'You do not have permission to close this ticket.',
        ephemeral: true
      });
    }
    
    // Close ticket
    ticket.status = TicketStatus.CLOSED;
    ticket.closedAt = new Date();
    ticket.closedBy = interaction.user.id;
    
    // Update permissions to prevent the user from sending messages
    await interaction.channel.permissionOverwrites.edit(ticket.userId, {
      SendMessages: false
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Ticket Closed')
      .setDescription(`This ticket has been closed by ${interaction.user}.`)
      .setFooter({ text: 'AstroBot Ticket System' })
      .setTimestamp();
    
    // Create action buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_reopen')
        .setLabel('Reopen Ticket')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🔓'),
      new ButtonBuilder()
        .setCustomId('ticket_delete')
        .setLabel('Delete Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🗑️'),
      new ButtonBuilder()
        .setCustomId('ticket_transcript')
        .setLabel('Create Transcript')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝')
    );
    
    // Save tickets
    await saveTickets();
    
    // Reply to interaction
    await interaction.reply({
      embeds: [embed],
      components: [buttons]
    });
  } catch (error) {
    logger.error('Error closing ticket:', error);
    
    await interaction.reply({
      content: `There was an error closing this ticket: ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Handle ticket reopen
 * @param {ButtonInteraction} interaction - The button interaction
 * @returns {Promise<void>}
 */
async function handleTicketReopen(interaction) {
  try {
    // Get ticket
    const ticket = getTicketByChannelId(interaction.guildId, interaction.channelId);
    
    if (!ticket) {
      return await interaction.reply({
        content: 'This is not a valid ticket channel.',
        ephemeral: true
      });
    }
    
    // Check if ticket is already open
    if (ticket.status === TicketStatus.OPEN) {
      return await interaction.reply({
        content: 'This ticket is already open.',
        ephemeral: true
      });
    }
    
    // Check if user has permission to reopen ticket
    const isStaff = await checkStaffPermission(interaction.member, ticket.categoryId);
    
    if (!isStaff) {
      return await interaction.reply({
        content: 'You do not have permission to reopen this ticket.',
        ephemeral: true
      });
    }
    
    // Reopen ticket
    ticket.status = TicketStatus.OPEN;
    ticket.closedAt = null;
    ticket.closedBy = null;
    
    // Update permissions to allow the user to send messages again
    await interaction.channel.permissionOverwrites.edit(ticket.userId, {
      SendMessages: true
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Ticket Reopened')
      .setDescription(`This ticket has been reopened by ${interaction.user}.`)
      .setFooter({ text: 'AstroBot Ticket System' })
      .setTimestamp();
    
    // Create action buttons
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ticket_close')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒'),
      new ButtonBuilder()
        .setCustomId('ticket_claim')
        .setLabel('Claim Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('✋')
    );
    
    // Save tickets
    await saveTickets();
    
    // Reply to interaction
    await interaction.reply({
      embeds: [embed],
      components: [buttons]
    });
  } catch (error) {
    logger.error('Error reopening ticket:', error);
    
    await interaction.reply({
      content: `There was an error reopening this ticket: ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Handle ticket delete
 * @param {ButtonInteraction} interaction - The button interaction
 * @returns {Promise<void>}
 */
async function handleTicketDelete(interaction) {
  try {
    // Get ticket
    const ticket = getTicketByChannelId(interaction.guildId, interaction.channelId);
    
    if (!ticket) {
      return await interaction.reply({
        content: 'This is not a valid ticket channel.',
        ephemeral: true
      });
    }
    
    // Check if user has permission to delete ticket
    const isStaff = await checkStaffPermission(interaction.member, ticket.categoryId);
    
    if (!isStaff) {
      return await interaction.reply({
        content: 'You do not have permission to delete this ticket.',
        ephemeral: true
      });
    }
    
    // Confirm deletion
    const embed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('Ticket Deletion')
      .setDescription('This ticket will be deleted in 5 seconds...')
      .setFooter({ text: 'AstroBot Ticket System' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
    // Wait 5 seconds before deleting
    setTimeout(async () => {
      try {
        // Delete channel
        await interaction.channel.delete(`Ticket deleted by ${interaction.user.tag}`);
        
        // Delete ticket
        if (tickets.has(interaction.guildId)) {
          tickets.get(interaction.guildId).delete(ticket.id);
        }
        
        // Save tickets
        await saveTickets();
      } catch (error) {
        logger.error('Error deleting ticket channel:', error);
      }
    }, 5000);
  } catch (error) {
    logger.error('Error deleting ticket:', error);
    
    await interaction.reply({
      content: `There was an error deleting this ticket: ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Handle ticket transcript
 * @param {ButtonInteraction} interaction - The button interaction
 * @returns {Promise<void>}
 */
async function handleTicketTranscript(interaction) {
  try {
    // Get ticket
    const ticket = getTicketByChannelId(interaction.guildId, interaction.channelId);
    
    if (!ticket) {
      return await interaction.reply({
        content: 'This is not a valid ticket channel.',
        ephemeral: true
      });
    }
    
    // Check if user has permission to create transcript
    const isStaff = await checkStaffPermission(interaction.member, ticket.categoryId);
    const isCreator = ticket.userId === interaction.user.id;
    
    if (!isStaff && !isCreator) {
      return await interaction.reply({
        content: 'You do not have permission to create a transcript for this ticket.',
        ephemeral: true
      });
    }
    
    // Defer reply as fetching messages can take time
    await interaction.deferReply();
    
    // Fetch all messages in the channel
    let messages = [];
    let lastId = null;
    
    while (true) {
      const options = { limit: 100 };
      if (lastId) options.before = lastId;
      
      const fetchedMessages = await interaction.channel.messages.fetch(options);
      
      if (fetchedMessages.size === 0) break;
      
      messages = [...messages, ...fetchedMessages.values()];
      lastId = fetchedMessages.last().id;
      
      if (fetchedMessages.size < 100) break;
    }
    
    // Sort messages from oldest to newest
    messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);
    
    // Generate transcript
    let transcript = '# Ticket Transcript\n\n';
    transcript += `**Ticket ID:** ${ticket.id}\n`;
    transcript += `**Category:** ${getCategoryName(interaction.guildId, ticket.categoryId)}\n`;
    transcript += `**Created By:** ${getUserTag(interaction.client, ticket.userId)}\n`;
    transcript += `**Created At:** ${new Date(ticket.createdAt).toUTCString()}\n`;
    
    if (ticket.closedAt) {
      transcript += `**Closed By:** ${getUserTag(interaction.client, ticket.closedBy)}\n`;
      transcript += `**Closed At:** ${new Date(ticket.closedAt).toUTCString()}\n`;
    }
    
    if (ticket.claimedBy) {
      transcript += `**Claimed By:** ${getUserTag(interaction.client, ticket.claimedBy)}\n`;
    }
    
    transcript += '\n## Messages\n\n';
    
    for (const message of messages) {
      const timestamp = new Date(message.createdTimestamp).toUTCString();
      const content = message.content || '*No text content*';
      
      transcript += `**${message.author.tag}** (${timestamp}):\n`;
      transcript += `${content}\n\n`;
      
      // Add attachments
      if (message.attachments.size > 0) {
        transcript += '*Attachments:*\n';
        
        for (const [id, attachment] of message.attachments) {
          transcript += `- [${attachment.name}](${attachment.url})\n`;
        }
        
        transcript += '\n';
      }
      
      // Add embeds summary
      if (message.embeds.length > 0) {
        transcript += `*Message contains ${message.embeds.length} embed(s)*\n\n`;
      }
    }
    
    // Convert to a buffer
    const buffer = Buffer.from(transcript, 'utf-8');
    
    // Create file name
    const fileName = `ticket-${ticket.id}-transcript.md`;
    
    // Send transcript
    await interaction.editReply({
      content: 'Here is the transcript for this ticket:',
      files: [{
        attachment: buffer,
        name: fileName
      }]
    });
  } catch (error) {
    logger.error('Error creating transcript:', error);
    
    if (interaction.deferred) {
      await interaction.editReply({
        content: `There was an error creating the transcript: ${error.message}`
      });
    } else {
      await interaction.reply({
        content: `There was an error creating the transcript: ${error.message}`,
        ephemeral: true
      });
    }
  }
}

/**
 * Handle ticket claim
 * @param {ButtonInteraction} interaction - The button interaction
 * @returns {Promise<void>}
 */
async function handleTicketClaim(interaction) {
  try {
    // Get ticket
    const ticket = getTicketByChannelId(interaction.guildId, interaction.channelId);
    
    if (!ticket) {
      return await interaction.reply({
        content: 'This is not a valid ticket channel.',
        ephemeral: true
      });
    }
    
    // Check if ticket is closed
    if (ticket.status === TicketStatus.CLOSED) {
      return await interaction.reply({
        content: 'This ticket is closed and cannot be claimed.',
        ephemeral: true
      });
    }
    
    // Check if ticket is already claimed
    if (ticket.claimedBy) {
      // If claimed by the same user, unclaim it
      if (ticket.claimedBy === interaction.user.id) {
        ticket.claimedBy = null;
        
        // Create embed
        const embed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('Ticket Unclaimed')
          .setDescription(`${interaction.user} has unclaimed this ticket.`)
          .setFooter({ text: 'AstroBot Ticket System' })
          .setTimestamp();
        
        // Save tickets
        await saveTickets();
        
        // Reply to interaction
        return await interaction.reply({ embeds: [embed] });
      }
      
      return await interaction.reply({
        content: `This ticket is already claimed by <@${ticket.claimedBy}>.`,
        ephemeral: true
      });
    }
    
    // Check if user has permission to claim ticket
    const isStaff = await checkStaffPermission(interaction.member, ticket.categoryId);
    
    if (!isStaff) {
      return await interaction.reply({
        content: 'You do not have permission to claim this ticket.',
        ephemeral: true
      });
    }
    
    // Claim ticket
    ticket.claimedBy = interaction.user.id;
    
    // Add to participants if not already there
    if (!ticket.participants.includes(interaction.user.id)) {
      ticket.participants.push(interaction.user.id);
    }
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('Ticket Claimed')
      .setDescription(`${interaction.user} has claimed this ticket and will be assisting you.`)
      .setFooter({ text: 'AstroBot Ticket System' })
      .setTimestamp();
    
    // Save tickets
    await saveTickets();
    
    // Reply to interaction
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    logger.error('Error claiming ticket:', error);
    
    await interaction.reply({
      content: `There was an error claiming this ticket: ${error.message}`,
      ephemeral: true
    });
  }
}

/**
 * Check if a user has staff permission for a ticket category
 * @param {GuildMember} member - The guild member
 * @param {string} categoryId - The ticket category ID
 * @returns {Promise<boolean>} Whether the user has permission
 */
async function checkStaffPermission(member, categoryId) {
  // Check if the user has administrator permission
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return true;
  }
  
  // Get the category
  const settings = getGuildSettings(member.guild.id);
  const category = settings.categories.find(c => c.id === categoryId);
  
  if (!category) {
    return false;
  }
  
  // Check if the user has any of the staff roles
  for (const roleId of category.staffRoles || []) {
    if (member.roles.cache.has(roleId)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get category name by ID
 * @param {string} guildId - The guild ID
 * @param {string} categoryId - The category ID
 * @returns {string} The category name
 */
function getCategoryName(guildId, categoryId) {
  const settings = getGuildSettings(guildId);
  const category = settings.categories.find(c => c.id === categoryId);
  
  return category ? category.name : 'Unknown Category';
}

/**
 * Get user tag by ID
 * @param {Client} client - The Discord client
 * @param {string} userId - The user ID
 * @returns {string} The user tag
 */
function getUserTag(client, userId) {
  if (!userId) return 'Unknown User';
  
  const user = client.users.cache.get(userId);
  return user ? user.tag : `Unknown User (${userId})`;
}

/**
 * Get guild settings
 * @param {string} guildId - The guild ID
 * @returns {Object} The guild settings
 */
function getGuildSettings(guildId) {
  if (!ticketSettings.has(guildId)) {
    ticketSettings.set(guildId, { ...DEFAULT_SETTINGS });
  }
  
  return ticketSettings.get(guildId);
}

/**
 * Update guild settings
 * @param {string} guildId - The guild ID
 * @param {Object} settings - The new settings
 * @returns {Promise<Object>} The updated settings
 */
async function updateGuildSettings(guildId, settings) {
  // Get current settings
  const currentSettings = getGuildSettings(guildId);
  
  // Update settings
  const updatedSettings = { ...currentSettings, ...settings };
  
  // Save settings
  ticketSettings.set(guildId, updatedSettings);
  await saveSettings();
  
  return updatedSettings;
}

/**
 * Update a ticket category
 * @param {string} guildId - The guild ID
 * @param {string} categoryId - The category ID
 * @param {Object} categoryData - The category data
 * @returns {Promise<Object>} The updated settings
 */
async function updateTicketCategory(guildId, categoryId, categoryData) {
  // Get current settings
  const settings = getGuildSettings(guildId);
  
  // Find category index
  const index = settings.categories.findIndex(c => c.id === categoryId);
  
  if (index === -1) {
    throw new Error(`Category ${categoryId} not found`);
  }
  
  // Update category
  settings.categories[index] = { ...settings.categories[index], ...categoryData };
  
  // Save settings
  await saveSettings();
  
  return settings;
}

/**
 * Add a ticket category
 * @param {string} guildId - The guild ID
 * @param {Object} categoryData - The category data
 * @returns {Promise<Object>} The updated settings
 */
async function addTicketCategory(guildId, categoryData) {
  // Get current settings
  const settings = getGuildSettings(guildId);
  
  // Validate category data
  if (!categoryData.id || !categoryData.name) {
    throw new Error('Category ID and name are required');
  }
  
  // Check if category ID already exists
  if (settings.categories.some(c => c.id === categoryData.id)) {
    throw new Error(`Category with ID ${categoryData.id} already exists`);
  }
  
  // Create category object
  const category = {
    id: categoryData.id,
    name: categoryData.name,
    description: categoryData.description || '',
    emoji: categoryData.emoji || '🎫',
    staffRoles: categoryData.staffRoles || [],
    channelName: categoryData.channelName || 'ticket-{username}',
    welcomeMessage: categoryData.welcomeMessage || 'Thanks for creating a ticket. Please describe your issue and wait for a staff member to respond.',
    defaultCategory: categoryData.defaultCategory || null,
    ticketLimit: categoryData.ticketLimit || 1,
    cooldown: categoryData.cooldown || 300
  };
  
  // Add category
  settings.categories.push(category);
  
  // Save settings
  await saveSettings();
  
  return settings;
}

/**
 * Remove a ticket category
 * @param {string} guildId - The guild ID
 * @param {string} categoryId - The category ID
 * @returns {Promise<Object>} The updated settings
 */
async function removeTicketCategory(guildId, categoryId) {
  // Get current settings
  const settings = getGuildSettings(guildId);
  
  // Filter out the category
  settings.categories = settings.categories.filter(c => c.id !== categoryId);
  
  // Save settings
  await saveSettings();
  
  return settings;
}

/**
 * Get a ticket by channel ID
 * @param {string} guildId - The guild ID
 * @param {string} channelId - The channel ID
 * @returns {Object|null} The ticket
 */
function getTicketByChannelId(guildId, channelId) {
  // Get guild tickets
  if (!tickets.has(guildId)) {
    return null;
  }
  
  const guildTickets = tickets.get(guildId);
  
  // Find ticket with matching channel ID
  for (const [id, ticket] of guildTickets) {
    if (ticket.channelId === channelId) {
      return ticket;
    }
  }
  
  return null;
}

/**
 * Get a user's active tickets
 * @param {string} guildId - The guild ID
 * @param {string} userId - The user ID
 * @param {string} [categoryId] - The category ID (optional)
 * @returns {Array<Object>} The user's active tickets
 */
function getUserActiveTickets(guildId, userId, categoryId = null) {
  // Get guild tickets
  if (!tickets.has(guildId)) {
    return [];
  }
  
  const guildTickets = tickets.get(guildId);
  
  // Filter tickets
  return Array.from(guildTickets.values()).filter(ticket => 
    ticket.userId === userId && 
    ticket.status === TicketStatus.OPEN &&
    (categoryId === null || ticket.categoryId === categoryId)
  );
}

/**
 * Generate a ticket ID
 * @param {string} guildId - The guild ID
 * @returns {string} The generated ID
 */
function generateTicketId(guildId) {
  // Get current date elements
  const now = new Date();
  const year = now.getFullYear().toString().slice(2); // Last 2 digits of year
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Get next ticket number
  const number = getNextTicketNumber(guildId).toString().padStart(4, '0');
  
  // Combine to create ID
  return `${year}${month}${day}-${number}`;
}

/**
 * Get the next ticket number for a guild
 * @param {string} guildId - The guild ID
 * @returns {number} The next ticket number
 */
function getNextTicketNumber(guildId) {
  // Get guild tickets
  if (!tickets.has(guildId)) {
    return 1;
  }
  
  const guildTickets = tickets.get(guildId);
  
  // If no tickets, start with 1
  if (guildTickets.size === 0) {
    return 1;
  }
  
  // Get the highest ticket number
  const numbers = Array.from(guildTickets.values()).map(ticket => ticket.number || 0);
  const maxNumber = Math.max(...numbers);
  
  // Return next number
  return maxNumber + 1;
}

/**
 * Save tickets to disk
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveTickets() {
  try {
    // Convert the map to an object
    const ticketsObj = {};
    
    for (const [guildId, guildTickets] of tickets.entries()) {
      ticketsObj[guildId] = {};
      
      for (const [ticketId, ticket] of guildTickets.entries()) {
        ticketsObj[guildId][ticketId] = {
          ...ticket,
          createdAt: ticket.createdAt instanceof Date ? ticket.createdAt.toISOString() : ticket.createdAt,
          closedAt: ticket.closedAt instanceof Date ? ticket.closedAt.toISOString() : ticket.closedAt
        };
      }
    }
    
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(TICKETS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(TICKETS_FILE, JSON.stringify(ticketsObj, null, 2));
    
    logger.debug(`Saved tickets to disk`);
    return true;
  } catch (error) {
    logger.error('Error saving tickets:', error);
    return false;
  }
}

/**
 * Load tickets from disk
 * @returns {Promise<void>}
 */
async function loadTickets() {
  try {
    // Check if the file exists
    try {
      await fs.access(TICKETS_FILE);
    } catch (error) {
      logger.warn('Tickets file does not exist, creating an empty one');
      await saveTickets();
      return;
    }
    
    // Read the file
    const data = await fs.readFile(TICKETS_FILE, 'utf8');
    
    // Parse the JSON
    const ticketsObj = JSON.parse(data);
    
    // Convert to maps
    for (const [guildId, guildTicketsObj] of Object.entries(ticketsObj)) {
      const guildTickets = new Map();
      
      for (const [ticketId, ticket] of Object.entries(guildTicketsObj)) {
        guildTickets.set(ticketId, {
          ...ticket,
          createdAt: new Date(ticket.createdAt),
          closedAt: ticket.closedAt ? new Date(ticket.closedAt) : null
        });
      }
      
      tickets.set(guildId, guildTickets);
    }
    
    logger.debug(`Loaded tickets from disk`);
  } catch (error) {
    logger.error('Error loading tickets:', error);
  }
}

/**
 * Save settings to disk
 * @returns {Promise<boolean>} Whether the save was successful
 */
async function saveSettings() {
  try {
    // Convert the map to an object
    const settingsObj = {};
    
    for (const [guildId, settings] of ticketSettings.entries()) {
      settingsObj[guildId] = settings;
    }
    
    // Ensure the data directory exists
    await fs.mkdir(path.dirname(TICKET_SETTINGS_FILE), { recursive: true });
    
    // Write to file
    await fs.writeFile(TICKET_SETTINGS_FILE, JSON.stringify(settingsObj, null, 2));
    
    logger.debug(`Saved ticket settings to disk`);
    return true;
  } catch (error) {
    logger.error('Error saving ticket settings:', error);
    return false;
  }
}

/**
 * Load settings from disk
 * @returns {Promise<void>}
 */
async function loadSettings() {
  try {
    // Check if the file exists
    try {
      await fs.access(TICKET_SETTINGS_FILE);
    } catch (error) {
      logger.warn('Ticket settings file does not exist, creating an empty one');
      await saveSettings();
      return;
    }
    
    // Read the file
    const data = await fs.readFile(TICKET_SETTINGS_FILE, 'utf8');
    
    // Parse the JSON
    const settingsObj = JSON.parse(data);
    
    // Convert to map
    for (const [guildId, settings] of Object.entries(settingsObj)) {
      ticketSettings.set(guildId, {
        ...DEFAULT_SETTINGS,
        ...settings
      });
    }
    
    logger.debug(`Loaded ticket settings from disk`);
  } catch (error) {
    logger.error('Error loading ticket settings:', error);
  }
}

module.exports = {
  initialize,
  createTicketPanel,
  handleTicketButton,
  getGuildSettings,
  updateGuildSettings,
  addTicketCategory,
  updateTicketCategory,
  removeTicketCategory,
  getTicketByChannelId,
  getUserActiveTickets,
  TicketStatus
};