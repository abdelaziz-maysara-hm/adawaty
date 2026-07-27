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
        category: 'audio',
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

function durationSeconds(minutes, seconds, language) {
    const duration = minutes * 60 + seconds;
    if (duration <= 0) throw new Error(localized(language, 'المدة تساوي صفرًا.', 'Duration is zero.'));
    return duration;
}

const compressedSize = tool({
    id: 'compressed-audio-file-size-calculator',
    icon: 'MP3',
    title: { ar: 'حاسبة حجم ملف الصوت المضغوط', en: 'Compressed Audio File Size Calculator' },
    description: { ar: 'قدّر حجم ملف MP3 أو AAC من معدل البت والمدة.', en: 'Estimate MP3 or AAC file size from bitrate and duration.' },
    note: { ar: 'النتيجة تقريبية ولا تشمل بيانات الحاوية الصغيرة.', en: 'The estimate excludes small container metadata overhead.' },
    inputs: [
        field('bitrate', 'معدل البت', 'Bitrate', 320, { min: 1, unit: { ar: 'كيلوبت/ث', en: 'kbps' } }),
        field('minutes', 'الدقائق', 'Minutes', 5, { step: 1 }),
        field('seconds', 'الثواني', 'Seconds', 0, { max: 59, step: 1 }),
    ],
    calculate(values, language) {
        const seconds = durationSeconds(values.minutes, values.seconds, language);
        return output(amount(values.bitrate * seconds / 8000, 'MB'), localized(language, 'حجم الملف التقريبي', 'Estimated file size'));
    },
});

const pcmSize = tool({
    id: 'uncompressed-audio-size-calculator',
    icon: 'WAV',
    title: { ar: 'حاسبة حجم الصوت غير المضغوط', en: 'Uncompressed Audio Size Calculator' },
    description: { ar: 'احسب حجم PCM/WAV من معدل العينة وعمق البت والقنوات.', en: 'Calculate PCM/WAV size from sample rate, bit depth and channels.' },
    note: { ar: 'تستخدم النتيجة ميجابايت عشرية.', en: 'The result uses decimal megabytes.' },
    inputs: [
        field('sampleRate', 'معدل العينة', 'Sample rate', 48000, { min: 1, step: 1, unit: { ar: 'هرتز', en: 'Hz' } }),
        field('bitDepth', 'عمق البت', 'Bit depth', 24, { min: 1, step: 1, unit: { ar: 'بت', en: 'bit' } }),
        field('channels', 'عدد القنوات', 'Channels', 2, { min: 1, max: 64, step: 1 }),
        field('minutes', 'الدقائق', 'Minutes', 5, { step: 1 }),
        field('seconds', 'الثواني', 'Seconds', 0, { max: 59, step: 1 }),
    ],
    calculate(values, language) {
        const seconds = durationSeconds(values.minutes, values.seconds, language);
        const megabytes = values.sampleRate * values.bitDepth * values.channels * seconds / 8 / 1e6;
        return output(amount(megabytes, 'MB'), localized(language, 'حجم PCM', 'PCM size'), amount(megabytes / 1000, 'GB'));
    },
});

const audioBitrate = tool({
    id: 'audio-bitrate-calculator',
    icon: 'kbps',
    title: { ar: 'حاسبة معدل بت الصوت', en: 'Audio Bitrate Calculator' },
    description: { ar: 'احسب متوسط معدل البت من حجم ملف الصوت ومدته.', en: 'Calculate average bitrate from audio file size and duration.' },
    note: { ar: 'أدخل حجم الملف بالميجابايت.', en: 'Enter file size in megabytes.' },
    inputs: [
        field('size', 'حجم الملف', 'File size', 12, { min: 0.001, unit: { ar: 'ميجابايت', en: 'MB' } }),
        field('minutes', 'الدقائق', 'Minutes', 5, { step: 1 }),
        field('seconds', 'الثواني', 'Seconds', 0, { max: 59, step: 1 }),
    ],
    calculate(values, language) {
        const seconds = durationSeconds(values.minutes, values.seconds, language);
        return output(amount(values.size * 8000 / seconds, 'kbps'), localized(language, 'متوسط معدل البت', 'Average bitrate'));
    },
});

