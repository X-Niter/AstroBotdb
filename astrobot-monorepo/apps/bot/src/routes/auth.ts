import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@astrobot/db';

const app = new Hono();

// Discord OAuth callback endpoint
app.get('/discord/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  
  // Normally we would verify state to prevent CSRF
  if (!code) {
    return c.json({ error: 'Invalid OAuth callback' }, 400);
  }
  
  try {
    // Exchange code for tokens with Discord
    // This is a placeholder - you would use the actual Discord API
    // const tokenResponse = await exchangeCodeForToken(code);
    // const userInfo = await getDiscordUserInfo(tokenResponse.access_token);
    
    // For development, simulate a successful auth
    const mockDiscordId = `discord_${Date.now()}`;
    const mockUsername = `User${Date.now() % 1000}`;
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { discordId: mockDiscordId },
    });
    
    // Create user if they don't exist
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: mockUsername,
          discordId: mockDiscordId,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(mockUsername)}`,
        },
      });
    }
    
    // Create a session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
    
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        expiresAt,
      },
    });
    
    // Return session token
    return c.json({
      token: session.id,
      expiresAt: session.expiresAt,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        isAdmin: user.isAdmin,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error('Discord OAuth error:', error);
    return c.json({ error: 'Authentication failed' }, 500);
  }
});

// Login endpoint (for testing)
const loginSchema = z.object({
  username: z.string().min(3).max(32),
  password: z.string().min(6),
});

app.post(
  '/login',
  zValidator('json', loginSchema),
  async (c) => {
    const { username, password } = c.req.valid('json');
    
    try {
      // Note: In production, you would verify credentials
      // This is a simplified mock login for development
      
      // Find user
      const user = await prisma.user.findUnique({
        where: { username },
      });
      
      if (!user) {
        return c.json({ error: 'Invalid credentials' }, 401);
      }
      
      // Create a session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          expiresAt,
        },
      });
      
      // Return session token
      return c.json({
        token: session.id,
        expiresAt: session.expiresAt,
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          isAdmin: user.isAdmin,
          isPremium: user.isPremium,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ error: 'Authentication failed' }, 500);
    }
  }
);

// Register endpoint (for testing)
const registerSchema = z.object({
  username: z.string().min(3).max(32),
  email: z.string().email().optional(),
  password: z.string().min(6),
});

app.post(
  '/register',
  zValidator('json', registerSchema),
  async (c) => {
    const { username, email, password } = c.req.valid('json');
    
    try {
      // Check if username exists
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      
      if (existingUser) {
        return c.json({ error: 'Username already exists' }, 400);
      }
      
      // Check if email exists if provided
      if (email) {
        const existingEmail = await prisma.user.findUnique({
          where: { email },
        });
        
        if (existingEmail) {
          return c.json({ error: 'Email already exists' }, 400);
        }
      }
      
      // Create user
      // Note: In production, you would hash the password
      const user = await prisma.user.create({
        data: {
          username,
          email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}`,
        },
      });
      
      // Create a session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          expiresAt,
        },
      });
      
      // Return session token
      return c.json({
        token: session.id,
        expiresAt: session.expiresAt,
        user: {
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          isAdmin: user.isAdmin,
          isPremium: user.isPremium,
        },
      });
    } catch (error) {
      console.error('Registration error:', error);
      return c.json({ error: 'Registration failed' }, 500);
    }
  }
);

// Logout endpoint
app.post('/logout', async (c) => {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ success: true }); // No-op if not authenticated
  }
  
  const token = auth.split(' ')[1];
  
  try {
    // Delete the session
    await prisma.session.delete({
      where: { id: token },
    });
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return c.json({ error: 'Logout failed' }, 500);
  }
});

export default app;