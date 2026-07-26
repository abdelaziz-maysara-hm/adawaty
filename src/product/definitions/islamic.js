const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 3,
});

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
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

function formatted(value, unit = '') {
    return `${formatter.format(value)} ${unit}`.trim();
}

function zakatResult(base, nisab, language, details = '') {
    const due = base >= nisab ? base * 0.025 : 0;
    return output(
        formatted(due),
        due > 0
            ? localized(language, 'الزكاة التقديرية', 'Estimated zakat')
            : localized(language, 'دون النصاب المُدخل', 'Below the entered nisab'),
        details || `${formatted(base)} zakatable base · 2.5% rate`,
    );
}

const zakatNote = Object.freeze({
    ar: 'تقدير تعليمي؛ أدخل النصاب الحالي واستشر جهة شرعية موثوقة لحالتك.',
    en: 'Educational estimate; enter the current nisab and consult a trusted qualified authority for your circumstances.',
});

const cashZakat = Object.freeze({
    id: 'cash-zakat-calculator',
    category: 'islamic',
    icon: '2.5%',
    title: Object.freeze({ ar: 'حاسبة زكاة المال', en: 'Cash Zakat Calculator' }),
    description: Object.freeze({ ar: 'قدّر زكاة النقد والمدخرات بعد خصم الديون القصيرة المستحقة.', en: 'Estimate zakat on cash and savings after eligible short-term debts.' }),
    note: zakatNote,
    inputs: Object.freeze([
        numberInput('cash', { ar: 'النقد والمدخرات', en: 'Cash and savings' }, 100000, { min: 0 }),
        numberInput('receivables', { ar: 'ديون مرجوة السداد لك', en: 'Collectible receivables' }, 0, { min: 0 }),
        numberInput('debts', { ar: 'ديون قصيرة مستحقة عليك', en: 'Eligible short-term debts' }, 0, { min: 0 }),
        numberInput('nisab', { ar: 'قيمة النصاب الحالية', en: 'Current nisab value' }, 85000, { min: 0.01 }),
    ]),
    calculate(values, language) {
        const base = Math.max(0, values.cash + values.receivables - values.debts);
        return zakatResult(base, values.nisab, language);
    },
});

const goldZakat = Object.freeze({
    id: 'gold-zakat-calculator',
    category: 'islamic',
    icon: 'Au',
    title: Object.freeze({ ar: 'حاسبة زكاة الذهب', en: 'Gold Zakat Calculator' }),
    description: Object.freeze({ ar: 'قدّر زكاة الذهب حسب الوزن والعيار وسعر جرام الذهب الخالص.', en: 'Estimate gold zakat from weight, karat and pure-gold price per gram.' }),
    note: Object.freeze({
        ar: 'يستخدم نصاب 85 جرامًا من الذهب الخالص ونسبة 2.5%؛ أحكام الحلي المستعمل تختلف.',
        en: 'Uses an 85 g pure-gold nisab and 2.5% rate; rulings on personal jewellery may differ.',
    }),
    inputs: Object.freeze([
        numberInput('weight', { ar: 'وزن الذهب', en: 'Gold weight' }, 100, { min: 0, unit: { ar: 'جرام', en: 'g' } }),
        selectInput('karat', { ar: 'العيار', en: 'Karat' }, [
            { value: '24', label: { ar: '24 قيراط', en: '24 karat' } },
            { value: '22', label: { ar: '22 قيراط', en: '22 karat' } },
            { value: '21', label: { ar: '21 قيراط', en: '21 karat' } },
            { value: '18', label: { ar: '18 قيراط', en: '18 karat' } },
            { value: '14', label: { ar: '14 قيراط', en: '14 karat' } },
        ]),
        numberInput('pureGoldPrice', { ar: 'سعر جرام عيار 24', en: '24k price per gram' }, 4000, { min: 0 }),
    ]),
    calculate(values, language) {
        const pureWeight = values.weight * Number(values.karat) / 24;
        const value = pureWeight * values.pureGoldPrice;
        const due = pureWeight >= 85 ? value * 0.025 : 0;
        return output(
            formatted(due),
            due > 0
                ? localized(language, 'الزكاة التقديرية', 'Estimated zakat')
                : localized(language, 'أقل من 85 جرامًا خالصًا', 'Below 85 g pure-gold nisab'),
            `${formatted(pureWeight, 'g')} pure gold`,
        );
    },
});

