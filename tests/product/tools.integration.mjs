import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
    getToolDefinition,
    listToolDefinitions,
} from '../../src/product/tool-definitions.js';

const tools = listToolDefinitions();
assert.equal(tools.length, 451);
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
        'cash-zakat-calculator',
        'gold-zakat-calculator',
        'silver-zakat-calculator',
        'business-zakat-calculator',
        'quran-reading-plan-calculator',
        'quran-khatma-plan-calculator',
        'quran-memorization-plan-calculator',
        'tasbeeh-progress-calculator',
        'fasting-days-tracker',
        'qibla-direction-calculator',
        'line-counter',
        'sentence-counter',
        'paragraph-counter',
        'reading-time-calculator',
        'duplicate-line-remover',
        'line-sorter',
        'text-reverser',
        'whitespace-cleaner',
        'find-and-replace-tool',
        'lorem-ipsum-generator',
        'csv-to-json-converter',
        'json-to-csv-converter',
        'json-minifier',
        'json-validator',
        'xml-formatter',
        'sql-formatter',
        'query-string-parser',
        'query-string-builder',
        'uuid-generator',
        'random-string-generator',
        'prime-number-checker',
        'factorial-calculator',
        'permutation-calculator',
        'combination-calculator',
        'logarithm-calculator',
        'exponent-calculator',
        'nth-root-calculator',
        'percentage-error-calculator',
        'scientific-notation-converter',
        'number-base-converter',
        'cagr-calculator',
        'debt-to-income-calculator',
        'net-worth-calculator',
        'emergency-fund-calculator',
        'dividend-yield-calculator',
        'payback-period-calculator',
        'markup-calculator',
        'credit-card-payoff-calculator',
        'loan-affordability-calculator',
        'investment-fee-calculator',
        'waist-to-hip-ratio-calculator',
        'ponderal-index-calculator',
        'adjusted-body-weight-calculator',
        'healthy-weight-range-calculator',
        'met-calorie-burn-calculator',
        'steps-to-distance-calculator',
        'steps-to-calories-calculator',
        'one-rep-max-calculator',
        'race-time-predictor',
        'cooper-test-vo2-max-calculator',
        'weighted-course-grade-calculator',
        'required-final-grade-calculator',
        'cumulative-gpa-calculator',
        'percentage-to-gpa-calculator',
        'attendance-goal-calculator',
        'allowable-absences-calculator',
        'study-plan-calculator',
        'pomodoro-session-planner',
        'quiz-average-calculator',
        'class-rank-percentile-calculator',
        'morse-code-translator',
        'binary-text-converter',
        'rot13-converter',
        'nato-phonetic-alphabet-converter',
        'unicode-code-point-converter',
        'palindrome-checker',
        'anagram-checker',
        'initials-generator',
        'vowel-consonant-counter',
        'word-frequency-analyzer',
        'age-at-date-calculator',
        'inclusive-date-range-calculator',
        'months-between-dates-calculator',
        'days-in-month-calculator',
        'calendar-quarter-calculator',
        'time-addition-calculator',
        'decimal-hours-to-time-calculator',
        'weekend-days-between-dates-calculator',
        'anniversary-calculator',
        'julian-day-number-calculator',
        'momentum-calculator',
        'gravitational-potential-energy-calculator',
        'mechanical-work-calculator',
        'pressure-from-force-calculator',
        'mass-volume-density-calculator',
        'wave-speed-calculator',
        'heat-energy-calculator',
        'mass-energy-equivalence-calculator',
        'hookes-law-calculator',
        'ideal-gas-pressure-calculator',
        'sphere-calculator',
        'cylinder-calculator',
        'cone-calculator',
        'cube-calculator',
        'trapezoid-area-calculator',
        'parallelogram-area-calculator',
        'ellipse-area-calculator',
        'rhombus-area-calculator',
        'regular-polygon-calculator',
        'distance-between-points-calculator',
        'json-key-sorter',
        'json-flattener',
        'json-unflattener',
        'url-parser',
        'url-normalizer',
        'regex-escape-tool',
        'javascript-string-escape-tool',
        'http-status-code-lookup',
        'mime-type-lookup',
        'cron-expression-builder',
        'html-minifier',
        'html-beautifier',
        'html-to-text-converter',
        'html-tag-counter',
        'markdown-to-html-converter',
        'css-minifier',
        'css-specificity-calculator',
        'css-px-rem-converter',
        'data-uri-encoder',
        'data-uri-decoder',
        'median-calculator',
        'mode-calculator',
        'variance-calculator',
        'quartile-iqr-calculator',
        'percentile-calculator',
        'z-score-calculator',
        'coefficient-of-variation-calculator',
        'covariance-calculator',
        'pearson-correlation-calculator',
        'linear-regression-calculator',
        'geometric-mean-calculator',
        'harmonic-mean-calculator',
        'statistical-range-calculator',
        'mean-absolute-deviation-calculator',
        'standard-error-calculator',
        'confidence-interval-calculator',
        'sample-size-calculator',
        'binomial-probability-calculator',
        'odds-probability-converter',
        'expected-value-calculator',
        'linear-equation-solver',
        'two-variable-equation-solver',
        'slope-calculator',
        'midpoint-calculator',
        'arithmetic-sequence-calculator',
        'geometric-sequence-calculator',
        'arithmetic-series-sum-calculator',
        'geometric-series-sum-calculator',
        'polynomial-evaluator',
        'two-by-two-matrix-calculator',
        'trigonometric-functions-calculator',
        'inverse-trigonometric-calculator',
        'law-of-cosines-side-calculator',
        'law-of-cosines-angle-calculator',
        'law-of-sines-side-calculator',
        'arc-length-calculator',
        'sector-area-calculator',
        'chord-length-calculator',
        'circular-segment-area-calculator',
        'decimal-degrees-dms-converter',
        'line-equation-two-points-calculator',
        'point-to-line-distance-calculator',
        'three-dimensional-distance-calculator',
        'triangle-centroid-calculator',
        'triangle-area-coordinates-calculator',
        'herons-formula-calculator',
        'triangle-inradius-calculator',
        'triangle-circumradius-calculator',
        'polygon-interior-angle-sum-calculator',
        'polygon-diagonal-count-calculator',
        'power-rule-derivative-calculator',
        'polynomial-derivative-calculator',
        'polynomial-definite-integral-calculator',
        'average-rate-of-change-calculator',
        'polynomial-tangent-line-calculator',
        'polynomial-limit-calculator',
        'riemann-sum-calculator',
        'exponential-function-derivative-calculator',
        'numerical-derivative-calculator',
        'quadratic-partial-derivative-calculator',
        'brick-quantity-calculator',
        'mortar-volume-calculator',
        'cement-bag-calculator',
        'flooring-material-calculator',
        'drywall-sheet-calculator',
        'roofing-area-calculator',
        'gravel-quantity-calculator',
        'topsoil-volume-calculator',
        'staircase-dimensions-calculator',
        'room-air-conditioner-size-calculator',
        'customer-acquisition-cost-calculator',
        'customer-lifetime-value-calculator',
        'return-on-ad-spend-calculator',
        'ecommerce-conversion-rate-calculator',
        'cart-abandonment-rate-calculator',
        'inventory-turnover-calculator',
        'inventory-reorder-point-calculator',
        'shipping-dimensional-weight-calculator',
        'marketplace-fee-profit-calculator',
        'customer-retention-rate-calculator',
        'cost-per-click-calculator',
        'cost-per-thousand-impressions-calculator',
        'click-through-rate-calculator',
        'social-media-engagement-rate-calculator',
        'email-open-rate-calculator',
        'email-click-rate-calculator',
        'email-unsubscribe-rate-calculator',
        'lead-conversion-rate-calculator',
        'break-even-roas-calculator',
        'advertising-frequency-calculator',
        'video-file-size-calculator',
        'video-bitrate-calculator',
        'video-watch-time-calculator',
        'average-view-duration-calculator',
        'video-audience-retention-calculator',
        'subscriber-growth-rate-calculator',
        'video-sponsorship-cpm-calculator',
        'video-aspect-ratio-calculator',
        'video-resolution-scale-calculator',
        'live-stream-bandwidth-calculator',
        'compressed-audio-file-size-calculator',
        'uncompressed-audio-size-calculator',
        'audio-bitrate-calculator',
        'audio-sample-count-calculator',
        'bpm-beat-duration-calculator',
        'music-delay-time-calculator',
        'semitone-frequency-calculator',
        'decibel-amplitude-ratio-calculator',
        'podcast-ad-revenue-calculator',
        'audio-transcription-time-calculator',
        'depth-of-field-calculator',
        'camera-exposure-value-calculator',
        'shutter-angle-calculator',
        'hyperfocal-distance-calculator',
        'crop-factor-focal-length-calculator',
        'image-megapixel-calculator',
        'photo-print-size-calculator',
        'photo-storage-capacity-calculator',
        'timelapse-duration-calculator',
        'nd-filter-exposure-calculator',
        'bakers-percentage-calculator',
        'dough-hydration-calculator',
        'pizza-dough-ball-calculator',
        'brine-salt-calculator',
        'food-cost-per-serving-calculator',
        'menu-price-food-cost-calculator',
        'recipe-calories-per-serving-calculator',
        'caffeine-intake-calculator',
        'coffee-brew-ratio-calculator',
        'cooking-yield-percentage-calculator',
        'pert-estimate-calculator',
        'billable-utilization-rate-calculator',
        'billable-hours-target-calculator',
        'earned-value-management-calculator',
        'estimate-at-completion-calculator',
        'agile-sprint-velocity-calculator',
        'agile-team-capacity-calculator',
        'meeting-cost-calculator',
        'freelance-hourly-rate-calculator',
        'project-duration-throughput-calculator',
        'solar-panel-count-calculator',
        'solar-array-daily-output-calculator',
        'battery-bank-capacity-calculator',
        'battery-runtime-calculator',
        'battery-charge-time-calculator',
        'solar-inverter-size-calculator',
        'solar-payback-period-calculator',
        'energy-storage-duration-calculator',
        'dc-power-current-calculator',
        'dc-voltage-drop-calculator',
        'tire-size-diameter-calculator',
        'tire-size-comparison-calculator',
        'speedometer-tire-error-calculator',
        'engine-displacement-calculator',
        'vehicle-power-to-weight-calculator',
        'vehicle-depreciation-calculator',
        'ev-charging-time-calculator',
        'ev-charging-cost-calculator',
        'ev-range-calculator',
        'vehicle-braking-distance-calculator',
        'rental-yield-calculator',
        'real-estate-cap-rate-calculator',
        'cash-on-cash-return-calculator',
        'property-price-per-square-meter-calculator',
        'property-appreciation-calculator',
        'property-down-payment-calculator',
        'property-closing-cost-calculator',
        'rental-vacancy-loss-calculator',
        'property-tax-calculator',
        'gross-rent-multiplier-calculator',
        'travel-budget-calculator',
        'daily-travel-budget-calculator',
        'hotel-stay-cost-calculator',
        'flight-time-estimator',
        'flight-arrival-time-calculator',
        'airline-luggage-fee-calculator',
        'travel-currency-exchange-fee-calculator',
        'vacation-savings-calculator',
        'travel-points-value-calculator',
        'group-trip-cost-split-calculator',
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

