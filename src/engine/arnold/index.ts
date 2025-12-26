import { callLLM, getProviderErrorMessage } from '../../api/providers';
import { SYSTEM_PROMPT, buildUserPrompt, buildConversationContext } from './prompts';
import {
    ArnoldInput,
    ArnoldOutput,
    Specification,
    Message,
    createTimestamp,
} from '../../types';
import { logger, Components } from '../../utils/logger';

// ============================================================
// Mini-Arnold - Documentation Engine
// ============================================================

/**
 * Process a user message and generate a specification or clarifying question.
 *
 * Mini-Arnold converts natural language into structured app specifications.
 * It asks clarifying questions when intent is ambiguous and builds the spec
 * incrementally as requirements become clear.
 */
export async function processMessage(input: ArnoldInput): Promise<ArnoldOutput> {
    logger.info(Components.ARNOLD, 'Processing message', {
        messageLength: input.message.length,
        hasSpec: !!input.currentSpec,
        historyLength: input.conversationHistory.length,
    });

    try {
        // Build the conversation history for context
        const conversationMessages = buildConversationContext(
            input.conversationHistory.map((m) => ({ role: m.role, content: m.content }))
        );

        // Build the user prompt with current spec context
        const userPrompt = buildUserPrompt(input.message, input.currentSpec);

        // Prepare API request
        const messages = [
            { role: 'system' as const, content: SYSTEM_PROMPT },
            ...conversationMessages,
            { role: 'user' as const, content: userPrompt },
        ];

        logger.debug(Components.ARNOLD, `Calling ${input.provider}`, { totalMessages: messages.length });

        // Call LLM with JSON response format
        const response = await callLLM({
            provider: input.provider,
            model: input.model,
            messages,
            responseFormat: { type: 'json_object' },
        });

        const responseText = response.text;

        // Parse the response
        const parsed = parseArnoldResponse(responseText);

        logger.info(Components.ARNOLD, 'Response parsed successfully', {
            type: parsed.type,
            confidence: parsed.confidence,
            hasSpec: !!parsed.spec,
        });

        return parsed;
    } catch (error) {
        logger.error(Components.ARNOLD, 'Processing error', { error });

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message === 'API_KEY_MISSING') {
                return {
                    type: 'question',
                    question: "🔑 **API Key Required**\n\nPlease configure your OpenAI API key in Settings (⚙️) to start building specifications.\n\nI need access to GPT-4 to understand your requirements and build a structured specification.",
                    confidence: 0,
                };
            }
            if (error.message === 'API_KEY_INVALID') {
                return {
                    type: 'question',
                    question: "⚠️ **Invalid API Key**\n\nYour OpenAI API key appears to be invalid. Please check it in Settings (⚙️).\n\nMake sure you're using a valid key from platform.openai.com/api-keys",
                    confidence: 0,
                };
            }
            if (error.message === 'RATE_LIMITED') {
                return {
                    type: 'question',
                    question: "⏳ **Temporarily Rate Limited**\n\nOpenAI has temporarily rate-limited your requests. The system retried automatically but limits persist. Please wait 30 seconds and try again.",
                    confidence: 0,
                };
            }
            if (error.message === 'QUOTA_EXCEEDED') {
                return {
                    type: 'question',
                    question: "🚫 **Quota Exceeded**\n\nYour OpenAI account has exceeded its quota. Please check your usage and billing at [platform.openai.com](https://platform.openai.com).",
                    confidence: 0,
                };
            }
            if (error.message === 'BILLING_ERROR') {
                return {
                    type: 'question',
                    question: "💳 **Billing Issue**\n\nYour OpenAI account has a billing issue. Please add a payment method at [platform.openai.com](https://platform.openai.com).",
                    confidence: 0,
                };
            }
            if (error.message === 'REQUEST_IN_FLIGHT') {
                return {
                    type: 'question',
                    question: "⏳ **Request In Progress**\n\nA request is already being processed. Please wait for it to complete.",
                    confidence: 0,
                };
            }
        }

        // Generic fallback
        return {
            type: 'question',
            question:
                "I encountered an issue understanding that. Could you rephrase your request?",
            confidence: 0,
        };
    }
}

// ------------------------------------------------------------
// Response Parsing
// ------------------------------------------------------------

/**
 * Strip markdown code blocks from response text.
 * Claude often wraps JSON in ```json ... ``` blocks.
 */
function stripMarkdownCodeBlocks(text: string): string {
    // Remove ```json or ``` at the start and ``` at the end
    let cleaned = text.trim();

    // Match ```json or ```JSON or just ```
    if (cleaned.startsWith('```')) {
        // Find the end of the first line (after ```json)
        const firstNewline = cleaned.indexOf('\n');
        if (firstNewline !== -1) {
            cleaned = cleaned.substring(firstNewline + 1);
        }
    }

    // Remove trailing ```
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    return cleaned.trim();
}

function parseArnoldResponse(responseText: string): ArnoldOutput {
    try {
        // Strip markdown code blocks if present (Claude often wraps JSON this way)
        const cleanedText = stripMarkdownCodeBlocks(responseText);
        const parsed = JSON.parse(cleanedText);

        // Validate response structure
        if (!parsed.type || !['question', 'spec_update', 'spec_complete'].includes(parsed.type)) {
            throw new Error('Invalid response type');
        }

        // Ensure confidence is a number between 0 and 1
        const confidence = typeof parsed.confidence === 'number'
            ? Math.max(0, Math.min(1, parsed.confidence))
            : 0.5;

        // Process the spec if present
        let spec: Specification | undefined;
        if (parsed.spec) {
            spec = normalizeSpec(parsed.spec);
        }

        return {
            type: parsed.type,
            question: parsed.question,
            spec,
            confidence,
        };
    } catch (error) {
        console.error('Failed to parse Arnold response:', error);
        console.error('Raw response:', responseText);

        // Return a fallback asking for clarification
        return {
            type: 'question',
            question: "I need more information. What kind of app would you like to build?",
            confidence: 0,
        };
    }
}

