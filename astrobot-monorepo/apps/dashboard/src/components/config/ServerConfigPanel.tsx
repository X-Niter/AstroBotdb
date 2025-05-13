import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Save, Settings, RefreshCw } from 'lucide-react';
import { useGuild } from '@/hooks/use-guild';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import timezones from '@/lib/timezones';
import { AutoResponsesTab } from './tabs/AutoResponsesTab';
import { RolesTab } from './tabs/RolesTab';
import { ChannelsTab } from './tabs/ChannelsTab';
import { CommandsTab } from './tabs/CommandsTab';

interface GuildConfig {
  prefix: string;
  adminRoles: string[];
  modRoles: string[];
  logChannel: string | null;
  timezone: string;
  disabledCommands: string[];
  autoResponses: Record<string, string>;
}

export function ServerConfigPanel() {
  const { toast } = useToast();
  const { selectedGuild, guildRoles, guildChannels } = useGuild();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<GuildConfig | null>(null);
  const [prefix, setPrefix] = useState('!');
  const [timezone, setTimezone] = useState('UTC');
  
  // Load config
  useEffect(() => {
    if (selectedGuild) {
      loadConfig();
    }
  }, [selectedGuild]);
  
  const loadConfig = async () => {
    if (!selectedGuild) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/bot/config?guildId=${selectedGuild.id}`);
      if (!response.ok) {
        throw new Error('Failed to load server configuration');
      }
      
      const data: GuildConfig = await response.json();
      setConfig(data);
      setPrefix(data.prefix);
      setTimezone(data.timezone);
    } catch (error) {
      console.error('Error loading server configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load server configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSavePrefix = async () => {
    if (!selectedGuild) return;
    
    // Validate prefix
    if (!prefix.trim()) {
      toast({
        title: 'Error',
        description: 'Prefix cannot be empty',
        variant: 'destructive'
      });
      return;
    }
    
    if (prefix.length > 5) {
      toast({
        title: 'Error',
        description: 'Prefix cannot be longer than 5 characters',
        variant: 'destructive'
      });
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/bot/config?type=prefix', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          prefix
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update prefix');
      }
      
      if (config) {
        setConfig({
          ...config,
          prefix
        });
      }
      
      toast({
        title: 'Success',
        description: 'Command prefix updated successfully'
      });
    } catch (error) {
      console.error('Error updating prefix:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update prefix',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleSaveTimezone = async () => {
    if (!selectedGuild) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/bot/config?type=timezone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          timezone
        })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update timezone');
      }
      
      if (config) {
        setConfig({
          ...config,
          timezone
        });
      }
      
      toast({
        title: 'Success',
        description: 'Server timezone updated successfully'
      });
    } catch (error) {
      console.error('Error updating timezone:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update timezone',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="mr-2 h-5 w-5" />
          Server Configuration
        </CardTitle>
        <CardDescription>
          Configure server-specific bot settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Command Prefix</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="prefix"
                      placeholder="!"
                      value={prefix}
                      onChange={(e) => setPrefix(e.target.value)}
                      maxLength={5}
                    />
                    <Button onClick={handleSavePrefix} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for custom commands (1-5 characters)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="timezone">Server Timezone</Label>
                  <div className="flex space-x-2">
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="max-h-80">
                        {timezones.map(tz => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={handleSaveTimezone} disabled={saving}>
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for scheduled events and reminders
                  </p>
                </div>
              </div>
              
              <Tabs defaultValue="roles" className="mt-4">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="roles">Roles</TabsTrigger>
                  <TabsTrigger value="channels">Channels</TabsTrigger>
                  <TabsTrigger value="commands">Commands</TabsTrigger>
                  <TabsTrigger value="auto-responses">Auto Responses</TabsTrigger>
                </TabsList>
                
                <TabsContent value="roles">
                  <RolesTab
                    adminRoles={config?.adminRoles || []}
                    modRoles={config?.modRoles || []}
                    guildId={selectedGuild?.id}
                    guildRoles={guildRoles || []}
                    onConfigUpdate={(newConfig) => {
                      if (config) {
                        setConfig({
                          ...config,
                          ...newConfig
                        });
                      }
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="channels">
                  <ChannelsTab
                    logChannel={config?.logChannel || null}
                    guildId={selectedGuild?.id}
                    guildChannels={guildChannels || []}
                    onConfigUpdate={(newConfig) => {
                      if (config) {
                        setConfig({
                          ...config,
                          ...newConfig
                        });
                      }
                    }}
                  />
                </TabsContent>
                
                <TabsContent value="commands">
                  <CommandsTab />
                </TabsContent>
                
                <TabsContent value="auto-responses">
                  <AutoResponsesTab
                    autoResponses={config?.autoResponses || {}}
                    guildId={selectedGuild?.id}
                    onConfigUpdate={(newAutoResponses) => {
                      if (config) {
                        setConfig({
                          ...config,
                          autoResponses: newAutoResponses
                        });
                      }
                    }}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-muted-foreground">
          Changes are saved automatically
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadConfig}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}