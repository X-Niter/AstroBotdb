import { Message, AIModel, AIResponse } from './types';

/**
 * OpenAI Service for handling interactions with OpenAI API
 */
export class OpenAIService {
  private apiKey: string;
  private baseURL: string = 'https://api.openai.com/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Get capabilities of this AI service
   */
  getCapabilities() {
    return {
      supportsImages: true,
      supportsFunctions: true,
      supportsStreaming: true,
      maxContextLength: 128000,
      models: ['gpt-4o', 'gpt-3.5-turbo']
    };
  }
  
  /**
   * Check if this service supports a specific model
   */
  supportsModel(model: AIModel): boolean {
    return this.getCapabilities().models.includes(model);
  }
  
  /**
   * Generate a completion from the OpenAI API
   */
  async generateCompletion(messages: Message[], model: AIModel = 'gpt-4o', temperature: number = 0.7): Promise<AIResponse> {
    if (!this.supportsModel(model)) {
      throw new Error(`Model ${model} is not supported by OpenAI service`);
    }
    
    try {
      // Prepare the API request
      const requestBody = {
        model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        temperature,
        max_tokens: model === 'gpt-4o' ? 4096 : 2048,
      };
      
      // Make the API request
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map the response to our standard format
      return {
        id: data.id,
        content: data.choices[0].message.content,
        model: model,
        created: data.created,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        }
      };
    } catch (error) {
      console.error('Error generating completion from OpenAI:', error);
      throw error;
    }
  }
  
  /**
   * Generate an image from text using DALL-E
   */
  async generateImage(prompt: string, size: '1024x1024' | '512x512' | '256x256' = '1024x1024'): Promise<string> {
    try {
      const response = await fetch(`${this.baseURL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          prompt,
          n: 1,
          size
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`DALL-E API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.data[0].url;
    } catch (error) {
      console.error('Error generating image from DALL-E:', error);
      throw error;
    }
  }
}

// Factory function to create a new OpenAI service
export function createOpenAIService(apiKey: string): OpenAIService {
  return new OpenAIService(apiKey);
}