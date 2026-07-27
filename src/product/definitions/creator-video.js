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
        category: 'video',
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

function gcd(a, b) {
    let first = Math.abs(Math.round(a));
    let second = Math.abs(Math.round(b));
    while (second) [first, second] = [second, first % second];
    return first || 1;
}

const fileSize = tool({
    id: 'video-file-size-calculator',
    icon: 'MB',
    title: { ar: 'حاسبة حجم ملف الفيديو', en: 'Video File Size Calculator' },
    description: { ar: 'قدّر حجم ملف الفيديو من معدل البت والمدة.', en: 'Estimate video file size from bitrate and duration.' },
    note: { ar: 'النتيجة لا تشمل اختلافات الحاوية أو البيانات الوصفية الصغيرة.', en: 'Does not include small container or metadata overhead.' },
    inputs: [
        field('bitrate', 'معدل البت', 'Bitrate', 8, { min: 0.001, unit: { ar: 'ميجابت/ث', en: 'Mbps' } }),
        field('minutes', 'الدقائق', 'Minutes', 10, { step: 1 }),
        field('seconds', 'الثواني', 'Seconds', 0, { max: 59, step: 1 }),
    ],
    calculate(values, language) {
        const totalSeconds = values.minutes * 60 + values.seconds;
        const megabytes = values.bitrate * totalSeconds / 8;
        return output(amount(megabytes, 'MB'), localized(language, 'حجم الملف التقريبي', 'Estimated file size'), amount(megabytes / 1024, 'GB'));
    },
});

const bitrate = tool({
    id: 'video-bitrate-calculator',
    icon: 'Mbps',
    title: { ar: 'حاسبة معدل بت الفيديو', en: 'Video Bitrate Calculator' },
    description: { ar: 'احسب متوسط معدل البت من حجم الملف ومدة الفيديو.', en: 'Calculate average bitrate from file size and video duration.' },
    note: { ar: 'أدخل حجم الملف بالميجابايت.', en: 'Enter file size in megabytes.' },
    inputs: [
        field('size', 'حجم الملف', 'File size', 600, { min: 0.001, unit: { ar: 'ميجابايت', en: 'MB' } }),
        field('minutes', 'الدقائق', 'Minutes', 10, { step: 1 }),
        field('seconds', 'الثواني', 'Seconds', 0, { max: 59, step: 1 }),
    ],
    calculate(values, language) {
        const duration = values.minutes * 60 + values.seconds;
        if (duration === 0) throw new Error(localized(language, 'مدة الفيديو تساوي صفرًا.', 'Video duration is zero.'));
        return output(amount(values.size * 8 / duration, 'Mbps'), localized(language, 'متوسط معدل البت', 'Average bitrate'));
    },
});

const watchTime = tool({
    id: 'video-watch-time-calculator',
    icon: 'WATCH',
    title: { ar: 'حاسبة وقت مشاهدة الفيديو', en: 'Video Watch Time Calculator' },
    description: { ar: 'احسب إجمالي ساعات المشاهدة من المشاهدات ومتوسط مدتها.', en: 'Calculate total watch hours from views and average view duration.' },
    note: { ar: 'استخدم متوسط مدة المشاهدة بالدقائق.', en: 'Use average view duration in minutes.' },
    inputs: [
        field('views', 'عدد المشاهدات', 'Views', 100000, { step: 1 }),
        field('averageMinutes', 'متوسط دقائق المشاهدة', 'Average view minutes', 4, { min: 0 }),
    ],
    calculate: (values, language) => output(amount(values.views * values.averageMinutes / 60, 'hours'), localized(language, 'ساعات المشاهدة', 'Watch hours')),
});