assert.equal(
    getToolDefinition('cash-zakat-calculator').calculate({
        cash: 100000,
        receivables: 0,
        debts: 0,
        nisab: 85000,
    }, 'en').value,
    '2,500',
);
assert.equal(
    getToolDefinition('cash-zakat-calculator').calculate({
        cash: 50000,
        receivables: 0,
        debts: 0,
        nisab: 85000,
    }, 'en').value,
    '0',
);
assert.equal(
    getToolDefinition('gold-zakat-calculator').calculate({
        weight: 100,
        karat: '24',
        pureGoldPrice: 4000,
    }, 'en').value,
    '10,000',
);
assert.equal(
    getToolDefinition('silver-zakat-calculator').calculate({
        weight: 700,
        price: 50,
    }, 'en').value,
    '875',
);
assert.equal(
    getToolDefinition('business-zakat-calculator').calculate({
        cash: 50000,
        inventory: 100000,
        receivables: 20000,
        liabilities: 30000,
        nisab: 85000,
    }, 'en').value,
    '3,500',
);
assert.equal(
    getToolDefinition('quran-reading-plan-calculator').calculate({
        pages: 604,
        days: 30,
        sessions: 5,
    }, 'en').value,
    '20.133 pages/day',
);
assert.equal(
    getToolDefinition('quran-khatma-plan-calculator').calculate({
        completions: 1,
        days: 30,
        sessions: 5,
    }, 'en').value,
    '4.027 pages/session',
);
assert.equal(
    getToolDefinition('quran-memorization-plan-calculator').calculate({
        pages: 604,
        daysPerWeek: 5,
        pagesPerDay: 1,
    }, 'en').value,
    '120.8 weeks',
);
assert.equal(
    getToolDefinition('tasbeeh-progress-calculator').calculate({
        target: 100,
        completed: 33,
    }, 'en').value,
    '67',
);
assert.equal(
    getToolDefinition('fasting-days-tracker').calculate({
        target: 30,
        completed: 12,
    }, 'en').value,
    '18 days',
);
const qiblaBearing = Number.parseFloat(
    getToolDefinition('qibla-direction-calculator').calculate({
        latitude: 30.0444,
        longitude: 31.2357,
    }, 'en').value,
);
assert.ok(qiblaBearing > 135 && qiblaBearing < 137);

assert.equal(getToolDefinition('line-counter').calculate({ text: 'a\nb\n\nc' }, 'en').value, '4');
assert.equal(getToolDefinition('sentence-counter').calculate({ text: 'One. Two? Three!' }, 'en').value, '3');
assert.equal(getToolDefinition('paragraph-counter').calculate({ text: 'One.\n\nTwo.' }, 'en').value, '2');
assert.equal(getToolDefinition('reading-time-calculator').calculate({ text: 'one two three four', speed: 200 }, 'en').value, '0.02 min');
assert.equal(getToolDefinition('duplicate-line-remover').calculate({ text: 'a\nb\na' }, 'en').value, 'a\nb');
assert.equal(getToolDefinition('line-sorter').calculate({ text: 'c\na\nb', direction: 'ascending' }, 'en').value, 'a\nb\nc');
assert.equal(getToolDefinition('text-reverser').calculate({ text: 'abc' }, 'en').value, 'cba');
assert.equal(getToolDefinition('whitespace-cleaner').calculate({ text: '  too   many \n\n\n spaces  ' }, 'en').value, 'too many\n\nspaces');
assert.equal(getToolDefinition('find-and-replace-tool').calculate({ text: 'one one', find: 'one', replacement: 'two' }, 'en').value, 'two two');
assert.match(getToolDefinition('lorem-ipsum-generator').calculate({ paragraphs: 2, wordsPerParagraph: 5 }, 'en').value, /\n\n/);

