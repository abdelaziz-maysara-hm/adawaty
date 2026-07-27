import {
    parseDelimited,
    stringifyDelimited,
} from './list-data-tools.js';

const JSZIP_URL = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
let zipPromise;

function loadZip() {
    zipPromise ??= import(JSZIP_URL).then((module) => module.default);
    return zipPromise;
}

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

function textInput(id, ar, en, placeholder = '') {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function numberInput(id, ar, en, placeholder, min = 1, max = 1000000) {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 1,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map(([value, arLabel, enLabel]) => Object.freeze({
            value,
            label: Object.freeze({ ar: arLabel, en: enLabel }),
        }))),
    });
}

function safeName(value) {
    return String(value || 'file').replace(/[^\p{L}\p{N}_.-]+/gu, '_');
}

function output(blob, filename, language, arLabel, enLabel) {
    return {
        value: localized(language, `${blob.size} بايت`, `${blob.size} bytes`),
        label: localized(language, arLabel, enLabel),
        details: localized(language, 'الملف جاهز للتنزيل.', 'The file is ready to download.'),
        download: { blob, filename },
    };
}

function textOutput(text, filename, language, arLabel, enLabel, type = 'text/plain;charset=utf-8') {
    return output(new Blob([text], { type }), filename, language, arLabel, enLabel);
}

function tool({ id, icon, title, description, note, inputs, process, action }) {
    return Object.freeze({
        id,
        category: 'developer',
        icon,
        action: Object.freeze(action ?? { ar: 'معالجة الملفات', en: 'Process files' }),
        title: Object.freeze(title),
        description: Object.freeze(description),
        note: Object.freeze(note),
        inputs: Object.freeze(inputs),
        process,
    });
}

async function sha256(file) {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const zipFilesCreator = tool({
    id: 'zip-files-creator',
    icon: 'ZIP',
    title: { ar: 'إنشاء ملف ZIP', en: 'ZIP File Creator' },
    description: { ar: 'اجمع عدة ملفات في أرشيف ZIP واحد داخل المتصفح.', en: 'Bundle multiple files into one ZIP archive in your browser.' },
    note: { ar: 'لا تغادر الملفات جهازك أثناء الضغط.', en: 'Files never leave your device during compression.' },
    inputs: [
        fileInput('files', 'اختر الملفات', 'Choose files', '', true),
        textInput('filename', 'اسم الأرشيف', 'Archive name', 'adawaty-files.zip'),
    ],
    async process(values, language) {
        if (!values.files.length) throw new Error('Choose at least one file.');
        const JSZip = await loadZip();
        const zip = new JSZip();
        values.files.forEach((file) => zip.file(file.name, file));
        const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } });
        return output(blob, safeName(values.filename || 'adawaty-files.zip'), language, 'تم إنشاء ZIP', 'ZIP archive created');
    },
});

const zipEntryList = tool({
    id: 'zip-entry-list',
    icon: 'ZIP?',
    title: { ar: 'عرض محتويات ZIP', en: 'ZIP Entry List' },
    description: { ar: 'استخرج قائمة بأسماء الملفات والمجلدات داخل أرشيف ZIP.', en: 'Export a list of files and folders contained in a ZIP archive.' },
    note: { ar: 'لا يتم استخراج الملفات أثناء الفحص.', en: 'Files are not extracted during inspection.' },
    inputs: [fileInput('zip', 'اختر ملف ZIP', 'Choose ZIP file', 'application/zip,.zip')],
    async process(values, language) {
        const JSZip = await loadZip();
        const zip = await JSZip.loadAsync(values.zip);
        const lines = Object.values(zip.files).map((entry) => `${entry.dir ? 'DIR ' : 'FILE'}\t${entry.name}`);
        return textOutput(lines.join('\n'), `${safeName(values.zip.name)}-contents.txt`, language, 'تم فحص الأرشيف', 'Archive inspected');
    },
});

const zipSingleFileExtractor = tool({
    id: 'zip-single-file-extractor',
    icon: 'ZIP→1',
    title: { ar: 'استخراج ملف واحد من ZIP', en: 'Extract One File from ZIP' },
    description: { ar: 'استخرج ملفًا محددًا من الأرشيف باستخدام مساره الداخلي.', en: 'Extract a selected archive entry by its internal path.' },
    note: { ar: 'استخدم أداة عرض المحتويات لمعرفة المسار الصحيح.', en: 'Use the entry-list tool to find the exact path.' },
    inputs: [
        fileInput('zip', 'اختر ملف ZIP', 'Choose ZIP file', 'application/zip,.zip'),
        textInput('path', 'مسار الملف داخل الأرشيف', 'File path inside ZIP', 'folder/file.txt'),
    ],
    async process(values, language) {
        const JSZip = await loadZip();
        const zip = await JSZip.loadAsync(values.zip);
        const entry = zip.file(values.path);
        if (!entry) throw new Error('The requested ZIP entry was not found.');
        const blob = await entry.async('blob');
        return output(blob, safeName(values.path.split('/').pop()), language, 'تم استخراج الملف', 'File extracted');
    },
});

