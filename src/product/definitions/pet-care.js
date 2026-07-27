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

const dogAge = tool({
    id: 'dog-age-in-human-years-calculator',
    icon: 'DOG',
    title: { ar: 'حاسبة عمر الكلب بالسنوات البشرية', en: 'Dog Age in Human Years Calculator' },
    description: { ar: 'حوّل عمر الكلب إلى تقدير مكافئ بالسنوات البشرية.', en: 'Convert a dog age to an estimated human-year equivalent.' },
    note: { ar: 'التقدير تقريبي؛ تختلف الشيخوخة حسب الحجم والسلالة والحالة الصحية.', en: 'This is approximate; aging varies by size, breed and health.' },
    inputs: [
        field('age', 'عمر الكلب', 'Dog age', 5, { min: 0, max: 40, unit: { ar: 'سنة', en: 'years' } }),
    ],
    calculate(values, language) {
        const humanYears = values.age <= 1 ? values.age * 15 : values.age <= 2 ? 15 + (values.age - 1) * 9 : 24 + (values.age - 2) * 5;
        return output(amount(humanYears, 'years'), localized(language, 'العمر البشري التقريبي', 'Estimated human age'));
    },
});

const catAge = tool({
    id: 'cat-age-in-human-years-calculator',
    icon: 'CAT',
    title: { ar: 'حاسبة عمر القط بالسنوات البشرية', en: 'Cat Age in Human Years Calculator' },
    description: { ar: 'حوّل عمر القط إلى تقدير مكافئ بالسنوات البشرية.', en: 'Convert a cat age to an estimated human-year equivalent.' },
    note: { ar: 'التقدير عام وقد يختلف بين القطط المنزلية والخارجية.', en: 'This is a general estimate and varies between indoor and outdoor cats.' },
    inputs: [
        field('age', 'عمر القط', 'Cat age', 5, { min: 0, max: 40, unit: { ar: 'سنة', en: 'years' } }),
    ],
    calculate(values, language) {
        const humanYears = values.age <= 1 ? values.age * 15 : values.age <= 2 ? 15 + (values.age - 1) * 9 : 24 + (values.age - 2) * 4;
        return output(amount(humanYears, 'years'), localized(language, 'العمر البشري التقريبي', 'Estimated human age'));
    },
});

function restingEnergy(weight) {
    return 70 * weight ** 0.75;
}

const dogCalories = tool({
    id: 'dog-daily-calorie-calculator',
    icon: 'KCAL',
    title: { ar: 'حاسبة سعرات الكلب اليومية', en: 'Dog Daily Calorie Calculator' },
    description: { ar: 'قدّر احتياج الكلب اليومي من الطاقة حسب الوزن ومعامل النشاط.', en: 'Estimate a dog daily energy need from weight and activity factor.' },
    note: { ar: 'للاسترشاد فقط؛ حدّد الحصة المناسبة مع الطبيب البيطري.', en: 'For guidance only; confirm feeding needs with a veterinarian.' },
    inputs: [
        field('weight', 'وزن الكلب', 'Dog weight', 20, { min: 0.1, unit: { ar: 'كجم', en: 'kg' } }),
        field('factor', 'معامل النشاط والحالة', 'Activity and life-stage factor', 1.6, { min: 0.5, max: 5 }),
    ],
    calculate: (values, language) => output(amount(restingEnergy(values.weight) * values.factor, 'kcal/day'), localized(language, 'الطاقة اليومية التقديرية', 'Estimated daily energy')),
});

const catCalories = tool({
    id: 'cat-daily-calorie-calculator',
    icon: 'KCAL',
    title: { ar: 'حاسبة سعرات القط اليومية', en: 'Cat Daily Calorie Calculator' },
    description: { ar: 'قدّر احتياج القط اليومي من الطاقة حسب الوزن ومعامل الحالة.', en: 'Estimate a cat daily energy need from weight and life-stage factor.' },
    note: { ar: 'للاسترشاد فقط؛ راقب الوزن واستشر الطبيب البيطري.', en: 'For guidance only; monitor weight and consult a veterinarian.' },
    inputs: [
        field('weight', 'وزن القط', 'Cat weight', 4.5, { min: 0.1, unit: { ar: 'كجم', en: 'kg' } }),
        field('factor', 'معامل النشاط والحالة', 'Activity and life-stage factor', 1.2, { min: 0.5, max: 5 }),
    ],
    calculate: (values, language) => output(amount(restingEnergy(values.weight) * values.factor, 'kcal/day'), localized(language, 'الطاقة اليومية التقديرية', 'Estimated daily energy')),
});

