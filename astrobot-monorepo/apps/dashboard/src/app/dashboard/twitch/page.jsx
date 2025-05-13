"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFetchData } from '@/hooks/use-fetch-data';
import { DashboardShell } from '@/components/dashboard/dashboard-shell';

export default function TwitchPage() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGuild, setSelectedGuild] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [guilds, setGuilds] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedStreamers, setSelectedStreamers] = useState([]);
  
  // Fetch guilds
  const { data: guildsData, isLoading: isLoadingGuilds } = useFetchData('/api/discord/guilds');
  
  useEffect(() => {
    if (guildsData) {
      setGuilds(guildsData);
    }
  }, [guildsData]);
  
  // Fetch channels when guild changes
  useEffect(() => {
    if (selectedGuild) {
      fetch(`/api/discord/channels?guildId=${selectedGuild}`)
        .then(res => res.json())
        .then(data => {
          setChannels(data.filter(channel => channel.type === 0)); // Only text channels
        })
        .catch(error => {
          console.error('Error fetching channels:', error);
        });
    } else {
      setChannels([]);
    }
  }, [selectedGuild]);
  
  // Handle search
  const handleSearch = async () => {
    if (!searchQuery) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/twitch?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      setSearchResults(data.data || []);
    } catch (error) {
      console.error('Error searching Twitch channels:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Handle adding streamer
  const handleAddStreamer = async (streamer) => {
    if (!selectedGuild || !selectedChannel) {
      alert('Please select a guild and channel first');
      return;
    }
    
    try {
      const response = await fetch('/api/twitch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          guildId: selectedGuild,
          channelId: selectedChannel,
          streamerName: streamer.broadcaster_login
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSelectedStreamers(prev => {
          if (prev.some(s => s.id === streamer.id)) {
            return prev;
          }
          return [...prev, streamer];
        });
        
        setNotificationMessage(`Added ${streamer.display_name} to notifications`);
      } else {
        setNotificationMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error adding streamer:', error);
      setNotificationMessage(`Error adding streamer: ${error.message}`);
    }
  };
  
  return (
    <DashboardShell>
      <div className="flex-1 space-y-4 p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Twitch Integration</h2>
        </div>
        
        <Tabs defaultValue="streamers" className="space-y-4">
          <TabsList>
            <TabsTrigger value="streamers">Twitch Streamers</TabsTrigger>
            <TabsTrigger value="settings">Integration Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="streamers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Add Twitch Streamers</CardTitle>
                <CardDescription>
                  Add Twitch streamers to receive notifications in your Discord server when they go live.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guild">Discord Server</Label>
                      <Select value={selectedGuild} onValueChange={setSelectedGuild}>
                        <SelectTrigger id="guild">
                          <SelectValue placeholder="Select a server" />
                        </SelectTrigger>
                        <SelectContent>
                          {guilds.map(guild => (
                            <SelectItem key={guild.id} value={guild.id}>
                              {guild.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="channel">Notification Channel</Label>
                      <Select value={selectedChannel} onValueChange={setSelectedChannel} disabled={!selectedGuild}>
                        <SelectTrigger id="channel">
                          <SelectValue placeholder={selectedGuild ? "Select a channel" : "Select a server first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {channels.map(channel => (
                            <SelectItem key={channel.id} value={channel.id}>
                              #{channel.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Twitch Channels</Label>
                    <div className="flex gap-2">
                      <Input
                        id="search"
                        placeholder="Enter channel name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button onClick={handleSearch} disabled={isSearching}>
                        {isSearching ? "Searching..." : "Search"}
                      </Button>
                    </div>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>Search Results</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {searchResults.map(streamer => (
                          <Card key={streamer.id} className="overflow-hidden">
                            <div className="flex items-center p-4">
                              <img
                                src={streamer.thumbnail_url}
                                alt={streamer.display_name}
                                className="w-12 h-12 rounded-full mr-4"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold">{streamer.display_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {streamer.is_live ? "Live now" : "Offline"}
                                </p>
                              </div>
                              <Button 
                                size="sm" 
                                onClick={() => handleAddStreamer(streamer)}
                                disabled={!selectedGuild || !selectedChannel}
                              >
                                Add
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {notificationMessage && (
                    <div className="p-2 bg-muted rounded text-sm">
                      {notificationMessage}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {selectedStreamers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Streamers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedStreamers.map(streamer => (
                      <div key={streamer.id} className="flex items-center p-2 border rounded">
                        <img
                          src={streamer.thumbnail_url}
                          alt={streamer.display_name}
                          className="w-10 h-10 rounded-full mr-4"
                        />
                        <div>
                          <h4 className="font-medium">{streamer.display_name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {`https://twitch.tv/${streamer.broadcaster_login}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Customize how Twitch notifications appear in your Discord server.
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notification-message">Custom Notification Message</Label>
                  <Input
                    id="notification-message"
                    placeholder="{streamer} is now live on Twitch! They're playing {game}: {title}"
                  />
                  <p className="text-sm text-muted-foreground">
                    Use {'{streamer}'}, {'{game}'}, and {'{title}'} as placeholders.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="check-interval">Check Interval</Label>
                  <Select defaultValue="5">
                    <SelectTrigger id="check-interval">
                      <SelectValue placeholder="Select interval" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">Every 2 minutes</SelectItem>
                      <SelectItem value="5">Every 5 minutes</SelectItem>
                      <SelectItem value="10">Every 10 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button>Save Settings</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}