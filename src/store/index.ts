import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
    Message,
    Specification,
    BuildResult,
    AppError,
    WorkflowPhase,
    ValidationResult,
    createId,
    createTimestamp,
    AiModel,
} from '../types';

// ------------------------------------------------------------
// Store State Interface
// ------------------------------------------------------------

interface StoreState {
    // Conversation state
    messages: Message[];
    conversationPhase: 'gathering' | 'refining' | 'complete';

    // Specification state
    currentSpec: Specification | null;
    specHistory: Specification[];
    specValidation: ValidationResult | null;

    // Build state
    buildResult: BuildResult | null;
    buildStatus: 'idle' | 'building' | 'success' | 'error';

    // Workflow state
    phase: WorkflowPhase;

    // UI state
    activePanel: 'chat' | 'spec' | 'preview';
    errors: AppError[];

    // Loading states
    // Loading states
    isLoading: boolean;

    // Configuration
    aiModel: AiModel;
}

// ------------------------------------------------------------
// Store Actions Interface
// ------------------------------------------------------------

interface StoreActions {
    // Message actions
    addMessage: (role: 'user' | 'assistant' | 'system', content: string) => void;
    clearMessages: () => void;

    // Spec actions
    setSpec: (spec: Specification) => void;
    updateSpec: (updates: Partial<Specification>) => void;
    clearSpec: () => void;
    setSpecValidation: (validation: ValidationResult) => void;

    // Build actions
    setBuildResult: (result: BuildResult) => void;
    setBuildStatus: (status: 'idle' | 'building' | 'success' | 'error') => void;
    clearBuildResult: () => void;

    // Phase actions
    setPhase: (phase: WorkflowPhase) => void;
    setConversationPhase: (phase: 'gathering' | 'refining' | 'complete') => void;

    // UI actions
    setActivePanel: (panel: 'chat' | 'spec' | 'preview') => void;

    // Error actions
    addError: (code: string, message: string, recoverable?: boolean) => void;
    removeError: (id: string) => void;
    clearErrors: () => void;

    // Loading actions
    setLoading: (loading: boolean) => void;

    // Config actions
    setAiModel: (model: AiModel) => void;

    // Global actions
    reset: () => void;
}

// ------------------------------------------------------------
// Initial State
// ------------------------------------------------------------

const initialState: StoreState = {
    messages: [],
    conversationPhase: 'gathering',
    currentSpec: null,
    specHistory: [],
    specValidation: null,
    buildResult: null,
    buildStatus: 'idle',
    phase: 'idle',
    activePanel: 'chat',
    errors: [],
    isLoading: false,
    aiModel: 'gpt-4o',
};

// ------------------------------------------------------------
// Store Creation
// ------------------------------------------------------------

export const useStore = create<StoreState & StoreActions>()(
    persist(
        (set) => ({
            ...initialState,

            // Message actions
            addMessage: (role, content) => {
                const message: Message = {
                    id: createId(),
                    role,
                    content,
                    timestamp: createTimestamp(),
                };
                set((state) => ({
                    messages: [...state.messages, message],
                }));
            },

            clearMessages: () => set({ messages: [] }),

            // Spec actions
            setSpec: (spec) =>
                set((state) => ({
                    currentSpec: spec,
                    specHistory: [...state.specHistory, spec],
                })),

            updateSpec: (updates) =>
                set((state) => ({
                    currentSpec: state.currentSpec
                        ? { ...state.currentSpec, ...updates }
                        : null,
                })),

            clearSpec: () =>
                set({
                    currentSpec: null,
                    specValidation: null,
                }),

            setSpecValidation: (validation) => set({ specValidation: validation }),

            // Build actions
            setBuildResult: (result) => set({ buildResult: result }),

            setBuildStatus: (status) => set({ buildStatus: status }),

            clearBuildResult: () =>
                set({
                    buildResult: null,
                    buildStatus: 'idle',
                }),

            // Phase actions
            setPhase: (phase) => set({ phase }),

            setConversationPhase: (phase) => set({ conversationPhase: phase }),

            // UI actions
            setActivePanel: (panel) => set({ activePanel: panel }),

            // Error actions
            addError: (code, message, recoverable = true) => {
                const error: AppError = {
                    id: createId(),
                    code,
                    message,
                    timestamp: createTimestamp(),
                    recoverable,
                };
                set((state) => ({
                    errors: [...state.errors, error],
                }));
            },

            removeError: (id) =>
                set((state) => ({
                    errors: state.errors.filter((e) => e.id !== id),
                })),

            clearErrors: () => set({ errors: [] }),

            // Loading actions
            setLoading: (loading) => set({ isLoading: loading }),

            // Config actions
            setAiModel: (model) => set({ aiModel: model }),

            // Global actions
            reset: () => set(initialState),
        }),
        {
            name: 'mini-artifact-store',
            storage: createJSONStorage(() => sessionStorage),
            partialize: (state) => ({
                messages: state.messages,
                currentSpec: state.currentSpec,
                specHistory: state.specHistory,
                buildResult: state.buildResult,
                phase: state.phase,
                conversationPhase: state.conversationPhase,
                aiModel: state.aiModel,
            }),
        }
    )
);

// ------------------------------------------------------------
// Selectors (for optimized re-renders)
// ------------------------------------------------------------

export const selectMessages = (state: StoreState) => state.messages;
export const selectCurrentSpec = (state: StoreState) => state.currentSpec;
export const selectBuildResult = (state: StoreState) => state.buildResult;
export const selectBuildStatus = (state: StoreState) => state.buildStatus;
export const selectPhase = (state: StoreState) => state.phase;
export const selectErrors = (state: StoreState) => state.errors;
export const selectIsLoading = (state: StoreState) => state.isLoading;
export const selectActivePanel = (state: StoreState) => state.activePanel;
export const selectAiModel = (state: StoreState) => state.aiModel;
export const selectSetAiModel = (state: StoreActions) => state.setAiModel;

export const selectCanGenerate = (state: StoreState) =>
    state.currentSpec !== null &&
    state.buildStatus !== 'building' &&
    (state.conversationPhase === 'refining' || state.conversationPhase === 'complete');
