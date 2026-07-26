const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 10,
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
        min: options.min ?? -1_000_000_000,
        max: options.max ?? 1_000_000_000,
        step: options.step ?? 1,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(sample),
    });
}

function textInput(id, label, sample) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 3,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: sample,
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((item) => Object.freeze({
            value: item.value,
            label: Object.freeze(item.label),
        }))),
    });
}

function assertInteger(value, language) {
    if (!Number.isSafeInteger(value)) {
        throw new Error(localized(language, 'يجب إدخال عدد صحيح آمن.', 'Enter a safe integer.'));
    }
}

function factorial(value) {
    let total = 1;
    for (let number = 2; number <= value; number += 1) {
        total *= number;
    }
    return total;
}

const primeChecker = Object.freeze({
    id: 'prime-number-checker',
    category: 'math',
    icon: 'P',
    title: Object.freeze({ ar: 'فاحص الأعداد الأولية', en: 'Prime Number Checker' }),
    description: Object.freeze({ ar: 'تحقق مما إذا كان العدد الصحيح أوليًا واعرض أصغر عامل عند وجوده.', en: 'Check whether an integer is prime and show its smallest factor when composite.' }),
    note: Object.freeze({ ar: 'العدد الأولي أكبر من واحد ولا يقبل القسمة إلا على نفسه والواحد.', en: 'A prime is greater than one and divisible only by itself and one.' }),
    inputs: Object.freeze([numberInput('number', { ar: 'العدد الصحيح', en: 'Integer' }, 97, { min: 2, max: 1_000_000_000 })]),
    calculate(values, language) {
        assertInteger(values.number, language);
        if (values.number === 2) {
            return result(localized(language, 'أولي', 'Prime'), localized(language, 'لا توجد عوامل أخرى', 'No other factors'));
        }
        if (values.number % 2 === 0) {
            return result(localized(language, 'غير أولي', 'Composite'), localized(language, 'أصغر عامل: 2', 'Smallest factor: 2'));
        }
        for (let divisor = 3; divisor <= Math.sqrt(values.number); divisor += 2) {
            if (values.number % divisor === 0) {
                return result(
                    localized(language, 'غير أولي', 'Composite'),
                    localized(language, `أصغر عامل: ${divisor}`, `Smallest factor: ${divisor}`),
                );
            }
        }
        return result(localized(language, 'أولي', 'Prime'), localized(language, 'لا توجد عوامل أخرى', 'No other factors'));
    },
});

const factorialCalculator = Object.freeze({
    id: 'factorial-calculator',
    category: 'math',
    icon: 'n!',
    title: Object.freeze({ ar: 'حاسبة المضروب', en: 'Factorial Calculator' }),
    description: Object.freeze({ ar: 'احسب مضروب عدد صحيح غير سالب حتى 170.', en: 'Calculate the factorial of a non-negative integer up to 170.' }),
    note: Object.freeze({ ar: 'مضروب الصفر يساوي واحدًا.', en: 'Zero factorial equals one.' }),
    inputs: Object.freeze([numberInput('number', { ar: 'العدد n', en: 'Number n' }, 10, { min: 0, max: 170 })]),
    calculate(values, language) {
        assertInteger(values.number, language);
        const value = factorial(values.number);
        return result(
            Number.isFinite(value) ? value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '∞',
            `${values.number}!`,
        );
    },
});

const permutationCalculator = Object.freeze({
    id: 'permutation-calculator',
    category: 'math',
    icon: 'nPr',
    title: Object.freeze({ ar: 'حاسبة التباديل', en: 'Permutation Calculator' }),
    description: Object.freeze({ ar: 'احسب عدد طرق ترتيب r عناصر من مجموعة تحتوي على n عنصرًا.', en: 'Calculate ordered arrangements of r items selected from n items.' }),
    note: Object.freeze({ ar: 'الترتيب مهم في التباديل.', en: 'Order matters in permutations.' }),
    inputs: Object.freeze([
        numberInput('n', { ar: 'إجمالي العناصر n', en: 'Total items n' }, 10, { min: 0, max: 170 }),
        numberInput('r', { ar: 'العناصر المختارة r', en: 'Selected items r' }, 3, { min: 0, max: 170 }),
    ]),
    calculate(values, language) {
        assertInteger(values.n, language);
        assertInteger(values.r, language);
        if (values.r > values.n) {
            throw new Error(localized(language, 'يجب ألا تتجاوز r قيمة n.', 'r cannot exceed n.'));
        }
        let value = 1;
        for (let number = values.n - values.r + 1; number <= values.n; number += 1) {
            value *= number;
        }
        return result(format(value), `P(${values.n}, ${values.r})`);
    },
});

