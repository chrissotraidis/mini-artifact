import React, { useState, useEffect } from 'react';
import {
    useStore,
    selectProvider,
    selectModel,
    selectSetProvider,
    selectSetModel,
} from '../store';
import { Provider, DEFAULT_MODELS } from '../types';
import { setApiKey, getApiKey, clearApiKey, migrateOldApiKey } from '../api/providers';

// ============================================================
// SettingsButton - Comprehensive Settings Panel
// ============================================================

interface SettingsButtonProps {
    children?: React.ReactNode;
    className?: string;
}

export function SettingsButton({ children, className }: SettingsButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const provider = useStore(selectProvider);
    const model = useStore(selectModel);
    const setProvider = useStore(selectSetProvider);
    const setModel = useStore(selectSetModel);

    // Migrate old API key format on mount
    useEffect(() => {
        migrateOldApiKey();
    }, []);

    // API key state for each provider
    const [openaiKey, setOpenaiKey] = useState(() => getApiKey('openai') || '');
    const [anthropicKey, setAnthropicKey] = useState(() => getApiKey('anthropic') || '');
    const [openaiKeyInput, setOpenaiKeyInput] = useState(openaiKey);
    const [anthropicKeyInput, setAnthropicKeyInput] = useState(anthropicKey);
    const [savedOpenai, setSavedOpenai] = useState(false);
    const [savedAnthropic, setSavedAnthropic] = useState(false);
    const [activeTab, setActiveTab] = useState<'api' | 'about' | 'help'>('api');

    const handleSaveOpenai = () => {
        if (openaiKeyInput.trim()) {
            setApiKey('openai', openaiKeyInput);
            setOpenaiKey(openaiKeyInput);
        } else {
            clearApiKey('openai');
            setOpenaiKey('');
        }
        setSavedOpenai(true);
        setTimeout(() => setSavedOpenai(false), 2000);
    };

    const handleSaveAnthropic = () => {
        if (anthropicKeyInput.trim()) {
            setApiKey('anthropic', anthropicKeyInput);
            setAnthropicKey(anthropicKeyInput);
        } else {
            clearApiKey('anthropic');
            setAnthropicKey('');
        }
        setSavedAnthropic(true);
        setTimeout(() => setSavedAnthropic(false), 2000);
    };

    const handleProviderChange = (newProvider: Provider) => {
        setProvider(newProvider);
    };

    const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setModel(e.target.value);
    };

    const handleClearAll = () => {
        if (confirm('Clear all data? This will reset the conversation, specification, and API keys.')) {
            clearApiKey('openai');
            clearApiKey('anthropic');
            sessionStorage.removeItem('mini-artifact-store');
            window.location.reload();
        }
    };

    const maskedOpenaiKey = openaiKey
        ? `sk-...${openaiKey.slice(-4)}`
        : 'Not configured';

    const maskedAnthropicKey = anthropicKey
        ? `sk-ant-...${anthropicKey.slice(-4)}`
        : 'Not configured';

    const currentModels = DEFAULT_MODELS[provider];

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
                                {/* Provider Selection */}
                                <div className="settings-section">
                                    <h3>🔌 Provider</h3>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                                        <button
                                            className={`btn ${provider === 'openai' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleProviderChange('openai')}
                                            style={{ flex: 1 }}
                                        >
                                            OpenAI
                                        </button>
                                        <button
                                            className={`btn ${provider === 'anthropic' ? 'btn-primary' : 'btn-secondary'}`}
                                            onClick={() => handleProviderChange('anthropic')}
                                            style={{ flex: 1 }}
                                        >
                                            Anthropic
                                        </button>
                                    </div>

                                    {/* Model Selection */}
                                    <label className="block text-sm font-medium text-[#37352f] mb-1.5">
                                        Model
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={model}
                                            onChange={handleModelChange}
                                            className="w-full bg-[#f7f6f3] border border-[#e0e0e0] rounded px-3 py-2 text-sm text-[#37352f] focus:outline-none focus:border-[#d9730d] appearance-none cursor-pointer"
                                        >
                                            {currentModels.map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* OpenAI API Key */}
                                <div className="settings-section">
                                    <h3>🔑 OpenAI API Key</h3>
                                    <p className="settings-hint">
                                        Current: <strong>{maskedOpenaiKey}</strong>
                                    </p>
                                    <div className="form-group">
                                        <input
                                            type="password"
                                            className="form-input"
                                            placeholder="sk-..."
                                            value={openaiKeyInput}
                                            onChange={(e) => setOpenaiKeyInput(e.target.value)}
                                        />
                                    </div>
                                    <button className="btn btn-secondary" onClick={handleSaveOpenai}>
                                        {savedOpenai ? '✓ Saved' : 'Update Key'}
                                    </button>
                                    <div className="info-box info-box-small">
                                        <p>
                                            Get a key at{' '}
                                            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                                                platform.openai.com
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                {/* Anthropic API Key */}
                                <div className="settings-section">
                                    <h3>🔑 Anthropic API Key</h3>
                                    <p className="settings-hint">
                                        Current: <strong>{maskedAnthropicKey}</strong>
                                    </p>
                                    <div className="form-group">
                                        <input
                                            type="password"
                                            className="form-input"
                                            placeholder="sk-ant-..."
                                            value={anthropicKeyInput}
                                            onChange={(e) => setAnthropicKeyInput(e.target.value)}
                                        />
                                    </div>
                                    <button className="btn btn-secondary" onClick={handleSaveAnthropic}>
                                        {savedAnthropic ? '✓ Saved' : 'Update Key'}
                                    </button>
                                    <div className="info-box info-box-small">
                                        <p>
                                            Get a key at{' '}
                                            <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">
                                                console.anthropic.com
                                            </a>
                                        </p>
                                    </div>
                                </div>

                                {/* Security Warning */}
                                <div className="info-box" style={{ background: '#fff3cd', border: '1px solid #ffc107' }}>
                                    <p style={{ color: '#856404', margin: 0, fontSize: '12px' }}>
                                        ⚠️ <strong>Security Note:</strong> API keys are stored in your browser's localStorage.
                                        Avoid using on shared computers.
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
