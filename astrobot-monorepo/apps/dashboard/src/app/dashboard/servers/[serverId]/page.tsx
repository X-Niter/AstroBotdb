"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

type FeatureModule = {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  isPremium: boolean;
  icon: React.ReactNode;
};

export default function ServerManagementPage() {
  const params = useParams();
  const serverId = params.serverId;
  
  const [isLoading, setIsLoading] = useState(true);
  const [serverInfo, setServerInfo] = useState({
    id: '',
    name: '',
    icon: null,
    memberCount: 0,
    owner: false,
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [featureModules, setFeatureModules] = useState<FeatureModule[]>([]);
  
  // Fetch server info and modules (simulated)
  useEffect(() => {
    const fetchServerInfo = async () => {
      setIsLoading(true);
      
      // Simulated API call
      setTimeout(() => {
        setServerInfo({
          id: serverId as string,
          name: 'Gaming Community',
          icon: null,
          memberCount: 342,
          owner: true,
        });
        
        setFeatureModules([
          {
            id: 'moderation',
            name: 'Moderation',
            description: 'Automated content filtering, anti-spam, and moderation tools',
            enabled: true,
            isPremium: false,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            ),
          },
          {
            id: 'ai_assistant',
            name: 'AI Assistant',
            description: 'AI-powered conversation and assistance using GPT-4o and Claude 3.5',
            enabled: true,
            isPremium: true,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            ),
          },
          {
            id: 'welcome',
            name: 'Welcome System',
            description: 'Customizable welcome messages and member onboarding',
            enabled: true,
            isPremium: false,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            ),
          },
          {
            id: 'games',
            name: 'Gaming Integrations',
            description: 'Game stats, Minecraft server integration, and tournament tools',
            enabled: false,
            isPremium: false,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            ),
          },
          {
            id: 'music',
            name: 'Music & Media',
            description: 'Music playback, playlist management, and audio effects',
            enabled: false,
            isPremium: false,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            ),
          },
          {
            id: 'levels',
            name: 'Leveling System',
            description: 'Member activity tracking, XP, and customizable rewards',
            enabled: false,
            isPremium: true,
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ),
          },
        ]);
        
        setIsLoading(false);
      }, 1000);
    };
    
    fetchServerInfo();
  }, [serverId]);
  
  const toggleFeatureModule = (moduleId: string) => {
    setFeatureModules(prev => 
      prev.map(module => 
        module.id === moduleId 
          ? { ...module, enabled: !module.enabled } 
          : module
      )
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/dashboard/servers" className="text-slate-400 hover:text-slate-300 mr-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-white">{serverInfo.name}</h1>
        </div>
      
        <div className="border border-slate-700/50 rounded-lg overflow-hidden">
          <div className="flex border-b border-slate-700/50">
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'bg-slate-700/50 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'modules'
                  ? 'bg-slate-700/50 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
              onClick={() => setActiveTab('modules')}
            >
              Modules
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'commands'
                  ? 'bg-slate-700/50 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
              onClick={() => setActiveTab('commands')}
            >
              Commands
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'logs'
                  ? 'bg-slate-700/50 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
              onClick={() => setActiveTab('logs')}
            >
              Logs
            </button>
            <button
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === 'settings'
                  ? 'bg-slate-700/50 text-white border-b-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-slate-800/50'
              }`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
          </div>
          
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-400 mb-1">Commands Used Today</h3>
                    <p className="text-3xl font-bold text-white">47</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-400 mb-1">Active Modules</h3>
                    <p className="text-3xl font-bold text-white">
                      {featureModules.filter(m => m.enabled).length}/{featureModules.length}
                    </p>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50">
                    <h3 className="text-sm font-medium text-slate-400 mb-1">Auto-Mod Actions</h3>
                    <p className="text-3xl font-bold text-white">12</p>
                  </div>
                </div>
                
                <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 mb-6">
                  <h3 className="text-lg font-medium text-white mb-3">Recent Activity</h3>
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="flex items-start p-2 rounded-md hover:bg-slate-700/30">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                          <span className="text-slate-300 text-xs">U{item}</span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-slate-300">
                            <span className="font-medium">User{item}</span> used command{' '}
                            <span className="font-mono text-xs bg-slate-700/50 px-1.5 py-0.5 rounded">
                              /help
                            </span>
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(Date.now() - item * 60000).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-5">
                  <h3 className="text-lg font-medium text-white mb-2">Get More from AstroBot</h3>
                  <p className="text-sm text-blue-200 mb-4">
                    Upgrade to Premium to unlock advanced features like AI image generation, 
                    leveling system, and advanced analytics.
                  </p>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md">
                    Upgrade to Premium
                  </button>
                </div>
              </div>
            )}
            
            {activeTab === 'modules' && (
              <div>
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-white mb-1">Bot Modules</h3>
                  <p className="text-sm text-slate-400">
                    Enable or disable features to customize AstroBot for your server.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featureModules.map((module) => (
                    <div key={module.id} className="border border-slate-700/50 rounded-lg p-4 bg-slate-800/40">
                      <div className="flex justify-between">
                        <div className="flex items-center">
                          <div className={`p-2 rounded-md ${module.enabled ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700/50 text-slate-400'}`}>
                            {module.icon}
                          </div>
                          <div className="ml-3">
                            <div className="flex items-center">
                              <h4 className="font-medium text-white">{module.name}</h4>
                              {module.isPremium && (
                                <span className="ml-2 text-xs px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded">
                                  Premium
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-400 mt-0.5">{module.description}</p>
                          </div>
                        </div>
                        
                        <div className="ml-4 flex items-center">
                          <button
                            onClick={() => toggleFeatureModule(module.id)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                              module.enabled ? 'bg-blue-600' : 'bg-slate-700'
                            }`}
                          >
                            <span className="sr-only">Toggle module</span>
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                                module.enabled ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            ></span>
                          </button>
                        </div>
                      </div>
                      
                      {module.enabled && (
                        <div className="mt-3 pt-3 border-t border-slate-700/30">
                          <Link
                            href={`/dashboard/servers/${serverId}/modules/${module.id}`}
                            className="text-sm text-blue-400 hover:text-blue-300 inline-flex items-center"
                          >
                            Configure
                            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeTab === 'commands' && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Command Configuration</h3>
                <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                  This feature is coming soon. You'll be able to customize command prefixes,
                  disable specific commands, and set per-channel permissions.
                </p>
                <button className="px-4 py-2 bg-slate-700 text-white rounded-md text-sm cursor-not-allowed opacity-70">
                  Coming Soon
                </button>
              </div>
            )}
            
            {activeTab === 'logs' && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Server Logs</h3>
                <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                  This feature is coming soon. You'll be able to view detailed logs of bot 
                  activity, moderation actions, and command usage.
                </p>
                <button className="px-4 py-2 bg-slate-700 text-white rounded-md text-sm cursor-not-allowed opacity-70">
                  Coming Soon
                </button>
              </div>
            )}
            
            {activeTab === 'settings' && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-700/50 mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Server Settings</h3>
                <p className="text-slate-400 mb-6 max-w-lg mx-auto">
                  This feature is coming soon. You'll be able to configure general bot settings,
                  manage permissions, and customize the bot's behavior.
                </p>
                <button className="px-4 py-2 bg-slate-700 text-white rounded-md text-sm cursor-not-allowed opacity-70">
                  Coming Soon
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}