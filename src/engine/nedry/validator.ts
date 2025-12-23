import { Specification, ValidationResult, ValidationError, ValidationWarning } from '../../types';

// ============================================================
// Mini-Nedry - Spec Validator
// ============================================================

/**
 * Validate a specification for completeness and correctness.
 *
 * Returns validation result with errors, warnings, and completeness score.
 */
export function validateSpec(spec: Specification | null): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!spec) {
        return {
            valid: false,
            errors: [{ code: 'NO_SPEC', message: 'No specification provided' }],
            warnings: [],
            completeness: 0,
        };
    }

    // Required checks
    if (!spec.meta?.name || spec.meta.name.trim() === '') {
        errors.push({
            code: 'MISSING_NAME',
            message: 'App name is required',
            path: 'meta.name',
        });
    }

    if (spec.entities.length === 0) {
        errors.push({
            code: 'NO_ENTITIES',
            message: 'At least one entity is required',
            path: 'entities',
        });
    }

    if (spec.views.length === 0) {
        errors.push({
            code: 'NO_VIEWS',
            message: 'At least one view is required',
            path: 'views',
        });
    }

    // Entity validation
    spec.entities.forEach((entity, index) => {
        if (!entity.name || entity.name.trim() === '') {
            errors.push({
                code: 'MISSING_ENTITY_NAME',
                message: `Entity at index ${index} has no name`,
                path: `entities[${index}].name`,
            });
        }

        if (entity.properties.length === 0) {
            errors.push({
                code: 'NO_PROPERTIES',
                message: `Entity "${entity.name || index}" has no properties`,
                path: `entities[${index}].properties`,
            });
        }

        // Check for duplicate property names
        const propNames = new Set<string>();
        entity.properties.forEach((prop, propIndex) => {
            if (propNames.has(prop.name)) {
                warnings.push({
                    code: 'DUPLICATE_PROPERTY',
                    message: `Duplicate property name "${prop.name}" in entity "${entity.name}"`,
                    path: `entities[${index}].properties[${propIndex}]`,
                });
            }
            propNames.add(prop.name);
        });

        // Validate relationships
        entity.relationships.forEach((rel, relIndex) => {
            const targetExists = spec.entities.some((e) => e.id === rel.targetEntity);
            if (!targetExists && rel.targetEntity) {
                warnings.push({
                    code: 'INVALID_RELATIONSHIP',
                    message: `Relationship in "${entity.name}" references unknown entity "${rel.targetEntity}"`,
                    path: `entities[${index}].relationships[${relIndex}]`,
                });
            }
        });
    });

    // View validation
    spec.views.forEach((view, index) => {
        if (!view.name || view.name.trim() === '') {
            errors.push({
                code: 'MISSING_VIEW_NAME',
                message: `View at index ${index} has no name`,
                path: `views[${index}].name`,
            });
        }

        // Check entity reference
        if (view.entity) {
            const entityExists = spec.entities.some((e) => e.id === view.entity);
            if (!entityExists) {
                warnings.push({
                    code: 'INVALID_VIEW_ENTITY',
                    message: `View "${view.name}" references unknown entity "${view.entity}"`,
                    path: `views[${index}].entity`,
                });
            }
        }
    });

    // Action validation
    spec.actions.forEach((action, index) => {
        if (!action.name || action.name.trim() === '') {
            errors.push({
                code: 'MISSING_ACTION_NAME',
                message: `Action at index ${index} has no name`,
                path: `actions[${index}].name`,
            });
        }

        if (!action.trigger) {
            errors.push({
                code: 'MISSING_TRIGGER',
                message: `Action "${action.name || index}" has no trigger defined`,
                path: `actions[${index}].trigger`,
            });
        }
    });

    // Optional warnings
    if (!spec.meta?.description || spec.meta.description.trim() === '') {
        warnings.push({
            code: 'MISSING_DESCRIPTION',
            message: 'App description is recommended',
            path: 'meta.description',
        });
    }

    if (spec.patterns.length === 0) {
        warnings.push({
            code: 'NO_PATTERNS',
            message: 'No patterns specified, defaults will be used',
            path: 'patterns',
        });
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
        completeness: calculateCompleteness(spec),
    };
}

// ------------------------------------------------------------
// Completeness Calculation
// ------------------------------------------------------------

export function calculateCompleteness(spec: Specification | null): number {
    if (!spec) return 0;

    let score = 0;

    // Base requirements (50%)
    if (spec.meta.name) score += 0.1;
    if (spec.meta.description) score += 0.05;
    if (spec.entities.length > 0) score += 0.15;
    if (spec.views.length > 0) score += 0.1;
    if (spec.actions.length > 0) score += 0.1;

    // Entity completeness (30%)
    if (spec.entities.length > 0) {
        const entityScore = spec.entities.reduce((sum, entity) => {
            let entityPoints = 0;
            if (entity.name) entityPoints += 0.3;
            if (entity.properties.length > 0) entityPoints += 0.4;
            if (entity.properties.length >= 2) entityPoints += 0.2;
            if (entity.properties.some((p) => p.required)) entityPoints += 0.1;
            return sum + entityPoints;
        }, 0) / spec.entities.length;
        score += entityScore * 0.3;
    }

    // View completeness (10%)
    if (spec.views.length > 0) {
        const viewScore = spec.views.reduce((sum, view) => {
            let viewPoints = 0;
            if (view.name) viewPoints += 0.5;
            if (view.entity) viewPoints += 0.5;
            return sum + viewPoints;
        }, 0) / spec.views.length;
        score += viewScore * 0.1;
    }

    // Pattern specification (10%)
    if (spec.patterns.length > 0) {
        score += Math.min(spec.patterns.length / 5, 1) * 0.1;
    }

    return Math.max(0, Math.min(1, score));
}

// ------------------------------------------------------------
// Quick Validation Helpers
// ------------------------------------------------------------

export function isValidForBuild(spec: Specification | null): boolean {
    if (!spec) return false;
    const result = validateSpec(spec);
    return result.valid;
}

export function getValidationSummary(result: ValidationResult): string {
    if (result.valid) {
        return `Spec is valid with ${result.warnings.length} warning(s)`;
    }
    return `Spec has ${result.errors.length} error(s): ${result.errors.map((e) => e.message).join(', ')}`;
}
