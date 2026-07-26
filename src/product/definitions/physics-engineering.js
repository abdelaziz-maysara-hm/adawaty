const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 8 });

function format(value) {
    return formatter.format(value);
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function field(id, ar, en, sample, unit, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000_000,
        step: options.step ?? 0.01,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(unit),
        placeholder: String(sample),
    });
}

function definition(config) {
    return Object.freeze({
        id: config.id,
        category: 'engineering',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate(values, language) {
            const calculated = config.calculate(values);
            if (!Number.isFinite(calculated.value)) {
                throw new Error(localized(language, 'النتيجة خارج النطاق العددي.', 'The result is outside the numeric range.'));
            }
            return {
                value: `${format(calculated.value)} ${localized(language, calculated.unit.ar, calculated.unit.en)}`.trim(),
                label: localized(language, config.label.ar, config.label.en),
                details: calculated.details
                    ? localized(language, calculated.details.ar, calculated.details.en)
                    : '',
            };
        },
    });
}

const momentum = definition({
    id: 'momentum-calculator',
    icon: 'p',
    title: { ar: 'حاسبة الزخم', en: 'Momentum Calculator' },
    description: { ar: 'احسب الزخم الخطي من الكتلة والسرعة.', en: 'Calculate linear momentum from mass and velocity.' },
    note: { ar: 'تستخدم العلاقة p = m × v.', en: 'Uses p = m × v.' },
    label: { ar: 'الزخم', en: 'Momentum' },
    inputs: [
        field('mass', 'الكتلة', 'Mass', 10, { ar: 'كجم', en: 'kg' }),
        field('velocity', 'السرعة', 'Velocity', 5, { ar: 'م/ث', en: 'm/s' }, { min: -1_000_000 }),
    ],
    calculate: ({ mass, velocity }) => ({ value: mass * velocity, unit: { ar: 'كجم·م/ث', en: 'kg·m/s' } }),
});

const potentialEnergy = definition({
    id: 'gravitational-potential-energy-calculator',
    icon: 'mgh',
    title: { ar: 'حاسبة طاقة الوضع', en: 'Gravitational Potential Energy Calculator' },
    description: { ar: 'احسب طاقة الوضع من الكتلة والارتفاع وتسارع الجاذبية.', en: 'Calculate gravitational potential energy from mass, height and gravity.' },
    note: { ar: 'استخدم 9.80665 م/ث² للجاذبية القياسية.', en: 'Use 9.80665 m/s² for standard gravity.' },
    label: { ar: 'طاقة الوضع', en: 'Potential energy' },
    inputs: [
        field('mass', 'الكتلة', 'Mass', 10, { ar: 'كجم', en: 'kg' }),
        field('height', 'الارتفاع', 'Height', 5, { ar: 'م', en: 'm' }),
        field('gravity', 'تسارع الجاذبية', 'Gravity', 9.80665, { ar: 'م/ث²', en: 'm/s²' }),
    ],
    calculate: ({ mass, height, gravity }) => ({ value: mass * height * gravity, unit: { ar: 'جول', en: 'J' } }),
});

const work = definition({
    id: 'mechanical-work-calculator',
    icon: 'W',
    title: { ar: 'حاسبة الشغل الميكانيكي', en: 'Mechanical Work Calculator' },
    description: { ar: 'احسب الشغل من القوة والمسافة وزاوية اتجاه القوة.', en: 'Calculate work from force, distance and force angle.' },
    note: { ar: 'الزاوية صفر عندما تكون القوة في اتجاه الحركة.', en: 'Use zero degrees when force follows the direction of motion.' },
    label: { ar: 'الشغل الميكانيكي', en: 'Mechanical work' },
    inputs: [
        field('force', 'القوة', 'Force', 100, { ar: 'نيوتن', en: 'N' }),
        field('distance', 'المسافة', 'Distance', 5, { ar: 'م', en: 'm' }),
        field('angle', 'الزاوية', 'Angle', 0, { ar: 'درجة', en: 'degrees' }, { min: 0, max: 180 }),
    ],
    calculate: ({ force, distance, angle }) => ({ value: force * distance * Math.cos(angle * Math.PI / 180), unit: { ar: 'جول', en: 'J' } }),
});

