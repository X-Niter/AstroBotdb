import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import axios from 'axios';

// Cache for Twitch API token
let tokenCache = {
  accessToken: null,
  expiresAt: null
};

/**
 * Get an OAuth token for the Twitch API
 * @returns {Promise<string>} The access token
 */
async function getAccessToken() {
  try {
    // Check if token is still valid
    if (tokenCache.accessToken && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
      return tokenCache.accessToken;
    }

    // If token is missing or expired, fetch a new one
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Missing Twitch API credentials in environment variables');
    }

    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
    );

    const { access_token, expires_in } = response.data;
    
    // Cache the token
    tokenCache = {
      accessToken: access_token,
      expiresAt: Date.now() + (expires_in * 900) // 90% of the expiry time to be safe
    };

    return access_token;
  } catch (error) {
    console.error('Error getting Twitch access token:', error);
    throw new Error('Failed to authenticate with Twitch API');
  }
}

/**
 * Search for Twitch channels
 */
export async function GET(request) {
  try {
    // Check auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }
    
    // Get access token
    const accessToken = await getAccessToken();
    
    // Make request to Twitch API
    const response = await axios.get(
      `https://api.twitch.tv/helix/search/channels?query=${encodeURIComponent(query)}&first=10`,
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error searching Twitch channels:', error);
    return NextResponse.json(
      { error: 'Failed to search Twitch channels' },
      { status: 500 }
    );
  }
}

/**
 * Add a streamer to Discord server notifications
 */
export async function POST(request) {
  try {
    // Check auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get request body
    const body = await request.json();
    const { guildId, channelId, streamerName } = body;
    
    if (!guildId || !channelId || !streamerName) {
      return NextResponse.json(
        { error: 'guildId, channelId, and streamerName are required' },
        { status: 400 }
      );
    }
    
    // TODO: Forward to Discord bot via webhook or shared database
    // For now, we'll just return a success message
    
    return NextResponse.json({
      success: true,
      message: `Added ${streamerName} to notifications for guild ${guildId} in channel ${channelId}`
    });
  } catch (error) {
    console.error('Error adding Twitch streamer:', error);
    return NextResponse.json(
      { error: 'Failed to add Twitch streamer' },
      { status: 500 }
    );
  }
}