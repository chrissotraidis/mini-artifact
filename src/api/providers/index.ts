// ============================================================
// LLM Provider Router - Unified entry point for all providers
// ============================================================

import { LLMRequest, LLMResponse, Provider } from '../../types/llm';
import { callOpenAI } from './openai';
import { callAnthropic } from './anthropic';
import { logger, Components } from '../../utils/logger';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

// Concurrency guard
let requestInFlight = false;

// ------------------------------------------------------------
// API Key Management (per provider)
// ------------------------------------------------------------

export function getApiKey(provider: Provider): string | null {
    const storageKey = provider === 'openai'
        ? 'mini-artifact-openai-key'
        : 'mini-artifact-anthropic-key';

    // 1. Check localStorage (runtime-configured)
    const storedKey = localStorage.getItem(storageKey);
    if (storedKey) return storedKey;

    // 2. Check environment variable (dev mode)
    const envKey = provider === 'openai'
        ? import.meta.env.VITE_OPENAI_API_KEY
        : import.meta.env.VITE_ANTHROPIC_API_KEY;

    if (envKey && envKey !== 'your-api-key-here') return envKey;

    return null;
}

export function hasApiKey(provider: Provider): boolean {
    return getApiKey(provider) !== null;
}

export function setApiKey(provider: Provider, key: string): void {
    const storageKey = provider === 'openai'
        ? 'mini-artifact-openai-key'
        : 'mini-artifact-anthropic-key';
    localStorage.setItem(storageKey, key);
}

export function clearApiKey(provider: Provider): void {
    const storageKey = provider === 'openai'
        ? 'mini-artifact-openai-key'
        : 'mini-artifact-anthropic-key';
    localStorage.removeItem(storageKey);
}

// Backward compatibility - get OpenAI key from old storage location
export function migrateOldApiKey(): void {
    const oldKey = localStorage.getItem('mini-artifact-api-key');
    if (oldKey && !localStorage.getItem('mini-artifact-openai-key')) {
        localStorage.setItem('mini-artifact-openai-key', oldKey);
        localStorage.removeItem('mini-artifact-api-key');
        logger.info(Components.OPENAI, 'Migrated API key to new storage format');
    }
}

// ------------------------------------------------------------
// Unified LLM Call
// ------------------------------------------------------------

const API_ENDPOINT = '/api/chat';

/**
 * Call any LLM provider with unified interface
 * Tries proxy first (for production), falls back to direct API (for local dev)
 */
export async function callLLM(request: LLMRequest): Promise<LLMResponse> {
    // Concurrency guard
    if (requestInFlight) {
        logger.warn(Components.OPENAI, 'Request blocked - another request in flight');
        throw new Error('REQUEST_IN_FLIGHT');
    }

    requestInFlight = true;

    try {
        logger.info(Components.OPENAI, `Calling ${request.provider}`, {
            model: request.model,
            messageCount: request.messages.length,
        });

        // Try proxy first (for production)
        return await callViaProxy(request);
    } catch (proxyError) {
        // If proxy fails with 404 or network error, try direct API
        if (
            proxyError instanceof Error &&
            (proxyError.message.includes('404') ||
                proxyError.message.includes('fetch') ||
                proxyError.message.includes('Failed to fetch'))
        ) {
            logger.debug(Components.OPENAI, 'Proxy unavailable, falling back to direct API');
            return await callWithRetry(request);
        }
        throw proxyError;
    } finally {
        requestInFlight = false;
    }
}

/**
 * Call via Edge Function proxy
 */
async function callViaProxy(request: LLMRequest): Promise<LLMResponse> {
    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            provider: request.provider,
            model: request.model,
            messages: request.messages,
            response_format: request.responseFormat,
            max_tokens: request.maxTokens,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = (errorData as { error?: string }).error || `Proxy error: ${response.status}`;

        if (response.status === 404) {
            throw new Error('404: Proxy not available');
        }
        if (response.status === 429) {
            throw new Error('RATE_LIMITED');
        }
        if (response.status === 402) {
            throw new Error('QUOTA_EXCEEDED');
        }

        throw new Error(errorMessage);
    }

    const data = await response.json();
    return {
        text: data.content,
        usage: data.usage
            ? {
                inputTokens: data.usage.input,
                outputTokens: data.usage.output,
            }
            : undefined,
    };
}

/**
 * Call with exponential backoff retry
 */
async function callWithRetry(request: LLMRequest, attempt = 0): Promise<LLMResponse> {
    const apiKey = getApiKey(request.provider);

    if (!apiKey) {
        logger.error(Components.OPENAI, `${request.provider} API key missing`);
        throw new Error(`${request.provider.toUpperCase()}_KEY_MISSING`);
    }

    try {
        // Route to appropriate provider
        if (request.provider === 'openai') {
            return await callOpenAI(request, apiKey);
        } else if (request.provider === 'anthropic') {
            return await callAnthropic(request, apiKey);
        } else {
            throw new Error(`Unknown provider: ${request.provider}`);
        }
    } catch (error) {
        // Handle retryable errors
        if (error instanceof Error && error.message === 'RATE_LIMITED' && attempt < MAX_RETRIES) {
            const delay = INITIAL_DELAY_MS * Math.pow(2, attempt);
            logger.warn(Components.OPENAI, `Rate limited, retrying in ${delay}ms`, {
                attempt: attempt + 1,
                maxRetries: MAX_RETRIES,
            });
            await sleep(delay);
            return callWithRetry(request, attempt + 1);
        }
        throw error;
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// ------------------------------------------------------------
// Error Message Helper
// ------------------------------------------------------------

export function getProviderErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        switch (error.message) {
            case 'OPENAI_KEY_MISSING':
                return 'Please configure your OpenAI API key in Settings (⚙️)';
            case 'ANTHROPIC_KEY_MISSING':
                return 'Please configure your Anthropic API key in Settings (⚙️)';
            case 'OPENAI_KEY_INVALID':
                return 'Your OpenAI API key is invalid. Please check it in Settings (⚙️)';
            case 'ANTHROPIC_KEY_INVALID':
                return 'Your Anthropic API key is invalid. Please check it in Settings (⚙️)';
            case 'RATE_LIMITED':
                return 'Rate limited. Please wait 30 seconds and try again.';
            case 'QUOTA_EXCEEDED':
                return 'Your API quota is exceeded. Check your provider account.';
            case 'REQUEST_IN_FLIGHT':
                return 'A request is already in progress. Please wait for it to complete.';
            default:
                if (error.message.startsWith('ANTHROPIC_BAD_REQUEST:')) {
                    return error.message.replace('ANTHROPIC_BAD_REQUEST:', 'Claude error:');
                }
                return error.message;
        }
    }
    return 'An unexpected error occurred';
}
