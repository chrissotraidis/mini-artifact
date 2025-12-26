import React, { useState } from 'react';
import { useStore, selectCurrentSpec } from '../store';
import { validateSpec, calculateCompleteness } from '../engine/nedry/validator';
import { Specification, Entity, View, Action } from '../types';

// ============================================================
// SpecPanel - Human-Readable Specification with Editing
// ============================================================

export function SpecPanel() {
    const currentSpec = useStore(selectCurrentSpec);
    const setSpec = useStore((s) => s.setSpec);
    const conversationPhase = useStore((s) => s.conversationPhase);
    const [showJson, setShowJson] = useState(false);

    const completeness = currentSpec ? calculateCompleteness(currentSpec) : 0;

    // Handle inline edits
    const updateMeta = (key: 'name' | 'description', value: string) => {
        if (currentSpec) {
            setSpec({
                ...currentSpec,
                meta: { ...currentSpec.meta, [key]: value }
            });
        }
    };

    return (
        <div className="spec-panel">
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
                            /* JSON View */
                            <pre className="spec-json">
                                <code>{JSON.stringify(currentSpec, null, 2)}</code>
                            </pre>
                        ) : (
                            /* Human-Readable View */
                            <div className="spec-structured">
                                {/* App Info */}
                                <section className="spec-section">
                                    <h3 className="spec-section-title">📱 App Info</h3>
                                    <div className="spec-field">
                                        <label>Name</label>
                                        <input
                                            type="text"
                                            value={currentSpec.meta.name}
                                            onChange={(e) => updateMeta('name', e.target.value)}
                                            className="spec-input"
                                        />
                                    </div>
                                    <div className="spec-field">
                                        <label>Description</label>
                                        <textarea
                                            value={currentSpec.meta.description}
                                            onChange={(e) => updateMeta('description', e.target.value)}
                                            className="spec-textarea"
                                            rows={2}
                                        />
                                    </div>
                                </section>

                                {/* Entities */}
                                <section className="spec-section">
                                    <h3 className="spec-section-title">
                                        📦 Entities ({currentSpec.entities.length})
                                    </h3>
                                    {currentSpec.entities.map((entity, i) => (
                                        <EntityCard key={entity.id} entity={entity} />
                                    ))}
                                    {currentSpec.entities.length === 0 && (
                                        <p className="spec-empty-hint">No entities defined yet</p>
                                    )}
                                </section>

                                {/* Views */}
                                <section className="spec-section">
                                    <h3 className="spec-section-title">
                                        👁️ Views ({currentSpec.views.length})
                                    </h3>
                                    {currentSpec.views.map((view) => (
                                        <ViewCard key={view.id} view={view} />
                                    ))}
                                    {currentSpec.views.length === 0 && (
                                        <p className="spec-empty-hint">No views defined yet</p>
                                    )}
                                </section>

                                {/* Actions */}
                                <section className="spec-section">
                                    <h3 className="spec-section-title">
                                        ⚡ Actions ({currentSpec.actions.length})
                                    </h3>
                                    {currentSpec.actions.map((action) => (
                                        <ActionCard key={action.id} action={action} />
                                    ))}
                                    {currentSpec.actions.length === 0 && (
                                        <p className="spec-empty-hint">No actions defined yet</p>
                                    )}
                                </section>
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
                            Mini-Arnold will ask clarifying questions
                            and build a structured spec from your answers
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Entity Card Component with Pattern Link
function EntityCard({ entity }: { entity: Entity }) {
    return (
        <div className="spec-card">
            <div className="spec-card-header">
                <span className="spec-card-icon">📦</span>
                <span className="spec-card-title">{entity.name}</span>
                <span className="spec-pattern-link" title="Generated by entity-card pattern">
                    🔗 entity-card
                </span>
            </div>
            <div className="spec-card-body">
                <div className="spec-property-list">
                    {entity.properties.map((prop, i) => (
                        <div key={i} className="spec-property">
                            <span className="spec-property-name">{prop.name}</span>
                            <span className="spec-property-type">{prop.type}</span>
                            {prop.required && <span className="spec-property-required">*</span>}
                            <span className="spec-pattern-hint" title="Input pattern">
                                → input-{prop.type === 'boolean' ? 'checkbox' : prop.type === 'date' ? 'date' : 'text'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// View Card Component with Pattern Link
function ViewCard({ view }: { view: View }) {
    const patternName = view.type === 'list' ? 'view-list' :
        view.type === 'form' ? 'view-form' :
            view.type === 'detail' ? 'view-detail' : 'view-dashboard';
    return (
        <div className="spec-card spec-card-small">
            <span className="spec-card-icon">
                {view.type === 'list' ? '📋' : view.type === 'form' ? '📝' : view.type === 'detail' ? '🔍' : '📊'}
            </span>
            <span className="spec-card-title">{view.name}</span>
            <span className="spec-card-badge">{view.type}</span>
            <span className="spec-pattern-link" title={`Generated by ${patternName} pattern`}>
                🔗 {patternName}
            </span>
        </div>
    );
}

// Action Card Component with Pattern Link
function ActionCard({ action }: { action: Action }) {
    const patternName = action.trigger === 'button' ? 'action-button' :
        action.trigger === 'form_submit' ? 'view-form' : 'action-button';
    return (
        <div className="spec-card spec-card-small">
            <span className="spec-card-icon">⚡</span>
            <span className="spec-card-title">{action.name}</span>
            <span className="spec-card-badge">{action.trigger}</span>
            <span className="spec-pattern-link" title={`Generated by ${patternName} pattern`}>
                🔗 {patternName}
            </span>
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
