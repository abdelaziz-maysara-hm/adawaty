const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
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
        min: options.min ?? 0,
        max: options.max ?? 1_000_000_000_000,
        step: options.step ?? 0.01,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function result(value, label, details) {
    return { value: format(value), label, details };
}

const moneyUnit = Object.freeze({ ar: 'عملة', en: 'currency' });
const percentUnit = Object.freeze({ ar: '%', en: '%' });
const yearsUnit = Object.freeze({ ar: 'سنة', en: 'years' });

const simpleInterest = Object.freeze({
    id: 'simple-interest-calculator',
    category: 'finance',
    icon: '%',
    title: Object.freeze({ ar: 'حاسبة الفائدة البسيطة', en: 'Simple Interest Calculator' }),
    description: Object.freeze({ ar: 'احسب الفائدة البسيطة وإجمالي المبلغ بعد مدة محددة.', en: 'Calculate simple interest and the final amount over time.' }),
    note: Object.freeze({ ar: 'لا تضيف الفائدة السابقة إلى أصل المبلغ.', en: 'Interest is not compounded into the principal.' }),
    inputs: Object.freeze([
        numberInput('principal', { ar: 'أصل المبلغ', en: 'Principal' }, 10000, { min: 0.01, unit: moneyUnit }),
        numberInput('annualRate', { ar: 'الفائدة السنوية', en: 'Annual rate' }, 10, { unit: percentUnit }),
        numberInput('years', { ar: 'المدة', en: 'Duration' }, 3, { min: 0.01, unit: yearsUnit }),
    ]),
    calculate(values, language) {
        const interest = values.principal * (values.annualRate / 100)
            * values.years;
        return result(
            values.principal + interest,
            localized(language, 'إجمالي المبلغ', 'Final amount'),
            localized(language, `الفائدة: ${format(interest)}`, `Interest: ${format(interest)}`),
        );
    },
});

const mortgage = Object.freeze({
    id: 'mortgage-calculator',
    category: 'finance',
    icon: '⌂',
    title: Object.freeze({ ar: 'حاسبة الرهن العقاري', en: 'Mortgage Calculator' }),
    description: Object.freeze({ ar: 'قدّر القسط الشهري وإجمالي فوائد التمويل العقاري.', en: 'Estimate monthly mortgage payments and total interest.' }),
    note: Object.freeze({ ar: 'لا تشمل النتيجة الضرائب أو التأمين أو الرسوم.', en: 'Taxes, insurance and fees are not included.' }),
    inputs: Object.freeze([
        numberInput('amount', { ar: 'مبلغ التمويل', en: 'Loan amount' }, 1000000, { min: 0.01, unit: moneyUnit }),
        numberInput('annualRate', { ar: 'الفائدة السنوية', en: 'Annual rate' }, 8, { unit: percentUnit }),
        numberInput('years', { ar: 'مدة التمويل', en: 'Loan term' }, 20, { min: 1, max: 50, step: 1, unit: yearsUnit }),
    ]),
    calculate(values, language) {
        const months = values.years * 12;
        const monthlyRate = values.annualRate / 1200;
        const payment = monthlyRate === 0
            ? values.amount / months
            : values.amount * (
                monthlyRate * ((1 + monthlyRate) ** months)
            ) / (((1 + monthlyRate) ** months) - 1);
        const interest = (payment * months) - values.amount;
        return result(
            payment,
            localized(language, 'القسط الشهري التقريبي', 'Estimated monthly payment'),
            localized(language, `إجمالي الفائدة: ${format(interest)}`, `Total interest: ${format(interest)}`),
        );
    },
});

