import { renderImage } from '../image-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput(id = 'image', ar = 'اختر صورة', en = 'Choose an image') {
    return Object.freeze({
        id,
        type: 'file',
        accept: 'image/jpeg,image/png,image/webp,image/gif,image/bmp,.jpg,.jpeg,.png,.webp,.gif,.bmp',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function textInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 8,
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
        options: Object.freeze(options.map(([value, optAr, optEn]) => Object.freeze({
            value,
            label: Object.freeze({ ar: optAr, en: optEn }),
        }))),
    });
}

function imageTool(config) {
    return Object.freeze({
        category: 'image',
        ...config,
    });
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Unable to read the file.'));
        reader.readAsDataURL(file);
    });
}

const imageToBase64 = imageTool({
    id: 'image-to-base64',
    icon: 'B64',
    action: Object.freeze({ ar: 'حوّل لـ Base64', en: 'Convert to Base64' }),
    title: Object.freeze({ ar: 'تحويل صورة إلى Base64', en: 'Image to Base64' }),
    description: Object.freeze({
        ar: 'حوّل ملف صورة إلى نص Base64 جاهز للتضمين مباشرة داخل CSS أو HTML أو JSON بدون رفع الصورة كملف منفصل.',
        en: 'Convert an image file into Base64 text ready to embed directly inside CSS, HTML, or JSON without a separate image file.',
    }),
    note: Object.freeze({
        ar: 'النص الناتج يشمل بادئة data: الكاملة، جاهز للاستخدام المباشر في خاصية src أو url().',
        en: 'The output includes the full data: prefix, ready to use directly in an src attribute or url().',
    }),
    inputs: Object.freeze([fileInput()]),
    async process(values, language) {
        const dataUrl = await fileToDataUrl(values.image);
        const base64Length = dataUrl.length - dataUrl.indexOf(',') - 1;

        return {
            value: `${(base64Length / 1024).toFixed(1)} KB`,
            label: localized(language, 'نص Base64 جاهز', 'Base64 text is ready'),
            details: localized(language, 'انسخ النص والصقه مباشرة في الكود.', 'Copy the text and paste it directly into your code.'),
            download: {
                blob: new Blob([dataUrl], { type: 'text/plain' }),
                filename: 'adawaty-image-base64.txt',
            },
        };
    },
});

function parseDataUrlOrRaw(text) {
    const trimmed = text.trim();
    if (trimmed.startsWith('data:')) {
        const [header, data] = trimmed.split(',');
        const mimeMatch = header.match(/data:([^;]+)/);
        return { mimeType: mimeMatch?.[1] ?? 'image/png', base64: data };
    }
    return { mimeType: 'image/png', base64: trimmed };
}

const base64ToImage = imageTool({
    id: 'base64-to-image',
    icon: '64B',
    action: Object.freeze({ ar: 'حوّل لصورة', en: 'Convert to image' }),
    title: Object.freeze({ ar: 'تحويل Base64 إلى صورة', en: 'Base64 to Image' }),
    description: Object.freeze({
        ar: 'حوّل نص Base64 (بادئة data: كاملة أو بيانات مُرمّزة فقط) إلى ملف صورة قابل للتنزيل.',
        en: 'Convert Base64 text (a full data: prefix or just the encoded data) into a downloadable image file.',
    }),
    note: Object.freeze({
        ar: 'لو النص بدون بادئة data:، سيُفترض أنه صورة PNG افتراضيًا.',
        en: 'If the text has no data: prefix, it\u2019s assumed to be a PNG by default.',
    }),
    inputs: Object.freeze([
        textInput('base64', 'نص Base64', 'Base64 text', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='),
    ]),
    async process(values, language) {
        if (!values.base64.trim()) {
            throw new Error(localized(language, 'أدخل نص Base64.', 'Enter some Base64 text.'));
        }

        const { mimeType, base64 } = parseDataUrlOrRaw(values.base64);
        let binary;
        try {
            binary = atob(base64.replace(/\s/g, ''));
        } catch {
            throw new Error(localized(language, 'نص Base64 غير صالح.', 'The Base64 text is not valid.'));
        }

        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
            bytes[index] = binary.charCodeAt(index);
        }

        const extension = mimeType.split('/')[1] ?? 'png';
        const blob = new Blob([bytes], { type: mimeType });

        return {
            value: `${(blob.size / 1024).toFixed(1)} KB`,
            label: localized(language, 'الصورة جاهزة', 'The image is ready'),
            details: mimeType,
            download: { blob, filename: `adawaty-decoded-image.${extension}` },
            preview: blob,
        };
    },
});