const averageDuration = tool({
    id: 'average-view-duration-calculator',
    icon: 'AVD',
    title: { ar: 'حاسبة متوسط مدة المشاهدة', en: 'Average View Duration Calculator' },
    description: { ar: 'احسب متوسط وقت المشاهدة لكل مشاهدة.', en: 'Calculate average watch time per view.' },
    note: { ar: 'أدخل إجمالي وقت المشاهدة بالدقائق.', en: 'Enter total watch time in minutes.' },
    inputs: [
        field('watchMinutes', 'إجمالي دقائق المشاهدة', 'Total watch minutes', 400000),
        field('views', 'عدد المشاهدات', 'Views', 100000, { min: 1, step: 1 }),
    ],
    calculate: (values, language) => output(amount(values.watchMinutes / values.views, 'minutes'), localized(language, 'متوسط مدة المشاهدة', 'Average view duration')),
});

const retention = tool({
    id: 'video-audience-retention-calculator',
    icon: 'RET',
    title: { ar: 'حاسبة الاحتفاظ بجمهور الفيديو', en: 'Video Audience Retention Calculator' },
    description: { ar: 'احسب نسبة متوسط المشاهدة إلى مدة الفيديو الكاملة.', en: 'Calculate average viewing time as a percentage of full video length.' },
    note: { ar: 'يجب ألا يتجاوز متوسط المشاهدة مدة الفيديو عادةً.', en: 'Average view duration normally should not exceed video length.' },
    inputs: [
        field('averageMinutes', 'متوسط دقائق المشاهدة', 'Average view minutes', 4),
        field('videoMinutes', 'مدة الفيديو', 'Video length', 10, { min: 0.001 }),
    ],
    calculate: (values, language) => output(`${amount(values.averageMinutes / values.videoMinutes * 100)}%`, localized(language, 'نسبة الاحتفاظ', 'Audience retention')),
});

const subscriberGrowth = tool({
    id: 'subscriber-growth-rate-calculator',
    icon: 'SUB',
    title: { ar: 'حاسبة نمو المشتركين', en: 'Subscriber Growth Rate Calculator' },
    description: { ar: 'احسب نسبة نمو عدد المشتركين خلال فترة.', en: 'Calculate subscriber growth percentage over a period.' },
    note: { ar: 'تُقاس الزيادة مقارنة بعدد بداية الفترة.', en: 'Growth is measured against the starting count.' },
    inputs: [
        field('start', 'مشتركو بداية الفترة', 'Starting subscribers', 10000, { min: 1, step: 1 }),
        field('end', 'مشتركو نهاية الفترة', 'Ending subscribers', 12500, { step: 1 }),
    ],
    calculate: (values, language) => output(`${amount((values.end - values.start) / values.start * 100)}%`, localized(language, 'معدل النمو', 'Growth rate')),
});

const sponsorship = tool({
    id: 'video-sponsorship-cpm-calculator',
    icon: 'SPON',
    title: { ar: 'حاسبة سعر رعاية الفيديو', en: 'Video Sponsorship CPM Calculator' },
    description: { ar: 'قدّر قيمة الرعاية من المشاهدات المتوقعة وسعر الألف.', en: 'Estimate sponsorship value from expected views and CPM.' },
    note: { ar: 'القيمة الفعلية تختلف حسب الجمهور والتخصص والتفاعل.', en: 'Actual rates vary by audience, niche and engagement.' },
    inputs: [
        field('views', 'المشاهدات المتوقعة', 'Expected views', 100000, { step: 1 }),
        field('cpm', 'سعر الألف مشاهدة', 'Sponsorship CPM', 25),
    ],
    calculate: (values, language) => output(amount(values.views / 1000 * values.cpm), localized(language, 'قيمة الرعاية التقديرية', 'Estimated sponsorship value')),
});