const pressure = definition({
    id: 'pressure-from-force-calculator',
    icon: 'P/A',
    title: { ar: 'حاسبة الضغط من القوة', en: 'Pressure from Force Calculator' },
    description: { ar: 'احسب الضغط بقسمة القوة العمودية على المساحة.', en: 'Calculate pressure by dividing normal force by area.' },
    note: { ar: 'تكون النتيجة بالباسكال عند استخدام نيوتن ومتر مربع.', en: 'The result is pascals with newtons and square metres.' },
    label: { ar: 'الضغط', en: 'Pressure' },
    inputs: [
        field('force', 'القوة', 'Force', 1000, { ar: 'نيوتن', en: 'N' }),
        field('area', 'المساحة', 'Area', 0.5, { ar: 'م²', en: 'm²' }, { min: 0.00000001 }),
    ],
    calculate: ({ force, area }) => ({ value: force / area, unit: { ar: 'باسكال', en: 'Pa' } }),
});

const density = definition({
    id: 'mass-volume-density-calculator',
    icon: 'ρ',
    title: { ar: 'حاسبة الكثافة', en: 'Density Calculator' },
    description: { ar: 'احسب كثافة مادة من كتلتها وحجمها.', en: 'Calculate material density from mass and volume.' },
    note: { ar: 'الكثافة تساوي الكتلة مقسومة على الحجم.', en: 'Density equals mass divided by volume.' },
    label: { ar: 'الكثافة', en: 'Density' },
    inputs: [
        field('mass', 'الكتلة', 'Mass', 500, { ar: 'كجم', en: 'kg' }),
        field('volume', 'الحجم', 'Volume', 0.5, { ar: 'م³', en: 'm³' }, { min: 0.00000001 }),
    ],
    calculate: ({ mass, volume }) => ({ value: mass / volume, unit: { ar: 'كجم/م³', en: 'kg/m³' } }),
});

const waveSpeed = definition({
    id: 'wave-speed-calculator',
    icon: 'fλ',
    title: { ar: 'حاسبة سرعة الموجة', en: 'Wave Speed Calculator' },
    description: { ar: 'احسب سرعة الموجة من التردد والطول الموجي.', en: 'Calculate wave speed from frequency and wavelength.' },
    note: { ar: 'تستخدم العلاقة v = f × λ.', en: 'Uses v = f × λ.' },
    label: { ar: 'سرعة الموجة', en: 'Wave speed' },
    inputs: [
        field('frequency', 'التردد', 'Frequency', 440, { ar: 'هرتز', en: 'Hz' }),
        field('wavelength', 'الطول الموجي', 'Wavelength', 0.78, { ar: 'م', en: 'm' }),
    ],
    calculate: ({ frequency, wavelength }) => ({ value: frequency * wavelength, unit: { ar: 'م/ث', en: 'm/s' } }),
});

const heatEnergy = definition({
    id: 'heat-energy-calculator',
    icon: 'Q',
    title: { ar: 'حاسبة الطاقة الحرارية', en: 'Heat Energy Calculator' },
    description: { ar: 'احسب الحرارة من الكتلة والسعة الحرارية وتغير الحرارة.', en: 'Calculate heat energy from mass, specific heat and temperature change.' },
    note: { ar: 'أدخل السعة الحرارية بوحدة جول لكل كجم لكل درجة.', en: 'Enter specific heat in joules per kilogram-degree.' },
    label: { ar: 'الطاقة الحرارية', en: 'Heat energy' },
    inputs: [
        field('mass', 'الكتلة', 'Mass', 2, { ar: 'كجم', en: 'kg' }),
        field('specificHeat', 'السعة الحرارية النوعية', 'Specific heat', 4186, { ar: 'جول/(كجم·°م)', en: 'J/(kg·°C)' }),
        field('temperatureChange', 'تغير درجة الحرارة', 'Temperature change', 10, { ar: '°م', en: '°C' }, { min: -100000 }),
    ],
    calculate: ({ mass, specificHeat, temperatureChange }) => ({ value: mass * specificHeat * temperatureChange, unit: { ar: 'جول', en: 'J' } }),
});

