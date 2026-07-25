import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    getToolDefinition,
    listToolDefinitions,
} from '../../src/product/tool-definitions.js';

const tools = listToolDefinitions();
assert.equal(tools.length, 3);
assert.deepEqual(
    tools.map((tool) => tool.id),
    ['bmi-calculator', 'percentage-calculator', 'age-calculator'],
);

const bmi = getToolDefinition('bmi-calculator');
const bmiResult = bmi.calculate({ height: 175, weight: 70 }, 'en');
assert.equal(bmiResult.value, '22.9');
assert.equal(bmiResult.label, 'Healthy weight');

const percentage = getToolDefinition('percentage-calculator');
const percentageResult = percentage.calculate(
    { percentage: 20, number: 250 },
    'ar',
);
assert.equal(percentageResult.value, '50');
assert.match(percentageResult.label, /20/);

const toolPages = await Promise.all(
    tools.map((tool) =>
        readFile(
            new URL(`../../tools/${tool.id}/index.html`, import.meta.url),
            'utf8',
        ),
    ),
);

for (const [index, page] of toolPages.entries()) {
    assert.match(page, new RegExp(`data-tool-page="${tools[index].id}"`));
    assert.match(page, /src\/product\/tool-page\.js/);
    assert.match(page, /rel="canonical"/);
    assert.doesNotMatch(page, /TODO|PLACEHOLDER/i);
}

assert.equal(getToolDefinition('missing-tool'), null);

console.log('Sprint 6 Batch 1 product tools verification passed.');

// END OF FILE
