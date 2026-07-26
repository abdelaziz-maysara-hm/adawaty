const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 8,
});

function format(value) {
    return formatter.format(value);
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function numberInput(id, label, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000_000_000,
        step: options.step ?? 'any',
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze({
            value: option.value,
            label: Object.freeze(option.label),
        }))),
    });
}

function result(value, unit, label, details = '') {
    return {
        value: `${format(value)} ${unit}`.trim(),
        label,
        details,
    };
}

const ohmsLaw = Object.freeze({
    id: 'ohms-law-calculator',
    category: 'engineering',
    icon: 'Ω',
    title: Object.freeze({ ar: 'حاسبة قانون أوم', en: 'Ohm’s Law Calculator' }),
    description: Object.freeze({ ar: 'احسب شدة التيار من الجهد والمقاومة باستخدام قانون أوم.', en: 'Calculate current from voltage and resistance using Ohm’s law.' }),
    note: Object.freeze({ ar: 'تطبق العلاقة I = V ÷ R.', en: 'Applies I = V ÷ R.' }),
    inputs: Object.freeze([
        numberInput('voltage', { ar: 'الجهد', en: 'Voltage' }, 12, { unit: { ar: 'فولت', en: 'V' } }),
        numberInput('resistance', { ar: 'المقاومة', en: 'Resistance' }, 6, { min: 0.000001, unit: { ar: 'أوم', en: 'Ω' } }),
    ]),
    calculate(values, language) {
        return result(
            values.voltage / values.resistance,
            'A',
            localized(language, 'شدة التيار', 'Current'),
            'I = V ÷ R',
        );
    },
});

const electricalPower = Object.freeze({
    id: 'electrical-power-calculator',
    category: 'engineering',
    icon: 'W',
    title: Object.freeze({ ar: 'حاسبة القدرة الكهربائية', en: 'Electrical Power Calculator' }),
    description: Object.freeze({ ar: 'احسب القدرة الكهربائية من الجهد وشدة التيار.', en: 'Calculate electrical power from voltage and current.' }),
    note: Object.freeze({ ar: 'تطبق العلاقة P = V × I.', en: 'Applies P = V × I.' }),
    inputs: Object.freeze([
        numberInput('voltage', { ar: 'الجهد', en: 'Voltage' }, 220, { unit: { ar: 'فولت', en: 'V' } }),
        numberInput('current', { ar: 'شدة التيار', en: 'Current' }, 2, { unit: { ar: 'أمبير', en: 'A' } }),
    ]),
    calculate(values, language) {
        return result(
            values.voltage * values.current,
            'W',
            localized(language, 'القدرة الكهربائية', 'Electrical power'),
            'P = V × I',
        );
    },
});

const resistorModes = Object.freeze([
    { value: 'series', label: { ar: 'توصيل على التوالي', en: 'Series' } },
    { value: 'parallel', label: { ar: 'توصيل على التوازي', en: 'Parallel' } },
]);

const resistorCalculator = Object.freeze({
    id: 'resistor-combination-calculator',
    category: 'engineering',
    icon: 'R',
    title: Object.freeze({ ar: 'حاسبة توصيل المقاومات', en: 'Resistor Combination Calculator' }),
    description: Object.freeze({ ar: 'احسب المقاومة المكافئة لثلاث مقاومات على التوالي أو التوازي.', en: 'Calculate equivalent resistance for three series or parallel resistors.' }),
    note: Object.freeze({ ar: 'يجب أن تكون جميع قيم المقاومات أكبر من صفر.', en: 'All resistance values must be greater than zero.' }),
    inputs: Object.freeze([
        selectInput('mode', { ar: 'نوع التوصيل', en: 'Connection type' }, resistorModes),
        numberInput('r1', { ar: 'المقاومة الأولى', en: 'Resistance 1' }, 100, { min: 0.000001, unit: { ar: 'أوم', en: 'Ω' } }),
        numberInput('r2', { ar: 'المقاومة الثانية', en: 'Resistance 2' }, 200, { min: 0.000001, unit: { ar: 'أوم', en: 'Ω' } }),
        numberInput('r3', { ar: 'المقاومة الثالثة', en: 'Resistance 3' }, 300, { min: 0.000001, unit: { ar: 'أوم', en: 'Ω' } }),
    ]),
    calculate(values, language) {
        const equivalent = values.mode === 'series'
            ? values.r1 + values.r2 + values.r3
            : 1 / ((1 / values.r1) + (1 / values.r2) + (1 / values.r3));
        return result(
            equivalent,
            'Ω',
            localized(language, 'المقاومة المكافئة', 'Equivalent resistance'),
            localized(
                language,
                values.mode === 'series' ? 'توصيل على التوالي' : 'توصيل على التوازي',
                values.mode === 'series' ? 'Series connection' : 'Parallel connection',
            ),
        );
    },
});

