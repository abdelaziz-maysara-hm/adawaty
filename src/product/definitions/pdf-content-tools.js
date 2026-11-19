import {
    assertPdfFile,
    createPdfBlob,
    loadPdfJs,
    loadPdfLib,
    outputName,
} from '../pdf-processing.js';
import { pdfToDocx } from '../pdf-to-word-engine.js';

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

function groupTextItemsIntoBlocks(items) {
    // Group text items into lines using their baseline Y position.
    const lines = [];
    let currentLine = null;
    for (const item of items) {
        if (!('str' in item) || item.str === '') continue;
        const fontSize = Math.hypot(item.transform[2], item.transform[3]) || 1;
        const y = item.transform[5];
        const x = item.transform[4];
        if (currentLine && Math.abs(currentLine.y - y) < fontSize * 0.4) {
            currentLine.text += ` ${item.str}`;
            currentLine.fontSizes.push(fontSize);
            currentLine.maxX = Math.max(currentLine.maxX, x);
        } else {
            currentLine = {
                y, minX: x, maxX: x, text: item.str, fontSizes: [fontSize],
            };
            lines.push(currentLine);
        }
        if (item.hasEOL) currentLine = null;
    }

    // Compute each line's dominant font size and the page's typical body size.
    for (const line of lines) {
        line.fontSize = line.fontSizes.reduce((a, b) => a + b, 0) / line.fontSizes.length;
    }
    const sizeCounts = new Map();
    for (const line of lines) {
        const rounded = Math.round(line.fontSize);
        sizeCounts.set(rounded, (sizeCounts.get(rounded) ?? 0) + line.text.length);
    }
    let bodySize = 12;
    let bestWeight = -1;
    for (const [size, weight] of sizeCounts) {
        if (weight > bestWeight) { bestWeight = weight; bodySize = size; }
    }

    // Group consecutive lines into paragraphs based on vertical gaps.
    const blocks = [];
    let paragraphLines = [];
    let previousY = null;
    const flush = () => {
        if (paragraphLines.length === 0) return;
        const text = paragraphLines.map((line) => line.text).join(' ').replace(/\s{2,}/g, ' ').trim();
        if (text) {
            const avgSize = paragraphLines.reduce((sum, line) => sum + line.fontSize, 0) / paragraphLines.length;
            blocks.push({ text, fontSize: avgSize });
        }
        paragraphLines = [];
    };
    for (const line of lines) {
        const gap = previousY === null ? 0 : Math.abs(previousY - line.y);
        if (previousY !== null && gap > line.fontSize * 1.6) {
            flush();
        }
        paragraphLines.push({ text: line.text.trim(), fontSize: line.fontSize });
        previousY = line.y;
    }
    flush();

    return blocks.map((block) => {
        const ratio = block.fontSize / bodySize;
        const wordCount = block.text.split(/\s+/).length;
        const level = ratio >= 1.6 && wordCount <= 18 ? 1
            : ratio >= 1.25 && wordCount <= 20 ? 2
                : 0;
        return { text: block.text, headingLevel: level, fontSize: block.fontSize };
    });
}

async function extractStructuredPages(file) {
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
            pages.push(groupTextItemsIntoBlocks(content.items));
            page.cleanup();
        }
    } finally {
        await document.destroy();
    }
    return pages;
}

