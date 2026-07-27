import {
    audioBufferToWavBlob,
    decodeAudioFile,
    formatAudioDuration,
    processAudioBuffer,
} from '../audio-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function audioInput() {
    return Object.freeze({
        id: 'audio',
        type: 'file',
        accept: 'audio/mpeg,audio/wav,audio/ogg,audio/mp4,audio/webm,audio/x-m4a',
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
        step: 0.1,
        placeholder: String(placeholder),
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: unit, en: unit }),
    });
}

function audioTool(config) {
    return Object.freeze({
        category: 'audio',
        ...config,
    });
}

function wavResult(buffer, filename, language, label) {
    const blob = audioBufferToWavBlob(buffer);
    const channels = buffer.numberOfChannels;

    return {
        value: formatAudioDuration(buffer.duration),
        label: localized(language, label.ar, label.en),
        details: localized(
            language,
            `${buffer.sampleRate} هرتز · ${channels === 1 ? 'أحادي' : 'ستيريو'} · ${(blob.size / 1024 / 1024).toFixed(1)} ميجابايت`,
            `${buffer.sampleRate} Hz · ${channels === 1 ? 'Mono' : 'Stereo'} · ${(blob.size / 1024 / 1024).toFixed(1)} MB`,
        ),
        download: { blob, filename },
    };
}

const audioTrimmer = audioTool({
    id: 'audio-trimmer',
    icon: 'CUT',
    action: Object.freeze({ ar: 'قص الصوت', en: 'Trim audio' }),
    title: Object.freeze({ ar: 'قص الملفات الصوتية', en: 'Audio Trimmer' }),
    description: Object.freeze({
        ar: 'حدد وقت البداية والنهاية واستخرج الجزء المطلوب من التسجيل كملف WAV.',
        en: 'Choose start and end times and export the selected audio segment as WAV.',
    }),
    note: Object.freeze({
        ar: 'تتم المعالجة على جهازك، ويجب ألا يتجاوز وقت النهاية مدة الملف.',
        en: 'Processing stays on your device. The end time must not exceed the file duration.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('start', 'وقت البداية', 'Start time', 0, 0, 86400, 'sec'),
        numberInput('end', 'وقت النهاية', 'End time', 30, 0.1, 86400, 'sec'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);

        if (values.end <= values.start) {
            throw new Error(localized(
                language,
                'يجب أن يكون وقت النهاية بعد وقت البداية.',
                'End time must be after start time.',
            ));
        }
        if (values.end > source.duration + 0.01) {
            throw new Error(localized(
                language,
                `مدة الملف ${source.duration.toFixed(1)} ثانية فقط.`,
                `The file is only ${source.duration.toFixed(1)} seconds long.`,
            ));
        }

        return wavResult(
            processAudioBuffer(source, {
                startSeconds: values.start,
                endSeconds: values.end,
            }),
            'adawaty-trimmed-audio.wav',
            language,
            { ar: 'المقطع الصوتي جاهز', en: 'Trimmed audio is ready' },
        );
    },
});

const volumeChanger = audioTool({
    id: 'audio-volume-changer',
    icon: 'VOL',
    action: Object.freeze({ ar: 'غيّر الصوت', en: 'Change volume' }),
    title: Object.freeze({ ar: 'رفع وخفض صوت الملف', en: 'Audio Volume Changer' }),
    description: Object.freeze({
        ar: 'ارفع أو اخفض مستوى صوت التسجيل بنسبة محددة ثم نزّل النتيجة بصيغة WAV.',
        en: 'Increase or reduce recording volume by a chosen percentage and export WAV.',
    }),
    note: Object.freeze({
        ar: 'قد تسبب النسب المرتفعة جدًا تشوهًا إذا كان التسجيل الأصلي مرتفعًا.',
        en: 'Very high gain can distort audio that is already loud.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('volume', 'مستوى الصوت', 'Volume level', 120, 0, 300, '%'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        return wavResult(
            processAudioBuffer(source, { gain: values.volume / 100 }),
            'adawaty-volume-adjusted.wav',
            language,
            { ar: 'الصوت المعدّل جاهز', en: 'Adjusted audio is ready' },
        );
    },
});

const fadeEditor = audioTool({
    id: 'audio-fade-in-out-editor',
    icon: 'FADE',
    action: Object.freeze({ ar: 'طبّق التدرج', en: 'Apply fades' }),
    title: Object.freeze({ ar: 'إضافة Fade In وFade Out للصوت', en: 'Audio Fade In & Fade Out' }),
    description: Object.freeze({
        ar: 'أضف دخولًا وخروجًا تدريجيًا للصوت لتنعيم بداية التسجيل ونهايته.',
        en: 'Add gradual fade-in and fade-out effects for smoother audio starts and endings.',
    }),
    note: Object.freeze({
        ar: 'إذا تجاوزت مدة التدرج مدة الملف فسيتم دمج التأثيرين تلقائيًا.',
        en: 'If fade durations overlap, both envelopes are blended automatically.',
    }),
    inputs: Object.freeze([
        audioInput(),
        numberInput('fadeIn', 'مدة Fade In', 'Fade-in duration', 2, 0, 600, 'sec'),
        numberInput('fadeOut', 'مدة Fade Out', 'Fade-out duration', 2, 0, 600, 'sec'),
    ]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        return wavResult(
            processAudioBuffer(source, {
                fadeInSeconds: values.fadeIn,
                fadeOutSeconds: values.fadeOut,
            }),
            'adawaty-faded-audio.wav',
            language,
            { ar: 'الصوت المتدرج جاهز', en: 'Faded audio is ready' },
        );
    },
});

const monoConverter = audioTool({
    id: 'stereo-to-mono-converter',
    icon: 'MONO',
    action: Object.freeze({ ar: 'حوّل إلى Mono', en: 'Convert to mono' }),
    title: Object.freeze({ ar: 'تحويل Stereo إلى Mono', en: 'Stereo to Mono Converter' }),
    description: Object.freeze({
        ar: 'ادمج قناتي الصوت في قناة Mono واحدة لتقليل الحجم وتحسين توافق التسجيلات الصوتية.',
        en: 'Mix stereo channels into one mono channel for smaller, voice-friendly audio.',
    }),
    note: Object.freeze({
        ar: 'يتم مزج جميع القنوات بالتساوي داخل المتصفح دون رفع الملف.',
        en: 'All channels are mixed evenly in the browser without uploading the file.',
    }),
    inputs: Object.freeze([audioInput()]),
    async process(values, language) {
        const source = await decodeAudioFile(values.audio);
        return wavResult(
            processAudioBuffer(source, { channelMode: 'mono' }),
            'adawaty-mono-audio.wav',
            language,
            { ar: 'ملف Mono جاهز', en: 'Mono audio is ready' },
        );
    },
});

const audioFileToolDefinitions = Object.freeze({
    [audioTrimmer.id]: audioTrimmer,
    [volumeChanger.id]: volumeChanger,
    [fadeEditor.id]: fadeEditor,
    [monoConverter.id]: monoConverter,
});

export { audioFileToolDefinitions };

// END OF FILE
