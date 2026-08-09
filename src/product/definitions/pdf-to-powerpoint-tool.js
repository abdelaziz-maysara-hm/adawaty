import { assertPdfFile, loadPdfJs } from '../pdf-processing.js';

const PPTXGEN_URL = 'https://cdn.jsdelivr.net/npm/pptxgenjs@4.0.1/dist/pptxgen.bundle.js';
const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
let pptxPromise;

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fitInside(sourceWidth, sourceHeight, targetWidth, targetHeight) {
    const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
    const width = sourceWidth * scale;
    const height = sourceHeight * scale;
    return Object.freeze({
        x: (targetWidth - width) / 2,
        y: (targetHeight - height) / 2,
        width,
        height,
    });
}

function loadPptxGen() {
    if (globalThis.PptxGenJS) {
        return Promise.resolve(globalThis.PptxGenJS);
    }
    pptxPromise ??= new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = PPTXGEN_URL;
        script.async = true;
        script.onload = () => {
            if (globalThis.PptxGenJS) resolve(globalThis.PptxGenJS);
            else reject(new Error('PowerPoint engine did not initialize.'));
        };
        script.onerror = () => reject(new Error('Unable to load the PowerPoint engine.'));
        document.head.append(script);
    }).catch((error) => {
        pptxPromise = undefined;
        throw error;
    });
    return pptxPromise;
}

async function renderPdfPage(page, quality) {
    const baseViewport = page.getViewport({ scale: 1 });
    const maxDimension = quality === 'high' ? 2400 : quality === 'compact' ? 1400 : 1900;
    const scale = Math.min(3, maxDimension / Math.max(baseViewport.width, baseViewport.height));
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas rendering is unavailable.');
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport }).promise;
    const mime = quality === 'high' ? 'image/png' : 'image/jpeg';
    const data = canvas.toDataURL(mime, quality === 'compact' ? 0.78 : 0.9);
    page.cleanup();
    return Object.freeze({ data, width: viewport.width, height: viewport.height });
}

const pdfToPowerPoint = Object.freeze({
    id: 'pdf-to-powerpoint-converter',
    category: 'pdf',
    icon: 'PPTX',
    action: Object.freeze({ ar: 'حوّل إلى PowerPoint', en: 'Convert to PowerPoint' }),
    title: Object.freeze({ ar: 'تحويل PDF إلى PowerPoint', en: 'PDF to PowerPoint Converter' }),
    description: Object.freeze({
        ar: 'حوّل كل صفحة PDF إلى شريحة PowerPoint عالية الجودة مع الحفاظ على الشكل والصور والخطوط كما تظهر في الملف الأصلي.',
        en: 'Convert every PDF page into a high-quality PowerPoint slide while preserving its visual layout, images, and fonts.',
    }),
    note: Object.freeze({
        ar: 'تُحفظ الصفحات كصور داخل الشرائح للحفاظ على التنسيق؛ النص غير قابل للتحرير في هذه النسخة. تتم المعالجة محليًا ولا يُرفع الملف.',
        en: 'Pages are placed as slide images to preserve formatting; text is not editable in this version. Processing stays local and the file is never uploaded.',
    }),
    tags: Object.freeze(['pdf', 'powerpoint', 'pptx', 'presentation', 'converter', 'slides', 'processing']),
    inputs: Object.freeze([
        Object.freeze({
            id: 'pdf',
            type: 'file',
            accept: 'application/pdf,.pdf',
            label: Object.freeze({ ar: 'اختر ملف PDF', en: 'Choose a PDF file' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
        Object.freeze({
            id: 'quality',
            type: 'select',
            label: Object.freeze({ ar: 'جودة الشرائح', en: 'Slide quality' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze([
                Object.freeze({ value: 'balanced', label: Object.freeze({ ar: 'متوازنة', en: 'Balanced' }) }),
                Object.freeze({ value: 'high', label: Object.freeze({ ar: 'عالية', en: 'High' }) }),
                Object.freeze({ value: 'compact', label: Object.freeze({ ar: 'حجم أصغر', en: 'Smaller file' }) }),
            ]),
        }),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        let document;
        try {
            const [pdfjs, PptxGenJS] = await Promise.all([loadPdfJs(), loadPptxGen()]);
            document = await pdfjs.getDocument({
                data: new Uint8Array(await values.pdf.arrayBuffer()),
            }).promise;
            if (document.numPages > 100) {
                throw new Error('PDF files are limited to 100 slides per conversion.');
            }

            const pptx = new PptxGenJS();
            pptx.layout = 'LAYOUT_WIDE';
            pptx.author = 'Adawaty';
            pptx.subject = 'PDF conversion';
            pptx.title = values.pdf.name.replace(/\.pdf$/i, '');
            pptx.company = 'Adawaty';
            pptx.lang = language === 'ar' ? 'ar-EG' : 'en-US';

            for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
                const page = await document.getPage(pageNumber);
                const rendered = await renderPdfPage(page, values.quality ?? 'balanced');
                const placement = fitInside(rendered.width, rendered.height, 13.333, 7.5);
                const slide = pptx.addSlide();
                slide.background = { color: 'FFFFFF' };
                slide.addImage({
                    data: rendered.data,
                    x: placement.x,
                    y: placement.y,
                    w: placement.width,
                    h: placement.height,
                });
            }

            const output = await pptx.write({ outputType: 'blob', compression: true });
            const blob = output instanceof Blob ? output : new Blob([output], { type: PPTX_MIME });
            const baseName = values.pdf.name.replace(/\.pdf$/i, '') || 'presentation';
            return {
                value: localized(language, `${document.numPages} شريحة`, `${document.numPages} slides`),
                label: localized(language, 'ملف PowerPoint جاهز', 'PowerPoint file is ready'),
                details: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
                download: { blob, filename: `${baseName}.pptx` },
            };
        } catch (error) {
            throw new Error(localized(
                language,
                'تعذّر تحويل ملف PDF. جرّب ملفًا صالحًا أو جودة أقل إذا كان الملف كبيرًا.',
                'Unable to convert the PDF. Try a valid file or lower quality for a large document.',
            ), { cause: error });
        } finally {
            await document?.destroy();
        }
    },
});

const pdfToPowerPointToolDefinitions = Object.freeze({
    [pdfToPowerPoint.id]: pdfToPowerPoint,
});

export { fitInside, pdfToPowerPointToolDefinitions };

// END OF FILE
