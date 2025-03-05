import { NextRequest } from 'next/server';
import OpenAI from 'openai';

interface ChatMessage {
  role: string;
  content: string;
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

export default async function handler(req: NextRequest) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const openai = getOpenAIClient();
    const body = await req.json();
    const { prompt, currentOutline, currentTitle, chatHistory = [], isDocumentRequest = false } = body;

    console.log(`Processing request with prompt length: ${prompt?.length || 0}, chat history length: ${chatHistory?.length || 0}`);

    // Format chat history (limit to last 10 messages)
    const formattedChatHistory = (chatHistory || [])
      .slice(-10)
      .map((msg: ChatMessage) => ({
        role: msg.role || 'user',
        content: msg.content
      }));

    // Construct messages array
    const messages = [
      {
        role: 'system',
        content: `You are a helpful AI writing assistant. ${
          isDocumentRequest 
            ? 'For document requests, focus on organizing and structuring content.'
            : 'For chat interactions, provide clear and concise responses.'
        }`
      },
      ...formattedChatHistory,
      {
        role: 'user',
        content: prompt
      }
    ];

    if (currentOutline) {
      messages.unshift({
        role: 'system',
        content: `Current outline: ${currentOutline}`
      });
    }

    if (currentTitle) {
      messages.unshift({
        role: 'system',
        content: `Document title: ${currentTitle}`
      });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-0125-preview',
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    return new Response(JSON.stringify({ 
      result: completion.choices[0].message.content,
      usage: completion.usage
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in generate-outline:', error);
    
    const errorMessage = error.message || 'An error occurred';
    const statusCode = error.status || 500;
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 