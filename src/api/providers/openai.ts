// ============================================================
// OpenAI Provider Adapter
// ============================================================

import { LLMRequest, LLMResponse, LLMMessage } from '../../types/llm';
import { logger, Components } from '../../utils/logger';

// Use local proxy in dev to bypass CORS, direct API in production
const OPENAI_API_ENDPOINT = import.meta.env.DEV
    ? '/api/openai/v1/chat/completions'  // Vite proxy
    : 'https://api.openai.com/v1/chat/completions';

/**
 * Call OpenAI API directly
 * 
 * In dev: Uses Vite proxy to bypass CORS
 * In production: Should go through Edge Function
 */
export async function callOpenAI(
    request: LLMRequest,
    apiKey: string
): Promise<LLMResponse> {
    logger.debug(Components.OPENAI, 'Preparing OpenAI request', {
        model: request.model,
        messageCount: request.messages.length,
        endpoint: import.meta.env.DEV ? 'proxy' : 'direct',
    });

    const body = {
        model: request.model,
        messages: request.messages.map((m) => ({
            role: m.role,
            content: m.content,
        })),
        temperature: request.temperature ?? 0,
        ...(request.maxTokens && { max_tokens: request.maxTokens }),
        ...(request.responseFormat && { response_format: request.responseFormat }),
    };

    const response = await fetch(OPENAI_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorText = await response.text();
        logger.error(Components.OPENAI, `API error: ${response.status}`, { errorText });

        if (response.status === 401) {
            throw new Error('OPENAI_KEY_INVALID');
        }
        if (response.status === 429) {
            throw new Error('OPENAI_RATE_LIMITED');
        }
        throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content || '';

    logger.info(Components.OPENAI, 'API call successful', {
        model: request.model,
        responseLength: text.length,
    });

    return {
        text,
        usage: data.usage
            ? {
                inputTokens: data.usage.prompt_tokens,
                outputTokens: data.usage.completion_tokens,
            }
            : undefined,
    };
}

/**
 * Convert unified messages to OpenAI format
 * (OpenAI supports system messages directly in the messages array)
 */
export function convertToOpenAIMessages(
    messages: LLMMessage[]
): Array<{ role: string; content: string }> {
    return messages.map((m) => ({
        role: m.role,
        content: m.content,
    }));
}
