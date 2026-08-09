import { canvasToBlob } from '../image-processing.js';
import { loadZip } from './image-batch-tools.js';

const POWERPOINT_ACCEPT = 'application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx';
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function compressionSettings(level) {
    const settings = Object.freeze({
        light: Object.freeze({ maximumDimension: 2560, jpegQuality: 0.86 }),
        balanced: Object.freeze({ maximumDimension: 1920, jpegQuality: 0.76 }),
        strong: Object.freeze({ maximumDimension: 1280, jpegQuality: 0.62 }),
    });
    return settings[level] ?? settings.balanced;
}

function fittedDimensions(width, height, maximumDimension) {
    const largest = Math.max(width, height);
    if (!Number.isFinite(largest) || largest <= 0 || largest <= maximumDimension) {
        return Object.freeze({ width, height });
    }
    const scale = maximumDimension / largest;
    return Object.freeze({
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    });
}

function mediaMime(path) {
    const extension = path.split('.').pop()?.toLowerCase();
    return Object.freeze({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' })[extension];
}

async function compressImageEntry(entry, mime, settings) {
    if (typeof createImageBitmap !== 'function') return undefined;
    const original = await entry.async('blob');
    const bitmap = await createImageBitmap(original);
    try {
        const dimensions = fittedDimensions(bitmap.width, bitmap.height, settings.maximumDimension);
        const canvas = document.createElement('canvas');
        canvas.width = dimensions.width;
        canvas.height = dimensions.height;
        const context = canvas.getContext('2d', { alpha: mime === 'image/png' });
        if (!context) return undefined;
        if (mime === 'image/jpeg') {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        const compressed = await canvasToBlob(canvas, mime, mime === 'image/jpeg' ? settings.jpegQuality : undefined);
        return compressed.size < original.size ? compressed : undefined;
    } finally {
        bitmap.close?.();
    }
}

const powerpointCompressor = Object.freeze({
    id: 'powerpoint-compressor',
    category: 'converter',
    icon: 'PPT↓',
    action: Object.freeze({ ar: 'اضغط العرض', en: 'Compress presentation' }),
    title: Object.freeze({ ar: 'ضغط ملف PowerPoint', en: 'Compress PowerPoint File' }),
    description: Object.freeze({
        ar: 'قلّل حجم ملف PPTX فعليًا عبر ضغط الصور الكبيرة داخله وإعادة ضغط حزمة العرض، دون رفع الملف إلى خادم.',
        en: 'Reduce a PPTX file size by recompressing large embedded images and the presentation package without uploading it.',
    }),
    note: Object.freeze({
        ar: 'يعمل محليًا ويدعم PPTX. الصور JPEG وPNG تُصغّر عند الحاجة؛ لا تتغير النصوص أو الشرائح، لكن الضغط القوي قد يقلل دقة الصور.',
        en: 'Runs locally and supports PPTX. JPEG and PNG images are resized when useful; text and slides stay intact, while strong compression can reduce image detail.',
    }),
    tags: Object.freeze(['powerpoint', 'pptx', 'compress', 'reduce size', 'presentation', 'office', 'processing']),
    inputs: Object.freeze([
        Object.freeze({
            id: 'powerpoint',
            type: 'file',
            accept: POWERPOINT_ACCEPT,
            label: Object.freeze({ ar: 'اختر ملف PowerPoint ‏(PPTX)', en: 'Choose a PowerPoint file (PPTX)' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
        Object.freeze({
            id: 'level',
            type: 'select',
            label: Object.freeze({ ar: 'مستوى الضغط', en: 'Compression level' }),
            unit: Object.freeze({ ar: '', en: '' }),
            defaultValue: 'balanced',
            options: Object.freeze([
                Object.freeze({ value: 'light', label: Object.freeze({ ar: 'خفيف — جودة أعلى', en: 'Light — higher quality' }) }),
                Object.freeze({ value: 'balanced', label: Object.freeze({ ar: 'متوازن', en: 'Balanced' }) }),
                Object.freeze({ value: 'strong', label: Object.freeze({ ar: 'قوي — حجم أصغر', en: 'Strong — smaller file' }) }),
            ]),
        }),
    ]),
    async process(values, language) {
        if (!(values.powerpoint instanceof File) || !/\.pptx$/i.test(values.powerpoint.name)) {
            throw new Error(localized(language, 'اختر ملف PPTX صالحًا.', 'Choose a valid PPTX file.'));
        }
        try {
            const JSZip = await loadZip();
            const zip = await JSZip.loadAsync(await values.powerpoint.arrayBuffer());
            const settings = compressionSettings(values.level);
            const mediaEntries = Object.values(zip.files).filter((entry) => !entry.dir && /^ppt\/media\//i.test(entry.name) && mediaMime(entry.name));
            let changedImages = 0;
            let bytesSavedInImages = 0;

            for (const entry of mediaEntries) {
                const originalSize = (await entry.async('uint8array')).byteLength;
                const compressed = await compressImageEntry(entry, mediaMime(entry.name), settings);
                if (compressed) {
                    zip.file(entry.name, compressed, { binary: true });
                    changedImages += 1;
                    bytesSavedInImages += originalSize - compressed.size;
                }
            }

            const output = await zip.generateAsync({
                type: 'blob',
                mimeType: PPTX_MIME,
                compression: 'DEFLATE',
                compressionOptions: { level: values.level === 'strong' ? 9 : 7 },
            });
            const saved = Math.max(0, values.powerpoint.size - output.size);
            const reduction = values.powerpoint.size ? (saved / values.powerpoint.size) * 100 : 0;
            const baseName = values.powerpoint.name.replace(/\.pptx$/i, '') || 'presentation';
            return {
                value: saved > 0
                    ? localized(language, `أصغر بنسبة ${reduction.toFixed(1)}%`, `${reduction.toFixed(1)}% smaller`)
                    : localized(language, 'الحجم محسّن بالفعل', 'Already size-optimized'),
                label: localized(language, 'ملف PowerPoint المضغوط جاهز', 'Compressed PowerPoint is ready'),
                details: localized(
                    language,
                    `${changedImages} صورة ضُغطت · وُفّر ${(Math.max(saved, bytesSavedInImages) / 1024).toFixed(1)} KB`,
                    `${changedImages} images recompressed · ${(Math.max(saved, bytesSavedInImages) / 1024).toFixed(1)} KB saved`,
                ),
                download: { blob: output, filename: `${baseName}-compressed.pptx` },
            };
        } catch (error) {
            throw new Error(localized(
                language,
                'تعذّر ضغط العرض. جرّب ملف PPTX صالحًا وغير محمي.',
                'Unable to compress the presentation. Try a valid, unprotected PPTX file.',
            ), { cause: error });
        }
    },
});

const powerpointCompressorToolDefinitions = Object.freeze({
    [powerpointCompressor.id]: powerpointCompressor,
});

export { compressionSettings, fittedDimensions, mediaMime, powerpointCompressorToolDefinitions };

// END OF FILE
