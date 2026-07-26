import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    getToolDefinition,
    listToolDefinitions,
} from '../../src/product/tool-definitions.js';

const tools = listToolDefinitions();
assert.equal(tools.length, 61);
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
        'json-formatter',
        'base64-encoder-decoder',
        'url-encoder-decoder',
        'html-entity-encoder-decoder',
        'text-case-converter',
        'word-counter',
        'character-counter',
        'slug-generator',
        'jwt-decoder',
        'unix-timestamp-converter',
        'simple-interest-calculator',
        'mortgage-calculator',
        'savings-goal-calculator',
        'roi-calculator',
        'profit-margin-calculator',
        'break-even-calculator',
        'tip-calculator',
        'commission-calculator',
        'hourly-salary-calculator',
        'inflation-calculator',
        'calorie-deficit-calculator',
        'macro-calculator',
        'protein-intake-calculator',
        'body-fat-calculator',
        'lean-body-mass-calculator',
        'waist-to-height-ratio-calculator',
        'target-heart-rate-calculator',
        'running-pace-calculator',
        'sleep-cycle-calculator',
        'pregnancy-due-date-calculator',
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

const jsonFormatter = getToolDefinition('json-formatter');
assert.equal(
    jsonFormatter.calculate({ text: '{"ready":true}' }, 'en').value,
    '{\n  "ready": true\n}',
);
assert.throws(
    () => jsonFormatter.calculate({ text: '{invalid}' }, 'en'),
    /Invalid JSON/,
);

const base64 = getToolDefinition('base64-encoder-decoder');
assert.equal(
    base64.calculate({ operation: 'encode', text: 'Adawaty' }, 'en').value,
    'QWRhd2F0eQ==',
);
assert.equal(
    base64.calculate({
        operation: 'decode',
        text: 'QWRhd2F0eQ==',
    }, 'en').value,
    'Adawaty',
);

const urlTool = getToolDefinition('url-encoder-decoder');
assert.equal(
    urlTool.calculate({ operation: 'encode', text: 'hello world' }, 'en').value,
    'hello%20world',
);

const wordCounter = getToolDefinition('word-counter');
assert.equal(
    wordCounter.calculate({ text: 'one two three' }, 'en').value,
    '3',
);

const slugGenerator = getToolDefinition('slug-generator');
assert.equal(
    slugGenerator.calculate({ text: 'Free Online Tools' }, 'en').value,
    'free-online-tools',
);

const jwtDecoder = getToolDefinition('jwt-decoder');
const jwtResult = jwtDecoder.calculate({
    token: 'eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjMifQ.',
}, 'en');
assert.match(jwtResult.value, /"sub": "123"/);

const timestamp = getToolDefinition('unix-timestamp-converter');
const timestampInput = '2026-01-01T00:00';
assert.equal(
    timestamp.calculate({ dateTime: timestampInput }, 'en').value,
    `${Math.floor(new Date(timestampInput).getTime() / 1000)}`,
);

const simpleInterest = getToolDefinition('simple-interest-calculator');
assert.equal(
    simpleInterest.calculate({
        principal: 1000,
        annualRate: 10,
        years: 2,
    }, 'en').value,
    '1,200',
);

const mortgage = getToolDefinition('mortgage-calculator');
assert.equal(
    mortgage.calculate({
        amount: 120000,
        annualRate: 0,
        years: 10,
    }, 'en').value,
    '1,000',
);

const savingsGoal = getToolDefinition('savings-goal-calculator');
assert.equal(
    savingsGoal.calculate({
        goal: 12000,
        current: 0,
        annualRate: 0,
        years: 1,
    }, 'en').value,
    '1,000',
);

const roi = getToolDefinition('roi-calculator');
assert.equal(
    roi.calculate({ initial: 1000, final: 1250 }, 'en').value,
    '25',
);

const profitMargin = getToolDefinition('profit-margin-calculator');
assert.equal(
    profitMargin.calculate({ revenue: 1000, cost: 700 }, 'en').value,
    '30',
);

const breakEven = getToolDefinition('break-even-calculator');
assert.equal(
    breakEven.calculate({
        fixedCosts: 1000,
        price: 20,
        variableCost: 10,
    }, 'en').value,
    '100',
);
assert.throws(
    () => breakEven.calculate({
        fixedCosts: 1000,
        price: 10,
        variableCost: 10,
    }, 'en'),
    /must exceed/,
);

const tip = getToolDefinition('tip-calculator');
assert.equal(
    tip.calculate({ bill: 100, rate: 20, people: 2 }, 'en').value,
    '60',
);

const salary = getToolDefinition('hourly-salary-calculator');
assert.equal(
    salary.calculate({ hourly: 10, hours: 40, weeks: 52 }, 'en').value,
    '20,800',
);

const inflation = getToolDefinition('inflation-calculator');
assert.equal(
    inflation.calculate({ amount: 1000, rate: 10, years: 1 }, 'en').value,
    '1,100',
);

const calorieDeficit = getToolDefinition('calorie-deficit-calculator');
assert.equal(
    calorieDeficit.calculate({ maintenance: 2500, deficit: 500 }, 'en').value,
    '2,000 kcal',
);
assert.throws(
    () => calorieDeficit.calculate({
        maintenance: 2000,
        deficit: 2000,
    }, 'en'),
    /must be below/,
);

const macros = getToolDefinition('macro-calculator');
assert.equal(
    macros.calculate({
        calories: 2000,
        protein: 30,
        carbs: 40,
        fat: 30,
    }, 'en').value,
    '150 g',
);
assert.throws(
    () => macros.calculate({
        calories: 2000,
        protein: 20,
        carbs: 20,
        fat: 20,
    }, 'en'),
    /must total 100/,
);

const protein = getToolDefinition('protein-intake-calculator');
assert.equal(
    protein.calculate({ weight: 75, factor: '1.6' }, 'en').value,
    '120 g',
);

const waistHeight = getToolDefinition('waist-to-height-ratio-calculator');
assert.equal(
    waistHeight.calculate({ waist: 80, height: 160 }, 'en').value,
    '0.5',
);

const heartRate = getToolDefinition('target-heart-rate-calculator');
assert.equal(
    heartRate.calculate({ age: 30, resting: 70 }, 'en').value,
    '130–172 bpm',
);

const runningPace = getToolDefinition('running-pace-calculator');
assert.equal(
    runningPace.calculate({ distance: 5, minutes: 30 }, 'en').value,
    '6:00 min/km',
);

const sleepCycle = getToolDefinition('sleep-cycle-calculator');
assert.equal(
    sleepCycle.calculate({ wakeTime: '07:00' }, 'en').value,
    '21:46 · 23:16 · 00:46',
);

const pregnancy = getToolDefinition('pregnancy-due-date-calculator');
assert.match(
    pregnancy.calculate({ lastPeriod: '2026-01-01' }, 'en').value,
    /October 8, 2026/,
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

console.log('Sprint 6 Batch 9 product tools verification passed.');

// END OF FILE
