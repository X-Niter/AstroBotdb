import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Channel {
  id: string;
  name: string;
  type: number;
}

interface ScheduledEvent {
  id: string;
  name: string;
  type: 'one-time' | 'recurring' | 'cron';
  schedule: any;
  channelId: string;
  content: string;
  enabled: boolean;
  timezone?: string;
  createdAt: string;
}

interface ScheduledEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: (created: boolean) => void;
  event: ScheduledEvent | null;
  guildId?: string;
  guildChannels: Channel[];
}

export function ScheduledEventDialog({
  open,
  onOpenChange,
  onClose,
  event,
  guildId,
  guildChannels
}: ScheduledEventDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'one-time' | 'recurring' | 'cron'>('one-time');
  const [channelId, setChannelId] = useState('');
  const [content, setContent] = useState('');
  const [enabled, setEnabled] = useState(true);
  
  // One-time event fields
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  
  // Recurring event fields
  const [recurringInterval, setRecurringInterval] = useState('daily');
  const [day, setDay] = useState('monday');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [dateOfMonth, setDateOfMonth] = useState('1');
  
  // Cron event fields
  const [cronExpression, setCronExpression] = useState('0 12 * * *');
  
  // Filter text channels only
  const textChannels = guildChannels.filter(channel => 
    channel.type === 0 || channel.type === 5
  );
  
  // Reset form when event changes
  useEffect(() => {
    if (event) {
      // Common fields
      setName(event.name);
      setType(event.type);
      setChannelId(event.channelId);
      setContent(event.content);
      setEnabled(event.enabled);
      
      // Type-specific fields
      if (event.type === 'one-time') {
        const date = new Date(event.schedule.timestamp);
        setDate(date.toISOString().split('T')[0]);
        setTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
      } else if (event.type === 'recurring') {
        setRecurringInterval(event.schedule.interval);
        if (event.schedule.interval === 'weekly') {
          setDay(event.schedule.day);
        } else if (event.schedule.interval === 'monthly') {
          setDateOfMonth(String(event.schedule.date));
        }
        setHour(String(event.schedule.hour));
        setMinute(String(event.schedule.minute).padStart(2, '0'));
      } else if (event.type === 'cron') {
        setCronExpression(event.schedule);
      }
    } else {
      // Reset form for new event
      setName('');
      setType('one-time');
      setChannelId(textChannels.length > 0 ? textChannels[0].id : '');
      setContent('');
      setEnabled(true);
      
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDate(tomorrow.toISOString().split('T')[0]);
      setTime('12:00');
      
      // Reset recurring fields
      setRecurringInterval('daily');
      setDay('monday');
      setHour('12');
      setMinute('00');
      setDateOfMonth('1');
      
      // Reset cron expression
      setCronExpression('0 12 * * *');
    }
  }, [event, textChannels]);
  
  const handleSubmit = async () => {
    if (!guildId) return;
    
    // Validate required fields
    if (!name) {
      toast({
        title: 'Error',
        description: 'Please enter a name for the event',
        variant: 'destructive'
      });
      return;
    }
    
    if (!channelId) {
      toast({
        title: 'Error',
        description: 'Please select a channel',
        variant: 'destructive'
      });
      return;
    }
    
    if (!content) {
      toast({
        title: 'Error',
        description: 'Please enter content for the message',
        variant: 'destructive'
      });
      return;
    }
    
    // Prepare schedule based on type
    let schedule;
    
    if (type === 'one-time') {
      if (!date || !time) {
        toast({
          title: 'Error',
          description: 'Please enter a date and time',
          variant: 'destructive'
        });
        return;
      }
      
      // Create timestamp
      const dateObj = new Date(`${date}T${time}`);
      
      // Validate date is in the future
      if (dateObj < new Date()) {
        toast({
          title: 'Error',
          description: 'Date must be in the future',
          variant: 'destructive'
        });
        return;
      }
      
      schedule = {
        timestamp: dateObj.toISOString()
      };
    } else if (type === 'recurring') {
      if (recurringInterval === 'weekly' && !day) {
        toast({
          title: 'Error',
          description: 'Please select a day for weekly events',
          variant: 'destructive'
        });
        return;
      }
      
      if (recurringInterval === 'monthly' && !dateOfMonth) {
        toast({
          title: 'Error',
          description: 'Please enter a date for monthly events',
          variant: 'destructive'
        });
        return;
      }
      
      schedule = {
        interval: recurringInterval,
        hour: parseInt(hour),
        minute: parseInt(minute)
      };
      
      if (recurringInterval === 'weekly') {
        schedule.day = day;
      } else if (recurringInterval === 'monthly') {
        schedule.date = parseInt(dateOfMonth);
      }
    } else {
      if (!cronExpression) {
        toast({
          title: 'Error',
          description: 'Please enter a cron expression',
          variant: 'destructive'
        });
        return;
      }
      
      schedule = cronExpression;
    }
    
    setLoading(true);
    try {
      if (event) {
        // Update existing event
        const response = await fetch('/api/bot/schedule', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            guildId,
            eventId: event.id,
            updates: {
              name,
              type,
              channelId,
              content,
              schedule,
              enabled
            }
          })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to update event');
        }
        
        toast({
          title: 'Success',
          description: 'Event updated successfully'
        });
      } else {
        // Create new event
        const response = await fetch('/api/bot/schedule', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            guildId,
            name,
            type,
            channelId,
            schedule,
            content,
            enabled
          })
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to create event');
        }
        
        toast({
          title: 'Success',
          description: 'Event created successfully'
        });
      }
      
      onClose(true);
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save event',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Scheduled Event' : 'Create Scheduled Event'}</DialogTitle>
          <DialogDescription>
            {event ? 'Update the settings for this scheduled event.' : 'Set up a new scheduled announcement or event.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Weekly Reminder"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel">Channel</Label>
              <Select value={channelId} onValueChange={setChannelId}>
                <SelectTrigger id="channel">
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
          </div>
          
          <div className="space-y-2">
            <Label>Event Type</Label>
            <Tabs value={type} onValueChange={(v) => setType(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="one-time">One-time</TabsTrigger>
                <TabsTrigger value="recurring">Recurring</TabsTrigger>
                <TabsTrigger value="cron">Advanced (Cron)</TabsTrigger>
              </TabsList>
              
              <TabsContent value="one-time" className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="recurring" className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurring-interval">Interval</Label>
                    <Select value={recurringInterval} onValueChange={setRecurringInterval}>
                      <SelectTrigger id="recurring-interval">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {recurringInterval === 'weekly' && (
                    <div className="space-y-2">
                      <Label htmlFor="day">Day</Label>
                      <Select value={day} onValueChange={setDay}>
                        <SelectTrigger id="day">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {recurringInterval === 'monthly' && (
                    <div className="space-y-2">
                      <Label htmlFor="date-of-month">Day of Month</Label>
                      <Select value={dateOfMonth} onValueChange={setDateOfMonth}>
                        <SelectTrigger id="date-of-month">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                            <SelectItem key={d} value={d.toString()}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hour">Hour</Label>
                    <Select value={hour} onValueChange={setHour}>
                      <SelectTrigger id="hour">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => i).map(h => (
                          <SelectItem key={h} value={h.toString()}>
                            {String(h).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="minute">Minute</Label>
                    <Select value={minute} onValueChange={setMinute}>
                      <SelectTrigger id="minute">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 60 }, (_, i) => i).map(m => (
                          <SelectItem key={m} value={String(m).padStart(2, '0')}>
                            {String(m).padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="cron" className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label htmlFor="cron">Cron Expression</Label>
                  <Input
                    id="cron"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    placeholder="0 12 * * *"
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: minute hour day-of-month month day-of-week
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Example: 0 12 * * * (Every day at 12:00)
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Message Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter the message that will be sent"
              rows={5}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
            <Label htmlFor="enabled">Enable this event immediately</Label>
          </div>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onClose(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            {event ? 'Update' : 'Create'} Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}