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

const textToPdfToolDefinitions = Object.freeze({
    [textToPdfConverter.id]: textToPdfConverter,
});

export { textToPdfToolDefinitions };

// END OF FILE
