const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  type: 'SLASH_COMMAND',
  
  // Command definition
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Display information about the current server'),
  
  // Command cooldown in seconds
  cooldown: 10,
  
  /**
   * Execute the command
   * @param {Client} client - The Discord client
   * @param {CommandInteraction} interaction - The interaction that triggered the command
   */
  async execute(client, interaction) {
    const { guild } = interaction;
    
    // Fetch additional guild information
    await guild.fetch();
    await guild.members.fetch();
    
    // Get verification level string
    const verificationLevels = {
      0: 'None',
      1: 'Low',
      2: 'Medium',
      3: 'High',
      4: 'Very High'
    };
    
    // Get explicit content filter level string
    const filterLevels = {
      0: 'None',
      1: 'No Role',
      2: 'All Members'
    };
    
    // Count bot members
    const botCount = guild.members.cache.filter(member => member.user.bot).size;
    
    // Count online members
    const onlineMembers = guild.members.cache.filter(member => 
      member.presence?.status === 'online' || 
      member.presence?.status === 'idle' || 
      member.presence?.status === 'dnd'
    ).size;
    
    // Get guild features in a formatted way
    const features = guild.features.map(feature => 
      feature.toLowerCase()
        .replace(/_/g, ' ')
        .replace(/(^|\s)[a-z]/g, char => char.toUpperCase())
    );
    
    // Create the embed
    const embed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: 'Owner', value: `<@${guild.ownerId}>`, inline: true },
        { 
          name: 'Created On', 
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, 
          inline: true 
        },
        { name: 'Server ID', value: guild.id, inline: true },
        {
          name: 'Members',
          value: `
            👥 Total: ${guild.memberCount}
            🧑 Humans: ${guild.memberCount - botCount}
            🤖 Bots: ${botCount}
            🟢 Online: ${onlineMembers}
          `,
          inline: true
        },
        {
          name: 'Channels',
          value: `
            💬 Text: ${guild.channels.cache.filter(c => c.type === 0).size}
            🔊 Voice: ${guild.channels.cache.filter(c => c.type === 2).size}
            📢 Announcement: ${guild.channels.cache.filter(c => c.type === 5).size}
            🧵 Forum: ${guild.channels.cache.filter(c => c.type === 15).size}
          `,
          inline: true
        },
        {
          name: 'Other',
          value: `
            👮 Roles: ${guild.roles.cache.size}
            😀 Emojis: ${guild.emojis.cache.size}
            🔐 Verification: ${verificationLevels[guild.verificationLevel]}
            🛡️ Content Filter: ${filterLevels[guild.explicitContentFilter]}
          `,
          inline: true
        }
      );
    
    // Add server banner if available
    if (guild.banner) {
      embed.setImage(guild.bannerURL({ dynamic: true, size: 4096 }));
    }
    
    // Add server description if available
    if (guild.description) {
      embed.setDescription(guild.description);
    }
    
    // Add server features if available
    if (features.length > 0) {
      embed.addFields({
        name: 'Features',
        value: features.join(', ')
      });
    }
    
    // Add server boost status
    embed.addFields({
      name: 'Server Boost Status',
      value: `
        📈 Level: ${guild.premiumTier}
        🚀 Boosts: ${guild.premiumSubscriptionCount || 0}
      `
    });
    
    // Send the embed
    await interaction.reply({ embeds: [embed] });
  }
};