import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fetchWithAuth } from '@/lib/api';

/**
 * GET handler for /api/bot/config
 * Returns guild configuration for the current guild
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

    // Get guild config from bot API
    const response = await fetchWithAuth(`/bot/config?guildId=${guildId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to fetch guild configuration' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling guild config API request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH handler for /api/bot/config
 * Updates guild configuration
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
    const { guildId, updates } = body;

    if (!guildId || !updates) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Update guild config via bot API
    const response = await fetchWithAuth('/bot/config', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, updates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to update guild configuration' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling guild config update request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for /api/bot/config/prefix
 * Updates command prefix
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get request body and URL path
    const body = await request.json();
    const { guildId, prefix } = body;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type');

    if (!guildId) {
      return NextResponse.json({ error: 'Missing guildId parameter' }, { status: 400 });
    }

    // Process different config types
    if (type === 'prefix' && prefix) {
      // Update prefix via bot API
      const response = await fetchWithAuth('/bot/config/prefix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guildId, prefix }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ error: errorData.error || 'Failed to update command prefix' }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } else if (type === 'role') {
      // Handle role updates
      const { role, roleType, action } = body;
      
      if (!role || !roleType || !action) {
        return NextResponse.json({ error: 'Missing role parameters' }, { status: 400 });
      }
      
      // Update role via bot API
      const response = await fetchWithAuth('/bot/config/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guildId, role, roleType, action }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ error: errorData.error || 'Failed to update role configuration' }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } else if (type === 'channel') {
      // Handle channel updates
      const { channel, channelType } = body;
      
      if (!channel || !channelType) {
        return NextResponse.json({ error: 'Missing channel parameters' }, { status: 400 });
      }
      
      // Update channel via bot API
      const response = await fetchWithAuth('/bot/config/channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guildId, channel, channelType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ error: errorData.error || 'Failed to update channel configuration' }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    } else if (type === 'timezone') {
      // Handle timezone updates
      const { timezone } = body;
      
      if (!timezone) {
        return NextResponse.json({ error: 'Missing timezone parameter' }, { status: 400 });
      }
      
      // Update timezone via bot API
      const response = await fetchWithAuth('/bot/config/timezone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ guildId, timezone }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ error: errorData.error || 'Failed to update timezone' }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid config type' }, { status: 400 });
  } catch (error) {
    console.error('Error handling specific config update request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}