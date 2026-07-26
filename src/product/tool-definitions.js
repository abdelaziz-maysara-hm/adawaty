import { converterDefinitions } from './definitions/converters.js';
import { dateTimeDefinitions } from './definitions/date-time.js';
import { engineeringDefinitions } from './definitions/engineering.js';
import { financeDefinitions } from './definitions/finance.js';
import { healthDefinitions } from './definitions/health.js';
import { mathDefinitions } from './definitions/math.js';
import { textDeveloperDefinitions } from './definitions/text-developer.js';

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

function calculateBmrValue(values) {
    const base = (10 * values.weight)
        + (6.25 * values.height)
        - (5 * values.age);
    return values.gender === 'male' ? base + 5 : base - 161;
}

function calculateBmr(values, language) {
    const calories = Math.round(calculateBmrValue(values));

    return {
        value: language === 'ar'
            ? `${formatNumber(calories)} سعرة`
            : `${formatNumber(calories)} kcal`,
        label: language === 'ar'
            ? 'معدل الأيض الأساسي يوميًا'
            : 'Daily basal metabolic rate',
        details: language === 'ar'
            ? 'تقدير للطاقة التي يستهلكها جسمك في الراحة.'
            : 'An estimate of the energy your body uses at rest.',
    };
}

function calculateTdee(values, language) {
    const calories = Math.round(
        calculateBmrValue(values) * Number(values.activity),
    );

    return {
        value: language === 'ar'
            ? `${formatNumber(calories)} سعرة`
            : `${formatNumber(calories)} kcal`,
        label: language === 'ar'
            ? 'احتياجك اليومي التقريبي'
            : 'Estimated daily energy needs',
        details: language === 'ar'
            ? 'للمحافظة على الوزن الحالي وفق مستوى النشاط المحدد.'
            : 'To maintain current weight at the selected activity level.',
    };
}

function calculateIdealWeight(values, language) {
    const inchesOverFiveFeet = Math.max(
        0,
        (values.height / 2.54) - 60,
    );
    const weight = values.gender === 'male'
        ? 50 + (2.3 * inchesOverFiveFeet)
        : 45.5 + (2.3 * inchesOverFiveFeet);

    return {
        value: `${formatNumber(weight)} ${language === 'ar' ? 'كجم' : 'kg'}`,
        label: language === 'ar'
            ? 'تقدير الوزن المثالي'
            : 'Estimated ideal weight',
        details: language === 'ar'
            ? 'محسوب بمعادلة Devine ويُستخدم كمؤشر عام فقط.'
            : 'Calculated with the Devine formula as a general reference.',
    };
}

function calculateWaterIntake(values, language) {
    const litres = (values.weight * 35) / 1000;

    return {
        value: `${formatNumber(litres)} ${language === 'ar' ? 'لتر' : 'litres'}`,
        label: language === 'ar'
            ? 'الاحتياج اليومي التقريبي'
            : 'Estimated daily intake',
        details: language === 'ar'
            ? 'قد يزيد الاحتياج مع الحرارة والرياضة والحمل وبعض الحالات الصحية.'
            : 'Needs may increase with heat, exercise, pregnancy or health conditions.',
    };
}

function calculateBodySurfaceArea(values, language) {
    const area = Math.sqrt((values.height * values.weight) / 3600);

    return {
        value: `${area.toFixed(2)} m²`,
        label: language === 'ar'
            ? 'مساحة سطح الجسم'
            : 'Body surface area',
        details: language === 'ar'
            ? 'تم الحساب باستخدام معادلة Mosteller.'
            : 'Calculated with the Mosteller formula.',
    };
}

