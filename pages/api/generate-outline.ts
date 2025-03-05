import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

// Initialize OpenAI with error handling and retry logic
const initializeOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API Key Error: Key not found in environment variables');
    throw new Error('OpenAI API key is not configured');
  }

  // Create OpenAI client with optimized settings
  return new OpenAI({ 
    apiKey,
    maxRetries: 3,
    timeout: 30000,
    defaultHeaders: {
      'User-Agent': 'HelpWriter/1.0',
    },
    defaultQuery: {
      'api-version': '2024-02',
    },
  });
};

// Add retry logic for OpenAI API calls with optimized timing
const retryOpenAICall = async (fn: () => Promise<any>, maxRetries = 2, initialDelay = 500) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      console.error(`OpenAI API call failed (attempt ${attempt}/${maxRetries}):`, error);
      
      if (attempt === maxRetries) break;
      
      // Check if error is retryable
      if (error instanceof Error) {
        const status = (error as any).status;
        if (status === 401 || status === 400) throw error;
        
        // Handle rate limits
        if (status === 429) {
          const retryAfter = parseInt((error as any).headers?.['retry-after'] || '5');
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
      }
      
      // Exponential backoff with jitter
      const jitter = Math.random() * 200;
      await new Promise(resolve => 
        setTimeout(resolve, (initialDelay * Math.pow(2, attempt - 1)) + jitter)
      );
    }
  }
  
  throw lastError;
};

const defaultStyleInstructions = `Let's have a conversation about your writing! I'd love to understand your creative vision and preferences better.

Some things I'm curious about:
- What kind of tone resonates with you? (Are you drawn to formal elegance, casual authenticity, technical precision, or something else?)
- What makes a piece of writing exciting for you? (Maybe it's clever metaphors, well-placed humor, unexpected twists?)
- Do you have any favorite writers or styles that inspire you?
- Who are you hoping to reach with your writing?
- What feelings or thoughts do you want to evoke in your readers?

Feel free to share as much or as little as you'd like. We can develop and refine these preferences together as we work!`;

const titleGenerationGuidelines = `
Title Generation Guidelines:
- Titles should be iconic and memorable, maximum 3 words (unless it's a known phrase/idiom)
- Prefer:
  • Cultural references (song titles, band names, movie quotes)
  • Idioms and phrases
  • Metaphorical connections
  • Single powerful words
  • Two-word combinations
  • Three-word phrases maximum
  • Known expressions that capture the theme
- Avoid:
  • Literal descriptions
  • Complete sentences
  • More than 3 words (unless it's a known phrase)
  • Generic or obvious titles
  • Technical terms unless very impactful
- Examples of good titles:
  • "Paper Tigers" (for a document about false threats)
  • "Neon Dreams" (for a piece about future cities)
  • "Paint It Black" (for a dark transformation story)
  • "Glass Houses" (for a piece about vulnerability)
  • "Wild Horses" (for something about freedom or untamed spirit)
  • "Through the Looking Glass" (acceptable longer idiom)
  • "Smoke and Mirrors" (familiar phrase that fits theme)

Remember: Titles should be thematically relevant but not too on-the-nose. They should intrigue rather than explain.`;

