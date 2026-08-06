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

function parsePageOrder(value, pageCount, language) {
    const tokens = String(value ?? '')
        .split(',')
        .map((token) => token.trim())
        .filter(Boolean);
    if (tokens.length === 0) {
        throw new Error(localized(
            language,
            'اكتب ترتيب الصفحات مثل 3,1,2 أو 4-2,1.',
            'Enter a page order such as 3,1,2 or 4-2,1.',
        ));
    }

    const indices = [];
    for (const token of tokens) {
        const match = token.match(/^(\d+)(?:-(\d+))?$/);
        if (!match) {
            throw new Error(localized(
                language,
                'استخدم أرقام صفحات مفصولة بفواصل ونطاقات مثل 1,3-5.',
                'Use comma-separated page numbers and ranges such as 1,3-5.',
            ));
        }
        const start = Number(match[1]);
        const end = Number(match[2] ?? match[1]);
        if (start < 1 || start > pageCount || end < 1 || end > pageCount) {
            throw new Error(localized(
                language,
                `يجب أن تكون الصفحات بين 1 و${pageCount}.`,
                `Pages must be between 1 and ${pageCount}.`,
            ));
        }
        const step = start <= end ? 1 : -1;
        for (let page = start; ; page += step) {
            indices.push(page - 1);
            if (page === end) {
                break;
            }
        }
    }
    return indices;
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
    if (position.endsWith('-left')) {
        return margin;
    }
    if (position.endsWith('-right')) {
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
            ['top-center', 'أعلى المنتصف', 'Top center'],
            ['top-right', 'أعلى اليمين', 'Top right'],
            ['top-left', 'أعلى اليسار', 'Top left'],
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
                y: values.position.startsWith('top-') ? Math.max(8, page.getHeight() - values.fontSize - 20) : Math.min(20, Math.max(8, page.getHeight() * 0.04)),
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

const pageReorderer = Object.freeze({
    id: 'pdf-page-reorderer',
    category: 'pdf',
    icon: 'PDF⇅',
    action: Object.freeze({ ar: 'رتّب الصفحات', en: 'Reorder pages' }),
    title: Object.freeze({ ar: 'إعادة ترتيب صفحات PDF', en: 'Reorder PDF Pages' }),
    description: Object.freeze({
        ar: 'أنشئ نسخة جديدة من ملف PDF بترتيب صفحات مخصص، مع إمكانية تكرار صفحة أو حذفها من النتيجة.',
        en: 'Create a new PDF in a custom page order, with support for repeating or omitting pages.',
    }),
    note: Object.freeze({
        ar: 'اكتب 3,1,2 لتغيير الترتيب، أو 5-1 للعكس، أو كرر رقمًا لنسخ الصفحة. المعالجة محلية.',
        en: 'Enter 3,1,2 to reorder, 5-1 to reverse a range, or repeat a number to duplicate a page.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        Object.freeze({
            id: 'order',
            type: 'text',
            label: Object.freeze({ ar: 'ترتيب الصفحات الجديد', en: 'New page order' }),
            unit: Object.freeze({ ar: '', en: '' }),
            placeholder: '3,1,2,4-6',
        }),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const { PDFDocument } = await loadPdfLib();
        const source = await PDFDocument.load(await values.pdf.arrayBuffer());
        const indices = parsePageOrder(values.order, source.getPageCount(), language);
        const reordered = await PDFDocument.create();
        const pages = await reordered.copyPages(source, indices);
        pages.forEach((page) => reordered.addPage(page));
        const blob = createPdfBlob(await reordered.save());
        return pdfResult(
            blob,
            outputName(values.pdf, 'reordered'),
            reordered.getPageCount(),
            language,
            'تمت إعادة ترتيب الصفحات',
            'PDF pages reordered',
        );
    },
});

const pageReverser = Object.freeze({
    id: 'pdf-page-reverser',
    category: 'pdf',
    icon: 'PDF↕',
    action: Object.freeze({ ar: 'اعكس الصفحات', en: 'Reverse pages' }),
    title: Object.freeze({ ar: 'عكس ترتيب صفحات PDF', en: 'Reverse PDF Page Order' }),
    description: Object.freeze({
        ar: 'اعكس ترتيب جميع صفحات المستند بضغطة واحدة، لتصبح الصفحة الأخيرة هي الأولى.',
        en: 'Reverse every page in a PDF so the last page becomes the first.',
    }),
    note: Object.freeze({
        ar: 'مفيد للمستندات الممسوحة ضوئيًا أو المصدّرة بترتيب عكسي. الملف لا يغادر جهازك.',
        en: 'Useful for scans or exports saved in reverse order. The file never leaves your device.',
    }),
    inputs: Object.freeze([pdfInput()]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const { PDFDocument } = await loadPdfLib();
        const source = await PDFDocument.load(await values.pdf.arrayBuffer());
        const reversed = await PDFDocument.create();
        const indices = source.getPageIndices().reverse();
        const pages = await reversed.copyPages(source, indices);
        pages.forEach((page) => reversed.addPage(page));
        const blob = createPdfBlob(await reversed.save());
        return pdfResult(
            blob,
            outputName(values.pdf, 'reversed'),
            reversed.getPageCount(),
            language,
            'تم عكس ترتيب الصفحات',
            'PDF page order reversed',
        );
    },
});

const pdfInterleaver = Object.freeze({
    id: 'pdf-page-interleaver',
    category: 'pdf',
    icon: 'A↔B',
    action: Object.freeze({ ar: 'شابك ملفين', en: 'Interleave PDFs' }),
    title: Object.freeze({ ar: 'دمج صفحات ملفي PDF بالتبادل', en: 'Interleave Two PDF Files' }),
    description: Object.freeze({
        ar: 'ادمج ملفين بحيث تأتي صفحة من الأول ثم صفحة من الثاني بالتبادل، مع الاحتفاظ بالصفحات الزائدة.',
        en: 'Combine two PDFs by alternating one page from each file and retaining any remaining pages.',
    }),
    note: Object.freeze({
        ar: 'مفيد لدمج المسح الضوئي للصفحات الفردية والزوجية. اختر الملف الذي يحتوي الصفحة الأولى أولًا.',
        en: 'Ideal for combining odd-page and even-page scans. Select the file containing page one first.',
    }),
    inputs: Object.freeze([
        Object.freeze({ ...pdfInput(), id: 'firstPdf', label: Object.freeze({ ar: 'ملف PDF الأول', en: 'First PDF' }) }),
        Object.freeze({ ...pdfInput(), id: 'secondPdf', label: Object.freeze({ ar: 'ملف PDF الثاني', en: 'Second PDF' }) }),
    ]),
    async process(values, language) {
        assertPdfFile(values.firstPdf);
        assertPdfFile(values.secondPdf);
        const { PDFDocument } = await loadPdfLib();
        const first = await PDFDocument.load(await values.firstPdf.arrayBuffer());
        const second = await PDFDocument.load(await values.secondPdf.arrayBuffer());
        const output = await PDFDocument.create();
        const maxPages = Math.max(first.getPageCount(), second.getPageCount());

        for (let index = 0; index < maxPages; index += 1) {
            if (index < first.getPageCount()) {
                const [page] = await output.copyPages(first, [index]);
                output.addPage(page);
            }
            if (index < second.getPageCount()) {
                const [page] = await output.copyPages(second, [index]);
                output.addPage(page);
            }
        }

        const blob = createPdfBlob(await output.save());
        return pdfResult(
            blob,
            'interleaved-document.pdf',
            output.getPageCount(),
            language,
            'تم دمج الصفحات بالتبادل',
            'PDF pages interleaved',
        );
    },
});

const pdfDocumentToolDefinitions = Object.freeze({
    [pdfSplitter.id]: pdfSplitter,
    [metadataCleaner.id]: metadataCleaner,
    [pageNumberer.id]: pageNumberer,
    [pageReorderer.id]: pageReorderer,
    [pageReverser.id]: pageReverser,
    [pdfInterleaver.id]: pdfInterleaver,
});

export { pdfDocumentToolDefinitions };

// END OF FILE
