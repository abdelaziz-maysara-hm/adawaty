import {
    canvasToBlob,
    decodeImage,
    inspectImage,
    renderImage,
} from '../image-processing.js';
import { loadZip } from './image-batch-tools.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput(id, ar, en, multiple = false) {
    return Object.freeze({
        id,
        type: 'file',
        accept: 'image/jpeg,image/png,image/webp',
        multiple,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, ar, en, placeholder, min, max) {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 1,
        placeholder: String(placeholder),
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map(([value, arLabel, enLabel]) =>
            Object.freeze({
                value,
                label: Object.freeze({ ar: arLabel, en: enLabel }),
            }))),
    });
}

function centerCrop(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    const sourceRatio = sourceWidth / sourceHeight;
    const targetRatio = targetWidth / targetHeight;
    if (sourceRatio > targetRatio) {
        const width = sourceHeight * targetRatio;
        return {
            x: (sourceWidth - width) / 2,
            y: 0,
            width,
            height: sourceHeight,
        };
    }
    const height = sourceWidth / targetRatio;
    return {
        x: 0,
        y: (sourceHeight - height) / 2,
        width: sourceWidth,
        height,
    };
}

const socialPresets = Object.freeze({
    essentials: Object.freeze([
        ['instagram-square', 1080, 1080],
        ['instagram-story', 1080, 1920],
        ['youtube-thumbnail', 1280, 720],
        ['facebook-post', 1200, 630],
        ['x-post', 1600, 900],
    ]),
    instagram: Object.freeze([
        ['instagram-square', 1080, 1080],
        ['instagram-portrait', 1080, 1350],
        ['instagram-story', 1080, 1920],
    ]),
    video: Object.freeze([
        ['youtube-thumbnail', 1280, 720],
        ['youtube-channel-cover', 2560, 1440],
        ['vertical-video-cover', 1080, 1920],
    ]),
});

const socialPackGenerator = Object.freeze({
    id: 'social-media-image-pack',
    category: 'image',
    icon: 'SOC',
    action: Object.freeze({
        ar: 'أنشئ الحزمة',
        en: 'Create image pack',
    }),
    title: Object.freeze({
        ar: 'مولّد حزمة صور السوشيال ميديا',
        en: 'Social Media Image Pack Generator',
    }),
    description: Object.freeze({
        ar: 'حوّل صورة واحدة إلى عدة مقاسات جاهزة لإنستغرام ويوتيوب وفيسبوك وX، ثم نزّلها في ملف ZIP واحد.',
        en: 'Turn one image into ready-to-publish Instagram, YouTube, Facebook and X sizes, delivered in one ZIP.',
    }),
    note: Object.freeze({
        ar: 'يتم القص من المنتصف تلقائيًا لتعبئة كل مقاس، وتظل الصورة داخل متصفحك.',
        en: 'Each size is center-cropped automatically and your image stays inside the browser.',
    }),
    inputs: Object.freeze([
        fileInput('image', 'اختر الصورة الأصلية', 'Choose source image'),
        selectInput('pack', 'الحزمة المطلوبة', 'Preset pack', [
            ['essentials', 'أهم المنصات', 'Essential platforms'],
            ['instagram', 'إنستغرام', 'Instagram'],
            ['video', 'منصات الفيديو', 'Video platforms'],
        ]),
        numberInput('quality', 'جودة JPG', 'JPG quality', 88, 40, 100),
    ]),
    async process(values, language) {
        const dimensions = await inspectImage(values.image);
        const presets = socialPresets[values.pack] ?? socialPresets.essentials;
        const JSZip = await loadZip();
        const zip = new JSZip();
        for (const [name, width, height] of presets) {
            const rendered = await renderImage({
                file: values.image,
                width,
                height,
                source: centerCrop(
                    dimensions.width,
                    dimensions.height,
                    width,
                    height,
                ),
                type: 'image/jpeg',
                quality: values.quality / 100,
                background: '#ffffff',
            });
            zip.file(`${name}-${width}x${height}.jpg`, rendered.blob);
        }
        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        });
        return {
            value: localized(
                language,
                `${presets.length} مقاسات`,
                `${presets.length} sizes`,
            ),
            label: localized(
                language,
                'حزمة النشر جاهزة',
                'Publishing pack is ready',
            ),
            details: localized(
                language,
                'تم جمع كل الصور في ملف ZIP واحد.',
                'Every generated image is bundled in one ZIP.',
            ),
            download: { blob, filename: 'adawaty-social-media-pack.zip' },
        };
    },
});

