import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    getToolDefinition,
    listToolDefinitions,
} from '../../src/product/tool-definitions.js';

const tools = listToolDefinitions();
assert.equal(tools.length, 141);
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
        'gcd-calculator',
        'lcm-calculator',
        'fraction-simplifier',
        'quadratic-equation-calculator',
        'circle-calculator',
        'triangle-area-calculator',
        'rectangle-calculator',
        'pythagorean-theorem-calculator',
        'standard-deviation-calculator',
        'probability-calculator',
        'days-until-date-calculator',
        'business-days-calculator',
        'date-add-subtract-calculator',
        'week-number-calculator',
        'leap-year-calculator',
        'time-duration-calculator',
        'birthday-countdown-calculator',
        'work-hours-calculator',
        'timezone-converter',
        'day-of-week-calculator',
        'ohms-law-calculator',
        'electrical-power-calculator',
        'resistor-combination-calculator',
        'voltage-divider-calculator',
        'force-calculator',
        'kinetic-energy-calculator',
        'potential-energy-calculator',
        'density-calculator',
        'physics-pressure-calculator',
        'wavelength-frequency-calculator',
        'password-generator',
        'password-strength-checker',
        'password-entropy-calculator',
        'ipv4-subnet-calculator',
        'cidr-range-calculator',
        'ip-address-to-binary',
        'binary-to-ip-address',
        'mac-address-formatter',
        'network-port-lookup',
        'data-transfer-time-calculator',
        'meta-tag-generator',
        'open-graph-generator',
        'twitter-card-generator',
        'utm-link-builder',
        'robots-txt-generator',
        'canonical-tag-generator',
        'hreflang-tag-generator',
        'sitemap-entry-generator',
        'keyword-density-checker',
        'serp-snippet-preview',
        'hex-to-rgb-converter',
        'rgb-to-hex-converter',
        'rgb-to-hsl-converter',
        'wcag-contrast-checker',
        'color-blender',
        'color-tint-shade-generator',
        'css-linear-gradient-generator',
        'css-box-shadow-generator',
        'css-border-radius-generator',
        'css-clamp-calculator',
        'fuel-cost-calculator',
        'fuel-economy-calculator',
        'road-trip-cost-calculator',
        'electricity-cost-calculator',
        'paint-calculator',
        'tile-calculator',
        'concrete-volume-calculator',
        'wallpaper-roll-calculator',
        'recipe-scaler',
        'rent-affordability-calculator',
        'acceleration-converter',
        'force-unit-converter',
        'power-unit-converter',
        'torque-converter',
        'frequency-converter',
        'density-unit-converter',
        'flow-rate-converter',
        'cooking-volume-converter',
        'data-transfer-rate-converter',
        'illuminance-converter',
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

assert.equal(
    getToolDefinition('gcd-calculator').calculate({
        first: 48,
        second: 18,
    }, 'en').value,
    '6',
);
assert.equal(
    getToolDefinition('lcm-calculator').calculate({
        first: 12,
        second: 18,
    }, 'en').value,
    '36',
);

const fraction = getToolDefinition('fraction-simplifier');
assert.equal(
    fraction.calculate({ numerator: 42, denominator: 56 }, 'en').value,
    '3/4',
);
assert.throws(
    () => fraction.calculate({ numerator: 1, denominator: 0 }, 'en'),
    /cannot be zero/,
);

const quadratic = getToolDefinition('quadratic-equation-calculator');
assert.equal(
    quadratic.calculate({ a: 1, b: -3, c: 2 }, 'en').value,
    'x₁ = 2, x₂ = 1',
);
assert.match(
    quadratic.calculate({ a: 1, b: 0, c: 1 }, 'en').value,
    /± 1i/,
);

assert.equal(
    getToolDefinition('triangle-area-calculator').calculate({
        base: 10,
        height: 6,
    }, 'en').value,
    '30',
);
assert.equal(
    getToolDefinition('pythagorean-theorem-calculator').calculate({
        a: 3,
        b: 4,
    }, 'en').value,
    '5',
);

