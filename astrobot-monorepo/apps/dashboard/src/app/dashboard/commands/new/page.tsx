"use client";

import React, { useState } from 'react';
import Link from 'next/link';

// Argument type for command
interface CommandArgument {
  name: string;
  description: string;
  type: 'string' | 'integer' | 'boolean' | 'user' | 'channel' | 'role';
  required: boolean;
}

// Command option type
interface CommandOption {
  name: string;
  description: string;
  value: string;
}

export default function NewCommandPage() {
  // Command basic info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [commandType, setCommandType] = useState<'slash' | 'prefix' | 'context' | 'button'>('slash');
  const [category, setCategory] = useState('utility');
  const [serverSpecific, setServerSpecific] = useState(false);
  const [selectedServer, setSelectedServer] = useState('');
  
  // Slash command arguments
  const [arguments_, setArguments] = useState<CommandArgument[]>([]);
  const [newArgName, setNewArgName] = useState('');
  const [newArgDescription, setNewArgDescription] = useState('');
  const [newArgType, setNewArgType] = useState<CommandArgument['type']>('string');
  const [newArgRequired, setNewArgRequired] = useState(false);
  
  // Command options (like choices for arguments)
  const [options, setOptions] = useState<CommandOption[]>([]);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionDescription, setNewOptionDescription] = useState('');
  const [newOptionValue, setNewOptionValue] = useState('');
  
  // Command response
  const [responseType, setResponseType] = useState<'text' | 'embed' | 'components'>('text');
  const [responseContent, setResponseContent] = useState('');
  const [embedColor, setEmbedColor] = useState('#5865F2');
  const [embedTitle, setEmbedTitle] = useState('');
  
  // Command code (for custom commands)
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [customCode, setCustomCode] = useState('// Custom JavaScript code for advanced command behavior\n\nmodule.exports = async (client, interaction) => {\n  // Your code here\n  await interaction.reply({ content: "Hello from custom command code!" });\n}');
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // This would be an API call in a real implementation
    console.log({
      name,
      description,
      type: commandType,
      category,
      serverSpecific,
      selectedServer: serverSpecific ? selectedServer : null,
      arguments: arguments_,
      options,
      response: {
        type: responseType,
        content: responseContent,
        embed: responseType === 'embed' ? {
          color: embedColor,
          title: embedTitle
        } : null
      },
      useCustomCode,
      customCode: useCustomCode ? customCode : null
    });
    
    // Mock success message
    alert('Command created successfully!');
  };
  
  // Add a new argument
  const addArgument = () => {
    if (!newArgName || !newArgDescription) return;
    
    setArguments([
      ...arguments_,
      {
        name: newArgName,
        description: newArgDescription,
        type: newArgType,
        required: newArgRequired
      }
    ]);
    
    // Reset input fields
    setNewArgName('');
    setNewArgDescription('');
    setNewArgType('string');
    setNewArgRequired(false);
  };
  
  // Remove an argument
  const removeArgument = (index: number) => {
    setArguments(arguments_.filter((_, i) => i !== index));
  };
  
  // Add a new option
  const addOption = () => {
    if (!newOptionName || !newOptionValue) return;
    
    setOptions([
      ...options,
      {
        name: newOptionName,
        description: newOptionDescription,
        value: newOptionValue
      }
    ]);
    
    // Reset input fields
    setNewOptionName('');
    setNewOptionDescription('');
    setNewOptionValue('');
  };
  
  // Remove an option
  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Create Command</h1>
          <p className="text-slate-400 mt-1">Define a new bot command for your Discord server</p>
        </div>
        <Link
          href="/dashboard/commands"
          className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Commands
        </Link>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/70">
                <h2 className="text-lg font-semibold text-white">Basic Information</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                      Command Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="help"
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      {commandType === 'slash' ? 'The name to use after the / character' : 'The name of your command'}
                    </p>
                  </div>
                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-slate-300 mb-2">
                      Command Type*
                    </label>
                    <select
                      id="type"
                      value={commandType}
                      onChange={(e) => setCommandType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="slash">Slash Command (/command)</option>
                      <option value="prefix">Prefix Command (!command)</option>
                      <option value="context">Context Menu (Right Click)</option>
                      <option value="button">Button Interaction</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-400">
                      How users will interact with this command
                    </p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-2">
                    Description*
                  </label>
                  <input
                    type="text"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Displays a list of available commands"
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Short description of what the command does
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-slate-300 mb-2">
                      Category
                    </label>
                    <select
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="utility">Utility</option>
                      <option value="moderation">Moderation</option>
                      <option value="fun">Fun</option>
                      <option value="economy">Economy</option>
                      <option value="music">Music</option>
                      <option value="custom">Custom</option>
                    </select>
                    <p className="mt-1 text-xs text-slate-400">
                      Helps organize commands by functionality
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="server-specific" className="text-sm font-medium text-slate-300">
                        Server Specific
                      </label>
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={() => setServerSpecific(!serverSpecific)}
                          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                            serverSpecific ? 'bg-blue-600' : 'bg-slate-600'
                          }`}
                        >
                          <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                            serverSpecific ? 'translate-x-5' : 'translate-x-0'
                          }`} />
                        </button>
                      </div>
                    </div>
                    
                    {serverSpecific && (
                      <select
                        id="server"
                        value={selectedServer}
                        onChange={(e) => setSelectedServer(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a server</option>
                        <option value="server1">My Gaming Server</option>
                        <option value="server2">Community Hub</option>
                        <option value="server3">Developer Chat</option>
                      </select>
                    )}
                    
                    <p className="mt-1 text-xs text-slate-400">
                      Limit this command to a specific server
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Command Arguments */}
            {commandType === 'slash' && (
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/70">
                  <h2 className="text-lg font-semibold text-white">Command Arguments</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4 mb-6">
                    {arguments_.length > 0 ? (
                      <div className="overflow-hidden bg-slate-700/30 rounded-lg">
                        <table className="min-w-full divide-y divide-slate-700/50">
                          <thead>
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Description</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Required</th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-700/50">
                            {arguments_.map((arg, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3 text-sm text-white">{arg.name}</td>
                                <td className="px-4 py-3 text-sm text-slate-300">{arg.description}</td>
                                <td className="px-4 py-3 text-sm text-slate-300">{arg.type}</td>
                                <td className="px-4 py-3 text-sm text-slate-300">{arg.required ? 'Yes' : 'No'}</td>
                                <td className="px-4 py-3 text-right text-sm font-medium">
                                  <button
                                    type="button"
                                    onClick={() => removeArgument(index)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-slate-400 bg-slate-700/30 rounded-lg">
                        No arguments added yet
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-slate-700/30 rounded-lg p-4 space-y-4">
                    <h3 className="text-sm font-medium text-white">Add Argument</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Name</label>
                        <input
                          type="text"
                          value={newArgName}
                          onChange={(e) => setNewArgName(e.target.value)}
                          placeholder="user"
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">Type</label>
                        <select
                          value={newArgType}
                          onChange={(e) => setNewArgType(e.target.value as any)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="string">String</option>
                          <option value="integer">Integer</option>
                          <option value="boolean">Boolean</option>
                          <option value="user">User</option>
                          <option value="channel">Channel</option>
                          <option value="role">Role</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                      <input
                        type="text"
                        value={newArgDescription}
                        onChange={(e) => setNewArgDescription(e.target.value)}
                        placeholder="The user to perform this action on"
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="required"
                          checked={newArgRequired}
                          onChange={(e) => setNewArgRequired(e.target.checked)}
                          className="h-4 w-4 bg-slate-700 border-slate-600 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="required" className="ml-2 block text-xs font-medium text-slate-300">
                          Required
                        </label>
                      </div>
                      <button
                        type="button"
                        onClick={addArgument}
                        disabled={!newArgName || !newArgDescription}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Argument
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Response Configuration */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/70">
                <h2 className="text-lg font-semibold text-white">Response Configuration</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Response Type
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setResponseType('text')}
                      className={`flex flex-col items-center p-4 rounded-lg border ${
                        responseType === 'text' 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50'
                      }`}
                    >
                      <svg className="w-6 h-6 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                      <span className="text-sm font-medium text-white">Simple Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResponseType('embed')}
                      className={`flex flex-col items-center p-4 rounded-lg border ${
                        responseType === 'embed' 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50'
                      }`}
                    >
                      <svg className="w-6 h-6 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                      </svg>
                      <span className="text-sm font-medium text-white">Rich Embed</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResponseType('components')}
                      className={`flex flex-col items-center p-4 rounded-lg border ${
                        responseType === 'components' 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-slate-700 bg-slate-700/30 hover:bg-slate-700/50'
                      }`}
                    >
                      <svg className="w-6 h-6 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm11 4a1 1 0 00-1 1v6a1 1 0 001 1h5a1 1 0 001-1v-6a1 1 0 00-1-1h-5zM4 13a1 1 0 011-1h5a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
                      </svg>
                      <span className="text-sm font-medium text-white">Interactive Components</span>
                    </button>
                  </div>
                </div>
                
                {responseType === 'text' && (
                  <div>
                    <label htmlFor="response-content" className="block text-sm font-medium text-slate-300 mb-2">
                      Response Message
                    </label>
                    <textarea
                      id="response-content"
                      value={responseContent}
                      onChange={(e) => setResponseContent(e.target.value)}
                      placeholder="Hello! Here's the information you requested."
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                    />
                    <p className="mt-1 text-xs text-slate-400">
                      The text response to send when the command is used
                    </p>
                  </div>
                )}
                
                {responseType === 'embed' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="embed-title" className="block text-sm font-medium text-slate-300 mb-2">
                          Embed Title
                        </label>
                        <input
                          type="text"
                          id="embed-title"
                          value={embedTitle}
                          onChange={(e) => setEmbedTitle(e.target.value)}
                          placeholder="Command Results"
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="embed-color" className="block text-sm font-medium text-slate-300 mb-2">
                          Embed Color
                        </label>
                        <div className="flex">
                          <input
                            type="color"
                            id="embed-color"
                            value={embedColor}
                            onChange={(e) => setEmbedColor(e.target.value)}
                            className="h-10 w-10 border-0 p-0 mr-2"
                          />
                          <input
                            type="text"
                            value={embedColor}
                            onChange={(e) => setEmbedColor(e.target.value)}
                            placeholder="#5865F2"
                            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="embed-content" className="block text-sm font-medium text-slate-300 mb-2">
                        Embed Description
                      </label>
                      <textarea
                        id="embed-content"
                        value={responseContent}
                        onChange={(e) => setResponseContent(e.target.value)}
                        placeholder="This is the main content of the embed message."
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                      />
                    </div>
                  </div>
                )}
                
                {responseType === 'components' && (
                  <div className="text-center py-6 text-slate-400 bg-slate-700/30 rounded-lg">
                    <p>Component builder is coming soon!</p>
                    <p className="text-sm">For now, use custom code to create interactive components.</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Custom Code */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/70">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-white">Advanced: Custom Code</h2>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setUseCustomCode(!useCustomCode)}
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none ${
                        useCustomCode ? 'bg-blue-600' : 'bg-slate-600'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                        useCustomCode ? 'translate-x-5' : 'translate-x-0'
                      }`} />
                    </button>
                    <span className="ml-2 text-sm text-slate-300">
                      {useCustomCode ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
              {useCustomCode && (
                <div className="p-6">
                  <div className="mb-4">
                    <p className="text-sm text-slate-300 mb-2">
                      Write custom JavaScript code to handle this command. This overrides the standard response settings.
                    </p>
                  </div>
                  <div className="bg-slate-900 rounded-md overflow-hidden border border-slate-700">
                    <textarea
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value)}
                      className="w-full px-4 py-3 bg-transparent border-0 text-slate-300 font-mono text-sm focus:outline-none min-h-[250px]"
                      spellCheck="false"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Command Preview */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700/50 bg-slate-800/70">
                <h2 className="text-lg font-semibold text-white">Command Preview</h2>
              </div>
              <div className="p-6">
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300">
                  {commandType === 'slash' ? (
                    <div>
                      <span className="text-blue-400">/{name || 'command'}</span>
                      {arguments_.map((arg, index) => (
                        <span key={index} className="ml-1">
                          {arg.required ? (
                            <span className="text-red-400">&lt;{arg.name}&gt;</span>
                          ) : (
                            <span className="text-yellow-400">[{arg.name}]</span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : commandType === 'prefix' ? (
                    <div>
                      <span className="text-green-400">!{name || 'command'}</span>
                    </div>
                  ) : commandType === 'context' ? (
                    <div>
                      <span className="text-purple-400">Right Click → Apps → {name || 'Command Name'}</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-orange-400">Button: {name || 'Button Text'}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Response Preview</h3>
                  <div className="bg-slate-900 rounded-lg p-4 min-h-[100px] flex items-center justify-center border border-slate-700">
                    {responseType === 'text' ? (
                      <div className="text-sm text-slate-300">
                        {responseContent || 'Your response will appear here'}
                      </div>
                    ) : responseType === 'embed' ? (
                      <div className="w-full max-w-xs rounded-md overflow-hidden border-l-4" style={{ borderLeftColor: embedColor }}>
                        <div className="bg-slate-800 p-3">
                          <div className="font-medium text-white text-sm mb-1">
                            {embedTitle || 'Embed Title'}
                          </div>
                          <div className="text-xs text-slate-300">
                            {responseContent || 'Embed description goes here'}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 italic">
                        Interactive component preview
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Info & Help */}
            <div className="bg-blue-900/20 backdrop-blur-sm rounded-xl border border-blue-800/30 p-6">
              <h3 className="text-md font-medium text-blue-300 mb-3">Tips</h3>
              <ul className="space-y-2 text-sm text-blue-200">
                <li className="flex">
                  <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Keep command names short and memorable</span>
                </li>
                <li className="flex">
                  <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Write clear descriptions to help users understand the command</span>
                </li>
                <li className="flex">
                  <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Use embed responses for more complex information</span>
                </li>
                <li className="flex">
                  <svg className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Custom code gives you complete flexibility but requires JavaScript knowledge</span>
                </li>
              </ul>
            </div>
            
            {/* Submission */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
              <div className="p-6">
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors flex justify-center items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Create Command
                </button>
                <p className="mt-3 text-xs text-center text-slate-400">
                  This will create the command and make it available to your bot.
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}