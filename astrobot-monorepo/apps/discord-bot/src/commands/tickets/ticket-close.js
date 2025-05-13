const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const tickets = require('../../lib/tickets/ticket-manager');
const logger = require('../../lib/logger');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Close a ticket')
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for closing the ticket')
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
      // Get the reason
      const reason = interaction.options.getString('reason') || 'No reason provided';
      
      // Get the ticket
      const ticket = tickets.getTicketByChannelId(interaction.guildId, interaction.channelId);
      
      if (!ticket) {
        return await interaction.reply({
          content: 'This command can only be used in a ticket channel.',
          ephemeral: true
        });
      }
      
      // Check if ticket is already closed
      if (ticket.status === tickets.TicketStatus.CLOSED) {
        return await interaction.reply({
          content: 'This ticket is already closed.',
          ephemeral: true
        });
      }
      
      // Check if user has permission to close the ticket
      const isCreator = ticket.userId === interaction.user.id;
      const isStaff = await tickets.checkStaffPermission(interaction.member, ticket.categoryId);
      
      if (!isCreator && !isStaff) {
        return await interaction.reply({
          content: 'You do not have permission to close this ticket.',
          ephemeral: true
        });
      }
      
      // Create embed
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Ticket Closed')
        .setDescription(`This ticket has been closed by ${interaction.user}.`)
        .addFields({ name: 'Reason', value: reason })
        .setFooter({ text: 'AstroBot Ticket System' })
        .setTimestamp();
      
      // Close the ticket
      // Simulate clicking the close button
      const closeInteraction = {
        guildId: interaction.guildId,
        channelId: interaction.channelId,
        guild: interaction.guild,
        channel: interaction.channel,
        user: interaction.user,
        member: interaction.member,
        client: interaction.client,
        reply: interaction.reply.bind(interaction),
        deferReply: interaction.deferReply.bind(interaction),
        editReply: interaction.editReply.bind(interaction),
        deferred: false
      };
      
      // Call the ticket close handler directly
      await tickets.handleTicketClose(closeInteraction);
      
      // Send the reason embed
      await interaction.channel.send({ embeds: [embed] });
    } catch (error) {
      logger.error('Error executing ticket-close command:', error);
      
      await interaction.reply({
        content: `Error closing ticket: ${error.message}`,
        ephemeral: true
      });
    }
  }
};