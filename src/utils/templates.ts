import Handlebars from 'handlebars';

// ============================================================
// Template Utilities - Handlebars Wrapper
// ============================================================

// Register custom helpers
Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
});

Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context, null, 2);
});

Handlebars.registerHelper('capitalize', function (str) {
    if (typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper('lowercase', function (str) {
    if (typeof str !== 'string') return '';
    return str.toLowerCase();
});

Handlebars.registerHelper('kebabCase', function (str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
});

Handlebars.registerHelper('camelCase', function (str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) =>
            index === 0 ? letter.toLowerCase() : letter.toUpperCase()
        )
        .replace(/\s+/g, '');
});

Handlebars.registerHelper('pluralize', function (str) {
    if (typeof str !== 'string') return '';
    if (str.endsWith('s')) return str;
    if (str.endsWith('y')) return str.slice(0, -1) + 'ies';
    return str + 's';
});

Handlebars.registerHelper('getInputType', function (type) {
    switch (type) {
        case 'number':
            return 'number';
        case 'date':
            return 'date';
        case 'boolean':
            return 'checkbox';
        case 'email':
            return 'email';
        default:
            return 'text';
    }
});

// ------------------------------------------------------------
// Template Rendering
// ------------------------------------------------------------

/**
 * Render a Handlebars template with the given context.
 */
export function renderTemplate(template: string, context: Record<string, unknown>): string {
    try {
        const compiled = Handlebars.compile(template);
        return compiled(context);
    } catch (error) {
        console.error('Template rendering error:', error);
        return `<!-- Template error: ${error instanceof Error ? error.message : 'Unknown'} -->`;
    }
}

/**
 * Precompile a template for repeated use.
 */
export function compileTemplate(template: string): HandlebarsTemplateDelegate {
    return Handlebars.compile(template);
}

/**
 * Register a partial template.
 */
export function registerPartial(name: string, template: string): void {
    Handlebars.registerPartial(name, template);
}

/**
 * Escape HTML entities.
 */
export function escapeHtml(str: string): string {
    return Handlebars.Utils.escapeExpression(str);
}
