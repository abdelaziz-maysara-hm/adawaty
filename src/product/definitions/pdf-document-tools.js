import {
    assertPdfFile,
    createPdfBlob,
    loadPdfLib,
    outputName,
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

function pdfInput() {
    return Object.freeze({
        id: 'pdf',
        type: 'file',
        accept: 'application/pdf,.pdf',
        label: Object.freeze({ ar: 'اختر ملف PDF', en: 'Choose a PDF file' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, ar, en, value, min, max, unit = '') {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 1,
        placeholder: String(value),
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: unit, en: unit }),
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

function pdfResult(blob, filename, pageCount, language, ar, en) {
    return {
        value: localized(language, `${pageCount} صفحة`, `${pageCount} pages`),
        label: localized(language, ar, en),
        details: `${(blob.size / 1024).toFixed(1)} KB`,
        download: { blob, filename },
    };
}

const pdfSplitter = Object.freeze({
    id: 'pdf-splitter',
    category: 'pdf',
    icon: 'PDF÷',
    action: Object.freeze({ ar: 'قسّم PDF', en: 'Split PDF' }),
    title: Object.freeze({ ar: 'تقسيم PDF إلى صفحات منفصلة', en: 'Split PDF into Pages' }),
    description: Object.freeze({
        ar: 'قسّم مستند PDF إلى ملف مستقل لكل صفحة ونزّل جميع الملفات داخل ZIP واحد.',
        en: 'Split a PDF into one document per page and download every file in one ZIP.',
    }),
    note: Object.freeze({
        ar: 'تتم المعالجة داخل المتصفح ولا يُرفع المستند. المستندات الكبيرة قد تحتاج وقتًا وذاكرة إضافية.',
        en: 'Processing stays in the browser. Large documents may need additional time and memory.',
    }),
    inputs: Object.freeze([pdfInput()]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const { PDFDocument } = await loadPdfLib();
        const source = await PDFDocument.load(await values.pdf.arrayBuffer());
        const pageCount = source.getPageCount();
        const JSZip = await loadZip();
        const zip = new JSZip();
        const digits = String(pageCount).length;

        for (let index = 0; index < pageCount; index += 1) {
            const document = await PDFDocument.create();
            const [page] = await document.copyPages(source, [index]);
            document.addPage(page);
            const label = String(index + 1).padStart(digits, '0');
            zip.file(`page-${label}.pdf`, await document.save());
        }

        const blob = await zip.generateAsync({
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 },
        });
        return {
            value: localized(language, `${pageCount} ملف`, `${pageCount} files`),
            label: localized(
                language,
                'ملفات الصفحات جاهزة',
                'Split PDF files are ready',
            ),
            details: `${(blob.size / 1024 / 1024).toFixed(1)} MB`,
            download: {
                blob,
                filename: 'adawaty-split-pdf.zip',
            },
        };
    },
});

const metadataCleaner = Object.freeze({
    id: 'pdf-metadata-cleaner',
    category: 'pdf',
    icon: 'META',
    action: Object.freeze({ ar: 'نظّف البيانات', en: 'Clean metadata' }),
    title: Object.freeze({ ar: 'إزالة بيانات PDF الوصفية', en: 'PDF Metadata Cleaner' }),
    description: Object.freeze({
        ar: 'امسح العنوان والمؤلف والموضوع والكلمات المفتاحية وبيانات الإنشاء من ملف PDF.',
        en: 'Clear title, author, subject, keywords and creation metadata from a PDF.',
    }),
    note: Object.freeze({
        ar: 'تنظيف الخصائص لا يزيل النصوص أو الصور الظاهرة داخل صفحات المستند.',
        en: 'Cleaning document properties does not remove visible text or images from pages.',
    }),
    inputs: Object.freeze([pdfInput()]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const { PDFDocument } = await loadPdfLib();
        const document = await PDFDocument.load(await values.pdf.arrayBuffer(), {
            updateMetadata: false,
        });
        document.setTitle('');
        document.setAuthor('');
        document.setSubject('');
        document.setKeywords([]);
        document.setCreator('');
        document.setProducer('');
        document.setCreationDate(new Date(0));
        document.setModificationDate(new Date(0));
        const blob = createPdfBlob(await document.save());
        return pdfResult(
            blob,
            outputName(values.pdf, 'metadata-cleaned'),
            document.getPageCount(),
            language,
            'تم تنظيف بيانات PDF',
            'PDF metadata cleaned',
        );
    },
});

function numberPosition(page, textWidth, position) {
    const margin = 28;
    if (position === 'bottom-left') {
        return margin;
    }
    if (position === 'bottom-right') {
        return page.getWidth() - textWidth - margin;
    }
    return (page.getWidth() - textWidth) / 2;
}

const pageNumberer = Object.freeze({
    id: 'pdf-page-number-adder',
    category: 'pdf',
    icon: '#PDF',
    action: Object.freeze({ ar: 'أضف الأرقام', en: 'Add page numbers' }),
    title: Object.freeze({ ar: 'إضافة أرقام صفحات PDF', en: 'Add Page Numbers to PDF' }),
    description: Object.freeze({
        ar: 'أضف أرقامًا واضحة أسفل كل صفحة مع اختيار الموضع والرقم الذي يبدأ منه التسلسل.',
        en: 'Add clear numbers to every page with selectable placement and starting number.',
    }),
    note: Object.freeze({
        ar: 'تُضاف الأرقام داخل المستند نفسه مع الحفاظ على محتوى الصفحات الأصلي.',
        en: 'Numbers are embedded into the document while preserving original page content.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        numberInput('startNumber', 'ابدأ من الرقم', 'Start with number', 1, 0, 100000),
        numberInput('fontSize', 'حجم الرقم', 'Number size', 12, 6, 72, 'pt'),
        selectInput('position', 'موضع الرقم', 'Number position', [
            ['bottom-center', 'أسفل المنتصف', 'Bottom center'],
            ['bottom-right', 'أسفل اليمين', 'Bottom right'],
            ['bottom-left', 'أسفل اليسار', 'Bottom left'],
        ]),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const pdfLib = await loadPdfLib();
        const document = await pdfLib.PDFDocument.load(
            await values.pdf.arrayBuffer(),
        );
        const font = await document.embedFont(
            pdfLib.StandardFonts.Helvetica,
        );
        document.getPages().forEach((page, index) => {
            const text = String(values.startNumber + index);
            const width = font.widthOfTextAtSize(text, values.fontSize);
            page.drawText(text, {
                x: numberPosition(page, width, values.position),
                y: 20,
                size: values.fontSize,
                font,
                color: pdfLib.rgb(0.18, 0.18, 0.18),
            });
        });
        const blob = createPdfBlob(await document.save());
        return pdfResult(
            blob,
            outputName(values.pdf, 'numbered'),
            document.getPageCount(),
            language,
            'تمت إضافة أرقام الصفحات',
            'Page numbers added',
        );
    },
});

const pdfDocumentToolDefinitions = Object.freeze({
    [pdfSplitter.id]: pdfSplitter,
    [metadataCleaner.id]: metadataCleaner,
    [pageNumberer.id]: pageNumberer,
});

export { pdfDocumentToolDefinitions };

// END OF FILE
