import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fetchWithAuth } from '@/lib/api';

/**
 * GET handler for /api/bot/twitch
 * Returns list of tracked Twitch streamers for the current guild
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get guild ID from query parameters
    const searchParams = request.nextUrl.searchParams;
    const guildId = searchParams.get('guildId');

    if (!guildId) {
      return NextResponse.json({ error: 'Missing guildId parameter' }, { status: 400 });
    }

    // Get tracked streamers from bot API
    const response = await fetchWithAuth(`/bot/twitch?guildId=${guildId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to fetch Twitch data' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling Twitch API request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for /api/bot/twitch/track
 * Tracks a new Twitch streamer
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { guildId, username, channelId, disableUpdates } = body;

    if (!guildId || !username || !channelId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Track streamer via bot API
    const response = await fetchWithAuth('/bot/twitch/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        guildId, 
        username, 
        channelId,
        disableUpdates: disableUpdates || false
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to track streamer' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling Twitch track request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE handler for /api/bot/twitch/untrack
 * Untracks a Twitch streamer
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { guildId, username } = body;

    if (!guildId || !username) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Untrack streamer via bot API
    const response = await fetchWithAuth('/bot/twitch/untrack', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, username }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to untrack streamer' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling Twitch untrack request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH handler for /api/bot/twitch/channel
 * Updates notification channel for Twitch
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { guildId, channelId } = body;

    if (!guildId || !channelId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Update channel via bot API
    const response = await fetchWithAuth('/bot/twitch/channel', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, channelId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to update channel' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling Twitch channel update request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT handler for /api/bot/twitch/settings
 * Updates Twitch settings (update notifications)
 */
export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { guildId, disableUpdates } = body;

    if (!guildId || disableUpdates === undefined) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Update settings via bot API
    const response = await fetchWithAuth('/bot/twitch/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, disableUpdates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to update settings' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling Twitch settings update request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * HEAD handler for /api/bot/twitch/status
 * Checks if Twitch API is configured
 */
export async function HEAD(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Twitch API status
    const response = await fetchWithAuth('/bot/twitch/status', {
      method: 'HEAD',
    });

    if (!response.ok) {
      return NextResponse.json({ configured: false }, { status: 200 });
    }

    return NextResponse.json({ configured: true }, { status: 200 });
  } catch (error) {
    console.error('Error checking Twitch API status:', error);
    return NextResponse.json({ configured: false }, { status: 200 });
  }
}