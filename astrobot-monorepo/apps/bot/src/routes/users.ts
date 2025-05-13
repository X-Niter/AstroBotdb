import { Hono } from 'hono';
import { prisma } from '@astrobot/db';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

// Get current user
app.get('/me', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  return c.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      isAdmin: user.isAdmin,
      isPremium: user.isPremium,
      premiumUntil: user.premiumUntil,
      createdAt: user.createdAt,
    }
  });
});

// Get user by ID
app.get('/:userId', async (c) => {
  const userId = c.req.param('userId');
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        isAdmin: true,
        isPremium: true,
        createdAt: true,
      }
    });
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    return c.json({ user });
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// Update current user
const updateUserSchema = z.object({
  username: z.string().min(3).max(32).optional(),
  avatar: z.string().url().optional(),
});

app.patch(
  '/me', 
  zValidator('json', updateUserSchema),
  async (c) => {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    const data = c.req.valid('json');
    
    try {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          avatar: true,
          isAdmin: true,
          isPremium: true,
          premiumUntil: true,
          createdAt: true,
        }
      });
      
      return c.json({ user: updatedUser });
    } catch (error) {
      console.error(`Error updating user ${user.id}:`, error);
      return c.json({ error: 'Failed to update user' }, 500);
    }
  }
);

// Get user servers
app.get('/me/servers', async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const servers = await prisma.server.findMany({
      where: {
        OR: [
          { ownerId: user.id },
          { members: { some: { id: user.id } } }
        ]
      },
      select: {
        id: true,
        name: true,
        icon: true,
        isActive: true,
        memberCount: true,
        ownerId: true,
        botJoinedAt: true,
        botSettings: {
          select: {
            prefix: true,
            aiEnabled: true,
            minecraftEnabled: true,
            customTheme: true,
          }
        }
      }
    });
    
    return c.json({ servers });
  } catch (error) {
    console.error(`Error fetching servers for user ${user.id}:`, error);
    return c.json({ error: 'Failed to fetch servers' }, 500);
  }
});

export default app;