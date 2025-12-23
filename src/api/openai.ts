import { ChatRequest, ChatResponse } from '../types';

// ------------------------------------------------------------
// API Configuration
// ------------------------------------------------------------

const API_ENDPOINT = '/api/chat';
const DIRECT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// ------------------------------------------------------------
// API Key Management
// ------------------------------------------------------------

export function getApiKey(): string | null {
    // 1. Check localStorage (runtime-configured)
    const storedKey = localStorage.getItem('mini-artifact-api-key');
    if (storedKey) return storedKey;

    // 2. Check environment variable (dev mode)
    const envKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (envKey && envKey !== 'your-api-key-here') return envKey;

    return null;
}

export function hasApiKey(): boolean {
    return getApiKey() !== null;
}

export function setApiKey(key: string): void {
    localStorage.setItem('mini-artifact-api-key', key);
}

export function clearApiKey(): void {
    localStorage.removeItem('mini-artifact-api-key');
}

// ------------------------------------------------------------
// OpenAI API Client
// ------------------------------------------------------------

export async function callOpenAI(request: ChatRequest): Promise<string> {
    try {
        // Try the Edge Function proxy first (for production/Vercel)
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            // If the proxy fails with 404, we might be in local dev mode
            if (response.status === 404) {
                return await callOpenAIDirect(request);
            }

            const error = await response.text();
            throw new Error(`API Error: ${response.status} - ${error}`);
        }

        const data: ChatResponse = await response.json();
        return data.content;
    } catch (error) {
        // If network error, try direct API call for local dev
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return await callOpenAIDirect(request);
        }
        throw error;
    }
}

// ------------------------------------------------------------
// Direct API Call (for local development)
// ------------------------------------------------------------

async function callOpenAIDirect(request: ChatRequest): Promise<string> {
    const apiKey = getApiKey();

    if (!apiKey) {
        throw new Error(
            'API_KEY_MISSING'
        );
    }

    const response = await fetch(DIRECT_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: request.model || 'gpt-4o',
            messages: request.messages,
            temperature: 0, // Determinism
            response_format: request.response_format,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401) {
            throw new Error('API_KEY_INVALID');
        }
        if (response.status === 429) {
            throw new Error('RATE_LIMITED');
        }
        throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

export function formatMessagesForAPI(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
) {
    return messages.map((m) => ({
        role: m.role,
        content: m.content,
    }));
}

// Error message helper
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        switch (error.message) {
            case 'API_KEY_MISSING':
                return 'Please configure your OpenAI API key in Settings (⚙️)';
            case 'API_KEY_INVALID':
                return 'Your API key is invalid. Please check it in Settings (⚙️)';
            case 'RATE_LIMITED':
                return 'Rate limited by OpenAI. Please wait a moment and try again.';
            default:
                return error.message;
        }
    }
    return 'An unexpected error occurred';
}
