import { describe, it, expect } from 'vitest';
import { validateSpec, isValidForBuild, getValidationSummary } from '../src/engine/nedry/validator';
import { matchPatterns, sortPatternsByDependency } from '../src/engine/nedry/router';
import { Specification } from '../src/types';

describe('Mini-Nedry', () => {
    describe('validateSpec', () => {
        it('rejects null spec', () => {
            const result = validateSpec(null);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('rejects spec without name', () => {
            const spec: Specification = {
                version: '1.0.0',
                meta: { name: '', description: '', createdAt: '' },
                entities: [{ id: 'e1', name: 'Entity', properties: [{ name: 'p', type: 'string', required: true }], relationships: [] }],
                views: [{ id: 'v1', name: 'View', type: 'list', entity: 'e1' }],
                actions: [],
                patterns: [],
            };
            const result = validateSpec(spec);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'MISSING_NAME')).toBe(true);
        });

        it('rejects spec without entities', () => {
            const spec: Specification = {
                version: '1.0.0',
                meta: { name: 'App', description: '', createdAt: '' },
                entities: [],
                views: [{ id: 'v1', name: 'View', type: 'list', entity: '' }],
                actions: [],
                patterns: [],
            };
            const result = validateSpec(spec);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'NO_ENTITIES')).toBe(true);
        });

        it('rejects spec without views', () => {
            const spec: Specification = {
                version: '1.0.0',
                meta: { name: 'App', description: '', createdAt: '' },
                entities: [{ id: 'e1', name: 'Entity', properties: [{ name: 'p', type: 'string', required: true }], relationships: [] }],
                views: [],
                actions: [],
                patterns: [],
            };
            const result = validateSpec(spec);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'NO_VIEWS')).toBe(true);
        });

        it('rejects entity without properties', () => {
            const spec: Specification = {
                version: '1.0.0',
                meta: { name: 'App', description: '', createdAt: '' },
                entities: [{ id: 'e1', name: 'Entity', properties: [], relationships: [] }],
                views: [{ id: 'v1', name: 'View', type: 'list', entity: 'e1' }],
                actions: [],
                patterns: [],
            };
            const result = validateSpec(spec);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.code === 'NO_PROPERTIES')).toBe(true);
        });

        it('accepts valid spec', () => {
            const spec: Specification = {
                version: '1.0.0',
                meta: { name: 'Todo App', description: 'A todo app', createdAt: '' },
                entities: [
                    {
                        id: 'task',
                        name: 'Task',
                        properties: [
                            { name: 'title', type: 'string', required: true },
                            { name: 'done', type: 'boolean', required: false },
                        ],
                        relationships: [],
                    },
                ],
                views: [{ id: 'task-list', name: 'Task List', type: 'list', entity: 'task' }],
                actions: [{ id: 'add-task', name: 'Add Task', trigger: 'button', logic: 'Add new task' }],
                patterns: ['view-list'],
            };
            const result = validateSpec(spec);
            expect(result.valid).toBe(true);
            expect(result.errors.length).toBe(0);
        });
    });

    describe('matchPatterns', () => {
        it('includes utility patterns', () => {
            const spec: Specification = {
                version: '1.0.0',
                meta: { name: 'App', description: '', createdAt: '' },
                entities: [],
                views: [],
                actions: [],
                patterns: [],
            };
            const patterns = matchPatterns(spec);
            const ids = patterns.map(p => p.patternId);
            expect(ids).toContain('style-base');
            expect(ids).toContain('state-manager');
            expect(ids).toContain('app-shell');
        });

        it('maps views to view patterns', () => {
            const spec: Specification = {
                version: '1.0.0',
                meta: { name: 'App', description: '', createdAt: '' },
                entities: [{ id: 'task', name: 'Task', properties: [{ name: 'title', type: 'string', required: true }], relationships: [] }],
                views: [
                    { id: 'task-list', name: 'Task List', type: 'list', entity: 'task' },
                    { id: 'task-form', name: 'Add Task', type: 'form', entity: 'task' },
                ],
                actions: [],
                patterns: [],
            };
            const patterns = matchPatterns(spec);
            const ids = patterns.map(p => p.patternId);
            expect(ids).toContain('view-list');
            expect(ids).toContain('view-form');
        });

        it('maps actions to action patterns', () => {
            const spec: Specification = {
                version: '1.0.0',
                meta: { name: 'App', description: '', createdAt: '' },
                entities: [],
                views: [],
                actions: [
                    { id: 'submit', name: 'Submit', trigger: 'button', logic: '' },
                    { id: 'remove', name: 'Delete Item', trigger: 'button', logic: '' },
                ],
                patterns: [],
            };
            const patterns = matchPatterns(spec);
            const ids = patterns.map(p => p.patternId);
            expect(ids).toContain('action-button');
            expect(ids).toContain('action-delete');
        });
    });

    describe('sortPatternsByDependency', () => {
        it('puts utility patterns first', () => {
            const patterns = [
                { patternId: 'view-list', targetId: 'v1', config: {} },
                { patternId: 'style-base', targetId: 'global', config: {} },
                { patternId: 'action-button', targetId: 'a1', config: {} },
                { patternId: 'state-manager', targetId: 'global', config: {} },
            ];
            const sorted = sortPatternsByDependency(patterns);
            expect(sorted[0].patternId).toBe('style-base');
            expect(sorted[1].patternId).toBe('state-manager');
        });
    });

    describe('isValidForBuild', () => {
        it('returns false for invalid spec', () => {
            expect(isValidForBuild(null)).toBe(false);
        });

        it('returns true for valid spec', () => {
            const spec: Specification = {
                version: '1.0.0',
                meta: { name: 'App', description: '', createdAt: '' },
                entities: [{ id: 'e', name: 'E', properties: [{ name: 'p', type: 'string', required: true }], relationships: [] }],
                views: [{ id: 'v', name: 'V', type: 'list', entity: 'e' }],
                actions: [],
                patterns: [],
            };
            expect(isValidForBuild(spec)).toBe(true);
        });
    });
});
