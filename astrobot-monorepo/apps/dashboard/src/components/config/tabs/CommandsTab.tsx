import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { useGuild } from '@/hooks/use-guild';
import { Badge } from '@/components/ui/badge';
import { ListEditor, Field } from '@/components/common/ListEditor';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Command {
  id: string;
  name: string;
  description: string;
  usage: string;
  category: string;
  cooldown: number;
  enabled: boolean;
  permissions: string[];
  aliases?: string[];
}

export function CommandsTab() {
  const { selectedGuild } = useGuild();
  const { toast } = useToast();
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fields: Field[] = [
    {
      id: 'name',
      type: 'text',
      label: 'Command Name',
      placeholder: 'Enter command name',
      required: true,
      validator: (value) => {
        if (!/^[a-z0-9-_]+$/.test(value)) {
          return 'Command name must only contain lowercase letters, numbers, hyphens, and underscores';
        }
        return true;
      }
    },
    {
      id: 'description',
      type: 'textarea',
      label: 'Description',
      placeholder: 'Enter command description',
      required: true
    },
    {
      id: 'usage',
      type: 'text',
      label: 'Usage',
      placeholder: 'Example: !command <required> [optional]',
      required: true
    },
    {
      id: 'category',
      type: 'select',
      label: 'Category',
      required: true,
      options: [
        { label: 'General', value: 'general' },
        { label: 'Moderation', value: 'moderation' },
        { label: 'Fun', value: 'fun' },
        { label: 'Utility', value: 'utility' },
        { label: 'Music', value: 'music' },
        { label: 'Economy', value: 'economy' },
        { label: 'Configuration', value: 'config' }
      ],
      defaultValue: 'general'
    },
    {
      id: 'cooldown',
      type: 'number',
      label: 'Cooldown (seconds)',
      defaultValue: 0
    },
    {
      id: 'enabled',
      type: 'boolean',
      label: 'Enabled',
      defaultValue: true
    }
  ];
  
  // Fetch commands when guild changes
  useEffect(() => {
    if (!selectedGuild) return;
    
    const fetchCommands = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/bot/commands?guildId=${selectedGuild.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch commands');
        }
        
        const data = await response.json();
        setCommands(data.commands);
      } catch (err) {
        console.error('Error fetching commands:', err);
        setError('Failed to load commands. Please try again later.');
        toast({
          title: 'Error',
          description: 'Could not load commands',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommands();
  }, [selectedGuild, toast]);
  
  // Add command
  const handleAddCommand = async (command: any) => {
    if (!selectedGuild) return;
    
    // Generate unique ID
    const newCommand = {
      ...command,
      id: Math.random().toString(36).substring(2, 15),
      aliases: [],
      permissions: []
    };
    
    try {
      const response = await fetch('/api/bot/commands', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          command: newCommand
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add command');
      }
      
      // Update local state
      setCommands([...commands, newCommand]);
    } catch (error) {
      console.error('Error adding command:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add command',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  // Edit command
  const handleEditCommand = async (command: any, index: number) => {
    if (!selectedGuild) return;
    
    const updatedCommand = {
      ...commands[index],
      ...command
    };
    
    try {
      const response = await fetch(`/api/bot/commands/${updatedCommand.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          command: updatedCommand
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update command');
      }
      
      // Update local state
      const updatedCommands = [...commands];
      updatedCommands[index] = updatedCommand;
      setCommands(updatedCommands);
    } catch (error) {
      console.error('Error updating command:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update command',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  // Delete command
  const handleDeleteCommand = async (command: Command, index: number) => {
    if (!selectedGuild) return;
    
    try {
      const response = await fetch(`/api/bot/commands/${command.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete command');
      }
      
      // Update local state
      const updatedCommands = [...commands];
      updatedCommands.splice(index, 1);
      setCommands(updatedCommands);
    } catch (error) {
      console.error('Error deleting command:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete command',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  // Move command
  const handleMoveCommand = async (index: number, direction: 'up' | 'down') => {
    if (!selectedGuild) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= commands.length) {
      return;
    }
    
    try {
      const response = await fetch('/api/bot/commands/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId: selectedGuild.id,
          commandId: commands[index].id,
          newPosition: newIndex
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to reorder commands');
      }
      
      // Update local state
      const updatedCommands = [...commands];
      const temp = updatedCommands[index];
      updatedCommands[index] = updatedCommands[newIndex];
      updatedCommands[newIndex] = temp;
      setCommands(updatedCommands);
    } catch (error) {
      console.error('Error reordering commands:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to reorder commands',
        variant: 'destructive'
      });
      throw error;
    }
  };
  
  // Render command status badge
  const renderCommandBadge = (command: Command) => {
    if (!command.enabled) {
      return <Badge variant="outline">Disabled</Badge>;
    }
    
    return <Badge className="bg-green-500">Enabled</Badge>;
  };
  
  // Command to string
  const commandToString = (command: Command) => {
    return `${command.name} - ${command.description}`;
  };
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div>
      <ListEditor
        title="Bot Commands"
        description="Configure and manage commands for your Discord bot."
        fields={fields}
        items={commands}
        onAddItem={handleAddCommand}
        onEditItem={handleEditCommand}
        onDeleteItem={handleDeleteCommand}
        onMoveItem={handleMoveCommand}
        keyField="id"
        renderBadge={renderCommandBadge}
        itemToString={commandToString}
        enableOrdering={true}
        enableSearch={true}
        confirmDelete={true}
        maxHeight="500px"
      />
    </div>
  );
}