import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { fetchFromBotApi } from '@/lib/api';

// API endpoint to fetch bot statistics (global and guild-specific)
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the guild ID from query parameters
    const searchParams = req.nextUrl.searchParams;
    const guildId = searchParams.get('guildId');
    
    if (!guildId) {
      return NextResponse.json(
        { error: 'Missing guild ID' },
        { status: 400 }
      );
    }

    // Fetch statistics from the bot API
    const response = await fetchFromBotApi(`/statistics?guildId=${guildId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process statistics for the client
    const statistics = {
      global: {
        commands: data.global.commands,
        messages: data.global.messages,
        uptime: data.global.uptime,
        topCommands: processTopCommands(data.global.mostUsedCommands)
      }
    };
    
    // Add guild-specific stats if available
    if (data.guild) {
      statistics.guild = {
        commands: data.guild.commands,
        messages: data.guild.messages,
        joinedAt: data.guild.joinedAt,
        topCommands: processTopCommands(data.guild.mostUsedCommands)
      };
    }
    
    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

// Helper function to process top commands data
function processTopCommands(commandsData: Record<string, number> = {}) {
  // Convert to array and sort by usage count
  const commands = Object.entries(commandsData)
    .map(([command, count]) => ({ command, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Calculate total command usage
  const totalUsage = commands.reduce((sum, cmd) => sum + cmd.count, 0);
  
  // Add percentage for each command
  return commands.map(cmd => ({
    ...cmd,
    percentage: totalUsage > 0 
      ? Math.round((cmd.count / totalUsage) * 100) 
      : 0
  }));
}