const combinationCalculator = Object.freeze({
    id: 'combination-calculator',
    category: 'math',
    icon: 'nCr',
    title: Object.freeze({ ar: 'حاسبة التوافيق', en: 'Combination Calculator' }),
    description: Object.freeze({ ar: 'احسب عدد طرق اختيار r عناصر من n دون اعتبار الترتيب.', en: 'Calculate ways to choose r items from n without considering order.' }),
    note: Object.freeze({ ar: 'تستخدم خوارزمية تقلل العمليات الحسابية للأعداد الكبيرة.', en: 'Uses a multiplicative method that limits unnecessary operations.' }),
    inputs: Object.freeze([
        numberInput('n', { ar: 'إجمالي العناصر n', en: 'Total items n' }, 10, { min: 0, max: 170 }),
        numberInput('r', { ar: 'العناصر المختارة r', en: 'Selected items r' }, 3, { min: 0, max: 170 }),
    ]),
    calculate(values, language) {
        assertInteger(values.n, language);
        assertInteger(values.r, language);
        if (values.r > values.n) {
            throw new Error(localized(language, 'يجب ألا تتجاوز r قيمة n.', 'r cannot exceed n.'));
        }
        const selected = Math.min(values.r, values.n - values.r);
        let value = 1;
        for (let index = 1; index <= selected; index += 1) {
            value = (value * (values.n - selected + index)) / index;
        }
        return result(format(value), `C(${values.n}, ${values.r})`);
    },
});

const logarithmCalculator = Object.freeze({
    id: 'logarithm-calculator',
    category: 'math',
    icon: 'log',
    title: Object.freeze({ ar: 'حاسبة اللوغاريتم', en: 'Logarithm Calculator' }),
    description: Object.freeze({ ar: 'احسب لوغاريتم عدد موجب بأي أساس صالح.', en: 'Calculate the logarithm of a positive number in any valid base.' }),
    note: Object.freeze({ ar: 'يجب أن يكون الأساس موجبًا ولا يساوي واحدًا.', en: 'The base must be positive and cannot equal one.' }),
    inputs: Object.freeze([
        numberInput('number', { ar: 'العدد', en: 'Number' }, 1000, { min: 0.000000001, step: 0.000001 }),
        numberInput('base', { ar: 'الأساس', en: 'Base' }, 10, { min: 0.000000001, step: 0.000001 }),
    ]),
    calculate(values, language) {
        if (values.base === 1) {
            throw new Error(localized(language, 'الأساس لا يمكن أن يساوي واحدًا.', 'The base cannot equal one.'));
        }
        const value = Math.log(values.number) / Math.log(values.base);
        return result(format(value), `log${values.base}(${values.number})`);
    },
});

const exponentCalculator = Object.freeze({
    id: 'exponent-calculator',
    category: 'math',
    icon: 'xʸ',
    title: Object.freeze({ ar: 'حاسبة الأسس', en: 'Exponent Calculator' }),
    description: Object.freeze({ ar: 'ارفع أي أساس عددي إلى قوة موجبة أو سالبة أو كسرية.', en: 'Raise a numeric base to a positive, negative or fractional power.' }),
    note: Object.freeze({ ar: 'قد تكون بعض النتائج غير محدودة أو غير حقيقية.', en: 'Some combinations may produce non-finite or non-real results.' }),
    inputs: Object.freeze([
        numberInput('base', { ar: 'الأساس', en: 'Base' }, 2, { step: 0.01 }),
        numberInput('exponent', { ar: 'الأس', en: 'Exponent' }, 10, { min: -1000, max: 1000, step: 0.01 }),
    ]),
    calculate(values, language) {
        const value = values.base ** values.exponent;
        if (!Number.isFinite(value) || Number.isNaN(value)) {
            throw new Error(localized(language, 'النتيجة خارج النطاق العددي المدعوم.', 'The result is outside the supported numeric range.'));
        }
        return result(format(value), `${values.base} ^ ${values.exponent}`);
    },
});

