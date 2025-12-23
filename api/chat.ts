import OpenAI from 'openai';

// Vercel Edge Function configuration
export const config = {
    runtime: 'edge',
};

// Rate limiting (simple in-memory for demo)
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
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers }
        );
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
        const { messages, response_format, model } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Invalid request: messages array required' }),
                { status: 400, headers }
            );
        }

        // Initialize OpenAI client
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        if (!process.env.OPENAI_API_KEY) {
            return new Response(
                JSON.stringify({ error: 'Server configuration error: API key not set' }),
                { status: 500, headers }
            );
        }

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model: model || 'gpt-4o',
            messages,
            temperature: 0, // Determinism for reproducible outputs
            response_format: response_format || { type: 'text' },
        });

        // Extract content
        const content = completion.choices[0]?.message?.content || '';

        return new Response(
            JSON.stringify({ content }),
            { status: 200, headers }
        );
    } catch (error) {
        console.error('Chat API error:', error);

        const message = error instanceof Error ? error.message : 'Unknown error';
        const isOpenAIError = message.includes('OpenAI') || message.includes('API');

        return new Response(
            JSON.stringify({
                error: isOpenAIError ? 'AI service error. Please try again.' : message,
            }),
            { status: 500, headers }
        );
    }
}
