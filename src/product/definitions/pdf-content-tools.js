import {
    assertPdfFile,
    createPdfBlob,
    loadPdfJs,
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

function result(blob, filename, value, language, ar, en) {
    return {
        value,
        label: localized(language, ar, en),
        details: `${(blob.size / 1024).toFixed(1)} KB`,
        download: { blob, filename },
    };
}

async function extractTextPages(file) {
    assertPdfFile(file);
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
    });
    const document = await loadingTask.promise;
    const pages = [];

    try {
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
            const page = await document.getPage(pageNumber);
            const content = await page.getTextContent();
            let text = '';
            for (const item of content.items) {
                if (!('str' in item)) {
                    continue;
                }
                text += item.str;
                text += item.hasEOL ? '\n' : ' ';
            }
            pages.push(text.replace(/[ \t]+\n/g, '\n').replace(/ {2,}/g, ' ').trim());
            page.cleanup();
        }
    } finally {
        await document.destroy();
    }
    return pages;
}

function xmlEscape(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&apos;');
}

function wordParagraph(text) {
    const lines = text.split(/\r?\n/);
    const runs = lines.map((line, index) => {
        const breakTag = index === 0 ? '' : '<w:br/>';
        return `<w:r>${breakTag}<w:t xml:space="preserve">${xmlEscape(line)}</w:t></w:r>`;
    }).join('');
    return `<w:p>${runs || '<w:r><w:t></w:t></w:r>'}</w:p>`;
}

