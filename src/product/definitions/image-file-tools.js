import {
    outputName,
    renderImage,
} from '../image-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput() {
    return Object.freeze({
        id: 'image',
        type: 'file',
        accept: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp',
        label: Object.freeze({ ar: 'اختر صورة', en: 'Choose an image' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, ar, en, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 100_000,
        step: options.step ?? 1,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze(option))),
    });
}

function processedResult(blob, filename, dimensions, language, label) {
    const saved = dimensions.originalSize > 0
        ? (1 - blob.size / dimensions.originalSize) * 100
        : 0;
    return {
        value: `${dimensions.width} × ${dimensions.height}`,
        label: localized(language, label.ar, label.en),
        details: `${(blob.size / 1024).toFixed(1)} KB · ${localized(language, 'التغيير في الحجم', 'Size change')}: ${saved.toFixed(1)}%`,
        download: { blob, filename },
        preview: blob,
    };
}

const compressor = Object.freeze({
    id: 'image-compressor',
    category: 'image',
    icon: 'IMG',
    action: Object.freeze({ ar: 'اضغط الصورة', en: 'Compress image' }),
    title: Object.freeze({ ar: 'ضغط الصور أونلاين', en: 'Online Image Compressor' }),
    description: Object.freeze({ ar: 'اضغط صور JPG وWebP محليًا داخل متصفحك ثم نزّل النسخة الناتجة.', en: 'Compress JPG and WebP images locally in your browser and download the result.' }),
    note: Object.freeze({ ar: 'لا تُرفع الصورة إلى أي خادم. PNG تنسيق غير فقدي؛ استخدم محول الصور إلى WebP أو JPG لتقليل أكبر.', en: 'Your image is never uploaded. PNG is lossless; convert to WebP or JPG for larger reductions.' }),
    inputs: Object.freeze([
        fileInput(),
        numberInput('quality', 'جودة الصورة', 'Image quality', 75, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    async process(values, language) {
        const type = values.image.type === 'image/png'
            ? 'image/png'
            : values.image.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        const processed = await renderImage({
            file: values.image,
            type,
            quality: values.quality / 100,
        });
        return processedResult(
            processed.blob,
            outputName(values.image, 'compressed', type),
            { ...processed, originalSize: values.image.size },
            language,
            { ar: 'الصورة المضغوطة جاهزة', en: 'Compressed image is ready' },
        );
    },
});

const resizer = Object.freeze({
    id: 'image-resizer',
    category: 'image',
    icon: 'SIZE',
    action: Object.freeze({ ar: 'غيّر المقاس', en: 'Resize image' }),
    title: Object.freeze({ ar: 'تغيير مقاس الصورة', en: 'Image Resizer' }),
    description: Object.freeze({ ar: 'غيّر عرض الصورة مع الحفاظ تلقائيًا على نسبة الأبعاد.', en: 'Resize image width while automatically preserving its aspect ratio.' }),
    note: Object.freeze({ ar: 'تتم المعالجة على جهازك ولا تُرفع الصورة إلى الإنترنت.', en: 'Processing happens on your device and the image is not uploaded.' }),
    inputs: Object.freeze([
        fileInput(),
        numberInput('width', 'العرض الجديد', 'New width', 1200, { min: 1, unit: { ar: 'بكسل', en: 'px' } }),
        numberInput('quality', 'جودة الإخراج', 'Output quality', 90, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    async process(values, language) {
        const probe = await createImageBitmap(values.image);
        const height = values.width * probe.height / probe.width;
        probe.close();
        const type = values.image.type === 'image/png'
            ? 'image/png'
            : values.image.type === 'image/webp' ? 'image/webp' : 'image/jpeg';
        const processed = await renderImage({
            file: values.image,
            width: values.width,
            height,
            type,
            quality: values.quality / 100,
        });
        return processedResult(
            processed.blob,
            outputName(values.image, 'resized', type),
            { ...processed, originalSize: values.image.size },
            language,
            { ar: 'الصورة بالمقاس الجديد جاهزة', en: 'Resized image is ready' },
        );
    },
});

const converter = Object.freeze({
    id: 'image-format-converter',
    category: 'image',
    icon: '↔',
    action: Object.freeze({ ar: 'حوّل الصورة', en: 'Convert image' }),
    title: Object.freeze({ ar: 'تحويل صيغ الصور', en: 'Image Format Converter' }),
    description: Object.freeze({
        ar: 'حوّل الصور بين JPG وPNG وWebP وGIF وBMP داخل المتصفح.',
        en: 'Convert images between JPG, PNG, WebP, GIF and BMP directly in your browser.',
    }),
    note: Object.freeze({
        ar: 'عند التحويل إلى JPG تُضاف خلفية بيضاء للمناطق الشفافة. GIF وBMP يُحفظان كإطار واحد (بدون حركة).',
        en: 'Transparent areas receive a white background when converting to JPG. GIF and BMP are saved as a single frame (no animation).',
    }),
    inputs: Object.freeze([
        fileInput(),
        selectInput('type', 'صيغة الإخراج', 'Output format', [
            { value: 'image/webp', label: { ar: 'WebP', en: 'WebP' } },
            { value: 'image/jpeg', label: { ar: 'JPG', en: 'JPG' } },
            { value: 'image/png', label: { ar: 'PNG', en: 'PNG' } },
            { value: 'image/gif', label: { ar: 'GIF', en: 'GIF' } },
            { value: 'image/bmp', label: { ar: 'BMP', en: 'BMP' } },
        ]),
        numberInput('quality', 'جودة الإخراج', 'Output quality', 90, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    async process(values, language) {
        const needsWhiteBg = values.type === 'image/jpeg' || values.type === 'image/bmp';
        const processed = await renderImage({
            file: values.image,
            type: values.type,
            quality: values.quality / 100,
            background: needsWhiteBg ? '#ffffff' : '',
        });
        return processedResult(
            processed.blob,
            outputName(values.image, 'converted', values.type),
            { ...processed, originalSize: values.image.size },
            language,
            { ar: 'الصورة المحوّلة جاهزة', en: 'Converted image is ready' },
        );
    },
});

const imageFileToolDefinitions = Object.freeze({
    [compressor.id]: compressor,
    [resizer.id]: resizer,
    [converter.id]: converter,
});

export { imageFileToolDefinitions };

// END OF FILE
