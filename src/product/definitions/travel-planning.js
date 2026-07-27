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

const tripBudget = tool({
    id: 'travel-budget-calculator',
    icon: 'TRIP',
    title: { ar: 'حاسبة ميزانية السفر', en: 'Travel Budget Calculator' },
    description: { ar: 'اجمع تكاليف النقل والإقامة والطعام والأنشطة مع احتياطي للطوارئ.', en: 'Total transport, lodging, food and activities with a contingency reserve.' },
    note: { ar: 'أدخل التكاليف المتوقعة لكامل الرحلة.', en: 'Enter expected costs for the whole trip.' },
    inputs: [
        field('transport', 'النقل والطيران', 'Transport and flights', 800),
        field('lodging', 'الإقامة', 'Lodging', 700),
        field('food', 'الطعام', 'Food', 350),
        field('activities', 'الأنشطة والمصروفات الأخرى', 'Activities and other costs', 250),
        field('reserve', 'احتياطي الطوارئ', 'Contingency reserve', 10, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const subtotal = values.transport + values.lodging + values.food + values.activities;
        return output(amount(subtotal * (1 + values.reserve / 100)), localized(language, 'إجمالي ميزانية الرحلة', 'Total travel budget'), `${localized(language, 'قبل الاحتياطي', 'Before reserve')}: ${amount(subtotal)}`);
    },
});

const dailyBudget = tool({
    id: 'daily-travel-budget-calculator',
    icon: 'DAY',
    title: { ar: 'حاسبة الميزانية اليومية للسفر', en: 'Daily Travel Budget Calculator' },
    description: { ar: 'وزّع ميزانية المصروفات على أيام الرحلة والمسافرين.', en: 'Distribute a spending budget across trip days and travelers.' },
    note: { ar: 'يمكن فصل تكاليف الطيران والإقامة الثابتة عن هذه الميزانية.', en: 'Fixed flight and lodging costs can be kept outside this budget.' },
    inputs: [
        field('budget', 'ميزانية المصروفات', 'Spending budget', 1200),
        field('days', 'عدد الأيام', 'Trip days', 8, { min: 1, step: 1 }),
        field('travelers', 'عدد المسافرين', 'Travelers', 2, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => output(amount(values.budget / values.days / values.travelers), localized(language, 'الميزانية اليومية لكل مسافر', 'Daily budget per traveler')),
});

const hotelCost = tool({
    id: 'hotel-stay-cost-calculator',
    icon: 'HOTEL',
    title: { ar: 'حاسبة تكلفة الإقامة بالفندق', en: 'Hotel Stay Cost Calculator' },
    description: { ar: 'احسب تكلفة الغرف لعدد من الليالي مع الضرائب والرسوم.', en: 'Calculate room cost for multiple nights with taxes and fees.' },
    note: { ar: 'أضف رسوم المنتجع أو التنظيف في خانة الرسوم الثابتة.', en: 'Include resort or cleaning charges in fixed fees.' },
    inputs: [
        field('nightlyRate', 'سعر الغرفة لليلة', 'Nightly room rate', 120),
        field('nights', 'عدد الليالي', 'Nights', 5, { min: 1, step: 1 }),
        field('rooms', 'عدد الغرف', 'Rooms', 1, { min: 1, step: 1 }),
        field('tax', 'الضرائب', 'Taxes', 12, { max: 100, unit: { ar: '%', en: '%' } }),
        field('fees', 'رسوم ثابتة', 'Fixed fees', 50),
    ],
    calculate(values, language) {
        const roomSubtotal = values.nightlyRate * values.nights * values.rooms;
        return output(amount(roomSubtotal * (1 + values.tax / 100) + values.fees), localized(language, 'إجمالي تكلفة الفندق', 'Total hotel cost'), `${amount(roomSubtotal)} ${localized(language, 'قبل الضرائب والرسوم', 'before taxes and fees')}`);
    },
});

const flightTime = tool({
    id: 'flight-time-estimator',
    icon: 'FLY',
    title: { ar: 'حاسبة مدة الرحلة الجوية', en: 'Flight Time Estimator' },
    description: { ar: 'قدّر مدة الرحلة من المسافة والسرعة الجوية والوقت الإضافي.', en: 'Estimate flight duration from distance, cruise speed and added time.' },
    note: { ar: 'الرياح والمسار والمراقبة الجوية قد تغير الزمن الفعلي.', en: 'Winds, routing and air traffic control affect actual duration.' },
    inputs: [
        field('distance', 'مسافة الرحلة', 'Flight distance', 3000, { unit: { ar: 'كم', en: 'km' } }),
        field('speed', 'سرعة الطيران المتوسطة', 'Average air speed', 850, { min: 0.01, unit: { ar: 'كم/س', en: 'km/h' } }),
        field('overhead', 'وقت إضافي للصعود والهبوط', 'Climb and descent allowance', 30, { unit: { ar: 'دقيقة', en: 'min' } }),
    ],
    calculate: (values, language) => output(amount(values.distance / values.speed + values.overhead / 60, 'hours'), localized(language, 'مدة الرحلة التقديرية', 'Estimated flight time')),
});

const arrivalTime = tool({
    id: 'flight-arrival-time-calculator',
    icon: 'ETA',
    title: { ar: 'حاسبة وقت الوصول بالطائرة', en: 'Flight Arrival Time Calculator' },
    description: { ar: 'احسب وقت الوصول المحلي من وقت المغادرة ومدة الرحلة وفارق التوقيت.', en: 'Calculate local arrival time from departure, duration and time-zone difference.' },
    note: { ar: 'استخدم الساعات العشرية؛ مثل 14.5 للساعة 14:30.', en: 'Use decimal hours, such as 14.5 for 14:30.' },
    inputs: [
        field('departure', 'وقت المغادرة المحلي', 'Local departure time', 14.5, { min: 0, max: 23.99, unit: { ar: 'ساعة', en: 'hour' } }),
        field('duration', 'مدة الرحلة', 'Flight duration', 6.75, { unit: { ar: 'ساعة', en: 'hours' } }),
        field('zoneDifference', 'توقيت الوجهة ناقص توقيت المغادرة', 'Destination minus origin offset', 2, { min: -24, max: 24, unit: { ar: 'ساعة', en: 'hours' } }),
    ],
    calculate(values, language) {
        const totalMinutes = Math.round((values.departure + values.duration + values.zoneDifference) * 60);
        const dayOffset = Math.floor(totalMinutes / 1440);
        const normalized = ((totalMinutes % 1440) + 1440) % 1440;
        const time = `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
        return output(time, localized(language, 'وقت الوصول المحلي', 'Local arrival time'), `${dayOffset >= 0 ? '+' : ''}${dayOffset} ${localized(language, 'يوم', 'day')}`);
    },
});

const luggageFee = tool({
    id: 'airline-luggage-fee-calculator',
    icon: 'BAG',
    title: { ar: 'حاسبة رسوم الوزن الزائد للأمتعة', en: 'Airline Luggage Fee Calculator' },
    description: { ar: 'قدّر رسوم الأمتعة الزائدة من الوزن المسموح وسعر كل كيلو إضافي.', en: 'Estimate excess baggage fees from allowance and price per extra kilogram.' },
    note: { ar: 'قد تطبق شركة الطيران شرائح أو حدًا أقصى مختلفًا.', en: 'Airlines may use bands, per-bag limits or different rules.' },
    inputs: [
        field('weight', 'وزن الأمتعة', 'Baggage weight', 28, { unit: { ar: 'كجم', en: 'kg' } }),
        field('allowance', 'الوزن المسموح', 'Included allowance', 23, { unit: { ar: 'كجم', en: 'kg' } }),
        field('rate', 'رسم الكيلو الزائد', 'Fee per extra kilogram', 15),
    ],
    calculate(values, language) {
        const excess = Math.max(0, values.weight - values.allowance);
        return output(amount(excess * values.rate), localized(language, 'رسوم الوزن الزائد التقديرية', 'Estimated excess baggage fee'), `${amount(excess, 'kg')} ${localized(language, 'زائد', 'over allowance')}`);
    },
});

const exchangeFee = tool({
    id: 'travel-currency-exchange-fee-calculator',
    icon: 'FX',
    title: { ar: 'حاسبة تكلفة تحويل العملة للسفر', en: 'Travel Currency Exchange Fee Calculator' },
    description: { ar: 'احسب المبلغ المستلم بعد سعر الصرف وهامش التحويل والرسوم.', en: 'Calculate currency received after exchange rate, markup and fixed fees.' },
    note: { ar: 'استخدم سعر السوق الأساسي ثم أدخل هامش مقدم الخدمة.', en: 'Use the base market rate and enter the provider markup separately.' },
    inputs: [
        field('amount', 'المبلغ المراد تحويله', 'Amount to exchange', 1000),
        field('rate', 'سعر الصرف', 'Exchange rate', 0.92, { min: 0.000001 }),
        field('markup', 'هامش التحويل', 'Exchange markup', 3, { max: 100, unit: { ar: '%', en: '%' } }),
        field('fixedFee', 'رسوم ثابتة بالعملة الأصلية', 'Fixed fee in source currency', 5),
    ],
    calculate(values, language) {
        const sourceAfterFee = Math.max(0, values.amount - values.fixedFee);
        const received = sourceAfterFee * values.rate * (1 - values.markup / 100);
        return output(amount(received), localized(language, 'المبلغ المستلم تقديريًا', 'Estimated amount received'), `${amount(values.amount * values.rate - received)} ${localized(language, 'فرق ورسوم', 'exchange cost')}`);
    },
});

const vacationSavings = tool({
    id: 'vacation-savings-calculator',
    icon: 'SAVE',
    title: { ar: 'حاسبة ادخار ميزانية السفر', en: 'Vacation Savings Calculator' },
    description: { ar: 'احسب المبلغ الشهري المطلوب للوصول إلى ميزانية رحلة.', en: 'Calculate monthly savings needed to reach a vacation budget.' },
    note: { ar: 'لا يشمل الحساب عائد الادخار أو تغير أسعار الرحلة.', en: 'The calculation excludes savings returns and travel price changes.' },
    inputs: [
        field('target', 'ميزانية الرحلة المستهدفة', 'Target trip budget', 5000),
        field('saved', 'المبلغ المدخر حاليًا', 'Already saved', 1000),
        field('months', 'الأشهر المتبقية', 'Months remaining', 10, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => output(amount(Math.max(0, values.target - values.saved) / values.months), localized(language, 'الادخار الشهري المطلوب', 'Required monthly savings')),
});

const pointsValue = tool({
    id: 'travel-points-value-calculator',
    icon: 'PTS',
    title: { ar: 'حاسبة قيمة نقاط السفر', en: 'Travel Points Value Calculator' },
    description: { ar: 'احسب قيمة كل نقطة سفر من السعر النقدي والضرائب والنقاط المطلوبة.', en: 'Calculate value per travel point from cash price, taxes and points required.' },
    note: { ar: 'اطرح الضرائب أو الرسوم التي تدفع نقدًا من قيمة الحجز.', en: 'Subtract taxes or fees still paid in cash from the booking value.' },
    inputs: [
        field('cashPrice', 'السعر النقدي للحجز', 'Cash booking price', 750),
        field('cashFees', 'ضرائب ورسوم تُدفع نقدًا', 'Taxes and fees paid in cash', 50),
        field('points', 'عدد النقاط المطلوبة', 'Points required', 50000, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => output(amount(Math.max(0, values.cashPrice - values.cashFees) / values.points * 100, 'cents/point'), localized(language, 'قيمة النقطة', 'Point value')),
});

const groupSplit = tool({
    id: 'group-trip-cost-split-calculator',
    icon: 'GROUP',
    title: { ar: 'حاسبة تقسيم تكلفة الرحلة الجماعية', en: 'Group Trip Cost Split Calculator' },
    description: { ar: 'قسّم المصروفات المشتركة بالتساوي مع إضافة تكلفة فردية لكل شخص.', en: 'Split shared expenses equally and add individual cost per traveler.' },
    note: { ar: 'النتيجة تعرض المبلغ المطلوب من كل شخص.', en: 'The result shows the amount owed by each person.' },
    inputs: [
        field('sharedCost', 'إجمالي المصروفات المشتركة', 'Total shared expenses', 2400),
        field('travelers', 'عدد المسافرين', 'Travelers', 6, { min: 1, step: 1 }),
        field('individualCost', 'تكلفة فردية لكل شخص', 'Individual cost per person', 150),
    ],
    calculate: (values, language) => output(amount(values.sharedCost / values.travelers + values.individualCost), localized(language, 'نصيب كل مسافر', 'Cost per traveler')),
});

const travelPlanningDefinitions = Object.freeze({
    [tripBudget.id]: tripBudget,
    [dailyBudget.id]: dailyBudget,
    [hotelCost.id]: hotelCost,
    [flightTime.id]: flightTime,
    [arrivalTime.id]: arrivalTime,
    [luggageFee.id]: luggageFee,
    [exchangeFee.id]: exchangeFee,
    [vacationSavings.id]: vacationSavings,
    [pointsValue.id]: pointsValue,
    [groupSplit.id]: groupSplit,
});

export { travelPlanningDefinitions };

// END OF FILE
