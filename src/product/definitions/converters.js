const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
});

function unitOptions(units) {
    return Object.freeze(Object.entries(units).map(([value, unit]) => (
        Object.freeze({
            value,
            label: Object.freeze({ ar: unit.ar, en: unit.en }),
        })
    )));
}

function createLinearConverter(config) {
    const options = unitOptions(config.units);
    return Object.freeze({
        id: config.id,
        category: 'converter',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze([
            Object.freeze({
                id: 'value',
                type: 'number',
                min: config.min ?? -1_000_000_000_000,
                max: 1_000_000_000_000,
                step: 'any',
                label: Object.freeze({ ar: 'القيمة', en: 'Value' }),
                unit: Object.freeze({ ar: '', en: '' }),
                placeholder: '1',
            }),
            Object.freeze({
                id: 'from',
                type: 'select',
                label: Object.freeze({ ar: 'من وحدة', en: 'From unit' }),
                unit: Object.freeze({ ar: '', en: '' }),
                options,
            }),
            Object.freeze({
                id: 'to',
                type: 'select',
                label: Object.freeze({ ar: 'إلى وحدة', en: 'To unit' }),
                unit: Object.freeze({ ar: '', en: '' }),
                options,
            }),
        ]),
        calculate(values, language) {
            const baseValue = values.value * config.units[values.from].factor;
            const converted = baseValue / config.units[values.to].factor;
            const target = config.units[values.to];
            return {
                value: formatter.format(converted),
                label: language === 'ar' ? target.ar : target.en,
                details: `${formatter.format(values.value)} ${config.units[values.from].symbol} = ${formatter.format(converted)} ${target.symbol}`,
            };
        },
    });
}

const lengthUnits = Object.freeze({
    metre: Object.freeze({ ar: 'متر', en: 'Metres', symbol: 'm', factor: 1 }),
    kilometre: Object.freeze({ ar: 'كيلومتر', en: 'Kilometres', symbol: 'km', factor: 1000 }),
    centimetre: Object.freeze({ ar: 'سنتيمتر', en: 'Centimetres', symbol: 'cm', factor: 0.01 }),
    millimetre: Object.freeze({ ar: 'ملليمتر', en: 'Millimetres', symbol: 'mm', factor: 0.001 }),
    inch: Object.freeze({ ar: 'بوصة', en: 'Inches', symbol: 'in', factor: 0.0254 }),
    foot: Object.freeze({ ar: 'قدم', en: 'Feet', symbol: 'ft', factor: 0.3048 }),
    mile: Object.freeze({ ar: 'ميل', en: 'Miles', symbol: 'mi', factor: 1609.344 }),
});

const massUnits = Object.freeze({
    kilogram: Object.freeze({ ar: 'كيلوجرام', en: 'Kilograms', symbol: 'kg', factor: 1 }),
    gram: Object.freeze({ ar: 'جرام', en: 'Grams', symbol: 'g', factor: 0.001 }),
    pound: Object.freeze({ ar: 'رطل', en: 'Pounds', symbol: 'lb', factor: 0.45359237 }),
    ounce: Object.freeze({ ar: 'أونصة', en: 'Ounces', symbol: 'oz', factor: 0.028349523125 }),
    tonne: Object.freeze({ ar: 'طن متري', en: 'Metric tonnes', symbol: 't', factor: 1000 }),
});

const areaUnits = Object.freeze({
    squareMetre: Object.freeze({ ar: 'متر مربع', en: 'Square metres', symbol: 'm²', factor: 1 }),
    squareKilometre: Object.freeze({ ar: 'كيلومتر مربع', en: 'Square kilometres', symbol: 'km²', factor: 1_000_000 }),
    squareFoot: Object.freeze({ ar: 'قدم مربع', en: 'Square feet', symbol: 'ft²', factor: 0.09290304 }),
    acre: Object.freeze({ ar: 'فدان', en: 'Acres', symbol: 'ac', factor: 4046.8564224 }),
    hectare: Object.freeze({ ar: 'هكتار', en: 'Hectares', symbol: 'ha', factor: 10_000 }),
});

const volumeUnits = Object.freeze({
    litre: Object.freeze({ ar: 'لتر', en: 'Litres', symbol: 'L', factor: 1 }),
    millilitre: Object.freeze({ ar: 'ملليلتر', en: 'Millilitres', symbol: 'mL', factor: 0.001 }),
    cubicMetre: Object.freeze({ ar: 'متر مكعب', en: 'Cubic metres', symbol: 'm³', factor: 1000 }),
    gallon: Object.freeze({ ar: 'جالون أمريكي', en: 'US gallons', symbol: 'gal', factor: 3.785411784 }),
});