function structuredPagesToMarkdown(pages) {
    return pages.map((blocks, pageIndex) => {
        const content = blocks.map((block) => {
            const text = String(block.text ?? '').trim();
            if (!text) return '';
            return block.headingLevel > 0
                ? `${'#'.repeat(Math.min(6, block.headingLevel))} ${text}`
                : text;
        }).filter(Boolean).join('\n\n');
        return `<!-- Page ${pageIndex + 1} -->\n\n${content}`.trimEnd();
    }).join('\n\n---\n\n');
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
        ar: 'حوّل ملف PDF إلى مستند Word قابل للتعديل مع الحفاظ على العناوين وأحجام الخطوط والعريض والمائل والألوان والقوائم والجداول ذات الحدود والصور، ويدعم النص العربي من اليمين لليسار.',
        en: 'Convert a PDF into an editable Word document that keeps headings, font sizes, bold/italic, colours, lists, bordered tables and images, with right-to-left Arabic support.',
    }),
    note: Object.freeze({
        ar: 'يتم التحويل بالكامل داخل متصفحك. الجداول بدون حدود تظهر كفقرات، والتخطيطات متعددة الأعمدة والنصوص فوق الصور قد تحتاج إلى مراجعة. الصفحات الممسوحة ضوئيًا أو التي لا يمكن قراءة نصها تُضاف كصورة (استخدم أداة OCR لاستخراج نصها). قد تظهر أخطاء بسيطة في التشكيل أو علامات الترقيم العربية في بعض الملفات؛ راجع الناتج.',
        en: 'Conversion runs entirely in your browser. Tables without borders come out as paragraphs, and multi-column layouts or text over images may need review. Scanned pages, or pages whose text cannot be decoded, are added as a picture (use the OCR tool to get their text). Some files may show small errors in Arabic diacritics or punctuation, so check the result.',
    }),
    faq: Object.freeze([
        Object.freeze({
            questionAr: 'ما الذي يُحفظ في ملف Word الناتج، وما حدوده؟',
            questionEn: 'What is kept in the Word file, and what are the limits?',
            answerAr: 'تُحفظ الفقرات والعناوين وأحجام الخطوط والعريض والمائل والتسطير والألوان والقوائم النقطية والمرقّمة والجداول ذات الحدود والصور وفواصل الصفحات واتجاه النص العربي. لا يُعاد بناء الجداول بدون حدود والأعمدة المتعددة والرؤوس والتذييلات بدقة، والصفحات الممسوحة ضوئيًا أو التي لا يمكن قراءة نصها تُضاف كصورة. قد تختلف المسافات وفواصل الأسطر قليلًا عن الأصل.',
            answerEn: 'Paragraphs, headings, font sizes, bold, italic, underline, colours, bulleted and numbered lists, bordered tables, images, page breaks and Arabic right-to-left text are kept. Tables without borders, multiple columns and headers/footers are not rebuilt exactly, and scanned pages or pages whose text cannot be decoded are added as a picture. Spacing and line breaks may differ slightly from the original.',
        }),
    ]),
    inputs: Object.freeze([pdfInput()]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        let converted;
        try {
            converted = await pdfToDocx(await values.pdf.arrayBuffer());
        } catch (error) {
            console.error(error);
            throw new Error(localized(language, 'تعذّر قراءة ملف PDF هذا. تأكد أنه سليم وغير محمي بكلمة مرور.', 'This PDF could not be read. Make sure it is valid and not password-protected.'));
        }
        const { blob, stats } = converted;
        const base = values.pdf.name.replace(/\.pdf$/i, '') || 'document';
        const output = result(
            blob,
            `${base}.docx`,
            localized(language, `${stats.pages} صفحة`, `${stats.pages} pages`),
            language,
            'مستند Word جاهز',
            'Word document is ready',
        );
        if (stats.imagePages) {
            output.details += localized(
                language,
                ` · ${stats.imagePages} صفحة أُضيفت كصورة لأنها ممسوحة ضوئيًا أو نصها غير قابل للقراءة`,
                ` · ${stats.imagePages} page(s) added as a picture because they are scanned or their text cannot be decoded`,
            );
        }
        return output;
    },
});

const pdfToMarkdown = Object.freeze({
    id: 'pdf-to-markdown',
    category: 'pdf',
    icon: 'PDF→MD',
    action: Object.freeze({ ar: 'حوّل إلى Markdown', en: 'Convert to Markdown' }),
    title: Object.freeze({ ar: 'تحويل PDF إلى Markdown', en: 'PDF to Markdown Converter' }),
    description: Object.freeze({
        ar: 'حوّل النص القابل للتحديد داخل PDF إلى Markdown منظم مع اكتشاف العناوين وفواصل الصفحات تلقائيًا.',
        en: 'Convert selectable PDF text into organized Markdown with automatic heading detection and page separators.',
    }),
    note: Object.freeze({
        ar: 'تعمل الأداة محليًا مع ملفات PDF النصية. قد تحتاج الجداول والأعمدة المتعددة إلى مراجعة، أما الملفات المصورة فتحتاج إلى OCR.',
        en: 'This runs locally for text-based PDFs. Tables and multi-column layouts may need review, while scanned documents require OCR.',
    }),
    inputs: Object.freeze([pdfInput()]),
    async process(values, language) {
        const pages = await extractStructuredPages(values.pdf);
        const markdown = structuredPagesToMarkdown(pages);
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        const base = values.pdf.name.replace(/\.pdf$/i, '') || 'document';
        return result(
            blob,
            `${base}.md`,
            localized(language, `${pages.length} صفحة`, `${pages.length} pages`),
            language,
            'ملف Markdown جاهز',
            'Markdown file is ready',
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
    [pdfToMarkdown.id]: pdfToMarkdown,
    [pdfPageSizeNormalizer.id]: pdfPageSizeNormalizer,
});

export {
    createDocx,
    pdfContentToolDefinitions,
    structuredPagesToMarkdown,
};

// END OF FILE
