function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function numberInput(id, label, placeholder, min, max, step = 0.01) {
    return Object.freeze({
        id, type: 'number', min, max, step,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id, type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze(option))),
    });
}

function trigonometryTool(config) {
    return Object.freeze({
        id: config.id,
        category: 'math',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate: config.calculate,
    });
}

function radians(degrees) {
    return degrees * Math.PI / 180;
}

function degrees(radiansValue) {
    return radiansValue * 180 / Math.PI;
}

function round(value, digits = 6) {
    const result = Number(value.toFixed(digits));
    return Object.is(result, -0) ? 0 : result;
}

function positiveSide(id, label, placeholder) {
    return numberInput(id, label, placeholder, 0.000001, 1e12);
}

function validTriangle(a, b, c) {
    return a + b > c && a + c > b && b + c > a;
}

const trigFunctions = trigonometryTool({
    id: 'trigonometric-functions-calculator',
    icon: 'sin',
    title: { ar: 'حاسبة الدوال المثلثية', en: 'Trigonometric Functions Calculator' },
    description: { ar: 'احسب الجيب وجيب التمام والظل لزاوية بالدرجات.', en: 'Calculate sine, cosine and tangent for an angle in degrees.' },
    note: { ar: 'قد يكون الظل غير معرّف عند مضاعفات 90° الفردية.', en: 'Tangent can be undefined at odd multiples of 90°.' },
    inputs: [numberInput('angle', { ar: 'الزاوية', en: 'Angle' }, 30, -1e9, 1e9)],
    calculate(values, language) {
        const angle = radians(values.angle);
        const cosine = Math.cos(angle);
        const tangent = Math.abs(cosine) < 1e-12 ? localized(language, 'غير معرّف', 'Undefined') : round(Math.tan(angle));
        return output(
            `sin: ${round(Math.sin(angle))}\ncos: ${round(cosine)}\ntan: ${tangent}`,
            localized(language, 'قيم الدوال', 'Function values'),
        );
    },
});

const inverseTrig = trigonometryTool({
    id: 'inverse-trigonometric-calculator',
    icon: 'sin⁻¹',
    title: { ar: 'حاسبة الدوال المثلثية العكسية', en: 'Inverse Trigonometric Calculator' },
    description: { ar: 'احسب الزاوية بالدرجات من قيمة الجيب أو جيب التمام أو الظل.', en: 'Find an angle in degrees from sine, cosine or tangent.' },
    note: { ar: 'يجب أن تكون قيمة الجيب وجيب التمام بين −1 و1.', en: 'Sine and cosine inputs must be between −1 and 1.' },
    inputs: [
        numberInput('value', { ar: 'القيمة', en: 'Value' }, 0.5, -1e12, 1e12),
        selectInput('function', { ar: 'الدالة العكسية', en: 'Inverse function' }, [
            { value: 'asin', label: { ar: 'جيب عكسي', en: 'Arcsine' } },
            { value: 'acos', label: { ar: 'جيب تمام عكسي', en: 'Arccosine' } },
            { value: 'atan', label: { ar: 'ظل عكسي', en: 'Arctangent' } },
        ]),
    ],
    calculate(values, language) {
        if (values.function !== 'atan' && Math.abs(values.value) > 1) {
            throw new Error(localized(language, 'القيمة خارج المجال المسموح.', 'Value is outside the valid domain.'));
        }
        const functions = { asin: Math.asin, acos: Math.acos, atan: Math.atan };
        return output(`${round(degrees(functions[values.function](values.value)))}°`, localized(language, 'الزاوية', 'Angle'));
    },
});

const cosineSide = trigonometryTool({
    id: 'law-of-cosines-side-calculator',
    icon: 'c²',
    title: { ar: 'قانون جيب التمام لإيجاد ضلع', en: 'Law of Cosines Side Calculator' },
    description: { ar: 'احسب الضلع المقابل لزاوية معلومة باستخدام ضلعين.', en: 'Find the side opposite a known angle using two sides.' },
    note: { ar: 'تستخدم الصيغة c² = a² + b² − 2ab cos(C).', en: 'Uses c² = a² + b² − 2ab cos(C).' },
    inputs: [
        positiveSide('a', { ar: 'الضلع a', en: 'Side a' }, 5),
        positiveSide('b', { ar: 'الضلع b', en: 'Side b' }, 7),
        numberInput('angle', { ar: 'الزاوية C', en: 'Angle C' }, 60, 0.000001, 179.999999),
    ],
    calculate(values, language) {
        const side = Math.sqrt(values.a ** 2 + values.b ** 2 - 2 * values.a * values.b * Math.cos(radians(values.angle)));
        return output(round(side), localized(language, 'الضلع c', 'Side c'));
    },
});

