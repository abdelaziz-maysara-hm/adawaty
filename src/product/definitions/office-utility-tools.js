import { loadZip } from './image-batch-tools.js';
import {
    compressImageEntry,
    compressionSettings,
    mediaMime,
} from './powerpoint-compressor-tool.js';
import {
    decodeXmlText,
    decodeZipImage,
    extractSlideText,
    naturalSlideOrder,
    renderSlide,
    slideMediaPaths,
} from './powerpoint-to-pdf-tool.js';

const TYPES = Object.freeze({
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
});

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function officeFileInput(id, extension, ar, en) {
    return Object.freeze({
        id,
        type: 'file',
        accept: `${TYPES[extension]},.${extension}`,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function compressionLevelInput() {
    return Object.freeze({
        id: 'level',
        type: 'select',
        label: Object.freeze({ ar: 'مستوى الضغط', en: 'Compression level' }),
        unit: Object.freeze({ ar: '', en: '' }),
        defaultValue: 'balanced',
        options: Object.freeze([
            Object.freeze({ value: 'light', label: Object.freeze({ ar: 'خفيف — جودة أعلى', en: 'Light — higher quality' }) }),
            Object.freeze({ value: 'balanced', label: Object.freeze({ ar: 'متوازن', en: 'Balanced' }) }),
            Object.freeze({ value: 'strong', label: Object.freeze({ ar: 'قوي — حجم أصغر', en: 'Strong — smaller file' }) }),
        ]),
    });
}

function assertOfficeFile(file, extension, language) {
    if (!(file instanceof File) || !new RegExp(`\\.${extension}$`, 'i').test(file.name)) {
        throw new Error(localized(language, `اختر ملف ${extension.toUpperCase()} صالحًا.`, `Choose a valid ${extension.toUpperCase()} file.`));
    }
}

function documentXmlToText(xml) {
    return String(xml ?? '')
        .replace(/<w:tab\b[^>]*\/?\s*>/gi, '\t')
        .replace(/<w:br\b[^>]*\/?\s*>/gi, '\n')
        .split(/<\/w:p>/i)
        .map((paragraph) => [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/gi)]
            .map((match) => decodeXmlText(match[1])).join('').trim())
        .filter(Boolean)
        .join('\n\n');
}

function packageMediaPaths(zip, prefix) {
    return Object.keys(zip.files).filter((path) => !zip.files[path].dir && path.toLowerCase().startsWith(prefix));
}

async function extractImages(file, extension, prefix, language) {
    assertOfficeFile(file, extension, language);
    const JSZip = await loadZip();
    const source = await JSZip.loadAsync(await file.arrayBuffer());
    const paths = packageMediaPaths(source, prefix);
    if (!paths.length) throw new Error(localized(language, 'لا توجد صور مضمّنة في الملف.', 'No embedded images were found.'));
    const output = new JSZip();
    for (const [index, path] of paths.entries()) {
        const originalName = path.split('/').pop() || `image-${index + 1}`;
        output.file(`${String(index + 1).padStart(3, '0')}-${originalName}`, await source.file(path).async('uint8array'));
    }
    const blob = await output.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'DEFLATE' });
    return {
        value: localized(language, `${paths.length} صورة`, `${paths.length} images`),
        label: localized(language, 'ملف ZIP جاهز', 'ZIP archive is ready'),
        details: `${(blob.size / 1024).toFixed(1)} KB`,
        download: { blob, filename: `${file.name.replace(new RegExp(`\\.${extension}$`, 'i'), '')}-images.zip` },
    };
}

