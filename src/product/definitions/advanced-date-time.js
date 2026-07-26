const millisecondsPerDay = 86_400_000;

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function input(id, type, label, sample = '', options = {}) {
    return Object.freeze({
        id,
        type,
        min: options.min,
        max: options.max,
        step: options.step,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: sample,
    });
}

function dateFrom(value) {
    return new Date(`${value}T00:00:00Z`);
}

function validDate(value, language) {
    const date = dateFrom(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(localized(language, 'أدخل تاريخًا صالحًا.', 'Enter a valid date.'));
    }
    return date;
}

function assertOrder(start, end, language) {
    if (end < start) {
        throw new Error(localized(language, 'يجب ألا يسبق تاريخ النهاية تاريخ البداية.', 'The end date cannot precede the start date.'));
    }
}

const ageAtDate = Object.freeze({
    id: 'age-at-date-calculator',
    category: 'date-time',
    icon: '🎂',
    title: Object.freeze({ ar: 'حاسبة العمر في تاريخ محدد', en: 'Age at a Specific Date Calculator' }),
    description: Object.freeze({ ar: 'احسب العمر بالسنوات والأشهر والأيام في أي تاريخ تختاره.', en: 'Calculate age in years, months and days on any selected date.' }),
    note: Object.freeze({ ar: 'يمكن استخدام تاريخ اليوم أو تاريخ سابق أو مستقبلي.', en: 'The reference can be today or another past or future date.' }),
    inputs: Object.freeze([
        input('birthDate', 'date', { ar: 'تاريخ الميلاد', en: 'Birth date' }),
        input('referenceDate', 'date', { ar: 'التاريخ المرجعي', en: 'Reference date' }),
    ]),
    calculate(values, language) {
        const birth = validDate(values.birthDate, language);
        const reference = validDate(values.referenceDate, language);
        assertOrder(birth, reference, language);
        let years = reference.getUTCFullYear() - birth.getUTCFullYear();
        let months = reference.getUTCMonth() - birth.getUTCMonth();
        let days = reference.getUTCDate() - birth.getUTCDate();
        if (days < 0) {
            months -= 1;
            days += new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 0)).getUTCDate();
        }
        if (months < 0) {
            years -= 1;
            months += 12;
        }
        return output(`${years} ${localized(language, 'سنة', 'years')}`, localized(language, `${months} شهر و${days} يوم`, `${months} months and ${days} days`));
    },
});

const inclusiveDateRange = Object.freeze({
    id: 'inclusive-date-range-calculator',
    category: 'date-time',
    icon: '↔+',
    title: Object.freeze({ ar: 'حاسبة الأيام الشاملة بين تاريخين', en: 'Inclusive Date Range Calculator' }),
    description: Object.freeze({ ar: 'احسب عدد الأيام بين تاريخين مع احتساب يومي البداية والنهاية.', en: 'Count days between two dates including both start and end dates.' }),
    note: Object.freeze({ ar: 'مفيد للحجوزات والجداول والفترات التي تشمل اليومين.', en: 'Useful for bookings and schedules that include both boundary dates.' }),
    inputs: Object.freeze([
        input('startDate', 'date', { ar: 'تاريخ البداية', en: 'Start date' }),
        input('endDate', 'date', { ar: 'تاريخ النهاية', en: 'End date' }),
    ]),
    calculate(values, language) {
        const start = validDate(values.startDate, language);
        const end = validDate(values.endDate, language);
        assertOrder(start, end, language);
        const days = Math.round((end - start) / millisecondsPerDay) + 1;
        return output(days, localized(language, 'يوم شامل', 'Inclusive days'));
    },
});

const monthsBetween = Object.freeze({
    id: 'months-between-dates-calculator',
    category: 'date-time',
    icon: 'M↔',
    title: Object.freeze({ ar: 'حاسبة الأشهر بين تاريخين', en: 'Months Between Dates Calculator' }),
    description: Object.freeze({ ar: 'احسب عدد الأشهر الكاملة بين تاريخي بداية ونهاية.', en: 'Calculate complete calendar months between start and end dates.' }),
    note: Object.freeze({ ar: 'لا يُحسب الشهر الأخير إذا لم يكتمل يومه الموافق.', en: 'The final month is excluded when its matching day has not been reached.' }),
    inputs: Object.freeze([
        input('startDate', 'date', { ar: 'تاريخ البداية', en: 'Start date' }),
        input('endDate', 'date', { ar: 'تاريخ النهاية', en: 'End date' }),
    ]),
    calculate(values, language) {
        const start = validDate(values.startDate, language);
        const end = validDate(values.endDate, language);
        assertOrder(start, end, language);
        let months = (end.getUTCFullYear() - start.getUTCFullYear()) * 12
            + end.getUTCMonth() - start.getUTCMonth();
        if (end.getUTCDate() < start.getUTCDate()) {
            months -= 1;
        }
        return output(months, localized(language, 'شهر كامل', 'Complete months'), localized(language, `ما يعادل ${Math.floor(months / 12)} سنة و${months % 12} شهر`, `${Math.floor(months / 12)} years and ${months % 12} months`));
    },
});

