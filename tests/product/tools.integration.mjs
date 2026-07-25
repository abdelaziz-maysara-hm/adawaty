import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    getToolDefinition,
    listToolDefinitions,
} from '../../src/product/tool-definitions.js';

const tools = listToolDefinitions();
assert.equal(tools.length, 8);
assert.deepEqual(
    tools.map((tool) => tool.id),
    [
        'bmi-calculator',
        'percentage-calculator',
        'age-calculator',
        'discount-calculator',
        'vat-calculator',
        'loan-calculator',
        'compound-interest-calculator',
        'date-difference-calculator',
    ],
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

const discount = getToolDefinition('discount-calculator');
assert.equal(
    discount.calculate({ price: 1000, discount: 20 }, 'en').value,
    '800',
);

const vat = getToolDefinition('vat-calculator');
assert.equal(vat.calculate({ amount: 1000, rate: 14 }, 'en').value, '1,140');

const loan = getToolDefinition('loan-calculator');
assert.equal(
    loan.calculate(
        { amount: 12000, annualRate: 0, months: 12 },
        'en',
    ).value,
    '1,000',
);

const compoundInterest = getToolDefinition('compound-interest-calculator');
assert.equal(
    compoundInterest.calculate(
        {
            principal: 1000,
            annualRate: 10,
            years: 1,
            compounds: 1,
        },
        'en',
    ).value,
    '1,100',
);

const dateDifference = getToolDefinition('date-difference-calculator');
assert.equal(
    dateDifference.calculate(
        { startDate: '2026-01-01', endDate: '2026-01-31' },
        'en',
    ).value,
    '30 days',
);

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

console.log('Sprint 6 Batch 2 product tools verification passed.');

// END OF FILE
