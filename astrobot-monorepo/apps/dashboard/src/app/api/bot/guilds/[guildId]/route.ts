import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { DiscordBotApi } from '@/lib/api/discord-bot';

/**
 * GET /api/bot/guilds/[guildId]
 * Get information about a specific guild
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    // Get guild ID from params
    const { guildId } = params;
    
    if (!guildId) {
      return NextResponse.json(
        { error: 'Guild ID is required' },
        { status: 400 }
      );
    }
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is admin or has access to this guild
    if (!session.user.isAdmin && !session.user.guilds?.includes(guildId)) {
      return NextResponse.json(
        { error: 'You do not have access to this guild' },
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
    
    // Get guild data from bot API
    const guild = await DiscordBotApi.getGuild(guildId, token);
    
    // Return guild data
    return NextResponse.json(guild);
  } catch (error: any) {
    console.error(`Error fetching guild ${params.guildId}:`, error);
    
    // Handle not found error specifically
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Guild not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch guild' },
      { status: 500 }
    );
  }
}