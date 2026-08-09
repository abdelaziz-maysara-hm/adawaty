import { processMedia } from '../ffmpeg-processing.js';
import { renderImage } from '../image-processing.js';

const TARGETS = Object.freeze({
    jpg: Object.freeze({ mime: 'image/jpeg', label: 'JPG' }),
    png: Object.freeze({ mime: 'image/png', label: 'PNG' }),
});

const SOURCES = Object.freeze({
    avif: Object.freeze({ label: 'AVIF', accept: 'image/avif,.avif', engine: 'canvas' }),
    jfif: Object.freeze({ label: 'JFIF', accept: 'image/jpeg,.jfif,.jif,.jfi', engine: 'canvas' }),
    bmp: Object.freeze({ label: 'BMP', accept: 'image/bmp,image/x-ms-bmp,.bmp', engine: 'canvas' }),
    tiff: Object.freeze({ label: 'TIFF', accept: 'image/tiff,.tif,.tiff', engine: 'ffmpeg' }),
});

function localized(language, ar, en) { return language === 'ar' ? ar : en; }
function conversionKey(source, target) { return `${source}-to-${target}-converter`; }

function fileInput(source) {
    const info = SOURCES[source];
    return Object.freeze({
        id: 'image', type: 'file', accept: info.accept,
        label: Object.freeze({ ar: `اختر صورة ${info.label}`, en: `Choose a ${info.label} image` }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function qualityInput() {
    return Object.freeze({
        id: 'quality', type: 'number', min: 1, max: 100, step: 1, defaultValue: 90,
        label: Object.freeze({ ar: 'جودة JPG', en: 'JPG quality' }),
        unit: Object.freeze({ ar: '%', en: '%' }),
    });
}

function ffmpegImageArgs(target, quality = 90) {
    if (target === 'png') return Object.freeze(['-frames:v', '1', '-c:v', 'png']);
    const q = Math.max(2, Math.min(12, Math.round(13 - (Number(quality) || 90) / 9)));
    return Object.freeze(['-frames:v', '1', '-q:v', String(q)]);
}

function outputName(file, target) {
    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    return `adawaty-${base}.${target}`;
}

function definitionFor(source, target) {
    const from = SOURCES[source];
    const to = TARGETS[target];
    const id = conversionKey(source, target);
    return Object.freeze({
        id, category: 'image', icon: `${from.label}→${to.label}`,
        action: Object.freeze({ ar: `حوّل إلى ${to.label}`, en: `Convert to ${to.label}` }),
        title: Object.freeze({ ar: `تحويل ${from.label} إلى ${to.label}`, en: `${from.label} to ${to.label} Converter` }),
        description: Object.freeze({ ar: `حوّل صور ${from.label} إلى ${to.label} المتوافق داخل المتصفح دون رفع الملف.`, en: `Convert ${from.label} images to compatible ${to.label} in your browser without uploading the file.` }),
        note: Object.freeze({ ar: source === 'tiff' ? 'تُقرأ أول صفحة أو صورة من ملف TIFF باستخدام محرك الوسائط المحلي.' : 'تتم المعالجة محليًا باستخدام إمكانات الصور في المتصفح.', en: source === 'tiff' ? 'The first TIFF page or image is decoded by the local media engine.' : 'Processing stays local using the browser image engine.' }),
        tags: Object.freeze([source, target, `${from.label} to ${to.label}`, 'image converter', 'private', 'processing']),
        inputs: Object.freeze(target === 'jpg' ? [fileInput(source), qualityInput()] : [fileInput(source)]),
        async process(values, language) {
            const quality = Number(values.quality ?? 90);
            let blob;
            if (from.engine === 'ffmpeg') {
                blob = await processMedia(values.image, ffmpegImageArgs(target, quality), `converted.${target}`, to.mime);
            } else {
                const processed = await renderImage({
                    file: values.image, type: to.mime, quality: quality / 100,
                    background: target === 'jpg' ? '#ffffff' : '',
                });
                blob = processed.blob;
            }
            return {
                value: `${(blob.size / 1024).toFixed(1)} KB`,
                label: localized(language, `صورة ${to.label} جاهزة`, `${to.label} image is ready`),
                details: localized(language, 'تم التحويل محليًا على جهازك.', 'Converted locally on your device.'),
                preview: blob,
                download: { blob, filename: outputName(values.image, target) },
            };
        },
    });
}

const legacyImageConversionPairs = Object.freeze([
    Object.freeze(['avif', 'png']), Object.freeze(['jfif', 'jpg']),
    Object.freeze(['bmp', 'jpg']), Object.freeze(['bmp', 'png']),
    Object.freeze(['tiff', 'jpg']), Object.freeze(['tiff', 'png']),
]);

const legacyImageConverterDefinitions = Object.freeze(Object.fromEntries(
    legacyImageConversionPairs.map(([source, target]) => {
        const definition = definitionFor(source, target);
        return [definition.id, definition];
    }),
));

export { conversionKey, ffmpegImageArgs, legacyImageConversionPairs, legacyImageConverterDefinitions };

// END OF FILE