const excelCompressor = Object.freeze({
    id: 'excel-compressor', category: 'converter', icon: 'XLS↓',
    action: Object.freeze({ ar: 'اضغط الملف', en: 'Compress workbook' }),
    title: Object.freeze({ ar: 'ضغط ملف Excel', en: 'Compress Excel File' }),
    description: Object.freeze({ ar: 'قلّل حجم ملف XLSX بضغط الصور الكبيرة والحزمة الداخلية دون تغيير بيانات الجداول.', en: 'Reduce an XLSX file size by compressing large images and its internal package without changing spreadsheet data.' }),
    note: Object.freeze({ ar: 'يعمل محليًا ويدعم XLSX. الضغط القوي قد يقلل جودة الصور، ولا تتغير الخلايا أو الصيغ.', en: 'Runs locally and supports XLSX. Strong compression may reduce image quality; cells and formulas are unchanged.' }),
    tags: Object.freeze(['excel', 'xlsx', 'compress', 'spreadsheet', 'office', 'processing']),
    inputs: Object.freeze([officeFileInput('excel', 'xlsx', 'اختر ملف Excel ‏(XLSX)', 'Choose an Excel file (XLSX)'), compressionLevelInput()]),
    async process(values, language) {
        assertOfficeFile(values.excel, 'xlsx', language);
        try {
            const JSZip = await loadZip();
            const zip = await JSZip.loadAsync(await values.excel.arrayBuffer());
            if (!zip.file('xl/workbook.xml')) throw new Error('Missing workbook structure.');
            const settings = compressionSettings(values.level);
            let changed = 0;
            for (const path of packageMediaPaths(zip, 'xl/media/')) {
                const mime = mediaMime(path);
                if (!mime) continue;
                const compressed = await compressImageEntry(zip.file(path), mime, settings);
                if (compressed) { zip.file(path, compressed, { binary: true }); changed += 1; }
            }
            const blob = await zip.generateAsync({ type: 'blob', mimeType: TYPES.xlsx, compression: 'DEFLATE', compressionOptions: { level: values.level === 'strong' ? 9 : 7 } });
            const saved = Math.max(0, values.excel.size - blob.size);
            const reduction = values.excel.size ? (saved / values.excel.size) * 100 : 0;
            return {
                value: saved ? localized(language, `أصغر بنسبة ${reduction.toFixed(1)}%`, `${reduction.toFixed(1)}% smaller`) : localized(language, 'الحجم محسّن بالفعل', 'Already size-optimized'),
                label: localized(language, 'ملف Excel المضغوط جاهز', 'Compressed Excel file is ready'),
                details: localized(language, `${changed} صورة ضُغطت`, `${changed} images recompressed`),
                download: { blob, filename: `${values.excel.name.replace(/\.xlsx$/i, '')}-compressed.xlsx` },
            };
        } catch (error) {
            throw new Error(localized(language, 'تعذّر ضغط ملف Excel. جرّب ملف XLSX صالحًا.', 'Unable to compress the workbook. Try a valid XLSX file.'), { cause: error });
        }
    },
});

const wordImageExtractor = Object.freeze({
    id: 'extract-images-from-word', category: 'converter', icon: 'DOC→IMG',
    action: Object.freeze({ ar: 'استخرج الصور', en: 'Extract images' }),
    title: Object.freeze({ ar: 'استخراج الصور من Word', en: 'Extract Images from Word' }),
    description: Object.freeze({ ar: 'استخرج كل الصور الأصلية المضمّنة داخل ملف DOCX وحمّلها في ملف ZIP واحد.', en: 'Extract every original image embedded in a DOCX file and download them in one ZIP archive.' }),
    note: Object.freeze({ ar: 'تتم العملية محليًا ولا يُرفع المستند.', en: 'Processing stays local and the document is never uploaded.' }),
    tags: Object.freeze(['word', 'docx', 'extract images', 'zip', 'office', 'processing']),
    inputs: Object.freeze([officeFileInput('word', 'docx', 'اختر ملف Word ‏(DOCX)', 'Choose a Word file (DOCX)')]),
    process: (values, language) => extractImages(values.word, 'docx', 'word/media/', language),
});

const powerpointImageExtractor = Object.freeze({
    id: 'extract-images-from-powerpoint', category: 'converter', icon: 'PPT→IMG',
    action: Object.freeze({ ar: 'استخرج الصور', en: 'Extract images' }),
    title: Object.freeze({ ar: 'استخراج الصور من PowerPoint', en: 'Extract Images from PowerPoint' }),
    description: Object.freeze({ ar: 'استخرج الصور الأصلية المضمّنة داخل عرض PPTX وحمّلها في ملف ZIP.', en: 'Extract original images embedded in a PPTX presentation and download them as a ZIP archive.' }),
    note: Object.freeze({ ar: 'تتم العملية محليًا ولا يُرفع العرض.', en: 'Processing stays local and the presentation is never uploaded.' }),
    tags: Object.freeze(['powerpoint', 'pptx', 'extract images', 'zip', 'office', 'processing']),
    inputs: Object.freeze([officeFileInput('powerpoint', 'pptx', 'اختر ملف PowerPoint ‏(PPTX)', 'Choose a PowerPoint file (PPTX)')]),
    process: (values, language) => extractImages(values.powerpoint, 'pptx', 'ppt/media/', language),
});

