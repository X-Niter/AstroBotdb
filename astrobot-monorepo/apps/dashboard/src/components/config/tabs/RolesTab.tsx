import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, ShieldCheck, Trash2 } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Role {
  id: string;
  name: string;
  color: number;
  position: number;
}

interface RolesTabProps {
  adminRoles: string[];
  modRoles: string[];
  guildId?: string;
  guildRoles: Role[];
  onConfigUpdate: (config: { adminRoles?: string[], modRoles?: string[] }) => void;
}

export function RolesTab({ adminRoles, modRoles, guildId, guildRoles, onConfigUpdate }: RolesTabProps) {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [roleType, setRoleType] = useState<'admin' | 'mod'>('admin');
  const [adding, setAdding] = useState(false);
  
  // Filter @everyone role and sort by position (highest first)
  const filteredRoles = guildRoles
    .filter(role => role.name !== '@everyone')
    .sort((a, b) => b.position - a.position);
  
  const handleAddRole = async () => {
    if (!guildId || !selectedRole) return;
    
    // Check if role is already in the list
    if (roleType === 'admin' && adminRoles.includes(selectedRole)) {
      toast({
        title: 'Error',
        description: 'This role is already an admin role',
        variant: 'destructive'
      });
      return;
    }
    
    if (roleType === 'mod' && modRoles.includes(selectedRole)) {
      toast({
        title: 'Error',
        description: 'This role is already a moderator role',
        variant: 'destructive'
      });
      return;
    }
    
    setAdding(true);
    try {
      const response = await fetch('/api/bot/config?type=role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId,
          role: selectedRole,
          roleType,
          action: 'add'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to add ${roleType} role`);
      }
      
      // Update local state
      if (roleType === 'admin') {
        onConfigUpdate({ adminRoles: [...adminRoles, selectedRole] });
      } else {
        onConfigUpdate({ modRoles: [...modRoles, selectedRole] });
      }
      
      setSelectedRole('');
      
      toast({
        title: 'Success',
        description: `Role added as ${roleType === 'admin' ? 'an admin' : 'a moderator'} role`
      });
    } catch (error) {
      console.error(`Error adding ${roleType} role:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to add ${roleType} role`,
        variant: 'destructive'
      });
    } finally {
      setAdding(false);
    }
  };
  
  const handleRemoveRole = async (roleId: string, type: 'admin' | 'mod') => {
    if (!guildId) return;
    
    try {
      const response = await fetch('/api/bot/config?type=role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          guildId,
          role: roleId,
          roleType: type,
          action: 'remove'
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to remove ${type} role`);
      }
      
      // Update local state
      if (type === 'admin') {
        onConfigUpdate({ adminRoles: adminRoles.filter(id => id !== roleId) });
      } else {
        onConfigUpdate({ modRoles: modRoles.filter(id => id !== roleId) });
      }
      
      toast({
        title: 'Success',
        description: `Role removed from ${type === 'admin' ? 'admin' : 'moderator'} roles`
      });
    } catch (error) {
      console.error(`Error removing ${type} role:`, error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to remove ${type} role`,
        variant: 'destructive'
      });
    }
  };
  
  // Helper to get role object by ID
  const getRoleById = (id: string) => {
    return guildRoles.find(role => role.id === id);
  };
  
  // Helper to convert role color to CSS color
  const getRoleColor = (colorInt: number) => {
    if (colorInt === 0) return 'inherit'; // Default color
    const hexColor = colorInt.toString(16).padStart(6, '0');
    return `#${hexColor}`;
  };
  
  return (
    <div className="space-y-6 p-2">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label>Select Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {filteredRoles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    <span style={{ color: getRoleColor(role.color) }}>
                      {role.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Role Type</Label>
            <Select value={roleType} onValueChange={(value: 'admin' | 'mod') => setRoleType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="mod">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="mt-6">
            <Button onClick={handleAddRole} disabled={adding || !selectedRole}>
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                '+'
              )}
              Add Role
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Admin roles have access to all bot commands. Moderator roles have access to moderation commands.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShieldAlert className="h-4 w-4 mr-2 text-red-500" />
              Admin Roles
            </CardTitle>
            <CardDescription>
              Full access to all bot commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {adminRoles.length > 0 ? (
                <div className="space-y-2">
                  {adminRoles.map(roleId => {
                    const role = getRoleById(roleId);
                    return (
                      <div key={roleId} className="flex items-center justify-between">
                        <Badge 
                          variant="outline"
                          style={{ 
                            color: role ? getRoleColor(role.color) : 'inherit',
                            borderColor: role && role.color !== 0 ? getRoleColor(role.color) : undefined
                          }}
                        >
                          {role ? role.name : `Unknown Role (${roleId})`}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRole(roleId, 'admin')}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No admin roles configured. Users with server Administrator permission will still have access.
                  </AlertDescription>
                </Alert>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <ShieldCheck className="h-4 w-4 mr-2 text-blue-500" />
              Moderator Roles
            </CardTitle>
            <CardDescription>
              Access to moderation commands
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {modRoles.length > 0 ? (
                <div className="space-y-2">
                  {modRoles.map(roleId => {
                    const role = getRoleById(roleId);
                    return (
                      <div key={roleId} className="flex items-center justify-between">
                        <Badge 
                          variant="outline"
                          style={{ 
                            color: role ? getRoleColor(role.color) : 'inherit',
                            borderColor: role && role.color !== 0 ? getRoleColor(role.color) : undefined
                          }}
                        >
                          {role ? role.name : `Unknown Role (${roleId})`}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRole(roleId, 'mod')}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>
                    No moderator roles configured. Users with server Manage Server or Moderate Members permission will still have access.
                  </AlertDescription>
                </Alert>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}