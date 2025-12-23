import React from 'react';
import { useStore, selectCurrentSpec } from '../store';
import { validateSpec, calculateCompleteness, getValidationSummary } from '../engine/nedry/validator';
import { Specification } from '../types';

// ============================================================
// SpecPanel - JSON Specification Display with Validation
// ============================================================

export function SpecPanel() {
    const currentSpec = useStore(selectCurrentSpec);
    const conversationPhase = useStore((s) => s.conversationPhase);

    // Get validation and completeness info
    const validation = currentSpec ? validateSpec(currentSpec) : null;
    const completeness = currentSpec ? calculateCompleteness(currentSpec) : 0;
    const summary = validation ? getValidationSummary(validation) : null;

    return (
        <div className="spec-panel">
            <div className="panel-header">
                <h2 className="panel-title">📋 Specification</h2>
                <span className={`panel-status panel-status-${conversationPhase}`}>
                    {getPhaseLabel(conversationPhase)}
                </span>
            </div>

            <div className="spec-content">
                {currentSpec ? (
                    <>
                        {/* Completeness Indicator */}
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

                        {/* Validation Checklist */}
                        <div className="spec-checklist">
                            <ChecklistItem
                                done={!!currentSpec.meta?.name}
                                label="Has app name"
                            />
                            <ChecklistItem
                                done={currentSpec.entities.length > 0}
                                label="Has entities"
                            />
                            <ChecklistItem
                                done={currentSpec.entities.every(e => e.properties.length > 0)}
                                label="Entities have properties"
                            />
                            <ChecklistItem
                                done={currentSpec.views.length > 0}
                                label="Has views"
                            />
                        </div>

                        {/* Validation Errors */}
                        {validation && !validation.valid && (
                            <div className="spec-errors">
                                <div className="spec-errors-header">⚠️ Issues to fix:</div>
                                <ul className="spec-errors-list">
                                    {validation.errors.slice(0, 3).map((error, i) => (
                                        <li key={i} className="spec-error-item">{error.message}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* JSON Display */}
                        <pre className="spec-json">
                            <code>{formatSpec(currentSpec)}</code>
                        </pre>
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

            {currentSpec && (
                <div className="spec-footer">
                    <div className="spec-stats">
                        <span className="spec-stat">
                            <strong>{currentSpec.entities.length}</strong> entities
                        </span>
                        <span className="spec-stat">
                            <strong>{currentSpec.views.length}</strong> views
                        </span>
                        <span className="spec-stat">
                            <strong>{currentSpec.actions.length}</strong> actions
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// Checklist Item Component
function ChecklistItem({ done, label }: { done: boolean; label: string }) {
    return (
        <div className={`checklist-item ${done ? 'done' : ''}`}>
            <span className="checklist-icon">{done ? '✓' : '○'}</span>
            <span className="checklist-label">{label}</span>
        </div>
    );
}

function formatSpec(spec: Specification): string {
    return JSON.stringify(spec, null, 2);
}

function getPhaseLabel(phase: string): string {
    switch (phase) {
        case 'gathering':
            return '🔍 Gathering';
        case 'refining':
            return '✏️ Refining';
        case 'validating':
            return '🔎 Validating';
        case 'building':
            return '🔨 Building';
        case 'complete':
            return '✅ Complete';
        case 'error':
            return '❌ Error';
        default:
            return '⏳ Waiting';
    }
}

export default SpecPanel;
