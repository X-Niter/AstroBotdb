import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/discord';
import { logger } from '../../utils/logger';
import { mctools } from 'mctools';

export default {
  data: new SlashCommandBuilder()
    .setName('mcserver')
    .setDescription('Get information about a Minecraft server')
    .addStringOption(option => 
      option.setName('address')
        .setDescription('The Minecraft server address (e.g., mc.example.com)')
        .setRequired(true))
    .addIntegerOption(option => 
      option.setName('port')
        .setDescription('The server port (default: 25565)')
        .setRequired(false)),
  
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    
    const address = interaction.options.getString('address', true);
    const port = interaction.options.getInteger('port') || 25565;
    
    try {
      // Create server status checker
      const StatusChecker = new mctools.StatusChecker();
      
      // Get server status
      const status = await StatusChecker.getStatus(address, port);
      logger.debug('Minecraft server status:', status);
      
      // Check if status was successfully retrieved
      if (!status || !status.online) {
        return interaction.editReply({
          content: `The Minecraft server at **${address}:${port}** appears to be offline or could not be reached.`
        });
      }
      
      // Create embed with server info
      const embed = new EmbedBuilder()
        .setColor(0x44AA44) // Minecraft green color
        .setTitle(`${address}:${port} - Server Status`)
        .setDescription(status.motd?.clean || 'No server description')
        .addFields(
          { name: '🟢 Status', value: status.online ? 'Online' : 'Offline', inline: true },
          { name: '👥 Players', value: `${status.players?.online || 0}/${status.players?.max || 0}`, inline: true },
          { name: '🎮 Version', value: status.version?.name_clean || 'Unknown', inline: true }
        )
        .setFooter({ text: `Server latency: ${status.ping || '?'}ms` })
        .setTimestamp();
      
      // Add player list if available
      if (status.players?.online > 0 && status.players?.sample && status.players.sample.length > 0) {
        const playerList = status.players.sample
          .slice(0, 15) // Limit to first 15 players to avoid too long embed
          .map(player => player.name)
          .join(', ');
        
        embed.addFields({
          name: `👤 Online Players ${status.players.sample.length > 15 ? '(first 15)' : ''}`,
          value: playerList,
          inline: false
        });
      }
      
      // Add server icon if available
      if (status.favicon) {
        embed.setThumbnail(`attachment://server-icon.png`);
        
        // Convert base64 favicon to buffer for attachment
        const iconData = status.favicon.split(',')[1];
        const iconBuffer = Buffer.from(iconData, 'base64');
        
        return interaction.editReply({
          embeds: [embed],
          files: [{
            attachment: iconBuffer,
            name: 'server-icon.png'
          }]
        });
      }
      
      return interaction.editReply({ embeds: [embed] });
      
    } catch (error) {
      logger.error('Error checking Minecraft server status:', error);
      return interaction.editReply({
        content: `There was an error checking the status of **${address}:${port}**. Make sure the address is correct and the server is publicly accessible.`
      });
    }
  },
} as Command;