/**
 * @file Unified tool directory integration verification.
 */

import assert from 'node:assert/strict';

import {
    ToolDirectory,
    createToolDirectory,
    extractToolDefinitions,
} from '../../src/tools/index.js';

const directory = createToolDirectory({
    fallbackLocale: 'ar',
});

assert.ok(directory instanceof ToolDirectory);

const initialized = directory.initialize({
    categories: [
        {
            id: 'calculators',
            name: {
                ar: 'الحاسبات',
                en: 'Calculators',
            },
            description: {
                ar: 'أدوات الحساب.',
                en: 'Calculation tools.',
            },
            order: 10,
        },
        {
            id: 'text',
            name: {
                ar: 'النصوص',
                en: 'Text',
            },
            description: {
                ar: 'أدوات النصوص.',
                en: 'Text tools.',
            },
            order: 20,
        },
    ],
    modules: {
        './calculator/manifest.js': {
            default: {
                id: 'basic-calculator',
                name: {
                    ar: 'الآلة الحاسبة',
                    en: 'Calculator',
                },
                description: {
                    ar: 'حسابات يومية.',
                    en: 'Daily calculations.',
                },
                category: 'calculators',
                loader: async () => ({ default: {} }),
                languages: ['ar', 'en'],
                keywords: ['حساب', 'calculator'],
                order: 10,
            },
        },
        './counter/manifest.js': {
            manifest: {
                id: 'text-counter',
                name: {
                    ar: 'عداد النص',
                    en: 'Text Counter',
                },
                description: {
                    ar: 'عد الكلمات والحروف.',
                    en: 'Count words and characters.',
                },
                category: 'text',
                loader: async () => ({ default: {} }),
                languages: ['ar', 'en'],
                keywords: ['كلمات', 'characters'],
                order: 20,
            },
        },
    },
});

assert.equal(initialized.categories.length, 2);
assert.equal(initialized.tools.length, 2);
assert.equal(initialized.diagnostics.valid, true);
assert.equal(directory.getCatalogue().length, 2);
assert.equal(directory.getNavigation('en')[0].label, 'Calculators');
assert.equal(directory.findTools('حساب')[0].id, 'basic-calculator');
assert.equal(directory.suggest('char', { locale: 'en' })[0], 'characters');
assert.equal(directory.getTool('text-counter').id, 'text-counter');
assert.equal(directory.getCategory('text').toolCount, 1);

const snapshot = directory.getSnapshot();
assert.equal(snapshot.toolCount, 2);
assert.equal(snapshot.categoryCount, 2);
assert.equal(Object.isFrozen(snapshot), true);

const beforeFailure = directory.getSnapshot();
assert.throws(
    () =>
        directory.initialize({
            categories: [
                {
                    id: 'new-category',
                    name: 'New',
                    description: 'New category.',
                },
            ],
            tools: [
                {
                    id: 'basic-calculator',
                    name: 'Duplicate',
                    description: 'Duplicate tool.',
                    category: 'new-category',
                    loader: async () => ({ default: {} }),
                },
            ],
        }),
    /already registered/,
);

const afterFailure = directory.getSnapshot();
assert.equal(afterFailure.toolCount, beforeFailure.toolCount);
assert.equal(afterFailure.categoryCount, beforeFailure.categoryCount);
assert.equal(directory.categoryRegistry.has('new-category'), false);

const extracted = extractToolDefinitions({
    './one.js': {
        default: {
            id: 'one',
        },
    },
});
assert.equal(extracted[0].id, 'one');

const orphan = directory.registerTool({
    id: 'orphan-tool',
    name: 'Orphan',
    description: 'Missing category.',
    category: 'missing',
    loader: async () => ({ default: {} }),
});
assert.equal(orphan.id, 'orphan-tool');
assert.equal(directory.getDiagnostics().valid, false);
assert.equal(directory.getDiagnostics().orphanTools.length, 1);

directory.clear();
assert.equal(directory.getSnapshot().toolCount, 0);
assert.equal(directory.getSnapshot().categoryCount, 0);

console.log('Sprint 5 Batch 4 tool directory verification passed.');

// END OF FILE
