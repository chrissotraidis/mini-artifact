import { describe, it, expect, vi } from 'vitest';

// Mock the OpenAI API call
vi.mock('../src/api/openai', () => ({
    callOpenAI: vi.fn(),
}));

import { processMessage, isSpecComplete, calculateCompleteness } from '../src/engine/arnold';
import { callOpenAI } from '../src/api/openai';
import { Specification } from '../src/types';

describe('Mini-Arnold', () => {
    describe('processMessage', () => {
        it('returns a question for ambiguous input', async () => {
            // Mock response asking for clarification
            (callOpenAI as ReturnType<typeof vi.fn>).mockResolvedValue(
                JSON.stringify({
                    type: 'question',
                    question: 'What properties should tasks have?',
                    confidence: 0.2,
                })
            );

            const result = await processMessage({
                message: 'I need an app',
                conversationHistory: [],
                currentSpec: null,
            });

            expect(result.type).toBe('question');
            expect(result.question).toBeDefined();
            expect(result.confidence).toBeLessThan(0.5);
        });

        it('builds spec from clear intent', async () => {
            // Mock response with spec
            (callOpenAI as ReturnType<typeof vi.fn>).mockResolvedValue(
                JSON.stringify({
                    type: 'spec_update',
                    spec: {
                        version: '1.0.0',
                        meta: { name: 'Todo App', description: 'A simple todo list', createdAt: '2024-01-01' },
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
                    },
                    confidence: 0.8,
                })
            );

            const result = await processMessage({
                message: 'I need a todo app with tasks that have titles and completion status',
                conversationHistory: [],
                currentSpec: null,
            });

            expect(result.type).toBe('spec_update');
            expect(result.spec).toBeDefined();
            expect(result.spec?.entities.length).toBeGreaterThan(0);
            expect(result.confidence).toBeGreaterThan(0.5);
        });

        it('increases confidence as spec completes', async () => {
            // First call - partial spec
            (callOpenAI as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
                JSON.stringify({
                    type: 'spec_update',
                    spec: {
                        version: '1.0.0',
                        meta: { name: 'App', description: '', createdAt: '' },
                        entities: [],
                        views: [],
                        actions: [],
                        patterns: [],
                    },
                    confidence: 0.3,
                })
            );

            const result1 = await processMessage({
                message: 'An app',
                conversationHistory: [],
                currentSpec: null,
            });

            // Second call - more complete spec
            (callOpenAI as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
                JSON.stringify({
                    type: 'spec_complete',
                    spec: {
                        version: '1.0.0',
                        meta: { name: 'Todo App', description: 'Task management', createdAt: '' },
                        entities: [{ id: 'task', name: 'Task', properties: [{ name: 'title', type: 'string', required: true }], relationships: [] }],
                        views: [{ id: 'list', name: 'List', type: 'list', entity: 'task' }],
                        actions: [],
                        patterns: [],
                    },
                    confidence: 0.95,
                })
            );

            const result2 = await processMessage({
                message: 'With tasks that have titles',
                conversationHistory: [],
                currentSpec: result1.spec || null,
            });

            expect(result2.confidence).toBeGreaterThan(result1.confidence);
        });
    });

    describe('isSpecComplete', () => {
        it('returns false for null spec', () => {
            expect(isSpecComplete(null)).toBe(false);
        });

        it('returns false for incomplete spec', () => {
            const incompleteSpec: Specification = {
                version: '1.0.0',
                meta: { name: '', description: '', createdAt: '' },
                entities: [],
                views: [],
                actions: [],
                patterns: [],
            };
            expect(isSpecComplete(incompleteSpec)).toBe(false);
        });

        it('returns true for complete spec', () => {
            const completeSpec: Specification = {
                version: '1.0.0',
                meta: { name: 'App', description: 'Test', createdAt: '' },
                entities: [
                    {
                        id: 'task',
                        name: 'Task',
                        properties: [{ name: 'title', type: 'string', required: true }],
                        relationships: [],
                    },
                ],
                views: [{ id: 'list', name: 'List', type: 'list', entity: 'task' }],
                actions: [],
                patterns: [],
            };
            expect(isSpecComplete(completeSpec)).toBe(true);
        });
    });

    describe('calculateCompleteness', () => {
        it('returns 0 for null spec', () => {
            expect(calculateCompleteness(null)).toBe(0);
        });

        it('returns higher score for more complete specs', () => {
            const minimal: Specification = {
                version: '1.0.0',
                meta: { name: 'App', description: '', createdAt: '' },
                entities: [],
                views: [],
                actions: [],
                patterns: [],
            };

            const complete: Specification = {
                version: '1.0.0',
                meta: { name: 'App', description: 'Full description', createdAt: '' },
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
                views: [{ id: 'list', name: 'List', type: 'list', entity: 'task' }],
                actions: [{ id: 'add', name: 'Add', trigger: 'button', logic: '' }],
                patterns: ['view-list'],
            };

            expect(calculateCompleteness(complete)).toBeGreaterThan(calculateCompleteness(minimal));
        });
    });
});
