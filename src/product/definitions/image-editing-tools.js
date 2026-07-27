import {
    inspectImage,
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
        max: options.max ?? 100_000,
        step: options.step ?? 1,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: 'بكسل', en: 'px' }),
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

function outputType(file) {
    return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        ? file.type
        : 'image/png';
}

function result(blob, filename, width, height, language, label) {
    return {
        value: `${width} × ${height}`,
        label: localized(language, label.ar, label.en),
        details: `${(blob.size / 1024).toFixed(1)} KB`,
        download: { blob, filename },
        preview: blob,
    };
}

const cropper = Object.freeze({
    id: 'image-cropper',
    category: 'image',
    icon: 'CROP',
    action: Object.freeze({ ar: 'اقتص الصورة', en: 'Crop image' }),
    title: Object.freeze({ ar: 'قص الصور أونلاين', en: 'Online Image Cropper' }),
    description: Object.freeze({
        ar: 'حدد موضع وأبعاد الجزء المطلوب، ثم نزّل الصورة المقصوصة فورًا.',
        en: 'Choose the position and size, then download the cropped image instantly.',
    }),
    note: Object.freeze({
        ar: 'القيم بالبكسل وتبدأ نقطة القص من أعلى يسار الصورة. تتم المعالجة بالكامل على جهازك.',
        en: 'Values are in pixels from the top-left corner. Processing stays entirely on your device.',
    }),
    inputs: Object.freeze([
        fileInput(),
        numberInput('x', 'البداية الأفقية', 'Left position', 0),
        numberInput('y', 'البداية الرأسية', 'Top position', 0),
        numberInput('width', 'عرض القص', 'Crop width', 800, { min: 1 }),
        numberInput('height', 'ارتفاع القص', 'Crop height', 600, { min: 1 }),
    ]),
    async process(values, language) {
        const dimensions = await inspectImage(values.image);

        if (
            values.x + values.width > dimensions.width
            || values.y + values.height > dimensions.height
        ) {
            throw new Error(localized(
                language,
                `منطقة القص تتجاوز أبعاد الصورة (${dimensions.width} × ${dimensions.height}).`,
                `The crop exceeds the image dimensions (${dimensions.width} × ${dimensions.height}).`,
            ));
        }

        const type = outputType(values.image);
        const processed = await renderImage({
            file: values.image,
            width: values.width,
            height: values.height,
            type,
            source: {
                x: values.x,
                y: values.y,
                width: values.width,
                height: values.height,
            },
        });
        return result(
            processed.blob,
            outputName(values.image, 'cropped', type),
            processed.width,
            processed.height,
            language,
            { ar: 'الصورة المقصوصة جاهزة', en: 'Cropped image is ready' },
        );
    },
});

const rotator = Object.freeze({
    id: 'image-rotate-flip',
    category: 'image',
    icon: '↻',
    action: Object.freeze({ ar: 'طبّق التدوير', en: 'Apply transform' }),
    title: Object.freeze({ ar: 'تدوير وقلب الصور', en: 'Rotate and Flip Image' }),
    description: Object.freeze({
        ar: 'دوّر الصورة أو اعكسها أفقيًا ورأسيًا ثم نزّل النتيجة.',
        en: 'Rotate an image or flip it horizontally and vertically, then download the result.',
    }),
    note: Object.freeze({
        ar: 'تظل الصورة داخل متصفحك ولا تُرفع إلى أي خادم.',
        en: 'The image stays in your browser and is never uploaded.',
    }),
    inputs: Object.freeze([
        fileInput(),
        selectInput('rotation', 'زاوية التدوير', 'Rotation angle', [
            { value: '0', label: { ar: 'بدون تدوير', en: 'No rotation' } },
            { value: '90', label: { ar: '90° يمينًا', en: '90° clockwise' } },
            { value: '180', label: { ar: '180°', en: '180°' } },
            { value: '270', label: { ar: '90° يسارًا', en: '90° counterclockwise' } },
        ]),
        selectInput('flip', 'اتجاه القلب', 'Flip direction', [
            { value: 'none', label: { ar: 'بدون قلب', en: 'No flip' } },
            { value: 'horizontal', label: { ar: 'قلب أفقي', en: 'Flip horizontally' } },
            { value: 'vertical', label: { ar: 'قلب رأسي', en: 'Flip vertically' } },
            { value: 'both', label: { ar: 'قلب أفقي ورأسي', en: 'Flip both ways' } },
        ]),
    ]),
    async process(values, language) {
        const type = outputType(values.image);
        const processed = await renderImage({
            file: values.image,
            type,
            rotation: Number(values.rotation),
            flipX: ['horizontal', 'both'].includes(values.flip),
            flipY: ['vertical', 'both'].includes(values.flip),
        });
        return result(
            processed.blob,
            outputName(values.image, 'transformed', type),
            processed.width,
            processed.height,
            language,
            { ar: 'الصورة المعدّلة جاهزة', en: 'Transformed image is ready' },
        );
    },
});

const metadataRemover = Object.freeze({
    id: 'image-metadata-remover',
    category: 'image',
    icon: 'SAFE',
    action: Object.freeze({ ar: 'احذف البيانات الخفية', en: 'Remove metadata' }),
    title: Object.freeze({ ar: 'حذف بيانات الصور الخفية', en: 'Image Metadata Remover' }),
    description: Object.freeze({
        ar: 'أنشئ نسخة نظيفة من الصورة بدون بيانات EXIF مثل الموقع ونوع الكاميرا.',
        en: 'Create a clean copy without EXIF data such as location and camera details.',
    }),
    note: Object.freeze({
        ar: 'تُعاد كتابة وحدات البكسل فقط داخل المتصفح، لذلك لا تغادر الصورة جهازك.',
        en: 'Only the pixels are rewritten in-browser, so the image never leaves your device.',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const type = outputType(values.image);
        const processed = await renderImage({
            file: values.image,
            type,
            quality: 0.95,
        });
        return result(
            processed.blob,
            outputName(values.image, 'clean', type),
            processed.width,
            processed.height,
            language,
            { ar: 'النسخة النظيفة جاهزة', en: 'Clean image is ready' },
        );
    },
});

const imageEditingToolDefinitions = Object.freeze({
    [cropper.id]: cropper,
    [rotator.id]: rotator,
    [metadataRemover.id]: metadataRemover,
});

export { imageEditingToolDefinitions };

// END OF FILE
