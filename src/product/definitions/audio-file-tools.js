import {
    audioBufferToWavBlob,
    decodeAudioFile,
    formatAudioDuration,
    processAudioBuffer,
} from '../audio-processing.js';
import { processAudio } from '../ffmpeg-processing.js';

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

const AUDIO_FORMATS = Object.freeze({
    mp3: {
        ext: 'mp3',
        mime: 'audio/mpeg',
        args: ['-c:a', 'libmp3lame', '-b:a', '192k'],
        label: { ar: 'MP3', en: 'MP3' },
    },
    wav: {
        ext: 'wav',
        mime: 'audio/wav',
        args: ['-c:a', 'pcm_s16le'],
        label: { ar: 'WAV', en: 'WAV' },
    },
    ogg: {
        ext: 'ogg',
        mime: 'audio/ogg',
        args: ['-c:a', 'libvorbis', '-q:a', '5'],
        label: { ar: 'OGG (Vorbis)', en: 'OGG (Vorbis)' },
    },
    m4a: {
        ext: 'm4a',
        mime: 'audio/mp4',
        args: ['-c:a', 'aac', '-b:a', '192k'],
        label: { ar: 'M4A (AAC)', en: 'M4A (AAC)' },
    },
    aac: {
        ext: 'aac',
        mime: 'audio/aac',
        args: ['-c:a', 'aac', '-b:a', '192k'],
        label: { ar: 'AAC', en: 'AAC' },
    },
    flac: {
        ext: 'flac',
        mime: 'audio/flac',
        args: ['-c:a', 'flac'],
        label: { ar: 'FLAC', en: 'FLAC' },
    },
    opus: {
        ext: 'opus',
        mime: 'audio/opus',
        args: ['-c:a', 'libopus', '-b:a', '128k'],
        label: { ar: 'Opus', en: 'Opus' },
    },
    webm: {
        ext: 'webm',
        mime: 'audio/webm',
        args: ['-c:a', 'libopus', '-b:a', '128k'],
        label: { ar: 'WebM (Opus)', en: 'WebM (Opus)' },
    },
});

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

const audioFormatConverter = audioTool({
    id: 'audio-format-converter',
    icon: 'MP3↔WAV',
    action: Object.freeze({ ar: 'حوّل الصوت', en: 'Convert audio' }),
    title: Object.freeze({ ar: 'تحويل صيغ الملفات الصوتية', en: 'Audio Format Converter' }),
    description: Object.freeze({
        ar: 'حوّل أي ملف صوتي شائع إلى MP3 أو WAV أو OGG أو M4A أو AAC أو FLAC أو Opus أو WebM داخل المتصفح.',
        en: 'Convert any common audio file to MP3, WAV, OGG, M4A, AAC, FLAC, Opus or WebM in your browser.',
    }),
    note: Object.freeze({
        ar: 'المعالجة محلية بالكامل عبر محرك ffmpeg داخل المتصفح. التحميل الأول للمحرك قد يستغرق لحظات. الملفات الطويلة تحتاج ذاكرة أكبر.',
        en: 'Processing is fully local via the in-browser ffmpeg engine. The first engine load may take a moment. Long files need more memory.',
    }),
    inputs: Object.freeze([
        audioInput(),
        Object.freeze({
            id: 'format',
            type: 'select',
            label: Object.freeze({ ar: 'صيغة الإخراج', en: 'Output format' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze(Object.entries(AUDIO_FORMATS).map(([value, format]) => Object.freeze({
                value,
                label: Object.freeze(format.label),
            }))),
        }),
    ]),
    async process(values, language) {
        const format = AUDIO_FORMATS[values.format] ?? AUDIO_FORMATS.mp3;
        const blob = await processAudio(
            values.audio,
            format.args,
            `converted.${format.ext}`,
            format.mime,
        );
        const base = values.audio.name.replace(/\.[^.]+$/, '') || 'audio';
        return {
            value: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
            label: localized(language, 'الملف الصوتي المحوّل جاهز', 'Converted audio is ready'),
            details: localized(
                language,
                `الصيغة: ${format.label.ar} · تمت المعالجة محليًا.`,
                `Format: ${format.label.en} · Processed locally.`,
            ),
            download: {
                blob,
                filename: `adawaty-${base}.${format.ext}`,
            },
        };
    },
});

const audioFileToolDefinitions = Object.freeze({
    [audioTrimmer.id]: audioTrimmer,
    [volumeChanger.id]: volumeChanger,
    [fadeEditor.id]: fadeEditor,
    [monoConverter.id]: monoConverter,
    [audioFormatConverter.id]: audioFormatConverter,
});

export { audioFileToolDefinitions };

// END OF FILE
