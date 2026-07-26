const formatter = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
});

function format(value) {
    return formatter.format(value);
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function result(value, label, details = '') {
    return { value: String(value), label, details };
}

function numberInput(id, label, sample, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 100,
        step: options.step ?? 0.01,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(sample),
    });
}

const percent = Object.freeze({ ar: '%', en: '%' });
const hours = Object.freeze({ ar: 'ساعة', en: 'hours' });
const minutes = Object.freeze({ ar: 'دقيقة', en: 'minutes' });

const weightedCourseGrade = Object.freeze({
    id: 'weighted-course-grade-calculator',
    category: 'student',
    icon: 'A+',
    title: Object.freeze({ ar: 'حاسبة الدرجة النهائية الموزونة', en: 'Weighted Course Grade Calculator' }),
    description: Object.freeze({ ar: 'احسب الدرجة النهائية لأربع فئات تقييم بأوزان مختلفة.', en: 'Calculate a final course grade from four weighted assessment categories.' }),
    note: Object.freeze({ ar: 'تُطبّع الأوزان تلقائيًا حتى لو لم يكن مجموعها 100.', en: 'Weights are normalized automatically when they do not total 100.' }),
    inputs: Object.freeze([
        numberInput('score1', { ar: 'درجة الفئة الأولى', en: 'Category 1 score' }, 90, { unit: percent }),
        numberInput('weight1', { ar: 'وزن الفئة الأولى', en: 'Category 1 weight' }, 20, { unit: percent }),
        numberInput('score2', { ar: 'درجة الفئة الثانية', en: 'Category 2 score' }, 85, { unit: percent }),
        numberInput('weight2', { ar: 'وزن الفئة الثانية', en: 'Category 2 weight' }, 25, { unit: percent }),
        numberInput('score3', { ar: 'درجة الفئة الثالثة', en: 'Category 3 score' }, 88, { unit: percent }),
        numberInput('weight3', { ar: 'وزن الفئة الثالثة', en: 'Category 3 weight' }, 25, { unit: percent }),
        numberInput('score4', { ar: 'درجة الفئة الرابعة', en: 'Category 4 score' }, 95, { unit: percent }),
        numberInput('weight4', { ar: 'وزن الفئة الرابعة', en: 'Category 4 weight' }, 30, { unit: percent }),
    ]),
    calculate(values, language) {
        const totalWeight = values.weight1 + values.weight2 + values.weight3 + values.weight4;
        if (totalWeight <= 0) {
            throw new Error(localized(language, 'يجب أن يكون مجموع الأوزان أكبر من صفر.', 'Total weight must be greater than zero.'));
        }
        const grade = (
            values.score1 * values.weight1
            + values.score2 * values.weight2
            + values.score3 * values.weight3
            + values.score4 * values.weight4
        ) / totalWeight;
        return result(`${format(grade)}%`, localized(language, 'الدرجة النهائية الموزونة', 'Weighted final grade'), localized(language, `مجموع الأوزان: ${format(totalWeight)}%`, `Total weight: ${format(totalWeight)}%`));
    },
});