const voltageDivider = Object.freeze({
    id: 'voltage-divider-calculator',
    category: 'engineering',
    icon: 'V₂',
    title: Object.freeze({ ar: 'حاسبة مقسم الجهد', en: 'Voltage Divider Calculator' }),
    description: Object.freeze({ ar: 'احسب جهد الخرج لمقسم جهد بمقاومتين.', en: 'Calculate output voltage for a two-resistor divider.' }),
    note: Object.freeze({ ar: 'يفترض عدم وجود حمل على جهد الخرج.', en: 'Assumes the output is unloaded.' }),
    inputs: Object.freeze([
        numberInput('inputVoltage', { ar: 'جهد الدخل', en: 'Input voltage' }, 12, { unit: { ar: 'فولت', en: 'V' } }),
        numberInput('r1', { ar: 'المقاومة R1', en: 'Resistance R1' }, 1000, { min: 0.000001, unit: { ar: 'أوم', en: 'Ω' } }),
        numberInput('r2', { ar: 'المقاومة R2', en: 'Resistance R2' }, 1000, { min: 0.000001, unit: { ar: 'أوم', en: 'Ω' } }),
    ]),
    calculate(values, language) {
        const output = values.inputVoltage * values.r2 / (values.r1 + values.r2);
        return result(output, 'V', localized(language, 'جهد الخرج', 'Output voltage'), 'Vout = Vin × R2 ÷ (R1 + R2)');
    },
});

const forceCalculator = Object.freeze({
    id: 'force-calculator',
    category: 'engineering',
    icon: 'F',
    title: Object.freeze({ ar: 'حاسبة القوة', en: 'Force Calculator' }),
    description: Object.freeze({ ar: 'احسب القوة من الكتلة والتسارع وفق قانون نيوتن الثاني.', en: 'Calculate force from mass and acceleration using Newton’s second law.' }),
    note: Object.freeze({ ar: 'تطبق العلاقة F = m × a.', en: 'Applies F = m × a.' }),
    inputs: Object.freeze([
        numberInput('mass', { ar: 'الكتلة', en: 'Mass' }, 10, { unit: { ar: 'كجم', en: 'kg' } }),
        numberInput('acceleration', { ar: 'التسارع', en: 'Acceleration' }, 9.81, { unit: { ar: 'م/ث²', en: 'm/s²' } }),
    ]),
    calculate(values, language) {
        return result(values.mass * values.acceleration, 'N', localized(language, 'القوة', 'Force'), 'F = m × a');
    },
});

const kineticEnergy = Object.freeze({
    id: 'kinetic-energy-calculator',
    category: 'engineering',
    icon: 'KE',
    title: Object.freeze({ ar: 'حاسبة الطاقة الحركية', en: 'Kinetic Energy Calculator' }),
    description: Object.freeze({ ar: 'احسب طاقة جسم متحرك من كتلته وسرعته.', en: 'Calculate a moving object’s energy from mass and velocity.' }),
    note: Object.freeze({ ar: 'تطبق العلاقة KE = ½mv².', en: 'Applies KE = ½mv².' }),
    inputs: Object.freeze([
        numberInput('mass', { ar: 'الكتلة', en: 'Mass' }, 10, { unit: { ar: 'كجم', en: 'kg' } }),
        numberInput('velocity', { ar: 'السرعة', en: 'Velocity' }, 5, { unit: { ar: 'م/ث', en: 'm/s' } }),
    ]),
    calculate(values, language) {
        return result(0.5 * values.mass * (values.velocity ** 2), 'J', localized(language, 'الطاقة الحركية', 'Kinetic energy'), 'KE = ½mv²');
    },
});

const potentialEnergy = Object.freeze({
    id: 'potential-energy-calculator',
    category: 'engineering',
    icon: 'PE',
    title: Object.freeze({ ar: 'حاسبة طاقة الوضع', en: 'Potential Energy Calculator' }),
    description: Object.freeze({ ar: 'احسب طاقة الوضع الجاذبية من الكتلة والارتفاع.', en: 'Calculate gravitational potential energy from mass and height.' }),
    note: Object.freeze({ ar: 'يمكن تعديل تسارع الجاذبية حسب الموقع.', en: 'Gravity can be adjusted for the location.' }),
    inputs: Object.freeze([
        numberInput('mass', { ar: 'الكتلة', en: 'Mass' }, 10, { unit: { ar: 'كجم', en: 'kg' } }),
        numberInput('height', { ar: 'الارتفاع', en: 'Height' }, 5, { unit: { ar: 'متر', en: 'm' } }),
        numberInput('gravity', { ar: 'تسارع الجاذبية', en: 'Gravity' }, 9.81, { min: 0.000001, unit: { ar: 'م/ث²', en: 'm/s²' } }),
    ]),
    calculate(values, language) {
        return result(values.mass * values.height * values.gravity, 'J', localized(language, 'طاقة الوضع', 'Potential energy'), 'PE = m × g × h');
    },
});

