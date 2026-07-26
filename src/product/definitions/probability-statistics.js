function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function numberInput(id, label, placeholder, min, max, step = 0.01) {
    return Object.freeze({
        id, type: 'number', min, max, step,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function textInput(id, label, placeholder) {
    return Object.freeze({
        id, type: 'textarea', rows: 5,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id, type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze(option))),
    });
}

function statisticsTool(config) {
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

function parseNumbers(value, language, minimum = 1) {
    const numbers = value.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
    if (numbers.length < minimum || numbers.some((number) => !Number.isFinite(number))) {
        throw new Error(localized(language, `أدخل ${minimum} قيم صالحة على الأقل.`, `Enter at least ${minimum} valid values.`));
    }
    return numbers;
}

function round(value, digits = 6) {
    return Number(value.toFixed(digits));
}

function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function factorialRatio(n, k) {
    const smaller = Math.min(k, n - k);
    let result = 1;
    for (let index = 1; index <= smaller; index += 1) {
        result = result * (n - smaller + index) / index;
    }
    return result;
}

const dataset = textInput('values', { ar: 'مجموعة البيانات', en: 'Dataset' }, '2, 4, 8, 16');

const geometricMean = statisticsTool({
    id: 'geometric-mean-calculator',
    icon: 'G̅',
    title: { ar: 'حاسبة المتوسط الهندسي', en: 'Geometric Mean Calculator' },
    description: { ar: 'احسب المتوسط الهندسي للقيم الموجبة مثل معدلات النمو والنسب.', en: 'Calculate the geometric mean of positive values such as growth rates and ratios.' },
    note: { ar: 'يجب أن تكون جميع القيم أكبر من صفر.', en: 'All values must be greater than zero.' },
    inputs: [dataset],
    calculate(values, language) {
        const numbers = parseNumbers(values.values, language);
        if (numbers.some((number) => number <= 0)) throw new Error(localized(language, 'يجب أن تكون القيم موجبة.', 'Values must be positive.'));
        const result = Math.exp(numbers.reduce((sum, number) => sum + Math.log(number), 0) / numbers.length);
        return output(round(result), localized(language, 'المتوسط الهندسي', 'Geometric mean'));
    },
});

const harmonicMean = statisticsTool({
    id: 'harmonic-mean-calculator',
    icon: 'H̅',
    title: { ar: 'حاسبة المتوسط التوافقي', en: 'Harmonic Mean Calculator' },
    description: { ar: 'احسب متوسط المعدلات والنسب عندما يكون البسط ثابتًا.', en: 'Average rates and ratios when the numerator remains constant.' },
    note: { ar: 'لا يمكن أن تحتوي البيانات على صفر.', en: 'The dataset cannot contain zero.' },
    inputs: [dataset],
    calculate(values, language) {
        const numbers = parseNumbers(values.values, language);
        if (numbers.some((number) => number === 0)) throw new Error(localized(language, 'لا يمكن استخدام القيمة صفر.', 'Zero values are not allowed.'));
        return output(round(numbers.length / numbers.reduce((sum, number) => sum + 1 / number, 0)), localized(language, 'المتوسط التوافقي', 'Harmonic mean'));
    },
});

const rangeCalculator = statisticsTool({
    id: 'statistical-range-calculator',
    icon: 'max−min',
    title: { ar: 'حاسبة المدى الإحصائي', en: 'Statistical Range Calculator' },
    description: { ar: 'احسب الفرق بين أكبر وأصغر قيمة مع عرض الحدين.', en: 'Calculate the difference between maximum and minimum values.' },
    note: { ar: 'المدى مقياس سريع لانتشار البيانات.', en: 'Range is a quick measure of data spread.' },
    inputs: [dataset],
    calculate(values, language) {
        const numbers = parseNumbers(values.values, language);
        const minimum = Math.min(...numbers);
        const maximum = Math.max(...numbers);
        return output(round(maximum - minimum), localized(language, 'المدى', 'Range'), `Min: ${minimum} · Max: ${maximum}`);
    },
});

const meanAbsoluteDeviation = statisticsTool({
    id: 'mean-absolute-deviation-calculator',
    icon: 'MAD',
    title: { ar: 'حاسبة متوسط الانحراف المطلق', en: 'Mean Absolute Deviation Calculator' },
    description: { ar: 'احسب متوسط المسافات المطلقة بين القيم والمتوسط الحسابي.', en: 'Calculate the average absolute distance from the arithmetic mean.' },
    note: { ar: 'يعرض مقياسًا للتشتت بنفس وحدة البيانات.', en: 'Provides a spread measure in the same unit as the data.' },
    inputs: [dataset],
    calculate(values, language) {
        const numbers = parseNumbers(values.values, language);
        const mean = average(numbers);
        const deviation = numbers.reduce((sum, number) => sum + Math.abs(number - mean), 0) / numbers.length;
        return output(round(deviation), localized(language, 'متوسط الانحراف المطلق', 'Mean absolute deviation'), `Mean: ${round(mean)}`);
    },
});

const standardError = statisticsTool({
    id: 'standard-error-calculator',
    icon: 'SE',
    title: { ar: 'حاسبة الخطأ المعياري', en: 'Standard Error Calculator' },
    description: { ar: 'احسب الخطأ المعياري للمتوسط من الانحراف المعياري وحجم العينة.', en: 'Calculate the standard error of the mean from standard deviation and sample size.' },
    note: { ar: 'الخطأ المعياري يساوي الانحراف المعياري مقسومًا على الجذر التربيعي لحجم العينة.', en: 'Standard error equals standard deviation divided by the square root of sample size.' },
    inputs: [
        numberInput('standardDeviation', { ar: 'الانحراف المعياري', en: 'Standard deviation' }, 12, 0, 1e12),
        numberInput('sampleSize', { ar: 'حجم العينة', en: 'Sample size' }, 100, 1, 1e9, 1),
    ],
    calculate(values, language) {
        return output(round(values.standardDeviation / Math.sqrt(values.sampleSize)), localized(language, 'الخطأ المعياري', 'Standard error'));
    },
});

const confidenceOptions = [
    { value: '90', label: { ar: '90%', en: '90%' } },
    { value: '95', label: { ar: '95%', en: '95%' } },
    { value: '99', label: { ar: '99%', en: '99%' } },
];

const confidenceInterval = statisticsTool({
    id: 'confidence-interval-calculator',
    icon: 'CI',
    title: { ar: 'حاسبة فترة الثقة', en: 'Confidence Interval Calculator' },
    description: { ar: 'قدّر فترة الثقة لمتوسط باستخدام الانحراف المعياري وحجم العينة.', en: 'Estimate a confidence interval for a mean using standard deviation and sample size.' },
    note: { ar: 'تستخدم الأداة قيم Z لمستويات الثقة الشائعة.', en: 'Uses Z critical values for common confidence levels.' },
    inputs: [
        numberInput('mean', { ar: 'متوسط العينة', en: 'Sample mean' }, 75, -1e12, 1e12),
        numberInput('standardDeviation', { ar: 'الانحراف المعياري', en: 'Standard deviation' }, 10, 0, 1e12),
        numberInput('sampleSize', { ar: 'حجم العينة', en: 'Sample size' }, 100, 1, 1e9, 1),
        selectInput('confidence', { ar: 'مستوى الثقة', en: 'Confidence level' }, confidenceOptions),
    ],
    calculate(values, language) {
        const zValues = { 90: 1.644854, 95: 1.959964, 99: 2.575829 };
        const margin = zValues[values.confidence] * values.standardDeviation / Math.sqrt(values.sampleSize);
        return output(`${round(values.mean - margin)} – ${round(values.mean + margin)}`, localized(language, `فترة ثقة ${values.confidence}%`, `${values.confidence}% confidence interval`), `Margin: ±${round(margin)}`);
    },
});

const sampleSize = statisticsTool({
    id: 'sample-size-calculator',
    icon: 'n',
    title: { ar: 'حاسبة حجم العينة', en: 'Sample Size Calculator' },
    description: { ar: 'قدّر حجم العينة المطلوب لنسبة سكانية بهامش خطأ محدد.', en: 'Estimate the sample size needed for a population proportion and margin of error.' },
    note: { ar: 'عند غياب تقدير مسبق استخدم نسبة متوقعة 50% للحصول على الحجم الأكثر تحفظًا.', en: 'Use 50% expected proportion for the most conservative estimate.' },
    inputs: [
        numberInput('proportion', { ar: 'النسبة المتوقعة', en: 'Expected proportion' }, 50, 0.01, 99.99),
        numberInput('margin', { ar: 'هامش الخطأ', en: 'Margin of error' }, 5, 0.01, 99),
        selectInput('confidence', { ar: 'مستوى الثقة', en: 'Confidence level' }, confidenceOptions),
        numberInput('population', { ar: 'حجم المجتمع (0 لغير محدود)', en: 'Population size (0 for unlimited)' }, 0, 0, 1e12, 1),
    ],
    calculate(values, language) {
        const zValues = { 90: 1.644854, 95: 1.959964, 99: 2.575829 };
        const proportion = values.proportion / 100;
        const margin = values.margin / 100;
        const unlimited = zValues[values.confidence] ** 2 * proportion * (1 - proportion) / margin ** 2;
        const corrected = values.population > 0
            ? unlimited / (1 + (unlimited - 1) / values.population)
            : unlimited;
        return output(Math.ceil(corrected), localized(language, 'حجم العينة المطلوب', 'Required sample size'));
    },
});

const binomialProbability = statisticsTool({
    id: 'binomial-probability-calculator',
    icon: 'P(X=k)',
    title: { ar: 'حاسبة الاحتمال الثنائي', en: 'Binomial Probability Calculator' },
    description: { ar: 'احسب احتمال عدد محدد من النجاحات في تجارب مستقلة.', en: 'Calculate the probability of an exact number of successes in independent trials.' },
    note: { ar: 'يفترض ثبات احتمال النجاح واستقلال التجارب.', en: 'Assumes a constant success probability and independent trials.' },
    inputs: [
        numberInput('trials', { ar: 'عدد التجارب', en: 'Number of trials' }, 10, 0, 1000, 1),
        numberInput('successes', { ar: 'عدد النجاحات', en: 'Number of successes' }, 3, 0, 1000, 1),
        numberInput('probability', { ar: 'احتمال النجاح', en: 'Success probability' }, 50, 0, 100),
    ],
    calculate(values, language) {
        if (values.successes > values.trials) throw new Error(localized(language, 'لا يمكن أن تتجاوز النجاحات عدد التجارب.', 'Successes cannot exceed trials.'));
        const probability = values.probability / 100;
        const result = factorialRatio(values.trials, values.successes)
            * probability ** values.successes
            * (1 - probability) ** (values.trials - values.successes);
        return output(`${round(result * 100)}%`, localized(language, 'الاحتمال', 'Probability'), `Decimal: ${round(result, 8)}`);
    },
});

const oddsConverter = statisticsTool({
    id: 'odds-probability-converter',
    icon: 'P↔O',
    title: { ar: 'محول الاحتمال ونسبة الترجيح', en: 'Odds and Probability Converter' },
    description: { ar: 'حوّل بين الاحتمال المئوي ونسبة الترجيح إلى واحد.', en: 'Convert between percentage probability and odds-to-one.' },
    note: { ar: 'الترجيح المعروض هو النجاحات المتوقعة مقابل إخفاق واحد.', en: 'Displayed odds are expected successes for each one failure.' },
    inputs: [
        numberInput('value', { ar: 'القيمة', en: 'Value' }, 75, 0, 1e9),
        selectInput('direction', { ar: 'التحويل', en: 'Conversion' }, [
            { value: 'probability-to-odds', label: { ar: 'احتمال % إلى ترجيح', en: 'Probability % to odds' } },
            { value: 'odds-to-probability', label: { ar: 'ترجيح إلى احتمال %', en: 'Odds to probability %' } },
        ]),
    ],
    calculate(values, language) {
        if (values.direction === 'probability-to-odds') {
            if (values.value >= 100) return output('∞ : 1', localized(language, 'نسبة الترجيح', 'Odds'));
            return output(`${round(values.value / (100 - values.value))} : 1`, localized(language, 'نسبة الترجيح', 'Odds'));
        }
        return output(`${round(values.value / (values.value + 1) * 100)}%`, localized(language, 'الاحتمال', 'Probability'));
    },
});

const expectedValue = statisticsTool({
    id: 'expected-value-calculator',
    icon: 'E(X)',
    title: { ar: 'حاسبة القيمة المتوقعة', en: 'Expected Value Calculator' },
    description: { ar: 'احسب المتوسط المتوقع لنتائج منفصلة واحتمالاتها.', en: 'Calculate the expected average of discrete outcomes and probabilities.' },
    note: { ar: 'أدخل الاحتمالات كنسب مئوية ويجب أن يكون مجموعها 100%.', en: 'Enter probabilities as percentages that sum to 100%.' },
    inputs: [
        textInput('outcomes', { ar: 'النتائج', en: 'Outcomes' }, '0, 10, 50'),
        textInput('probabilities', { ar: 'الاحتمالات %', en: 'Probabilities %' }, '50, 40, 10'),
    ],
    calculate(values, language) {
        const outcomes = parseNumbers(values.outcomes, language);
        const probabilities = parseNumbers(values.probabilities, language);
        if (outcomes.length !== probabilities.length) throw new Error(localized(language, 'يجب أن تتساوى أعداد النتائج والاحتمالات.', 'Outcomes and probabilities must have equal lengths.'));
        const total = probabilities.reduce((sum, value) => sum + value, 0);
        if (Math.abs(total - 100) > 0.0001) throw new Error(localized(language, 'يجب أن يكون مجموع الاحتمالات 100%.', 'Probabilities must sum to 100%.'));
        const result = outcomes.reduce((sum, value, index) => sum + value * probabilities[index] / 100, 0);
        return output(round(result), localized(language, 'القيمة المتوقعة', 'Expected value'));
    },
});

const probabilityStatisticsDefinitions = Object.freeze({
    [geometricMean.id]: geometricMean,
    [harmonicMean.id]: harmonicMean,
    [rangeCalculator.id]: rangeCalculator,
    [meanAbsoluteDeviation.id]: meanAbsoluteDeviation,
    [standardError.id]: standardError,
    [confidenceInterval.id]: confidenceInterval,
    [sampleSize.id]: sampleSize,
    [binomialProbability.id]: binomialProbability,
    [oddsConverter.id]: oddsConverter,
    [expectedValue.id]: expectedValue,
});

export { probabilityStatisticsDefinitions };

// END OF FILE
