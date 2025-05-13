import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fetchWithAuth } from '@/lib/api';

/**
 * GET handler for /api/bot/schedule
 * Returns list of scheduled events for the current guild
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
    const eventId = searchParams.get('eventId');

    if (!guildId) {
      return NextResponse.json({ error: 'Missing guildId parameter' }, { status: 400 });
    }

    // Get specific event if eventId is provided
    if (eventId) {
      const response = await fetchWithAuth(`/bot/schedule/${eventId}?guildId=${guildId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json({ error: errorData.error || 'Failed to fetch event' }, { status: response.status });
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Get all events
    const response = await fetchWithAuth(`/bot/schedule?guildId=${guildId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to fetch scheduled events' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling schedule API request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for /api/bot/schedule
 * Creates a new scheduled event
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
    const { 
      guildId, 
      name, 
      type, 
      channelId, 
      schedule, 
      content, 
      messageType,
      embedOptions,
      allowMentions,
      timezone,
      enabled
    } = body;

    if (!guildId || !name || !type || !channelId || !schedule || !content) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Create event via bot API
    const response = await fetchWithAuth('/bot/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        guildId, 
        name, 
        type, 
        channelId, 
        schedule, 
        content, 
        messageType: messageType || 'text',
        embedOptions: embedOptions || null,
        allowMentions: allowMentions !== false,
        timezone: timezone || 'UTC',
        enabled: enabled !== false,
        createdBy: session.user.id
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to create scheduled event' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling schedule create request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE handler for /api/bot/schedule
 * Deletes a scheduled event
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
    const { guildId, eventId } = body;

    if (!guildId || !eventId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Delete event via bot API
    const response = await fetchWithAuth(`/bot/schedule/${eventId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to delete event' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling schedule delete request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH handler for /api/bot/schedule
 * Updates a scheduled event
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
    const { guildId, eventId, updates } = body;

    if (!guildId || !eventId || !updates) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Update event via bot API
    const response = await fetchWithAuth(`/bot/schedule/${eventId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, updates }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to update event' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling schedule update request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}