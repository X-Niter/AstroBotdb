import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { DiscordBotApi } from '@/lib/api/discord-bot';

/**
 * GET /api/bot/guilds
 * Get all guilds that the bot is in
 */
export async function GET(req: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin (only admins can see guilds)
    if (!session.user.isAdmin) {
      return NextResponse.json(
        { error: 'Admin permission required' },
        { status: 403 }
      );
    }
    
    // Get token from session
    const token = session.accessToken;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No access token available' },
        { status: 401 }
      );
    }
    
    // Check if API is healthy
    const isHealthy = await DiscordBotApi.checkApiHealth();
    
    if (!isHealthy) {
      return NextResponse.json(
        { error: 'Bot API is not available' },
        { status: 503 }
      );
    }
    
    // Get guilds from bot API
    const guilds = await DiscordBotApi.getGuilds(token);
    
    // Return guilds data
    return NextResponse.json(guilds);
  } catch (error: any) {
    console.error('Error fetching guilds:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch guilds' },
      { status: 500 }
    );
  }
}