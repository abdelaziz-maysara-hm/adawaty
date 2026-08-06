import {
    assertPdfFile,
    createPdfBlob,
    loadPdfLib,
    outputName,
    parsePageSelection,
} from '../pdf-processing.js';

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

function textInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function numberInput(id, ar, en, placeholder, min, max) {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 1,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function angleInput() {
    return Object.freeze({
        id: 'angle',
        type: 'select',
        label: Object.freeze({ ar: 'تدوير كل الصفحات', en: 'Rotate all pages' }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze([0, 90, 180, 270].map((angle) => Object.freeze({
            value: String(angle),
            label: Object.freeze({
                ar: angle === 0 ? 'بدون تدوير' : `${angle} درجة`,
                en: angle === 0 ? 'No rotation' : `${angle} degrees`,
            }),
        }))),
    });
}

function result(blob, filename, pageCount, language, ar, en) {
    return {
        value: localized(language, `${pageCount} صفحة`, `${pageCount} pages`),
        label: localized(language, ar, en),
        details: `${(blob.size / 1024).toFixed(1)} KB`,
        download: { blob, filename },
    };
}

function parseOptionalPages(value, pageCount) {
    const normalized = String(value ?? '').trim().toLowerCase();
    return !normalized || normalized === 'none'
        ? []
        : parsePageSelection(normalized, pageCount);
}

function drawWatermark(document, pages, text, fontSize, opacity, pdfLib, orientation = 'diagonal') {
    if (!text || text === '-') {
        return Promise.resolve();
    }
    return document.embedFont(pdfLib.StandardFonts.HelveticaBold)
        .then((font) => {
            pages.forEach((page) => {
                const { width, height } = page.getSize();
                const textWidth = font.widthOfTextAtSize(text, fontSize);
                const x = orientation === 'vertical' ? width / 2 : Math.max(18, (width - textWidth) / 2);
                const y = orientation === 'vertical' ? Math.max(18, (height - textWidth) / 2) : height / 2;
                page.drawText(text, {
                    x,
                    y,
                    size: fontSize,
                    font,
                    color: pdfLib.rgb(0.35, 0.35, 0.35),
                    opacity,
                    rotate: pdfLib.degrees(orientation === 'vertical' ? 90 : orientation === 'horizontal' ? 0 : -35),
                });
            });
        });
}

const pageRemover = Object.freeze({
    id: 'pdf-page-remover',
    category: 'pdf',
    icon: 'PDF−',
    action: Object.freeze({ ar: 'احذف الصفحات', en: 'Remove pages' }),
    title: Object.freeze({ ar: 'حذف صفحات من PDF', en: 'Remove PDF Pages' }),
    description: Object.freeze({
        ar: 'احذف صفحات أو نطاقات غير مطلوبة وأنشئ ملف PDF جديدًا.',
        en: 'Delete unwanted pages or ranges and create a new PDF.',
    }),
    note: Object.freeze({
        ar: 'اكتب مثلًا 2,4-6. تتم المعالجة محليًا ولا يُرفع الملف.',
        en: 'Enter a selection such as 2,4-6. Processing is local and the file is not uploaded.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        textInput('pages', 'الصفحات المراد حذفها', 'Pages to remove', '2,4-6'),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const { PDFDocument } = await loadPdfLib();
        const source = await PDFDocument.load(await values.pdf.arrayBuffer());
        const removed = new Set(parsePageSelection(values.pages, source.getPageCount()));
        const kept = source.getPageIndices().filter((index) => !removed.has(index));
        if (kept.length === 0) {
            throw new Error(localized(language, 'لا يمكن حذف كل الصفحات.', 'You cannot remove every page.'));
        }
        const document = await PDFDocument.create();
        const pages = await document.copyPages(source, kept);
        pages.forEach((page) => document.addPage(page));
        const blob = createPdfBlob(await document.save());
        return result(blob, outputName(values.pdf, 'pages-removed'), pages.length, language, 'تم حذف الصفحات', 'Pages removed');
    },
});

const watermark = Object.freeze({
    id: 'pdf-watermark',
    category: 'pdf',
    icon: 'PDF©',
    action: Object.freeze({ ar: 'أضف العلامة المائية', en: 'Add watermark' }),
    title: Object.freeze({ ar: 'إضافة علامة مائية إلى PDF', en: 'Add PDF Watermark' }),
    description: Object.freeze({
        ar: 'أضف نصًا شفافًا قطريًا إلى جميع صفحات ملف PDF.',
        en: 'Add diagonal transparent text to every page of a PDF.',
    }),
    note: Object.freeze({
        ar: 'تُطبق العلامة داخل متصفحك ولا يغادر المستند جهازك.',
        en: 'The watermark is applied in your browser and the document stays on your device.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        textInput('watermark', 'نص العلامة المائية', 'Watermark text', 'CONFIDENTIAL'),
        numberInput('fontSize', 'حجم النص', 'Text size', 48, 12, 160),
        numberInput('opacity', 'الشفافية', 'Opacity', 25, 5, 100),
        Object.freeze({ id: 'orientation', type: 'select', label: Object.freeze({ ar: 'اتجاه العلامة', en: 'Watermark orientation' }), unit: Object.freeze({ ar: '', en: '' }), options: Object.freeze([
            Object.freeze({ value: 'diagonal', label: Object.freeze({ ar: 'قطري', en: 'Diagonal' }) }),
            Object.freeze({ value: 'horizontal', label: Object.freeze({ ar: 'أفقي', en: 'Horizontal' }) }),
            Object.freeze({ value: 'vertical', label: Object.freeze({ ar: 'رأسي', en: 'Vertical' }) }),
        ]) }),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const pdfLib = await loadPdfLib();
        const document = await pdfLib.PDFDocument.load(await values.pdf.arrayBuffer());
        await drawWatermark(
            document,
            document.getPages(),
            values.watermark,
            values.fontSize,
            values.opacity / 100,
            pdfLib,
            values.orientation,
        );
        const blob = createPdfBlob(await document.save());
        return result(blob, outputName(values.pdf, 'watermarked'), document.getPageCount(), language, 'تمت إضافة العلامة المائية', 'Watermarked PDF is ready');
    },
});

const workflow = Object.freeze({
    id: 'pdf-workflow',
    category: 'pdf',
    icon: 'PDF×',
    action: Object.freeze({ ar: 'نفّذ عمليات PDF', en: 'Run PDF workflow' }),
    title: Object.freeze({ ar: 'معالجة PDF متعددة العمليات', en: 'PDF Multi-Tool Workflow' }),
    description: Object.freeze({
        ar: 'أعد ترتيب الصفحات واحذف صفحات ودوّر المستند وأضف علامة مائية في عملية واحدة.',
        en: 'Reorder and remove pages, rotate the document and add a watermark in one operation.',
    }),
    note: Object.freeze({
        ar: 'للترتيب استخدم all أو مثلًا 3,1,2,4-6. للحذف استخدم none أو نطاقًا. اكتب - دون علامة مائية.',
        en: 'Use all or 3,1,2,4-6 for order. Use none or a range for removal. Enter - for no watermark.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        textInput('order', 'ترتيب الصفحات', 'Page order', 'all'),
        textInput('remove', 'الصفحات المحذوفة', 'Pages to remove', 'none'),
        angleInput(),
        textInput('watermark', 'العلامة المائية (- بدون)', 'Watermark (- for none)', '-'),
        numberInput('fontSize', 'حجم العلامة', 'Watermark size', 42, 12, 160),
        numberInput('opacity', 'شفافية العلامة', 'Watermark opacity', 20, 5, 100),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const pdfLib = await loadPdfLib();
        const source = await pdfLib.PDFDocument.load(await values.pdf.arrayBuffer());
        const pageCount = source.getPageCount();
        const removed = new Set(parseOptionalPages(values.remove, pageCount));
        const order = parsePageSelection(values.order, pageCount)
            .filter((index) => !removed.has(index));
        if (order.length === 0) {
            throw new Error(localized(language, 'يجب الاحتفاظ بصفحة واحدة على الأقل.', 'Keep at least one page.'));
        }

        const document = await pdfLib.PDFDocument.create();
        const pages = await document.copyPages(source, order);
        const angle = Number(values.angle);
        pages.forEach((page) => {
            if (angle) {
                page.setRotation(pdfLib.degrees((page.getRotation().angle + angle) % 360));
            }
            document.addPage(page);
        });
        await drawWatermark(
            document,
            pages,
            values.watermark,
            values.fontSize,
            values.opacity / 100,
            pdfLib,
            values.orientation,
        );
        const blob = createPdfBlob(await document.save());
        return result(blob, outputName(values.pdf, 'processed'), pages.length, language, 'اكتملت عمليات PDF', 'PDF workflow complete');
    },
});

const pdfWorkflowToolDefinitions = Object.freeze({
    [pageRemover.id]: pageRemover,
    [watermark.id]: watermark,
    [workflow.id]: workflow,
});

export { pdfWorkflowToolDefinitions };

// END OF FILE
