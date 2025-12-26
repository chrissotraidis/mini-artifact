// ============================================================
// Anthropic (Claude) Provider Adapter
// ============================================================

import { LLMRequest, LLMResponse, LLMMessage } from '../../types/llm';
import { logger, Components } from '../../utils/logger';

// Use local proxy in dev to bypass CORS, direct API in production
const ANTHROPIC_API_ENDPOINT = import.meta.env.DEV
    ? '/api/anthropic/v1/messages'  // Vite proxy
    : 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * Call Anthropic Claude API directly
 * 
 * In dev: Uses Vite proxy to bypass CORS
 * In production: Should go through Edge Function
 */
export async function callAnthropic(
    request: LLMRequest,
    apiKey: string
): Promise<LLMResponse> {
    logger.debug(Components.OPENAI, 'Preparing Anthropic request', {
        model: request.model,
        messageCount: request.messages.length,
        endpoint: import.meta.env.DEV ? 'proxy' : 'direct',
    });

    // Extract system message (Anthropic requires it as a top-level param)
    const { systemPrompt, messages } = extractSystemPrompt(request.messages);

    const body = {
        model: request.model,
        max_tokens: request.maxTokens ?? 4096, // Anthropic requires max_tokens
        messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
        })),
        ...(systemPrompt && { system: systemPrompt }),
        ...(request.temperature !== undefined && { temperature: request.temperature }),
    };

    const response = await fetch(ANTHROPIC_API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': ANTHROPIC_VERSION,
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errorBody = await parseErrorBody(response);
        const errorType = classifyAnthropicError(errorBody, response.status);
        logger.error(Components.OPENAI, `Anthropic API error: ${response.status}`, errorBody);
        throw new Error(errorType);
    }

    const data = await response.json();

    // Anthropic returns content as an array of blocks
    const text = flattenContent(data.content);

    logger.info(Components.OPENAI, 'Anthropic API call successful', {
        model: request.model,
        responseLength: text.length,
        stopReason: data.stop_reason,
    });

    return {
        text,
        usage: data.usage
            ? {
                inputTokens: data.usage.input_tokens,
                outputTokens: data.usage.output_tokens,
            }
            : undefined,
    };
}

/**
 * Extract system prompt from messages
 * Anthropic requires system as a top-level parameter, not in messages
 */
function extractSystemPrompt(messages: LLMMessage[]): {
    systemPrompt: string | null;
    messages: LLMMessage[];
} {
    const systemMessages = messages.filter((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    // Combine all system messages into one
    const systemPrompt =
        systemMessages.length > 0
            ? systemMessages.map((m) => m.content).join('\n\n')
            : null;

    return {
        systemPrompt,
        messages: nonSystemMessages,
    };
}

/**
 * Flatten Anthropic content blocks into a single string
 * Anthropic returns: [{ type: "text", text: "..." }, ...]
 */
function flattenContent(content: Array<{ type: string; text?: string }>): string {
    return content
        .filter((block) => block.type === 'text' && block.text)
        .map((block) => block.text)
        .join('');
}

/**
 * Parse error body from response
 */
async function parseErrorBody(response: Response): Promise<Record<string, unknown>> {
    try {
        const text = await response.text();
        return JSON.parse(text);
    } catch {
        return {};
    }
}

/**
 * Classify Anthropic error into standard error types
 */
function classifyAnthropicError(body: Record<string, unknown>, status: number): string {
    const error = body?.error as Record<string, unknown> | undefined;
    const errorType = (error?.type as string) || '';
    const errorMessage = (error?.message as string) || '';

    logger.error(Components.OPENAI, 'Anthropic error classification', {
        status,
        errorType,
        errorMessage,
    });

    if (status === 401) {
        return 'ANTHROPIC_KEY_INVALID';
    }

    if (status === 429) {
        if (errorMessage.includes('quota') || errorType === 'insufficient_quota') {
            return 'QUOTA_EXCEEDED';
        }
        return 'RATE_LIMITED';
    }

    if (status === 400) {
        return `ANTHROPIC_BAD_REQUEST: ${errorMessage}`;
    }

    return `ANTHROPIC_ERROR: ${status} - ${errorMessage}`;
}
