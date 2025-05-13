"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// Types for analytics data
interface CommandUsage {
  name: string;
  uses: number;
  color: string;
}

interface ServerActivity {
  serverId: string;
  serverName: string;
  messages: number;
  commands: number;
  users: number;
}

interface DailyActivity {
  date: string;
  commands: number;
  messages: number;
}

// Mock data for command usage
const commandUsageData: CommandUsage[] = [
  { name: 'help', uses: 156, color: '#4C51BF' },
  { name: 'ping', uses: 98, color: '#6366F1' },
  { name: 'ban', uses: 27, color: '#8B5CF6' },
  { name: 'poll', uses: 76, color: '#EC4899' },
  { name: 'role', uses: 42, color: '#F43F5E' },
  { name: 'play', uses: 134, color: '#F59E0B' },
  { name: 'skip', uses: 87, color: '#10B981' },
  { name: 'queue', uses: 65, color: '#14B8A6' },
];

// Mock data for server activity
const serverActivityData: ServerActivity[] = [
  { serverId: '1', serverName: 'Gaming Community', messages: 3456, commands: 245, users: 142 },
  { serverId: '2', serverName: 'Developer Chat', messages: 2134, commands: 156, users: 87 },
  { serverId: '3', serverName: 'Study Group', messages: 1876, commands: 98, users: 65 },
  { serverId: '4', serverName: 'Movie Club', messages: 1245, commands: 76, users: 43 },
];

// Mock data for daily activity
const dailyActivityData: DailyActivity[] = [
  { date: '2025-05-01', commands: 75, messages: 450 },
  { date: '2025-05-02', commands: 85, messages: 520 },
  { date: '2025-05-03', commands: 92, messages: 610 },
  { date: '2025-05-04', commands: 78, messages: 580 },
  { date: '2025-05-05', commands: 103, messages: 670 },
  { date: '2025-05-06', commands: 110, messages: 720 },
  { date: '2025-05-07', commands: 135, messages: 830 },
  { date: '2025-05-08', commands: 125, messages: 790 },
  { date: '2025-05-09', commands: 145, messages: 850 },
  { date: '2025-05-10', commands: 160, messages: 910 },
  { date: '2025-05-11', commands: 155, messages: 890 },
  { date: '2025-05-12', commands: 170, messages: 940 },
];

// Time periods for filtering
const timePeriods = [
  { id: 'today', name: 'Today' },
  { id: '7days', name: 'Last 7 Days' },
  { id: '30days', name: 'Last 30 Days' },
  { id: 'all', name: 'All Time' },
];