const cosineAngle = trigonometryTool({
    id: 'law-of-cosines-angle-calculator',
    icon: '∠C',
    title: { ar: 'قانون جيب التمام لإيجاد زاوية', en: 'Law of Cosines Angle Calculator' },
    description: { ar: 'احسب زاوية مثلث من أطوال أضلاعه الثلاثة.', en: 'Find a triangle angle from its three side lengths.' },
    note: { ar: 'تتحقق الأداة من شرط تكوين المثلث.', en: 'The triangle inequality is validated.' },
    inputs: [
        positiveSide('a', { ar: 'الضلع a', en: 'Side a' }, 5),
        positiveSide('b', { ar: 'الضلع b', en: 'Side b' }, 7),
        positiveSide('c', { ar: 'الضلع c المقابل', en: 'Opposite side c' }, 6),
    ],
    calculate(values, language) {
        if (!validTriangle(values.a, values.b, values.c)) throw new Error(localized(language, 'الأضلاع لا تكوّن مثلثًا صالحًا.', 'The sides do not form a valid triangle.'));
        const cosine = (values.a ** 2 + values.b ** 2 - values.c ** 2) / (2 * values.a * values.b);
        return output(`${round(degrees(Math.acos(Math.max(-1, Math.min(1, cosine)))))}°`, localized(language, 'الزاوية C', 'Angle C'));
    },
});

const sineSide = trigonometryTool({
    id: 'law-of-sines-side-calculator',
    icon: 'a/sinA',
    title: { ar: 'قانون الجيب لإيجاد ضلع', en: 'Law of Sines Side Calculator' },
    description: { ar: 'احسب ضلعًا من ضلع مقابل وزاويتين معلومتين.', en: 'Find a side from one opposite side and two known angles.' },
    note: { ar: 'تستخدم الصيغة b = a × sin(B) ÷ sin(A).', en: 'Uses b = a × sin(B) ÷ sin(A).' },
    inputs: [
        positiveSide('knownSide', { ar: 'الضلع المعلوم a', en: 'Known side a' }, 10),
        numberInput('knownAngle', { ar: 'الزاوية المقابلة A', en: 'Opposite angle A' }, 30, 0.000001, 179.999999),
        numberInput('targetAngle', { ar: 'الزاوية B', en: 'Target angle B' }, 45, 0.000001, 179.999999),
    ],
    calculate(values, language) {
        if (values.knownAngle + values.targetAngle >= 180) throw new Error(localized(language, 'يجب أن يكون مجموع الزاويتين أقل من 180°.', 'The two angles must sum to less than 180°.'));
        const side = values.knownSide * Math.sin(radians(values.targetAngle)) / Math.sin(radians(values.knownAngle));
        return output(round(side), localized(language, 'الضلع b', 'Side b'));
    },
});

const arcLength = trigonometryTool({
    id: 'arc-length-calculator',
    icon: '⌒',
    title: { ar: 'حاسبة طول القوس', en: 'Arc Length Calculator' },
    description: { ar: 'احسب طول قوس دائرة من نصف القطر والزاوية المركزية.', en: 'Calculate circular arc length from radius and central angle.' },
    note: { ar: 'طول القوس يساوي نصف القطر مضروبًا في الزاوية بالراديان.', en: 'Arc length equals radius multiplied by the angle in radians.' },
    inputs: [
        positiveSide('radius', { ar: 'نصف القطر', en: 'Radius' }, 10),
        numberInput('angle', { ar: 'الزاوية المركزية', en: 'Central angle' }, 90, 0, 360),
    ],
    calculate(values, language) {
        return output(round(values.radius * radians(values.angle)), localized(language, 'طول القوس', 'Arc length'));
    },
});

const sectorArea = trigonometryTool({
    id: 'sector-area-calculator',
    icon: '◔',
    title: { ar: 'حاسبة مساحة القطاع الدائري', en: 'Sector Area Calculator' },
    description: { ar: 'احسب مساحة قطاع دائرة من نصف القطر والزاوية.', en: 'Calculate circular sector area from radius and angle.' },
    note: { ar: 'المساحة تساوي θr²÷2 عندما تكون θ بالراديان.', en: 'Area equals θr²÷2 when θ is in radians.' },
    inputs: [
        positiveSide('radius', { ar: 'نصف القطر', en: 'Radius' }, 10),
        numberInput('angle', { ar: 'الزاوية المركزية', en: 'Central angle' }, 90, 0, 360),
    ],
    calculate(values, language) {
        return output(round(values.radius ** 2 * radians(values.angle) / 2), localized(language, 'مساحة القطاع', 'Sector area'));
    },
});

