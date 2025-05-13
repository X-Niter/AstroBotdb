"use client";

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function DashboardPage() {
  const { data: session } = useSession();

  // Stats cards data
  const statsCards = [
    {
      title: 'Servers',
      value: '0',
      change: '+0%',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      href: '/dashboard/servers',
    },
    {
      title: 'Commands Used',
      value: '0',
      change: '+0%',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/dashboard/commands',
    },
    {
      title: 'Active Users',
      value: '0',
      change: '+0%',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      href: '/dashboard/analytics',
    },
    {
      title: 'Bot Updates',
      value: '0',
      change: '+0%',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      href: '/dashboard/ai',
    },
  ];

  // Quick actions
  const quickActions = [
    {
      title: 'Add to Server',
      description: 'Add AstroBot to a new Discord server',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      href: '/dashboard/servers/add',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Create Command',
      description: 'Create a custom Discord bot command',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
      ),
      href: '/dashboard/commands/new',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Developer Workspace',
      description: 'Develop, test, and deploy your bot',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/dashboard/ai',
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      title: 'View Analytics',
      description: 'Explore bot usage and statistics',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/dashboard/analytics',
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  return (
    <div>
      {/* Welcome header */}
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold text-white">
          Welcome, {session?.user?.name || 'User'}
        </h1>
        <p className="text-slate-400 mt-1">
          Manage and monitor your AstroBot Discord assistant
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {statsCards.map((card, index) => (
          <Link
            key={index}
            href={card.href}
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-blue-500/20 p-3 text-blue-400">
                {card.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-slate-400 truncate">
                    {card.title}
                  </dt>
                  <dd>
                    <div className="text-lg font-semibold text-white">
                      {card.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <div className="text-xs text-green-400">{card.change}</div>
              <div className="text-xs text-slate-400 ml-2">from last month</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="p-6 pt-0">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border border-slate-700/50 text-white ${action.color} transition-all transform hover:scale-[1.02]`}
            >
              <div className="rounded-full bg-white/20 p-3 mb-4">
                {action.icon}
              </div>
              <h3 className="text-lg font-medium">{action.title}</h3>
              <p className="text-sm opacity-90 text-center mt-1">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Getting started */}
      <div className="p-6">
        <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 backdrop-blur-sm border border-blue-900/50 rounded-xl p-6">
          <div className="flex flex-col md:flex-row items-start">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-2">Getting Started with AstroBot</h2>
              <p className="text-blue-100 mb-4">
                Follow these steps to set up your Discord bot and start using its powerful features.
              </p>

              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 bg-blue-500 rounded-full text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div className="ml-3">
                    <h3 className="text-white font-medium">Add AstroBot to a server</h3>
                    <p className="text-blue-200 text-sm">
                      Add the bot to your Discord server to start using its features.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 bg-blue-500 rounded-full text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div className="ml-3">
                    <h3 className="text-white font-medium">Configure your bot's settings</h3>
                    <p className="text-blue-200 text-sm">
                      Customize permissions and channel settings to suit your server's needs.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 bg-blue-500 rounded-full text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <div className="ml-3">
                    <h3 className="text-white font-medium">Create custom commands</h3>
                    <p className="text-blue-200 text-sm">
                      Build custom commands for your server members using our command builder.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 mt-6 md:mt-0 md:ml-6">
              <Link
                href="/dashboard/servers/add"
                className="inline-flex items-center px-5 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Bot to Server
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}