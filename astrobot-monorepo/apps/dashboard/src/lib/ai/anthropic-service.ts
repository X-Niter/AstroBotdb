import { Message, AIModel, AIResponse } from './types';

/**
 * Anthropic Service for handling interactions with Anthropic's Claude API
 */
export class AnthropicService {
  private apiKey: string;
  private baseURL: string = 'https://api.anthropic.com/v1';
  private apiVersion: string = '2023-06-01';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Get capabilities of this AI service
   */
  getCapabilities() {
    return {
      supportsImages: true,
      supportsFunctions: false,
      supportsStreaming: true,
      maxContextLength: 200000,
      models: ['claude-3-5-sonnet-20241022']
    };
  }
  
  /**
   * Check if this service supports a specific model
   */
  supportsModel(model: AIModel): boolean {
    return this.getCapabilities().models.includes(model);
  }
  
  /**
   * Format messages for Claude API
   * Claude requires a specific format for its messages
   */
  private formatMessagesForClaude(messages: Message[]): string {
    let formattedPrompt = '';
    
    // Extract the system message if present
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');
    
    // Add system message as a preamble if it exists
    if (systemMessage) {
      formattedPrompt += `${systemMessage.content}\n\n`;
    }
    
    // Format conversation messages
    for (const msg of conversationMessages) {
      if (msg.role === 'user') {
        formattedPrompt += `\nHuman: ${msg.content}`;
      } else if (msg.role === 'assistant') {
        formattedPrompt += `\nAssistant: ${msg.content}`;
      }
    }
    
    // Make sure to end with the assistant prefix if the last message is from the user
    if (conversationMessages.length > 0 && conversationMessages[conversationMessages.length - 1].role === 'user') {
      formattedPrompt += '\nAssistant: ';
    }
    
    return formattedPrompt;
  }
  
  /**
   * Generate a completion from the Anthropic API
   */
  async generateCompletion(messages: Message[], model: AIModel = 'claude-3-5-sonnet-20241022', temperature: number = 0.7): Promise<AIResponse> {
    if (!this.supportsModel(model)) {
      throw new Error(`Model ${model} is not supported by Anthropic service`);
    }
    
    try {
      // Format the prompt for Claude
      const prompt = this.formatMessagesForClaude(messages);
      
      // Prepare the API request
      const requestBody = {
        model,
        prompt,
        max_tokens_to_sample: 4096,
        temperature,
        stop_sequences: ["\nHuman:"]
      };
      
      // Make the API request
      const response = await fetch(`${this.baseURL}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': this.apiVersion
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map the response to our standard format
      return {
        id: data.id || Date.now().toString(),
        content: data.completion,
        model: model,
        created: Date.now() / 1000,
        usage: {
          promptTokens: 0, // Claude doesn't return token usage
          completionTokens: 0,
          totalTokens: 0
        }
      };
    } catch (error) {
      console.error('Error generating completion from Anthropic:', error);
      throw error;
    }
  }
}

// Factory function to create a new Anthropic service
export function createAnthropicService(apiKey: string): AnthropicService {
  return new AnthropicService(apiKey);
}