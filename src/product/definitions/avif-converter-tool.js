import { renderImage } from '../image-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function avifFileInput() {
    return Object.freeze({
        id: 'image',
        type: 'file',
        accept: 'image/avif,.avif',
        label: Object.freeze({ ar: 'اختر صورة AVIF', en: 'Choose an AVIF image' }),
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
        placeholder: String(placeholder),
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
    });
}

/**
 * Unlike HEIC, AVIF decoding (reading an .avif file) has been natively
 * supported by every major browser engine since roughly 2020-2023 (Chrome
 * 85+, Firefox 93+, Safari 16.4+) via the standard <img>/createImageBitmap
 * pipeline -- confirmed via multiple independent sources before building
 * this, not assumed. This means AVIF *decode* needs no special library at
 * all, unlike HEIC. The reverse direction (JPG to AVIF, i.e. *encoding*
 * AVIF) is deliberately NOT built alongside this: canvas.toBlob's AVIF
 * *encode* support is still genuinely inconsistent across browsers as of
 * 2026 (solid in Chrome, gaps in Firefox/Safari per current research), so
 * treating both directions of this conversion pair as equally easy would
 * have been a mistake -- same lesson already applied to SVG-to-PNG vs
 * PNG-to-SVG in the Image classification (0.5.62).
 */
const avifToJpgConverter = Object.freeze({
    id: 'avif-to-jpg-converter',
    category: 'image',
    icon: 'AVIF',
    action: Object.freeze({ ar: 'حوّل AVIF إلى JPG', en: 'Convert AVIF to JPG' }),
    title: Object.freeze({ ar: 'تحويل AVIF إلى JPG', en: 'AVIF to JPG Converter' }),
    description: Object.freeze({
        ar: 'حوّل صور بصيغة AVIF الحديثة إلى JPG قابلة للفتح والمشاركة على أي جهاز أو برنامج.',
        en: 'Convert modern AVIF images to JPG so they open and share easily on any device or program.',
    }),
    note: Object.freeze({
        ar: 'التحويل يتم بالكامل داخل متصفحك دون رفع الصورة لأي خادم، باستخدام دعم AVIF المدمج في المتصفحات الحديثة.',
        en: 'The conversion happens entirely in your browser using modern browsers\u2019 built-in AVIF support; the photo is never uploaded.',
    }),
    inputs: Object.freeze([
        avifFileInput(),
        numberInput('quality', 'جودة الإخراج', 'Output quality', 90, { min: 1, max: 100, unit: { ar: '%', en: '%' } }),
    ]),
    async process(values, language) {
        if (!(values.image instanceof File)) {
            throw new Error(localized(language, 'اختر صورة AVIF أولًا.', 'Choose an AVIF image first.'));
        }

        const processed = await renderImage({
            file: values.image,
            type: 'image/jpeg',
            quality: values.quality / 100,
            background: '#ffffff',
        });

        const base = values.image.name.replace(/\.avif$/i, '') || 'photo';
        return {
            value: `${(processed.blob.size / 1024).toFixed(1)} KB`,
            label: localized(language, 'ملف JPG جاهز', 'JPG file is ready'),
            details: '',
            download: { blob: processed.blob, filename: `${base}.jpg` },
            preview: processed.blob,
        };
    },
});

const avifToolDefinitions = Object.freeze({
    [avifToJpgConverter.id]: avifToJpgConverter,
});

export { avifToolDefinitions };

// END OF FILE
