import {
    inspectImage,
    outputName,
    renderImage,
} from '../image-processing.js';

const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
let zipPromise;

function loadZip() {
    zipPromise ??= import(JSZIP_URL).then((module) => module.default);
    return zipPromise;
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map(([value, arLabel, enLabel]) => Object.freeze({
            value,
            label: Object.freeze({ ar: arLabel, en: enLabel }),
        }))),
    });
}

function outputType(format, originalType) {
    if (format === 'original') {
        return ['image/jpeg', 'image/png', 'image/webp'].includes(originalType)
            ? originalType
            : 'image/png';
    }
    return `image/${format}`;
}

const batchProcessor = Object.freeze({
    id: 'image-batch-processor',
    category: 'image',
    icon: 'IMG×',
    action: Object.freeze({ ar: 'عالج الصور دفعة واحدة', en: 'Process image batch' }),
    title: Object.freeze({ ar: 'معالجة صور جماعية متعددة العمليات', en: 'Batch Image Multi-Tool' }),
    description: Object.freeze({
        ar: 'طبّق تغيير المقاس والصيغة والجودة والألوان والتدوير على عدة صور في عملية واحدة.',
        en: 'Resize, convert, compress, adjust colors and rotate multiple images in one operation.',
    }),
    note: Object.freeze({
        ar: 'تتم كل العمليات داخل متصفحك ثم تُجمع النتائج في ملف ZIP واحد. لا تُرفع الصور إلى خادم.',
        en: 'Every operation runs in your browser and results are bundled into one ZIP. Images are never uploaded.',
    }),
    inputs: Object.freeze([
        Object.freeze({
            id: 'images',
            type: 'file',
            accept: 'image/jpeg,image/png,image/webp',
            multiple: true,
            label: Object.freeze({ ar: 'اختر الصور', en: 'Choose images' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
        Object.freeze({
            id: 'maxWidth',
            type: 'number',
            min: 0,
            max: 12000,
            step: 1,
            placeholder: '0',
            label: Object.freeze({ ar: 'أقصى عرض (0 للحجم الأصلي)', en: 'Maximum width (0 keeps original)' }),
            unit: Object.freeze({ ar: 'بكسل', en: 'px' }),
        }),
        selectInput('format', 'صيغة الإخراج', 'Output format', [
            ['original', 'نفس الصيغة', 'Keep original'],
            ['webp', 'WebP', 'WebP'],
            ['jpeg', 'JPG', 'JPG'],
            ['png', 'PNG', 'PNG'],
        ]),
        Object.freeze({
            id: 'quality',
            type: 'number',
            min: 1,
            max: 100,
            step: 1,
            placeholder: '85',
            label: Object.freeze({ ar: 'الجودة', en: 'Quality' }),
            unit: Object.freeze({ ar: '%', en: '%' }),
        }),
        Object.freeze({
            id: 'brightness',
            type: 'number',
            min: 25,
            max: 200,
            step: 1,
            placeholder: '100',
            label: Object.freeze({ ar: 'السطوع', en: 'Brightness' }),
            unit: Object.freeze({ ar: '%', en: '%' }),
        }),
        Object.freeze({
            id: 'contrast',
            type: 'number',
            min: 25,
            max: 200,
            step: 1,
            placeholder: '100',
            label: Object.freeze({ ar: 'التباين', en: 'Contrast' }),
            unit: Object.freeze({ ar: '%', en: '%' }),
        }),
        Object.freeze({
            id: 'saturation',
            type: 'number',
            min: 0,
            max: 200,
            step: 1,
            placeholder: '100',
            label: Object.freeze({ ar: 'التشبع', en: 'Saturation' }),
            unit: Object.freeze({ ar: '%', en: '%' }),
        }),
        selectInput('grayscale', 'أبيض وأسود', 'Grayscale', [
            ['no', 'لا', 'No'],
            ['yes', 'نعم', 'Yes'],
        ]),
        selectInput('rotation', 'التدوير', 'Rotation', [
            ['0', 'بدون تدوير', 'No rotation'],
            ['90', '90 درجة', '90 degrees'],
            ['180', '180 درجة', '180 degrees'],
            ['270', '270 درجة', '270 degrees'],
        ]),
    ]),
    async process(values, language) {
        if (!Array.isArray(values.images) || values.images.length === 0) {
            throw new Error(localized(language, 'اختر صورة واحدة على الأقل.', 'Choose at least one image.'));
        }
        if (values.images.length > 30) {
            throw new Error(localized(language, 'الحد الأقصى 30 صورة في الدفعة.', 'The batch limit is 30 images.'));
        }

        const JSZip = await loadZip();
        const zip = new JSZip();
        let totalOutputSize = 0;
        for (const file of values.images) {
            const type = outputType(values.format, file.type);
            let dimensions = {};
            if (values.maxWidth > 0) {
                const original = await inspectImage(file);
                const scale = Math.min(1, values.maxWidth / original.width);
                dimensions = {
                    width: Math.round(original.width * scale),
                    height: Math.round(original.height * scale),
                };
            }
            const filters = [
                `brightness(${values.brightness}%)`,
                `contrast(${values.contrast}%)`,
                `saturate(${values.saturation}%)`,
                values.grayscale === 'yes' ? 'grayscale(100%)' : '',
            ].filter(Boolean).join(' ');
            const processed = await renderImage({
                file,
                ...dimensions,
                type,
                quality: values.quality / 100,
                rotation: Number(values.rotation),
                filter: filters,
            });
            totalOutputSize += processed.blob.size;
            zip.file(outputName(file, 'processed', type), processed.blob);
        }

        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        });
        return {
            value: localized(language, `${values.images.length} صورة`, `${values.images.length} images`),
            label: localized(language, 'اكتملت المعالجة الجماعية', 'Batch processing complete'),
            details: localized(
                language,
                `حجم الصور الناتجة ${(totalOutputSize / 1024 / 1024).toFixed(2)} MB`,
                `Processed images total ${(totalOutputSize / 1024 / 1024).toFixed(2)} MB`,
            ),
            download: { blob, filename: 'adawaty-processed-images.zip' },
        };
    },
});

const imageBatchToolDefinitions = Object.freeze({
    [batchProcessor.id]: batchProcessor,
});

export { imageBatchToolDefinitions, loadZip };

// END OF FILE
