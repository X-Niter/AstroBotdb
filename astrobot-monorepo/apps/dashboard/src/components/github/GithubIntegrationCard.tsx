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
import { Loader2, Trash2, Github } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGuild } from '@/hooks/use-guild';

interface GithubTrackedRepo {
  name: string;
  url: string;
}

interface GithubConfig {
  channels: string[];
  repositories: string[];
}

export function GithubIntegrationCard() {
  const { toast } = useToast();
  const { selectedGuild, guildChannels } = useGuild();
  const [loading, setLoading] = useState(true);
  const [trackedRepos, setTrackedRepos] = useState<GithubTrackedRepo[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [newRepo, setNewRepo] = useState('');
  const [addingRepo, setAddingRepo] = useState(false);
  
  // Load github data
  useEffect(() => {
    if (selectedGuild) {
      loadGithubData();
    }
  }, [selectedGuild]);
  
  const loadGithubData = async () => {
    if (!selectedGuild) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/bot/github?guildId=${selectedGuild.id}`);
      if (!response.ok) {
        throw new Error('Failed to load GitHub data');
      }
      
      const data: GithubConfig = await response.json();
      
      // Format repository data
      const repos = data.repositories.map(repo => ({
        name: repo,
        url: `https://github.com/${repo}`
      }));
      
      setTrackedRepos(repos);
      
      // Set selected channel if any
      if (data.channels && data.channels.length > 0) {
        setSelectedChannel(data.channels[0]);
      }
    } catch (error) {
      console.error('Error loading GitHub data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load GitHub integration data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleTrackRepo = async () => {
    if (!selectedGuild || !newRepo || !selectedChannel) {
      toast({
        title: 'Error',
        description: 'Please select a channel and enter a repository name',
        variant: 'destructive'
      });
      return;
    }
    
    // Validate repo format
    if (!newRepo.includes('/')) {
      toast({
        title: 'Invalid Format',
        description: 'Repository must be in format owner/repo',
        variant: 'destructive'
      });
      return;
    }
    
    setAddingRepo(true);
    try {
      const response = await fetch('/api/bot/github/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          repository: newRepo,
          channelId: selectedChannel
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to track repository');
      }
      
      setNewRepo('');
      loadGithubData();
      toast({
        title: 'Success',
        description: `Now tracking ${newRepo}`
      });
    } catch (error) {
      console.error('Error tracking repository:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to track repository',
        variant: 'destructive'
      });
    } finally {
      setAddingRepo(false);
    }
  };
  
  const handleUntrackRepo = async (repo: string) => {
    if (!selectedGuild) return;
    
    try {
      const response = await fetch('/api/bot/github/untrack', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          repository: repo
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to untrack repository');
      }
      
      // Remove from local state
      setTrackedRepos(trackedRepos.filter(r => r.name !== repo));
      
      toast({
        title: 'Success',
        description: `Stopped tracking ${repo}`
      });
    } catch (error) {
      console.error('Error untracking repository:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to untrack repository',
        variant: 'destructive'
      });
    }
  };
  
  const handleChannelChange = async (channelId: string) => {
    if (!selectedGuild) return;
    
    setSelectedChannel(channelId);
    
    try {
      const response = await fetch('/api/bot/github/channel', {
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
        description: 'GitHub notification channel updated'
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
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Github className="mr-2 h-5 w-5" />
          GitHub Integration
        </CardTitle>
        <CardDescription>
          Track GitHub repositories and get notifications when events occur
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
                <h3 className="text-sm font-medium mb-2">Add Repository</h3>
                <div className="flex space-x-2">
                  <Input
                    placeholder="owner/repository"
                    value={newRepo}
                    onChange={(e) => setNewRepo(e.target.value)}
                  />
                  <Button 
                    onClick={handleTrackRepo} 
                    disabled={addingRepo || !selectedChannel}
                  >
                    {addingRepo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Track
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Format: username/repository
                </p>
              </div>
              
              {trackedRepos.length > 0 ? (
                <div>
                  <h3 className="text-sm font-medium mb-2">Tracked Repositories</h3>
                  <div className="space-y-2">
                    {trackedRepos.map(repo => (
                      <div key={repo.name} className="flex items-center justify-between bg-muted p-2 rounded-md">
                        <a 
                          href={repo.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm hover:underline flex items-center"
                        >
                          <Github className="mr-2 h-4 w-4" />
                          {repo.name}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUntrackRepo(repo.name)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-muted p-4 rounded-md text-center">
                  <p className="text-sm text-muted-foreground">No repositories tracked yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          <Badge variant="outline" className="mr-1">
            PRs
          </Badge>
          <Badge variant="outline" className="mr-1">
            Issues
          </Badge>
          <Badge variant="outline" className="mr-1">
            Commits
          </Badge>
          <Badge variant="outline">
            Releases
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}