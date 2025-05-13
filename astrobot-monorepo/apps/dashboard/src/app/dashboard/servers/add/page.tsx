"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Placeholder type for server data
interface ServerData {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  botJoined: boolean;
  owner: boolean;
  permissions: string[];
}

// Empty placeholder servers for now
const PLACEHOLDER_SERVERS: ServerData[] = [];

export default function AddServerPage() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<ServerData[]>(PLACEHOLDER_SERVERS);
  const [selectedServer, setSelectedServer] = useState<string | null>(searchParams.get('id'));
  const [inviteLink, setInviteLink] = useState<string>('');

  // Function to handle fetching available servers (to be implemented with actual API)
  const fetchAvailableServers = async () => {
    setLoading(true);
    try {
      // In the future, we'll fetch real data from Discord
      // Using placeholder data for now
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching servers:', error);
      setLoading(false);
    }
  };

  // Generate Discord bot invite link
  const generateInviteLink = () => {
    if (!selectedServer) return;

    // Replace with actual client ID and required permissions
    const CLIENT_ID = '1234567890123456789'; // This would come from environment variables
    const requiredPermissions = [
      'MANAGE_GUILD',
      'MANAGE_ROLES',
      'MANAGE_CHANNELS',
      'KICK_MEMBERS',
      'BAN_MEMBERS',
      'READ_MESSAGES',
      'SEND_MESSAGES',
      'MANAGE_MESSAGES',
      'EMBED_LINKS',
      'ATTACH_FILES',
      'READ_MESSAGE_HISTORY',
      'ADD_REACTIONS'
    ];
    
    // Calculate permission integer based on Discord's documentation
    const PERMISSIONS = '8'; // Administrator permissions for now; in production we'd calculate based on individual permissions
    
    // Create the OAuth URL
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&permissions=${PERMISSIONS}&scope=bot%20applications.commands&guild_id=${selectedServer}&disable_guild_select=true`;
    
    setInviteLink(inviteUrl);
  };

  // When server selection changes, update the invite link
  useEffect(() => {
    if (selectedServer) {
      generateInviteLink();
    } else {
      setInviteLink('');
    }
  }, [selectedServer]);

  // Load servers when component mounts
  useEffect(() => {
    fetchAvailableServers();
  }, []);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Add to Server</h1>
          <p className="text-slate-400 mt-1">Select a server to add AstroBot to</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/servers"
            className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Servers
          </Link>
          <button
            onClick={fetchAvailableServers}
            className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors"
            disabled={loading}
          >
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? 'Refreshing...' : 'Refresh Servers'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Server Selection */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white">Step 1: Select a Server</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center space-y-4 py-8">
                <div className="w-10 h-10 border-t-2 border-blue-500 border-l-2 rounded-full animate-spin"></div>
                <p className="text-slate-300">Loading your Discord servers...</p>
              </div>
            ) : servers.length > 0 ? (
              <div className="space-y-4">
                <p className="text-slate-300 mb-4">Select a server from the list below:</p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {servers.map((server) => (
                    <button
                      key={server.id}
                      onClick={() => setSelectedServer(server.id)}
                      className={`flex items-center w-full p-3 rounded-lg transition-colors ${
                        selectedServer === server.id
                          ? 'bg-blue-900/30 border border-blue-700/50'
                          : 'bg-slate-700/50 border border-slate-600/30 hover:bg-slate-700'
                      }`}
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-slate-600 flex items-center justify-center">
                        {server.icon ? (
                          <img src={server.icon} alt={`${server.name} icon`} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-white">{server.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="ml-3 flex-1 text-left">
                        <h3 className="text-white font-medium">{server.name}</h3>
                        <p className="text-sm text-slate-400">
                          {server.owner ? 'Server Owner' : 'Server Member'} • {server.memberCount.toLocaleString()} members
                        </p>
                      </div>
                      {selectedServer === server.id && (
                        <div className="ml-3">
                          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-slate-700/50 mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">No Available Servers</h3>
                <p className="text-slate-400 mb-6">
                  We couldn't find any Discord servers that you can add AstroBot to. Make sure you have the "Manage Server" permission.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={fetchAvailableServers}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Servers
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bot Permissions */}
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-700/50">
            <h2 className="text-xl font-semibold text-white">Step 2: Authorize AstroBot</h2>
          </div>
          <div className="p-6">
            {selectedServer ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-white mb-2">Required Permissions</h3>
                  <p className="text-slate-300 mb-4">
                    AstroBot needs the following permissions to function properly:
                  </p>
                  <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="text-white font-medium">Send Messages & Read Message History</span>
                        <p className="text-sm text-slate-400">Allows AstroBot to read and respond to messages</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="text-white font-medium">Manage Roles</span>
                        <p className="text-sm text-slate-400">Required for auto-role assignment and moderation</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="text-white font-medium">Manage Messages</span>
                        <p className="text-sm text-slate-400">Allows moderation features like message deletion</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <span className="text-white font-medium">Application Commands</span>
                        <p className="text-sm text-slate-400">Enables slash commands and UI interactions</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 71 55" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z" fill="#ffffff"/>
                    </svg>
                    Add to Discord
                  </a>
                  <p className="text-sm text-slate-400 mt-4">
                    You'll be redirected to Discord to authorize AstroBot with the selected permissions.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-slate-700/50 mb-4 opacity-60">
                  <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-slate-500 mb-2">Select a Server First</h3>
                <p className="text-slate-400">
                  Please select a server from the list to continue
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help section */}
      <div className="mt-8 bg-blue-900/20 backdrop-blur-sm rounded-xl p-6 border border-blue-800/30">
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
            <h3 className="text-lg font-medium text-blue-300">Need Help?</h3>
            <div className="mt-2 text-sm text-blue-200">
              <p>
                If you're having trouble adding AstroBot to your server, check the following:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>You must have the "Manage Server" permission on the Discord server</li>
                <li>Make sure you're logged in to the correct Discord account</li>
                <li>Some features require specific permissions to work properly</li>
              </ul>
              <p className="mt-3">
                Still having issues? <Link href="/support" className="text-blue-300 underline">Contact our support team</Link> for assistance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}