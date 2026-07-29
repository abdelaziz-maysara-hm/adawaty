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

function pdfInput(id = 'pdf', multiple = false) {
    return Object.freeze({
        id,
        type: 'file',
        accept: 'application/pdf,.pdf',
        multiple,
        label: Object.freeze({
            ar: multiple ? 'اختر ملفات PDF بالترتيب' : 'اختر ملف PDF',
            en: multiple ? 'Choose PDF files in order' : 'Choose a PDF file',
        }),
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

function result(blob, filename, pageCount, language, ar, en) {
    return {
        value: localized(language, `${pageCount} صفحة`, `${pageCount} pages`),
        label: localized(language, ar, en),
        details: `${(blob.size / 1024).toFixed(1)} KB`,
        download: { blob, filename },
    };
}

const PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792],
};

function orientedSize([width, height], sourceWidth, sourceHeight) {
    const isLandscape = sourceWidth > sourceHeight;
    const long = Math.max(width, height);
    const short = Math.min(width, height);
    return isLandscape ? [long, short] : [short, long];
}

const mergePdf = Object.freeze({
    id: 'pdf-merge',
    category: 'pdf',
    icon: 'PDF+',
    action: Object.freeze({ ar: 'ادمج ملفات PDF', en: 'Merge PDF files' }),
    title: Object.freeze({ ar: 'دمج ملفات PDF', en: 'Merge PDF Files' }),
    description: Object.freeze({
        ar: 'ادمج عدة ملفات PDF في مستند واحد مع الحفاظ على ترتيب اختيارك.',
        en: 'Combine multiple PDF files into one document in your selected order.',
    }),
    note: Object.freeze({
        ar: 'تتم المعالجة داخل متصفحك ولا تُرفع ملفاتك. يلزم الإنترنت أول مرة لتحميل محرك PDF. اختر "الحجم الأصلي" إذا كانت كل ملفاتك بنفس المقاس أصلًا لتفادي أي تكبير أو تصغير غير ضروري.',
        en: 'Files are processed in your browser and never uploaded. Internet is needed once to load the PDF engine. Choose "Original size" if all your files already share the same page size, to avoid any unnecessary scaling.',
    }),
    inputs: Object.freeze([
        pdfInput('pdfs', true),
        selectInput('pageSize', { ar: 'مقاس صفحات الناتج', en: 'Output page size' }, [
            { value: 'original', label: { ar: 'الحجم الأصلي لكل صفحة (قد يختلف بين الملفات)', en: 'Original size per page (may vary between files)' } },
            { value: 'a4', label: { ar: 'توحيد الكل على A4', en: 'Unify all pages to A4' } },
            { value: 'letter', label: { ar: 'توحيد الكل على Letter', en: 'Unify all pages to Letter' } },
            { value: 'first-page', label: { ar: 'توحيد الكل حسب مقاس أول صفحة', en: 'Unify all pages to the first page\'s size' } },
        ]),
    ]),
    async process(values, language) {
        const files = values.pdfs;
        if (!Array.isArray(files) || files.length < 2) {
            throw new Error(localized(language, 'اختر ملفي PDF على الأقل.', 'Choose at least two PDF files.'));
        }
        files.forEach(assertPdfFile);

        const { PDFDocument } = await loadPdfLib();
        const merged = await PDFDocument.create();

        if (values.pageSize === 'original') {
            for (const file of files) {
                const source = await PDFDocument.load(await file.arrayBuffer());
                const pages = await merged.copyPages(source, source.getPageIndices());
                pages.forEach((page) => merged.addPage(page));
            }
            const blob = createPdfBlob(await merged.save());
            return result(blob, 'merged-document.pdf', merged.getPageCount(), language, 'تم دمج ملفات PDF', 'Merged PDF is ready');
        }

        // Normalized modes: embed every source page as an XObject and draw it
        // centered onto a uniform-size page, so mismatched page sizes across
        // files no longer produce a merged PDF with jarring size jumps.
        const sourceDocuments = await Promise.all(
            files.map(async (file) => PDFDocument.load(await file.arrayBuffer())),
        );

        let fixedTarget = null;
        if (values.pageSize === 'first-page') {
            const firstPage = sourceDocuments[0].getPage(0);
            fixedTarget = [firstPage.getWidth(), firstPage.getHeight()];
        } else {
            fixedTarget = PAGE_SIZES[values.pageSize] ?? PAGE_SIZES.a4;
        }

        for (const source of sourceDocuments) {
            for (const pageIndex of source.getPageIndices()) {
                const sourcePage = source.getPage(pageIndex);
                const sourceWidth = sourcePage.getWidth();
                const sourceHeight = sourcePage.getHeight();
                const [targetWidth, targetHeight] = values.pageSize === 'first-page'
                    ? fixedTarget
                    : orientedSize(fixedTarget, sourceWidth, sourceHeight);

                const embedded = await merged.embedPage(sourcePage);
                const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight);
                const drawWidth = sourceWidth * scale;
                const drawHeight = sourceHeight * scale;

                const newPage = merged.addPage([targetWidth, targetHeight]);
                newPage.drawPage(embedded, {
                    x: (targetWidth - drawWidth) / 2,
                    y: (targetHeight - drawHeight) / 2,
                    width: drawWidth,
                    height: drawHeight,
                });
            }
        }

        const blob = createPdfBlob(await merged.save());
        return result(blob, 'merged-document.pdf', merged.getPageCount(), language, 'تم دمج ملفات PDF', 'Merged PDF is ready');
    },
});

