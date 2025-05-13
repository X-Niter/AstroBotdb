"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// Command type definition
interface Command {
  id: string;
  name: string;
  description: string;
  type: 'slash' | 'prefix' | 'context' | 'button';
  usage: string;
  server?: {
    id: string;
    name: string;
  };
  created: string;
  usageCount: number;
  enabled: boolean;
}

// Mock command data (this would come from an API in production)
const COMMAND_TEMPLATES: Command[] = [
  {
    id: '1',
    name: 'help',
    description: 'Show a list of available commands',
    type: 'slash',
    usage: '/help [command]',
    created: '2025-04-10',
    usageCount: 125,
    enabled: true,
  },
  {
    id: '2',
    name: 'ping',
    description: 'Check the bot\'s latency',
    type: 'slash',
    usage: '/ping',
    created: '2025-04-10',
    usageCount: 78,
    enabled: true,
  },
  {
    id: '3',
    name: 'ban',
    description: 'Ban a user from the server',
    type: 'slash',
    usage: '/ban @user [reason]',
    created: '2025-04-12',
    usageCount: 12,
    enabled: true,
  },
  {
    id: '4',
    name: 'poll',
    description: 'Create a poll for users to vote on',
    type: 'slash',
    usage: '/poll "question" "option1" "option2" [options...]',
    created: '2025-04-15',
    usageCount: 48,
    enabled: true,
  },
  {
    id: '5',
    name: 'role',
    description: 'Assign or remove a role from a user',
    type: 'slash',
    usage: '/role add/remove @user @role',
    created: '2025-04-16',
    usageCount: 63,
    enabled: false,
  },
];

// Command categories
const categories = [
  { id: 'all', name: 'All Commands' },
  { id: 'moderation', name: 'Moderation' },
  { id: 'utility', name: 'Utility' },
  { id: 'fun', name: 'Fun' },
  { id: 'custom', name: 'Custom' },
];

export default function CommandsPage() {
  const [commands] = useState<Command[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);

  // Toggle command enabled status
  const toggleCommand = (id: string) => {
    // In production, this would call an API to update the command status
    console.log(`Toggling command with id: ${id}`);
  };

  // Filter commands based on category and search query
  const filteredCommands = [...commands, ...(showTemplates ? COMMAND_TEMPLATES : [])].filter(command => {
    // Filter by search query
    if (searchQuery && !command.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !command.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Filter by category (just a demo - in production would use actual categories)
    if (activeCategory !== 'all') {
      // This is a simplified version - in production you'd have proper categorization
      const categoryMap: Record<string, string[]> = {
        moderation: ['ban', 'kick', 'mute', 'timeout'],
        utility: ['help', 'ping', 'role'],
        fun: ['poll', 'dice', 'joke'],
        custom: []
      };
      
      if (categoryMap[activeCategory] && !categoryMap[activeCategory].includes(command.name)) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 pb-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bot Commands</h1>
          <p className="text-slate-400 mt-1">Create and manage Discord bot commands</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/commands/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Command
          </Link>
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            {showTemplates ? 'Hide Templates' : 'Show Templates'}
          </button>
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
                placeholder="Search commands..."
                className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-md leading-5 bg-slate-800/50 placeholder-slate-400 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Commands table */}
      <div className="px-6">
        {filteredCommands.length > 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-800/70">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Command</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Usage</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Uses</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50 bg-slate-800/20">
                  {filteredCommands.map((command) => (
                    <tr key={command.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">{command.name}</div>
                          <div className="text-sm text-slate-400">{command.description}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {command.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                        {command.usage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                        {command.usageCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <button 
                            onClick={() => toggleCommand(command.id)}
                            className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                              command.enabled ? 'bg-green-500' : 'bg-slate-600'
                            }`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                              command.enabled ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                          <span className="ml-2 text-xs text-slate-400">
                            {command.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/dashboard/commands/${command.id}`} className="text-blue-400 hover:text-blue-300">
                          Edit
                        </Link>
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
            <h3 className="text-xl font-medium text-white mb-2">No Commands Found</h3>
            <p className="text-slate-400 mb-6">
              {searchQuery ? 'No commands match your search criteria.' : 'You haven\'t created any commands yet.'}
            </p>
            <Link
              href="/dashboard/commands/new"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Your First Command
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
              <h3 className="text-lg font-medium text-blue-300">About Discord Commands</h3>
              <div className="mt-2 text-sm text-blue-200">
                <p>
                  Discord commands allow users to interact with your bot. There are several types:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><span className="font-medium">Slash Commands (/command)</span> - Application commands that appear in the Discord UI</li>
                  <li><span className="font-medium">Prefix Commands (!command)</span> - Traditional text commands that use a prefix</li>
                  <li><span className="font-medium">Context Menu Commands</span> - Commands that appear in right-click menus</li>
                  <li><span className="font-medium">Button Interactions</span> - Interactive buttons in Discord messages</li>
                </ul>
                <p className="mt-3">
                  Use the template commands to get started quickly, or create your own custom commands.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}