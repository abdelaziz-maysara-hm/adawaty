const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
});

function format(value) {
    return formatter.format(value);
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function result(value, label, details = '') {
    return { value: format(value), label, details };
}

const money = Object.freeze({ ar: 'عملة', en: 'currency' });
const percent = Object.freeze({ ar: '%', en: '%' });
const months = Object.freeze({ ar: 'شهر', en: 'months' });
const years = Object.freeze({ ar: 'سنة', en: 'years' });

function numberInput(id, label, sample, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000_000_000,
        step: options.step ?? 0.01,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? money),
        placeholder: String(sample),
    });
}

const cagrCalculator = Object.freeze({
    id: 'cagr-calculator',
    category: 'finance',
    icon: '↗%',
    title: Object.freeze({ ar: 'حاسبة معدل النمو السنوي المركب', en: 'CAGR Calculator' }),
    description: Object.freeze({ ar: 'احسب متوسط معدل النمو السنوي المركب بين قيمة بداية ونهاية.', en: 'Calculate the compound annual growth rate between a starting and ending value.' }),
    note: Object.freeze({ ar: 'يفترض الحساب نموًا مركبًا منتظمًا طوال المدة.', en: 'The calculation assumes smooth compounded growth over the period.' }),
    inputs: Object.freeze([
        numberInput('initial', { ar: 'القيمة الابتدائية', en: 'Initial value' }, 10000, { min: 0.01 }),
        numberInput('final', { ar: 'القيمة النهائية', en: 'Final value' }, 18000, { min: 0.01 }),
        numberInput('years', { ar: 'عدد السنوات', en: 'Number of years' }, 5, { min: 0.01, max: 100, unit: years }),
    ]),
    calculate(values, language) {
        const rate = (((values.final / values.initial) ** (1 / values.years)) - 1) * 100;
        return result(rate, localized(language, 'معدل النمو السنوي المركب', 'Compound annual growth rate'), `${format(values.initial)} → ${format(values.final)}`);
    },
});

const debtToIncomeCalculator = Object.freeze({
    id: 'debt-to-income-calculator',
    category: 'finance',
    icon: 'DTI',
    title: Object.freeze({ ar: 'حاسبة نسبة الدين إلى الدخل', en: 'Debt-to-Income Calculator' }),
    description: Object.freeze({ ar: 'قارن التزامات الديون الشهرية بإجمالي الدخل الشهري.', en: 'Compare monthly debt obligations with gross monthly income.' }),
    note: Object.freeze({ ar: 'تستخدم جهات التمويل هذه النسبة ضمن عوامل تقييم القدرة على السداد.', en: 'Lenders commonly use this ratio as one affordability factor.' }),
    inputs: Object.freeze([
        numberInput('monthlyDebt', { ar: 'أقساط الديون الشهرية', en: 'Monthly debt payments' }, 5000),
        numberInput('grossIncome', { ar: 'إجمالي الدخل الشهري', en: 'Gross monthly income' }, 20000, { min: 0.01 }),
    ]),
    calculate(values, language) {
        const ratio = (values.monthlyDebt / values.grossIncome) * 100;
        const band = ratio <= 35
            ? localized(language, 'ضمن نطاق منخفض نسبيًا', 'Relatively low range')
            : ratio <= 43
                ? localized(language, 'نطاق متوسط', 'Moderate range')
                : localized(language, 'نطاق مرتفع', 'High range');
        return result(ratio, localized(language, 'نسبة الدين إلى الدخل', 'Debt-to-income ratio'), band);
    },
});

const netWorthCalculator = Object.freeze({
    id: 'net-worth-calculator',
    category: 'finance',
    icon: 'Σ',
    title: Object.freeze({ ar: 'حاسبة صافي الثروة', en: 'Net Worth Calculator' }),
    description: Object.freeze({ ar: 'اطرح إجمالي الالتزامات من إجمالي الأصول لمعرفة صافي الثروة.', en: 'Subtract total liabilities from total assets to estimate net worth.' }),
    note: Object.freeze({ ar: 'حدّث قيم الأصول والالتزامات دوريًا لمتابعة التغير.', en: 'Update asset and liability values periodically to track change.' }),
    inputs: Object.freeze([
        numberInput('cash', { ar: 'النقد والمدخرات', en: 'Cash and savings' }, 100000),
        numberInput('investments', { ar: 'الاستثمارات', en: 'Investments' }, 250000),
        numberInput('property', { ar: 'العقارات والممتلكات', en: 'Property and other assets' }, 1000000),
        numberInput('liabilities', { ar: 'إجمالي الالتزامات', en: 'Total liabilities' }, 400000),
    ]),
    calculate(values, language) {
        const assets = values.cash + values.investments + values.property;
        return result(assets - values.liabilities, localized(language, 'صافي الثروة', 'Estimated net worth'), localized(language, `إجمالي الأصول: ${format(assets)}`, `Total assets: ${format(assets)}`));
    },
});

