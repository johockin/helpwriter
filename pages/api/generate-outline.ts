import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

interface ChatMessage {
  id?: string;
  sender?: 'user' | 'ai';
  message?: string;
  timestamp?: number;
  role?: 'user' | 'assistant' | 'system';
  content?: string;
}

interface RequestBody {
  prompt?: string;
  currentOutline?: string;
  currentTitle?: string;
  chatHistory?: ChatMessage[];
  isDocumentRequest?: boolean;
  styleInstructions?: string;
  systemInstructions?: string;
  technicalInstructions?: string;
  customInstructions?: string;
}

export const config = {
  runtime: 'edge',
  regions: ['iad1'], // Optional: specify regions
};

// Initialize OpenAI with error handling
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  return new OpenAI({ apiKey });
};

// Helper function to validate request body
const validateRequest = (body: RequestBody): Required<Omit<RequestBody, 'styleInstructions' | 'systemInstructions' | 'technicalInstructions' | 'customInstructions'>> => {
  if (!body) {
    throw new Error('Request body is required');
  }
  
  if (!body.prompt) {
    throw new Error('Prompt is required');
  }

  if (body.chatHistory && !Array.isArray(body.chatHistory)) {
    throw new Error('Chat history must be an array');
  }

  // Convert chat history format if needed
  const chatHistory = (body.chatHistory || []).map(msg => {
    if (msg.sender && msg.message) {
      return {
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.message
      };
    }
    if (msg.role && msg.content) {
      return {
        role: msg.role,
        content: msg.content
      };
    }
    throw new Error('Invalid chat message format');
  });

  return {
    prompt: body.prompt,
    currentOutline: body.currentOutline || '',
    currentTitle: body.currentTitle || '',
    chatHistory,
    isDocumentRequest: body.isDocumentRequest || false
  };
};

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const openai = getOpenAIClient();
    const rawBody = await req.json();
    
    // Validate and normalize request body
    const body = validateRequest(rawBody);
    const { prompt, currentOutline, currentTitle, chatHistory, isDocumentRequest } = body;

    console.log('Processing request:', {
      promptLength: prompt.length,
      chatHistoryLength: chatHistory.length,
      hasOutline: !!currentOutline,
      hasTitle: !!currentTitle,
      isDocumentRequest
    });

    // Format chat history (limit to last 10 messages)
    const formattedChatHistory: ChatCompletionMessageParam[] = chatHistory
      .slice(-10)
      .map(msg => ({
        role: msg.role || 'user',
        content: msg.content || msg.message || ''
      }));

    // Construct messages array
    const messages: ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `You are a helpful AI writing assistant. ${
          isDocumentRequest 
            ? 'For document requests, focus on organizing and structuring content. Provide clear hierarchical structure and maintain consistent formatting.'
            : 'For chat interactions, provide clear and concise responses while being engaging and helpful.'
        }`
      }
    ];

    // Add context messages in correct order
    if (currentTitle) {
      messages.push({
        role: 'system',
        content: `Document title: ${currentTitle}`
      });
    }

    if (currentOutline) {
      messages.push({
        role: 'system',
        content: `Current outline: ${currentOutline}`
      });
    }

    // Add chat history and current prompt
    messages.push(...formattedChatHistory);
    messages.push({
      role: 'user',
      content: isDocumentRequest
        ? `${prompt}\n\nPlease provide a well-structured response with clear hierarchical organization.`
        : prompt
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-0125-preview',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Format response based on request type
    if (isDocumentRequest) {
      return new Response(JSON.stringify({ 
        outline: completion.choices[0].message.content,
        suggestedTitle: null // We'll handle title suggestions separately if needed
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } else {
      return new Response(JSON.stringify({ 
        chatResponse: completion.choices[0].message.content,
        usage: completion.usage
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

  } catch (error: any) {
    console.error('Error in generate-outline:', error);
    
    const errorMessage = error.message || 'An error occurred';
    const statusCode = error.status || (error.message?.includes('required') ? 400 : 500);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      details: error.stack,
      type: error.type || 'UnknownError'
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 