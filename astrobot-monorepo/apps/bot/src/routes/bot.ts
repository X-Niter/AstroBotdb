import { Hono } from 'hono';
import { prisma } from '@astrobot/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

// Get bot stats
app.get('/stats', async (c) => {
  try {
    // Get total servers
    const serverCount = await prisma.server.count({
      where: { isActive: true }
    });
    
    // Get total users
    const userCount = await prisma.user.count();
    
    // Get premium users
    const premiumCount = await prisma.user.count({
      where: { isPremium: true }
    });
    
    // Get Minecraft servers count
    const minecraftCount = await prisma.minecraftServer.count();
    
    // Get command usage from analytics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const commandUsage = await prisma.analytics.aggregate({
      where: {
        eventType: 'COMMAND',
        timestamp: { gte: thirtyDaysAgo }
      },
      _sum: { count: true }
    });
    
    // Get AI usage from analytics (last 30 days)
    const aiUsage = await prisma.analytics.aggregate({
      where: {
        eventType: 'AI',
        timestamp: { gte: thirtyDaysAgo }
      },
      _sum: { count: true }
    });
    
    return c.json({
      stats: {
        servers: serverCount,
        users: userCount,
        premiumUsers: premiumCount,
        minecraftServers: minecraftCount,
        commandsUsed: commandUsage._sum.count || 0,
        aiPrompts: aiUsage._sum.count || 0,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Error fetching bot stats:', error);
    return c.json({ error: 'Failed to fetch bot stats' }, 500);
  }
});

// Get bot commands
app.get('/commands', async (c) => {
  try {
    // In production, this would fetch commands from Discord API or your commands registry
    // This is a simplified example
    const commands = [
      {
        name: 'help',
        description: 'Shows help information',
        category: 'general',
      },
      {
        name: 'ping',
        description: 'Checks bot latency',
        category: 'general',
      },
      {
        name: 'stats',
        description: 'Shows bot statistics',
        category: 'general',
      },
      {
        name: 'server',
        description: 'Shows server information',
        category: 'general',
      },
      {
        name: 'minecraft',
        description: 'Manage Minecraft servers',
        category: 'minecraft',
        subcommands: [
          { name: 'status', description: 'Check server status' },
          { name: 'whitelist', description: 'Manage whitelist' },
          { name: 'players', description: 'List online players' },
        ]
      },
      {
        name: 'ai',
        description: 'Generate AI responses',
        category: 'ai',
        subcommands: [
          { name: 'ask', description: 'Ask the AI a question' },
          { name: 'image', description: 'Generate an image' },
        ]
      },
      {
        name: 'mod',
        description: 'Moderation commands',
        category: 'moderation',
        subcommands: [
          { name: 'ban', description: 'Ban a user' },
          { name: 'kick', description: 'Kick a user' },
          { name: 'mute', description: 'Mute a user' },
          { name: 'warn', description: 'Warn a user' },
        ]
      },
    ];
    
    return c.json({ commands });
  } catch (error) {
    console.error('Error fetching bot commands:', error);
    return c.json({ error: 'Failed to fetch bot commands' }, 500);
  }
});

// Get bot shards info (for large bots)
app.get('/shards', async (c) => {
  // This would normally fetch info from your Discord bot client
  // This is a simplified placeholder example
  const user = c.get('user');
  
  if (!user || !user.isAdmin) {
    return c.json({ error: 'Not authorized' }, 403);
  }
  
  try {
    return c.json({
      shards: [
        {
          id: 0,
          status: 'online',
          ping: 42,
          servers: 100,
          uptime: 86400,
        },
      ],
      info: {
        totalShards: 1,
        shardingMethod: 'auto',
      }
    });
  } catch (error) {
    console.error('Error fetching bot shards info:', error);
    return c.json({ error: 'Failed to fetch bot shards info' }, 500);
  }
});

export default app;