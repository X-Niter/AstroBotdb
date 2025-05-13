/**
 * AstroBot AI - AI Service Manager
 * 
 * This module coordinates between different AI service providers,
 * handles routing, fallbacks, and provides a unified interface.
 */

import { 
  AIModelType, 
  AIPersonality, 
  AIService, 
  CompletionParams, 
  CompletionResponse, 
  Message 
} from './types';
import { OpenAIService } from './openai-service';
import { AnthropicService } from './anthropic-service';
import { 
  ConversationContext, 
  ConversationMemoryManager, 
  InMemoryConversationStorage, 
  MemoryStrategy 
} from './conversation-memory';

// Default personalities
const DEFAULT_PERSONALITIES: AIPersonality[] = [
  {
    id: 'astrobot_assistant',
    name: 'AstroBot Assistant',
    systemPrompt: 'You are AstroBot, an advanced AI assistant for Discord servers. You are helpful, friendly, and knowledgeable. You provide concise and accurate information to users.',
    defaultEmotionalState: 'neutral',
    description: 'The standard AstroBot assistant personality, helpful and friendly.',
    preferredModel: 'gpt-4o',
    temperature: 0.7
  },
  {
    id: 'gaming_expert',
    name: 'Gaming Expert',
    systemPrompt: 'You are a gaming expert who specializes in video games, gaming culture, and e-sports. You provide tips, strategies, news, and engage in discussions about all types of games.',
    defaultEmotionalState: 'happy',
    description: 'A personality focused on gaming knowledge and culture.',
    preferredModel: 'gpt-4o',
    temperature: 0.8
  },
  {
    id: 'mod_assistant',
    name: 'Moderation Assistant',
    systemPrompt: 'You are a moderation assistant that helps Discord server administrators and moderators maintain a healthy community. You provide guidance on moderation policies, conflict resolution, and community management.',
    defaultEmotionalState: 'alert',
    description: 'Specialized in helping with moderation and community management.',
    preferredModel: 'claude-3-5-sonnet',
    temperature: 0.2
  }
];

// AI Manager class
export class AIManager {
  private openaiService: OpenAIService | null = null;
  private anthropicService: AnthropicService | null = null;
  private personalities: Map<string, AIPersonality> = new Map();
  private conversationManager: ConversationMemoryManager;
  private activeConversations: Map<string, ConversationContext> = new Map();
  
  constructor() {
    // Initialize the conversation manager with in-memory storage
    const storageProvider = new InMemoryConversationStorage();
    this.conversationManager = new ConversationMemoryManager(
      storageProvider,
      MemoryStrategy.SLIDING_WINDOW,
      50 // Keep 50 messages in context by default
    );
    
    // Load default personalities
    DEFAULT_PERSONALITIES.forEach(personality => {
      this.personalities.set(personality.id, personality);
    });
  }
  
  // Initialize OpenAI service with API key
  initOpenAI(apiKey: string): void {
    this.openaiService = new OpenAIService(apiKey);
  }
  
  // Initialize Anthropic service with API key
  initAnthropic(apiKey: string): void {
    this.anthropicService = new AnthropicService(apiKey);
  }
  
  // Check if OpenAI service is available
  hasOpenAI(): boolean {
    return this.openaiService !== null;
  }
  
  // Check if Anthropic service is available
  hasAnthropic(): boolean {
    return this.anthropicService !== null;
  }
  
  // Get the appropriate service for a model
  private getServiceForModel(model: AIModelType): AIService {
    if (model === 'gpt-4o' || model === 'gpt-3.5-turbo') {
      if (!this.openaiService) {
        throw new Error('OpenAI service not initialized');
      }
      return this.openaiService;
    } else if (model === 'claude-3-5-sonnet' || model === 'claude-3-haiku') {
      if (!this.anthropicService) {
        throw new Error('Anthropic service not initialized');
      }
      return this.anthropicService;
    }
    
    throw new Error(`Unknown model: ${model}`);
  }
  
  // Get available personalities
  getPersonalities(): AIPersonality[] {
    return Array.from(this.personalities.values());
  }
  
  // Get a specific personality
  getPersonality(id: string): AIPersonality | undefined {
    return this.personalities.get(id);
  }
  
  // Add a new personality
  addPersonality(personality: AIPersonality): void {
    this.personalities.set(personality.id, personality);
  }
  
  // Start a new conversation
  async startConversation(
    userId: string,
    personalityId = 'astrobot_assistant',
    serverId?: string,
    channelId?: string
  ): Promise<ConversationContext> {
    // Create a new conversation
    const conversation = await this.conversationManager.createConversation(
      userId,
      serverId,
      channelId,
      personalityId
    );
    
    // Get the personality
    const personality = this.personalities.get(personalityId);
    if (!personality) {
      throw new Error(`Personality with id ${personalityId} not found`);
    }
    
    // Add the system message
    await this.conversationManager.addMessage(conversation.id, {
      role: 'system',
      content: personality.systemPrompt
    });
    
    // Store in active conversations
    const updatedConversation = await this.conversationManager.getConversation(conversation.id);
    if (updatedConversation) {
      this.activeConversations.set(conversation.id, updatedConversation);
      return updatedConversation;
    }
    
    return conversation;
  }
  
