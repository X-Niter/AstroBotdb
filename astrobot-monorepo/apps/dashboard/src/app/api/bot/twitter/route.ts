import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fetchWithAuth } from '@/lib/api';

/**
 * GET handler for /api/bot/twitter
 * Returns list of tracked Twitter accounts for the current guild
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

    // Get tracked accounts from bot API
    const response = await fetchWithAuth(`/bot/twitter?guildId=${guildId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to fetch Twitter data' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling Twitter API request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for /api/bot/twitter/track
 * Tracks a new Twitter account
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
    const { guildId, username, channelId } = body;

    if (!guildId || !username || !channelId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Track account via bot API
    const response = await fetchWithAuth('/bot/twitter/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, username, channelId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to track account' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling Twitter track request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE handler for /api/bot/twitter/untrack
 * Untracks a Twitter account
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

    // Untrack account via bot API
    const response = await fetchWithAuth('/bot/twitter/untrack', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, username }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to untrack account' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling Twitter untrack request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH handler for /api/bot/twitter/channel
 * Updates notification channel for Twitter
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
    const response = await fetchWithAuth('/bot/twitter/channel', {
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
    console.error('Error handling Twitter channel update request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET handler for /api/bot/twitter/status
 * Checks if Twitter API is configured
 */
export async function HEAD(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check Twitter API status
    const response = await fetchWithAuth('/bot/twitter/status', {
      method: 'HEAD',
    });

    if (!response.ok) {
      return NextResponse.json({ configured: false }, { status: 200 });
    }

    return NextResponse.json({ configured: true }, { status: 200 });
  } catch (error) {
    console.error('Error checking Twitter API status:', error);
    return NextResponse.json({ configured: false }, { status: 200 });
  }
}