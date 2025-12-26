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

    // 2. Add unified app-core (replaces state-manager + handles all CRUD)
    patterns.push({
        patternId: 'app-core',
        targetId: 'global',
        config: {
            appName: spec.meta.name,
            entities: spec.entities,
            views: spec.views,
        },
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

    // 5. Actions are now handled by app-core pattern
    // No need for separate action-button or action-delete patterns

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