function calculateGrade(values, language) {
    if (values.earned > values.total) {
        throw new Error(language === 'ar'
            ? 'الدرجة المحصّلة لا يمكن أن تتجاوز الدرجة الكلية.'
            : 'The earned score cannot exceed the total score.');
    }
    const percentage = (values.earned / values.total) * 100;
    const grade = percentage >= 90 ? 'A'
        : percentage >= 80 ? 'B'
            : percentage >= 70 ? 'C'
                : percentage >= 60 ? 'D' : 'F';
    return {
        value: `${formatNumber(percentage)}%`,
        label: language === 'ar' ? `التقدير ${grade}` : `Grade ${grade}`,
        details: language === 'ar'
            ? `${formatNumber(values.earned)} من ${formatNumber(values.total)}`
            : `${formatNumber(values.earned)} out of ${formatNumber(values.total)}`,
    };
}

function calculateGpa(values, language) {
    const courses = [
        [values.grade1, values.credits1],
        [values.grade2, values.credits2],
        [values.grade3, values.credits3],
        [values.grade4, values.credits4],
    ];
    const totalCredits = courses.reduce((sum, course) => sum + course[1], 0);
    const weightedPoints = courses.reduce(
        (sum, course) => sum + (course[0] * course[1]),
        0,
    );
    const gpa = weightedPoints / totalCredits;
    return {
        value: gpa.toFixed(2),
        label: language === 'ar' ? 'المعدل التراكمي من 4' : 'GPA on a 4.0 scale',
        details: language === 'ar'
            ? `إجمالي الساعات: ${formatNumber(totalCredits)}`
            : `Total credits: ${formatNumber(totalCredits)}`,
    };
}

function calculateAverage(values, language) {
    const numbers = [
        values.number1,
        values.number2,
        values.number3,
        values.number4,
        values.number5,
    ];
    const average = numbers.reduce((sum, number) => sum + number, 0)
        / numbers.length;
    return {
        value: formatNumber(average),
        label: language === 'ar' ? 'المتوسط الحسابي' : 'Arithmetic mean',
        details: language === 'ar'
            ? `مجموع القيم: ${formatNumber(numbers.reduce((sum, number) => sum + number, 0))}`
            : `Sum: ${formatNumber(numbers.reduce((sum, number) => sum + number, 0))}`,
    };
}

function calculateWeightedAverage(values, language) {
    const totalWeight = values.weight1 + values.weight2 + values.weight3;
    const result = (
        (values.score1 * values.weight1)
        + (values.score2 * values.weight2)
        + (values.score3 * values.weight3)
    ) / totalWeight;
    return {
        value: formatNumber(result),
        label: language === 'ar' ? 'المتوسط المرجّح' : 'Weighted average',
        details: language === 'ar'
            ? `إجمالي الأوزان: ${formatNumber(totalWeight)}`
            : `Total weight: ${formatNumber(totalWeight)}`,
    };
}

function calculateAttendance(values, language) {
    if (values.attended > values.totalClasses) {
        throw new Error(language === 'ar'
            ? 'عدد مرات الحضور لا يمكن أن يتجاوز إجمالي المحاضرات.'
            : 'Attended classes cannot exceed total classes.');
    }
    const percentage = (values.attended / values.totalClasses) * 100;
    return {
        value: `${formatNumber(percentage)}%`,
        label: language === 'ar' ? 'نسبة الحضور' : 'Attendance rate',
        details: language === 'ar'
            ? `الغياب: ${formatNumber(values.totalClasses - values.attended)}`
            : `Absences: ${formatNumber(values.totalClasses - values.attended)}`,
    };
}

function calculatePercentageChange(values, language) {
    const change = ((values.newValue - values.oldValue) / Math.abs(values.oldValue))
        * 100;
    const direction = change >= 0
        ? { ar: 'زيادة', en: 'Increase' }
        : { ar: 'انخفاض', en: 'Decrease' };
    return {
        value: `${formatNumber(Math.abs(change))}%`,
        label: language === 'ar' ? direction.ar : direction.en,
        details: language === 'ar'
            ? `التغير: ${formatNumber(values.newValue - values.oldValue)}`
            : `Difference: ${formatNumber(values.newValue - values.oldValue)}`,
    };
}