const massEnergy = definition({
    id: 'mass-energy-equivalence-calculator',
    icon: 'E=mc²',
    title: { ar: 'حاسبة تكافؤ الكتلة والطاقة', en: 'Mass–Energy Equivalence Calculator' },
    description: { ar: 'احسب الطاقة المكافئة للكتلة باستخدام E = mc².', en: 'Calculate energy equivalent to mass with E = mc².' },
    note: { ar: 'تستخدم سرعة الضوء الدقيقة 299792458 م/ث.', en: 'Uses the exact speed of light, 299792458 m/s.' },
    label: { ar: 'الطاقة المكافئة', en: 'Equivalent energy' },
    inputs: [field('mass', 'الكتلة', 'Mass', 1, { ar: 'كجم', en: 'kg' })],
    calculate: ({ mass }) => ({ value: mass * 299_792_458 ** 2, unit: { ar: 'جول', en: 'J' } }),
});

const springForce = definition({
    id: 'hookes-law-calculator',
    icon: 'kx',
    title: { ar: 'حاسبة قانون هوك', en: "Hooke's Law Calculator" },
    description: { ar: 'احسب مقدار قوة النابض من ثابت النابض والإزاحة.', en: 'Calculate spring force magnitude from spring constant and displacement.' },
    note: { ar: 'تنطبق العلاقة ضمن حد المرونة للمادة.', en: 'The relation applies within the elastic limit.' },
    label: { ar: 'مقدار قوة النابض', en: 'Spring force magnitude' },
    inputs: [
        field('constant', 'ثابت النابض', 'Spring constant', 200, { ar: 'نيوتن/م', en: 'N/m' }),
        field('displacement', 'الإزاحة', 'Displacement', 0.05, { ar: 'م', en: 'm' }),
    ],
    calculate: ({ constant, displacement }) => ({ value: constant * displacement, unit: { ar: 'نيوتن', en: 'N' } }),
});

const idealGasPressure = definition({
    id: 'ideal-gas-pressure-calculator',
    icon: 'PV',
    title: { ar: 'حاسبة ضغط الغاز المثالي', en: 'Ideal Gas Pressure Calculator' },
    description: { ar: 'احسب ضغط الغاز من عدد المولات والحرارة والحجم.', en: 'Calculate ideal-gas pressure from moles, temperature and volume.' },
    note: { ar: 'استخدم كلفن ومترًا مكعبًا للحصول على باسكال.', en: 'Use kelvin and cubic metres to obtain pascals.' },
    label: { ar: 'ضغط الغاز', en: 'Gas pressure' },
    inputs: [
        field('moles', 'عدد المولات', 'Amount', 1, { ar: 'مول', en: 'mol' }),
        field('temperature', 'درجة الحرارة', 'Temperature', 300, { ar: 'كلفن', en: 'K' }, { min: 0.000001 }),
        field('volume', 'الحجم', 'Volume', 0.024, { ar: 'م³', en: 'm³' }, { min: 0.00000001 }),
    ],
    calculate: ({ moles, temperature, volume }) => ({ value: moles * 8.314462618 * temperature / volume, unit: { ar: 'باسكال', en: 'Pa' } }),
});

const physicsEngineeringDefinitions = Object.freeze({
    [momentum.id]: momentum,
    [potentialEnergy.id]: potentialEnergy,
    [work.id]: work,
    [pressure.id]: pressure,
    [density.id]: density,
    [waveSpeed.id]: waveSpeed,
    [heatEnergy.id]: heatEnergy,
    [massEnergy.id]: massEnergy,
    [springForce.id]: springForce,
    [idealGasPressure.id]: idealGasPressure,
});

export { physicsEngineeringDefinitions };

// END OF FILE