async function createDocx(pages) {
    const JSZip = await loadZip();
    const zip = new JSZip();
    zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
    zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
    const body = pages.map((page, index) => {
        const pageBreak = index === pages.length - 1
            ? ''
            : '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
        return `${wordParagraph(page)}${pageBreak}`;
    }).join('');
    zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body>
</w:document>`);
    return zip.generateAsync({
        type: 'blob',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
    });
}

const pdfTextExtractor = Object.freeze({
    id: 'pdf-text-extractor',
    category: 'pdf',
    icon: 'PDF→TXT',
    action: Object.freeze({ ar: 'استخرج النص', en: 'Extract text' }),
    title: Object.freeze({ ar: 'استخراج النص من PDF', en: 'Extract Text from PDF' }),
    description: Object.freeze({
        ar: 'استخرج النص القابل للتحديد من جميع صفحات PDF ونزّله كملف TXT مرتب حسب الصفحات.',
        en: 'Extract selectable text from every PDF page and download it as a page-organized TXT file.',
    }),
    note: Object.freeze({
        ar: 'تعمل الأداة مع ملفات PDF النصية. المستندات المصورة تحتاج إلى OCR، وسنضيفه في مرحلة لاحقة.',
        en: 'This works with text-based PDFs. Image-only scans require OCR, which will be added separately.',
    }),
    inputs: Object.freeze([pdfInput()]),
    async process(values, language) {
        const pages = await extractTextPages(values.pdf);
        const text = pages.map((page, index) => (
            `--- ${localized(language, 'صفحة', 'Page')} ${index + 1} ---\n${page}`
        )).join('\n\n');
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const base = values.pdf.name.replace(/\.pdf$/i, '') || 'document';
        return result(
            blob,
            `${base}-text.txt`,
            localized(language, `${pages.length} صفحة`, `${pages.length} pages`),
            language,
            'تم استخراج النص',
            'PDF text extracted',
        );
    },
});

const pdfToWord = Object.freeze({
    id: 'pdf-to-word-converter',
    category: 'pdf',
    icon: 'PDF→DOCX',
    action: Object.freeze({ ar: 'حوّل إلى Word', en: 'Convert to Word' }),
    title: Object.freeze({ ar: 'تحويل PDF إلى Word', en: 'PDF to Word Converter' }),
    description: Object.freeze({
        ar: 'حوّل النص القابل للتحديد داخل PDF إلى مستند Word قابل للتحرير مع فصل محتوى كل صفحة.',
        en: 'Convert selectable PDF text into an editable Word document while preserving page separation.',
    }),
    note: Object.freeze({
        ar: 'يركز التحويل المحلي على النص وسيفقد بعض تنسيق الصفحة المعقد. الملفات المصورة تحتاج إلى OCR.',
        en: 'Local conversion focuses on text and may not preserve complex layouts. Scanned images require OCR.',
    }),
    inputs: Object.freeze([pdfInput()]),
    async process(values, language) {
        const pages = await extractTextPages(values.pdf);
        const blob = await createDocx(pages);
        const base = values.pdf.name.replace(/\.pdf$/i, '') || 'document';
        return result(
            blob,
            `${base}.docx`,
            localized(language, `${pages.length} صفحة`, `${pages.length} pages`),
            language,
            'مستند Word جاهز',
            'Word document is ready',
        );
    },
});

const pageSizes = Object.freeze({
    a4: Object.freeze([595.28, 841.89]),
    letter: Object.freeze([612, 792]),
    legal: Object.freeze([612, 1008]),
});

const pdfPageSizeNormalizer = Object.freeze({
    id: 'pdf-page-size-normalizer',
    category: 'pdf',
    icon: 'PDF□',
    action: Object.freeze({ ar: 'وحّد المقاس', en: 'Normalize pages' }),
    title: Object.freeze({ ar: 'توحيد مقاس صفحات PDF', en: 'Normalize PDF Page Size' }),
    description: Object.freeze({
        ar: 'حوّل كل صفحات المستند إلى A4 أو Letter أو Legal مع توسيط المحتوى والحفاظ على نسبه.',
        en: 'Convert every page to A4, Letter or Legal while centering content and preserving its proportions.',
    }),
    note: Object.freeze({
        ar: 'يتم تصغير المحتوى الكبير أو تكبيره ليلائم الصفحة الجديدة بدون قص.',
        en: 'Content is scaled up or down to fit the new page without cropping.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        Object.freeze({
            id: 'pageSize',
            type: 'select',
            label: Object.freeze({ ar: 'مقاس الصفحة', en: 'Page size' }),
            unit: Object.freeze({ ar: '', en: '' }),
            options: Object.freeze([
                Object.freeze({ value: 'a4', label: Object.freeze({ ar: 'A4', en: 'A4' }) }),
                Object.freeze({ value: 'letter', label: Object.freeze({ ar: 'Letter', en: 'Letter' }) }),
                Object.freeze({ value: 'legal', label: Object.freeze({ ar: 'Legal', en: 'Legal' }) }),
            ]),
        }),
        Object.freeze({
            id: 'margin',
            type: 'number',
            min: 0,
            max: 100,
            step: 1,
            placeholder: '24',
            label: Object.freeze({ ar: 'الهامش', en: 'Margin' }),
            unit: Object.freeze({ ar: 'نقطة', en: 'pt' }),
        }),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const { PDFDocument } = await loadPdfLib();
        const source = await PDFDocument.load(await values.pdf.arrayBuffer());
        const output = await PDFDocument.create();
        const [targetWidth, targetHeight] = pageSizes[values.pageSize] ?? pageSizes.a4;
        const margin = Number(values.margin);

        for (const sourcePage of source.getPages()) {
            const embedded = await output.embedPage(sourcePage);
            const availableWidth = targetWidth - (margin * 2);
            const availableHeight = targetHeight - (margin * 2);
            const scale = Math.min(
                availableWidth / embedded.width,
                availableHeight / embedded.height,
            );
            const width = embedded.width * scale;
            const height = embedded.height * scale;
            const page = output.addPage([targetWidth, targetHeight]);
            page.drawPage(embedded, {
                x: (targetWidth - width) / 2,
                y: (targetHeight - height) / 2,
                width,
                height,
            });
        }

        const blob = createPdfBlob(await output.save());
        return result(
            blob,
            outputName(values.pdf, `${values.pageSize}-pages`),
            localized(language, `${output.getPageCount()} صفحة`, `${output.getPageCount()} pages`),
            language,
            'تم توحيد مقاسات الصفحات',
            'PDF page sizes normalized',
        );
    },
});

const pdfContentToolDefinitions = Object.freeze({
    [pdfTextExtractor.id]: pdfTextExtractor,
    [pdfToWord.id]: pdfToWord,
    [pdfPageSizeNormalizer.id]: pdfPageSizeNormalizer,
});

export {
    createDocx,
    pdfContentToolDefinitions,
};

// END OF FILE