const foodPortion = tool({
    id: 'pet-food-portion-calculator',
    icon: 'FOOD',
    title: { ar: 'حاسبة حصة طعام الحيوان الأليف', en: 'Pet Food Portion Calculator' },
    description: { ar: 'حوّل الاحتياج اليومي من السعرات إلى جرامات طعام وعدد جرامات لكل وجبة.', en: 'Convert daily calories into food grams and grams per meal.' },
    note: { ar: 'استخدم كثافة السعرات المكتوبة على عبوة الطعام.', en: 'Use the calorie density printed on the food package.' },
    inputs: [
        field('dailyCalories', 'السعرات اليومية المطلوبة', 'Required daily calories', 600, { unit: { ar: 'سعرة', en: 'kcal' } }),
        field('caloriesPer100g', 'السعرات لكل 100 جرام', 'Calories per 100 grams', 380, { min: 0.1, unit: { ar: 'سعرة', en: 'kcal' } }),
        field('meals', 'عدد الوجبات', 'Meals per day', 2, { min: 1, step: 1 }),
    ],
    calculate(values, language) {
        const dailyGrams = values.dailyCalories / values.caloriesPer100g * 100;
        return output(amount(dailyGrams, 'g/day'), localized(language, 'الحصة اليومية', 'Daily portion'), `${amount(dailyGrams / values.meals, 'g')} ${localized(language, 'لكل وجبة', 'per meal')}`);
    },
});

const waterIntake = tool({
    id: 'pet-water-intake-calculator',
    icon: 'H2O',
    title: { ar: 'حاسبة احتياج الحيوان الأليف من الماء', en: 'Pet Water Intake Calculator' },
    description: { ar: 'قدّر كمية الماء اليومية من الوزن ومعدل الماء لكل كيلوجرام.', en: 'Estimate daily water from body weight and milliliters per kilogram.' },
    note: { ar: 'الحرارة والنشاط والغذاء والحالة الصحية تغير الاحتياج؛ استشر الطبيب عند زيادة أو نقص الشرب.', en: 'Heat, activity, diet and health alter needs; consult a vet about abnormal drinking.' },
    inputs: [
        field('weight', 'وزن الحيوان', 'Pet weight', 10, { min: 0.1, unit: { ar: 'كجم', en: 'kg' } }),
        field('rate', 'معدل الماء اليومي', 'Daily water rate', 60, { min: 1, unit: { ar: 'مل/كجم', en: 'mL/kg' } }),
    ],
    calculate: (values, language) => output(amount(values.weight * values.rate, 'mL/day'), localized(language, 'الماء اليومي التقديري', 'Estimated daily water')),
});

const weightChange = tool({
    id: 'pet-weight-change-calculator',
    icon: 'WEIGHT',
    title: { ar: 'حاسبة تغير وزن الحيوان الأليف', en: 'Pet Weight Change Calculator' },
    description: { ar: 'احسب مقدار ونسبة تغير وزن الحيوان بين قياسين.', en: 'Calculate the amount and percentage of pet weight change between readings.' },
    note: { ar: 'تغير الوزن غير المقصود يحتاج تقييمًا بيطريًا.', en: 'Unintended weight change warrants veterinary assessment.' },
    inputs: [
        field('previous', 'الوزن السابق', 'Previous weight', 12, { min: 0.1, unit: { ar: 'كجم', en: 'kg' } }),
        field('current', 'الوزن الحالي', 'Current weight', 11.4, { min: 0.1, unit: { ar: 'كجم', en: 'kg' } }),
    ],
    calculate(values, language) {
        const change = values.current - values.previous;
        return output(amount(change / values.previous * 100, '%'), localized(language, 'نسبة تغير الوزن', 'Weight change'), amount(change, 'kg'));
    },
});

