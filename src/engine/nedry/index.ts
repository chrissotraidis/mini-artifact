import { processMessage } from '../arnold';
import { build } from '../raptor';
import { validateSpec } from './validator';
import { matchPatterns, sortPatternsByDependency } from './router';
import {
    NedryInput,
    NedryOutput,
    AppState,
    AppError,
    BuildResult,
    createId,
    createTimestamp,
} from '../../types';

// ============================================================
// Mini-Nedry - Orchestration Layer
// ============================================================

/**
 * Handle input and route to appropriate handler.
 *
 * Mini-Nedry coordinates between Arnold (spec building) and Raptor (code generation).
 * It validates specs, manages workflow state, and handles errors.
 */
export async function handleInput(input: NedryInput): Promise<NedryOutput> {
    const { type, payload, currentState } = input;

    try {
        switch (type) {
            case 'user_message':
                return await handleUserMessage(payload as string, currentState);

            case 'spec_update':
                return handleSpecUpdate(payload, currentState);

            case 'build_request':
                return await handleBuildRequest(currentState);

            case 'error':
                return handleError(payload as AppError, currentState);

            default:
                return createErrorOutput(`Unknown input type: ${type}`);
        }
    } catch (error) {
        console.error('Nedry handling error:', error);
        return createErrorOutput(
            error instanceof Error ? error.message : 'An unexpected error occurred'
        );
    }
}

// ------------------------------------------------------------
// Input Handlers
// ------------------------------------------------------------

async function handleUserMessage(
    message: string,
    currentState: AppState
): Promise<NedryOutput> {
    // Route to Arnold for spec building
    const arnoldResult = await processMessage({
        message,
        conversationHistory: currentState.messages,
        currentSpec: currentState.currentSpec,
        model: currentState.aiModel,
    });

    // Handle different response types
    if (arnoldResult.type === 'question') {
        return {
            action: {
                type: 'display_question',
                question: arnoldResult.question || 'Could you provide more details?',
            },
            stateUpdate: {
                conversationPhase: 'gathering',
            },
        };
    }

    // Spec update or complete
    const newSpec = arnoldResult.spec || currentState.currentSpec;

    // Validate the new spec
    const validation = validateSpec(newSpec);

    // Determine conversation phase based on confidence
    const conversationPhase =
        arnoldResult.confidence >= 0.9
            ? 'complete'
            : arnoldResult.confidence >= 0.5
                ? 'refining'
                : 'gathering';

    return {
        action: {
            type: 'update_ui',
            update: {
                spec: newSpec || undefined,
                phase: conversationPhase,
            },
        },
        stateUpdate: {
            currentSpec: newSpec,
            specValidation: validation,
            conversationPhase,
        },
    };
}

function handleSpecUpdate(
    payload: unknown,
    _currentState: AppState
): NedryOutput {
    // Direct spec update (e.g., from manual editing)
    const spec = payload as AppState['currentSpec'];
    const validation = validateSpec(spec);

    return {
        action: {
            type: 'update_ui',
            update: {
                spec: spec || undefined,
            },
        },
        stateUpdate: {
            currentSpec: spec,
            specValidation: validation,
        },
    };
}

async function handleBuildRequest(currentState: AppState): Promise<NedryOutput> {
    const { currentSpec } = currentState;

    // Validate spec before building
    if (!currentSpec) {
        return createErrorOutput('No specification available to build');
    }

    const validation = validateSpec(currentSpec);
    if (!validation.valid) {
        const errorMessages = validation.errors.map((e) => e.message).join('; ');
        return createErrorOutput(`Spec validation failed: ${errorMessages}`);
    }

    // Match patterns and sort by dependencies
    const patterns = matchPatterns(currentSpec);
    const sortedPatterns = sortPatternsByDependency(patterns);

    // Call Raptor to build
    const raptorResult = await build({
        specId: currentSpec.version,
        spec: currentSpec,
        patterns: sortedPatterns,
        deltas: [], // No delta generation in MVP
        config: {
            includeStyles: true,
            includeScripts: true,
            minify: false,
        },
    });

    // Convert RaptorOutput to BuildResult
    const buildResult: BuildResult = {
        success: raptorResult.success,
        html: raptorResult.html,
        css: raptorResult.css,
        javascript: raptorResult.javascript,
        errors: raptorResult.errors?.map((e) => e.message),
    };

    if (!buildResult.success) {
        return {
            action: {
                type: 'display_error',
                error: {
                    id: createId(),
                    code: 'BUILD_FAILED',
                    message: buildResult.errors?.join('; ') || 'Build failed',
                    timestamp: createTimestamp(),
                    recoverable: true,
                },
            },
            stateUpdate: {
                buildStatus: 'error',
                buildResult,
            },
        };
    }

    return {
        action: {
            type: 'update_ui',
            update: {
                buildResult,
                phase: 'complete',
            },
        },
        stateUpdate: {
            buildResult,
            buildStatus: 'success',
        },
    };
}

function handleError(error: AppError, currentState: AppState): NedryOutput {
    return {
        action: {
            type: 'display_error',
            error,
        },
        stateUpdate: {
            errors: [...currentState.errors, error],
        },
    };
}

// ------------------------------------------------------------
// Utility Functions
// ------------------------------------------------------------

function createErrorOutput(message: string): NedryOutput {
    return {
        action: {
            type: 'display_error',
            error: {
                id: createId(),
                code: 'NEDRY_ERROR',
                message,
                timestamp: createTimestamp(),
                recoverable: true,
            },
        },
        stateUpdate: {},
        errors: [
            {
                id: createId(),
                code: 'NEDRY_ERROR',
                message,
                timestamp: createTimestamp(),
                recoverable: true,
            },
        ],
    };
}

// ------------------------------------------------------------
// Workflow State Machine
// ------------------------------------------------------------

export type WorkflowPhase =
    | 'idle'
    | 'gathering'
    | 'refining'
    | 'validating'
    | 'building'
    | 'complete'
    | 'error';

export function getNextPhase(
    currentPhase: WorkflowPhase,
    event: 'message_received' | 'spec_complete' | 'build_started' | 'build_complete' | 'error'
): WorkflowPhase {
    const transitions: Record<WorkflowPhase, Record<string, WorkflowPhase>> = {
        idle: {
            message_received: 'gathering',
        },
        gathering: {
            message_received: 'gathering',
            spec_complete: 'validating',
        },
        refining: {
            message_received: 'refining',
            spec_complete: 'validating',
        },
        validating: {
            build_started: 'building',
            error: 'error',
        },
        building: {
            build_complete: 'complete',
            error: 'error',
        },
        complete: {
            message_received: 'refining',
        },
        error: {
            message_received: 'gathering',
        },
    };

    return transitions[currentPhase]?.[event] || currentPhase;
}