const aspectRatio = tool({
    id: 'video-aspect-ratio-calculator',
    icon: '16:9',
    title: { ar: 'حاسبة نسبة أبعاد الفيديو', en: 'Video Aspect Ratio Calculator' },
    description: { ar: 'بسّط نسبة عرض الفيديو إلى ارتفاعه.', en: 'Simplify video width-to-height aspect ratio.' },
    note: { ar: 'أدخل أبعادًا صحيحة بالبكسل.', en: 'Enter integer pixel dimensions.' },
    inputs: [
        field('width', 'العرض', 'Width', 1920, { min: 1, step: 1, unit: { ar: 'بكسل', en: 'px' } }),
        field('height', 'الارتفاع', 'Height', 1080, { min: 1, step: 1, unit: { ar: 'بكسل', en: 'px' } }),
    ],
    calculate(values, language) {
        if (!Number.isInteger(values.width) || !Number.isInteger(values.height)) throw new Error(localized(language, 'الأبعاد يجب أن تكون صحيحة.', 'Dimensions must be integers.'));
        const divisor = gcd(values.width, values.height);
        return output(`${values.width / divisor}:${values.height / divisor}`, localized(language, 'نسبة الأبعاد', 'Aspect ratio'));
    },
});

const resolutionScale = tool({
    id: 'video-resolution-scale-calculator',
    icon: '↗PX',
    title: { ar: 'حاسبة تغيير دقة الفيديو', en: 'Video Resolution Scale Calculator' },
    description: { ar: 'احسب الارتفاع المناسب لعرض جديد مع الحفاظ على النسبة.', en: 'Calculate matching height for a new width while preserving aspect ratio.' },
    note: { ar: 'تُقرب النتيجة إلى أقرب بكسل.', en: 'The result is rounded to the nearest pixel.' },
    inputs: [
        field('originalWidth', 'العرض الأصلي', 'Original width', 1920, { min: 1, step: 1 }),
        field('originalHeight', 'الارتفاع الأصلي', 'Original height', 1080, { min: 1, step: 1 }),
        field('targetWidth', 'العرض الجديد', 'Target width', 1280, { min: 1, step: 1 }),
    ],
    calculate(values, language) {
        const height = Math.round(values.targetWidth * values.originalHeight / values.originalWidth);
        return output(`${Math.round(values.targetWidth)} × ${height}`, localized(language, 'الدقة الجديدة', 'Scaled resolution'));
    },
});

const streamingBandwidth = tool({
    id: 'live-stream-bandwidth-calculator',
    icon: 'LIVE',
    title: { ar: 'حاسبة نطاق البث المباشر', en: 'Live Stream Bandwidth Calculator' },
    description: { ar: 'قدّر إجمالي النطاق المطلوب لتوصيل بث لعدد من المشاهدين.', en: 'Estimate aggregate bandwidth needed to serve concurrent viewers.' },
    note: { ar: 'هذه تكلفة توزيع إجمالية وليست سرعة رفع المذيع فقط.', en: 'This is aggregate delivery bandwidth, not only broadcaster upload speed.' },
    inputs: [
        field('viewers', 'المشاهدون المتزامنون', 'Concurrent viewers', 1000, { step: 1 }),
        field('bitrate', 'معدل بت المشاهد', 'Bitrate per viewer', 6, { min: 0.001, unit: { ar: 'ميجابت/ث', en: 'Mbps' } }),
        field('overhead', 'هامش البروتوكول', 'Protocol overhead', 10, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate(values, language) {
        const megabits = values.viewers * values.bitrate * (1 + values.overhead / 100);
        return output(amount(megabits / 1000, 'Gbps'), localized(language, 'النطاق الإجمالي', 'Aggregate bandwidth'), amount(megabits, 'Mbps'));
    },
});

const creatorVideoDefinitions = Object.freeze({
    [fileSize.id]: fileSize,
    [bitrate.id]: bitrate,
    [watchTime.id]: watchTime,
    [averageDuration.id]: averageDuration,
    [retention.id]: retention,
    [subscriberGrowth.id]: subscriberGrowth,
    [sponsorship.id]: sponsorship,
    [aspectRatio.id]: aspectRatio,
    [resolutionScale.id]: resolutionScale,
    [streamingBandwidth.id]: streamingBandwidth,
});

export { creatorVideoDefinitions };

// END OF FILE