assert.match(getToolDefinition('csv-to-json-converter').calculate({ csv: 'name,score\nAli,95' }, 'en').value, /"name": "Ali"/);
assert.equal(getToolDefinition('json-to-csv-converter').calculate({ json: '[{"name":"Ali","score":95}]' }, 'en').value, 'name,score\nAli,95');
assert.equal(getToolDefinition('json-minifier').calculate({ json: '{ "ok": true }' }, 'en').value, '{"ok":true}');
assert.equal(getToolDefinition('json-validator').calculate({ json: '{"ok":true}' }, 'en').value, 'Valid');
assert.equal(getToolDefinition('xml-formatter').calculate({ xml: '<root><item>One</item></root>' }, 'en').value, '<root>\n  <item>One</item>\n</root>');
assert.match(getToolDefinition('sql-formatter').calculate({ sql: 'select id from tools where active=1' }, 'en').value, /^SELECT id\nFROM tools\nWHERE active=1$/);
assert.match(getToolDefinition('query-string-parser').calculate({ query: '?q=tools&lang=en' }, 'en').value, /"q": "tools"/);
assert.equal(getToolDefinition('query-string-builder').calculate({ json: '{"q":"free tools","lang":"en"}' }, 'en').value, '?q=free+tools&lang=en');
assert.match(getToolDefinition('uuid-generator').calculate({ count: 1 }, 'en').value, /^[0-9a-f-]{36}$/i);
assert.equal(getToolDefinition('random-string-generator').calculate({ length: 24, charset: 'hex' }, 'en').value.length, 24);

assert.equal(getToolDefinition('prime-number-checker').calculate({ number: 97 }, 'en').value, 'Prime');
assert.equal(getToolDefinition('prime-number-checker').calculate({ number: 91 }, 'en').label, 'Smallest factor: 7');
assert.equal(getToolDefinition('factorial-calculator').calculate({ number: 10 }, 'en').value, '3,628,800');
assert.equal(getToolDefinition('permutation-calculator').calculate({ n: 10, r: 3 }, 'en').value, '720');
assert.equal(getToolDefinition('combination-calculator').calculate({ n: 10, r: 3 }, 'en').value, '120');
assert.equal(getToolDefinition('logarithm-calculator').calculate({ number: 1000, base: 10 }, 'en').value, '3');
assert.equal(getToolDefinition('exponent-calculator').calculate({ base: 2, exponent: 10 }, 'en').value, '1,024');
assert.equal(getToolDefinition('nth-root-calculator').calculate({ number: 125, degree: 3 }, 'en').value, '5');
assert.equal(getToolDefinition('percentage-error-calculator').calculate({ observed: 9.5, actual: 10 }, 'en').value, '5%');
assert.match(getToolDefinition('scientific-notation-converter').calculate({ value: '602000000000000000000000', operation: 'to-scientific' }, 'en').value, /^6\.02e\+23$/);
assert.equal(getToolDefinition('number-base-converter').calculate({ value: 'FF', fromBase: '16', toBase: '2' }, 'en').value, '11111111');

assert.equal(getToolDefinition('cagr-calculator').calculate({ initial: 100, final: 121, years: 2 }, 'en').value, '10');
assert.equal(getToolDefinition('debt-to-income-calculator').calculate({ monthlyDebt: 5000, grossIncome: 20000 }, 'en').value, '25');
assert.equal(getToolDefinition('net-worth-calculator').calculate({ cash: 100, investments: 200, property: 700, liabilities: 400 }, 'en').value, '600');
assert.equal(getToolDefinition('emergency-fund-calculator').calculate({ monthlyExpenses: 10000, coverageMonths: 6, currentSavings: 20000 }, 'en').value, '60,000');
assert.equal(getToolDefinition('dividend-yield-calculator').calculate({ annualDividend: 4, sharePrice: 80, shares: 100 }, 'en').value, '5');
assert.equal(getToolDefinition('payback-period-calculator').calculate({ investment: 120000, monthlyCashFlow: 8000 }, 'en').value, '15');
assert.equal(getToolDefinition('markup-calculator').calculate({ cost: 80, price: 120 }, 'en').value, '50');
assert.equal(getToolDefinition('credit-card-payoff-calculator').calculate({ balance: 1200, annualRate: 0, monthlyPayment: 100 }, 'en').value, '12');
assert.equal(getToolDefinition('loan-affordability-calculator').calculate({ monthlyIncome: 10000, existingDebt: 1000, maxDebtRatio: 40, annualRate: 0, termYears: 1 }, 'en').value, '36,000');
assert.equal(getToolDefinition('investment-fee-calculator').calculate({ principal: 100000, annualReturn: 8, annualFee: 1, years: 1 }, 'en').value, '1,000');

assert.equal(getToolDefinition('waist-to-hip-ratio-calculator').calculate({ waist: 82, hip: 100 }, 'en').value, '0.82');
assert.equal(getToolDefinition('ponderal-index-calculator').calculate({ weight: 70, height: 175 }, 'en').value, '13.06');
assert.equal(getToolDefinition('adjusted-body-weight-calculator').calculate({ actualWeight: 100, idealWeight: 70 }, 'en').value, '82 kg');
assert.equal(getToolDefinition('healthy-weight-range-calculator').calculate({ height: 175 }, 'en').value, '56.66–76.26 kg');
assert.equal(getToolDefinition('met-calorie-burn-calculator').calculate({ met: 6, weight: 70, duration: 45 }, 'en').value, '330.75 kcal');
assert.equal(getToolDefinition('steps-to-distance-calculator').calculate({ steps: 10000, stride: 75 }, 'en').value, '7.5 km');
assert.equal(getToolDefinition('steps-to-calories-calculator').calculate({ steps: 10000, weight: 70 }, 'en').value, '400 kcal');
assert.equal(getToolDefinition('one-rep-max-calculator').calculate({ weight: 80, repetitions: 8 }, 'en').value, '101.33 kg');
assert.match(getToolDefinition('race-time-predictor').calculate({ knownDistance: 5, knownMinutes: 25, targetDistance: 10 }, 'en').value, /^0:52:/);
assert.equal(getToolDefinition('cooper-test-vo2-max-calculator').calculate({ distance: 2400 }, 'en').value, '42.37 ml/kg/min');

assert.equal(getToolDefinition('weighted-course-grade-calculator').calculate({ score1: 80, weight1: 25, score2: 80, weight2: 25, score3: 100, weight3: 25, score4: 100, weight4: 25 }, 'en').value, '90%');
assert.equal(getToolDefinition('required-final-grade-calculator').calculate({ currentGrade: 80, completedWeight: 75, targetGrade: 85 }, 'en').value, '100%');
assert.equal(getToolDefinition('cumulative-gpa-calculator').calculate({ gpa1: 3, credits1: 10, gpa2: 3, credits2: 10, gpa3: 4, credits3: 10, gpa4: 4, credits4: 10 }, 'en').value, '3.50');
assert.equal(getToolDefinition('percentage-to-gpa-calculator').calculate({ percentage: 87 }, 'en').value, '3.3');
assert.equal(getToolDefinition('attendance-goal-calculator').calculate({ attended: 32, total: 40, target: 85 }, 'en').value, '14');
assert.equal(getToolDefinition('allowable-absences-calculator').calculate({ attended: 36, total: 40, minimum: 75 }, 'en').value, '8');
assert.equal(getToolDefinition('study-plan-calculator').calculate({ chapters: 24, days: 12, hoursPerDay: 3 }, 'en').value, '2');
assert.equal(getToolDefinition('pomodoro-session-planner').calculate({ studyMinutes: 120, focusMinutes: 25, breakMinutes: 5 }, 'en').value, '5');
assert.equal(getToolDefinition('quiz-average-calculator').calculate({ score1: 70, score2: 80, score3: 90, score4: 100, score5: 60 }, 'en').value, '80%');
assert.equal(getToolDefinition('class-rank-percentile-calculator').calculate({ rank: 20, classSize: 100 }, 'en').value, '81%');

