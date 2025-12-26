import React, { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================
// ResizablePanels - Three-column layout with draggable dividers
// ============================================================

interface ResizablePanelsProps {
    left: React.ReactNode;
    center: React.ReactNode;
    right: React.ReactNode;
    minWidth?: number;
}

export function ResizablePanels({
    left,
    center,
    right,
    minWidth = 200
}: ResizablePanelsProps) {
    // Default: equal thirds
    const [leftWidth, setLeftWidth] = useState(33.33);
    const [rightWidth, setRightWidth] = useState(33.33);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef<'left' | 'right' | null>(null);

    const handleMouseDown = useCallback((divider: 'left' | 'right') => {
        isDragging.current = divider;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;

        const container = containerRef.current;
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width;
        const mouseX = e.clientX - rect.left;
        const minPercent = (minWidth / containerWidth) * 100;

        if (isDragging.current === 'left') {
            // Moving left divider
            const newLeftWidth = Math.max(minPercent, Math.min(60, (mouseX / containerWidth) * 100));
            setLeftWidth(newLeftWidth);
        } else if (isDragging.current === 'right') {
            // Moving right divider  
            const newRightWidth = Math.max(minPercent, Math.min(60, ((containerWidth - mouseX) / containerWidth) * 100));
            setRightWidth(newRightWidth);
        }
    }, [minWidth]);

    const handleMouseUp = useCallback(() => {
        isDragging.current = null;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);

    useEffect(() => {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    const centerWidth = 100 - leftWidth - rightWidth;

    return (
        <div ref={containerRef} className="resizable-panels">
            {/* Left Panel */}
            <div
                className="resizable-panel"
                style={{ width: `${leftWidth}%` }}
            >
                {left}
            </div>

            {/* Left Divider */}
            <div
                className="panel-divider"
                onMouseDown={() => handleMouseDown('left')}
            >
                <div className="divider-handle" />
            </div>

            {/* Center Panel */}
            <div
                className="resizable-panel"
                style={{ width: `${centerWidth}%` }}
            >
                {center}
            </div>

            {/* Right Divider */}
            <div
                className="panel-divider"
                onMouseDown={() => handleMouseDown('right')}
            >
                <div className="divider-handle" />
            </div>

            {/* Right Panel */}
            <div
                className="resizable-panel"
                style={{ width: `${rightWidth}%` }}
            >
                {right}
            </div>
        </div>
    );
}

export default ResizablePanels;
