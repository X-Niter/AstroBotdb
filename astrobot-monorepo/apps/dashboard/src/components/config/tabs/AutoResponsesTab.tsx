import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AutoResponsesTabProps {
  autoResponses: Record<string, string>;
  guildId?: string;
  onConfigUpdate: (autoResponses: Record<string, string>) => void;
}

export function AutoResponsesTab({ autoResponses, guildId, onConfigUpdate }: AutoResponsesTabProps) {
  const { toast } = useToast();
  const [newTrigger, setNewTrigger] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editTrigger, setEditTrigger] = useState('');
  const [editResponse, setEditResponse] = useState('');
  const [saving, setSaving] = useState(false);
  
  const handleAddAutoResponse = async () => {
    if (!guildId) return;
    
    if (!newTrigger.trim() || !newResponse.trim()) {
      toast({
        title: 'Error',
        description: 'Trigger and response are required',
        variant: 'destructive'
      });
      return;
    }
    
    setAdding(true);
    try {
      const response = await fetch('/api/bot/autoresponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId,
          trigger: newTrigger,
          response: newResponse
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add auto response');
      }
      
      // Update local state
      const newAutoResponses = {
        ...autoResponses,
        [newTrigger]: newResponse
      };
      
      onConfigUpdate(newAutoResponses);
      
      setNewTrigger('');
      setNewResponse('');
      
      toast({
        title: 'Success',
        description: 'Auto response added successfully'
      });
    } catch (error) {
      console.error('Error adding auto response:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add auto response',
        variant: 'destructive'
      });
    } finally {
      setAdding(false);
    }
  };
  
  const handleRemoveAutoResponse = async (trigger: string) => {
    if (!guildId) return;
    
    try {
      const response = await fetch('/api/bot/autoresponse', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId,
          trigger
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to remove auto response');
      }
      
      // Update local state
      const newAutoResponses = { ...autoResponses };
      delete newAutoResponses[trigger];
      
      onConfigUpdate(newAutoResponses);
      
      toast({
        title: 'Success',
        description: 'Auto response removed successfully'
      });
    } catch (error) {
      console.error('Error removing auto response:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove auto response',
        variant: 'destructive'
      });
    }
  };
  
  const startEditing = (trigger: string, response: string) => {
    setEditingKey(trigger);
    setEditTrigger(trigger);
    setEditResponse(response);
  };
  
  const cancelEditing = () => {
    setEditingKey(null);
    setEditTrigger('');
    setEditResponse('');
  };
  
  const handleSaveEdit = async () => {
    if (!guildId || !editingKey) return;
    
    if (!editTrigger.trim() || !editResponse.trim()) {
      toast({
        title: 'Error',
        description: 'Trigger and response are required',
        variant: 'destructive'
      });
      return;
    }
    
    setSaving(true);
    try {
      const response = await fetch('/api/bot/autoresponse', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId,
          oldTrigger: editingKey,
          newTrigger: editTrigger,
          newResponse: editResponse
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update auto response');
      }
      
      // Update local state
      const newAutoResponses = { ...autoResponses };
      delete newAutoResponses[editingKey];
      newAutoResponses[editTrigger] = editResponse;
      
      onConfigUpdate(newAutoResponses);
      
      cancelEditing();
      
      toast({
        title: 'Success',
        description: 'Auto response updated successfully'
      });
    } catch (error) {
      console.error('Error updating auto response:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update auto response',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-4 p-2">
      <div className="space-y-2">
        <Label htmlFor="new-trigger">Trigger</Label>
        <Input
          id="new-trigger"
          placeholder="hello"
          value={newTrigger}
          onChange={(e) => setNewTrigger(e.target.value)}
        />
        <div className="text-xs text-muted-foreground mt-1">
          Use * as a wildcard. Example: hello* will match "hello world", "hello there", etc.
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="new-response">Response</Label>
        <Textarea
          id="new-response"
          placeholder="Hi there!"
          value={newResponse}
          onChange={(e) => setNewResponse(e.target.value)}
          rows={3}
        />
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleAddAutoResponse} disabled={adding}>
          {adding ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Response
        </Button>
      </div>
      
      <div className="rounded-md border">
        {Object.keys(autoResponses).length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trigger</TableHead>
                <TableHead>Response</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(autoResponses).map(([trigger, response]) => (
                <TableRow key={trigger}>
                  {editingKey === trigger ? (
                    <>
                      <TableCell>
                        <Input 
                          value={editTrigger} 
                          onChange={(e) => setEditTrigger(e.target.value)} 
                        />
                      </TableCell>
                      <TableCell>
                        <Textarea 
                          value={editResponse} 
                          onChange={(e) => setEditResponse(e.target.value)}
                          rows={2}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSaveEdit}
                            disabled={saving}
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-medium">{trigger}</TableCell>
                      <TableCell>{response}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditing(trigger, response)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveAutoResponse(trigger)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex justify-center p-4">
            <Alert>
              <AlertDescription>
                No auto responses configured yet. Add one to get started.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}