const foodCost = tool({
    id: 'pet-food-monthly-cost-calculator',
    icon: 'COST',
    title: { ar: 'حاسبة تكلفة طعام الحيوان الشهرية', en: 'Pet Food Monthly Cost Calculator' },
    description: { ar: 'احسب تكلفة الطعام الشهرية من الحصة اليومية وسعر العبوة.', en: 'Calculate monthly pet-food cost from daily portion and package price.' },
    note: { ar: 'يستخدم الحساب شهرًا من 30 يومًا.', en: 'The estimate uses a 30-day month.' },
    inputs: [
        field('dailyGrams', 'الحصة اليومية', 'Daily portion', 300, { unit: { ar: 'جم', en: 'g' } }),
        field('packageWeight', 'وزن العبوة', 'Package weight', 10, { min: 0.001, unit: { ar: 'كجم', en: 'kg' } }),
        field('packagePrice', 'سعر العبوة', 'Package price', 45),
    ],
    calculate(values, language) {
        const monthlyKg = values.dailyGrams * 30 / 1000;
        return output(amount(monthlyKg / values.packageWeight * values.packagePrice), localized(language, 'التكلفة الشهرية التقديرية', 'Estimated monthly cost'), amount(monthlyKg, 'kg/month'));
    },
});

const aquariumVolume = tool({
    id: 'aquarium-volume-calculator',
    icon: 'TANK',
    title: { ar: 'حاسبة حجم حوض الأسماك', en: 'Aquarium Volume Calculator' },
    description: { ar: 'احسب الحجم النظري لحوض مستطيل من أبعاده الداخلية.', en: 'Calculate theoretical rectangular aquarium volume from internal dimensions.' },
    note: { ar: 'الحجم الفعلي أقل بسبب الديكور والتربة وعدم ملء الحوض للحافة.', en: 'Actual water volume is lower due to substrate, decor and fill level.' },
    inputs: [
        field('length', 'الطول الداخلي', 'Internal length', 100, { unit: { ar: 'سم', en: 'cm' } }),
        field('width', 'العرض الداخلي', 'Internal width', 40, { unit: { ar: 'سم', en: 'cm' } }),
        field('height', 'ارتفاع الماء', 'Water height', 45, { unit: { ar: 'سم', en: 'cm' } }),
    ],
    calculate: (values, language) => output(amount(values.length * values.width * values.height / 1000, 'L'), localized(language, 'حجم الحوض النظري', 'Theoretical tank volume')),
});

const waterChange = tool({
    id: 'aquarium-water-change-calculator',
    icon: 'AQUA',
    title: { ar: 'حاسبة تغيير مياه حوض الأسماك', en: 'Aquarium Water Change Calculator' },
    description: { ar: 'احسب كمية الماء المطلوب سحبها وتعويضها حسب نسبة التغيير.', en: 'Calculate water to remove and replace for a target change percentage.' },
    note: { ar: 'طابق درجة الحرارة وعالج ماء الصنبور حسب احتياجات الحوض.', en: 'Match temperature and condition tap water for the aquarium needs.' },
    inputs: [
        field('volume', 'حجم الماء الفعلي', 'Actual water volume', 160, { unit: { ar: 'لتر', en: 'L' } }),
        field('percent', 'نسبة تغيير الماء', 'Water change percentage', 25, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate: (values, language) => output(amount(values.volume * values.percent / 100, 'L'), localized(language, 'كمية الماء المطلوب تغييرها', 'Water to replace')),
});

const petCareDefinitions = Object.freeze({
    [dogAge.id]: dogAge,
    [catAge.id]: catAge,
    [dogCalories.id]: dogCalories,
    [catCalories.id]: catCalories,
    [foodPortion.id]: foodPortion,
    [waterIntake.id]: waterIntake,
    [weightChange.id]: weightChange,
    [foodCost.id]: foodCost,
    [aquariumVolume.id]: aquariumVolume,
    [waterChange.id]: waterChange,
});

export { petCareDefinitions };

// END OF FILE
