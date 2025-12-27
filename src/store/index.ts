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
    Provider,
    DEFAULT_MODEL,
    Project,
} from '../types';

// ------------------------------------------------------------
// Agent Activity Type
// ------------------------------------------------------------

export type ActiveAgent = 'idle' | 'arnold' | 'nedry' | 'raptor';

// ------------------------------------------------------------
// Project Persistence Helpers
// ------------------------------------------------------------

const PROJECTS_STORAGE_KEY = 'mini-artifact-projects';

function loadProjects(): Project[] {
    try {
        const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveProjects(projects: Project[]): void {
    try {
        localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(projects));
    } catch (e) {
        console.error('Failed to save projects:', e);
    }
}

// ------------------------------------------------------------
// Store State Interface
// ------------------------------------------------------------

interface StoreState {
    // Project state
    projects: Project[];
    currentProjectId: string | null;

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
    expandedPanel: 'spec' | 'preview' | null;
    visiblePanels: { chat: boolean; spec: boolean; preview: boolean };
    errors: AppError[];

    // Loading states
    isLoading: boolean;

    // Agent activity tracking
    activeAgent: ActiveAgent;

    // Configuration
    provider: Provider;
    model: string;
}

// ------------------------------------------------------------
// Store Actions Interface
// ------------------------------------------------------------

interface StoreActions {
    // Project actions
    createProject: (name?: string) => string;
    switchProject: (projectId: string) => void;
    deleteProject: (projectId: string) => void;
    saveCurrentProject: () => void;
    renameProject: (projectId: string, name: string) => void;

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
    setExpandedPanel: (panel: 'spec' | 'preview' | null) => void;
    togglePanelVisibility: (panel: 'chat' | 'spec' | 'preview') => void;

    // Error actions
    addError: (code: string, message: string, recoverable?: boolean) => void;
    removeError: (id: string) => void;
    clearErrors: () => void;

    // Loading actions
    setLoading: (loading: boolean) => void;

    // Agent activity actions
    setActiveAgent: (agent: ActiveAgent) => void;

    // Config actions
    setProvider: (provider: Provider) => void;
    setModel: (model: string) => void;

    // Global actions
    reset: () => void;
}

// ------------------------------------------------------------
// Initial State
// ------------------------------------------------------------

const initialState: StoreState = {
    projects: loadProjects(),
    currentProjectId: null,
    messages: [],
    conversationPhase: 'gathering',
    currentSpec: null,
    specHistory: [],
    specValidation: null,
    buildResult: null,
    buildStatus: 'idle',
    phase: 'idle',
    activePanel: 'chat',
    expandedPanel: null,
    visiblePanels: { chat: true, spec: true, preview: true },
    errors: [],
    isLoading: false,
    activeAgent: 'idle',
    provider: getInitialProvider(),
    model: DEFAULT_MODEL[getInitialProvider()],
};

/**
 * Detect which provider has a valid API key configured.
 * Priority: Anthropic > OpenAI > default to OpenAI
 */
function getInitialProvider(): Provider {
    // Check localStorage for saved provider preference first
    try {
        const savedStore = sessionStorage.getItem('mini-artifact-store');
        if (savedStore) {
            const parsed = JSON.parse(savedStore);
            if (parsed?.state?.provider) {
                return parsed.state.provider as Provider;
            }
        }
    } catch {
        // Ignore parse errors
    }

    // Check which provider has API key configured
    const hasAnthropicKey = localStorage.getItem('mini-artifact-anthropic-key') !== null;
    const hasOpenAIKey = localStorage.getItem('mini-artifact-openai-key') !== null;

    // Prefer Anthropic if available, otherwise OpenAI
    if (hasAnthropicKey) {
        return 'anthropic';
    }
    if (hasOpenAIKey) {
        return 'openai';
    }

    // Default to OpenAI if no keys configured
    return 'openai';
}

// ------------------------------------------------------------
// Store Creation
// ------------------------------------------------------------

export const useStore = create<StoreState & StoreActions>()(
    persist(
        (set, get) => ({
            ...initialState,

            // Project actions
            createProject: (name?: string) => {
                const id = createId();
                const now = createTimestamp();
                const projectName = name || `Project ${get().projects.length + 1}`;

                const newProject: Project = {
                    id,
                    name: projectName,
                    createdAt: now,
                    updatedAt: now,
                    messages: [],
                    spec: null,
                    buildResult: null,
                    conversationPhase: 'gathering',
                };

                const updatedProjects = [...get().projects, newProject];
                saveProjects(updatedProjects);

                set({
                    projects: updatedProjects,
                    currentProjectId: id,
                    messages: [],
                    currentSpec: null,
                    specHistory: [],
                    buildResult: null,
                    buildStatus: 'idle',
                    conversationPhase: 'gathering',
                    expandedPanel: null,
                });

                return id;
            },

            switchProject: (projectId: string) => {
                // Save current project first
                get().saveCurrentProject();

                const project = get().projects.find(p => p.id === projectId);
                if (!project) return;

                set({
                    currentProjectId: projectId,
                    messages: project.messages,
                    currentSpec: project.spec,
                    buildResult: project.buildResult,
                    conversationPhase: project.conversationPhase,
                    buildStatus: project.buildResult?.success ? 'success' : 'idle',
                    expandedPanel: null,
                });
            },

            deleteProject: (projectId: string) => {
                const updatedProjects = get().projects.filter(p => p.id !== projectId);
                saveProjects(updatedProjects);

                // If deleting current project, switch to another or create new
                if (get().currentProjectId === projectId) {
                    if (updatedProjects.length > 0) {
                        const nextProject = updatedProjects[0];
                        set({
                            projects: updatedProjects,
                            currentProjectId: nextProject.id,
                            messages: nextProject.messages,
                            currentSpec: nextProject.spec,
                            buildResult: nextProject.buildResult,
                            conversationPhase: nextProject.conversationPhase,
                        });
                    } else {
                        set({
                            projects: updatedProjects,
                            currentProjectId: null,
                            messages: [],
                            currentSpec: null,
                            buildResult: null,
                            conversationPhase: 'gathering',
                        });
                    }
                } else {
                    set({ projects: updatedProjects });
                }
            },

            saveCurrentProject: () => {
                const { currentProjectId, messages, currentSpec, buildResult, conversationPhase, projects } = get();
                if (!currentProjectId) return;

                const updatedProjects = projects.map(p => {
                    if (p.id === currentProjectId) {
                        return {
                            ...p,
                            updatedAt: createTimestamp(),
                            messages,
                            spec: currentSpec,
                            buildResult,
                            conversationPhase,
                        };
                    }
                    return p;
                });

                saveProjects(updatedProjects);
                set({ projects: updatedProjects });
            },

            renameProject: (projectId: string, name: string) => {
                const updatedProjects = get().projects.map(p => {
                    if (p.id === projectId) {
                        return { ...p, name, updatedAt: createTimestamp() };
                    }
                    return p;
                });
                saveProjects(updatedProjects);
                set({ projects: updatedProjects });
            },

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
                // Auto-save after message
                setTimeout(() => get().saveCurrentProject(), 100);
            },

            clearMessages: () => set({ messages: [] }),

            // Spec actions
            setSpec: (spec) => {
                set((state) => ({
                    currentSpec: spec,
                    specHistory: [...state.specHistory, spec],
                }));
                // Auto-save after spec update
                setTimeout(() => get().saveCurrentProject(), 100);
            },

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
            setBuildResult: (result) => {
                set({ buildResult: result });
                // Auto-save after build
                setTimeout(() => get().saveCurrentProject(), 100);
            },

            setBuildStatus: (status) => set({ buildStatus: status }),

            clearBuildResult: () =>
                set({
                    buildResult: null,
                    buildStatus: 'idle',
                }),

            // Phase actions
            setPhase: (phase) => set({ phase }),

            setConversationPhase: (phase) => {
                set({ conversationPhase: phase });
                // Auto-save after phase change
                setTimeout(() => get().saveCurrentProject(), 100);
            },

            // UI actions
            setActivePanel: (panel) => set({ activePanel: panel }),
            setExpandedPanel: (panel) => set({ expandedPanel: panel }),
            togglePanelVisibility: (panel) => set((state) => ({
                visiblePanels: {
                    ...state.visiblePanels,
                    [panel]: !state.visiblePanels[panel]
                }
            })),

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

            // Agent activity actions
            setActiveAgent: (agent) => set({ activeAgent: agent }),

            // Config actions
            setProvider: (provider) => set((state) => ({
                provider,
                model: DEFAULT_MODEL[provider],
            })),
            setModel: (model) => set({ model }),

            // Global actions
            reset: () => {
                // Create a new project instead of just resetting
                set((state) => ({
                    ...initialState,
                    projects: state.projects,
                    // Preserve provider and model settings
                    provider: state.provider,
                    model: state.model,
                }));
            },
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
                provider: state.provider,
                model: state.model,
                currentProjectId: state.currentProjectId,
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
export const selectExpandedPanel = (state: StoreState) => state.expandedPanel;
export const selectVisiblePanels = (state: StoreState) => state.visiblePanels;
export const selectProvider = (state: StoreState) => state.provider;
export const selectModel = (state: StoreState) => state.model;
export const selectActiveAgent = (state: StoreState) => state.activeAgent;
export const selectProjects = (state: StoreState) => state.projects;
export const selectCurrentProjectId = (state: StoreState) => state.currentProjectId;
export const selectSetProvider = (state: StoreActions) => state.setProvider;
export const selectSetModel = (state: StoreActions) => state.setModel;
export const selectSetExpandedPanel = (state: StoreActions) => state.setExpandedPanel;

export const selectCanGenerate = (state: StoreState) =>
    state.currentSpec !== null &&
    state.buildStatus !== 'building' &&
    (state.conversationPhase === 'refining' || state.conversationPhase === 'complete');
