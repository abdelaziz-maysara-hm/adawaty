import { createPdfBlob, loadPdfLib } from '../pdf-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function textAreaInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 10,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function numberInput(id, ar, en, placeholder, min, max, unit = '') {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 1,
        placeholder: String(placeholder),
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: unit, en: unit }),
    });
}

const ARABIC_PATTERN = /[\u0600-\u06FF]/u;

/**
 * Wraps a paragraph into lines that fit maxWidth, using the canvas's own
 * real measureText() (matching the site's existing text-overlay pattern
 * in pdf-editor-tools.js), not a character-count estimate.
 */
function wrapParagraph(context, paragraph, maxWidth) {
    if (paragraph.trim().length === 0) return [''];

    const words = paragraph.split(' ');
    const lines = [];
    let current = '';

    for (const word of words) {
        const candidate = current ? `${current} ${word}` : word;
        if (context.measureText(candidate).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = candidate;
        }
    }
    if (current) lines.push(current);

    return lines;
}

function paginateLines(lines, linesPerPage) {
    const pages = [];
    for (let index = 0; index < lines.length; index += linesPerPage) {
        pages.push(lines.slice(index, index + linesPerPage));
    }
    return pages.length > 0 ? pages : [[]];
}

/**
 * Renders one page of text lines onto a canvas and returns it as a PNG.
 * Reuses the exact same Arabic-detection + canvas `direction`/`textAlign`
 * approach already proven in this codebase's pdf-editor-tools.js
 * (renderTextPng), since the browser's native canvas text rendering
 * already correctly shapes and reorders Arabic text -- unlike pdf-lib's
 * built-in drawText, which cannot encode Arabic characters at all
 * (confirmed directly: WinAnsi-encoded StandardFonts throw immediately on
 * any Arabic character).
 */
function renderPageCanvas(lines, isRtl, pageWidthPx, pageHeightPx, marginPx, fontSizePx, lineHeightPx) {
    const canvas = document.createElement('canvas');
    canvas.width = pageWidthPx;
    canvas.height = pageHeightPx;
    const context = canvas.getContext('2d');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pageWidthPx, pageHeightPx);

    context.font = `${fontSizePx}px ${isRtl ? 'Arial, Tahoma, sans-serif' : 'Arial, sans-serif'}`;
    context.fillStyle = '#000000';
    context.textBaseline = 'top';
    context.direction = isRtl ? 'rtl' : 'ltr';
    context.textAlign = isRtl ? 'right' : 'left';

    const textX = isRtl ? pageWidthPx - marginPx : marginPx;
    let y = marginPx;
    for (const line of lines) {
        context.fillText(line, textX, y);
        y += lineHeightPx;
    }

    return canvas;
}

async function canvasToPngBytes(canvas) {
    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((result) => (result ? resolve(result) : reject(new Error('encode failed'))), 'image/png');
    });
    return new Uint8Array(await blob.arrayBuffer());
}

