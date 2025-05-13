import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Hash } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Channel {
  id: string;
  name: string;
  type: number;
}

interface ChannelsTabProps {
  logChannel: string | null;
  guildId?: string;
  guildChannels: Channel[];
  onConfigUpdate: (config: { logChannel?: string | null }) => void;
}

export function ChannelsTab({ logChannel, guildId, guildChannels, onConfigUpdate }: ChannelsTabProps) {
  const { toast } = useToast();
  const [selectedLogChannel, setSelectedLogChannel] = useState<string>(logChannel || '');
  const [saving, setSaving] = useState(false);
  
  // Filter text channels only
  const textChannels = guildChannels.filter(channel => 
    channel.type === 0 || channel.type === 5
  );
  
  const handleSetLogChannel = async () => {
    if (!guildId) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/bot/config?type=channel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId,
          channel: selectedLogChannel,
          channelType: 'log'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update log channel');
      }
      
      // Update local state
      onConfigUpdate({ logChannel: selectedLogChannel });
      
      toast({
        title: 'Success',
        description: 'Log channel updated successfully'
      });
    } catch (error) {
      console.error('Error updating log channel:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update log channel',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Helper to get channel object by ID
  const getChannelById = (id: string) => {
    return guildChannels.find(channel => channel.id === id);
  };
  
  return (
    <div className="space-y-6 p-2">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center">
            <Hash className="h-4 w-4 mr-2" />
            Log Channel
          </CardTitle>
          <CardDescription>
            Channel where bot logs and notifications will be sent
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="log-channel">Select Channel</Label>
              <Select 
                value={selectedLogChannel} 
                onValueChange={setSelectedLogChannel}
              >
                <SelectTrigger id="log-channel">
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Disable Logs)</SelectItem>
                  {textChannels.map(channel => (
                    <SelectItem key={channel.id} value={channel.id}>
                      # {channel.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={handleSetLogChannel} 
              disabled={saving || selectedLogChannel === logChannel}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save
            </Button>
          </div>
          
          <div className="mt-4">
            {logChannel ? (
              <Alert>
                <div className="flex items-center">
                  <Hash className="h-4 w-4 mr-2" />
                  <span>Current log channel: </span>
                  <Badge variant="outline" className="ml-2">
                    #{getChannelById(logChannel)?.name || `Unknown (${logChannel})`}
                  </Badge>
                </div>
              </Alert>
            ) : (
              <Alert>
                <AlertDescription>
                  No log channel configured. The bot will not send log messages.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="text-sm text-muted-foreground">
        <h3 className="font-medium mb-2">What gets logged?</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Mod actions (bans, kicks, mutes)</li>
          <li>Message deletions and edits</li>
          <li>Role changes</li>
          <li>Channel changes</li>
          <li>Bot configuration changes</li>
          <li>Error messages</li>
        </ul>
      </div>
    </div>
  );
}