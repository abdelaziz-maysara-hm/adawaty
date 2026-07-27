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

function tireDiameter(width, aspect, rim) {
    return (2 * width * aspect / 100) + (rim * 25.4);
}

const tireDiameterTool = tool({
    id: 'tire-size-diameter-calculator',
    icon: 'TYRE',
    title: { ar: 'حاسبة قطر الإطار', en: 'Tire Size Diameter Calculator' },
    description: { ar: 'احسب القطر الكلي ومحيط إطار السيارة من المقاس المكتوب على جانبه.', en: 'Calculate overall tire diameter and circumference from its sidewall size.' },
    note: { ar: 'أدخل المقاس مثل 225/45 R17 في الحقول الثلاثة.', en: 'Enter a size such as 225/45 R17 across the three fields.' },
    inputs: [
        field('width', 'عرض الإطار', 'Tire width', 225, { min: 1, unit: { ar: 'مم', en: 'mm' } }),
        field('aspect', 'نسبة ارتفاع الجدار', 'Aspect ratio', 45, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
        field('rim', 'قطر الجنط', 'Wheel diameter', 17, { min: 1, unit: { ar: 'بوصة', en: 'in' } }),
    ],
    calculate(values, language) {
        const diameter = tireDiameter(values.width, values.aspect, values.rim);
        return output(
            amount(diameter, 'mm'),
            localized(language, 'القطر الكلي', 'Overall diameter'),
            `${localized(language, 'المحيط', 'Circumference')}: ${amount(Math.PI * diameter, 'mm')}`,
        );
    },
});

const tireComparison = tool({
    id: 'tire-size-comparison-calculator',
    icon: 'ΔTY',
    title: { ar: 'حاسبة مقارنة مقاسات الإطارات', en: 'Tire Size Comparison Calculator' },
    description: { ar: 'قارن قطر مقاسين للإطارات واعرف نسبة الفرق بينهما.', en: 'Compare two tire diameters and find their percentage difference.' },
    note: { ar: 'يفضل عادةً إبقاء فرق القطر ضمن حدود صغيرة وفق توصيات الشركة المصنعة.', en: 'Keep diameter changes small and follow the vehicle manufacturer guidance.' },
    inputs: [
        field('oldWidth', 'عرض الإطار الأصلي', 'Original tire width', 225, { min: 1, unit: { ar: 'مم', en: 'mm' } }),
        field('oldAspect', 'نسبة الجدار الأصلية', 'Original aspect ratio', 45, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
        field('oldRim', 'قطر الجنط الأصلي', 'Original wheel diameter', 17, { min: 1, unit: { ar: 'بوصة', en: 'in' } }),
        field('newWidth', 'عرض الإطار الجديد', 'New tire width', 235, { min: 1, unit: { ar: 'مم', en: 'mm' } }),
        field('newAspect', 'نسبة الجدار الجديدة', 'New aspect ratio', 45, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
        field('newRim', 'قطر الجنط الجديد', 'New wheel diameter', 17, { min: 1, unit: { ar: 'بوصة', en: 'in' } }),
    ],
    calculate(values, language) {
        const oldDiameter = tireDiameter(values.oldWidth, values.oldAspect, values.oldRim);
        const newDiameter = tireDiameter(values.newWidth, values.newAspect, values.newRim);
        return output(
            amount((newDiameter / oldDiameter - 1) * 100, '%'),
            localized(language, 'فرق القطر', 'Diameter difference'),
            `${amount(oldDiameter, 'mm')} → ${amount(newDiameter, 'mm')}`,
        );
    },
});

const speedometerError = tool({
    id: 'speedometer-tire-error-calculator',
    icon: 'SPD',
    title: { ar: 'حاسبة خطأ عداد السرعة مع الإطارات', en: 'Speedometer Tire Error Calculator' },
    description: { ar: 'قدّر السرعة الفعلية بعد تغيير قطر الإطار مع بقاء قراءة العداد نفسها.', en: 'Estimate actual speed after changing tire diameter at the same indicated speed.' },
    note: { ar: 'هذه نتيجة هندسية تقديرية ولا تغني عن معايرة العداد.', en: 'This is an engineering estimate and does not replace speedometer calibration.' },
    inputs: [
        field('indicated', 'سرعة العداد', 'Indicated speed', 100, { unit: { ar: 'كم/س', en: 'km/h' } }),
        field('oldDiameter', 'قطر الإطار الأصلي', 'Original diameter', 634.3, { min: 1, unit: { ar: 'مم', en: 'mm' } }),
        field('newDiameter', 'قطر الإطار الجديد', 'New diameter', 643.3, { min: 1, unit: { ar: 'مم', en: 'mm' } }),
    ],
    calculate(values, language) {
        const actual = values.indicated * values.newDiameter / values.oldDiameter;
        return output(
            amount(actual, 'km/h'),
            localized(language, 'السرعة الفعلية التقديرية', 'Estimated actual speed'),
            `${amount((actual / values.indicated - 1) * 100, '%')} ${localized(language, 'فرق', 'difference')}`,
        );
    },
});

const displacement = tool({
    id: 'engine-displacement-calculator',
    icon: 'CC',
    title: { ar: 'حاسبة سعة المحرك', en: 'Engine Displacement Calculator' },
    description: { ar: 'احسب سعة المحرك من عدد الأسطوانات وقطر الأسطوانة والشوط.', en: 'Calculate engine displacement from cylinder count, bore and stroke.' },
    note: { ar: 'تستخدم معادلة حجم الأسطوانة الهندسية.', en: 'Uses the geometric cylinder-volume formula.' },
    inputs: [
        field('cylinders', 'عدد الأسطوانات', 'Number of cylinders', 4, { min: 1, step: 1 }),
        field('bore', 'قطر الأسطوانة', 'Cylinder bore', 86, { min: 0.1, unit: { ar: 'مم', en: 'mm' } }),
        field('stroke', 'طول الشوط', 'Stroke length', 86, { min: 0.1, unit: { ar: 'مم', en: 'mm' } }),
    ],
    calculate(values, language) {
        const cc = values.cylinders * Math.PI / 4 * values.bore ** 2 * values.stroke / 1000;
        return output(
            amount(cc / 1000, 'L'),
            localized(language, 'سعة المحرك', 'Engine displacement'),
            amount(cc, 'cc'),
        );
    },
});

const powerToWeight = tool({
    id: 'vehicle-power-to-weight-calculator',
    icon: 'P/W',
    title: { ar: 'حاسبة نسبة القوة إلى الوزن', en: 'Vehicle Power-to-Weight Calculator' },
    description: { ar: 'احسب نسبة قدرة السيارة إلى وزنها بالحصان لكل طن.', en: 'Calculate vehicle power-to-weight ratio in horsepower per tonne.' },
    note: { ar: 'استخدم وزن السيارة التشغيلي للحصول على مقارنة واقعية.', en: 'Use the vehicle running weight for a realistic comparison.' },
    inputs: [
        field('power', 'قدرة المحرك', 'Engine power', 200, { unit: { ar: 'حصان', en: 'hp' } }),
        field('weight', 'وزن السيارة', 'Vehicle weight', 1500, { min: 1, unit: { ar: 'كجم', en: 'kg' } }),
    ],
    calculate: (values, language) => output(
        amount(values.power / (values.weight / 1000), 'hp/tonne'),
        localized(language, 'نسبة القوة إلى الوزن', 'Power-to-weight ratio'),
    ),
});

const depreciation = tool({
    id: 'vehicle-depreciation-calculator',
    icon: 'VALUE',
    title: { ar: 'حاسبة استهلاك قيمة السيارة', en: 'Vehicle Depreciation Calculator' },
    description: { ar: 'قدّر قيمة السيارة المتبقية بعد عدد من السنوات بمعدل استهلاك سنوي.', en: 'Estimate remaining vehicle value after years of annual depreciation.' },
    note: { ar: 'القيمة السوقية الفعلية تتأثر بالحالة والطلب والمسافة المقطوعة.', en: 'Market value also depends on condition, demand and mileage.' },
    inputs: [
        field('price', 'سعر الشراء', 'Purchase price', 30000),
        field('rate', 'الاستهلاك السنوي', 'Annual depreciation', 15, { max: 100, unit: { ar: '%', en: '%' } }),
        field('years', 'عدد السنوات', 'Years', 5, { min: 0, step: 1 }),
    ],
    calculate(values, language) {
        const remaining = values.price * (1 - values.rate / 100) ** values.years;
        return output(
            amount(remaining),
            localized(language, 'القيمة المتبقية التقديرية', 'Estimated remaining value'),
            `${amount(values.price - remaining)} ${localized(language, 'انخفاض بالقيمة', 'value lost')}`,
        );
    },
});

const evChargeTime = tool({
    id: 'ev-charging-time-calculator',
    icon: 'EV',
    title: { ar: 'حاسبة وقت شحن السيارة الكهربائية', en: 'EV Charging Time Calculator' },
    description: { ar: 'قدّر وقت شحن بطارية السيارة الكهربائية بين نسبتي شحن.', en: 'Estimate EV battery charging time between two charge levels.' },
    note: { ar: 'قد تنخفض سرعة الشحن قرب الامتلاء أو بسبب حرارة البطارية.', en: 'Charging may slow near full capacity or due to battery temperature.' },
    inputs: [
        field('capacity', 'سعة البطارية', 'Battery capacity', 75, { min: 0.1, unit: { ar: 'ك.و.س', en: 'kWh' } }),
        field('start', 'نسبة الشحن الحالية', 'Starting charge', 20, { max: 100, unit: { ar: '%', en: '%' } }),
        field('target', 'نسبة الشحن المستهدفة', 'Target charge', 80, { min: 0.01, max: 100, unit: { ar: '%', en: '%' } }),
        field('power', 'قدرة الشاحن', 'Charger power', 11, { min: 0.01, unit: { ar: 'كيلوواط', en: 'kW' } }),
        field('efficiency', 'كفاءة الشحن', 'Charging efficiency', 90, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        if (values.target <= values.start) {
            throw new Error(localized(language, 'نسبة الشحن المستهدفة يجب أن تتجاوز النسبة الحالية.', 'Target charge must exceed starting charge.'));
        }
        const energy = values.capacity * (values.target - values.start) / 100;
        return output(amount(energy / (values.power * values.efficiency / 100), 'hours'), localized(language, 'وقت الشحن التقديري', 'Estimated charging time'));
    },
});

const evChargeCost = tool({
    id: 'ev-charging-cost-calculator',
    icon: 'EV$',
    title: { ar: 'حاسبة تكلفة شحن السيارة الكهربائية', en: 'EV Charging Cost Calculator' },
    description: { ar: 'احسب تكلفة شحن بطارية سيارة كهربائية بين نسبتي شحن.', en: 'Calculate EV battery charging cost between two charge levels.' },
    note: { ar: 'تشمل الطاقة المسحوبة من الشبكة خسائر الشحن التقديرية.', en: 'Grid energy includes estimated charging losses.' },
    inputs: [
        field('capacity', 'سعة البطارية', 'Battery capacity', 75, { min: 0.1, unit: { ar: 'ك.و.س', en: 'kWh' } }),
        field('start', 'نسبة الشحن الحالية', 'Starting charge', 20, { max: 100, unit: { ar: '%', en: '%' } }),
        field('target', 'نسبة الشحن المستهدفة', 'Target charge', 80, { min: 0.01, max: 100, unit: { ar: '%', en: '%' } }),
        field('price', 'سعر الكيلوواط ساعة', 'Price per kWh', 0.2),
        field('efficiency', 'كفاءة الشحن', 'Charging efficiency', 90, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        if (values.target <= values.start) {
            throw new Error(localized(language, 'نسبة الشحن المستهدفة يجب أن تتجاوز النسبة الحالية.', 'Target charge must exceed starting charge.'));
        }
        const gridEnergy = values.capacity * (values.target - values.start) / 100 / (values.efficiency / 100);
        return output(amount(gridEnergy * values.price), localized(language, 'تكلفة الشحن', 'Charging cost'), amount(gridEnergy, 'kWh'));
    },
});

const evRange = tool({
    id: 'ev-range-calculator',
    icon: 'RANGE',
    title: { ar: 'حاسبة مدى السيارة الكهربائية', en: 'EV Range Calculator' },
    description: { ar: 'قدّر مدى السيارة الكهربائية من سعة البطارية والاستهلاك.', en: 'Estimate EV driving range from battery capacity and consumption.' },
    note: { ar: 'الطقس والسرعة والتكييف والتضاريس تؤثر في المدى الفعلي.', en: 'Weather, speed, climate control and terrain affect real range.' },
    inputs: [
        field('capacity', 'سعة البطارية', 'Battery capacity', 75, { min: 0.1, unit: { ar: 'ك.و.س', en: 'kWh' } }),
        field('usable', 'السعة القابلة للاستخدام', 'Usable capacity', 90, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
        field('consumption', 'الاستهلاك لكل 100 كم', 'Consumption per 100 km', 18, { min: 0.01, unit: { ar: 'ك.و.س/100كم', en: 'kWh/100km' } }),
    ],
    calculate: (values, language) => output(
        amount(values.capacity * values.usable / 100 / values.consumption * 100, 'km'),
        localized(language, 'المدى التقديري', 'Estimated range'),
    ),
});

const brakingDistance = tool({
    id: 'vehicle-braking-distance-calculator',
    icon: 'STOP',
    title: { ar: 'حاسبة مسافة توقف السيارة', en: 'Vehicle Braking Distance Calculator' },
    description: { ar: 'قدّر مسافة رد الفعل والكبح والتوقف الكلية من السرعة ومعامل الاحتكاك.', en: 'Estimate reaction, braking and total stopping distance from speed and friction.' },
    note: { ar: 'نتيجة تعليمية؛ تختلف المسافة الفعلية حسب الطريق والإطارات والمكابح والسائق.', en: 'Educational estimate; actual distance varies with road, tires, brakes and driver.' },
    inputs: [
        field('speed', 'السرعة', 'Speed', 100, { unit: { ar: 'كم/س', en: 'km/h' } }),
        field('reaction', 'زمن رد الفعل', 'Reaction time', 1.5, { unit: { ar: 'ثانية', en: 's' } }),
        field('friction', 'معامل الاحتكاك', 'Friction coefficient', 0.7, { min: 0.01, max: 2 }),
    ],
    calculate(values, language) {
        const speed = values.speed / 3.6;
        const reactionDistance = speed * values.reaction;
        const braking = speed ** 2 / (2 * values.friction * 9.80665);
        return output(
            amount(reactionDistance + braking, 'm'),
            localized(language, 'مسافة التوقف التقديرية', 'Estimated stopping distance'),
            `${localized(language, 'رد الفعل', 'Reaction')}: ${amount(reactionDistance, 'm')} · ${localized(language, 'الكبح', 'Braking')}: ${amount(braking, 'm')}`,
        );
    },
});

const automotiveEvDefinitions = Object.freeze({
    [tireDiameterTool.id]: tireDiameterTool,
    [tireComparison.id]: tireComparison,
    [speedometerError.id]: speedometerError,
    [displacement.id]: displacement,
    [powerToWeight.id]: powerToWeight,
    [depreciation.id]: depreciation,
    [evChargeTime.id]: evChargeTime,
    [evChargeCost.id]: evChargeCost,
    [evRange.id]: evRange,
    [brakingDistance.id]: brakingDistance,
});

export { automotiveEvDefinitions };

// END OF FILE