const speedUnits = Object.freeze({
    metreSecond: Object.freeze({ ar: 'متر/ثانية', en: 'Metres/second', symbol: 'm/s', factor: 1 }),
    kilometreHour: Object.freeze({ ar: 'كيلومتر/ساعة', en: 'Kilometres/hour', symbol: 'km/h', factor: 0.2777777778 }),
    mileHour: Object.freeze({ ar: 'ميل/ساعة', en: 'Miles/hour', symbol: 'mph', factor: 0.44704 }),
    knot: Object.freeze({ ar: 'عقدة', en: 'Knots', symbol: 'kn', factor: 0.5144444444 }),
});

const dataUnits = Object.freeze({
    byte: Object.freeze({ ar: 'بايت', en: 'Bytes', symbol: 'B', factor: 1 }),
    kilobyte: Object.freeze({ ar: 'كيلوبايت', en: 'Kilobytes', symbol: 'KB', factor: 1024 }),
    megabyte: Object.freeze({ ar: 'ميجابايت', en: 'Megabytes', symbol: 'MB', factor: 1024 ** 2 }),
    gigabyte: Object.freeze({ ar: 'جيجابايت', en: 'Gigabytes', symbol: 'GB', factor: 1024 ** 3 }),
    terabyte: Object.freeze({ ar: 'تيرابايت', en: 'Terabytes', symbol: 'TB', factor: 1024 ** 4 }),
});

const timeUnits = Object.freeze({
    second: Object.freeze({ ar: 'ثانية', en: 'Seconds', symbol: 's', factor: 1 }),
    minute: Object.freeze({ ar: 'دقيقة', en: 'Minutes', symbol: 'min', factor: 60 }),
    hour: Object.freeze({ ar: 'ساعة', en: 'Hours', symbol: 'h', factor: 3600 }),
    day: Object.freeze({ ar: 'يوم', en: 'Days', symbol: 'd', factor: 86400 }),
});

const angleUnits = Object.freeze({
    degree: Object.freeze({ ar: 'درجة', en: 'Degrees', symbol: '°', factor: Math.PI / 180 }),
    radian: Object.freeze({ ar: 'راديان', en: 'Radians', symbol: 'rad', factor: 1 }),
});

const pressureUnits = Object.freeze({
    pascal: Object.freeze({ ar: 'باسكال', en: 'Pascals', symbol: 'Pa', factor: 1 }),
    kilopascal: Object.freeze({ ar: 'كيلوباسكال', en: 'Kilopascals', symbol: 'kPa', factor: 1000 }),
    bar: Object.freeze({ ar: 'بار', en: 'Bar', symbol: 'bar', factor: 100_000 }),
    psi: Object.freeze({ ar: 'رطل/بوصة²', en: 'PSI', symbol: 'psi', factor: 6894.757293168 }),
});

const energyUnits = Object.freeze({
    joule: Object.freeze({ ar: 'جول', en: 'Joules', symbol: 'J', factor: 1 }),
    kilojoule: Object.freeze({ ar: 'كيلوجول', en: 'Kilojoules', symbol: 'kJ', factor: 1000 }),
    kilowattHour: Object.freeze({ ar: 'كيلوواط ساعة', en: 'Kilowatt-hours', symbol: 'kWh', factor: 3_600_000 }),
    kilocalorie: Object.freeze({ ar: 'كيلوسعر حراري', en: 'Kilocalories', symbol: 'kcal', factor: 4184 }),
});

function converterConfig(id, icon, title, description, units) {
    return {
        id,
        icon,
        title,
        description,
        note: {
            ar: 'اختر وحدتي الإدخال والإخراج للحصول على التحويل فورًا.',
            en: 'Choose input and output units for an instant conversion.',
        },
        units,
    };
}

const temperatureOptions = unitOptions(Object.freeze({
    celsius: Object.freeze({ ar: 'درجة مئوية', en: 'Celsius', symbol: '°C' }),
    fahrenheit: Object.freeze({ ar: 'فهرنهايت', en: 'Fahrenheit', symbol: '°F' }),
    kelvin: Object.freeze({ ar: 'كلفن', en: 'Kelvin', symbol: 'K' }),
}));

