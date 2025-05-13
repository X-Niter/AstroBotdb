import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    // Check auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');
    
    if (!guildId) {
      return NextResponse.json({ error: 'guildId parameter is required' }, { status: 400 });
    }
    
    // In a real implementation, this would fetch channels from the Discord bot API
    // For now, we'll return sample data based on the guild ID to make the UI functional
    let channels = [];
    
    if (guildId === 'guild1') {
      channels = [
        { id: 'channel1', name: 'general', type: 0 },
        { id: 'channel2', name: 'announcements', type: 0 },
        { id: 'channel3', name: 'bot-commands', type: 0 },
        { id: 'channel4', name: 'voice-chat', type: 2 }
      ];
    } else if (guildId === 'guild2') {
      channels = [
        { id: 'channel5', name: 'general-chat', type: 0 },
        { id: 'channel6', name: 'stream-announcements', type: 0 },
        { id: 'channel7', name: 'gaming', type: 0 },
        { id: 'channel8', name: 'music', type: 2 }
      ];
    }
    
    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching Discord channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels' },
      { status: 500 }
    );
  }
}