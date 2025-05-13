"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { AIModelType, EmotionalState, Message } from '@/lib/ai/types';

// Types for the chat functionality
interface ChatMessage extends Message {
  id: string;
  emotionalState?: EmotionalState;
}

interface ChatState {
  conversationId: string | null;
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  model: AIModelType;
}

// Main Chat component
export default function ChatPage() {
  // Chat state
  const [chatState, setChatState] = useState<ChatState>({
    conversationId: null,
    messages: [],
    loading: false,
    error: null,
    model: 'gpt-4o'
  });
  
  // Input state
  const [inputMessage, setInputMessage] = useState<string>('');
  
  // Reference to the message container for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatState.messages]);
  
  // Function to send a message
  const sendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    try {
      // Add user message to the chat
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: inputMessage,
        timestamp: Date.now()
      };
      
      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
        loading: true,
        error: null
      }));
      
      // Clear input
      setInputMessage('');
      
      // Send message to API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: chatState.conversationId,
          message: inputMessage,
          model: chatState.model
        })
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Add assistant message to the chat
      const assistantMessage: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: data.message.content,
        timestamp: Date.now(),
        emotionalState: data.emotionalState
      };
      
      setChatState(prev => ({
        ...prev,
        conversationId: data.conversationId,
        messages: [...prev.messages, assistantMessage],
        loading: false
      }));
    } catch (error) {
      console.error('Error sending message:', error);
      setChatState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to send message. Please try again.'
      }));
    }
  };
  
  // Handle input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };
  
  // Handle model change
  const handleModelChange = (model: AIModelType) => {
    setChatState(prev => ({
      ...prev,
      model
    }));
  };
  
  // Start a new conversation
  const startNewConversation = () => {
    setChatState({
      conversationId: null,
      messages: [],
      loading: false,
      error: null,
      model: 'gpt-4o'
    });
  };
  
  // Determine message style based on role
  const getMessageStyle = (role: string) => {
    if (role === 'user') {
      return 'bg-blue-600 text-white self-end';
    } else if (role === 'assistant') {
      return 'bg-slate-800 text-white self-start';
    } else {
      return 'bg-slate-700 text-white italic self-start';
    }
  };
  
  // Render the emotional state indicator
  const renderEmotionalState = (emotionalState?: EmotionalState) => {
    if (!emotionalState || emotionalState === 'neutral') return null;
    
    const emotionIcons: Record<EmotionalState, string> = {
      neutral: '😐',
      happy: '😊',
      thinking: '🤔',
      alert: '⚠️',
      sad: '😢',
      confused: '😕'
    };
    
    return (
      <span className="ml-2 text-sm opacity-80">
        {emotionIcons[emotionalState]}
      </span>
    );
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-[#080818] text-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-white">
                AstroBot AI
              </Link>
              <span className="ml-3 px-2 py-1 rounded-md bg-blue-600/20 text-blue-400 text-xs font-medium">
                Chat Demo
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={startNewConversation}
                className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              >
                New Chat
              </button>
              <Link 
                href="/"
                className="px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main chat container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Model selector */}
        <div className="mb-6 flex flex-wrap justify-center gap-2">
          <span className="text-slate-400 self-center mr-2">Model:</span>
          <button
            onClick={() => handleModelChange('gpt-4o')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              chatState.model === 'gpt-4o'
                ? 'bg-green-600/30 text-green-400 border border-green-600/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            GPT-4o
          </button>
          <button
            onClick={() => handleModelChange('claude-3-5-sonnet')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              chatState.model === 'claude-3-5-sonnet'
                ? 'bg-purple-600/30 text-purple-400 border border-purple-600/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            Claude 3.5 Sonnet
          </button>
          <button
            onClick={() => handleModelChange('gpt-3.5-turbo')}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              chatState.model === 'gpt-3.5-turbo'
                ? 'bg-blue-600/30 text-blue-400 border border-blue-600/50'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            GPT-3.5 Turbo
          </button>
        </div>
        
        {/* Error message */}
        {chatState.error && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-md text-red-300">
            {chatState.error}
          </div>
        )}
        
        {/* Chat messages */}
        <div className="bg-slate-900/30 border border-slate-800 rounded-lg h-[60vh] overflow-y-auto p-4">
          <div className="flex flex-col space-y-4">
            {chatState.messages.length === 0 ? (
              <div className="text-center text-slate-500 p-8">
                <h3 className="text-lg font-medium mb-2">Welcome to AstroBot AI Chat</h3>
                <p>Start a conversation by sending a message below.</p>
              </div>
            ) : (
              chatState.messages.map(message => (
                <div 
                  key={message.id} 
                  className={`max-w-[80%] rounded-lg p-3 ${getMessageStyle(message.role)}`}
                >
                  <div className="flex items-center mb-1">
                    <span className="text-xs font-medium opacity-80">
                      {message.role === 'user' ? 'You' : 'AstroBot AI'}
                    </span>
                    {message.role === 'assistant' && renderEmotionalState(message.emotionalState)}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {chatState.loading && (
              <div className="max-w-[80%] rounded-lg p-3 bg-slate-800 text-white self-start">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-150"></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse delay-300"></div>
                  <span className="text-sm text-slate-400">AstroBot is thinking...</span>
                </div>
              </div>
            )}
            
            {/* Invisible element for auto-scrolling */}
            <div ref={messagesEndRef} />
          </div>
        </div>
        
        {/* Message input */}
        <div className="mt-4">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
              disabled={chatState.loading}
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50"
              disabled={chatState.loading || !inputMessage.trim()}
            >
              Send
            </button>
          </form>
          <div className="mt-2 text-xs text-slate-500 text-center">
            Using {chatState.model === 'gpt-4o' ? 'OpenAI GPT-4o' : chatState.model === 'claude-3-5-sonnet' ? 'Anthropic Claude 3.5 Sonnet' : 'OpenAI GPT-3.5 Turbo'}
          </div>
        </div>
      </main>
    </div>
  );
}