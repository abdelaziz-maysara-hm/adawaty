import { processVideo } from '../ffmpeg-processing.js';

const FORMAT = Object.freeze({
    mp4: Object.freeze({ mime: 'video/mp4', label: 'MP4', accept: 'video/mp4,.mp4' }),
    mov: Object.freeze({ mime: 'video/quicktime', label: 'MOV', accept: 'video/quicktime,.mov' }),
    mkv: Object.freeze({ mime: 'video/x-matroska', label: 'MKV', accept: 'video/x-matroska,.mkv' }),
    avi: Object.freeze({ mime: 'video/x-msvideo', label: 'AVI', accept: 'video/x-msvideo,.avi' }),
    webm: Object.freeze({ mime: 'video/webm', label: 'WebM', accept: 'video/webm,.webm' }),
});

function localized(language, ar, en) { return language === 'ar' ? ar : en; }
function conversionKey(source, target) { return `${source}-to-${target}-converter`; }

function videoInput(format) {
    const info = FORMAT[format];
    return Object.freeze({
        id: 'video', type: 'file', accept: info.accept,
        label: Object.freeze({ ar: `اختر فيديو ${info.label}`, en: `Choose a ${info.label} video` }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function outputArgs(target) {
    return target === 'webm'
        ? Object.freeze(['-c:v', 'libvpx-vp9', '-crf', '32', '-b:v', '0', '-c:a', 'libopus'])
        : Object.freeze(['-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-movflags', '+faststart']);
}

function outputName(file, target) {
    const base = file.name.replace(/\.[^.]+$/, '') || 'video';
    return `adawaty-${base}.${target}`;
}

function conversionDefinition(source, target) {
    const from = FORMAT[source];
    const to = FORMAT[target];
    const id = conversionKey(source, target);
    return Object.freeze({
        id, category: 'video', icon: `${from.label}→${to.label}`,
        action: Object.freeze({ ar: `حوّل إلى ${to.label}`, en: `Convert to ${to.label}` }),
        title: Object.freeze({ ar: `تحويل ${from.label} إلى ${to.label}`, en: `${from.label} to ${to.label} Converter` }),
        description: Object.freeze({ ar: `حوّل فيديو ${from.label} إلى ${to.label} متوافق داخل المتصفح دون رفع الملف.`, en: `Convert ${from.label} video to compatible ${to.label} in your browser without uploading the file.` }),
        note: Object.freeze({ ar: 'تُعاد معالجة الفيديو محليًا للحفاظ على التوافق؛ الملفات الطويلة تحتاج وقتًا وذاكرة أكبر.', en: 'The video is re-encoded locally for compatibility; long files need more time and memory.' }),
        tags: Object.freeze([source, target, `${from.label} to ${to.label}`, 'video converter', 'private', 'processing']),
        inputs: Object.freeze([videoInput(source)]),
        async process(values, language) {
            const blob = await processVideo(values.video, outputArgs(target), `converted.${target}`, to.mime);
            return {
                value: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
                label: localized(language, `فيديو ${to.label} جاهز`, `${to.label} video is ready`),
                details: localized(language, 'تم التحويل محليًا على جهازك.', 'Converted locally on your device.'),
                download: { blob, filename: outputName(values.video, target) },
            };
        },
    });
}

const videoConversionPairs = Object.freeze([
    Object.freeze(['mov', 'mp4']), Object.freeze(['mkv', 'mp4']),
    Object.freeze(['avi', 'mp4']), Object.freeze(['webm', 'mp4']),
    Object.freeze(['mp4', 'webm']), Object.freeze(['mp4', 'mov']),
]);

const popularVideoConverterDefinitions = Object.freeze(Object.fromEntries(
    videoConversionPairs.map(([source, target]) => {
        const definition = conversionDefinition(source, target);
        return [definition.id, definition];
    }),
));

export { conversionKey, outputArgs, popularVideoConverterDefinitions, videoConversionPairs };

// END OF FILE
