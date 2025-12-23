import React, { useRef, useEffect } from 'react';
import { useStore, selectBuildResult, selectBuildStatus } from '../store';

// ============================================================
// PreviewPanel - Generated App Preview
// ============================================================

export function PreviewPanel() {
    const buildResult = useStore(selectBuildResult);
    const buildStatus = useStore(selectBuildStatus);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Update iframe content when build result changes
    useEffect(() => {
        if (iframeRef.current && buildResult?.success && buildResult.html) {
            const iframe = iframeRef.current;
            const doc = iframe.contentDocument || iframe.contentWindow?.document;
            if (doc) {
                doc.open();
                doc.write(buildResult.html);
                doc.close();
            }
        }
    }, [buildResult]);

    return (
        <div className="preview-panel">
            <div className="panel-header">
                <h2 className="panel-title">🖥️ Preview</h2>
                <span className={`panel-status panel-status-${buildStatus}`}>
                    {getStatusLabel(buildStatus)}
                </span>
            </div>

            <div className="preview-content">
                {buildStatus === 'building' ? (
                    <div className="preview-loading">
                        <div className="spinner"></div>
                        <p>Generating application...</p>
                    </div>
                ) : buildResult?.success ? (
                    <iframe
                        ref={iframeRef}
                        className="preview-iframe"
                        title="App Preview"
                        sandbox="allow-scripts allow-forms"
                    />
                ) : buildResult?.errors?.length ? (
                    <div className="preview-error">
                        <div className="preview-error-icon">⚠️</div>
                        <p className="preview-error-title">Build Error</p>
                        <ul className="preview-error-list">
                            {buildResult.errors.map((error, i) => (
                                <li key={i}>{error}</li>
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
