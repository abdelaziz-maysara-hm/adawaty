function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function numberInput(id, label, placeholder, min = -1e12, max = 1e12, step = 0.01) {
    return Object.freeze({
        id, type: 'number', min, max, step,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function textInput(id, label, placeholder) {
    return Object.freeze({
        id, type: 'textarea', rows: 4,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function algebraTool(config) {
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

function parseCoefficients(value, language) {
    const numbers = value.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
    if (!numbers.length || numbers.some((number) => !Number.isFinite(number))) {
        throw new Error(localized(language, 'أدخل معاملات رقمية صالحة.', 'Enter valid numeric coefficients.'));
    }
    return numbers;
}

const linearEquation = algebraTool({
    id: 'linear-equation-solver',
    icon: 'ax+b=c',
    title: { ar: 'حل المعادلة الخطية', en: 'Linear Equation Solver' },
    description: { ar: 'حل معادلة من الصورة ax + b = c مع التحقق من الحالات الخاصة.', en: 'Solve an equation in the form ax + b = c, including special cases.' },
    note: { ar: 'إذا كان a يساوي صفرًا فقد لا يوجد حل أو توجد حلول غير محدودة.', en: 'When a is zero, there may be no solution or infinitely many solutions.' },
    inputs: [
        numberInput('a', { ar: 'المعامل a', en: 'Coefficient a' }, 3),
        numberInput('b', { ar: 'الثابت b', en: 'Constant b' }, 5),
        numberInput('c', { ar: 'الطرف c', en: 'Right side c' }, 20),
    ],
    calculate(values, language) {
        if (values.a === 0) {
            return values.b === values.c
                ? output(localized(language, 'حلول غير محدودة', 'Infinite solutions'), localized(language, 'النتيجة', 'Result'))
                : output(localized(language, 'لا يوجد حل', 'No solution'), localized(language, 'النتيجة', 'Result'));
        }
        return output(round((values.c - values.b) / values.a), 'x');
    },
});

const simultaneousEquations = algebraTool({
    id: 'two-variable-equation-solver',
    icon: '2×2',
    title: { ar: 'حل معادلتين بمجهولين', en: 'Two-Variable Equation Solver' },
    description: { ar: 'حل نظام ax + by = c لمعادلتين باستخدام قاعدة كرامر.', en: 'Solve two equations in the form ax + by = c using Cramer’s rule.' },
    note: { ar: 'يجب ألا يساوي محدد النظام صفرًا للحصول على حل وحيد.', en: 'The system determinant must be non-zero for a unique solution.' },
    inputs: [
        numberInput('a1', { ar: 'a₁', en: 'a₁' }, 2),
        numberInput('b1', { ar: 'b₁', en: 'b₁' }, 1),
        numberInput('c1', { ar: 'c₁', en: 'c₁' }, 7),
        numberInput('a2', { ar: 'a₂', en: 'a₂' }, 1),
        numberInput('b2', { ar: 'b₂', en: 'b₂' }, -1),
        numberInput('c2', { ar: 'c₂', en: 'c₂' }, 2),
    ],
    calculate(values, language) {
        const determinant = values.a1 * values.b2 - values.a2 * values.b1;
        if (determinant === 0) throw new Error(localized(language, 'النظام لا يملك حلًا وحيدًا.', 'The system has no unique solution.'));
        const x = (values.c1 * values.b2 - values.c2 * values.b1) / determinant;
        const y = (values.a1 * values.c2 - values.a2 * values.c1) / determinant;
        return output(`x = ${round(x)}\ny = ${round(y)}`, localized(language, 'حل النظام', 'System solution'), `det = ${round(determinant)}`);
    },
});

const slopeCalculator = algebraTool({
    id: 'slope-calculator',
    icon: 'm',
    title: { ar: 'حاسبة الميل', en: 'Slope Calculator' },
    description: { ar: 'احسب ميل الخط المستقيم المار بنقطتين.', en: 'Calculate the slope of the line through two points.' },
    note: { ar: 'الخط الرأسي له ميل غير معرّف.', en: 'A vertical line has an undefined slope.' },
    inputs: [
        numberInput('x1', { ar: 'x₁', en: 'x₁' }, 1),
        numberInput('y1', { ar: 'y₁', en: 'y₁' }, 2),
        numberInput('x2', { ar: 'x₂', en: 'x₂' }, 4),
        numberInput('y2', { ar: 'y₂', en: 'y₂' }, 8),
    ],
    calculate(values, language) {
        if (values.x1 === values.x2) return output(localized(language, 'غير معرّف', 'Undefined'), localized(language, 'الميل', 'Slope'), localized(language, 'خط رأسي', 'Vertical line'));
        const slope = (values.y2 - values.y1) / (values.x2 - values.x1);
        return output(round(slope), localized(language, 'الميل m', 'Slope m'));
    },
});

const midpointCalculator = algebraTool({
    id: 'midpoint-calculator',
    icon: 'M',
    title: { ar: 'حاسبة نقطة المنتصف', en: 'Midpoint Calculator' },
    description: { ar: 'احسب نقطة المنتصف بين نقطتين في المستوى.', en: 'Calculate the midpoint between two points in a plane.' },
    note: { ar: 'يُحسب متوسط إحداثيي x ومتوسط إحداثيي y.', en: 'Averages the x coordinates and the y coordinates.' },
    inputs: [
        numberInput('x1', { ar: 'x₁', en: 'x₁' }, 1),
        numberInput('y1', { ar: 'y₁', en: 'y₁' }, 2),
        numberInput('x2', { ar: 'x₂', en: 'x₂' }, 5),
        numberInput('y2', { ar: 'y₂', en: 'y₂' }, 8),
    ],
    calculate(values, language) {
        return output(`(${round((values.x1 + values.x2) / 2)}, ${round((values.y1 + values.y2) / 2)})`, localized(language, 'نقطة المنتصف', 'Midpoint'));
    },
});

const arithmeticNth = algebraTool({
    id: 'arithmetic-sequence-calculator',
    icon: 'aₙ',
    title: { ar: 'حاسبة المتتابعة الحسابية', en: 'Arithmetic Sequence Calculator' },
    description: { ar: 'احسب الحد النوني في متتابعة حسابية.', en: 'Calculate the nth term of an arithmetic sequence.' },
    note: { ar: 'تستخدم الصيغة aₙ = a₁ + (n−1)d.', en: 'Uses aₙ = a₁ + (n−1)d.' },
    inputs: [
        numberInput('first', { ar: 'الحد الأول', en: 'First term' }, 3),
        numberInput('difference', { ar: 'الفرق المشترك', en: 'Common difference' }, 4),
        numberInput('term', { ar: 'رقم الحد n', en: 'Term number n' }, 10, 1, 1e9, 1),
    ],
    calculate(values, language) {
        return output(round(values.first + (values.term - 1) * values.difference), localized(language, `الحد a${values.term}`, `Term a${values.term}`));
    },
});

const geometricNth = algebraTool({
    id: 'geometric-sequence-calculator',
    icon: 'aₙ=r',
    title: { ar: 'حاسبة المتتابعة الهندسية', en: 'Geometric Sequence Calculator' },
    description: { ar: 'احسب الحد النوني في متتابعة هندسية.', en: 'Calculate the nth term of a geometric sequence.' },
    note: { ar: 'تستخدم الصيغة aₙ = a₁rⁿ⁻¹.', en: 'Uses aₙ = a₁rⁿ⁻¹.' },
    inputs: [
        numberInput('first', { ar: 'الحد الأول', en: 'First term' }, 2),
        numberInput('ratio', { ar: 'النسبة المشتركة', en: 'Common ratio' }, 3),
        numberInput('term', { ar: 'رقم الحد n', en: 'Term number n' }, 6, 1, 10000, 1),
    ],
    calculate(values, language) {
        const result = values.first * values.ratio ** (values.term - 1);
        if (!Number.isFinite(result)) throw new Error(localized(language, 'الناتج خارج النطاق العددي.', 'Result exceeds the numeric range.'));
        return output(round(result), localized(language, `الحد a${values.term}`, `Term a${values.term}`));
    },
});

const arithmeticSum = algebraTool({
    id: 'arithmetic-series-sum-calculator',
    icon: 'Σa',
    title: { ar: 'مجموع المتسلسلة الحسابية', en: 'Arithmetic Series Sum Calculator' },
    description: { ar: 'احسب مجموع أول n حدود من متتابعة حسابية.', en: 'Calculate the sum of the first n terms of an arithmetic sequence.' },
    note: { ar: 'يستخدم Sₙ = n/2 × (2a₁ + (n−1)d).', en: 'Uses Sₙ = n/2 × (2a₁ + (n−1)d).' },
    inputs: [
        numberInput('first', { ar: 'الحد الأول', en: 'First term' }, 3),
        numberInput('difference', { ar: 'الفرق المشترك', en: 'Common difference' }, 4),
        numberInput('terms', { ar: 'عدد الحدود', en: 'Number of terms' }, 10, 1, 1e9, 1),
    ],
    calculate(values, language) {
        const result = values.terms / 2 * (2 * values.first + (values.terms - 1) * values.difference);
        return output(round(result), localized(language, `المجموع S${values.terms}`, `Sum S${values.terms}`));
    },
});

const geometricSum = algebraTool({
    id: 'geometric-series-sum-calculator',
    icon: 'Σr',
    title: { ar: 'مجموع المتسلسلة الهندسية', en: 'Geometric Series Sum Calculator' },
    description: { ar: 'احسب مجموع أول n حدود من متتابعة هندسية.', en: 'Calculate the sum of the first n terms of a geometric sequence.' },
    note: { ar: 'عندما تكون النسبة 1 يكون المجموع n مضروبًا في الحد الأول.', en: 'When the ratio is 1, the sum is n times the first term.' },
    inputs: [
        numberInput('first', { ar: 'الحد الأول', en: 'First term' }, 2),
        numberInput('ratio', { ar: 'النسبة المشتركة', en: 'Common ratio' }, 3),
        numberInput('terms', { ar: 'عدد الحدود', en: 'Number of terms' }, 5, 1, 10000, 1),
    ],
    calculate(values, language) {
        const result = values.ratio === 1
            ? values.first * values.terms
            : values.first * (1 - values.ratio ** values.terms) / (1 - values.ratio);
        if (!Number.isFinite(result)) throw new Error(localized(language, 'الناتج خارج النطاق العددي.', 'Result exceeds the numeric range.'));
        return output(round(result), localized(language, `المجموع S${values.terms}`, `Sum S${values.terms}`));
    },
});

const polynomialEvaluator = algebraTool({
    id: 'polynomial-evaluator',
    icon: 'P(x)',
    title: { ar: 'تقييم كثيرة الحدود', en: 'Polynomial Evaluator' },
    description: { ar: 'احسب قيمة كثيرة حدود من معاملات مرتبة تنازليًا.', en: 'Evaluate a polynomial from coefficients ordered by descending power.' },
    note: { ar: 'مثال: المعاملات 2، 3، 1 تمثل 2x² + 3x + 1.', en: 'Example: coefficients 2, 3, 1 represent 2x² + 3x + 1.' },
    inputs: [
        textInput('coefficients', { ar: 'المعاملات', en: 'Coefficients' }, '2, 3, 1'),
        numberInput('x', { ar: 'قيمة x', en: 'Value of x' }, 4),
    ],
    calculate(values, language) {
        const coefficients = parseCoefficients(values.coefficients, language);
        const result = coefficients.reduce((total, coefficient) => total * values.x + coefficient, 0);
        return output(round(result), localized(language, `P(${values.x})`, `P(${values.x})`), localized(language, `الدرجة ${coefficients.length - 1}`, `Degree ${coefficients.length - 1}`));
    },
});

const matrixCalculator = algebraTool({
    id: 'two-by-two-matrix-calculator',
    icon: '[2×2]',
    title: { ar: 'حاسبة مصفوفة 2×2', en: '2×2 Matrix Calculator' },
    description: { ar: 'احسب محدد ومعكوس مصفوفة 2×2.', en: 'Calculate the determinant and inverse of a 2×2 matrix.' },
    note: { ar: 'لا يوجد معكوس عندما يكون المحدد صفرًا.', en: 'An inverse does not exist when the determinant is zero.' },
    inputs: [
        numberInput('a', { ar: 'a₁₁', en: 'a₁₁' }, 4),
        numberInput('b', { ar: 'a₁₂', en: 'a₁₂' }, 7),
        numberInput('c', { ar: 'a₂₁', en: 'a₂₁' }, 2),
        numberInput('d', { ar: 'a₂₂', en: 'a₂₂' }, 6),
    ],
    calculate(values, language) {
        const determinant = values.a * values.d - values.b * values.c;
        if (determinant === 0) return output('det = 0', localized(language, 'مصفوفة غير قابلة للعكس', 'Singular matrix'));
        const inverse = [
            [values.d / determinant, -values.b / determinant],
            [-values.c / determinant, values.a / determinant],
        ].map((row) => row.map((value) => round(value)));
        return output(`det = ${round(determinant)}\n[${inverse[0].join(', ')}]\n[${inverse[1].join(', ')}]`, localized(language, 'المحدد والمعكوس', 'Determinant and inverse'));
    },
});

const algebraSequenceDefinitions = Object.freeze({
    [linearEquation.id]: linearEquation,
    [simultaneousEquations.id]: simultaneousEquations,
    [slopeCalculator.id]: slopeCalculator,
    [midpointCalculator.id]: midpointCalculator,
    [arithmeticNth.id]: arithmeticNth,
    [geometricNth.id]: geometricNth,
    [arithmeticSum.id]: arithmeticSum,
    [geometricSum.id]: geometricSum,
    [polynomialEvaluator.id]: polynomialEvaluator,
    [matrixCalculator.id]: matrixCalculator,
});

export { algebraSequenceDefinitions };

// END OF FILE
