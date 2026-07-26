const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });

function format(value) {
    return formatter.format(value);
}

function localized(language, value) {
    return language === 'ar' ? value.ar : value.en;
}

function field(id, ar, en, sample, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0.000001,
        max: options.max ?? 1_000_000_000,
        step: options.step ?? 0.01,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: 'وحدة', en: 'units' }),
        placeholder: String(sample),
    });
}

function shape(config) {
    return Object.freeze({
        id: config.id,
        category: 'math',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate(values, language) {
            const calculated = config.calculate(values);
            if (!Number.isFinite(calculated.value)) {
                throw new Error(localized(language, { ar: 'تعذر حساب نتيجة صالحة.', en: 'Unable to calculate a valid result.' }));
            }
            return {
                value: `${format(calculated.value)} ${localized(language, calculated.unit)}`,
                label: localized(language, calculated.label),
                details: calculated.details
                    ? localized(language, calculated.details)
                    : '',
            };
        },
    });
}

const sphere = shape({
    id: 'sphere-calculator',
    icon: '●',
    title: { ar: 'حاسبة الكرة', en: 'Sphere Calculator' },
    description: { ar: 'احسب حجم ومساحة سطح الكرة من نصف القطر.', en: 'Calculate sphere volume and surface area from radius.' },
    note: { ar: 'الحجم = 4/3 × π × نق³.', en: 'Volume = 4/3 × π × r³.' },
    inputs: [field('radius', 'نصف القطر', 'Radius', 5)],
    calculate: ({ radius }) => ({
        value: 4 / 3 * Math.PI * radius ** 3,
        unit: { ar: 'وحدة³', en: 'units³' },
        label: { ar: 'حجم الكرة', en: 'Sphere volume' },
        details: { ar: `مساحة السطح: ${format(4 * Math.PI * radius ** 2)} وحدة²`, en: `Surface area: ${format(4 * Math.PI * radius ** 2)} units²` },
    }),
});

const cylinder = shape({
    id: 'cylinder-calculator',
    icon: '▣',
    title: { ar: 'حاسبة الأسطوانة', en: 'Cylinder Calculator' },
    description: { ar: 'احسب حجم ومساحة سطح الأسطوانة من نصف القطر والارتفاع.', en: 'Calculate cylinder volume and surface area from radius and height.' },
    note: { ar: 'الحجم = π × نق² × الارتفاع.', en: 'Volume = π × r² × height.' },
    inputs: [field('radius', 'نصف القطر', 'Radius', 4), field('height', 'الارتفاع', 'Height', 10)],
    calculate: ({ radius, height }) => ({
        value: Math.PI * radius ** 2 * height,
        unit: { ar: 'وحدة³', en: 'units³' },
        label: { ar: 'حجم الأسطوانة', en: 'Cylinder volume' },
        details: { ar: `مساحة السطح: ${format(2 * Math.PI * radius * (radius + height))} وحدة²`, en: `Surface area: ${format(2 * Math.PI * radius * (radius + height))} units²` },
    }),
});

const cone = shape({
    id: 'cone-calculator',
    icon: '△',
    title: { ar: 'حاسبة المخروط', en: 'Cone Calculator' },
    description: { ar: 'احسب حجم ومساحة سطح مخروط دائري قائم.', en: 'Calculate volume and surface area of a right circular cone.' },
    note: { ar: 'يُحسب الارتفاع المائل تلقائيًا.', en: 'Slant height is calculated automatically.' },
    inputs: [field('radius', 'نصف القطر', 'Radius', 3), field('height', 'الارتفاع', 'Height', 8)],
    calculate: ({ radius, height }) => {
        const slant = Math.hypot(radius, height);
        return {
            value: Math.PI * radius ** 2 * height / 3,
            unit: { ar: 'وحدة³', en: 'units³' },
            label: { ar: 'حجم المخروط', en: 'Cone volume' },
            details: { ar: `مساحة السطح: ${format(Math.PI * radius * (radius + slant))} وحدة²`, en: `Surface area: ${format(Math.PI * radius * (radius + slant))} units²` },
        };
    },
});

