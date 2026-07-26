const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 6,
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
        min: options.min ?? -1_000_000_000,
        max: options.max ?? 1_000_000_000,
        step: options.step ?? 0.01,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function result(value, label, details = '') {
    return { value, label, details };
}

function gcd(first, second) {
    let left = Math.abs(Math.round(first));
    let right = Math.abs(Math.round(second));
    while (right !== 0) {
        [left, right] = [right, left % right];
    }
    return left;
}

const gcdCalculator = Object.freeze({
    id: 'gcd-calculator',
    category: 'math',
    icon: 'GCD',
    title: Object.freeze({ ar: 'حاسبة القاسم المشترك الأكبر', en: 'GCD Calculator' }),
    description: Object.freeze({ ar: 'احسب أكبر عدد صحيح يقسم عددين دون باقٍ.', en: 'Find the greatest common divisor of two integers.' }),
    note: Object.freeze({ ar: 'تستخدم الأداة خوارزمية إقليدس.', en: 'Uses the Euclidean algorithm.' }),
    inputs: Object.freeze([
        numberInput('first', { ar: 'العدد الأول', en: 'First integer' }, 48, { min: 1, step: 1 }),
        numberInput('second', { ar: 'العدد الثاني', en: 'Second integer' }, 18, { min: 1, step: 1 }),
    ]),
    calculate(values, language) {
        return result(
            `${gcd(values.first, values.second)}`,
            localized(language, 'القاسم المشترك الأكبر', 'Greatest common divisor'),
        );
    },
});

const lcmCalculator = Object.freeze({
    id: 'lcm-calculator',
    category: 'math',
    icon: 'LCM',
    title: Object.freeze({ ar: 'حاسبة المضاعف المشترك الأصغر', en: 'LCM Calculator' }),
    description: Object.freeze({ ar: 'احسب أصغر مضاعف موجب مشترك لعددين.', en: 'Find the least common multiple of two integers.' }),
    note: Object.freeze({ ar: 'تعتمد النتيجة على القاسم المشترك الأكبر.', en: 'The result is derived using the GCD.' }),
    inputs: Object.freeze([
        numberInput('first', { ar: 'العدد الأول', en: 'First integer' }, 12, { min: 1, step: 1 }),
        numberInput('second', { ar: 'العدد الثاني', en: 'Second integer' }, 18, { min: 1, step: 1 }),
    ]),
    calculate(values, language) {
        const value = Math.abs(
            Math.round(values.first) * Math.round(values.second),
        ) / gcd(values.first, values.second);
        return result(
            format(value),
            localized(language, 'المضاعف المشترك الأصغر', 'Least common multiple'),
        );
    },
});

const fractionSimplifier = Object.freeze({
    id: 'fraction-simplifier',
    category: 'math',
    icon: '½',
    title: Object.freeze({ ar: 'مبسّط الكسور', en: 'Fraction Simplifier' }),
    description: Object.freeze({ ar: 'اختصر أي كسر إلى أبسط صورة ممكنة.', en: 'Reduce a fraction to its simplest form.' }),
    note: Object.freeze({ ar: 'يجب ألا يساوي المقام صفرًا.', en: 'The denominator cannot be zero.' }),
    inputs: Object.freeze([
        numberInput('numerator', { ar: 'البسط', en: 'Numerator' }, 42, { step: 1 }),
        numberInput('denominator', { ar: 'المقام', en: 'Denominator' }, 56, { step: 1 }),
    ]),
    calculate(values, language) {
        const numerator = Math.round(values.numerator);
        const denominator = Math.round(values.denominator);
        if (denominator === 0) {
            throw new Error(localized(language, 'المقام لا يمكن أن يساوي صفرًا.', 'Denominator cannot be zero.'));
        }
        const divisor = gcd(numerator, denominator);
        const sign = denominator < 0 ? -1 : 1;
        const simplifiedNumerator = (numerator / divisor) * sign;
        const simplifiedDenominator = Math.abs(denominator / divisor);
        return result(
            `${simplifiedNumerator}/${simplifiedDenominator}`,
            localized(language, 'أبسط صورة', 'Simplified fraction'),
            localized(language, `القاسم المستخدم: ${divisor}`, `Common divisor: ${divisor}`),
        );
    },
});

