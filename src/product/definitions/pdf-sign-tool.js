import {
    assertPdfFile,
    createPdfBlob,
    loadPdfLib,
    outputName,
} from '../pdf-processing.js';

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

function imageInput(id, ar, en) {
    return Object.freeze({
        id,
        type: 'file',
        accept: 'image/png,image/jpeg,.png,.jpg,.jpeg',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
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

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map(([value, optAr, optEn]) => Object.freeze({
            value,
            label: Object.freeze({ ar: optAr, en: optEn }),
        }))),
    });
}

const SIGNATURE_POSITIONS = Object.freeze({
    bottomRight: (pageWidth, pageHeight, sigWidth, sigHeight) => ({
        x: pageWidth - sigWidth - 40, y: 40,
    }),
    bottomLeft: (pageWidth, pageHeight, sigWidth, sigHeight) => ({
        x: 40, y: 40,
    }),
    bottomCenter: (pageWidth, pageHeight, sigWidth, sigHeight) => ({
        x: (pageWidth - sigWidth) / 2, y: 40,
    }),
});

const pdfSigner = Object.freeze({
    id: 'pdf-sign',
    category: 'pdf',
    icon: 'SIGN',
    action: Object.freeze({ ar: 'ضع التوقيع', en: 'Place signature' }),
    title: Object.freeze({ ar: 'إضافة توقيع لملف PDF', en: 'PDF Signature Placer' }),
    description: Object.freeze({
        ar: 'ضع صورة توقيعك (بخط اليد أو أي صورة توقيع جاهزة) على صفحة محددة من ملف PDF، مفيد لتوقيع عقود أو مستندات بسرعة.',
        en: 'Place an image of your signature (handwritten or any ready signature image) on a specific page of a PDF, useful for quickly signing contracts or documents.',
    }),
    note: Object.freeze({
        ar: 'يُفضّل استخدام صورة PNG بخلفية شفافة لتوقيع يندمج بشكل طبيعي مع صفحة المستند.',
        en: 'A PNG image with a transparent background gives a signature that blends naturally with the document page.',
    }),
    inputs: Object.freeze([
        pdfInput(),
        imageInput('signature', 'صورة التوقيع', 'Signature image'),
        numberInput('page', 'رقم الصفحة', 'Page number', 1, 1, 10000, ''),
        numberInput('width', 'عرض التوقيع', 'Signature width', 150, 30, 500, 'نقطة PDF'),
        selectInput('position', 'الموضع', 'Position', [
            ['bottomRight', 'أسفل اليمين', 'Bottom-right'],
            ['bottomCenter', 'أسفل المنتصف', 'Bottom-center'],
            ['bottomLeft', 'أسفل اليسار', 'Bottom-left'],
        ]),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);

        const { PDFDocument } = await loadPdfLib();
        const document = await PDFDocument.load(await values.pdf.arrayBuffer());
        const pages = document.getPages();
        const pageIndex = Math.round(values.page) - 1;

        if (pageIndex < 0 || pageIndex >= pages.length) {
            throw new Error(localized(
                language,
                `المستند يحتوي على ${pages.length} صفحة فقط.`,
                `The document only has ${pages.length} pages.`,
            ));
        }

        const signatureBytes = await values.signature.arrayBuffer();
        const signatureImage = values.signature.type === 'image/png'
            ? await document.embedPng(signatureBytes)
            : await document.embedJpg(signatureBytes);

        const sigWidth = values.width;
        const sigHeight = (signatureImage.height / signatureImage.width) * sigWidth;
        const page = pages[pageIndex];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const placeFn = SIGNATURE_POSITIONS[values.position] ?? SIGNATURE_POSITIONS.bottomRight;
        const { x, y } = placeFn(pageWidth, pageHeight, sigWidth, sigHeight);

        page.drawImage(signatureImage, {
            x, y, width: sigWidth, height: sigHeight,
        });

        const blob = createPdfBlob(await document.save());
        return {
            value: `${(blob.size / 1024).toFixed(1)} KB`,
            label: localized(language, 'الملف الموقّع جاهز', 'The signed file is ready'),
            details: localized(language, `تم التوقيع على صفحة ${values.page}`, `Signed on page ${values.page}`),
            download: { blob, filename: outputName(values.pdf, 'signed') },
        };
    },
});

const pdfSignToolDefinitions = Object.freeze({
    [pdfSigner.id]: pdfSigner,
});

export { pdfSignToolDefinitions };

// END OF FILE
