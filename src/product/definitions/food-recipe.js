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
        max: options.max ?? 1e12,
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

const bakersPercentage = tool({
    id: 'bakers-percentage-calculator',
    icon: 'B%',
    title: { ar: 'حاسبة النسبة المئوية للخباز', en: "Baker's Percentage Calculator" },
    description: { ar: 'احسب نسبة أي مكوّن إلى وزن الدقيق.', en: 'Calculate any ingredient as a percentage of flour weight.' },
    note: { ar: 'يُعامل وزن الدقيق دائمًا على أنه 100%.', en: 'Flour weight is always treated as 100%.' },
    inputs: [
        field('flour', 'وزن الدقيق', 'Flour weight', 1000, { min: 0.001, unit: { ar: 'جم', en: 'g' } }),
        field('ingredient', 'وزن المكوّن', 'Ingredient weight', 20, { unit: { ar: 'جم', en: 'g' } }),
    ],
    calculate: (values, language) => output(`${amount(values.ingredient / values.flour * 100)}%`, localized(language, 'نسبة المكوّن', 'Ingredient percentage')),
});

const hydration = tool({
    id: 'dough-hydration-calculator',
    icon: 'H₂O',
    title: { ar: 'حاسبة ترطيب العجين', en: 'Dough Hydration Calculator' },
    description: { ar: 'احسب نسبة الماء إلى الدقيق في العجين.', en: 'Calculate water as a percentage of flour in dough.' },
    note: { ar: 'يشمل الماء كل السوائل المراد احتسابها في الترطيب.', en: 'Include all liquids counted toward hydration.' },
    inputs: [
        field('flour', 'وزن الدقيق', 'Flour weight', 1000, { min: 0.001, unit: { ar: 'جم', en: 'g' } }),
        field('water', 'وزن الماء', 'Water weight', 650, { unit: { ar: 'جم', en: 'g' } }),
    ],
    calculate: (values, language) => output(`${amount(values.water / values.flour * 100)}%`, localized(language, 'نسبة الترطيب', 'Hydration')),
});

