import {
    assertPdfFile,
    createPdfBlob,
    loadPdfLib,
    outputName,
} from '../pdf-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function field(id, type, ar, en, options = {}) {
    return Object.freeze({
        id,
        type,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        ...options,
    });
}

function assertOverlayImage(file) {
    if (!file) return;
    const validType = ['image/png', 'image/jpeg'].includes(file.type);
    const validName = /\.(?:png|jpe?g)$/iu.test(file.name ?? '');
    if (!(file instanceof File) || (!validType && !validName)) {
        throw new Error('Choose a PNG or JPG image.');
    }
}

async function renderTextPng(text, color, fontSize) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const scale = 2;
    const padding = Math.max(12, Math.round(fontSize * 0.35));
    const font = `600 ${fontSize * scale}px Arial, sans-serif`;
    context.font = font;
    canvas.width = Math.max(Math.ceil(context.measureText(text).width + (padding * scale * 2)), 2);
    canvas.height = Math.max(Math.ceil((fontSize + (padding * 2)) * scale), 2);
    const isArabic = /[\u0600-\u06ff]/u.test(text);
    context.font = font;
    context.fillStyle = color;
    context.textBaseline = 'middle';
    context.direction = isArabic ? 'rtl' : 'ltr';
    context.textAlign = isArabic ? 'right' : 'left';
    context.fillText(text, isArabic ? canvas.width - (padding * scale) : padding * scale, canvas.height / 2);

    const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
            (value) => value ? resolve(value) : reject(new Error('Unable to render the text overlay.')),
            'image/png',
        );
    });
    return new Uint8Array(await blob.arrayBuffer());
}

function topAlignedY(pageHeight, percentage, overlayHeight) {
    return Math.max(pageHeight - ((Number(percentage) / 100) * pageHeight) - overlayHeight, 0);
}

