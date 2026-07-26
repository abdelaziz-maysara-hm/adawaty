function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function textInput(id, label, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 5,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function numberInput(id, label, placeholder, min, max, step = 0.01) {
    return Object.freeze({
        id, type: 'number', min, max, step,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id,
        type: 'select',
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
    const tokens = value.trim().split(/[\s,;]+/).filter(Boolean);
    const numbers = tokens.map(Number);
    if (numbers.length < minimum || numbers.some((number) => !Number.isFinite(number))) {
        throw new Error(localized(
            language,
            `أدخل ${minimum} قيم رقمية صالحة على الأقل.`,
            `Enter at least ${minimum} valid numeric values.`,
        ));
    }
    return numbers;
}

function round(value, digits = 6) {
    return Number(value.toFixed(digits));
}

function mean(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function quantile(sorted, probability) {
    const position = (sorted.length - 1) * probability;
    const lower = Math.floor(position);
    const remainder = position - lower;
    return sorted[lower + 1] === undefined
        ? sorted[lower]
        : sorted[lower] + remainder * (sorted[lower + 1] - sorted[lower]);
}

function variance(values, sample) {
    if (sample && values.length < 2) return Number.NaN;
    const average = mean(values);
    const squared = values.reduce((sum, value) => sum + (value - average) ** 2, 0);
    return squared / (values.length - (sample ? 1 : 0));
}

function pairedValues(values, language) {
    const x = parseNumbers(values.xValues, language, 2);
    const y = parseNumbers(values.yValues, language, 2);
    if (x.length !== y.length) {
        throw new Error(localized(language, 'يجب أن تحتوي القائمتان على نفس عدد القيم.', 'Both lists must contain the same number of values.'));
    }
    return { x, y };
}

const datasetInput = textInput('values', { ar: 'مجموعة البيانات', en: 'Dataset' }, '4, 7, 7, 9, 12');
const populationOptions = [
    { value: 'population', label: { ar: 'مجتمع إحصائي', en: 'Population' } },
    { value: 'sample', label: { ar: 'عينة', en: 'Sample' } },
];

const medianCalculator = statisticsTool({
    id: 'median-calculator',
    icon: 'x̃',
    title: { ar: 'حاسبة الوسيط', en: 'Median Calculator' },
    description: { ar: 'احسب القيمة الوسطى لمجموعة أرقام بعد ترتيبها.', en: 'Calculate the middle value of a numeric dataset after sorting.' },
    note: { ar: 'عند وجود عدد زوجي من القيم يُحسب متوسط القيمتين الوسطيتين.', en: 'For an even-sized dataset, the two middle values are averaged.' },
    inputs: [datasetInput],
    calculate(values, language) {
        const numbers = parseNumbers(values.values, language).sort((left, right) => left - right);
        return output(round(quantile(numbers, 0.5)), localized(language, 'الوسيط', 'Median'), localized(language, `${numbers.length} قيمة`, `${numbers.length} values`));
    },
});

const modeCalculator = statisticsTool({
    id: 'mode-calculator',
    icon: 'Mo',
    title: { ar: 'حاسبة المنوال', en: 'Mode Calculator' },
    description: { ar: 'اعثر على القيم الأكثر تكرارًا في مجموعة البيانات.', en: 'Find the most frequently occurring values in a dataset.' },
    note: { ar: 'يمكن أن تحتوي البيانات على أكثر من منوال.', en: 'A dataset can have more than one mode.' },
    inputs: [datasetInput],
    calculate(values, language) {
        const numbers = parseNumbers(values.values, language);
        const counts = new Map();
        numbers.forEach((number) => counts.set(number, (counts.get(number) ?? 0) + 1));
        const frequency = Math.max(...counts.values());
        if (frequency === 1) return output(localized(language, 'لا يوجد منوال', 'No mode'), localized(language, 'كل القيم فريدة', 'All values are unique'));
        const modes = [...counts].filter(([, count]) => count === frequency).map(([number]) => number).sort((a, b) => a - b);
        return output(modes.join(', '), localized(language, `التكرار: ${frequency}`, `Frequency: ${frequency}`));
    },
});

const varianceCalculator = statisticsTool({
    id: 'variance-calculator',
    icon: 'σ²',
    title: { ar: 'حاسبة التباين', en: 'Variance Calculator' },
    description: { ar: 'احسب تباين المجتمع الإحصائي أو العينة.', en: 'Calculate population or sample variance.' },
    note: { ar: 'يستخدم تباين العينة المقام n−1.', en: 'Sample variance uses the n−1 denominator.' },
    inputs: [datasetInput, selectInput('type', { ar: 'نوع البيانات', en: 'Dataset type' }, populationOptions)],
    calculate(values, language) {
        const numbers = parseNumbers(values.values, language, values.type === 'sample' ? 2 : 1);
        return output(round(variance(numbers, values.type === 'sample')), localized(language, 'التباين', 'Variance'));
    },
});

const quartileCalculator = statisticsTool({
    id: 'quartile-iqr-calculator',
    icon: 'Q1–Q3',
    title: { ar: 'حاسبة الربيعات والمدى الربيعي', en: 'Quartile and IQR Calculator' },
    description: { ar: 'احسب Q1 والوسيط وQ3 والمدى الربيعي لمجموعة البيانات.', en: 'Calculate Q1, median, Q3 and the interquartile range.' },
    note: { ar: 'تُحسب الربيعات بالاستيفاء الخطي.', en: 'Quartiles are calculated using linear interpolation.' },
    inputs: [datasetInput],
    calculate(values, language) {
        const numbers = parseNumbers(values.values, language, 2).sort((left, right) => left - right);
        const q1 = round(quantile(numbers, 0.25));
        const q2 = round(quantile(numbers, 0.5));
        const q3 = round(quantile(numbers, 0.75));
        return output(`Q1: ${q1}\nQ2: ${q2}\nQ3: ${q3}\nIQR: ${round(q3 - q1)}`, localized(language, 'ملخص الربيعات', 'Quartile summary'));
    },
});

const percentileCalculator = statisticsTool({
    id: 'percentile-calculator',
    icon: 'P%',
    title: { ar: 'حاسبة النسبة المئينية', en: 'Percentile Calculator' },
    description: { ar: 'احسب قيمة نسبة مئينية محددة داخل مجموعة بيانات.', en: 'Calculate a requested percentile value within a dataset.' },
    note: { ar: 'تُستخدم طريقة الاستيفاء الخطي بين القيم.', en: 'Linear interpolation is used between data points.' },
    inputs: [datasetInput, numberInput('percentile', { ar: 'النسبة المئينية', en: 'Percentile' }, 90, 0, 100)],
    calculate(values, language) {
        const numbers = parseNumbers(values.values, language).sort((left, right) => left - right);
        return output(round(quantile(numbers, values.percentile / 100)), localized(language, `P${values.percentile}`, `P${values.percentile}`));
    },
});

const zScoreCalculator = statisticsTool({
    id: 'z-score-calculator',
    icon: 'Z',
    title: { ar: 'حاسبة الدرجة المعيارية Z', en: 'Z-Score Calculator' },
    description: { ar: 'احسب بُعد قيمة عن المتوسط بوحدات الانحراف المعياري.', en: 'Measure how many standard deviations a value is from the mean.' },
    note: { ar: 'يجب أن يكون الانحراف المعياري أكبر من صفر.', en: 'Standard deviation must be greater than zero.' },
    inputs: [
        numberInput('value', { ar: 'القيمة', en: 'Value' }, 85, -1e12, 1e12),
        numberInput('average', { ar: 'المتوسط', en: 'Mean' }, 70, -1e12, 1e12),
        numberInput('standardDeviation', { ar: 'الانحراف المعياري', en: 'Standard deviation' }, 10, 0.000001, 1e12),
    ],
    calculate(values, language) {
        return output(round((values.value - values.average) / values.standardDeviation), localized(language, 'درجة Z', 'Z-score'));
    },
});

const coefficientVariation = statisticsTool({
    id: 'coefficient-of-variation-calculator',
    icon: 'CV%',
    title: { ar: 'حاسبة معامل الاختلاف', en: 'Coefficient of Variation Calculator' },
    description: { ar: 'قارن التشتت النسبي باستخدام الانحراف المعياري والمتوسط.', en: 'Compare relative dispersion using standard deviation and mean.' },
    note: { ar: 'معامل الاختلاف غير معرّف عندما يكون المتوسط صفرًا.', en: 'The coefficient of variation is undefined when the mean is zero.' },
    inputs: [datasetInput, selectInput('type', { ar: 'نوع البيانات', en: 'Dataset type' }, populationOptions)],
    calculate(values, language) {
        const numbers = parseNumbers(values.values, language, values.type === 'sample' ? 2 : 1);
        const average = mean(numbers);
        if (average === 0) throw new Error(localized(language, 'يجب ألا يساوي المتوسط صفرًا.', 'Mean must not be zero.'));
        const standardDeviation = Math.sqrt(variance(numbers, values.type === 'sample'));
        return output(`${round(Math.abs(standardDeviation / average) * 100)}%`, localized(language, 'معامل الاختلاف', 'Coefficient of variation'));
    },
});

const covarianceCalculator = statisticsTool({
    id: 'covariance-calculator',
    icon: 'Cov',
    title: { ar: 'حاسبة التغاير', en: 'Covariance Calculator' },
    description: { ar: 'احسب اتجاه التغير المشترك بين سلسلتين رقميتين.', en: 'Calculate the direction of joint variation between two numeric series.' },
    note: { ar: 'يجب أن تحتوي السلسلتان على العدد نفسه من القيم.', en: 'Both series must contain the same number of values.' },
    inputs: [
        textInput('xValues', { ar: 'قيم X', en: 'X values' }, '1, 2, 3, 4'),
        textInput('yValues', { ar: 'قيم Y', en: 'Y values' }, '2, 4, 6, 8'),
        selectInput('type', { ar: 'نوع البيانات', en: 'Dataset type' }, populationOptions),
    ],
    calculate(values, language) {
        const { x, y } = pairedValues(values, language);
        const xMean = mean(x);
        const yMean = mean(y);
        const denominator = x.length - (values.type === 'sample' ? 1 : 0);
        const covariance = x.reduce((sum, value, index) => sum + (value - xMean) * (y[index] - yMean), 0) / denominator;
        return output(round(covariance), localized(language, 'التغاير', 'Covariance'));
    },
});

const correlationCalculator = statisticsTool({
    id: 'pearson-correlation-calculator',
    icon: 'r',
    title: { ar: 'حاسبة ارتباط بيرسون', en: 'Pearson Correlation Calculator' },
    description: { ar: 'احسب قوة واتجاه العلاقة الخطية بين سلسلتين.', en: 'Calculate the strength and direction of a linear relationship.' },
    note: { ar: 'تتراوح قيمة معامل الارتباط من −1 إلى 1.', en: 'The correlation coefficient ranges from −1 to 1.' },
    inputs: [
        textInput('xValues', { ar: 'قيم X', en: 'X values' }, '1, 2, 3, 4'),
        textInput('yValues', { ar: 'قيم Y', en: 'Y values' }, '2, 4, 6, 8'),
    ],
    calculate(values, language) {
        const { x, y } = pairedValues(values, language);
        const xMean = mean(x);
        const yMean = mean(y);
        const numerator = x.reduce((sum, value, index) => sum + (value - xMean) * (y[index] - yMean), 0);
        const denominator = Math.sqrt(
            x.reduce((sum, value) => sum + (value - xMean) ** 2, 0)
            * y.reduce((sum, value) => sum + (value - yMean) ** 2, 0),
        );
        if (denominator === 0) throw new Error(localized(language, 'لا يمكن حساب الارتباط لسلسلة ثابتة.', 'Correlation is undefined for a constant series.'));
        return output(round(numerator / denominator), localized(language, 'معامل بيرسون r', 'Pearson r'));
    },
});

const regressionCalculator = statisticsTool({
    id: 'linear-regression-calculator',
    icon: 'y=mx+b',
    title: { ar: 'حاسبة الانحدار الخطي', en: 'Linear Regression Calculator' },
    description: { ar: 'استخرج معادلة أفضل خط مستقيم ومعامل التحديد R².', en: 'Find the best-fit straight-line equation and coefficient of determination.' },
    note: { ar: 'يستخدم الانحدار الخطي بطريقة المربعات الصغرى.', en: 'Uses ordinary least-squares linear regression.' },
    inputs: [
        textInput('xValues', { ar: 'قيم X', en: 'X values' }, '1, 2, 3, 4'),
        textInput('yValues', { ar: 'قيم Y', en: 'Y values' }, '2, 4, 6, 8'),
    ],
    calculate(values, language) {
        const { x, y } = pairedValues(values, language);
        const xMean = mean(x);
        const yMean = mean(y);
        const xVariation = x.reduce((sum, value) => sum + (value - xMean) ** 2, 0);
        if (xVariation === 0) throw new Error(localized(language, 'يجب ألا تكون جميع قيم X متساوية.', 'X values must not all be equal.'));
        const slope = x.reduce((sum, value, index) => sum + (value - xMean) * (y[index] - yMean), 0) / xVariation;
        const intercept = yMean - slope * xMean;
        const predictions = x.map((value) => slope * value + intercept);
        const residual = y.reduce((sum, value, index) => sum + (value - predictions[index]) ** 2, 0);
        const total = y.reduce((sum, value) => sum + (value - yMean) ** 2, 0);
        const rSquared = total === 0 ? 1 : 1 - residual / total;
        const sign = intercept < 0 ? '-' : '+';
        return output(`y = ${round(slope)}x ${sign} ${round(Math.abs(intercept))}`, localized(language, 'معادلة الانحدار', 'Regression equation'), `R² = ${round(rSquared)}`);
    },
});

const statisticsDefinitions = Object.freeze({
    [medianCalculator.id]: medianCalculator,
    [modeCalculator.id]: modeCalculator,
    [varianceCalculator.id]: varianceCalculator,
    [quartileCalculator.id]: quartileCalculator,
    [percentileCalculator.id]: percentileCalculator,
    [zScoreCalculator.id]: zScoreCalculator,
    [coefficientVariation.id]: coefficientVariation,
    [covarianceCalculator.id]: covarianceCalculator,
    [correlationCalculator.id]: correlationCalculator,
    [regressionCalculator.id]: regressionCalculator,
});

export { statisticsDefinitions };

// END OF FILE
