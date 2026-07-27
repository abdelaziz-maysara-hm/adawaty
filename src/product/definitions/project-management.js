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
        category: 'student-study',
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

const pert = tool({
    id: 'pert-estimate-calculator',
    icon: 'PERT',
    title: { ar: 'حاسبة تقدير PERT', en: 'PERT Estimate Calculator' },
    description: { ar: 'احسب المدة المتوقعة من التقدير المتفائل والأرجح والمتشائم.', en: 'Calculate expected duration from optimistic, likely and pessimistic estimates.' },
    note: { ar: 'يستخدم PERT وزنًا أكبر للتقدير الأرجح.', en: 'PERT gives the most-likely estimate greater weight.' },
    inputs: [
        field('optimistic', 'التقدير المتفائل', 'Optimistic estimate', 4),
        field('likely', 'التقدير الأرجح', 'Most likely estimate', 7),
        field('pessimistic', 'التقدير المتشائم', 'Pessimistic estimate', 16),
    ],
    calculate(values, language) {
        const expected = (values.optimistic + 4 * values.likely + values.pessimistic) / 6;
        const deviation = (values.pessimistic - values.optimistic) / 6;
        return output(amount(expected), localized(language, 'المدة المتوقعة', 'Expected duration'), `${localized(language, 'الانحراف المعياري', 'Standard deviation')}: ${amount(deviation)}`);
    },
});

const utilization = tool({
    id: 'billable-utilization-rate-calculator',
    icon: 'UTIL',
    title: { ar: 'حاسبة معدل الاستغلال القابل للفوترة', en: 'Billable Utilization Rate Calculator' },
    description: { ar: 'احسب نسبة الساعات القابلة للفوترة إلى الساعات المتاحة.', en: 'Calculate billable hours as a percentage of available hours.' },
    note: { ar: 'حدد الفترة نفسها لكلا الرقمين.', en: 'Use the same period for both values.' },
    inputs: [
        field('billable', 'الساعات القابلة للفوترة', 'Billable hours', 120),
        field('available', 'الساعات المتاحة', 'Available hours', 160, { min: 0.001 }),
    ],
    calculate: (values, language) => output(`${amount(values.billable / values.available * 100)}%`, localized(language, 'معدل الاستغلال', 'Utilization rate')),
});

const billableTarget = tool({
    id: 'billable-hours-target-calculator',
    icon: 'HRS',
    title: { ar: 'حاسبة هدف الساعات القابلة للفوترة', en: 'Billable Hours Target Calculator' },
    description: { ar: 'احسب عدد الساعات المطلوبة لتحقيق هدف إيراد بسعر محدد.', en: 'Calculate billable hours needed to reach a revenue target at a set rate.' },
    note: { ar: 'لا يشمل الحساب المصروفات أو الضرائب إلا إذا أضفتها للهدف.', en: 'Expenses and taxes are excluded unless included in the target.' },
    inputs: [
        field('target', 'هدف الإيراد', 'Revenue target', 10000),
        field('rate', 'سعر الساعة', 'Hourly rate', 50, { min: 0.001 }),
    ],
    calculate: (values, language) => output(amount(values.target / values.rate, 'hours'), localized(language, 'الساعات المطلوبة', 'Required billable hours')),
});

