import { Hono } from 'hono';
import { prisma } from '@astrobot/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

// Get server by ID
app.get('/:serverId', async (c) => {
  const serverId = c.req.param('serverId');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    // Check if user has access to this server
    const hasAccess = await prisma.server.count({
      where: {
        id: serverId,
        OR: [
          { ownerId: user.id },
          { members: { some: { id: user.id } } }
        ]
      }
    });
    
    if (hasAccess === 0) {
      return c.json({ error: 'Not authorized to access this server' }, 403);
    }
    
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        botSettings: true,
        minecraftServer: true,
      }
    });
    
    if (!server) {
      return c.json({ error: 'Server not found' }, 404);
    }
    
    return c.json({ server });
  } catch (error) {
    console.error(`Error fetching server ${serverId}:`, error);
    return c.json({ error: 'Failed to fetch server' }, 500);
  }
});

// Update server settings
const updateServerSettingsSchema = z.object({
  prefix: z.string().min(1).max(10).optional(),
  welcomeEnabled: z.boolean().optional(),
  welcomeChannelId: z.string().optional().nullable(),
  welcomeMessage: z.string().optional().nullable(),
  modLogEnabled: z.boolean().optional(),
  modLogChannelId: z.string().optional().nullable(),
  autoRoleEnabled: z.boolean().optional(),
  autoRoleId: z.string().optional().nullable(),
  aiEnabled: z.boolean().optional(),
  customTheme: z.string().optional().nullable(),
  minecraftEnabled: z.boolean().optional(),
  minecraftChannelId: z.string().optional().nullable(),
});

app.patch(
  '/:serverId/settings',
  zValidator('json', updateServerSettingsSchema),
  async (c) => {
    const serverId = c.req.param('serverId');
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Check if user has permission (admin or owner)
    const isAuthorized = await prisma.server.count({
      where: {
        id: serverId,
        ownerId: user.id
      }
    });
    
    if (isAuthorized === 0 && !user.isAdmin) {
      return c.json({ error: 'Not authorized to update server settings' }, 403);
    }
    
    const data = c.req.valid('json');
    
    try {
      // First check if settings exist
      const existingSettings = await prisma.botSettings.findUnique({
        where: { serverId }
      });
      
      let updatedSettings;
      
      if (existingSettings) {
        updatedSettings = await prisma.botSettings.update({
          where: { serverId },
          data
        });
      } else {
        updatedSettings = await prisma.botSettings.create({
          data: {
            ...data,
            serverId,
            userId: user.id
          }
        });
      }
      
      return c.json({ settings: updatedSettings });
    } catch (error) {
      console.error(`Error updating settings for server ${serverId}:`, error);
      return c.json({ error: 'Failed to update server settings' }, 500);
    }
  }
);

// Get server members
app.get('/:serverId/members', async (c) => {
  const serverId = c.req.param('serverId');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    // Check if user has access to this server
    const hasAccess = await prisma.server.count({
      where: {
        id: serverId,
        OR: [
          { ownerId: user.id },
          { members: { some: { id: user.id } } }
        ]
      }
    });
    
    if (hasAccess === 0) {
      return c.json({ error: 'Not authorized to access this server' }, 403);
    }
    
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      include: {
        members: {
          select: {
            id: true,
            username: true,
            avatar: true,
            isAdmin: true,
            isPremium: true,
          }
        }
      }
    });
    
    if (!server) {
      return c.json({ error: 'Server not found' }, 404);
    }
    
    return c.json({ members: server.members });
  } catch (error) {
    console.error(`Error fetching members for server ${serverId}:`, error);
    return c.json({ error: 'Failed to fetch server members' }, 500);
  }
});

// Get server MC servers
app.get('/:serverId/minecraft', async (c) => {
  const serverId = c.req.param('serverId');
  const user = c.get('user');
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    // Check if user has access to this server
    const hasAccess = await prisma.server.count({
      where: {
        id: serverId,
        OR: [
          { ownerId: user.id },
          { members: { some: { id: user.id } } }
        ]
      }
    });
    
    if (hasAccess === 0) {
      return c.json({ error: 'Not authorized to access this server' }, 403);
    }
    
    const mcServers = await prisma.minecraftServer.findMany({
      where: { serverId },
      include: {
        status: true,
        whitelist: true,
      }
    });
    
    return c.json({ minecraftServers: mcServers });
  } catch (error) {
    console.error(`Error fetching MC servers for server ${serverId}:`, error);
    return c.json({ error: 'Failed to fetch Minecraft servers' }, 500);
  }
});

export default app;