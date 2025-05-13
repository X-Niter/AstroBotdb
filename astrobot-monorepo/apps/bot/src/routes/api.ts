import { Hono } from 'hono';
import { prisma } from '@astrobot/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

// Public routes that don't require authentication
app.get('/public/status', async (c) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    return c.json({
      status: 'online',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return c.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

// Get server showcase (public Discord servers using the bot)
app.get('/public/showcase', async (c) => {
  try {
    const servers = await prisma.server.findMany({
      where: {
        isPublic: true,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        icon: true,
        memberCount: true,
        botJoinedAt: true,
      },
      orderBy: {
        memberCount: 'desc',
      },
      take: 10,
    });
    
    return c.json({ servers });
  } catch (error) {
    console.error('Error fetching server showcase:', error);
    return c.json({ error: 'Failed to fetch server showcase' }, 500);
  }
});

// Analytics endpoints
app.get('/analytics/commands', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    // Get command usage for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const analytics = await prisma.analytics.findMany({
      where: {
        eventType: 'COMMAND',
        timestamp: { gte: thirtyDaysAgo },
      },
      select: {
        commandName: true,
        count: true,
        day: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
    
    // Process data for chart display
    const commandsByDay: Record<string, Record<string, number>> = {};
    const commandTotals: Record<string, number> = {};
    
    analytics.forEach((entry) => {
      if (!entry.commandName) return;
      
      // Initialize day if needed
      if (!commandsByDay[entry.day]) {
        commandsByDay[entry.day] = {};
      }
      
      // Add command count for this day
      commandsByDay[entry.day][entry.commandName] = 
        (commandsByDay[entry.day][entry.commandName] || 0) + entry.count;
      
      // Update command totals
      commandTotals[entry.commandName] = 
        (commandTotals[entry.commandName] || 0) + entry.count;
    });
    
    // Convert to arrays for charting
    const days = Object.keys(commandsByDay).sort();
    const commands = Object.keys(commandTotals)
      .sort((a, b) => commandTotals[b] - commandTotals[a])
      .slice(0, 10); // Top 10 commands
    
    const datasets = commands.map(command => {
      const data = days.map(day => 
        commandsByDay[day][command] || 0
      );
      
      return {
        label: command,
        data,
      };
    });
    
    return c.json({
      labels: days,
      datasets,
      totals: commandTotals,
    });
  } catch (error) {
    console.error('Error fetching command analytics:', error);
    return c.json({ error: 'Failed to fetch command analytics' }, 500);
  }
});

app.get('/analytics/ai', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    // Get AI usage for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const analytics = await prisma.analytics.findMany({
      where: {
        eventType: 'AI',
        timestamp: { gte: thirtyDaysAgo },
      },
      select: {
        day: true,
        count: true,
        metadata: true,
      },
      orderBy: {
        timestamp: 'asc',
      },
    });
    
    // Process data for chart display
    const usageByDay: Record<string, number> = {};
    let totalTokens = 0;
    let totalPrompts = 0;
    
    analytics.forEach((entry) => {
      // Initialize day if needed
      usageByDay[entry.day] = (usageByDay[entry.day] || 0) + entry.count;
      
      // Update totals
      totalPrompts += entry.count;
      
      // Extract tokens from metadata if available
      const metadata = entry.metadata as Record<string, any> | null;
      if (metadata && metadata.tokens) {
        totalTokens += metadata.tokens as number;
      }
    });
    
    // Convert to arrays for charting
    const days = Object.keys(usageByDay).sort();
    const usage = days.map(day => usageByDay[day]);
    
    return c.json({
      labels: days,
      datasets: [{
        label: 'AI Prompts',
        data: usage,
      }],
      totals: {
        prompts: totalPrompts,
        tokens: totalTokens,
      },
    });
  } catch (error) {
    console.error('Error fetching AI analytics:', error);
    return c.json({ error: 'Failed to fetch AI analytics' }, 500);
  }
});

// Feature flags endpoint (for A/B testing)
app.get('/features', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // In production, this would check a feature flag system
  // This is a simplified example
  return c.json({
    features: {
      advancedAI: user.isPremium,
      customThemes: user.isPremium,
      imageGeneration: user.isPremium,
      multipleMinecraftServers: user.isPremium,
      betaFeatures: user.isAdmin,
    }
  });
});

export default app;