const quadraticCalculator = Object.freeze({
    id: 'quadratic-equation-calculator',
    category: 'math',
    icon: 'x²',
    title: Object.freeze({ ar: 'حاسبة المعادلة التربيعية', en: 'Quadratic Equation Calculator' }),
    description: Object.freeze({ ar: 'حل معادلة ax² + bx + c = 0 واعرض الجذور.', en: 'Solve ax² + bx + c = 0 and display its roots.' }),
    note: Object.freeze({ ar: 'تعرض الأداة الجذور الحقيقية أو المركبة.', en: 'Displays real or complex roots.' }),
    inputs: Object.freeze([
        numberInput('a', { ar: 'المعامل a', en: 'Coefficient a' }, 1),
        numberInput('b', { ar: 'المعامل b', en: 'Coefficient b' }, -3),
        numberInput('c', { ar: 'المعامل c', en: 'Coefficient c' }, 2),
    ]),
    calculate(values, language) {
        if (values.a === 0) {
            throw new Error(localized(language, 'المعامل a يجب ألا يساوي صفرًا.', 'Coefficient a cannot be zero.'));
        }
        const discriminant = (values.b ** 2) - (4 * values.a * values.c);
        if (discriminant >= 0) {
            const squareRoot = Math.sqrt(discriminant);
            const first = (-values.b + squareRoot) / (2 * values.a);
            const second = (-values.b - squareRoot) / (2 * values.a);
            return result(
                `x₁ = ${format(first)}, x₂ = ${format(second)}`,
                localized(language, 'الجذور الحقيقية', 'Real roots'),
                `Δ = ${format(discriminant)}`,
            );
        }
        const real = -values.b / (2 * values.a);
        const imaginary = Math.sqrt(-discriminant) / Math.abs(2 * values.a);
        return result(
            `x = ${format(real)} ± ${format(imaginary)}i`,
            localized(language, 'جذور مركبة', 'Complex roots'),
            `Δ = ${format(discriminant)}`,
        );
    },
});

const circleCalculator = Object.freeze({
    id: 'circle-calculator',
    category: 'math',
    icon: 'π',
    title: Object.freeze({ ar: 'حاسبة الدائرة', en: 'Circle Calculator' }),
    description: Object.freeze({ ar: 'احسب مساحة الدائرة ومحيطها وقطرها من نصف القطر.', en: 'Calculate circle area, circumference and diameter from radius.' }),
    note: Object.freeze({ ar: 'تستخدم قيمة π المدمجة عالية الدقة.', en: 'Uses the built-in high-precision value of π.' }),
    inputs: Object.freeze([
        numberInput('radius', { ar: 'نصف القطر', en: 'Radius' }, 5, { min: 0.000001 }),
    ]),
    calculate(values, language) {
        const area = Math.PI * (values.radius ** 2);
        const circumference = 2 * Math.PI * values.radius;
        return result(
            format(area),
            localized(language, 'مساحة الدائرة', 'Circle area'),
            localized(language, `المحيط: ${format(circumference)} — القطر: ${format(values.radius * 2)}`, `Circumference: ${format(circumference)} — diameter: ${format(values.radius * 2)}`),
        );
    },
});

const triangleCalculator = Object.freeze({
    id: 'triangle-area-calculator',
    category: 'math',
    icon: '△',
    title: Object.freeze({ ar: 'حاسبة مساحة المثلث', en: 'Triangle Area Calculator' }),
    description: Object.freeze({ ar: 'احسب مساحة المثلث من طول القاعدة والارتفاع.', en: 'Calculate triangle area from base and height.' }),
    note: Object.freeze({ ar: 'يجب قياس القاعدة والارتفاع بنفس الوحدة.', en: 'Base and height must use the same unit.' }),
    inputs: Object.freeze([
        numberInput('base', { ar: 'طول القاعدة', en: 'Base length' }, 10, { min: 0.000001 }),
        numberInput('height', { ar: 'الارتفاع', en: 'Height' }, 6, { min: 0.000001 }),
    ]),
    calculate(values, language) {
        return result(
            format((values.base * values.height) / 2),
            localized(language, 'مساحة المثلث', 'Triangle area'),
            '½ × base × height',
        );
    },
});

const rectangleCalculator = Object.freeze({
    id: 'rectangle-calculator',
    category: 'math',
    icon: '▭',
    title: Object.freeze({ ar: 'حاسبة المستطيل', en: 'Rectangle Calculator' }),
    description: Object.freeze({ ar: 'احسب مساحة المستطيل ومحيطه وقطره.', en: 'Calculate rectangle area, perimeter and diagonal.' }),
    note: Object.freeze({ ar: 'يجب قياس الطول والعرض بنفس الوحدة.', en: 'Length and width must use the same unit.' }),
    inputs: Object.freeze([
        numberInput('length', { ar: 'الطول', en: 'Length' }, 10, { min: 0.000001 }),
        numberInput('width', { ar: 'العرض', en: 'Width' }, 5, { min: 0.000001 }),
    ]),
    calculate(values, language) {
        const area = values.length * values.width;
        const perimeter = 2 * (values.length + values.width);
        const diagonal = Math.hypot(values.length, values.width);
        return result(
            format(area),
            localized(language, 'مساحة المستطيل', 'Rectangle area'),
            localized(language, `المحيط: ${format(perimeter)} — القطر: ${format(diagonal)}`, `Perimeter: ${format(perimeter)} — diagonal: ${format(diagonal)}`),
        );
    },
});

