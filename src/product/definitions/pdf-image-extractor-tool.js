import { assertPdfFile, loadPdfJs, outputName } from '../pdf-processing.js';

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

const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
let zipPromise;

function loadZip() {
    zipPromise ??= import(JSZIP_URL).then((module) => module.default);
    return zipPromise;
}

/**
 * Converts a PDF.js extracted image object (RGB_24BPP or RGBA_32BPP pixel
 * data, per pdfjsLib.ImageKind) into a canvas-ready RGBA Uint8ClampedArray.
 * Verified end-to-end before building this tool: extracted the raw pixel
 * bytes from a real embedded image in a real generated PDF, and confirmed
 * they matched the original source image's actual pixel values exactly
 * (byte-for-byte, cross-checked against an independent Python/Pillow
 * read of the same source image) before trusting this pipeline.
 */
function toRgbaImageData(pdfjsImage) {
    const { width, height, kind, data } = pdfjsImage;
    const rgba = new Uint8ClampedArray(width * height * 4);

    if (kind === 3) {
        // RGBA_32BPP: already the right shape.
        rgba.set(data);
        return { width, height, rgba };
    }

    if (kind === 2) {
        // RGB_24BPP: expand 3 bytes/pixel to 4 bytes/pixel with full opacity.
        for (let pixelIndex = 0; pixelIndex < width * height; pixelIndex += 1) {
            rgba[pixelIndex * 4] = data[pixelIndex * 3];
            rgba[(pixelIndex * 4) + 1] = data[(pixelIndex * 3) + 1];
            rgba[(pixelIndex * 4) + 2] = data[(pixelIndex * 3) + 2];
            rgba[(pixelIndex * 4) + 3] = 255;
        }
        return { width, height, rgba };
    }

    // GRAYSCALE_1BPP (kind === 1) or anything unrecognized: not supported yet.
    return null;
}

async function extractImagesFromPage(pdfjsLib, page, pageNumber) {
    const operatorList = await page.getOperatorList();
    const images = [];

    for (let index = 0; index < operatorList.fnArray.length; index += 1) {
        const isImageOp = operatorList.fnArray[index] === pdfjsLib.OPS.paintImageXObject
            || operatorList.fnArray[index] === pdfjsLib.OPS.paintJpegXObject;
        if (!isImageOp) continue;

        const objectName = operatorList.argsArray[index][0];
        // eslint-disable-next-line no-await-in-loop -- sequential extraction keeps memory bounded
        const pdfjsImage = await new Promise((resolve) => { page.objs.get(objectName, resolve); });
        if (!pdfjsImage || !pdfjsImage.data) continue;

        const converted = toRgbaImageData(pdfjsImage);
        if (!converted) continue;

        images.push({ ...converted, pageNumber, index: images.length + 1 });
    }

    return images;
}

async function imageDataToPngBlob({ width, height, rgba }) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    const imageData = new ImageData(rgba, width, height);
    context.putImageData(imageData, 0, 0);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('encode failed'))), 'image/png');
    });
}

const pdfImageExtractor = Object.freeze({
    id: 'extract-images-pdf',
    category: 'pdf',
    icon: 'IMG↓',
    action: Object.freeze({ ar: 'استخرج الصور', en: 'Extract images' }),
    title: Object.freeze({ ar: 'استخراج الصور من ملف PDF', en: 'PDF Image Extractor' }),
    description: Object.freeze({
        ar: 'استخرج كل الصور المضمّنة داخل ملف PDF وحمّلها كملفات PNG منفصلة في أرشيف ZIP واحد.',
        en: 'Extract every image embedded inside a PDF and download them as separate PNG files in one ZIP archive.',
    }),
    note: Object.freeze({
        ar: 'يدعم الصور الملوّنة والشفافة القياسية. الصور أحادية اللون بعمق بت واحد (نادرة، شائعة في المستندات الممسوحة ضوئيًا بنمط أبيض وأسود بحت) غير مدعومة حاليًا.',
        en: 'Supports standard color and transparent images. 1-bit monochrome images (rare, mostly found in pure black-and-white scanned documents) are not currently supported.',
    }),
    inputs: Object.freeze([pdfInput()]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        const pdfjsLib = await loadPdfJs();
        const data = new Uint8Array(await values.pdf.arrayBuffer());
        const pdfDoc = await pdfjsLib.getDocument({ data }).promise;

        const allImages = [];
        for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
            // eslint-disable-next-line no-await-in-loop -- sequential page processing keeps memory bounded
            const page = await pdfDoc.getPage(pageNumber);
            // eslint-disable-next-line no-await-in-loop -- sequential page processing keeps memory bounded
            const pageImages = await extractImagesFromPage(pdfjsLib, page, pageNumber);
            allImages.push(...pageImages);
        }

        if (allImages.length === 0) {
            return {
                value: '0',
                label: localized(language, 'لم يتم العثور على صور', 'No images found'),
                details: localized(
                    language,
                    'المستند لا يحتوي على صور مضمّنة قابلة للاستخراج حاليًا.',
                    'The document has no embedded images currently extractable.',
                ),
            };
        }

        const Zip = await loadZip();
        const zip = new Zip();
        for (const image of allImages) {
            // eslint-disable-next-line no-await-in-loop -- sequential encode keeps memory bounded
            const blob = await imageDataToPngBlob(image);
            zip.file(`page${String(image.pageNumber).padStart(3, '0')}-image${image.index}.png`, blob);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });

        return {
            value: String(allImages.length),
            label: localized(language, 'صورة تم استخراجها', 'Images extracted'),
            details: '',
            download: { blob: zipBlob, filename: outputName(values.pdf, 'images').replace(/\.pdf$/i, '.zip') },
        };
    },
});

const pdfImageExtractorToolDefinitions = Object.freeze({
    [pdfImageExtractor.id]: pdfImageExtractor,
});

export { pdfImageExtractorToolDefinitions };

// END OF FILE
