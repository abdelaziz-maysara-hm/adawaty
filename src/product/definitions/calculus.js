function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function numberInput(id, ar, en, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? -1e9,
        max: options.max ?? 1e9,
        step: options.step ?? 0.01,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function textInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((item) => Object.freeze(item))),
    });
}

function tool(config) {
    return Object.freeze({
        id: config.id,
        category: 'math',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate: config.calculate,
    });
}

function round(value, digits = 6) {
    const result = Number(value.toFixed(digits));
    return Object.is(result, -0) ? 0 : result;
}

function parseCoefficients(text, language) {
    const values = String(text)
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map(Number);
    if (values.length === 0 || values.some((value) => !Number.isFinite(value))) {
        throw new Error(localized(
            language,
            'أدخل معاملات رقمية مفصولة بفواصل.',
            'Enter numeric coefficients separated by commas.',
        ));
    }
    if (values.length > 30) {
        throw new Error(localized(language, 'الحد الأقصى 30 معاملًا.', 'A maximum of 30 coefficients is supported.'));
    }
    return values;
}

function evaluatePolynomial(coefficients, x) {
    return coefficients.reduce((value, coefficient) => value * x + coefficient, 0);
}

function derivativeCoefficients(coefficients) {
    const degree = coefficients.length - 1;
    return coefficients.slice(0, -1).map((coefficient, index) => coefficient * (degree - index));
}

function polynomialText(coefficients) {
    if (coefficients.length === 0 || coefficients.every((value) => value === 0)) return '0';
    const degree = coefficients.length - 1;
    const terms = [];
    coefficients.forEach((coefficient, index) => {
        if (coefficient === 0) return;
        const power = degree - index;
        const absolute = Math.abs(round(coefficient));
        const magnitude = power > 0 && absolute === 1 ? '' : String(absolute);
        const variable = power === 0 ? '' : power === 1 ? 'x' : `x^${power}`;
        const term = `${magnitude}${variable}`;
        if (terms.length === 0) terms.push(coefficient < 0 ? `−${term}` : term);
        else terms.push(`${coefficient < 0 ? '−' : '+'} ${term}`);
    });
    return terms.join(' ');
}

const powerDerivative = tool({
    id: 'power-rule-derivative-calculator',
    icon: 'd/dx',
    title: { ar: 'حاسبة مشتقة دالة القوة', en: 'Power Rule Derivative Calculator' },
    description: { ar: 'اشتق الدالة axⁿ باستخدام قاعدة القوة.', en: 'Differentiate axⁿ using the power rule.' },
    note: { ar: 'تستخدم المشتقة anxⁿ⁻¹.', en: 'Uses the derivative anxⁿ⁻¹.' },
    inputs: [
        numberInput('coefficient', 'المعامل a', 'Coefficient a', 3),
        numberInput('exponent', 'الأس n', 'Exponent n', 4),
    ],
    calculate(values, language) {
        const coefficient = values.coefficient * values.exponent;
        const exponent = values.exponent - 1;
        const derivative = coefficient === 0
            ? '0'
            : exponent === 0
                ? String(round(coefficient))
                : `${round(coefficient)}x^${round(exponent)}`;
        return output(
            derivative,
            localized(language, 'المشتقة', 'Derivative'),
        );
    },
});

const polynomialDerivative = tool({
    id: 'polynomial-derivative-calculator',
    icon: 'P′(x)',
    title: { ar: 'حاسبة مشتقة كثير الحدود', en: 'Polynomial Derivative Calculator' },
    description: { ar: 'أوجد مشتقة كثير حدود من معاملاته المرتبة تنازليًا.', en: 'Differentiate a polynomial from coefficients in descending order.' },
    note: { ar: 'مثال: 2, 3, 1 تمثل 2x² + 3x + 1.', en: 'Example: 2, 3, 1 represents 2x² + 3x + 1.' },
    inputs: [textInput('coefficients', 'المعاملات', 'Coefficients', '2, 3, 1')],
    calculate(values, language) {
        const coefficients = parseCoefficients(values.coefficients, language);
        return output(polynomialText(derivativeCoefficients(coefficients)), localized(language, 'المشتقة', 'Derivative'));
    },
});

const definiteIntegral = tool({
    id: 'polynomial-definite-integral-calculator',
    icon: '∫',
    title: { ar: 'التكامل المحدد لكثير الحدود', en: 'Polynomial Definite Integral Calculator' },
    description: { ar: 'احسب التكامل المحدد لكثير حدود بين حدين.', en: 'Calculate a polynomial definite integral between two bounds.' },
    note: { ar: 'المعاملات مرتبة من أعلى قوة إلى الحد الثابت.', en: 'Coefficients run from the highest power to the constant term.' },
    inputs: [
        textInput('coefficients', 'المعاملات', 'Coefficients', '3, 0, 2'),
        numberInput('lower', 'الحد السفلي', 'Lower bound', 0),
        numberInput('upper', 'الحد العلوي', 'Upper bound', 2),
    ],
    calculate(values, language) {
        const coefficients = parseCoefficients(values.coefficients, language);
        const degree = coefficients.length;
        const antiderivative = (x) => coefficients.reduce(
            (sum, coefficient, index) => sum + coefficient * x ** (degree - index) / (degree - index),
            0,
        );
        return output(round(antiderivative(values.upper) - antiderivative(values.lower)), localized(language, 'قيمة التكامل', 'Integral value'));
    },
});