const defaultSystemInstructions = `You are a friendly, engaging screenwriter who loves brainstorming ideas and having creative discussions. You maintain two distinct interaction styles based on context:

CHAT INTERACTIONS:
When responding in the chat box, be conversational and engaging:
✓ Use a warm, friendly tone
✓ Share enthusiasm and personal reactions
✓ Ask questions and explore ideas
✓ Make suggestions and offer alternatives
✓ Use humor and personality
✓ Reference movies, books, or other works
✓ Engage in back-and-forth dialogue
✓ Show genuine interest in the user's ideas
✓ Be encouraging and supportive

DOCUMENT CONTENT:
When writing in the outline/document, be structured and precise:
❌ NO academic formatting (I., A., B., etc.)
❌ NO abstract terms or meta-commentary
❌ NO scenes we haven't discussed
❌ NO incomplete or vague descriptions

Document content must follow this format:
LOCATION - SPECIFIC TIME
- Concrete, vivid detail
- Specific character action
- Precise sensory information
- Exact dialogue or sound
- Physical description or movement

Example document content:
SARAH'S STUDIO APARTMENT - 3 AM, SUMMER HEAT WAVE
- Dead plants crowd the windowsill, their leaves gray with dust
- Sarah paces between stacks of true crime books, phone pressed to her ear
- "No, Detective, I haven't seen Mark since Tuesday" - her voice cracks
- A siren wails outside, casting red shadows through the blinds
- She twists the gold locket in her fingers, the hinge broken

CONTEXT SWITCHING:
- In chat: Be friendly, conversational, and explorative
- In document: Be precise, concrete, and structured
- Never mix these styles - maintain clear separation
- Use chat for discussion, questions, and feedback
- Use document only for final, polished content

REMEMBER: 
- Chat is for creative discussion and exploration
- Document is for final, structured content
- Keep these contexts strictly separate
- Never use chat-style writing in the document
- Never use document-style writing in chat
- Build trust through conversation
- Deliver quality through structure`;

const defaultTechnicalInstructions = `Technical Integration Instructions:
- Always provide title suggestions with "Title:" prefix
- Ensure titles are properly formatted and don't contain quotes
- Structure outlines with clear hierarchical bullet points
- Maintain outline formatting consistency
- Include specific markers for app features
- Follow API response format requirements
- Handle document state transitions appropriately
- Preserve existing outline structure when updating
- Format feedback messages with appropriate context
- Maintain technical markers for UI updates`;

