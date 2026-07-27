const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function field(id, ar, en, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1e15,
        step: options.step ?? 0.01,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function tool(config) {
    return Object.freeze({
        id: config.id,
        category: 'finance',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate: config.calculate,
    });
}

function amount(value, unit = '') {
    return `${formatter.format(value)}${unit ? ` ${unit}` : ''}`;
}

const rentalYield = tool({
    id: 'rental-yield-calculator',
    icon: 'RENT',
    title: { ar: 'حاسبة العائد الإيجاري', en: 'Rental Yield Calculator' },
    description: { ar: 'احسب العائد الإيجاري الإجمالي والسنوي من سعر العقار والإيجار الشهري.', en: 'Calculate gross annual rental yield from property price and monthly rent.' },
    note: { ar: 'العائد الإجمالي لا يخصم المصروفات أو فترات الشغور.', en: 'Gross yield does not deduct expenses or vacancy.' },
    inputs: [
        field('price', 'سعر العقار', 'Property price', 200000, { min: 0.01 }),
        field('monthlyRent', 'الإيجار الشهري', 'Monthly rent', 1500),
    ],
    calculate(values, language) {
        const annualRent = values.monthlyRent * 12;
        return output(
            amount(annualRent / values.price * 100, '%'),
            localized(language, 'العائد الإيجاري الإجمالي', 'Gross rental yield'),
            `${amount(annualRent)} ${localized(language, 'إيجار سنوي', 'annual rent')}`,
        );
    },
});

const capRate = tool({
    id: 'real-estate-cap-rate-calculator',
    icon: 'CAP',
    title: { ar: 'حاسبة معدل الرسملة العقارية', en: 'Real Estate Cap Rate Calculator' },
    description: { ar: 'احسب معدل الرسملة من صافي الدخل التشغيلي وقيمة العقار.', en: 'Calculate capitalization rate from net operating income and property value.' },
    note: { ar: 'لا يدخل تمويل القرض عادةً ضمن صافي الدخل التشغيلي.', en: 'Debt financing is normally excluded from net operating income.' },
    inputs: [
        field('noi', 'صافي الدخل التشغيلي السنوي', 'Annual net operating income', 18000),
        field('value', 'قيمة العقار', 'Property value', 250000, { min: 0.01 }),
    ],
    calculate: (values, language) => output(
        amount(values.noi / values.value * 100, '%'),
        localized(language, 'معدل الرسملة', 'Capitalization rate'),
    ),
});

const cashOnCash = tool({
    id: 'cash-on-cash-return-calculator',
    icon: 'COC',
    title: { ar: 'حاسبة العائد النقدي على الاستثمار العقاري', en: 'Cash-on-Cash Return Calculator' },
    description: { ar: 'احسب العائد النقدي السنوي مقارنةً بإجمالي النقد المستثمر.', en: 'Calculate annual pre-tax cash flow relative to total cash invested.' },
    note: { ar: 'استخدم التدفق النقدي بعد مصروفات التشغيل وخدمة الدين.', en: 'Use cash flow after operating expenses and debt service.' },
    inputs: [
        field('cashFlow', 'التدفق النقدي السنوي', 'Annual cash flow', 12000),
        field('cashInvested', 'إجمالي النقد المستثمر', 'Total cash invested', 80000, { min: 0.01 }),
    ],
    calculate: (values, language) => output(
        amount(values.cashFlow / values.cashInvested * 100, '%'),
        localized(language, 'العائد النقدي', 'Cash-on-cash return'),
    ),
});

const pricePerArea = tool({
    id: 'property-price-per-square-meter-calculator',
    icon: 'M²',
    title: { ar: 'حاسبة سعر المتر المربع للعقار', en: 'Property Price per Square Meter Calculator' },
    description: { ar: 'احسب سعر المتر المربع للمقارنة بين العقارات.', en: 'Calculate price per square meter for easier property comparison.' },
    note: { ar: 'استخدم نفس تعريف المساحة عند مقارنة الوحدات.', en: 'Use the same area definition when comparing properties.' },
    inputs: [
        field('price', 'سعر العقار', 'Property price', 200000),
        field('area', 'مساحة العقار', 'Property area', 120, { min: 0.01, unit: { ar: 'م²', en: 'm²' } }),
    ],
    calculate: (values, language) => output(
        amount(values.price / values.area, localized(language, 'لكل م²', 'per m²')),
        localized(language, 'سعر المتر المربع', 'Price per square meter'),
    ),
});

const appreciation = tool({
    id: 'property-appreciation-calculator',
    icon: 'UP',
    title: { ar: 'حاسبة ارتفاع قيمة العقار', en: 'Property Appreciation Calculator' },
    description: { ar: 'قدّر القيمة المستقبلية للعقار بمعدل نمو سنوي مركب.', en: 'Estimate future property value using compound annual appreciation.' },
    note: { ar: 'معدل النمو التاريخي لا يضمن أداء السوق مستقبلًا.', en: 'Historical growth does not guarantee future market performance.' },
    inputs: [
        field('currentValue', 'القيمة الحالية', 'Current value', 250000),
        field('rate', 'معدل النمو السنوي', 'Annual appreciation rate', 5, { max: 100, unit: { ar: '%', en: '%' } }),
        field('years', 'عدد السنوات', 'Years', 10, { min: 0, step: 1 }),
    ],
    calculate(values, language) {
        const future = values.currentValue * (1 + values.rate / 100) ** values.years;
        return output(
            amount(future),
            localized(language, 'القيمة المستقبلية التقديرية', 'Estimated future value'),
            `${amount(future - values.currentValue)} ${localized(language, 'زيادة', 'increase')}`,
        );
    },
});

const downPayment = tool({
    id: 'property-down-payment-calculator',
    icon: 'DOWN',
    title: { ar: 'حاسبة الدفعة المقدمة للعقار', en: 'Property Down Payment Calculator' },
    description: { ar: 'احسب قيمة الدفعة المقدمة ومبلغ التمويل المتبقي.', en: 'Calculate property down payment and remaining financed amount.' },
    note: { ar: 'لا تشمل النتيجة رسوم التسجيل أو الإغلاق.', en: 'The result excludes registration and closing costs.' },
    inputs: [
        field('price', 'سعر العقار', 'Property price', 300000),
        field('percent', 'نسبة الدفعة المقدمة', 'Down payment percentage', 20, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const down = values.price * values.percent / 100;
        return output(
            amount(down),
            localized(language, 'الدفعة المقدمة', 'Down payment'),
            `${localized(language, 'مبلغ التمويل', 'Financed amount')}: ${amount(values.price - down)}`,
        );
    },
});

const closingCosts = tool({
    id: 'property-closing-cost-calculator',
    icon: 'CLOSE',
    title: { ar: 'حاسبة تكاليف إغلاق شراء العقار', en: 'Property Closing Cost Calculator' },
    description: { ar: 'قدّر رسوم وتكاليف إغلاق الصفقة كنسبة من سعر العقار.', en: 'Estimate transaction and closing costs as a percentage of property price.' },
    note: { ar: 'تختلف الضرائب والرسوم القانونية والتسجيل حسب البلد والصفقة.', en: 'Taxes, legal and registration fees vary by location and transaction.' },
    inputs: [
        field('price', 'سعر العقار', 'Property price', 300000),
        field('rate', 'نسبة تكاليف الإغلاق', 'Closing cost rate', 4, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const costs = values.price * values.rate / 100;
        return output(
            amount(costs),
            localized(language, 'تكاليف الإغلاق التقديرية', 'Estimated closing costs'),
            `${localized(language, 'الإجمالي مع السعر', 'Total with purchase price')}: ${amount(values.price + costs)}`,
        );
    },
});

const vacancyLoss = tool({
    id: 'rental-vacancy-loss-calculator',
    icon: 'VAC',
    title: { ar: 'حاسبة خسارة الشغور الإيجاري', en: 'Rental Vacancy Loss Calculator' },
    description: { ar: 'قدّر الدخل الإيجاري المفقود بسبب نسبة الشغور.', en: 'Estimate rental income lost to vacancy.' },
    note: { ar: 'يمكن تطبيق النسبة على وحدة واحدة أو مجموعة وحدات.', en: 'The rate can be applied to one unit or a portfolio.' },
    inputs: [
        field('monthlyRent', 'الإيجار الشهري للوحدة', 'Monthly rent per unit', 1500),
        field('units', 'عدد الوحدات', 'Number of units', 4, { min: 1, step: 1 }),
        field('vacancy', 'نسبة الشغور', 'Vacancy rate', 5, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const gross = values.monthlyRent * values.units * 12;
        return output(
            amount(gross * values.vacancy / 100),
            localized(language, 'خسارة الشغور السنوية', 'Annual vacancy loss'),
            `${localized(language, 'الدخل الفعلي المتوقع', 'Expected effective income')}: ${amount(gross * (1 - values.vacancy / 100))}`,
        );
    },
});

const propertyTax = tool({
    id: 'property-tax-calculator',
    icon: 'TAX',
    title: { ar: 'حاسبة ضريبة العقار', en: 'Property Tax Calculator' },
    description: { ar: 'قدّر ضريبة العقار السنوية والشهرية من القيمة الخاضعة للضريبة.', en: 'Estimate annual and monthly property tax from taxable value.' },
    note: { ar: 'تحقق من التقييم الضريبي والمعدل المحلي الفعلي.', en: 'Confirm the actual taxable assessment and local rate.' },
    inputs: [
        field('taxableValue', 'القيمة الخاضعة للضريبة', 'Taxable property value', 250000),
        field('rate', 'معدل الضريبة السنوي', 'Annual tax rate', 1.2, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const annual = values.taxableValue * values.rate / 100;
        return output(
            amount(annual),
            localized(language, 'الضريبة السنوية التقديرية', 'Estimated annual property tax'),
            `${localized(language, 'شهريًا', 'Monthly')}: ${amount(annual / 12)}`,
        );
    },
});

const grossRentMultiplier = tool({
    id: 'gross-rent-multiplier-calculator',
    icon: 'GRM',
    title: { ar: 'حاسبة مضاعف الإيجار الإجمالي', en: 'Gross Rent Multiplier Calculator' },
    description: { ar: 'احسب مضاعف الإيجار الإجمالي من سعر العقار ودخله الإيجاري.', en: 'Calculate gross rent multiplier from property price and rental income.' },
    note: { ar: 'المضاعف مقياس أولي سريع ولا يأخذ مصروفات التشغيل في الاعتبار.', en: 'GRM is a quick screening metric and ignores operating expenses.' },
    inputs: [
        field('price', 'سعر العقار', 'Property price', 240000),
        field('monthlyRent', 'الإيجار الشهري الإجمالي', 'Gross monthly rent', 2000, { min: 0.01 }),
    ],
    calculate: (values, language) => output(
        amount(values.price / (values.monthlyRent * 12), 'x'),
        localized(language, 'مضاعف الإيجار الإجمالي', 'Gross rent multiplier'),
    ),
});

const realEstateDefinitions = Object.freeze({
    [rentalYield.id]: rentalYield,
    [capRate.id]: capRate,
    [cashOnCash.id]: cashOnCash,
    [pricePerArea.id]: pricePerArea,
    [appreciation.id]: appreciation,
    [downPayment.id]: downPayment,
    [closingCosts.id]: closingCosts,
    [vacancyLoss.id]: vacancyLoss,
    [propertyTax.id]: propertyTax,
    [grossRentMultiplier.id]: grossRentMultiplier,
});

export { realEstateDefinitions };

// END OF FILE
