import { describe, it, expect } from 'vitest';
import { build, validatePatterns } from '../src/engine/raptor';
import { assemblePatterns } from '../src/engine/raptor/assembler';
import { getPattern, getAllPatternIds, hasPattern } from '../src/engine/raptor/patterns';
import { Specification, PatternReference } from '../src/types';

describe('Mini-Raptor', () => {
    const testSpec: Specification = {
        version: '1.0.0',
        meta: { name: 'Test App', description: 'A test application', createdAt: '2024-01-01' },
        entities: [
            {
                id: 'task',
                name: 'Task',
                properties: [
                    { name: 'title', type: 'string', required: true },
                    { name: 'completed', type: 'boolean', required: false },
                ],
                relationships: [],
            },
        ],
        views: [{ id: 'task-list', name: 'Task List', type: 'list', entity: 'task' }],
        actions: [{ id: 'add-task', name: 'Add Task', trigger: 'button', logic: 'Add new task' }],
        patterns: ['view-list', 'action-button'],
    };

    describe('Pattern Library', () => {
        it('has all required patterns', () => {
            const requiredPatterns = [
                'style-base',
                'state-manager',
                'app-shell',
                'navigation',
                'view-list',
                'view-form',
                'view-detail',
                'entity-card',
                'action-button',
                'action-delete',
                'input-text',
                'input-checkbox',
                'input-date',
                'input-select',
            ];

            requiredPatterns.forEach(id => {
                expect(hasPattern(id)).toBe(true);
            });
        });

        it('returns pattern by ID', () => {
            const pattern = getPattern('app-shell');
            expect(pattern).toBeDefined();
            expect(pattern?.id).toBe('app-shell');
            expect(pattern?.template.html).toBeTruthy();
        });

        it('returns undefined for unknown pattern', () => {
            const pattern = getPattern('non-existent-pattern');
            expect(pattern).toBeUndefined();
        });

        it('lists all pattern IDs', () => {
            const ids = getAllPatternIds();
            expect(ids.length).toBeGreaterThanOrEqual(14);
        });
    });

    describe('assemblePatterns', () => {
        it('produces combined output', () => {
            const patterns: PatternReference[] = [
                { patternId: 'style-base', targetId: 'global', config: { theme: 'dark' } },
                { patternId: 'navigation', targetId: 'nav', config: { appName: 'Test', views: [] } },
            ];

            const result = assemblePatterns(patterns, testSpec);

            expect(result.html).toBeDefined();
            expect(result.css).toBeDefined();
            expect(result.js).toBeDefined();
        });

        it('skips unknown patterns gracefully', () => {
            const patterns: PatternReference[] = [
                { patternId: 'unknown-pattern', targetId: 'x', config: {} },
                { patternId: 'style-base', targetId: 'global', config: {} },
            ];

            // Should not throw
            const result = assemblePatterns(patterns, testSpec);
            expect(result.css).toBeTruthy();
        });
    });

    describe('build', () => {
        it('produces valid HTML output', async () => {
            const patterns: PatternReference[] = [
                { patternId: 'style-base', targetId: 'global', config: {} },
                { patternId: 'app-shell', targetId: 'root', config: { appName: 'Test', description: 'Test' } },
            ];

            const result = await build({
                specId: '1.0.0',
                spec: testSpec,
                patterns,
                deltas: [],
                config: { includeStyles: true, includeScripts: true, minify: false },
            });

            expect(result.success).toBe(true);
            expect(result.html).toContain('<!DOCTYPE html>');
            expect(result.html).toContain('Test App');
        });

        it('produces deterministic output (same input = same output)', async () => {
            const patterns: PatternReference[] = [
                { patternId: 'style-base', targetId: 'global', config: {} },
                { patternId: 'navigation', targetId: 'nav', config: { appName: 'Test', views: [] } },
            ];

            const input = {
                specId: '1.0.0',
                spec: testSpec,
                patterns,
                deltas: [],
                config: { includeStyles: true, includeScripts: true, minify: false },
            };

            const result1 = await build(input);
            const result2 = await build(input);

            // Same input should produce identical output
            expect(result1.html).toBe(result2.html);
            expect(result1.css).toBe(result2.css);
            expect(result1.javascript).toBe(result2.javascript);
        });

        it('handles missing app-shell gracefully', async () => {
            const patterns: PatternReference[] = [
                { patternId: 'style-base', targetId: 'global', config: {} },
            ];

            // Mock getPattern to return undefined for app-shell
            const result = await build({
                specId: '1.0.0',
                spec: testSpec,
                patterns,
                deltas: [],
                config: { includeStyles: true, includeScripts: true, minify: false },
            });

            // Should still produce output (app-shell is fetched separately)
            expect(result.success).toBe(true);
        });

        it('includes build manifest', async () => {
            const patterns: PatternReference[] = [
                { patternId: 'style-base', targetId: 'global', config: {} },
            ];

            const result = await build({
                specId: 'test-1.0.0',
                spec: testSpec,
                patterns,
                deltas: [],
                config: { includeStyles: true, includeScripts: true, minify: false },
            });

            expect(result.manifest).toBeDefined();
            expect(result.manifest.specId).toBe('test-1.0.0');
            expect(result.manifest.builtAt).toBeTruthy();
            expect(result.manifest.patternsUsed).toContain('style-base');
        });
    });

    describe('validatePatterns', () => {
        it('returns valid for existing patterns', () => {
            const result = validatePatterns(['style-base', 'app-shell', 'navigation']);
            expect(result.valid).toBe(true);
            expect(result.missing.length).toBe(0);
        });

        it('returns invalid for missing patterns', () => {
            const result = validatePatterns(['style-base', 'unknown-pattern']);
            expect(result.valid).toBe(false);
            expect(result.missing).toContain('unknown-pattern');
        });
    });
});
