import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { listToolDefinitions } from '../../src/product/tool-definitions.js';
import { SUBCATEGORIES, getSubcategories, getSubcategoryForTool } from '../../src/product/subcategories.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

const tools = listToolDefinitions();
const idsByCategory = new Map();
for (const tool of tools) {
    if (!idsByCategory.has(tool.category)) idsByCategory.set(tool.category, new Set());
    idsByCategory.get(tool.category).add(tool.id);
}

// Every tool id listed in a sub-category must actually exist and belong
// to that exact top-level category -- a stale/typo'd id here would
// silently disappear from the sub-filtered view rather than error.
for (const [category, groups] of Object.entries(SUBCATEGORIES)) {
    const realIds = idsByCategory.get(category) ?? new Set();
    const seenInCategory = new Set();

    for (const [subcategoryId, label, toolIds] of groups) {
        assert.ok(label.ar && label.en, `${category}/${subcategoryId} must have both Arabic and English labels`);
        assert.ok(toolIds.length > 0, `${category}/${subcategoryId} must not be an empty group`);

        for (const id of toolIds) {
            assert.ok(realIds.has(id), `${category}/${subcategoryId} references "${id}", which does not exist or is not in the "${category}" category`);
            assert.ok(!seenInCategory.has(id), `"${id}" is assigned to more than one sub-category within "${category}"`);
            seenInCategory.add(id);
        }
    }

    // Coverage sanity floor: catches an entire group being accidentally
    // deleted or a large category losing most of its grouping over time,
    // without requiring 100% (a handful of genuinely miscellaneous tools
    // per category, like website-builder or qr-code-generator, is fine).
    const coverageRatio = seenInCategory.size / realIds.size;
    assert.ok(coverageRatio >= 0.85, `${category} sub-category coverage dropped to ${Math.round(coverageRatio * 100)}% (expected at least 85%)`);
}

// getSubcategories() must return an empty array (not throw, not undefined) for categories with no defined taxonomy.
for (const category of ['health', 'islamic', 'engineering', 'student-study', 'home-lifestyle', 'security-network']) {
    assert.deepEqual(getSubcategories(category), [], `${category} should have no sub-categories defined`);
}

// getSubcategoryForTool() spot checks: a real tool resolves to its correct group, and a tool from
// a different group within the same category correctly does NOT match.
assert.equal(getSubcategoryForTool('pdf', 'pdf-merge'), 'organize');
assert.equal(getSubcategoryForTool('pdf', 'pdf-compressor'), 'security-cleanup');
assert.notEqual(getSubcategoryForTool('pdf', 'pdf-compressor'), 'organize');
assert.equal(getSubcategoryForTool('image', 'image-compressor'), 'compression');
assert.equal(getSubcategoryForTool('developer', 'json-formatter'), 'json');
// A tool with no assigned sub-category (deliberately left as "Other") returns null, not a crash.
assert.equal(getSubcategoryForTool('developer', 'website-builder'), null);
// An unknown category (no taxonomy at all) also returns null safely.
assert.equal(getSubcategoryForTool('health', 'bmi-calculator'), null);

// catalogue-page.js's priorityGroups (the "most likely searched first"
// tiebreaker used when browsing/sorting a category) is a plain array of
// string literals, not an importable data structure -- parsed from
// source text here rather than imported, since the module itself
// expects a browser DOM (querySelector calls run at import time). A
// stale/typo'd id here is a real, previously-latent bug found while
// extending this list: "grammar-checker" and "text-summarizer" were
// referenced but never existed as real tools -- harmless in practice
// (a missing id just never matches, so it silently fell through to the
// alphabetical fallback) but still a genuine data error worth catching
// automatically going forward.
{
    const source = await readFile(path.join(projectRoot, 'src/product/catalogue-page.js'), 'utf8');
    const match = source.match(/const priorityGroups = Object\.freeze\(\[([\s\S]*?)\]\);/);
    assert.ok(match, 'catalogue-page.js must define priorityGroups');
    const referencedIds = [...match[1].matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]);
    assert.ok(referencedIds.length > 0, 'priorityGroups must reference at least one tool id');
    const realIds = new Set(tools.map((tool) => tool.id));
    const missing = referencedIds.filter((id) => !realIds.has(id));
    assert.deepEqual(missing, [], `priorityGroups references non-existent tool id(s): ${missing.join(', ')}`);
}

console.log(`Sub-category taxonomy verified across ${Object.keys(SUBCATEGORIES).length} categories, ${tools.length} total tools checked for id/category consistency.`);

// END OF FILE
