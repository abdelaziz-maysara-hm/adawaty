/**
 * @file Tool search index integration verification.
 */

import assert from 'node:assert/strict';

import {
    ToolRegistry,
    ToolSearchIndex,
    normalizeSearchText,
} from '../../src/tools/index.js';

const registry = new ToolRegistry();

registry.registerMany([
    {
        id: 'basic-calculator',
        name: {
            ar: 'الآلة الحاسبة',
            en: 'Calculator',
        },
        description: {
            ar: 'إجراء العمليات الحسابية الأساسية بسرعة.',
            en: 'Perform basic calculations quickly.',
        },
        category: 'calculators',
        loader: async () => ({ default: {} }),
        languages: ['ar', 'en'],
        tags: ['رياضيات', 'يومي'],
        keywords: ['حساب', 'جمع', 'calculator'],
        featured: true,
        order: 10,
    },
    {
        id: 'text-counter',
        name: {
            ar: 'عداد الكلمات والحروف',
            en: 'Word and Character Counter',
        },
        description: {
            ar: 'حساب عدد الكلمات والحروف في النص.',
            en: 'Count words and characters in text.',
        },
        category: 'text',
        loader: async () => ({ default: {} }),
        languages: ['ar', 'en'],
        tags: ['نصوص'],
        keywords: ['كلمات', 'حروف', 'counter'],
        order: 20,
    },
    {
        id: 'legacy-converter',
        name: {
            ar: 'محول قديم',
            en: 'Legacy Converter',
        },
        description: {
            ar: 'أداة قديمة.',
            en: 'Deprecated tool.',
        },
        category: 'converters',
        loader: async () => ({ default: {} }),
        languages: ['ar', 'en'],
        status: 'deprecated',
        keywords: ['convert'],
    },
]);

const index = new ToolSearchIndex({
    toolRegistry: registry,
});

assert.equal(index.size(), 3);
assert.equal(index.getIndexedRevision(), registry.getRevision());

const arabicResults = index.search('حِسَاب', {
    locale: 'ar',
});
assert.equal(arabicResults[0].tool.id, 'basic-calculator');
assert.ok(arabicResults[0].score > 0);
assert.ok(arabicResults[0].matchedFields.includes('keywords'));

const englishResults = index.findTools('characters', {
    locale: 'en',
});
assert.equal(englishResults[0].id, 'text-counter');

const filtered = index.findTools('', {
    category: 'calculators',
    featured: true,
    languages: ['ar'],
});
assert.deepEqual(
    filtered.map((tool) => tool.id),
    ['basic-calculator'],
);

assert.equal(index.findTools('legacy').length, 0);
assert.equal(
    index.findTools('legacy', {
        includeDeprecated: true,
    })[0].id,
    'legacy-converter',
);

const suggestions = index.suggest('calc', {
    locale: 'en',
});
assert.equal(suggestions[0], 'Calculator');

assert.equal(normalizeSearchText('  الآلَةُ---الحاسبة  '), 'الالة الحاسبة');

const previousRevision = index.getIndexedRevision();
registry.register({
    id: 'unit-converter',
    name: {
        ar: 'محول الوحدات',
        en: 'Unit Converter',
    },
    description: {
        ar: 'تحويل وحدات القياس.',
        en: 'Convert measurement units.',
    },
    category: 'converters',
    loader: async () => ({ default: {} }),
    keywords: ['وحدات', 'units'],
    languages: ['ar', 'en'],
});

assert.equal(index.findTools('وحدات')[0].id, 'unit-converter');
assert.ok(index.getIndexedRevision() > previousRevision);

index.clear();
assert.equal(index.getIndexedRevision(), -1);
assert.equal(index.size(), 4);

console.log('Sprint 5 Batch 3 search engine verification passed.');

// END OF FILE