const silverZakat = Object.freeze({
    id: 'silver-zakat-calculator',
    category: 'islamic',
    icon: 'Ag',
    title: Object.freeze({ ar: 'حاسبة زكاة الفضة', en: 'Silver Zakat Calculator' }),
    description: Object.freeze({ ar: 'قدّر زكاة الفضة من الوزن وسعر الجرام الحالي.', en: 'Estimate silver zakat from weight and current price per gram.' }),
    note: Object.freeze({
        ar: 'يستخدم نصاب 595 جرامًا من الفضة ونسبة 2.5%.',
        en: 'Uses a 595 g silver nisab and 2.5% rate.',
    }),
    inputs: Object.freeze([
        numberInput('weight', { ar: 'وزن الفضة الخالصة', en: 'Pure silver weight' }, 700, { min: 0, unit: { ar: 'جرام', en: 'g' } }),
        numberInput('price', { ar: 'سعر جرام الفضة', en: 'Silver price per gram' }, 50, { min: 0 }),
    ]),
    calculate(values, language) {
        const value = values.weight * values.price;
        const due = values.weight >= 595 ? value * 0.025 : 0;
        return output(
            formatted(due),
            due > 0
                ? localized(language, 'الزكاة التقديرية', 'Estimated zakat')
                : localized(language, 'أقل من نصاب الفضة', 'Below silver nisab'),
            `${formatted(values.weight, 'g')} silver`,
        );
    },
});

const businessZakat = Object.freeze({
    id: 'business-zakat-calculator',
    category: 'islamic',
    icon: '﷼',
    title: Object.freeze({ ar: 'حاسبة زكاة التجارة', en: 'Business Zakat Calculator' }),
    description: Object.freeze({ ar: 'قدّر زكاة الأصول التجارية المتداولة بعد الخصوم القصيرة المستحقة.', en: 'Estimate zakat on current business assets after eligible short-term liabilities.' }),
    note: zakatNote,
    inputs: Object.freeze([
        numberInput('cash', { ar: 'النقد والأرصدة', en: 'Cash and balances' }, 50000, { min: 0 }),
        numberInput('inventory', { ar: 'قيمة مخزون التجارة', en: 'Trade inventory value' }, 100000, { min: 0 }),
        numberInput('receivables', { ar: 'ديون مرجوة التحصيل', en: 'Collectible receivables' }, 20000, { min: 0 }),
        numberInput('liabilities', { ar: 'التزامات قصيرة مستحقة', en: 'Eligible current liabilities' }, 30000, { min: 0 }),
        numberInput('nisab', { ar: 'قيمة النصاب الحالية', en: 'Current nisab value' }, 85000, { min: 0.01 }),
    ]),
    calculate(values, language) {
        const base = Math.max(
            0,
            values.cash + values.inventory + values.receivables
                - values.liabilities,
        );
        return zakatResult(base, values.nisab, language);
    },
});

const quranReadingPlan = Object.freeze({
    id: 'quran-reading-plan-calculator',
    category: 'islamic',
    icon: '📖',
    title: Object.freeze({ ar: 'حاسبة خطة قراءة القرآن', en: 'Quran Reading Plan Calculator' }),
    description: Object.freeze({ ar: 'قسّم عدد صفحات محدد على أيام الخطة وجلسات القراءة اليومية.', en: 'Divide a chosen page count across plan days and daily reading sessions.' }),
    note: Object.freeze({ ar: 'الصفحات تختلف بين طبعات المصحف؛ عدّل العدد حسب نسختك.', en: 'Page counts vary by edition; adjust the total for your copy.' }),
    inputs: Object.freeze([
        numberInput('pages', { ar: 'إجمالي الصفحات', en: 'Total pages' }, 604, { min: 1, step: 1 }),
        numberInput('days', { ar: 'عدد الأيام', en: 'Plan days' }, 30, { min: 1, step: 1 }),
        numberInput('sessions', { ar: 'جلسات القراءة يوميًا', en: 'Sessions per day' }, 5, { min: 1, max: 20, step: 1 }),
    ]),
    calculate(values, language) {
        const daily = values.pages / values.days;
        const session = daily / values.sessions;
        return output(
            formatted(daily, localized(language, 'صفحة/يوم', 'pages/day')),
            localized(language, 'الورد اليومي', 'Daily reading'),
            `${formatted(session, localized(language, 'صفحة/جلسة', 'pages/session'))}`,
        );
    },
});

