import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types/discord';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Checks the bot latency and API response time'),
    
  async execute(interaction: ChatInputCommandInteraction) {
    // Calculate latency
    const sent = await interaction.reply({ content: 'Calculating ping...', fetchReply: true });
    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    
    // Get WebSocket heartbeat
    const wsHeartbeat = interaction.client.ws.ping;
    
    // Determine emoji based on ping
    const getEmoji = (ms: number) => {
      if (ms < 100) return '🚀'; // Excellent
      if (ms < 200) return '⚡'; // Good
      if (ms < 400) return '⏱️'; // Okay
      return '🐢'; // Slow
    };

    await interaction.editReply({
      content: `**Pong!**
🤖 Bot Latency: ${latency}ms ${getEmoji(latency)}
📡 API Heartbeat: ${wsHeartbeat}ms ${getEmoji(wsHeartbeat)}`
    });
  },
} as Command;