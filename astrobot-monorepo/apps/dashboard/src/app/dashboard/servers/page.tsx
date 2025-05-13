"use client";

import React from 'react';
import Link from 'next/link';

// Placeholder type for server data
interface ServerData {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  botJoined: boolean;
  owner: boolean;
  added: string; // date string
}

export default function ServersPage() {
  // Example server data - in a real implementation this would come from an API
  const servers: ServerData[] = [];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 pb-0 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Discord Servers</h1>
          <p className="text-slate-400 mt-1">Manage your Discord servers with AstroBot</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/servers/add"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add to Server
          </Link>
          <button
            className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <div className="p-6">
        {servers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <div
                key={server.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden"
              >
                <div className="p-5 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {server.icon ? (
                      <img
                        src={server.icon}
                        alt={`${server.name} icon`}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {server.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-white truncate">
                      {server.name}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {server.memberCount.toLocaleString()} members
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      server.botJoined
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {server.botJoined ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="border-t border-slate-700/50 px-5 py-3 bg-slate-800/30">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                      Added on {server.added}
                    </span>
                    <Link
                      href={`/dashboard/servers/${server.id}`}
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Manage →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-slate-700/50 mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">No Discord Servers Yet</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Add AstroBot to your Discord servers to start managing them. You'll need to have the "Manage Server" permission.
            </p>
            <Link
              href="/dashboard/servers/add"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add to Server
            </Link>
          </div>
        )}
      </div>

      {/* Help section */}
      <div className="p-6 pt-0">
        <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-800/30">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-300">Managing Discord Servers</h3>
              <div className="mt-2 text-sm text-blue-200">
                <p>
                  To add AstroBot to a Discord server, you need to have the "Manage Server" permission. Once added, you'll be able to:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Configure bot permissions</li>
                  <li>Set up automated tasks and moderation</li>
                  <li>Create custom commands</li>
                  <li>View analytics and insights</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}