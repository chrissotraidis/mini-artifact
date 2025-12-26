// ============================================================
// Mini Artifact - Core TypeScript Interfaces
// ============================================================

// Import and re-export LLM types for convenience
import type { Provider } from './llm';
export type { Provider, LLMMessage, LLMRequest, LLMResponse, ModelInfo } from './llm';
export { DEFAULT_MODELS, DEFAULT_MODEL } from './llm';

// ------------------------------------------------------------
// Message Types
// ------------------------------------------------------------

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}

// ------------------------------------------------------------
// Specification Structure (Mini-Arnold output)
// ------------------------------------------------------------

export interface Specification {
    version: string;
    meta: {
        name: string;
        description: string;
        createdAt: string;
    };
    entities: Entity[];
    views: View[];
    actions: Action[];
    patterns: string[];
}

export interface Entity {
    id: string;
    name: string;
    properties: Property[];
    relationships: Relationship[];
}

export interface Property {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'date' | 'enum';
    required: boolean;
    options?: string[]; // For enum type
}

export interface Relationship {
    targetEntity: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-many';
}

export interface View {
    id: string;
    name: string;
    type: 'list' | 'form' | 'detail' | 'dashboard';
    entity: string; // Entity ID
}

export interface Action {
    id: string;
    name: string;
    trigger: 'button' | 'form_submit' | 'auto';
    logic: string; // Description of what happens
}

// ------------------------------------------------------------
// Mini-Arnold Interfaces
// ------------------------------------------------------------

export interface ArnoldInput {
    message: string;
    conversationHistory: Message[];
    currentSpec: Specification | null;
    provider: Provider;
    model: string;
}

export interface ArnoldOutput {
    type: 'question' | 'spec_update' | 'spec_complete';
    question?: string;
    spec?: Specification;
    confidence: number; // 0-1
}

// ------------------------------------------------------------
// Mini-Nedry Interfaces
// ------------------------------------------------------------

export interface NedryInput {
    type: 'user_message' | 'spec_update' | 'build_request' | 'error';
    payload: unknown;
    currentState: AppState;
}

export interface NedryOutput {
    action: NedryAction;
    stateUpdate: Partial<AppState>;
    errors?: AppError[];
}

export type NedryAction =
    | { type: 'route_to_arnold'; input: ArnoldInput }
    | { type: 'route_to_raptor'; input: RaptorInput }
    | { type: 'display_question'; question: string }
    | { type: 'display_error'; error: AppError }
    | { type: 'update_ui'; update: UIUpdate };

export interface UIUpdate {
    spec?: Specification;
    buildResult?: BuildResult;
    phase?: WorkflowPhase;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    completeness: number; // 0-1
}

export interface ValidationError {
    code: string;
    message: string;
    path?: string;
}

export interface ValidationWarning {
    code: string;
    message: string;
    path?: string;
}

// ------------------------------------------------------------
// Mini-Raptor Interfaces
// ------------------------------------------------------------

export interface RaptorInput {
    specId: string;
    spec: Specification;
    patterns: PatternReference[];
    deltas: DeltaRequirement[];
    config: BuildConfig;
}

export interface PatternReference {
    patternId: string;
    targetId: string;
    config: Record<string, unknown>;
}

export interface DeltaRequirement {
    id: string;
    description: string;
    context: string;
}

export interface BuildConfig {
    includeStyles: boolean;
    includeScripts: boolean;
    minify: boolean;
}

export interface RaptorOutput {
    success: boolean;
    html: string;
    css: string;
    javascript: string;
    manifest: BuildManifest;
    errors?: BuildError[];
}

export interface BuildManifest {
    specId: string;
    builtAt: string;
    patternsUsed: string[];
    deltasGenerated: string[];
}

export interface BuildError {
    code: string;
    message: string;
    patternId?: string;
}

// ------------------------------------------------------------
// Pattern Structure
// ------------------------------------------------------------

export interface Pattern {
    id: string;
    name: string;
    description: string;
    category: 'layout' | 'entity' | 'view' | 'action' | 'utility';
    inputs: PatternInput[];
    template: {
        html: string;
        css: string;
        js: string;
    };
    dependencies: string[];
}

export interface PatternInput {
    name: string;
    type: string;
    required: boolean;
    default?: unknown;
}

// ------------------------------------------------------------
// App State
// ------------------------------------------------------------

export interface AppState {
    // Conversation state
    messages: Message[];
    conversationPhase: 'gathering' | 'refining' | 'complete';

    // Specification state
    currentSpec: Specification | null;
    specHistory: Specification[];
    specValidation: ValidationResult | null;

    // Build state
    buildInstructions: BuildInstructions | null;
    buildResult: BuildResult | null;
    buildStatus: 'idle' | 'building' | 'success' | 'error';

    // UI state
    activePanel: 'chat' | 'spec' | 'preview';
    errors: AppError[];

    // LLM Configuration
    provider: Provider;
    model: string;
}

export interface BuildInstructions {
    specId: string;
    patterns: PatternReference[];
    deltas: DeltaRequirement[];
    order: string[];
    config: BuildConfig;
}

export interface BuildResult {
    success: boolean;
    html: string;
    css: string;
    javascript: string;
    combinedOutput?: string;
    errors?: string[];
    warnings?: string[];
}

export interface AppError {
    id: string;
    code: string;
    message: string;
    timestamp: string;
    recoverable: boolean;
}

// ------------------------------------------------------------
// Workflow Types
// ------------------------------------------------------------

export type WorkflowPhase =
    | 'idle'
    | 'gathering'
    | 'refining'
    | 'validating'
    | 'building'
    | 'complete'
    | 'error';

// ------------------------------------------------------------
// API Types
// ------------------------------------------------------------

export interface ChatRequest {
    messages: Array<{
        role: 'system' | 'user' | 'assistant';
        content: string;
    }>;
    response_format?: { type: 'json_object' | 'text' };
    model?: 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
}

export type AiModel = 'gpt-4o' | 'gpt-4-turbo' | 'gpt-3.5-turbo';

export interface ChatResponse {
    content: string;
}

// ------------------------------------------------------------
// Utility Types
// ------------------------------------------------------------

export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function createId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createTimestamp(): string {
    return new Date().toISOString();
}