const emergencyFundCalculator = Object.freeze({
    id: 'emergency-fund-calculator',
    category: 'finance',
    icon: '☂',
    title: Object.freeze({ ar: 'حاسبة صندوق الطوارئ', en: 'Emergency Fund Calculator' }),
    description: Object.freeze({ ar: 'قدّر هدف صندوق الطوارئ والفجوة المتبقية وفق نفقاتك الشهرية.', en: 'Estimate an emergency-fund target and remaining gap from monthly expenses.' }),
    note: Object.freeze({ ar: 'يختار كثيرون تغطية نفقات من ثلاثة إلى اثني عشر شهرًا.', en: 'Many people target three to twelve months of essential expenses.' }),
    inputs: Object.freeze([
        numberInput('monthlyExpenses', { ar: 'النفقات الشهرية الأساسية', en: 'Essential monthly expenses' }, 12000, { min: 0.01 }),
        numberInput('coverageMonths', { ar: 'أشهر التغطية', en: 'Coverage months' }, 6, { min: 1, max: 36, step: 1, unit: months }),
        numberInput('currentSavings', { ar: 'مدخرات الطوارئ الحالية', en: 'Current emergency savings' }, 20000),
    ]),
    calculate(values, language) {
        const target = values.monthlyExpenses * values.coverageMonths;
        const gap = Math.max(0, target - values.currentSavings);
        return result(target, localized(language, 'هدف صندوق الطوارئ', 'Emergency-fund target'), localized(language, `المبلغ المتبقي: ${format(gap)}`, `Remaining gap: ${format(gap)}`));
    },
});

const dividendYieldCalculator = Object.freeze({
    id: 'dividend-yield-calculator',
    category: 'finance',
    icon: 'Div%',
    title: Object.freeze({ ar: 'حاسبة عائد التوزيعات', en: 'Dividend Yield Calculator' }),
    description: Object.freeze({ ar: 'احسب عائد التوزيعات السنوي مقارنة بسعر السهم.', en: 'Calculate annual dividend yield relative to share price.' }),
    note: Object.freeze({ ar: 'العائد التاريخي لا يضمن استمرار التوزيعات مستقبلًا.', en: 'Historical yield does not guarantee future distributions.' }),
    inputs: Object.freeze([
        numberInput('annualDividend', { ar: 'التوزيع السنوي للسهم', en: 'Annual dividend per share' }, 4, { min: 0 }),
        numberInput('sharePrice', { ar: 'سعر السهم', en: 'Share price' }, 80, { min: 0.01 }),
        numberInput('shares', { ar: 'عدد الأسهم', en: 'Number of shares' }, 100, { min: 1, step: 1, unit: Object.freeze({ ar: 'سهم', en: 'shares' }) }),
    ]),
    calculate(values, language) {
        const yieldRate = (values.annualDividend / values.sharePrice) * 100;
        const annualIncome = values.annualDividend * values.shares;
        return result(yieldRate, localized(language, 'عائد التوزيعات', 'Dividend yield'), localized(language, `الدخل السنوي: ${format(annualIncome)}`, `Annual income: ${format(annualIncome)}`));
    },
});