export default function AnalyticsPage() {
  const [timePeriod, setTimePeriod] = useState('7days');

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 pb-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Bot Analytics</h1>
          <p className="text-slate-400 mt-1">Monitor your bot's usage and performance</p>
        </div>
        <div className="flex">
          <div className="flex space-x-2 bg-slate-800/70 rounded-md p-1">
            {timePeriods.map((period) => (
              <button
                key={period.id}
                onClick={() => setTimePeriod(period.id)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timePeriod === period.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
        {/* Total Servers */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Total Servers</p>
              <p className="text-2xl font-semibold text-white mt-2">12</p>
            </div>
            <div className="h-12 w-12 bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-400 text-xs font-medium flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +2
            </span>
            <span className="text-slate-400 text-xs ml-2">vs. last period</span>
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Active Users</p>
              <p className="text-2xl font-semibold text-white mt-2">2,457</p>
            </div>
            <div className="h-12 w-12 bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-400 text-xs font-medium flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +176
            </span>
            <span className="text-slate-400 text-xs ml-2">vs. last period</span>
          </div>
        </div>

        {/* Commands Used */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Commands Used</p>
              <p className="text-2xl font-semibold text-white mt-2">18,293</p>
            </div>
            <div className="h-12 w-12 bg-purple-900/30 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-400 text-xs font-medium flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +1,456
            </span>
            <span className="text-slate-400 text-xs ml-2">vs. last period</span>
          </div>
        </div>

        {/* Messages Processed */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6">
          <div className="flex justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">Messages Processed</p>
              <p className="text-2xl font-semibold text-white mt-2">129,548</p>
            </div>
            <div className="h-12 w-12 bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-center">
            <span className="text-green-400 text-xs font-medium flex items-center">
              <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              +8,721
            </span>
            <span className="text-slate-400 text-xs ml-2">vs. last period</span>
          </div>
        </div>
      </div>

      {/* Charts and Data Section */}
      <div className="p-6 pt-0 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Activity Over Time</h2>
          </div>
          <div className="p-6">
            {/* Simulated chart using divs */}
            <div className="bg-slate-900/70 rounded-lg p-6 h-[300px] flex items-end space-x-2">
              {dailyActivityData.map((day, i) => (
                <div key={i} className="h-full flex flex-col justify-end items-center flex-1">
                  <div className="w-full flex flex-col space-y-1">
                    <div 
                      className="bg-blue-500 rounded-t"
                      style={{ height: `${(day.commands / 200) * 100}%` }}
                    ></div>
                    <div 
                      className="bg-purple-500 rounded-t"
                      style={{ height: `${(day.messages / 1000) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-slate-500 text-xs mt-2 rotate-45 origin-top-left">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center space-x-4">
              <div className="flex items-center">
                <div className="h-3 w-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-slate-400">Commands</span>
              </div>
              <div className="flex items-center">
                <div className="h-3 w-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-sm text-slate-400">Messages</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Commands */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Top Commands</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {commandUsageData.map((cmd, i) => (
                <div key={i} className="bg-slate-900/70 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-mono text-sm font-medium text-white">/{cmd.name}</span>
                    <span className="text-slate-400 text-sm">{cmd.uses.toLocaleString()} uses</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${(cmd.uses / commandUsageData[0].uses) * 100}%`,
                        backgroundColor: cmd.color 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Server Performance */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Server Performance</h2>
            <Link 
              href="/dashboard/servers"
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              View All
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-800/70">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Server</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Users</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Messages</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Commands</th>
                </tr>
              </thead>
              <tbody className="bg-slate-900/20 divide-y divide-slate-700/50">
                {serverActivityData.map((server, i) => (
                  <tr key={i} className="hover:bg-slate-700/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{server.serverName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{server.users.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{server.messages.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-slate-400 text-sm mr-2">{server.commands.toLocaleString()}</span>
                        <div className="h-1.5 w-16 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full" 
                            style={{ width: `${(server.commands / 300) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Growth & Metrics */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold text-white">Growth & Metrics</h2>
          </div>
          <div className="p-6 grid grid-cols-2 gap-6">
            <div className="bg-slate-900/70 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-1">Message Activity</h3>
              <p className="text-xl font-semibold text-white">6,543</p>
              <div className="flex items-center mt-2">
                <span className="text-green-400 text-xs font-medium flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  12.5%
                </span>
              </div>
            </div>

            <div className="bg-slate-900/70 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-1">New Users</h3>
              <p className="text-xl font-semibold text-white">342</p>
              <div className="flex items-center mt-2">
                <span className="text-green-400 text-xs font-medium flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  7.2%
                </span>
              </div>
            </div>

            <div className="bg-slate-900/70 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-1">Engagement Rate</h3>
              <p className="text-xl font-semibold text-white">24.8%</p>
              <div className="flex items-center mt-2">
                <span className="text-green-400 text-xs font-medium flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  3.1%
                </span>
              </div>
            </div>

            <div className="bg-slate-900/70 rounded-lg p-4">
              <h3 className="text-sm font-medium text-slate-400 mb-1">Avg. Response Time</h3>
              <p className="text-xl font-semibold text-white">248ms</p>
              <div className="flex items-center mt-2">
                <span className="text-green-400 text-xs font-medium flex items-center">
                  <svg className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  5.3%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}