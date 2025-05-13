import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { Message, AIModel } from '@/lib/ai/types';
import { 
  createAIService, 
  ConversationMemory 
} from '@/lib/ai';

// Define the expected request body
interface ChatRequest {
  message: string;
  model: AIModel;
  conversationId?: string;
  apiKeys: {
    openai?: string;
    anthropic?: string;
  };
  context?: {
    selectedFile?: string | null;
    fileContent?: string;
    projectRole?: 'developer' | 'user';
  };
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json() as ChatRequest;
    const { message, model, apiKeys } = body;

    // Validate required fields
    if (!message || !model) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if we have the API key for the selected model
    if ((model.startsWith('gpt') && !apiKeys.openai) || 
        (model.startsWith('claude') && !apiKeys.anthropic)) {
      return NextResponse.json(
        { error: `Missing API key for ${model}` },
        { status: 400 }
      );
    }

    // Create the AI service based on the selected model
    const aiService = createAIService(model, {
      openai: apiKeys.openai || '',
      anthropic: apiKeys.anthropic || ''
    });

    if (!aiService) {
      return NextResponse.json(
        { error: 'Failed to initialize AI service' },
        { status: 500 }
      );
    }

    // Create a conversation memory
    const userId = session.user.id || session.user.email || 'anonymous';
    const memory = new ConversationMemory(userId, model);
    
    // Add system message to set the context based on project role
    const isDeveloper = body.context?.projectRole === 'developer';
    
    if (isDeveloper) {
      // Developer role gets more powerful development capabilities
      memory.addSystemMessage(
        'You are AstroBot Developer Assistant, an advanced AI programming partner. ' +
        'You help develop, test, and deploy Discord bot code and features. ' +
        'Provide guidance on architecture decisions, write code, debug issues, and suggest improvements. ' +
        'When writing code, ensure it follows best practices and is well-documented. ' +
        'If shown code with errors, help identify and fix them. ' +
        'Your responses should be technically precise but clear, focusing on helping the developer implement ' +
        'features efficiently and with high quality. ' +
        (body.context?.selectedFile ? `The user is currently working on file: ${body.context.selectedFile}` : '') +
        (body.context?.fileContent ? `\n\nFile content: \n\`\`\`\n${body.context.fileContent}\n\`\`\`` : '')
      );
    } else {
      // Default role is more limited and focused on bot configuration
      memory.addSystemMessage(
        'You are AstroBot AI, an advanced Discord bot management assistant. ' +
        'Help users configure and manage their Discord bots, answer questions about Discord features, ' +
        'and provide guidance on bot setup, moderation, and automation. ' +
        'Your responses should be helpful, concise, and focused on Discord server and bot management.'
      );
    }
    
    // Add the user's message
    memory.addUserMessage(message);
    
    // Generate response using the AI service
    const response = await aiService.generateCompletion(
      memory.getMessages(),
      model
    );
    
    // Add the assistant's response to memory
    memory.addAssistantMessage(response.content);
    
    // Return the response
    return NextResponse.json({
      response: response.content,
      model: response.model,
      usage: response.usage,
      conversationId: body.conversationId || 'temp-' + Date.now()
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 500 }
    );
  }
}