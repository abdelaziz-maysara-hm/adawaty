const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
});

function format(value) {
    return formatter.format(value);
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function result(value, label, details = '') {
    return { value: String(value), label, details };
}

function numberInput(id, label, sample, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000,
        step: options.step ?? 0.01,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(sample),
    });
}

const kg = Object.freeze({ ar: 'كجم', en: 'kg' });
const cm = Object.freeze({ ar: 'سم', en: 'cm' });
const minutes = Object.freeze({ ar: 'دقيقة', en: 'minutes' });

const waistHipRatio = Object.freeze({
    id: 'waist-to-hip-ratio-calculator',
    category: 'health',
    icon: 'W/H',
    title: Object.freeze({ ar: 'حاسبة نسبة الخصر إلى الورك', en: 'Waist-to-Hip Ratio Calculator' }),
    description: Object.freeze({ ar: 'احسب نسبة محيط الخصر إلى محيط الورك كمؤشر عام لتوزيع الدهون.', en: 'Calculate waist-to-hip ratio as a general indicator of fat distribution.' }),
    note: Object.freeze({ ar: 'هذا مؤشر تثقيفي وليس تشخيصًا طبيًا.', en: 'This is an educational indicator, not a medical diagnosis.' }),
    inputs: Object.freeze([
        numberInput('waist', { ar: 'محيط الخصر', en: 'Waist circumference' }, 82, { min: 20, unit: cm }),
        numberInput('hip', { ar: 'محيط الورك', en: 'Hip circumference' }, 100, { min: 20, unit: cm }),
    ]),
    calculate(values, language) {
        const ratio = values.waist / values.hip;
        return result(ratio.toFixed(2), localized(language, 'نسبة الخصر إلى الورك', 'Waist-to-hip ratio'), localized(language, 'ناقش القياسات المثيرة للقلق مع مختص صحي.', 'Discuss concerning measurements with a health professional.'));
    },
});

const ponderalIndex = Object.freeze({
    id: 'ponderal-index-calculator',
    category: 'health',
    icon: 'PI',
    title: Object.freeze({ ar: 'حاسبة مؤشر البدانة', en: 'Ponderal Index Calculator' }),
    description: Object.freeze({ ar: 'احسب مؤشر البدانة باستخدام الوزن والطول بالمتر المكعب.', en: 'Calculate the ponderal index using weight divided by height cubed.' }),
    note: Object.freeze({ ar: 'يُستخدم كمؤشر إضافي ولا يغني عن التقييم الصحي.', en: 'Use it as a supplementary indicator, not a health assessment.' }),
    inputs: Object.freeze([
        numberInput('weight', { ar: 'الوزن', en: 'Weight' }, 70, { min: 1, unit: kg }),
        numberInput('height', { ar: 'الطول', en: 'Height' }, 175, { min: 50, max: 300, unit: cm }),
    ]),
    calculate(values, language) {
        const metres = values.height / 100;
        const index = values.weight / (metres ** 3);
        return result(index.toFixed(2), localized(language, 'مؤشر البدانة', 'Ponderal index'), 'kg/m³');
    },
});

const adjustedBodyWeight = Object.freeze({
    id: 'adjusted-body-weight-calculator',
    category: 'health',
    icon: 'Adj',
    title: Object.freeze({ ar: 'حاسبة الوزن المعدّل', en: 'Adjusted Body Weight Calculator' }),
    description: Object.freeze({ ar: 'قدّر الوزن المعدّل من الوزن الحالي والوزن المثالي بمعامل قابل للمراجعة.', en: 'Estimate adjusted body weight from actual and ideal weight.' }),
    note: Object.freeze({ ar: 'تستخدم الأداة معامل 0.4 الشائع للتقدير التعليمي فقط.', en: 'Uses the common 0.4 adjustment factor for education only.' }),
    inputs: Object.freeze([
        numberInput('actualWeight', { ar: 'الوزن الحالي', en: 'Actual weight' }, 100, { min: 1, unit: kg }),
        numberInput('idealWeight', { ar: 'الوزن المثالي المقدّر', en: 'Estimated ideal weight' }, 70, { min: 1, unit: kg }),
    ]),
    calculate(values, language) {
        const adjusted = values.idealWeight + (0.4 * (values.actualWeight - values.idealWeight));
        return result(`${format(adjusted)} ${localized(language, 'كجم', 'kg')}`, localized(language, 'الوزن المعدّل التقديري', 'Estimated adjusted body weight'));
    },
});