const pythagoreanCalculator = Object.freeze({
    id: 'pythagorean-theorem-calculator',
    category: 'math',
    icon: 'a²',
    title: Object.freeze({ ar: 'حاسبة نظرية فيثاغورس', en: 'Pythagorean Theorem Calculator' }),
    description: Object.freeze({ ar: 'احسب طول الوتر من ضلعي مثلث قائم الزاوية.', en: 'Calculate a right triangle hypotenuse from two legs.' }),
    note: Object.freeze({ ar: 'تطبق العلاقة c² = a² + b².', en: 'Applies c² = a² + b².' }),
    inputs: Object.freeze([
        numberInput('a', { ar: 'الضلع a', en: 'Side a' }, 3, { min: 0.000001 }),
        numberInput('b', { ar: 'الضلع b', en: 'Side b' }, 4, { min: 0.000001 }),
    ]),
    calculate(values, language) {
        return result(
            format(Math.hypot(values.a, values.b)),
            localized(language, 'طول الوتر c', 'Hypotenuse c'),
            `√(${format(values.a)}² + ${format(values.b)}²)`,
        );
    },
});

const deviationOptions = Object.freeze([
    Object.freeze({ value: 'population', label: Object.freeze({ ar: 'مجتمع كامل', en: 'Population' }) }),
    Object.freeze({ value: 'sample', label: Object.freeze({ ar: 'عينة', en: 'Sample' }) }),
]);

const standardDeviation = Object.freeze({
    id: 'standard-deviation-calculator',
    category: 'math',
    icon: 'σ',
    title: Object.freeze({ ar: 'حاسبة الانحراف المعياري', en: 'Standard Deviation Calculator' }),
    description: Object.freeze({ ar: 'احسب المتوسط والانحراف المعياري لخمس قيم.', en: 'Calculate mean and standard deviation for five values.' }),
    note: Object.freeze({ ar: 'اختر ما إذا كانت القيم مجتمعًا كاملًا أو عينة.', en: 'Choose population or sample standard deviation.' }),
    inputs: Object.freeze([
        Object.freeze({
            id: 'type',
            type: 'select',
            label: Object.freeze({ ar: 'نوع البيانات', en: 'Data type' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: deviationOptions,
        }),
        ...[1, 2, 3, 4, 5].map((number) => numberInput(
            `value${number}`,
            { ar: `القيمة ${number}`, en: `Value ${number}` },
            number,
        )),
    ]),
    calculate(values, language) {
        const numbers = [1, 2, 3, 4, 5].map(
            (number) => values[`value${number}`],
        );
        const mean = numbers.reduce((sum, value) => sum + value, 0)
            / numbers.length;
        const squaredDifferences = numbers.reduce(
            (sum, value) => sum + ((value - mean) ** 2),
            0,
        );
        const divisor = values.type === 'sample'
            ? numbers.length - 1
            : numbers.length;
        const deviation = Math.sqrt(squaredDifferences / divisor);
        return result(
            format(deviation),
            localized(language, 'الانحراف المعياري', 'Standard deviation'),
            localized(language, `المتوسط: ${format(mean)}`, `Mean: ${format(mean)}`),
        );
    },
});

const probabilityCalculator = Object.freeze({
    id: 'probability-calculator',
    category: 'math',
    icon: 'P',
    title: Object.freeze({ ar: 'حاسبة الاحتمالات', en: 'Probability Calculator' }),
    description: Object.freeze({ ar: 'احسب احتمال حدث من النتائج المرغوبة وإجمالي النتائج.', en: 'Calculate event probability from favorable and total outcomes.' }),
    note: Object.freeze({ ar: 'تفترض الأداة أن جميع النتائج متساوية الاحتمال.', en: 'Assumes all outcomes are equally likely.' }),
    inputs: Object.freeze([
        numberInput('favorable', { ar: 'النتائج المرغوبة', en: 'Favorable outcomes' }, 1, { min: 0, step: 1 }),
        numberInput('total', { ar: 'إجمالي النتائج', en: 'Total outcomes' }, 6, { min: 1, step: 1 }),
    ]),
    calculate(values, language) {
        if (values.favorable > values.total) {
            throw new Error(localized(language, 'النتائج المرغوبة لا تتجاوز الإجمالي.', 'Favorable outcomes cannot exceed the total.'));
        }
        const probability = values.favorable / values.total;
        return result(
            `${format(probability * 100)}%`,
            localized(language, 'احتمال الحدث', 'Event probability'),
            localized(language, `بالصيغة العشرية: ${format(probability)}`, `Decimal: ${format(probability)}`),
        );
    },
});

const mathDefinitions = Object.freeze({
    'gcd-calculator': gcdCalculator,
    'lcm-calculator': lcmCalculator,
    'fraction-simplifier': fractionSimplifier,
    'quadratic-equation-calculator': quadraticCalculator,
    'circle-calculator': circleCalculator,
    'triangle-area-calculator': triangleCalculator,
    'rectangle-calculator': rectangleCalculator,
    'pythagorean-theorem-calculator': pythagoreanCalculator,
    'standard-deviation-calculator': standardDeviation,
    'probability-calculator': probabilityCalculator,
});

export { mathDefinitions };

// END OF FILE