const doughBalls = tool({
    id: 'pizza-dough-ball-calculator',
    icon: 'PIZZA',
    title: { ar: 'حاسبة كرات عجين البيتزا', en: 'Pizza Dough Ball Calculator' },
    description: { ar: 'احسب وزن العجين الإجمالي وكميات الدقيق والماء للبيتزا.', en: 'Calculate total dough, flour and water for pizza portions.' },
    note: { ar: 'يفترض أن الملح والخميرة نسب مئوية من الدقيق.', en: 'Salt and yeast are percentages of flour.' },
    inputs: [
        field('balls', 'عدد الكرات', 'Dough balls', 6, { min: 1, step: 1 }),
        field('ballWeight', 'وزن الكرة', 'Ball weight', 250, { min: 1, unit: { ar: 'جم', en: 'g' } }),
        field('hydration', 'نسبة الترطيب', 'Hydration', 65, { max: 150, unit: { ar: '%', en: '%' } }),
        field('salt', 'نسبة الملح', 'Salt percentage', 2.5, { max: 20, unit: { ar: '%', en: '%' } }),
        field('yeast', 'نسبة الخميرة', 'Yeast percentage', 0.2, { max: 20, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const total = values.balls * values.ballWeight;
        const flour = total / (1 + (values.hydration + values.salt + values.yeast) / 100);
        return output(
            amount(total, 'g'),
            localized(language, 'وزن العجين الإجمالي', 'Total dough weight'),
            `${localized(language, 'الدقيق', 'Flour')}: ${amount(flour, 'g')}\n${localized(language, 'الماء', 'Water')}: ${amount(flour * values.hydration / 100, 'g')}`,
        );
    },
});

const brine = tool({
    id: 'brine-salt-calculator',
    icon: 'NaCl',
    title: { ar: 'حاسبة ملح المحلول الملحي', en: 'Brine Salt Calculator' },
    description: { ar: 'احسب كمية الملح المطلوبة لمحلول ملحي بنسبة محددة.', en: 'Calculate salt required for a target brine percentage.' },
    note: { ar: 'تستخدم الأداة نسبة الملح إلى وزن الماء.', en: 'Uses salt as a percentage of water weight.' },
    inputs: [
        field('water', 'وزن الماء', 'Water weight', 2000, { min: 0.001, unit: { ar: 'جم', en: 'g' } }),
        field('percentage', 'نسبة الملح', 'Salt percentage', 3, { max: 30, unit: { ar: '%', en: '%' } }),
    ],
    calculate: (values, language) => output(amount(values.water * values.percentage / 100, 'g'), localized(language, 'وزن الملح', 'Salt weight')),
});

const servingCost = tool({
    id: 'food-cost-per-serving-calculator',
    icon: 'COST',
    title: { ar: 'حاسبة تكلفة الحصة الغذائية', en: 'Food Cost per Serving Calculator' },
    description: { ar: 'احسب تكلفة الوصفة لكل حصة بعد إضافة الهالك.', en: 'Calculate recipe cost per serving including waste.' },
    note: { ar: 'أدخل التكلفة الإجمالية لجميع المكونات.', en: 'Enter the combined cost of all ingredients.' },
    inputs: [
        field('ingredientCost', 'تكلفة المكونات', 'Ingredient cost', 120),
        field('servings', 'عدد الحصص', 'Servings', 8, { min: 1, step: 1 }),
        field('waste', 'نسبة الهالك', 'Waste allowance', 5, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate: (values, language) => output(amount(values.ingredientCost * (1 + values.waste / 100) / values.servings), localized(language, 'تكلفة الحصة', 'Cost per serving')),
});

const menuPrice = tool({
    id: 'menu-price-food-cost-calculator',
    icon: 'MENU',
    title: { ar: 'حاسبة سعر القائمة من تكلفة الطعام', en: 'Menu Price from Food Cost Calculator' },
    description: { ar: 'احسب سعر البيع المستهدف من تكلفة الحصة ونسبة تكلفة الطعام.', en: 'Calculate target menu price from serving cost and food-cost percentage.' },
    note: { ar: 'نسبة تكلفة الطعام هي التكلفة مقسومة على سعر البيع.', en: 'Food-cost percentage is cost divided by selling price.' },
    inputs: [
        field('cost', 'تكلفة الحصة', 'Serving cost', 30),
        field('targetPercent', 'نسبة تكلفة الطعام المستهدفة', 'Target food-cost percentage', 30, { min: 0.001, max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate: (values, language) => output(amount(values.cost / (values.targetPercent / 100)), localized(language, 'سعر البيع المستهدف', 'Target menu price')),
});

const calories = tool({
    id: 'recipe-calories-per-serving-calculator',
    icon: 'KCAL',
    title: { ar: 'حاسبة سعرات الوصفة لكل حصة', en: 'Recipe Calories per Serving Calculator' },
    description: { ar: 'قسّم إجمالي سعرات الوصفة على عدد الحصص.', en: 'Divide total recipe calories by the number of servings.' },
    note: { ar: 'دقة النتيجة تعتمد على بيانات المكونات المستخدمة.', en: 'Accuracy depends on the ingredient nutrition data used.' },
    inputs: [
        field('totalCalories', 'إجمالي سعرات الوصفة', 'Total recipe calories', 2400, { unit: { ar: 'سعرة', en: 'kcal' } }),
        field('servings', 'عدد الحصص', 'Servings', 8, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => output(amount(values.totalCalories / values.servings, 'kcal'), localized(language, 'السعرات لكل حصة', 'Calories per serving')),
});

const caffeine = tool({
    id: 'caffeine-intake-calculator',
    icon: 'CAF',
    title: { ar: 'حاسبة كمية الكافيين', en: 'Caffeine Intake Calculator' },
    description: { ar: 'احسب إجمالي الكافيين من عدد الحصص ومحتوى كل حصة.', en: 'Calculate total caffeine from servings and caffeine per serving.' },
    note: { ar: 'هذه أداة جمع معلومات وليست نصيحة طبية.', en: 'This is an informational total, not medical advice.' },
    inputs: [
        field('servings', 'عدد الحصص', 'Servings', 3, { step: 1 }),
        field('perServing', 'الكافيين في الحصة', 'Caffeine per serving', 95, { unit: { ar: 'مجم', en: 'mg' } }),
    ],
    calculate: (values, language) => output(amount(values.servings * values.perServing, 'mg'), localized(language, 'إجمالي الكافيين', 'Total caffeine')),
});

const coffeeRatio = tool({
    id: 'coffee-brew-ratio-calculator',
    icon: '1:16',
    title: { ar: 'حاسبة نسبة تحضير القهوة', en: 'Coffee Brew Ratio Calculator' },
    description: { ar: 'احسب كمية الماء المطلوبة من وزن القهوة ونسبة التحضير.', en: 'Calculate water required from coffee weight and brew ratio.' },
    note: { ar: 'النسبة 1:16 تعني 16 جرام ماء لكل جرام قهوة.', en: 'A 1:16 ratio means 16 grams of water per gram of coffee.' },
    inputs: [
        field('coffee', 'وزن القهوة', 'Coffee weight', 30, { min: 0.001, unit: { ar: 'جم', en: 'g' } }),
        field('ratio', 'جزء الماء', 'Water ratio', 16, { min: 0.1 }),
    ],
    calculate: (values, language) => output(amount(values.coffee * values.ratio, 'g'), localized(language, 'وزن الماء', 'Water weight'), `1:${amount(values.ratio)}`),
});

const cookingYield = tool({
    id: 'cooking-yield-percentage-calculator',
    icon: 'YIELD',
    title: { ar: 'حاسبة نسبة ناتج الطهي', en: 'Cooking Yield Percentage Calculator' },
    description: { ar: 'احسب نسبة الوزن النهائي بعد التنظيف أو الطهي إلى الوزن الأصلي.', en: 'Calculate final usable weight as a percentage of original weight.' },
    note: { ar: 'يفيد في حساب فاقد الطهي والتكلفة الفعلية.', en: 'Useful for cooking loss and true-cost calculations.' },
    inputs: [
        field('original', 'الوزن الأصلي', 'Original weight', 1000, { min: 0.001, unit: { ar: 'جم', en: 'g' } }),
        field('final', 'الوزن النهائي', 'Final weight', 750, { unit: { ar: 'جم', en: 'g' } }),
    ],
    calculate(values, language) {
        return output(`${amount(values.final / values.original * 100)}%`, localized(language, 'نسبة الناتج', 'Yield percentage'), `${localized(language, 'الفاقد', 'Loss')}: ${amount((values.original - values.final) / values.original * 100)}%`);
    },
});

const foodRecipeDefinitions = Object.freeze({
    [bakersPercentage.id]: bakersPercentage,
    [hydration.id]: hydration,
    [doughBalls.id]: doughBalls,
    [brine.id]: brine,
    [servingCost.id]: servingCost,
    [menuPrice.id]: menuPrice,
    [calories.id]: calories,
    [caffeine.id]: caffeine,
    [coffeeRatio.id]: coffeeRatio,
    [cookingYield.id]: cookingYield,
});

export { foodRecipeDefinitions };

// END OF FILE
