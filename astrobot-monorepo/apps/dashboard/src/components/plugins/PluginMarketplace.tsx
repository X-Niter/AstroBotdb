import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { useGuild } from '@/hooks/use-guild';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertCircle, Download, Search, Package, Settings, ExternalLink, Check, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  authorUrl?: string;
  tags: string[];
  rating: number;
  downloads: number;
  premium: boolean;
  installedGuilds?: string[];
  installed?: boolean;
  enabled?: boolean;
  updateAvailable?: boolean;
  updatedAt: string;
  createdAt: string;
  settings?: PluginSetting[];
}

interface PluginSetting {
  id: string;
  name: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  default: any;
  value?: any;
  options?: { label: string; value: any }[];
  required?: boolean;
}

export function PluginMarketplace() {
  const { selectedGuild } = useGuild();
  const { toast } = useToast();
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [filteredPlugins, setFilteredPlugins] = useState<Plugin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'installed' | 'premium'>('all');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pluginSettings, setPluginSettings] = useState<PluginSetting[]>([]);
  
  // Fetch plugins when guild changes
  useEffect(() => {
    if (!selectedGuild) {
      setLoading(false);
      return;
    }
    
    const fetchPlugins = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch plugins from the API
        const response = await fetch(`/api/bot/plugins?guildId=${selectedGuild.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch plugins');
        }
        
        const data = await response.json();
        setPlugins(data.plugins);
        setFilteredPlugins(data.plugins);
      } catch (err) {
        console.error('Error fetching plugins:', err);
        setError('Failed to load plugins. Please try again later.');
        toast({
          title: 'Error',
          description: 'Could not load plugin marketplace',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchPlugins();
  }, [selectedGuild, toast]);
  
  // Filter plugins based on search and active filter
  useEffect(() => {
    let filtered = plugins;
    
    // Apply search filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(plugin => 
        plugin.name.toLowerCase().includes(lowerQuery) ||
        plugin.description.toLowerCase().includes(lowerQuery) ||
        plugin.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Apply tab filter
    if (activeFilter === 'installed') {
      filtered = filtered.filter(plugin => plugin.installed);
    } else if (activeFilter === 'premium') {
      filtered = filtered.filter(plugin => plugin.premium);
    }
    
    setFilteredPlugins(filtered);
  }, [searchQuery, plugins, activeFilter]);
  
  // Open plugin details
  const openPluginDetails = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setDetailsOpen(true);
  };
  
  // Open plugin settings
  const openPluginSettings = (plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setPluginSettings(plugin.settings || []);
    setSettingsOpen(true);
  };
  
  // Install plugin
  const installPlugin = async (plugin: Plugin) => {
    if (!selectedGuild) return;
    
    try {
      setLoading(true);
      
      // Call API to install plugin
      const response = await fetch('/api/bot/plugins/install', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          pluginId: plugin.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to install plugin');
      }
      
      // Show success message
      toast({
        title: 'Success',
        description: `Plugin "${plugin.name}" installed successfully`
      });
      
      // Update local plugin data
      const updatedPlugins = plugins.map(p => 
        p.id === plugin.id 
          ? { ...p, installed: true, enabled: true, installedGuilds: [...(p.installedGuilds || []), selectedGuild.id] }
          : p
      );
      
      setPlugins(updatedPlugins);
      setDetailsOpen(false);
    } catch (err) {
      console.error('Error installing plugin:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to install plugin',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Uninstall plugin
  const uninstallPlugin = async (plugin: Plugin) => {
    if (!selectedGuild) return;
    
    try {
      setLoading(true);
      
      // Call API to uninstall plugin
      const response = await fetch('/api/bot/plugins/uninstall', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          pluginId: plugin.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to uninstall plugin');
      }
      
      // Show success message
      toast({
        title: 'Success',
        description: `Plugin "${plugin.name}" uninstalled successfully`
      });
      
      // Update local plugin data
      const updatedPlugins = plugins.map(p => 
        p.id === plugin.id 
          ? { 
              ...p, 
              installed: false, 
              enabled: false, 
              installedGuilds: (p.installedGuilds || []).filter(id => id !== selectedGuild.id) 
            }
          : p
      );
      
      setPlugins(updatedPlugins);
      setDetailsOpen(false);
    } catch (err) {
      console.error('Error uninstalling plugin:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to uninstall plugin',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Toggle plugin enabled status
  const togglePlugin = async (plugin: Plugin, enabled: boolean) => {
    if (!selectedGuild) return;
    
    try {
      // Call API to toggle plugin
      const response = await fetch('/api/bot/plugins/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          pluginId: plugin.id,
          enabled
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle plugin');
      }
      
      // Update local plugin data
      const updatedPlugins = plugins.map(p => 
        p.id === plugin.id ? { ...p, enabled } : p
      );
      
      setPlugins(updatedPlugins);
      
      // Show success message
      toast({
        title: 'Success',
        description: `Plugin "${plugin.name}" ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (err) {
      console.error('Error toggling plugin:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : `Failed to ${enabled ? 'enable' : 'disable'} plugin`,
        variant: 'destructive'
      });
    }
  };
  
  // Save plugin settings
  const savePluginSettings = async () => {
    if (!selectedPlugin || !selectedGuild) return;
    
    try {
      setLoading(true);
      
      // Call API to save settings
      const response = await fetch('/api/bot/plugins/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          pluginId: selectedPlugin.id,
          settings: pluginSettings
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
      
      // Update local plugin data
      const updatedPlugins = plugins.map(p => 
        p.id === selectedPlugin.id 
          ? { ...p, settings: pluginSettings }
          : p
      );
      
      setPlugins(updatedPlugins);
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Plugin settings saved successfully'
      });
      
      setSettingsOpen(false);
    } catch (err) {
      console.error('Error saving plugin settings:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save plugin settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Update setting value
  const updateSetting = (settingId: string, value: any) => {
    setPluginSettings(
      pluginSettings.map(setting => 
        setting.id === settingId ? { ...setting, value } : setting
      )
    );
  };
  
  if (!selectedGuild) {
    return null;
  }
  
  // Get plugin status badge
  const getPluginStatusBadge = (plugin: Plugin) => {
    if (!plugin.installed) {
      return <Badge variant="outline">Not Installed</Badge>;
    }
    
    if (plugin.updateAvailable) {
      return <Badge className="bg-yellow-500">Update Available</Badge>;
    }
    
    if (plugin.enabled) {
      return <Badge className="bg-green-500">Enabled</Badge>;
    }
    
    return <Badge className="bg-gray-500">Disabled</Badge>;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Plugin Marketplace</CardTitle>
        <CardDescription>Browse, install, and configure plugins for your bot</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plugins..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setSearchQuery('')}
              disabled={!searchQuery}
            >
              Clear
            </Button>
          </div>
          
          <Tabs 
            defaultValue="all" 
            value={activeFilter}
            onValueChange={(v) => setActiveFilter(v as any)}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Plugins</TabsTrigger>
              <TabsTrigger value="installed">Installed</TabsTrigger>
              <TabsTrigger value="premium">Premium</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              {renderPluginList()}
            </TabsContent>
            
            <TabsContent value="installed" className="space-y-4">
              {renderPluginList()}
            </TabsContent>
            
            <TabsContent value="premium" className="space-y-4">
              {renderPluginList()}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Plugin Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedPlugin && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    {selectedPlugin.name}
                    {selectedPlugin.premium && (
                      <Badge className="ml-2 bg-purple-500">Premium</Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedPlugin.description}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedPlugin.tags.map(tag => (
                      <Badge key={tag} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium">Version</p>
                      <p>{selectedPlugin.version}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Author</p>
                      <p className="flex items-center">
                        {selectedPlugin.author}
                        {selectedPlugin.authorUrl && (
                          <a 
                            href={selectedPlugin.authorUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-1 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Downloads</p>
                      <p>{selectedPlugin.downloads.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Rating</p>
                      <p>
                        {selectedPlugin.rating.toFixed(1)} / 5.0
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-1">Status</p>
                    <div className="flex items-center">
                      {getPluginStatusBadge(selectedPlugin)}
                      {selectedPlugin.installed && (
                        <p className="ml-2 text-sm text-muted-foreground">
                          Installed on {selectedPlugin.installedGuilds?.length || 0} servers
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {selectedPlugin.settings && selectedPlugin.settings.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-1">Settings Required</p>
                      <p className="text-sm text-muted-foreground">
                        This plugin requires configuration after installation.
                      </p>
                    </div>
                  )}
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDetailsOpen(false)}
                  >
                    Cancel
                  </Button>
                  
                  {selectedPlugin.installed ? (
                    <>
                      <Button
                        variant="destructive"
                        onClick={() => uninstallPlugin(selectedPlugin)}
                        disabled={loading}
                      >
                        Uninstall
                      </Button>
                      {selectedPlugin.settings && selectedPlugin.settings.length > 0 && (
                        <Button
                          onClick={() => {
                            setDetailsOpen(false);
                            openPluginSettings(selectedPlugin);
                          }}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Settings
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={() => installPlugin(selectedPlugin)}
                      disabled={loading}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Install
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Plugin Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            {selectedPlugin && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {selectedPlugin.name} Settings
                  </DialogTitle>
                  <DialogDescription>
                    Configure settings for this plugin
                  </DialogDescription>
                </DialogHeader>
                
                <div className="py-4">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                      {pluginSettings.map(setting => (
                        <div key={setting.id} className="space-y-2">
                          <Label htmlFor={setting.id}>
                            {setting.name}
                            {setting.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          
                          {setting.type === 'text' && (
                            <Input
                              id={setting.id}
                              value={setting.value !== undefined ? setting.value : setting.default}
                              onChange={(e) => updateSetting(setting.id, e.target.value)}
                              placeholder={setting.description}
                            />
                          )}
                          
                          {setting.type === 'number' && (
                            <Input
                              id={setting.id}
                              type="number"
                              value={setting.value !== undefined ? setting.value : setting.default}
                              onChange={(e) => updateSetting(setting.id, e.target.valueAsNumber)}
                            />
                          )}
                          
                          {setting.type === 'boolean' && (
                            <div className="flex items-center space-x-2">
                              <Switch
                                id={setting.id}
                                checked={setting.value !== undefined ? setting.value : setting.default}
                                onCheckedChange={(checked) => updateSetting(setting.id, checked)}
                              />
                              <Label htmlFor={setting.id}>
                                {setting.value !== undefined ? 
                                  (setting.value ? 'Enabled' : 'Disabled') : 
                                  (setting.default ? 'Enabled' : 'Disabled')}
                              </Label>
                            </div>
                          )}
                          
                          {setting.type === 'select' && setting.options && (
                            <select
                              id={setting.id}
                              value={setting.value !== undefined ? setting.value : setting.default}
                              onChange={(e) => updateSetting(setting.id, e.target.value)}
                              className="w-full rounded-md border border-input bg-background p-2"
                            >
                              {setting.options.map(option => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          )}
                          
                          <p className="text-xs text-muted-foreground">
                            {setting.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setSettingsOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={savePluginSettings}
                    disabled={loading}
                  >
                    Save Settings
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
  
  // Helper function to render plugin list
  function renderPluginList() {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="flex flex-col items-center py-8">
          <AlertCircle className="h-12 w-12 text-destructive mb-2" />
          <p className="text-center">{error}</p>
          <Button 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      );
    }
    
    if (filteredPlugins.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          {searchQuery ? 
            'No plugins match your search criteria.' : 
            activeFilter === 'installed' ? 
              'You haven\'t installed any plugins yet.' : 
              'No plugins available in this category.'
          }
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map(plugin => (
          <PluginCard
            key={plugin.id}
            plugin={plugin}
            onView={() => openPluginDetails(plugin)}
            onToggle={(enabled) => togglePlugin(plugin, enabled)}
            onSettings={() => openPluginSettings(plugin)}
          />
        ))}
      </div>
    );
  }
}

// Plugin Card Component
function PluginCard({ 
  plugin, 
  onView, 
  onToggle,
  onSettings
}: { 
  plugin: Plugin; 
  onView: () => void;
  onToggle: (enabled: boolean) => void;
  onSettings: () => void;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center text-lg">
              {plugin.name}
              {plugin.premium && (
                <Badge className="ml-2 bg-purple-500">Premium</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {plugin.description.length > 100 
                ? `${plugin.description.slice(0, 100)}...` 
                : plugin.description}
            </CardDescription>
          </div>
          <div>
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-1 mb-2">
          {plugin.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {plugin.tags.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{plugin.tags.length - 3} more
            </Badge>
          )}
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <div>v{plugin.version}</div>
          <div>{plugin.downloads.toLocaleString()} installs</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        {plugin.installed ? (
          <div className="flex items-center space-x-2">
            <Switch
              id={`toggle-${plugin.id}`}
              checked={!!plugin.enabled}
              onCheckedChange={onToggle}
            />
            <Label htmlFor={`toggle-${plugin.id}`} className="text-sm">
              {plugin.enabled ? (
                <span className="flex items-center text-green-500">
                  <Check className="h-3 w-3 mr-1" />
                  Enabled
                </span>
              ) : (
                <span className="flex items-center text-muted-foreground">
                  <X className="h-3 w-3 mr-1" />
                  Disabled
                </span>
              )}
            </Label>
          </div>
        ) : (
          <Badge variant="outline">Not Installed</Badge>
        )}
        <div className="space-x-2">
          {plugin.installed && plugin.settings && plugin.settings.length > 0 && (
            <Button variant="outline" size="sm" onClick={onSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={onView}>
            View
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}