const cube = shape({
    id: 'cube-calculator',
    icon: '□³',
    title: { ar: 'حاسبة المكعب', en: 'Cube Calculator' },
    description: { ar: 'احسب حجم ومساحة سطح وقطر المكعب.', en: 'Calculate cube volume, surface area and space diagonal.' },
    note: { ar: 'جميع أحرف المكعب متساوية.', en: 'All cube edges are equal.' },
    inputs: [field('side', 'طول الحرف', 'Side length', 6)],
    calculate: ({ side }) => ({
        value: side ** 3,
        unit: { ar: 'وحدة³', en: 'units³' },
        label: { ar: 'حجم المكعب', en: 'Cube volume' },
        details: { ar: `المساحة: ${format(6 * side ** 2)} وحدة² — القطر: ${format(side * Math.sqrt(3))}`, en: `Area: ${format(6 * side ** 2)} units² — diagonal: ${format(side * Math.sqrt(3))}` },
    }),
});

const trapezoid = shape({
    id: 'trapezoid-area-calculator',
    icon: '⏢',
    title: { ar: 'حاسبة مساحة شبه المنحرف', en: 'Trapezoid Area Calculator' },
    description: { ar: 'احسب مساحة شبه المنحرف من القاعدتين والارتفاع.', en: 'Calculate trapezoid area from two bases and height.' },
    note: { ar: 'المساحة = نصف مجموع القاعدتين × الارتفاع.', en: 'Area = half the sum of the bases × height.' },
    inputs: [field('baseA', 'القاعدة الأولى', 'First base', 8), field('baseB', 'القاعدة الثانية', 'Second base', 12), field('height', 'الارتفاع', 'Height', 5)],
    calculate: ({ baseA, baseB, height }) => ({
        value: (baseA + baseB) * height / 2,
        unit: { ar: 'وحدة²', en: 'units²' },
        label: { ar: 'مساحة شبه المنحرف', en: 'Trapezoid area' },
    }),
});

const parallelogram = shape({
    id: 'parallelogram-area-calculator',
    icon: '▱',
    title: { ar: 'حاسبة مساحة متوازي الأضلاع', en: 'Parallelogram Area Calculator' },
    description: { ar: 'احسب مساحة متوازي الأضلاع من القاعدة والارتفاع العمودي.', en: 'Calculate parallelogram area from base and perpendicular height.' },
    note: { ar: 'الارتفاع هو المسافة العمودية بين القاعدتين.', en: 'Height is the perpendicular distance between the bases.' },
    inputs: [field('base', 'طول القاعدة', 'Base length', 10), field('height', 'الارتفاع العمودي', 'Perpendicular height', 6)],
    calculate: ({ base, height }) => ({
        value: base * height,
        unit: { ar: 'وحدة²', en: 'units²' },
        label: { ar: 'مساحة متوازي الأضلاع', en: 'Parallelogram area' },
    }),
});

const ellipse = shape({
    id: 'ellipse-area-calculator',
    icon: '⬭',
    title: { ar: 'حاسبة مساحة القطع الناقص', en: 'Ellipse Area Calculator' },
    description: { ar: 'احسب مساحة القطع الناقص من نصفي المحورين.', en: 'Calculate ellipse area from its semi-major and semi-minor axes.' },
    note: { ar: 'المساحة = π × نصف المحور الأكبر × نصف المحور الأصغر.', en: 'Area = π × semi-major axis × semi-minor axis.' },
    inputs: [field('semiMajor', 'نصف المحور الأكبر', 'Semi-major axis', 8), field('semiMinor', 'نصف المحور الأصغر', 'Semi-minor axis', 5)],
    calculate: ({ semiMajor, semiMinor }) => ({
        value: Math.PI * semiMajor * semiMinor,
        unit: { ar: 'وحدة²', en: 'units²' },
        label: { ar: 'مساحة القطع الناقص', en: 'Ellipse area' },
    }),
});