const requiredFinalGrade = Object.freeze({
    id: 'required-final-grade-calculator',
    category: 'student',
    icon: '🎯',
    title: Object.freeze({ ar: 'حاسبة الدرجة المطلوبة في النهائي', en: 'Required Final Grade Calculator' }),
    description: Object.freeze({ ar: 'اعرف الدرجة المطلوبة في الجزء المتبقي للوصول إلى هدفك النهائي.', en: 'Find the score needed on remaining coursework to reach a target final grade.' }),
    note: Object.freeze({ ar: 'أدخل وزن الأعمال المكتملة فقط، ويُحسب الوزن المتبقي تلقائيًا.', en: 'Enter completed-coursework weight; the remaining weight is calculated.' }),
    inputs: Object.freeze([
        numberInput('currentGrade', { ar: 'درجتك الحالية', en: 'Current grade' }, 82, { unit: percent }),
        numberInput('completedWeight', { ar: 'وزن الأعمال المكتملة', en: 'Completed coursework weight' }, 70, { min: 0, max: 99.99, unit: percent }),
        numberInput('targetGrade', { ar: 'الدرجة النهائية المستهدفة', en: 'Target final grade' }, 85, { unit: percent }),
    ]),
    calculate(values, language) {
        const remainingWeight = 100 - values.completedWeight;
        const needed = (
            values.targetGrade
            - values.currentGrade * values.completedWeight / 100
        ) / (remainingWeight / 100);
        const feasibility = needed > 100
            ? localized(language, 'الهدف يتطلب أكثر من 100%.', 'The target requires more than 100%.')
            : needed <= 0
                ? localized(language, 'تم تحقيق الهدف بالفعل.', 'The target is already secured.')
                : localized(language, `الوزن المتبقي: ${format(remainingWeight)}%`, `Remaining weight: ${format(remainingWeight)}%`);
        return result(`${format(Math.max(0, needed))}%`, localized(language, 'الدرجة المطلوبة', 'Required score'), feasibility);
    },
});

const cumulativeGpa = Object.freeze({
    id: 'cumulative-gpa-calculator',
    category: 'student',
    icon: 'CGPA',
    title: Object.freeze({ ar: 'حاسبة المعدل التراكمي للفصول', en: 'Cumulative GPA Calculator' }),
    description: Object.freeze({ ar: 'ادمج معدلات أربعة فصول وفق الساعات المعتمدة لكل فصل.', en: 'Combine four semester GPAs weighted by their credit hours.' }),
    note: Object.freeze({ ar: 'تقبل الأداة معدلات على مقياس 4.0.', en: 'This calculator uses a 4.0 GPA scale.' }),
    inputs: Object.freeze([
        numberInput('gpa1', { ar: 'معدل الفصل الأول', en: 'Semester 1 GPA' }, 3.2, { min: 0, max: 4, step: 0.01 }),
        numberInput('credits1', { ar: 'ساعات الفصل الأول', en: 'Semester 1 credits' }, 15, { min: 0.5, max: 100, step: 0.5 }),
        numberInput('gpa2', { ar: 'معدل الفصل الثاني', en: 'Semester 2 GPA' }, 3.5, { min: 0, max: 4, step: 0.01 }),
        numberInput('credits2', { ar: 'ساعات الفصل الثاني', en: 'Semester 2 credits' }, 15, { min: 0.5, max: 100, step: 0.5 }),
        numberInput('gpa3', { ar: 'معدل الفصل الثالث', en: 'Semester 3 GPA' }, 3.7, { min: 0, max: 4, step: 0.01 }),
        numberInput('credits3', { ar: 'ساعات الفصل الثالث', en: 'Semester 3 credits' }, 18, { min: 0.5, max: 100, step: 0.5 }),
        numberInput('gpa4', { ar: 'معدل الفصل الرابع', en: 'Semester 4 GPA' }, 3.8, { min: 0, max: 4, step: 0.01 }),
        numberInput('credits4', { ar: 'ساعات الفصل الرابع', en: 'Semester 4 credits' }, 18, { min: 0.5, max: 100, step: 0.5 }),
    ]),
    calculate(values, language) {
        const totalCredits = values.credits1 + values.credits2 + values.credits3 + values.credits4;
        const points = values.gpa1 * values.credits1
            + values.gpa2 * values.credits2
            + values.gpa3 * values.credits3
            + values.gpa4 * values.credits4;
        return result((points / totalCredits).toFixed(2), localized(language, 'المعدل التراكمي من 4', 'Cumulative GPA on a 4.0 scale'), localized(language, `إجمالي الساعات: ${format(totalCredits)}`, `Total credits: ${format(totalCredits)}`));
    },
});

