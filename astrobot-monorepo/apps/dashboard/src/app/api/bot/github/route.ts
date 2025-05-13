import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fetchWithAuth } from '@/lib/api';

/**
 * GET handler for /api/bot/github
 * Returns list of tracked GitHub repositories for the current guild
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

    // Get tracked repositories from bot API
    const response = await fetchWithAuth(`/bot/github?guildId=${guildId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to fetch GitHub data' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GitHub API request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for /api/bot/github/track
 * Tracks a new GitHub repository
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
    const { guildId, repository, channelId } = body;

    if (!guildId || !repository || !channelId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Track repository via bot API
    const response = await fetchWithAuth('/bot/github/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, repository, channelId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to track repository' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GitHub track request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE handler for /api/bot/github/untrack
 * Untracks a GitHub repository
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
    const { guildId, repository } = body;

    if (!guildId || !repository) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Untrack repository via bot API
    const response = await fetchWithAuth('/bot/github/untrack', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, repository }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to untrack repository' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling GitHub untrack request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH handler for /api/bot/github/channel
 * Updates notification channel for GitHub
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
    const response = await fetchWithAuth('/bot/github/channel', {
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
    console.error('Error handling GitHub channel update request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}