import React from 'react';
import { GithubIntegrationCard } from '@/components/github/GithubIntegrationCard';
import { TwitterIntegrationCard } from '@/components/twitter/TwitterIntegrationCard';
import { TwitchIntegrationCard } from '@/components/twitch/TwitchIntegrationCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGuild } from '@/hooks/use-guild';

export function IntegrationsPanel() {
  const { selectedGuild } = useGuild();
  
  if (!selectedGuild) {
    return null;
  }
  
  return (
    <Tabs defaultValue="github" className="w-full">
      <TabsList className="grid grid-cols-3 mb-4">
        <TabsTrigger value="github">GitHub</TabsTrigger>
        <TabsTrigger value="twitter">Twitter</TabsTrigger>
        <TabsTrigger value="twitch">Twitch</TabsTrigger>
      </TabsList>
      <TabsContent value="github">
        <GithubIntegrationCard />
      </TabsContent>
      <TabsContent value="twitter">
        <TwitterIntegrationCard />
      </TabsContent>
      <TabsContent value="twitch">
        <TwitchIntegrationCard />
      </TabsContent>
    </Tabs>
  );
}