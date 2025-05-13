const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s latency and response time'),
  
  // Command cooldown in seconds
  cooldown: 5,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    // Respond with initial message to measure response time
    const sentMessage = await interaction.reply({ 
      content: 'Pinging...',
      fetchReply: true
    });
    
    // Calculate response time
    const responseTime = sentMessage.createdTimestamp - interaction.createdTimestamp;
    
    // Get WebSocket ping
    const wsLatency = client.ws.ping;
    
    // Update the message with ping information
    await interaction.editReply({
      content: `🏓 Pong!\n⏱️ Response Time: \`${responseTime}ms\`\n📶 WebSocket Latency: \`${wsLatency}ms\``
    });
  }
};