const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 3,
});

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function numberInput(id, label, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000_000,
        step: options.step ?? 'any',
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function amount(value, unit = '') {
    return `${formatter.format(value)} ${unit}`.trim();
}

const fuelCost = Object.freeze({
    id: 'fuel-cost-calculator',
    category: 'home-lifestyle',
    icon: '⛽',
    title: Object.freeze({ ar: 'حاسبة تكلفة الوقود', en: 'Fuel Cost Calculator' }),
    description: Object.freeze({ ar: 'احسب كمية الوقود وتكلفة رحلة من المسافة ومعدل الاستهلاك.', en: 'Calculate fuel needed and trip cost from distance and consumption.' }),
    note: Object.freeze({ ar: 'استخدم معدل الاستهلاك باللتر لكل 100 كيلومتر.', en: 'Enter consumption in litres per 100 kilometres.' }),
    inputs: Object.freeze([
        numberInput('distance', { ar: 'المسافة', en: 'Distance' }, 350, { min: 0.01, unit: { ar: 'كم', en: 'km' } }),
        numberInput('consumption', { ar: 'معدل الاستهلاك', en: 'Fuel consumption' }, 7.5, { min: 0.01, unit: { ar: 'لتر/100كم', en: 'L/100km' } }),
        numberInput('price', { ar: 'سعر اللتر', en: 'Price per litre' }, 15, { min: 0 }),
    ]),
    calculate(values, language) {
        const litres = values.distance * values.consumption / 100;
        return output(
            amount(litres * values.price),
            localized(language, 'تكلفة الوقود', 'Fuel cost'),
            `${amount(litres, 'L')} required`,
        );
    },
});

const fuelEconomy = Object.freeze({
    id: 'fuel-economy-calculator',
    category: 'home-lifestyle',
    icon: 'km/L',
    title: Object.freeze({ ar: 'حاسبة كفاءة الوقود', en: 'Fuel Economy Calculator' }),
    description: Object.freeze({ ar: 'احسب كفاءة السيارة من المسافة المقطوعة والوقود المستخدم.', en: 'Calculate vehicle efficiency from distance travelled and fuel used.' }),
    note: Object.freeze({ ar: 'تعرض النتيجة بصيغتي كم/لتر ولتر/100كم.', en: 'Shows both km/L and L/100km.' }),
    inputs: Object.freeze([
        numberInput('distance', { ar: 'المسافة', en: 'Distance' }, 500, { min: 0.01, unit: { ar: 'كم', en: 'km' } }),
        numberInput('fuel', { ar: 'الوقود المستخدم', en: 'Fuel used' }, 40, { min: 0.01, unit: { ar: 'لتر', en: 'L' } }),
    ]),
    calculate(values, language) {
        const kilometresPerLitre = values.distance / values.fuel;
        return output(
            amount(kilometresPerLitre, 'km/L'),
            localized(language, 'كفاءة الوقود', 'Fuel economy'),
            `${amount(100 / kilometresPerLitre, 'L/100km')}`,
        );
    },
});

const roadTrip = Object.freeze({
    id: 'road-trip-cost-calculator',
    category: 'home-lifestyle',
    icon: '🚗',
    title: Object.freeze({ ar: 'حاسبة تكلفة رحلة السيارة', en: 'Road Trip Cost Calculator' }),
    description: Object.freeze({ ar: 'قدّر تكلفة الوقود والرسوم لرحلة ذهاب وعودة.', en: 'Estimate fuel and toll costs for a one-way or return road trip.' }),
    note: Object.freeze({ ar: 'أدخل المسافة الكلية المراد قطعها.', en: 'Enter the total distance you plan to travel.' }),
    inputs: Object.freeze([
        numberInput('distance', { ar: 'المسافة الكلية', en: 'Total distance' }, 700, { min: 0.01, unit: { ar: 'كم', en: 'km' } }),
        numberInput('consumption', { ar: 'معدل الاستهلاك', en: 'Fuel consumption' }, 8, { min: 0.01, unit: { ar: 'لتر/100كم', en: 'L/100km' } }),
        numberInput('fuelPrice', { ar: 'سعر اللتر', en: 'Fuel price per litre' }, 15, { min: 0 }),
        numberInput('tolls', { ar: 'الرسوم والمواقف', en: 'Tolls and parking' }, 100, { min: 0 }),
    ]),
    calculate(values, language) {
        const fuel = values.distance * values.consumption / 100;
        const fuelCostValue = fuel * values.fuelPrice;
        return output(
            amount(fuelCostValue + values.tolls),
            localized(language, 'إجمالي تكلفة الرحلة', 'Total trip cost'),
            `${amount(fuelCostValue)} fuel + ${amount(values.tolls)} extras`,
        );
    },
});

const electricityCost = Object.freeze({
    id: 'electricity-cost-calculator',
    category: 'home-lifestyle',
    icon: 'kWh',
    title: Object.freeze({ ar: 'حاسبة تكلفة الكهرباء', en: 'Electricity Cost Calculator' }),
    description: Object.freeze({ ar: 'احسب استهلاك جهاز وتكلفته خلال عدد محدد من الأيام.', en: 'Calculate an appliance energy use and cost over a chosen period.' }),
    note: Object.freeze({ ar: 'التكلفة الفعلية قد تختلف مع الشرائح والرسوم المحلية.', en: 'Actual billing may differ due to local tiers and fees.' }),
    inputs: Object.freeze([
        numberInput('watts', { ar: 'قدرة الجهاز', en: 'Appliance power' }, 1500, { min: 0.01, unit: { ar: 'واط', en: 'W' } }),
        numberInput('hours', { ar: 'ساعات التشغيل يوميًا', en: 'Hours per day' }, 4, { min: 0, max: 24, unit: { ar: 'ساعة', en: 'hours' } }),
        numberInput('days', { ar: 'عدد الأيام', en: 'Number of days' }, 30, { min: 1, max: 366, step: 1 }),
        numberInput('rate', { ar: 'سعر الكيلوواط ساعة', en: 'Price per kWh' }, 1.5, { min: 0 }),
    ]),
    calculate(values, language) {
        const kilowattHours = (values.watts / 1000) * values.hours * values.days;
        return output(
            amount(kilowattHours * values.rate),
            localized(language, 'تكلفة الكهرباء', 'Electricity cost'),
            `${amount(kilowattHours, 'kWh')} consumed`,
        );
    },
});

const paintCalculator = Object.freeze({
    id: 'paint-calculator',
    category: 'home-lifestyle',
    icon: '🎨',
    title: Object.freeze({ ar: 'حاسبة كمية الدهان', en: 'Paint Calculator' }),
    description: Object.freeze({ ar: 'قدّر كمية الدهان المطلوبة من مساحة الجدران وعدد الطبقات.', en: 'Estimate paint required from wall area and number of coats.' }),
    note: Object.freeze({ ar: 'اطرح مساحة الأبواب والنوافذ من مساحة الجدران أولًا.', en: 'Subtract doors and windows from the wall area first.' }),
    inputs: Object.freeze([
        numberInput('area', { ar: 'مساحة الجدران', en: 'Wall area' }, 80, { min: 0.01, unit: { ar: 'م²', en: 'm²' } }),
        numberInput('coats', { ar: 'عدد الطبقات', en: 'Number of coats' }, 2, { min: 1, max: 10, step: 1 }),
        numberInput('coverage', { ar: 'تغطية اللتر', en: 'Coverage per litre' }, 10, { min: 0.01, unit: { ar: 'م²/لتر', en: 'm²/L' } }),
        numberInput('waste', { ar: 'هامش الهدر', en: 'Waste allowance' }, 10, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    calculate(values, language) {
        const litres = values.area * values.coats / values.coverage
            * (1 + values.waste / 100);
        return output(
            amount(litres, 'L'),
            localized(language, 'كمية الدهان التقديرية', 'Estimated paint required'),
            `${Math.ceil(litres)} L rounded up`,
        );
    },
});

const tileCalculator = Object.freeze({
    id: 'tile-calculator',
    category: 'home-lifestyle',
    icon: '▦',
    title: Object.freeze({ ar: 'حاسبة عدد البلاط', en: 'Tile Calculator' }),
    description: Object.freeze({ ar: 'احسب عدد البلاطات اللازمة لمساحة أرضية مع هامش للقص والهدر.', en: 'Calculate tiles needed for a floor area with cutting and waste allowance.' }),
    note: Object.freeze({ ar: 'أبعاد البلاطة بالسنتيمتر ومساحة الأرض بالمتر المربع.', en: 'Tile dimensions use centimetres and floor area uses square metres.' }),
    inputs: Object.freeze([
        numberInput('area', { ar: 'مساحة الأرض', en: 'Floor area' }, 24, { min: 0.01, unit: { ar: 'م²', en: 'm²' } }),
        numberInput('tileWidth', { ar: 'عرض البلاطة', en: 'Tile width' }, 60, { min: 0.01, unit: { ar: 'سم', en: 'cm' } }),
        numberInput('tileLength', { ar: 'طول البلاطة', en: 'Tile length' }, 60, { min: 0.01, unit: { ar: 'سم', en: 'cm' } }),
        numberInput('waste', { ar: 'هامش الهدر', en: 'Waste allowance' }, 10, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    calculate(values, language) {
        const tileArea = values.tileWidth * values.tileLength / 10_000;
        const count = Math.ceil(values.area * (1 + values.waste / 100) / tileArea);
        return output(
            `${count}`,
            localized(language, 'عدد البلاطات', 'Tiles required'),
            `${amount(count * tileArea, 'm²')} purchased area`,
        );
    },
});

const concreteCalculator = Object.freeze({
    id: 'concrete-volume-calculator',
    category: 'home-lifestyle',
    icon: 'm³',
    title: Object.freeze({ ar: 'حاسبة حجم الخرسانة', en: 'Concrete Volume Calculator' }),
    description: Object.freeze({ ar: 'احسب حجم الخرسانة لبلاطة مستطيلة مع هامش إضافي.', en: 'Calculate concrete volume for a rectangular slab with an allowance.' }),
    note: Object.freeze({ ar: 'حوّل السمك إلى متر قبل الحساب تلقائيًا.', en: 'Thickness is automatically converted from centimetres to metres.' }),
    inputs: Object.freeze([
        numberInput('length', { ar: 'الطول', en: 'Length' }, 6, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        numberInput('width', { ar: 'العرض', en: 'Width' }, 4, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        numberInput('thickness', { ar: 'السمك', en: 'Thickness' }, 15, { min: 0.01, unit: { ar: 'سم', en: 'cm' } }),
        numberInput('waste', { ar: 'هامش إضافي', en: 'Extra allowance' }, 5, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    calculate(values, language) {
        const volume = values.length * values.width
            * (values.thickness / 100)
            * (1 + values.waste / 100);
        return output(amount(volume, 'm³'), localized(language, 'حجم الخرسانة', 'Concrete volume'));
    },
});

const wallpaperCalculator = Object.freeze({
    id: 'wallpaper-roll-calculator',
    category: 'home-lifestyle',
    icon: '▥',
    title: Object.freeze({ ar: 'حاسبة لفات ورق الحائط', en: 'Wallpaper Roll Calculator' }),
    description: Object.freeze({ ar: 'قدّر عدد لفات ورق الحائط من مساحة الجدران وتغطية اللفة.', en: 'Estimate wallpaper rolls from wall area and roll coverage.' }),
    note: Object.freeze({ ar: 'أضف هامشًا أكبر للنقوش التي تحتاج إلى مطابقة.', en: 'Use a larger allowance for patterns that require matching.' }),
    inputs: Object.freeze([
        numberInput('area', { ar: 'مساحة الجدران', en: 'Wall area' }, 45, { min: 0.01, unit: { ar: 'م²', en: 'm²' } }),
        numberInput('coverage', { ar: 'تغطية اللفة', en: 'Coverage per roll' }, 5.2, { min: 0.01, unit: { ar: 'م²', en: 'm²' } }),
        numberInput('waste', { ar: 'هامش الهدر', en: 'Waste allowance' }, 15, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    calculate(values, language) {
        const rolls = Math.ceil(values.area * (1 + values.waste / 100) / values.coverage);
        return output(`${rolls}`, localized(language, 'عدد اللفات', 'Rolls required'));
    },
});

const recipeScaler = Object.freeze({
    id: 'recipe-scaler',
    category: 'home-lifestyle',
    icon: '×',
    title: Object.freeze({ ar: 'حاسبة تكبير الوصفات', en: 'Recipe Scaler' }),
    description: Object.freeze({ ar: 'حوّل كمية أي مكون حسب عدد الحصص الأصلي والجديد.', en: 'Scale any ingredient amount for a different number of servings.' }),
    note: Object.freeze({ ar: 'استخدم نفس وحدة القياس للكمية قبل وبعد التحويل.', en: 'The scaled amount keeps the original measurement unit.' }),
    inputs: Object.freeze([
        numberInput('amount', { ar: 'كمية المكون الأصلية', en: 'Original ingredient amount' }, 250, { min: 0 }),
        numberInput('originalServings', { ar: 'الحصص الأصلية', en: 'Original servings' }, 4, { min: 0.01 }),
        numberInput('newServings', { ar: 'الحصص الجديدة', en: 'New servings' }, 10, { min: 0.01 }),
    ]),
    calculate(values, language) {
        const scaled = values.amount * values.newServings / values.originalServings;
        return output(
            amount(scaled),
            localized(language, 'الكمية الجديدة', 'Scaled amount'),
            `× ${formatter.format(values.newServings / values.originalServings)}`,
        );
    },
});

const rentAffordability = Object.freeze({
    id: 'rent-affordability-calculator',
    category: 'home-lifestyle',
    icon: '🏠',
    title: Object.freeze({ ar: 'حاسبة القدرة على تحمل الإيجار', en: 'Rent Affordability Calculator' }),
    description: Object.freeze({ ar: 'قدّر حد الإيجار الشهري من الدخل والنسبة المستهدفة والمصروفات الثابتة.', en: 'Estimate an affordable monthly rent from income, target ratio and fixed expenses.' }),
    note: Object.freeze({ ar: 'هذه أداة تخطيط عامة ولا تمثل نصيحة مالية شخصية.', en: 'This is a general planning tool, not personal financial advice.' }),
    inputs: Object.freeze([
        numberInput('income', { ar: 'صافي الدخل الشهري', en: 'Monthly net income' }, 20000, { min: 0 }),
        numberInput('ratio', { ar: 'نسبة السكن المستهدفة', en: 'Target housing ratio' }, 30, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
        numberInput('housingExpenses', { ar: 'مرافق ومصاريف سكن أخرى', en: 'Other housing expenses' }, 1000, { min: 0 }),
    ]),
    calculate(values, language) {
        const budget = Math.max(0, values.income * values.ratio / 100 - values.housingExpenses);
        return output(amount(budget), localized(language, 'حد الإيجار التقديري', 'Estimated rent budget'));
    },
});

const homeLifestyleDefinitions = Object.freeze({
    [fuelCost.id]: fuelCost,
    [fuelEconomy.id]: fuelEconomy,
    [roadTrip.id]: roadTrip,
    [electricityCost.id]: electricityCost,
    [paintCalculator.id]: paintCalculator,
    [tileCalculator.id]: tileCalculator,
    [concreteCalculator.id]: concreteCalculator,
    [wallpaperCalculator.id]: wallpaperCalculator,
    [recipeScaler.id]: recipeScaler,
    [rentAffordability.id]: rentAffordability,
});

export { homeLifestyleDefinitions };

// END OF FILE
