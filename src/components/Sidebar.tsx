import React from 'react';
import { SettingsButton } from './SettingsButton';
import { logger } from '../utils/logger';

export function Sidebar() {
    const handleExportLogs = () => {
        logger.downloadLogs();
    };

    const errorCount = logger.getErrorCount();

    return (
        <aside className="sidebar">
            {/* Workspace Selector / Header */}
            <div className="sidebar-header">
                <div className="workspace-title">
                    <img src="/logo.png" alt="Logo" className="workspace-logo" style={{ width: '24px', height: '24px', borderRadius: '4px' }} />
                    <span className="workspace-name">Ingen Systems</span>
                    <span className="workspace-arrow">▼</span>
                </div>
                <div className="user-email">guest@jurassic.park</div>
            </div>

            {/* Navigation Sections */}
            <div className="sidebar-nav">

                {/* Favorites / Quick Links */}
                <div className="nav-section">
                    <div className="nav-header">Favorites</div>
                    <div className="nav-item active">
                        <span className="nav-icon">🧬</span>
                        Project Genome
                    </div>
                    <div className="nav-item">
                        <span className="nav-icon">📋</span>
                        Safety Protocols
                    </div>
                </div>

                {/* Workspace Pages */}
                <div className="nav-section">
                    <div className="nav-header">Workspace</div>
                    <div className="nav-item">
                        <span className="nav-icon">📄</span>
                        <span className="nav-text">Specification</span>
                    </div>
                    <div
                        className="nav-item"
                        onClick={handleExportLogs}
                        style={{ cursor: 'pointer' }}
                        title="Click to download debug logs"
                    >
                        <span className="nav-icon">🔨</span>
                        <span className="nav-text">Build Logs</span>
                        {errorCount > 0 && (
                            <span
                                style={{
                                    marginLeft: '8px',
                                    background: '#e74c3c',
                                    color: 'white',
                                    borderRadius: '50%',
                                    width: '18px',
                                    height: '18px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '11px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {errorCount}
                            </span>
                        )}
                    </div>
                    <div className="nav-item">
                        <span className="nav-icon">👁️</span>
                        <span className="nav-text">Live Preview</span>
                    </div>
                </div>

                {/* Jurassic Theme Decor */}
                <div className="nav-section mt-auto">
                    <div className="jurassic-badge">
                        <span className="badge-icon">🌿</span>
                        <span>System Online</span>
                    </div>
                </div>

            </div>

            {/* Sidebar Footer with Settings */}
            <div className="sidebar-footer">
                <SettingsButton className="nav-item settings-trigger">
                    <span className="nav-icon">⚙️</span>
                    <span>Settings</span>
                </SettingsButton>
            </div>
        </aside>
    );
}

