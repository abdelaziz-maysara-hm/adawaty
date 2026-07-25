/**
 * @file Tool manifest and registry integration verification.
 */

import assert from 'node:assert/strict';

import {
    ToolRegistry,
    createToolManifest,
    resolveLocalizedText,
} from '../../src/tools/index.js';

const calculator = createToolManifest({
    id: 'basic-calculator',
    name: {
        ar: 'الآلة الحاسبة',
        en: 'Calculator',
    },
    description: {
        ar: 'إجراء العمليات الحسابية الأساسية.',
        en: 'Perform basic calculations.',
    },
    category: 'calculators',
    loader: async () => ({ default: {} }),
    languages: ['ar', 'en'],
    tags: ['math', 'daily'],
    keywords: ['حساب', 'calculator'],
    featured: true,
    order: 10,
});

assert.equal(resolveLocalizedText(calculator.name, 'en'), 'Calculator');
assert.equal(Object.isFrozen(calculator), true);
assert.equal(Object.isFrozen(calculator.tags), true);

const registry = new ToolRegistry();
const registeredCalculator = registry.register(calculator);

registry.discover({
    './text-counter/manifest.js': {
        default: {
            id: 'text-counter',
            name: {
                ar: 'عداد النص',
                en: 'Text Counter',
            },
            description: {
                ar: 'حساب الكلمات والحروف.',
                en: 'Count words and characters.',
            },
            category: 'text',
            loader: async () => ({ default: {} }),
            languages: ['ar', 'en'],
            tags: ['text'],
            order: 20,
        },
    },
});

assert.equal(registry.count(), 2);
assert.equal(registry.get('basic-calculator').id, registeredCalculator.id);
assert.equal(registry.getToolsByCategory('calculators').length, 1);
assert.equal(registry.getToolsByTag('text')[0].id, 'text-counter');
assert.equal(registry.search('حساب', { locale: 'ar' })[0].id, 'basic-calculator');
assert.equal(registry.search('characters', { locale: 'en' })[0].id, 'text-counter');
assert.deepEqual(registry.getIds(), ['basic-calculator', 'text-counter']);

const beforeRevision = registry.getRevision();
registry.unregister('text-counter');
assert.equal(registry.count(), 1);
assert.ok(registry.getRevision() > beforeRevision);

assert.throws(
    () => registry.register(calculator),
    /already registered/,
);

assert.throws(
    () =>
        createToolManifest({
            id: 'Invalid ID',
            name: 'Invalid',
            description: 'Invalid',
            category: 'test',
            loader: async () => ({}),
        }),
    /lowercase kebab-case/,
);

console.log('Sprint 5 Batch 1 tool registry verification passed.');

// END OF FILE
