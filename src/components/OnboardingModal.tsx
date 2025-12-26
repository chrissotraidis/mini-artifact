import React, { useState, useEffect } from 'react';
import { Provider, DEFAULT_MODELS } from '../types';
import { setApiKey, getApiKey, hasApiKey } from '../api/providers';
import { useStore, selectProvider, selectSetProvider, selectSetModel } from '../store';

// ============================================================
// OnboardingModal - Comprehensive Setup Guide with Provider Selection
// ============================================================

interface OnboardingModalProps {
    onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const [selectedProvider, setSelectedProvider] = useState<Provider>('openai');
    const [apiKeyInput, setApiKeyInput] = useState('');
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    const storeProvider = useStore(selectProvider);
    const setStoreProvider = useStore(selectSetProvider);
    const setStoreModel = useStore(selectSetModel);

    // Check if any key already exists
    useEffect(() => {
        if (hasApiKey('openai') || hasApiKey('anthropic')) {
            onComplete();
        }
    }, [onComplete]);

    const validateOpenAIKey = async (key: string): Promise<boolean> => {
        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${key}` },
            });
            return response.ok || response.status !== 401;
        } catch {
            return true; // Network error - accept anyway
        }
    };

    const validateAnthropicKey = async (key: string): Promise<boolean> => {
        // Anthropic doesn't have a simple validation endpoint
        // Just check format
        return key.startsWith('sk-ant-');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!apiKeyInput.trim()) {
            setError('Please enter an API key');
            return;
        }

        // Validate key format
        if (selectedProvider === 'openai' && !apiKeyInput.startsWith('sk-')) {
            setError('OpenAI API keys start with "sk-"');
            return;
        }
        if (selectedProvider === 'anthropic' && !apiKeyInput.startsWith('sk-ant-')) {
            setError('Anthropic API keys start with "sk-ant-"');
            return;
        }

        setIsValidating(true);

        try {
            const isValid = selectedProvider === 'openai'
                ? await validateOpenAIKey(apiKeyInput)
                : await validateAnthropicKey(apiKeyInput);

            if (!isValid) {
                setError('Invalid API key. Please check and try again.');
                setIsValidating(false);
                return;
            }

            // Save the key
            setApiKey(selectedProvider, apiKeyInput);

            // Set the provider and default model in store
            setStoreProvider(selectedProvider);
            setStoreModel(DEFAULT_MODELS[selectedProvider][0].id);

            onComplete();
        } catch {
            // Save anyway on error
            setApiKey(selectedProvider, apiKeyInput);
            setStoreProvider(selectedProvider);
            onComplete();
        } finally {
            setIsValidating(false);
        }
    };

    const handleSkip = () => {
        onComplete();
    };

    const handleProviderSelect = (provider: Provider) => {
        setSelectedProvider(provider);
        setApiKeyInput('');
        setError('');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content onboarding-modal">
                {/* Step 1: Welcome */}
                {step === 1 && (
                    <>
                        <div className="modal-header">
                            <span className="modal-icon">📦</span>
                            <h2>Welcome to Mini Artifact</h2>
                        </div>

                        <div className="onboarding-section">
                            <h3>What is Mini Artifact?</h3>
                            <p className="onboarding-text">
                                Mini Artifact is a <strong>spec-driven development tool</strong> that
                                builds web applications from natural language descriptions.
                            </p>

                            <div className="feature-list">
                                <div className="feature-item">
                                    <span className="feature-icon">💬</span>
                                    <div>
                                        <strong>Describe your app</strong>
                                        <p>Tell me what you want to build in plain English</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">📋</span>
                                    <div>
                                        <strong>Watch the spec build</strong>
                                        <p>I'll ask clarifying questions and create a structured specification</p>
                                    </div>
                                </div>
                                <div className="feature-item">
                                    <span className="feature-icon">🚀</span>
                                    <div>
                                        <strong>Generate working code</strong>
                                        <p>Click Generate and get a complete HTML/CSS/JS application</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button className="btn btn-primary" onClick={() => setStep(2)}>
                                Get Started →
                            </button>
                        </div>
                    </>
                )}

                {/* Step 2: Provider Selection + API Key Setup */}
                {step === 2 && (
                    <>
                        <div className="modal-header">
                            <span className="modal-icon">🔑</span>
                            <h2>Choose Your AI Provider</h2>
                        </div>

                        <div className="onboarding-section">
                            {/* Provider Selection */}
                            <div className="settings-group">
                                <label className="settings-label">Provider</label>
                                <div className="provider-toggle">
                                    <button
                                        type="button"
                                        className={`provider-btn ${selectedProvider === 'openai' ? 'active' : ''}`}
                                        onClick={() => handleProviderSelect('openai')}
                                    >
                                        OpenAI
                                    </button>
                                    <button
                                        type="button"
                                        className={`provider-btn ${selectedProvider === 'anthropic' ? 'active' : ''}`}
                                        onClick={() => handleProviderSelect('anthropic')}
                                    >
                                        Anthropic
                                    </button>
                                </div>
                            </div>

                            <div className="info-box">
                                <strong>Why do I need an API key?</strong>
                                <p>
                                    Mini Artifact uses{' '}
                                    <strong>
                                        {selectedProvider === 'openai' ? 'GPT-4' : 'Claude'}
                                    </strong>{' '}
                                    to understand your requirements and build specifications.
                                    The API key authenticates your requests to{' '}
                                    {selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic'}.
                                </p>
                            </div>

                            <div className="info-box info-box-secondary">
                                <strong>🔒 Your key is safe</strong>
                                <ul className="info-list">
                                    <li>Stored only in your browser's local storage</li>
                                    <li>Never sent to our servers</li>
                                    <li>Only used for {selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API calls</li>
                                </ul>
                            </div>

                            <form onSubmit={handleSubmit} className="api-key-form">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="api-key">
                                        {selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic'} API Key
                                    </label>
                                    <input
                                        type="password"
                                        id="api-key"
                                        className="form-input"
                                        placeholder={selectedProvider === 'openai' ? 'sk-...' : 'sk-ant-...'}
                                        value={apiKeyInput}
                                        onChange={(e) => setApiKeyInput(e.target.value)}
                                        autoFocus
                                    />
                                    {error && <p className="form-error">{error}</p>}
                                </div>

                                <div className="help-section">
                                    <strong>How to get an API key:</strong>
                                    {selectedProvider === 'openai' ? (
                                        <ol className="help-steps">
                                            <li>
                                                Go to{' '}
                                                <a
                                                    href="https://platform.openai.com/api-keys"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    platform.openai.com/api-keys
                                                </a>
                                            </li>
                                            <li>Sign in or create an account</li>
                                            <li>Click "Create new secret key"</li>
                                            <li>Copy the key and paste it above</li>
                                        </ol>
                                    ) : (
                                        <ol className="help-steps">
                                            <li>
                                                Go to{' '}
                                                <a
                                                    href="https://console.anthropic.com/settings/keys"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    console.anthropic.com/settings/keys
                                                </a>
                                            </li>
                                            <li>Sign in or create an account</li>
                                            <li>Click "Create Key"</li>
                                            <li>Copy the key and paste it above</li>
                                        </ol>
                                    )}
                                    <p className="help-note">
                                        💡 You'll need a paid {selectedProvider === 'openai' ? 'OpenAI' : 'Anthropic'} account with API credits.
                                        {selectedProvider === 'openai' && ' New accounts get $5 free credits.'}
                                    </p>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setStep(1)}
                                    >
                                        ← Back
                                    </button>
                                    <button type="button" className="btn btn-secondary" onClick={handleSkip}>
                                        Skip for now
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={isValidating}>
                                        {isValidating ? 'Validating...' : 'Save & Continue'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default OnboardingModal;
