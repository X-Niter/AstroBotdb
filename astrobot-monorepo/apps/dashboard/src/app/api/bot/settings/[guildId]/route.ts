import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { DiscordBotApi } from '@/lib/api/discord-bot';

/**
 * GET /api/bot/settings/[guildId]
 * Get settings for a guild
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
    
    // Get module from query params
    const searchParams = req.nextUrl.searchParams;
    const module = searchParams.get('module');
    
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
    
    // Get settings from bot API
    if (module) {
      // Get settings for specific module
      const settings = await DiscordBotApi.getModuleSettings(guildId, module, token);
      return NextResponse.json(settings);
    } else {
      // Get all settings
      const settings = await DiscordBotApi.getSettings(guildId, token);
      return NextResponse.json(settings);
    }
  } catch (error: any) {
    console.error(`Error fetching settings for guild ${params.guildId}:`, error);
    
    // Handle not found error specifically
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Guild not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bot/settings/[guildId]
 * Update settings for a guild
 */
export async function POST(
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
    
    // Get request body
    const body = await req.json();
    
    if (!body.module || !body.data) {
      return NextResponse.json(
        { error: 'Module and data are required' },
        { status: 400 }
      );
    }
    
    // Update settings
    const result = await DiscordBotApi.updateSettings(
      guildId, 
      body.module, 
      body.data, 
      token
    );
    
    // Return updated settings
    return NextResponse.json(result);
  } catch (error: any) {
    console.error(`Error updating settings for guild ${params.guildId}:`, error);
    
    // Handle not found error specifically
    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Guild not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}