const earnedValue = tool({
    id: 'earned-value-management-calculator',
    icon: 'EVM',
    title: { ar: 'حاسبة إدارة القيمة المكتسبة', en: 'Earned Value Management Calculator' },
    description: { ar: 'احسب القيمة المكتسبة ومؤشري أداء التكلفة والجدول.', en: 'Calculate earned value, cost performance and schedule performance.' },
    note: { ar: 'أدخل الميزانية والتكلفة الفعلية والقيمة المخططة ونسبة الإنجاز.', en: 'Enter budget, actual cost, planned value and completion percentage.' },
    inputs: [
        field('budget', 'ميزانية المشروع', 'Budget at completion', 100000),
        field('actualCost', 'التكلفة الفعلية', 'Actual cost', 45000, { min: 0.001 }),
        field('plannedValue', 'القيمة المخططة', 'Planned value', 50000, { min: 0.001 }),
        field('complete', 'نسبة الإنجاز', 'Completion', 40, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const earned = values.budget * values.complete / 100;
        return output(
            amount(earned),
            localized(language, 'القيمة المكتسبة', 'Earned value'),
            `CPI: ${amount(earned / values.actualCost)}\nSPI: ${amount(earned / values.plannedValue)}`,
        );
    },
});

const estimateAtCompletion = tool({
    id: 'estimate-at-completion-calculator',
    icon: 'EAC',
    title: { ar: 'حاسبة التكلفة المتوقعة عند الإكمال', en: 'Estimate at Completion Calculator' },
    description: { ar: 'توقع التكلفة النهائية من الميزانية ومؤشر أداء التكلفة.', en: 'Forecast final project cost from budget and cost performance index.' },
    note: { ar: 'تفترض الصيغة استمرار كفاءة التكلفة الحالية.', en: 'Assumes current cost efficiency continues.' },
    inputs: [
        field('budget', 'ميزانية الإكمال', 'Budget at completion', 100000),
        field('cpi', 'مؤشر أداء التكلفة CPI', 'Cost performance index', 0.8, { min: 0.001 }),
    ],
    calculate: (values, language) => output(amount(values.budget / values.cpi), localized(language, 'التكلفة المتوقعة', 'Estimate at completion')),
});

const velocity = tool({
    id: 'agile-sprint-velocity-calculator',
    icon: 'VEL',
    title: { ar: 'حاسبة سرعة السبرنت', en: 'Agile Sprint Velocity Calculator' },
    description: { ar: 'احسب متوسط نقاط القصة المنجزة في السبرنت.', en: 'Calculate average story points completed per sprint.' },
    note: { ar: 'استخدم عدة سبرنتات مستقرة للحصول على متوسط مفيد.', en: 'Use several stable sprints for a useful average.' },
    inputs: [
        field('points', 'إجمالي النقاط المنجزة', 'Total completed points', 160),
        field('sprints', 'عدد السبرنتات', 'Number of sprints', 5, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => output(amount(values.points / values.sprints, 'points/sprint'), localized(language, 'متوسط السرعة', 'Average velocity')),
});

const capacity = tool({
    id: 'agile-team-capacity-calculator',
    icon: 'CAP',
    title: { ar: 'حاسبة سعة فريق أجايل', en: 'Agile Team Capacity Calculator' },
    description: { ar: 'احسب ساعات التركيز المتاحة للفريق خلال سبرنت.', en: 'Calculate team focus hours available during a sprint.' },
    note: { ar: 'معامل التركيز يخصم الاجتماعات والمقاطعات والعمل غير المخطط.', en: 'Focus factor accounts for meetings, interruptions and unplanned work.' },
    inputs: [
        field('members', 'عدد أعضاء الفريق', 'Team members', 5, { min: 1, step: 1 }),
        field('days', 'أيام العمل في السبرنت', 'Working days', 10, { step: 1 }),
        field('hours', 'الساعات اليومية', 'Hours per day', 8),
        field('focus', 'معامل التركيز', 'Focus factor', 70, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate: (values, language) => output(amount(values.members * values.days * values.hours * values.focus / 100, 'hours'), localized(language, 'سعة الفريق', 'Team capacity')),
});

const meetingCost = tool({
    id: 'meeting-cost-calculator',
    icon: 'MEET',
    title: { ar: 'حاسبة تكلفة الاجتماع', en: 'Meeting Cost Calculator' },
    description: { ar: 'احسب تكلفة وقت المشاركين في اجتماع.', en: 'Calculate the labour cost of participant time in a meeting.' },
    note: { ar: 'استخدم متوسط التكلفة الكلية للساعة لكل مشارك.', en: 'Use average fully loaded hourly cost per attendee.' },
    inputs: [
        field('attendees', 'عدد المشاركين', 'Attendees', 8, { min: 1, step: 1 }),
        field('hourlyCost', 'متوسط تكلفة الساعة', 'Average hourly cost', 40),
        field('duration', 'مدة الاجتماع', 'Meeting duration', 1.5, { unit: { ar: 'ساعة', en: 'hours' } }),
    ],
    calculate: (values, language) => output(amount(values.attendees * values.hourlyCost * values.duration), localized(language, 'تكلفة الاجتماع', 'Meeting cost')),
});

const freelanceRate = tool({
    id: 'freelance-hourly-rate-calculator',
    icon: 'RATE',
    title: { ar: 'حاسبة سعر ساعة العمل الحر', en: 'Freelance Hourly Rate Calculator' },
    description: { ar: 'قدّر سعر الساعة المطلوب من هدف الدخل والمصروفات والوقت القابل للفوترة.', en: 'Estimate an hourly rate from income target, expenses and billable time.' },
    note: { ar: 'احتياطي الضرائب نسبة من الإيراد المطلوب.', en: 'Tax reserve is treated as a percentage of required revenue.' },
    inputs: [
        field('income', 'هدف الدخل السنوي', 'Annual income target', 60000),
        field('expenses', 'المصروفات السنوية', 'Annual expenses', 10000),
        field('weeks', 'أسابيع العمل', 'Working weeks', 46, { min: 1 }),
        field('hours', 'الساعات القابلة للفوترة أسبوعيًا', 'Billable hours per week', 25, { min: 0.1 }),
        field('taxReserve', 'احتياطي الضرائب', 'Tax reserve', 20, { max: 95, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const revenue = (values.income + values.expenses) / (1 - values.taxReserve / 100);
        return output(amount(revenue / (values.weeks * values.hours)), localized(language, 'سعر الساعة المقترح', 'Suggested hourly rate'));
    },
});

const durationForecast = tool({
    id: 'project-duration-throughput-calculator',
    icon: 'ETA',
    title: { ar: 'حاسبة مدة المشروع من معدل الإنجاز', en: 'Project Duration from Throughput Calculator' },
    description: { ar: 'قدّر عدد الفترات المطلوبة لإنجاز العمل المتبقي.', en: 'Estimate periods needed to finish remaining work at current throughput.' },
    note: { ar: 'يفترض الحساب ثبات معدل الإنجاز.', en: 'Assumes throughput remains stable.' },
    inputs: [
        field('remaining', 'وحدات العمل المتبقية', 'Remaining work units', 240),
        field('throughput', 'الوحدات المنجزة في الفترة', 'Units per period', 30, { min: 0.001 }),
    ],
    calculate: (values, language) => output(amount(Math.ceil(values.remaining / values.throughput), 'periods'), localized(language, 'المدة المتوقعة', 'Estimated duration')),
});

const projectManagementDefinitions = Object.freeze({
    [pert.id]: pert,
    [utilization.id]: utilization,
    [billableTarget.id]: billableTarget,
    [earnedValue.id]: earnedValue,
    [estimateAtCompletion.id]: estimateAtCompletion,
    [velocity.id]: velocity,
    [capacity.id]: capacity,
    [meetingCost.id]: meetingCost,
    [freelanceRate.id]: freelanceRate,
    [durationForecast.id]: durationForecast,
});

export { projectManagementDefinitions };

// END OF FILE