const chordLength = trigonometryTool({
    id: 'chord-length-calculator',
    icon: '⌓',
    title: { ar: 'حاسبة طول وتر الدائرة', en: 'Chord Length Calculator' },
    description: { ar: 'احسب طول الوتر من نصف القطر والزاوية المركزية.', en: 'Calculate chord length from radius and central angle.' },
    note: { ar: 'يستخدم الوتر = 2r × sin(θ÷2).', en: 'Uses chord = 2r × sin(θ÷2).' },
    inputs: [
        positiveSide('radius', { ar: 'نصف القطر', en: 'Radius' }, 10),
        numberInput('angle', { ar: 'الزاوية المركزية', en: 'Central angle' }, 60, 0, 360),
    ],
    calculate(values, language) {
        return output(round(2 * values.radius * Math.sin(radians(values.angle) / 2)), localized(language, 'طول الوتر', 'Chord length'));
    },
});

const segmentArea = trigonometryTool({
    id: 'circular-segment-area-calculator',
    icon: '◒',
    title: { ar: 'حاسبة مساحة القطعة الدائرية', en: 'Circular Segment Area Calculator' },
    description: { ar: 'احسب مساحة القطعة الصغرى بين القوس والوتر.', en: 'Calculate the minor circular segment area between an arc and chord.' },
    note: { ar: 'تقبل زاوية مركزية بين 0° و180°.', en: 'Accepts a central angle between 0° and 180°.' },
    inputs: [
        positiveSide('radius', { ar: 'نصف القطر', en: 'Radius' }, 10),
        numberInput('angle', { ar: 'الزاوية المركزية', en: 'Central angle' }, 60, 0, 180),
    ],
    calculate(values, language) {
        const theta = radians(values.angle);
        return output(round(values.radius ** 2 * (theta - Math.sin(theta)) / 2), localized(language, 'مساحة القطعة', 'Segment area'));
    },
});

const dmsConverter = trigonometryTool({
    id: 'decimal-degrees-dms-converter',
    icon: '°′″',
    title: { ar: 'محول الدرجات العشرية وDMS', en: 'Decimal Degrees and DMS Converter' },
    description: { ar: 'حوّل بين الدرجات العشرية وصيغة الدرجات والدقائق والثواني.', en: 'Convert between decimal degrees and degrees-minutes-seconds format.' },
    note: { ar: 'استخدم القيم السالبة للاتجاهات الغربية أو الجنوبية.', en: 'Use negative values for western or southern directions.' },
    inputs: [
        selectInput('direction', { ar: 'اتجاه التحويل', en: 'Conversion direction' }, [
            { value: 'decimal-to-dms', label: { ar: 'عشري إلى DMS', en: 'Decimal to DMS' } },
            { value: 'dms-to-decimal', label: { ar: 'DMS إلى عشري', en: 'DMS to decimal' } },
        ]),
        numberInput('decimal', { ar: 'الدرجات العشرية', en: 'Decimal degrees' }, 30.508333, -360, 360, 0.000001),
        numberInput('degree', { ar: 'الدرجات', en: 'Degrees' }, 30, -360, 360, 1),
        numberInput('minute', { ar: 'الدقائق', en: 'Minutes' }, 30, 0, 59, 1),
        numberInput('second', { ar: 'الثواني', en: 'Seconds' }, 30, 0, 59.999999, 0.000001),
    ],
    calculate(values, language) {
        if (values.direction === 'dms-to-decimal') {
            const sign = values.degree < 0 ? -1 : 1;
            const decimal = sign * (Math.abs(values.degree) + values.minute / 60 + values.second / 3600);
            return output(`${round(decimal)}°`, localized(language, 'الدرجات العشرية', 'Decimal degrees'));
        }
        const sign = values.decimal < 0 ? '-' : '';
        const absolute = Math.abs(values.decimal);
        const degree = Math.floor(absolute);
        const minuteValue = (absolute - degree) * 60;
        const minute = Math.floor(minuteValue);
        const second = round((minuteValue - minute) * 60);
        return output(`${sign}${degree}° ${minute}′ ${second}″`, localized(language, 'صيغة DMS', 'DMS format'));
    },
});

const trigonometryDefinitions = Object.freeze({
    [trigFunctions.id]: trigFunctions,
    [inverseTrig.id]: inverseTrig,
    [cosineSide.id]: cosineSide,
    [cosineAngle.id]: cosineAngle,
    [sineSide.id]: sineSide,
    [arcLength.id]: arcLength,
    [sectorArea.id]: sectorArea,
    [chordLength.id]: chordLength,
    [segmentArea.id]: segmentArea,
    [dmsConverter.id]: dmsConverter,
});

export { trigonometryDefinitions };

// END OF FILE
