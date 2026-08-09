import { decodeImage } from '../image-processing.js';

const IMAGE_TRACER_URL = 'https://cdn.jsdelivr.net/npm/imagetracerjs@1.2.6/+esm';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function buildTraceOptions(detail, colors) {
    const safeColors = Math.min(32, Math.max(2, Math.round(Number(colors) || 8)));
    const presets = {
        smooth: { ltres: 1, qtres: 1, pathomit: 8 },
        detailed: { ltres: 0.5, qtres: 0.5, pathomit: 2 },
        logo: { ltres: 1, qtres: 1, pathomit: 12 },
    };

    return Object.freeze({
        ...(presets[detail] ?? presets.smooth),
        colorsampling: 2,
        numberofcolors: detail === 'logo' ? Math.min(safeColors, 8) : safeColors,
        mincolorratio: 0.02,
        colorquantcycles: 3,
        scale: 1,
        roundcoords: 1,
        viewbox: true,
        desc: false,
    });
}

async function imageToImageData(file) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        throw new Error('Please choose a valid image file.');
    }

    const image = await decodeImage(file);
    const maxDimension = 1200;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
        throw new Error('Canvas is unavailable in this browser.');
    }

    context.drawImage(image, 0, 0, width, height);
    return Object.freeze({ imageData: context.getImageData(0, 0, width, height), width, height });
}

async function loadImageTracer() {
    const module = await import(IMAGE_TRACER_URL);
    const tracer = module.default ?? module.ImageTracer ?? module;
    if (typeof tracer.imagedataToSVG !== 'function') {
        throw new Error('The SVG tracing engine is unavailable.');
    }
    return tracer;
}

const imageSvgTracer = Object.freeze({
    id: 'image-svg-tracer',
    category: 'image',
    icon: 'SVG',
    action: Object.freeze({ ar: 'حوّل إلى SVG', en: 'Trace to SVG' }),
    title: Object.freeze({ ar: 'تحويل PNG وJPG إلى SVG', en: 'PNG & JPG to SVG Tracer' }),
    description: Object.freeze({
        ar: 'حوّل الشعارات والرسومات والصور النقطية إلى مسارات SVG متجهة قابلة للتكبير بدون فقدان الحدة.',
        en: 'Trace logos, artwork, PNG, and JPG images into scalable SVG vector paths.',
    }),
    note: Object.freeze({
        ar: 'أفضل النتائج تكون مع الشعارات والرسومات ذات الألوان الواضحة. تتم المعالجة محليًا، وقد تُصغّر الصور الكبيرة إلى 1200 بكسل لتسريع التتبع.',
        en: 'Best for logos and artwork with clear colors. Processing stays local; large images may be reduced to 1200 px for faster tracing.',
    }),
    tags: Object.freeze(['image', 'png', 'jpg', 'svg', 'vector', 'tracer', 'converter', 'processing']),
    inputs: Object.freeze([
        Object.freeze({
            id: 'image',
            type: 'file',
            accept: 'image/png,image/jpeg,image/webp,image/bmp,.png,.jpg,.jpeg,.webp,.bmp',
            label: Object.freeze({ ar: 'اختر صورة', en: 'Choose an image' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
        Object.freeze({
            id: 'detail',
            type: 'select',
            label: Object.freeze({ ar: 'نمط التتبع', en: 'Tracing mode' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze([
                Object.freeze({ value: 'smooth', label: Object.freeze({ ar: 'متوازن وناعم', en: 'Balanced & smooth' }) }),
                Object.freeze({ value: 'detailed', label: Object.freeze({ ar: 'تفاصيل أكثر', en: 'More detail' }) }),
                Object.freeze({ value: 'logo', label: Object.freeze({ ar: 'شعار بسيط', en: 'Simple logo' }) }),
            ]),
        }),
        Object.freeze({
            id: 'colors',
            type: 'number',
            min: 2,
            max: 32,
            step: 1,
            placeholder: '8',
            label: Object.freeze({ ar: 'عدد الألوان', en: 'Number of colors' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
    ]),
    async process(values, language) {
        try {
            const [{ imageData, width, height }, tracer] = await Promise.all([
                imageToImageData(values.image),
                loadImageTracer(),
            ]);
            const svg = tracer.imagedataToSVG(
                imageData,
                buildTraceOptions(values.detail, values.colors),
            );
            if (typeof svg !== 'string' || !svg.includes('<svg')) {
                throw new Error('The tracing engine returned invalid SVG.');
            }

            const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
            const baseName = values.image.name.replace(/\.[^.]+$/, '') || 'traced-image';
            return {
                value: `${width} × ${height}`,
                label: localized(language, 'ملف SVG المتجه جاهز', 'Vector SVG is ready'),
                details: localized(
                    language,
                    `${(blob.size / 1024).toFixed(1)} KB · ${buildTraceOptions(values.detail, values.colors).numberofcolors} لون`,
                    `${(blob.size / 1024).toFixed(1)} KB · ${buildTraceOptions(values.detail, values.colors).numberofcolors} colors`,
                ),
                preview: blob,
                download: { blob, filename: `${baseName}-traced.svg` },
            };
        } catch (error) {
            throw new Error(localized(
                language,
                'تعذّر تتبع الصورة. تأكد من اختيار صورة صالحة واتصال الإنترنت لتحميل محرك التتبع مرة واحدة.',
                'Unable to trace the image. Choose a valid image and allow the tracing engine to load once.',
            ), { cause: error });
        }
    },
});

const imageSvgTracerToolDefinitions = Object.freeze({
    [imageSvgTracer.id]: imageSvgTracer,
});

export { buildTraceOptions, imageSvgTracerToolDefinitions };

// END OF FILE
