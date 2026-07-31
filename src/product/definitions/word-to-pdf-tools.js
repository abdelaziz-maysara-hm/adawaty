import { loadPdfLib, createPdfBlob } from '../pdf-processing.js';

const MAMMOTH_URL = 'https://cdn.jsdelivr.net/npm/mammoth@1.8.0/mammoth.browser.min.js';
let mammothPromise;

function loadMammoth() {
    mammothPromise ??= import(MAMMOTH_URL).then(() => window.mammoth);
    return mammothPromise;
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput(id, label, accept) {
    return Object.freeze({
        id, type: 'file', accept,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function fileOutput(blob, filename, language, arLabel, enLabel) {
    return {
        value: localized(language, 'جاهز للتنزيل', 'Ready to download'),
        label: localized(language, arLabel, enLabel),
        details: '',
        download: { blob, filename },
    };
}

function parseHtmlToBlocks(html) {
    const parsed = new DOMParser().parseFromString(html, 'text/html');
    const blocks = [];
    for (const node of parsed.body.children) {
        const tag = node.tagName.toLowerCase();
        const text = node.textContent.trim();
        if (!text) continue;
        if (/^h[1-6]$/.test(tag)) {
            blocks.push({ type: 'heading', level: Number(tag[1]), text });
        } else if (tag === 'li') {
            blocks.push({ type: 'listitem', text });
        } else {
            blocks.push({ type: 'paragraph', text });
        }
    }
    return blocks;
}

function isLatinText(text) {
    // eslint-disable-next-line no-control-regex
    return !/[^\u0000-\u024F\u2018-\u201F\u2013\u2014\s]/.test(text);
}

const wordToPdfConverter = Object.freeze({
    id: 'word-to-pdf-converter',
    category: 'pdf',
    icon: 'DOCX→PDF',
    action: Object.freeze({ ar: 'حوّل إلى PDF', en: 'Convert to PDF' }),
    title: Object.freeze({ ar: 'تحويل Word إلى PDF', en: 'Word to PDF Converter' }),
    description: Object.freeze({
        ar: 'حوّل مستند Word (.docx) إلى ملف PDF مع الحفاظ على الفقرات والعناوين.',
        en: 'Convert a Word (.docx) document into a PDF while preserving paragraphs and headings.',
    }),
    note: Object.freeze({
        ar: '⚠️ يدعم النص اللاتيني (إنجليزي وما شابه) فقط في هذا الإصدار. المستندات التي تحتوي على نص عربي أو غير لاتيني لن تُعرض بشكل صحيح. لا يدعم الجداول أو الصور المضمّنة حاليًا.',
        en: '⚠️ This version supports Latin-script text only (English, etc.). Documents containing Arabic or other non-Latin text will not render correctly. Tables and embedded images are not supported yet.',
    }),
    inputs: Object.freeze([
        fileInput('docx', { ar: 'اختر ملف Word (.docx)', en: 'Choose a Word file (.docx)' }, '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
    ]),
    async process(values, language) {
        const file = values.docx;
        if (!(file instanceof File)) {
            throw new Error(localized(language, 'اختر ملف Word أولًا.', 'Choose a Word file first.'));
        }

        const mammoth = await loadMammoth();
        const arrayBuffer = await file.arrayBuffer();
        const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
        const blocks = parseHtmlToBlocks(html);

        if (blocks.length === 0) {
            throw new Error(localized(language, 'لم يتم العثور على نص قابل للتحويل في هذا الملف.', 'No convertible text was found in this file.'));
        }
        const nonLatinBlocks = blocks.filter((block) => !isLatinText(block.text));
        if (nonLatinBlocks.length > blocks.length / 2) {
            throw new Error(localized(
                language,
                'يبدو أن هذا المستند يحتوي على نص عربي أو غير لاتيني بشكل أساسي، وهذا الإصدار لا يدعمه بعد.',
                'This document appears to be mostly non-Latin text, which this version does not support yet.',
            ));
        }

        const { PDFDocument, StandardFonts, rgb } = await loadPdfLib();
        const pdf = await PDFDocument.create();
        const regularFont = await pdf.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const margin = 56;
        const maxWidth = pageWidth - margin * 2;

        let page = pdf.addPage([pageWidth, pageHeight]);
        let cursorY = pageHeight - margin;

        function wrapLine(text, font, size) {
            const words = text.split(/\s+/);
            const lines = [];
            let current = '';
            for (const word of words) {
                const candidate = current ? `${current} ${word}` : word;
                if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
                    lines.push(current);
                    current = word;
                } else {
                    current = candidate;
                }
            }
            if (current) lines.push(current);
            return lines;
        }

        function ensureSpace(lineHeight) {
            if (cursorY - lineHeight < margin) {
                page = pdf.addPage([pageWidth, pageHeight]);
                cursorY = pageHeight - margin;
            }
        }

        for (const block of blocks) {
            const isHeading = block.type === 'heading';
            const font = isHeading ? boldFont : regularFont;
            const size = isHeading ? Math.max(14, 22 - block.level * 2) : 11;
            const lineHeight = size * 1.4;
            const prefix = block.type === 'listitem' ? '• ' : '';
            const lines = wrapLine(prefix + block.text, font, size);

            ensureSpace(lineHeight * lines.length + (isHeading ? 8 : 0));
            if (isHeading) cursorY -= 6;
            for (const line of lines) {
                ensureSpace(lineHeight);
                page.drawText(line, {
                    x: margin, y: cursorY - size, size, font, color: rgb(0.08, 0.08, 0.1),
                });
                cursorY -= lineHeight;
            }
            cursorY -= isHeading ? 4 : 8;
        }

        const blob = createPdfBlob(await pdf.save());
        const base = file.name.replace(/\.docx$/i, '') || 'document';
        return fileOutput(blob, `${base}.pdf`, language, 'ملف PDF جاهز', 'PDF file is ready');
    },
});

const wordToPdfDefinitions = Object.freeze({ [wordToPdfConverter.id]: wordToPdfConverter });

export { wordToPdfDefinitions };