function cleanInlineMarkdown(value) {
    return value
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
        .replace(/(\*\*|__)(.*?)\1/g, '$2')
        .replace(/([*_~`])(.*?)\1/g, '$2')
        .replace(/\\([\\`*_[\]{}()#+.!>-])/g, '$1');
}

function parseMarkdownBlocks(markdown) {
    const blocks = [];
    let inCodeBlock = false;
    for (const rawLine of String(markdown).replace(/\r\n?/g, '\n').split('\n')) {
        if (/^\s*```/.test(rawLine)) {
            inCodeBlock = !inCodeBlock;
            continue;
        }
        if (inCodeBlock) {
            blocks.push({ kind: 'code', text: rawLine || ' ' });
            continue;
        }
        const heading = rawLine.match(/^\s*(#{1,6})\s+(.+)$/);
        if (heading) {
            blocks.push({ kind: 'heading', level: heading[1].length, text: cleanInlineMarkdown(heading[2]) });
            continue;
        }
        const unordered = rawLine.match(/^\s*[-+*]\s+(.+)$/);
        const ordered = rawLine.match(/^\s*(\d+)[.)]\s+(.+)$/);
        if (unordered || ordered) {
            blocks.push({
                kind: 'list',
                text: unordered ? `• ${cleanInlineMarkdown(unordered[1])}` : `${ordered[1]}. ${cleanInlineMarkdown(ordered[2])}`,
            });
            continue;
        }
        const quote = rawLine.match(/^\s*>\s?(.*)$/);
        if (quote) {
            blocks.push({ kind: 'quote', text: cleanInlineMarkdown(quote[1]) });
            continue;
        }
        blocks.push({ kind: rawLine.trim() ? 'paragraph' : 'blank', text: cleanInlineMarkdown(rawLine) });
    }
    return blocks;
}

function markdownBlockStyle(block, baseSize) {
    if (block.kind === 'heading') {
        return { size: Math.round(baseSize * (1.9 - ((block.level - 1) * 0.16))), weight: 'bold', indent: 0, gap: baseSize * 0.65 };
    }
    if (block.kind === 'code') return { size: Math.max(10, baseSize - 1), weight: 'normal', indent: 18, gap: 0 };
    if (block.kind === 'list') return { size: baseSize, weight: 'normal', indent: 20, gap: 0 };
    if (block.kind === 'quote') return { size: baseSize, weight: 'italic', indent: 24, gap: baseSize * 0.25 };
    return { size: baseSize, weight: 'normal', indent: 0, gap: block.kind === 'blank' ? baseSize * 0.75 : 0 };
}

function layoutMarkdown(context, blocks, maxWidth, baseSize, fontFamily) {
    const lines = [];
    for (const block of blocks) {
        const style = markdownBlockStyle(block, baseSize);
        if (block.kind === 'blank') {
            lines.push({ text: '', ...style, height: style.gap });
            continue;
        }
        context.font = `${style.weight} ${style.size}px ${fontFamily}`;
        const wrapped = wrapParagraph(context, block.text, maxWidth - style.indent);
        wrapped.forEach((text, index) => lines.push({
            text,
            ...style,
            gap: index === 0 ? style.gap : 0,
            height: style.size * 1.45,
        }));
    }
    return lines;
}

function paginateMarkdownLines(lines, availableHeight) {
    const pages = [[]];
    let used = 0;
    for (const line of lines) {
        const required = line.height + line.gap;
        if (pages.at(-1).length > 0 && used + required > availableHeight) {
            pages.push([]);
            used = 0;
        }
        pages.at(-1).push(line);
        used += required;
    }
    return pages;
}

function renderMarkdownPage(lines, isRtl, width, height, margin, fontFamily) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#111827';
    context.textBaseline = 'top';
    context.direction = isRtl ? 'rtl' : 'ltr';
    context.textAlign = isRtl ? 'right' : 'left';
    let y = margin;
    for (const line of lines) {
        y += line.gap;
        context.font = `${line.weight} ${line.size}px ${fontFamily}`;
        const x = isRtl ? width - margin - line.indent : margin + line.indent;
        context.fillText(line.text, x, y);
        y += line.height;
    }
    return canvas;
}

const textToPdfConverter = Object.freeze({
    id: 'txt-to-pdf',
    category: 'pdf',
    icon: 'TXT→',
    action: Object.freeze({ ar: 'حوّل لـ PDF', en: 'Convert to PDF' }),
    title: Object.freeze({ ar: 'تحويل نص إلى PDF', en: 'Text to PDF Converter' }),
    description: Object.freeze({
        ar: 'حوّل نصًا عاديًا (عربي أو إنجليزي) إلى مستند PDF منسّق بعناوين وفواصل صفحات تلقائية.',
        en: 'Convert plain text (Arabic or English) into a formatted PDF document with automatic pagination.',
    }),
    note: Object.freeze({
        ar: 'يُرسم كل نص كصورة داخل الصفحة (وليس نصًا قابلًا للتحديد) لضمان عرض العربية بشكل صحيح تمامًا، بما أن أدوات PDF القياسية لا تدعم تشكيل الحروف العربية المتصلة. لملف يحتاج نصًا قابلًا للتحديد والبحث بالإنجليزية فقط، استخدم أداة تحويل TXT إلى Word ثم Word إلى PDF بدلًا من ذلك.',
        en: 'Each page is rendered as an image (not selectable text) to guarantee correct Arabic rendering, since standard PDF text tools don\u2019t support connected Arabic letter shaping. For an English-only document needing selectable, searchable text, use a TXT-to-Word-to-PDF conversion instead.',
    }),
    inputs: Object.freeze([
        textAreaInput('text', 'النص', 'Text', 'اكتب النص هنا...\n\nWrite your text here...'),
        numberInput('fontSize', 'حجم الخط', 'Font size', 14, 8, 32, 'نقطة'),
    ]),
    async process(values, language) {
        if (!values.text.trim()) {
            throw new Error(localized(language, 'أدخل نصًا.', 'Enter some text.'));
        }

        const isRtl = ARABIC_PATTERN.test(values.text);
        const scale = 2;
        const pageWidthPx = 595 * scale;
        const pageHeightPx = 842 * scale;
        const marginPx = 50 * scale;
        const fontSizePx = Math.round(values.fontSize) * scale;
        const lineHeightPx = fontSizePx * 1.4;
        const maxTextWidthPx = pageWidthPx - (marginPx * 2);
        const linesPerPage = Math.floor((pageHeightPx - (marginPx * 2)) / lineHeightPx);

        const measureCanvas = document.createElement('canvas');
        const measureContext = measureCanvas.getContext('2d');
        measureContext.font = `${fontSizePx}px ${isRtl ? 'Arial, Tahoma, sans-serif' : 'Arial, sans-serif'}`;

        const allLines = values.text.split('\n').flatMap((paragraph) => wrapParagraph(measureContext, paragraph, maxTextWidthPx));
        const pages = paginateLines(allLines, linesPerPage);

        const { PDFDocument } = await loadPdfLib();
        const pdfDoc = await PDFDocument.create();

        for (const pageLines of pages) {
            const canvas = renderPageCanvas(pageLines, isRtl, pageWidthPx, pageHeightPx, marginPx, fontSizePx, lineHeightPx);
            // eslint-disable-next-line no-await-in-loop -- sequential page rendering keeps memory bounded
            const pngBytes = await canvasToPngBytes(canvas);
            // eslint-disable-next-line no-await-in-loop -- must embed into the same document sequentially
            const image = await pdfDoc.embedPng(pngBytes);
            const page = pdfDoc.addPage([595, 842]);
            page.drawImage(image, { x: 0, y: 0, width: 595, height: 842 });
        }

        const blob = createPdfBlob(await pdfDoc.save());
        return {
            value: `${pages.length} ${localized(language, 'صفحة', 'pages')}`,
            label: localized(language, 'ملف PDF جاهز', 'The PDF file is ready'),
            details: `${(blob.size / 1024).toFixed(1)} KB`,
            download: { blob, filename: 'adawaty-text-document.pdf' },
        };
    },
});

const markdownToPdfConverter = Object.freeze({
    id: 'markdown-to-pdf',
    category: 'pdf',
    icon: 'MD→PDF',
    action: Object.freeze({ ar: 'حوّل إلى PDF', en: 'Convert to PDF' }),
    title: Object.freeze({ ar: 'تحويل Markdown إلى PDF', en: 'Markdown to PDF Converter' }),
    description: Object.freeze({
        ar: 'حوّل Markdown العربي أو الإنجليزي إلى PDF منسق يدعم العناوين والقوائم والاقتباسات وكتل الكود.',
        en: 'Convert Arabic or English Markdown into a formatted PDF with headings, lists, quotes and code blocks.',
    }),
    note: Object.freeze({
        ar: 'تتم المعالجة محليًا. تُرسم الصفحات كصور لضمان تشكيل العربية الصحيح، لذلك لن يكون النص داخل PDF قابلًا للتحديد.',
        en: 'Processing stays local. Pages are rendered as images for correct Arabic shaping, so PDF text is not selectable.',
    }),
    inputs: Object.freeze([
        textAreaInput('markdown', 'نص Markdown', 'Markdown text', '# عنوان\n\nفقرة نصية.\n\n- عنصر أول\n- عنصر ثانٍ'),
        numberInput('fontSize', 'حجم النص الأساسي', 'Base font size', 14, 10, 24, 'نقطة'),
    ]),
    async process(values, language) {
        if (!values.markdown.trim()) throw new Error(localized(language, 'أدخل نص Markdown.', 'Enter Markdown text.'));
        const isRtl = ARABIC_PATTERN.test(values.markdown);
        const scale = 2;
        const width = 595 * scale;
        const height = 842 * scale;
        const margin = 50 * scale;
        const baseSize = Math.round(values.fontSize) * scale;
        const fontFamily = isRtl ? 'Arial, Tahoma, sans-serif' : 'Arial, sans-serif';
        const measureCanvas = document.createElement('canvas');
        const context = measureCanvas.getContext('2d');
        const lines = layoutMarkdown(context, parseMarkdownBlocks(values.markdown), width - (margin * 2), baseSize, fontFamily);
        const pages = paginateMarkdownLines(lines, height - (margin * 2));
        const { PDFDocument } = await loadPdfLib();
        const pdfDoc = await PDFDocument.create();
        for (const pageLines of pages) {
            const canvas = renderMarkdownPage(pageLines, isRtl, width, height, margin, fontFamily);
            const image = await pdfDoc.embedPng(await canvasToPngBytes(canvas));
            const page = pdfDoc.addPage([595, 842]);
            page.drawImage(image, { x: 0, y: 0, width: 595, height: 842 });
        }
        const blob = createPdfBlob(await pdfDoc.save());
        return {
            value: `${pages.length} ${localized(language, 'صفحة', 'pages')}`,
            label: localized(language, 'ملف PDF جاهز', 'The PDF file is ready'),
            details: `${(blob.size / 1024).toFixed(1)} KB`,
            download: { blob, filename: 'adawaty-markdown-document.pdf' },
        };
    },
});

const textToPdfToolDefinitions = Object.freeze({
    [textToPdfConverter.id]: textToPdfConverter,
    [markdownToPdfConverter.id]: markdownToPdfConverter,
});

export { parseMarkdownBlocks, textToPdfToolDefinitions };

// END OF FILE
