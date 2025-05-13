import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// This is a placeholder implementation that returns sample data
// In a production environment, this would connect to the Discord bot's API
export async function GET() {
  try {
    // Check auth
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // In a real implementation, this would fetch guilds from the Discord bot API
    // For now, we'll return sample data to make the UI functional
    const guilds = [
      {
        id: 'guild1',
        name: 'AstroBot Test Server',
        icon: 'https://cdn.discordapp.com/icons/123456789/abcdef.png',
        memberCount: 42
      },
      {
        id: 'guild2',
        name: 'Gaming Community',
        icon: 'https://cdn.discordapp.com/icons/987654321/fedcba.png',
        memberCount: 128
      }
    ];
    
    return NextResponse.json(guilds);
  } catch (error) {
    console.error('Error fetching Discord guilds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guilds' },
      { status: 500 }
    );
  }
}