const deviation = getToolDefinition('standard-deviation-calculator');
assert.equal(
    deviation.calculate({
        type: 'population',
        value1: 1,
        value2: 2,
        value3: 3,
        value4: 4,
        value5: 5,
    }, 'en').value,
    '1.414214',
);

const probability = getToolDefinition('probability-calculator');
assert.equal(
    probability.calculate({ favorable: 1, total: 4 }, 'en').value,
    '25%',
);
assert.throws(
    () => probability.calculate({ favorable: 5, total: 4 }, 'en'),
    /cannot exceed/,
);

assert.equal(
    getToolDefinition('business-days-calculator').calculate({
        startDate: '2026-01-05',
        endDate: '2026-01-09',
    }, 'en').value,
    '5 business days',
);

assert.match(
    getToolDefinition('date-add-subtract-calculator').calculate({
        startDate: '2026-01-01',
        operation: 'add',
        amount: 30,
        unit: 'days',
    }, 'en').value,
    /January 31, 2026/,
);

assert.equal(
    getToolDefinition('week-number-calculator').calculate({
        date: '2026-01-01',
    }, 'en').value,
    '1',
);

assert.equal(
    getToolDefinition('leap-year-calculator').calculate({
        year: 2028,
    }, 'en').value,
    'Leap year',
);

assert.equal(
    getToolDefinition('time-duration-calculator').calculate({
        startTime: '22:30',
        endTime: '01:00',
    }, 'en').value,
    '2:30',
);

const workHours = getToolDefinition('work-hours-calculator');
assert.equal(
    workHours.calculate({
        startTime: '09:00',
        endTime: '17:00',
        breakMinutes: 60,
    }, 'en').value,
    '7',
);
assert.throws(
    () => workHours.calculate({
        startTime: '09:00',
        endTime: '10:00',
        breakMinutes: 120,
    }, 'en'),
    /exceeds/,
);

const timezone = getToolDefinition('timezone-converter');
const timezoneResult = timezone.calculate({
    time: '23:30',
    fromOffset: '0',
    toOffset: '2',
}, 'en');
assert.equal(timezoneResult.value, '01:30');
assert.equal(timezoneResult.details, 'next day');

assert.equal(
    getToolDefinition('day-of-week-calculator').calculate({
        date: '2026-01-01',
    }, 'en').value,
    'Thursday',
);

assert.equal(
    getToolDefinition('ohms-law-calculator').calculate({
        voltage: 12,
        resistance: 6,
    }, 'en').value,
    '2 A',
);
assert.equal(
    getToolDefinition('electrical-power-calculator').calculate({
        voltage: 220,
        current: 2,
    }, 'en').value,
    '440 W',
);

const resistors = getToolDefinition('resistor-combination-calculator');
assert.equal(
    resistors.calculate({
        mode: 'series',
        r1: 100,
        r2: 200,
        r3: 300,
    }, 'en').value,
    '600 Ω',
);
assert.equal(
    resistors.calculate({
        mode: 'parallel',
        r1: 100,
        r2: 100,
        r3: 100,
    }, 'en').value,
    '33.33333333 Ω',
);

assert.equal(
    getToolDefinition('voltage-divider-calculator').calculate({
        inputVoltage: 12,
        r1: 1000,
        r2: 1000,
    }, 'en').value,
    '6 V',
);
assert.equal(
    getToolDefinition('force-calculator').calculate({
        mass: 10,
        acceleration: 9.81,
    }, 'en').value,
    '98.1 N',
);
assert.equal(
    getToolDefinition('kinetic-energy-calculator').calculate({
        mass: 10,
        velocity: 5,
    }, 'en').value,
    '125 J',
);
assert.equal(
    getToolDefinition('density-calculator').calculate({
        mass: 100,
        volume: 2,
    }, 'en').value,
    '50 kg/m³',
);
assert.equal(
    getToolDefinition('wavelength-frequency-calculator').calculate({
        speed: 300000000,
        frequency: 100000000,
    }, 'en').value,
    '3 m',
);

