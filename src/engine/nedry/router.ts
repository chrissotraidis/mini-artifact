import { Specification, PatternReference } from '../../types';

// ============================================================
// Mini-Nedry - Pattern Router
// ============================================================

/**
 * Match specification elements to available patterns.
 *
 * Returns an ordered list of pattern references ready for assembly.
 */
export function matchPatterns(spec: Specification): PatternReference[] {
    const patterns: PatternReference[] = [];

    // 1. Always include utility patterns first (dependencies)
    patterns.push({
        patternId: 'style-base',
        targetId: 'global',
        config: { theme: 'dark' },
    });

    patterns.push({
        patternId: 'state-manager',
        targetId: 'global',
        config: { entities: spec.entities.map((e) => e.id) },
    });

    // 2. Include layout patterns
    patterns.push({
        patternId: 'app-shell',
        targetId: 'root',
        config: {
            appName: spec.meta.name,
            description: spec.meta.description,
        },
    });

    patterns.push({
        patternId: 'navigation',
        targetId: 'nav',
        config: {
            appName: spec.meta.name,
            views: spec.views.map((v) => ({ id: v.id, name: v.name })),
        },
    });

    // 3. Map entities to entity patterns
    spec.entities.forEach((entity) => {
        patterns.push({
            patternId: 'entity-card',
            targetId: entity.id,
            config: {
                entityId: entity.id,
                entityName: entity.name,
                properties: entity.properties,
            },
        });
    });

    // 4. Map views to view patterns
    spec.views.forEach((view) => {
        const entity = spec.entities.find((e) => e.id === view.entity);

        switch (view.type) {
            case 'list':
                patterns.push({
                    patternId: 'view-list',
                    targetId: view.id,
                    config: {
                        viewId: view.id,
                        viewName: view.name,
                        entity: entity || null,
                        properties: entity?.properties || [],
                    },
                });
                break;

            case 'form':
                patterns.push({
                    patternId: 'view-form',
                    targetId: view.id,
                    config: {
                        viewId: view.id,
                        viewName: view.name,
                        entity: entity || null,
                        properties: entity?.properties || [],
                    },
                });

                // Also add input patterns for form fields
                if (entity) {
                    addInputPatterns(patterns, entity, view.id);
                }
                break;

            case 'detail':
                patterns.push({
                    patternId: 'view-detail',
                    targetId: view.id,
                    config: {
                        viewId: view.id,
                        viewName: view.name,
                        entity: entity || null,
                        properties: entity?.properties || [],
                    },
                });
                break;

            case 'dashboard':
                // Dashboard uses list view for now
                patterns.push({
                    patternId: 'view-list',
                    targetId: view.id,
                    config: {
                        viewId: view.id,
                        viewName: view.name,
                        entity: entity || null,
                        properties: entity?.properties || [],
                        isDashboard: true,
                    },
                });
                break;
        }
    });

    // 5. Map actions to action patterns
    spec.actions.forEach((action) => {
        switch (action.trigger) {
            case 'button':
                patterns.push({
                    patternId: 'action-button',
                    targetId: action.id,
                    config: {
                        actionId: action.id,
                        actionName: action.name,
                        logic: action.logic,
                    },
                });
                break;

            case 'form_submit':
                // Form submit is handled by view-form pattern
                break;

            case 'auto':
                // Auto actions handled by state-manager
                break;
        }

        // Check if it's a delete action
        if (action.name.toLowerCase().includes('delete')) {
            patterns.push({
                patternId: 'action-delete',
                targetId: `${action.id}-delete`,
                config: {
                    actionId: action.id,
                    actionName: action.name,
                },
            });
        }
    });

    return patterns;
}

// ------------------------------------------------------------
// Input Pattern Helpers
// ------------------------------------------------------------

function addInputPatterns(
    patterns: PatternReference[],
    entity: Specification['entities'][0],
    viewId: string
): void {
    entity.properties.forEach((prop) => {
        const inputPattern = getInputPatternForType(prop.type);

        patterns.push({
            patternId: inputPattern,
            targetId: `${viewId}-${prop.name}`,
            config: {
                fieldName: prop.name,
                fieldType: prop.type,
                required: prop.required,
                options: prop.options,
            },
        });
    });
}

function getInputPatternForType(type: string): string {
    switch (type) {
        case 'boolean':
            return 'input-checkbox';
        case 'date':
            return 'input-date';
        case 'enum':
            return 'input-select';
        default:
            return 'input-text';
    }
}

// ------------------------------------------------------------
// Pattern Resolution
// ------------------------------------------------------------

/**
 * Get the set of unique pattern IDs from references.
 */
export function getUniquePatternIds(patterns: PatternReference[]): string[] {
    return [...new Set(patterns.map((p) => p.patternId))];
}

/**
 * Sort patterns by dependency order.
 */
export function sortPatternsByDependency(patterns: PatternReference[]): PatternReference[] {
    // Define dependency order (patterns that must come first)
    const priorityOrder: Record<string, number> = {
        'style-base': 0,
        'state-manager': 1,
        'app-shell': 2,
        'navigation': 3,
        'entity-card': 4,
        'input-text': 5,
        'input-checkbox': 5,
        'input-date': 5,
        'input-select': 5,
        'view-list': 6,
        'view-form': 6,
        'view-detail': 6,
        'action-button': 7,
        'action-delete': 7,
    };

    return [...patterns].sort((a, b) => {
        const orderA = priorityOrder[a.patternId] ?? 10;
        const orderB = priorityOrder[b.patternId] ?? 10;
        return orderA - orderB;
    });
}
