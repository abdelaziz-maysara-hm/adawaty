import { canvasToBlob } from '../image-processing.js';
import { createPdfBlob, loadPdfJs, loadPdfLib } from '../pdf-processing.js';
import { loadZip } from './image-batch-tools.js';
import { textItemsToRows } from './pdf-to-excel-tool.js';

function localized(language, ar, en) { return language === 'ar' ? ar : en; }
function input(id, accept, ar, en) { return Object.freeze({ id, type: 'file', accept, label: Object.freeze({ ar, en }), unit: Object.freeze({ ar: '', en: '' }) }); }
function assertExtension(file, extension, language) { if (!(file instanceof File) || !new RegExp(`\\.${extension}$`, 'i').test(file.name)) throw new Error(localized(language, `اختر ملف ${extension.toUpperCase()} صالحًا.`, `Choose a valid ${extension.toUpperCase()} file.`)); }
function baseName(file, extension) { return file.name.replace(new RegExp(`\\.${extension}$`, 'i'), '') || 'document'; }
function result(blob, filename, language, count, arLabel, enLabel) { return { value: count, label: localized(language, arLabel, enLabel), details: `${(blob.size / 1024).toFixed(1)} KB`, download: { blob, filename } }; }

function htmlToPlainText(html) {
    return String(html ?? '')
        .replace(/<\s*(br|hr)\b[^>]*>/gi, '\n')
        .replace(/<\/\s*(p|div|h[1-6]|li|tr|section|article)\s*>/gi, '\n')
        .replace(/<script\b[\s\S]*?<\/script>/gi, '')
        .replace(/<style\b[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
        .replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function epubText(zip) {
    const paths = Object.keys(zip.files).filter((path) => /\.(xhtml|html|htm)$/i.test(path) && !/nav\.(xhtml|html)$/i.test(path)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const chapters = [];
    for (const path of paths) {
        const text = htmlToPlainText(await zip.file(path).async('text'));
        if (text) chapters.push(text);
    }
    return chapters;
}

function splitTextLines(text, maximumCharacters = 88) {
    const lines = [];
    for (const paragraph of String(text).split(/\r?\n/)) {
        if (!paragraph.trim()) { lines.push(''); continue; }
        const words = paragraph.trim().split(/\s+/); let line = '';
        for (const word of words) {
            const candidate = line ? `${line} ${word}` : word;
            if (line && candidate.length > maximumCharacters) { lines.push(line); line = word; } else line = candidate;
        }
        if (line) lines.push(line);
    }
    return lines;
}

async function textToPdf(text, language) {
    const { PDFDocument } = await loadPdfLib(); const pdf = await PDFDocument.create(); const lines = splitTextLines(text); const perPage = 38;
    for (let offset = 0; offset < Math.max(1, lines.length); offset += perPage) {
        const canvas = document.createElement('canvas'); canvas.width = 1240; canvas.height = 1754; const context = canvas.getContext('2d', { alpha: false }); if (!context) throw new Error('Canvas unavailable.');
        context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = '#172033'; context.font = '32px Arial, sans-serif'; context.direction = language === 'ar' ? 'rtl' : 'ltr'; context.textAlign = language === 'ar' ? 'right' : 'left'; const x = language === 'ar' ? 1140 : 100;
        lines.slice(offset, offset + perPage).forEach((line, index) => context.fillText(line, x, 100 + (index * 42)));
        const image = await pdf.embedPng(await (await canvasToBlob(canvas, 'image/png')).arrayBuffer()); const page = pdf.addPage([595.28, 841.89]); page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
    }
    return createPdfBlob(await pdf.save({ useObjectStreams: true }));
}

function csvEscape(value) { const text = String(value ?? ''); return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function rowsToCsv(rows) { return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n'); }

async function pdfPagesText(file) {
    const pdfjs = await loadPdfJs(); const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise; const pages = [];
    for (let number = 1; number <= document.numPages; number += 1) pages.push(await (await document.getPage(number)).getTextContent());
    return pages;
}

async function makeEpub(title, pages) {
    const JSZip = await loadZip(); const zip = new JSZip(); zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
    zip.file('META-INF/container.xml', '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>');
    const escaped = (value) => String(value).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
    const body = pages.map((page, index) => `<section><h2>Page ${index + 1}</h2><p>${escaped(page).replace(/\n/g, '</p><p>')}</p></section>`).join('');
    zip.file('OEBPS/content.xhtml', `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>${escaped(title)}</title></head><body>${body}</body></html>`);
    zip.file('OEBPS/content.opf', `<?xml version="1.0"?><package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id"><metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="id">urn:uuid:${crypto.randomUUID()}</dc:identifier><dc:title>${escaped(title)}</dc:title><dc:language>en</dc:language></metadata><manifest><item id="content" href="content.xhtml" media-type="application/xhtml+xml"/></manifest><spine><itemref idref="content"/></spine></package>`);
    return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip', compression: 'DEFLATE' });
}

const epubToPdf = Object.freeze({ id: 'epub-to-pdf-converter', category: 'pdf', icon: 'EPUB→PDF', action: Object.freeze({ ar: 'حوّل إلى PDF', en: 'Convert to PDF' }), title: Object.freeze({ ar: 'تحويل EPUB إلى PDF', en: 'EPUB to PDF Converter' }), description: Object.freeze({ ar: 'حوّل نص كتاب EPUB إلى PDF قابل للقراءة والطباعة مع دعم النص العربي.', en: 'Convert EPUB book text into a readable, printable PDF with Arabic text support.' }), note: Object.freeze({ ar: 'تُحفظ النصوص والفقرات؛ قد لا تنتقل الصور والتنسيقات المعقدة.', en: 'Text and paragraphs are preserved; complex styling and images may not carry over.' }), tags: Object.freeze(['epub', 'pdf', 'ebook', 'converter', 'book', 'processing']), inputs: Object.freeze([input('epub', 'application/epub+zip,.epub', 'اختر ملف EPUB', 'Choose an EPUB file')]), async process(values, language) { assertExtension(values.epub, 'epub', language); const JSZip = await loadZip(); const chapters = await epubText(await JSZip.loadAsync(await values.epub.arrayBuffer())); if (!chapters.length) throw new Error(localized(language, 'لم يتم العثور على نص في الكتاب.', 'No book text was found.')); const blob = await textToPdf(chapters.join('\n\n'), language); return result(blob, `${baseName(values.epub, 'epub')}.pdf`, language, localized(language, `${chapters.length} فصلًا`, `${chapters.length} chapters`), 'ملف PDF جاهز', 'PDF file is ready'); } });
const epubToTxt = Object.freeze({ ...epubToPdf, id: 'epub-to-txt-converter', category: 'text', icon: 'EPUB→TXT', action: Object.freeze({ ar: 'استخرج النص', en: 'Extract text' }), title: Object.freeze({ ar: 'تحويل EPUB إلى TXT', en: 'EPUB to TXT Converter' }), description: Object.freeze({ ar: 'استخرج نص كتاب EPUB وحمّله كملف TXT خفيف.', en: 'Extract EPUB book text and download it as a lightweight TXT file.' }), async process(values, language) { assertExtension(values.epub, 'epub', language); const JSZip = await loadZip(); const chapters = await epubText(await JSZip.loadAsync(await values.epub.arrayBuffer())); const text = chapters.join('\n\n'); if (!text) throw new Error(localized(language, 'لم يتم العثور على نص.', 'No text was found.')); const blob = new Blob([text], { type: 'text/plain;charset=utf-8' }); return result(blob, `${baseName(values.epub, 'epub')}.txt`, language, localized(language, `${text.length} حرفًا`, `${text.length} characters`), 'ملف TXT جاهز', 'TXT file is ready'); } });
const htmlToPdf = Object.freeze({ id: 'html-file-to-pdf', category: 'pdf', icon: 'HTML→PDF', action: Object.freeze({ ar: 'حوّل إلى PDF', en: 'Convert to PDF' }), title: Object.freeze({ ar: 'تحويل HTML إلى PDF', en: 'HTML to PDF Converter' }), description: Object.freeze({ ar: 'حوّل محتوى ملف HTML إلى PDF نظيف قابل للقراءة دون رفع الملف.', en: 'Convert an HTML file’s readable content into a clean PDF without uploading it.' }), note: Object.freeze({ ar: 'يركز على النص؛ لا يشغّل JavaScript ولا يجلب موارد خارجية.', en: 'Focuses on readable text; JavaScript is not executed and external resources are not fetched.' }), tags: Object.freeze(['html', 'pdf', 'converter', 'document', 'webpage', 'processing']), inputs: Object.freeze([input('html', 'text/html,.html,.htm', 'اختر ملف HTML', 'Choose an HTML file')]), async process(values, language) { if (!(values.html instanceof File) || !/\.html?$/i.test(values.html.name)) throw new Error(localized(language, 'اختر ملف HTML صالحًا.', 'Choose a valid HTML file.')); const text = htmlToPlainText(await values.html.text()); if (!text) throw new Error(localized(language, 'لم يتم العثور على نص.', 'No text was found.')); const blob = await textToPdf(text, language); return result(blob, `${values.html.name.replace(/\.html?$/i, '')}.pdf`, language, localized(language, `${text.length} حرفًا`, `${text.length} characters`), 'ملف PDF جاهز', 'PDF file is ready'); } });
const pdfToEpub = Object.freeze({ id: 'pdf-to-epub-converter', category: 'converter', icon: 'PDF→EPUB', action: Object.freeze({ ar: 'حوّل إلى EPUB', en: 'Convert to EPUB' }), title: Object.freeze({ ar: 'تحويل PDF إلى EPUB', en: 'PDF to EPUB Converter' }), description: Object.freeze({ ar: 'حوّل النص القابل للتحديد داخل PDF إلى كتاب EPUB خفيف ومنظم حسب الصفحات.', en: 'Convert selectable PDF text into a lightweight EPUB organized by page.' }), note: Object.freeze({ ar: 'مناسب لملفات PDF النصية؛ استخدم OCR أولًا للملفات الممسوحة.', en: 'Best for text PDFs; use OCR first for scanned documents.' }), tags: Object.freeze(['pdf', 'epub', 'ebook', 'converter', 'book', 'processing']), inputs: Object.freeze([input('pdf', 'application/pdf,.pdf', 'اختر ملف PDF', 'Choose a PDF file')]), async process(values, language) { assertExtension(values.pdf, 'pdf', language); const contents = await pdfPagesText(values.pdf); const pages = contents.map((content) => content.items.map((item) => item.str).join(' ').trim()); const blob = await makeEpub(baseName(values.pdf, 'pdf'), pages); return result(blob, `${baseName(values.pdf, 'pdf')}.epub`, language, localized(language, `${pages.length} صفحة`, `${pages.length} pages`), 'ملف EPUB جاهز', 'EPUB file is ready'); } });
const pdfToCsv = Object.freeze({ id: 'pdf-to-csv-converter', category: 'converter', icon: 'PDF→CSV', action: Object.freeze({ ar: 'حوّل إلى CSV', en: 'Convert to CSV' }), title: Object.freeze({ ar: 'تحويل PDF إلى CSV', en: 'PDF to CSV Converter' }), description: Object.freeze({ ar: 'استخرج الجداول والنصوص المتراصة من PDF إلى CSV مع فصل كل صفحة.', en: 'Extract aligned PDF tables and text into CSV with a section for each page.' }), note: Object.freeze({ ar: 'أفضل نتيجة مع الجداول النصية الواضحة وليست الملفات الممسوحة.', en: 'Works best with clear text tables rather than scanned documents.' }), tags: Object.freeze(['pdf', 'csv', 'table', 'data extraction', 'converter', 'processing']), inputs: Object.freeze([input('pdf', 'application/pdf,.pdf', 'اختر ملف PDF', 'Choose a PDF file')]), async process(values, language) { assertExtension(values.pdf, 'pdf', language); const contents = await pdfPagesText(values.pdf); const rows = []; contents.forEach((content, index) => { if (index) rows.push([]); rows.push([`Page ${index + 1}`]); rows.push(...textItemsToRows(content.items)); }); const csv = rowsToCsv(rows); const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }); return result(blob, `${baseName(values.pdf, 'pdf')}.csv`, language, localized(language, `${rows.length} صفًا`, `${rows.length} rows`), 'ملف CSV جاهز', 'CSV file is ready'); } });

const ebookDocumentToolDefinitions = Object.freeze({ [epubToPdf.id]: epubToPdf, [epubToTxt.id]: epubToTxt, [htmlToPdf.id]: htmlToPdf, [pdfToEpub.id]: pdfToEpub, [pdfToCsv.id]: pdfToCsv });
export { ebookDocumentToolDefinitions, htmlToPlainText, rowsToCsv, splitTextLines };

// END OF FILE
