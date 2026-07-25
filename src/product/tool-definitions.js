const numberFormatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
});

function formatNumber(value) {
    return numberFormatter.format(value);
}

function calculateBmi(values, language) {
    const heightMetres = values.height / 100;
    const bmi = values.weight / (heightMetres ** 2);
    const category = bmi < 18.5
        ? { ar: 'نحافة', en: 'Underweight' }
        : bmi < 25
            ? { ar: 'وزن صحي', en: 'Healthy weight' }
            : bmi < 30
                ? { ar: 'زيادة في الوزن', en: 'Overweight' }
                : { ar: 'سمنة', en: 'Obesity' };

    return {
        value: bmi.toFixed(1),
        label: language === 'ar' ? category.ar : category.en,
        details: language === 'ar'
            ? 'النطاق الصحي المعتاد لمؤشر كتلة الجسم هو من 18.5 إلى 24.9.'
            : 'The commonly used healthy BMI range is 18.5 to 24.9.',
    };
}

function calculatePercentage(values, language) {
    const result = (values.percentage / 100) * values.number;

    return {
        value: formatNumber(result),
        label: language === 'ar'
            ? `${formatNumber(values.percentage)}٪ من ${formatNumber(values.number)}`
            : `${formatNumber(values.percentage)}% of ${formatNumber(values.number)}`,
        details: `${formatNumber(values.percentage)} ÷ 100 × ${formatNumber(values.number)}`,
    };
}

function calculateAge(values, language) {
    const birthDate = new Date(`${values.birthDate}T00:00:00`);
    const today = new Date();
    const currentDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
    );

    if (birthDate > currentDate) {
        throw new Error(
            language === 'ar'
                ? 'تاريخ الميلاد لا يمكن أن يكون في المستقبل.'
                : 'The birth date cannot be in the future.',
        );
    }

    let years = currentDate.getFullYear() - birthDate.getFullYear();
    let months = currentDate.getMonth() - birthDate.getMonth();
    let days = currentDate.getDate() - birthDate.getDate();

    if (days < 0) {
        months -= 1;
        days += new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            0,
        ).getDate();
    }

    if (months < 0) {
        years -= 1;
        months += 12;
    }

    return {
        value: language === 'ar' ? `${years} سنة` : `${years} years`,
        label: language === 'ar'
            ? `${months} شهر و${days} يوم`
            : `${months} months and ${days} days`,
        details: language === 'ar'
            ? `تاريخ الحساب: ${currentDate.toLocaleDateString('ar-EG')}`
            : `Calculated on ${currentDate.toLocaleDateString('en-US')}`,
    };
}

const toolDefinitions = Object.freeze({
    'bmi-calculator': Object.freeze({
        id: 'bmi-calculator',
        category: 'health',
        icon: '⚖',
        title: Object.freeze({
            ar: 'حاسبة مؤشر كتلة الجسم',
            en: 'BMI Calculator',
        }),
        description: Object.freeze({
            ar: 'احسب مؤشر كتلة الجسم واعرف تصنيف وزنك خلال ثوانٍ.',
            en: 'Calculate your Body Mass Index and weight category in seconds.',
        }),
        note: Object.freeze({
            ar: 'هذه النتيجة إرشادية ولا تغني عن استشارة متخصص صحي.',
            en: 'This result is informational and does not replace medical advice.',
        }),
        inputs: Object.freeze([
            Object.freeze({
                id: 'height',
                type: 'number',
                min: 50,
                max: 260,
                step: 0.1,
                label: Object.freeze({ ar: 'الطول', en: 'Height' }),
                unit: Object.freeze({ ar: 'سم', en: 'cm' }),
                placeholder: '170',
            }),
            Object.freeze({
                id: 'weight',
                type: 'number',
                min: 10,
                max: 500,
                step: 0.1,
                label: Object.freeze({ ar: 'الوزن', en: 'Weight' }),
                unit: Object.freeze({ ar: 'كجم', en: 'kg' }),
                placeholder: '70',
            }),
        ]),
        calculate: calculateBmi,
    }),
    'percentage-calculator': Object.freeze({
        id: 'percentage-calculator',
        category: 'math',
        icon: '%',
        title: Object.freeze({
            ar: 'حاسبة النسبة المئوية',
            en: 'Percentage Calculator',
        }),
        description: Object.freeze({
            ar: 'اعرف قيمة أي نسبة مئوية من رقم بسرعة ودقة.',
            en: 'Find any percentage of a number quickly and accurately.',
        }),
        note: Object.freeze({
            ar: 'يمكنك إدخال أرقام عشرية في الحقلين.',
            en: 'Both fields accept decimal values.',
        }),
        inputs: Object.freeze([
            Object.freeze({
                id: 'percentage',
                type: 'number',
                min: 0,
                max: 1000000,
                step: 0.01,
                label: Object.freeze({ ar: 'النسبة', en: 'Percentage' }),
                unit: Object.freeze({ ar: '٪', en: '%' }),
                placeholder: '20',
            }),
            Object.freeze({
                id: 'number',
                type: 'number',
                min: -1000000000,
                max: 1000000000,
                step: 0.01,
                label: Object.freeze({ ar: 'الرقم', en: 'Number' }),
                unit: Object.freeze({ ar: '', en: '' }),
                placeholder: '250',
            }),
        ]),
        calculate: calculatePercentage,
    }),
    'age-calculator': Object.freeze({
        id: 'age-calculator',
        category: 'date-time',
        icon: '◷',
        title: Object.freeze({
            ar: 'حاسبة العمر',
            en: 'Age Calculator',
        }),
        description: Object.freeze({
            ar: 'احسب عمرك الحالي بالسنوات والشهور والأيام.',
            en: 'Calculate your exact age in years, months and days.',
        }),
        note: Object.freeze({
            ar: 'يتم الحساب حتى تاريخ اليوم على جهازك.',
            en: 'Age is calculated through today on your device.',
        }),
        inputs: Object.freeze([
            Object.freeze({
                id: 'birthDate',
                type: 'date',
                label: Object.freeze({
                    ar: 'تاريخ الميلاد',
                    en: 'Birth date',
                }),
                unit: Object.freeze({ ar: '', en: '' }),
            }),
        ]),
        calculate: calculateAge,
    }),
});

function getToolDefinition(id) {
    return toolDefinitions[id] ?? null;
}

function listToolDefinitions() {
    return Object.freeze(Object.values(toolDefinitions));
}

export {
    getToolDefinition,
    listToolDefinitions,
    toolDefinitions,
};

// END OF FILE
