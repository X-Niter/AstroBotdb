// AI Model types
export type AIModel = 'gpt-4o' | 'claude-3-5-sonnet-20241022' | 'gpt-3.5-turbo';

// Message role types
export type MessageRole = 'user' | 'assistant' | 'system' | 'function' | 'tool';

// Message types
export interface Message {
  id: string;
  content: string;
  role: MessageRole;
  createdAt: Date;
  model?: AIModel;
}

// Types for the conversation context
export interface ConversationContext {
  serverId?: string;
  channelId?: string;
  userId: string;
  messages: Message[];
  model: AIModel;
}

// Conversation metadata
export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  previewText: string;
  messageCount: number;
  model: AIModel;
}

// Types for conversation functions
export type ChatCompletionFunction = {
  name: string;
  description: string;
  parameters: Record<string, any>;
};

// Response from AI models
export interface AIResponse {
  id: string;
  content: string;
  model: AIModel;
  created: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Conversation settings
export interface ConversationSettings {
  model: AIModel;
  temperature: number;
  contextLength: number;
  systemPrompt: string;
}

// Default conversation settings
export const DEFAULT_CONVERSATION_SETTINGS: ConversationSettings = {
  model: 'gpt-4o',
  temperature: 0.7,
  contextLength: 10,
  systemPrompt: 'You are AstroBot, an advanced AI assistant for Discord. Be helpful, concise, and friendly.'
};