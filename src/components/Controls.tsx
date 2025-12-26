import React, { useState, useRef, useEffect } from 'react';
import { useStore, selectCanGenerate, selectIsLoading, selectBuildResult, selectProvider, selectModel } from '../store';
import { handleInput } from '../engine/nedry';
import { hasApiKey, getProviderErrorMessage } from '../api/providers';

// ============================================================
// Controls - Input Field and Action Buttons
// ============================================================

interface ControlsProps {
    onSendMessage?: (message: string) => void;
}

export function Controls({ onSendMessage }: ControlsProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const canGenerate = useStore(selectCanGenerate);
    const isLoading = useStore(selectIsLoading);
    const buildResult = useStore(selectBuildResult);
    const currentSpec = useStore((s) => s.currentSpec);
    const messages = useStore((s) => s.messages);
    const conversationPhase = useStore((s) => s.conversationPhase);

    const addMessage = useStore((s) => s.addMessage);
    const setSpec = useStore((s) => s.setSpec);
    const setLoading = useStore((s) => s.setLoading);
    const setBuildStatus = useStore((s) => s.setBuildStatus);
    const setBuildResult = useStore((s) => s.setBuildResult);
    const setConversationPhase = useStore((s) => s.setConversationPhase);
    const reset = useStore((s) => s.reset);
    const provider = useStore(selectProvider);
    const model = useStore(selectModel);

    // Auto-resize textarea
    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
        }
    };

    useEffect(() => {
        adjustTextareaHeight();
    }, [input]);

    // Handle message submission
    const handleSubmit = async (messageText?: string) => {
        const userMessage = (messageText || input).trim();
        if (!userMessage || isLoading) return;

        setInput('');
        addMessage('user', userMessage);
        setLoading(true);

        try {
            const result = await handleInput({
                type: 'user_message',
                payload: userMessage,
                currentState: {
                    messages: [...messages, { id: '', role: 'user', content: userMessage, timestamp: '' }],
                    currentSpec,
                    specHistory: [],
                    specValidation: null,
                    buildInstructions: null,
                    buildResult: null,
                    buildStatus: 'idle',
                    conversationPhase: 'gathering',
                    activePanel: 'chat',
                    errors: [],
                    provider,
                    model,
                },
            });

            // Handle response
            if (result.action.type === 'display_question') {
                addMessage('assistant', result.action.question);
            } else if (result.action.type === 'update_ui' && result.action.update.spec) {
                setSpec(result.action.update.spec);
                addMessage(
                    'assistant',
                    "I've updated the specification. You can continue refining or click Generate when ready."
                );
            } else if (result.action.type === 'display_error') {
                const errorMsg = getProviderErrorMessage(new Error(result.action.error.message));
                addMessage('assistant', `⚠️ ${errorMsg}`);
            }

            if (result.stateUpdate.conversationPhase) {
                setConversationPhase(result.stateUpdate.conversationPhase);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            const errorMsg = getProviderErrorMessage(error);
            addMessage('assistant', `⚠️ ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    // Handle generate
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

    // Handle export
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

    // Handle reset
    const handleReset = () => {
        if (confirm('Are you sure you want to reset? This will clear the conversation and spec.')) {
            reset();
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (canGenerate) handleGenerate();
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
                e.preventDefault();
                if (buildResult?.success) handleExport();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [canGenerate, buildResult]);

    // Handle Enter key in textarea (Enter = submit, Shift+Enter = newline)
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Get generate button state
    const getGenerateState = () => {
        if (isLoading) return { text: '⏳ Working...', disabled: true };
        if (!hasApiKey(provider)) return { text: '🔑 Add API Key', disabled: true };
        if (!currentSpec) return { text: '📝 Describe app first', disabled: true };
        if (conversationPhase === 'gathering')
            return { text: '💬 Answer questions', disabled: true };
        return { text: '🚀 Generate', disabled: false };
    };

    const generateState = getGenerateState();

    // Public send function for external use
    const sendMessage = (text: string) => {
        handleSubmit(text);
    };

    // Expose send function
    React.useEffect(() => {
        (window as { sendMessage?: (t: string) => void }).sendMessage = sendMessage;
    }, []);

    return (
        <div className="controls">
            <div className="controls-input-wrapper">
                <textarea
                    ref={textareaRef}
                    className="controls-textarea"
                    placeholder={
                        hasApiKey(provider)
                            ? 'Describe your app or answer questions...'
                            : '🔑 Configure API key in Settings to start'
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    rows={1}
                />
                <button
                    className="btn btn-primary controls-send"
                    onClick={() => handleSubmit()}
                    disabled={!input.trim() || isLoading}
                >
                    {isLoading ? '...' : 'Send'}
                </button>
            </div>

            <div className="controls-actions">
                <button
                    className={`btn controls-action-btn ${generateState.disabled ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleGenerate}
                    disabled={generateState.disabled}
                    title={generateState.disabled ? generateState.text : 'Generate your app'}
                >
                    {generateState.text}
                </button>

                <button
                    className="btn btn-secondary controls-action-btn"
                    onClick={handleExport}
                    disabled={!buildResult?.success}
                    title="Download as HTML file"
                >
                    📥 Export
                </button>

                <button
                    className="btn btn-secondary controls-action-btn"
                    onClick={handleReset}
                    title="Clear conversation and spec"
                >
                    🔄 Reset
                </button>
            </div>
        </div>
    );
}

export default Controls;