const extractPdfPages = Object.freeze({
    id: 'pdf-page-extractor',
    category: 'pdf',
    icon: 'PDF↗',
    action: Object.freeze({ ar: 'استخرج الصفحات', en: 'Extract pages' }),
    title: Object.freeze({ ar: 'استخراج صفحات PDF', en: 'Extract PDF Pages' }),
    description: Object.freeze({
        ar: 'أنشئ ملف PDF جديدًا من صفحات أو نطاقات تحددها.',
        en: 'Create a new PDF from selected pages or page ranges.',
    }),
    note: Object.freeze({
        ar: 'اكتب مثلًا 1-3,5,8. تتم المعالجة محليًا داخل جهازك.',
        en: 'Enter a selection such as 1-3,5,8. Processing stays on your device.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        Object.freeze({
            id: 'pages',
            type: 'text',
            label: Object.freeze({ ar: 'الصفحات المطلوبة', en: 'Pages to extract' }),
            unit: Object.freeze({ ar: '', en: '' }),
            placeholder: '1-3,5,8',
        }),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const { PDFDocument } = await loadPdfLib();
        const source = await PDFDocument.load(await values.pdf.arrayBuffer());
        const indices = parsePageSelection(values.pages, source.getPageCount());
        const extracted = await PDFDocument.create();
        const pages = await extracted.copyPages(source, indices);
        pages.forEach((page) => extracted.addPage(page));
        const blob = createPdfBlob(await extracted.save());
        return result(blob, outputName(values.pdf, 'pages'), pages.length, language, 'تم استخراج الصفحات', 'Extracted PDF is ready');
    },
});

const rotatePdfPages = Object.freeze({
    id: 'pdf-page-rotator',
    category: 'pdf',
    icon: 'PDF↻',
    action: Object.freeze({ ar: 'دوّر الصفحات', en: 'Rotate pages' }),
    title: Object.freeze({ ar: 'تدوير صفحات PDF', en: 'Rotate PDF Pages' }),
    description: Object.freeze({
        ar: 'دوّر كل صفحات ملف PDF أو صفحات محددة بزاوية 90 أو 180 أو 270 درجة.',
        en: 'Rotate every PDF page or selected pages by 90, 180 or 270 degrees.',
    }),
    note: Object.freeze({
        ar: 'اكتب all لكل الصفحات أو نطاقًا مثل 2-5,8. ملفك لا يغادر جهازك.',
        en: 'Enter all for every page or a range such as 2-5,8. Your file stays on your device.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        Object.freeze({
            id: 'pages',
            type: 'text',
            label: Object.freeze({ ar: 'الصفحات', en: 'Pages' }),
            unit: Object.freeze({ ar: '', en: '' }),
            placeholder: 'all',
        }),
        Object.freeze({
            id: 'angle',
            type: 'select',
            label: Object.freeze({ ar: 'زاوية التدوير', en: 'Rotation angle' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze([90, 180, 270].map((angle) => Object.freeze({
                value: String(angle),
                label: Object.freeze({ ar: `${angle} درجة`, en: `${angle} degrees` }),
            }))),
        }),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const { PDFDocument, degrees } = await loadPdfLib();
        const document = await PDFDocument.load(await values.pdf.arrayBuffer());
        const indices = parsePageSelection(values.pages, document.getPageCount());
        const angle = Number(values.angle);
        indices.forEach((index) => {
            const page = document.getPage(index);
            page.setRotation(degrees((page.getRotation().angle + angle) % 360));
        });
        const blob = createPdfBlob(await document.save());
        return result(blob, outputName(values.pdf, 'rotated'), document.getPageCount(), language, 'تم تدوير الصفحات', 'Rotated PDF is ready');
    },
});

const pdfFileToolDefinitions = Object.freeze({
    [mergePdf.id]: mergePdf,
    [extractPdfPages.id]: extractPdfPages,
    [rotatePdfPages.id]: rotatePdfPages,
});

export { pdfFileToolDefinitions };

// END OF FILE
