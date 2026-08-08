import {
    applyDynamicsProcessing,
    applyEqualizer,
    applyNoiseGate,
    audioBufferToWavBlob,
    decodeAudioFile,
} from '../audio-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function audioInput() {
    return Object.freeze({
        id: 'audio',
        type: 'file',
        accept: 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,audio/x-m4a,audio/aac,audio/flac,audio/opus,.mp3,.wav,.ogg,.m4a,.aac,.flac,.opus,.webm',
        label: Object.freeze({ ar: 'اختر ملفًا صوتيًا', en: 'Choose audio file' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, ar, en, placeholder, min, max, unit = '') {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 0.5,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: unit, en: unit }),
        placeholder: String(placeholder),
    });
}

function wavResult(audioBuffer, filename, language, labels) {
    return {
        value: `${audioBuffer.duration.toFixed(1)} ${localized(language, 'ثانية', 'sec')}`,
        label: localized(language, labels.ar, labels.en),
        details: '',
        download: { blob: audioBufferToWavBlob(audioBuffer), filename },
    };
}

function audioTool(config) {
    return Object.freeze({
        category: 'audio',
        ...config,
    });
}

const audioEqualizer = audioTool({
    id: 'audio-equalizer',
    icon: 'EQ',
    action: Object.freeze({ ar: 'طبّق الإيكولايزر', en: 'Apply equalizer' }),
    title: Object.freeze({ ar: 'إيكولايزر الصوت (Bass/Treble)', en: 'Audio Equalizer (Bass/Treble)' }),
    description: Object.freeze({
        ar: 'اضبط قوة الطبقات المنخفضة (Bass) والعالية (Treble) في تسجيل صوتي بشكل مستقل، مفيد لتحسين وضوح الصوت أو تعويض ميكروفون ضعيف.',
        en: 'Independently adjust the low (bass) and high (treble) frequency levels in a recording, useful for improving clarity or compensating for a weak microphone.',
    }),
    note: Object.freeze({
        ar: 'استخدم قيمًا موجبة للتقوية وسالبة للتخفيف. القيم الكبيرة جدًا قد تُدخل تشويهًا (Clipping)، فابدأ بقيم معتدلة.',
        en: 'Use positive values to boost, negative to cut. Very large values may introduce clipping distortion, so start with moderate values.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('bass', 'مستوى الطبقات المنخفضة (Bass)', 'Bass level', 6, -24, 24, 'dB'),
        numberInput('treble', 'مستوى الطبقات العالية (Treble)', 'Treble level', 3, -24, 24, 'dB'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        const result = applyEqualizer(source, values.bass, values.treble);

        return wavResult(
            result,
            'adawaty-equalized-audio.wav',
            language,
            { ar: 'الصوت المُعدّل جاهز', en: 'The equalized audio is ready' },
        );
    },
});

const audioCompressor = audioTool({
    id: 'audio-compressor-dynamics',
    icon: 'COMP',
    action: Object.freeze({ ar: 'اضغط النطاق الديناميكي', en: 'Compress dynamics' }),
    title: Object.freeze({ ar: 'ضاغط النطاق الديناميكي للصوت', en: 'Audio Dynamics Compressor' }),
    description: Object.freeze({
        ar: 'قلّل الفرق بين أعلى وأضعف أجزاء التسجيل بتقليل قوة الأجزاء العالية فوق حد معيّن، مفيد لتوحيد مستوى الصوت في تسجيلات المحادثة أو البودكاست.',
        en: 'Reduce the gap between the loudest and quietest parts of a recording by taming levels above a threshold, useful for evening out speech or podcast recordings.',
    }),
    note: Object.freeze({
        ar: 'نسبة الضغط الأعلى (زي 8:1) بتقلل الأجزاء العالية بشكل أقوى. للحصول على سقف صوتي صارم استخدم أداة المحدد (Limiter) بدل كده.',
        en: 'A higher ratio (like 8:1) tames loud parts more aggressively. For a strict volume ceiling, use the Limiter tool instead.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('threshold', 'حد البدء (Threshold)', 'Threshold', -18, -60, 0, 'dB'),
        numberInput('ratio', 'نسبة الضغط (Ratio)', 'Compression ratio', 4, 1, 20, ':1'),
        numberInput('makeupGain', 'تعويض المستوى (Makeup Gain)', 'Makeup gain', 0, 0, 24, 'dB'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        const result = applyDynamicsProcessing(source, values.threshold, values.ratio, values.makeupGain);

        return wavResult(
            result,
            'adawaty-compressed-audio.wav',
            language,
            { ar: 'الصوت المضغوط ديناميكيًا جاهز', en: 'The dynamics-compressed audio is ready' },
        );
    },
});

const audioLimiter = audioTool({
    id: 'audio-limiter',
    icon: 'LIM',
    action: Object.freeze({ ar: 'حدّد السقف الصوتي', en: 'Limit peak level' }),
    title: Object.freeze({ ar: 'محدّد الذروة الصوتية (Limiter)', en: 'Audio Peak Limiter' }),
    description: Object.freeze({
        ar: 'امنع أي جزء من التسجيل من تجاوز سقف صوتي محدد، لتجنب التشويه (Clipping) عند رفع مستوى الصوت الإجمالي لاحقًا.',
        en: 'Prevent any part of a recording from exceeding a set ceiling, avoiding clipping distortion when the overall volume is raised afterward.',
    }),
    note: Object.freeze({
        ar: 'هذه أداة ضغط بنسبة صارمة جدًا (تقريبًا سقف صلب)؛ لتحكم أدق في النطاق الديناميكي استخدم أداة الضاغط بدل كده.',
        en: 'This uses a very strict compression ratio (near-hard ceiling); for finer dynamic range control, use the Compressor tool instead.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('ceiling', 'السقف الصوتي (Ceiling)', 'Ceiling', -1, -12, 0, 'dB'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        const result = applyDynamicsProcessing(source, values.ceiling, 20, 0);

        return wavResult(
            result,
            'adawaty-limited-audio.wav',
            language,
            { ar: 'الصوت بعد التحديد جاهز', en: 'The limited audio is ready' },
        );
    },
});

const audioNoiseGate = audioTool({
    id: 'audio-noise-gate',
    icon: 'GATE',
    action: Object.freeze({ ar: 'أزل الضوضاء الخافتة', en: 'Remove faint noise' }),
    title: Object.freeze({ ar: 'بوابة الضوضاء (Noise Gate)', en: 'Audio Noise Gate' }),
    description: Object.freeze({
        ar: 'أسكت تلقائيًا أي جزء من التسجيل أضعف من حد معيّن، مفيد لإزالة ضوضاء خلفية ثابتة (مروحة، هسهسة الميكروفون) في فترات الصمت.',
        en: 'Automatically silences any part of a recording quieter than a set threshold, useful for removing steady background noise (a fan, mic hiss) during silent gaps.',
    }),
    note: Object.freeze({
        ar: 'حد أعلى (زي -20dB) بيسكت أجزاء أكتر؛ لو الصوت الأساسي بيتقطع، قلّل الحد (زي -40dB).',
        en: 'A higher threshold (like -20dB) silences more; if the main voice gets cut off, lower the threshold (like -40dB).',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('threshold', 'حد البوابة (Threshold)', 'Gate threshold', -35, -60, -10, 'dB'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        const result = applyNoiseGate(source, values.threshold);

        return wavResult(
            result,
            'adawaty-gated-audio.wav',
            language,
            { ar: 'الصوت بعد إزالة الضوضاء الخافتة جاهز', en: 'The noise-gated audio is ready' },
        );
    },
});

const audioFilterToolDefinitions = Object.freeze({
    [audioEqualizer.id]: audioEqualizer,
    [audioCompressor.id]: audioCompressor,
    [audioLimiter.id]: audioLimiter,
    [audioNoiseGate.id]: audioNoiseGate,
});

export { audioFilterToolDefinitions };

// END OF FILE
