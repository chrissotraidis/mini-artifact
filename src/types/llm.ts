// ============================================================
// LLM Provider Types - Unified types for multi-provider support
// ============================================================

/**
 * Supported LLM providers
 */
export type Provider = 'openai' | 'anthropic';

/**
 * Unified message format for all providers
 */
export interface LLMMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

/**
 * Unified request format for LLM calls
 */
export interface LLMRequest {
    provider: Provider;
    model: string;
    messages: LLMMessage[];
    maxTokens?: number;
    temperature?: number;
    responseFormat?: { type: 'json_object' } | { type: 'text' };
}

/**
 * Unified response format from LLM calls
 */
export interface LLMResponse {
    text: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
}

/**
 * Model info for UI display
 */
export interface ModelInfo {
    id: string;
    name: string;
    provider: Provider;
}

/**
 * Default models per provider
 */
export const DEFAULT_MODELS: Record<Provider, ModelInfo[]> = {
    openai: [
        { id: 'gpt-4o', name: 'GPT-4o (Recommended)', provider: 'openai' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'openai' },
    ],
    anthropic: [
        { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (Recommended)', provider: 'anthropic' },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic' },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic' },
    ],
};

/**
 * Default model per provider
 */
export const DEFAULT_MODEL: Record<Provider, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-20250514',
};