function calculateRatio(values, language) {
    const divisor = greatestCommonDivisor(values.first, values.second);
    const first = values.first / divisor;
    const second = values.second / divisor;
    return {
        value: `${formatNumber(first)}:${formatNumber(second)}`,
        label: language === 'ar' ? 'أبسط صورة للنسبة' : 'Simplified ratio',
        details: language === 'ar'
            ? `القاسم المشترك الأكبر: ${formatNumber(divisor)}`
            : `Greatest common divisor: ${formatNumber(divisor)}`,
    };
}

function greatestCommonDivisor(first, second) {
    let left = Math.abs(Math.round(first));
    let right = Math.abs(Math.round(second));
    while (right !== 0) {
        [left, right] = [right, left % right];
    }
    return left;
}

const genderOptions = Object.freeze([
    Object.freeze({
        value: 'male',
        label: Object.freeze({ ar: 'ذكر', en: 'Male' }),
    }),
    Object.freeze({
        value: 'female',
        label: Object.freeze({ ar: 'أنثى', en: 'Female' }),
    }),
]);

const activityOptions = Object.freeze([
    Object.freeze({
        value: '1.2',
        label: Object.freeze({ ar: 'قليل الحركة', en: 'Sedentary' }),
    }),
    Object.freeze({
        value: '1.375',
        label: Object.freeze({ ar: 'نشاط خفيف', en: 'Lightly active' }),
    }),
    Object.freeze({
        value: '1.55',
        label: Object.freeze({ ar: 'نشاط متوسط', en: 'Moderately active' }),
    }),
    Object.freeze({
        value: '1.725',
        label: Object.freeze({ ar: 'نشاط مرتفع', en: 'Very active' }),
    }),
    Object.freeze({
        value: '1.9',
        label: Object.freeze({ ar: 'نشاط شديد جدًا', en: 'Extra active' }),
    }),
]);

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
    'bmr-calculator': Object.freeze({
        id: 'bmr-calculator',
        category: 'health',
        icon: '🔥',
        title: Object.freeze({ ar: 'حاسبة معدل الأيض الأساسي', en: 'BMR Calculator' }),
        description: Object.freeze({
            ar: 'قدّر السعرات التي يحتاجها جسمك يوميًا في حالة الراحة.',
            en: 'Estimate the calories your body needs each day at rest.',
        }),
        note: Object.freeze({
            ar: 'النتيجة تقديرية وتعتمد على معادلة Mifflin-St Jeor.',
            en: 'This estimate uses the Mifflin-St Jeor equation.',
        }),
        inputs: Object.freeze([
            Object.freeze({ id: 'gender', type: 'select', label: Object.freeze({ ar: 'النوع', en: 'Sex' }), unit: Object.freeze({ ar: '', en: '' }), options: genderOptions }),
            Object.freeze({ id: 'age', type: 'number', min: 13, max: 120, step: 1, label: Object.freeze({ ar: 'العمر', en: 'Age' }), unit: Object.freeze({ ar: 'سنة', en: 'years' }), placeholder: '30' }),
            Object.freeze({ id: 'height', type: 'number', min: 100, max: 250, step: 0.1, label: Object.freeze({ ar: 'الطول', en: 'Height' }), unit: Object.freeze({ ar: 'سم', en: 'cm' }), placeholder: '175' }),
            Object.freeze({ id: 'weight', type: 'number', min: 25, max: 400, step: 0.1, label: Object.freeze({ ar: 'الوزن', en: 'Weight' }), unit: Object.freeze({ ar: 'كجم', en: 'kg' }), placeholder: '75' }),
        ]),
        calculate: calculateBmr,
    }),
    'tdee-calculator': Object.freeze({
        id: 'tdee-calculator',
        category: 'health',
        icon: '⚡',
        title: Object.freeze({ ar: 'حاسبة الاحتياج اليومي من السعرات', en: 'TDEE Calculator' }),
        description: Object.freeze({
            ar: 'قدّر السعرات اليومية اللازمة للمحافظة على وزنك وفق نشاطك.',
            en: 'Estimate daily calories needed to maintain weight based on activity.',
        }),
        note: Object.freeze({
            ar: 'راقب تغير الوزن وعدّل التقدير حسب استجابة جسمك.',
            en: 'Track weight changes and adjust the estimate to your response.',
        }),
        inputs: Object.freeze([
            Object.freeze({ id: 'gender', type: 'select', label: Object.freeze({ ar: 'النوع', en: 'Sex' }), unit: Object.freeze({ ar: '', en: '' }), options: genderOptions }),
            Object.freeze({ id: 'age', type: 'number', min: 13, max: 120, step: 1, label: Object.freeze({ ar: 'العمر', en: 'Age' }), unit: Object.freeze({ ar: 'سنة', en: 'years' }), placeholder: '30' }),
            Object.freeze({ id: 'height', type: 'number', min: 100, max: 250, step: 0.1, label: Object.freeze({ ar: 'الطول', en: 'Height' }), unit: Object.freeze({ ar: 'سم', en: 'cm' }), placeholder: '175' }),
            Object.freeze({ id: 'weight', type: 'number', min: 25, max: 400, step: 0.1, label: Object.freeze({ ar: 'الوزن', en: 'Weight' }), unit: Object.freeze({ ar: 'كجم', en: 'kg' }), placeholder: '75' }),
            Object.freeze({ id: 'activity', type: 'select', label: Object.freeze({ ar: 'مستوى النشاط', en: 'Activity level' }), unit: Object.freeze({ ar: '', en: '' }), options: activityOptions }),
        ]),
        calculate: calculateTdee,
    }),
    'ideal-weight-calculator': Object.freeze({
        id: 'ideal-weight-calculator',
        category: 'health',
        icon: '◎',
        title: Object.freeze({ ar: 'حاسبة الوزن المثالي', en: 'Ideal Weight Calculator' }),
        description: Object.freeze({
            ar: 'احصل على تقدير عام للوزن المثالي وفق الطول والنوع.',
            en: 'Get a general ideal-weight estimate based on height and sex.',
        }),
        note: Object.freeze({
            ar: 'لا تراعي المعادلة تكوين الجسم أو الكتلة العضلية.',
            en: 'The formula does not account for body composition or muscle mass.',
        }),
        inputs: Object.freeze([
            Object.freeze({ id: 'gender', type: 'select', label: Object.freeze({ ar: 'النوع', en: 'Sex' }), unit: Object.freeze({ ar: '', en: '' }), options: genderOptions }),
            Object.freeze({ id: 'height', type: 'number', min: 100, max: 250, step: 0.1, label: Object.freeze({ ar: 'الطول', en: 'Height' }), unit: Object.freeze({ ar: 'سم', en: 'cm' }), placeholder: '175' }),
        ]),
        calculate: calculateIdealWeight,
    }),
    'water-intake-calculator': Object.freeze({
        id: 'water-intake-calculator',
        category: 'health',
        icon: '💧',
        title: Object.freeze({ ar: 'حاسبة شرب المياه', en: 'Water Intake Calculator' }),
        description: Object.freeze({
            ar: 'قدّر كمية المياه اليومية المناسبة وفق وزنك.',
            en: 'Estimate daily water intake based on your weight.',
        }),
        note: Object.freeze({
            ar: 'استشر الطبيب إذا كان لديك تقييد للسوائل أو مرض مزمن.',
            en: 'Seek medical guidance for fluid restrictions or chronic conditions.',
        }),
        inputs: Object.freeze([
            Object.freeze({ id: 'weight', type: 'number', min: 20, max: 400, step: 0.1, label: Object.freeze({ ar: 'الوزن', en: 'Weight' }), unit: Object.freeze({ ar: 'كجم', en: 'kg' }), placeholder: '70' }),
        ]),
        calculate: calculateWaterIntake,
    }),
    'body-surface-area-calculator': Object.freeze({
        id: 'body-surface-area-calculator',
        category: 'health',
        icon: '◇',
        title: Object.freeze({ ar: 'حاسبة مساحة سطح الجسم', en: 'Body Surface Area Calculator' }),
        description: Object.freeze({
            ar: 'احسب مساحة سطح الجسم من الطول والوزن بمعادلة Mosteller.',
            en: 'Calculate body surface area from height and weight using Mosteller.',
        }),
        note: Object.freeze({
            ar: 'الاستخدامات الطبية للنتيجة يجب أن تكون تحت إشراف متخصص.',
            en: 'Medical use of this result requires professional supervision.',
        }),
        inputs: Object.freeze([
            Object.freeze({ id: 'height', type: 'number', min: 30, max: 250, step: 0.1, label: Object.freeze({ ar: 'الطول', en: 'Height' }), unit: Object.freeze({ ar: 'سم', en: 'cm' }), placeholder: '175' }),
            Object.freeze({ id: 'weight', type: 'number', min: 1, max: 400, step: 0.1, label: Object.freeze({ ar: 'الوزن', en: 'Weight' }), unit: Object.freeze({ ar: 'كجم', en: 'kg' }), placeholder: '75' }),
        ]),
        calculate: calculateBodySurfaceArea,
    }),
    'grade-calculator': Object.freeze({
        id: 'grade-calculator',
        category: 'student',
        icon: 'A+',
        title: Object.freeze({ ar: 'حاسبة الدرجات', en: 'Grade Calculator' }),
        description: Object.freeze({ ar: 'احسب النسبة المئوية والتقدير من الدرجة المحصّلة والدرجة الكلية.', en: 'Calculate a percentage and letter grade from earned and total scores.' }),
        note: Object.freeze({ ar: 'يستخدم التقدير نطاقات A إلى F الشائعة.', en: 'Uses common A-to-F grade bands.' }),
        inputs: Object.freeze([
            Object.freeze({ id: 'earned', type: 'number', min: 0, max: 100000, step: 0.01, label: Object.freeze({ ar: 'الدرجة المحصّلة', en: 'Earned score' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '85' }),
            Object.freeze({ id: 'total', type: 'number', min: 0.01, max: 100000, step: 0.01, label: Object.freeze({ ar: 'الدرجة الكلية', en: 'Total score' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '100' }),
        ]),
        calculate: calculateGrade,
    }),
    'gpa-calculator': Object.freeze({
        id: 'gpa-calculator',
        category: 'student',
        icon: '4.0',
        title: Object.freeze({ ar: 'حاسبة المعدل التراكمي', en: 'GPA Calculator' }),
        description: Object.freeze({ ar: 'احسب المعدل التراكمي لأربع مواد مع مراعاة الساعات المعتمدة.', en: 'Calculate a four-course GPA weighted by credit hours.' }),
        note: Object.freeze({ ar: 'أدخل نقاط كل مادة من 0 إلى 4.', en: 'Enter each course grade point from 0 to 4.' }),
        inputs: Object.freeze([
            Object.freeze({ id: 'grade1', type: 'number', min: 0, max: 4, step: 0.01, label: Object.freeze({ ar: 'نقاط المادة الأولى', en: 'Course 1 points' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '4' }),
            Object.freeze({ id: 'credits1', type: 'number', min: 0.5, max: 20, step: 0.5, label: Object.freeze({ ar: 'ساعات المادة الأولى', en: 'Course 1 credits' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '3' }),
            Object.freeze({ id: 'grade2', type: 'number', min: 0, max: 4, step: 0.01, label: Object.freeze({ ar: 'نقاط المادة الثانية', en: 'Course 2 points' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '3.5' }),
            Object.freeze({ id: 'credits2', type: 'number', min: 0.5, max: 20, step: 0.5, label: Object.freeze({ ar: 'ساعات المادة الثانية', en: 'Course 2 credits' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '3' }),
            Object.freeze({ id: 'grade3', type: 'number', min: 0, max: 4, step: 0.01, label: Object.freeze({ ar: 'نقاط المادة الثالثة', en: 'Course 3 points' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '3' }),
            Object.freeze({ id: 'credits3', type: 'number', min: 0.5, max: 20, step: 0.5, label: Object.freeze({ ar: 'ساعات المادة الثالثة', en: 'Course 3 credits' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '3' }),
            Object.freeze({ id: 'grade4', type: 'number', min: 0, max: 4, step: 0.01, label: Object.freeze({ ar: 'نقاط المادة الرابعة', en: 'Course 4 points' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '3.7' }),
            Object.freeze({ id: 'credits4', type: 'number', min: 0.5, max: 20, step: 0.5, label: Object.freeze({ ar: 'ساعات المادة الرابعة', en: 'Course 4 credits' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '3' }),
        ]),
        calculate: calculateGpa,
    }),
    'average-calculator': Object.freeze({
        id: 'average-calculator',
        category: 'math',
        icon: 'x̄',
        title: Object.freeze({ ar: 'حاسبة المتوسط', en: 'Average Calculator' }),
        description: Object.freeze({ ar: 'احسب المتوسط الحسابي لخمس قيم بسرعة.', en: 'Calculate the arithmetic mean of five values.' }),
        note: Object.freeze({ ar: 'يجمع القيم ثم يقسم الناتج على خمسة.', en: 'Adds the values and divides the total by five.' }),
        inputs: Object.freeze([1, 2, 3, 4, 5].map((number) => Object.freeze({ id: `number${number}`, type: 'number', min: -1000000000, max: 1000000000, step: 0.01, label: Object.freeze({ ar: `القيمة ${number}`, en: `Value ${number}` }), unit: Object.freeze({ ar: '', en: '' }), placeholder: `${number * 10}` }))),
        calculate: calculateAverage,
    }),
    'weighted-average-calculator': Object.freeze({
        id: 'weighted-average-calculator',
        category: 'student',
        icon: 'Σ',
        title: Object.freeze({ ar: 'حاسبة المتوسط المرجّح', en: 'Weighted Average Calculator' }),
        description: Object.freeze({ ar: 'احسب متوسط ثلاث درجات مع اختلاف وزن كل درجة.', en: 'Calculate the weighted average of three scores.' }),
        note: Object.freeze({ ar: 'يمكن إدخال الأوزان كنسب أو أرقام نسبية.', en: 'Weights can be percentages or relative values.' }),
        inputs: Object.freeze([
            Object.freeze({ id: 'score1', type: 'number', min: -1000000, max: 1000000, step: 0.01, label: Object.freeze({ ar: 'الدرجة الأولى', en: 'Score 1' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '80' }),
            Object.freeze({ id: 'weight1', type: 'number', min: 0.01, max: 1000000, step: 0.01, label: Object.freeze({ ar: 'وزن الدرجة الأولى', en: 'Weight 1' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '20' }),
            Object.freeze({ id: 'score2', type: 'number', min: -1000000, max: 1000000, step: 0.01, label: Object.freeze({ ar: 'الدرجة الثانية', en: 'Score 2' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '90' }),
            Object.freeze({ id: 'weight2', type: 'number', min: 0.01, max: 1000000, step: 0.01, label: Object.freeze({ ar: 'وزن الدرجة الثانية', en: 'Weight 2' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '30' }),
            Object.freeze({ id: 'score3', type: 'number', min: -1000000, max: 1000000, step: 0.01, label: Object.freeze({ ar: 'الدرجة الثالثة', en: 'Score 3' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '95' }),
            Object.freeze({ id: 'weight3', type: 'number', min: 0.01, max: 1000000, step: 0.01, label: Object.freeze({ ar: 'وزن الدرجة الثالثة', en: 'Weight 3' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '50' }),
        ]),
        calculate: calculateWeightedAverage,
    }),
    'attendance-calculator': Object.freeze({
        id: 'attendance-calculator',
        category: 'student',
        icon: '✓',
        title: Object.freeze({ ar: 'حاسبة نسبة الحضور', en: 'Attendance Calculator' }),
        description: Object.freeze({ ar: 'احسب نسبة حضورك وعدد مرات الغياب.', en: 'Calculate your attendance rate and absences.' }),
        note: Object.freeze({ ar: 'أدخل عدد المحاضرات المنعقدة والحضور الفعلي.', en: 'Enter total classes held and classes attended.' }),
        inputs: Object.freeze([
            Object.freeze({ id: 'attended', type: 'number', min: 0, max: 100000, step: 1, label: Object.freeze({ ar: 'مرات الحضور', en: 'Classes attended' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '36' }),
            Object.freeze({ id: 'totalClasses', type: 'number', min: 1, max: 100000, step: 1, label: Object.freeze({ ar: 'إجمالي المحاضرات', en: 'Total classes' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '40' }),
        ]),
        calculate: calculateAttendance,
    }),
    'percentage-change-calculator': Object.freeze({
        id: 'percentage-change-calculator',
        category: 'math',
        icon: 'Δ%',
        title: Object.freeze({ ar: 'حاسبة نسبة التغير', en: 'Percentage Change Calculator' }),
        description: Object.freeze({ ar: 'احسب نسبة الزيادة أو الانخفاض بين قيمتين.', en: 'Calculate the percentage increase or decrease between two values.' }),
        note: Object.freeze({ ar: 'تُقاس نسبة التغير مقارنة بالقيمة القديمة.', en: 'Percentage change is measured against the old value.' }),
        inputs: Object.freeze([
            Object.freeze({ id: 'oldValue', type: 'number', min: 0.01, max: 1000000000, step: 0.01, label: Object.freeze({ ar: 'القيمة القديمة', en: 'Old value' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '100' }),
            Object.freeze({ id: 'newValue', type: 'number', min: -1000000000, max: 1000000000, step: 0.01, label: Object.freeze({ ar: 'القيمة الجديدة', en: 'New value' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '125' }),
        ]),
        calculate: calculatePercentageChange,
    }),
    'ratio-calculator': Object.freeze({
        id: 'ratio-calculator',
        category: 'math',
        icon: ':',
        title: Object.freeze({ ar: 'حاسبة تبسيط النسبة', en: 'Ratio Calculator' }),
        description: Object.freeze({ ar: 'بسّط النسبة بين عددين صحيحين إلى أصغر صورة.', en: 'Simplify a ratio between two integers.' }),
        note: Object.freeze({ ar: 'تستخدم الأداة القاسم المشترك الأكبر.', en: 'Uses the greatest common divisor.' }),
        inputs: Object.freeze([
            Object.freeze({ id: 'first', type: 'number', min: 1, max: 1000000000, step: 1, label: Object.freeze({ ar: 'العدد الأول', en: 'First number' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '24' }),
            Object.freeze({ id: 'second', type: 'number', min: 1, max: 1000000000, step: 1, label: Object.freeze({ ar: 'العدد الثاني', en: 'Second number' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '36' }),
        ]),
        calculate: calculateRatio,
    }),
    ...converterDefinitions,
    ...textDeveloperDefinitions,
    ...financeDefinitions,
    ...healthDefinitions,
    ...mathDefinitions,
    ...dateTimeDefinitions,
    ...engineeringDefinitions,
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
