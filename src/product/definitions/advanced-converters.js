const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 10,
});

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function option(value, ar, en, factor) {
    return Object.freeze({
        value,
        factor,
        label: Object.freeze({ ar, en }),
    });
}

function createConverter({
    id,
    icon,
    title,
    description,
    note,
    units,
}) {
    const frozenUnits = Object.freeze(units);
    const selectOptions = Object.freeze(frozenUnits.map((unit) => Object.freeze({
        value: unit.value,
        label: unit.label,
    })));
    const unitMap = new Map(frozenUnits.map((unit) => [unit.value, unit]));

    return Object.freeze({
        id,
        category: 'converter',
        icon,
        title: Object.freeze(title),
        description: Object.freeze(description),
        note: Object.freeze(note),
        inputs: Object.freeze([
            Object.freeze({
                id: 'value',
                type: 'number',
                min: -1_000_000_000_000,
                max: 1_000_000_000_000,
                step: 'any',
                label: Object.freeze({ ar: 'القيمة', en: 'Value' }),
                unit: Object.freeze({ ar: '', en: '' }),
                placeholder: '1',
            }),
            Object.freeze({
                id: 'from',
                type: 'select',
                label: Object.freeze({ ar: 'من', en: 'From' }),
                unit: Object.freeze({ ar: '', en: '' }),
                options: selectOptions,
            }),
            Object.freeze({
                id: 'to',
                type: 'select',
                label: Object.freeze({ ar: 'إلى', en: 'To' }),
                unit: Object.freeze({ ar: '', en: '' }),
                options: selectOptions,
            }),
        ]),
        calculate(values, language) {
            const source = unitMap.get(values.from);
            const target = unitMap.get(values.to);

            if (!source || !target) {
                throw new Error(localized(language, 'اختر وحدات صالحة.', 'Select valid units.'));
            }

            const converted = values.value * source.factor / target.factor;
            return {
                value: formatter.format(converted),
                label: localized(language, 'القيمة المحولة', 'Converted value'),
                details: `${formatter.format(values.value)} ${source.value} = ${formatter.format(converted)} ${target.value}`,
            };
        },
    });
}

const acceleration = createConverter({
    id: 'acceleration-converter',
    icon: 'a',
    title: { ar: 'محول التسارع', en: 'Acceleration Converter' },
    description: { ar: 'حوّل بين وحدات التسارع والجاذبية القياسية.', en: 'Convert between acceleration units and standard gravity.' },
    note: { ar: 'تستخدم الجاذبية القياسية قيمة 9.80665 م/ث².', en: 'Standard gravity uses 9.80665 m/s².' },
    units: [
        option('m/s²', 'متر/ث²', 'Metres per second squared', 1),
        option('ft/s²', 'قدم/ث²', 'Feet per second squared', 0.3048),
        option('g', 'جاذبية قياسية', 'Standard gravity', 9.80665),
        option('Gal', 'جال', 'Galileo', 0.01),
    ],
});

const force = createConverter({
    id: 'force-unit-converter',
    icon: 'N',
    title: { ar: 'محول وحدات القوة', en: 'Force Unit Converter' },
    description: { ar: 'حوّل بين النيوتن والكيلونيوتن والقوة بالرطل والكيلوجرام.', en: 'Convert between newtons, kilonewtons, pound-force and kilogram-force.' },
    note: { ar: 'كل التحويلات تعتمد على النيوتن كوحدة أساسية.', en: 'All conversions use the newton as the base unit.' },
    units: [
        option('N', 'نيوتن', 'Newton', 1),
        option('kN', 'كيلونيوتن', 'Kilonewton', 1000),
        option('lbf', 'رطل قوة', 'Pound-force', 4.4482216153),
        option('kgf', 'كيلوجرام قوة', 'Kilogram-force', 9.80665),
        option('dyn', 'داين', 'Dyne', 0.00001),
    ],
});

