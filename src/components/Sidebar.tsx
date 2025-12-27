import React, { useState } from 'react';
import { SettingsButton } from './SettingsButton';
import { NewProjectModal } from './NewProjectModal';
import { ThemeToggle } from './ThemeToggle';
import { logger, Components } from '../utils/logger';
import { useStore, selectActivePanel, selectExpandedPanel, selectProjects, selectCurrentProjectId } from '../store';
import { Settings, FileCode, MessageSquare, Eye, Hammer, Plus, FolderOpen, Trash2 } from 'lucide-react';

export function Sidebar() {
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    const activePanel = useStore(selectActivePanel);
    const expandedPanel = useStore(selectExpandedPanel);
    const projects = useStore(selectProjects);
    const currentProjectId = useStore(selectCurrentProjectId);
    const setActivePanel = useStore((s) => s.setActivePanel);
    const setExpandedPanel = useStore((s) => s.setExpandedPanel);
    const createProject = useStore((s) => s.createProject);
    const switchProject = useStore((s) => s.switchProject);
    const deleteProject = useStore((s) => s.deleteProject);

    const handleExportLogs = () => {
        logger.downloadLogs();
    };

    const handleNavClick = (panel: 'chat' | 'spec' | 'preview') => {
        setActivePanel(panel);
        logger.info(Components.UI, `Navigated to ${panel}`);

        // If clicking spec or preview, expand that panel
        if (panel === 'spec' || panel === 'preview') {
            setExpandedPanel(panel);
        } else {
            // Clicking chat collapses any expanded panel
            setExpandedPanel(null);
        }
    };

    const handleNewProject = (name: string) => {
        createProject(name);
    };

    const handleDeleteProject = (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        if (confirm('Delete this project? This cannot be undone.')) {
            deleteProject(projectId);
        }
    };

    const errorCount = logger.getErrorCount();

    return (
        <aside className="sidebar">
            {/* Header */}
            <div className="sidebar-header">
                <img
                    src="/logo.png"
                    alt="Mini Artifact"
                    style={{ width: '24px', height: '24px', borderRadius: '4px' }}
                />
                <span className="sidebar-title">Mini Artifact</span>
                <ThemeToggle />
            </div>

            {/* Projects Section */}
            <div className="sidebar-section">
                <div className="sidebar-section-header">
                    <span className="sidebar-section-title">Projects</span>
                    <button
                        className="sidebar-add-btn"
                        onClick={() => setShowNewProjectModal(true)}
                        title="New Project"
                    >
                        <Plus size={14} />
                    </button>
                </div>
                <div className="project-list">
                    {projects.length === 0 ? (
                        <div className="project-empty">
                            <p>No projects yet</p>
                            <button
                                className="btn btn-primary btn-sm"
                                onClick={() => setShowNewProjectModal(true)}
                            >
                                Create First Project
                            </button>
                        </div>
                    ) : (
                        projects.map((project) => (
                            <div
                                key={project.id}
                                className={`project-item ${project.id === currentProjectId ? 'active' : ''}`}
                                onClick={() => switchProject(project.id)}
                            >
                                <FolderOpen size={14} className="project-icon" />
                                <span className="project-name">{project.name}</span>
                                <button
                                    className="project-delete-btn"
                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                    title="Delete project"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="nav-section">
                <div className="nav-section-label">Current Project</div>
                <div
                    className={`nav-item ${activePanel === 'chat' && !expandedPanel ? 'active' : ''}`}
                    onClick={() => handleNavClick('chat')}
                >
                    <MessageSquare className="nav-icon" size={18} />
                    <span>Chat</span>
                </div>
                <div
                    className={`nav-item ${expandedPanel === 'spec' ? 'active' : ''}`}
                    onClick={() => handleNavClick('spec')}
                >
                    <FileCode className="nav-icon" size={18} />
                    <span>Specification</span>
                </div>
                <div
                    className={`nav-item ${expandedPanel === 'preview' ? 'active' : ''}`}
                    onClick={() => handleNavClick('preview')}
                >
                    <Eye className="nav-icon" size={18} />
                    <span>Preview</span>
                </div>
                <div
                    className="nav-item"
                    onClick={handleExportLogs}
                    style={{ cursor: 'pointer' }}
                    title="Click to download debug logs"
                >
                    <Hammer className="nav-icon" size={18} />
                    <span>Build Logs</span>
                    {errorCount > 0 && (
                        <span
                            style={{
                                marginLeft: 'auto',
                                background: 'var(--color-error)',
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
            </nav>

            {/* Footer with Settings */}
            <div className="sidebar-footer">
                <SettingsButton className="nav-item">
                    <Settings className="nav-icon" size={18} />
                    <span>Settings</span>
                </SettingsButton>
            </div>

            {/* New Project Modal */}
            <NewProjectModal
                isOpen={showNewProjectModal}
                onClose={() => setShowNewProjectModal(false)}
                onSubmit={handleNewProject}
            />
        </aside>
    );
}