// ------------------------------------------------------------
// Spec Normalization
// ------------------------------------------------------------

function normalizeSpec(rawSpec: Record<string, unknown>): Specification {
    const now = createTimestamp();

    return {
        version: (rawSpec.version as string) || '1.0.0',
        meta: {
            name: (rawSpec.meta as Record<string, string>)?.name || 'Untitled App',
            description: (rawSpec.meta as Record<string, string>)?.description || '',
            createdAt: (rawSpec.meta as Record<string, string>)?.createdAt || now,
        },
        entities: normalizeEntities(rawSpec.entities),
        views: normalizeViews(rawSpec.views),
        actions: normalizeActions(rawSpec.actions),
        patterns: Array.isArray(rawSpec.patterns) ? rawSpec.patterns : [],
    };
}

function normalizeEntities(entities: unknown): Specification['entities'] {
    if (!Array.isArray(entities)) return [];

    return entities.map((entity: Record<string, unknown>, index: number) => ({
        id: (entity.id as string) || `entity_${index}`,
        name: (entity.name as string) || `Entity ${index + 1}`,
        properties: normalizeProperties(entity.properties),
        relationships: normalizeRelationships(entity.relationships),
    }));
}

function normalizeProperties(properties: unknown): Specification['entities'][0]['properties'] {
    if (!Array.isArray(properties)) return [];

    return properties.map((prop: Record<string, unknown>) => ({
        name: (prop.name as string) || 'unnamed',
        type: validatePropertyType(prop.type as string),
        required: Boolean(prop.required),
        options: Array.isArray(prop.options) ? prop.options : undefined,
    }));
}

function validatePropertyType(type: string): 'string' | 'number' | 'boolean' | 'date' | 'enum' {
    const validTypes = ['string', 'number', 'boolean', 'date', 'enum'];
    return validTypes.includes(type) ? (type as 'string' | 'number' | 'boolean' | 'date' | 'enum') : 'string';
}

function normalizeRelationships(relationships: unknown): Specification['entities'][0]['relationships'] {
    if (!Array.isArray(relationships)) return [];

    return relationships.map((rel: Record<string, unknown>) => ({
        targetEntity: (rel.targetEntity as string) || '',
        type: validateRelationType(rel.type as string),
    }));
}

function validateRelationType(type: string): 'one-to-one' | 'one-to-many' | 'many-to-many' {
    const validTypes = ['one-to-one', 'one-to-many', 'many-to-many'];
    return validTypes.includes(type) ? (type as 'one-to-one' | 'one-to-many' | 'many-to-many') : 'one-to-many';
}

function normalizeViews(views: unknown): Specification['views'] {
    if (!Array.isArray(views)) return [];

    return views.map((view: Record<string, unknown>, index: number) => ({
        id: (view.id as string) || `view_${index}`,
        name: (view.name as string) || `View ${index + 1}`,
        type: validateViewType(view.type as string),
        entity: (view.entity as string) || '',
    }));
}

function validateViewType(type: string): 'list' | 'form' | 'detail' | 'dashboard' {
    const validTypes = ['list', 'form', 'detail', 'dashboard'];
    return validTypes.includes(type) ? (type as 'list' | 'form' | 'detail' | 'dashboard') : 'list';
}

function normalizeActions(actions: unknown): Specification['actions'] {
    if (!Array.isArray(actions)) return [];

    return actions.map((action: Record<string, unknown>, index: number) => ({
        id: (action.id as string) || `action_${index}`,
        name: (action.name as string) || `Action ${index + 1}`,
        trigger: validateTriggerType(action.trigger as string),
        logic: (action.logic as string) || '',
    }));
}

function validateTriggerType(type: string): 'button' | 'form_submit' | 'auto' {
    const validTypes = ['button', 'form_submit', 'auto'];
    return validTypes.includes(type) ? (type as 'button' | 'form_submit' | 'auto') : 'button';
}

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

/**
 * Check if a spec is complete enough to generate code.
 */
export function isSpecComplete(spec: Specification | null): boolean {
    if (!spec) return false;

    return (
        spec.meta.name.length > 0 &&
        spec.entities.length > 0 &&
        spec.entities.every((e) => e.properties.length > 0) &&
        spec.views.length > 0
    );
}

/**
 * Calculate completeness score for a specification.
 */
export function calculateCompleteness(spec: Specification | null): number {
    if (!spec) return 0;

    let score = 0;
    const weights = {
        hasName: 0.1,
        hasDescription: 0.05,
        hasEntities: 0.2,
        entitiesHaveProperties: 0.25,
        hasViews: 0.2,
        hasActions: 0.1,
        hasPatterns: 0.1,
    };

    if (spec.meta.name) score += weights.hasName;
    if (spec.meta.description) score += weights.hasDescription;
    if (spec.entities.length > 0) score += weights.hasEntities;
    if (spec.entities.every((e) => e.properties.length > 0)) score += weights.entitiesHaveProperties;
    if (spec.views.length > 0) score += weights.hasViews;
    if (spec.actions.length > 0) score += weights.hasActions;
    if (spec.patterns.length > 0) score += weights.hasPatterns;

    return Math.min(1, score);
}
