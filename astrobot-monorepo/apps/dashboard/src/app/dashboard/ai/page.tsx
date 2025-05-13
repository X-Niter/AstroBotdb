"use client";

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChatInterface } from '@/components/chat/chat-interface';
import { Message, AIModel } from '@/lib/ai/types';
import { v4 as uuidv4 } from 'uuid';

// Admin users who can access this development workspace
const ADMIN_EMAILS = ['admin@astrobot.ai'];

export default function DevWorkspacePage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel>('gpt-4o');
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
  });
  const [activeTab, setActiveTab] = useState<'develop' | 'preview' | 'deploy'>('develop');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  // Check if current user is an admin
  const isAdmin = session?.user?.email && ADMIN_EMAILS.includes(session.user.email);

  // Add a system message on component mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: uuidv4(),
          content: `I am AstroBot Development Assistant, your code development partner. I can help with:
- Writing and refactoring code for your Discord bot
- Debugging issues in your application
- Implementing new features
- Creating test cases
- Deploying updates

What would you like to work on today?`,
          role: 'system',
          createdAt: new Date(),
        },
      ]);
    }
  }, [messages.length]);

  // Handle sending a message to the AI
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isProcessing) return;

      setIsProcessing(true);

      try {
        // Add the user message to UI immediately
        const userMessage: Message = {
          id: uuidv4(),
          content,
          role: 'user',
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // Check if we have the required API key
        const requiredApiKey = selectedModel.startsWith('gpt') ? 'openai' : 'anthropic';
        if (!apiKeys[requiredApiKey]) {
          throw new Error(`Please provide your ${requiredApiKey === 'openai' ? 'OpenAI' : 'Anthropic'} API key to use this model.`);
        }

        // Send the message to our API endpoint
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: content,
            model: selectedModel,
            apiKeys,
            context: {
              selectedFile,
              fileContent: selectedFile ? fileContent : undefined,
              projectRole: 'developer',
            }
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to get a response');
        }

        const data = await response.json();

        // Add the AI response to the chat
        const botMessage: Message = {
          id: uuidv4(),
          content: data.response,
          role: 'assistant',
          createdAt: new Date(),
          model: data.model,
        };

        setMessages((prev) => [...prev, botMessage]);
      } catch (error: any) {
        console.error('Error sending message:', error);
        
        // Add an error message to the chat
        const errorMessage: Message = {
          id: uuidv4(),
          content: `Error: ${error.message || 'Something went wrong. Please try again.'}`,
          role: 'assistant',
          createdAt: new Date(),
        };
        
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, selectedModel, apiKeys, selectedFile, fileContent]
  );

  // Handle API key changes
  const handleApiKeyChange = (service: 'openai' | 'anthropic', value: string) => {
    setApiKeys((prev) => ({
      ...prev,
      [service]: value,
    }));
  };

  // If not admin, show access denied
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="w-12 h-12 border-4 border-t-blue-500 border-slate-700/30 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] p-6">
        <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-slate-400 text-center max-w-md mb-6">
          The Development Workspace is only available to admin users. Please contact the system administrator if you believe you should have access.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Return to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Page header */}
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-bold text-white">Developer Workspace</h1>
        <p className="text-slate-400 mt-1">
          Collaborate with AI to develop, test, and deploy your Discord bot
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-6">
        <div className="border-b border-slate-700/50">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('develop')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'develop'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              Develop
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'preview'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              Test & Preview
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'deploy'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
              }`}
            >
              Deploy
            </button>
          </nav>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row p-6 pt-4 gap-6 h-full overflow-hidden">
        {activeTab === 'develop' && (
          <>
            {/* Code editor panel */}
            <div className="w-full md:w-1/2 lg:w-3/5 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/70">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-slate-300">
                      {selectedFile || 'Select a file to edit'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded">
                      Save
                    </button>
                    <button className="text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded">
                      Files
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto bg-slate-900 font-mono">
                {selectedFile ? (
                  <textarea
                    value={fileContent}
                    onChange={(e) => setFileContent(e.target.value)}
                    className="w-full h-full bg-transparent text-slate-300 text-sm focus:outline-none resize-none"
                    spellCheck="false"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    Select a file from the project to start editing
                  </div>
                )}
              </div>
            </div>

            {/* Chat interface with AI */}
            <div className="w-full md:w-1/2 lg:w-2/5 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 flex flex-col overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/50 bg-slate-800/70">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-300">AI Development Assistant</span>
                  <div className="flex items-center">
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value as AIModel)}
                      className="text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-300"
                    >
                      <option value="gpt-4o">GPT-4o</option>
                      <option value="claude-3-5-sonnet-20241022">Claude 3.5</option>
                    </select>
                  </div>
                </div>
              </div>
              <ChatInterface
                initialMessages={messages}
                onSendMessage={handleSendMessage}
                isProcessing={isProcessing}
                className="h-full"
              />
            </div>
          </>
        )}

        {activeTab === 'preview' && (
          <div className="w-full bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8 flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-white mb-2">Test Environment</h3>
            <p className="text-slate-400 text-center max-w-lg mb-6">
              Run a test instance of your Discord bot to verify functionality before deployment. You can test commands, interactions, and features in an isolated environment.
            </p>
            <button className="inline-flex items-center px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Start Test Instance
            </button>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="w-full bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-8">
            <div className="max-w-3xl mx-auto">
              <div className="mb-8 text-center">
                <div className="w-16 h-16 mx-auto bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">Deploy Your Bot</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  Push your changes to production and update your Discord bot.
                </p>
              </div>

              <div className="bg-slate-700/30 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-medium text-white mb-4">Version Control</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Version Name</label>
                    <input
                      type="text"
                      placeholder="v1.2.0"
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Release Notes</label>
                    <textarea
                      placeholder="Describe the changes in this version..."
                      className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent h-24 resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button className="w-full inline-flex items-center justify-center px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Deploy to Production
                </button>
                <button className="w-full inline-flex items-center justify-center px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-md font-medium transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Settings panel - slide in from right */}
      <div className="fixed top-0 right-0 w-80 h-full bg-slate-900 border-l border-slate-800 transform translate-x-full transition-transform duration-300 ease-in-out z-50">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Developer Settings</h2>
          
          <div className="space-y-6">
            {/* API Keys */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-300">API Keys</h3>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">OpenAI API Key</label>
                <input
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">Anthropic API Key</label>
                <input
                  type="password"
                  value={apiKeys.anthropic}
                  onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                  placeholder="sk-ant-..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-md px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}