const healthyWeightRange = Object.freeze({
    id: 'healthy-weight-range-calculator',
    category: 'health',
    icon: '↔kg',
    title: Object.freeze({ ar: 'حاسبة نطاق الوزن الصحي', en: 'Healthy Weight Range Calculator' }),
    description: Object.freeze({ ar: 'قدّر نطاق الوزن الموافق لمؤشر كتلة جسم بين 18.5 و24.9.', en: 'Estimate the weight range corresponding to BMI values from 18.5 to 24.9.' }),
    note: Object.freeze({ ar: 'مؤشر كتلة الجسم لا يراعي تركيب الجسم أو الظروف الفردية.', en: 'BMI does not account for body composition or individual circumstances.' }),
    inputs: Object.freeze([
        numberInput('height', { ar: 'الطول', en: 'Height' }, 175, { min: 50, max: 300, unit: cm }),
    ]),
    calculate(values, language) {
        const metresSquared = (values.height / 100) ** 2;
        const minimum = 18.5 * metresSquared;
        const maximum = 24.9 * metresSquared;
        return result(`${format(minimum)}–${format(maximum)} ${localized(language, 'كجم', 'kg')}`, localized(language, 'نطاق الوزن التقديري', 'Estimated weight range'));
    },
});

const metCalories = Object.freeze({
    id: 'met-calorie-burn-calculator',
    category: 'health',
    icon: 'MET',
    title: Object.freeze({ ar: 'حاسبة السعرات بمعامل MET', en: 'MET Calorie Burn Calculator' }),
    description: Object.freeze({ ar: 'قدّر السعرات المستهلكة باستخدام شدة النشاط والوزن والمدة.', en: 'Estimate calories burned from activity intensity, weight and duration.' }),
    note: Object.freeze({ ar: 'القيمة تقريبية وتتغير حسب اللياقة والظروف الفردية.', en: 'This estimate varies with fitness and individual conditions.' }),
    inputs: Object.freeze([
        numberInput('met', { ar: 'قيمة MET للنشاط', en: 'Activity MET value' }, 6, { min: 0.1, max: 30, step: 0.1 }),
        numberInput('weight', { ar: 'الوزن', en: 'Weight' }, 70, { min: 1, unit: kg }),
        numberInput('duration', { ar: 'المدة', en: 'Duration' }, 45, { min: 1, max: 1440, unit: minutes }),
    ]),
    calculate(values, language) {
        const calories = values.met * 3.5 * values.weight / 200 * values.duration;
        return result(`${format(calories)} ${localized(language, 'سعرة', 'kcal')}`, localized(language, 'السعرات المقدرة', 'Estimated calories burned'));
    },
});

const stepsDistance = Object.freeze({
    id: 'steps-to-distance-calculator',
    category: 'health',
    icon: '👣',
    title: Object.freeze({ ar: 'حاسبة الخطوات إلى مسافة', en: 'Steps to Distance Calculator' }),
    description: Object.freeze({ ar: 'حوّل عدد الخطوات إلى مسافة تقريبية باستخدام طول الخطوة.', en: 'Convert step count into an estimated distance using stride length.' }),
    note: Object.freeze({ ar: 'استخدم متوسط طول خطوتك للحصول على تقدير أدق.', en: 'Use your average stride length for a better estimate.' }),
    inputs: Object.freeze([
        numberInput('steps', { ar: 'عدد الخطوات', en: 'Step count' }, 10000, { min: 1, max: 10_000_000, step: 1 }),
        numberInput('stride', { ar: 'طول الخطوة', en: 'Stride length' }, 75, { min: 20, max: 200, unit: cm }),
    ]),
    calculate(values, language) {
        const kilometres = values.steps * values.stride / 100000;
        return result(`${format(kilometres)} ${localized(language, 'كم', 'km')}`, localized(language, 'المسافة المقدرة', 'Estimated distance'));
    },
});

const stepsCalories = Object.freeze({
    id: 'steps-to-calories-calculator',
    category: 'health',
    icon: '👟',
    title: Object.freeze({ ar: 'حاسبة سعرات الخطوات', en: 'Steps to Calories Calculator' }),
    description: Object.freeze({ ar: 'قدّر السعرات المستهلكة من عدد الخطوات والوزن.', en: 'Estimate calories burned from step count and body weight.' }),
    note: Object.freeze({ ar: 'يستخدم التقدير معاملًا تقريبيًا ويتأثر بالسرعة والتضاريس.', en: 'Uses a general estimate affected by pace and terrain.' }),
    inputs: Object.freeze([
        numberInput('steps', { ar: 'عدد الخطوات', en: 'Step count' }, 10000, { min: 1, max: 10_000_000, step: 1 }),
        numberInput('weight', { ar: 'الوزن', en: 'Weight' }, 70, { min: 1, unit: kg }),
    ]),
    calculate(values, language) {
        const calories = values.steps * 0.04 * (values.weight / 70);
        return result(`${format(calories)} ${localized(language, 'سعرة', 'kcal')}`, localized(language, 'السعرات المقدرة', 'Estimated calories burned'));
    },
});

