import React, { useState, useRef, useEffect } from 'react';
import { useStore, selectCanGenerate, selectIsLoading, selectBuildResult } from '../store';
import { handleInput } from '../engine/nedry';
import { hasApiKey, getErrorMessage } from '../api/openai';

// ============================================================
// Controls - Input Field and Action Buttons
// ============================================================

interface ControlsProps {
    onSendMessage?: (message: string) => void;
}

export function Controls({ onSendMessage }: ControlsProps) {
    const [input, setInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

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

    // Allow external message sending (from example prompts)
    useEffect(() => {
        if (onSendMessage) {
            // This is a no-op, but we expose the send function through props
        }
    }, [onSendMessage]);

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
                const errorMsg = getErrorMessage(new Error(result.action.error.message));
                addMessage('assistant', `⚠️ ${errorMsg}`);
            }

            if (result.stateUpdate.conversationPhase) {
                setConversationPhase(result.stateUpdate.conversationPhase);
            }
        } catch (error) {
            console.error('Error processing message:', error);
            const errorMsg = getErrorMessage(error);
            addMessage('assistant', `⚠️ ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    // Expose send function for example prompts
    useEffect(() => {
        if (onSendMessage) {
            // Parent can call this via ref or callback
        }
    }, [onSendMessage]);

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
            addMessage('assistant', `⚠️ Build failed: ${getErrorMessage(error)}`);
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

    // Handle Enter key in input
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Get generate button state
    const getGenerateState = () => {
        if (isLoading) return { text: '⏳ Working...', disabled: true };
        if (!hasApiKey()) return { text: '🔑 Add API Key', disabled: true };
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
                <input
                    ref={inputRef}
                    type="text"
                    className="controls-input"
                    placeholder={
                        hasApiKey()
                            ? 'Describe your app or answer questions...'
                            : '🔑 Configure API key in Settings (⚙️) to start'
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                />
                <button
                    className="btn btn-secondary controls-send"
                    onClick={() => handleSubmit()}
                    disabled={!input.trim() || isLoading}
                >
                    {isLoading ? '...' : 'Send'}
                </button>
            </div>

            <div className="controls-actions">
                <button
                    className={`btn controls-generate ${generateState.disabled ? 'btn-secondary' : 'btn-primary'
                        }`}
                    onClick={handleGenerate}
                    disabled={generateState.disabled}
                    title={generateState.disabled ? generateState.text : 'Generate your app'}
                >
                    {generateState.text}
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={handleExport}
                    disabled={!buildResult?.success}
                    title="Download as HTML file"
                >
                    📥 Export
                </button>

                <button
                    className="btn btn-secondary"
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
