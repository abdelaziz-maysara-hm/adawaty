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
        min: options.min ?? -1e12,
        max: options.max ?? 1e12,
        step: options.step ?? 0.01,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function tool(config) {
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

function round(value, digits = 6) {
    const result = Number(value.toFixed(digits));
    return Object.is(result, -0) ? 0 : result;
}

function positive(id, ar, en, placeholder) {
    return field(id, ar, en, placeholder, { min: 0.000001 });
}

function validTriangle(a, b, c) {
    return a + b > c && a + c > b && b + c > a;
}

function requireTriangle(values, language) {
    if (!validTriangle(values.a, values.b, values.c)) {
        throw new Error(localized(
            language,
            'الأطوال المدخلة لا تكوّن مثلثًا صالحًا.',
            'The entered lengths do not form a valid triangle.',
        ));
    }
}

const lineEquation = tool({
    id: 'line-equation-two-points-calculator',
    icon: 'y=mx+b',
    title: { ar: 'معادلة المستقيم من نقطتين', en: 'Line Equation from Two Points' },
    description: { ar: 'أوجد الميل ومعادلة المستقيم المار بنقطتين.', en: 'Find the slope and equation of the line through two points.' },
    note: { ar: 'يعرض المستقيم الرأسي في الصورة x = ثابت.', en: 'Vertical lines are displayed as x = constant.' },
    inputs: [
        field('x1', 'الإحداثي x₁', 'x₁ coordinate', 1),
        field('y1', 'الإحداثي y₁', 'y₁ coordinate', 2),
        field('x2', 'الإحداثي x₂', 'x₂ coordinate', 4),
        field('y2', 'الإحداثي y₂', 'y₂ coordinate', 8),
    ],
    calculate(values, language) {
        if (values.x1 === values.x2) {
            return output(`x = ${round(values.x1)}`, localized(language, 'معادلة المستقيم الرأسي', 'Vertical line equation'));
        }
        const slope = (values.y2 - values.y1) / (values.x2 - values.x1);
        const intercept = values.y1 - slope * values.x1;
        const sign = intercept < 0 ? '−' : '+';
        return output(
            `y = ${round(slope)}x ${sign} ${round(Math.abs(intercept))}`,
            localized(language, 'معادلة المستقيم', 'Line equation'),
            `m = ${round(slope)}`,
        );
    },
});

const pointLineDistance = tool({
    id: 'point-to-line-distance-calculator',
    icon: 'd⊥',
    title: { ar: 'المسافة من نقطة إلى مستقيم', en: 'Point to Line Distance Calculator' },
    description: { ar: 'احسب أقصر مسافة من نقطة إلى المستقيم Ax + By + C = 0.', en: 'Calculate the shortest distance from a point to Ax + By + C = 0.' },
    note: { ar: 'يجب ألا يكون المعاملان A وB صفرًا معًا.', en: 'Coefficients A and B cannot both be zero.' },
    inputs: [
        field('x', 'الإحداثي x', 'x coordinate', 2),
        field('y', 'الإحداثي y', 'y coordinate', 3),
        field('a', 'المعامل A', 'Coefficient A', 3),
        field('b', 'المعامل B', 'Coefficient B', 4),
        field('c', 'الثابت C', 'Constant C', -10),
    ],
    calculate(values, language) {
        const denominator = Math.hypot(values.a, values.b);
        if (denominator === 0) {
            throw new Error(localized(language, 'المستقيم غير صالح.', 'The line is invalid.'));
        }
        return output(
            round(Math.abs(values.a * values.x + values.b * values.y + values.c) / denominator),
            localized(language, 'المسافة العمودية', 'Perpendicular distance'),
        );
    },
});

const distance3d = tool({
    id: 'three-dimensional-distance-calculator',
    icon: '3D',
    title: { ar: 'المسافة بين نقطتين في الفراغ', en: '3D Distance Calculator' },
    description: { ar: 'احسب المسافة الإقليدية بين نقطتين ثلاثيتي الأبعاد.', en: 'Calculate the Euclidean distance between two 3D points.' },
    note: { ar: 'تستخدم الأداة الفروق بين إحداثيات x وy وz.', en: 'Uses the differences between x, y and z coordinates.' },
    inputs: [
        field('x1', 'الإحداثي x₁', 'x₁ coordinate', 1),
        field('y1', 'الإحداثي y₁', 'y₁ coordinate', 2),
        field('z1', 'الإحداثي z₁', 'z₁ coordinate', 3),
        field('x2', 'الإحداثي x₂', 'x₂ coordinate', 4),
        field('y2', 'الإحداثي y₂', 'y₂ coordinate', 6),
        field('z2', 'الإحداثي z₂', 'z₂ coordinate', 6),
    ],
    calculate(values, language) {
        return output(
            round(Math.hypot(values.x2 - values.x1, values.y2 - values.y1, values.z2 - values.z1)),
            localized(language, 'المسافة ثلاثية الأبعاد', '3D distance'),
        );
    },
});

const centroid = tool({
    id: 'triangle-centroid-calculator',
    icon: '△G',
    title: { ar: 'حاسبة مركز ثقل المثلث', en: 'Triangle Centroid Calculator' },
    description: { ar: 'أوجد إحداثيات مركز ثقل مثلث من رؤوسه الثلاثة.', en: 'Find a triangle centroid from its three vertices.' },
    note: { ar: 'مركز الثقل هو متوسط إحداثيات الرؤوس.', en: 'The centroid is the average of the vertex coordinates.' },
    inputs: [
        field('x1', 'x₁', 'x₁', 0), field('y1', 'y₁', 'y₁', 0),
        field('x2', 'x₂', 'x₂', 6), field('y2', 'y₂', 'y₂', 0),
        field('x3', 'x₃', 'x₃', 0), field('y3', 'y₃', 'y₃', 6),
    ],
    calculate(values, language) {
        const x = (values.x1 + values.x2 + values.x3) / 3;
        const y = (values.y1 + values.y2 + values.y3) / 3;
        return output(`(${round(x)}, ${round(y)})`, localized(language, 'مركز الثقل G', 'Centroid G'));
    },
});

const coordinateArea = tool({
    id: 'triangle-area-coordinates-calculator',
    icon: '△A',
    title: { ar: 'مساحة المثلث بالإحداثيات', en: 'Triangle Area from Coordinates' },
    description: { ar: 'احسب مساحة مثلث من إحداثيات رؤوسه.', en: 'Calculate triangle area from the coordinates of its vertices.' },
    note: { ar: 'إذا كانت النقاط على استقامة واحدة تكون المساحة صفرًا.', en: 'Collinear points produce an area of zero.' },
    inputs: [
        field('x1', 'x₁', 'x₁', 0), field('y1', 'y₁', 'y₁', 0),
        field('x2', 'x₂', 'x₂', 4), field('y2', 'y₂', 'y₂', 0),
        field('x3', 'x₃', 'x₃', 0), field('y3', 'y₃', 'y₃', 3),
    ],
    calculate(values, language) {
        const determinant = values.x1 * (values.y2 - values.y3)
            + values.x2 * (values.y3 - values.y1)
            + values.x3 * (values.y1 - values.y2);
        return output(round(Math.abs(determinant) / 2), localized(language, 'مساحة المثلث', 'Triangle area'));
    },
});

const heron = tool({
    id: 'herons-formula-calculator',
    icon: '√s',
    title: { ar: 'حاسبة صيغة هيرون', en: "Heron's Formula Calculator" },
    description: { ar: 'احسب مساحة المثلث من أطوال أضلاعه الثلاثة.', en: 'Calculate triangle area from its three side lengths.' },
    note: { ar: 'تتحقق الأداة من شرط تكوين المثلث.', en: 'The triangle inequality is validated.' },
    inputs: [
        positive('a', 'الضلع a', 'Side a', 3),
        positive('b', 'الضلع b', 'Side b', 4),
        positive('c', 'الضلع c', 'Side c', 5),
    ],
    calculate(values, language) {
        requireTriangle(values, language);
        const s = (values.a + values.b + values.c) / 2;
        return output(
            round(Math.sqrt(s * (s - values.a) * (s - values.b) * (s - values.c))),
            localized(language, 'مساحة المثلث', 'Triangle area'),
            `s = ${round(s)}`,
        );
    },
});

const inradius = tool({
    id: 'triangle-inradius-calculator',
    icon: 'r',
    title: { ar: 'حاسبة نصف قطر الدائرة الداخلية', en: 'Triangle Inradius Calculator' },
    description: { ar: 'احسب نصف قطر الدائرة الداخلية للمثلث من أضلاعه.', en: 'Calculate a triangle inradius from its side lengths.' },
    note: { ar: 'نصف القطر الداخلي يساوي المساحة مقسومة على نصف المحيط.', en: 'The inradius equals area divided by semiperimeter.' },
    inputs: [
        positive('a', 'الضلع a', 'Side a', 3),
        positive('b', 'الضلع b', 'Side b', 4),
        positive('c', 'الضلع c', 'Side c', 5),
    ],
    calculate(values, language) {
        requireTriangle(values, language);
        const s = (values.a + values.b + values.c) / 2;
        const area = Math.sqrt(s * (s - values.a) * (s - values.b) * (s - values.c));
        return output(round(area / s), localized(language, 'نصف القطر الداخلي', 'Inradius'));
    },
});

const circumradius = tool({
    id: 'triangle-circumradius-calculator',
    icon: 'R',
    title: { ar: 'حاسبة نصف قطر الدائرة المحيطة', en: 'Triangle Circumradius Calculator' },
    description: { ar: 'احسب نصف قطر الدائرة المحيطة بالمثلث من أضلاعه.', en: 'Calculate a triangle circumradius from its side lengths.' },
    note: { ar: 'تستخدم الأداة العلاقة R = abc ÷ 4A.', en: 'Uses R = abc ÷ 4A.' },
    inputs: [
        positive('a', 'الضلع a', 'Side a', 3),
        positive('b', 'الضلع b', 'Side b', 4),
        positive('c', 'الضلع c', 'Side c', 5),
    ],
    calculate(values, language) {
        requireTriangle(values, language);
        const s = (values.a + values.b + values.c) / 2;
        const area = Math.sqrt(s * (s - values.a) * (s - values.b) * (s - values.c));
        return output(round(values.a * values.b * values.c / (4 * area)), localized(language, 'نصف القطر المحيط', 'Circumradius'));
    },
});

const interiorAngles = tool({
    id: 'polygon-interior-angle-sum-calculator',
    icon: 'Σ∠',
    title: { ar: 'مجموع زوايا المضلع الداخلية', en: 'Polygon Interior Angle Sum Calculator' },
    description: { ar: 'احسب مجموع الزوايا الداخلية وزاوية المضلع المنتظم.', en: 'Calculate the interior angle sum and regular polygon angle.' },
    note: { ar: 'يجب أن يكون عدد الأضلاع عددًا صحيحًا لا يقل عن ثلاثة.', en: 'The side count must be an integer of at least three.' },
    inputs: [field('sides', 'عدد الأضلاع', 'Number of sides', 6, { min: 3, max: 1e6, step: 1 })],
    calculate(values, language) {
        if (!Number.isInteger(values.sides)) throw new Error(localized(language, 'أدخل عددًا صحيحًا من الأضلاع.', 'Enter an integer number of sides.'));
        const sum = (values.sides - 2) * 180;
        return output(
            `${sum}°`,
            localized(language, 'مجموع الزوايا الداخلية', 'Interior angle sum'),
            `${localized(language, 'الزاوية المنتظمة', 'Regular interior angle')}: ${round(sum / values.sides)}°`,
        );
    },
});

const diagonals = tool({
    id: 'polygon-diagonal-count-calculator',
    icon: '╲╱',
    title: { ar: 'حاسبة عدد أقطار المضلع', en: 'Polygon Diagonal Count Calculator' },
    description: { ar: 'احسب عدد الأقطار التي يمكن رسمها داخل مضلع.', en: 'Calculate how many diagonals a polygon contains.' },
    note: { ar: 'يستخدم الحساب n(n−3)÷2.', en: 'Uses n(n−3)÷2.' },
    inputs: [field('sides', 'عدد الأضلاع', 'Number of sides', 8, { min: 3, max: 1e7, step: 1 })],
    calculate(values, language) {
        if (!Number.isInteger(values.sides)) throw new Error(localized(language, 'أدخل عددًا صحيحًا من الأضلاع.', 'Enter an integer number of sides.'));
        return output(values.sides * (values.sides - 3) / 2, localized(language, 'عدد الأقطار', 'Number of diagonals'));
    },
});

const coordinateGeometryDefinitions = Object.freeze({
    [lineEquation.id]: lineEquation,
    [pointLineDistance.id]: pointLineDistance,
    [distance3d.id]: distance3d,
    [centroid.id]: centroid,
    [coordinateArea.id]: coordinateArea,
    [heron.id]: heron,
    [inradius.id]: inradius,
    [circumradius.id]: circumradius,
    [interiorAngles.id]: interiorAngles,
    [diagonals.id]: diagonals,
});

export { coordinateGeometryDefinitions };

// END OF FILE