const oneRepMax = Object.freeze({
    id: 'one-rep-max-calculator',
    category: 'health',
    icon: '1RM',
    title: Object.freeze({ ar: 'حاسبة أقصى تكرار واحد', en: 'One Rep Max Calculator' }),
    description: Object.freeze({ ar: 'قدّر أقصى وزن لتكرار واحد من وزن التمرين وعدد التكرارات.', en: 'Estimate one-repetition maximum from lifted weight and repetitions.' }),
    note: Object.freeze({ ar: 'لا تختبر الحد الأقصى دون إشراف وتقنية مناسبة.', en: 'Do not test maximal lifts without proper technique and supervision.' }),
    inputs: Object.freeze([
        numberInput('weight', { ar: 'الوزن المستخدم', en: 'Weight lifted' }, 80, { min: 1, unit: kg }),
        numberInput('repetitions', { ar: 'عدد التكرارات', en: 'Repetitions' }, 8, { min: 1, max: 30, step: 1 }),
    ]),
    calculate(values, language) {
        const maximum = values.weight * (1 + values.repetitions / 30);
        return result(`${format(maximum)} ${localized(language, 'كجم', 'kg')}`, localized(language, 'أقصى تكرار تقديري', 'Estimated one-rep max'), localized(language, 'وفق معادلة Epley.', 'Using the Epley formula.'));
    },
});

const raceTimePredictor = Object.freeze({
    id: 'race-time-predictor',
    category: 'health',
    icon: '🏁',
    title: Object.freeze({ ar: 'متوقع زمن السباق', en: 'Race Time Predictor' }),
    description: Object.freeze({ ar: 'توقع زمن مسافة جري جديدة من نتيجة سابقة باستخدام معادلة Riegel.', en: 'Predict a new running distance time from a previous result using the Riegel formula.' }),
    note: Object.freeze({ ar: 'يفترض مستوى جهد وظروفًا متقاربة بين السباقين.', en: 'Assumes similar effort and conditions across both races.' }),
    inputs: Object.freeze([
        numberInput('knownDistance', { ar: 'المسافة المعروفة', en: 'Known distance' }, 5, { min: 0.1, unit: Object.freeze({ ar: 'كم', en: 'km' }) }),
        numberInput('knownMinutes', { ar: 'الزمن المعروف', en: 'Known time' }, 25, { min: 0.1, unit: minutes }),
        numberInput('targetDistance', { ar: 'المسافة المستهدفة', en: 'Target distance' }, 10, { min: 0.1, unit: Object.freeze({ ar: 'كم', en: 'km' }) }),
    ]),
    calculate(values, language) {
        const predicted = values.knownMinutes * ((values.targetDistance / values.knownDistance) ** 1.06);
        const hoursPart = Math.floor(predicted / 60);
        const minutesPart = Math.floor(predicted % 60);
        const secondsPart = Math.round((predicted % 1) * 60);
        return result(`${hoursPart}:${String(minutesPart).padStart(2, '0')}:${String(secondsPart).padStart(2, '0')}`, localized(language, 'الزمن المتوقع', 'Predicted finish time'), `${format(predicted)} min`);
    },
});

const vo2MaxCalculator = Object.freeze({
    id: 'cooper-test-vo2-max-calculator',
    category: 'health',
    icon: 'VO₂',
    title: Object.freeze({ ar: 'حاسبة VO₂ Max لاختبار كوبر', en: 'Cooper Test VO₂ Max Calculator' }),
    description: Object.freeze({ ar: 'قدّر الحد الأقصى لاستهلاك الأكسجين من مسافة الجري خلال 12 دقيقة.', en: 'Estimate maximal oxygen uptake from distance covered in a 12-minute run.' }),
    note: Object.freeze({ ar: 'اختبار الجهد قد لا يناسب الجميع؛ استشر مختصًا عند وجود مخاطر صحية.', en: 'Maximal exercise may not suit everyone; seek professional advice if at risk.' }),
    inputs: Object.freeze([
        numberInput('distance', { ar: 'المسافة خلال 12 دقيقة', en: 'Distance in 12 minutes' }, 2400, { min: 100, max: 6000, unit: Object.freeze({ ar: 'متر', en: 'metres' }) }),
    ]),
    calculate(values, language) {
        const vo2 = (values.distance - 504.9) / 44.73;
        return result(`${format(vo2)} ml/kg/min`, localized(language, 'VO₂ Max التقديري', 'Estimated VO₂ max'));
    },
});

const advancedHealthDefinitions = Object.freeze({
    [waistHipRatio.id]: waistHipRatio,
    [ponderalIndex.id]: ponderalIndex,
    [adjustedBodyWeight.id]: adjustedBodyWeight,
    [healthyWeightRange.id]: healthyWeightRange,
    [metCalories.id]: metCalories,
    [stepsDistance.id]: stepsDistance,
    [stepsCalories.id]: stepsCalories,
    [oneRepMax.id]: oneRepMax,
    [raceTimePredictor.id]: raceTimePredictor,
    [vo2MaxCalculator.id]: vo2MaxCalculator,
});

export { advancedHealthDefinitions };

// END OF FILE