const quranKhatmaPlan = Object.freeze({
    id: 'quran-khatma-plan-calculator',
    category: 'islamic',
    icon: '✓',
    title: Object.freeze({ ar: 'حاسبة خطة ختم القرآن', en: 'Quran Khatma Plan Calculator' }),
    description: Object.freeze({ ar: 'احسب ورد كل جلسة لإتمام ختمة أو أكثر خلال مدة محددة.', en: 'Calculate reading per session for one or more completions in a set period.' }),
    note: Object.freeze({ ar: 'تستخدم 604 صفحات كإعداد افتراضي قابل للتغيير في أداة خطة القراءة.', en: 'Uses the common 604-page edition as the planning baseline.' }),
    inputs: Object.freeze([
        numberInput('completions', { ar: 'عدد الختمات', en: 'Number of completions' }, 1, { min: 1, max: 100, step: 1 }),
        numberInput('days', { ar: 'عدد الأيام', en: 'Number of days' }, 30, { min: 1, step: 1 }),
        numberInput('sessions', { ar: 'الجلسات يوميًا', en: 'Sessions per day' }, 5, { min: 1, max: 20, step: 1 }),
    ]),
    calculate(values, language) {
        const pagesPerSession = 604 * values.completions
            / values.days / values.sessions;
        return output(
            formatted(pagesPerSession, localized(language, 'صفحة/جلسة', 'pages/session')),
            localized(language, 'ورد كل جلسة', 'Reading per session'),
            `${formatted(pagesPerSession * values.sessions, localized(language, 'صفحة/يوم', 'pages/day'))}`,
        );
    },
});

const memorizationPlan = Object.freeze({
    id: 'quran-memorization-plan-calculator',
    category: 'islamic',
    icon: 'حفظ',
    title: Object.freeze({ ar: 'حاسبة خطة حفظ القرآن', en: 'Quran Memorization Plan Calculator' }),
    description: Object.freeze({ ar: 'قدّر مدة حفظ عدد من الصفحات حسب الورد الأسبوعي.', en: 'Estimate memorization duration from target pages and weekly pace.' }),
    note: Object.freeze({ ar: 'أضف وقتًا مستقلًا للمراجعة والتثبيت مع معلم مؤهل.', en: 'Allow separate revision time and work with a qualified teacher.' }),
    inputs: Object.freeze([
        numberInput('pages', { ar: 'الصفحات المستهدفة', en: 'Target pages' }, 604, { min: 1, step: 1 }),
        numberInput('daysPerWeek', { ar: 'أيام الحفظ أسبوعيًا', en: 'Memorization days per week' }, 5, { min: 1, max: 7, step: 1 }),
        numberInput('pagesPerDay', { ar: 'صفحات الحفظ في اليوم', en: 'Pages per study day' }, 1, { min: 0.01 }),
    ]),
    calculate(values, language) {
        const weeks = values.pages / (values.daysPerWeek * values.pagesPerDay);
        return output(
            formatted(weeks, localized(language, 'أسبوع', 'weeks')),
            localized(language, 'المدة التقديرية', 'Estimated duration'),
            `${formatted(weeks * 7, localized(language, 'يومًا تقويميًا', 'calendar days'))}`,
        );
    },
});

const tasbeehProgress = Object.freeze({
    id: 'tasbeeh-progress-calculator',
    category: 'islamic',
    icon: '33',
    title: Object.freeze({ ar: 'حاسبة متابعة التسبيح', en: 'Tasbeeh Progress Calculator' }),
    description: Object.freeze({ ar: 'تابع تقدمك نحو عدد شخصي مستهدف من الأذكار.', en: 'Track progress toward a personal remembrance count.' }),
    note: Object.freeze({ ar: 'النية والحضور أهم من مجرد العدد.', en: 'Intention and mindfulness matter more than the number alone.' }),
    inputs: Object.freeze([
        numberInput('target', { ar: 'العدد المستهدف', en: 'Target count' }, 100, { min: 1, step: 1 }),
        numberInput('completed', { ar: 'العدد المكتمل', en: 'Completed count' }, 33, { min: 0, step: 1 }),
    ]),
    calculate(values, language) {
        const remaining = Math.max(0, values.target - values.completed);
        const progress = Math.min(100, values.completed / values.target * 100);
        return output(
            `${remaining}`,
            localized(language, 'المتبقي', 'Remaining'),
            `${formatter.format(progress)}% complete`,
        );
    },
});