const fileSplitterToZip = tool({
    id: 'file-splitter-to-zip',
    icon: '✂ZIP',
    title: { ar: 'تقسيم ملف إلى أجزاء', en: 'File Splitter to ZIP' },
    description: { ar: 'قسّم ملفًا كبيرًا إلى أجزاء بالحجم المطلوب واجمعها في ZIP.', en: 'Split a large file into chosen-size parts bundled in a ZIP.' },
    note: { ar: 'الحجم المحدد بالميجابايت لكل جزء.', en: 'The selected size is applied to each part in megabytes.' },
    inputs: [
        fileInput('file', 'اختر الملف', 'Choose file'),
        numberInput('sizeMb', 'حجم الجزء', 'Part size', 5, 1, 1024),
    ],
    async process(values, language) {
        const JSZip = await loadZip();
        const zip = new JSZip();
        const chunkSize = Math.floor(Number(values.sizeMb) * 1024 * 1024);
        const partCount = Math.ceil(values.file.size / chunkSize);
        for (let index = 0; index < partCount; index += 1) {
            const start = index * chunkSize;
            const part = values.file.slice(start, Math.min(start + chunkSize, values.file.size));
            zip.file(`${values.file.name}.part${String(index + 1).padStart(4, '0')}`, part);
        }
        zip.file('adawaty-parts.json', JSON.stringify({ name: values.file.name, size: values.file.size, parts: partCount }, null, 2));
        const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        return output(blob, `${safeName(values.file.name)}-parts.zip`, language, 'تم تقسيم الملف', 'File split complete');
    },
});

const filePartsMerger = tool({
    id: 'file-parts-merger',
    icon: 'PART+',
    title: { ar: 'دمج أجزاء ملف', en: 'File Parts Merger' },
    description: { ar: 'ادمج أجزاء ملف مرتبة بالاسم لاستعادة الملف الأصلي.', en: 'Merge file parts sorted by name to restore the original file.' },
    note: { ar: 'اختر الأجزاء فقط وبأسمائها الأصلية.', en: 'Choose only the parts with their original names.' },
    inputs: [
        fileInput('parts', 'اختر أجزاء الملف', 'Choose file parts', '', true),
        textInput('filename', 'اسم الملف الناتج', 'Output file name', 'restored-file.bin'),
    ],
    async process(values, language) {
        if (!values.parts.length) throw new Error('Choose at least one file part.');
        const ordered = [...values.parts].sort((first, second) => first.name.localeCompare(second.name, undefined, { numeric: true }));
        const blob = new Blob(ordered, { type: 'application/octet-stream' });
        return output(blob, safeName(values.filename || 'restored-file.bin'), language, 'تم دمج الأجزاء', 'File parts merged');
    },
});

const multiFileSha256Manifest = tool({
    id: 'multi-file-sha256-manifest',
    icon: 'Σ256',
    title: { ar: 'إنشاء قائمة SHA-256 لملفات متعددة', en: 'Multi-File SHA-256 Manifest' },
    description: { ar: 'أنشئ manifest ببصمة SHA-256 وحجم كل ملف للتحقق الجماعي.', en: 'Create a manifest with SHA-256 and size for every selected file.' },
    note: { ar: 'مناسب لنشر الملفات والتحقق من التنزيلات.', en: 'Useful for releases and download verification.' },
    inputs: [fileInput('files', 'اختر الملفات', 'Choose files', '', true)],
    async process(values, language) {
        if (!values.files.length) throw new Error('Choose at least one file.');
        const entries = [];
        for (const file of values.files) {
            entries.push({ name: file.name, size: file.size, type: file.type || null, sha256: await sha256(file) });
        }
        return textOutput(JSON.stringify({ algorithm: 'SHA-256', files: entries }, null, 2), 'adawaty-sha256-manifest.json', language, 'تم إنشاء القائمة', 'Checksum manifest created', 'application/json;charset=utf-8');
    },
});

const fileMetadataExporter = tool({
    id: 'file-metadata-exporter',
    icon: 'META',
    title: { ar: 'تصدير بيانات الملفات', en: 'File Metadata Exporter' },
    description: { ar: 'صدّر أسماء الملفات وأحجامها وأنواعها وتواريخ تعديلها كـJSON.', en: 'Export filenames, sizes, types and modification dates as JSON.' },
    note: { ar: 'تُقرأ البيانات المتاحة من المتصفح فقط.', en: 'Only browser-exposed metadata is included.' },
    inputs: [fileInput('files', 'اختر الملفات', 'Choose files', '', true)],
    async process(values, language) {
        const metadata = values.files.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type || null,
            lastModified: new Date(file.lastModified).toISOString(),
        }));
        return textOutput(JSON.stringify(metadata, null, 2), 'adawaty-file-metadata.json', language, 'تم تصدير البيانات', 'Metadata exported', 'application/json;charset=utf-8');
    },
});

