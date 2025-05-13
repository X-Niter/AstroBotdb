import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Copy, 
  BookOpen, 
  FileText, 
  CheckCircle, 
  PlusCircle, 
  MinusCircle 
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Command category interface
interface CommandCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: React.ReactNode;
}

// Command interface
interface Command {
  name: string;
  description: string;
  usage: string;
  examples: string[];
  category: string;
  cooldown?: number;
  permissions?: string[];
  aliases?: string[];
  featured?: boolean;
}

export function CommandDocsPanel() {
  const { toast } = useToast();
  const [commands, setCommands] = useState<Command[]>([]);
  const [filteredCommands, setFilteredCommands] = useState<Command[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CommandCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  
  // Define categories with colors and icons
  const commandCategories: CommandCategory[] = [
    { id: 'general', name: 'General', description: 'Basic commands for everyone', color: 'bg-blue-500', icon: <FileText className="h-4 w-4" /> },
    { id: 'moderation', name: 'Moderation', description: 'Commands for server moderators', color: 'bg-red-500', icon: <MinusCircle className="h-4 w-4" /> },
    { id: 'fun', name: 'Fun', description: 'Entertainment commands', color: 'bg-purple-500', icon: <BookOpen className="h-4 w-4" /> },
    { id: 'utility', name: 'Utility', description: 'Helpful tools and utilities', color: 'bg-green-500', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'music', name: 'Music', description: 'Music playback commands', color: 'bg-yellow-500' },
    { id: 'economy', name: 'Economy', description: 'Currency and economy system', color: 'bg-amber-500' },
    { id: 'config', name: 'Configuration', description: 'Bot configuration commands', color: 'bg-gray-500', icon: <PlusCircle className="h-4 w-4" /> },
  ];
  
  // Fetch commands on mount
  useEffect(() => {
    setCategories(commandCategories);
    fetchCommands();
  }, []);
  
  // Filter commands when search query or category changes
  useEffect(() => {
    let filtered = commands;
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(command => command.category === selectedCategory);
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(command => 
        command.name.toLowerCase().includes(query) ||
        command.description.toLowerCase().includes(query) ||
        command.usage.toLowerCase().includes(query) ||
        (command.aliases && command.aliases.some(alias => alias.toLowerCase().includes(query)))
      );
    }
    
    setFilteredCommands(filtered);
  }, [searchQuery, selectedCategory, commands]);
  
  // Fetch commands data
  const fetchCommands = async () => {
    setLoading(true);
    
    try {
      // Fetch commands from API
      const response = await fetch('/api/bot/commands/docs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch command documentation');
      }
      
      const data = await response.json();
      setCommands(data.commands);
      setFilteredCommands(data.commands);
    } catch (error) {
      console.error('Error fetching commands:', error);
      // For development, use placeholder data if API fails
      const placeholderCommands: Command[] = [
        {
          name: 'help',
          description: 'Shows a list of available commands or information about a specific command',
          usage: '!help [command]',
          examples: ['!help', '!help ping'],
          category: 'general',
          cooldown: 5,
          aliases: ['h', 'commands']
        },
        {
          name: 'ping',
          description: 'Checks the bot\'s response time',
          usage: '!ping',
          examples: ['!ping'],
          category: 'utility',
          cooldown: 3,
          featured: true
        },
        {
          name: 'ban',
          description: 'Bans a member from the server',
          usage: '!ban <user> [reason]',
          examples: ['!ban @username', '!ban @username Spamming'],
          category: 'moderation',
          permissions: ['BAN_MEMBERS'],
          cooldown: 5
        }
      ];
      
      setCommands(placeholderCommands);
      setFilteredCommands(placeholderCommands);
    } finally {
      setLoading(false);
    }
  };
  
  // Copy command usage to clipboard
  const copyCommandUsage = (usage: string) => {
    navigator.clipboard.writeText(usage);
    toast({
      title: "Copied to clipboard",
      description: `Command usage copied to clipboard: ${usage}`,
    });
  };
  
  // Get category badge
  const getCategoryBadge = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return <Badge>Unknown</Badge>;
    
    return (
      <Badge className={category.color}>
        {category.icon && <span className="mr-1">{category.icon}</span>}
        {category.name}
      </Badge>
    );
  };
  
  // Render featured commands
  const renderFeaturedCommands = () => {
    const featuredCommands = commands.filter(cmd => cmd.featured);
    
    if (featuredCommands.length === 0) {
      return (
        <div className="text-center py-4 text-muted-foreground">
          No featured commands available.
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featuredCommands.map(command => (
          <Card key={command.name}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center justify-between">
                <span>!{command.name}</span>
                {getCategoryBadge(command.category)}
              </CardTitle>
              <CardDescription>{command.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div className="bg-muted p-2 rounded text-sm font-mono flex-1">
                  {command.usage}
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="ml-2"
                  onClick={() => copyCommandUsage(command.usage)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  // Render command list
  const renderCommandList = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
        </div>
      );
    }
    
    if (filteredCommands.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No commands match your search criteria.
        </div>
      );
    }
    
    // Group commands by category
    const groupedCommands: { [key: string]: Command[] } = {};
    
    filteredCommands.forEach(cmd => {
      if (!groupedCommands[cmd.category]) {
        groupedCommands[cmd.category] = [];
      }
      groupedCommands[cmd.category].push(cmd);
    });
    
    return (
      <Accordion type="multiple" className="w-full">
        {Object.keys(groupedCommands).map(categoryId => {
          const categoryCommands = groupedCommands[categoryId];
          const category = categories.find(cat => cat.id === categoryId);
          
          return (
            <AccordionItem key={categoryId} value={categoryId}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  {getCategoryBadge(categoryId)}
                  <span className="ml-2">{category?.name || 'Unknown'} Commands ({categoryCommands.length})</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {categoryCommands.map(command => (
                    <Card key={command.name}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          !{command.name}
                          {command.aliases && command.aliases.length > 0 && (
                            <span className="text-sm font-normal text-muted-foreground ml-2">
                              Aliases: {command.aliases.map(a => `!${a}`).join(', ')}
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription>{command.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-sm font-medium mb-1">Usage:</p>
                          <div className="flex justify-between items-center">
                            <div className="bg-muted p-2 rounded text-sm font-mono flex-1">
                              {command.usage}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="ml-2"
                              onClick={() => copyCommandUsage(command.usage)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {command.examples && command.examples.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Examples:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              {command.examples.map((example, index) => (
                                <li key={index} className="text-sm">
                                  <code className="bg-muted px-1 py-0.5 rounded text-sm">{example}</code>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          {command.cooldown && (
                            <div className="bg-muted px-2 py-1 rounded-full">
                              Cooldown: {command.cooldown}s
                            </div>
                          )}
                          
                          {command.permissions && command.permissions.length > 0 && (
                            <div className="bg-muted px-2 py-1 rounded-full">
                              Requires: {command.permissions.join(', ')}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    );
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="mr-2 h-5 w-5" />
          Command Documentation
        </CardTitle>
        <CardDescription>
          Browse and search AstroBot's commands
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex gap-4 flex-col sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search commands..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="w-full sm:w-auto">
              <select 
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <Button onClick={fetchCommands}>
              Refresh
            </Button>
          </div>
          
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="all">All Commands</TabsTrigger>
              <TabsTrigger value="featured">Featured Commands</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="h-full">
              <ScrollArea className="max-h-[600px] pr-4">
                {renderCommandList()}
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="featured">
              <ScrollArea className="max-h-[600px] pr-4">
                {renderFeaturedCommands()}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}