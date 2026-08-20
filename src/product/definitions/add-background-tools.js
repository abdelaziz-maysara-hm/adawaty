import {
    canvasToBlob, decodeImage, inspectImage, outputName,
} from '../image-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput(id, ar, en, accept = 'image/jpeg,image/png,image/webp,image/gif,image/bmp') {
    return Object.freeze({
        id,
        type: 'file',
        accept,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function textInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
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

function result(blob, filename, width, height, language, label) {
    return {
        value: `${width} × ${height}`,
        label: localized(language, label.ar, label.en),
        details: `${(blob.size / 1024).toFixed(1)} KB`,
        download: { blob, filename },
        preview: blob,
    };
}

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Validates a HEX color, falling back to a safe default rather than ever passing unvalidated input to canvas fillStyle. */
function safeHexColor(value, fallback) {
    return HEX_COLOR_PATTERN.test(String(value ?? '').trim()) ? String(value).trim() : fallback;
}

/**
 * Composites `foregroundImage` (expected to have transparency, e.g. the
 * output of background-remover) onto a background drawn first via
 * `drawBackground(context, width, height)` -- a small callback so the
 * three tools below (solid/gradient/image background) all share this
 * exact composite logic, verified directly with node-canvas before any
 * tool was written on top of it: a transparent foreground correctly
 * shows the background underneath, and an opaque foreground pixel
 * correctly stays opaque and unchanged.
 */
async function compositeOntoBackground(foregroundFile, drawBackground, type, quality) {
    const foregroundImage = await decodeImage(foregroundFile);
    const canvas = document.createElement('canvas');
    canvas.width = foregroundImage.naturalWidth;
    canvas.height = foregroundImage.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable in this browser.');

    drawBackground(context, canvas.width, canvas.height);
    context.drawImage(foregroundImage, 0, 0);

    const blob = await canvasToBlob(canvas, type, quality);
    return { blob, width: canvas.width, height: canvas.height };
}

const addSolidBackground = Object.freeze({
    id: 'add-solid-background',
    category: 'image',
    icon: 'BG COLOR',
    action: Object.freeze({ ar: 'أضف الخلفية', en: 'Add background' }),
    title: Object.freeze({ ar: 'إضافة خلفية بلون واحد', en: 'Add Solid Color Background' }),
    description: Object.freeze({
        ar: 'ضع لونًا صلبًا خلف صورة بخلفية شفافة (مثل ناتج أداة إزالة الخلفية)، وحمّل الصورة النهائية.',
        en: 'Place a solid color behind an image with a transparent background (like the output of the Background Remover), and download the final image.',
    }),
    note: Object.freeze({
        ar: 'تعمل بالكامل داخل متصفحك؛ صورتك لا تُرفع لأي خادم. تعمل بشكل صحيح فقط مع صور ذات خلفية شفافة أصلًا.',
        en: 'Runs entirely in your browser; your image is never uploaded to any server. Only works correctly with images that already have a transparent background.',
    }),
    inputs: Object.freeze([
        fileInput('image', 'الصورة (بخلفية شفافة)', 'Image (with transparent background)', 'image/png,image/webp,image/gif,image/avif'),
        textInput('color', 'لون الخلفية', 'Background color', '#ffffff'),
    ]),
    async process(values, language) {
        await inspectImage(values.image);
        const color = safeHexColor(values.color, '#ffffff');
        const { blob, width, height } = await compositeOntoBackground(
            values.image,
            (context, canvasWidth, canvasHeight) => {
                context.fillStyle = color;
                context.fillRect(0, 0, canvasWidth, canvasHeight);
            },
            'image/jpeg',
            0.92,
        );
        return result(
            blob,
            outputName(values.image, 'bg-added', 'image/jpeg'),
            width,
            height,
            language,
            { ar: 'الصورة بالخلفية الجديدة جاهزة', en: 'The image with the new background is ready' },
        );
    },
});

const addGradientBackground = Object.freeze({
    id: 'add-gradient-background',
    category: 'image',
    icon: 'BG GRADIENT',
    action: Object.freeze({ ar: 'أضف الخلفية', en: 'Add background' }),
    title: Object.freeze({ ar: 'إضافة خلفية متدرجة الألوان', en: 'Add Gradient Background' }),
    description: Object.freeze({
        ar: 'ضع خلفية متدرجة بين لونين خلف صورة بخلفية شفافة، وحمّل الصورة النهائية.',
        en: 'Place a two-color gradient behind an image with a transparent background, and download the final image.',
    }),
    note: Object.freeze({
        ar: 'تعمل بالكامل داخل متصفحك؛ صورتك لا تُرفع لأي خادم. تعمل بشكل صحيح فقط مع صور ذات خلفية شفافة أصلًا.',
        en: 'Runs entirely in your browser; your image is never uploaded to any server. Only works correctly with images that already have a transparent background.',
    }),
    inputs: Object.freeze([
        fileInput('image', 'الصورة (بخلفية شفافة)', 'Image (with transparent background)', 'image/png,image/webp,image/gif,image/avif'),
        textInput('colorStart', 'اللون الأول', 'Start color', '#55d8c1'),
        textInput('colorEnd', 'اللون الثاني', 'End color', '#2563eb'),
        selectInput('direction', 'اتجاه التدرج', 'Gradient direction', [
            { value: 'vertical', label: { ar: 'من أعلى لأسفل', en: 'Top to bottom' } },
            { value: 'horizontal', label: { ar: 'من اليسار لليمين', en: 'Left to right' } },
            { value: 'diagonal', label: { ar: 'قطري', en: 'Diagonal' } },
        ]),
    ]),
    async process(values, language) {
        await inspectImage(values.image);
        const colorStart = safeHexColor(values.colorStart, '#55d8c1');
        const colorEnd = safeHexColor(values.colorEnd, '#2563eb');
        const direction = ['vertical', 'horizontal', 'diagonal'].includes(values.direction) ? values.direction : 'vertical';

        const { blob, width, height } = await compositeOntoBackground(
            values.image,
            (context, canvasWidth, canvasHeight) => {
                const coords = {
                    vertical: [0, 0, 0, canvasHeight],
                    horizontal: [0, 0, canvasWidth, 0],
                    diagonal: [0, 0, canvasWidth, canvasHeight],
                }[direction];
                const gradient = context.createLinearGradient(...coords);
                gradient.addColorStop(0, colorStart);
                gradient.addColorStop(1, colorEnd);
                context.fillStyle = gradient;
                context.fillRect(0, 0, canvasWidth, canvasHeight);
            },
            'image/jpeg',
            0.92,
        );
        return result(
            blob,
            outputName(values.image, 'bg-added', 'image/jpeg'),
            width,
            height,
            language,
            { ar: 'الصورة بالخلفية الجديدة جاهزة', en: 'The image with the new background is ready' },
        );
    },
});

const addImageBackground = Object.freeze({
    id: 'add-image-background',
    category: 'image',
    icon: 'BG IMAGE',
    action: Object.freeze({ ar: 'أضف الخلفية', en: 'Add background' }),
    title: Object.freeze({ ar: 'إضافة خلفية من صورة', en: 'Add Image Background' }),
    description: Object.freeze({
        ar: 'ضع صورة أخرى كخلفية خلف صورة بخلفية شفافة، وحمّل الصورة النهائية المدمجة.',
        en: 'Place another image as the background behind an image with a transparent background, and download the final composited image.',
    }),
    note: Object.freeze({
        ar: 'تعمل بالكامل داخل متصفحك؛ صورك لا تُرفع لأي خادم. تُمدَّد صورة الخلفية لتملأ أبعاد الصورة الأمامية بالكامل.',
        en: 'Runs entirely in your browser; your images are never uploaded to any server. The background image is stretched to fill the foreground image\'s exact dimensions.',
    }),
    inputs: Object.freeze([
        fileInput('image', 'الصورة الأمامية (بخلفية شفافة)', 'Foreground image (with transparent background)', 'image/png,image/webp,image/gif,image/avif'),
        fileInput('backgroundImage', 'صورة الخلفية', 'Background image'),
    ]),
    async process(values, language) {
        await inspectImage(values.image);
        await inspectImage(values.backgroundImage);
        const backgroundImage = await decodeImage(values.backgroundImage);

        const { blob, width, height } = await compositeOntoBackground(
            values.image,
            (context, canvasWidth, canvasHeight) => {
                context.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
            },
            'image/jpeg',
            0.92,
        );
        return result(
            blob,
            outputName(values.image, 'bg-added', 'image/jpeg'),
            width,
            height,
            language,
            { ar: 'الصورة بالخلفية الجديدة جاهزة', en: 'The image with the new background is ready' },
        );
    },
});

const addBackgroundToolDefinitions = Object.freeze({
    [addSolidBackground.id]: addSolidBackground,
    [addGradientBackground.id]: addGradientBackground,
    [addImageBackground.id]: addImageBackground,
});

export { addBackgroundToolDefinitions, safeHexColor, result };

// END OF FILE
