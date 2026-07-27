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
        accept: 'image/jpeg,image/png,image/webp',
        label: Object.freeze({ ar: 'اختر صورة', en: 'Choose an image' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, ar, en, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 100,
        step: options.step ?? 1,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: '%', en: '%' }),
        placeholder: String(placeholder),
    });
}

function textInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
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

function outputType(file) {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        ? file.type
        : 'image/png';
}

function processedResult(processed, file, suffix, language, label) {
    const type = outputType(file);
    return {
        value: `${processed.width} × ${processed.height}`,
        label: localized(language, label.ar, label.en),
        details: `${(processed.blob.size / 1024).toFixed(1)} KB`,
        download: {
            blob: processed.blob,
            filename: outputName(file, suffix, type),
        },
        preview: processed.blob,
    };
}

const grayscale = Object.freeze({
    id: 'image-grayscale-converter',
    category: 'image',
    icon: 'B&W',
    action: Object.freeze({ ar: 'حوّل إلى أبيض وأسود', en: 'Convert to grayscale' }),
    title: Object.freeze({ ar: 'تحويل الصور إلى أبيض وأسود', en: 'Image to Grayscale' }),
    description: Object.freeze({
        ar: 'حوّل الصور الملونة إلى أبيض وأسود مع التحكم في قوة التأثير.',
        en: 'Turn color images into grayscale with adjustable effect strength.',
    }),
    note: Object.freeze({
        ar: 'المعاينة والملف الناتج يُنشآن على جهازك بدون رفع الصورة.',
        en: 'The preview and output are created on your device without uploading the image.',
    }),
    inputs: Object.freeze([
        fileInput(),
        numberInput('strength', 'قوة الأبيض والأسود', 'Grayscale strength', 100),
    ]),
    async process(values, language) {
        const processed = await renderImage({
            file: values.image,
            type: outputType(values.image),
            filter: `grayscale(${values.strength}%)`,
        });
        return processedResult(
            processed,
            values.image,
            'grayscale',
            language,
            { ar: 'الصورة بالأبيض والأسود جاهزة', en: 'Grayscale image is ready' },
        );
    },
});

const blur = Object.freeze({
    id: 'image-blur-tool',
    category: 'image',
    icon: 'BLUR',
    action: Object.freeze({ ar: 'طبّق التمويه', en: 'Apply blur' }),
    title: Object.freeze({ ar: 'تمويه الصور أونلاين', en: 'Online Image Blur Tool' }),
    description: Object.freeze({
        ar: 'طبّق تمويهًا ناعمًا على الصورة بالكامل مع تحديد قوة التأثير.',
        en: 'Apply a smooth full-image blur with adjustable intensity.',
    }),
    note: Object.freeze({
        ar: 'مفيد لإخفاء التفاصيل أو إعداد خلفيات ناعمة، وتتم المعالجة محليًا.',
        en: 'Useful for hiding details or creating soft backgrounds, with local processing.',
    }),
    inputs: Object.freeze([
        fileInput(),
        numberInput('radius', 'قوة التمويه', 'Blur radius', 8, {
            min: 1,
            max: 50,
            unit: { ar: 'بكسل', en: 'px' },
        }),
    ]),
    async process(values, language) {
        const processed = await renderImage({
            file: values.image,
            type: outputType(values.image),
            filter: `blur(${values.radius}px)`,
        });
        return processedResult(
            processed,
            values.image,
            'blurred',
            language,
            { ar: 'الصورة المموهة جاهزة', en: 'Blurred image is ready' },
        );
    },
});

const watermark = Object.freeze({
    id: 'image-watermark-tool',
    category: 'image',
    icon: '©',
    action: Object.freeze({ ar: 'أضف العلامة المائية', en: 'Add watermark' }),
    title: Object.freeze({ ar: 'إضافة علامة مائية للصور', en: 'Add Watermark to Image' }),
    description: Object.freeze({
        ar: 'أضف اسمك أو علامتك التجارية إلى الصورة واختر المكان والحجم والشفافية.',
        en: 'Add your name or brand to an image and choose its position, size and opacity.',
    }),
    note: Object.freeze({
        ar: 'اكتب اللون بصيغة HEX مثل #ffffff. لا تغادر الصورة جهازك.',
        en: 'Enter a HEX color such as #ffffff. Your image never leaves your device.',
    }),
    inputs: Object.freeze([
        fileInput(),
        textInput('text', 'نص العلامة المائية', 'Watermark text', 'Adawaty'),
        textInput('color', 'لون النص', 'Text color', '#ffffff'),
        numberInput('fontSize', 'حجم النص', 'Font size', 40, {
            min: 12,
            max: 300,
            unit: { ar: 'بكسل', en: 'px' },
        }),
        numberInput('opacity', 'الشفافية', 'Opacity', 70),
        selectInput('position', 'مكان العلامة', 'Watermark position', [
            { value: 'bottom-right', label: { ar: 'أسفل اليمين', en: 'Bottom right' } },
            { value: 'bottom-left', label: { ar: 'أسفل اليسار', en: 'Bottom left' } },
            { value: 'center', label: { ar: 'المنتصف', en: 'Center' } },
            { value: 'top-right', label: { ar: 'أعلى اليمين', en: 'Top right' } },
            { value: 'top-left', label: { ar: 'أعلى اليسار', en: 'Top left' } },
        ]),
    ]),
    async process(values, language) {
        if (!/^#[0-9a-f]{6}$/i.test(values.color.trim())) {
            throw new Error(localized(
                language,
                'اكتب اللون بصيغة صحيحة مثل #ffffff.',
                'Enter a valid color such as #ffffff.',
            ));
        }

        const processed = await renderImage({
            file: values.image,
            type: outputType(values.image),
            watermark: {
                text: values.text.trim(),
                color: values.color.trim(),
                fontSize: values.fontSize,
                opacity: values.opacity / 100,
                position: values.position,
            },
        });
        return processedResult(
            processed,
            values.image,
            'watermarked',
            language,
            { ar: 'الصورة بالعلامة المائية جاهزة', en: 'Watermarked image is ready' },
        );
    },
});

const imageEnhancementToolDefinitions = Object.freeze({
    [grayscale.id]: grayscale,
    [blur.id]: blur,
    [watermark.id]: watermark,
});

export { imageEnhancementToolDefinitions };

// END OF FILE
