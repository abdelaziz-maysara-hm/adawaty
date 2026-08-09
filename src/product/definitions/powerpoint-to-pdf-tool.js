import { canvasToBlob } from '../image-processing.js';
import { createPdfBlob, loadPdfLib } from '../pdf-processing.js';
import { loadZip } from './image-batch-tools.js';

const POWERPOINT_ACCEPT = 'application/vnd.openxmlformats-officedocument.presentationml.presentation,.pptx';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function decodeXmlText(value) {
    const entities = Object.freeze({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" });
    return String(value ?? '').replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (match, entity) => {
        if (entity[0] === '#') {
            const hexadecimal = entity[1].toLowerCase() === 'x';
            return String.fromCodePoint(Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10));
        }
        return entities[entity.toLowerCase()] ?? match;
    });
}

function extractSlideText(xml) {
    const paragraphs = String(xml ?? '').split(/<\/(?:[\w.-]+:)?a:p>/i).map((paragraph) => {
        const runs = [...paragraph.matchAll(/<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi)];
        return runs.map((match) => decodeXmlText(match[1])).join('').replace(/\s+/g, ' ').trim();
    }).filter(Boolean);
    return paragraphs;
}

function naturalSlideOrder(first, second) {
    const number = (path) => Number.parseInt(path.match(/slide(\d+)\.xml$/i)?.[1] ?? '0', 10);
    return number(first) - number(second);
}

function normalizeZipPath(path) {
    const parts = [];
    for (const part of path.replace(/\\/g, '/').split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') parts.pop();
        else parts.push(part);
    }
    return parts.join('/');
}

function slideMediaPaths(slidePath, slideXml, relationshipsXml) {
    const targets = new Map(
        [...String(relationshipsXml ?? '').matchAll(/<Relationship\b[^>]*\bId="([^"]+)"[^>]*\bTarget="([^"]+)"[^>]*\/?\s*>/gi)]
            .map((match) => [match[1], match[2]]),
    );
    const directory = slidePath.slice(0, slidePath.lastIndexOf('/') + 1);
    return [...String(slideXml ?? '').matchAll(/<a:blip\b[^>]*\br:embed="([^"]+)"/gi)]
        .map((match) => targets.get(match[1]))
        .filter(Boolean)
        .map((target) => normalizeZipPath(`${directory}${target}`));
}

function wrapText(context, text, maximumWidth) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = '';
    for (const word of words) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && context.measureText(candidate).width > maximumWidth) {
            lines.push(line);
            line = word;
        } else line = candidate;
    }
    if (line) lines.push(line);
    return lines;
}

