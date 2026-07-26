const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

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
        max: options.max ?? 1e12,
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

function amount(value, suffix = '') {
    return `${formatter.format(value)}${suffix}`;
}

const acquisitionCost = tool({
    id: 'customer-acquisition-cost-calculator',
    icon: 'CAC',
    title: { ar: 'حاسبة تكلفة اكتساب العميل', en: 'Customer Acquisition Cost Calculator' },
    description: { ar: 'احسب متوسط تكلفة اكتساب عميل جديد من مصروفات التسويق والمبيعات.', en: 'Calculate average customer acquisition cost from marketing and sales spend.' },
    note: { ar: 'قسّم إجمالي تكاليف الاكتساب على عدد العملاء الجدد.', en: 'Divides total acquisition spend by new customers.' },
    inputs: [
        field('marketing', 'تكلفة التسويق', 'Marketing spend', 10000),
        field('sales', 'تكلفة المبيعات', 'Sales spend', 5000),
        field('customers', 'العملاء الجدد', 'New customers', 100, { min: 1, step: 1 }),
    ],
    calculate(values, language) {
        return output(amount((values.marketing + values.sales) / values.customers), localized(language, 'تكلفة اكتساب العميل', 'Customer acquisition cost'));
    },
});

const lifetimeValue = tool({
    id: 'customer-lifetime-value-calculator',
    icon: 'CLV',
    title: { ar: 'حاسبة القيمة الدائمة للعميل', en: 'Customer Lifetime Value Calculator' },
    description: { ar: 'قدّر قيمة العميل طوال فترة تعامله من سلوكه الشرائي والهامش.', en: 'Estimate customer lifetime value from purchasing behaviour and margin.' },
    note: { ar: 'النتيجة تقديرية بافتراض ثبات السلوك طوال الفترة.', en: 'Assumes purchasing behaviour remains stable over the period.' },
    inputs: [
        field('orderValue', 'متوسط قيمة الطلب', 'Average order value', 50),
        field('frequency', 'الطلبات سنويًا', 'Orders per year', 6, { min: 0 }),
        field('margin', 'هامش الربح الإجمالي', 'Gross margin', 40, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
        field('years', 'عمر العميل بالسنوات', 'Customer lifespan', 3, { min: 0 }),
    ],
    calculate(values, language) {
        const value = values.orderValue * values.frequency * values.margin / 100 * values.years;
        return output(amount(value), localized(language, 'القيمة الدائمة للعميل', 'Customer lifetime value'));
    },
});

const roas = tool({
    id: 'return-on-ad-spend-calculator',
    icon: 'ROAS',
    title: { ar: 'حاسبة العائد على الإنفاق الإعلاني', en: 'Return on Ad Spend Calculator' },
    description: { ar: 'احسب العائد الناتج عن كل وحدة نقدية من الإنفاق الإعلاني.', en: 'Calculate revenue generated per unit of advertising spend.' },
    note: { ar: 'ROAS لا يخصم تكلفة المنتج أو المصروفات الأخرى.', en: 'ROAS does not deduct product cost or other expenses.' },
    inputs: [
        field('revenue', 'إيراد الحملة', 'Campaign revenue', 20000),
        field('spend', 'الإنفاق الإعلاني', 'Ad spend', 5000, { min: 0.01 }),
    ],
    calculate(values, language) {
        const ratio = values.revenue / values.spend;
        return output(`${amount(ratio)}x`, localized(language, 'العائد على الإنفاق', 'Return on ad spend'), `${amount(ratio * 100, '%')}`);
    },
});

const conversionRate = tool({
    id: 'ecommerce-conversion-rate-calculator',
    icon: 'CVR',
    title: { ar: 'حاسبة معدل التحويل', en: 'Ecommerce Conversion Rate Calculator' },
    description: { ar: 'احسب نسبة الزوار الذين أتموا عملية شراء أو هدفًا.', en: 'Calculate the percentage of visitors who completed a purchase or goal.' },
    note: { ar: 'يجب ألا يزيد عدد التحويلات عن عدد الزوار.', en: 'Conversions cannot exceed visitor count.' },
    inputs: [
        field('conversions', 'عدد التحويلات', 'Conversions', 250, { step: 1 }),
        field('visitors', 'عدد الزوار', 'Visitors', 10000, { min: 1, step: 1 }),
    ],
    calculate(values, language) {
        if (values.conversions > values.visitors) throw new Error(localized(language, 'التحويلات أكبر من الزوار.', 'Conversions exceed visitors.'));
        return output(amount(values.conversions / values.visitors * 100, '%'), localized(language, 'معدل التحويل', 'Conversion rate'));
    },
});

const abandonmentRate = tool({
    id: 'cart-abandonment-rate-calculator',
    icon: 'CART',
    title: { ar: 'حاسبة معدل ترك السلة', en: 'Cart Abandonment Rate Calculator' },
    description: { ar: 'احسب نسبة سلال التسوق التي لم تتحول إلى طلبات مكتملة.', en: 'Calculate the percentage of shopping carts not completed as orders.' },
    note: { ar: 'عدد الطلبات المكتملة لا يتجاوز عدد السلال المنشأة.', en: 'Completed orders cannot exceed carts created.' },
    inputs: [
        field('carts', 'السلال المنشأة', 'Carts created', 1000, { min: 1, step: 1 }),
        field('orders', 'الطلبات المكتملة', 'Completed orders', 300, { step: 1 }),
    ],
    calculate(values, language) {
        if (values.orders > values.carts) throw new Error(localized(language, 'الطلبات أكبر من السلال.', 'Orders exceed carts.'));
        return output(amount((values.carts - values.orders) / values.carts * 100, '%'), localized(language, 'معدل ترك السلة', 'Cart abandonment rate'));
    },
});

const inventoryTurnover = tool({
    id: 'inventory-turnover-calculator',
    icon: 'INV',
    title: { ar: 'حاسبة معدل دوران المخزون', en: 'Inventory Turnover Calculator' },
    description: { ar: 'احسب عدد مرات بيع واستبدال متوسط المخزون خلال فترة.', en: 'Calculate how often average inventory is sold and replaced.' },
    note: { ar: 'يستخدم تكلفة البضاعة المباعة ومتوسط المخزون.', en: 'Uses cost of goods sold and average inventory.' },
    inputs: [
        field('cogs', 'تكلفة البضاعة المباعة', 'Cost of goods sold', 120000),
        field('beginning', 'مخزون بداية الفترة', 'Beginning inventory', 20000),
        field('ending', 'مخزون نهاية الفترة', 'Ending inventory', 30000),
    ],
    calculate(values, language) {
        const average = (values.beginning + values.ending) / 2;
        if (average === 0) throw new Error(localized(language, 'متوسط المخزون يساوي صفرًا.', 'Average inventory is zero.'));
        return output(`${amount(values.cogs / average)}x`, localized(language, 'دوران المخزون', 'Inventory turnover'), `${localized(language, 'متوسط المخزون', 'Average inventory')}: ${amount(average)}`);
    },
});

const reorderPoint = tool({
    id: 'inventory-reorder-point-calculator',
    icon: 'ROP',
    title: { ar: 'حاسبة نقطة إعادة الطلب', en: 'Inventory Reorder Point Calculator' },
    description: { ar: 'احسب مستوى المخزون الذي ينبغي عنده إنشاء طلب توريد جديد.', en: 'Calculate the stock level at which a new supply order should be placed.' },
    note: { ar: 'نقطة الطلب تساوي الطلب اليومي خلال مهلة التوريد مضافًا إليه مخزون الأمان.', en: 'Reorder point equals lead-time demand plus safety stock.' },
    inputs: [
        field('dailySales', 'متوسط المبيعات اليومية', 'Average daily sales', 20),
        field('leadDays', 'مهلة التوريد بالأيام', 'Lead time in days', 7, { step: 1 }),
        field('safetyStock', 'مخزون الأمان', 'Safety stock', 50),
    ],
    calculate(values, language) {
        return output(Math.ceil(values.dailySales * values.leadDays + values.safetyStock), localized(language, 'نقطة إعادة الطلب', 'Reorder point'));
    },
});

const dimensionalWeight = tool({
    id: 'shipping-dimensional-weight-calculator',
    icon: 'DIM',
    title: { ar: 'حاسبة الوزن الحجمي للشحن', en: 'Shipping Dimensional Weight Calculator' },
    description: { ar: 'احسب الوزن الحجمي للطرد من أبعاده ومعامل شركة الشحن.', en: 'Calculate parcel dimensional weight from dimensions and carrier divisor.' },
    note: { ar: 'للأبعاد بالسنتيمتر يُستخدم معامل 5000 أو 6000 غالبًا.', en: 'A divisor of 5,000 or 6,000 is common for centimetres.' },
    inputs: [
        field('length', 'الطول', 'Length', 40, { min: 0.01, unit: { ar: 'سم', en: 'cm' } }),
        field('width', 'العرض', 'Width', 30, { min: 0.01, unit: { ar: 'سم', en: 'cm' } }),
        field('height', 'الارتفاع', 'Height', 20, { min: 0.01, unit: { ar: 'سم', en: 'cm' } }),
        field('divisor', 'المعامل الحجمي', 'Dimensional divisor', 5000, { min: 0.01 }),
    ],
    calculate(values, language) {
        return output(amount(values.length * values.width * values.height / values.divisor, ' kg'), localized(language, 'الوزن الحجمي', 'Dimensional weight'));
    },
});

const marketplaceFee = tool({
    id: 'marketplace-fee-profit-calculator',
    icon: 'FEE',
    title: { ar: 'حاسبة رسوم وربح المتجر الإلكتروني', en: 'Marketplace Fee and Profit Calculator' },
    description: { ar: 'احسب رسوم المنصة وصافي ربح بيع منتج عبر متجر إلكتروني.', en: 'Calculate marketplace fees and net profit for an online sale.' },
    note: { ar: 'أدخل النسبة والرسوم الثابتة وفق المنصة التي تستخدمها.', en: 'Enter the percentage and fixed fees for your marketplace.' },
    inputs: [
        field('price', 'سعر البيع', 'Sale price', 100),
        field('feePercent', 'نسبة رسوم المنصة', 'Marketplace fee', 12, { max: 100, unit: { ar: '%', en: '%' } }),
        field('fixedFee', 'الرسوم الثابتة', 'Fixed fee', 0.3),
        field('productCost', 'تكلفة المنتج', 'Product cost', 40),
        field('shippingCost', 'تكلفة الشحن', 'Shipping cost', 10),
    ],
    calculate(values, language) {
        const fee = values.price * values.feePercent / 100 + values.fixedFee;
        const profit = values.price - fee - values.productCost - values.shippingCost;
        return output(amount(profit), localized(language, 'صافي الربح', 'Net profit'), `${localized(language, 'رسوم المنصة', 'Marketplace fees')}: ${amount(fee)}`);
    },
});

const retentionRate = tool({
    id: 'customer-retention-rate-calculator',
    icon: 'CRR',
    title: { ar: 'حاسبة معدل الاحتفاظ بالعملاء', en: 'Customer Retention Rate Calculator' },
    description: { ar: 'احسب نسبة العملاء الذين احتفظت بهم خلال فترة.', en: 'Calculate the percentage of customers retained during a period.' },
    note: { ar: 'يُستبعد العملاء الجدد من عدد نهاية الفترة.', en: 'New customers are excluded from the ending count.' },
    inputs: [
        field('start', 'عملاء بداية الفترة', 'Starting customers', 1000, { min: 1, step: 1 }),
        field('end', 'عملاء نهاية الفترة', 'Ending customers', 1100, { step: 1 }),
        field('newCustomers', 'العملاء الجدد', 'New customers', 200, { step: 1 }),
    ],
    calculate(values, language) {
        const retained = values.end - values.newCustomers;
        if (retained < 0) throw new Error(localized(language, 'العملاء الجدد أكبر من رصيد نهاية الفترة.', 'New customers exceed the ending customer count.'));
        return output(amount(retained / values.start * 100, '%'), localized(language, 'معدل الاحتفاظ', 'Retention rate'));
    },
});

const ecommerceBusinessDefinitions = Object.freeze({
    [acquisitionCost.id]: acquisitionCost,
    [lifetimeValue.id]: lifetimeValue,
    [roas.id]: roas,
    [conversionRate.id]: conversionRate,
    [abandonmentRate.id]: abandonmentRate,
    [inventoryTurnover.id]: inventoryTurnover,
    [reorderPoint.id]: reorderPoint,
    [dimensionalWeight.id]: dimensionalWeight,
    [marketplaceFee.id]: marketplaceFee,
    [retentionRate.id]: retentionRate,
});

export { ecommerceBusinessDefinitions };

// END OF FILE
