import { outputName, renderImage } from '../image-processing.js';

const FORMAT = Object.freeze({
    jpg: Object.freeze({ mime: 'image/jpeg', extension: 'jpg', label: 'JPG' }),
    png: Object.freeze({ mime: 'image/png', extension: 'png', label: 'PNG' }),
    webp: Object.freeze({ mime: 'image/webp', extension: 'webp', label: 'WebP' }),
});

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function inputFor(format) {
    const info = FORMAT[format];
    return Object.freeze({
        id: 'image',
        type: 'file',
        accept: `${info.mime},.${info.extension}${format === 'jpg' ? ',.jpeg' : ''}`,
        label: Object.freeze({ ar: `اختر صورة ${info.label}`, en: `Choose a ${info.label} image` }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function qualityInput() {
    return Object.freeze({
        id: 'quality', type: 'number', min: 1, max: 100, step: 1, defaultValue: 90,
        label: Object.freeze({ ar: 'جودة الإخراج', en: 'Output quality' }),
        unit: Object.freeze({ ar: '%', en: '%' }),
    });
}

function conversionKey(source, target) {
    return `${source}-to-${target}-converter`;
}

function conversionDefinition(source, target) {
    const from = FORMAT[source];
    const to = FORMAT[target];
    const id = conversionKey(source, target);
    const lossy = target !== 'png';

    return Object.freeze({
        id,
        category: 'image',
        icon: `${from.label}→${to.label}`,
        action: Object.freeze({ ar: `حوّل إلى ${to.label}`, en: `Convert to ${to.label}` }),
        title: Object.freeze({ ar: `تحويل ${from.label} إلى ${to.label}`, en: `${from.label} to ${to.label} Converter` }),
        description: Object.freeze({
            ar: `حوّل صور ${from.label} إلى ${to.label} بسرعة داخل المتصفح مع الحفاظ على الأبعاد والخصوصية.`,
            en: `Convert ${from.label} images to ${to.label} quickly in your browser while preserving dimensions and privacy.`,
        }),
        note: Object.freeze({
            ar: target === 'jpg'
                ? 'تُستبدل المناطق الشفافة بخلفية بيضاء لأن JPG لا يدعم الشفافية.'
                : 'تتم المعالجة محليًا على جهازك ولا تُرفع الصورة إلى خادم.',
            en: target === 'jpg'
                ? 'Transparent areas are replaced with white because JPG does not support transparency.'
                : 'Processing stays on your device and the image is never uploaded.',
        }),
        tags: Object.freeze([source, target, `${from.label} to ${to.label}`, 'image converter', 'private', 'processing']),
        inputs: Object.freeze(lossy ? [inputFor(source), qualityInput()] : [inputFor(source)]),
        async process(values, language) {
            const processed = await renderImage({
                file: values.image,
                type: to.mime,
                quality: lossy ? Number(values.quality ?? 90) / 100 : 1,
                background: target === 'jpg' ? '#ffffff' : '',
            });
            return {
                value: `${processed.width} × ${processed.height}`,
                label: localized(language, `صورة ${to.label} جاهزة`, `${to.label} image is ready`),
                details: `${(processed.blob.size / 1024).toFixed(1)} KB`,
                preview: processed.blob,
                download: {
                    blob: processed.blob,
                    filename: outputName(values.image, 'converted', to.mime),
                },
            };
        },
    });
}

const conversionPairs = Object.freeze([
    Object.freeze(['png', 'jpg']),
    Object.freeze(['jpg', 'png']),
    Object.freeze(['webp', 'jpg']),
    Object.freeze(['webp', 'png']),
    Object.freeze(['png', 'webp']),
    Object.freeze(['jpg', 'webp']),
]);

const popularImageConverterDefinitions = Object.freeze(Object.fromEntries(
    conversionPairs.map(([source, target]) => {
        const definition = conversionDefinition(source, target);
        return [definition.id, definition];
    }),
));

export { conversionKey, conversionPairs, popularImageConverterDefinitions };

// END OF FILE