const averageRate = tool({
    id: 'average-rate-of-change-calculator',
    icon: 'Δy/Δx',
    title: { ar: 'متوسط معدل التغير', en: 'Average Rate of Change Calculator' },
    description: { ar: 'احسب متوسط معدل تغير كثير حدود على فترة.', en: 'Calculate the average rate of change of a polynomial over an interval.' },
    note: { ar: 'يجب أن تكون نقطتا الفترة مختلفتين.', en: 'The interval endpoints must be different.' },
    inputs: [
        textInput('coefficients', 'المعاملات', 'Coefficients', '1, 0, 0'),
        numberInput('start', 'بداية الفترة', 'Interval start', 1),
        numberInput('end', 'نهاية الفترة', 'Interval end', 3),
    ],
    calculate(values, language) {
        if (values.start === values.end) throw new Error(localized(language, 'نقطتا الفترة متساويتان.', 'Interval endpoints are equal.'));
        const coefficients = parseCoefficients(values.coefficients, language);
        const rate = (evaluatePolynomial(coefficients, values.end) - evaluatePolynomial(coefficients, values.start))
            / (values.end - values.start);
        return output(round(rate), localized(language, 'متوسط معدل التغير', 'Average rate of change'));
    },
});

const tangentLine = tool({
    id: 'polynomial-tangent-line-calculator',
    icon: 'T(x)',
    title: { ar: 'معادلة المماس لكثير الحدود', en: 'Polynomial Tangent Line Calculator' },
    description: { ar: 'أوجد معادلة خط المماس لكثير حدود عند نقطة.', en: 'Find the tangent-line equation of a polynomial at a point.' },
    note: { ar: 'تحسب الأداة قيمة الدالة والمشتقة عند x₀.', en: 'Evaluates the function and derivative at x₀.' },
    inputs: [
        textInput('coefficients', 'المعاملات', 'Coefficients', '1, 0, 0'),
        numberInput('x', 'النقطة x₀', 'Point x₀', 2),
    ],
    calculate(values, language) {
        const coefficients = parseCoefficients(values.coefficients, language);
        const slope = evaluatePolynomial(derivativeCoefficients(coefficients), values.x);
        const y = evaluatePolynomial(coefficients, values.x);
        const intercept = y - slope * values.x;
        return output(
            `y = ${round(slope)}x ${intercept < 0 ? '−' : '+'} ${round(Math.abs(intercept))}`,
            localized(language, 'معادلة المماس', 'Tangent line'),
            `f(${round(values.x)}) = ${round(y)}`,
        );
    },
});

const polynomialLimit = tool({
    id: 'polynomial-limit-calculator',
    icon: 'lim',
    title: { ar: 'حاسبة نهاية كثير الحدود', en: 'Polynomial Limit Calculator' },
    description: { ar: 'احسب نهاية كثير حدود عند قيمة محددة.', en: 'Calculate the limit of a polynomial at a finite value.' },
    note: { ar: 'كثيرات الحدود متصلة؛ لذلك تساوي النهاية قيمة التعويض المباشر.', en: 'Polynomials are continuous, so direct substitution applies.' },
    inputs: [
        textInput('coefficients', 'المعاملات', 'Coefficients', '2, -3, 1'),
        numberInput('approach', 'تقترب x من', 'x approaches', 2),
    ],
    calculate(values, language) {
        const coefficients = parseCoefficients(values.coefficients, language);
        return output(round(evaluatePolynomial(coefficients, values.approach)), localized(language, 'قيمة النهاية', 'Limit value'));
    },
});

const riemannSum = tool({
    id: 'riemann-sum-calculator',
    icon: 'ΣΔx',
    title: { ar: 'حاسبة مجموع ريمان', en: 'Riemann Sum Calculator' },
    description: { ar: 'قرّب المساحة تحت كثير حدود بمجموع ريمان.', en: 'Approximate the area under a polynomial with a Riemann sum.' },
    note: { ar: 'زيادة عدد الفترات تحسن التقريب عادةً.', en: 'More subintervals generally improve the approximation.' },
    inputs: [
        textInput('coefficients', 'المعاملات', 'Coefficients', '1, 0'),
        numberInput('lower', 'الحد السفلي', 'Lower bound', 0),
        numberInput('upper', 'الحد العلوي', 'Upper bound', 2),
        numberInput('intervals', 'عدد الفترات', 'Subintervals', 100, { min: 1, max: 100000, step: 1 }),
        selectInput('method', 'طريقة العينة', 'Sample method', [
            { value: 'left', label: { ar: 'الطرف الأيسر', en: 'Left endpoint' } },
            { value: 'right', label: { ar: 'الطرف الأيمن', en: 'Right endpoint' } },
            { value: 'midpoint', label: { ar: 'نقطة المنتصف', en: 'Midpoint' } },
        ]),
    ],
    calculate(values, language) {
        if (!Number.isInteger(values.intervals)) throw new Error(localized(language, 'عدد الفترات يجب أن يكون صحيحًا.', 'Subinterval count must be an integer.'));
        const coefficients = parseCoefficients(values.coefficients, language);
        const width = (values.upper - values.lower) / values.intervals;
        const offset = values.method === 'left' ? 0 : values.method === 'right' ? 1 : 0.5;
        let sum = 0;
        for (let index = 0; index < values.intervals; index += 1) {
            sum += evaluatePolynomial(coefficients, values.lower + (index + offset) * width);
        }
        return output(round(sum * width), localized(language, 'مجموع ريمان', 'Riemann sum'));
    },
});