const paybackPeriodCalculator = Object.freeze({
    id: 'payback-period-calculator',
    category: 'finance',
    icon: '⏱',
    title: Object.freeze({ ar: 'حاسبة فترة الاسترداد', en: 'Payback Period Calculator' }),
    description: Object.freeze({ ar: 'قدّر المدة اللازمة لاسترداد تكلفة استثمار من تدفقه النقدي الدوري.', en: 'Estimate how long an investment takes to repay its cost from periodic cash flow.' }),
    note: Object.freeze({ ar: 'الحساب البسيط لا يخصم القيمة الزمنية للنقود.', en: 'This simple method does not discount the time value of money.' }),
    inputs: Object.freeze([
        numberInput('investment', { ar: 'تكلفة الاستثمار', en: 'Initial investment' }, 120000, { min: 0.01 }),
        numberInput('monthlyCashFlow', { ar: 'صافي التدفق الشهري', en: 'Net monthly cash flow' }, 8000, { min: 0.01 }),
    ]),
    calculate(values, language) {
        const period = values.investment / values.monthlyCashFlow;
        return result(period, localized(language, 'فترة الاسترداد بالأشهر', 'Payback period in months'), localized(language, `تقريبًا ${format(period / 12)} سنة`, `About ${format(period / 12)} years`));
    },
});

const markupCalculator = Object.freeze({
    id: 'markup-calculator',
    category: 'finance',
    icon: '+%',
    title: Object.freeze({ ar: 'حاسبة نسبة الزيادة على التكلفة', en: 'Markup Calculator' }),
    description: Object.freeze({ ar: 'احسب قيمة ونسبة الزيادة بين تكلفة المنتج وسعر بيعه.', en: 'Calculate markup amount and percentage from cost and selling price.' }),
    note: Object.freeze({ ar: 'نسبة الزيادة على التكلفة تختلف عن هامش الربح من سعر البيع.', en: 'Markup on cost differs from profit margin on selling price.' }),
    inputs: Object.freeze([
        numberInput('cost', { ar: 'التكلفة', en: 'Cost' }, 80, { min: 0.01 }),
        numberInput('price', { ar: 'سعر البيع', en: 'Selling price' }, 120, { min: 0.01 }),
    ]),
    calculate(values, language) {
        const amount = values.price - values.cost;
        const rate = (amount / values.cost) * 100;
        return result(rate, localized(language, 'نسبة الزيادة على التكلفة', 'Markup percentage'), localized(language, `قيمة الزيادة: ${format(amount)}`, `Markup amount: ${format(amount)}`));
    },
});

const creditCardPayoffCalculator = Object.freeze({
    id: 'credit-card-payoff-calculator',
    category: 'finance',
    icon: 'CC',
    title: Object.freeze({ ar: 'حاسبة سداد بطاقة الائتمان', en: 'Credit Card Payoff Calculator' }),
    description: Object.freeze({ ar: 'قدّر مدة سداد رصيد البطاقة والفائدة عند دفع مبلغ شهري ثابت.', en: 'Estimate credit-card payoff time and interest with a fixed monthly payment.' }),
    note: Object.freeze({ ar: 'يفترض الحساب عدم إضافة مشتريات أو رسوم جديدة.', en: 'Assumes no new purchases or fees are added.' }),
    inputs: Object.freeze([
        numberInput('balance', { ar: 'الرصيد المستحق', en: 'Outstanding balance' }, 25000, { min: 0.01 }),
        numberInput('annualRate', { ar: 'الفائدة السنوية', en: 'Annual interest rate' }, 24, { min: 0, max: 100, unit: percent }),
        numberInput('monthlyPayment', { ar: 'الدفعة الشهرية', en: 'Monthly payment' }, 2000, { min: 0.01 }),
    ]),
    calculate(values, language) {
        const monthlyRate = values.annualRate / 1200;
        if (monthlyRate > 0 && values.monthlyPayment <= values.balance * monthlyRate) {
            throw new Error(localized(language, 'الدفعة لا تغطي الفائدة الشهرية.', 'The payment does not cover monthly interest.'));
        }
        let balance = values.balance;
        let interest = 0;
        let count = 0;
        while (balance > 0.005 && count < 1200) {
            const monthlyInterest = balance * monthlyRate;
            interest += monthlyInterest;
            balance = Math.max(0, balance + monthlyInterest - values.monthlyPayment);
            count += 1;
        }
        return result(count, localized(language, 'عدد الأشهر حتى السداد', 'Months until payoff'), localized(language, `إجمالي الفائدة: ${format(interest)}`, `Total interest: ${format(interest)}`));
    },
});

