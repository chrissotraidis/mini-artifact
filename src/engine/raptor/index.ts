import { RaptorInput, RaptorOutput, BuildManifest, createTimestamp } from '../../types';
import { assemblePatterns } from './assembler';
import { getPattern } from './patterns';
import { renderTemplate } from '../../utils/templates';

// ============================================================
// Mini-Raptor - Composition Engine
// ============================================================

/**
 * Build a complete application from specification and patterns.
 *
 * Mini-Raptor assembles tested patterns into working code.
 * Same input always produces identical output (determinism).
 */
export async function build(input: RaptorInput): Promise<RaptorOutput> {
    const { spec, patterns } = input;

    try {
        // 1. Assemble patterns into HTML/CSS/JS
        const assembled = assemblePatterns(patterns, spec);

        // 2. Get the app shell pattern
        const shellPattern = getPattern('app-shell');
        if (!shellPattern) {
            return createErrorOutput('App shell pattern not found');
        }

        // 3. Render the complete HTML document
        const html = renderTemplate(shellPattern.template.html, {
            appName: spec.meta.name,
            description: spec.meta.description,
            content: assembled.html,
            styles: assembled.css,
            scripts: assembled.js,
        });

        // 4. Build manifest
        const manifest: BuildManifest = {
            specId: input.specId,
            builtAt: createTimestamp(),
            patternsUsed: [...new Set(patterns.map((p) => p.patternId))],
            deltasGenerated: [],
        };

        // 5. Create combined output for preview
        const combinedOutput = html;

        return {
            success: true,
            html,
            css: assembled.css,
            javascript: assembled.js,
            manifest,
        };
    } catch (error) {
        console.error('Raptor build error:', error);
        return createErrorOutput(
            error instanceof Error ? error.message : 'Build failed'
        );
    }
}

/**
 * Create an error output response.
 */
function createErrorOutput(message: string): RaptorOutput {
    return {
        success: false,
        html: '',
        css: '',
        javascript: '',
        manifest: {
            specId: '',
            builtAt: createTimestamp(),
            patternsUsed: [],
            deltasGenerated: [],
        },
        errors: [
            {
                code: 'BUILD_ERROR',
                message,
            },
        ],
    };
}

/**
 * Validate that all required patterns exist.
 */
export function validatePatterns(patternIds: string[]): { valid: boolean; missing: string[] } {
    const missing: string[] = [];

    for (const id of patternIds) {
        if (!getPattern(id)) {
            missing.push(id);
        }
    }

    return {
        valid: missing.length === 0,
        missing,
    };
}

/**
 * Get a preview HTML for a partial build.
 */
export function getPreviewHtml(html: string, css: string, js: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>${css}</style>
</head>
<body>
  <div id="app">${html}</div>
  <script>${js}</script>
</body>
</html>`;
}
