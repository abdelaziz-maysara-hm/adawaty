const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function result(value, language, ar, en, suffix = '') {
    return {
        value: `${formatter.format(value)}${suffix}`,
        label: localized(language, ar, en),
        details: '',
    };
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
        category: 'seo',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate: config.calculate,
    });
}

function ensurePartNotGreater(part, total, language, partName) {
    if (part > total) {
        throw new Error(localized(
            language,
            `${partName} أكبر من الإجمالي.`,
            `${partName} exceeds the total.`,
        ));
    }
}

const cpc = tool({
    id: 'cost-per-click-calculator',
    icon: 'CPC',
    title: { ar: 'حاسبة تكلفة النقرة', en: 'Cost per Click Calculator' },
    description: { ar: 'احسب متوسط تكلفة كل نقرة إعلانية.', en: 'Calculate the average cost of each advertising click.' },
    note: { ar: 'تقسم التكلفة الإجمالية على عدد النقرات.', en: 'Divides total campaign cost by clicks.' },
    inputs: [
        field('cost', 'تكلفة الحملة', 'Campaign cost', 500),
        field('clicks', 'عدد النقرات', 'Clicks', 1000, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => result(values.cost / values.clicks, language, 'تكلفة النقرة', 'Cost per click'),
});

const cpm = tool({
    id: 'cost-per-thousand-impressions-calculator',
    icon: 'CPM',
    title: { ar: 'حاسبة تكلفة الألف ظهور', en: 'Cost per Thousand Impressions Calculator' },
    description: { ar: 'احسب تكلفة كل ألف ظهور للحملة الإعلانية.', en: 'Calculate campaign cost per thousand impressions.' },
    note: { ar: 'تُعرف النتيجة اختصارًا باسم CPM.', en: 'The result is commonly known as CPM.' },
    inputs: [
        field('cost', 'تكلفة الحملة', 'Campaign cost', 1000),
        field('impressions', 'مرات الظهور', 'Impressions', 250000, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => result(values.cost / values.impressions * 1000, language, 'تكلفة الألف ظهور', 'CPM'),
});

const ctr = tool({
    id: 'click-through-rate-calculator',
    icon: 'CTR',
    title: { ar: 'حاسبة نسبة النقر إلى الظهور', en: 'Click Through Rate Calculator' },
    description: { ar: 'احسب نسبة مرات الظهور التي نتج عنها نقرات.', en: 'Calculate the percentage of impressions that produced clicks.' },
    note: { ar: 'عدد النقرات لا يتجاوز مرات الظهور.', en: 'Clicks cannot exceed impressions.' },
    inputs: [
        field('clicks', 'عدد النقرات', 'Clicks', 2500, { step: 1 }),
        field('impressions', 'مرات الظهور', 'Impressions', 100000, { min: 1, step: 1 }),
    ],
    calculate(values, language) {
        ensurePartNotGreater(values.clicks, values.impressions, language, localized(language, 'عدد النقرات', 'Clicks'));
        return result(values.clicks / values.impressions * 100, language, 'نسبة النقر', 'Click through rate', '%');
    },
});

const engagement = tool({
    id: 'social-media-engagement-rate-calculator',
    icon: 'ER',
    title: { ar: 'حاسبة معدل التفاعل', en: 'Social Media Engagement Rate Calculator' },
    description: { ar: 'احسب نسبة التفاعلات إلى الوصول أو الجمهور.', en: 'Calculate interactions as a percentage of reach or audience.' },
    note: { ar: 'اجمع الإعجابات والتعليقات والمشاركات والحفظ كتفاعلات.', en: 'Count likes, comments, shares and saves as interactions.' },
    inputs: [
        field('interactions', 'إجمالي التفاعلات', 'Total interactions', 750, { step: 1 }),
        field('reach', 'الوصول', 'Reach', 25000, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => result(values.interactions / values.reach * 100, language, 'معدل التفاعل', 'Engagement rate', '%'),
});

const openRate = tool({
    id: 'email-open-rate-calculator',
    icon: 'OPEN',
    title: { ar: 'حاسبة معدل فتح البريد', en: 'Email Open Rate Calculator' },
    description: { ar: 'احسب نسبة الرسائل المسلّمة التي تم فتحها.', en: 'Calculate the percentage of delivered emails that were opened.' },
    note: { ar: 'استخدم عدد مرات الفتح الفريدة لتجنب التكرار.', en: 'Use unique opens to avoid duplicate counting.' },
    inputs: [
        field('opens', 'مرات الفتح الفريدة', 'Unique opens', 2400, { step: 1 }),
        field('delivered', 'الرسائل المسلّمة', 'Delivered emails', 10000, { min: 1, step: 1 }),
    ],
    calculate(values, language) {
        ensurePartNotGreater(values.opens, values.delivered, language, localized(language, 'مرات الفتح', 'Opens'));
        return result(values.opens / values.delivered * 100, language, 'معدل الفتح', 'Open rate', '%');
    },
});

const emailClickRate = tool({
    id: 'email-click-rate-calculator',
    icon: 'E-CTR',
    title: { ar: 'حاسبة معدل النقر بالبريد', en: 'Email Click Rate Calculator' },
    description: { ar: 'احسب نسبة الرسائل المسلّمة التي نتج عنها نقر.', en: 'Calculate clicks as a percentage of delivered emails.' },
    note: { ar: 'استخدم النقرات الفريدة للحصول على قياس أوضح.', en: 'Use unique clicks for a clearer metric.' },
    inputs: [
        field('clicks', 'النقرات الفريدة', 'Unique clicks', 350, { step: 1 }),
        field('delivered', 'الرسائل المسلّمة', 'Delivered emails', 10000, { min: 1, step: 1 }),
    ],
    calculate(values, language) {
        ensurePartNotGreater(values.clicks, values.delivered, language, localized(language, 'النقرات', 'Clicks'));
        return result(values.clicks / values.delivered * 100, language, 'معدل النقر بالبريد', 'Email click rate', '%');
    },
});

const unsubscribe = tool({
    id: 'email-unsubscribe-rate-calculator',
    icon: 'UNSUB',
    title: { ar: 'حاسبة معدل إلغاء الاشتراك', en: 'Email Unsubscribe Rate Calculator' },
    description: { ar: 'احسب نسبة مستلمي الحملة الذين ألغوا اشتراكهم.', en: 'Calculate the percentage of campaign recipients who unsubscribed.' },
    note: { ar: 'قسّم حالات الإلغاء على الرسائل المسلّمة.', en: 'Divides unsubscribes by delivered emails.' },
    inputs: [
        field('unsubscribes', 'حالات إلغاء الاشتراك', 'Unsubscribes', 25, { step: 1 }),
        field('delivered', 'الرسائل المسلّمة', 'Delivered emails', 10000, { min: 1, step: 1 }),
    ],
    calculate(values, language) {
        ensurePartNotGreater(values.unsubscribes, values.delivered, language, localized(language, 'حالات الإلغاء', 'Unsubscribes'));
        return result(values.unsubscribes / values.delivered * 100, language, 'معدل إلغاء الاشتراك', 'Unsubscribe rate', '%');
    },
});

const leadConversion = tool({
    id: 'lead-conversion-rate-calculator',
    icon: 'LEAD',
    title: { ar: 'حاسبة معدل تحويل العملاء المحتملين', en: 'Lead Conversion Rate Calculator' },
    description: { ar: 'احسب نسبة العملاء المحتملين الذين أصبحوا عملاء فعليين.', en: 'Calculate the percentage of leads converted into customers.' },
    note: { ar: 'حدد الفترة ومصدر العملاء بنفس الطريقة للرقمين.', en: 'Use the same period and source for both values.' },
    inputs: [
        field('customers', 'العملاء المحولون', 'Converted customers', 80, { step: 1 }),
        field('leads', 'إجمالي العملاء المحتملين', 'Total leads', 1000, { min: 1, step: 1 }),
    ],
    calculate(values, language) {
        ensurePartNotGreater(values.customers, values.leads, language, localized(language, 'العملاء المحولون', 'Converted customers'));
        return result(values.customers / values.leads * 100, language, 'معدل تحويل العملاء المحتملين', 'Lead conversion rate', '%');
    },
});

const breakEvenRoas = tool({
    id: 'break-even-roas-calculator',
    icon: 'BE-ROAS',
    title: { ar: 'حاسبة ROAS لنقطة التعادل', en: 'Break-even ROAS Calculator' },
    description: { ar: 'احسب أقل عائد إعلاني مطلوب لتغطية التكلفة وفق هامش الربح.', en: 'Calculate the minimum ROAS needed to break even from gross margin.' },
    note: { ar: 'يستخدم هامش المساهمة قبل تكلفة الإعلان.', en: 'Uses contribution margin before advertising cost.' },
    inputs: [field('margin', 'هامش المساهمة', 'Contribution margin', 40, { min: 0.0001, max: 100, unit: { ar: '%', en: '%' } })],
    calculate: (values, language) => result(100 / values.margin, language, 'ROAS لنقطة التعادل', 'Break-even ROAS', 'x'),
});

const frequency = tool({
    id: 'advertising-frequency-calculator',
    icon: 'FREQ',
    title: { ar: 'حاسبة تكرار الإعلان', en: 'Advertising Frequency Calculator' },
    description: { ar: 'احسب متوسط عدد مرات مشاهدة كل شخص للإعلان.', en: 'Calculate the average number of times each person saw an ad.' },
    note: { ar: 'التكرار يساوي مرات الظهور مقسومة على الوصول.', en: 'Frequency equals impressions divided by reach.' },
    inputs: [
        field('impressions', 'مرات الظهور', 'Impressions', 300000, { step: 1 }),
        field('reach', 'الوصول الفريد', 'Unique reach', 100000, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => result(values.impressions / values.reach, language, 'متوسط التكرار', 'Average frequency', 'x'),
});

const marketingMetricDefinitions = Object.freeze({
    [cpc.id]: cpc,
    [cpm.id]: cpm,
    [ctr.id]: ctr,
    [engagement.id]: engagement,
    [openRate.id]: openRate,
    [emailClickRate.id]: emailClickRate,
    [unsubscribe.id]: unsubscribe,
    [leadConversion.id]: leadConversion,
    [breakEvenRoas.id]: breakEvenRoas,
    [frequency.id]: frequency,
});

export { marketingMetricDefinitions };

// END OF FILE