  // Send a message to an AI and get a response
  async sendMessage(
    conversationId: string,
    message: string,
    model?: AIModelType
  ): Promise<CompletionResponse> {
    // Get the conversation
    let conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      const retrievedConversation = await this.conversationManager.getConversation(conversationId);
      if (!retrievedConversation) {
        throw new Error(`Conversation with id ${conversationId} not found`);
      }
      conversation = retrievedConversation;
      this.activeConversations.set(conversationId, conversation);
    }
    
    // Add user message to the conversation
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    conversation = await this.conversationManager.addMessage(conversationId, userMessage);
    
    // Get the personality
    const personalityId = conversation.personality_id || 'astrobot_assistant';
    const personality = this.personalities.get(personalityId);
    if (!personality) {
      throw new Error(`Personality with id ${personalityId} not found`);
    }
    
    // Determine which model to use
    const actualModel = model || personality.preferredModel;
    
    // Prepare completion parameters
    const completionParams: CompletionParams = {
      messages: conversation.messages,
      model: actualModel,
      temperature: personality.temperature,
      emotionalState: personality.defaultEmotionalState,
      user_id: conversation.user_id,
      server_id: conversation.server_id,
      channel_id: conversation.channel_id
    };
    
    // Get the appropriate service
    const service = this.getServiceForModel(actualModel);
    
    // Send the request
    const response = await service.complete(completionParams);
    
    // Add the assistant's response to the conversation
    await this.conversationManager.addMessage(conversationId, response.message);
    
    return response;
  }
  
  // Stream a response from the AI
  async streamMessage(
    conversationId: string,
    message: string,
    callback: (chunk: Partial<CompletionResponse>) => void,
    model?: AIModelType
  ): Promise<void> {
    // Get the conversation
    let conversation = this.activeConversations.get(conversationId);
    if (!conversation) {
      const retrievedConversation = await this.conversationManager.getConversation(conversationId);
      if (!retrievedConversation) {
        throw new Error(`Conversation with id ${conversationId} not found`);
      }
      conversation = retrievedConversation;
      this.activeConversations.set(conversationId, conversation);
    }
    
    // Add user message to the conversation
    const userMessage: Message = {
      role: 'user',
      content: message,
      timestamp: Date.now()
    };
    
    conversation = await this.conversationManager.addMessage(conversationId, userMessage);
    
    // Get the personality
    const personalityId = conversation.personality_id || 'astrobot_assistant';
    const personality = this.personalities.get(personalityId);
    if (!personality) {
      throw new Error(`Personality with id ${personalityId} not found`);
    }
    
    // Determine which model to use
    const actualModel = model || personality.preferredModel;
    
    // Prepare completion parameters
    const completionParams: CompletionParams = {
      messages: conversation.messages,
      model: actualModel,
      temperature: personality.temperature,
      emotionalState: personality.defaultEmotionalState,
      stream: true,
      user_id: conversation.user_id,
      server_id: conversation.server_id,
      channel_id: conversation.channel_id
    };
    
    // Get the appropriate service
    const service = this.getServiceForModel(actualModel);
    
    // Ensure the service supports streaming
    if (!service.streamComplete) {
      throw new Error(`Streaming not supported for model ${actualModel}`);
    }
    
    // Keep track of the full response content
    let fullContent = '';
    
    // Wrap the callback to accumulate the full response
    const wrappedCallback = async (chunk: Partial<CompletionResponse>) => {
      // Pass through to the original callback
      callback(chunk);
      
      // Update the full content if we have new content
      if (chunk.message?.content && chunk.message.content !== fullContent) {
        fullContent = chunk.message.content;
      }
      
      // If this is the final chunk, save the full message to the conversation
      if (chunk.finish_reason && fullContent) {
        const finalMessage: Message = {
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now()
        };
        
        await this.conversationManager.addMessage(conversationId, finalMessage);
      }
    };
    
    // Send the streaming request
    await service.streamComplete(completionParams, wrappedCallback);
  }
  
  // Get a conversation
  async getConversation(id: string): Promise<ConversationContext | null> {
    return this.conversationManager.getConversation(id);
  }
  
  // List conversations for a user
  async listConversations(userId: string, limit?: number): Promise<ConversationContext[]> {
    return this.conversationManager.listConversations(userId, limit);
  }
  
  // Delete a conversation
  async deleteConversation(id: string): Promise<void> {
    this.activeConversations.delete(id);
    return this.conversationManager.deleteConversation(id);
  }
}