const power = createConverter({
    id: 'power-unit-converter',
    icon: 'W',
    title: { ar: 'محول وحدات القدرة', en: 'Power Unit Converter' },
    description: { ar: 'حوّل بين الواط والكيلوواط والميجاواط والحصان وBTU/ساعة.', en: 'Convert watts, kilowatts, megawatts, horsepower and BTU per hour.' },
    note: { ar: 'يستخدم الحصان الميكانيكي بقيمة 745.699872 واط.', en: 'Mechanical horsepower is treated as 745.699872 watts.' },
    units: [
        option('W', 'واط', 'Watt', 1),
        option('kW', 'كيلوواط', 'Kilowatt', 1000),
        option('MW', 'ميجاواط', 'Megawatt', 1_000_000),
        option('hp', 'حصان ميكانيكي', 'Mechanical horsepower', 745.699872),
        option('BTU/h', 'وحدة حرارية/ساعة', 'BTU per hour', 0.29307107),
    ],
});

const torque = createConverter({
    id: 'torque-converter',
    icon: 'τ',
    title: { ar: 'محول عزم الدوران', en: 'Torque Converter' },
    description: { ar: 'حوّل بين نيوتن متر ووحدات العزم الإمبراطورية.', en: 'Convert newton-metres and common imperial torque units.' },
    note: { ar: 'عزم الدوران يختلف عن وحدة الطاقة رغم تشابه الأبعاد.', en: 'Torque and energy are distinct despite sharing dimensions.' },
    units: [
        option('N·m', 'نيوتن متر', 'Newton-metre', 1),
        option('kN·m', 'كيلونيوتن متر', 'Kilonewton-metre', 1000),
        option('lbf·ft', 'رطل قوة قدم', 'Pound-foot', 1.3558179483),
        option('lbf·in', 'رطل قوة بوصة', 'Pound-inch', 0.112984829),
        option('kgf·m', 'كيلوجرام قوة متر', 'Kilogram-force metre', 9.80665),
    ],
});

const frequency = createConverter({
    id: 'frequency-converter',
    icon: 'Hz',
    title: { ar: 'محول التردد', en: 'Frequency Converter' },
    description: { ar: 'حوّل بين الهرتز ومضاعفاته والدورات في الدقيقة.', en: 'Convert hertz, its multiples and revolutions per minute.' },
    note: { ar: 'الدورة في الدقيقة تساوي 1/60 هرتز.', en: 'One revolution per minute equals 1/60 hertz.' },
    units: [
        option('Hz', 'هرتز', 'Hertz', 1),
        option('kHz', 'كيلوهرتز', 'Kilohertz', 1000),
        option('MHz', 'ميجاهرتز', 'Megahertz', 1_000_000),
        option('GHz', 'جيجاهرتز', 'Gigahertz', 1_000_000_000),
        option('rpm', 'دورة/دقيقة', 'Revolutions per minute', 1 / 60),
    ],
});

const density = createConverter({
    id: 'density-unit-converter',
    icon: 'ρ',
    title: { ar: 'محول وحدات الكثافة', en: 'Density Unit Converter' },
    description: { ar: 'حوّل بين وحدات الكثافة المترية والإمبراطورية.', en: 'Convert between metric and imperial density units.' },
    note: { ar: 'الوحدة الأساسية هي كيلوجرام لكل متر مكعب.', en: 'The base unit is kilograms per cubic metre.' },
    units: [
        option('kg/m³', 'كجم/م³', 'Kilograms per cubic metre', 1),
        option('g/cm³', 'جرام/سم³', 'Grams per cubic centimetre', 1000),
        option('g/L', 'جرام/لتر', 'Grams per litre', 1),
        option('lb/ft³', 'رطل/قدم³', 'Pounds per cubic foot', 16.018463),
        option('lb/US gal', 'رطل/جالون أمريكي', 'Pounds per US gallon', 119.826427),
    ],
});

