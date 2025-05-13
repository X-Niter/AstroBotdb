"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/lib/ai/types';
import { v4 as uuidv4 } from 'uuid';

interface ChatInterfaceProps {
  initialMessages?: Message[];
  onSendMessage: (message: string) => Promise<void>;
  isProcessing?: boolean;
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  initialMessages = [],
  onSendMessage,
  isProcessing = false,
  className = '',
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Update messages when initialMessages prop changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input field when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === '' || isProcessing) return;

    // Add user message to chat
    const userMessage: Message = {
      id: uuidv4(),
      content: input,
      role: 'user',
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Send message to parent component for processing
    await onSendMessage(input);
  };

  // Auto-resize textarea as content grows
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Chat message display area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-slate-500">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-blue-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-slate-400 mb-2">No messages yet</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Start a conversation with AstroBot by typing a message below.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-3/4 rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.role === 'system'
                    ? 'bg-slate-700/60 text-slate-300 italic border border-slate-700'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/50'
                }`}
              >
                <div className="prose prose-invert prose-sm">{message.content}</div>
                <div
                  className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-blue-300' : 'text-slate-500'
                  }`}
                >
                  {message.createdAt.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat input area */}
      <div className="border-t border-slate-700/50 p-4">
        <form onSubmit={handleSubmit} className="flex">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-l-md px-4 py-3 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none min-h-[52px] max-h-[200px] placeholder:text-slate-500"
              disabled={isProcessing}
              rows={1}
            />
          </div>
          <button
            type="submit"
            className={`bg-blue-600 hover:bg-blue-700 rounded-r-md px-4 text-white font-medium flex items-center justify-center transition-colors ${
              isProcessing || input.trim() === '' ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isProcessing || input.trim() === ''}
          >
            {isProcessing ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 2L11 13"></path>
                <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
              </svg>
            )}
          </button>
        </form>
        <p className="text-xs text-slate-500 mt-2">
          Press Shift+Enter for a new line. Enter to send.
        </p>
      </div>
    </div>
  );
};