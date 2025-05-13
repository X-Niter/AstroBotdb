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
import { Switch } from '@/components/ui/switch';
import { useGuild } from '@/hooks/use-guild';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';

interface TwitchStreamer {
  username: string;
  url: string;
}

interface TwitchConfig {
  channels: string[];
  streamers: string[];
  disableUpdates: boolean;
}

export function TwitchIntegrationCard() {
  const { toast } = useToast();
  const { selectedGuild, guildChannels } = useGuild();
  const [loading, setLoading] = useState(true);
  const [trackedStreamers, setTrackedStreamers] = useState<TwitchStreamer[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [newStreamer, setNewStreamer] = useState('');
  const [addingStreamer, setAddingStreamer] = useState(false);
  const [apiConfigured, setApiConfigured] = useState(true);
  const [disableUpdates, setDisableUpdates] = useState(false);
  
  // Load twitch data
  useEffect(() => {
    if (selectedGuild) {
      checkTwitchApiStatus();
      loadTwitchData();
    }
  }, [selectedGuild]);
  
  const checkTwitchApiStatus = async () => {
    try {
      const response = await fetch('/api/bot/twitch', {
        method: 'HEAD',
      });
      setApiConfigured(response.ok);
    } catch (error) {
      console.error('Error checking Twitch API status:', error);
      setApiConfigured(false);
    }
  };
  
  const loadTwitchData = async () => {
    if (!selectedGuild) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/bot/twitch?guildId=${selectedGuild.id}`);
      if (!response.ok) {
        throw new Error('Failed to load Twitch data');
      }
      
      const data: TwitchConfig = await response.json();
      
      // Format streamer data
      const streamers = data.streamers.map(username => ({
        username,
        url: `https://twitch.tv/${username}`
      }));
      
      setTrackedStreamers(streamers);
      setDisableUpdates(data.disableUpdates || false);
      
      // Set selected channel if any
      if (data.channels && data.channels.length > 0) {
        setSelectedChannel(data.channels[0]);
      }
    } catch (error) {
      console.error('Error loading Twitch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Twitch integration data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleTrackStreamer = async () => {
    if (!selectedGuild || !newStreamer || !selectedChannel) {
      toast({
        title: 'Error',
        description: 'Please select a channel and enter a Twitch username',
        variant: 'destructive'
      });
      return;
    }
    
    setAddingStreamer(true);
    try {
      const response = await fetch('/api/bot/twitch/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          username: newStreamer.toLowerCase(),
          channelId: selectedChannel,
          disableUpdates
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to track Twitch streamer');
      }
      
      setNewStreamer('');
      loadTwitchData();
      toast({
        title: 'Success',
        description: `Now tracking ${newStreamer}`
      });
    } catch (error) {
      console.error('Error tracking Twitch streamer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to track Twitch streamer',
        variant: 'destructive'
      });
    } finally {
      setAddingStreamer(false);
    }
  };
  
  const handleUntrackStreamer = async (username: string) => {
    if (!selectedGuild) return;
    
    try {
      const response = await fetch('/api/bot/twitch/untrack', {
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
        throw new Error(data.error || 'Failed to untrack Twitch streamer');
      }
      
      // Remove from local state
      setTrackedStreamers(trackedStreamers.filter(s => s.username !== username));
      
      toast({
        title: 'Success',
        description: `Stopped tracking ${username}`
      });
    } catch (error) {
      console.error('Error untracking Twitch streamer:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to untrack Twitch streamer',
        variant: 'destructive'
      });
    }
  };
  
  const handleChannelChange = async (channelId: string) => {
    if (!selectedGuild) return;
    
    setSelectedChannel(channelId);
    
    try {
      const response = await fetch('/api/bot/twitch/channel', {
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
        description: 'Twitch notification channel updated'
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
  
  const handleToggleUpdates = async (checked: boolean) => {
    if (!selectedGuild) return;
    
    setDisableUpdates(checked);
    
    try {
      const response = await fetch('/api/bot/twitch/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          disableUpdates: checked
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update settings');
      }
      
      toast({
        title: 'Success',
        description: `Stream update notifications ${checked ? 'disabled' : 'enabled'}`
      });
    } catch (error) {
      console.error('Error updating Twitch settings:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update settings',
        variant: 'destructive'
      });
      
      // Revert UI state on error
      setDisableUpdates(!checked);
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
          <CardTitle className="flex items-center">
            <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 2800" fill="#9146FF">
              <path d="M500,0L0,500v1800h600v500l500-500h400l900-900V0H500z M2200,1300l-400,400h-400l-350,350v-350H600V200h1600V1300z"/>
              <path d="M1700,550v600h200V550H1700z M1150,550v600h200V550H1150z"/>
            </svg>
            Twitch Integration
          </CardTitle>
          <CardDescription>
            Track Twitch streamers and get notifications when they go live
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Configuration Required</AlertTitle>
            <AlertDescription>
              Twitch API is not configured. Please contact the bot administrator to set up Twitch integration.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 2800" fill="currentColor">
            <path d="M500,0L0,500v1800h600v500l500-500h400l900-900V0H500z M2200,1300l-400,400h-400l-350,350v-350H600V200h1600V1300z"/>
            <path d="M1700,550v600h200V550H1700z M1150,550v600h200V550H1150z"/>
          </svg>
          Twitch Integration
        </CardTitle>
        <CardDescription>
          Track Twitch streamers and get notifications when they go live
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
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="disable-updates" 
                  checked={disableUpdates}
                  onCheckedChange={handleToggleUpdates}
                />
                <Label htmlFor="disable-updates">
                  Disable stream title/game update notifications
                </Label>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Add Twitch Streamer</h3>
                <div className="flex space-x-2">
                  <Input
                    placeholder="streamer username"
                    value={newStreamer}
                    onChange={(e) => setNewStreamer(e.target.value)}
                  />
                  <Button 
                    onClick={handleTrackStreamer} 
                    disabled={addingStreamer || !selectedChannel}
                  >
                    {addingStreamer && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Track
                  </Button>
                </div>
              </div>
              
              {trackedStreamers.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tracked Streamers</h3>
                  <div className="space-y-2">
                    {trackedStreamers.map(streamer => (
                      <div key={streamer.username} className="flex items-center justify-between bg-muted p-2 rounded-md">
                        <a 
                          href={streamer.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm hover:underline flex items-center"
                        >
                          <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2400 2800" fill="#9146FF">
                            <path d="M500,0L0,500v1800h600v500l500-500h400l900-900V0H500z M2200,1300l-400,400h-400l-350,350v-350H600V200h1600V1300z"/>
                            <path d="M1700,550v600h200V550H1700z M1150,550v600h200V550H1150z"/>
                          </svg>
                          {streamer.username}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUntrackStreamer(streamer.username)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">No Twitch streamers tracked yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Bot will send notifications when tracked streamers go live
        </div>
      </CardFooter>
    </Card>
  );
}