import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useGuild } from '@/hooks/use-guild';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Search, UserPlus, Shield, Star, Crown, Check, Ban, Timer } from 'lucide-react';
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface User {
  id: string;
  username: string;
  nickname: string | null;
  roles: string[];
  joinedAt: string;
  status: 'online' | 'offline' | 'idle' | 'dnd';
  avatar: string;
  isBot: boolean;
  xp?: number;
  level?: number;
  messageCount?: number;
  isMuted?: boolean;
  mutedUntil?: string | null;
  isBanned?: boolean;
  banReason?: string | null;
}

interface Role {
  id: string;
  name: string;
  color: string;
  position: number;
  managed: boolean;
  permissions: string[];
}

export function UserManagementPanel() {
  const { selectedGuild } = useGuild();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'kick' | 'ban' | 'mute' | 'role' | 'view'>('view');
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState('1h');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  
  // Fetch server members when guild changes
  useEffect(() => {
    if (!selectedGuild) {
      setLoading(false);
      return;
    }
    
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch members from the API
        const response = await fetch(`/api/bot/guilds/${selectedGuild.id}/members`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch members');
        }
        
        const data = await response.json();
        setUsers(data.members);
        setFilteredUsers(data.members);
        
        // Fetch roles from the API
        const rolesResponse = await fetch(`/api/bot/guilds/${selectedGuild.id}/roles`);
        
        if (!rolesResponse.ok) {
          throw new Error('Failed to fetch roles');
        }
        
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles);
      } catch (err) {
        console.error('Error fetching guild members:', err);
        setError('Failed to load members. Please try again later.');
        toast({
          title: 'Error',
          description: 'Could not load server members',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [selectedGuild, toast]);
  
  // Filter users when search query changes
  useEffect(() => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = users.filter(user => 
      user.username.toLowerCase().includes(lowerQuery) ||
      (user.nickname && user.nickname.toLowerCase().includes(lowerQuery))
    );
    
    setFilteredUsers(filtered);
  }, [searchQuery, users]);
  
  // Handle user action
  const handleUserAction = async () => {
    if (!selectedUser || !selectedGuild) return;
    
    try {
      setLoading(true);
      
      let endpoint = '';
      let payload: any = {
        userId: selectedUser.id,
        guildId: selectedGuild.id,
        reason: actionReason || 'No reason provided'
      };
      
      // Prepare endpoint and payload based on action type
      switch (actionType) {
        case 'kick':
          endpoint = '/api/bot/moderation/kick';
          break;
        case 'ban':
          endpoint = '/api/bot/moderation/ban';
          break;
        case 'mute':
          endpoint = '/api/bot/moderation/mute';
          payload.duration = actionDuration;
          break;
        case 'role':
          endpoint = '/api/bot/moderation/roles';
          payload.roles = selectedRoles;
          break;
        default:
          return;
      }
      
      // Send action to API
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to perform action');
      }
      
      // Show success message
      toast({
        title: 'Success',
        description: `Action '${actionType}' performed successfully`,
      });
      
      // Refresh user data
      const updatedUsersResponse = await fetch(`/api/bot/guilds/${selectedGuild.id}/members`);
      const updatedUsersData = await updatedUsersResponse.json();
      setUsers(updatedUsersData.members);
      setFilteredUsers(updatedUsersData.members);
      
      // Close dialog
      setActionDialogOpen(false);
    } catch (err) {
      console.error(`Error performing ${actionType} action:`, err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : `Failed to perform '${actionType}' action`,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Get user status badge
  const getUserStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge className="bg-green-500">Online</Badge>;
      case 'idle':
        return <Badge className="bg-yellow-500">Idle</Badge>;
      case 'dnd':
        return <Badge className="bg-red-500">Do Not Disturb</Badge>;
      default:
        return <Badge className="bg-gray-500">Offline</Badge>;
    }
  };
  
  // Get role badge with color
  const getRoleBadge = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return null;
    
    const style = {
      backgroundColor: role.color !== '#000000' ? role.color : undefined
    };
    
    return (
      <Badge key={role.id} style={style} className="mr-1 mb-1">
        {role.name}
      </Badge>
    );
  };
  
  // Open user action dialog
  const openActionDialog = (user: User, action: 'kick' | 'ban' | 'mute' | 'role' | 'view') => {
    setSelectedUser(user);
    setActionType(action);
    setActionReason('');
    setActionDuration('1h');
    setSelectedRoles(user.roles);
    setActionDialogOpen(true);
  };
  
  if (!selectedGuild) {
    return null;
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>Manage server members, roles, and permissions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
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
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          </div>
        ) : error ? (
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
        ) : (
          <div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10">
                              <img
                                src={user.avatar || `https://cdn.discordapp.com/embed/avatars/0.png`}
                                alt={user.username}
                                className="rounded-full object-cover"
                              />
                              {user.isBot && (
                                <div className="absolute -bottom-1 -right-1 rounded-full bg-primary h-5 w-5 flex items-center justify-center">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{user.username}</p>
                              {user.nickname && (
                                <p className="text-sm text-muted-foreground">
                                  {user.nickname}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap max-w-[200px]">
                            {user.roles.map(roleId => getRoleBadge(roleId))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getUserStatusBadge(user.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(user.joinedAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openActionDialog(user, 'view')}
                            >
                              View
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openActionDialog(user, 'role')}
                            >
                              Roles
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => openActionDialog(user, 'kick')}
                            >
                              Kick
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No users found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="mt-2 text-sm text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} members
            </div>
          </div>
        )}
        
        {/* User Action Dialog */}
        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {actionType === 'view' ? 'User Details' :
                 actionType === 'role' ? 'Manage User Roles' :
                 actionType === 'kick' ? 'Kick User' :
                 actionType === 'ban' ? 'Ban User' : 'Mute User'}
              </DialogTitle>
              <DialogDescription>
                {selectedUser?.username}
                {selectedUser?.nickname && ` (${selectedUser.nickname})`}
              </DialogDescription>
            </DialogHeader>
            
            {actionType === 'view' && selectedUser && (
              <div className="py-4">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={selectedUser.avatar || `https://cdn.discordapp.com/embed/avatars/0.png`} 
                    alt={selectedUser.username} 
                    className="h-20 w-20 rounded-full object-cover" 
                  />
                  <div>
                    <h3 className="text-lg font-medium">{selectedUser.username}</h3>
                    {selectedUser.nickname && (
                      <p className="text-muted-foreground">{selectedUser.nickname}</p>
                    )}
                    <p className="text-sm">ID: {selectedUser.id}</p>
                    <p className="text-sm">Joined: {new Date(selectedUser.joinedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Roles</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedUser.roles.map(roleId => getRoleBadge(roleId))}
                    </div>
                  </div>
                  
                  {selectedUser.level !== undefined && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Activity</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-muted rounded-md p-2">
                          <p className="text-sm font-medium">Level</p>
                          <p className="text-xl">{selectedUser.level}</p>
                        </div>
                        <div className="bg-muted rounded-md p-2">
                          <p className="text-sm font-medium">XP</p>
                          <p className="text-xl">{selectedUser.xp}</p>
                        </div>
                        <div className="bg-muted rounded-md p-2">
                          <p className="text-sm font-medium">Messages</p>
                          <p className="text-xl">{selectedUser.messageCount || 0}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Moderation</h4>
                    {selectedUser.isMuted && (
                      <div className="flex items-center text-yellow-500 mb-2">
                        <Timer className="h-4 w-4 mr-2" />
                        <span>
                          Muted {selectedUser.mutedUntil ? `until ${new Date(selectedUser.mutedUntil).toLocaleString()}` : 'indefinitely'}
                        </span>
                      </div>
                    )}
                    {selectedUser.isBanned && (
                      <div className="flex items-center text-red-500">
                        <Ban className="h-4 w-4 mr-2" />
                        <span>
                          Banned {selectedUser.banReason ? `for: ${selectedUser.banReason}` : ''}
                        </span>
                      </div>
                    )}
                    {!selectedUser.isMuted && !selectedUser.isBanned && (
                      <p className="text-green-500">No active moderation actions</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {actionType === 'role' && selectedUser && (
              <div className="py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assigned Roles</Label>
                    <ScrollArea className="h-[200px] rounded-md border p-4">
                      {roles.filter(role => role.name !== '@everyone' && !role.managed).map(role => (
                        <div key={role.id} className="flex items-center space-x-2 py-1">
                          <input
                            type="checkbox"
                            id={`role-${role.id}`}
                            checked={selectedRoles.includes(role.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRoles([...selectedRoles, role.id]);
                              } else {
                                setSelectedRoles(selectedRoles.filter(id => id !== role.id));
                              }
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label 
                            htmlFor={`role-${role.id}`}
                            className="flex items-center"
                          >
                            <div 
                              className="h-3 w-3 rounded-full mr-2" 
                              style={{ backgroundColor: role.color }}
                            />
                            {role.name}
                          </label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
            
            {(actionType === 'kick' || actionType === 'ban' || actionType === 'mute') && (
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason</Label>
                  <Input
                    id="reason"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder={`Reason for ${actionType}`}
                  />
                </div>
                
                {actionType === 'mute' && (
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select value={actionDuration} onValueChange={setActionDuration}>
                      <SelectTrigger id="duration">
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5m">5 minutes</SelectItem>
                        <SelectItem value="15m">15 minutes</SelectItem>
                        <SelectItem value="30m">30 minutes</SelectItem>
                        <SelectItem value="1h">1 hour</SelectItem>
                        <SelectItem value="6h">6 hours</SelectItem>
                        <SelectItem value="12h">12 hours</SelectItem>
                        <SelectItem value="1d">1 day</SelectItem>
                        <SelectItem value="3d">3 days</SelectItem>
                        <SelectItem value="7d">7 days</SelectItem>
                        <SelectItem value="14d">14 days</SelectItem>
                        <SelectItem value="30d">30 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
              >
                Cancel
              </Button>
              
              {actionType !== 'view' && (
                <Button
                  onClick={handleUserAction}
                  variant={actionType === 'role' ? 'default' : 'destructive'}
                  disabled={loading}
                >
                  {actionType === 'role' ? 'Save Roles' : 
                   actionType === 'kick' ? 'Kick User' : 
                   actionType === 'ban' ? 'Ban User' : 'Mute User'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}