const percentageToGpa = Object.freeze({
    id: 'percentage-to-gpa-calculator',
    category: 'student',
    icon: '%→4',
    title: Object.freeze({ ar: 'تحويل النسبة إلى GPA', en: 'Percentage to GPA Calculator' }),
    description: Object.freeze({ ar: 'حوّل النسبة المئوية تقريبًا إلى تقدير حرفي ونقاط على مقياس 4.', en: 'Estimate a letter grade and 4.0-scale GPA from a percentage.' }),
    note: Object.freeze({ ar: 'أنظمة التحويل تختلف بين المؤسسات؛ راجع لائحة مؤسستك.', en: 'Conversion policies vary by institution; check your official scale.' }),
    inputs: Object.freeze([numberInput('percentage', { ar: 'النسبة المئوية', en: 'Percentage' }, 87, { unit: percent })]),
    calculate(values, language) {
        const bands = [
            [93, 4, 'A'], [90, 3.7, 'A−'], [87, 3.3, 'B+'],
            [83, 3, 'B'], [80, 2.7, 'B−'], [77, 2.3, 'C+'],
            [73, 2, 'C'], [70, 1.7, 'C−'], [67, 1.3, 'D+'],
            [63, 1, 'D'], [60, 0.7, 'D−'], [0, 0, 'F'],
        ];
        const [, points, letter] = bands.find(([minimum]) => values.percentage >= minimum);
        return result(points.toFixed(1), localized(language, `التقدير ${letter}`, `Estimated grade ${letter}`), localized(language, 'تحويل تقريبي فقط.', 'Approximate conversion only.'));
    },
});

const attendanceGoal = Object.freeze({
    id: 'attendance-goal-calculator',
    category: 'student',
    icon: '✓%',
    title: Object.freeze({ ar: 'حاسبة هدف الحضور', en: 'Attendance Goal Calculator' }),
    description: Object.freeze({ ar: 'احسب عدد المحاضرات المتتالية المطلوبة للوصول إلى نسبة حضور مستهدفة.', en: 'Calculate consecutive attended classes needed to reach a target attendance rate.' }),
    note: Object.freeze({ ar: 'يفترض حضور جميع المحاضرات القادمة حتى الوصول للهدف.', en: 'Assumes every upcoming class is attended until the goal is reached.' }),
    inputs: Object.freeze([
        numberInput('attended', { ar: 'المحاضرات المحضورة', en: 'Classes attended' }, 32, { max: 100000, step: 1 }),
        numberInput('total', { ar: 'إجمالي المحاضرات', en: 'Total classes held' }, 40, { min: 1, max: 100000, step: 1 }),
        numberInput('target', { ar: 'نسبة الحضور المستهدفة', en: 'Target attendance' }, 85, { min: 1, max: 99.99, unit: percent }),
    ]),
    calculate(values, language) {
        if (values.attended > values.total) {
            throw new Error(localized(language, 'الحضور لا يمكن أن يتجاوز إجمالي المحاضرات.', 'Attendance cannot exceed total classes.'));
        }
        const target = values.target / 100;
        const needed = Math.max(0, Math.ceil((target * values.total - values.attended) / (1 - target)));
        return result(needed, localized(language, 'محاضرات متتالية مطلوبة', 'Consecutive classes needed'), localized(language, `النسبة الحالية: ${format(values.attended / values.total * 100)}%`, `Current rate: ${format(values.attended / values.total * 100)}%`));
    },
});