async function decodeZipImage(entry) {
    if (!entry || typeof createImageBitmap !== 'function') return undefined;
    const extension = entry.name.split('.').pop()?.toLowerCase();
    const mime = Object.freeze({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif' })[extension];
    if (!mime) return undefined;
    return createImageBitmap(new Blob([await entry.async('arraybuffer')], { type: mime }));
}

async function renderSlide(slide, slideNumber, language, mime = 'image/png', quality) {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 900;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas rendering is unavailable.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (slide.images.length) {
        const image = slide.images[0];
        const scale = Math.min(1480 / image.width, 560 / image.height, 1);
        const width = image.width * scale;
        const height = image.height * scale;
        context.drawImage(image, (canvas.width - width) / 2, 280 + ((560 - height) / 2), width, height);
    }

    context.direction = language === 'ar' ? 'rtl' : 'ltr';
    context.textAlign = language === 'ar' ? 'right' : 'left';
    const x = language === 'ar' ? 1520 : 80;
    const text = slide.paragraphs.length ? slide.paragraphs : [localized(language, `الشريحة ${slideNumber}`, `Slide ${slideNumber}`)];
    let y = 105;
    text.slice(0, slide.images.length ? 4 : 12).forEach((paragraph, index) => {
        context.fillStyle = index === 0 ? '#0f172a' : '#334155';
        context.font = `${index === 0 ? '700 48' : '400 30'}px Arial, sans-serif`;
        for (const line of wrapText(context, paragraph, 1440).slice(0, index === 0 ? 2 : 3)) {
            context.fillText(line, x, y);
            y += index === 0 ? 58 : 40;
        }
        y += 12;
    });
    context.fillStyle = '#64748b';
    context.font = '400 20px Arial, sans-serif';
    context.textAlign = 'center';
    context.fillText(String(slideNumber), 800, 870);
    return canvasToBlob(canvas, mime, quality);
}

const powerpointToPdf = Object.freeze({
    id: 'powerpoint-to-pdf-converter',
    category: 'pdf',
    icon: 'PPT→PDF',
    action: Object.freeze({ ar: 'حوّل إلى PDF', en: 'Convert to PDF' }),
    title: Object.freeze({ ar: 'تحويل PowerPoint إلى PDF', en: 'PowerPoint to PDF Converter' }),
    description: Object.freeze({
        ar: 'حوّل عرض PPTX إلى ملف PDF أفقي، مع استخراج نص كل شريحة وصورتها الرئيسية محليًا داخل المتصفح.',
        en: 'Convert a PPTX presentation into a landscape PDF while extracting each slide’s text and primary image locally in your browser.',
    }),
    note: Object.freeze({
        ar: 'يدعم PPTX فقط ولا يرفع الملف. يحافظ على المحتوى الأساسي، لكن الحركات والفيديو والتخطيطات والخطوط المعقدة قد لا تظهر مطابقة لبرنامج PowerPoint.',
        en: 'Supports PPTX only and never uploads it. Core content is preserved, but animations, video, complex layouts and fonts may not exactly match PowerPoint.',
    }),
    tags: Object.freeze(['powerpoint', 'pptx', 'pdf', 'presentation', 'slides', 'converter', 'processing']),
    inputs: Object.freeze([Object.freeze({
        id: 'powerpoint',
        type: 'file',
        accept: POWERPOINT_ACCEPT,
        label: Object.freeze({ ar: 'اختر ملف PowerPoint ‏(PPTX)', en: 'Choose a PowerPoint file (PPTX)' }),
        unit: Object.freeze({ ar: '', en: '' }),
    })]),
    async process(values, language) {
        if (!(values.powerpoint instanceof File) || !/\.pptx$/i.test(values.powerpoint.name)) {
            throw new Error(localized(language, 'اختر ملف PPTX صالحًا.', 'Choose a valid PPTX file.'));
        }
        const openedImages = [];
        try {
            const [JSZip, pdfLib] = await Promise.all([loadZip(), loadPdfLib()]);
            const zip = await JSZip.loadAsync(await values.powerpoint.arrayBuffer());
            const slidePaths = Object.keys(zip.files)
                .filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path))
                .sort(naturalSlideOrder);
            if (!slidePaths.length) throw new Error('Presentation contains no readable slides.');
            if (slidePaths.length > 150) throw new Error('Presentation is limited to 150 slides.');
            const pdf = await pdfLib.PDFDocument.create();

            for (let index = 0; index < slidePaths.length; index += 1) {
                const slidePath = slidePaths[index];
                const slideXml = await zip.file(slidePath).async('text');
                const relationshipPath = slidePath.replace('/slides/', '/slides/_rels/').replace(/\.xml$/i, '.xml.rels');
                const relationshipsXml = zip.file(relationshipPath) ? await zip.file(relationshipPath).async('text') : '';
                const images = [];
                for (const path of slideMediaPaths(slidePath, slideXml, relationshipsXml).slice(0, 1)) {
                    const image = await decodeZipImage(zip.file(path));
                    if (image) { images.push(image); openedImages.push(image); }
                }
                const blob = await renderSlide({ paragraphs: extractSlideText(slideXml), images }, index + 1, language);
                const embedded = await pdf.embedPng(await blob.arrayBuffer());
                const page = pdf.addPage([841.89, 473.56]);
                page.drawImage(embedded, { x: 0, y: 0, width: 841.89, height: 473.56 });
            }

            const blob = createPdfBlob(await pdf.save({ useObjectStreams: true }));
            const baseName = values.powerpoint.name.replace(/\.pptx$/i, '') || 'presentation';
            return {
                value: localized(language, `${slidePaths.length} شريحة`, `${slidePaths.length} slides`),
                label: localized(language, 'ملف PDF جاهز', 'PDF file is ready'),
                details: `${(blob.size / 1024).toFixed(1)} KB`,
                download: { blob, filename: `${baseName}.pdf` },
            };
        } catch (error) {
            throw new Error(localized(
                language,
                'تعذّر تحويل العرض. جرّب ملف PPTX صالحًا وتذكر أن العروض المحمية أو شديدة التعقيد قد لا تُقرأ بالكامل.',
                'Unable to convert the presentation. Try a valid PPTX file; protected or highly complex presentations may not be fully readable.',
            ), { cause: error });
        } finally {
            openedImages.forEach((image) => image.close?.());
        }
    },
});

const powerpointToPdfToolDefinitions = Object.freeze({
    [powerpointToPdf.id]: powerpointToPdf,
});

export {
    decodeXmlText,
    decodeZipImage,
    extractSlideText,
    naturalSlideOrder,
    powerpointToPdfToolDefinitions,
    renderSlide,
    slideMediaPaths,
};

// END OF FILE
