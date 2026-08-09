const dayMilliseconds = 86_400_000;
const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
});

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function format(value) {
    return formatter.format(value);
}

function parseUtcDate(value) {
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) {
        throw new Error('Invalid date');
    }
    return date;
}

function dateInput(id, label) {
    return Object.freeze({
        id,
        type: 'date',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function timeInput(id, label) {
    return Object.freeze({
        id,
        type: 'time',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, label, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000,
        step: options.step ?? 1,
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

function result(value, label, details = '') {
    return { value, label, details };
}

function dateLabel(date, language) {
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
        dateStyle: 'long',
        timeZone: 'UTC',
    });
}

function timeToMinutes(value) {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
        throw new Error('Invalid time');
    }
    return (hours * 60) + minutes;
}

const daysUntil = Object.freeze({
    id: 'days-until-date-calculator',
    category: 'date-time',
    icon: 'D−',
    title: Object.freeze({ ar: 'حاسبة الأيام المتبقية', en: 'Days Until Date Calculator' }),
    description: Object.freeze({ ar: 'احسب عدد الأيام المتبقية حتى أي تاريخ قادم.', en: 'Calculate the number of days remaining until a future date.' }),
    note: Object.freeze({ ar: 'يبدأ الحساب من تاريخ اليوم وفق جهازك.', en: 'Uses today’s date from your device.' }),
    inputs: Object.freeze([dateInput('targetDate', { ar: 'التاريخ المستهدف', en: 'Target date' })]),
    calculate(values, language) {
        const target = parseUtcDate(values.targetDate);
        const now = new Date();
        const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        const days = Math.ceil((target.getTime() - today) / dayMilliseconds);
        return result(
            `${Math.abs(days)} ${localized(language, 'يوم', 'days')}`,
            days >= 0
                ? localized(language, 'متبقية', 'remaining')
                : localized(language, 'مضت', 'elapsed'),
            dateLabel(target, language),
        );
    },
});

const businessDays = Object.freeze({
    id: 'business-days-calculator',
    category: 'date-time',
    icon: 'M–F',
    title: Object.freeze({ ar: 'حاسبة أيام العمل', en: 'Business Days Calculator' }),
    description: Object.freeze({ ar: 'احسب أيام العمل من الاثنين إلى الجمعة بين تاريخين.', en: 'Count Monday-to-Friday business days between two dates.' }),
    note: Object.freeze({ ar: 'لا تخصم الأداة العطلات الرسمية المحلية.', en: 'Public holidays are not excluded.' }),
    inputs: Object.freeze([
        dateInput('startDate', { ar: 'تاريخ البداية', en: 'Start date' }),
        dateInput('endDate', { ar: 'تاريخ النهاية', en: 'End date' }),
    ]),
    calculate(values, language) {
        let start = parseUtcDate(values.startDate);
        let end = parseUtcDate(values.endDate);
        if (start > end) {
            [start, end] = [end, start];
        }
        let days = 0;
        for (
            let cursor = new Date(start);
            cursor <= end;
            cursor = new Date(cursor.getTime() + dayMilliseconds)
        ) {
            const weekday = cursor.getUTCDay();
            if (weekday !== 0 && weekday !== 6) {
                days += 1;
            }
        }
        return result(
            `${days} ${localized(language, 'يوم عمل', 'business days')}`,
            localized(language, 'شاملة تاريخي البداية والنهاية', 'Including start and end dates'),
        );
    },
});

const dateOperationOptions = Object.freeze([
    { value: 'add', label: { ar: 'إضافة', en: 'Add' } },
    { value: 'subtract', label: { ar: 'طرح', en: 'Subtract' } },
]);
const dateUnitOptions = Object.freeze([
    { value: 'days', label: { ar: 'أيام', en: 'Days' } },
    { value: 'weeks', label: { ar: 'أسابيع', en: 'Weeks' } },
    { value: 'months', label: { ar: 'أشهر', en: 'Months' } },
    { value: 'years', label: { ar: 'سنوات', en: 'Years' } },
]);

const dateMath = Object.freeze({
    id: 'date-add-subtract-calculator',
    category: 'date-time',
    icon: '±D',
    title: Object.freeze({ ar: 'إضافة وطرح التاريخ', en: 'Date Add & Subtract Calculator' }),
    description: Object.freeze({ ar: 'أضف أو اطرح أيامًا أو أسابيع أو أشهرًا أو سنوات من تاريخ.', en: 'Add or subtract days, weeks, months or years from a date.' }),
    note: Object.freeze({ ar: 'تتعامل الأشهر والسنوات مع تقويم التاريخ الفعلي.', en: 'Months and years follow calendar date rules.' }),
    inputs: Object.freeze([
        dateInput('startDate', { ar: 'تاريخ البداية', en: 'Start date' }),
        selectInput('operation', { ar: 'العملية', en: 'Operation' }, dateOperationOptions),
        numberInput('amount', { ar: 'المقدار', en: 'Amount' }, 30, { min: 0, step: 1 }),
        selectInput('unit', { ar: 'الوحدة', en: 'Unit' }, dateUnitOptions),
    ]),
    calculate(values, language) {
        const date = parseUtcDate(values.startDate);
        const amount = Math.round(values.amount)
            * (values.operation === 'subtract' ? -1 : 1);
        if (values.unit === 'days') {
            date.setUTCDate(date.getUTCDate() + amount);
        } else if (values.unit === 'weeks') {
            date.setUTCDate(date.getUTCDate() + (amount * 7));
        } else if (values.unit === 'months') {
            date.setUTCMonth(date.getUTCMonth() + amount);
        } else {
            date.setUTCFullYear(date.getUTCFullYear() + amount);
        }
        return result(
            dateLabel(date, language),
            localized(language, 'التاريخ الناتج', 'Resulting date'),
            date.toISOString().slice(0, 10),
        );
    },
});

function getIsoWeek(date) {
    const target = new Date(date);
    const day = target.getUTCDay() || 7;
    target.setUTCDate(target.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
    return Math.ceil((((target - yearStart) / dayMilliseconds) + 1) / 7);
}

const weekNumber = Object.freeze({
    id: 'week-number-calculator',
    category: 'date-time',
    icon: 'W#',
    title: Object.freeze({ ar: 'حاسبة رقم الأسبوع', en: 'Week Number Calculator' }),
    description: Object.freeze({ ar: 'اعرف رقم الأسبوع وفق معيار ISO لأي تاريخ.', en: 'Find the ISO week number for any date.' }),
    note: Object.freeze({ ar: 'يبدأ أسبوع ISO يوم الاثنين.', en: 'ISO weeks begin on Monday.' }),
    inputs: Object.freeze([dateInput('date', { ar: 'التاريخ', en: 'Date' })]),
    calculate(values, language) {
        const date = parseUtcDate(values.date);
        return result(
            `${getIsoWeek(date)}`,
            localized(language, 'رقم الأسبوع ISO', 'ISO week number'),
            `${date.getUTCFullYear()}`,
        );
    },
});

const leapYear = Object.freeze({
    id: 'leap-year-calculator',
    category: 'date-time',
    icon: '366',
    title: Object.freeze({ ar: 'حاسبة السنة الكبيسة', en: 'Leap Year Calculator' }),
    description: Object.freeze({ ar: 'تحقق مما إذا كانت أي سنة كبيسة وعدد أيامها 366.', en: 'Check whether a year is a 366-day leap year.' }),
    note: Object.freeze({ ar: 'تطبق قواعد التقويم الميلادي.', en: 'Uses Gregorian calendar rules.' }),
    inputs: Object.freeze([
        numberInput('year', { ar: 'السنة', en: 'Year' }, 2028, { min: 1, max: 9999, step: 1 }),
    ]),
    calculate(values, language) {
        const year = Math.round(values.year);
        const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        return result(
            isLeap
                ? localized(language, 'سنة كبيسة', 'Leap year')
                : localized(language, 'سنة عادية', 'Common year'),
            `${isLeap ? 366 : 365} ${localized(language, 'يوم', 'days')}`,
            `${year}`,
        );
    },
});

const timeDuration = Object.freeze({
    id: 'time-duration-calculator',
    category: 'date-time',
    icon: '∆T',
    title: Object.freeze({ ar: 'حاسبة المدة الزمنية', en: 'Time Duration Calculator' }),
    description: Object.freeze({ ar: 'احسب الساعات والدقائق بين وقتين مع دعم عبور منتصف الليل.', en: 'Calculate duration between two times, including overnight.' }),
    note: Object.freeze({ ar: 'إذا كان وقت النهاية أسبق تُحسب النهاية في اليوم التالي.', en: 'An earlier end time is treated as the next day.' }),
    inputs: Object.freeze([
        timeInput('startTime', { ar: 'وقت البداية', en: 'Start time' }),
        timeInput('endTime', { ar: 'وقت النهاية', en: 'End time' }),
    ]),
    calculate(values, language) {
        const start = timeToMinutes(values.startTime);
        let end = timeToMinutes(values.endTime);
        if (end < start) {
            end += 1440;
        }
        const duration = end - start;
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return result(
            `${hours}:${String(minutes).padStart(2, '0')}`,
            localized(language, 'ساعات ودقائق', 'hours and minutes'),
            `${duration} ${localized(language, 'دقيقة', 'minutes')}`,
        );
    },
});

const birthdayCountdown = Object.freeze({
    id: 'birthday-countdown-calculator',
    category: 'date-time',
    icon: '🎂',
    title: Object.freeze({ ar: 'العد التنازلي لعيد الميلاد', en: 'Birthday Countdown Calculator' }),
    description: Object.freeze({ ar: 'احسب الأيام المتبقية حتى عيد ميلادك القادم.', en: 'Calculate days remaining until your next birthday.' }),
    note: Object.freeze({ ar: 'يستخدم اليوم والشهر فقط من تاريخ الميلاد.', en: 'Only the birth month and day are used.' }),
    inputs: Object.freeze([dateInput('birthDate', { ar: 'تاريخ الميلاد', en: 'Birth date' })]),
    calculate(values, language) {
        const birth = parseUtcDate(values.birthDate);
        const now = new Date();
        const today = new Date(Date.UTC(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
        ));
        let next = new Date(Date.UTC(
            today.getUTCFullYear(),
            birth.getUTCMonth(),
            birth.getUTCDate(),
        ));
        if (next < today) {
            next = new Date(Date.UTC(
                today.getUTCFullYear() + 1,
                birth.getUTCMonth(),
                birth.getUTCDate(),
            ));
        }
        const days = Math.round((next - today) / dayMilliseconds);
        return result(
            `${days} ${localized(language, 'يوم', 'days')}`,
            localized(language, 'حتى عيد الميلاد القادم', 'until the next birthday'),
            dateLabel(next, language),
        );
    },
});

const ageCalculator = Object.freeze({
    id: 'age-calculator',
    category: 'date-time',
    icon: '🎈',
    title: Object.freeze({ ar: 'حاسبة العمر', en: 'Age Calculator' }),
    description: Object.freeze({
        ar: 'احسب عمرك بالضبط بالسنوات والشهور والأيام من تاريخ ميلادك حتى اليوم، أو حتى تاريخ آخر تختاره.',
        en: 'Calculate your exact age in years, months, and days from your birth date to today, or to another date you choose.',
    }),
    note: Object.freeze({
        ar: 'يتعامل بشكل صحيح مع السنوات الكبيسة ومواليد 29 فبراير.',
        en: 'Correctly handles leap years and February 29th birthdays.',
    }),
    inputs: Object.freeze([
        dateInput('birthDate', { ar: 'تاريخ الميلاد', en: 'Birth date' }),
        dateInput('referenceDate', { ar: 'احسب العمر حتى تاريخ (اختياري، افتراضيًا اليوم)', en: 'Calculate age as of (optional, defaults to today)' }),
    ]),
    calculate(values, language) {
        const birth = parseUtcDate(values.birthDate);
        const now = new Date();
        const reference = values.referenceDate
            ? parseUtcDate(values.referenceDate)
            : new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

        if (reference < birth) {
            throw new Error(localized(
                language,
                'تاريخ الحساب يجب أن يكون بعد تاريخ الميلاد.',
                'The reference date must be after the birth date.',
            ));
        }

        let years = reference.getUTCFullYear() - birth.getUTCFullYear();
        let months = reference.getUTCMonth() - birth.getUTCMonth();
        let days = reference.getUTCDate() - birth.getUTCDate();

        if (days < 0) {
            months -= 1;
            const daysInPrevMonth = new Date(Date.UTC(reference.getUTCFullYear(), reference.getUTCMonth(), 0)).getUTCDate();
            days += daysInPrevMonth;
        }
        if (months < 0) {
            years -= 1;
            months += 12;
        }

        const totalDays = Math.round((reference - birth) / dayMilliseconds);

        return result(
            `${years} ${localized(language, 'سنة', 'years')}`,
            localized(
                language,
                `${months} شهر و${days} يوم`,
                `${months} months and ${days} days`,
            ),
            localized(language, `إجمالي ${format(totalDays)} يوم`, `Total ${format(totalDays)} days`),
        );
    },
});

const workHours = Object.freeze({
    id: 'work-hours-calculator',
    category: 'date-time',
    icon: '⏱',
    title: Object.freeze({ ar: 'حاسبة ساعات العمل', en: 'Work Hours Calculator' }),
    description: Object.freeze({ ar: 'احسب صافي ساعات العمل بعد خصم الاستراحة.', en: 'Calculate net working time after subtracting breaks.' }),
    note: Object.freeze({ ar: 'يدعم نوبات العمل التي تتجاوز منتصف الليل.', en: 'Supports shifts that pass midnight.' }),
    inputs: Object.freeze([
        timeInput('startTime', { ar: 'بداية العمل', en: 'Start time' }),
        timeInput('endTime', { ar: 'نهاية العمل', en: 'End time' }),
        numberInput('breakMinutes', { ar: 'مدة الاستراحة', en: 'Break duration' }, 60, { min: 0, max: 1440, step: 1, unit: { ar: 'دقيقة', en: 'minutes' } }),
    ]),
    calculate(values, language) {
        const start = timeToMinutes(values.startTime);
        let end = timeToMinutes(values.endTime);
        if (end < start) {
            end += 1440;
        }
        const netMinutes = end - start - values.breakMinutes;
        if (netMinutes < 0) {
            throw new Error(localized(language, 'الاستراحة تتجاوز مدة العمل.', 'Break exceeds shift duration.'));
        }
        return result(
            format(netMinutes / 60),
            localized(language, 'صافي ساعات العمل', 'Net working hours'),
            `${netMinutes} ${localized(language, 'دقيقة', 'minutes')}`,
        );
    },
});

const timezoneOptions = Object.freeze([
    { value: '-8', label: { ar: 'لوس أنجلوس UTC−8', en: 'Los Angeles UTC−8' } },
    { value: '-5', label: { ar: 'نيويورك UTC−5', en: 'New York UTC−5' } },
    { value: '0', label: { ar: 'لندن/UTC', en: 'London / UTC' } },
    { value: '2', label: { ar: 'القاهرة UTC+2', en: 'Cairo UTC+2' } },
    { value: '3', label: { ar: 'الرياض UTC+3', en: 'Riyadh UTC+3' } },
    { value: '4', label: { ar: 'دبي UTC+4', en: 'Dubai UTC+4' } },
    { value: '5.5', label: { ar: 'الهند UTC+5:30', en: 'India UTC+5:30' } },
    { value: '9', label: { ar: 'طوكيو UTC+9', en: 'Tokyo UTC+9' } },
]);

const timezoneConverter = Object.freeze({
    id: 'timezone-converter',
    category: 'date-time',
    icon: 'UTC',
    title: Object.freeze({ ar: 'محول المناطق الزمنية', en: 'Time Zone Converter' }),
    description: Object.freeze({ ar: 'حوّل وقتًا بين أشهر فروق التوقيت العالمية.', en: 'Convert a time between common UTC offsets.' }),
    note: Object.freeze({ ar: 'الفروق ثابتة ولا تشمل التوقيت الصيفي تلقائيًا.', en: 'Offsets are fixed and do not automatically apply daylight saving.' }),
    inputs: Object.freeze([
        timeInput('time', { ar: 'الوقت', en: 'Time' }),
        selectInput('fromOffset', { ar: 'من منطقة', en: 'From zone' }, timezoneOptions),
        selectInput('toOffset', { ar: 'إلى منطقة', en: 'To zone' }, timezoneOptions),
    ]),
    calculate(values, language) {
        const sourceMinutes = timeToMinutes(values.time);
        const rawTarget = sourceMinutes
            - (Number(values.fromOffset) * 60)
            + (Number(values.toOffset) * 60);
        const dayShift = Math.floor(rawTarget / 1440);
        const normalized = ((rawTarget % 1440) + 1440) % 1440;
        const time = `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
        const dayText = dayShift === 0
            ? localized(language, 'نفس اليوم', 'same day')
            : dayShift > 0
                ? localized(language, 'اليوم التالي', 'next day')
                : localized(language, 'اليوم السابق', 'previous day');
        return result(time, localized(language, 'الوقت المحوّل', 'Converted time'), dayText);
    },
});

const dayOfWeek = Object.freeze({
    id: 'day-of-week-calculator',
    category: 'date-time',
    icon: 'Mon',
    title: Object.freeze({ ar: 'حاسبة يوم الأسبوع', en: 'Day of the Week Calculator' }),
    description: Object.freeze({ ar: 'اعرف اسم يوم الأسبوع لأي تاريخ.', en: 'Find the weekday name for any date.' }),
    note: Object.freeze({ ar: 'يستخدم التقويم الميلادي.', en: 'Uses the Gregorian calendar.' }),
    inputs: Object.freeze([dateInput('date', { ar: 'التاريخ', en: 'Date' })]),
    calculate(values, language) {
        const date = parseUtcDate(values.date);
        return result(
            date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
                weekday: 'long',
                timeZone: 'UTC',
            }),
            localized(language, 'يوم الأسبوع', 'Day of the week'),
            dateLabel(date, language),
        );
    },
});

const dateTimeDefinitions = Object.freeze({
    'days-until-date-calculator': daysUntil,
    'business-days-calculator': businessDays,
    'date-add-subtract-calculator': dateMath,
    'week-number-calculator': weekNumber,
    'leap-year-calculator': leapYear,
    'time-duration-calculator': timeDuration,
    'birthday-countdown-calculator': birthdayCountdown,
    'age-calculator': ageCalculator,
    'work-hours-calculator': workHours,
    'timezone-converter': timezoneConverter,
    'day-of-week-calculator': dayOfWeek,
});

export { dateTimeDefinitions };

// END OF FILE
