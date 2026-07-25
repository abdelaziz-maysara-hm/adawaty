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

function calculateDiscount(values, language) {
    const savings = values.price * (values.discount / 100);
    const finalPrice = values.price - savings;

    return {
        value: formatNumber(finalPrice),
        label: language === 'ar'
            ? `وفّرت ${formatNumber(savings)}`
            : `You save ${formatNumber(savings)}`,
        details: language === 'ar'
            ? `السعر الأصلي ${formatNumber(values.price)} — الخصم ${formatNumber(values.discount)}٪`
            : `Original price ${formatNumber(values.price)} — ${formatNumber(values.discount)}% discount`,
    };
}

function calculateVat(values, language) {
    const tax = values.amount * (values.rate / 100);
    const total = values.amount + tax;

    return {
        value: formatNumber(total),
        label: language === 'ar'
            ? `قيمة الضريبة ${formatNumber(tax)}`
            : `Tax amount ${formatNumber(tax)}`,
        details: language === 'ar'
            ? `المبلغ قبل الضريبة ${formatNumber(values.amount)}`
            : `Amount before tax ${formatNumber(values.amount)}`,
    };
}

function calculateLoan(values, language) {
    const monthlyRate = values.annualRate / 1200;
    const payment = monthlyRate === 0
        ? values.amount / values.months
        : values.amount
            * (
                monthlyRate * ((1 + monthlyRate) ** values.months)
            )
            / (((1 + monthlyRate) ** values.months) - 1);
    const total = payment * values.months;
    const interest = total - values.amount;

    return {
        value: formatNumber(payment),
        label: language === 'ar'
            ? 'القسط الشهري التقريبي'
            : 'Estimated monthly payment',
        details: language === 'ar'
            ? `إجمالي السداد ${formatNumber(total)} — الفائدة ${formatNumber(interest)}`
            : `Total payment ${formatNumber(total)} — interest ${formatNumber(interest)}`,
    };
}

function calculateCompoundInterest(values, language) {
    const rate = values.annualRate / 100;
    const total = values.principal
        * ((1 + (rate / values.compounds)) ** (
            values.compounds * values.years
        ));
    const interest = total - values.principal;

    return {
        value: formatNumber(total),
        label: language === 'ar'
            ? `العائد ${formatNumber(interest)}`
            : `Interest earned ${formatNumber(interest)}`,
        details: language === 'ar'
            ? `${formatNumber(values.years)} سنة بمعدل ${formatNumber(values.annualRate)}٪`
            : `${formatNumber(values.years)} years at ${formatNumber(values.annualRate)}%`,
    };
}

