/**
 * @file Category registry and catalogue integration verification.
 */

import assert from 'node:assert/strict';
import { CategoryRegistry, ToolCatalogue, ToolRegistry } from '../../src/tools/index.js';

const categories = new CategoryRegistry();
categories.registerMany([
    { id: 'calculators', name: { ar: 'الحاسبات', en: 'Calculators' }, description: { ar: 'أدوات الحساب اليومية.', en: 'Daily calculation tools.' }, featured: true, order: 10 },
    { id: 'text', name: { ar: 'النصوص', en: 'Text' }, description: { ar: 'أدوات النصوص والكتابة.', en: 'Text and writing tools.' }, order: 20 },
    { id: 'empty', name: 'Empty', description: 'No tools yet.', order: 30 },
]);

const tools = new ToolRegistry();
tools.registerMany([
    { id: 'basic-calculator', name: { ar: 'الآلة الحاسبة', en: 'Calculator' }, description: { ar: 'حسابات أساسية.', en: 'Basic calculations.' }, category: 'calculators', loader: async () => ({ default: {} }), order: 10 },
    { id: 'text-counter', name: { ar: 'عداد النص', en: 'Text Counter' }, description: { ar: 'عد الكلمات والحروف.', en: 'Count words and characters.' }, category: 'text', loader: async () => ({ default: {} }), order: 20 },
    { id: 'orphan-tool', name: 'Orphan Tool', description: 'Category is not registered.', category: 'missing-category', loader: async () => ({ default: {} }) },
]);

const catalogue = new ToolCatalogue({ toolRegistry: tools, categoryRegistry: categories });
const visibleCatalogue = catalogue.getCatalogue();
assert.equal(visibleCatalogue.length, 2);
assert.equal(visibleCatalogue[0].id, 'calculators');
assert.equal(visibleCatalogue[0].toolCount, 1);
assert.equal(visibleCatalogue[0].tools[0].id, 'basic-calculator');
assert.equal(catalogue.getCatalogue(), visibleCatalogue);
assert.equal(catalogue.getCatalogue({ includeEmpty: true }).length, 3);
assert.deepEqual(catalogue.getNavigation('en').map((item) => item.label), ['Calculators', 'Text']);
assert.equal(categories.getFeatured()[0].id, 'calculators');
assert.equal(catalogue.getCategory('text').toolCount, 1);
assert.equal(catalogue.getOrphanTools()[0].id, 'orphan-tool');

const previous = catalogue.getCatalogue();
tools.unregister('text-counter');
const updated = catalogue.getCatalogue();
assert.notEqual(updated, previous);
assert.equal(updated.length, 1);

console.log('Sprint 5 Batch 2 category catalogue verification passed.');

// END OF FILE
