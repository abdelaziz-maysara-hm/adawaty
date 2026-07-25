const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
});

function format(value) {
    return formatter.format(value);
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function numberInput(id, label, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000,
        step: options.step ?? 0.01,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze({
            value: option.value,
            label: Object.freeze(option.label),
        }))),
    });
}

function result(value, label, details) {
    return { value, label, details };
}

const genderOptions = Object.freeze([
    { value: 'male', label: { ar: 'ذكر', en: 'Male' } },
    { value: 'female', label: { ar: 'أنثى', en: 'Female' } },
]);

const calorieDeficit = Object.freeze({
    id: 'calorie-deficit-calculator',
    category: 'health',
    icon: '−',
    title: Object.freeze({ ar: 'حاسبة عجز السعرات', en: 'Calorie Deficit Calculator' }),
    description: Object.freeze({ ar: 'احسب هدف السعرات اليومي وفق احتياجك وحجم العجز.', en: 'Calculate a daily calorie target from maintenance and deficit.' }),
    note: Object.freeze({ ar: 'لا يُنصح بعجز كبير دون إشراف متخصص.', en: 'Large calorie deficits require professional guidance.' }),
    inputs: Object.freeze([
        numberInput('maintenance', { ar: 'سعرات الحفاظ على الوزن', en: 'Maintenance calories' }, 2400, { min: 500, max: 10000, step: 1 }),
        numberInput('deficit', { ar: 'العجز اليومي', en: 'Daily deficit' }, 500, { min: 0, max: 3000, step: 1 }),
    ]),
    calculate(values, language) {
        if (values.deficit >= values.maintenance) {
            throw new Error(localized(language, 'العجز يجب أن يقل عن سعرات الحفاظ.', 'Deficit must be below maintenance calories.'));
        }
        const target = values.maintenance - values.deficit;
        const weeklyEstimate = (values.deficit * 7) / 7700;
        return result(
            `${format(target)} ${localized(language, 'سعرة', 'kcal')}`,
            localized(language, 'هدف السعرات اليومي', 'Daily calorie target'),
            localized(language, `تغير أسبوعي تقديري: ${format(weeklyEstimate)} كجم`, `Estimated weekly change: ${format(weeklyEstimate)} kg`),
        );
    },
});