const sampleCount = tool({
    id: 'audio-sample-count-calculator',
    icon: 'ΣS',
    title: { ar: 'حاسبة عدد عينات الصوت', en: 'Audio Sample Count Calculator' },
    description: { ar: 'احسب عدد العينات الإجمالي من معدل العينة والمدة والقنوات.', en: 'Calculate total samples from sample rate, duration and channels.' },
    note: { ar: 'يعرض الإجمالي عبر جميع القنوات.', en: 'Shows the total across all channels.' },
    inputs: [
        field('sampleRate', 'معدل العينة', 'Sample rate', 48000, { min: 1, step: 1, unit: { ar: 'هرتز', en: 'Hz' } }),
        field('channels', 'عدد القنوات', 'Channels', 2, { min: 1, max: 64, step: 1 }),
        field('minutes', 'الدقائق', 'Minutes', 1, { step: 1 }),
        field('seconds', 'الثواني', 'Seconds', 0, { max: 59, step: 1 }),
    ],
    calculate(values, language) {
        const seconds = durationSeconds(values.minutes, values.seconds, language);
        return output(amount(Math.round(values.sampleRate * seconds * values.channels)), localized(language, 'إجمالي العينات', 'Total samples'));
    },
});

const beatDuration = tool({
    id: 'bpm-beat-duration-calculator',
    icon: 'BPM',
    title: { ar: 'حاسبة مدة النبضة من BPM', en: 'BPM Beat Duration Calculator' },
    description: { ar: 'حوّل الإيقاع بالدقيقة إلى مدة النبضة بالمللي ثانية.', en: 'Convert tempo in BPM to beat duration in milliseconds.' },
    note: { ar: 'النتيجة الأساسية لنبضة ربع النوتة.', en: 'The primary result is for a quarter-note beat.' },
    inputs: [field('bpm', 'الإيقاع', 'Tempo', 120, { min: 1, unit: { ar: 'نبضة/د', en: 'BPM' } })],
    calculate(values, language) {
        const quarter = 60000 / values.bpm;
        return output(amount(quarter, 'ms'), localized(language, 'مدة ربع النوتة', 'Quarter-note duration'), `${localized(language, 'نصف نوتة', 'Half note')}: ${amount(quarter * 2, 'ms')}`);
    },
});

const delayTime = tool({
    id: 'music-delay-time-calculator',
    icon: 'DELAY',
    title: { ar: 'حاسبة زمن التأخير الموسيقي', en: 'Music Delay Time Calculator' },
    description: { ar: 'احسب أزمنة التأخير المتزامنة مع إيقاع المقطوعة.', en: 'Calculate delay times synchronized to a song tempo.' },
    note: { ar: 'يعرض أزمنة النوتة الكاملة والنصف والربع والثمن.', en: 'Shows whole, half, quarter and eighth-note times.' },
    inputs: [field('bpm', 'الإيقاع', 'Tempo', 120, { min: 1, unit: { ar: 'نبضة/د', en: 'BPM' } })],
    calculate(values, language) {
        const quarter = 60000 / values.bpm;
        return output(
            `${localized(language, 'كاملة', 'Whole')}: ${amount(quarter * 4, 'ms')}\n${localized(language, 'نصف', 'Half')}: ${amount(quarter * 2, 'ms')}\n${localized(language, 'ربع', 'Quarter')}: ${amount(quarter, 'ms')}\n${localized(language, 'ثمن', 'Eighth')}: ${amount(quarter / 2, 'ms')}`,
            localized(language, 'أزمنة التأخير', 'Delay times'),
        );
    },
});

const pitchShift = tool({
    id: 'semitone-frequency-calculator',
    icon: '♬',
    title: { ar: 'حاسبة التردد بعد تغيير الطبقة', en: 'Semitone Frequency Calculator' },
    description: { ar: 'احسب التردد بعد نقل نغمة بعدد من أنصاف الدرجات.', en: 'Calculate frequency after shifting a pitch by semitones.' },
    note: { ar: 'كل 12 نصف درجة تضاعف التردد أو تنصفه.', en: 'Every 12 semitones doubles or halves frequency.' },
    inputs: [
        field('frequency', 'التردد الأصلي', 'Original frequency', 440, { min: 0.0001, unit: { ar: 'هرتز', en: 'Hz' } }),
        field('semitones', 'أنصاف الدرجات', 'Semitones', 12, { min: -120, max: 120, step: 1 }),
    ],
    calculate: (values, language) => output(amount(values.frequency * 2 ** (values.semitones / 12), 'Hz'), localized(language, 'التردد الجديد', 'Shifted frequency')),
});

