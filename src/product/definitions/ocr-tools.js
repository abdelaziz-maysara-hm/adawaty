import { recognizeImage, recognizePdf } from '../ocr-processing.js';
import { createDocx } from './pdf-content-tools.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function languageInput() {
    return Object.freeze({
        id: 'ocrLanguage',
        type: 'select',
        label: Object.freeze({ ar: 'لغة المستند', en: 'Document language' }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze([
            Object.freeze({ value: 'ara', label: Object.freeze({ ar: 'العربية', en: 'Arabic' }) }),
            Object.freeze({ value: 'eng', label: Object.freeze({ ar: 'الإنجليزية', en: 'English' }) }),
            Object.freeze({ value: 'ara+eng', label: Object.freeze({ ar: 'العربية والإنجليزية', en: 'Arabic and English' }) }),
        ]),
    });
}

function pdfInput() {
    return Object.freeze({
        id: 'pdf',
        type: 'file',
        accept: 'application/pdf,.pdf',
        label: Object.freeze({ ar: 'اختر ملف PDF مصورًا', en: 'Choose a scanned PDF' }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function textResult(text, filename, language, ar, en) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    return {
        value: localized(language, `${text.length} حرف`, `${text.length} characters`),
        label: localized(language, ar, en),
        details: `${(blob.size / 1024).toFixed(1)} KB`,
        download: { blob, filename },
    };
}

function joinedPages(pages, language) {
    return pages.map((page, index) => (
        `--- ${localized(language, 'صفحة', 'Page')} ${index + 1} ---\n${page}`
    )).join('\n\n');
}

const scannedPdfOcr = Object.freeze({
    id: 'scanned-pdf-ocr',
    category: 'pdf',
    icon: 'OCR PDF',
    action: Object.freeze({ ar: 'تعرّف على النص', en: 'Run OCR' }),
    title: Object.freeze({ ar: 'استخراج النص من PDF مصور OCR', en: 'Scanned PDF OCR' }),
    description: Object.freeze({
        ar: 'حوّل صفحات PDF الممسوحة ضوئيًا إلى نص قابل للبحث والنسخ باستخدام التعرف الضوئي على الحروف.',
        en: 'Turn scanned PDF pages into searchable, copyable text using optical character recognition.',
    }),
    note: Object.freeze({
        ar: 'تعمل المعالجة على جهازك وقد تستغرق عدة دقائق للمستندات الكبيرة. وضوح الصورة يحسن دقة النص.',
        en: 'Processing runs on your device and large documents may take several minutes. Clear scans improve accuracy.',
    }),
    inputs: Object.freeze([pdfInput(), languageInput()]),
    async process(values, language) {
        const pages = await recognizePdf(values.pdf, values.ocrLanguage);
        const text = joinedPages(pages, language);
        const base = values.pdf.name.replace(/\.pdf$/i, '') || 'scanned-document';
        return textResult(
            text,
            `${base}-ocr.txt`,
            language,
            'تم التعرف على نص المستند',
            'Scanned PDF text recognized',
        );
    },
});

const scannedPdfToWord = Object.freeze({
    id: 'scanned-pdf-to-word-ocr',
    category: 'pdf',
    icon: 'OCR→DOCX',
    action: Object.freeze({ ar: 'حوّل إلى Word', en: 'Convert to Word' }),
    title: Object.freeze({ ar: 'تحويل PDF مصور إلى Word باستخدام OCR', en: 'Scanned PDF to Word with OCR' }),
    description: Object.freeze({
        ar: 'تعرّف على النص داخل صفحات PDF المصورة وأنشئ مستند Word قابلًا للتعديل مع فصل الصفحات.',
        en: 'Recognize text in scanned PDF pages and create an editable Word document with page separation.',
    }),
    note: Object.freeze({
        ar: 'ينقل النص إلى Word ولا يعيد بناء التصميم الأصلي المعقد أو الصور والجداول تلقائيًا.',
        en: 'This transfers recognized text to Word; it does not recreate complex layouts, images or tables.',
    }),
    inputs: Object.freeze([pdfInput(), languageInput()]),
    async process(values, language) {
        const pages = await recognizePdf(values.pdf, values.ocrLanguage);
        const blob = await createDocx(pages);
        const base = values.pdf.name.replace(/\.pdf$/i, '') || 'scanned-document';
        return {
            value: localized(language, `${pages.length} صفحة`, `${pages.length} pages`),
            label: localized(language, 'مستند Word جاهز', 'OCR Word document is ready'),
            details: `${(blob.size / 1024).toFixed(1)} KB`,
            download: { blob, filename: `${base}-ocr.docx` },
        };
    },
});

const imageOcr = Object.freeze({
    id: 'image-to-text-ocr',
    category: 'image',
    icon: 'IMG→TXT',
    action: Object.freeze({ ar: 'استخرج النص', en: 'Extract text' }),
    title: Object.freeze({ ar: 'تحويل الصورة إلى نص OCR', en: 'Image to Text OCR' }),
    description: Object.freeze({
        ar: 'استخرج النص العربي أو الإنجليزي من صورة فاتورة أو مستند أو لقطة شاشة ونزّله كملف نصي.',
        en: 'Extract Arabic or English text from a receipt, document image or screenshot and download it as text.',
    }),
    note: Object.freeze({
        ar: 'استخدم صورة واضحة ومستقيمة وعالية الدقة للحصول على أفضل نتيجة. لا يتم رفع الصورة.',
        en: 'Use a clear, straight, high-resolution image for best results. The image is not uploaded.',
    }),
    inputs: Object.freeze([
        Object.freeze({
            id: 'image',
            type: 'file',
            accept: 'image/png,image/jpeg,image/webp,image/bmp,.png,.jpg,.jpeg,.webp,.bmp',
            label: Object.freeze({ ar: 'اختر صورة', en: 'Choose an image' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
        languageInput(),
    ]),
    async process(values, language) {
        const text = await recognizeImage(values.image, values.ocrLanguage);
        const base = values.image.name.replace(/\.[^.]+$/, '') || 'image';
        return textResult(
            text,
            `${base}-ocr.txt`,
            language,
            'تم استخراج النص من الصورة',
            'Image text extracted',
        );
    },
});

const ocrToolDefinitions = Object.freeze({
    [scannedPdfOcr.id]: scannedPdfOcr,
    [scannedPdfToWord.id]: scannedPdfToWord,
    [imageOcr.id]: imageOcr,
});

export { ocrToolDefinitions };

// END OF FILE