const generatedPassword = getToolDefinition('password-generator').calculate({
    length: 24,
    characters: 'lettersNumbers',
}, 'en').value;
assert.equal(generatedPassword.length, 24);
assert.match(generatedPassword, /^[A-Za-z0-9]+$/);

assert.equal(
    getToolDefinition('password-strength-checker').calculate({
        password: 'Correct-Horse-Battery-Staple-2026!',
    }, 'en').value,
    'Very strong',
);
assert.match(
    getToolDefinition('password-entropy-calculator').calculate({
        password: 'Abc123!',
    }, 'en').value,
    /bits$/,
);

const subnet = getToolDefinition('ipv4-subnet-calculator');
assert.equal(
    subnet.calculate({ address: '192.168.1.25', prefix: 24 }, 'en').value,
    '192.168.1.0/24',
);
assert.throws(
    () => subnet.calculate({ address: '999.1.1.1', prefix: 24 }, 'en'),
    /Invalid IPv4/,
);
assert.equal(
    getToolDefinition('cidr-range-calculator').calculate({
        address: '10.20.30.40',
        prefix: 24,
    }, 'en').value,
    '10.20.30.1 – 10.20.30.254',
);
assert.equal(
    getToolDefinition('ip-address-to-binary').calculate({
        address: '192.168.1.1',
    }, 'en').value,
    '11000000.10101000.00000001.00000001',
);
assert.equal(
    getToolDefinition('binary-to-ip-address').calculate({
        binary: '11000000.10101000.00000001.00000001',
    }, 'en').value,
    '192.168.1.1',
);
assert.equal(
    getToolDefinition('mac-address-formatter').calculate({
        address: 'A1B2C3D4E5F6',
        format: 'colon',
    }, 'en').value,
    'A1:B2:C3:D4:E5:F6',
);
assert.equal(
    getToolDefinition('network-port-lookup').calculate({
        port: 443,
    }, 'en').value,
    'HTTPS',
);
assert.equal(
    getToolDefinition('data-transfer-time-calculator').calculate({
        size: 1,
        speed: 100,
    }, 'en').value,
    '1.3333 min',
);

const metaTags = getToolDefinition('meta-tag-generator').calculate({
    title: 'Tools & Calculators',
    description: 'Fast <private> tools',
    keywords: 'tools, calculators',
    robots: 'index,follow',
}, 'en');
assert.match(metaTags.value, /Tools &amp; Calculators/);
assert.match(metaTags.value, /Fast &lt;private&gt; tools/);

assert.match(
    getToolDefinition('open-graph-generator').calculate({
        title: 'Adawaty',
        description: 'Free tools',
        url: 'https://example.com/tools/',
        image: 'https://example.com/card.png',
    }, 'en').value,
    /property="og:image"/,
);
assert.throws(
    () => getToolDefinition('open-graph-generator').calculate({
        title: 'Adawaty',
        description: 'Free tools',
        url: 'not-a-url',
        image: 'https://example.com/card.png',
    }, 'en'),
    /valid absolute URL/,
);

const campaignUrl = getToolDefinition('utm-link-builder').calculate({
    url: 'https://example.com/landing',
    source: 'newsletter',
    medium: 'email',
    campaign: 'summer launch',
    content: 'hero',
}, 'en').value;
assert.match(campaignUrl, /utm_source=newsletter/);
assert.match(campaignUrl, /utm_campaign=summer\+launch/);

