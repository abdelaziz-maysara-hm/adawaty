const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function input(id, ar, en, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1e9,
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

function roundedUp(value) {
    return Math.ceil(value);
}

function wasteMultiplier(waste) {
    return 1 + waste / 100;
}

const brick = tool({
    id: 'brick-quantity-calculator',
    icon: '▦',
    title: { ar: 'حاسبة عدد الطوب', en: 'Brick Quantity Calculator' },
    description: { ar: 'قدّر عدد قوالب الطوب اللازمة لبناء جدار مع احتساب الهالك.', en: 'Estimate bricks needed for a wall including waste.' },
    note: { ar: 'أدخل أبعاد الجدار والطوبة بالمتر وسماكة المونة.', en: 'Enter wall and brick dimensions in metres plus mortar thickness.' },
    inputs: [
        input('wallLength', 'طول الجدار', 'Wall length', 5, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('wallHeight', 'ارتفاع الجدار', 'Wall height', 3, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('brickLength', 'طول الطوبة', 'Brick length', 0.2, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('brickHeight', 'ارتفاع الطوبة', 'Brick height', 0.1, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('mortar', 'سماكة المونة', 'Mortar joint', 0.01, { min: 0, max: 0.1, unit: { ar: 'م', en: 'm' } }),
        input('waste', 'نسبة الهالك', 'Waste allowance', 5, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const count = values.wallLength * values.wallHeight
            / ((values.brickLength + values.mortar) * (values.brickHeight + values.mortar))
            * wasteMultiplier(values.waste);
        return output(roundedUp(count), localized(language, 'عدد قوالب الطوب', 'Bricks required'));
    },
});

const mortar = tool({
    id: 'mortar-volume-calculator',
    icon: 'M³',
    title: { ar: 'حاسبة حجم المونة', en: 'Mortar Volume Calculator' },
    description: { ar: 'قدّر حجم المونة المطلوب لأعمال البناء.', en: 'Estimate mortar volume required for masonry work.' },
    note: { ar: 'استخدم نسبة المونة المقدرة من حجم الحائط.', en: 'Uses an estimated mortar percentage of wall volume.' },
    inputs: [
        input('length', 'طول الجدار', 'Wall length', 5, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('height', 'ارتفاع الجدار', 'Wall height', 3, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('thickness', 'سماكة الجدار', 'Wall thickness', 0.2, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('mortarPercent', 'نسبة المونة', 'Mortar percentage', 25, { min: 1, max: 80, unit: { ar: '%', en: '%' } }),
        input('waste', 'نسبة الهالك', 'Waste allowance', 10, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const volume = values.length * values.height * values.thickness
            * values.mortarPercent / 100 * wasteMultiplier(values.waste);
        return output(amount(volume, 'm³'), localized(language, 'حجم المونة', 'Mortar volume'));
    },
});

const cementBags = tool({
    id: 'cement-bag-calculator',
    icon: 'BAG',
    title: { ar: 'حاسبة أكياس الأسمنت', en: 'Cement Bag Calculator' },
    description: { ar: 'احسب عدد أكياس الأسمنت من الحجم ونسبة الأسمنت وكثافته.', en: 'Calculate cement bags from volume, cement share and density.' },
    note: { ar: 'القيمة الشائعة لكثافة الأسمنت السائب 1440 كجم/م³.', en: 'A common bulk cement density is 1,440 kg/m³.' },
    inputs: [
        input('volume', 'الحجم الكلي', 'Total volume', 1, { min: 0.001, unit: { ar: 'م³', en: 'm³' } }),
        input('cementPercent', 'نسبة الأسمنت', 'Cement share', 20, { min: 0.1, max: 100, unit: { ar: '%', en: '%' } }),
        input('density', 'كثافة الأسمنت', 'Cement density', 1440, { min: 1, unit: { ar: 'كجم/م³', en: 'kg/m³' } }),
        input('bagWeight', 'وزن الكيس', 'Bag weight', 50, { min: 0.1, unit: { ar: 'كجم', en: 'kg' } }),
        input('waste', 'نسبة الهالك', 'Waste allowance', 5, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const kilograms = values.volume * values.cementPercent / 100 * values.density * wasteMultiplier(values.waste);
        return output(roundedUp(kilograms / values.bagWeight), localized(language, 'عدد الأكياس', 'Cement bags'), amount(kilograms, 'kg'));
    },
});

const flooring = tool({
    id: 'flooring-material-calculator',
    icon: '▤',
    title: { ar: 'حاسبة مواد الأرضيات', en: 'Flooring Material Calculator' },
    description: { ar: 'احسب مساحة الأرضية وعدد العبوات المطلوبة مع الهالك.', en: 'Calculate floor area and packages required including waste.' },
    note: { ar: 'أدخل المساحة التي تغطيها العبوة الواحدة.', en: 'Enter the coverage of one flooring package.' },
    inputs: [
        input('length', 'طول الغرفة', 'Room length', 5, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('width', 'عرض الغرفة', 'Room width', 4, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('coverage', 'تغطية العبوة', 'Package coverage', 2.2, { min: 0.01, unit: { ar: 'م²', en: 'm²' } }),
        input('waste', 'نسبة الهالك', 'Waste allowance', 10, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const area = values.length * values.width * wasteMultiplier(values.waste);
        return output(roundedUp(area / values.coverage), localized(language, 'عدد العبوات', 'Packages required'), amount(area, 'm²'));
    },
});

const drywall = tool({
    id: 'drywall-sheet-calculator',
    icon: '▯',
    title: { ar: 'حاسبة ألواح الجبس', en: 'Drywall Sheet Calculator' },
    description: { ar: 'قدّر عدد ألواح الجبس اللازمة لتغطية جدار أو سقف.', en: 'Estimate drywall sheets needed for a wall or ceiling.' },
    note: { ar: 'يُقرب عدد الألواح دائمًا إلى أعلى.', en: 'The sheet count is always rounded up.' },
    inputs: [
        input('surfaceLength', 'طول السطح', 'Surface length', 6, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('surfaceHeight', 'ارتفاع السطح', 'Surface height', 3, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('sheetLength', 'طول اللوح', 'Sheet length', 2.4, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('sheetWidth', 'عرض اللوح', 'Sheet width', 1.2, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('waste', 'نسبة الهالك', 'Waste allowance', 10, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const count = values.surfaceLength * values.surfaceHeight * wasteMultiplier(values.waste)
            / (values.sheetLength * values.sheetWidth);
        return output(roundedUp(count), localized(language, 'عدد الألواح', 'Sheets required'));
    },
});

const roofing = tool({
    id: 'roofing-area-calculator',
    icon: '⌂',
    title: { ar: 'حاسبة مساحة السقف المائل', en: 'Roofing Area Calculator' },
    description: { ar: 'احسب مساحة سقف جملوني من أبعاد المبنى وارتفاع الميل.', en: 'Calculate a gable roof area from building dimensions and rise.' },
    note: { ar: 'يفترض الحساب سقفًا جملونيًا متماثل الجانبين.', en: 'Assumes a symmetrical two-sided gable roof.' },
    inputs: [
        input('length', 'طول المبنى', 'Building length', 10, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('width', 'عرض المبنى', 'Building width', 8, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('rise', 'ارتفاع الميل', 'Roof rise', 2, { min: 0, unit: { ar: 'م', en: 'm' } }),
        input('waste', 'نسبة الهالك', 'Waste allowance', 10, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const slopeLength = Math.hypot(values.width / 2, values.rise);
        const area = 2 * values.length * slopeLength * wasteMultiplier(values.waste);
        return output(amount(area, 'm²'), localized(language, 'مساحة التغطية', 'Roofing area'));
    },
});

const gravel = tool({
    id: 'gravel-quantity-calculator',
    icon: '◆',
    title: { ar: 'حاسبة كمية الحصى', en: 'Gravel Quantity Calculator' },
    description: { ar: 'احسب حجم ووزن الحصى المطلوب لتغطية مساحة.', en: 'Calculate gravel volume and mass needed to cover an area.' },
    note: { ar: 'الوزن يعتمد على الكثافة التي تدخلها.', en: 'Mass depends on the density you enter.' },
    inputs: [
        input('length', 'الطول', 'Length', 5, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('width', 'العرض', 'Width', 4, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('depth', 'العمق', 'Depth', 0.08, { min: 0.001, unit: { ar: 'م', en: 'm' } }),
        input('density', 'الكثافة', 'Density', 1680, { min: 1, unit: { ar: 'كجم/م³', en: 'kg/m³' } }),
        input('waste', 'نسبة الهالك', 'Waste allowance', 5, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const volume = values.length * values.width * values.depth * wasteMultiplier(values.waste);
        return output(amount(volume * values.density, 'kg'), localized(language, 'وزن الحصى', 'Gravel mass'), amount(volume, 'm³'));
    },
});

const soil = tool({
    id: 'topsoil-volume-calculator',
    icon: '♒',
    title: { ar: 'حاسبة حجم التربة', en: 'Topsoil Volume Calculator' },
    description: { ar: 'احسب حجم التربة اللازمة لحوض أو حديقة مستطيلة.', en: 'Calculate topsoil volume for a rectangular bed or garden.' },
    note: { ar: 'يمكن إضافة نسبة للهبوط أو الفاقد.', en: 'An allowance can be added for settlement or waste.' },
    inputs: [
        input('length', 'الطول', 'Length', 6, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('width', 'العرض', 'Width', 3, { min: 0.01, unit: { ar: 'م', en: 'm' } }),
        input('depth', 'العمق', 'Depth', 0.2, { min: 0.001, unit: { ar: 'م', en: 'm' } }),
        input('allowance', 'نسبة إضافية', 'Extra allowance', 10, { min: 0, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const volume = values.length * values.width * values.depth * wasteMultiplier(values.allowance);
        return output(amount(volume, 'm³'), localized(language, 'حجم التربة', 'Topsoil volume'), amount(volume * 1000, 'L'));
    },
});

const stairs = tool({
    id: 'staircase-dimensions-calculator',
    icon: '▟',
    title: { ar: 'حاسبة أبعاد السلم', en: 'Staircase Dimensions Calculator' },
    description: { ar: 'قدّر عدد الدرجات وارتفاع القائمة وطول السلم الأفقي.', en: 'Estimate step count, riser height and horizontal run.' },
    note: { ar: 'هذه نتيجة تقديرية ويجب مراجعة كود البناء المحلي.', en: 'This is an estimate; always check local building codes.' },
    inputs: [
        input('totalRise', 'الارتفاع الكلي', 'Total rise', 3, { min: 0.1, unit: { ar: 'م', en: 'm' } }),
        input('targetRiser', 'ارتفاع القائمة المطلوب', 'Target riser height', 0.175, { min: 0.05, max: 0.4, unit: { ar: 'م', en: 'm' } }),
        input('treadDepth', 'عمق النائمة', 'Tread depth', 0.28, { min: 0.1, max: 1, unit: { ar: 'م', en: 'm' } }),
    ],
    calculate(values, language) {
        const risers = Math.max(1, Math.round(values.totalRise / values.targetRiser));
        const riserHeight = values.totalRise / risers;
        const treads = Math.max(0, risers - 1);
        return output(
            risers,
            localized(language, 'عدد القوائم', 'Number of risers'),
            `${localized(language, 'ارتفاع القائمة', 'Riser height')}: ${amount(riserHeight, 'm')}\n${localized(language, 'الامتداد الأفقي', 'Horizontal run')}: ${amount(treads * values.treadDepth, 'm')}`,
        );
    },
});

const airConditioner = tool({
    id: 'room-air-conditioner-size-calculator',
    icon: 'BTU',
    title: { ar: 'حاسبة سعة تكييف الغرفة', en: 'Room Air Conditioner Size Calculator' },
    description: { ar: 'قدّر سعة التكييف المطلوبة من مساحة الغرفة والعوامل الإضافية.', en: 'Estimate required AC capacity from room area and adjustment factors.' },
    note: { ar: 'النتيجة تقديرية ولا تغني عن حساب الأحمال الحرارية الاحترافي.', en: 'This estimate does not replace a professional heat-load calculation.' },
    inputs: [
        input('length', 'طول الغرفة', 'Room length', 5, { min: 0.1, unit: { ar: 'م', en: 'm' } }),
        input('width', 'عرض الغرفة', 'Room width', 4, { min: 0.1, unit: { ar: 'م', en: 'm' } }),
        input('height', 'ارتفاع الغرفة', 'Room height', 2.8, { min: 1, max: 10, unit: { ar: 'م', en: 'm' } }),
        input('people', 'عدد الأشخاص', 'Occupants', 2, { min: 1, max: 100, step: 1 }),
        input('sunFactor', 'معامل التعرض للشمس', 'Sun exposure factor', 1, { min: 0.8, max: 1.3 }),
    ],
    calculate(values, language) {
        const base = values.length * values.width * 600 * (values.height / 2.8);
        const capacity = base * values.sunFactor + Math.max(0, values.people - 2) * 600;
        return output(amount(roundedUp(capacity), 'BTU/h'), localized(language, 'السعة التقديرية', 'Estimated capacity'));
    },
});

const constructionDefinitions = Object.freeze({
    [brick.id]: brick,
    [mortar.id]: mortar,
    [cementBags.id]: cementBags,
    [flooring.id]: flooring,
    [drywall.id]: drywall,
    [roofing.id]: roofing,
    [gravel.id]: gravel,
    [soil.id]: soil,
    [stairs.id]: stairs,
    [airConditioner.id]: airConditioner,
});

export { constructionDefinitions };

// END OF FILE