const absenceAllowance = Object.freeze({
    id: 'allowable-absences-calculator',
    category: 'student',
    icon: '−✓',
    title: Object.freeze({ ar: 'حاسبة الغياب المسموح', en: 'Allowable Absences Calculator' }),
    description: Object.freeze({ ar: 'اعرف عدد المحاضرات القادمة التي يمكنك غيابها دون النزول عن الحد المطلوب.', en: 'Find how many upcoming classes can be missed while staying above a required rate.' }),
    note: Object.freeze({ ar: 'يفترض عدم إضافة حضور جديد قبل مرات الغياب المحسوبة.', en: 'Assumes no additional attended classes before the calculated absences.' }),
    inputs: Object.freeze([
        numberInput('attended', { ar: 'المحاضرات المحضورة', en: 'Classes attended' }, 36, { max: 100000, step: 1 }),
        numberInput('total', { ar: 'إجمالي المحاضرات', en: 'Total classes held' }, 40, { min: 1, max: 100000, step: 1 }),
        numberInput('minimum', { ar: 'الحد الأدنى للحضور', en: 'Minimum attendance' }, 75, { min: 1, max: 100, unit: percent }),
    ]),
    calculate(values, language) {
        if (values.attended > values.total) {
            throw new Error(localized(language, 'الحضور لا يمكن أن يتجاوز الإجمالي.', 'Attendance cannot exceed the total.'));
        }
        const allowance = Math.max(0, Math.floor(values.attended / (values.minimum / 100) - values.total));
        return result(allowance, localized(language, 'مرات الغياب الإضافية الممكنة', 'Additional absences available'), localized(language, `نسبتك الحالية: ${format(values.attended / values.total * 100)}%`, `Current rate: ${format(values.attended / values.total * 100)}%`));
    },
});

const studyPlan = Object.freeze({
    id: 'study-plan-calculator',
    category: 'student',
    icon: '📚',
    title: Object.freeze({ ar: 'حاسبة خطة المذاكرة', en: 'Study Plan Calculator' }),
    description: Object.freeze({ ar: 'وزّع الفصول وساعات المذاكرة على الأيام المتاحة قبل الاختبار.', en: 'Distribute chapters and study hours across the days before an exam.' }),
    note: Object.freeze({ ar: 'اترك وقتًا للمراجعة والراحة وعدّل الخطة حسب صعوبة المواد.', en: 'Reserve review and rest time, and adjust for topic difficulty.' }),
    inputs: Object.freeze([
        numberInput('chapters', { ar: 'عدد الفصول أو الوحدات', en: 'Chapters or units' }, 24, { min: 1, max: 10000, step: 1 }),
        numberInput('days', { ar: 'الأيام المتاحة', en: 'Days available' }, 12, { min: 1, max: 1000, step: 1 }),
        numberInput('hoursPerDay', { ar: 'ساعات المذاكرة يوميًا', en: 'Study hours per day' }, 3, { min: 0.25, max: 24, step: 0.25, unit: hours }),
    ]),
    calculate(values, language) {
        const chaptersPerDay = values.chapters / values.days;
        const totalHours = values.days * values.hoursPerDay;
        return result(format(chaptersPerDay), localized(language, 'فصول يوميًا', 'Chapters per day'), localized(language, `إجمالي وقت المذاكرة: ${format(totalHours)} ساعة`, `Total study time: ${format(totalHours)} hours`));
    },
});

const pomodoroPlanner = Object.freeze({
    id: 'pomodoro-session-planner',
    category: 'student',
    icon: '25:5',
    title: Object.freeze({ ar: 'مخطط جلسات بومودورو', en: 'Pomodoro Session Planner' }),
    description: Object.freeze({ ar: 'قسّم وقت المذاكرة إلى جلسات تركيز واستراحات قصيرة.', en: 'Split study time into focused sessions and short breaks.' }),
    note: Object.freeze({ ar: 'لا تُضاف استراحة بعد الجلسة الأخيرة.', en: 'No break is added after the final focus session.' }),
    inputs: Object.freeze([
        numberInput('studyMinutes', { ar: 'وقت التركيز المطلوب', en: 'Required focus time' }, 120, { min: 1, max: 10000, step: 1, unit: minutes }),
        numberInput('focusMinutes', { ar: 'مدة جلسة التركيز', en: 'Focus session length' }, 25, { min: 1, max: 180, step: 1, unit: minutes }),
        numberInput('breakMinutes', { ar: 'مدة الاستراحة', en: 'Break length' }, 5, { min: 0, max: 60, step: 1, unit: minutes }),
    ]),
    calculate(values, language) {
        const sessions = Math.ceil(values.studyMinutes / values.focusMinutes);
        const elapsed = values.studyMinutes + Math.max(0, sessions - 1) * values.breakMinutes;
        return result(sessions, localized(language, 'عدد جلسات التركيز', 'Focus sessions'), localized(language, `الوقت الكلي مع الاستراحات: ${format(elapsed)} دقيقة`, `Total elapsed time: ${format(elapsed)} minutes`));
    },
});