const SOCIAL_MEDIA_PRESETS = Object.freeze({
    instagramSquare: { width: 1080, height: 1080, ar: 'إنستجرام - منشور مربع', en: 'Instagram - Square post' },
    instagramPortrait: { width: 1080, height: 1350, ar: 'إنستجرام - منشور طولي', en: 'Instagram - Portrait post' },
    instagramStory: { width: 1080, height: 1920, ar: 'إنستجرام / سناب شات - ستوري', en: 'Instagram / Snapchat - Story' },
    facebookCover: { width: 820, height: 312, ar: 'فيسبوك - غلاف الصفحة', en: 'Facebook - Page cover' },
    facebookPost: { width: 1200, height: 630, ar: 'فيسبوك - منشور', en: 'Facebook - Post' },
    twitterPost: { width: 1200, height: 675, ar: 'X (تويتر) - منشور', en: 'X (Twitter) - Post' },
    linkedinCover: { width: 1584, height: 396, ar: 'لينكدإن - غلاف الملف الشخصي', en: 'LinkedIn - Profile cover' },
    youtubeThumbnail: { width: 1280, height: 720, ar: 'يوتيوب - صورة مصغّرة', en: 'YouTube - Thumbnail' },
});

function computeCoverCropBox(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = targetWidth / targetHeight;

    if (sourceRatio > targetRatio) {
        const cropWidth = sourceHeight * targetRatio;
        return {
            x: (sourceWidth - cropWidth) / 2, y: 0, width: cropWidth, height: sourceHeight,
        };
    }
    const cropHeight = sourceWidth / targetRatio;
    return {
        x: 0, y: (sourceHeight - cropHeight) / 2, width: sourceWidth, height: cropHeight,
    };
}

const socialMediaImageResizer = imageTool({
    id: 'social-media-image-resizer',
    icon: 'SOC',
    action: Object.freeze({ ar: 'غيّر المقاس', en: 'Resize for platform' }),
    title: Object.freeze({ ar: 'تحجيم الصور لمنصات التواصل', en: 'Social Media Image Resizer' }),
    description: Object.freeze({
        ar: 'اقتطع وغيّر مقاس صورة لتناسب أبعاد منصة تواصل محددة بدقة تامة، بدون تشويه أو تمدد للصورة.',
        en: 'Crop and resize an image to fit a specific social platform\u2019s exact dimensions, without stretching or distorting it.',
    }),
    note: Object.freeze({
        ar: 'يتم اقتطاع الصورة من المنتصف (Cover Crop) للحفاظ على النسبة الصحيحة دون تمديد.',
        en: 'The image is center-cropped (cover fit) to preserve correct proportions without stretching.',
    }),
    inputs: Object.freeze([
        fileInput(),
        selectInput('preset', 'المنصة والمقاس', 'Platform and size', Object.entries(SOCIAL_MEDIA_PRESETS).map(
            ([value, { width, height, ar, en }]) => [value, `${ar} (${width}×${height})`, `${en} (${width}×${height})`],
        )),
    ]),
    async process(values, language) {
        const preset = SOCIAL_MEDIA_PRESETS[values.preset] ?? SOCIAL_MEDIA_PRESETS.instagramSquare;
        const probe = await createImageBitmap(values.image);
        const sourceBox = computeCoverCropBox(probe.width, probe.height, preset.width, preset.height);
        probe.close();

        const type = values.image.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const processed = await renderImage({
            file: values.image,
            width: preset.width,
            height: preset.height,
            type,
            quality: 0.92,
            source: sourceBox,
        });

        return {
            value: `${preset.width} × ${preset.height}`,
            label: localized(language, 'الصورة بالمقاس الجديد جاهزة', 'The resized image is ready'),
            details: `${(processed.blob.size / 1024).toFixed(1)} KB`,
            download: { blob: processed.blob, filename: `adawaty-${values.preset}.${type === 'image/png' ? 'png' : 'jpg'}` },
            preview: processed.blob,
        };
    },
});

const imageExtraToolDefinitions = Object.freeze({
    [imageToBase64.id]: imageToBase64,
    [base64ToImage.id]: base64ToImage,
    [socialMediaImageResizer.id]: socialMediaImageResizer,
});

export { imageExtraToolDefinitions };

// END OF FILE