const savingsGoal = Object.freeze({
    id: 'savings-goal-calculator',
    category: 'finance',
    icon: '◎',
    title: Object.freeze({ ar: 'حاسبة هدف الادخار', en: 'Savings Goal Calculator' }),
    description: Object.freeze({ ar: 'اعرف المبلغ الشهري المطلوب للوصول إلى هدف ادخاري.', en: 'Find the monthly contribution needed to reach a savings goal.' }),
    note: Object.freeze({ ar: 'يفترض إيداع المساهمة في نهاية كل شهر.', en: 'Assumes contributions are made at the end of each month.' }),
    inputs: Object.freeze([
        numberInput('goal', { ar: 'هدف الادخار', en: 'Savings goal' }, 100000, { min: 0.01, unit: moneyUnit }),
        numberInput('current', { ar: 'المدخرات الحالية', en: 'Current savings' }, 10000, { unit: moneyUnit }),
        numberInput('annualRate', { ar: 'العائد السنوي', en: 'Annual return' }, 5, { unit: percentUnit }),
        numberInput('years', { ar: 'المدة', en: 'Time horizon' }, 5, { min: 0.01, unit: yearsUnit }),
    ]),
    calculate(values, language) {
        const months = Math.max(1, Math.round(values.years * 12));
        const monthlyRate = values.annualRate / 1200;
        const futureCurrent = values.current * ((1 + monthlyRate) ** months);
        const remaining = Math.max(0, values.goal - futureCurrent);
        const payment = monthlyRate === 0
            ? remaining / months
            : remaining * monthlyRate / (((1 + monthlyRate) ** months) - 1);
        return result(
            payment,
            localized(language, 'الادخار الشهري المطلوب', 'Required monthly saving'),
            localized(language, `عدد الأشهر: ${months}`, `Months: ${months}`),
        );
    },
});

const roi = Object.freeze({
    id: 'roi-calculator',
    category: 'finance',
    icon: 'ROI',
    title: Object.freeze({ ar: 'حاسبة العائد على الاستثمار', en: 'ROI Calculator' }),
    description: Object.freeze({ ar: 'احسب ربح الاستثمار ونسبة العائد عليه.', en: 'Calculate investment profit and return on investment.' }),
    note: Object.freeze({ ar: 'لا تراعي النتيجة مدة الاستثمار أو التضخم.', en: 'The result does not account for time or inflation.' }),
    inputs: Object.freeze([
        numberInput('initial', { ar: 'تكلفة الاستثمار', en: 'Initial investment' }, 10000, { min: 0.01, unit: moneyUnit }),
        numberInput('final', { ar: 'القيمة النهائية', en: 'Final value' }, 12500, { unit: moneyUnit }),
    ]),
    calculate(values, language) {
        const profit = values.final - values.initial;
        const percentage = (profit / values.initial) * 100;
        return result(
            percentage,
            localized(language, 'نسبة العائد %', 'ROI percentage'),
            localized(language, `صافي الربح: ${format(profit)}`, `Net profit: ${format(profit)}`),
        );
    },
});

const profitMargin = Object.freeze({
    id: 'profit-margin-calculator',
    category: 'finance',
    icon: '↗',
    title: Object.freeze({ ar: 'حاسبة هامش الربح', en: 'Profit Margin Calculator' }),
    description: Object.freeze({ ar: 'احسب صافي الربح وهامشه من الإيرادات والتكلفة.', en: 'Calculate net profit and margin from revenue and cost.' }),
    note: Object.freeze({ ar: 'الهامش هو نسبة الربح إلى الإيرادات.', en: 'Margin is profit divided by revenue.' }),
    inputs: Object.freeze([
        numberInput('revenue', { ar: 'الإيرادات', en: 'Revenue' }, 10000, { min: 0.01, unit: moneyUnit }),
        numberInput('cost', { ar: 'إجمالي التكلفة', en: 'Total cost' }, 7000, { unit: moneyUnit }),
    ]),
    calculate(values, language) {
        const profit = values.revenue - values.cost;
        const margin = (profit / values.revenue) * 100;
        return result(
            margin,
            localized(language, 'هامش الربح %', 'Profit margin'),
            localized(language, `صافي الربح: ${format(profit)}`, `Net profit: ${format(profit)}`),
        );
    },
});