const collageMaker = Object.freeze({
    id: 'image-collage-maker',
    category: 'image',
    icon: 'GRID',
    action: Object.freeze({ ar: 'أنشئ الكولاج', en: 'Create collage' }),
    title: Object.freeze({
        ar: 'صانع كولاج الصور',
        en: 'Image Collage Maker',
    }),
    description: Object.freeze({
        ar: 'اجمع حتى 12 صورة في شبكة واحدة مرتبة مع تحكم في الأعمدة والمسافات والخلفية.',
        en: 'Combine up to 12 images into one clean grid with adjustable columns, gaps and background.',
    }),
    note: Object.freeze({
        ar: 'تُقص الصور من المنتصف لتوحيد الخلايا وتتم المعالجة بالكامل على جهازك.',
        en: 'Images are center-cropped into equal cells and processed entirely on your device.',
    }),
    inputs: Object.freeze([
        fileInput('images', 'اختر الصور', 'Choose images', true),
        numberInput('columns', 'عدد الأعمدة', 'Columns', 3, 1, 6),
        numberInput('cellWidth', 'عرض كل صورة', 'Cell width', 500, 160, 1600),
        numberInput('gap', 'المسافة بين الصور', 'Gap', 12, 0, 100),
        Object.freeze({
            id: 'background',
            type: 'color',
            label: Object.freeze({ ar: 'لون الخلفية', en: 'Background color' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
    ]),
    async process(values, language) {
        if (!Array.isArray(values.images) || values.images.length < 2) {
            throw new Error(localized(
                language,
                'اختر صورتين على الأقل.',
                'Choose at least two images.',
            ));
        }
        if (values.images.length > 12) {
            throw new Error(localized(
                language,
                'الحد الأقصى 12 صورة.',
                'The maximum is 12 images.',
            ));
        }
        const columns = Math.min(values.images.length, values.columns);
        const rows = Math.ceil(values.images.length / columns);
        const cellWidth = values.cellWidth;
        const cellHeight = Math.round(cellWidth * 0.75);
        const gap = values.gap;
        const canvas = document.createElement('canvas');
        canvas.width = columns * cellWidth + (columns + 1) * gap;
        canvas.height = rows * cellHeight + (rows + 1) * gap;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error(localized(
                language,
                'معالجة الصور غير متاحة في هذا المتصفح.',
                'Image processing is unavailable in this browser.',
            ));
        }
        context.fillStyle = values.background || '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        for (const [index, file] of values.images.entries()) {
            const image = await decodeImage(file);
            const source = centerCrop(
                image.naturalWidth,
                image.naturalHeight,
                cellWidth,
                cellHeight,
            );
            const column = index % columns;
            const row = Math.floor(index / columns);
            context.drawImage(
                image,
                source.x,
                source.y,
                source.width,
                source.height,
                gap + column * (cellWidth + gap),
                gap + row * (cellHeight + gap),
                cellWidth,
                cellHeight,
            );
        }

        const blob = await canvasToBlob(canvas, 'image/jpeg', 0.92);
        return {
            value: `${canvas.width} × ${canvas.height}`,
            label: localized(
                language,
                'كولاج الصور جاهز',
                'Image collage is ready',
            ),
            details: localized(
                language,
                `${values.images.length} صور في ${rows} صفوف.`,
                `${values.images.length} images across ${rows} rows.`,
            ),
            preview: blob,
            download: { blob, filename: 'adawaty-image-collage.jpg' },
        };
    },
});

const imageWorkflowToolDefinitions = Object.freeze({
    [socialPackGenerator.id]: socialPackGenerator,
    [collageMaker.id]: collageMaker,
});

export { imageWorkflowToolDefinitions };

// END OF FILE