const densityCalculator = Object.freeze({
    id: 'density-calculator',
    category: 'engineering',
    icon: 'ρ',
    title: Object.freeze({ ar: 'حاسبة الكثافة', en: 'Density Calculator' }),
    description: Object.freeze({ ar: 'احسب الكثافة من الكتلة والحجم.', en: 'Calculate density from mass and volume.' }),
    note: Object.freeze({ ar: 'النتيجة بوحدة كجم لكل متر مكعب.', en: 'Result is in kilograms per cubic metre.' }),
    inputs: Object.freeze([
        numberInput('mass', { ar: 'الكتلة', en: 'Mass' }, 100, { unit: { ar: 'كجم', en: 'kg' } }),
        numberInput('volume', { ar: 'الحجم', en: 'Volume' }, 2, { min: 0.000001, unit: { ar: 'م³', en: 'm³' } }),
    ]),
    calculate(values, language) {
        return result(values.mass / values.volume, 'kg/m³', localized(language, 'الكثافة', 'Density'), 'ρ = m ÷ V');
    },
});

const pressureCalculator = Object.freeze({
    id: 'physics-pressure-calculator',
    category: 'engineering',
    icon: 'Pa',
    title: Object.freeze({ ar: 'حاسبة الضغط الفيزيائي', en: 'Physics Pressure Calculator' }),
    description: Object.freeze({ ar: 'احسب الضغط من القوة المؤثرة والمساحة.', en: 'Calculate pressure from applied force and area.' }),
    note: Object.freeze({ ar: 'النتيجة بوحدة باسكال.', en: 'Result is in pascals.' }),
    inputs: Object.freeze([
        numberInput('force', { ar: 'القوة', en: 'Force' }, 100, { unit: { ar: 'نيوتن', en: 'N' } }),
        numberInput('area', { ar: 'المساحة', en: 'Area' }, 2, { min: 0.000001, unit: { ar: 'م²', en: 'm²' } }),
    ]),
    calculate(values, language) {
        return result(values.force / values.area, 'Pa', localized(language, 'الضغط', 'Pressure'), 'P = F ÷ A');
    },
});

const wavelengthCalculator = Object.freeze({
    id: 'wavelength-frequency-calculator',
    category: 'engineering',
    icon: 'λ',
    title: Object.freeze({ ar: 'حاسبة الطول الموجي', en: 'Wavelength Calculator' }),
    description: Object.freeze({ ar: 'احسب الطول الموجي من سرعة الموجة وترددها.', en: 'Calculate wavelength from wave speed and frequency.' }),
    note: Object.freeze({ ar: 'السرعة الافتراضية هي سرعة الضوء في الفراغ.', en: 'The default speed is light in vacuum.' }),
    inputs: Object.freeze([
        numberInput('speed', { ar: 'سرعة الموجة', en: 'Wave speed' }, 299792458, { min: 0.000001, unit: { ar: 'م/ث', en: 'm/s' } }),
        numberInput('frequency', { ar: 'التردد', en: 'Frequency' }, 100000000, { min: 0.000001, unit: { ar: 'هرتز', en: 'Hz' } }),
    ]),
    calculate(values, language) {
        return result(values.speed / values.frequency, 'm', localized(language, 'الطول الموجي', 'Wavelength'), 'λ = v ÷ f');
    },
});

const engineeringDefinitions = Object.freeze({
    'ohms-law-calculator': ohmsLaw,
    'electrical-power-calculator': electricalPower,
    'resistor-combination-calculator': resistorCalculator,
    'voltage-divider-calculator': voltageDivider,
    'force-calculator': forceCalculator,
    'kinetic-energy-calculator': kineticEnergy,
    'potential-energy-calculator': potentialEnergy,
    'density-calculator': densityCalculator,
    'physics-pressure-calculator': pressureCalculator,
    'wavelength-frequency-calculator': wavelengthCalculator,
});

export { engineeringDefinitions };

// END OF FILE