const temperatureConverter = Object.freeze({
    id: 'temperature-converter',
    category: 'converter',
    icon: '°',
    title: Object.freeze({ ar: 'محول درجات الحرارة', en: 'Temperature Converter' }),
    description: Object.freeze({ ar: 'حوّل بين المئوية وفهرنهايت وكلفن.', en: 'Convert between Celsius, Fahrenheit and Kelvin.' }),
    note: Object.freeze({ ar: 'تُطبّق معادلات درجات الحرارة القياسية.', en: 'Uses standard temperature conversion formulas.' }),
    inputs: Object.freeze([
        Object.freeze({ id: 'value', type: 'number', min: -1_000_000, max: 1_000_000, step: 'any', label: Object.freeze({ ar: 'درجة الحرارة', en: 'Temperature' }), unit: Object.freeze({ ar: '', en: '' }), placeholder: '25' }),
        Object.freeze({ id: 'from', type: 'select', label: Object.freeze({ ar: 'من', en: 'From' }), unit: Object.freeze({ ar: '', en: '' }), options: temperatureOptions }),
        Object.freeze({ id: 'to', type: 'select', label: Object.freeze({ ar: 'إلى', en: 'To' }), unit: Object.freeze({ ar: '', en: '' }), options: temperatureOptions }),
    ]),
    calculate(values, language) {
        const celsius = values.from === 'celsius'
            ? values.value
            : values.from === 'fahrenheit'
                ? (values.value - 32) * (5 / 9)
                : values.value - 273.15;
        const converted = values.to === 'celsius'
            ? celsius
            : values.to === 'fahrenheit'
                ? (celsius * (9 / 5)) + 32
                : celsius + 273.15;
        const symbols = { celsius: '°C', fahrenheit: '°F', kelvin: 'K' };
        return {
            value: formatter.format(converted),
            label: language === 'ar' ? 'القيمة المحوّلة' : 'Converted value',
            details: `${formatter.format(values.value)} ${symbols[values.from]} = ${formatter.format(converted)} ${symbols[values.to]}`,
        };
    },
});

const converterDefinitions = Object.freeze({
    'length-converter': createLinearConverter(converterConfig('length-converter', '↔', { ar: 'محول الطول', en: 'Length Converter' }, { ar: 'حوّل بين وحدات الطول المترية والإمبراطورية.', en: 'Convert metric and imperial length units.' }, lengthUnits)),
    'weight-converter': createLinearConverter(converterConfig('weight-converter', '⚖', { ar: 'محول الوزن', en: 'Weight Converter' }, { ar: 'حوّل بين الكيلوجرام والجرام والرطل ووحدات الوزن.', en: 'Convert kilograms, grams, pounds and other mass units.' }, massUnits)),
    'temperature-converter': temperatureConverter,
    'area-converter': createLinearConverter(converterConfig('area-converter', '□', { ar: 'محول المساحة', en: 'Area Converter' }, { ar: 'حوّل بين وحدات قياس المساحة الشائعة.', en: 'Convert common area measurement units.' }, areaUnits)),
    'volume-converter': createLinearConverter(converterConfig('volume-converter', '◫', { ar: 'محول الحجم', en: 'Volume Converter' }, { ar: 'حوّل بين اللتر والملليلتر والمتر المكعب والجالون.', en: 'Convert litres, millilitres, cubic metres and gallons.' }, volumeUnits)),
    'speed-converter': createLinearConverter(converterConfig('speed-converter', '➜', { ar: 'محول السرعة', en: 'Speed Converter' }, { ar: 'حوّل بين وحدات السرعة الشائعة.', en: 'Convert common speed units.' }, speedUnits)),
    'data-storage-converter': createLinearConverter(converterConfig('data-storage-converter', 'GB', { ar: 'محول سعة البيانات', en: 'Data Storage Converter' }, { ar: 'حوّل بين البايت والكيلوبايت والميجابايت والجيجابايت.', en: 'Convert bytes, KB, MB, GB and TB.' }, dataUnits)),
    'time-unit-converter': createLinearConverter(converterConfig('time-unit-converter', '⌚', { ar: 'محول وحدات الوقت', en: 'Time Unit Converter' }, { ar: 'حوّل بين الثواني والدقائق والساعات والأيام.', en: 'Convert seconds, minutes, hours and days.' }, timeUnits)),
    'angle-converter': createLinearConverter(converterConfig('angle-converter', '∠', { ar: 'محول الزوايا', en: 'Angle Converter' }, { ar: 'حوّل بين الدرجات والراديان.', en: 'Convert degrees and radians.' }, angleUnits)),
    'pressure-converter': createLinearConverter(converterConfig('pressure-converter', 'Pa', { ar: 'محول الضغط', en: 'Pressure Converter' }, { ar: 'حوّل بين الباسكال والكيلوباسكال والبار وPSI.', en: 'Convert pascals, kilopascals, bar and PSI.' }, pressureUnits)),
    'energy-converter': createLinearConverter(converterConfig('energy-converter', '⚡', { ar: 'محول الطاقة', en: 'Energy Converter' }, { ar: 'حوّل بين الجول والكيلوجول والكيلوواط ساعة والسعرات.', en: 'Convert joules, kilojoules, kWh and kilocalories.' }, energyUnits)),
});

export { converterDefinitions };

// END OF FILE
