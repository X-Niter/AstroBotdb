import { v4 as uuidv4 } from 'uuid';
import { Message, MessageRole, ConversationContext as ConvContext, AIModel } from './types';

/**
 * ConversationMemory manages the history and context of AI conversations
 * It handles adding messages, retrieving context, and maintaining conversation state
 */
export class ConversationMemory {
  private messages: Message[] = [];
  private userId: string;
  private serverId?: string;
  private channelId?: string;
  private model: AIModel;
  
  constructor(userId: string, model: AIModel = 'gpt-4o', serverId?: string, channelId?: string) {
    this.userId = userId;
    this.model = model;
    this.serverId = serverId;
    this.channelId = channelId;
  }
  
  /**
   * Add a new message to the conversation history
   */
  addMessage(content: string, role: MessageRole): Message {
    const message: Message = {
      id: uuidv4(),
      content,
      role,
      createdAt: new Date(),
      model: this.model
    };
    
    this.messages.push(message);
    return message;
  }
  
  /**
   * Get all messages in the conversation
   */
  getMessages(): Message[] {
    return [...this.messages];
  }
  
  /**
   * Get the most recent n messages from the conversation
   */
  getRecentMessages(count: number): Message[] {
    const startIndex = Math.max(0, this.messages.length - count);
    return this.messages.slice(startIndex);
  }
  
  /**
   * Get the full conversation context
   */
  getContext(): ConvContext {
    return {
      userId: this.userId,
      serverId: this.serverId,
      channelId: this.channelId,
      messages: [...this.messages],
      model: this.model
    };
  }
  
  /**
   * Clear all messages from the conversation
   */
  clearConversation(): void {
    this.messages = [];
  }
  
  /**
   * Set the AI model for the conversation
   */
  setModel(model: AIModel): void {
    this.model = model;
  }
  
  /**
   * Add a system message to the conversation
   */
  addSystemMessage(content: string): Message {
    return this.addMessage(content, 'system');
  }
  
  /**
   * Add a user message to the conversation
   */
  addUserMessage(content: string): Message {
    return this.addMessage(content, 'user');
  }
  
  /**
   * Add an assistant message to the conversation
   */
  addAssistantMessage(content: string): Message {
    return this.addMessage(content, 'assistant');
  }
  
  /**
   * Generate a conversation title based on the first user message
   */
  generateTitle(): string {
    const firstUserMessage = this.messages.find(m => m.role === 'user');
    if (!firstUserMessage) return 'New Conversation';
    
    const content = firstUserMessage.content;
    // Create a title from the first 30 chars of the first message
    return content.length > 30 
      ? content.substring(0, 30) + '...' 
      : content;
  }
}