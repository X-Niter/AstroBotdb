import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGuild } from '@/hooks/use-guild';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface TwitterAccount {
  username: string;
  url: string;
}

interface TwitterConfig {
  channels: string[];
  accounts: string[];
}

export function TwitterIntegrationCard() {
  const { toast } = useToast();
  const { selectedGuild, guildChannels } = useGuild();
  const [loading, setLoading] = useState(true);
  const [trackedAccounts, setTrackedAccounts] = useState<TwitterAccount[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [newAccount, setNewAccount] = useState('');
  const [addingAccount, setAddingAccount] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(true);
  
  // Load twitter data
  useEffect(() => {
    if (selectedGuild) {
      checkTwitterApiStatus();
      loadTwitterData();
    }
  }, [selectedGuild]);
  
  const checkTwitterApiStatus = async () => {
    try {
      const response = await fetch('/api/bot/twitter', {
        method: 'HEAD',
      });
      setApiConfigured(response.ok);
    } catch (error) {
      console.error('Error checking Twitter API status:', error);
      setApiConfigured(false);
    }
  };
  
  const loadTwitterData = async () => {
    if (!selectedGuild) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/bot/twitter?guildId=${selectedGuild.id}`);
      if (!response.ok) {
        throw new Error('Failed to load Twitter data');
      }
      
      const data: TwitterConfig = await response.json();
      
      // Format account data
      const accounts = data.accounts.map(username => ({
        username,
        url: `https://twitter.com/${username}`
      }));
      
      setTrackedAccounts(accounts);
      
      // Set selected channel if any
      if (data.channels && data.channels.length > 0) {
        setSelectedChannel(data.channels[0]);
      }
    } catch (error) {
      console.error('Error loading Twitter data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Twitter integration data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleTrackAccount = async () => {
    if (!selectedGuild || !newAccount || !selectedChannel) {
      toast({
        title: 'Error',
        description: 'Please select a channel and enter a Twitter username',
        variant: 'destructive'
      });
      return;
    }
    
    // Remove @ if present
    const username = newAccount.startsWith('@') ? newAccount.substring(1) : newAccount;
    
    setAddingAccount(true);
    try {
      const response = await fetch('/api/bot/twitter/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          username,
          channelId: selectedChannel
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to track Twitter account');
      }
      
      setNewAccount('');
      loadTwitterData();
      toast({
        title: 'Success',
        description: `Now tracking @${username}`
      });
    } catch (error) {
      console.error('Error tracking Twitter account:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to track Twitter account',
        variant: 'destructive'
      });
    } finally {
      setAddingAccount(false);
    }
  };
  
  const handleUntrackAccount = async (username: string) => {
    if (!selectedGuild) return;
    
    try {
      const response = await fetch('/api/bot/twitter/untrack', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          username
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to untrack Twitter account');
      }
      
      // Remove from local state
      setTrackedAccounts(trackedAccounts.filter(a => a.username !== username));
      
      toast({
        title: 'Success',
        description: `Stopped tracking @${username}`
      });
    } catch (error) {
      console.error('Error untracking Twitter account:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to untrack Twitter account',
        variant: 'destructive'
      });
    }
  };
  
  const handleChannelChange = async (channelId: string) => {
    if (!selectedGuild) return;
    
    setSelectedChannel(channelId);
    
    try {
      const response = await fetch('/api/bot/twitter/channel', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          channelId
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update notification channel');
      }
      
      toast({
        title: 'Success',
        description: 'Twitter notification channel updated'
      });
    } catch (error) {
      console.error('Error updating notification channel:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update notification channel',
        variant: 'destructive'
      });
    }
  };
  
  // Filter text channels only
  const textChannels = guildChannels?.filter(channel => 
    channel.type === 0 || channel.type === 5
  ) || [];
  
  if (!apiConfigured) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Twitter Integration</CardTitle>
          <CardDescription>
            Track Twitter accounts and get notifications for new tweets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription>
              Twitter API is not configured. Please contact the bot administrator to set up Twitter integration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <svg className="h-5 w-5 mr-2 inline-block" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 248 204" fill="currentColor">
            <path d="M221.95 51.29c.15 2.17.15 4.34.15 6.53 0 66.73-50.8 143.69-143.69 143.69v-.04c-27.44.04-54.31-7.82-77.41-22.64 3.99.48 8 .72 12.02.73 22.74.02 44.83-7.61 62.72-21.66-21.61-.41-40.56-14.5-47.18-35.07 7.57 1.46 15.37 1.16 22.8-.87-23.56-4.76-40.51-25.46-40.51-49.5v-.64c7.02 3.91 14.88 6.08 22.92 6.32C11.58 63.31 4.74 33.79 18.14 10.71c25.64 31.55 63.47 50.73 104.08 52.76-4.07-17.54 1.49-35.92 14.61-48.25 20.34-19.12 52.33-18.14 71.45 2.19 11.31-2.23 22.15-6.38 32.07-12.26-3.77 11.69-11.66 21.62-22.2 27.93 10.01-1.18 19.79-3.86 29-7.95-6.78 10.16-15.32 19.01-25.2 26.16z"/>
          </svg>
          Twitter Integration
        </CardTitle>
        <CardDescription>
          Track Twitter accounts and get notifications for new tweets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Notification Channel</h3>
                <Select value={selectedChannel} onValueChange={handleChannelChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select channel" />
                  </SelectTrigger>
                  <SelectContent>
                    {textChannels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        # {channel.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Add Twitter Account</h3>
                <div className="flex space-x-2">
                  <Input
                    placeholder="username"
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                  />
                  <Button 
                    onClick={handleTrackAccount} 
                    disabled={addingAccount || !selectedChannel}
                  >
                    {addingAccount && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Track
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter username with or without @
                </p>
              </div>
              
              {trackedAccounts.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tracked Accounts</h3>
                  <div className="space-y-2">
                    {trackedAccounts.map(account => (
                      <div key={account.username} className="flex items-center justify-between bg-muted p-2 rounded-md">
                        <a 
                          href={account.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm hover:underline flex items-center"
                        >
                          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 248 204" fill="currentColor">
                            <path d="M221.95 51.29c.15 2.17.15 4.34.15 6.53 0 66.73-50.8 143.69-143.69 143.69v-.04c-27.44.04-54.31-7.82-77.41-22.64 3.99.48 8 .72 12.02.73 22.74.02 44.83-7.61 62.72-21.66-21.61-.41-40.56-14.5-47.18-35.07 7.57 1.46 15.37 1.16 22.8-.87-23.56-4.76-40.51-25.46-40.51-49.5v-.64c7.02 3.91 14.88 6.08 22.92 6.32C11.58 63.31 4.74 33.79 18.14 10.71c25.64 31.55 63.47 50.73 104.08 52.76-4.07-17.54 1.49-35.92 14.61-48.25 20.34-19.12 52.33-18.14 71.45 2.19 11.31-2.23 22.15-6.38 32.07-12.26-3.77 11.69-11.66 21.62-22.2 27.93 10.01-1.18 19.79-3.86 29-7.95-6.78 10.16-15.32 19.01-25.2 26.16z"/>
                          </svg>
                          @{account.username}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUntrackAccount(account.username)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">No Twitter accounts tracked yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Bot will send notifications for new tweets from tracked accounts
        </div>
      </CardFooter>
    </Card>
  );
}