const daysInMonth = Object.freeze({
    id: 'days-in-month-calculator',
    category: 'date-time',
    icon: '31',
    title: Object.freeze({ ar: 'حاسبة عدد أيام الشهر', en: 'Days in Month Calculator' }),
    description: Object.freeze({ ar: 'اعرف عدد أيام الشهر المحدد مع مراعاة السنوات الكبيسة.', en: 'Find the number of days in a selected month, including leap years.' }),
    note: Object.freeze({ ar: 'يكفي اختيار أي يوم داخل الشهر المطلوب.', en: 'Select any date within the desired month.' }),
    inputs: Object.freeze([input('date', 'date', { ar: 'تاريخ داخل الشهر', en: 'Date within month' })]),
    calculate(values, language) {
        const date = validDate(values.date, language);
        const days = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
        return output(days, localized(language, 'عدد أيام الشهر', 'Days in month'), date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }));
    },
});

const quarterCalculator = Object.freeze({
    id: 'calendar-quarter-calculator',
    category: 'date-time',
    icon: 'Q',
    title: Object.freeze({ ar: 'حاسبة ربع السنة', en: 'Calendar Quarter Calculator' }),
    description: Object.freeze({ ar: 'حدد ربع السنة وبدايته ونهايته لأي تاريخ.', en: 'Identify the calendar quarter and its start and end dates.' }),
    note: Object.freeze({ ar: 'تستخدم الأداة أرباع السنة الميلادية القياسية.', en: 'Uses standard Gregorian calendar quarters.' }),
    inputs: Object.freeze([input('date', 'date', { ar: 'التاريخ', en: 'Date' })]),
    calculate(values, language) {
        const date = validDate(values.date, language);
        const quarter = Math.floor(date.getUTCMonth() / 3) + 1;
        const startMonth = (quarter - 1) * 3;
        const start = new Date(Date.UTC(date.getUTCFullYear(), startMonth, 1));
        const end = new Date(Date.UTC(date.getUTCFullYear(), startMonth + 3, 0));
        return output(`Q${quarter}`, localized(language, `الربع ${quarter}`, `Quarter ${quarter}`), `${start.toISOString().slice(0, 10)} → ${end.toISOString().slice(0, 10)}`);
    },
});

const timeAddition = Object.freeze({
    id: 'time-addition-calculator',
    category: 'date-time',
    icon: '🕒+',
    title: Object.freeze({ ar: 'حاسبة إضافة وقت', en: 'Time Addition Calculator' }),
    description: Object.freeze({ ar: 'أضف ساعات ودقائق إلى وقت يومي واعرف مقدار الانتقال لليوم التالي.', en: 'Add hours and minutes to a clock time and track day rollover.' }),
    note: Object.freeze({ ar: 'تعرض النتيجة بنظام 24 ساعة.', en: 'The result uses a 24-hour clock.' }),
    inputs: Object.freeze([
        input('time', 'time', { ar: 'وقت البداية', en: 'Start time' }),
        input('hours', 'number', { ar: 'الساعات المضافة', en: 'Hours to add' }, '2', { min: 0, max: 10000, step: 1, unit: { ar: 'ساعة', en: 'hours' } }),
        input('minutes', 'number', { ar: 'الدقائق المضافة', en: 'Minutes to add' }, '45', { min: 0, max: 100000, step: 1, unit: { ar: 'دقيقة', en: 'minutes' } }),
    ]),
    calculate(values, language) {
        const [hour, minute] = values.time.split(':').map(Number);
        if (!Number.isInteger(hour) || !Number.isInteger(minute)) {
            throw new Error(localized(language, 'أدخل وقتًا صالحًا.', 'Enter a valid time.'));
        }
        const total = hour * 60 + minute + values.hours * 60 + values.minutes;
        const days = Math.floor(total / 1440);
        const clock = ((total % 1440) + 1440) % 1440;
        const rendered = `${String(Math.floor(clock / 60)).padStart(2, '0')}:${String(clock % 60).padStart(2, '0')}`;
        return output(rendered, localized(language, 'الوقت الناتج', 'Resulting time'), localized(language, `بعد ${days} يوم إضافي`, `${days} additional days`));
    },
});

const decimalHours = Object.freeze({
    id: 'decimal-hours-to-time-calculator',
    category: 'date-time',
    icon: '1.5h',
    title: Object.freeze({ ar: 'تحويل الساعات العشرية إلى وقت', en: 'Decimal Hours to Time Calculator' }),
    description: Object.freeze({ ar: 'حوّل الساعات العشرية إلى ساعات ودقائق وثوانٍ.', en: 'Convert decimal hours into hours, minutes and seconds.' }),
    note: Object.freeze({ ar: 'مفيد لسجلات العمل والفواتير الزمنية.', en: 'Useful for timesheets and time-based billing.' }),
    inputs: Object.freeze([input('decimalHours', 'number', { ar: 'الساعات العشرية', en: 'Decimal hours' }, '7.75', { min: 0, max: 100000, step: 0.0001, unit: { ar: 'ساعة', en: 'hours' } })]),
    calculate(values, language) {
        const totalSeconds = Math.round(values.decimalHours * 3600);
        const hour = Math.floor(totalSeconds / 3600);
        const minute = Math.floor((totalSeconds % 3600) / 60);
        const second = totalSeconds % 60;
        return output(`${hour}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`, localized(language, 'ساعات:دقائق:ثوانٍ', 'Hours:minutes:seconds'));
    },
});