const exponentialDerivative = tool({
    id: 'exponential-function-derivative-calculator',
    icon: 'aᵡ',
    title: { ar: 'مشتقة الدالة الأسية', en: 'Exponential Function Derivative' },
    description: { ar: 'احسب قيمة مشتقة الدالة c·aˣ عند نقطة.', en: 'Evaluate the derivative of c·aˣ at a point.' },
    note: { ar: 'تستخدم المشتقة c·aˣ·ln(a)، ويجب أن يكون الأساس موجبًا.', en: 'Uses c·aˣ·ln(a), with a positive base.' },
    inputs: [
        numberInput('coefficient', 'المعامل c', 'Coefficient c', 2),
        numberInput('base', 'الأساس a', 'Base a', 3, { min: 0.000001 }),
        numberInput('x', 'القيمة x', 'Value x', 2),
    ],
    calculate(values, language) {
        const result = values.coefficient * values.base ** values.x * Math.log(values.base);
        return output(round(result), localized(language, 'قيمة المشتقة', 'Derivative value'));
    },
});

const numericalDerivative = tool({
    id: 'numerical-derivative-calculator',
    icon: 'f′≈',
    title: { ar: 'حاسبة المشتقة العددية', en: 'Numerical Derivative Calculator' },
    description: { ar: 'قرّب مشتقة كثير حدود بالفروق المركزية.', en: 'Approximate a polynomial derivative with central differences.' },
    note: { ar: 'يمكن ضبط خطوة صغيرة موجبة للحساب.', en: 'A small positive calculation step can be configured.' },
    inputs: [
        textInput('coefficients', 'المعاملات', 'Coefficients', '1, 0, 0'),
        numberInput('x', 'القيمة x', 'Value x', 2),
        numberInput('step', 'الخطوة h', 'Step h', 0.0001, { min: 0.000000001, max: 1 }),
    ],
    calculate(values, language) {
        const coefficients = parseCoefficients(values.coefficients, language);
        const result = (
            evaluatePolynomial(coefficients, values.x + values.step)
            - evaluatePolynomial(coefficients, values.x - values.step)
        ) / (2 * values.step);
        return output(round(result), localized(language, 'المشتقة العددية', 'Numerical derivative'));
    },
});

const partialDerivative = tool({
    id: 'quadratic-partial-derivative-calculator',
    icon: '∂f',
    title: { ar: 'المشتقات الجزئية لدالة تربيعية', en: 'Quadratic Partial Derivative Calculator' },
    description: { ar: 'احسب ∂f/∂x و∂f/∂y للدالة ax² + bxy + cy².', en: 'Evaluate ∂f/∂x and ∂f/∂y for ax² + bxy + cy².' },
    note: { ar: 'تُحسب القيمتان عند النقطة (x, y).', en: 'Both derivatives are evaluated at (x, y).' },
    inputs: [
        numberInput('a', 'المعامل a', 'Coefficient a', 1),
        numberInput('b', 'المعامل b', 'Coefficient b', 2),
        numberInput('c', 'المعامل c', 'Coefficient c', 3),
        numberInput('x', 'القيمة x', 'Value x', 2),
        numberInput('y', 'القيمة y', 'Value y', 4),
    ],
    calculate(values, language) {
        const dx = 2 * values.a * values.x + values.b * values.y;
        const dy = values.b * values.x + 2 * values.c * values.y;
        return output(`∂f/∂x = ${round(dx)}\n∂f/∂y = ${round(dy)}`, localized(language, 'المشتقات الجزئية', 'Partial derivatives'));
    },
});

const calculusDefinitions = Object.freeze({
    [powerDerivative.id]: powerDerivative,
    [polynomialDerivative.id]: polynomialDerivative,
    [definiteIntegral.id]: definiteIntegral,
    [averageRate.id]: averageRate,
    [tangentLine.id]: tangentLine,
    [polynomialLimit.id]: polynomialLimit,
    [riemannSum.id]: riemannSum,
    [exponentialDerivative.id]: exponentialDerivative,
    [numericalDerivative.id]: numericalDerivative,
    [partialDerivative.id]: partialDerivative,
});

export { calculusDefinitions };

// END OF FILE
