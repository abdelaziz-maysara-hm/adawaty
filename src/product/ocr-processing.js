import { assertPdfFile, loadPdfJs } from './pdf-processing.js';

const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/+esm';
let tesseractPromise;

function loadTesseract() {
    tesseractPromise ??= import(TESSERACT_URL).catch((error) => {
        tesseractPromise = undefined;
        throw new Error(`Unable to load the OCR engine: ${error.message}`);
    });
    return tesseractPromise;
}

function assertImageFile(file) {
    if (!(file instanceof File) || !file.type.startsWith('image/')) {
        throw new Error('Please choose a valid image file.');
    }
}

async function withWorker(language, callback) {
    const { createWorker } = await loadTesseract();
    const worker = await createWorker(language);
    try {
        return await callback(worker);
    } finally {
        await worker.terminate();
    }
}

async function recognizeImage(file, language) {
    assertImageFile(file);
    return withWorker(language, async (worker) => {
        const { data } = await worker.recognize(file);
        return data.text.trim();
    });
}

async function recognizePdf(file, language, scale = 1.6) {
    assertPdfFile(file);
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
    });
    const pdfDocument = await loadingTask.promise;

    try {
        return await withWorker(language, async (worker) => {
            const pages = [];
            for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
                const page = await pdfDocument.getPage(pageNumber);
                const viewport = page.getViewport({ scale });
                const canvas = globalThis.document.createElement('canvas');
                canvas.width = Math.ceil(viewport.width);
                canvas.height = Math.ceil(viewport.height);
                const context = canvas.getContext('2d', { alpha: false });
                await page.render({ canvasContext: context, viewport }).promise;
                const { data } = await worker.recognize(canvas);
                pages.push(data.text.trim());
                page.cleanup();
                canvas.width = 1;
                canvas.height = 1;
            }
            return pages;
        });
    } finally {
        await pdfDocument.destroy();
    }
}

export {
    assertImageFile,
    recognizeImage,
    recognizePdf,
};

// END OF FILE