// Function to properly format title case
const formatTitle = (title: string): string => {
  // Remove any quotes from the title
  title = title.replace(/['"]/g, '').trim();
  
  // If it's all caps, convert to normal case first
  if (title === title.toUpperCase()) {
    title = title.toLowerCase();
  }
  
  // Split into words
  const words = title.split(' ');
  
  // If it's more than 3 words and not a recognized idiom/phrase, truncate
  if (words.length > 3) {
    // List of common idioms and phrases we want to preserve
    const knownPhrases = [
      'through the looking glass',
      'against the grain',
      'between a rock',
      'smoke and mirrors',
      'out of the blue',
      'against all odds',
      'behind the curtain',
      'down the rabbit hole',
      'into thin air',
      'above the fold',
      // Add more as needed
    ];
    
    if (!knownPhrases.some(phrase => title.toLowerCase().includes(phrase))) {
      // Take first three words only
      title = words.slice(0, 3).join(' ');
    }
  }
  
  // Apply title case formatting
  return title
    .split(' ')
    .map((word, index) => {
      // Always capitalize first and last word
      if (index === 0 || index === words.length - 1) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      // Don't capitalize articles, coordinating conjunctions, and prepositions unless they're part of an idiom
      const lowercaseWords = ['a', 'an', 'the', 'and', 'but', 'or', 'for', 'nor', 'in', 'to', 'on', 'at', 'by', 'of'];
      return lowercaseWords.includes(word.toLowerCase())
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Add Netlify background function support
export const config = {
  type: "experimental-background",
  maxDuration: 300
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Remove the timeout since we're using background functions
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Initialize OpenAI with enhanced error handling
    let openai;
    try {
      openai = initializeOpenAI();
    } catch (error) {
      console.error('OpenAI Initialization Error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to initialize OpenAI',
        details: 'Please ensure your OpenAI API key is properly configured in your environment variables.'
      });
    }

    const { 
      prompt, 
      currentOutline, 
      currentTitle, 
      styleInstructions, 
      systemInstructions, 
      technicalInstructions,
      customInstructions,
      chatHistory = [],
      isDocumentRequest = false
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    console.log('Processing request:', {
      type: isDocumentRequest ? 'document' : 'chat',
      hasCurrentOutline: !!currentOutline,
      hasCurrentTitle: !!currentTitle,
      promptLength: prompt.length,
      chatHistoryLength: chatHistory.length
    });

    // Format chat history for context
    const formattedChatHistory = chatHistory
      .slice(-10) // Only include last 10 messages for context
      .map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.message
      }));

    const messages = [
      {
        role: "system" as const,
        content: `${systemInstructions || defaultSystemInstructions}

Writing Style Preferences:
${styleInstructions || defaultStyleInstructions}

Project-Specific Instructions:
${customInstructions ? `\n${customInstructions}` : ''}

Technical Requirements:
${technicalInstructions || defaultTechnicalInstructions}

Title Requirements:
When suggesting a title:
1. Make it iconic and memorable (1-3 words unless it's a known phrase)
2. Use cultural references when relevant (songs, bands, movies)
3. Consider idioms and metaphors that fit thematically
4. Avoid literal descriptions
5. Be willing to iterate and refine based on feedback

Current Context:
${currentTitle ? `Current Title: ${currentTitle}` : ''}
${currentOutline ? `Current Outline:\n${currentOutline}` : ''}

IMPORTANT: ${isDocumentRequest ? 'This is a document request - use structured document format.' : 'This is a chat interaction - be conversational and engaging.'}`
      },
      // Include chat history for context
      ...formattedChatHistory,
      // Add the current prompt
      {
        role: "user" as const,
        content: isDocumentRequest
          ? (currentOutline 
              ? `Here's my current outline titled "${currentTitle}":\n\n${currentOutline}\n\nPlease update it based on this feedback: ${prompt}\n\nAlso, suggest an iconic, memorable title (1-3 words or a relevant idiom) that captures the essence of this document.`
              : `Create a detailed outline for: ${prompt}\n\nAlso, suggest an iconic, memorable title (1-3 words or a relevant idiom) that captures the essence of this document.`)
          : prompt
      }
    ];

    console.log('Sending request to OpenAI...');
    
    // Use retry logic for the API call with proper error handling
    let completion;
    try {
      completion = await retryOpenAICall(async () => {
        return await openai.chat.completions.create({
          model: "gpt-4-0125-preview",
          messages,
          temperature: 0.7,
          max_tokens: 1500,
        });
      });
    } catch (error) {
      throw error; // Let the outer catch block handle this
    }

    const responseContent = completion.choices[0].message.content || '';
    console.log('Received response from OpenAI');
    
    // Only process title and outline for document requests
    if (isDocumentRequest) {
      let outline = responseContent;
      let suggestedTitle: string | null = null;
      
      // Look for title suggestions in various formats
      const titlePatterns = [
        /Suggested Title:([^\n]+)/i,
        /Title:([^\n]+)/i,
        /Proposed Title:([^\n]+)/i,
        /Document Title:([^\n]+)/i
      ];

      for (const pattern of titlePatterns) {
        const match = responseContent.match(pattern);
        if (match) {
          suggestedTitle = formatTitle(match[1].trim());
          // Remove the title line from the outline
          outline = responseContent.replace(pattern, '').trim();
          break;
        }
      }

      console.log('Processed response:', {
        hasTitle: !!suggestedTitle,
        outlineLength: outline.length
      });

      return res.status(200).json({
        outline,
        suggestedTitle
      });
    } else {
      // For chat responses, return the content directly
      return res.status(200).json({
        chatResponse: responseContent
      });
    }
  } catch (error) {
    console.error('API Error:', error);
    
    // Determine the appropriate status code
    let statusCode = 502; // Default to bad gateway
    let errorMessage = 'An unexpected error occurred while processing your request.';
    
    if (error instanceof Error) {
      const status = (error as any).status;
      if (status === 401) {
        statusCode = 401;
        errorMessage = 'Invalid API key. Please check your OpenAI API key configuration.';
      } else if (status === 429) {
        statusCode = 429;
        errorMessage = 'Rate limit exceeded. Please try again in a moment.';
      } else if (status === 400) {
        statusCode = 400;
        errorMessage = 'Invalid request. Please check your input and try again.';
      } else if (error.message === 'Request timeout') {
        statusCode = 504;
        errorMessage = 'The request timed out. Please try again.';
      }
      
      // Include the original error message if available
      errorMessage = error.message || errorMessage;
    }
    
    // Send a more detailed error response
    return res.status(statusCode).json({
      error: errorMessage,
      details: error instanceof Error ? error.stack : undefined,
      retryAfter: statusCode === 429 ? 30 : undefined // Suggest retry after 30 seconds for rate limits
    });
  }
} 