const rhombus = shape({
    id: 'rhombus-area-calculator',
    icon: '◇',
    title: { ar: 'حاسبة مساحة المعين', en: 'Rhombus Area Calculator' },
    description: { ar: 'احسب مساحة المعين من طولي القطرين.', en: 'Calculate rhombus area from its two diagonals.' },
    note: { ar: 'المساحة = حاصل ضرب القطرين ÷ 2.', en: 'Area = diagonal product ÷ 2.' },
    inputs: [field('diagonalA', 'القطر الأول', 'First diagonal', 10), field('diagonalB', 'القطر الثاني', 'Second diagonal', 6)],
    calculate: ({ diagonalA, diagonalB }) => ({
        value: diagonalA * diagonalB / 2,
        unit: { ar: 'وحدة²', en: 'units²' },
        label: { ar: 'مساحة المعين', en: 'Rhombus area' },
    }),
});

const regularPolygon = shape({
    id: 'regular-polygon-calculator',
    icon: '⬡',
    title: { ar: 'حاسبة المضلع المنتظم', en: 'Regular Polygon Calculator' },
    description: { ar: 'احسب مساحة ومحيط مضلع منتظم من عدد الأضلاع وطول الضلع.', en: 'Calculate regular polygon area and perimeter from side count and length.' },
    note: { ar: 'يجب أن يكون عدد الأضلاع عددًا صحيحًا لا يقل عن ثلاثة.', en: 'The side count must be an integer of at least three.' },
    inputs: [field('sides', 'عدد الأضلاع', 'Number of sides', 6, { min: 3, max: 10000, step: 1, unit: { ar: 'ضلع', en: 'sides' } }), field('length', 'طول الضلع', 'Side length', 5)],
    calculate: ({ sides, length }) => {
        if (!Number.isInteger(sides)) {
            return { value: Number.NaN, unit: { ar: '', en: '' }, label: { ar: '', en: '' } };
        }
        return {
            value: sides * length ** 2 / (4 * Math.tan(Math.PI / sides)),
            unit: { ar: 'وحدة²', en: 'units²' },
            label: { ar: 'مساحة المضلع', en: 'Polygon area' },
            details: { ar: `المحيط: ${format(sides * length)} وحدة`, en: `Perimeter: ${format(sides * length)} units` },
        };
    },
});

const pointDistance = shape({
    id: 'distance-between-points-calculator',
    icon: '↗',
    title: { ar: 'حاسبة المسافة بين نقطتين', en: 'Distance Between Two Points Calculator' },
    description: { ar: 'احسب المسافة المستقيمة بين نقطتين في المستوى.', en: 'Calculate straight-line distance between two points on a plane.' },
    note: { ar: 'تستخدم الأداة نظرية فيثاغورس.', en: 'Uses the Pythagorean distance formula.' },
    inputs: [
        field('x1', 'الإحداثي x₁', 'x₁ coordinate', 1, { min: -1_000_000_000, unit: { ar: '', en: '' } }),
        field('y1', 'الإحداثي y₁', 'y₁ coordinate', 2, { min: -1_000_000_000, unit: { ar: '', en: '' } }),
        field('x2', 'الإحداثي x₂', 'x₂ coordinate', 4, { min: -1_000_000_000, unit: { ar: '', en: '' } }),
        field('y2', 'الإحداثي y₂', 'y₂ coordinate', 6, { min: -1_000_000_000, unit: { ar: '', en: '' } }),
    ],
    calculate: ({ x1, y1, x2, y2 }) => ({
        value: Math.hypot(x2 - x1, y2 - y1),
        unit: { ar: 'وحدة', en: 'units' },
        label: { ar: 'المسافة بين النقطتين', en: 'Distance between points' },
    }),
});

const advancedGeometryDefinitions = Object.freeze({
    [sphere.id]: sphere,
    [cylinder.id]: cylinder,
    [cone.id]: cone,
    [cube.id]: cube,
    [trapezoid.id]: trapezoid,
    [parallelogram.id]: parallelogram,
    [ellipse.id]: ellipse,
    [rhombus.id]: rhombus,
    [regularPolygon.id]: regularPolygon,
    [pointDistance.id]: pointDistance,
});

export { advancedGeometryDefinitions };

// END OF FILE
