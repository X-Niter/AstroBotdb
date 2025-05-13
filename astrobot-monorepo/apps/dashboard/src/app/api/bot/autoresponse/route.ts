import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fetchWithAuth } from '@/lib/api';

/**
 * GET handler for /api/bot/autoresponse
 * Returns list of auto responses for the current guild
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

    // Get auto responses from bot API
    const response = await fetchWithAuth(`/bot/autoresponse?guildId=${guildId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to fetch auto responses' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling auto response API request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST handler for /api/bot/autoresponse
 * Creates a new auto response
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
    const { guildId, trigger, response } = body;

    if (!guildId || !trigger || !response) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Add auto response via bot API
    const apiResponse = await fetchWithAuth('/bot/autoresponse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, trigger, response }),
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json();
      return NextResponse.json({ error: errorData.error || 'Failed to add auto response' }, { status: apiResponse.status });
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling auto response add request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE handler for /api/bot/autoresponse
 * Removes an auto response
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
    const { guildId, trigger } = body;

    if (!guildId || !trigger) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Remove auto response via bot API
    const response = await fetchWithAuth('/bot/autoresponse', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, trigger }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to remove auto response' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling auto response remove request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH handler for /api/bot/autoresponse
 * Updates an existing auto response
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
    const { guildId, oldTrigger, newTrigger, newResponse } = body;

    if (!guildId || !oldTrigger || (!newTrigger && !newResponse)) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Update auto response via bot API
    const response = await fetchWithAuth('/bot/autoresponse', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ guildId, oldTrigger, newTrigger, newResponse }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.error || 'Failed to update auto response' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error handling auto response update request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}