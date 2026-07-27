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
        max: options.max ?? 200,
        step: options.step ?? 1,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '%', en: '%' }),
        placeholder: String(placeholder),
    });
}

function outputType(file) {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        ? file.type
        : 'image/png';
}

function result(processed, file, suffix, language, label) {
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

const colorAdjuster = Object.freeze({
    id: 'image-color-adjuster',
    category: 'image',
    icon: 'TUNE',
    action: Object.freeze({ ar: 'طبّق التعديلات', en: 'Apply adjustments' }),
    title: Object.freeze({ ar: 'ضبط ألوان وإضاءة الصور', en: 'Image Color Adjuster' }),
    description: Object.freeze({
        ar: 'تحكم في السطوع والتباين وتشبع الألوان، ثم نزّل الصورة المعدلة.',
        en: 'Control brightness, contrast and color saturation, then download the adjusted image.',
    }),
    note: Object.freeze({
        ar: 'القيمة 100% تعني الصورة الأصلية. تتم كل التعديلات داخل متصفحك.',
        en: 'A value of 100% keeps the original look. Every adjustment happens in your browser.',
    }),
    inputs: Object.freeze([
        fileInput(),
        numberInput('brightness', 'السطوع', 'Brightness', 100),
        numberInput('contrast', 'التباين', 'Contrast', 100),
        numberInput('saturation', 'تشبع الألوان', 'Saturation', 100),
    ]),
    async process(values, language) {
        const processed = await renderImage({
            file: values.image,
            type: outputType(values.image),
            filter: [
                `brightness(${values.brightness}%)`,
                `contrast(${values.contrast}%)`,
                `saturate(${values.saturation}%)`,
            ].join(' '),
        });
        return result(
            processed,
            values.image,
            'adjusted',
            language,
            { ar: 'الصورة المعدلة جاهزة', en: 'Adjusted image is ready' },
        );
    },
});

const sepia = Object.freeze({
    id: 'image-sepia-filter',
    category: 'image',
    icon: 'OLD',
    action: Object.freeze({ ar: 'طبّق تأثير سيبيا', en: 'Apply sepia' }),
    title: Object.freeze({ ar: 'تأثير سيبيا للصور', en: 'Sepia Image Filter' }),
    description: Object.freeze({
        ar: 'أضف تأثيرًا دافئًا كلاسيكيًا للصورة مع التحكم في قوة التأثير.',
        en: 'Add a warm vintage look with adjustable sepia strength.',
    }),
    note: Object.freeze({
        ar: 'تُعالج الصورة محليًا ولا تُرسل إلى الإنترنت.',
        en: 'The image is processed locally and is not sent over the internet.',
    }),
    inputs: Object.freeze([
        fileInput(),
        numberInput('strength', 'قوة التأثير', 'Effect strength', 80, {
            max: 100,
        }),
    ]),
    async process(values, language) {
        const processed = await renderImage({
            file: values.image,
            type: outputType(values.image),
            filter: `sepia(${values.strength}%)`,
        });
        return result(
            processed,
            values.image,
            'sepia',
            language,
            { ar: 'صورة سيبيا جاهزة', en: 'Sepia image is ready' },
        );
    },
});

const inverter = Object.freeze({
    id: 'image-color-inverter',
    category: 'image',
    icon: '±',
    action: Object.freeze({ ar: 'اعكس الألوان', en: 'Invert colors' }),
    title: Object.freeze({ ar: 'عكس ألوان الصور', en: 'Image Color Inverter' }),
    description: Object.freeze({
        ar: 'اعكس ألوان الصورة لإنشاء نسخة سالبة أو تأثير بصري مختلف.',
        en: 'Invert image colors to create a negative or a distinctive visual effect.',
    }),
    note: Object.freeze({
        ar: 'يمكنك اختيار عكس جزئي أو كامل، مع معالجة خاصة على جهازك.',
        en: 'Choose partial or full inversion with private on-device processing.',
    }),
    inputs: Object.freeze([
        fileInput(),
        numberInput('strength', 'نسبة عكس الألوان', 'Inversion strength', 100, {
            max: 100,
        }),
    ]),
    async process(values, language) {
        const processed = await renderImage({
            file: values.image,
            type: outputType(values.image),
            filter: `invert(${values.strength}%)`,
        });
        return result(
            processed,
            values.image,
            'inverted',
            language,
            { ar: 'الصورة المعكوسة جاهزة', en: 'Inverted image is ready' },
        );
    },
});

const imageFilterToolDefinitions = Object.freeze({
    [colorAdjuster.id]: colorAdjuster,
    [sepia.id]: sepia,
    [inverter.id]: inverter,
});

export { imageFilterToolDefinitions };

// END OF FILE
