const PDF_LIB_URL = 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm';
const PDF_JS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.mjs';
const PDF_JS_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.mjs';
const PDF_ENCRYPT_URL = 'https://cdn.jsdelivr.net/npm/@pdfsmaller/pdf-encrypt-lite@1.2.0/+esm';
let pdfLibPromise;
let pdfJsPromise;
let pdfEncryptPromise;

async function loadPdfLib() {
    pdfLibPromise ??= import(PDF_LIB_URL).catch((error) => {
        pdfLibPromise = undefined;
        throw new Error(`Unable to load the PDF processing engine: ${error.message}`);
    });
    return pdfLibPromise;
}

async function loadPdfJs() {
    pdfJsPromise ??= import(PDF_JS_URL).then((module) => {
        module.GlobalWorkerOptions.workerSrc = PDF_JS_WORKER_URL;
        return module;
    }).catch((error) => {
        pdfJsPromise = undefined;
        throw new Error(`Unable to load the PDF rendering engine: ${error.message}`);
    });
    return pdfJsPromise;
}

/**
 * pdf-lib (the library used everywhere else in this file) can only read the
 * *structure* of an encrypted PDF's header enough to detect that it's
 * encrypted -- PDFDocument.load(bytes, { password }) does not actually
 * decrypt content in the version pinned here (verified directly against a
 * real qpdf-encrypted test file: it throws the same "document is
 * encrypted" error regardless of whether the password given is correct,
 * incorrect, or omitted). This separate, small, purpose-built library
 * handles real RC4-128 encryption for *adding* a password to an existing
 * (unencrypted) PDF. It does not add decryption capability -- removing an
 * existing password is a separate, still-unsolved problem in this stack.
 */
async function loadPdfEncrypt() {
    pdfEncryptPromise ??= import(PDF_ENCRYPT_URL).catch((error) => {
        pdfEncryptPromise = undefined;
        throw new Error(`Unable to load the PDF encryption engine: ${error.message}`);
    });
    return pdfEncryptPromise;
}

function assertPdfFile(file) {
    if (!(file instanceof File) || (
        file.type !== 'application/pdf'
        && !file.name.toLowerCase().endsWith('.pdf')
    )) {
        throw new Error('Please choose a valid PDF file.');
    }
}

async function inspectPdfFile(file) {
    assertPdfFile(file);
    if (file.size < 8) throw new Error('The selected file is not a readable PDF document.');
    const header = new Uint8Array(await file.slice(0, Math.min(file.size, 1024)).arrayBuffer());
    const trailer = new Uint8Array(await file.slice(Math.max(0, file.size - 2048)).arrayBuffer());
    const decode = (bytes) => new TextDecoder('latin1').decode(bytes);
    if (!decode(header).includes('%PDF-') || !decode(trailer).includes('%%EOF')) throw new Error('The selected file is not a readable PDF document.');
    return Object.freeze({ size: file.size, version: decode(header).match(/%PDF-(\d\.\d)/)?.[1] ?? null });
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
    inspectPdfFile,
    loadPdfEncrypt,
    loadPdfLib,
    loadPdfJs,
    outputName,
    parsePageSelection,
};

// END OF FILE