const decibelRatio = tool({
    id: 'decibel-amplitude-ratio-calculator',
    icon: 'dB',
    title: { ar: 'حاسبة نسبة السعة بالديسيبل', en: 'Decibel Amplitude Ratio Calculator' },
    description: { ar: 'حوّل نسبة سعتين إلى فرق بالديسيبل.', en: 'Convert an amplitude ratio to a decibel difference.' },
    note: { ar: 'تستخدم الأداة 20 log₁₀(A₂/A₁).', en: 'Uses 20 log₁₀(A₂/A₁).' },
    inputs: [
        field('reference', 'السعة المرجعية', 'Reference amplitude', 1, { min: 0.000000001 }),
        field('measured', 'السعة المقاسة', 'Measured amplitude', 2, { min: 0.000000001 }),
    ],
    calculate: (values, language) => output(amount(20 * Math.log10(values.measured / values.reference), 'dB'), localized(language, 'فرق السعة', 'Amplitude difference')),
});

const podcastRevenue = tool({
    id: 'podcast-ad-revenue-calculator',
    icon: 'POD',
    title: { ar: 'حاسبة إيراد إعلانات البودكاست', en: 'Podcast Ad Revenue Calculator' },
    description: { ar: 'قدّر إيراد الحلقة من التنزيلات وسعر الألف وعدد الإعلانات.', en: 'Estimate episode ad revenue from downloads, CPM and ad slots.' },
    note: { ar: 'الإيراد الفعلي يعتمد على نسبة الملء وشروط الرعاية.', en: 'Actual revenue depends on fill rate and sponsorship terms.' },
    inputs: [
        field('downloads', 'تنزيلات الحلقة', 'Episode downloads', 20000, { step: 1 }),
        field('cpm', 'سعر الألف تنزيل', 'CPM', 25),
        field('slots', 'عدد الإعلانات', 'Ad slots', 2, { step: 1 }),
        field('fillRate', 'نسبة الملء', 'Fill rate', 100, { max: 100, unit: { ar: '%', en: '%' } }),
    ],
    calculate: (values, language) => output(amount(values.downloads / 1000 * values.cpm * values.slots * values.fillRate / 100), localized(language, 'الإيراد التقديري', 'Estimated revenue')),
});

const transcription = tool({
    id: 'audio-transcription-time-calculator',
    icon: 'TXT',
    title: { ar: 'حاسبة وقت تفريغ الصوت', en: 'Audio Transcription Time Calculator' },
    description: { ar: 'قدّر وقت العمل المطلوب لتفريغ وتحرير تسجيل صوتي.', en: 'Estimate work time needed to transcribe and edit audio.' },
    note: { ar: 'أدخل معامل العمل؛ 4 يعني أربع دقائق عمل لكل دقيقة صوت.', en: 'Enter a work factor; 4 means four work minutes per audio minute.' },
    inputs: [
        field('audioMinutes', 'مدة الصوت', 'Audio duration', 60, { min: 0.01, unit: { ar: 'دقيقة', en: 'minutes' } }),
        field('workFactor', 'معامل وقت العمل', 'Work-time factor', 4, { min: 0.1 }),
    ],
    calculate(values, language) {
        const workMinutes = values.audioMinutes * values.workFactor;
        return output(amount(workMinutes / 60, 'hours'), localized(language, 'وقت العمل التقديري', 'Estimated work time'), amount(workMinutes, 'minutes'));
    },
});

const audioPodcastDefinitions = Object.freeze({
    [compressedSize.id]: compressedSize,
    [pcmSize.id]: pcmSize,
    [audioBitrate.id]: audioBitrate,
    [sampleCount.id]: sampleCount,
    [beatDuration.id]: beatDuration,
    [delayTime.id]: delayTime,
    [pitchShift.id]: pitchShift,
    [decibelRatio.id]: decibelRatio,
    [podcastRevenue.id]: podcastRevenue,
    [transcription.id]: transcription,
});

export { audioPodcastDefinitions };

// END OF FILE