const fastingTracker = Object.freeze({
    id: 'fasting-days-tracker',
    category: 'islamic',
    icon: '☾',
    title: Object.freeze({ ar: 'متابع أيام الصيام', en: 'Fasting Days Tracker' }),
    description: Object.freeze({ ar: 'احسب الأيام المتبقية من هدف صيام شخصي أو أيام قضاء.', en: 'Calculate days remaining from a personal fasting or make-up target.' }),
    note: Object.freeze({ ar: 'الأداة للتنظيم فقط ولا تحدد الحكم الشرعي أو وجوب القضاء.', en: 'This organizer does not determine religious rulings or obligations.' }),
    inputs: Object.freeze([
        numberInput('target', { ar: 'إجمالي الأيام', en: 'Total target days' }, 30, { min: 1, step: 1 }),
        numberInput('completed', { ar: 'الأيام المكتملة', en: 'Completed days' }, 12, { min: 0, step: 1 }),
    ]),
    calculate(values, language) {
        const remaining = Math.max(0, values.target - values.completed);
        return output(
            formatted(remaining, localized(language, 'يوم', 'days')),
            localized(language, 'الأيام المتبقية', 'Days remaining'),
            `${Math.min(100, values.completed / values.target * 100).toFixed(1)}% complete`,
        );
    },
});

const qiblaDirection = Object.freeze({
    id: 'qibla-direction-calculator',
    category: 'islamic',
    icon: '🕋',
    title: Object.freeze({ ar: 'حاسبة اتجاه القبلة', en: 'Qibla Direction Calculator' }),
    description: Object.freeze({ ar: 'احسب زاوية الاتجاه الأولية من موقعك إلى الكعبة من الشمال الحقيقي.', en: 'Calculate the initial bearing from your coordinates to the Kaaba from true north.' }),
    note: Object.freeze({ ar: 'النتيجة هندسية تقريبية؛ قد تحتاج لتصحيح الانحراف المغناطيسي للبوصلة.', en: 'This is a geometric bearing; a magnetic compass may require declination correction.' }),
    inputs: Object.freeze([
        numberInput('latitude', { ar: 'خط العرض', en: 'Latitude' }, 30.0444, { min: -90, max: 90, unit: { ar: 'درجة', en: 'degrees' } }),
        numberInput('longitude', { ar: 'خط الطول', en: 'Longitude' }, 31.2357, { min: -180, max: 180, unit: { ar: 'درجة', en: 'degrees' } }),
    ]),
    calculate(values, language) {
        const kaabaLatitude = 21.4225 * Math.PI / 180;
        const kaabaLongitude = 39.8262 * Math.PI / 180;
        const latitude = values.latitude * Math.PI / 180;
        const longitude = values.longitude * Math.PI / 180;
        const deltaLongitude = kaabaLongitude - longitude;
        const y = Math.sin(deltaLongitude) * Math.cos(kaabaLatitude);
        const x = (Math.cos(latitude) * Math.sin(kaabaLatitude))
            - (Math.sin(latitude) * Math.cos(kaabaLatitude)
                * Math.cos(deltaLongitude));
        const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
        return output(
            `${formatter.format(bearing)}°`,
            localized(language, 'من الشمال الحقيقي باتجاه عقارب الساعة', 'Clockwise from true north'),
        );
    },
});

const islamicDefinitions = Object.freeze({
    [cashZakat.id]: cashZakat,
    [goldZakat.id]: goldZakat,
    [silverZakat.id]: silverZakat,
    [businessZakat.id]: businessZakat,
    [quranReadingPlan.id]: quranReadingPlan,
    [quranKhatmaPlan.id]: quranKhatmaPlan,
    [memorizationPlan.id]: memorizationPlan,
    [tasbeehProgress.id]: tasbeehProgress,
    [fastingTracker.id]: fastingTracker,
    [qiblaDirection.id]: qiblaDirection,
});

export { islamicDefinitions };

// END OF FILE