const quizAverage = Object.freeze({
    id: 'quiz-average-calculator',
    category: 'student',
    icon: 'x̄',
    title: Object.freeze({ ar: 'حاسبة متوسط الاختبارات', en: 'Quiz Average Calculator' }),
    description: Object.freeze({ ar: 'احسب متوسط درجات خمسة اختبارات قصيرة بسرعة.', en: 'Calculate the arithmetic average of five quiz scores.' }),
    note: Object.freeze({ ar: 'أدخل جميع الدرجات على نفس المقياس.', en: 'Enter every score on the same scale.' }),
    inputs: Object.freeze([1, 2, 3, 4, 5].map((number) =>
        numberInput(`score${number}`, { ar: `درجة الاختبار ${number}`, en: `Quiz ${number} score` }, 70 + number * 5, { unit: percent }))),
    calculate(values, language) {
        const scores = [values.score1, values.score2, values.score3, values.score4, values.score5];
        const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return result(`${format(average)}%`, localized(language, 'متوسط الاختبارات', 'Quiz average'), localized(language, `أعلى درجة: ${format(Math.max(...scores))}%`, `Highest score: ${format(Math.max(...scores))}%`));
    },
});

const classRankPercentile = Object.freeze({
    id: 'class-rank-percentile-calculator',
    category: 'student',
    icon: '#%',
    title: Object.freeze({ ar: 'حاسبة النسبة المئينية للترتيب', en: 'Class Rank Percentile Calculator' }),
    description: Object.freeze({ ar: 'حوّل ترتيبك داخل الصف إلى نسبة مئينية تقريبية.', en: 'Convert class rank into an approximate percentile standing.' }),
    note: Object.freeze({ ar: 'قد تستخدم المؤسسات طرقًا مختلفة لحساب النسبة المئينية.', en: 'Institutions may use different percentile conventions.' }),
    inputs: Object.freeze([
        numberInput('rank', { ar: 'ترتيب الطالب', en: 'Student rank' }, 12, { min: 1, max: 100000, step: 1 }),
        numberInput('classSize', { ar: 'عدد طلاب الصف', en: 'Class size' }, 200, { min: 1, max: 100000, step: 1 }),
    ]),
    calculate(values, language) {
        if (!Number.isInteger(values.rank) || !Number.isInteger(values.classSize) || values.rank > values.classSize) {
            throw new Error(localized(language, 'أدخل ترتيبًا صحيحًا لا يتجاوز حجم الصف.', 'Enter an integer rank within the class size.'));
        }
        const percentile = ((values.classSize - values.rank + 1) / values.classSize) * 100;
        return result(`${format(percentile)}%`, localized(language, 'النسبة المئينية التقريبية', 'Approximate percentile'), localized(language, `ضمن أعلى ${format(100 - percentile + 100 / values.classSize)}%`, `Rank ${values.rank} of ${values.classSize}`));
    },
});

const studentStudyDefinitions = Object.freeze({
    [weightedCourseGrade.id]: weightedCourseGrade,
    [requiredFinalGrade.id]: requiredFinalGrade,
    [cumulativeGpa.id]: cumulativeGpa,
    [percentageToGpa.id]: percentageToGpa,
    [attendanceGoal.id]: attendanceGoal,
    [absenceAllowance.id]: absenceAllowance,
    [studyPlan.id]: studyPlan,
    [pomodoroPlanner.id]: pomodoroPlanner,
    [quizAverage.id]: quizAverage,
    [classRankPercentile.id]: classRankPercentile,
});

export { studentStudyDefinitions };

// END OF FILE
