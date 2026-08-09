import { canvasToBlob, decodeImage, renderImage } from '../image-processing.js';
import {
    assertPdfFile,
    createPdfBlob,
    loadPdfJs,
    loadPdfLib,
} from '../pdf-processing.js';
import { processVideo } from '../ffmpeg-processing.js';

const HEIC2ANY_URL = 'https://cdn.jsdelivr.net/npm/heic2any@0.0.4/+esm';
let heic2anyPromise;

function loadHeic2Any() {
    heic2anyPromise ??= import(HEIC2ANY_URL).then((module) => module.default ?? module);
    return heic2anyPromise;
}

const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
let zipPromise;

function loadZip() {
    zipPromise ??= import(JSZIP_URL).then((module) => module.default);
    return zipPromise;
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function pdfInput() {
    return Object.freeze({
        id: 'pdf',
        type: 'file',
        accept: 'application/pdf,.pdf',
        label: Object.freeze({ ar: 'اختر ملف PDF', en: 'Choose a PDF file' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function imageFileInput() {
    return Object.freeze({
        id: 'image',
        type: 'file',
        accept: 'image/heic,image/heif,.heic,.heif',
        label: Object.freeze({ ar: 'اختر صورة HEIC', en: 'Choose a HEIC image' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function anyImageInput() {
    return Object.freeze({
        id: 'image',
        type: 'file',
        accept: 'image/png,image/jpeg,image/webp',
        label: Object.freeze({ ar: 'اختر صورة (مربعة يُفضّل)', en: 'Choose an image (square works best)' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id, type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze(option))),
    });
}

function fileResult(blob, filename, language, arLabel, enLabel) {
    return {
        value: `${(blob.size / 1024).toFixed(1)} KB`,
        label: localized(language, arLabel, enLabel),
        details: '',
        download: { blob, filename },
    };
}

// --- PDF compressor -----------------------------------------------------

const QUALITY_PRESETS = {
    high: { scale: 2, quality: 0.85 },
    balanced: { scale: 1.5, quality: 0.7 },
    small: { scale: 1, quality: 0.5 },
};

const pdfCompressor = Object.freeze({
    id: 'pdf-compressor',
    category: 'pdf',
    icon: 'PDF↓',
    action: Object.freeze({ ar: 'اضغط PDF', en: 'Compress PDF' }),
    title: Object.freeze({ ar: 'ضغط ملفات PDF', en: 'PDF Compressor' }),
    description: Object.freeze({
        ar: 'قلّل حجم ملف PDF بإعادة رسم صفحاته كصور مضغوطة، مفيد جدًا للملفات الممسوحة ضوئيًا.',
        en: 'Shrink a PDF by re-rendering its pages as compressed images — especially effective for scanned documents.',
    }),
    note: Object.freeze({
        ar: 'الأداة تحوّل كل صفحة إلى صورة، فيفقد النص القابل للتحديد داخل الصفحة. لملفات PDF نصية بالأساس، قد لا يقل الحجم كثيرًا.',
        en: 'Each page becomes an image, so selectable text inside the page is lost. Text-heavy PDFs may not shrink much.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        selectInput('preset', { ar: 'مستوى الضغط', en: 'Compression level' }, [
            { value: 'high', label: { ar: 'جودة عالية (ضغط أقل)', en: 'High quality (less compression)' } },
            { value: 'balanced', label: { ar: 'متوازن', en: 'Balanced' } },
            { value: 'small', label: { ar: 'أصغر حجم ممكن', en: 'Smallest size' } },
        ]),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const preset = QUALITY_PRESETS[values.preset] ?? QUALITY_PRESETS.balanced;
        const originalSize = values.pdf.size;

        const [pdfJs, { PDFDocument }] = await Promise.all([loadPdfJs(), loadPdfLib()]);
        const task = pdfJs.getDocument({ data: new Uint8Array(await values.pdf.arrayBuffer()) });
        const sourceDocument = await task.promise;
        const output = await PDFDocument.create();

        for (let pageNumber = 1; pageNumber <= sourceDocument.numPages; pageNumber += 1) {
            const page = await sourceDocument.getPage(pageNumber);
            const viewport = page.getViewport({ scale: preset.scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            const context = canvas.getContext('2d', { alpha: false });
            if (!context) {
                throw new Error('PDF page rendering is unavailable in this browser.');
            }
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: context, viewport }).promise;
            const blob = await canvasToBlob(canvas, 'image/jpeg', preset.quality);
            const jpgBytes = new Uint8Array(await blob.arrayBuffer());
            const jpgImage = await output.embedJpg(jpgBytes);
            const outputPage = output.addPage([canvas.width, canvas.height]);
            outputPage.drawImage(jpgImage, { x: 0, y: 0, width: canvas.width, height: canvas.height });
            page.cleanup();
        }

        const bytes = await output.save({ useObjectStreams: true });
        const blob = createPdfBlob(bytes);
        const savedPercent = originalSize > 0
            ? Math.max(0, Math.round((1 - blob.size / originalSize) * 100))
            : 0;
        const base = values.pdf.name.replace(/\.pdf$/i, '') || 'document';
        return fileResult(
            blob,
            `${base}-compressed.pdf`,
            language,
            `تم تقليل الحجم بنسبة ${savedPercent}%`,
            `Reduced size by ${savedPercent}%`,
        );
    },
});

// --- HEIC to JPG converter ------------------------------------------------

const heicToJpgConverter = Object.freeze({
    id: 'heic-to-jpg-converter',
    category: 'image',
    icon: 'HEIC',
    action: Object.freeze({ ar: 'حوّل HEIC إلى JPG', en: 'Convert HEIC to JPG' }),
    title: Object.freeze({ ar: 'تحويل HEIC إلى JPG', en: 'HEIC to JPG Converter' }),
    description: Object.freeze({
        ar: 'حوّل صور آيفون بصيغة HEIC إلى JPG قابلة للفتح على أي جهاز أو برنامج.',
        en: 'Convert iPhone HEIC photos to JPG so they open on any device or program.',
    }),
    note: Object.freeze({
        ar: 'التحويل يتم بالكامل داخل متصفحك دون رفع الصورة لأي خادم.',
        en: 'The conversion happens entirely in your browser; the photo is never uploaded.',
    }),
    inputs: Object.freeze([imageFileInput()]),
    async process(values, language) {
        const file = values.image;
        if (!(file instanceof File)) {
            throw new Error(localized(language, 'اختر صورة HEIC أولًا.', 'Choose a HEIC image first.'));
        }
        const heic2any = await loadHeic2Any();
        const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        const base = file.name.replace(/\.(heic|heif)$/i, '') || 'photo';
        return fileResult(blob, `${base}.jpg`, language, 'ملف JPG جاهز', 'JPG file is ready');
    },
});

// --- HEIC to PNG converter --------------------------------------------------
// Reuses the same heic2any engine as heic-to-jpg-converter above (already
// live and using this exact library) rather than introducing a second HEIC
// dependency. Note for whoever picks this up next: heic2any and the newer
// heic-to library both genuinely need browser-only Worker/Blob-URL APIs, so
// neither can be end-to-end verified in a plain Node sandbox -- confirmed
// directly by testing both against a real HEIC file downloaded from
// libheif's own repository (verified authentic via `file`, decoded
// independently via ImageMagick/libheif as 1280x854 ground truth). Shipped
// on the site owner's explicit request to real-world test personally,
// since heic2any is already proven live in production via the JPG sibling
// tool above.

const heicToPngConverter = Object.freeze({
    id: 'heic-to-png-converter',
    category: 'image',
    icon: 'HEIC',
    action: Object.freeze({ ar: 'حوّل HEIC إلى PNG', en: 'Convert HEIC to PNG' }),
    title: Object.freeze({ ar: 'تحويل HEIC إلى PNG', en: 'HEIC to PNG Converter' }),
    description: Object.freeze({
        ar: 'حوّل صور آيفون بصيغة HEIC إلى PNG، مفيد لو محتاج خلفية شفافة أو جودة بلا فقدان.',
        en: 'Convert iPhone HEIC photos to PNG, useful if you need transparency support or lossless quality.',
    }),
    note: Object.freeze({
        ar: 'التحويل يتم بالكامل داخل متصفحك دون رفع الصورة لأي خادم. ملفات PNG أكبر حجمًا من JPG عادةً.',
        en: 'The conversion happens entirely in your browser; the photo is never uploaded. PNG files are typically larger than JPG.',
    }),
    inputs: Object.freeze([imageFileInput()]),
    async process(values, language) {
        const file = values.image;
        if (!(file instanceof File)) {
            throw new Error(localized(language, 'اختر صورة HEIC أولًا.', 'Choose a HEIC image first.'));
        }
        const heic2any = await loadHeic2Any();
        const converted = await heic2any({ blob: file, toType: 'image/png' });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        const base = file.name.replace(/\.(heic|heif)$/i, '') || 'photo';
        return fileResult(blob, `${base}.png`, language, 'ملف PNG جاهز', 'PNG file is ready');
    },
});

// --- Favicon generator ----------------------------------------------------

const FAVICON_SIZES = [16, 32, 48, 180, 192, 512];

const faviconGenerator = Object.freeze({
    id: 'favicon-generator',
    category: 'image',
    icon: 'FAV',
    action: Object.freeze({ ar: 'أنشئ Favicon', en: 'Generate favicon' }),
    title: Object.freeze({ ar: 'إنشاء أيقونة الموقع (Favicon)', en: 'Favicon Generator' }),
    description: Object.freeze({
        ar: 'ارفع صورة مربعة واحصل على كل مقاسات أيقونة الموقع الشائعة داخل ملف ZIP واحد.',
        en: 'Upload a square image and get every common favicon size bundled in one ZIP file.',
    }),
    note: Object.freeze({
        ar: 'يشمل الحزمة مقاسات 16، 32، 48، 180 (Apple touch icon)، 192 و512 (PWA) بصيغة PNG.',
        en: 'The bundle includes 16, 32, 48, 180 (Apple touch icon), 192 and 512 (PWA) PNG sizes.',
    }),
    inputs: Object.freeze([anyImageInput()]),
    async process(values, language) {
        const file = values.image;
        if (!(file instanceof File)) {
            throw new Error(localized(language, 'اختر صورة أولًا.', 'Choose an image first.'));
        }
        await decodeImage(file); // validates the file decodes before doing repeated work
        const JSZip = await loadZip();
        const zip = new JSZip();
        for (const size of FAVICON_SIZES) {
            const { blob } = await renderImage({ file, width: size, height: size, type: 'image/png' });
            zip.file(`favicon-${size}x${size}.png`, blob);
        }
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        return fileResult(blob, 'favicon-pack.zip', language, 'حزمة الأيقونات جاهزة', 'Favicon pack is ready');
    },
});

// --- Video to GIF converter ------------------------------------------------

function videoFileInput() {
    return Object.freeze({
        id: 'video',
        type: 'file',
        accept: 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov',
        label: Object.freeze({ ar: 'اختر فيديو', en: 'Choose a video' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function secondsInput(id, label, placeholder, min, max) {
    return Object.freeze({
        id, type: 'number', min, max, step: 0.1,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: 'ث', en: 's' }),
        placeholder: String(placeholder),
    });
}

const videoToGifConverter = Object.freeze({
    id: 'video-to-gif-converter',
    category: 'video',
    icon: 'GIF',
    action: Object.freeze({ ar: 'حوّل الفيديو إلى GIF', en: 'Convert video to GIF' }),
    title: Object.freeze({ ar: 'تحويل فيديو إلى GIF', en: 'Video to GIF Converter' }),
    description: Object.freeze({
        ar: 'حوّل مقطعًا من فيديو MP4 أو WebM أو MOV إلى صورة متحركة GIF.',
        en: 'Turn a section of an MP4, WebM or MOV video into an animated GIF.',
    }),
    note: Object.freeze({
        ar: 'المعالجة تتم محليًا داخل متصفحك؛ المقاطع الطويلة أو الكبيرة قد تستغرق وقتًا أطول.',
        en: 'Processing happens locally in your browser; longer or larger clips take more time.',
    }),
    inputs: Object.freeze([
        videoFileInput(),
        secondsInput('start', { ar: 'وقت البداية', en: 'Start time' }, 0, 0, 86400),
        secondsInput('end', { ar: 'وقت النهاية', en: 'End time' }, 3, 0.1, 86400),
        Object.freeze({
            id: 'fps',
            type: 'number',
            min: 5,
            max: 24,
            step: 1,
            placeholder: '12',
            label: Object.freeze({ ar: 'الإطارات في الثانية', en: 'Frames per second' }),
            unit: Object.freeze({ ar: 'fps', en: 'fps' }),
        }),
        Object.freeze({
            id: 'width',
            type: 'number',
            min: 120,
            max: 1080,
            step: 10,
            placeholder: '480',
            label: Object.freeze({ ar: 'العرض (بكسل)', en: 'Width (px)' }),
            unit: Object.freeze({ ar: 'px', en: 'px' }),
        }),
    ]),
    async process(values, language) {
        if (values.end <= values.start) {
            throw new Error(localized(language, 'وقت النهاية يجب أن يكون بعد البداية.', 'End time must be after start time.'));
        }
        const duration = Math.min(values.end - values.start, 15);
        const fps = Math.round(values.fps) || 12;
        const width = Math.round(values.width) || 480;
        const blob = await processVideo(
            values.video,
            [
                '-ss', String(values.start),
                '-t', String(duration),
                '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos`,
                '-loop', '0',
            ],
            'clip.gif',
            'image/gif',
        );
        return fileResult(blob, 'adawaty-clip.gif', language, 'ملف GIF جاهز', 'GIF file is ready');
    },
});

const documentMediaDefinitions = Object.freeze(Object.fromEntries([
    pdfCompressor,
    heicToJpgConverter,
    heicToPngConverter,
    faviconGenerator,
    videoToGifConverter,
].map((definition) => [definition.id, definition])));

export { documentMediaDefinitions };
