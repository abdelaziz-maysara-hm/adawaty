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
        category: 'home-lifestyle',
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

const lawnSeed = tool({
    id: 'lawn-seed-quantity-calculator',
    icon: 'SEED',
    title: { ar: 'حاسبة كمية بذور العشب', en: 'Lawn Seed Quantity Calculator' },
    description: { ar: 'احسب وزن بذور العشب المطلوب من المساحة ومعدل البذر.', en: 'Calculate grass seed needed from lawn area and seeding rate.' },
    note: { ar: 'استخدم معدل البذر الموصى به لنوع البذور والغرض من الزراعة.', en: 'Use the recommended rate for the seed variety and planting purpose.' },
    inputs: [
        field('area', 'مساحة العشب', 'Lawn area', 250, { unit: { ar: 'م²', en: 'm²' } }),
        field('rate', 'معدل البذر', 'Seeding rate', 35, { unit: { ar: 'جم/م²', en: 'g/m²' } }),
        field('waste', 'احتياطي الفاقد', 'Waste allowance', 5, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate: (values, language) => output(amount(values.area * values.rate / 1000 * (1 + values.waste / 100), 'kg'), localized(language, 'كمية البذور المطلوبة', 'Seed required')),
});

const sodRolls = tool({
    id: 'sod-roll-count-calculator',
    icon: 'SOD',
    title: { ar: 'حاسبة عدد لفائف العشب الجاهز', en: 'Sod Roll Count Calculator' },
    description: { ar: 'احسب عدد لفائف العشب الجاهز المطلوبة لتغطية مساحة.', en: 'Calculate sod rolls required to cover a lawn area.' },
    note: { ar: 'أضف نسبة فاقد للقص والحواف والأشكال غير المنتظمة.', en: 'Include waste for cuts, edges and irregular shapes.' },
    inputs: [
        field('area', 'المساحة المطلوب تغطيتها', 'Area to cover', 120, { unit: { ar: 'م²', en: 'm²' } }),
        field('rollArea', 'مساحة اللفة الواحدة', 'Area per roll', 1, { min: 0.001, unit: { ar: 'م²', en: 'm²' } }),
        field('waste', 'نسبة الفاقد', 'Waste allowance', 8, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate: (values, language) => output(Math.ceil(values.area * (1 + values.waste / 100) / values.rollArea), localized(language, 'عدد اللفائف المطلوبة', 'Rolls required')),
});

const mulch = tool({
    id: 'garden-mulch-calculator',
    icon: 'MULCH',
    title: { ar: 'حاسبة كمية نشارة الحديقة', en: 'Garden Mulch Calculator' },
    description: { ar: 'احسب حجم النشارة المطلوب لتغطية أحواض الزراعة بعمق محدد.', en: 'Calculate mulch volume for garden beds at a chosen depth.' },
    note: { ar: 'يُحوّل عمق السنتيمترات تلقائيًا إلى أمتار.', en: 'Depth in centimeters is converted to meters automatically.' },
    inputs: [
        field('area', 'مساحة الحوض', 'Bed area', 40, { unit: { ar: 'م²', en: 'm²' } }),
        field('depth', 'عمق النشارة', 'Mulch depth', 7.5, { unit: { ar: 'سم', en: 'cm' } }),
        field('waste', 'احتياطي الهبوط والفاقد', 'Settlement and waste', 10, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const volume = values.area * values.depth / 100 * (1 + values.waste / 100);
        return output(amount(volume, 'm³'), localized(language, 'حجم النشارة المطلوب', 'Mulch volume required'), amount(volume * 1000, 'L'));
    },
});

const fertilizer = tool({
    id: 'garden-fertilizer-application-calculator',
    icon: 'NPK',
    title: { ar: 'حاسبة كمية سماد الحديقة', en: 'Garden Fertilizer Application Calculator' },
    description: { ar: 'احسب كمية السماد المطلوبة من المساحة ومعدل الاستخدام.', en: 'Calculate fertilizer required from area and application rate.' },
    note: { ar: 'اتبع تعليمات المنتج ولا تتجاوز الجرعة الموصى بها.', en: 'Follow the product label and never exceed the recommended rate.' },
    inputs: [
        field('area', 'مساحة الاستخدام', 'Application area', 150, { unit: { ar: 'م²', en: 'm²' } }),
        field('rate', 'معدل الاستخدام لكل 100 م²', 'Rate per 100 m²', 3, { unit: { ar: 'كجم', en: 'kg' } }),
    ],
    calculate: (values, language) => output(amount(values.area / 100 * values.rate, 'kg'), localized(language, 'كمية السماد المطلوبة', 'Fertilizer required')),
});

const irrigationWater = tool({
    id: 'garden-irrigation-water-calculator',
    icon: 'WATER',
    title: { ar: 'حاسبة مياه ري الحديقة', en: 'Garden Irrigation Water Calculator' },
    description: { ar: 'احسب حجم المياه اللازم لتوفير عمق ري محدد لمساحة.', en: 'Calculate water volume needed to apply a target irrigation depth.' },
    note: { ar: 'كل مليمتر ماء فوق متر مربع يساوي لترًا واحدًا.', en: 'One millimeter of water over one square meter equals one liter.' },
    inputs: [
        field('area', 'المساحة المروية', 'Irrigated area', 200, { unit: { ar: 'م²', en: 'm²' } }),
        field('depth', 'عمق الري المطلوب', 'Target water depth', 15, { unit: { ar: 'مم', en: 'mm' } }),
        field('efficiency', 'كفاءة نظام الري', 'Irrigation efficiency', 80, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate: (values, language) => output(amount(values.area * values.depth / (values.efficiency / 100), 'L'), localized(language, 'المياه المطلوبة', 'Water required')),
});

const sprinklerRuntime = tool({
    id: 'sprinkler-runtime-calculator',
    icon: 'SPR',
    title: { ar: 'حاسبة زمن تشغيل الرشاشات', en: 'Sprinkler Runtime Calculator' },
    description: { ar: 'احسب زمن تشغيل نظام الرش للوصول إلى عمق ري مستهدف.', en: 'Calculate sprinkler runtime to reach a target irrigation depth.' },
    note: { ar: 'قِس معدل الهطول الفعلي للنظام للحصول على نتيجة أدق.', en: 'Measure the system precipitation rate for better accuracy.' },
    inputs: [
        field('depth', 'عمق الري المطلوب', 'Target water depth', 12, { unit: { ar: 'مم', en: 'mm' } }),
        field('precipitationRate', 'معدل هطول الرشاشات', 'Sprinkler precipitation rate', 20, { min: 0.001, unit: { ar: 'مم/ساعة', en: 'mm/hour' } }),
    ],
    calculate: (values, language) => output(amount(values.depth / values.precipitationRate * 60, 'minutes'), localized(language, 'زمن التشغيل', 'Runtime')),
});

const plantSpacing = tool({
    id: 'garden-plant-spacing-calculator',
    icon: 'GRID',
    title: { ar: 'حاسبة عدد النباتات حسب المسافات', en: 'Garden Plant Spacing Calculator' },
    description: { ar: 'قدّر عدد النباتات في مساحة مستطيلة وفق مسافة الزراعة.', en: 'Estimate plants in a rectangular area from row and plant spacing.' },
    note: { ar: 'النتيجة للشبكة المستطيلة ولا تخصم الممرات.', en: 'The estimate uses a rectangular grid and does not subtract paths.' },
    inputs: [
        field('length', 'طول الحوض', 'Bed length', 10, { unit: { ar: 'م', en: 'm' } }),
        field('width', 'عرض الحوض', 'Bed width', 4, { unit: { ar: 'م', en: 'm' } }),
        field('rowSpacing', 'المسافة بين الصفوف', 'Row spacing', 50, { min: 0.1, unit: { ar: 'سم', en: 'cm' } }),
        field('plantSpacing', 'المسافة بين النباتات', 'Plant spacing', 40, { min: 0.1, unit: { ar: 'سم', en: 'cm' } }),
    ],
    calculate: (values, language) => output(Math.floor(values.length * 100 / values.plantSpacing) * Math.floor(values.width * 100 / values.rowSpacing), localized(language, 'عدد النباتات التقديري', 'Estimated plant count')),
});

const hedgePlants = tool({
    id: 'hedge-plant-count-calculator',
    icon: 'HEDGE',
    title: { ar: 'حاسبة عدد نباتات السياج', en: 'Hedge Plant Count Calculator' },
    description: { ar: 'احسب عدد الشجيرات اللازمة لطول سياج ومسافة غرس محددة.', en: 'Calculate shrubs needed for a hedge length and planting spacing.' },
    note: { ar: 'يشمل الحساب نباتًا في بداية الخط ونهايته.', en: 'The count includes a plant at each end of the hedge.' },
    inputs: [
        field('length', 'طول السياج', 'Hedge length', 25, { unit: { ar: 'م', en: 'm' } }),
        field('spacing', 'مسافة الغرس', 'Plant spacing', 60, { min: 0.1, unit: { ar: 'سم', en: 'cm' } }),
        field('rows', 'عدد الصفوف', 'Rows', 1, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => output((Math.ceil(values.length * 100 / values.spacing) + 1) * values.rows, localized(language, 'عدد النباتات المطلوبة', 'Plants required')),
});

const compostBlend = tool({
    id: 'compost-blend-calculator',
    icon: 'COMP',
    title: { ar: 'حاسبة خلط الكمبوست مع التربة', en: 'Compost Blend Calculator' },
    description: { ar: 'احسب كمية الكمبوست والتربة لمزيج بحجم ونسبة محددين.', en: 'Calculate compost and soil amounts for a target blend volume.' },
    note: { ar: 'استخدم نسبة مناسبة للنبات ونوع التربة.', en: 'Choose a blend percentage suitable for the plant and soil type.' },
    inputs: [
        field('totalVolume', 'حجم المزيج الكلي', 'Total blend volume', 500, { unit: { ar: 'لتر', en: 'L' } }),
        field('compostPercent', 'نسبة الكمبوست', 'Compost percentage', 30, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const compost = values.totalVolume * values.compostPercent / 100;
        return output(amount(compost, 'L'), localized(language, 'كمية الكمبوست', 'Compost amount'), `${localized(language, 'التربة', 'Soil')}: ${amount(values.totalVolume - compost, 'L')}`);
    },
});

const rainwater = tool({
    id: 'rainwater-harvesting-calculator',
    icon: 'RAIN',
    title: { ar: 'حاسبة تجميع مياه الأمطار', en: 'Rainwater Harvesting Calculator' },
    description: { ar: 'قدّر كمية مياه الأمطار الممكن جمعها من سطح.', en: 'Estimate rainwater that can be collected from a roof catchment.' },
    note: { ar: 'معامل الجمع يراعي الفقد بسبب البلل والتسرب والتجاوز.', en: 'Collection efficiency accounts for wetting, leakage and overflow losses.' },
    inputs: [
        field('roofArea', 'مساحة سطح التجميع', 'Catchment roof area', 120, { unit: { ar: 'م²', en: 'm²' } }),
        field('rainfall', 'كمية المطر', 'Rainfall depth', 25, { unit: { ar: 'مم', en: 'mm' } }),
        field('efficiency', 'كفاءة الجمع', 'Collection efficiency', 85, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate: (values, language) => output(amount(values.roofArea * values.rainfall * values.efficiency / 100, 'L'), localized(language, 'المياه القابلة للجمع', 'Collectable rainwater')),
});

const gardenLandscapeDefinitions = Object.freeze({
    [lawnSeed.id]: lawnSeed,
    [sodRolls.id]: sodRolls,
    [mulch.id]: mulch,
    [fertilizer.id]: fertilizer,
    [irrigationWater.id]: irrigationWater,
    [sprinklerRuntime.id]: sprinklerRuntime,
    [plantSpacing.id]: plantSpacing,
    [hedgePlants.id]: hedgePlants,
    [compostBlend.id]: compostBlend,
    [rainwater.id]: rainwater,
});

export { gardenLandscapeDefinitions };

// END OF FILE
