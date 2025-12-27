import React, { useState, useEffect, useCallback } from 'react';
import { useStore, selectCurrentSpec } from '../store';
import { validateSpec, calculateCompleteness } from '../engine/nedry/validator';
import { Specification, Entity, View, Action } from '../types';

// ============================================================
// SpecPanel - Human-Readable Specification Display
// ============================================================

interface SpecPanelProps {
    hideHeader?: boolean;
}

export function SpecPanel({ hideHeader = false }: SpecPanelProps) {
    const currentSpec = useStore(selectCurrentSpec);
    const setSpec = useStore((s) => s.setSpec);
    const conversationPhase = useStore((s) => s.conversationPhase);
    const [showJson, setShowJson] = useState(false);
    const [editedMeta, setEditedMeta] = useState<{ name: string; description: string } | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const completeness = currentSpec ? calculateCompleteness(currentSpec) : 0;

    // Sync edited meta with current spec
    useEffect(() => {
        if (currentSpec) {
            setEditedMeta({
                name: currentSpec.meta.name,
                description: currentSpec.meta.description
            });
            setHasUnsavedChanges(false);
        }
    }, [currentSpec?.meta.name, currentSpec?.meta.description]);

    // Handle meta field changes (local state only)
    const handleMetaChange = (key: 'name' | 'description', value: string) => {
        if (editedMeta) {
            setEditedMeta({ ...editedMeta, [key]: value });
            setHasUnsavedChanges(true);
        }
    };

    // Save changes to the spec
    const saveMetaChanges = useCallback(() => {
        if (currentSpec && editedMeta && hasUnsavedChanges) {
            setSpec({
                ...currentSpec,
                meta: {
                    ...currentSpec.meta,
                    name: editedMeta.name,
                    description: editedMeta.description
                }
            });
            setHasUnsavedChanges(false);
        }
    }, [currentSpec, editedMeta, hasUnsavedChanges, setSpec]);

    // Discard changes
    const discardChanges = () => {
        if (currentSpec) {
            setEditedMeta({
                name: currentSpec.meta.name,
                description: currentSpec.meta.description
            });
            setHasUnsavedChanges(false);
        }
    };

    return (
        <div className="spec-panel">
            {!hideHeader && (
                <div className="panel-header">
                    <h2 className="panel-title">📋 Specification</h2>
                    <div className="panel-header-actions">
                        <span className={`panel-status panel-status-${conversationPhase}`}>
                            {getPhaseLabel(conversationPhase)}
                        </span>
                        <button
                            className="panel-toggle-btn"
                            onClick={() => setShowJson(!showJson)}
                            title={showJson ? 'Show structured view' : 'Show JSON'}
                        >
                            {showJson ? '📝' : '{ }'}
                        </button>
                    </div>
                </div>
            )}

            <div className="spec-content">
                {currentSpec ? (
                    <>
                        {/* Completeness Bar */}
                        <div className="spec-completeness">
                            <div className="completeness-header">
                                <span className="completeness-label">Completeness</span>
                                <span className="completeness-value">{Math.round(completeness * 100)}%</span>
                            </div>
                            <div className="completeness-bar">
                                <div
                                    className={`completeness-fill ${completeness >= 0.9 ? 'complete' : ''}`}
                                    style={{ width: `${completeness * 100}%` }}
                                />
                            </div>
                        </div>

                        {showJson ? (
                            /* JSON View - Read-only */
                            <div className="spec-json-wrapper">
                                <div className="spec-json-header">
                                    <span className="spec-json-label">Raw Specification (JSON)</span>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => {
                                            navigator.clipboard.writeText(JSON.stringify(currentSpec, null, 2));
                                        }}
                                    >
                                        📋 Copy
                                    </button>
                                </div>
                                <pre className="spec-json">
                                    <code>{JSON.stringify(currentSpec, null, 2)}</code>
                                </pre>
                            </div>
                        ) : (
                            /* Human-Readable View */
                            <div className="spec-structured">
                                {/* App Info - Editable Section */}
                                <section className="spec-section">
                                    <div className="spec-section-header">
                                        <h3 className="spec-section-title">📱 App Info</h3>
                                        {hasUnsavedChanges && (
                                            <div className="spec-edit-actions">
                                                <button
                                                    className="btn btn-sm btn-primary"
                                                    onClick={saveMetaChanges}
                                                >
                                                    💾 Save
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-secondary"
                                                    onClick={discardChanges}
                                                >
                                                    ✕ Discard
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="spec-section-hint">
                                        Edit the name and description below. Click "Save" to apply changes.
                                    </p>
                                    <div className="spec-field">
                                        <label>Name</label>
                                        <input
                                            type="text"
                                            value={editedMeta?.name || ''}
                                            onChange={(e) => handleMetaChange('name', e.target.value)}
                                            className="spec-input"
                                            placeholder="App name"
                                        />
                                    </div>
                                    <div className="spec-field">
                                        <label>Description</label>
                                        <textarea
                                            value={editedMeta?.description || ''}
                                            onChange={(e) => handleMetaChange('description', e.target.value)}
                                            className="spec-textarea"
                                            rows={2}
                                            placeholder="Brief description of what the app does"
                                        />
                                    </div>
                                </section>

                                {/* Entities - Read-only display */}
                                <section className="spec-section">
                                    <div className="spec-section-header">
                                        <h3 className="spec-section-title">
                                            📦 Entities ({currentSpec.entities.length})
                                        </h3>
                                    </div>
                                    <p className="spec-section-hint">
                                        Data structures for your app, defined through conversation.
                                    </p>
                                    {currentSpec.entities.map((entity) => (
                                        <EntityCard key={entity.id} entity={entity} />
                                    ))}
                                    {currentSpec.entities.length === 0 && (
                                        <p className="spec-empty-hint">
                                            No entities defined yet. Describe what data your app needs in the chat.
                                        </p>
                                    )}
                                </section>

                                {/* Views - Read-only display */}
                                <section className="spec-section">
                                    <div className="spec-section-header">
                                        <h3 className="spec-section-title">
                                            👁️ Views ({currentSpec.views.length})
                                        </h3>
                                    </div>
                                    <p className="spec-section-hint">
                                        UI screens that display your data.
                                    </p>
                                    {currentSpec.views.map((view) => (
                                        <ViewCard key={view.id} view={view} />
                                    ))}
                                    {currentSpec.views.length === 0 && (
                                        <p className="spec-empty-hint">
                                            No views defined yet.
                                        </p>
                                    )}
                                </section>

                                {/* Actions - Read-only display */}
                                <section className="spec-section">
                                    <div className="spec-section-header">
                                        <h3 className="spec-section-title">
                                            ⚡ Actions ({currentSpec.actions.length})
                                        </h3>
                                    </div>
                                    <p className="spec-section-hint">
                                        Operations users can perform on your data.
                                    </p>
                                    {currentSpec.actions.map((action) => (
                                        <ActionCard key={action.id} action={action} />
                                    ))}
                                    {currentSpec.actions.length === 0 && (
                                        <p className="spec-empty-hint">
                                            No actions defined yet.
                                        </p>
                                    )}
                                </section>

                                {/* Help text */}
                                <div className="spec-help-box">
                                    <p>
                                        <strong>💡 Tip:</strong> You can edit the App Info above directly.
                                        To modify Entities, Views, or Actions, describe the changes you want in the Chat
                                        and Artifact will update the specification.
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="spec-empty">
                        <div className="spec-empty-icon">📄</div>
                        <p className="spec-empty-text">
                            Specification will appear here as you describe your app
                        </p>
                        <p className="spec-empty-hint">
                            Artifact will ask clarifying questions
                            and build a structured spec from your answers
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Entity Card Component - Read-only
function EntityCard({ entity }: { entity: Entity }) {
    return (
        <div className="spec-card">
            <div className="spec-card-header">
                <span className="spec-card-icon">📦</span>
                <span className="spec-card-title">{entity.name}</span>
            </div>
            <div className="spec-card-body">
                <div className="spec-property-list">
                    {entity.properties.map((prop, i) => (
                        <div key={i} className="spec-property">
                            <span className="spec-property-name">{prop.name}</span>
                            <span className="spec-property-type">{prop.type}</span>
                            {prop.required && <span className="spec-property-required">*</span>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// View Card Component - Read-only
function ViewCard({ view }: { view: View }) {
    return (
        <div className="spec-card spec-card-small">
            <span className="spec-card-icon">
                {view.type === 'list' ? '📋' : view.type === 'form' ? '📝' : view.type === 'detail' ? '🔍' : '📊'}
            </span>
            <span className="spec-card-title">{view.name}</span>
            <span className="spec-card-badge">{view.type}</span>
        </div>
    );
}

// Action Card Component - Read-only
function ActionCard({ action }: { action: Action }) {
    return (
        <div className="spec-card spec-card-small">
            <span className="spec-card-icon">⚡</span>
            <span className="spec-card-title">{action.name}</span>
            <span className="spec-card-badge">{action.trigger}</span>
        </div>
    );
}

function getPhaseLabel(phase: string): string {
    switch (phase) {
        case 'gathering': return '🔍 Gathering';
        case 'refining': return '✏️ Refining';
        case 'complete': return '✅ Complete';
        case 'error': return '❌ Error';
        default: return '⏳ Waiting';
    }
}

export default SpecPanel;