assert.equal(getToolDefinition('morse-code-translator').calculate({ text: 'SOS', operation: 'encode' }, 'en').value, '... --- ...');
assert.equal(getToolDefinition('binary-text-converter').calculate({ text: 'A', operation: 'encode' }, 'en').value, '01000001');
assert.equal(getToolDefinition('rot13-converter').calculate({ text: 'Hello' }, 'en').value, 'Uryyb');
assert.equal(getToolDefinition('nato-phonetic-alphabet-converter').calculate({ text: 'AB1' }, 'en').value, 'Alpha Bravo One');
assert.equal(getToolDefinition('unicode-code-point-converter').calculate({ text: 'A🚀', operation: 'encode' }, 'en').value, 'U+0041 U+1F680');
assert.equal(getToolDefinition('palindrome-checker').calculate({ text: 'Never odd or even' }, 'en').value, 'Yes');
assert.equal(getToolDefinition('anagram-checker').calculate({ first: 'listen', second: 'silent' }, 'en').value, 'Anagrams');
assert.equal(getToolDefinition('initials-generator').calculate({ text: 'Adawaty Free Tools' }, 'en').value, 'AFT');
assert.equal(getToolDefinition('vowel-consonant-counter').calculate({ text: 'Adawaty' }, 'en').value, '3');
assert.match(getToolDefinition('word-frequency-analyzer').calculate({ text: 'tools make tools useful' }, 'en').value, /^tools: 2/);

assert.equal(getToolDefinition('age-at-date-calculator').calculate({ birthDate: '2000-01-15', referenceDate: '2025-03-20' }, 'en').value, '25 years');
assert.equal(getToolDefinition('inclusive-date-range-calculator').calculate({ startDate: '2025-01-01', endDate: '2025-01-10' }, 'en').value, '10');
assert.equal(getToolDefinition('months-between-dates-calculator').calculate({ startDate: '2024-01-15', endDate: '2025-03-14' }, 'en').value, '13');
assert.equal(getToolDefinition('days-in-month-calculator').calculate({ date: '2024-02-10' }, 'en').value, '29');
assert.equal(getToolDefinition('calendar-quarter-calculator').calculate({ date: '2025-08-10' }, 'en').value, 'Q3');
assert.equal(getToolDefinition('time-addition-calculator').calculate({ time: '23:30', hours: 2, minutes: 45 }, 'en').value, '02:15');
assert.equal(getToolDefinition('decimal-hours-to-time-calculator').calculate({ decimalHours: 7.75 }, 'en').value, '7:45:00');
assert.equal(getToolDefinition('weekend-days-between-dates-calculator').calculate({ startDate: '2025-01-06', endDate: '2025-01-12' }, 'en').value, '2');
assert.equal(getToolDefinition('anniversary-calculator').calculate({ eventDate: '2010-06-10', referenceDate: '2025-06-09' }, 'en').value, '14');
assert.equal(getToolDefinition('julian-day-number-calculator').calculate({ date: '2000-01-01' }, 'en').value, '2451545');

assert.equal(getToolDefinition('momentum-calculator').calculate({ mass: 10, velocity: 5 }, 'en').value, '50 kg·m/s');
assert.equal(getToolDefinition('gravitational-potential-energy-calculator').calculate({ mass: 10, height: 5, gravity: 9.8 }, 'en').value, '490 J');
assert.equal(getToolDefinition('mechanical-work-calculator').calculate({ force: 100, distance: 5, angle: 0 }, 'en').value, '500 J');
assert.equal(getToolDefinition('pressure-from-force-calculator').calculate({ force: 1000, area: 0.5 }, 'en').value, '2,000 Pa');
assert.equal(getToolDefinition('mass-volume-density-calculator').calculate({ mass: 500, volume: 0.5 }, 'en').value, '1,000 kg/m³');
assert.equal(getToolDefinition('wave-speed-calculator').calculate({ frequency: 440, wavelength: 0.78 }, 'en').value, '343.2 m/s');
assert.equal(getToolDefinition('heat-energy-calculator').calculate({ mass: 2, specificHeat: 4186, temperatureChange: 10 }, 'en').value, '83,720 J');
assert.match(getToolDefinition('mass-energy-equivalence-calculator').calculate({ mass: 1 }, 'en').value, /^89,875,517,873,681,760 J$/);
assert.equal(getToolDefinition('hookes-law-calculator').calculate({ constant: 200, displacement: 0.05 }, 'en').value, '10 N');
assert.match(getToolDefinition('ideal-gas-pressure-calculator').calculate({ moles: 1, temperature: 300, volume: 0.024 }, 'en').value, /^103,930/);

assert.match(getToolDefinition('sphere-calculator').calculate({ radius: 3 }, 'en').value, /^113\.097/);
assert.match(getToolDefinition('cylinder-calculator').calculate({ radius: 2, height: 5 }, 'en').value, /^62\.831/);
assert.match(getToolDefinition('cone-calculator').calculate({ radius: 3, height: 4 }, 'en').value, /^37\.699/);
assert.equal(getToolDefinition('cube-calculator').calculate({ side: 4 }, 'en').value, '64 units³');
assert.equal(getToolDefinition('trapezoid-area-calculator').calculate({ baseA: 8, baseB: 12, height: 5 }, 'en').value, '50 units²');
assert.equal(getToolDefinition('parallelogram-area-calculator').calculate({ base: 10, height: 6 }, 'en').value, '60 units²');
assert.match(getToolDefinition('ellipse-area-calculator').calculate({ semiMajor: 8, semiMinor: 5 }, 'en').value, /^125\.663/);
assert.equal(getToolDefinition('rhombus-area-calculator').calculate({ diagonalA: 10, diagonalB: 6 }, 'en').value, '30 units²');
assert.match(getToolDefinition('regular-polygon-calculator').calculate({ sides: 6, length: 5 }, 'en').value, /^64\.951/);
assert.equal(getToolDefinition('distance-between-points-calculator').calculate({ x1: 1, y1: 2, x2: 4, y2: 6 }, 'en').value, '5 units');

