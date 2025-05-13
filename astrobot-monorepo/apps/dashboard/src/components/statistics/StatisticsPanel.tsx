import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGuild } from '@/hooks/use-guild';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BarChart2, LineChart, PieChart, Clock, Activity, Users, MessageSquare, Download, Calendar, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Import required chart libraries
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend,
  TimeScale
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement,
  Title, 
  Tooltip, 
  Legend
);

interface StatsData {
  commandUsage: {
    totalCommands: number;
    commandsByCategory: Record<string, number>;
    topCommands: Array<{ name: string; count: number }>;
    commandsOverTime: Array<{ date: string; count: number }>;
  };
  userActivity: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    usersByRole: Record<string, number>;
    userActivityOverTime: Array<{ date: string; count: number }>;
  };
  messageStats: {
    totalMessages: number;
    messagesPerChannel: Array<{ channel: string; count: number }>;
    messagesOverTime: Array<{ date: string; count: number }>;
    averageMessageLength: number;
  };
  systemStats: {
    uptime: number;
    serverCount: number;
    memoryUsage: number;
    cpuUsage: number;
    responseTime: number;
    apiCalls: number;
  };
}

export function StatisticsPanel() {
  const { selectedGuild } = useGuild();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  
  // Fetch stats data when guild or time range changes
  useEffect(() => {
    if (!selectedGuild) return;
    
    fetchStatsData();
  }, [selectedGuild, timeRange]);
  
  // Fetch statistics data from API
  const fetchStatsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/bot/statistics?guildId=${selectedGuild?.id}&timeRange=${timeRange}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch statistics data');
      }
      
      const data = await response.json();
      setStatsData(data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError('Failed to load statistics. Please try again later.');
      
      // Create dummy data (for development only)
      const dummyData: StatsData = {
        commandUsage: {
          totalCommands: 1256,
          commandsByCategory: {
            moderation: 345,
            fun: 562,
            utility: 249,
            music: 100
          },
          topCommands: [
            { name: 'play', count: 208 },
            { name: 'help', count: 189 },
            { name: 'ban', count: 87 },
            { name: 'meme', count: 76 },
            { name: 'weather', count: 65 }
          ],
          commandsOverTime: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 100) + 50
          }))
        },
        userActivity: {
          totalUsers: 723,
          activeUsers: 268,
          newUsers: 42,
          usersByRole: {
            admin: 5,
            moderator: 12,
            member: 689,
            bot: 17
          },
          userActivityOverTime: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 150) + 100
          }))
        },
        messageStats: {
          totalMessages: 8753,
          messagesPerChannel: [
            { channel: 'general', count: 3452 },
            { channel: 'bot-commands', count: 2145 },
            { channel: 'music', count: 1284 },
            { channel: 'off-topic', count: 978 },
            { channel: 'welcome', count: 894 }
          ],
          messagesOverTime: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(Date.now() - (6 - i) * 86400000).toISOString().split('T')[0],
            count: Math.floor(Math.random() * 500) + 300
          })),
          averageMessageLength: 42
        },
        systemStats: {
          uptime: 1209600, // 14 days in seconds
          serverCount: 87,
          memoryUsage: 256,
          cpuUsage: 12,
          responseTime: 234,
          apiCalls: 45678
        }
      };
      
      setStatsData(dummyData);
      toast({
        title: 'Using demo data',
        description: 'Could not connect to statistics API. Showing demo data instead.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Format uptime from seconds to readable string
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  };
  
  // Format number for display
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };
  
  // Render command usage statistics
  const renderCommandUsage = () => {
    if (!statsData) return null;
    
    const { commandUsage } = statsData;
    
    // Prepare data for the commands over time chart
    const timeData = {
      labels: commandUsage.commandsOverTime.map(item => item.date),
      datasets: [
        {
          label: 'Commands Used',
          data: commandUsage.commandsOverTime.map(item => item.count),
          fill: false,
          backgroundColor: 'rgb(59, 130, 246)',
          borderColor: 'rgba(59, 130, 246, 0.8)',
          tension: 0.1
        }
      ]
    };
    
    // Prepare data for the commands by category chart
    const categoryData = {
      labels: Object.keys(commandUsage.commandsByCategory),
      datasets: [
        {
          label: 'Commands by Category',
          data: Object.values(commandUsage.commandsByCategory),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
    
    // Chart options
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false
        }
      }
    };
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Commands</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{formatNumber(commandUsage.totalCommands)}</div>
                <MessageSquare className="h-6 w-6 ml-2 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Top Command</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">!{commandUsage.topCommands[0]?.name || 'help'}</div>
                <Badge className="ml-2">
                  {formatNumber(commandUsage.topCommands[0]?.count || 0)} uses
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{Object.keys(commandUsage.commandsByCategory).length}</div>
                <PieChart className="h-6 w-6 ml-2 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Command Usage Over Time</CardTitle>
              <CardDescription>
                Total commands used per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Line data={timeData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Commands by Category</CardTitle>
              <CardDescription>
                Distribution of commands across categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Doughnut data={categoryData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Commands</CardTitle>
            <CardDescription>
              Most frequently used commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Command</TableHead>
                  <TableHead>Usage Count</TableHead>
                  <TableHead>Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commandUsage.topCommands.map((cmd) => (
                  <TableRow key={cmd.name}>
                    <TableCell className="font-medium">!{cmd.name}</TableCell>
                    <TableCell>{formatNumber(cmd.count)}</TableCell>
                    <TableCell>
                      {((cmd.count / commandUsage.totalCommands) * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Render user activity statistics
  const renderUserActivity = () => {
    if (!statsData) return null;
    
    const { userActivity } = statsData;
    
    // Prepare data for the user activity chart
    const activityData = {
      labels: userActivity.userActivityOverTime.map(item => item.date),
      datasets: [
        {
          label: 'Active Users',
          data: userActivity.userActivityOverTime.map(item => item.count),
          fill: false,
          backgroundColor: 'rgb(34, 197, 94)',
          borderColor: 'rgba(34, 197, 94, 0.8)',
          tension: 0.1
        }
      ]
    };
    
    // Prepare data for users by role chart
    const roleData = {
      labels: Object.keys(userActivity.usersByRole),
      datasets: [
        {
          label: 'Users by Role',
          data: Object.values(userActivity.usersByRole),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }
      ]
    };
    
    // Chart options
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false
        }
      }
    };
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{formatNumber(userActivity.totalUsers)}</div>
                <Users className="h-6 w-6 ml-2 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Active Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{formatNumber(userActivity.activeUsers)}</div>
                <Activity className="h-6 w-6 ml-2 text-primary" />
                <Badge className="ml-2">
                  {((userActivity.activeUsers / userActivity.totalUsers) * 100).toFixed(1)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">New Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{formatNumber(userActivity.newUsers)}</div>
                <Users className="h-6 w-6 ml-2 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">User Activity Over Time</CardTitle>
              <CardDescription>
                Active users per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Line data={activityData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Users by Role</CardTitle>
              <CardDescription>
                Distribution of users across roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Pie data={roleData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  // Render message statistics
  const renderMessageStats = () => {
    if (!statsData) return null;
    
    const { messageStats } = statsData;
    
    // Prepare data for the messages over time chart
    const messageData = {
      labels: messageStats.messagesOverTime.map(item => item.date),
      datasets: [
        {
          label: 'Messages',
          data: messageStats.messagesOverTime.map(item => item.count),
          fill: false,
          backgroundColor: 'rgb(168, 85, 247)',
          borderColor: 'rgba(168, 85, 247, 0.8)',
          tension: 0.1
        }
      ]
    };
    
    // Prepare data for messages per channel chart
    const channelData = {
      labels: messageStats.messagesPerChannel.map(item => item.channel),
      datasets: [
        {
          label: 'Messages per Channel',
          data: messageStats.messagesPerChannel.map(item => item.count),
          backgroundColor: 'rgba(168, 85, 247, 0.6)',
          borderColor: 'rgba(168, 85, 247, 1)',
          borderWidth: 1
        }
      ]
    };
    
    // Chart options
    const chartOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: false
        }
      }
    };
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{formatNumber(messageStats.totalMessages)}</div>
                <MessageSquare className="h-6 w-6 ml-2 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Top Channel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">#{messageStats.messagesPerChannel[0]?.channel}</div>
                <Badge className="ml-2">
                  {formatNumber(messageStats.messagesPerChannel[0]?.count || 0)}
                </Badge>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Avg Message Length</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{messageStats.averageMessageLength}</div>
                <span className="ml-2 text-muted-foreground">characters</span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messages Over Time</CardTitle>
              <CardDescription>
                Total messages per day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Line data={messageData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Messages by Channel</CardTitle>
              <CardDescription>
                Distribution of messages across channels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <Bar data={channelData} options={chartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  // Render system statistics
  const renderSystemStats = () => {
    if (!statsData) return null;
    
    const { systemStats } = statsData;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{formatUptime(systemStats.uptime)}</div>
                <Clock className="h-6 w-6 ml-2 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Servers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{formatNumber(systemStats.serverCount)}</div>
                <Server className="h-6 w-6 ml-2 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">API Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{formatNumber(systemStats.apiCalls)}</div>
                <Activity className="h-6 w-6 ml-2 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Memory Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{systemStats.memoryUsage} MB</div>
                <div className="ml-2 w-full max-w-24 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${Math.min(systemStats.memoryUsage / 10, 100)}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">CPU Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{systemStats.cpuUsage}%</div>
                <div className="ml-2 w-full max-w-24 bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-primary h-2.5 rounded-full" 
                    style={{ width: `${systemStats.cpuUsage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="text-3xl font-bold">{systemStats.responseTime} ms</div>
                <Activity className="h-6 w-6 ml-2 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };
  
  // Render loading state
  const renderLoading = () => {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  };
  
  // Render error state
  const renderError = () => {
    return (
      <div className="flex flex-col items-center py-12">
        <AlertCircle className="h-12 w-12 text-destructive mb-4" />
        <h3 className="text-lg font-medium mb-2">Failed to load statistics</h3>
        <p className="text-center text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchStatsData}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center">
              <BarChart2 className="mr-2 h-5 w-5" />
              Statistics Dashboard
            </CardTitle>
            <CardDescription>
              View usage statistics and insights for your Discord bot
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchStatsData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          renderLoading()
        ) : error ? (
          renderError()
        ) : (
          <Tabs defaultValue="commands" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="commands">Command Usage</TabsTrigger>
              <TabsTrigger value="users">User Activity</TabsTrigger>
              <TabsTrigger value="messages">Message Stats</TabsTrigger>
              <TabsTrigger value="system">System Stats</TabsTrigger>
            </TabsList>
            
            <TabsContent value="commands" className="mt-4">
              <ScrollArea className="max-h-[600px] pr-3">
                {renderCommandUsage()}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="users" className="mt-4">
              <ScrollArea className="max-h-[600px] pr-3">
                {renderUserActivity()}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="messages" className="mt-4">
              <ScrollArea className="max-h-[600px] pr-3">
                {renderMessageStats()}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="system" className="mt-4">
              <ScrollArea className="max-h-[600px] pr-3">
                {renderSystemStats()}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

// Server component to prevent undefined error
function Server(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6" y1="6" y2="6" />
      <line x1="6" x2="6" y1="18" y2="18" />
    </svg>
  );
}