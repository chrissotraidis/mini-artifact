// ============================================================
// Mini Artifact - Centralized Logger
// ============================================================

/**
 * Log levels in order of severity
 */
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
}

/**
 * Structured log entry
 */
export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    levelName: string;
    component: string;
    message: string;
    data?: unknown;
}

/**
 * Component names for consistent logging
 */
export const Components = {
    OPENAI: 'OpenAI',
    ARNOLD: 'Arnold',
    NEDRY: 'Nedry',
    RAPTOR: 'Raptor',
    STORE: 'Store',
    UI: 'UI',
} as const;

type ComponentName = (typeof Components)[keyof typeof Components];

// ------------------------------------------------------------
// Logger Configuration
// ------------------------------------------------------------

const MAX_LOG_ENTRIES = 100;
const IS_DEV = import.meta.env.DEV;

// Console color codes for development
const LEVEL_COLORS: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: '\x1b[90m', // Gray
    [LogLevel.INFO]: '\x1b[36m', // Cyan
    [LogLevel.WARN]: '\x1b[33m', // Yellow
    [LogLevel.ERROR]: '\x1b[31m', // Red
};
const RESET_COLOR = '\x1b[0m';

// Level names for display
const LEVEL_NAMES: Record<LogLevel, string> = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
};

// ------------------------------------------------------------
// Logger Class
// ------------------------------------------------------------

class Logger {
    private logs: LogEntry[] = [];
    private minLevel: LogLevel = IS_DEV ? LogLevel.DEBUG : LogLevel.INFO;

    /**
     * Core logging method
     */
    log(level: LogLevel, component: ComponentName, message: string, data?: unknown): void {
        if (level < this.minLevel) return;

        const entry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            levelName: LEVEL_NAMES[level],
            component,
            message,
            data,
        };

        // Add to buffer (FIFO)
        this.logs.push(entry);
        if (this.logs.length > MAX_LOG_ENTRIES) {
            this.logs.shift();
        }

        // Console output
        this.consoleOutput(entry);
    }

    /**
     * Log a debug message (development only)
     */
    debug(component: ComponentName, message: string, data?: unknown): void {
        this.log(LogLevel.DEBUG, component, message, data);
    }

    /**
     * Log an info message
     */
    info(component: ComponentName, message: string, data?: unknown): void {
        this.log(LogLevel.INFO, component, message, data);
    }

    /**
     * Log a warning
     */
    warn(component: ComponentName, message: string, data?: unknown): void {
        this.log(LogLevel.WARN, component, message, data);
    }

    /**
     * Log an error
     */
    error(component: ComponentName, message: string, data?: unknown): void {
        this.log(LogLevel.ERROR, component, message, data);
    }

    /**
     * Get all stored logs
     */
    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Get logs filtered by level
     */
    getLogsByLevel(minLevel: LogLevel): LogEntry[] {
        return this.logs.filter((log) => log.level >= minLevel);
    }

    /**
     * Get logs filtered by component
     */
    getLogsByComponent(component: ComponentName): LogEntry[] {
        return this.logs.filter((log) => log.component === component);
    }

    /**
     * Export logs as JSON string
     */
    exportLogs(): string {
        return JSON.stringify(
            {
                exportedAt: new Date().toISOString(),
                totalEntries: this.logs.length,
                logs: this.logs,
            },
            null,
            2
        );
    }

    /**
     * Download logs as a JSON file
     */
    downloadLogs(): void {
        const json = this.exportLogs();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mini-artifact-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
    }

    /**
     * Get error count
     */
    getErrorCount(): number {
        return this.logs.filter((log) => log.level === LogLevel.ERROR).length;
    }

    /**
     * Format and output to console
     */
    private consoleOutput(entry: LogEntry): void {
        const timestamp = entry.timestamp.slice(11, 23); // HH:mm:ss.SSS
        const prefix = `[${timestamp}] [${entry.levelName}] [${entry.component}]`;

        // Use appropriate console method
        const consoleFn =
            entry.level === LogLevel.ERROR
                ? console.error
                : entry.level === LogLevel.WARN
                    ? console.warn
                    : entry.level === LogLevel.DEBUG
                        ? console.debug
                        : console.log;

        if (IS_DEV && typeof window === 'undefined') {
            // Node environment with colors
            const color = LEVEL_COLORS[entry.level];
            consoleFn(`${color}${prefix}${RESET_COLOR} ${entry.message}`, entry.data ?? '');
        } else {
            // Browser environment
            const style = `color: ${entry.level === LogLevel.ERROR
                    ? '#e74c3c'
                    : entry.level === LogLevel.WARN
                        ? '#f39c12'
                        : entry.level === LogLevel.DEBUG
                            ? '#95a5a6'
                            : '#3498db'
                }; font-weight: bold;`;

            if (entry.data !== undefined) {
                consoleFn(`%c${prefix}%c ${entry.message}`, style, '', entry.data);
            } else {
                consoleFn(`%c${prefix}%c ${entry.message}`, style, '');
            }
        }
    }
}

// ------------------------------------------------------------
// Singleton Export
// ------------------------------------------------------------

export const logger = new Logger();