const breakEven = Object.freeze({
    id: 'break-even-calculator',
    category: 'finance',
    icon: '=',
    title: Object.freeze({ ar: 'حاسبة نقطة التعادل', en: 'Break-Even Calculator' }),
    description: Object.freeze({ ar: 'احسب عدد الوحدات اللازمة لتغطية التكاليف.', en: 'Calculate units needed to cover business costs.' }),
    note: Object.freeze({ ar: 'يجب أن يتجاوز سعر البيع التكلفة المتغيرة للوحدة.', en: 'Selling price must exceed variable cost per unit.' }),
    inputs: Object.freeze([
        numberInput('fixedCosts', { ar: 'التكاليف الثابتة', en: 'Fixed costs' }, 50000, { unit: moneyUnit }),
        numberInput('price', { ar: 'سعر بيع الوحدة', en: 'Price per unit' }, 100, { min: 0.01, unit: moneyUnit }),
        numberInput('variableCost', { ar: 'التكلفة المتغيرة للوحدة', en: 'Variable cost per unit' }, 60, { unit: moneyUnit }),
    ]),
    calculate(values, language) {
        const contribution = values.price - values.variableCost;
        if (contribution <= 0) {
            throw new Error(localized(
                language,
                'سعر البيع يجب أن يتجاوز التكلفة المتغيرة.',
                'Selling price must exceed variable cost.',
            ));
        }
        const units = Math.ceil(values.fixedCosts / contribution);
        return result(
            units,
            localized(language, 'وحدة للوصول إلى التعادل', 'units to break even'),
            localized(language, `هامش مساهمة الوحدة: ${format(contribution)}`, `Contribution per unit: ${format(contribution)}`),
        );
    },
});

const tip = Object.freeze({
    id: 'tip-calculator',
    category: 'finance',
    icon: '¤',
    title: Object.freeze({ ar: 'حاسبة الإكرامية', en: 'Tip Calculator' }),
    description: Object.freeze({ ar: 'احسب الإكرامية والإجمالي ونصيب كل شخص.', en: 'Calculate tip, total bill and each person’s share.' }),
    note: Object.freeze({ ar: 'يمكن تقسيم الفاتورة بالتساوي بين عدة أشخاص.', en: 'The bill can be split evenly between several people.' }),
    inputs: Object.freeze([
        numberInput('bill', { ar: 'قيمة الفاتورة', en: 'Bill amount' }, 500, { min: 0.01, unit: moneyUnit }),
        numberInput('rate', { ar: 'نسبة الإكرامية', en: 'Tip rate' }, 10, { unit: percentUnit }),
        numberInput('people', { ar: 'عدد الأشخاص', en: 'Number of people' }, 2, { min: 1, max: 1000, step: 1 }),
    ]),
    calculate(values, language) {
        const tipAmount = values.bill * (values.rate / 100);
        const total = values.bill + tipAmount;
        return result(
            total / values.people,
            localized(language, 'نصيب كل شخص', 'Per person'),
            localized(language, `الإكرامية: ${format(tipAmount)} — الإجمالي: ${format(total)}`, `Tip: ${format(tipAmount)} — total: ${format(total)}`),
        );
    },
});

const commission = Object.freeze({
    id: 'commission-calculator',
    category: 'finance',
    icon: '%',
    title: Object.freeze({ ar: 'حاسبة العمولة', en: 'Commission Calculator' }),
    description: Object.freeze({ ar: 'احسب عمولة المبيعات وإجمالي الدخل مع الراتب الأساسي.', en: 'Calculate sales commission and total earnings.' }),
    note: Object.freeze({ ar: 'تُحسب العمولة كنسبة ثابتة من المبيعات.', en: 'Commission is a flat percentage of sales.' }),
    inputs: Object.freeze([
        numberInput('sales', { ar: 'إجمالي المبيعات', en: 'Total sales' }, 100000, { unit: moneyUnit }),
        numberInput('rate', { ar: 'نسبة العمولة', en: 'Commission rate' }, 5, { unit: percentUnit }),
        numberInput('base', { ar: 'الراتب الأساسي', en: 'Base salary' }, 5000, { unit: moneyUnit }),
    ]),
    calculate(values, language) {
        const commissionAmount = values.sales * (values.rate / 100);
        return result(
            values.base + commissionAmount,
            localized(language, 'إجمالي الدخل', 'Total earnings'),
            localized(language, `العمولة: ${format(commissionAmount)}`, `Commission: ${format(commissionAmount)}`),
        );
    },
});