const textFileEncodingNormalizer = tool({
    id: 'text-file-encoding-normalizer',
    icon: 'UTF-8',
    title: { ar: 'تحويل ترميز ملف نصي إلى UTF-8', en: 'Text File Encoding Normalizer' },
    description: { ar: 'اقرأ ملفًا بترميز شائع وأعد تنزيله بصيغة UTF-8.', en: 'Read a commonly encoded text file and download it as UTF-8.' },
    note: { ar: 'يدعم UTF-8 وUTF-16 وWindows-1252.', en: 'Supports UTF-8, UTF-16 and Windows-1252.' },
    inputs: [
        fileInput('file', 'اختر ملفًا نصيًا', 'Choose text file', 'text/*,.txt,.csv,.md,.log'),
        selectInput('encoding', 'الترميز الحالي', 'Current encoding', [
            ['utf-8', 'UTF-8', 'UTF-8'],
            ['utf-16le', 'UTF-16 LE', 'UTF-16 LE'],
            ['utf-16be', 'UTF-16 BE', 'UTF-16 BE'],
            ['windows-1252', 'Windows-1252', 'Windows-1252'],
        ]),
    ],
    async process(values, language) {
        const text = new TextDecoder(values.encoding || 'utf-8').decode(await values.file.arrayBuffer());
        return textOutput(text, `utf8-${safeName(values.file.name)}`, language, 'تم توحيد الترميز', 'Encoding normalized');
    },
});

const csvFileToJson = tool({
    id: 'csv-file-to-json-converter',
    icon: 'CSV→{}',
    title: { ar: 'تحويل ملف CSV إلى JSON', en: 'CSV File to JSON Converter' },
    description: { ar: 'ارفع ملف CSV وحوّل صفوفه مباشرة إلى مصفوفة JSON.', en: 'Load a CSV file and convert its rows directly into a JSON array.' },
    note: { ar: 'يدعم الفواصل والحقول المقتبسة.', en: 'Delimited and quoted fields are supported.' },
    inputs: [
        fileInput('file', 'اختر ملف CSV', 'Choose CSV file', 'text/csv,.csv,.tsv'),
        selectInput('delimiter', 'الفاصل', 'Delimiter', [
            [',', 'فاصلة (,)', 'Comma (,)'],
            ['\t', 'علامة تبويب', 'Tab'],
            [';', 'فاصلة منقوطة (;)', 'Semicolon (;)'],
        ]),
    ],
    async process(values, language) {
        const rows = parseDelimited(await values.file.text(), values.delimiter || ',');
        const headers = rows[0] ?? [];
        const data = rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ''])));
        return textOutput(JSON.stringify(data, null, 2), `${safeName(values.file.name)}.json`, language, 'اكتمل التحويل', 'CSV converted', 'application/json;charset=utf-8');
    },
});

const jsonFileToCsv = tool({
    id: 'json-file-to-csv-converter',
    icon: '{}→CSV',
    title: { ar: 'تحويل ملف JSON إلى CSV', en: 'JSON File to CSV Converter' },
    description: { ar: 'حوّل مصفوفة كائنات JSON من ملف إلى جدول CSV.', en: 'Convert a JSON object array from a file into a CSV table.' },
    note: { ar: 'تُجمع جميع مفاتيح الكائنات كأعمدة.', en: 'All object keys are combined as columns.' },
    inputs: [fileInput('file', 'اختر ملف JSON', 'Choose JSON file', 'application/json,.json')],
    async process(values, language) {
        const data = JSON.parse(await values.file.text());
        if (!Array.isArray(data)) throw new Error('JSON file must contain an array.');
        const headers = [...new Set(data.flatMap((item) => Object.keys(item ?? {})))];
        const rows = [headers, ...data.map((item) => headers.map((header) => {
            const value = item?.[header];
            return value && typeof value === 'object' ? JSON.stringify(value) : value ?? '';
        }))];
        return textOutput(stringifyDelimited(rows, ','), `${safeName(values.file.name)}.csv`, language, 'اكتمل التحويل', 'JSON converted', 'text/csv;charset=utf-8');
    },
});

const archiveFileToolDefinitions = Object.freeze(Object.fromEntries([
    zipFilesCreator,
    zipEntryList,
    zipSingleFileExtractor,
    fileSplitterToZip,
    filePartsMerger,
    multiFileSha256Manifest,
    fileMetadataExporter,
    textFileEncodingNormalizer,
    csvFileToJson,
    jsonFileToCsv,
].map((definition) => [definition.id, definition])));

export { archiveFileToolDefinitions };

// END OF FILE
