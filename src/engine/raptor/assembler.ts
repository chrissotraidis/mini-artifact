import { PatternReference, Specification, Pattern } from '../../types';
import { getPattern } from './patterns';
import { renderTemplate } from '../../utils/templates';

// ============================================================
// Pattern Assembler
// ============================================================

export interface AssembledCode {
    html: string;
    css: string;
    js: string;
}

/**
 * Assemble patterns into combined HTML/CSS/JS.
 *
 * This function:
 * 1. Sorts patterns by dependency order
 * 2. Builds context for each pattern from spec
 * 3. Renders each template using Handlebars
 * 4. Combines all output into coherent code
 */
export function assemblePatterns(
    patternRefs: PatternReference[],
    spec: Specification
): AssembledCode {
    const htmlParts: string[] = [];
    const cssParts: string[] = [];
    const jsParts: string[] = [];

    // Track rendered patterns to avoid duplicates
    const renderedPatterns = new Set<string>();

    // Sort patterns by dependency order
    const sortedRefs = sortByDependencies(patternRefs);

    for (const ref of sortedRefs) {
        // Skip if already rendered
        if (renderedPatterns.has(ref.patternId + ':' + ref.targetId)) {
            continue;
        }

        const pattern = getPattern(ref.patternId);
        if (!pattern) {
            console.warn(`Pattern not found: ${ref.patternId}`);
            continue;
        }

        // Build context from config and spec
        const context = buildContext(ref, spec, pattern);

        // Render templates
        const html = pattern.template.html
            ? renderTemplate(pattern.template.html, context)
            : '';
        const css = pattern.template.css
            ? renderTemplate(pattern.template.css, context)
            : '';
        const js = pattern.template.js
            ? renderTemplate(pattern.template.js, context)
            : '';

        if (html) htmlParts.push(html);
        if (css) cssParts.push(css);
        if (js) jsParts.push(js);

        renderedPatterns.add(ref.patternId + ':' + ref.targetId);
    }

    return {
        html: htmlParts.join('\n'),
        css: deduplicateCSS(cssParts),
        js: jsParts.join('\n\n'),
    };
}

// ------------------------------------------------------------
// Dependency Sorting
// ------------------------------------------------------------

function sortByDependencies(refs: PatternReference[]): PatternReference[] {
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

    return [...refs].sort((a, b) => {
        const orderA = priorityOrder[a.patternId] ?? 10;
        const orderB = priorityOrder[b.patternId] ?? 10;
        return orderA - orderB;
    });
}

// ------------------------------------------------------------
// Context Building
// ------------------------------------------------------------

function buildContext(
    ref: PatternReference,
    spec: Specification,
    pattern: Pattern
): Record<string, unknown> {
    // Start with pattern config
    const context: Record<string, unknown> = {
        ...ref.config,
        appName: spec.meta.name,
        appDescription: spec.meta.description,
    };

    // Add spec-level data
    context.entities = spec.entities;
    context.views = spec.views;
    context.actions = spec.actions;

    // Find related entity if referenced
    if (ref.config.entityId || ref.config.entity) {
        const entityId = ref.config.entityId || (ref.config.entity as { id?: string })?.id;
        if (typeof entityId === 'string') {
            const entity = spec.entities.find((e) => e.id === entityId);
            if (entity) {
                context.entity = entity;
                context.properties = entity.properties;
            }
        }
    }

    // Add entity from config if it's an object
    if (ref.config.entity && typeof ref.config.entity === 'object') {
        context.entity = ref.config.entity;
    }

    return context;
}

// ------------------------------------------------------------
// CSS Deduplication
// ------------------------------------------------------------

function deduplicateCSS(cssParts: string[]): string {
    const seen = new Set<string>();
    const deduplicated: string[] = [];

    for (const part of cssParts) {
        // Normalize whitespace for comparison
        const normalized = part.trim();
        if (!seen.has(normalized) && normalized.length > 0) {
            seen.add(normalized);
            deduplicated.push(normalized);
        }
    }

    return deduplicated.join('\n\n');
}

// ------------------------------------------------------------
// Topological Sort (for complex dependency graphs)
// ------------------------------------------------------------

export function topologicalSort(patterns: Pattern[]): Pattern[] {
    const sorted: Pattern[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    function visit(p: Pattern) {
        if (visited.has(p.id)) return;
        if (visiting.has(p.id)) {
            console.warn(`Circular dependency detected: ${p.id}`);
            return;
        }

        visiting.add(p.id);

        for (const depId of p.dependencies) {
            const dep = patterns.find((pat) => pat.id === depId);
            if (dep) visit(dep);
        }

        visiting.delete(p.id);
        visited.add(p.id);
        sorted.push(p);
    }

    for (const pattern of patterns) {
        visit(pattern);
    }

    return sorted;
}
