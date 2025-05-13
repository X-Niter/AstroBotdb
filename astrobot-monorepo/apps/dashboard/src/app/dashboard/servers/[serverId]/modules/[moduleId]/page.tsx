"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Module configuration interface
type ModuleConfig = {
  id: string;
  name: string;
  description: string;
  settings: ModuleSetting[];
  isPremium: boolean;
};

type ModuleSetting = {
  id: string;
  name: string;
  description: string;
  type: 'toggle' | 'select' | 'input' | 'textarea' | 'channel' | 'role';
  value: string | boolean | string[];
  options?: { label: string; value: string }[];
  isPremium?: boolean;
};

// Mock configuration data for different modules
const MODULE_CONFIGS: Record<string, ModuleConfig> = {
  'moderation': {
    id: 'moderation',
    name: 'Moderation',
    description: 'Configure auto-moderation features to keep your server safe',
    isPremium: false,
    settings: [
      {
        id: 'filter_profanity',
        name: 'Profanity Filter',
        description: 'Automatically delete messages containing profanity',
        type: 'toggle',
        value: true,
      },
      {
        id: 'filter_links',
        name: 'Link Filter',
        description: 'Control how links are handled in your server',
        type: 'select',
        value: 'untrusted',
        options: [
          { label: 'Allow all links', value: 'allow_all' },
          { label: 'Block untrusted links only', value: 'untrusted' },
          { label: 'Block all links', value: 'block_all' },
        ],
      },
      {
        id: 'spam_protection',
        name: 'Spam Protection',
        description: 'Prevent message spam and mention spam',
        type: 'toggle',
        value: true,
      },
      {
        id: 'log_channel',
        name: 'Moderation Log Channel',
        description: 'Channel where moderation actions will be logged',
        type: 'channel',
        value: '',
      },
      {
        id: 'auto_mute_duration',
        name: 'Auto-Mute Duration',
        description: 'Duration to mute users who trigger auto-mod (in minutes)',
        type: 'input',
        value: '15',
      },
      {
        id: 'ai_content_screening',
        name: 'AI Content Screening',
        description: 'Use advanced AI to detect toxic content, hate speech, and other harmful content',
        type: 'toggle',
        value: false,
        isPremium: true,
      },
    ],
  },
  'ai_assistant': {
    id: 'ai_assistant',
    name: 'AI Assistant',
    description: 'Configure AI assistant features and behavior',
    isPremium: true,
    settings: [
      {
        id: 'assistant_channels',
        name: 'Assistant Channels',
        description: 'Channels where the AI assistant will respond to messages',
        type: 'channel',
        value: [],
      },
      {
        id: 'default_model',
        name: 'Default AI Model',
        description: 'The AI model to use for responses',
        type: 'select',
        value: 'gpt-4o',
        options: [
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3.5', isPremium: true },
        ],
      },
      {
        id: 'persona',
        name: 'Assistant Persona',
        description: 'Customized personality for the AI assistant',
        type: 'textarea',
        value: 'You are AstroBot, a helpful and friendly Discord bot assistant. You are knowledgeable about gaming, tech, and Discord features.',
      },
      {
        id: 'trigger_mode',
        name: 'Activation Mode',
        description: 'How users can trigger the AI assistant',
        type: 'select',
        value: 'mention',
        options: [
          { label: 'Mention (@AstroBot)', value: 'mention' },
          { label: 'Command (/ask)', value: 'command' },
          { label: 'Automatic (all messages in selected channels)', value: 'auto', isPremium: true },
        ],
      },
      {
        id: 'image_generation',
        name: 'Image Generation',
        description: 'Allow users to generate images with DALL-E',
        type: 'toggle',
        value: true,
        isPremium: true,
      },
    ],
  },
  'welcome': {
    id: 'welcome',
    name: 'Welcome System',
    description: 'Configure welcome messages and member onboarding',
    isPremium: false,
    settings: [
      {
        id: 'welcome_channel',
        name: 'Welcome Channel',
        description: 'Channel where welcome messages will be sent',
        type: 'channel',
        value: '',
      },
      {
        id: 'welcome_message',
        name: 'Welcome Message',
        description: 'Message to send when a new user joins (use {user} for mention, {server} for server name)',
        type: 'textarea',
        value: 'Welcome {user} to {server}! We hope you enjoy your stay!',
      },
      {
        id: 'dm_welcome',
        name: 'Direct Message Welcome',
        description: 'Send a welcome message via DM to new members',
        type: 'toggle',
        value: false,
      },
      {
        id: 'dm_message',
        name: 'DM Welcome Message',
        description: 'Message to send via DM when a new user joins',
        type: 'textarea',
        value: 'Welcome to {server}! Check out our rules and get started in the #introduction channel!',
      },
      {
        id: 'auto_role',
        name: 'Auto Role',
        description: 'Role to automatically assign to new members',
        type: 'role',
        value: '',
      },
    ],
  },
};

