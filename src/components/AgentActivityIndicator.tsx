import React from 'react';
import { useStore, selectActiveAgent, selectIsLoading, type ActiveAgent } from '../store';

// ============================================================
// AgentActivityIndicator - Shows which agent is currently working
// ============================================================

interface AgentInfo {
    id: ActiveAgent;
    name: string;
    icon: string;
    description: string;
}

const agents: AgentInfo[] = [
    {
        id: 'arnold',
        name: 'Arnold',
        icon: '📋',
        description: 'Spec Builder - Understanding your intent',
    },
    {
        id: 'nedry',
        name: 'Nedry',
        icon: '🔀',
        description: 'Orchestrator - Routing to the right agent',
    },
    {
        id: 'raptor',
        name: 'Raptor',
        icon: '🔧',
        description: 'Builder - Assembling your app',
    },
];

export function AgentActivityIndicator() {
    const activeAgent = useStore(selectActiveAgent);
    const isLoading = useStore(selectIsLoading);

    // Only show when there's activity
    if (!isLoading && activeAgent === 'idle') {
        return (
            <div className="agent-indicator agent-indicator--idle">
                <span className="agent-indicator-label">Agents Ready</span>
                <div className="agent-icons">
                    {agents.map((agent) => (
                        <div
                            key={agent.id}
                            className="agent-icon agent-icon--idle"
                            title={agent.description}
                        >
                            <span className="agent-icon-emoji">{agent.icon}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="agent-indicator agent-indicator--active">
            <span className="agent-indicator-label">Working</span>
            <div className="agent-icons">
                {agents.map((agent) => {
                    const isActive = agent.id === activeAgent;
                    return (
                        <div
                            key={agent.id}
                            className={`agent-icon ${isActive ? 'agent-icon--active' : 'agent-icon--idle'}`}
                            title={isActive ? `${agent.name}: ${agent.description}` : agent.name}
                        >
                            <span className="agent-icon-emoji">{agent.icon}</span>
                            {isActive && <span className="agent-icon-name">{agent.name}</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AgentActivityIndicator;
