import { createOpenAIService, OpenAIService } from './openai-service';
import { createAnthropicService, AnthropicService } from './anthropic-service';
import { AIModel, ConversationSettings, DEFAULT_CONVERSATION_SETTINGS } from './types';
import { ConversationMemory } from './conversation-memory';

// Factory function to create the appropriate AI service based on the model
export function createAIService(model: AIModel, apiKeys: Record<string, string>): OpenAIService | AnthropicService | null {
  if (model.startsWith('gpt')) {
    const openaiKey = apiKeys['openai'];
    if (!openaiKey) {
      console.error('OpenAI API key is missing');
      return null;
    }
    return createOpenAIService(openaiKey);
  } else if (model.startsWith('claude')) {
    const anthropicKey = apiKeys['anthropic'];
    if (!anthropicKey) {
      console.error('Anthropic API key is missing');
      return null;
    }
    return createAnthropicService(anthropicKey);
  }
  
  console.error(`Unsupported model: ${model}`);
  return null;
}

// Export from the AI module
export {
  OpenAIService,
  AnthropicService,
  ConversationMemory,
  DEFAULT_CONVERSATION_SETTINGS
};

// Export types
export type {
  AIModel,
  ConversationSettings
};