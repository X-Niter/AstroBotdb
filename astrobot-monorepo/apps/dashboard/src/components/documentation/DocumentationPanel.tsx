import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommandDocsPanel } from './CommandDocsPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookOpen, ExternalLink, Download, HelpCircle, FileText, Code, Coffee } from 'lucide-react';

// Quick link interface
interface QuickLink {
  title: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  badge?: {
    text: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
  };
}

export function DocumentationPanel() {
  // Quick links for resources
  const quickLinks: QuickLink[] = [
    {
      title: 'Discord.js Documentation',
      description: 'Official documentation for the Discord.js library that powers AstroBot',
      url: 'https://discord.js.org/',
      icon: <Code />,
      badge: {
        text: 'External',
        variant: 'secondary'
      }
    },
    {
      title: 'Bot Setup Guide',
      description: 'Step-by-step guide to set up AstroBot in your server',
      url: '/docs/setup-guide.pdf',
      icon: <FileText />,
    },
    {
      title: 'API Documentation',
      description: 'Documentation for the AstroBot API endpoints',
      url: '/docs/api',
      icon: <Code />,
      badge: {
        text: 'For Developers',
        variant: 'outline'
      }
    },
    {
      title: 'Support Server',
      description: 'Join our Discord server for help and support',
      url: 'https://discord.gg/astrobot',
      icon: <HelpCircle />,
    },
    {
      title: 'Contribute to AstroBot',
      description: 'Learn how to contribute to the project on GitHub',
      url: 'https://github.com/astrobot/astrobot',
      icon: <Coffee />,
    }
  ];
  
  // FAQ items
  const faqItems = [
    {
      question: 'How do I add AstroBot to my server?',
      answer: 'You can add AstroBot to your server by clicking the "Add to Discord" button on our website. You\'ll need to authorize the bot with the necessary permissions for all features to work properly.'
    },
    {
      question: 'What permissions does AstroBot need?',
      answer: 'AstroBot needs several permissions to function properly including Send Messages, Read Message History, Embed Links, and more. The exact permissions depend on which features you plan to use. For moderation features, you\'ll need additional permissions like Ban Members and Manage Messages.'
    },
    {
      question: 'Is AstroBot free to use?',
      answer: 'Yes, AstroBot\'s core features are free to use. We also offer premium features for a monthly subscription that provides enhanced functionality, priority support, and exclusive features.'
    },
    {
      question: 'How do I configure AstroBot?',
      answer: 'You can configure AstroBot directly through Discord commands or by using this dashboard. Go to the Configuration tab to customize various settings including prefix, auto-responses, and more.'
    },
    {
      question: 'How do I report a bug or suggest a feature?',
      answer: 'You can report bugs or suggest features by joining our support server and posting in the appropriate channels. We also track issues on our GitHub repository if you prefer that method.'
    }
  ];
  
  // Render quick links
  const renderQuickLinks = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center text-lg font-medium">
                  <div className="mr-2 h-5 w-5 text-primary">
                    {link.icon}
                  </div>
                  {link.title}
                </div>
                {link.badge && (
                  <Badge variant={link.badge.variant}>
                    {link.badge.text}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground">{link.description}</p>
            </CardContent>
            <div className="p-4 pt-0 mt-auto">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                asChild
              >
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  Visit Link
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };
  
  // Render FAQ
  const renderFAQ = () => {
    return (
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">{item.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <Tabs defaultValue="commands" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="commands">Commands</TabsTrigger>
        <TabsTrigger value="resources">Resources</TabsTrigger>
        <TabsTrigger value="faq">FAQ</TabsTrigger>
      </TabsList>
      
      <TabsContent value="commands">
        <CommandDocsPanel />
      </TabsContent>
      
      <TabsContent value="resources">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" />
              Resources and Documentation
            </CardTitle>
            <CardDescription>
              Helpful resources and documentation for AstroBot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-4">Download Documentation</h3>
                <div className="flex gap-4">
                  <Button asChild>
                    <a href="/docs/user-guide.pdf" download>
                      <Download className="mr-2 h-4 w-4" />
                      User Guide
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/docs/api-reference.pdf" download>
                      <Download className="mr-2 h-4 w-4" />
                      API Reference
                    </a>
                  </Button>
                  <Button variant="secondary" asChild>
                    <a href="/docs/command-cheatsheet.pdf" download>
                      <Download className="mr-2 h-4 w-4" />
                      Command Cheatsheet
                    </a>
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Quick Links</h3>
                {renderQuickLinks()}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="faq">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HelpCircle className="mr-2 h-5 w-5" />
              Frequently Asked Questions
            </CardTitle>
            <CardDescription>
              Common questions and answers about AstroBot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-[600px] pr-4">
              {renderFAQ()}
            </ScrollArea>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}