const wordToText = Object.freeze({
    id: 'word-to-txt-converter', category: 'text', icon: 'DOC→TXT',
    action: Object.freeze({ ar: 'استخرج النص', en: 'Extract text' }),
    title: Object.freeze({ ar: 'تحويل Word إلى TXT', en: 'Word to TXT Converter' }),
    description: Object.freeze({ ar: 'استخرج النص من ملف DOCX مع الحفاظ على فواصل الفقرات وحمّله كملف TXT.', en: 'Extract text from a DOCX file, preserve paragraph breaks and download it as TXT.' }),
    note: Object.freeze({ ar: 'لا تُضاف الصور أو تنسيقات الخط إلى TXT. الملف لا يغادر جهازك.', en: 'Images and font styling are not included in TXT. The file never leaves your device.' }),
    tags: Object.freeze(['word', 'docx', 'txt', 'text extraction', 'converter', 'processing']),
    inputs: Object.freeze([officeFileInput('word', 'docx', 'اختر ملف Word ‏(DOCX)', 'Choose a Word file (DOCX)')]),
    async process(values, language) {
        assertOfficeFile(values.word, 'docx', language);
        const JSZip = await loadZip();
        const zip = await JSZip.loadAsync(await values.word.arrayBuffer());
        const document = zip.file('word/document.xml');
        if (!document) throw new Error(localized(language, 'ملف Word لا يحتوي على مستند قابل للقراءة.', 'The Word file has no readable document content.'));
        const text = documentXmlToText(await document.async('text'));
        if (!text) throw new Error(localized(language, 'لم يتم العثور على نص.', 'No text was found.'));
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        return { value: localized(language, `${text.length} حرفًا`, `${text.length} characters`), label: localized(language, 'ملف TXT جاهز', 'TXT file is ready'), details: `${(blob.size / 1024).toFixed(1)} KB`, download: { blob, filename: `${values.word.name.replace(/\.docx$/i, '')}.txt` } };
    },
});

const powerpointToImages = Object.freeze({
    id: 'powerpoint-to-jpg-converter', category: 'image', icon: 'PPT→JPG',
    action: Object.freeze({ ar: 'حوّل الشرائح', en: 'Convert slides' }),
    title: Object.freeze({ ar: 'تحويل PowerPoint إلى JPG', en: 'PowerPoint to JPG Converter' }),
    description: Object.freeze({ ar: 'حوّل شرائح PPTX إلى صور JPG مرتبة وحمّلها داخل ملف ZIP واحد.', en: 'Convert PPTX slides into ordered JPG images and download them in one ZIP archive.' }),
    note: Object.freeze({ ar: 'يعرض النص والصورة الأساسية لكل شريحة. الحركات والتخطيطات المعقدة قد لا تتطابق تمامًا.', en: 'Renders slide text and the primary image. Animations and complex layouts may not match exactly.' }),
    tags: Object.freeze(['powerpoint', 'pptx', 'jpg', 'slides', 'images', 'converter', 'processing']),
    inputs: Object.freeze([officeFileInput('powerpoint', 'pptx', 'اختر ملف PowerPoint ‏(PPTX)', 'Choose a PowerPoint file (PPTX)')]),
    async process(values, language) {
        assertOfficeFile(values.powerpoint, 'pptx', language);
        const JSZip = await loadZip();
        const source = await JSZip.loadAsync(await values.powerpoint.arrayBuffer());
        const paths = Object.keys(source.files).filter((path) => /^ppt\/slides\/slide\d+\.xml$/i.test(path)).sort(naturalSlideOrder);
        if (!paths.length || paths.length > 150) throw new Error(localized(language, 'العرض فارغ أو يتجاوز 150 شريحة.', 'The presentation is empty or exceeds 150 slides.'));
        const output = new JSZip();
        for (const [index, path] of paths.entries()) {
            const xml = await source.file(path).async('text');
            const relPath = path.replace('/slides/', '/slides/_rels/').replace(/\.xml$/i, '.xml.rels');
            const relXml = source.file(relPath) ? await source.file(relPath).async('text') : '';
            const images = [];
            const imagePath = slideMediaPaths(path, xml, relXml)[0];
            const image = imagePath ? await decodeZipImage(source.file(imagePath)) : undefined;
            if (image) images.push(image);
            try {
                const blob = await renderSlide({ paragraphs: extractSlideText(xml), images }, index + 1, language, 'image/jpeg', 0.88);
                output.file(`slide-${String(index + 1).padStart(3, '0')}.jpg`, blob);
            } finally { image?.close?.(); }
        }
        const blob = await output.generateAsync({ type: 'blob', mimeType: 'application/zip', compression: 'DEFLATE' });
        return { value: localized(language, `${paths.length} صورة`, `${paths.length} images`), label: localized(language, 'صور الشرائح جاهزة', 'Slide images are ready'), details: `${(blob.size / 1024).toFixed(1)} KB`, download: { blob, filename: `${values.powerpoint.name.replace(/\.pptx$/i, '')}-jpg.zip` } };
    },
});

const officeUtilityToolDefinitions = Object.freeze({
    [excelCompressor.id]: excelCompressor,
    [wordImageExtractor.id]: wordImageExtractor,
    [powerpointImageExtractor.id]: powerpointImageExtractor,
    [wordToText.id]: wordToText,
    [powerpointToImages.id]: powerpointToImages,
});

export { documentXmlToText, officeUtilityToolDefinitions, packageMediaPaths };

// END OF FILE