const macroCalculator = Object.freeze({
    id: 'macro-calculator',
    category: 'health',
    icon: 'P/C/F',
    title: Object.freeze({ ar: 'حاسبة الماكروز', en: 'Macro Calculator' }),
    description: Object.freeze({ ar: 'حوّل نسب البروتين والكربوهيدرات والدهون إلى جرامات.', en: 'Convert protein, carbohydrate and fat percentages into grams.' }),
    note: Object.freeze({ ar: 'يجب أن يكون مجموع النسب 100%.', en: 'Macro percentages must total 100%.' }),
    inputs: Object.freeze([
        numberInput('calories', { ar: 'السعرات اليومية', en: 'Daily calories' }, 2000, { min: 500, max: 10000, step: 1 }),
        numberInput('protein', { ar: 'نسبة البروتين', en: 'Protein percentage' }, 30, { max: 100, unit: { ar: '%', en: '%' } }),
        numberInput('carbs', { ar: 'نسبة الكربوهيدرات', en: 'Carb percentage' }, 40, { max: 100, unit: { ar: '%', en: '%' } }),
        numberInput('fat', { ar: 'نسبة الدهون', en: 'Fat percentage' }, 30, { max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    calculate(values, language) {
        const total = values.protein + values.carbs + values.fat;
        if (Math.abs(total - 100) > 0.01) {
            throw new Error(localized(language, 'مجموع نسب الماكروز يجب أن يساوي 100%.', 'Macro percentages must total 100%.'));
        }
        const protein = (values.calories * values.protein / 100) / 4;
        const carbs = (values.calories * values.carbs / 100) / 4;
        const fat = (values.calories * values.fat / 100) / 9;
        return result(
            `${format(protein)} g`,
            localized(language, 'بروتين يوميًا', 'protein per day'),
            localized(language, `كربوهيدرات: ${format(carbs)} جم — دهون: ${format(fat)} جم`, `Carbs: ${format(carbs)} g — fat: ${format(fat)} g`),
        );
    },
});

const proteinFactors = Object.freeze([
    { value: '0.8', label: { ar: 'نشاط منخفض', en: 'Low activity' } },
    { value: '1.2', label: { ar: 'نشاط خفيف', en: 'Light training' } },
    { value: '1.6', label: { ar: 'تدريب منتظم', en: 'Regular training' } },
    { value: '2', label: { ar: 'تدريب مكثف', en: 'Intense training' } },
]);

const proteinCalculator = Object.freeze({
    id: 'protein-intake-calculator',
    category: 'health',
    icon: 'P',
    title: Object.freeze({ ar: 'حاسبة احتياج البروتين', en: 'Protein Intake Calculator' }),
    description: Object.freeze({ ar: 'قدّر احتياج البروتين اليومي حسب الوزن والنشاط.', en: 'Estimate daily protein needs from weight and activity.' }),
    note: Object.freeze({ ar: 'الحالات الطبية قد تتطلب توصيات مختلفة.', en: 'Medical conditions may require different recommendations.' }),
    inputs: Object.freeze([
        numberInput('weight', { ar: 'الوزن', en: 'Weight' }, 70, { min: 20, max: 400, unit: { ar: 'كجم', en: 'kg' } }),
        selectInput('factor', { ar: 'مستوى النشاط', en: 'Activity level' }, proteinFactors),
    ]),
    calculate(values, language) {
        const protein = values.weight * Number(values.factor);
        return result(
            `${format(protein)} g`,
            localized(language, 'بروتين يوميًا', 'protein per day'),
            localized(language, 'تقدير عام للبالغين الأصحاء.', 'A general estimate for healthy adults.'),
        );
    },
});

const bodyFat = Object.freeze({
    id: 'body-fat-calculator',
    category: 'health',
    icon: '%',
    title: Object.freeze({ ar: 'حاسبة نسبة الدهون', en: 'Body Fat Calculator' }),
    description: Object.freeze({ ar: 'قدّر نسبة دهون الجسم من مؤشر الكتلة والعمر والنوع.', en: 'Estimate body fat percentage from BMI, age and sex.' }),
    note: Object.freeze({ ar: 'النتيجة تقديرية ولا تستبدل القياس الطبي.', en: 'This estimate does not replace clinical measurement.' }),
    inputs: Object.freeze([
        selectInput('gender', { ar: 'النوع', en: 'Sex' }, genderOptions),
        numberInput('age', { ar: 'العمر', en: 'Age' }, 30, { min: 18, max: 120, step: 1 }),
        numberInput('height', { ar: 'الطول', en: 'Height' }, 175, { min: 100, max: 250, unit: { ar: 'سم', en: 'cm' } }),
        numberInput('weight', { ar: 'الوزن', en: 'Weight' }, 75, { min: 25, max: 400, unit: { ar: 'كجم', en: 'kg' } }),
    ]),
    calculate(values, language) {
        const bmi = values.weight / ((values.height / 100) ** 2);
        const genderAdjustment = values.gender === 'male' ? 10.8 : 0;
        const percentage = (1.2 * bmi) + (0.23 * values.age)
            - genderAdjustment - 5.4;
        return result(
            `${format(Math.max(0, percentage))}%`,
            localized(language, 'نسبة الدهون التقديرية', 'Estimated body fat'),
            localized(language, `مؤشر الكتلة: ${format(bmi)}`, `BMI: ${format(bmi)}`),
        );
    },
});

const leanMass = Object.freeze({
    id: 'lean-body-mass-calculator',
    category: 'health',
    icon: 'LBM',
    title: Object.freeze({ ar: 'حاسبة الكتلة الخالية من الدهون', en: 'Lean Body Mass Calculator' }),
    description: Object.freeze({ ar: 'قدّر كتلة الجسم الخالية من الدهون من الطول والوزن.', en: 'Estimate lean body mass from height, weight and sex.' }),
    note: Object.freeze({ ar: 'تستخدم الأداة معادلة Boer التقديرية.', en: 'Uses the Boer estimation formula.' }),
    inputs: Object.freeze([
        selectInput('gender', { ar: 'النوع', en: 'Sex' }, genderOptions),
        numberInput('height', { ar: 'الطول', en: 'Height' }, 175, { min: 100, max: 250, unit: { ar: 'سم', en: 'cm' } }),
        numberInput('weight', { ar: 'الوزن', en: 'Weight' }, 75, { min: 25, max: 400, unit: { ar: 'كجم', en: 'kg' } }),
    ]),
    calculate(values, language) {
        const mass = values.gender === 'male'
            ? (0.407 * values.weight) + (0.267 * values.height) - 19.2
            : (0.252 * values.weight) + (0.473 * values.height) - 48.3;
        return result(
            `${format(mass)} kg`,
            localized(language, 'الكتلة الخالية من الدهون', 'Lean body mass'),
            localized(language, `النسبة من الوزن: ${format(mass / values.weight * 100)}%`, `Share of body weight: ${format(mass / values.weight * 100)}%`),
        );
    },
});

const waistHeight = Object.freeze({
    id: 'waist-to-height-ratio-calculator',
    category: 'health',
    icon: 'W:H',
    title: Object.freeze({ ar: 'حاسبة نسبة الخصر إلى الطول', en: 'Waist-to-Height Ratio Calculator' }),
    description: Object.freeze({ ar: 'احسب نسبة محيط الخصر إلى الطول كمؤشر صحي عام.', en: 'Calculate waist-to-height ratio as a general health indicator.' }),
    note: Object.freeze({ ar: 'يشيع استخدام هدف أقل من 0.5 للبالغين.', en: 'A ratio below 0.5 is a commonly used adult target.' }),
    inputs: Object.freeze([
        numberInput('waist', { ar: 'محيط الخصر', en: 'Waist circumference' }, 80, { min: 20, max: 300, unit: { ar: 'سم', en: 'cm' } }),
        numberInput('height', { ar: 'الطول', en: 'Height' }, 175, { min: 50, max: 250, unit: { ar: 'سم', en: 'cm' } }),
    ]),
    calculate(values, language) {
        const ratio = values.waist / values.height;
        const category = ratio < 0.5
            ? localized(language, 'ضمن الهدف الشائع', 'Within common target')
            : localized(language, 'أعلى من الهدف الشائع', 'Above common target');
        return result(format(ratio), category, localized(language, 'مؤشر عام وليس تشخيصًا.', 'A general indicator, not a diagnosis.'));
    },
});

const heartRate = Object.freeze({
    id: 'target-heart-rate-calculator',
    category: 'health',
    icon: '♥',
    title: Object.freeze({ ar: 'حاسبة نطاق نبض التمرين', en: 'Target Heart Rate Calculator' }),
    description: Object.freeze({ ar: 'قدّر نطاق نبض التمرين بطريقة Karvonen.', en: 'Estimate a training heart-rate zone using Karvonen.' }),
    note: Object.freeze({ ar: 'استشر الطبيب قبل برنامج تمرين جديد عند وجود حالة صحية.', en: 'Seek medical advice before a new exercise program if needed.' }),
    inputs: Object.freeze([
        numberInput('age', { ar: 'العمر', en: 'Age' }, 30, { min: 13, max: 100, step: 1 }),
        numberInput('resting', { ar: 'نبض الراحة', en: 'Resting heart rate' }, 70, { min: 30, max: 150, step: 1, unit: { ar: 'نبضة/د', en: 'bpm' } }),
    ]),
    calculate(values, language) {
        const maximum = 220 - values.age;
        const reserve = maximum - values.resting;
        const low = Math.round((reserve * 0.5) + values.resting);
        const high = Math.round((reserve * 0.85) + values.resting);
        return result(
            `${low}–${high} bpm`,
            localized(language, 'نطاق نبض التمرين', 'Training heart-rate zone'),
            localized(language, `الحد الأقصى التقديري: ${maximum}`, `Estimated maximum: ${maximum}`),
        );
    },
});

const runningPace = Object.freeze({
    id: 'running-pace-calculator',
    category: 'health',
    icon: '🏃',
    title: Object.freeze({ ar: 'حاسبة وتيرة الجري', en: 'Running Pace Calculator' }),
    description: Object.freeze({ ar: 'احسب وتيرة الجري والسرعة من المسافة والزمن.', en: 'Calculate running pace and speed from distance and time.' }),
    note: Object.freeze({ ar: 'أدخل الزمن الإجمالي بالدقائق.', en: 'Enter total elapsed time in minutes.' }),
    inputs: Object.freeze([
        numberInput('distance', { ar: 'المسافة', en: 'Distance' }, 5, { min: 0.01, max: 1000, unit: { ar: 'كم', en: 'km' } }),
        numberInput('minutes', { ar: 'الزمن', en: 'Time' }, 30, { min: 0.01, max: 100000, unit: { ar: 'دقيقة', en: 'minutes' } }),
    ]),
    calculate(values, language) {
        const pace = values.minutes / values.distance;
        const totalSeconds = Math.round(pace * 60);
        const wholeMinutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const speed = values.distance / (values.minutes / 60);
        return result(
            `${wholeMinutes}:${String(seconds).padStart(2, '0')} min/km`,
            localized(language, 'وتيرة الجري', 'Running pace'),
            localized(language, `السرعة: ${format(speed)} كم/س`, `Speed: ${format(speed)} km/h`),
        );
    },
});

const sleepCycle = Object.freeze({
    id: 'sleep-cycle-calculator',
    category: 'health',
    icon: '☾',
    title: Object.freeze({ ar: 'حاسبة دورات النوم', en: 'Sleep Cycle Calculator' }),
    description: Object.freeze({ ar: 'اقترح أوقات نوم اعتمادًا على وقت الاستيقاظ ودورات 90 دقيقة.', en: 'Suggest bedtimes from wake time using 90-minute cycles.' }),
    note: Object.freeze({ ar: 'يفترض الحساب 14 دقيقة تقريبًا للاستغراق في النوم.', en: 'Allows about 14 minutes to fall asleep.' }),
    inputs: Object.freeze([
        Object.freeze({ id: 'wakeTime', type: 'time', label: Object.freeze({ ar: 'وقت الاستيقاظ', en: 'Wake-up time' }), unit: Object.freeze({ ar: '', en: '' }) }),
    ]),
    calculate(values, language) {
        const [hours, minutes] = values.wakeTime.split(':').map(Number);
        if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
            throw new Error(localized(language, 'وقت الاستيقاظ غير صالح.', 'Invalid wake-up time.'));
        }
        const wakeMinutes = (hours * 60) + minutes;
        const bedtimes = [6, 5, 4].map((cycles) => {
            const total = ((wakeMinutes - 14 - (cycles * 90)) % 1440 + 1440) % 1440;
            return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
        });
        return result(
            bedtimes.join(' · '),
            localized(language, 'أوقات نوم مقترحة', 'Suggested bedtimes'),
            localized(language, 'لـ 6 أو 5 أو 4 دورات نوم كاملة.', 'For 6, 5 or 4 complete sleep cycles.'),
        );
    },
});

const pregnancyDueDate = Object.freeze({
    id: 'pregnancy-due-date-calculator',
    category: 'health',
    icon: '280',
    title: Object.freeze({ ar: 'حاسبة موعد الولادة', en: 'Pregnancy Due Date Calculator' }),
    description: Object.freeze({ ar: 'قدّري موعد الولادة من تاريخ أول يوم لآخر دورة.', en: 'Estimate a due date from the first day of the last period.' }),
    note: Object.freeze({ ar: 'تقدير عام لا يغني عن متابعة الطبيب والفحص بالموجات.', en: 'A general estimate that does not replace prenatal care or ultrasound.' }),
    inputs: Object.freeze([
        Object.freeze({ id: 'lastPeriod', type: 'date', label: Object.freeze({ ar: 'أول يوم لآخر دورة', en: 'First day of last period' }), unit: Object.freeze({ ar: '', en: '' }) }),
    ]),
    calculate(values, language) {
        const lastPeriod = new Date(`${values.lastPeriod}T00:00:00Z`);
        if (Number.isNaN(lastPeriod.getTime())) {
            throw new Error(localized(language, 'التاريخ غير صالح.', 'Invalid date.'));
        }
        const dueDate = new Date(lastPeriod.getTime() + (280 * 86_400_000));
        return result(
            dueDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                dateStyle: 'long',
                timeZone: 'UTC',
            }),
            localized(language, 'موعد الولادة التقديري', 'Estimated due date'),
            localized(language, 'بعد 280 يومًا من بداية آخر دورة.', '280 days after the last period began.'),
        );
    },
});

const healthDefinitions = Object.freeze({
    'calorie-deficit-calculator': calorieDeficit,
    'macro-calculator': macroCalculator,
    'protein-intake-calculator': proteinCalculator,
    'body-fat-calculator': bodyFat,
    'lean-body-mass-calculator': leanMass,
    'waist-to-height-ratio-calculator': waistHeight,
    'target-heart-rate-calculator': heartRate,
    'running-pace-calculator': runningPace,
    'sleep-cycle-calculator': sleepCycle,
    'pregnancy-due-date-calculator': pregnancyDueDate,
});

export { healthDefinitions };

// END OF FILE
