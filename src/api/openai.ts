import { ChatRequest, ChatResponse } from '../types';
import { logger, Components } from '../utils/logger';

// ------------------------------------------------------------
// API Configuration
// ------------------------------------------------------------

const API_ENDPOINT = '/api/chat';
const DIRECT_API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

// Concurrency guard
let requestInFlight = false;

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
    // Concurrency guard - prevent overlapping requests
    if (requestInFlight) {
        logger.warn(Components.OPENAI, 'Request blocked - another request in flight');
        throw new Error('REQUEST_IN_FLIGHT');
    }

    requestInFlight = true;
    logger.debug(Components.OPENAI, 'Starting OpenAI request', { model: request.model });
    try {
        return await callWithRetry(request);
    } finally {
        requestInFlight = false;
    }
}

// ------------------------------------------------------------
// Retry Logic with Exponential Backoff
// ------------------------------------------------------------

async function callWithRetry(request: ChatRequest, attempt = 0): Promise<string> {
    const apiKey = getApiKey();

    if (!apiKey) {
        logger.error(Components.OPENAI, 'API key missing');
        throw new Error('API_KEY_MISSING');
    }

    logger.debug(Components.OPENAI, `API call attempt ${attempt + 1}`, {
        model: request.model || 'gpt-4o',
        messageCount: request.messages.length,
    });

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
        if (response.status === 401) {
            logger.error(Components.OPENAI, 'Invalid API key', { status: 401 });
            throw new Error('API_KEY_INVALID');
        }

        if (response.status === 429) {
            const errorBody = await parseErrorBody(response);
            const errorType = classifyOpenAIError(errorBody);

            // Only retry on temporary rate limits, not quota/billing issues
            if (errorType === 'RATE_LIMITED' && attempt < MAX_RETRIES) {
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
                logger.warn(Components.OPENAI, `Rate limited, retrying in ${delay}ms`, {
                    attempt: attempt + 1,
                    maxRetries: MAX_RETRIES,
                });
                await sleep(delay);
                return callWithRetry(request, attempt + 1);
            }

            throw new Error(errorType);
        }

        const errorText = await response.text();
        logger.error(Components.OPENAI, `API error: ${response.status}`, { errorText });
        throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    logger.info(Components.OPENAI, 'API call successful', {
        model: request.model || 'gpt-4o',
        responseLength: data.choices[0]?.message?.content?.length || 0,
    });
    return data.choices[0].message.content;
}

// ------------------------------------------------------------
// Error Classification
// ------------------------------------------------------------

async function parseErrorBody(response: Response): Promise<Record<string, unknown>> {
    try {
        const text = await response.text();
        return JSON.parse(text);
    } catch {
        return {};
    }
}

function classifyOpenAIError(body: Record<string, unknown>): string {
    const error = body?.error as Record<string, unknown> | undefined;
    const errorType = (error?.type as string) || '';
    const errorCode = (error?.code as string) || '';
    const errorMessage = (error?.message as string) || '';

    // Log detailed error for debugging
    logger.error(Components.OPENAI, 'API error classification', {
        errorType,
        errorCode,
        errorMessage,
        fullBody: body,
    });

    // Quota exceeded - account needs billing attention
    if (
        errorType === 'insufficient_quota' ||
        errorCode === 'insufficient_quota' ||
        errorMessage.includes('quota')
    ) {
        return 'QUOTA_EXCEEDED';
    }

    // Billing hard limit - payment method issue
    if (
        errorType === 'billing_hard_limit_reached' ||
        errorMessage.includes('billing') ||
        errorMessage.includes('payment')
    ) {
        return 'BILLING_ERROR';
    }

    // Default to rate limited (temporary, can retry)
    return 'RATE_LIMITED';
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
                return 'Temporarily rate limited by OpenAI. Please wait 30 seconds and try again.';
            case 'QUOTA_EXCEEDED':
                return 'Your OpenAI quota is exceeded. Check your account at platform.openai.com.';
            case 'BILLING_ERROR':
                return 'Billing issue with your OpenAI account. Add a payment method at platform.openai.com.';
            case 'REQUEST_IN_FLIGHT':
                return 'A request is already in progress. Please wait for it to complete.';
            default:
                return error.message;
        }
    }
    return 'An unexpected error occurred';
}