const nthRootCalculator = Object.freeze({
    id: 'nth-root-calculator',
    category: 'math',
    icon: 'ⁿ√',
    title: Object.freeze({ ar: 'حاسبة الجذر النوني', en: 'Nth Root Calculator' }),
    description: Object.freeze({ ar: 'احسب الجذر التربيعي أو التكعيبي أو أي جذر صحيح موجب.', en: 'Calculate square, cube or any positive integer root.' }),
    note: Object.freeze({ ar: 'تُقبل الأعداد السالبة فقط مع درجة جذر فردية.', en: 'Negative values are accepted only with odd root degrees.' }),
    inputs: Object.freeze([
        numberInput('number', { ar: 'العدد', en: 'Number' }, 125, { step: 0.01 }),
        numberInput('degree', { ar: 'درجة الجذر', en: 'Root degree' }, 3, { min: 1, max: 100 }),
    ]),
    calculate(values, language) {
        assertInteger(values.degree, language);
        if (values.number < 0 && values.degree % 2 === 0) {
            throw new Error(localized(language, 'لا يوجد جذر حقيقي زوجي لعدد سالب.', 'A negative number has no real even root.'));
        }
        const value = values.number < 0
            ? -((-values.number) ** (1 / values.degree))
            : values.number ** (1 / values.degree);
        return result(format(value), localized(language, `الجذر من الدرجة ${values.degree}`, `Root degree ${values.degree}`));
    },
});

const percentageErrorCalculator = Object.freeze({
    id: 'percentage-error-calculator',
    category: 'math',
    icon: '±%',
    title: Object.freeze({ ar: 'حاسبة نسبة الخطأ', en: 'Percentage Error Calculator' }),
    description: Object.freeze({ ar: 'قارن القيمة المقاسة بالقيمة الحقيقية واحسب نسبة الخطأ المطلق.', en: 'Compare an observed value with the true value and calculate absolute percentage error.' }),
    note: Object.freeze({ ar: 'لا يمكن أن تساوي القيمة الحقيقية صفرًا.', en: 'The true value cannot be zero.' }),
    inputs: Object.freeze([
        numberInput('observed', { ar: 'القيمة المقاسة', en: 'Observed value' }, 9.5, { step: 0.0001 }),
        numberInput('actual', { ar: 'القيمة الحقيقية', en: 'Actual value' }, 10, { step: 0.0001 }),
    ]),
    calculate(values, language) {
        if (values.actual === 0) {
            throw new Error(localized(language, 'القيمة الحقيقية لا يمكن أن تساوي صفرًا.', 'The actual value cannot be zero.'));
        }
        const difference = Math.abs(values.observed - values.actual);
        const percentage = (difference / Math.abs(values.actual)) * 100;
        return result(`${format(percentage)}%`, localized(language, 'نسبة الخطأ المطلق', 'Absolute percentage error'), localized(language, `الفرق المطلق: ${format(difference)}`, `Absolute difference: ${format(difference)}`));
    },
});