export default function ModuleConfigPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const moduleId = params.moduleId as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [serverInfo, setServerInfo] = useState({ name: '' });
  const [moduleConfig, setModuleConfig] = useState<ModuleConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch server and module info
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Simulated API calls
      setTimeout(() => {
        setServerInfo({ name: 'Gaming Community' });
        
        // If we have a mock configuration for this module, use it
        if (MODULE_CONFIGS[moduleId]) {
          setModuleConfig(MODULE_CONFIGS[moduleId]);
        } else {
          // Default config for unknown modules
          setModuleConfig({
            id: moduleId,
            name: moduleId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            description: 'Configure module settings',
            isPremium: false,
            settings: [],
          });
        }
        
        setIsLoading(false);
      }, 1000);
    };
    
    fetchData();
  }, [moduleId]);
  
  // Update a setting value
  const updateSetting = (settingId: string, value: string | boolean | string[]) => {
    if (!moduleConfig) return;
    
    setModuleConfig({
      ...moduleConfig,
      settings: moduleConfig.settings.map(setting => 
        setting.id === settingId ? { ...setting, value } : setting
      ),
    });
    
    setHasChanges(true);
  };
  
  // Save changes
  const saveChanges = async () => {
    if (!moduleConfig) return;
    
    setIsSaving(true);
    
    // Simulated API call
    setTimeout(() => {
      setIsSaving(false);
      setHasChanges(false);
      // Here we would normally make an API request to save the changes
    }, 1500);
  };
  
  // Reset changes
  const resetChanges = () => {
    if (moduleId && MODULE_CONFIGS[moduleId]) {
      setModuleConfig(MODULE_CONFIGS[moduleId]);
      setHasChanges(false);
    }
  };
  
  // Render form controls based on setting type
  const renderSettingControl = (setting: ModuleSetting) => {
    switch (setting.type) {
      case 'toggle':
        return (
          <div className="flex items-center">
            <button
              onClick={() => updateSetting(setting.id, !setting.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                setting.value ? 'bg-blue-600' : 'bg-slate-700'
              } ${setting.isPremium && !moduleConfig?.isPremium ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={setting.isPremium && !moduleConfig?.isPremium}
            >
              <span className="sr-only">Toggle setting</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  setting.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              ></span>
            </button>
            
            {setting.isPremium && !moduleConfig?.isPremium && (
              <span className="ml-3 text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                Premium
              </span>
            )}
          </div>
        );
        
      case 'select':
        return (
          <select
            value={setting.value as string}
            onChange={e => updateSetting(setting.id, e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white w-full"
            disabled={setting.isPremium && !moduleConfig?.isPremium}
          >
            {setting.options?.map(option => (
              <option key={option.value} value={option.value} disabled={option.isPremium && !moduleConfig?.isPremium}>
                {option.label} {option.isPremium && !moduleConfig?.isPremium ? '(Premium)' : ''}
              </option>
            ))}
          </select>
        );
        
      case 'input':
        return (
          <input
            type="text"
            value={setting.value as string}
            onChange={e => updateSetting(setting.id, e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white w-full"
            disabled={setting.isPremium && !moduleConfig?.isPremium}
          />
        );
        
      case 'textarea':
        return (
          <textarea
            value={setting.value as string}
            onChange={e => updateSetting(setting.id, e.target.value)}
            rows={4}
            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white w-full"
            disabled={setting.isPremium && !moduleConfig?.isPremium}
          />
        );
        
      case 'channel':
        return (
          <select
            value={setting.value as string}
            onChange={e => updateSetting(setting.id, e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white w-full"
            disabled={setting.isPremium && !moduleConfig?.isPremium}
          >
            <option value="">Select channel</option>
            <option value="general">#general</option>
            <option value="welcome">#welcome</option>
            <option value="bot-commands">#bot-commands</option>
          </select>
        );
        
      case 'role':
        return (
          <select
            value={setting.value as string}
            onChange={e => updateSetting(setting.id, e.target.value)}
            className="bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-white w-full"
            disabled={setting.isPremium && !moduleConfig?.isPremium}
          >
            <option value="">Select role</option>
            <option value="member">@Member</option>
            <option value="moderator">@Moderator</option>
            <option value="admin">@Admin</option>
          </select>
        );
        
      default:
        return <p className="text-red-400">Unknown setting type</p>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!moduleConfig) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-white mb-2">Module Not Found</h3>
        <p className="text-slate-400 mb-6">
          The requested module could not be found.
        </p>
        <Link href={`/dashboard/servers/${serverId}`} className="text-blue-400 hover:text-blue-300">
          Back to Server
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href={`/dashboard/servers/${serverId}`} className="text-slate-400 hover:text-slate-300 mr-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {moduleConfig.name} - {serverInfo.name}
          </h1>
          {moduleConfig.isPremium && (
            <span className="ml-3 text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded">
              Premium Module
            </span>
          )}
        </div>
        
        <p className="text-slate-400 mb-6">
          {moduleConfig.description}
        </p>
        
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
          <div className="p-6">
            {moduleConfig.settings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-400">
                  No configurable settings for this module.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {moduleConfig.settings.map(setting => (
                  <div key={setting.id} className="border-b border-slate-700/50 pb-6 last:border-b-0 last:pb-0">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-grow">
                        <div className="flex items-center">
                          <h3 className="text-white font-medium">{setting.name}</h3>
                          {setting.isPremium && !moduleConfig.isPremium && (
                            <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                              Premium
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400 mt-1">{setting.description}</p>
                      </div>
                      
                      <div className="md:w-1/3">
                        {renderSettingControl(setting)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="px-6 py-4 bg-slate-800/80 border-t border-slate-700/50 flex justify-between items-center">
            <button
              onClick={resetChanges}
              disabled={!hasChanges || isSaving}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                !hasChanges || isSaving
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 hover:bg-slate-600 text-white'
              }`}
            >
              Reset Changes
            </button>
            
            <button
              onClick={saveChanges}
              disabled={!hasChanges || isSaving}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                !hasChanges || isSaving
                  ? 'bg-blue-600/50 text-blue-300/70 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 align-[-2px]"></span>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}