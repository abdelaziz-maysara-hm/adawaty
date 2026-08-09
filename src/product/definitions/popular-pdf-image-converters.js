import { pdfImageToolDefinitions } from './pdf-image-tools.js';

const imagesToPdfBase = pdfImageToolDefinitions['images-to-pdf-converter'];
const pdfToImagesBase = pdfImageToolDefinitions['pdf-to-images-converter'];

function imageFilesInput(format) {
    const isJpg = format === 'jpg';
    const label = isJpg ? 'JPG' : 'PNG';
    return Object.freeze({
        id: 'images', type: 'file', multiple: true,
        accept: isJpg ? 'image/jpeg,.jpg,.jpeg' : 'image/png,.png',
        label: Object.freeze({ ar: `اختر صور ${label} بالترتيب`, en: `Choose ${label} images in order` }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function imageToPdfDefinition(format) {
    const label = format.toUpperCase();
    const id = `${format}-to-pdf-converter`;
    return Object.freeze({
        ...imagesToPdfBase,
        id,
        icon: `${label}→PDF`,
        action: Object.freeze({ ar: 'أنشئ PDF', en: 'Create PDF' }),
        title: Object.freeze({ ar: `تحويل ${label} إلى PDF`, en: `${label} to PDF Converter` }),
        description: Object.freeze({ ar: `اجمع صورة ${label} واحدة أو عدة صور مرتبة في ملف PDF خاص على جهازك.`, en: `Combine one or more ordered ${label} images into a private PDF on your device.` }),
        note: Object.freeze({ ar: 'تتحول كل صورة إلى صفحة مستقلة بنفس ترتيب الاختيار ولا تُرفع الملفات.', en: 'Each image becomes a separate page in selection order and files are never uploaded.' }),
        tags: Object.freeze([format, 'pdf', `${label} to PDF`, 'images to pdf', 'private', 'processing']),
        inputs: Object.freeze([imageFilesInput(format)]),
    });
}

function pdfToImageDefinition(format) {
    const isJpg = format === 'jpg';
    const label = isJpg ? 'JPG' : 'PNG';
    const mime = isJpg ? 'image/jpeg' : 'image/png';
    const id = `pdf-to-${format}-converter`;
    return Object.freeze({
        ...pdfToImagesBase,
        id,
        icon: `PDF→${label}`,
        action: Object.freeze({ ar: `حوّل إلى ${label}`, en: `Convert to ${label}` }),
        title: Object.freeze({ ar: `تحويل PDF إلى ${label}`, en: `PDF to ${label} Converter` }),
        description: Object.freeze({ ar: `حوّل كل صفحة PDF إلى صورة ${label} عالية الجودة ونزّل النتائج داخل ZIP.`, en: `Convert every PDF page to a high-quality ${label} image and download the results in a ZIP.` }),
        note: Object.freeze({ ar: 'تتم قراءة المستند وتصوير صفحاته داخل المتصفح دون رفعه.', en: 'The document is read and rendered inside your browser without uploading it.' }),
        tags: Object.freeze(['pdf', format, `PDF to ${label}`, 'pdf pages', 'private', 'processing']),
        inputs: Object.freeze([pdfToImagesBase.inputs[0], pdfToImagesBase.inputs[2]]),
        process(values, language) {
            return pdfToImagesBase.process({ ...values, format: mime }, language);
        },
    });
}

const dedicatedPdfImageIds = Object.freeze([
    'jpg-to-pdf-converter', 'png-to-pdf-converter',
    'pdf-to-jpg-converter', 'pdf-to-png-converter',
]);

const definitions = [
    imageToPdfDefinition('jpg'), imageToPdfDefinition('png'),
    pdfToImageDefinition('jpg'), pdfToImageDefinition('png'),
];

const popularPdfImageConverterDefinitions = Object.freeze(Object.fromEntries(
    definitions.map((definition) => [definition.id, definition]),
));

export { dedicatedPdfImageIds, popularPdfImageConverterDefinitions };

// END OF FILE
