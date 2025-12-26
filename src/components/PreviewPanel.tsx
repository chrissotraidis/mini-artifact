import React, { useState } from 'react';
import { useStore, selectBuildResult, selectBuildStatus, selectExpandedPanel } from '../store';

// ============================================================
// PreviewPanel - Generated App Preview with Expand/Collapse
// ============================================================

interface PreviewPanelProps {
    hideHeader?: boolean;
}

export function PreviewPanel({ hideHeader = false }: PreviewPanelProps) {
    const buildResult = useStore(selectBuildResult);
    const buildStatus = useStore(selectBuildStatus);
    const expandedPanel = useStore(selectExpandedPanel);
    const setExpandedPanel = useStore((s) => s.setExpandedPanel);
    const [showSource, setShowSource] = useState(false);

    const isExpanded = expandedPanel === 'preview';

    // Log for debugging
    React.useEffect(() => {
        if (buildResult?.success && buildResult.html) {
            console.log('Preview: Build successful, HTML length:', buildResult.html.length);
            console.log('Preview: Generated HTML:\n', buildResult.html.substring(0, 500) + '...');
        }
    }, [buildResult]);

    const handleToggleExpand = () => {
        setExpandedPanel(isExpanded ? null : 'preview');
    };

    return (
        <div className={`preview-panel ${isExpanded ? 'preview-expanded' : ''}`}>
            {!hideHeader && (
                <div className="panel-header">
                    <h2 className="panel-title">🖥️ Preview</h2>
                    <div className="panel-header-actions">
                        <span className={`panel-status panel-status-${buildStatus}`}>
                            {getStatusLabel(buildStatus)}
                        </span>
                        {buildResult?.success && buildResult.html && (
                            <button
                                className="panel-toggle-btn"
                                onClick={() => setShowSource(!showSource)}
                                title={showSource ? 'Show preview' : 'View source'}
                            >
                                {showSource ? '👁️' : '{ }'}
                            </button>
                        )}
                        <button
                            className="panel-expand-btn"
                            onClick={handleToggleExpand}
                            title={isExpanded ? 'Collapse preview' : 'Expand preview'}
                        >
                            {isExpanded ? '⬇️' : '⬆️'}
                        </button>
                    </div>
                </div>
            )}

            <div className="preview-content">
                {buildStatus === 'building' ? (
                    <div className="preview-loading">
                        <div className="spinner"></div>
                        <p>Generating application...</p>
                    </div>
                ) : showSource && buildResult?.html ? (
                    <div className="source-view">
                        <pre className="source-code">
                            <code>{buildResult.html}</code>
                        </pre>
                    </div>
                ) : buildResult?.success && buildResult.html ? (
                    <iframe
                        key={buildResult.html.length}
                        className="preview-iframe"
                        title="App Preview"
                        srcDoc={buildResult.html}
                        sandbox="allow-scripts allow-forms allow-same-origin"
                    />
                ) : buildResult?.errors?.length ? (
                    <div className="preview-error">
                        <div className="preview-error-icon">⚠️</div>
                        <p className="preview-error-title">Build Error</p>
                        <ul className="preview-error-list">
                            {buildResult.errors.map((error, i) => (
                                <li key={i}>{JSON.stringify(error)}</li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <div className="preview-empty">
                        <div className="preview-empty-icon">🎨</div>
                        <p className="preview-empty-text">
                            Your generated app will appear here
                        </p>
                        <p className="preview-empty-hint">
                            Complete the specification and click "Generate" to build
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function getStatusLabel(status: string): string {
    switch (status) {
        case 'building':
            return '⏳ Building...';
        case 'success':
            return '✅ Ready';
        case 'error':
            return '❌ Error';
        default:
            return '⏸️ Idle';
    }
}

export default PreviewPanel;

