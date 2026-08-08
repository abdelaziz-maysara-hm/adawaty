function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
function format(value) {
    return formatter.format(value);
}

function result(value, label, details = '') {
    return { value: String(value), label, details };
}

function numberInput(id, ar, en, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000,
        step: options.step ?? 0.01,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map(([value, optAr, optEn]) => Object.freeze({
            value,
            label: Object.freeze({ ar: optAr, en: optEn }),
        }))),
    });
}

const kgUnit = Object.freeze({ ar: 'كجم', en: 'kg' });
const cmUnit = Object.freeze({ ar: 'سم', en: 'cm' });
const moneyUnit = Object.freeze({ ar: '', en: '' });
const percentUnit = Object.freeze({ ar: '%', en: '%' });

function classifyBmi(bmi, language) {
    if (bmi < 18.5) return localized(language, 'نقص في الوزن', 'Underweight');
    if (bmi < 25) return localized(language, 'وزن صحي', 'Healthy weight');
    if (bmi < 30) return localized(language, 'زيادة في الوزن', 'Overweight');
    return localized(language, 'سمنة', 'Obese');
}

const bmiCalculator = Object.freeze({
    id: 'bmi-calculator',
    category: 'health',
    icon: 'BMI',
    title: Object.freeze({ ar: 'حاسبة مؤشر كتلة الجسم (BMI)', en: 'BMI Calculator' }),
    description: Object.freeze({
        ar: 'احسب مؤشر كتلة الجسم من الوزن والطول، واعرف تصنيفك الصحي العام حسب المعيار الدولي.',
        en: 'Calculate your Body Mass Index from weight and height, and see your general health category by the standard international scale.',
    }),
    note: Object.freeze({
        ar: 'مؤشر كتلة الجسم مقياس عام تقريبي ولا يأخذ في الاعتبار الكتلة العضلية أو توزيع الدهون؛ استشر مختصًا لتقييم صحي دقيق.',
        en: 'BMI is a general approximate measure and doesn\u2019t account for muscle mass or fat distribution; consult a professional for an accurate health assessment.',
    }),
    inputs: Object.freeze([
        numberInput('weight', 'الوزن', 'Weight', 70, { min: 1, max: 500, unit: kgUnit }),
        numberInput('height', 'الطول', 'Height', 175, { min: 30, max: 272, unit: cmUnit }),
    ]),
    calculate(values, language) {
        const heightMeters = values.height / 100;
        const bmi = values.weight / (heightMeters * heightMeters);
        const rounded = Math.round(bmi * 10) / 10;

        return result(
            format(rounded),
            classifyBmi(bmi, language),
            localized(
                language,
                'النطاق الطبيعي المعتاد بين 18.5 و24.9.',
                'The commonly used normal range is between 18.5 and 24.9.',
            ),
        );
    },
});

const percentageCalculator = Object.freeze({
    id: 'percentage-calculator',
    category: 'math',
    icon: '%',
    title: Object.freeze({ ar: 'حاسبة النسبة المئوية', en: 'Percentage Calculator' }),
    description: Object.freeze({
        ar: 'احسب النسبة المئوية بثلاث طرق شائعة: كام % من رقم، رقم كام % من رقم تاني، أو نسبة التغيّر بين رقمين.',
        en: 'Calculate percentages three common ways: X% of a number, what % one number is of another, or the percent change between two numbers.',
    }),
    note: Object.freeze({
        ar: 'اختر طريقة الحساب المناسبة لسؤالك أولًا، ثم أدخل الرقمين المطلوبين.',
        en: 'Pick the calculation mode matching your question first, then enter the two required numbers.',
    }),
    inputs: Object.freeze([
        selectInput('mode', 'طريقة الحساب', 'Calculation mode', [
            ['percentOf', 'كام % من رقم', 'X% of a number'],
            ['whatPercent', 'رقم كام % من رقم تاني', 'What % is one number of another'],
            ['percentChange', 'نسبة التغيّر بين رقمين', 'Percent change between two numbers'],
        ]),
        numberInput('first', 'الرقم الأول (أو النسبة)', 'First number (or percentage)', 20, { min: -1_000_000_000, max: 1_000_000_000 }),
        numberInput('second', 'الرقم الثاني', 'Second number', 150, { min: -1_000_000_000, max: 1_000_000_000 }),
    ]),
    calculate(values, language) {
        const { mode, first, second } = values;

        if (mode === 'percentOf') {
            const value = (first / 100) * second;
            return result(
                format(value),
                localized(language, `${format(first)}% من ${format(second)}`, `${format(first)}% of ${format(second)}`),
            );
        }

        if (mode === 'whatPercent') {
            if (second === 0) {
                throw new Error(localized(language, 'الرقم الثاني لا يمكن أن يكون صفرًا.', 'The second number cannot be zero.'));
            }
            const value = (first / second) * 100;
            return result(
                `${format(value)}%`,
                localized(
                    language,
                    `${format(first)} يمثل هذه النسبة من ${format(second)}`,
                    `${format(first)} is this percentage of ${format(second)}`,
                ),
            );
        }

        if (first === 0) {
            throw new Error(localized(language, 'الرقم الأول لا يمكن أن يكون صفرًا لحساب نسبة التغيّر.', 'The first number cannot be zero for percent change.'));
        }
        const change = ((second - first) / first) * 100;
        return result(
            `${change >= 0 ? '+' : ''}${format(change)}%`,
            localized(
                language,
                change >= 0 ? 'زيادة' : 'نقصان',
                change >= 0 ? 'Increase' : 'Decrease',
            ),
            localized(language, `من ${format(first)} إلى ${format(second)}`, `From ${format(first)} to ${format(second)}`),
        );
    },
});

const discountCalculator = Object.freeze({
    id: 'discount-calculator',
    category: 'finance',
    icon: '−%',
    title: Object.freeze({ ar: 'حاسبة الخصم', en: 'Discount Calculator' }),
    description: Object.freeze({
        ar: 'احسب السعر بعد الخصم ومقدار التوفير من السعر الأصلي ونسبة الخصم.',
        en: 'Calculate the price after a discount and the amount saved from the original price and discount percentage.',
    }),
    note: Object.freeze({
        ar: 'يدعم أي نسبة خصم من 0 إلى 100%.',
        en: 'Supports any discount percentage from 0 to 100%.',
    }),
    inputs: Object.freeze([
        numberInput('price', 'السعر الأصلي', 'Original price', 500, { min: 0.01, unit: moneyUnit }),
        numberInput('discount', 'نسبة الخصم', 'Discount percentage', 25, { min: 0, max: 100, unit: percentUnit }),
    ]),
    calculate(values, language) {
        const discountAmount = values.price * (values.discount / 100);
        const finalPrice = values.price - discountAmount;

        return result(
            format(finalPrice),
            localized(language, 'السعر بعد الخصم', 'Price after discount'),
            localized(language, `توفير: ${format(discountAmount)}`, `You save: ${format(discountAmount)}`),
        );
    },
});

const demandCalculatorDefinitions = Object.freeze({
    [bmiCalculator.id]: bmiCalculator,
    [percentageCalculator.id]: percentageCalculator,
    [discountCalculator.id]: discountCalculator,
});

export { demandCalculatorDefinitions };

// END OF FILE