const robotsTxt = getToolDefinition('robots-txt-generator').calculate({
    domain: 'https://example.com/',
    disallow: '/admin/\nprivate/',
}, 'en').value;
assert.match(robotsTxt, /Disallow: \/admin\//);
assert.match(robotsTxt, /Sitemap: https:\/\/example\.com\/sitemap\.xml/);

assert.equal(
    getToolDefinition('canonical-tag-generator').calculate({
        url: 'https://example.com/page',
    }, 'en').value,
    '<link rel="canonical" href="https://example.com/page">',
);
assert.match(
    getToolDefinition('hreflang-tag-generator').calculate({
        arabicUrl: 'https://example.com/ar/',
        englishUrl: 'https://example.com/en/',
    }, 'en').value,
    /hreflang="x-default"/,
);
assert.match(
    getToolDefinition('sitemap-entry-generator').calculate({
        url: 'https://example.com/tool/',
        changeFrequency: 'weekly',
        priority: 0.8,
    }, 'en').value,
    /<priority>0\.8<\/priority>/,
);
assert.equal(
    getToolDefinition('keyword-density-checker').calculate({
        keyword: 'online tools',
        text: 'Online tools are useful online tools.',
    }, 'en').value,
    '66.67%',
);
assert.match(
    getToolDefinition('serp-snippet-preview').calculate({
        title: 'Free tools',
        url: 'https://example.com/tools/',
        description: 'Useful browser tools.',
    }, 'en').details,
    /10\/60 title/,
);

assert.equal(
    getToolDefinition('hex-to-rgb-converter').calculate({
        hex: '#4080FF',
    }, 'en').value,
    'rgb(64, 128, 255)',
);
assert.equal(
    getToolDefinition('rgb-to-hex-converter').calculate({
        red: 64,
        green: 128,
        blue: 255,
    }, 'en').value,
    '#4080FF',
);
assert.throws(
    () => getToolDefinition('rgb-to-hex-converter').calculate({
        red: 256,
        green: 0,
        blue: 0,
    }, 'en'),
    /integers from 0 to 255/,
);
assert.equal(
    getToolDefinition('rgb-to-hsl-converter').calculate({
        red: 255,
        green: 0,
        blue: 0,
    }, 'en').value,
    'hsl(0, 100.0%, 50.0%)',
);
assert.equal(
    getToolDefinition('wcag-contrast-checker').calculate({
        foreground: '#000',
        background: '#FFF',
    }, 'en').value,
    '21.00:1',
);
assert.equal(
    getToolDefinition('color-blender').calculate({
        first: '#000000',
        second: '#FFFFFF',
        amount: 50,
    }, 'en').value,
    '#808080',
);
assert.equal(
    getToolDefinition('color-tint-shade-generator').calculate({
        color: '#000000',
        mode: 'tint',
        amount: 20,
    }, 'en').value,
    '#333333',
);
assert.equal(
    getToolDefinition('css-linear-gradient-generator').calculate({
        first: '#06B6D4',
        second: '#8B5CF6',
        angle: 135,
    }, 'en').value,
    'background: linear-gradient(135deg, #06B6D4, #8B5CF6);',
);
assert.equal(
    getToolDefinition('css-box-shadow-generator').calculate({
        x: 0,
        y: 12,
        blur: 30,
        spread: -8,
        color: '#0F172A',
    }, 'en').value,
    'box-shadow: 0px 12px 30px -8px #0F172A;',
);
assert.equal(
    getToolDefinition('css-border-radius-generator').calculate({
        topLeft: 8,
        topRight: 16,
        bottomRight: 24,
        bottomLeft: 32,
    }, 'en').value,
    'border-radius: 8px 16px 24px 32px;',
);
assert.equal(
    getToolDefinition('css-clamp-calculator').calculate({
        minSize: 16,
        maxSize: 32,
        minViewport: 320,
        maxViewport: 1200,
    }, 'en').value,
    'clamp(1rem, 0.6364rem + 1.8182vw, 2rem)',
);

assert.equal(
    getToolDefinition('fuel-cost-calculator').calculate({
        distance: 350,
        consumption: 7.5,
        price: 15,
    }, 'en').value,
    '393.75',
);
assert.equal(
    getToolDefinition('fuel-economy-calculator').calculate({
        distance: 500,
        fuel: 40,
    }, 'en').value,
    '12.5 km/L',
);
assert.equal(
    getToolDefinition('road-trip-cost-calculator').calculate({
        distance: 700,
        consumption: 8,
        fuelPrice: 15,
        tolls: 100,
    }, 'en').value,
    '940',
);
assert.equal(
    getToolDefinition('electricity-cost-calculator').calculate({
        watts: 1500,
        hours: 4,
        days: 30,
        rate: 1.5,
    }, 'en').value,
    '270',
);
assert.equal(
    getToolDefinition('paint-calculator').calculate({
        area: 80,
        coats: 2,
        coverage: 10,
        waste: 10,
    }, 'en').value,
    '17.6 L',
);
assert.equal(
    getToolDefinition('tile-calculator').calculate({
        area: 24,
        tileWidth: 60,
        tileLength: 60,
        waste: 10,
    }, 'en').value,
    '74',
);
assert.equal(
    getToolDefinition('concrete-volume-calculator').calculate({
        length: 6,
        width: 4,
        thickness: 15,
        waste: 5,
    }, 'en').value,
    '3.78 m³',
);
assert.equal(
    getToolDefinition('wallpaper-roll-calculator').calculate({
        area: 45,
        coverage: 5.2,
        waste: 15,
    }, 'en').value,
    '10',
);
assert.equal(
    getToolDefinition('recipe-scaler').calculate({
        amount: 250,
        originalServings: 4,
        newServings: 10,
    }, 'en').value,
    '625',
);
assert.equal(
    getToolDefinition('rent-affordability-calculator').calculate({
        income: 20000,
        ratio: 30,
        housingExpenses: 1000,
    }, 'en').value,
    '5,000',
);

assert.equal(
    getToolDefinition('acceleration-converter').calculate({
        value: 1,
        from: 'g',
        to: 'm/s²',
    }, 'en').value,
    '9.80665',
);
assert.equal(
    getToolDefinition('force-unit-converter').calculate({
        value: 1,
        from: 'kN',
        to: 'N',
    }, 'en').value,
    '1,000',
);
assert.equal(
    getToolDefinition('power-unit-converter').calculate({
        value: 1,
        from: 'hp',
        to: 'W',
    }, 'en').value,
    '745.699872',
);
assert.equal(
    getToolDefinition('torque-converter').calculate({
        value: 1,
        from: 'lbf·ft',
        to: 'N·m',
    }, 'en').value,
    '1.3558179483',
);
assert.equal(
    getToolDefinition('frequency-converter').calculate({
        value: 60,
        from: 'rpm',
        to: 'Hz',
    }, 'en').value,
    '1',
);
assert.equal(
    getToolDefinition('density-unit-converter').calculate({
        value: 1,
        from: 'g/cm³',
        to: 'kg/m³',
    }, 'en').value,
    '1,000',
);
assert.equal(
    getToolDefinition('flow-rate-converter').calculate({
        value: 60,
        from: 'L/min',
        to: 'L/s',
    }, 'en').value,
    '1',
);
assert.equal(
    getToolDefinition('cooking-volume-converter').calculate({
        value: 1,
        from: 'cup',
        to: 'mL',
    }, 'en').value,
    '236.5882365',
);
assert.equal(
    getToolDefinition('data-transfer-rate-converter').calculate({
        value: 1,
        from: 'MB/s',
        to: 'Mbps',
    }, 'en').value,
    '8',
);
assert.equal(
    getToolDefinition('illuminance-converter').calculate({
        value: 1,
        from: 'fc',
        to: 'lx',
    }, 'en').value,
    '10.7639104',
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

console.log('Sprint 6 Batch 17 product tools verification passed.');

// END OF FILE