function calculateDateDifference(values, language) {
    const start = new Date(`${values.startDate}T00:00:00Z`);
    const end = new Date(`${values.endDate}T00:00:00Z`);
    const millisecondsPerDay = 86_400_000;
    const days = Math.abs(Math.round((end - start) / millisecondsPerDay));
    const weeks = days / 7;

    return {
        value: language === 'ar' ? `${days} يوم` : `${days} days`,
        label: language === 'ar'
            ? `${formatNumber(weeks)} أسبوع`
            : `${formatNumber(weeks)} weeks`,
        details: language === 'ar'
            ? 'يُحسب الفرق دون احتساب يوم النهاية كجزء إضافي.'
            : 'The difference does not count the end date as an extra day.',
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
    'discount-calculator': Object.freeze({
        id: 'discount-calculator',
        category: 'finance',
        icon: '−',
        title: Object.freeze({
            ar: 'حاسبة الخصم',
            en: 'Discount Calculator',
        }),
        description: Object.freeze({
            ar: 'احسب السعر بعد الخصم والمبلغ الذي ستوفره فورًا.',
            en: 'Calculate the final price and how much you save instantly.',
        }),
        note: Object.freeze({
            ar: 'النتيجة تستخدم نفس العملة التي أدخلت بها السعر.',
            en: 'The result uses the same currency as the entered price.',
        }),
        inputs: Object.freeze([
            Object.freeze({
                id: 'price',
                type: 'number',
                min: 0,
                max: 1000000000,
                step: 0.01,
                label: Object.freeze({ ar: 'السعر الأصلي', en: 'Original price' }),
                unit: Object.freeze({ ar: '', en: '' }),
                placeholder: '1000',
            }),
            Object.freeze({
                id: 'discount',
                type: 'number',
                min: 0,
                max: 100,
                step: 0.01,
                label: Object.freeze({ ar: 'نسبة الخصم', en: 'Discount' }),
                unit: Object.freeze({ ar: '٪', en: '%' }),
                placeholder: '20',
            }),
        ]),
        calculate: calculateDiscount,
    }),
    'vat-calculator': Object.freeze({
        id: 'vat-calculator',
        category: 'finance',
        icon: '+',
        title: Object.freeze({
            ar: 'حاسبة ضريبة القيمة المضافة',
            en: 'VAT Calculator',
        }),
        description: Object.freeze({
            ar: 'احسب قيمة الضريبة والإجمالي بعد إضافتها إلى المبلغ.',
            en: 'Calculate VAT and the total amount after tax.',
        }),
        note: Object.freeze({
            ar: 'أدخل نسبة الضريبة المعتمدة في دولتك أو فاتورتك.',
            en: 'Enter the tax rate that applies to your country or invoice.',
        }),
        inputs: Object.freeze([
            Object.freeze({
                id: 'amount',
                type: 'number',
                min: 0,
                max: 1000000000,
                step: 0.01,
                label: Object.freeze({ ar: 'المبلغ قبل الضريبة', en: 'Amount before VAT' }),
                unit: Object.freeze({ ar: '', en: '' }),
                placeholder: '1000',
            }),
            Object.freeze({
                id: 'rate',
                type: 'number',
                min: 0,
                max: 100,
                step: 0.01,
                label: Object.freeze({ ar: 'نسبة الضريبة', en: 'VAT rate' }),
                unit: Object.freeze({ ar: '٪', en: '%' }),
                placeholder: '14',
            }),
        ]),
        calculate: calculateVat,
    }),
    'loan-calculator': Object.freeze({
        id: 'loan-calculator',
        category: 'finance',
        icon: '¤',
        title: Object.freeze({
            ar: 'حاسبة القروض',
            en: 'Loan Calculator',
        }),
        description: Object.freeze({
            ar: 'قدّر القسط الشهري وإجمالي الفائدة على القرض.',
            en: 'Estimate monthly loan payments and total interest.',
        }),
        note: Object.freeze({
            ar: 'الحساب تقديري ولا يشمل المصروفات الإدارية أو التأمين.',
            en: 'This estimate excludes fees, insurance and other lender charges.',
        }),
        inputs: Object.freeze([
            Object.freeze({
                id: 'amount',
                type: 'number',
                min: 1,
                max: 1000000000,
                step: 0.01,
                label: Object.freeze({ ar: 'قيمة القرض', en: 'Loan amount' }),
                unit: Object.freeze({ ar: '', en: '' }),
                placeholder: '100000',
            }),
            Object.freeze({
                id: 'annualRate',
                type: 'number',
                min: 0,
                max: 100,
                step: 0.01,
                label: Object.freeze({ ar: 'الفائدة السنوية', en: 'Annual interest' }),
                unit: Object.freeze({ ar: '٪', en: '%' }),
                placeholder: '12',
            }),
            Object.freeze({
                id: 'months',
                type: 'number',
                min: 1,
                max: 600,
                step: 1,
                label: Object.freeze({ ar: 'مدة القرض', en: 'Loan term' }),
                unit: Object.freeze({ ar: 'شهر', en: 'months' }),
                placeholder: '60',
            }),
        ]),
        calculate: calculateLoan,
    }),
    'compound-interest-calculator': Object.freeze({
        id: 'compound-interest-calculator',
        category: 'finance',
        icon: '↗',
        title: Object.freeze({
            ar: 'حاسبة الفائدة المركبة',
            en: 'Compound Interest Calculator',
        }),
        description: Object.freeze({
            ar: 'توقّع نمو رأس المال مع الفائدة المركبة بمرور الوقت.',
            en: 'Project investment growth with compound interest over time.',
        }),
        note: Object.freeze({
            ar: 'النتيجة لا تشمل الضرائب أو الرسوم أو الإيداعات الإضافية.',
            en: 'The result excludes taxes, fees and additional contributions.',
        }),
        inputs: Object.freeze([
            Object.freeze({
                id: 'principal',
                type: 'number',
                min: 0,
                max: 1000000000,
                step: 0.01,
                label: Object.freeze({ ar: 'رأس المال', en: 'Principal' }),
                unit: Object.freeze({ ar: '', en: '' }),
                placeholder: '10000',
            }),
            Object.freeze({
                id: 'annualRate',
                type: 'number',
                min: 0,
                max: 100,
                step: 0.01,
                label: Object.freeze({ ar: 'العائد السنوي', en: 'Annual rate' }),
                unit: Object.freeze({ ar: '٪', en: '%' }),
                placeholder: '8',
            }),
            Object.freeze({
                id: 'years',
                type: 'number',
                min: 0,
                max: 200,
                step: 0.1,
                label: Object.freeze({ ar: 'المدة', en: 'Duration' }),
                unit: Object.freeze({ ar: 'سنة', en: 'years' }),
                placeholder: '10',
            }),
            Object.freeze({
                id: 'compounds',
                type: 'number',
                min: 1,
                max: 365,
                step: 1,
                label: Object.freeze({ ar: 'مرات التركيب سنويًا', en: 'Compounds per year' }),
                unit: Object.freeze({ ar: 'مرة', en: 'times' }),
                placeholder: '12',
            }),
        ]),
        calculate: calculateCompoundInterest,
    }),
    'date-difference-calculator': Object.freeze({
        id: 'date-difference-calculator',
        category: 'date-time',
        icon: '↔',
        title: Object.freeze({
            ar: 'حاسبة الفرق بين تاريخين',
            en: 'Date Difference Calculator',
        }),
        description: Object.freeze({
            ar: 'احسب عدد الأيام والأسابيع بين أي تاريخين.',
            en: 'Calculate the number of days and weeks between two dates.',
        }),
        note: Object.freeze({
            ar: 'يمكن إدخال التاريخين بأي ترتيب.',
            en: 'The dates can be entered in either order.',
        }),
        inputs: Object.freeze([
            Object.freeze({
                id: 'startDate',
                type: 'date',
                label: Object.freeze({ ar: 'التاريخ الأول', en: 'First date' }),
                unit: Object.freeze({ ar: '', en: '' }),
            }),
            Object.freeze({
                id: 'endDate',
                type: 'date',
                label: Object.freeze({ ar: 'التاريخ الثاني', en: 'Second date' }),
                unit: Object.freeze({ ar: '', en: '' }),
            }),
        ]),
        calculate: calculateDateDifference,
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
