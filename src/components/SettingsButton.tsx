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

    // Close modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen]);

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
                                    <h3>🔑 OpenAI API Key {openaiKey ? '✅' : ''}</h3>
                                    <p className="settings-hint">
                                        Status: <strong style={{ color: openaiKey ? '#22c55e' : '#ef4444' }}>
                                            {openaiKey ? `Configured (${maskedOpenaiKey})` : '❌ Not configured'}
                                        </strong>
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
                                    <h3>🔑 Anthropic API Key {anthropicKey ? '✅' : ''}</h3>
                                    <p className="settings-hint">
                                        Status: <strong style={{ color: anthropicKey ? '#22c55e' : '#ef4444' }}>
                                            {anthropicKey ? `Configured (${maskedAnthropicKey})` : '❌ Not configured'}
                                        </strong>
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
                                        ⚠️ <strong>Security Note:</strong> Your API keys are stored in your browser's local storage. Do not use this application on shared or public computers.
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
                                    <h3>📖 The Core Workflow</h3>
                                    <p className="about-text">
                                        Mini Artifact follows a <strong>Write → Plan → Build → Review</strong> loop:
                                    </p>

                                    <div className="workflow-diagram">
                                        <div className="workflow-step">
                                            <span className="workflow-icon">✏️</span>
                                            <div>
                                                <strong>Write</strong>
                                                <p>Describe your app in natural language</p>
                                            </div>
                                        </div>
                                        <div className="workflow-arrow">→</div>
                                        <div className="workflow-step">
                                            <span className="workflow-icon">📋</span>
                                            <div>
                                                <strong>Plan</strong>
                                                <p>Artifact builds a structured specification</p>
                                            </div>
                                        </div>
                                        <div className="workflow-arrow">→</div>
                                        <div className="workflow-step">
                                            <span className="workflow-icon">🔧</span>
                                            <div>
                                                <strong>Build</strong>
                                                <p>Click Generate to assemble code</p>
                                            </div>
                                        </div>
                                        <div className="workflow-arrow">→</div>
                                        <div className="workflow-step">
                                            <span className="workflow-icon">👁️</span>
                                            <div>
                                                <strong>Review</strong>
                                                <p>Preview, iterate, and export</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h3>🚀 Getting Started</h3>

                                    <div className="help-guide">
                                        <div className="help-step">
                                            <span className="step-number">1</span>
                                            <div>
                                                <strong>Describe What You Want</strong>
                                                <p>Be specific about your app's purpose and the data it manages. Include details about properties, relationships, and features.</p>
                                                <div className="example-box">
                                                    <span className="example-label">Good example:</span>
                                                    <p>"Build a task manager with tasks that have titles, due dates, priority (high/medium/low), and a completed status. I want to see all tasks in a list and be able to add, edit, and delete them."</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="help-step">
                                            <span className="step-number">2</span>
                                            <div>
                                                <strong>Answer Clarifying Questions</strong>
                                                <p>Artifact will ask targeted questions to fill in gaps in your description. The more specific your answers, the better the result.</p>
                                                <div className="tip-box">
                                                    <strong>💡 Tip:</strong> If Artifact asks about properties, list the specific data types you need (text, number, date, yes/no, or a list of options).
                                                </div>
                                            </div>
                                        </div>

                                        <div className="help-step">
                                            <span className="step-number">3</span>
                                            <div>
                                                <strong>Watch the Spec Build</strong>
                                                <p>The Specification panel shows your app's structure in real-time. The completeness bar tells you when the spec is ready:</p>
                                                <ul className="spec-guide">
                                                    <li><strong>0-50%</strong> — Gathering basic requirements</li>
                                                    <li><strong>50-80%</strong> — Refining entities and views</li>
                                                    <li><strong>80-100%</strong> — Ready to generate!</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="help-step">
                                            <span className="step-number">4</span>
                                            <div>
                                                <strong>Generate Your App</strong>
                                                <p>When the spec is complete, click <strong>Generate</strong>. Mini-Raptor assembles tested patterns into working HTML/CSS/JS code.</p>
                                                <div className="tip-box">
                                                    <strong>💡 Tip:</strong> Generation uses deterministic pattern assembly—same spec always produces the same output.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="help-step">
                                            <span className="step-number">5</span>
                                            <div>
                                                <strong>Iterate and Export</strong>
                                                <p>Preview your app in the right panel. Want changes? Describe them in chat and regenerate. When satisfied, click <strong>Export</strong> to download your HTML file.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h3>⌨️ Keyboard Shortcuts</h3>
                                    <div className="shortcuts-list">
                                        <div className="shortcut-item">
                                            <kbd>Enter</kbd>
                                            <span>Send message</span>
                                        </div>
                                        <div className="shortcut-item">
                                            <kbd>⌘/Ctrl + Enter</kbd>
                                            <span>Generate app (when spec is ready)</span>
                                        </div>
                                        <div className="shortcut-item">
                                            <kbd>⌘/Ctrl + E</kbd>
                                            <span>Export HTML file</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h3>💡 Pro Tips</h3>
                                    <div className="tips-list">
                                        <div className="tip-item">
                                            <span className="tip-icon">📝</span>
                                            <p><strong>Edit the spec directly</strong> — You can modify the Name and Description in the Spec panel. For other changes, describe them in chat.</p>
                                        </div>
                                        <div className="tip-item">
                                            <span className="tip-icon">🔄</span>
                                            <p><strong>Iterate quickly</strong> — Don't aim for perfection on the first try. Generate, preview, describe changes, regenerate.</p>
                                        </div>
                                        <div className="tip-item">
                                            <span className="tip-icon">📦</span>
                                            <p><strong>Think in entities</strong> — Every app has data. "Tasks" in a todo app, "Expenses" in a budget tracker. Start by naming your data.</p>
                                        </div>
                                        <div className="tip-item">
                                            <span className="tip-icon">🎯</span>
                                            <p><strong>Keep it simple</strong> — Mini Artifact is designed for simple CRUD apps: lists, forms, dashboards. Complex logic may require manual coding.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h3>❓ What Can I Build?</h3>
                                    <p className="about-text">Mini Artifact excels at simple, data-driven applications:</p>
                                    <div className="app-examples">
                                        <div className="app-example">✅ Todo lists & task managers</div>
                                        <div className="app-example">✅ Expense trackers & budget tools</div>
                                        <div className="app-example">✅ Note-taking apps</div>
                                        <div className="app-example">✅ Simple dashboards</div>
                                        <div className="app-example">✅ Contact lists & directories</div>
                                        <div className="app-example">✅ Habit trackers</div>
                                    </div>
                                    <p className="about-text" style={{ marginTop: '12px', color: 'var(--color-text-tertiary)' }}>
                                        <strong>Not ideal for:</strong> Complex business logic, authentication systems, real-time collaboration, or multi-page applications.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* About Tab */}
                        {activeTab === 'about' && (
                            <div className="settings-content">
                                <div className="settings-section">
                                    <h3>What is Mini Artifact?</h3>
                                    <p className="about-text">
                                        Mini Artifact is a <strong>proof of concept</strong> demonstrating
                                        spec-driven development with AI. It transforms natural language
                                        descriptions into working web applications.
                                    </p>
                                    <div className="info-box">
                                        <p style={{ margin: 0 }}>
                                            <strong>Core Idea:</strong> Instead of generating code directly from prompts,
                                            we first build a <em>specification</em>—a structured document that becomes
                                            the source of truth. This makes output predictable, traceable, and evolvable.
                                        </p>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h3>🏗️ Three-Layer Architecture</h3>
                                    <p className="about-text">
                                        Mini Artifact separates concerns into three distinct layers, each with a specific job:
                                    </p>

                                    <div className="architecture-layer">
                                        <span className="layer-icon">📝</span>
                                        <div>
                                            <strong>Mini-Arnold</strong>
                                            <span className="layer-subtitle">Documentation Layer</span>
                                            <p>Converts your natural language descriptions into structured JSON specifications. Asks clarifying questions to ensure nothing is ambiguous. Uses AI to understand intent and extract entities, properties, views, and actions.</p>
                                        </div>
                                    </div>

                                    <div className="architecture-layer">
                                        <span className="layer-icon">🔀</span>
                                        <div>
                                            <strong>Mini-Nedry</strong>
                                            <span className="layer-subtitle">Orchestration Layer</span>
                                            <p>The traffic controller. Routes your input to Arnold for spec building, validates specs before building, matches requirements to patterns, and coordinates the entire workflow. Manages state so the system remembers context.</p>
                                        </div>
                                    </div>

                                    <div className="architecture-layer">
                                        <span className="layer-icon">🔧</span>
                                        <div>
                                            <strong>Mini-Raptor</strong>
                                            <span className="layer-subtitle">Composition Layer</span>
                                            <p>The builder. Assembles tested, reusable patterns into working HTML/CSS/JS. Deterministic: same spec always produces identical output. Uses a library of 14+ patterns covering layouts, views, forms, and actions.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h3>🎯 Design Principles</h3>
                                    <div className="principles-list">
                                        <div className="principle-item">
                                            <strong>📄 Docs are the source of truth</strong>
                                            <p>The specification is canonical. If code doesn't match the spec, the code is wrong.</p>
                                        </div>
                                        <div className="principle-item">
                                            <strong>🔒 Separation of concerns</strong>
                                            <p>Arnold, Nedry, and Raptor fail independently. An error in one layer doesn't corrupt others.</p>
                                        </div>
                                        <div className="principle-item">
                                            <strong>🎲 Pattern-first, AI-second</strong>
                                            <p>80% deterministic pattern assembly, 20% generative. Tested patterns reduce bugs.</p>
                                        </div>
                                        <div className="principle-item">
                                            <strong>👤 Human in the loop</strong>
                                            <p>No code is generated without your explicit approval. You control when to build.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h3>🔬 Why Build This Way?</h3>
                                    <p className="about-text">
                                        Most AI coding tools collapse planning and execution into a single prompt-response loop. This feels fast but creates problems:
                                    </p>
                                    <ul className="problem-list">
                                        <li><strong>Intent is disposable</strong> — Prompts disappear, leaving no record of decisions</li>
                                        <li><strong>Output is inconsistent</strong> — Same input can produce different results</li>
                                        <li><strong>Errors propagate silently</strong> — No validation layers to catch mistakes</li>
                                    </ul>
                                    <p className="about-text">
                                        Mini Artifact proves that by separating documentation, orchestration, and composition,
                                        AI-assisted software can be <strong>traceable</strong>, <strong>predictable</strong>, and <strong>evolvable</strong>.
                                    </p>
                                </div>

                                <div className="settings-section">
                                    <h3>🛠️ Technical Details</h3>
                                    <div className="tech-details">
                                        <div className="tech-item">
                                            <strong>Frontend</strong>
                                            <span>React 18 + TypeScript + Vite</span>
                                        </div>
                                        <div className="tech-item">
                                            <strong>State</strong>
                                            <span>Zustand with localStorage persistence</span>
                                        </div>
                                        <div className="tech-item">
                                            <strong>AI Providers</strong>
                                            <span>OpenAI (GPT-4o) or Anthropic (Claude)</span>
                                        </div>
                                        <div className="tech-item">
                                            <strong>Templates</strong>
                                            <span>Handlebars for pattern assembly</span>
                                        </div>
                                        <div className="tech-item">
                                            <strong>Output</strong>
                                            <span>Pure HTML/CSS/JS (no framework)</span>
                                        </div>
                                        <div className="tech-item">
                                            <strong>Pattern Library</strong>
                                            <span>14 patterns (layouts, views, actions, utilities)</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="settings-section">
                                    <h3>🔒 Privacy & Security</h3>
                                    <ul className="security-list">
                                        <li>Your API keys are stored <strong>only in your browser</strong> (localStorage)</li>
                                        <li>No user data is sent to any server except OpenAI/Anthropic for AI requests</li>
                                        <li>Generated code is sandboxed in an iframe</li>
                                        <li>Session data is cleared when you close the browser</li>
                                    </ul>
                                </div>

                                <div className="about-links">
                                    <p><strong>Version 0.1.0</strong> • Created by Chris Sotraidis</p>
                                    <p style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                                        A proof of concept for the Artifact Interaction Engine
                                    </p>
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
