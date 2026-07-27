import { canvasToBlob } from '../image-processing.js';
import {
    assertPdfFile,
    createPdfBlob,
    loadPdfJs,
    loadPdfLib,
} from '../pdf-processing.js';

const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
let zipPromise;

function loadZip() {
    zipPromise ??= import(JSZIP_URL).then((module) => module.default);
    return zipPromise;
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput({
    id,
    accept,
    multiple = false,
    ar,
    en,
}) {
    return Object.freeze({
        id,
        type: 'file',
        accept,
        multiple,
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
        options: Object.freeze(options.map(([value, arLabel, enLabel]) => Object.freeze({
            value,
            label: Object.freeze({ ar: arLabel, en: enLabel }),
        }))),
    });
}

function numberInput(id, ar, en, value, min, max) {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 0.25,
        placeholder: String(value),
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '×', en: '×' }),
    });
}

async function imageBytes(file) {
    if (!(file instanceof File) || ![
        'image/jpeg',
        'image/png',
        'image/webp',
    ].includes(file.type)) {
        throw new Error('Choose JPG, PNG or WebP images.');
    }

    if (file.type !== 'image/webp') {
        return {
            bytes: await file.arrayBuffer(),
            type: file.type,
        };
    }

    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext('2d');
    if (!context) {
        bitmap.close();
        throw new Error('Image conversion is unavailable.');
    }
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await canvasToBlob(canvas, 'image/png');
    return { bytes: await blob.arrayBuffer(), type: 'image/png' };
}

const imagesToPdf = Object.freeze({
    id: 'images-to-pdf-converter',
    category: 'pdf',
    icon: 'IMG→PDF',
    action: Object.freeze({ ar: 'أنشئ PDF', en: 'Create PDF' }),
    title: Object.freeze({ ar: 'تحويل الصور إلى PDF', en: 'Images to PDF Converter' }),
    description: Object.freeze({
        ar: 'اجمع صور JPG وPNG وWebP بالترتيب في ملف PDF واحد، مع صفحة مستقلة لكل صورة.',
        en: 'Combine ordered JPG, PNG and WebP images into one PDF with one image per page.',
    }),
    note: Object.freeze({
        ar: 'تتم المعالجة داخل جهازك. اختر الصور بالترتيب المطلوب قبل إنشاء المستند.',
        en: 'Processing stays on your device. Select images in the desired page order.',
    }),
    inputs: Object.freeze([
        fileInput({
            id: 'images',
            accept: 'image/jpeg,image/png,image/webp',
            multiple: true,
            ar: 'اختر الصور بالترتيب',
            en: 'Choose images in order',
        }),
    ]),
    async process(values, language) {
        if (!Array.isArray(values.images) || values.images.length === 0) {
            throw new Error(localized(
                language,
                'اختر صورة واحدة على الأقل.',
                'Choose at least one image.',
            ));
        }

        const { PDFDocument } = await loadPdfLib();
        const document = await PDFDocument.create();

        for (const file of values.images) {
            const source = await imageBytes(file);
            const embedded = source.type === 'image/jpeg'
                ? await document.embedJpg(source.bytes)
                : await document.embedPng(source.bytes);
            const dimensions = embedded.scale(1);
            const scale = Math.min(
                1,
                2000 / Math.max(dimensions.width, dimensions.height),
            );
            const width = Math.max(1, dimensions.width * scale);
            const height = Math.max(1, dimensions.height * scale);
            const page = document.addPage([width, height]);
            page.drawImage(embedded, { x: 0, y: 0, width, height });
        }

        const blob = createPdfBlob(await document.save());
        return {
            value: localized(
                language,
                `${values.images.length} صفحة`,
                `${values.images.length} pages`,
            ),
            label: localized(
                language,
                'ملف PDF جاهز',
                'PDF document is ready',
            ),
            details: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
            download: {
                blob,
                filename: 'adawaty-images.pdf',
            },
        };
    },
});

const pdfToImages = Object.freeze({
    id: 'pdf-to-images-converter',
    category: 'pdf',
    icon: 'PDF→IMG',
    action: Object.freeze({ ar: 'حوّل الصفحات', en: 'Convert pages' }),
    title: Object.freeze({ ar: 'تحويل PDF إلى صور', en: 'PDF to Images Converter' }),
    description: Object.freeze({
        ar: 'حوّل كل صفحات مستند PDF إلى صور JPG أو PNG عالية الجودة ونزّلها داخل ZIP.',
        en: 'Render every PDF page as a high-quality JPG or PNG and download all images in a ZIP.',
    }),
    note: Object.freeze({
        ar: 'المستند لا يغادر جهازك. يحتاج المتصفح إلى تحميل محرك PDF ومكتبة ZIP أول مرة.',
        en: 'The document stays on your device. The browser loads the PDF and ZIP engines on first use.',
    }),
    inputs: Object.freeze([
        fileInput({
            id: 'pdf',
            accept: 'application/pdf,.pdf',
            ar: 'اختر ملف PDF',
            en: 'Choose a PDF file',
        }),
        selectInput('format', 'صيغة الصور', 'Image format', [
            ['image/jpeg', 'JPG', 'JPG'],
            ['image/png', 'PNG', 'PNG'],
        ]),
        numberInput('scale', 'دقة الإخراج', 'Output resolution', 1.5, 0.5, 3),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const pdfJs = await loadPdfJs();
        const task = pdfJs.getDocument({
            data: new Uint8Array(await values.pdf.arrayBuffer()),
        });
        const pdfDocument = await task.promise;

        try {
            const JSZip = await loadZip();
            const zip = new JSZip();
            const extension = values.format === 'image/png' ? 'png' : 'jpg';
            const digits = String(pdfDocument.numPages).length;

            for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
                const page = await pdfDocument.getPage(pageNumber);
                const viewport = page.getViewport({ scale: values.scale });
                const canvas = document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const context = canvas.getContext('2d', { alpha: false });
                if (!context) {
                    throw new Error('PDF page rendering is unavailable.');
                }
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, canvas.width, canvas.height);
                await page.render({ canvasContext: context, viewport }).promise;
                const blob = await canvasToBlob(
                    canvas,
                    values.format,
                    values.format === 'image/jpeg' ? 0.92 : undefined,
                );
                const label = String(pageNumber).padStart(digits, '0');
                zip.file(`page-${label}.${extension}`, blob);
                page.cleanup();
            }

            const blob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: 6 },
            });
            return {
                value: localized(
                    language,
                    `${pdfDocument.numPages} صفحة`,
                    `${pdfDocument.numPages} pages`,
                ),
                label: localized(
                    language,
                    'صور صفحات PDF جاهزة',
                    'PDF page images are ready',
                ),
                details: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
                download: {
                    blob,
                    filename: 'adawaty-pdf-pages.zip',
                },
            };
        } finally {
            await pdfDocument.destroy();
        }
    },
});

const pdfImageToolDefinitions = Object.freeze({
    [imagesToPdf.id]: imagesToPdf,
    [pdfToImages.id]: pdfToImages,
});

export { pdfImageToolDefinitions };

// END OF FILE
