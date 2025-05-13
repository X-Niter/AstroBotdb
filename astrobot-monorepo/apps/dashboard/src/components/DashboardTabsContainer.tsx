import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ServerConfigPanel } from '@/components/config/ServerConfigPanel';
import { IntegrationsPanel } from '@/components/integrations/IntegrationsPanel';
import { ScheduledEventsCard } from '@/components/scheduler/ScheduledEventsCard';
import { StatisticsPanel } from '@/components/statistics/StatisticsPanel';
import { DocumentationPanel } from '@/components/documentation/DocumentationPanel';
import { UserManagementPanel } from '@/components/users/UserManagementPanel';
import { PluginMarketplace } from '@/components/plugins/PluginMarketplace';
import { BarChart2, Cog, Globe, Calendar, BookOpen, HelpCircle, Users, Package } from 'lucide-react';
import { useGuild } from '@/hooks/use-guild';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function DashboardTabsContainer() {
  const { selectedGuild, isLoading } = useGuild();
  
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  if (!selectedGuild) {
    return (
      <Alert className="max-w-xl mx-auto my-8">
        <AlertTitle>No server selected</AlertTitle>
        <AlertDescription>
          Please select a server from the dropdown at the top of the page to configure AstroBot.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Tabs defaultValue="config" className="space-y-4">
      <TabsList className="grid w-full grid-cols-7">
        <TabsTrigger value="config" className="flex items-center">
          <Cog className="mr-2 h-4 w-4" />
          Configuration
        </TabsTrigger>
        <TabsTrigger value="users" className="flex items-center">
          <Users className="mr-2 h-4 w-4" />
          Users
        </TabsTrigger>
        <TabsTrigger value="integrations" className="flex items-center">
          <Globe className="mr-2 h-4 w-4" />
          Integrations
        </TabsTrigger>
        <TabsTrigger value="plugins" className="flex items-center">
          <Package className="mr-2 h-4 w-4" />
          Plugins
        </TabsTrigger>
        <TabsTrigger value="scheduler" className="flex items-center">
          <Calendar className="mr-2 h-4 w-4" />
          Scheduled Events
        </TabsTrigger>
        <TabsTrigger value="statistics" className="flex items-center">
          <BarChart2 className="mr-2 h-4 w-4" />
          Statistics
        </TabsTrigger>
        <TabsTrigger value="docs" className="flex items-center">
          <BookOpen className="mr-2 h-4 w-4" />
          Documentation
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="config" className="space-y-4">
        <ServerConfigPanel />
      </TabsContent>
      
      <TabsContent value="users" className="space-y-4">
        <UserManagementPanel />
      </TabsContent>
      
      <TabsContent value="integrations" className="space-y-4">
        <IntegrationsPanel />
      </TabsContent>
      
      <TabsContent value="plugins" className="space-y-4">
        <PluginMarketplace />
      </TabsContent>
      
      <TabsContent value="scheduler" className="space-y-4">
        <ScheduledEventsCard />
      </TabsContent>
      
      <TabsContent value="statistics" className="space-y-4">
        <StatisticsPanel />
      </TabsContent>
      
      <TabsContent value="docs" className="space-y-4">
        <DocumentationPanel />
      </TabsContent>
    </Tabs>
  );
}