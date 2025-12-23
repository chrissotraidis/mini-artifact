import React, { useState } from 'react';
import {
    useStore,
    selectAiModel,
    selectSetAiModel,
} from '../store';
import { AiModel } from '../types';

// ============================================================
// SettingsButton - Comprehensive Settings Panel
// ============================================================

interface SettingsButtonProps {
    children?: React.ReactNode;
    className?: string;
}

export function SettingsButton({ children, className }: SettingsButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const aiModel = useStore(selectAiModel);
    const setAiModel = useStore(selectSetAiModel);

    const [apiKey, setApiKey] = useState(() => {
        return localStorage.getItem('mini-artifact-api-key') || '';
    });
    const [saved, setSaved] = useState(false);

    // Local state for input before saving
    const [keyInput, setKeyInput] = useState(apiKey);
    const [activeTab, setActiveTab] = useState<'api' | 'about' | 'help'>('api');

    const handleSave = () => {
        if (keyInput.trim()) {
            localStorage.setItem('mini-artifact-api-key', keyInput);
            setApiKey(keyInput);
        } else {
            localStorage.removeItem('mini-artifact-api-key');
            setApiKey('');
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setAiModel(e.target.value as AiModel);
    };

    const handleClearAll = () => {
        if (confirm('Clear all data? This will reset the conversation, specification, and API key.')) {
            localStorage.removeItem('mini-artifact-api-key');
            sessionStorage.removeItem('mini-artifact-store');
            window.location.reload();
        }
    };

    const maskedKey = apiKey
        ? `sk-...${apiKey.slice(-4)}`
        : 'Not configured';

    const Trigger = children ? (
        <div className={className} onClick={() => setIsOpen(true)}>
            {children}
        </div>
    ) : (
        <button
            className={`settings-btn ${className || ''}`}
            onClick={() => setIsOpen(true)}
            title="Settings"
        >
            ⚙️
        </button>
    );

    return (
        <>
            {Trigger}

            {isOpen && (
                <div className="modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⚙️ Settings</h2>
                            <button className="modal-close" onClick={() => setIsOpen(false)}>
                                ×
                            </button>
                        </div>

                        {/* Tab Navigation */}
                        <div className="settings-tabs">
                            <button
                                className={`settings-tab ${activeTab === 'api' ? 'active' : ''}`}
                                onClick={() => setActiveTab('api')}
                            >
                                🔑 API Key
                            </button>
                            <button
                                className={`settings-tab ${activeTab === 'help' ? 'active' : ''}`}
                                onClick={() => setActiveTab('help')}
                            >
                                ❓ How to Use
                            </button>
                            <button
                                className={`settings-tab ${activeTab === 'about' ? 'active' : ''}`}
                                onClick={() => setActiveTab('about')}
                            >
                                ℹ️ About
                            </button>
                        </div>

                        {/* API Tab */}
                        {activeTab === 'api' && (
                            <div className="settings-content">
                                <div className="settings-section">
                                    <h3>OpenAI API Key</h3>
                                    <p className="settings-hint">
                                        Current: <strong>{maskedKey}</strong>
                                    </p>

                                    <div className="form-group">
                                        <input
                                            type="password"
                                            className="form-input"
                                            placeholder="sk-..."
                                            value={keyInput}
                                            onChange={(e) => setKeyInput(e.target.value)}
                                        />
                                    </div>

                                    <button className="btn btn-secondary" onClick={handleSave}>
                                        {saved ? '✓ Saved' : 'Update Key'}
                                    </button>

                                    <div className="info-box info-box-small">
                                        <p>
                                            <strong>Need a key?</strong> Get one at{' '}
                                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                                                platform.openai.com/api-keys
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                {/* Model Selection */}
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-[#37352f] mb-1.5">
                                        AI Model
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={aiModel}
                                            onChange={handleModelChange}
                                            className="w-full bg-[#f7f6f3] border border-[#e0e0e0] rounded px-3 py-2 text-sm text-[#37352f] focus:outline-none focus:border-[#d9730d] appearance-none cursor-pointer"
                                        >
                                            <option value="gpt-4o">
                                                GPT-4o (Recommended)
                                            </option>
                                            <option value="gpt-4-turbo">
                                                GPT-4 Turbo
                                            </option>
                                            <option value="gpt-3.5-turbo">
                                                GPT-3.5 Turbo
                                            </option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#9b9a97]">
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-[#787774] mt-1.5">
                                        Choose the brain behind the magic. GPT-4o is
                                        fastest and smartest.
                                    </p>
                                </div>

                                <div className="settings-section settings-danger">
                                    <h3>🗑️ Reset Everything</h3>
                                    <p className="settings-hint">
                                        Clear all conversation history, specifications, and settings.
                                    </p>
                                    <button className="btn btn-danger" onClick={handleClearAll}>
                                        Clear All Data
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Help Tab */}
                        {activeTab === 'help' && (
                            <div className="settings-content">
                                <div className="settings-section">
                                    <h3>How to Use Mini Artifact</h3>

                                    <div className="help-guide">
                                        <div className="help-step">
                                            <span className="step-number">1</span>
                                            <div>
                                                <strong>Describe Your App</strong>
                                                <p>Type what you want to build in the chat. Be specific about features and data.</p>
                                                <p className="example">"Build a todo app with tasks that have titles, due dates, and priority levels"</p>
                                            </div>
                                        </div>

                                        <div className="help-step">
                                            <span className="step-number">2</span>
                                            <div>
                                                <strong>Answer Questions</strong>
                                                <p>Mini-Arnold will ask clarifying questions to understand your requirements.</p>
                                            </div>
                                        </div>

                                        <div className="help-step">
                                            <span className="step-number">3</span>
                                            <div>
                                                <strong>Review the Spec</strong>
                                                <p>Watch the JSON specification build in the middle panel. The completeness bar shows progress.</p>
                                            </div>
                                        </div>

                                        <div className="help-step">
                                            <span className="step-number">4</span>
                                            <div>
                                                <strong>Generate</strong>
                                                <p>When the spec is complete, click Generate to build your app. Preview it in the right panel.</p>
                                            </div>
                                        </div>

                                        <div className="help-step">
                                            <span className="step-number">5</span>
                                            <div>
                                                <strong>Export</strong>
                                                <p>Download the generated HTML file to use anywhere.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h3>Keyboard Shortcuts</h3>
                                    <div className="shortcuts-list">
                                        <div className="shortcut-item">
                                            <kbd>Enter</kbd>
                                            <span>Send message</span>
                                        </div>
                                        <div className="shortcut-item">
                                            <kbd>⌘/Ctrl + Enter</kbd>
                                            <span>Generate app</span>
                                        </div>
                                        <div className="shortcut-item">
                                            <kbd>⌘/Ctrl + E</kbd>
                                            <span>Export HTML</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* About Tab */}
                        {activeTab === 'about' && (
                            <div className="settings-content">
                                <div className="settings-section">
                                    <h3>About Mini Artifact</h3>
                                    <p className="about-text">
                                        Mini Artifact is a <strong>proof of concept</strong> demonstrating
                                        spec-driven development with AI.
                                    </p>

                                    <div className="about-architecture">
                                        <h4>Three-Layer Architecture</h4>
                                        <div className="architecture-layer">
                                            <span className="layer-icon">📝</span>
                                            <div>
                                                <strong>Mini-Arnold</strong>
                                                <p>Documentation engine — converts your descriptions into specifications</p>
                                            </div>
                                        </div>
                                        <div className="architecture-layer">
                                            <span className="layer-icon">🔀</span>
                                            <div>
                                                <strong>Mini-Nedry</strong>
                                                <p>Orchestrator — validates specs and routes to code generation</p>
                                            </div>
                                        </div>
                                        <div className="architecture-layer">
                                            <span className="layer-icon">🔧</span>
                                            <div>
                                                <strong>Mini-Raptor</strong>
                                                <p>Composer — assembles patterns into working HTML/CSS/JS</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="about-links">
                                        <p>Version 0.1.0 • Built with React + TypeScript</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default SettingsButton;