const scientificNotationConverter = Object.freeze({
    id: 'scientific-notation-converter',
    category: 'math',
    icon: '×10ⁿ',
    title: Object.freeze({ ar: 'محول الصيغة العلمية', en: 'Scientific Notation Converter' }),
    description: Object.freeze({ ar: 'حوّل الأعداد العشرية إلى صيغة علمية أو أعد الصيغة العلمية إلى رقم.', en: 'Convert decimals to scientific notation or notation back to a number.' }),
    note: Object.freeze({ ar: 'تُقبل الصيغ مثل 6.02e23.', en: 'Notation such as 6.02e23 is accepted.' }),
    inputs: Object.freeze([
        textInput('value', { ar: 'القيمة', en: 'Value' }, '602000000000000000000000'),
        selectInput('operation', { ar: 'نوع التحويل', en: 'Conversion' }, [
            { value: 'to-scientific', label: { ar: 'إلى صيغة علمية', en: 'To scientific notation' } },
            { value: 'to-decimal', label: { ar: 'إلى رقم عشري', en: 'To decimal number' } },
        ]),
    ]),
    calculate(values, language) {
        const numeric = Number(values.value.trim());
        if (!Number.isFinite(numeric)) {
            throw new Error(localized(language, 'أدخل رقمًا صالحًا.', 'Enter a valid number.'));
        }
        const value = values.operation === 'to-scientific'
            ? numeric.toExponential(10).replace(/\.?0+e/, 'e')
            : numeric.toLocaleString('en-US', { useGrouping: false, maximumFractionDigits: 20 });
        return result(value, localized(language, 'نتيجة التحويل', 'Converted value'));
    },
});

const baseOptions = Object.freeze([
    { value: '2', label: { ar: 'ثنائي (2)', en: 'Binary (2)' } },
    { value: '8', label: { ar: 'ثماني (8)', en: 'Octal (8)' } },
    { value: '10', label: { ar: 'عشري (10)', en: 'Decimal (10)' } },
    { value: '16', label: { ar: 'سداسي عشري (16)', en: 'Hexadecimal (16)' } },
]);

const numberBaseConverter = Object.freeze({
    id: 'number-base-converter',
    category: 'math',
    icon: '01',
    title: Object.freeze({ ar: 'محول أنظمة الأعداد', en: 'Number Base Converter' }),
    description: Object.freeze({ ar: 'حوّل الأعداد الصحيحة بين الأنظمة الثنائي والثماني والعشري والسداسي عشري.', en: 'Convert integers between binary, octal, decimal and hexadecimal bases.' }),
    note: Object.freeze({ ar: 'يدعم الأعداد الصحيحة الكبيرة والسالبة دون فقد الدقة.', en: 'Supports large and negative integers without precision loss.' }),
    inputs: Object.freeze([
        textInput('value', { ar: 'العدد', en: 'Number' }, 'FF'),
        selectInput('fromBase', { ar: 'من أساس', en: 'From base' }, baseOptions),
        selectInput('toBase', { ar: 'إلى أساس', en: 'To base' }, baseOptions),
    ]),
    calculate(values, language) {
        const fromBase = Number(values.fromBase);
        const toBase = Number(values.toBase);
        const source = values.value.trim();
        const patterns = {
            2: /^-?[01]+$/i,
            8: /^-?[0-7]+$/i,
            10: /^-?\d+$/i,
            16: /^-?[0-9a-f]+$/i,
        };
        if (!patterns[fromBase].test(source)) {
            throw new Error(localized(language, 'العدد لا يطابق نظام الإدخال.', 'The number does not match the input base.'));
        }
        const negative = source.startsWith('-');
        const digits = negative ? source.slice(1) : source;
        const prefixes = { 2: '0b', 8: '0o', 10: '', 16: '0x' };
        const parsed = BigInt(`${negative ? '-' : ''}${prefixes[fromBase]}${digits}`);
        return result(parsed.toString(toBase).toUpperCase(), localized(language, `بالأساس ${toBase}`, `Base ${toBase}`));
    },
});

const advancedMathDefinitions = Object.freeze({
    [primeChecker.id]: primeChecker,
    [factorialCalculator.id]: factorialCalculator,
    [permutationCalculator.id]: permutationCalculator,
    [combinationCalculator.id]: combinationCalculator,
    [logarithmCalculator.id]: logarithmCalculator,
    [exponentCalculator.id]: exponentCalculator,
    [nthRootCalculator.id]: nthRootCalculator,
    [percentageErrorCalculator.id]: percentageErrorCalculator,
    [scientificNotationConverter.id]: scientificNotationConverter,
    [numberBaseConverter.id]: numberBaseConverter,
});

export { advancedMathDefinitions };

// END OF FILE