const weekendDays = Object.freeze({
    id: 'weekend-days-between-dates-calculator',
    category: 'date-time',
    icon: 'WE',
    title: Object.freeze({ ar: 'حاسبة أيام عطلة نهاية الأسبوع', en: 'Weekend Days Between Dates Calculator' }),
    description: Object.freeze({ ar: 'احسب أيام السبت والأحد ضمن فترة تاريخية شاملة.', en: 'Count Saturdays and Sundays in an inclusive date range.' }),
    note: Object.freeze({ ar: 'تستخدم الأداة السبت والأحد كعطلة افتراضية.', en: 'Saturday and Sunday are treated as weekend days.' }),
    inputs: Object.freeze([
        input('startDate', 'date', { ar: 'تاريخ البداية', en: 'Start date' }),
        input('endDate', 'date', { ar: 'تاريخ النهاية', en: 'End date' }),
    ]),
    calculate(values, language) {
        const start = validDate(values.startDate, language);
        const end = validDate(values.endDate, language);
        assertOrder(start, end, language);
        let count = 0;
        for (let time = start.getTime(); time <= end.getTime(); time += millisecondsPerDay) {
            const day = new Date(time).getUTCDay();
            count += day === 0 || day === 6 ? 1 : 0;
        }
        return output(count, localized(language, 'أيام عطلة نهاية الأسبوع', 'Weekend days'));
    },
});

const anniversaryCalculator = Object.freeze({
    id: 'anniversary-calculator',
    category: 'date-time',
    icon: '🎉',
    title: Object.freeze({ ar: 'حاسبة الذكرى السنوية', en: 'Anniversary Calculator' }),
    description: Object.freeze({ ar: 'احسب عدد السنوات المكتملة بين تاريخ حدث وتاريخ مرجعي.', en: 'Calculate completed years between an event date and a reference date.' }),
    note: Object.freeze({ ar: 'تراعي الأداة ما إذا مرت الذكرى في السنة المرجعية.', en: 'Accounts for whether the anniversary has occurred in the reference year.' }),
    inputs: Object.freeze([
        input('eventDate', 'date', { ar: 'تاريخ الحدث', en: 'Event date' }),
        input('referenceDate', 'date', { ar: 'التاريخ المرجعي', en: 'Reference date' }),
    ]),
    calculate(values, language) {
        const event = validDate(values.eventDate, language);
        const reference = validDate(values.referenceDate, language);
        assertOrder(event, reference, language);
        let years = reference.getUTCFullYear() - event.getUTCFullYear();
        const beforeAnniversary = reference.getUTCMonth() < event.getUTCMonth()
            || (reference.getUTCMonth() === event.getUTCMonth() && reference.getUTCDate() < event.getUTCDate());
        years -= beforeAnniversary ? 1 : 0;
        return output(years, localized(language, 'سنوات مكتملة', 'Completed years'), localized(language, `الذكرى التالية رقم ${years + 1}`, `Next anniversary: ${years + 1}`));
    },
});

const julianDay = Object.freeze({
    id: 'julian-day-number-calculator',
    category: 'date-time',
    icon: 'JDN',
    title: Object.freeze({ ar: 'حاسبة رقم اليوم اليولياني', en: 'Julian Day Number Calculator' }),
    description: Object.freeze({ ar: 'حوّل تاريخًا ميلاديًا إلى رقم يوم يولياني متسلسل.', en: 'Convert a Gregorian calendar date to a sequential Julian day number.' }),
    note: Object.freeze({ ar: 'يُستخدم الرقم في الفلك والحسابات التاريخية.', en: 'The number is used in astronomy and historical date calculations.' }),
    inputs: Object.freeze([input('date', 'date', { ar: 'التاريخ الميلادي', en: 'Gregorian date' })]),
    calculate(values, language) {
        const date = validDate(values.date, language);
        const number = Math.floor(date.getTime() / millisecondsPerDay + 2_440_588);
        return output(number, localized(language, 'رقم اليوم اليولياني', 'Julian day number'));
    },
});

const advancedDateTimeDefinitions = Object.freeze({
    [ageAtDate.id]: ageAtDate,
    [inclusiveDateRange.id]: inclusiveDateRange,
    [monthsBetween.id]: monthsBetween,
    [daysInMonth.id]: daysInMonth,
    [quarterCalculator.id]: quarterCalculator,
    [timeAddition.id]: timeAddition,
    [decimalHours.id]: decimalHours,
    [weekendDays.id]: weekendDays,
    [anniversaryCalculator.id]: anniversaryCalculator,
    [julianDay.id]: julianDay,
});

export { advancedDateTimeDefinitions };

// END OF FILE
