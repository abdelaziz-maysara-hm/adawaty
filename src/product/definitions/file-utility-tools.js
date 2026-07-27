function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function fileInput(id, ar, en, accept = '', multiple = false) {
    return Object.freeze({
        id,
        type: 'file',
        accept,
        multiple,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function textareaInput(id, ar, en, placeholder, rows = 10) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function textInput(id, ar, en, placeholder = '') {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function downloadable(blob, filename, language, arLabel, enLabel) {
    return {
        value: localized(language, `${blob.size} بايت`, `${blob.size} bytes`),
        label: localized(language, arLabel, enLabel),
        details: localized(language, 'تمت المعالجة محليًا داخل المتصفح.', 'Processed locally in your browser.'),
        download: { blob, filename },
    };
}

function textResult(text, filename, language, arLabel, enLabel, type = 'text/plain;charset=utf-8') {
    return downloadable(new Blob([text], { type }), filename, language, arLabel, enLabel);
}

function safeName(name) {
    return String(name || 'file').replace(/[^\p{L}\p{N}_.-]+/gu, '_');
}

function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return btoa(binary);
}

function base64ToBytes(value) {
    const cleaned = String(value).trim().replace(/^data:[^,]*,/u, '').replace(/\s+/g, '');
    const binary = atob(cleaned);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function digestFile(file, algorithm) {
    const digest = await crypto.subtle.digest(algorithm, await file.arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function tool({ id, icon, title, description, note, inputs, process, action }) {
    return Object.freeze({
        id,
        category: 'developer',
        icon,
        action: Object.freeze(action ?? { ar: 'معالجة الملف', en: 'Process file' }),
        title: Object.freeze(title),
        description: Object.freeze(description),
        note: Object.freeze(note),
        inputs: Object.freeze(inputs),
        process,
    });
}

function checksumTool(id, algorithm, icon, arTitle, enTitle) {
    return tool({
        id,
        icon,
        title: { ar: arTitle, en: enTitle },
        description: {
            ar: `احسب بصمة ${algorithm} لأي ملف محليًا للتحقق من سلامته.`,
            en: `Calculate a local ${algorithm} checksum to verify file integrity.`,
        },
        note: { ar: 'لا يُرفع الملف إلى أي خادم.', en: 'The file is never uploaded to a server.' },
        inputs: [fileInput('file', 'اختر الملف', 'Choose file')],
        action: { ar: 'احسب البصمة', en: 'Calculate checksum' },
        async process(values, language) {
            const hash = await digestFile(values.file, algorithm);
            return textResult(hash, `${safeName(values.file.name)}.${algorithm.toLowerCase()}.txt`, language, 'تم حساب البصمة', 'Checksum calculated');
        },
    });
}

const fileSha256Checksum = checksumTool(
    'file-sha256-checksum',
    'SHA-256',
    '256',
    'حساب بصمة ملف SHA-256',
    'File SHA-256 Checksum',
);

const fileSha1Checksum = checksumTool(
    'file-sha1-checksum',
    'SHA-1',
    'SHA1',
    'حساب بصمة ملف SHA-1',
    'File SHA-1 Checksum',
);

const fileToBase64 = tool({
    id: 'file-to-base64-converter',
    icon: 'B64',
    title: { ar: 'تحويل ملف إلى Base64', en: 'File to Base64 Converter' },
    description: { ar: 'حوّل أي ملف إلى نص Base64 أو Data URL قابل للتنزيل.', en: 'Convert any file into downloadable Base64 text or a data URL.' },
    note: { ar: 'تتم القراءة داخل جهازك فقط.', en: 'The file is read only on your device.' },
    inputs: [fileInput('file', 'اختر الملف', 'Choose file')],
    async process(values, language) {
        const bytes = new Uint8Array(await values.file.arrayBuffer());
        const encoded = `data:${values.file.type || 'application/octet-stream'};base64,${bytesToBase64(bytes)}`;
        return textResult(encoded, `${safeName(values.file.name)}.base64.txt`, language, 'تم ترميز الملف', 'File encoded');
    },
});

const base64ToFile = tool({
    id: 'base64-to-file-converter',
    icon: 'FILE',
    title: { ar: 'تحويل Base64 إلى ملف', en: 'Base64 to File Converter' },
    description: { ar: 'فك نص Base64 أو Data URL وتنزيل البايتات كملف.', en: 'Decode Base64 text or a data URL and download the original bytes.' },
    note: { ar: 'أدخل نوع MIME المناسب للحصول على ملف صحيح.', en: 'Use the correct MIME type for the resulting file.' },
    inputs: [
        textareaInput('base64', 'نص Base64', 'Base64 text', 'SGVsbG8gQWRhd2F0eQ=='),
        textInput('filename', 'اسم الملف', 'File name', 'decoded.bin'),
        textInput('mime', 'نوع MIME', 'MIME type', 'application/octet-stream'),
    ],
    async process(values, language) {
        const blob = new Blob([base64ToBytes(values.base64)], { type: values.mime || 'application/octet-stream' });
        return downloadable(blob, safeName(values.filename || 'decoded.bin'), language, 'تم فك الترميز', 'Base64 decoded');
    },
});

const textFileMerger = tool({
    id: 'text-file-merger',
    icon: 'TXT+',
    title: { ar: 'دمج ملفات نصية', en: 'Text File Merger' },
    description: { ar: 'ادمج عدة ملفات نصية بالترتيب في ملف واحد قابل للتنزيل.', en: 'Merge multiple text files in order into one downloadable file.' },
    note: { ar: 'يضاف فاصل واضح باسم كل ملف.', en: 'A clear separator with each filename is included.' },
    inputs: [fileInput('files', 'اختر الملفات النصية', 'Choose text files', 'text/*,.txt,.csv,.md,.log', true)],
    async process(values, language) {
        if (!values.files.length) throw new Error('Choose at least one text file.');
        const sections = await Promise.all(values.files.map(async (file) => (
            `===== ${file.name} =====\n${await file.text()}`
        )));
        return textResult(sections.join('\n\n'), 'adawaty-merged-text.txt', language, 'تم دمج الملفات', 'Text files merged');
    },
});

const textFileLineSorter = tool({
    id: 'text-file-line-sorter',
    icon: 'A↓',
    title: { ar: 'ترتيب أسطر ملف نصي', en: 'Text File Line Sorter' },
    description: { ar: 'رتّب أسطر ملف نصي أبجديًا مع دعم العربية والإنجليزية.', en: 'Sort text-file lines alphabetically with Arabic and English support.' },
    note: { ar: 'تُحفظ الأسطر الفارغة في نهاية الملف.', en: 'Empty lines are preserved at the end.' },
    inputs: [fileInput('file', 'اختر ملفًا نصيًا', 'Choose a text file', 'text/*,.txt,.csv,.md,.log')],
    async process(values, language) {
        const lines = (await values.file.text()).replace(/\r\n?/g, '\n').split('\n');
        lines.sort((first, second) => first.localeCompare(second, language === 'ar' ? 'ar' : 'en'));
        return textResult(lines.join('\n'), `sorted-${safeName(values.file.name)}`, language, 'تم ترتيب الأسطر', 'Lines sorted');
    },
});

const textFileDuplicateLineRemover = tool({
    id: 'text-file-duplicate-line-remover',
    icon: '1×',
    title: { ar: 'حذف الأسطر المكررة من ملف', en: 'Text File Duplicate Line Remover' },
    description: { ar: 'نظّف ملفًا نصيًا كبيرًا بحذف الأسطر المتطابقة المكررة.', en: 'Clean a large text file by removing identical duplicate lines.' },
    note: { ar: 'يُحفظ ترتيب أول ظهور لكل سطر.', en: 'The first occurrence order is preserved.' },
    inputs: [fileInput('file', 'اختر ملفًا نصيًا', 'Choose a text file', 'text/*,.txt,.csv,.md,.log')],
    async process(values, language) {
        const lines = (await values.file.text()).replace(/\r\n?/g, '\n').split('\n');
        return textResult([...new Set(lines)].join('\n'), `unique-${safeName(values.file.name)}`, language, 'تم حذف التكرارات', 'Duplicates removed');
    },
});

const gzipFileCompressor = tool({
    id: 'gzip-file-compressor',
    icon: 'GZ',
    title: { ar: 'ضغط ملف بصيغة GZIP', en: 'GZIP File Compressor' },
    description: { ar: 'اضغط أي ملف إلى GZIP مباشرة داخل المتصفح.', en: 'Compress any file to GZIP directly in your browser.' },
    note: { ar: 'يتطلب متصفحًا حديثًا يدعم CompressionStream.', en: 'Requires a modern browser with CompressionStream support.' },
    inputs: [fileInput('file', 'اختر الملف', 'Choose file')],
    action: { ar: 'اضغط الملف', en: 'Compress file' },
    async process(values, language) {
        if (!globalThis.CompressionStream) throw new Error('GZIP compression is not supported by this browser.');
        const compressed = values.file.stream().pipeThrough(new CompressionStream('gzip'));
        const blob = await new Response(compressed).blob();
        return downloadable(blob, `${safeName(values.file.name)}.gz`, language, 'اكتمل الضغط', 'Compression complete');
    },
});

const gzipFileDecompressor = tool({
    id: 'gzip-file-decompressor',
    icon: 'UNZ',
    title: { ar: 'فك ضغط ملف GZIP', en: 'GZIP File Decompressor' },
    description: { ar: 'فك ملف GZ أو GZIP وتنزيل محتواه الأصلي محليًا.', en: 'Decompress a GZ or GZIP file and download its original content locally.' },
    note: { ar: 'يتطلب متصفحًا حديثًا يدعم DecompressionStream.', en: 'Requires a modern browser with DecompressionStream support.' },
    inputs: [
        fileInput('file', 'اختر ملف GZIP', 'Choose a GZIP file', 'application/gzip,.gz,.gzip'),
        textInput('filename', 'اسم الملف الناتج', 'Output file name', 'decompressed-file'),
    ],
    action: { ar: 'فك الضغط', en: 'Decompress file' },
    async process(values, language) {
        if (!globalThis.DecompressionStream) throw new Error('GZIP decompression is not supported by this browser.');
        const decompressed = values.file.stream().pipeThrough(new DecompressionStream('gzip'));
        const blob = await new Response(decompressed).blob();
        return downloadable(blob, safeName(values.filename || values.file.name.replace(/\.g(?:zip|z)$/iu, '')), language, 'اكتمل فك الضغط', 'Decompression complete');
    },
});

const binaryFileToHex = tool({
    id: 'binary-file-to-hex-converter',
    icon: 'HEX',
    title: { ar: 'تحويل ملف ثنائي إلى Hex', en: 'Binary File to Hex Converter' },
    description: { ar: 'حوّل بايتات أي ملف إلى تمثيل سداسي عشري قابل للبحث والنسخ.', en: 'Convert any file bytes into searchable, copyable hexadecimal text.' },
    note: { ar: 'قد يكون الناتج كبيرًا للملفات الضخمة.', en: 'Large files can produce very large output.' },
    inputs: [fileInput('file', 'اختر الملف', 'Choose file')],
    async process(values, language) {
        const bytes = new Uint8Array(await values.file.arrayBuffer());
        const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join(' ');
        return textResult(hex, `${safeName(values.file.name)}.hex.txt`, language, 'تم تحويل الملف', 'File converted to hex');
    },
});

const fileUtilityToolDefinitions = Object.freeze(Object.fromEntries([
    fileSha256Checksum,
    fileSha1Checksum,
    fileToBase64,
    base64ToFile,
    textFileMerger,
    textFileLineSorter,
    textFileDuplicateLineRemover,
    gzipFileCompressor,
    gzipFileDecompressor,
    binaryFileToHex,
].map((definition) => [definition.id, definition])));

export {
    base64ToBytes,
    bytesToBase64,
    fileUtilityToolDefinitions,
};

// END OF FILE
