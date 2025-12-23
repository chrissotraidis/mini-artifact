import React from 'react';

// ============================================================
// WorkflowIndicator - Shows current phase
// ============================================================

type Phase = 'idle' | 'gathering' | 'refining' | 'building' | 'complete' | 'error';

interface WorkflowIndicatorProps {
    currentPhase: Phase;
}

const phases = [
    { id: 'write', label: 'Write', icon: '✏️', phases: ['idle', 'gathering'] },
    { id: 'plan', label: 'Plan', icon: '📋', phases: ['refining'] },
    { id: 'build', label: 'Build', icon: '🔨', phases: ['building'] },
    { id: 'review', label: 'Review', icon: '👁️', phases: ['complete'] },
];

export function WorkflowIndicator({ currentPhase }: WorkflowIndicatorProps) {
    const getPhaseIndex = () => {
        for (let i = 0; i < phases.length; i++) {
            if (phases[i].phases.includes(currentPhase)) {
                return i;
            }
        }
        return 0;
    };

    const activeIndex = getPhaseIndex();

    if (currentPhase === 'error') {
        return (
            <div className="workflow-indicator workflow-error">
                <span className="workflow-error-icon">⚠️</span>
                <span>Something went wrong. Try again or reset.</span>
            </div>
        );
    }

    return (
        <div className="workflow-indicator">
            {phases.map((phase, index) => (
                <React.Fragment key={phase.id}>
                    <div
                        className={`workflow-step ${index < activeIndex
                                ? 'workflow-step-done'
                                : index === activeIndex
                                    ? 'workflow-step-active'
                                    : 'workflow-step-pending'
                            }`}
                    >
                        <span className="workflow-step-icon">{phase.icon}</span>
                        <span className="workflow-step-label">{phase.label}</span>
                    </div>
                    {index < phases.length - 1 && (
                        <div
                            className={`workflow-connector ${index < activeIndex ? 'workflow-connector-done' : ''
                                }`}
                        />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

export default WorkflowIndicator;
