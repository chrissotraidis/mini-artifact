import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// ============================================================
// Chat API Edge Function - Multi-Provider Support
// ============================================================

// Vercel Edge Function configuration
export const config = {
    runtime: 'edge',
};

// ------------------------------------------------------------
// Types
// ------------------------------------------------------------

type Provider = 'openai' | 'anthropic';

interface ChatRequest {
    provider?: Provider;
    model?: string;
    messages: Array<{ role: string; content: string }>;
    response_format?: { type: 'json_object' | 'text' };
    max_tokens?: number;
}

// ------------------------------------------------------------
// Rate Limiting
// ------------------------------------------------------------

const requestCounts = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per minute
const RATE_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = requestCounts.get(ip);

    if (!record || record.resetAt < now) {
        requestCounts.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
        return true;
    }

    if (record.count >= RATE_LIMIT) {
        return false;
    }

    record.count++;
    return true;
}

// ------------------------------------------------------------
// Provider Handlers
// ------------------------------------------------------------

async function callOpenAI(
    request: ChatRequest
): Promise<{ content: string; usage?: { input: number; output: number } }> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
    }

    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
        model: request.model || 'gpt-4o',
        messages: request.messages as OpenAI.ChatCompletionMessageParam[],
        temperature: 0,
        response_format: request.response_format || { type: 'text' },
    });

    return {
        content: completion.choices[0]?.message?.content || '',
        usage: completion.usage
            ? {
                input: completion.usage.prompt_tokens,
                output: completion.usage.completion_tokens,
            }
            : undefined,
    };
}

async function callAnthropic(
    request: ChatRequest
): Promise<{ content: string; usage?: { input: number; output: number } }> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const anthropic = new Anthropic({ apiKey });

    // Extract system message (Anthropic requires it as a top-level param)
    const systemMessages = request.messages.filter((m) => m.role === 'system');
    const nonSystemMessages = request.messages.filter((m) => m.role !== 'system');
    const systemPrompt =
        systemMessages.length > 0
            ? systemMessages.map((m) => m.content).join('\n\n')
            : undefined;

    const response = await anthropic.messages.create({
        model: request.model || 'claude-sonnet-4-20250514',
        max_tokens: request.max_tokens || 4096,
        system: systemPrompt,
        messages: nonSystemMessages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
        })),
    });

    // Flatten content blocks
    const content = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map((block) => block.text)
        .join('');

    return {
        content,
        usage: response.usage
            ? {
                input: response.usage.input_tokens,
                output: response.usage.output_tokens,
            }
            : undefined,
    };
}

// ------------------------------------------------------------
// Main Handler
// ------------------------------------------------------------

export default async function handler(req: Request): Promise<Response> {
    // CORS headers
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers });
    }

    // Only allow POST
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers,
        });
    }

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
        return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers }
        );
    }

    try {
        // Parse request body
        const body: ChatRequest = await req.json();
        const { provider = 'openai', messages } = body;

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Invalid request: messages array required' }),
                { status: 400, headers }
            );
        }

        // Route to appropriate provider
        let result: { content: string; usage?: { input: number; output: number } };

        if (provider === 'anthropic') {
            result = await callAnthropic(body);
        } else {
            result = await callOpenAI(body);
        }

        return new Response(JSON.stringify({ content: result.content, usage: result.usage }), {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error('Chat API error:', error);

        const message = error instanceof Error ? error.message : 'Unknown error';

        // Classify error for client
        let status = 500;
        let errorMessage = 'AI service error. Please try again.';

        if (message.includes('API_KEY') || message.includes('not configured')) {
            status = 500;
            errorMessage = 'Server configuration error: API key not set';
        } else if (message.includes('rate') || message.includes('429')) {
            status = 429;
            errorMessage = 'Rate limited. Please try again later.';
        } else if (message.includes('quota') || message.includes('insufficient')) {
            status = 402;
            errorMessage = 'API quota exceeded. Check your provider account.';
        }

        return new Response(JSON.stringify({ error: errorMessage }), { status, headers });
    }
}