assert.match(getToolDefinition('json-key-sorter').calculate({ json: '{"z":1,"a":2}' }, 'en').value, /^\{\n  "a"/);
assert.match(getToolDefinition('json-flattener').calculate({ json: '{"user":{"name":"Ali"}}' }, 'en').value, /"user.name": "Ali"/);
assert.match(getToolDefinition('json-unflattener').calculate({ json: '{"user.name":"Ali"}' }, 'en').value, /"user": \{/);
assert.match(getToolDefinition('url-parser').calculate({ url: 'https://example.com/path?q=tools' }, 'en').value, /"hostname": "example.com"/);
assert.equal(getToolDefinition('url-normalizer').calculate({ url: 'HTTPS://Example.COM:443/path?z=2&a=1#top' }, 'en').value, 'https://example.com/path?a=1&z=2');
assert.equal(getToolDefinition('regex-escape-tool').calculate({ text: 'a+b?' }, 'en').value, 'a\\+b\\?');
assert.equal(getToolDefinition('javascript-string-escape-tool').calculate({ text: 'one\ntwo' }, 'en').value, 'one\\ntwo');
assert.equal(getToolDefinition('http-status-code-lookup').calculate({ code: 404 }, 'en').value, 'Not Found');
assert.equal(getToolDefinition('mime-type-lookup').calculate({ filename: 'data.json' }, 'en').value, 'application/json');
assert.equal(getToolDefinition('cron-expression-builder').calculate({ minute: '0', hour: '9', day: '*', month: '*', weekday: '1-5' }, 'en').value, '0 9 * * 1-5');

assert.equal(getToolDefinition('html-minifier').calculate({ html: '<main>\n  <p>Hello</p>\n</main>' }, 'en').value, '<main><p>Hello</p></main>');
assert.equal(getToolDefinition('html-beautifier').calculate({ html: '<main><p>Hello</p></main>' }, 'en').value, '<main>\n  <p>\n    Hello\n  </p>\n</main>');
assert.equal(getToolDefinition('html-to-text-converter').calculate({ html: '<h1>Hello</h1><p>Free <b>tools</b>.</p>' }, 'en').value, 'Hello\nFree tools.');
assert.match(getToolDefinition('html-tag-counter').calculate({ html: '<main><p>One</p><p>Two</p></main>' }, 'en').value, /"p": 2/);
assert.match(getToolDefinition('markdown-to-html-converter').calculate({ markdown: '# Tools\n\n- Fast\n- Free' }, 'en').value, /^<h1>Tools<\/h1>/);
assert.equal(getToolDefinition('css-minifier').calculate({ css: '.card { color: red; padding: 1rem; }' }, 'en').value, '.card{color:red;padding:1rem}');
assert.equal(getToolDefinition('css-specificity-calculator').calculate({ selector: '#app .card:hover > h2::before' }, 'en').value, '0-1-2-2');
assert.equal(getToolDefinition('css-px-rem-converter').calculate({ value: 24, rootSize: 16, direction: 'px-to-rem' }, 'en').value, '1.5rem');
assert.match(getToolDefinition('data-uri-encoder').calculate({ content: 'Hello world', mimeType: 'text/plain' }, 'en').value, /^data:text\/plain;charset=utf-8,Hello%20world$/);
assert.equal(getToolDefinition('data-uri-decoder').calculate({ uri: 'data:text/plain;charset=utf-8,Hello%20world' }, 'en').value, 'Hello world');

assert.equal(getToolDefinition('median-calculator').calculate({ values: '1, 3, 5, 7' }, 'en').value, '4');
assert.equal(getToolDefinition('mode-calculator').calculate({ values: '1, 2, 2, 3' }, 'en').value, '2');
assert.equal(getToolDefinition('variance-calculator').calculate({ values: '1, 2, 3', type: 'population' }, 'en').value, '0.666667');
assert.match(getToolDefinition('quartile-iqr-calculator').calculate({ values: '1, 2, 3, 4, 5' }, 'en').value, /IQR: 2$/);
assert.equal(getToolDefinition('percentile-calculator').calculate({ values: '1, 2, 3, 4, 5', percentile: 75 }, 'en').value, '4');
assert.equal(getToolDefinition('z-score-calculator').calculate({ value: 85, average: 70, standardDeviation: 10 }, 'en').value, '1.5');
assert.equal(getToolDefinition('coefficient-of-variation-calculator').calculate({ values: '2, 4, 6', type: 'population' }, 'en').value, '40.824829%');
assert.equal(getToolDefinition('covariance-calculator').calculate({ xValues: '1,2,3', yValues: '2,4,6', type: 'population' }, 'en').value, '1.333333');
assert.equal(getToolDefinition('pearson-correlation-calculator').calculate({ xValues: '1,2,3', yValues: '2,4,6' }, 'en').value, '1');
assert.equal(getToolDefinition('linear-regression-calculator').calculate({ xValues: '1,2,3', yValues: '2,4,6' }, 'en').value, 'y = 2x + 0');

assert.equal(getToolDefinition('geometric-mean-calculator').calculate({ values: '2, 8' }, 'en').value, '4');
assert.equal(getToolDefinition('harmonic-mean-calculator').calculate({ values: '2, 4' }, 'en').value, '2.666667');
assert.equal(getToolDefinition('statistical-range-calculator').calculate({ values: '2, 9, 4' }, 'en').value, '7');
assert.equal(getToolDefinition('mean-absolute-deviation-calculator').calculate({ values: '2, 4, 6' }, 'en').value, '1.333333');
assert.equal(getToolDefinition('standard-error-calculator').calculate({ standardDeviation: 12, sampleSize: 36 }, 'en').value, '2');
assert.match(getToolDefinition('confidence-interval-calculator').calculate({ mean: 75, standardDeviation: 10, sampleSize: 100, confidence: '95' }, 'en').value, /^73\.040036/);
assert.equal(getToolDefinition('sample-size-calculator').calculate({ proportion: 50, margin: 5, confidence: '95', population: 0 }, 'en').value, '385');
assert.equal(getToolDefinition('binomial-probability-calculator').calculate({ trials: 10, successes: 3, probability: 50 }, 'en').value, '11.71875%');
assert.equal(getToolDefinition('odds-probability-converter').calculate({ value: 75, direction: 'probability-to-odds' }, 'en').value, '3 : 1');
assert.equal(getToolDefinition('expected-value-calculator').calculate({ outcomes: '0, 10, 50', probabilities: '50, 40, 10' }, 'en').value, '9');

assert.equal(getToolDefinition('linear-equation-solver').calculate({ a: 3, b: 5, c: 20 }, 'en').value, '5');
assert.equal(getToolDefinition('two-variable-equation-solver').calculate({ a1: 2, b1: 1, c1: 7, a2: 1, b2: -1, c2: 2 }, 'en').value, 'x = 3\ny = 1');
assert.equal(getToolDefinition('slope-calculator').calculate({ x1: 1, y1: 2, x2: 4, y2: 8 }, 'en').value, '2');
assert.equal(getToolDefinition('midpoint-calculator').calculate({ x1: 1, y1: 2, x2: 5, y2: 8 }, 'en').value, '(3, 5)');
assert.equal(getToolDefinition('arithmetic-sequence-calculator').calculate({ first: 3, difference: 4, term: 10 }, 'en').value, '39');
assert.equal(getToolDefinition('geometric-sequence-calculator').calculate({ first: 2, ratio: 3, term: 6 }, 'en').value, '486');
assert.equal(getToolDefinition('arithmetic-series-sum-calculator').calculate({ first: 3, difference: 4, terms: 10 }, 'en').value, '210');
assert.equal(getToolDefinition('geometric-series-sum-calculator').calculate({ first: 2, ratio: 3, terms: 5 }, 'en').value, '242');
assert.equal(getToolDefinition('polynomial-evaluator').calculate({ coefficients: '2, 3, 1', x: 4 }, 'en').value, '45');
assert.match(getToolDefinition('two-by-two-matrix-calculator').calculate({ a: 4, b: 7, c: 2, d: 6 }, 'en').value, /^det = 10/);

assert.match(getToolDefinition('trigonometric-functions-calculator').calculate({ angle: 30 }, 'en').value, /^sin: 0\.5/);
assert.equal(getToolDefinition('inverse-trigonometric-calculator').calculate({ value: 0.5, function: 'asin' }, 'en').value, '30°');
assert.equal(getToolDefinition('law-of-cosines-side-calculator').calculate({ a: 3, b: 4, angle: 90 }, 'en').value, '5');
assert.match(getToolDefinition('law-of-cosines-angle-calculator').calculate({ a: 3, b: 4, c: 5 }, 'en').value, /^90°$/);
assert.equal(getToolDefinition('law-of-sines-side-calculator').calculate({ knownSide: 10, knownAngle: 30, targetAngle: 90 }, 'en').value, '20');
assert.equal(getToolDefinition('arc-length-calculator').calculate({ radius: 10, angle: 180 }, 'en').value, '31.415927');
assert.equal(getToolDefinition('sector-area-calculator').calculate({ radius: 10, angle: 180 }, 'en').value, '157.079633');
assert.equal(getToolDefinition('chord-length-calculator').calculate({ radius: 10, angle: 60 }, 'en').value, '10');
assert.equal(getToolDefinition('circular-segment-area-calculator').calculate({ radius: 10, angle: 60 }, 'en').value, '9.058607');
assert.equal(getToolDefinition('decimal-degrees-dms-converter').calculate({ direction: 'dms-to-decimal', decimal: 0, degree: 30, minute: 30, second: 30 }, 'en').value, '30.508333°');

assert.equal(getToolDefinition('line-equation-two-points-calculator').calculate({ x1: 1, y1: 2, x2: 4, y2: 8 }, 'en').value, 'y = 2x + 0');
assert.equal(getToolDefinition('point-to-line-distance-calculator').calculate({ x: 0, y: 0, a: 3, b: 4, c: -10 }, 'en').value, '2');
assert.equal(getToolDefinition('three-dimensional-distance-calculator').calculate({ x1: 0, y1: 0, z1: 0, x2: 2, y2: 3, z2: 6 }, 'en').value, '7');
assert.equal(getToolDefinition('triangle-centroid-calculator').calculate({ x1: 0, y1: 0, x2: 6, y2: 0, x3: 0, y3: 6 }, 'en').value, '(2, 2)');
assert.equal(getToolDefinition('triangle-area-coordinates-calculator').calculate({ x1: 0, y1: 0, x2: 4, y2: 0, x3: 0, y3: 3 }, 'en').value, '6');
assert.equal(getToolDefinition('herons-formula-calculator').calculate({ a: 3, b: 4, c: 5 }, 'en').value, '6');
assert.equal(getToolDefinition('triangle-inradius-calculator').calculate({ a: 3, b: 4, c: 5 }, 'en').value, '1');
assert.equal(getToolDefinition('triangle-circumradius-calculator').calculate({ a: 3, b: 4, c: 5 }, 'en').value, '2.5');
assert.equal(getToolDefinition('polygon-interior-angle-sum-calculator').calculate({ sides: 6 }, 'en').value, '720°');
assert.equal(getToolDefinition('polygon-diagonal-count-calculator').calculate({ sides: 8 }, 'en').value, '20');

assert.equal(getToolDefinition('power-rule-derivative-calculator').calculate({ coefficient: 3, exponent: 4 }, 'en').value, '12x^3');
assert.equal(getToolDefinition('polynomial-derivative-calculator').calculate({ coefficients: '2, 3, 1' }, 'en').value, '4x + 3');
assert.equal(getToolDefinition('polynomial-definite-integral-calculator').calculate({ coefficients: '3, 0, 2', lower: 0, upper: 2 }, 'en').value, '12');
assert.equal(getToolDefinition('average-rate-of-change-calculator').calculate({ coefficients: '1, 0, 0', start: 1, end: 3 }, 'en').value, '4');
assert.equal(getToolDefinition('polynomial-tangent-line-calculator').calculate({ coefficients: '1, 0, 0', x: 2 }, 'en').value, 'y = 4x − 4');
assert.equal(getToolDefinition('polynomial-limit-calculator').calculate({ coefficients: '2, -3, 1', approach: 2 }, 'en').value, '3');
assert.equal(getToolDefinition('riemann-sum-calculator').calculate({ coefficients: '1, 0', lower: 0, upper: 2, intervals: 2, method: 'midpoint' }, 'en').value, '2');
assert.equal(getToolDefinition('exponential-function-derivative-calculator').calculate({ coefficient: 2, base: 1, x: 5 }, 'en').value, '0');
assert.equal(getToolDefinition('numerical-derivative-calculator').calculate({ coefficients: '1, 0, 0', x: 2, step: 0.0001 }, 'en').value, '4');
assert.equal(getToolDefinition('quadratic-partial-derivative-calculator').calculate({ a: 1, b: 2, c: 3, x: 2, y: 4 }, 'en').value, '∂f/∂x = 12\n∂f/∂y = 28');

assert.equal(getToolDefinition('brick-quantity-calculator').calculate({ wallLength: 5, wallHeight: 3, brickLength: 0.2, brickHeight: 0.1, mortar: 0.01, waste: 5 }, 'en').value, '682');
assert.equal(getToolDefinition('mortar-volume-calculator').calculate({ length: 5, height: 3, thickness: 0.2, mortarPercent: 25, waste: 10 }, 'en').value, '0.825 m³');
assert.equal(getToolDefinition('cement-bag-calculator').calculate({ volume: 1, cementPercent: 20, density: 1440, bagWeight: 50, waste: 5 }, 'en').value, '7');
assert.equal(getToolDefinition('flooring-material-calculator').calculate({ length: 5, width: 4, coverage: 2.2, waste: 10 }, 'en').value, '10');
assert.equal(getToolDefinition('drywall-sheet-calculator').calculate({ surfaceLength: 6, surfaceHeight: 3, sheetLength: 2.4, sheetWidth: 1.2, waste: 10 }, 'en').value, '7');
assert.match(getToolDefinition('roofing-area-calculator').calculate({ length: 10, width: 8, rise: 2, waste: 10 }, 'en').value, /^98\.387 m²$/);
assert.equal(getToolDefinition('gravel-quantity-calculator').calculate({ length: 5, width: 4, depth: 0.08, density: 1680, waste: 5 }, 'en').value, '2,822.4 kg');
assert.equal(getToolDefinition('topsoil-volume-calculator').calculate({ length: 6, width: 3, depth: 0.2, allowance: 10 }, 'en').value, '3.96 m³');
assert.equal(getToolDefinition('staircase-dimensions-calculator').calculate({ totalRise: 3, targetRiser: 0.175, treadDepth: 0.28 }, 'en').value, '17');
assert.equal(getToolDefinition('room-air-conditioner-size-calculator').calculate({ length: 5, width: 4, height: 2.8, people: 2, sunFactor: 1 }, 'en').value, '12,000 BTU/h');

assert.equal(getToolDefinition('customer-acquisition-cost-calculator').calculate({ marketing: 10000, sales: 5000, customers: 100 }, 'en').value, '150');
assert.equal(getToolDefinition('customer-lifetime-value-calculator').calculate({ orderValue: 50, frequency: 6, margin: 40, years: 3 }, 'en').value, '360');
assert.equal(getToolDefinition('return-on-ad-spend-calculator').calculate({ revenue: 20000, spend: 5000 }, 'en').value, '4x');
assert.equal(getToolDefinition('ecommerce-conversion-rate-calculator').calculate({ conversions: 250, visitors: 10000 }, 'en').value, '2.5%');
assert.equal(getToolDefinition('cart-abandonment-rate-calculator').calculate({ carts: 1000, orders: 300 }, 'en').value, '70%');
assert.equal(getToolDefinition('inventory-turnover-calculator').calculate({ cogs: 120000, beginning: 20000, ending: 30000 }, 'en').value, '4.8x');
assert.equal(getToolDefinition('inventory-reorder-point-calculator').calculate({ dailySales: 20, leadDays: 7, safetyStock: 50 }, 'en').value, '190');
assert.equal(getToolDefinition('shipping-dimensional-weight-calculator').calculate({ length: 40, width: 30, height: 20, divisor: 5000 }, 'en').value, '4.8 kg');
assert.equal(getToolDefinition('marketplace-fee-profit-calculator').calculate({ price: 100, feePercent: 12, fixedFee: 0.3, productCost: 40, shippingCost: 10 }, 'en').value, '37.7');
assert.equal(getToolDefinition('customer-retention-rate-calculator').calculate({ start: 1000, end: 1100, newCustomers: 200 }, 'en').value, '90%');

assert.equal(getToolDefinition('cost-per-click-calculator').calculate({ cost: 500, clicks: 1000 }, 'en').value, '0.5');
assert.equal(getToolDefinition('cost-per-thousand-impressions-calculator').calculate({ cost: 1000, impressions: 250000 }, 'en').value, '4');
assert.equal(getToolDefinition('click-through-rate-calculator').calculate({ clicks: 2500, impressions: 100000 }, 'en').value, '2.5%');
assert.equal(getToolDefinition('social-media-engagement-rate-calculator').calculate({ interactions: 750, reach: 25000 }, 'en').value, '3%');
assert.equal(getToolDefinition('email-open-rate-calculator').calculate({ opens: 2400, delivered: 10000 }, 'en').value, '24%');
assert.equal(getToolDefinition('email-click-rate-calculator').calculate({ clicks: 350, delivered: 10000 }, 'en').value, '3.5%');
assert.equal(getToolDefinition('email-unsubscribe-rate-calculator').calculate({ unsubscribes: 25, delivered: 10000 }, 'en').value, '0.25%');
assert.equal(getToolDefinition('lead-conversion-rate-calculator').calculate({ customers: 80, leads: 1000 }, 'en').value, '8%');
assert.equal(getToolDefinition('break-even-roas-calculator').calculate({ margin: 40 }, 'en').value, '2.5x');
assert.equal(getToolDefinition('advertising-frequency-calculator').calculate({ impressions: 300000, reach: 100000 }, 'en').value, '3x');

assert.equal(getToolDefinition('video-file-size-calculator').calculate({ bitrate: 8, minutes: 10, seconds: 0 }, 'en').value, '600 MB');
assert.equal(getToolDefinition('video-bitrate-calculator').calculate({ size: 600, minutes: 10, seconds: 0 }, 'en').value, '8 Mbps');
assert.equal(getToolDefinition('video-watch-time-calculator').calculate({ views: 100000, averageMinutes: 4 }, 'en').value, '6,666.667 hours');
assert.equal(getToolDefinition('average-view-duration-calculator').calculate({ watchMinutes: 400000, views: 100000 }, 'en').value, '4 minutes');
assert.equal(getToolDefinition('video-audience-retention-calculator').calculate({ averageMinutes: 4, videoMinutes: 10 }, 'en').value, '40%');
assert.equal(getToolDefinition('subscriber-growth-rate-calculator').calculate({ start: 10000, end: 12500 }, 'en').value, '25%');
assert.equal(getToolDefinition('video-sponsorship-cpm-calculator').calculate({ views: 100000, cpm: 25 }, 'en').value, '2,500');
assert.equal(getToolDefinition('video-aspect-ratio-calculator').calculate({ width: 1920, height: 1080 }, 'en').value, '16:9');
assert.equal(getToolDefinition('video-resolution-scale-calculator').calculate({ originalWidth: 1920, originalHeight: 1080, targetWidth: 1280 }, 'en').value, '1280 × 720');
assert.equal(getToolDefinition('live-stream-bandwidth-calculator').calculate({ viewers: 1000, bitrate: 6, overhead: 10 }, 'en').value, '6.6 Gbps');

assert.equal(getToolDefinition('compressed-audio-file-size-calculator').calculate({ bitrate: 320, minutes: 5, seconds: 0 }, 'en').value, '12 MB');
assert.equal(getToolDefinition('uncompressed-audio-size-calculator').calculate({ sampleRate: 48000, bitDepth: 24, channels: 2, minutes: 5, seconds: 0 }, 'en').value, '86.4 MB');
assert.equal(getToolDefinition('audio-bitrate-calculator').calculate({ size: 12, minutes: 5, seconds: 0 }, 'en').value, '320 kbps');
assert.equal(getToolDefinition('audio-sample-count-calculator').calculate({ sampleRate: 48000, channels: 2, minutes: 1, seconds: 0 }, 'en').value, '5,760,000');
assert.equal(getToolDefinition('bpm-beat-duration-calculator').calculate({ bpm: 120 }, 'en').value, '500 ms');
assert.match(getToolDefinition('music-delay-time-calculator').calculate({ bpm: 120 }, 'en').value, /^Whole: 2,000 ms/);
assert.equal(getToolDefinition('semitone-frequency-calculator').calculate({ frequency: 440, semitones: 12 }, 'en').value, '880 Hz');
assert.equal(getToolDefinition('decibel-amplitude-ratio-calculator').calculate({ reference: 1, measured: 2 }, 'en').value, '6.021 dB');
assert.equal(getToolDefinition('podcast-ad-revenue-calculator').calculate({ downloads: 20000, cpm: 25, slots: 2, fillRate: 100 }, 'en').value, '1,000');
assert.equal(getToolDefinition('audio-transcription-time-calculator').calculate({ audioMinutes: 60, workFactor: 4 }, 'en').value, '4 hours');

assert.match(getToolDefinition('depth-of-field-calculator').calculate({ focalLength: 50, aperture: 2.8, circle: 0.03, distance: 5 }, 'en').value, /^Near:/);
assert.equal(getToolDefinition('camera-exposure-value-calculator').calculate({ aperture: 8, shutter: 0.008 }, 'en').value, '12.966 EV');
assert.equal(getToolDefinition('shutter-angle-calculator').calculate({ shutter: 0.020833, fps: 24 }, 'en').value, '179.997 °');
assert.equal(getToolDefinition('hyperfocal-distance-calculator').calculate({ focalLength: 35, aperture: 8, circle: 0.03 }, 'en').value, '5.139 m');
assert.equal(getToolDefinition('crop-factor-focal-length-calculator').calculate({ focalLength: 35, cropFactor: 1.5 }, 'en').value, '52.5 mm');
assert.equal(getToolDefinition('image-megapixel-calculator').calculate({ width: 6000, height: 4000 }, 'en').value, '24 MP');
assert.equal(getToolDefinition('photo-print-size-calculator').calculate({ width: 6000, height: 4000, dpi: 300 }, 'en').value, '20 × 13.333 in');
assert.equal(getToolDefinition('photo-storage-capacity-calculator').calculate({ storage: 64, photoSize: 25 }, 'en').value, '2560');
assert.equal(getToolDefinition('timelapse-duration-calculator').calculate({ shootMinutes: 60, interval: 5, fps: 30 }, 'en').value, '24.033 seconds');
assert.equal(getToolDefinition('nd-filter-exposure-calculator').calculate({ baseExposure: 0.008, stops: 10 }, 'en').value, '8.192 seconds');

assert.equal(getToolDefinition('bakers-percentage-calculator').calculate({ flour: 1000, ingredient: 20 }, 'en').value, '2%');
assert.equal(getToolDefinition('dough-hydration-calculator').calculate({ flour: 1000, water: 650 }, 'en').value, '65%');
assert.equal(getToolDefinition('pizza-dough-ball-calculator').calculate({ balls: 6, ballWeight: 250, hydration: 65, salt: 2.5, yeast: 0.2 }, 'en').value, '1,500 g');
assert.equal(getToolDefinition('brine-salt-calculator').calculate({ water: 2000, percentage: 3 }, 'en').value, '60 g');
assert.equal(getToolDefinition('food-cost-per-serving-calculator').calculate({ ingredientCost: 120, servings: 8, waste: 5 }, 'en').value, '15.75');
assert.equal(getToolDefinition('menu-price-food-cost-calculator').calculate({ cost: 30, targetPercent: 30 }, 'en').value, '100');
assert.equal(getToolDefinition('recipe-calories-per-serving-calculator').calculate({ totalCalories: 2400, servings: 8 }, 'en').value, '300 kcal');
assert.equal(getToolDefinition('caffeine-intake-calculator').calculate({ servings: 3, perServing: 95 }, 'en').value, '285 mg');
assert.equal(getToolDefinition('coffee-brew-ratio-calculator').calculate({ coffee: 30, ratio: 16 }, 'en').value, '480 g');
assert.equal(getToolDefinition('cooking-yield-percentage-calculator').calculate({ original: 1000, final: 750 }, 'en').value, '75%');

assert.equal(getToolDefinition('pert-estimate-calculator').calculate({ optimistic: 4, likely: 7, pessimistic: 16 }, 'en').value, '8');
assert.equal(getToolDefinition('billable-utilization-rate-calculator').calculate({ billable: 120, available: 160 }, 'en').value, '75%');
assert.equal(getToolDefinition('billable-hours-target-calculator').calculate({ target: 10000, rate: 50 }, 'en').value, '200 hours');
assert.equal(getToolDefinition('earned-value-management-calculator').calculate({ budget: 100000, actualCost: 45000, plannedValue: 50000, complete: 40 }, 'en').value, '40,000');
assert.equal(getToolDefinition('estimate-at-completion-calculator').calculate({ budget: 100000, cpi: 0.8 }, 'en').value, '125,000');
assert.equal(getToolDefinition('agile-sprint-velocity-calculator').calculate({ points: 160, sprints: 5 }, 'en').value, '32 points/sprint');
assert.equal(getToolDefinition('agile-team-capacity-calculator').calculate({ members: 5, days: 10, hours: 8, focus: 70 }, 'en').value, '280 hours');
assert.equal(getToolDefinition('meeting-cost-calculator').calculate({ attendees: 8, hourlyCost: 40, duration: 1.5 }, 'en').value, '480');
assert.equal(getToolDefinition('freelance-hourly-rate-calculator').calculate({ income: 60000, expenses: 10000, weeks: 46, hours: 25, taxReserve: 20 }, 'en').value, '76.087');
assert.equal(getToolDefinition('project-duration-throughput-calculator').calculate({ remaining: 240, throughput: 30 }, 'en').value, '8 periods');

assert.equal(getToolDefinition('solar-panel-count-calculator').calculate({ dailyEnergy: 20, panelPower: 550, sunHours: 5, efficiency: 80 }, 'en').value, '10');
assert.equal(getToolDefinition('solar-array-daily-output-calculator').calculate({ panels: 10, panelPower: 550, sunHours: 5, efficiency: 80 }, 'en').value, '22 kWh/day');
assert.equal(getToolDefinition('battery-bank-capacity-calculator').calculate({ dailyEnergy: 5000, days: 2, voltage: 48, depth: 80, efficiency: 90 }, 'en').value, '289.352 Ah');
assert.equal(getToolDefinition('battery-runtime-calculator').calculate({ voltage: 12, ampHours: 200, load: 500, depth: 80, efficiency: 90 }, 'en').value, '3.456 hours');
assert.equal(getToolDefinition('battery-charge-time-calculator').calculate({ capacity: 100, state: 20, current: 20, lossFactor: 15 }, 'en').value, '4.6 hours');
assert.equal(getToolDefinition('solar-inverter-size-calculator').calculate({ continuousLoad: 3000, headroom: 25 }, 'en').value, '3,750 W');
assert.equal(getToolDefinition('solar-payback-period-calculator').calculate({ systemCost: 12000, annualSavings: 1800 }, 'en').value, '6.667 years');
assert.equal(getToolDefinition('energy-storage-duration-calculator').calculate({ capacity: 10, load: 2, depth: 90, efficiency: 90 }, 'en').value, '4.05 hours');
assert.equal(getToolDefinition('dc-power-current-calculator').calculate({ power: 1200, voltage: 48 }, 'en').value, '25 A');
assert.equal(getToolDefinition('dc-voltage-drop-calculator').calculate({ current: 20, length: 15, resistance: 0.0033, voltage: 48 }, 'en').value, '1.98 V');

assert.equal(getToolDefinition('tire-size-diameter-calculator').calculate({ width: 225, aspect: 45, rim: 17 }, 'en').value, '634.3 mm');
assert.equal(getToolDefinition('tire-size-comparison-calculator').calculate({ oldWidth: 225, oldAspect: 45, oldRim: 17, newWidth: 235, newAspect: 45, newRim: 17 }, 'en').value, '1.419 %');
assert.equal(getToolDefinition('speedometer-tire-error-calculator').calculate({ indicated: 100, oldDiameter: 634.3, newDiameter: 643.3 }, 'en').value, '101.419 km/h');
assert.equal(getToolDefinition('engine-displacement-calculator').calculate({ cylinders: 4, bore: 86, stroke: 86 }, 'en').value, '1.998 L');
assert.equal(getToolDefinition('vehicle-power-to-weight-calculator').calculate({ power: 200, weight: 1500 }, 'en').value, '133.333 hp/tonne');
assert.equal(getToolDefinition('vehicle-depreciation-calculator').calculate({ price: 30000, rate: 15, years: 5 }, 'en').value, '13,311.159');
assert.equal(getToolDefinition('ev-charging-time-calculator').calculate({ capacity: 75, start: 20, target: 80, power: 11, efficiency: 90 }, 'en').value, '4.545 hours');
assert.equal(getToolDefinition('ev-charging-cost-calculator').calculate({ capacity: 75, start: 20, target: 80, price: 0.2, efficiency: 90 }, 'en').value, '10');
assert.equal(getToolDefinition('ev-range-calculator').calculate({ capacity: 75, usable: 90, consumption: 18 }, 'en').value, '375 km');
assert.equal(getToolDefinition('vehicle-braking-distance-calculator').calculate({ speed: 100, reaction: 1.5, friction: 0.7 }, 'en').value, '97.868 m');

assert.equal(getToolDefinition('rental-yield-calculator').calculate({ price: 200000, monthlyRent: 1500 }, 'en').value, '9 %');
assert.equal(getToolDefinition('real-estate-cap-rate-calculator').calculate({ noi: 18000, value: 250000 }, 'en').value, '7.2 %');
assert.equal(getToolDefinition('cash-on-cash-return-calculator').calculate({ cashFlow: 12000, cashInvested: 80000 }, 'en').value, '15 %');
assert.equal(getToolDefinition('property-price-per-square-meter-calculator').calculate({ price: 200000, area: 120 }, 'en').value, '1,666.667 per m²');
assert.equal(getToolDefinition('property-appreciation-calculator').calculate({ currentValue: 250000, rate: 5, years: 10 }, 'en').value, '407,223.657');
assert.equal(getToolDefinition('property-down-payment-calculator').calculate({ price: 300000, percent: 20 }, 'en').value, '60,000');
assert.equal(getToolDefinition('property-closing-cost-calculator').calculate({ price: 300000, rate: 4 }, 'en').value, '12,000');
assert.equal(getToolDefinition('rental-vacancy-loss-calculator').calculate({ monthlyRent: 1500, units: 4, vacancy: 5 }, 'en').value, '3,600');
assert.equal(getToolDefinition('property-tax-calculator').calculate({ taxableValue: 250000, rate: 1.2 }, 'en').value, '3,000');
assert.equal(getToolDefinition('gross-rent-multiplier-calculator').calculate({ price: 240000, monthlyRent: 2000 }, 'en').value, '10 x');

assert.equal(getToolDefinition('travel-budget-calculator').calculate({ transport: 800, lodging: 700, food: 350, activities: 250, reserve: 10 }, 'en').value, '2,310');
assert.equal(getToolDefinition('daily-travel-budget-calculator').calculate({ budget: 1200, days: 8, travelers: 2 }, 'en').value, '75');
assert.equal(getToolDefinition('hotel-stay-cost-calculator').calculate({ nightlyRate: 120, nights: 5, rooms: 1, tax: 12, fees: 50 }, 'en').value, '722');
assert.equal(getToolDefinition('flight-time-estimator').calculate({ distance: 3000, speed: 850, overhead: 30 }, 'en').value, '4.029 hours');
assert.equal(getToolDefinition('flight-arrival-time-calculator').calculate({ departure: 14.5, duration: 6.75, zoneDifference: 2 }, 'en').value, '23:15');
assert.equal(getToolDefinition('airline-luggage-fee-calculator').calculate({ weight: 28, allowance: 23, rate: 15 }, 'en').value, '75');
assert.equal(getToolDefinition('travel-currency-exchange-fee-calculator').calculate({ amount: 1000, rate: 0.92, markup: 3, fixedFee: 5 }, 'en').value, '887.938');
assert.equal(getToolDefinition('vacation-savings-calculator').calculate({ target: 5000, saved: 1000, months: 10 }, 'en').value, '400');
assert.equal(getToolDefinition('travel-points-value-calculator').calculate({ cashPrice: 750, cashFees: 50, points: 50000 }, 'en').value, '1.4 cents/point');
assert.equal(getToolDefinition('group-trip-cost-split-calculator').calculate({ sharedCost: 2400, travelers: 6, individualCost: 150 }, 'en').value, '550');

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
    assert.match(page, /"@type":"WebApplication"/);
    assert.match(page, /"isAccessibleForFree":true/);
    assert.doesNotMatch(page, /TODO|PLACEHOLDER/i);
}

assert.equal(getToolDefinition('missing-tool'), null);

console.log('Sprint 6 Batch 49 product tools verification passed.');

// END OF FILE
