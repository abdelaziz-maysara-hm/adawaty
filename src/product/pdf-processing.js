const PDF_LIB_URL = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm';
let pdfLibPromise;

async function loadPdfLib() {
    pdfLibPromise ??= import(PDF_LIB_URL).catch((error) => {
        pdfLibPromise = undefined;
        throw new Error(`Unable to load the PDF processing engine: ${error.message}`);
    });
    return pdfLibPromise;
}

function assertPdfFile(file) {
    if (!(file instanceof File) || (
        file.type !== 'application/pdf'
        && !file.name.toLowerCase().endsWith('.pdf')
    )) {
        throw new Error('Please choose a valid PDF file.');
    }
}

function parsePageSelection(value, pageCount) {
    const selection = String(value ?? '').trim().toLowerCase();
    if (!selection || selection === 'all') {
        return Array.from({ length: pageCount }, (_, index) => index);
    }

    const pages = [];
    const seen = new Set();
    for (const token of selection.split(',')) {
        const match = token.trim().match(/^(\d+)(?:-(\d+))?$/);
        if (!match) {
            throw new Error('Use page numbers such as 1-3,5,8.');
        }

        const start = Number(match[1]);
        const end = Number(match[2] ?? match[1]);
        if (start < 1 || end < start || end > pageCount) {
            throw new Error(`Page selection must be between 1 and ${pageCount}.`);
        }

        for (let page = start; page <= end; page += 1) {
            const index = page - 1;
            if (!seen.has(index)) {
                seen.add(index);
                pages.push(index);
            }
        }
    }
    return pages;
}

function createPdfBlob(bytes) {
    return new Blob([bytes], { type: 'application/pdf' });
}

function outputName(file, suffix) {
    const base = file.name.replace(/\.pdf$/i, '') || 'document';
    return `${base}-${suffix}.pdf`;
}

export {
    assertPdfFile,
    createPdfBlob,
    loadPdfLib,
    outputName,
    parsePageSelection,
};

// END OF FILE
