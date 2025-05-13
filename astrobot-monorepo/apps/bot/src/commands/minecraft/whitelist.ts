import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/discord';
import { logger } from '../../utils/logger';
import { prisma } from '../../index';

export default {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Manage the Minecraft server whitelist')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a player to the whitelist')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('Minecraft username to add')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('server')
            .setDescription('Minecraft server ID (if managing multiple servers)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a player from the whitelist')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('Minecraft username to remove')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('server')
            .setDescription('Minecraft server ID (if managing multiple servers)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all whitelisted players')
        .addStringOption(option =>
          option.setName('server')
            .setDescription('Minecraft server ID (if managing multiple servers)')
            .setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();
    const serverId = interaction.options.getString('server') || 'default';
    
    // Check if this guild has Minecraft integration configured
    const serverConfig = await prisma.minecraftServer.findFirst({
      where: {
        guildId: interaction.guildId || '',
        identifier: serverId
      }
    }).catch(() => null);
    
    if (!serverConfig) {
      return interaction.reply({
        content: `No Minecraft server configuration found${serverId !== 'default' ? ` for server ID: ${serverId}` : ''}. Please set up the Minecraft integration in the bot dashboard.`,
        ephemeral: true
      });
    }
    
    // Defer reply as this might take some time
    await interaction.deferReply();
    
    try {
      switch (subcommand) {
        case 'add':
          await handleWhitelistAdd(interaction, serverConfig, serverId);
          break;
        case 'remove':
          await handleWhitelistRemove(interaction, serverConfig, serverId);
          break;
        case 'list':
          await handleWhitelistList(interaction, serverConfig, serverId);
          break;
      }
    } catch (error) {
      logger.error(`Error in whitelist command (${subcommand}):`, error);
      
      await interaction.editReply({
        content: `An error occurred while managing the whitelist: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }
  },
} as Command;

async function handleWhitelistAdd(
  interaction: ChatInputCommandInteraction, 
  serverConfig: any, 
  serverId: string
) {
  const username = interaction.options.getString('username', true);
  
  try {
    // Add player to database whitelist
    const whitelistEntry = await prisma.minecraftWhitelist.create({
      data: {
        minecraftUsername: username,
        serverId: serverId,
        addedById: interaction.user.id,
        guildId: interaction.guildId || ''
      }
    });
    
    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x44AA44)
      .setTitle('Player Whitelisted')
      .setDescription(`Successfully added **${username}** to the whitelist.`)
      .addFields(
        { name: '👤 Player', value: username, inline: true },
        { name: '🖥️ Server', value: serverConfig.displayName || serverId, inline: true },
        { name: '👮 Added By', value: `<@${interaction.user.id}>`, inline: true }
      )
      .setFooter({ text: 'Player has been added to the database. Server sync will happen soon.' })
      .setTimestamp();
    
    await interaction.editReply({ embeds: [embed] });
    
    // Try to send direct command to the Minecraft server if possible
    if (serverConfig.rconEnabled && serverConfig.rconPort) {
      // This part would integrate with RCON if available
      // This is a placeholder for future RCON implementation
      logger.info(`Would execute RCON command: /whitelist add ${username}`);
    }
    
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      await interaction.editReply({
        content: `The player **${username}** is already on the whitelist.`
      });
    } else {
      throw error;
    }
  }
}

async function handleWhitelistRemove(
  interaction: ChatInputCommandInteraction, 
  serverConfig: any, 
  serverId: string
) {
  const username = interaction.options.getString('username', true);
  
  // Check if player is in whitelist
  const whitelistEntry = await prisma.minecraftWhitelist.findFirst({
    where: {
      minecraftUsername: username,
      serverId: serverId,
      guildId: interaction.guildId || ''
    }
  });
  
  if (!whitelistEntry) {
    return interaction.editReply({
      content: `The player **${username}** is not on the whitelist.`
    });
  }
  
  // Remove player from database whitelist
  await prisma.minecraftWhitelist.delete({
    where: {
      id: whitelistEntry.id
    }
  });
  
  // Create embed
  const embed = new EmbedBuilder()
    .setColor(0xAA4444)
    .setTitle('Player Removed from Whitelist')
    .setDescription(`Successfully removed **${username}** from the whitelist.`)
    .addFields(
      { name: '👤 Player', value: username, inline: true },
      { name: '🖥️ Server', value: serverConfig.displayName || serverId, inline: true },
      { name: '👮 Removed By', value: `<@${interaction.user.id}>`, inline: true }
    )
    .setFooter({ text: 'Player has been removed from the database. Server sync will happen soon.' })
    .setTimestamp();
  
  await interaction.editReply({ embeds: [embed] });
  
  // Try to send direct command to the Minecraft server if possible
  if (serverConfig.rconEnabled && serverConfig.rconPort) {
    // This part would integrate with RCON if available
    // This is a placeholder for future RCON implementation
    logger.info(`Would execute RCON command: /whitelist remove ${username}`);
  }
}

async function handleWhitelistList(
  interaction: ChatInputCommandInteraction, 
  serverConfig: any, 
  serverId: string
) {
  // Get whitelist from database
  const whitelistEntries = await prisma.minecraftWhitelist.findMany({
    where: {
      serverId: serverId,
      guildId: interaction.guildId || ''
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
  
  if (whitelistEntries.length === 0) {
    return interaction.editReply({
      content: `The whitelist for ${serverConfig.displayName || serverId} is currently empty.`
    });
  }
  
  // Format the whitelist in blocks of 20 to not exceed embed limits
  const chunks = [];
  for (let i = 0; i < whitelistEntries.length; i += 20) {
    const chunk = whitelistEntries.slice(i, i + 20);
    const playerList = chunk.map((entry, index) => 
      `${i + index + 1}. **${entry.minecraftUsername}**`
    ).join('\n');
    chunks.push(playerList);
  }
  
  // Create embed for the first page
  const embed = new EmbedBuilder()
    .setColor(0x3366FF)
    .setTitle(`Whitelist for ${serverConfig.displayName || serverId}`)
    .setDescription(chunks[0])
    .setFooter({ text: `Total players: ${whitelistEntries.length}` })
    .setTimestamp();
  
  // If there are multiple pages, add a field indicating that
  if (chunks.length > 1) {
    embed.addFields({
      name: '📄 Pages',
      value: `Showing page 1 of ${chunks.length}`,
      inline: false
    });
  }
  
  await interaction.editReply({ embeds: [embed] });
  
  // For advanced implementations, this could include pagination buttons
}