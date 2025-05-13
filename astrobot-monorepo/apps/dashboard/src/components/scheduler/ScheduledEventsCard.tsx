import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  Loader2, 
  Calendar, 
  Plus, 
  Trash2, 
  Clock, 
  Eye, 
  RefreshCw,
  Power,
  PowerOff
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useGuild } from '@/hooks/use-guild';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScheduledEventDialog } from './ScheduledEventDialog';
import { formatDistanceToNow } from 'date-fns';

interface ScheduledEvent {
  id: string;
  name: string;
  type: 'one-time' | 'recurring' | 'cron';
  schedule: any;
  channelId: string;
  content: string;
  enabled: boolean;
  createdAt: string;
}

export function ScheduledEventsCard() {
  const { toast } = useToast();
  const { selectedGuild, guildChannels } = useGuild();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<ScheduledEvent[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduledEvent | null>(null);
  
  const loadEvents = async () => {
    if (!selectedGuild) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/bot/schedule?guildId=${selectedGuild.id}`);
      if (!response.ok) {
        throw new Error('Failed to load scheduled events');
      }
      
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error loading scheduled events:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scheduled events',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Load events on guild change
  useEffect(() => {
    if (selectedGuild) {
      loadEvents();
    }
  }, [selectedGuild]);
  
  const handleCreateEvent = () => {
    setSelectedEvent(null);
    setDialogOpen(true);
  };
  
  const handleViewEvent = (event: ScheduledEvent) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    if (!selectedGuild) return;
    
    try {
      const response = await fetch('/api/bot/schedule', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          eventId
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete event');
      }
      
      // Remove from local state
      setEvents(events.filter(e => e.id !== eventId));
      
      toast({
        title: 'Success',
        description: 'Event deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete event',
        variant: 'destructive'
      });
    }
  };
  
  const handleToggleEvent = async (eventId: string, enabled: boolean) => {
    if (!selectedGuild) return;
    
    try {
      const response = await fetch('/api/bot/schedule', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          eventId,
          updates: { enabled }
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${enabled ? 'enable' : 'disable'} event`);
      }
      
      // Update local state
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, enabled } : e
      ));
      
      toast({
        title: 'Success',
        description: `Event ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      console.error(`Error ${enabled ? 'enabling' : 'disabling'} event:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${enabled ? 'enable' : 'disable'} event`,
        variant: 'destructive'
      });
    }
  };
  
  const handleDialogClose = (created: boolean) => {
    setDialogOpen(false);
    
    if (created) {
      loadEvents();
    }
  };
  
  // Helper function to get a channel name from ID
  const getChannelName = (channelId: string) => {
    const channel = guildChannels?.find(c => c.id === channelId);
    return channel ? channel.name : 'Unknown channel';
  };
  
  // Helper function to format schedule display
  const formatSchedule = (event: ScheduledEvent) => {
    if (event.type === 'one-time') {
      const date = new Date(event.schedule.timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    } else if (event.type === 'recurring') {
      switch (event.schedule.interval) {
        case 'daily':
          return `Daily at ${event.schedule.hour}:${String(event.schedule.minute).padStart(2, '0')}`;
        case 'weekly':
          return `Every ${event.schedule.day} at ${event.schedule.hour}:${String(event.schedule.minute).padStart(2, '0')}`;
        case 'monthly':
          return `Monthly on day ${event.schedule.date} at ${event.schedule.hour}:${String(event.schedule.minute).padStart(2, '0')}`;
        default:
          return 'Custom recurring schedule';
      }
    } else {
      return `Cron: ${event.schedule}`;
    }
  };
  
  // Filter events by type
  const oneTimeEvents = events.filter(e => e.type === 'one-time');
  const recurringEvents = events.filter(e => e.type === 'recurring');
  const cronEvents = events.filter(e => e.type === 'cron');
  
  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Scheduled Events
          </CardTitle>
          <CardDescription>
            Create and manage scheduled announcements and events
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={handleCreateEvent}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Event
                </Button>
              </div>
              
              {events.length > 0 ? (
                <Tabs defaultValue="one-time">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="one-time">
                      One-time
                      {oneTimeEvents.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {oneTimeEvents.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="recurring">
                      Recurring
                      {recurringEvents.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {recurringEvents.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="cron">
                      Advanced
                      {cronEvents.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {cronEvents.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="one-time">
                    {oneTimeEvents.length > 0 ? (
                      <div className="space-y-2">
                        {oneTimeEvents.map(event => (
                          <div key={event.id} className="flex items-center justify-between bg-muted p-3 rounded-md">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <Badge variant={event.enabled ? "default" : "secondary"} className="mr-2">
                                  {event.enabled ? 'Active' : 'Disabled'}
                                </Badge>
                                <span className="font-medium">{event.name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatSchedule(event)}
                                <span className="mx-2">•</span>
                                <span>#{getChannelName(event.channelId)}</span>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewEvent(event)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleEvent(event.id, !event.enabled)}
                              >
                                {event.enabled ? (
                                  <PowerOff className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No one-time events scheduled
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="recurring">
                    {recurringEvents.length > 0 ? (
                      <div className="space-y-2">
                        {recurringEvents.map(event => (
                          <div key={event.id} className="flex items-center justify-between bg-muted p-3 rounded-md">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <Badge variant={event.enabled ? "default" : "secondary"} className="mr-2">
                                  {event.enabled ? 'Active' : 'Disabled'}
                                </Badge>
                                <span className="font-medium">{event.name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatSchedule(event)}
                                <span className="mx-2">•</span>
                                <span>#{getChannelName(event.channelId)}</span>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewEvent(event)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleEvent(event.id, !event.enabled)}
                              >
                                {event.enabled ? (
                                  <PowerOff className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No recurring events scheduled
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="cron">
                    {cronEvents.length > 0 ? (
                      <div className="space-y-2">
                        {cronEvents.map(event => (
                          <div key={event.id} className="flex items-center justify-between bg-muted p-3 rounded-md">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <Badge variant={event.enabled ? "default" : "secondary"} className="mr-2">
                                  {event.enabled ? 'Active' : 'Disabled'}
                                </Badge>
                                <span className="font-medium">{event.name}</span>
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatSchedule(event)}
                                <span className="mx-2">•</span>
                                <span>#{getChannelName(event.channelId)}</span>
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewEvent(event)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleEvent(event.id, !event.enabled)}
                              >
                                {event.enabled ? (
                                  <PowerOff className="h-4 w-4 text-amber-500" />
                                ) : (
                                  <Power className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteEvent(event.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        No advanced (cron) events scheduled
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No scheduled events yet</p>
                  <p className="mt-2">Click "New Event" to create your first scheduled announcement</p>
                </div>
              )}
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            {events.length > 0 && (
              <span className="text-muted-foreground">
                {events.length} scheduled {events.length === 1 ? 'event' : 'events'}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadEvents}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardFooter>
      </Card>
      
      <ScheduledEventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onClose={handleDialogClose}
        event={selectedEvent}
        guildId={selectedGuild?.id}
        guildChannels={guildChannels || []}
      />
    </>
  );
}