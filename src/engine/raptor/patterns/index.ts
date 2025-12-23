import { Pattern } from '../../../types';

// Import all patterns
import { styleBase } from './style-base';
import { stateManager } from './state-manager';
import { appShell } from './app-shell';
import { navigation } from './navigation';
import { viewList } from './view-list';
import { viewForm } from './view-form';
import { viewDetail } from './view-detail';
import { entityCard } from './entity-card';
import { actionButton } from './action-button';
import { actionDelete } from './action-delete';
import { inputText } from './input-text';
import { inputCheckbox } from './input-checkbox';
import { inputDate } from './input-date';
import { inputSelect } from './input-select';

// ============================================================
// Pattern Registry
// ============================================================

const patterns: Map<string, Pattern> = new Map([
    ['style-base', styleBase],
    ['state-manager', stateManager],
    ['app-shell', appShell],
    ['navigation', navigation],
    ['view-list', viewList],
    ['view-form', viewForm],
    ['view-detail', viewDetail],
    ['entity-card', entityCard],
    ['action-button', actionButton],
    ['action-delete', actionDelete],
    ['input-text', inputText],
    ['input-checkbox', inputCheckbox],
    ['input-date', inputDate],
    ['input-select', inputSelect],
]);

/**
 * Get a pattern by ID.
 */
export function getPattern(patternId: string): Pattern | undefined {
    return patterns.get(patternId);
}

/**
 * Get all available pattern IDs.
 */
export function getAllPatternIds(): string[] {
    return Array.from(patterns.keys());
}

/**
 * Get all patterns.
 */
export function getAllPatterns(): Pattern[] {
    return Array.from(patterns.values());
}

/**
 * Check if a pattern exists.
 */
export function hasPattern(patternId: string): boolean {
    return patterns.has(patternId);
}

/**
 * Get patterns by category.
 */
export function getPatternsByCategory(category: Pattern['category']): Pattern[] {
    return getAllPatterns().filter((p) => p.category === category);
}

// Export all patterns
export {
    styleBase,
    stateManager,
    appShell,
    navigation,
    viewList,
    viewForm,
    viewDetail,
    entityCard,
    actionButton,
    actionDelete,
    inputText,
    inputCheckbox,
    inputDate,
    inputSelect,
};
