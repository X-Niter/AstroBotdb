/**
 * Discord Bot API Client
 * Provides functions to interact with the Discord bot API
 */

// API base URL (using environment variable or default to localhost)
const API_BASE_URL = process.env.DISCORD_BOT_API_URL || 'http://localhost:5000';

/**
 * Get headers for API requests, including authorization
 * @param token The session token for authorization
 * @returns The headers object with authorization
 */
function getHeaders(token: string | undefined) {
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

/**
 * Generic API request function
 * @param endpoint The API endpoint
 * @param method The HTTP method
 * @param token The session token
 * @param data Optional request body data
 * @returns The API response
 */
async function apiRequest<T>(
  endpoint: string, 
  method: string = 'GET',
  token?: string,
  data?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: getHeaders(token),
    body: data ? JSON.stringify(data) : undefined,
  };
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error || `API request failed: ${response.status} ${response.statusText}`
    );
  }
  
  return await response.json();
}

// Guilds

/**
 * Get all guilds the bot is in
 * @param token Session token
 * @returns Array of guild objects
 */
export async function getGuilds(token: string) {
  return apiRequest<any[]>('/guilds', 'GET', token);
}

/**
 * Get a specific guild by ID
 * @param guildId The guild ID
 * @param token Session token
 * @returns The guild object
 */
export async function getGuild(guildId: string, token: string) {
  return apiRequest<any>(`/guilds/${guildId}`, 'GET', token);
}

// Channels

/**
 * Get all channels in a guild
 * @param guildId The guild ID
 * @param token Session token
 * @returns Array of channel objects
 */
export async function getChannels(guildId: string, token: string) {
  return apiRequest<any[]>(`/guilds/${guildId}/channels`, 'GET', token);
}

/**
 * Get a specific channel by ID
 * @param guildId The guild ID
 * @param channelId The channel ID
 * @param token Session token
 * @returns The channel object
 */
export async function getChannel(guildId: string, channelId: string, token: string) {
  return apiRequest<any>(`/guilds/${guildId}/channels/${channelId}`, 'GET', token);
}

// Members

/**
 * Get members in a guild
 * @param guildId The guild ID
 * @param token Session token
 * @param options Optional query parameters
 * @returns Array of member objects
 */
export async function getMembers(
  guildId: string, 
  token: string,
  options?: { limit?: number; after?: string; search?: string; role?: string }
) {
  let endpoint = `/guilds/${guildId}/members`;
  
  // Add query parameters if provided
  if (options) {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.after) params.append('after', options.after);
    if (options.search) params.append('search', options.search);
    if (options.role) params.append('role', options.role);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
  }
  
  return apiRequest<any[]>(endpoint, 'GET', token);
}

/**
 * Get a specific member by ID
 * @param guildId The guild ID
 * @param memberId The member ID
 * @param token Session token
 * @returns The member object
 */
export async function getMember(guildId: string, memberId: string, token: string) {
  return apiRequest<any>(`/guilds/${guildId}/members/${memberId}`, 'GET', token);
}

// Roles

/**
 * Get all roles in a guild
 * @param guildId The guild ID
 * @param token Session token
 * @returns Array of role objects
 */
export async function getRoles(guildId: string, token: string) {
  return apiRequest<any[]>(`/guilds/${guildId}/roles`, 'GET', token);
}

/**
 * Get a specific role by ID
 * @param guildId The guild ID
 * @param roleId The role ID
 * @param token Session token
 * @returns The role object
 */
export async function getRole(guildId: string, roleId: string, token: string) {
  return apiRequest<any>(`/guilds/${guildId}/roles/${roleId}`, 'GET', token);
}

// Commands

/**
 * Get all commands
 * @param token Session token
 * @param options Optional query parameters
 * @returns Array of command objects
 */
export async function getCommands(
  token: string,
  options?: { guildId?: string; type?: number; name?: string }
) {
  let endpoint = '/commands';
  
  // Add query parameters if provided
  if (options) {
    const params = new URLSearchParams();
    if (options.guildId) params.append('guildId', options.guildId);
    if (options.type) params.append('type', options.type.toString());
    if (options.name) params.append('name', options.name);
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }
  }
  
  return apiRequest<any[]>(endpoint, 'GET', token);
}

/**
 * Get a specific command by ID
 * @param commandId The command ID
 * @param token Session token
 * @returns The command object
 */
export async function getCommand(commandId: string, token: string) {
  return apiRequest<any>(`/commands/${commandId}`, 'GET', token);
}

// Settings

/**
 * Get all settings for a guild
 * @param guildId The guild ID
 * @param token Session token
 * @returns The settings object
 */
export async function getSettings(guildId: string, token: string) {
  return apiRequest<any>(`/settings/${guildId}`, 'GET', token);
}

/**
 * Get settings for a specific module
 * @param guildId The guild ID
 * @param module The module name
 * @param token Session token
 * @returns The module settings
 */
export async function getModuleSettings(guildId: string, module: string, token: string) {
  return apiRequest<any>(`/settings/${guildId}?module=${module}`, 'GET', token);
}

/**
 * Update settings for a module
 * @param guildId The guild ID
 * @param module The module name
 * @param data The settings data
 * @param token Session token
 * @returns The updated settings
 */
export async function updateSettings(guildId: string, module: string, data: any, token: string) {
  return apiRequest<any>(`/settings/${guildId}`, 'POST', token, { module, data });
}

// Health check

/**
 * Check if the API is available
 * @returns True if the API is available
 */
export async function checkApiHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Export all functions as a single object for easier imports
export const DiscordBotApi = {
  getGuilds,
  getGuild,
  getChannels,
  getChannel,
  getMembers,
  getMember,
  getRoles,
  getRole,
  getCommands,
  getCommand,
  getSettings,
  getModuleSettings,
  updateSettings,
  checkApiHealth
};