const flowRate = createConverter({
    id: 'flow-rate-converter',
    icon: 'L/s',
    title: { ar: 'محول معدل التدفق', en: 'Flow Rate Converter' },
    description: { ar: 'حوّل بين وحدات تدفق السوائل الحجمية الشائعة.', en: 'Convert common volumetric liquid flow-rate units.' },
    note: { ar: 'الوحدة الأساسية المستخدمة هي لتر في الثانية.', en: 'Litres per second is used as the base unit.' },
    units: [
        option('L/s', 'لتر/ثانية', 'Litres per second', 1),
        option('L/min', 'لتر/دقيقة', 'Litres per minute', 1 / 60),
        option('m³/s', 'م³/ثانية', 'Cubic metres per second', 1000),
        option('m³/h', 'م³/ساعة', 'Cubic metres per hour', 1000 / 3600),
        option('US gpm', 'جالون أمريكي/دقيقة', 'US gallons per minute', 0.0630901964),
        option('ft³/s', 'قدم³/ثانية', 'Cubic feet per second', 28.3168466),
    ],
});

const cookingVolume = createConverter({
    id: 'cooking-volume-converter',
    icon: 'cup',
    title: { ar: 'محول مقاييس الطبخ', en: 'Cooking Volume Converter' },
    description: { ar: 'حوّل بين الملليلتر والملعقة والكوب والمكاييل الأمريكية.', en: 'Convert millilitres, spoons, cups and US cooking measures.' },
    note: { ar: 'تستخدم الأداة المقاييس الأمريكية للملعقة والكوب.', en: 'US customary spoon and cup measures are used.' },
    units: [
        option('mL', 'ملليلتر', 'Millilitre', 1),
        option('L', 'لتر', 'Litre', 1000),
        option('tsp', 'ملعقة صغيرة', 'US teaspoon', 4.92892159),
        option('tbsp', 'ملعقة كبيرة', 'US tablespoon', 14.7867648),
        option('cup', 'كوب أمريكي', 'US cup', 236.5882365),
        option('pt', 'باينت أمريكي', 'US pint', 473.176473),
        option('qt', 'كوارت أمريكي', 'US quart', 946.352946),
    ],
});

const dataRate = createConverter({
    id: 'data-transfer-rate-converter',
    icon: 'Mb/s',
    title: { ar: 'محول سرعة نقل البيانات', en: 'Data Transfer Rate Converter' },
    description: { ar: 'حوّل بين البت والبايت في الثانية ومضاعفاتهما العشرية.', en: 'Convert decimal bits and bytes per second and their multiples.' },
    note: { ar: 'البايت يساوي ثمانية بتات؛ الوحدات هنا عشرية.', en: 'One byte equals eight bits; these units use decimal prefixes.' },
    units: [
        option('bps', 'بت/ث', 'Bits per second', 1),
        option('kbps', 'كيلوبت/ث', 'Kilobits per second', 1000),
        option('Mbps', 'ميجابت/ث', 'Megabits per second', 1_000_000),
        option('Gbps', 'جيجابت/ث', 'Gigabits per second', 1_000_000_000),
        option('B/s', 'بايت/ث', 'Bytes per second', 8),
        option('MB/s', 'ميجابايت/ث', 'Megabytes per second', 8_000_000),
        option('GB/s', 'جيجابايت/ث', 'Gigabytes per second', 8_000_000_000),
    ],
});

const illuminance = createConverter({
    id: 'illuminance-converter',
    icon: 'lx',
    title: { ar: 'محول شدة الاستضاءة', en: 'Illuminance Converter' },
    description: { ar: 'حوّل بين اللوكس والقدم-شمعة والفوت والنوكس.', en: 'Convert lux, foot-candles, phots and nox.' },
    note: { ar: 'تقيس الاستضاءة مقدار الضوء الساقط على سطح.', en: 'Illuminance measures light falling on a surface.' },
    units: [
        option('lx', 'لوكس', 'Lux', 1),
        option('fc', 'قدم-شمعة', 'Foot-candle', 10.7639104),
        option('ph', 'فوت', 'Phot', 10_000),
        option('nx', 'نوكس', 'Nox', 0.001),
    ],
});

const advancedConverterDefinitions = Object.freeze({
    [acceleration.id]: acceleration,
    [force.id]: force,
    [power.id]: power,
    [torque.id]: torque,
    [frequency.id]: frequency,
    [density.id]: density,
    [flowRate.id]: flowRate,
    [cookingVolume.id]: cookingVolume,
    [dataRate.id]: dataRate,
    [illuminance.id]: illuminance,
});

export { advancedConverterDefinitions };

// END OF FILE
