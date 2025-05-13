"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// Types for automation data
interface Automation {
  id: string;
  name: string;
  description: string;
  type: 'welcome' | 'moderation' | 'role' | 'message' | 'schedule' | 'custom';
  trigger: string;
  actions: string[];
  server?: {
    id: string;
    name: string;
  };
  enabled: boolean;
  runCount: number;
  lastRun: string | null;
}

// Mock automation data
const automaticActions: Automation[] = [
  {
    id: '1',
    name: 'Welcome New Members',
    description: 'Send a welcome message and assign a role to new members',
    type: 'welcome',
    trigger: 'Member joins server',
    actions: ['Send welcome message', 'Assign Member role'],
    server: {
      id: 'server1',
      name: 'Gaming Community'
    },
    enabled: true,
    runCount: 156,
    lastRun: '2025-05-10T15:36:12Z'
  },
  {
    id: '2',
    name: 'Auto Moderation',
    description: 'Detect and remove inappropriate content',
    type: 'moderation',
    trigger: 'Message contains banned words',
    actions: ['Delete message', 'Warn user', 'Log to moderation channel'],
    server: {
      id: 'server1',
      name: 'Gaming Community'
    },
    enabled: true,
    runCount: 37,
    lastRun: '2025-05-12T08:12:33Z'
  },
  {
    id: '3',
    name: 'Role Assignment',
    description: 'Assign roles based on reactions to a message',
    type: 'role',
    trigger: 'Reaction added to message',
    actions: ['Assign corresponding role', 'Send DM confirmation'],
    server: {
      id: 'server2',
      name: 'Developer Chat'
    },
    enabled: true,
    runCount: 89,
    lastRun: '2025-05-11T22:45:09Z'
  },
  {
    id: '4',
    name: 'Daily Announcement',
    description: 'Send a daily message to a specified channel',
    type: 'schedule',
    trigger: 'Every day at 9:00 AM',
    actions: ['Send message to #announcements'],
    server: {
      id: 'server2',
      name: 'Developer Chat'
    },
    enabled: false,
    runCount: 42,
    lastRun: '2025-05-09T09:00:03Z'
  },
  {
    id: '5',
    name: 'Custom Event Handler',
    description: 'Advanced automation with custom code',
    type: 'custom',
    trigger: 'Custom event: user reaches level 10',
    actions: ['Run custom JavaScript code', 'Log event'],
    server: {
      id: 'server1',
      name: 'Gaming Community'
    },
    enabled: true,
    runCount: 18,
    lastRun: '2025-05-11T14:22:56Z'
  }
];

export default function AutomationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);

  // Toggle automation enabled status
  const toggleAutomation = (id: string) => {
    // In production, this would call an API to update the automation status
    console.log(`Toggling automation with id: ${id}`);
  };

  // Filter automations based on criteria
  const filteredAutomations = automaticActions.filter(automation => {
    // Filter by search query
    if (searchQuery && !automation.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !automation.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by enabled status
    if (filterEnabled !== null && automation.enabled !== filterEnabled) {
      return false;
    }
    
    // Filter by type
    if (filterType && automation.type !== filterType) {
      return false;
    }
    
    return true;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 pb-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Automations</h1>
          <p className="text-slate-400 mt-1">Create and manage automated actions for your Discord bot</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/automations/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Automation
          </Link>
        </div>
      </div>

      {/* Search and filter */}
      <div className="p-6 pb-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search automations..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800/50 placeholder-slate-400 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType || ''}
              onChange={(e) => setFilterType(e.target.value || null)}
              className="px-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="welcome">Welcome</option>
              <option value="moderation">Moderation</option>
              <option value="role">Role</option>
              <option value="message">Message</option>
              <option value="schedule">Schedule</option>
              <option value="custom">Custom</option>
            </select>
            <select
              value={filterEnabled === null ? '' : filterEnabled.toString()}
              onChange={(e) => {
                if (e.target.value === '') {
                  setFilterEnabled(null);
                } else {
                  setFilterEnabled(e.target.value === 'true');
                }
              }}
              className="px-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800/50 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Automations table */}
      <div className="px-6">
        {filteredAutomations.length > 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-800/70">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Trigger</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Server</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Runs</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 bg-slate-800/20">
                  {filteredAutomations.map((automation) => (
                    <tr key={automation.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{automation.name}</div>
                          <div className="text-xs text-slate-400">{automation.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${getTypeColor(automation.type)}`}></span>
                          <span className="text-sm text-slate-300">{automation.trigger}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {automation.server?.name || 'All Servers'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-300">{automation.runCount}</div>
                        <div className="text-xs text-slate-500">
                          {automation.lastRun ? formatDate(automation.lastRun) : 'Never run'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button 
                            onClick={() => toggleAutomation(automation.id)}
                            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                              automation.enabled ? 'bg-green-500' : 'bg-slate-600'
                            }`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                              automation.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/dashboard/automations/${automation.id}`} className="text-blue-400 hover:text-blue-300 mr-4">
                          Edit
                        </Link>
                        <button className="text-red-400 hover:text-red-300">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-slate-700/50 mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No Automations Found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery || filterEnabled !== null || filterType
                ? 'No automations match your search criteria.'
                : 'You haven\'t created any automations yet.'}
            </p>
            <Link
              href="/dashboard/automations/new"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Automation
            </Link>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-6 pt-4">
        <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-800/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-300">About Automations</h3>
              <div className="mt-2 text-sm text-blue-200">
                <p>
                  Automations allow your bot to perform actions automatically based on events in your Discord server:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><span className="font-medium">Welcome Messages</span> - Greet new members and assign roles</li>
                  <li><span className="font-medium">Moderation</span> - Automatically monitor content and enforce rules</li>
                  <li><span className="font-medium">Role Management</span> - Assign and remove roles based on reactions or commands</li>
                  <li><span className="font-medium">Scheduled Messages</span> - Send regular announcements or reminders</li>
                </ul>
                <p className="mt-3">
                  Create custom automations to handle complex scenarios and make your server management easier.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getTypeColor(type: string): string {
  const colorMap: Record<string, string> = {
    welcome: 'bg-green-500',
    moderation: 'bg-red-500',
    role: 'bg-blue-500',
    message: 'bg-purple-500',
    schedule: 'bg-yellow-500',
    custom: 'bg-indigo-500'
  };
  
  return colorMap[type] || 'bg-gray-500';
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  // Format as "3 days ago" or similar
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (days < 7) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}