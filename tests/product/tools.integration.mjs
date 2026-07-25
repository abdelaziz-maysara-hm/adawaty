import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    getToolDefinition,
    listToolDefinitions,
} from '../../src/product/tool-definitions.js';

const tools = listToolDefinitions();
assert.equal(tools.length, 31);
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
        'bmr-calculator',
        'tdee-calculator',
        'ideal-weight-calculator',
        'water-intake-calculator',
        'body-surface-area-calculator',
        'grade-calculator',
        'gpa-calculator',
        'average-calculator',
        'weighted-average-calculator',
        'attendance-calculator',
        'percentage-change-calculator',
        'ratio-calculator',
        'length-converter',
        'weight-converter',
        'temperature-converter',
        'area-converter',
        'volume-converter',
        'speed-converter',
        'data-storage-converter',
        'time-unit-converter',
        'angle-converter',
        'pressure-converter',
        'energy-converter',
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

const bmr = getToolDefinition('bmr-calculator');
assert.equal(
    bmr.calculate(
        { gender: 'male', age: 30, height: 175, weight: 75 },
        'en',
    ).value,
    '1,699 kcal',
);

const tdee = getToolDefinition('tdee-calculator');
assert.equal(
    tdee.calculate(
        {
            gender: 'male',
            age: 30,
            height: 175,
            weight: 75,
            activity: '1.2',
        },
        'en',
    ).value,
    '2,039 kcal',
);

const idealWeight = getToolDefinition('ideal-weight-calculator');
assert.equal(
    idealWeight.calculate(
        { gender: 'male', height: 175 },
        'en',
    ).value,
    '70.46 kg',
);

const water = getToolDefinition('water-intake-calculator');
assert.equal(water.calculate({ weight: 70 }, 'en').value, '2.45 litres');

const bodySurfaceArea = getToolDefinition('body-surface-area-calculator');
assert.equal(
    bodySurfaceArea.calculate({ height: 180, weight: 80 }, 'en').value,
    '2.00 m²',
);

const grade = getToolDefinition('grade-calculator');
assert.equal(grade.calculate({ earned: 85, total: 100 }, 'en').value, '85%');
assert.throws(
    () => grade.calculate({ earned: 101, total: 100 }, 'en'),
    /cannot exceed/,
);

const gpa = getToolDefinition('gpa-calculator');
assert.equal(
    gpa.calculate({
        grade1: 4,
        credits1: 3,
        grade2: 3,
        credits2: 3,
        grade3: 4,
        credits3: 3,
        grade4: 3,
        credits4: 3,
    }, 'en').value,
    '3.50',
);

const average = getToolDefinition('average-calculator');
assert.equal(
    average.calculate({
        number1: 10,
        number2: 20,
        number3: 30,
        number4: 40,
        number5: 50,
    }, 'en').value,
    '30',
);

const weightedAverage = getToolDefinition('weighted-average-calculator');
assert.equal(
    weightedAverage.calculate({
        score1: 80,
        weight1: 20,
        score2: 90,
        weight2: 30,
        score3: 100,
        weight3: 50,
    }, 'en').value,
    '93',
);

const attendance = getToolDefinition('attendance-calculator');
assert.equal(
    attendance.calculate({ attended: 36, totalClasses: 40 }, 'en').value,
    '90%',
);

const percentageChange = getToolDefinition('percentage-change-calculator');
assert.equal(
    percentageChange.calculate({ oldValue: 100, newValue: 125 }, 'en').value,
    '25%',
);

const ratio = getToolDefinition('ratio-calculator');
assert.equal(ratio.calculate({ first: 24, second: 36 }, 'en').value, '2:3');

const length = getToolDefinition('length-converter');
assert.equal(
    length.calculate({ value: 1, from: 'kilometre', to: 'metre' }, 'en').value,
    '1,000',
);

const weight = getToolDefinition('weight-converter');
assert.equal(
    weight.calculate({ value: 1, from: 'kilogram', to: 'gram' }, 'en').value,
    '1,000',
);

const temperature = getToolDefinition('temperature-converter');
assert.equal(
    temperature.calculate({
        value: 0,
        from: 'celsius',
        to: 'fahrenheit',
    }, 'en').value,
    '32',
);

const dataStorage = getToolDefinition('data-storage-converter');
assert.equal(
    dataStorage.calculate({
        value: 1,
        from: 'gigabyte',
        to: 'megabyte',
    }, 'en').value,
    '1,024',
);

const angle = getToolDefinition('angle-converter');
assert.equal(
    angle.calculate({ value: 180, from: 'degree', to: 'radian' }, 'en').value,
    '3.14159265',
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

console.log('Sprint 6 Batch 6 product tools verification passed.');

// END OF FILE
