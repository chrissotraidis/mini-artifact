import React, { useState, useCallback } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { SpecPanel } from './components/SpecPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { Controls } from './components/Controls';
import { OnboardingModal } from './components/OnboardingModal';
import { Sidebar } from './components/Sidebar';
import { WorkflowIndicator } from './components/WorkflowIndicator';
import { useStore, selectProvider } from './store';
import { hasApiKey } from './api/providers';

// ============================================================
// App - Main Application Layout
// ============================================================

function App() {
    const provider = useStore(selectProvider);
    const [showOnboarding, setShowOnboarding] = useState(() => !hasApiKey(provider));
    const errors = useStore((s) => s.errors);
    const removeError = useStore((s) => s.removeError);
    const conversationPhase = useStore((s) => s.conversationPhase);
    const buildStatus = useStore((s) => s.buildStatus);

    // Determine workflow phase for indicator
    const getWorkflowPhase = () => {
        if (buildStatus === 'building') return 'building';
        if (buildStatus === 'success') return 'complete';
        if (buildStatus === 'error') return 'error';
        return conversationPhase;
    };

    // Handle message send from ChatPanel examples
    const handleSendMessage = useCallback((message: string) => {
        // Use the global sendMessage function exposed by Controls
        const sendFn = (window as { sendMessage?: (t: string) => void }).sendMessage;
        if (sendFn) {
            sendFn(message);
        }
    }, []);

    return (
        <div className="app">
            {/* Onboarding Modal */}
            {showOnboarding && (
                <OnboardingModal onComplete={() => setShowOnboarding(false)} />
            )}

            {/* Sidebar Navigation */}
            <Sidebar />

            {/* Main Content Area */}
            <main className="app-main">
                {/* Notion-style Page Header */}
                <header className="page-header">
                    <div className="page-title">
                        <span className="page-icon">📦</span>
                        <div className="breadcrumbs">
                            <span>Ingen Systems</span>
                            <span className="mx-2">/</span>
                            <span>Project Genome</span>
                            <span className="mx-2">/</span>
                            <span className="text-primary font-medium">Spec-001</span>
                        </div>
                    </div>

                    {/* Integrated Workflow Indicator */}
                    <div className="workflow-container-compact">
                        <WorkflowIndicator currentPhase={getWorkflowPhase()} />
                    </div>

                    <div className="header-actions flex gap-2">
                        {/* Future: Share/Export buttons */}
                    </div>
                </header>

                <div className="panel-container">
                    <ChatPanel onSendMessage={handleSendMessage} />
                    <SpecPanel />
                    <PreviewPanel />
                </div>

                {/* Footer Controls - Now styled as part of the workspace */}
                <footer className="app-footer">
                    <Controls />
                </footer>
            </main>

            {/* Error Toast */}
            {errors.length > 0 && (
                <div className="error-toast-container">
                    {errors.map((error) => (
                        <div key={error.id} className="error-toast">
                            <span className="error-toast-message">{error.message}</span>
                            <button
                                className="error-toast-close"
                                onClick={() => removeError(error.id)}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Keyboard Shortcuts Help */}
            <div className="shortcuts-help">
                <span>Enter: Send</span>
                <span>⌘+Enter: Generate</span>
                <span>⌘+E: Export</span>
            </div>
        </div>
    );
}

export default App;
