const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const tickets = require('../../lib/tickets/ticket-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('ticket-stats')
    .setDescription('View ticket system statistics')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  
  // Cooldown in seconds
  cooldown: 10,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    try {
      // Get settings
      const settings = tickets.getGuildSettings(interaction.guildId);
      
      // Check if ticket system is enabled
      if (!settings.enabled) {
        return await interaction.reply({
          content: 'The ticket system is currently disabled. Enable it with `/ticket-setup enable`.',
          ephemeral: true
        });
      }
      
      // Get all guild tickets
      let guildTickets = [];
      
      const guildTicketsMap = tickets.getGuildTickets?.(interaction.guildId);
      
      if (guildTicketsMap) {
        // If there's a direct method to get tickets
        guildTickets = Array.from(guildTicketsMap.values());
      } else {
        // Fallback: Look for all tickets one by one
        // This is less efficient but works if there's no direct map access
        const activeChannels = interaction.guild.channels.cache
          .filter(channel => channel.isTextBased())
          .map(channel => channel.id);
        
        for (const channelId of activeChannels) {
          const ticket = tickets.getTicketByChannelId(interaction.guildId, channelId);
          if (ticket) {
            guildTickets.push(ticket);
          }
        }
      }
      
      // Calculate statistics
      const totalTickets = guildTickets.length;
      const openTickets = guildTickets.filter(t => t.status === tickets.TicketStatus.OPEN).length;
      const closedTickets = guildTickets.filter(t => t.status === tickets.TicketStatus.CLOSED).length;
      
      // Calculate per-category stats
      const categoryStats = {};
      
      for (const category of settings.categories) {
        const categoryTickets = guildTickets.filter(t => t.categoryId === category.id);
        
        categoryStats[category.id] = {
          name: category.name,
          total: categoryTickets.length,
          open: categoryTickets.filter(t => t.status === tickets.TicketStatus.OPEN).length,
          closed: categoryTickets.filter(t => t.status === tickets.TicketStatus.CLOSED).length
        };
      }
      
      // Calculate active staff stats
      const staffStats = {};
      
      for (const ticket of guildTickets.filter(t => t.claimedBy)) {
        const staffId = ticket.claimedBy;
        
        if (!staffStats[staffId]) {
          staffStats[staffId] = {
            claimed: 0,
            open: 0,
            closed: 0
          };
        }
        
        staffStats[staffId].claimed++;
        
        if (ticket.status === tickets.TicketStatus.OPEN) {
          staffStats[staffId].open++;
        } else {
          staffStats[staffId].closed++;
        }
      }
      
      // Sort staff by claimed tickets
      const sortedStaff = Object.entries(staffStats)
        .sort((a, b) => b[1].claimed - a[1].claimed)
        .slice(0, 5); // Top 5 staff
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('Ticket System Statistics')
        .addFields(
          { name: 'Total Tickets', value: totalTickets.toString(), inline: true },
          { name: 'Open Tickets', value: openTickets.toString(), inline: true },
          { name: 'Closed Tickets', value: closedTickets.toString(), inline: true }
        )
        .setFooter({ text: 'AstroBot Ticket System' })
        .setTimestamp();
      
      // Add category stats
      const categoryFields = Object.values(categoryStats)
        .map(stat => {
          return {
            name: stat.name,
            value: `Total: ${stat.total} | Open: ${stat.open} | Closed: ${stat.closed}`,
            inline: true
          };
        });
      
      if (categoryFields.length > 0) {
        embed.addFields({ name: 'Category Statistics', value: '\u200B' });
        embed.addFields(...categoryFields);
      }
      
      // Add staff stats
      if (sortedStaff.length > 0) {
        const staffFields = sortedStaff.map(([staffId, stat]) => {
          let staffMember;
          
          try {
            staffMember = client.users.cache.get(staffId);
          } catch (error) {
            staffMember = { tag: 'Unknown User' };
          }
          
          return {
            name: staffMember?.tag || `Unknown (${staffId})`,
            value: `Claimed: ${stat.claimed} | Open: ${stat.open} | Closed: ${stat.closed}`,
            inline: true
          };
        });
        
        embed.addFields({ name: 'Most Active Staff', value: '\u200B' });
        embed.addFields(...staffFields);
      }
      
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      logger.error('Error executing ticket-stats command:', error);
      
      await interaction.reply({
        content: `Error getting ticket statistics: ${error.message}`,
        ephemeral: true
      });
    }
  }
};