import { processAudio } from '../ffmpeg-processing.js';

const FORMAT = Object.freeze({
    mp3: Object.freeze({ mime: 'audio/mpeg', label: 'MP3', accept: 'audio/mpeg,.mp3' }),
    wav: Object.freeze({ mime: 'audio/wav', label: 'WAV', accept: 'audio/wav,.wav' }),
    m4a: Object.freeze({ mime: 'audio/mp4', label: 'M4A', accept: 'audio/mp4,audio/x-m4a,.m4a' }),
    flac: Object.freeze({ mime: 'audio/flac', label: 'FLAC', accept: 'audio/flac,.flac' }),
    ogg: Object.freeze({ mime: 'audio/ogg', label: 'OGG', accept: 'audio/ogg,.ogg,.oga' }),
    opus: Object.freeze({ mime: 'audio/opus', label: 'OPUS', accept: 'audio/opus,audio/ogg,.opus' }),
});

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function conversionKey(source, target) {
    return `${source}-to-${target}-converter`;
}

function fileInput(format) {
    const info = FORMAT[format];
    return Object.freeze({
        id: 'audio', type: 'file', accept: info.accept,
        label: Object.freeze({ ar: `اختر ملف ${info.label}`, en: `Choose a ${info.label} file` }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function bitrateInput() {
    return Object.freeze({
        id: 'bitrate', type: 'select',
        label: Object.freeze({ ar: 'جودة MP3', en: 'MP3 quality' }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze([
            Object.freeze({ value: '128k', label: Object.freeze({ ar: 'صغير — 128 kbps', en: 'Small — 128 kbps' }) }),
            Object.freeze({ value: '192k', label: Object.freeze({ ar: 'متوازن — 192 kbps', en: 'Balanced — 192 kbps' }) }),
            Object.freeze({ value: '320k', label: Object.freeze({ ar: 'عالي — 320 kbps', en: 'High — 320 kbps' }) }),
        ]),
    });
}

function safeBitrate(value) {
    return ['128k', '192k', '320k'].includes(value) ? value : '192k';
}

function outputName(file, target) {
    const base = file.name.replace(/\.[^.]+$/, '') || 'audio';
    return `adawaty-${base}.${target}`;
}

function conversionDefinition(source, target) {
    const from = FORMAT[source];
    const to = FORMAT[target];
    const toMp3 = target === 'mp3';
    const id = conversionKey(source, target);

    return Object.freeze({
        id,
        category: 'audio',
        icon: `${from.label}→${to.label}`,
        action: Object.freeze({ ar: `حوّل إلى ${to.label}`, en: `Convert to ${to.label}` }),
        title: Object.freeze({ ar: `تحويل ${from.label} إلى ${to.label}`, en: `${from.label} to ${to.label} Converter` }),
        description: Object.freeze({
            ar: `حوّل ملفات ${from.label} إلى ${to.label} داخل المتصفح دون رفع التسجيل إلى الإنترنت.`,
            en: `Convert ${from.label} files to ${to.label} in your browser without uploading the recording.`,
        }),
        note: Object.freeze({
            ar: toMp3
                ? 'اختر جودة MP3 المناسبة؛ الجودة الأعلى تنتج ملفًا أكبر.'
                : 'WAV غير مضغوط ومناسب للتحرير، ولذلك قد يكون أكبر كثيرًا من MP3.',
            en: toMp3
                ? 'Choose the MP3 quality you need; higher quality creates a larger file.'
                : 'WAV is uncompressed and editing-friendly, so it can be much larger than MP3.',
        }),
        tags: Object.freeze([source, target, `${from.label} to ${to.label}`, 'audio converter', 'private', 'processing']),
        inputs: Object.freeze(toMp3 ? [fileInput(source), bitrateInput()] : [fileInput(source)]),
        async process(values, language) {
            const args = toMp3
                ? ['-c:a', 'libmp3lame', '-b:a', safeBitrate(values.bitrate)]
                : ['-c:a', 'pcm_s16le'];
            const blob = await processAudio(values.audio, args, `converted.${target}`, to.mime);
            return {
                value: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
                label: localized(language, `ملف ${to.label} جاهز`, `${to.label} file is ready`),
                details: localized(language, 'تم التحويل محليًا على جهازك.', 'Converted locally on your device.'),
                download: { blob, filename: outputName(values.audio, target) },
            };
        },
    });
}

const audioConversionPairs = Object.freeze([
    Object.freeze(['wav', 'mp3']),
    Object.freeze(['mp3', 'wav']),
    Object.freeze(['m4a', 'mp3']),
    Object.freeze(['flac', 'mp3']),
    Object.freeze(['ogg', 'mp3']),
    Object.freeze(['opus', 'mp3']),
]);

const popularAudioConverterDefinitions = Object.freeze(Object.fromEntries(
    audioConversionPairs.map(([source, target]) => {
        const definition = conversionDefinition(source, target);
        return [definition.id, definition];
    }),
));

export { audioConversionPairs, conversionKey, popularAudioConverterDefinitions, safeBitrate };

// END OF FILE
