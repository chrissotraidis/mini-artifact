import React, { useState, useEffect } from 'react';

// ============================================================
// OnboardingModal - Comprehensive Setup Guide
// ============================================================

interface OnboardingModalProps {
    onComplete: () => void;
}

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const [apiKey, setApiKey] = useState('');
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

    // Check if key already exists
    useEffect(() => {
        const existingKey = localStorage.getItem('mini-artifact-api-key');
        if (existingKey) {
            onComplete();
        }
    }, [onComplete]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!apiKey.trim()) {
            setError('Please enter an API key');
            return;
        }

        if (!apiKey.startsWith('sk-')) {
            setError('OpenAI API keys start with "sk-"');
            return;
        }

        setIsValidating(true);

        try {
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: { Authorization: `Bearer ${apiKey}` },
            });

            if (!response.ok && response.status === 401) {
                setError('Invalid API key. Please check and try again.');
                setIsValidating(false);
                return;
            }

            localStorage.setItem('mini-artifact-api-key', apiKey);
            onComplete();
        } catch {
            // Network error - save anyway
            localStorage.setItem('mini-artifact-api-key', apiKey);
            onComplete();
        } finally {
            setIsValidating(false);
        }
    };

    const handleSkip = () => {
        onComplete();
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

                {/* Step 2: API Key Setup */}
                {step === 2 && (
                    <>
                        <div className="modal-header">
                            <span className="modal-icon">🔑</span>
                            <h2>Configure OpenAI API</h2>
                        </div>

                        <div className="onboarding-section">
                            <div className="info-box">
                                <strong>Why do I need an API key?</strong>
                                <p>
                                    Mini Artifact uses <strong>GPT-4</strong> to understand your requirements
                                    and build specifications. The API key authenticates your requests to OpenAI.
                                </p>
                            </div>

                            <div className="info-box info-box-secondary">
                                <strong>🔒 Your key is safe</strong>
                                <ul className="info-list">
                                    <li>Stored only in your browser's local storage</li>
                                    <li>Never sent to our servers</li>
                                    <li>Only used for OpenAI API calls</li>
                                </ul>
                            </div>

                            <form onSubmit={handleSubmit} className="api-key-form">
                                <div className="form-group">
                                    <label className="form-label" htmlFor="api-key">
                                        OpenAI API Key
                                    </label>
                                    <input
                                        type="password"
                                        id="api-key"
                                        className="form-input"
                                        placeholder="sk-..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        autoFocus
                                    />
                                    {error && <p className="form-error">{error}</p>}
                                </div>

                                <div className="help-section">
                                    <strong>How to get an API key:</strong>
                                    <ol className="help-steps">
                                        <li>Go to <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">platform.openai.com/api-keys</a></li>
                                        <li>Sign in or create an account</li>
                                        <li>Click "Create new secret key"</li>
                                        <li>Copy the key and paste it above</li>
                                    </ol>
                                    <p className="help-note">
                                        💡 You'll need a paid OpenAI account with API credits.
                                        New accounts get $5 free credits.
                                    </p>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>
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