const loanAffordabilityCalculator = Object.freeze({
    id: 'loan-affordability-calculator',
    category: 'finance',
    icon: '🏦',
    title: Object.freeze({ ar: 'حاسبة القدرة على تحمل القرض', en: 'Loan Affordability Calculator' }),
    description: Object.freeze({ ar: 'قدّر مبلغ القرض الممكن وفق الدخل والديون وحد أقصى لنسبة الالتزام.', en: 'Estimate an affordable loan from income, debts and a maximum debt ratio.' }),
    note: Object.freeze({ ar: 'النتيجة تقديرية ولا تمثل موافقة ائتمانية.', en: 'The result is an estimate, not a credit approval.' }),
    inputs: Object.freeze([
        numberInput('monthlyIncome', { ar: 'الدخل الشهري', en: 'Monthly income' }, 30000, { min: 0.01 }),
        numberInput('existingDebt', { ar: 'الأقساط الحالية', en: 'Existing monthly debt' }, 3000),
        numberInput('maxDebtRatio', { ar: 'الحد الأقصى لنسبة الالتزام', en: 'Maximum debt ratio' }, 40, { min: 1, max: 100, unit: percent }),
        numberInput('annualRate', { ar: 'الفائدة السنوية', en: 'Annual interest rate' }, 10, { min: 0, max: 100, unit: percent }),
        numberInput('termYears', { ar: 'مدة القرض', en: 'Loan term' }, 5, { min: 1, max: 50, step: 1, unit: years }),
    ]),
    calculate(values, language) {
        const payment = Math.max(0, (values.monthlyIncome * values.maxDebtRatio / 100) - values.existingDebt);
        const periods = Math.round(values.termYears * 12);
        const rate = values.annualRate / 1200;
        const amount = rate === 0
            ? payment * periods
            : payment * (1 - ((1 + rate) ** -periods)) / rate;
        return result(amount, localized(language, 'مبلغ القرض التقديري', 'Estimated affordable loan'), localized(language, `قسط متاح: ${format(payment)}`, `Available payment: ${format(payment)}`));
    },
});

const investmentFeeCalculator = Object.freeze({
    id: 'investment-fee-calculator',
    category: 'finance',
    icon: 'Fee',
    title: Object.freeze({ ar: 'حاسبة تأثير رسوم الاستثمار', en: 'Investment Fee Calculator' }),
    description: Object.freeze({ ar: 'قارن نمو الاستثمار قبل الرسوم وبعد خصم الرسوم السنوية.', en: 'Compare investment growth before and after annual management fees.' }),
    note: Object.freeze({ ar: 'يفترض عائدًا ورسومًا ثابتين مع تركيب سنوي.', en: 'Assumes constant return and fees with annual compounding.' }),
    inputs: Object.freeze([
        numberInput('principal', { ar: 'المبلغ المستثمر', en: 'Amount invested' }, 100000, { min: 0.01 }),
        numberInput('annualReturn', { ar: 'العائد السنوي', en: 'Annual return' }, 8, { min: 0, max: 100, unit: percent }),
        numberInput('annualFee', { ar: 'الرسوم السنوية', en: 'Annual fee' }, 1.5, { min: 0, max: 20, unit: percent }),
        numberInput('years', { ar: 'المدة', en: 'Duration' }, 20, { min: 1, max: 100, step: 1, unit: years }),
    ]),
    calculate(values, language) {
        const gross = values.principal * ((1 + values.annualReturn / 100) ** values.years);
        const netRate = (values.annualReturn - values.annualFee) / 100;
        const net = values.principal * ((1 + netRate) ** values.years);
        return result(gross - net, localized(language, 'الأثر التقديري للرسوم', 'Estimated fee impact'), localized(language, `القيمة بعد الرسوم: ${format(net)}`, `Value after fees: ${format(net)}`));
    },
});

const advancedFinanceDefinitions = Object.freeze({
    [cagrCalculator.id]: cagrCalculator,
    [debtToIncomeCalculator.id]: debtToIncomeCalculator,
    [netWorthCalculator.id]: netWorthCalculator,
    [emergencyFundCalculator.id]: emergencyFundCalculator,
    [dividendYieldCalculator.id]: dividendYieldCalculator,
    [paybackPeriodCalculator.id]: paybackPeriodCalculator,
    [markupCalculator.id]: markupCalculator,
    [creditCardPayoffCalculator.id]: creditCardPayoffCalculator,
    [loanAffordabilityCalculator.id]: loanAffordabilityCalculator,
    [investmentFeeCalculator.id]: investmentFeeCalculator,
});

export { advancedFinanceDefinitions };

// END OF FILE
