import React, { useState, useCallback } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { SpecPanel } from './components/SpecPanel';
import { PreviewPanel } from './components/PreviewPanel';
import { ResizablePanels } from './components/ResizablePanels';
import { Controls } from './components/Controls';
import { OnboardingModal } from './components/OnboardingModal';
import { Sidebar } from './components/Sidebar';
import { useStore, selectProvider, selectExpandedPanel, selectCanGenerate, selectIsLoading, selectBuildResult, selectVisiblePanels } from './store';
import { hasApiKey } from './api/providers';
import { handleInput } from './engine/nedry';
import { getProviderErrorMessage } from './api/providers';
import { Eye, EyeOff, MessageSquare, FileCode, Monitor } from 'lucide-react';

// ============================================================
// App - Main Application Layout
// ============================================================

function App() {
    const provider = useStore(selectProvider);
    const expandedPanel = useStore(selectExpandedPanel);
    const visiblePanels = useStore(selectVisiblePanels);
    const togglePanelVisibility = useStore((s) => s.togglePanelVisibility);
    const setExpandedPanel = useStore((s) => s.setExpandedPanel);
    const [showOnboarding, setShowOnboarding] = useState(() => !hasApiKey(provider));
    const errors = useStore((s) => s.errors);
    const removeError = useStore((s) => s.removeError);

    // For Generate button in expanded spec view
    const canGenerate = useStore(selectCanGenerate);
    const isLoading = useStore(selectIsLoading);
    const buildResult = useStore(selectBuildResult);
    const currentSpec = useStore((s) => s.currentSpec);
    const messages = useStore((s) => s.messages);
    const model = useStore((s) => s.model);
    const addMessage = useStore((s) => s.addMessage);
    const setLoading = useStore((s) => s.setLoading);
    const setBuildStatus = useStore((s) => s.setBuildStatus);
    const setBuildResult = useStore((s) => s.setBuildResult);

    // Handle message send from ChatPanel examples
    const handleSendMessage = useCallback((message: string) => {
        const sendFn = (window as { sendMessage?: (t: string) => void }).sendMessage;
        if (sendFn) {
            sendFn(message);
        }
    }, []);

    // Handle collapse when clicking close on expanded panel
    const handleCollapsePanel = () => {
        setExpandedPanel(null);
    };

    // Handle Generate from expanded spec view
    const handleGenerate = async () => {
        if (!canGenerate || isLoading) return;

        setBuildStatus('building');
        setLoading(true);

        try {
            const result = await handleInput({
                type: 'build_request',
                payload: null,
                currentState: {
                    messages,
                    currentSpec,
                    specHistory: [],
                    specValidation: null,
                    buildInstructions: null,
                    buildResult: null,
                    buildStatus: 'building',
                    conversationPhase: 'complete',
                    activePanel: 'preview',
                    errors: [],
                    provider,
                    model,
                },
            });

            if (result.stateUpdate.buildResult) {
                setBuildResult(result.stateUpdate.buildResult);
                setBuildStatus(result.stateUpdate.buildResult.success ? 'success' : 'error');

                if (result.stateUpdate.buildResult.success) {
                    addMessage('assistant', '✅ Build complete! Check the Preview panel to see your app.');
                    setExpandedPanel('preview');
                }
            }
        } catch (error) {
            console.error('Build error:', error);
            setBuildStatus('error');
            addMessage('assistant', `⚠️ Build failed: ${getProviderErrorMessage(error)}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle Export from expanded preview view
    const handleExport = () => {
        if (!buildResult?.html) return;

        const blob = new Blob([buildResult.html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentSpec?.meta.name || 'app'}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Count visible panels for layout
    const visibleCount = Object.values(visiblePanels).filter(Boolean).length;

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
                {/* Expanded Spec Panel View */}
                {expandedPanel === 'spec' && (
                    <div className="expanded-panel">
                        <div className="expanded-panel-header">
                            <h2>📋 Specification</h2>
                            <div className="expanded-panel-actions">
                                <button
                                    className={`btn ${canGenerate ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={handleGenerate}
                                    disabled={!canGenerate || isLoading}
                                >
                                    {isLoading ? '⏳ Building...' : '🚀 Generate App'}
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleCollapsePanel}
                                >
                                    ← Back
                                </button>
                            </div>
                        </div>
                        <SpecPanel hideHeader />
                    </div>
                )}

                {/* Expanded Preview Panel View */}
                {expandedPanel === 'preview' && (
                    <div className="expanded-panel">
                        <div className="expanded-panel-header">
                            <h2>🖥️ Preview</h2>
                            <div className="expanded-panel-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleExport}
                                    disabled={!buildResult?.success}
                                >
                                    📥 Export HTML
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleCollapsePanel}
                                >
                                    ← Back
                                </button>
                            </div>
                        </div>
                        <PreviewPanel hideHeader />
                    </div>
                )}

                {/* Normal Multi-Panel Layout */}
                {!expandedPanel && (
                    <>
                        {/* Panel Toggle Bar */}
                        <div className="panel-toggle-bar">
                            <span className="panel-toggle-label">Show Panels:</span>
                            <button
                                className={`panel-toggle-chip ${visiblePanels.chat ? 'active' : ''}`}
                                onClick={() => togglePanelVisibility('chat')}
                                disabled={visibleCount === 1 && visiblePanels.chat}
                                title="Toggle Chat panel"
                            >
                                <MessageSquare size={14} />
                                Chat
                            </button>
                            <button
                                className={`panel-toggle-chip ${visiblePanels.spec ? 'active' : ''}`}
                                onClick={() => togglePanelVisibility('spec')}
                                disabled={visibleCount === 1 && visiblePanels.spec}
                                title="Toggle Specification panel"
                            >
                                <FileCode size={14} />
                                Spec
                            </button>
                            <button
                                className={`panel-toggle-chip ${visiblePanels.preview ? 'active' : ''}`}
                                onClick={() => togglePanelVisibility('preview')}
                                disabled={visibleCount === 1 && visiblePanels.preview}
                                title="Toggle Preview panel"
                            >
                                <Monitor size={14} />
                                Preview
                            </button>
                        </div>

                        {/* Dynamic Panel Layout */}
                        <div className="panels-container">
                            {visiblePanels.chat && (
                                <div className="panel-wrapper" style={{ flex: 1 }}>
                                    <ChatPanel onSendMessage={handleSendMessage} />
                                </div>
                            )}
                            {visiblePanels.spec && (
                                <>
                                    {visiblePanels.chat && <div className="panel-divider" />}
                                    <div className="panel-wrapper" style={{ flex: 1 }}>
                                        <SpecPanel />
                                    </div>
                                </>
                            )}
                            {visiblePanels.preview && (
                                <>
                                    {(visiblePanels.chat || visiblePanels.spec) && <div className="panel-divider" />}
                                    <div className="panel-wrapper" style={{ flex: 1 }}>
                                        <PreviewPanel />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer Controls */}
                        <footer className="app-footer">
                            <Controls />
                        </footer>
                    </>
                )}
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
        </div>
    );
}

export default App;