const pdfEditor = Object.freeze({
    id: 'pdf-editor',
    category: 'pdf',
    icon: 'PDF',
    action: Object.freeze({ ar: '\u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u062a\u0639\u062f\u064a\u0644\u0627\u062a', en: 'Apply edits' }),
    title: Object.freeze({ ar: '\u0645\u062d\u0631\u0631 PDF', en: 'PDF Editor' }),
    description: Object.freeze({
        ar: '\u0623\u0636\u0641 \u0646\u0635\u064b\u0627 \u0639\u0631\u0628\u064a\u064b\u0627 \u0623\u0648 \u0625\u0646\u062c\u0644\u064a\u0632\u064a\u064b\u0627\u060c \u0623\u0648 \u0635\u0648\u0631\u0629 \u0623\u0648 \u062a\u0648\u0642\u064a\u0639\u064b\u0627 \u0625\u0644\u0649 \u0623\u064a \u0635\u0641\u062d\u0629\u060c \u062b\u0645 \u0646\u0632\u0651\u0644 \u0645\u0644\u0641 PDF \u0627\u0644\u0645\u0639\u062f\u0651\u0644.',
        en: 'Add Arabic or English text, an image or a signature to any page, then download the edited PDF.',
    }),
    note: Object.freeze({
        ar: '\u062a\u0639\u0645\u0644 \u0647\u0630\u0647 \u0627\u0644\u0646\u0633\u062e\u0629 \u0645\u062d\u0644\u064a\u064b\u0627 \u0641\u064a \u0645\u062a\u0635\u0641\u062d\u0643. \u0627\u0644\u0645\u0648\u0636\u0639 \u0627\u0644\u0623\u0641\u0642\u064a \u0645\u0646 \u0627\u0644\u064a\u0633\u0627\u0631\u060c \u0648\u0627\u0644\u0645\u0648\u0636\u0639 \u0627\u0644\u0631\u0623\u0633\u064a \u0645\u0646 \u0623\u0639\u0644\u0649 \u0627\u0644\u0635\u0641\u062d\u0629.',
        en: 'This release runs locally in your browser. Horizontal position starts from the left and vertical position starts from the top.',
    }),
    inputs: Object.freeze([
        field('pdf', 'file', '\u0627\u062e\u062a\u0631 \u0645\u0644\u0641 PDF', 'Choose a PDF file', {
            accept: 'application/pdf,.pdf',
        }),
        field('page', 'number', '\u0631\u0642\u0645 \u0627\u0644\u0635\u0641\u062d\u0629', 'Page number', {
            min: 1, max: 10000, step: 1, value: '1',
        }),
        field('text', 'text', '\u0627\u0644\u0646\u0635 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)', 'Text (optional)', {
            required: false, placeholder: Object.freeze({ ar: '\u062a\u0645\u062a \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629', en: 'Approved' }),
        }),
        field('textColor', 'color', '\u0644\u0648\u0646 \u0627\u0644\u0646\u0635', 'Text color', {
            value: '#1f2937',
        }),
        field('fontSize', 'number', '\u062d\u062c\u0645 \u0627\u0644\u0646\u0635', 'Text size', {
            min: 8, max: 160, step: 1, value: '32',
        }),
        field('image', 'file', '\u0635\u0648\u0631\u0629 \u0623\u0648 \u062a\u0648\u0642\u064a\u0639 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)', 'Image or signature (optional)', {
            required: false, accept: 'image/png,image/jpeg,.png,.jpg,.jpeg',
        }),
        field('imageWidth', 'number', '\u0639\u0631\u0636 \u0627\u0644\u0635\u0648\u0631\u0629 \u0645\u0646 \u0627\u0644\u0635\u0641\u062d\u0629', 'Image width on page', {
            min: 5, max: 100, step: 1, value: '30',
            unit: Object.freeze({ ar: '%', en: '%' }),
        }),
        field('x', 'number', '\u0627\u0644\u0645\u0648\u0636\u0639 \u0627\u0644\u0623\u0641\u0642\u064a', 'Horizontal position', {
            min: 0, max: 100, step: 1, value: '10',
            unit: Object.freeze({ ar: '%', en: '%' }),
        }),
        field('y', 'number', '\u0627\u0644\u0645\u0648\u0636\u0639 \u0627\u0644\u0631\u0623\u0633\u064a', 'Vertical position', {
            min: 0, max: 100, step: 1, value: '10',
            unit: Object.freeze({ ar: '%', en: '%' }),
        }),
        field('opacity', 'number', '\u0627\u0644\u0634\u0641\u0627\u0641\u064a\u0629', 'Opacity', {
            min: 5, max: 100, step: 1, value: '100',
            unit: Object.freeze({ ar: '%', en: '%' }),
        }),
    ]),
    async process(values, language) {
        assertPdfFile(values.pdf);
        assertOverlayImage(values.image);
        const text = String(values.text ?? '').trim();
        if (!text && !values.image) {
            throw new Error(localized(language, '\u0623\u0636\u0641 \u0646\u0635\u064b\u0627 \u0623\u0648 \u0627\u062e\u062a\u0631 \u0635\u0648\u0631\u0629/\u062a\u0648\u0642\u064a\u0639\u064b\u0627 \u0623\u0648\u0644\u064b\u0627.', 'Add text or choose an image/signature first.'));
        }

        const pdfLib = await loadPdfLib();
        const document = await pdfLib.PDFDocument.load(await values.pdf.arrayBuffer());
        const pageIndex = Number(values.page) - 1;
        if (!Number.isInteger(pageIndex) || pageIndex < 0 || pageIndex >= document.getPageCount()) {
            throw new Error(localized(
                language,
                `\u0631\u0642\u0645 \u0627\u0644\u0635\u0641\u062d\u0629 \u064a\u062c\u0628 \u0623\u0646 \u064a\u0643\u0648\u0646 \u0628\u064a\u0646 1 \u0648${document.getPageCount()}.`,
                `Page number must be between 1 and ${document.getPageCount()}.`,
            ));
        }

        const page = document.getPage(pageIndex);
        const { width, height } = page.getSize();
        const x = (Number(values.x) / 100) * width;
        const opacity = Number(values.opacity) / 100;

        if (text) {
            const textImage = await document.embedPng(
                await renderTextPng(text, values.textColor, Number(values.fontSize)),
            );
            const dimensions = textImage.scale(0.5);
            const renderedWidth = Math.min(dimensions.width, Math.max(width - x, 1));
            const renderedHeight = dimensions.height * (renderedWidth / dimensions.width);
            page.drawImage(textImage, {
                x,
                y: topAlignedY(height, values.y, renderedHeight),
                width: renderedWidth,
                height: renderedHeight,
                opacity,
            });
        }

        if (values.image) {
            const bytes = new Uint8Array(await values.image.arrayBuffer());
            const image = values.image.type === 'image/png' || /\.png$/iu.test(values.image.name)
                ? await document.embedPng(bytes)
                : await document.embedJpg(bytes);
            const targetWidth = Math.min((Number(values.imageWidth) / 100) * width, Math.max(width - x, 1));
            const dimensions = image.scale(targetWidth / image.width);
            page.drawImage(image, {
                x,
                y: topAlignedY(height, values.y, dimensions.height),
                width: dimensions.width,
                height: dimensions.height,
                opacity,
            });
        }

        const blob = createPdfBlob(await document.save());
        return {
            value: localized(language, `${document.getPageCount()} \u0635\u0641\u062d\u0629`, `${document.getPageCount()} pages`),
            label: localized(language, '\u0645\u0644\u0641 PDF \u0627\u0644\u0645\u0639\u062f\u0651\u0644 \u062c\u0627\u0647\u0632', 'Edited PDF is ready'),
            details: `${(blob.size / 1024).toFixed(1)} KB`,
            download: { blob, filename: outputName(values.pdf, 'edited') },
        };
    },
});

const pdfEditorToolDefinitions = Object.freeze({
    [pdfEditor.id]: pdfEditor,
});

export {
    assertOverlayImage,
    pdfEditorToolDefinitions,
};

// END OF FILE