const salary = Object.freeze({
    id: 'hourly-salary-calculator',
    category: 'finance',
    icon: '⏱',
    title: Object.freeze({ ar: 'محول الأجر بالساعة إلى راتب', en: 'Hourly to Salary Calculator' }),
    description: Object.freeze({ ar: 'حوّل الأجر بالساعة إلى دخل أسبوعي وشهري وسنوي.', en: 'Convert hourly pay into weekly, monthly and annual income.' }),
    note: Object.freeze({ ar: 'النتيجة قبل الضرائب والاستقطاعات.', en: 'Results are before taxes and deductions.' }),
    inputs: Object.freeze([
        numberInput('hourly', { ar: 'الأجر بالساعة', en: 'Hourly rate' }, 100, { min: 0.01, unit: moneyUnit }),
        numberInput('hours', { ar: 'ساعات العمل أسبوعيًا', en: 'Hours per week' }, 40, { min: 0.01, max: 168 }),
        numberInput('weeks', { ar: 'أسابيع العمل سنويًا', en: 'Weeks per year' }, 52, { min: 1, max: 53, step: 1 }),
    ]),
    calculate(values, language) {
        const annual = values.hourly * values.hours * values.weeks;
        return result(
            annual,
            localized(language, 'الدخل السنوي', 'Annual income'),
            localized(language, `شهريًا: ${format(annual / 12)}`, `Monthly: ${format(annual / 12)}`),
        );
    },
});

const inflation = Object.freeze({
    id: 'inflation-calculator',
    category: 'finance',
    icon: '↑',
    title: Object.freeze({ ar: 'حاسبة التضخم', en: 'Inflation Calculator' }),
    description: Object.freeze({ ar: 'قدّر التكلفة المستقبلية لمبلغ وفق معدل تضخم ثابت.', en: 'Estimate a future cost using a constant inflation rate.' }),
    note: Object.freeze({ ar: 'معدلات التضخم الفعلية تتغير من سنة لأخرى.', en: 'Actual inflation rates vary from year to year.' }),
    inputs: Object.freeze([
        numberInput('amount', { ar: 'القيمة الحالية', en: 'Current amount' }, 10000, { min: 0.01, unit: moneyUnit }),
        numberInput('rate', { ar: 'معدل التضخم السنوي', en: 'Annual inflation rate' }, 8, { unit: percentUnit }),
        numberInput('years', { ar: 'عدد السنوات', en: 'Years' }, 5, { min: 0.01, unit: yearsUnit }),
    ]),
    calculate(values, language) {
        const future = values.amount * ((1 + (values.rate / 100)) ** values.years);
        return result(
            future,
            localized(language, 'التكلفة المستقبلية المقدّرة', 'Estimated future cost'),
            localized(language, `الزيادة: ${format(future - values.amount)}`, `Increase: ${format(future - values.amount)}`),
        );
    },
});

const financeDefinitions = Object.freeze({
    'simple-interest-calculator': simpleInterest,
    'mortgage-calculator': mortgage,
    'savings-goal-calculator': savingsGoal,
    'roi-calculator': roi,
    'profit-margin-calculator': profitMargin,
    'break-even-calculator': breakEven,
    'tip-calculator': tip,
    'commission-calculator': commission,
    'hourly-salary-calculator': salary,
    'inflation-calculator': inflation,
});

export { financeDefinitions };

// END OF FILE
