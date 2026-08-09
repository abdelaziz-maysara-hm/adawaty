import {
    parseDelimited,
    stringifyDelimited,
} from './list-data-tools.js';

const SHEETJS_URL = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs';

let sheetJsPromise;

function loadSheetJs() {
    sheetJsPromise ??= import(SHEETJS_URL).catch((error) => {
        sheetJsPromise = undefined;
        throw new Error(`Unable to load the spreadsheet engine: ${error.message}`);
    });
    return sheetJsPromise;
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function textareaInput(id, ar, en, placeholder, rows = 12) {
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

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze({
            value: option.value,
            label: Object.freeze(option.label),
        }))),
    });
}

function fileInput(id, ar, en, accept) {
    return Object.freeze({
        id,
        type: 'file',
        accept,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

const delimiterOptions = [
    { value: 'comma', label: { ar: 'فاصلة (,)', en: 'Comma (,)' } },
    { value: 'tab', label: { ar: 'علامة تبويب', en: 'Tab' } },
    { value: 'semicolon', label: { ar: 'فاصلة منقوطة (;)', en: 'Semicolon (;)' } },
    { value: 'pipe', label: { ar: 'شرطة عمودية (|)', en: 'Pipe (|)' } },
];

function delimiterInput() {
    return selectInput('delimiter', 'فاصل البيانات', 'Data delimiter', delimiterOptions);
}

function resolveDelimiter(value) {
    return {
        comma: ',',
        tab: '\t',
        semicolon: ';',
        pipe: '|',
    }[value] ?? ',';
}

function result(text, filename, language, arLabel, enLabel, type = 'text/plain;charset=utf-8') {
    const blob = new Blob([text], { type });
    return {
        value: localized(language, `${blob.size} بايت`, `${blob.size} bytes`),
        label: localized(language, arLabel, enLabel),
        details: localized(language, 'النتيجة جاهزة للتنزيل.', 'The result is ready to download.'),
        download: { blob, filename },
    };
}

function downloadable(blob, filename, language, arLabel, enLabel, details) {
    return {
        value: localized(language, `${(blob.size / 1024).toFixed(1)} كيلوبايت`, `${(blob.size / 1024).toFixed(1)} KB`),
        label: localized(language, arLabel, enLabel),
        details: details ?? localized(language, 'تمت المعالجة محليًا داخل المتصفح.', 'Processed locally in your browser.'),
        download: { blob, filename },
    };
}

function tool({ id, icon, title, description, note, inputs, transform, filename, type }) {
    return Object.freeze({
        id,
        category: 'developer',
        icon,
        action: Object.freeze({ ar: 'تحويل البيانات', en: 'Convert data' }),
        title: Object.freeze(title),
        description: Object.freeze(description),
        note: Object.freeze(note),
        inputs: Object.freeze(inputs),
        async process(values, language) {
            return result(
                transform(values),
                filename,
                language,
                'اكتمل التحويل',
                'Conversion complete',
                type,
            );
        },
    });
}

function csvRows(values) {
    return parseDelimited(String(values.csv), resolveDelimiter(values.delimiter));
}

function markdownCell(value) {
    return String(value).replaceAll('|', '\\|').replace(/\r?\n/g, '<br>');
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function sqlIdentifier(value) {
    const safe = String(value).trim().replace(/[^\p{L}\p{N}_]+/gu, '_');
    return safe || 'column';
}

function sqlValue(value) {
    const text = String(value);
    if (text === '') return 'NULL';
    if (/^-?(?:\d+|\d*\.\d+)$/u.test(text)) return text;
    return `'${text.replaceAll("'", "''")}'`;
}

function parseJson(value) {
    return JSON.parse(String(value));
}

function stableKey(value) {
    if (!value || typeof value !== 'object') return `${typeof value}:${String(value)}`;
    if (Array.isArray(value)) return `[${value.map(stableKey).join(',')}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableKey(value[key])}`).join(',')}}`;
}

function resolvePath(source, path) {
    return String(path)
        .replace(/\[(\d+)\]/g, '.$1')
        .split('.')
        .filter(Boolean)
        .reduce((value, key) => value?.[key], source);
}

function xmlName(value) {
    const name = String(value).replace(/[^\p{L}\p{N}_.-]+/gu, '_');
    return /^[\p{L}_]/u.test(name) ? name : `item_${name}`;
}

function jsonToXml(value, name = 'root', depth = 0) {
    const indent = '  '.repeat(depth);
    const tag = xmlName(name);
    if (Array.isArray(value)) {
        const children = value.map((item) => jsonToXml(item, 'item', depth + 1)).join('\n');
        return `${indent}<${tag}>${children ? `\n${children}\n${indent}` : ''}</${tag}>`;
    }
    if (value && typeof value === 'object') {
        const children = Object.entries(value).map(([key, item]) => jsonToXml(item, key, depth + 1)).join('\n');
        return `${indent}<${tag}>${children ? `\n${children}\n${indent}` : ''}</${tag}>`;
    }
    const content = value === null ? '' : escapeHtml(value);
    return `${indent}<${tag}>${content}</${tag}>`;
}

function safeBaseName(name) {
    return String(name || 'data').replace(/\.[^.]+$/, '').replace(/[^\p{L}\p{N}_.-]+/gu, '_') || 'data';
}

const csvToMarkdownTable = tool({
    id: 'csv-to-markdown-table',
    icon: 'MD',
    title: { ar: 'تحويل CSV إلى جدول Markdown', en: 'CSV to Markdown Table' },
    description: { ar: 'حوّل بيانات CSV إلى جدول Markdown جاهز للوثائق وGitHub.', en: 'Convert CSV data into a Markdown table ready for docs and GitHub.' },
    note: { ar: 'يُستخدم الصف الأول كرؤوس للأعمدة.', en: 'The first row is used as table headers.' },
    inputs: [
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,city\nAhmed,Cairo\nSara,Alexandria'),
        delimiterInput(),
    ],
    transform(values) {
        const rows = csvRows(values);
        const headers = rows[0] ?? [];
        const separator = headers.map(() => '---');
        return [headers, separator, ...rows.slice(1)]
            .map((row) => `| ${row.map(markdownCell).join(' | ')} |`)
            .join('\n');
    },
    filename: 'adawaty-table.md',
});

const csvToHtmlTable = tool({
    id: 'csv-to-html-table',
    icon: 'HTML',
    title: { ar: 'تحويل CSV إلى جدول HTML', en: 'CSV to HTML Table' },
    description: { ar: 'أنشئ جدول HTML دلاليًا وآمنًا من بيانات CSV.', en: 'Create a semantic, safely escaped HTML table from CSV data.' },
    note: { ar: 'تُشفّر الرموز الخاصة لمنع كسر HTML.', en: 'Special characters are escaped to keep the HTML valid.' },
    inputs: [
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,city\nAhmed,Cairo\nSara,Alexandria'),
        delimiterInput(),
    ],
    transform(values) {
        const rows = csvRows(values);
        const header = (rows[0] ?? []).map((cell) => `      <th>${escapeHtml(cell)}</th>`).join('\n');
        const body = rows.slice(1).map((row) => (
            `    <tr>\n${row.map((cell) => `      <td>${escapeHtml(cell)}</td>`).join('\n')}\n    </tr>`
        )).join('\n');
        return `<table>\n  <thead>\n    <tr>\n${header}\n    </tr>\n  </thead>\n  <tbody>\n${body}\n  </tbody>\n</table>\n`;
    },
    filename: 'adawaty-table.html',
    type: 'text/html;charset=utf-8',
});

const csvToSqlInsert = tool({
    id: 'csv-to-sql-insert',
    icon: 'SQL',
    title: { ar: 'تحويل CSV إلى أوامر SQL INSERT', en: 'CSV to SQL INSERT' },
    description: { ar: 'حوّل كل صف CSV إلى أمر INSERT جاهز للاستيراد.', en: 'Turn every CSV row into an import-ready SQL INSERT statement.' },
    note: { ar: 'تُعالج علامات الاقتباس وتتحول الخلايا الفارغة إلى NULL.', en: 'Quotes are escaped and empty cells become NULL.' },
    inputs: [
        textareaInput('csv', 'بيانات CSV', 'CSV data', "name,city\nAhmed,Cairo\nSara,Alexandria"),
        delimiterInput(),
        textInput('table', 'اسم الجدول', 'Table name', 'people'),
    ],
    transform(values) {
        const rows = csvRows(values);
        const table = sqlIdentifier(values.table);
        const columns = (rows[0] ?? []).map(sqlIdentifier).map((name) => `\`${name}\``).join(', ');
        return rows.slice(1)
            .map((row) => `INSERT INTO \`${table}\` (${columns}) VALUES (${row.map(sqlValue).join(', ')});`)
            .join('\n');
    },
    filename: 'adawaty-import.sql',
    type: 'application/sql;charset=utf-8',
});

const csvToJsonLines = tool({
    id: 'csv-to-json-lines',
    icon: 'JSONL',
    title: { ar: 'تحويل CSV إلى JSON Lines', en: 'CSV to JSON Lines' },
    description: { ar: 'حوّل صفوف CSV إلى كائن JSON مستقل في كل سطر.', en: 'Convert CSV rows into one JSON object per line.' },
    note: { ar: 'مناسب للبيانات الضخمة وأنظمة السجلات.', en: 'Useful for large datasets and logging pipelines.' },
    inputs: [
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,city\nAhmed,Cairo\nSara,Alexandria'),
        delimiterInput(),
    ],
    transform(values) {
        const rows = csvRows(values);
        const headers = rows[0] ?? [];
        return rows.slice(1).map((row) => JSON.stringify(Object.fromEntries(
            headers.map((header, index) => [header, row[index] ?? '']),
        ))).join('\n');
    },
    filename: 'adawaty-data.jsonl',
    type: 'application/x-ndjson;charset=utf-8',
});

const jsonArrayDeduplicator = tool({
    id: 'json-array-deduplicator',
    icon: '1×',
    title: { ar: 'حذف عناصر JSON المكررة', en: 'JSON Array Deduplicator' },
    description: { ar: 'احذف القيم والكائنات المتطابقة من مصفوفة JSON.', en: 'Remove duplicate values and equivalent objects from a JSON array.' },
    note: { ar: 'لا يؤثر اختلاف ترتيب مفاتيح الكائن على المقارنة.', en: 'Object key order does not affect comparison.' },
    inputs: [textareaInput('json', 'مصفوفة JSON', 'JSON array', '[{"id":1},{"id":1},{"id":2}]')],
    transform(values) {
        const source = parseJson(values.json);
        if (!Array.isArray(source)) throw new Error('JSON value must be an array.');
        const seen = new Set();
        return JSON.stringify(source.filter((item) => {
            const key = stableKey(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        }), null, 2);
    },
    filename: 'adawaty-unique.json',
    type: 'application/json;charset=utf-8',
});

const jsonPropertyRemover = tool({
    id: 'json-property-remover',
    icon: '−{}',
    title: { ar: 'حذف خاصية من كائنات JSON', en: 'JSON Property Remover' },
    description: { ar: 'احذف خاصية محددة من كائن JSON أو من جميع كائنات المصفوفة.', en: 'Remove a named property from an object or every object in an array.' },
    note: { ar: 'لا يتم تعديل البيانات الأصلية.', en: 'The source data is not mutated.' },
    inputs: [
        textareaInput('json', 'بيانات JSON', 'JSON data', '[{"name":"Ahmed","password":"secret"}]'),
        textInput('property', 'اسم الخاصية', 'Property name', 'password'),
    ],
    transform(values) {
        const source = parseJson(values.json);
        const remove = (item) => {
            if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
            return Object.fromEntries(Object.entries(item).filter(([key]) => key !== values.property));
        };
        return JSON.stringify(Array.isArray(source) ? source.map(remove) : remove(source), null, 2);
    },
    filename: 'adawaty-property-removed.json',
    type: 'application/json;charset=utf-8',
});

const jsonArraySorter = tool({
    id: 'json-array-sorter',
    icon: 'A↓',
    title: { ar: 'ترتيب مصفوفة JSON حسب خاصية', en: 'JSON Array Sorter' },
    description: { ar: 'رتّب مصفوفة كائنات JSON حسب خاصية نصية أو رقمية.', en: 'Sort a JSON object array by a text or numeric property.' },
    note: { ar: 'تُحفظ بنية الكائنات دون تغيير.', en: 'Object structures remain unchanged.' },
    inputs: [
        textareaInput('json', 'مصفوفة JSON', 'JSON array', '[{"name":"Sara","score":92},{"name":"Ahmed","score":85}]'),
        textInput('property', 'خاصية الترتيب', 'Sort property', 'score'),
        selectInput('direction', 'اتجاه الترتيب', 'Sort direction', [
            { value: 'ascending', label: { ar: 'تصاعدي', en: 'Ascending' } },
            { value: 'descending', label: { ar: 'تنازلي', en: 'Descending' } },
        ]),
    ],
    transform(values) {
        const source = parseJson(values.json);
        if (!Array.isArray(source)) throw new Error('JSON value must be an array.');
        const direction = values.direction === 'descending' ? -1 : 1;
        return JSON.stringify([...source].sort((first, second) => {
            const left = first?.[values.property] ?? '';
            const right = second?.[values.property] ?? '';
            return direction * (
                Number.isFinite(Number(left)) && Number.isFinite(Number(right))
                    ? Number(left) - Number(right)
                    : String(left).localeCompare(String(right))
            );
        }), null, 2);
    },
    filename: 'adawaty-sorted.json',
    type: 'application/json;charset=utf-8',
});

const jsonPathExtractor = tool({
    id: 'json-path-extractor',
    icon: '$.',
    title: { ar: 'استخراج قيمة من مسار JSON', en: 'JSON Path Extractor' },
    description: { ar: 'استخرج قيمة متداخلة باستخدام مسار بسيط مثل user.address.city.', en: 'Extract a nested value with a simple path such as user.address.city.' },
    note: { ar: 'يدعم فهارس المصفوفات مثل users[0].name.', en: 'Array indexes such as users[0].name are supported.' },
    inputs: [
        textareaInput('json', 'بيانات JSON', 'JSON data', '{"user":{"name":"Ahmed","city":"Cairo"}}'),
        textInput('path', 'مسار القيمة', 'Value path', 'user.city'),
    ],
    transform(values) {
        const value = resolvePath(parseJson(values.json), values.path);
        if (value === undefined) throw new Error('The requested JSON path does not exist.');
        return JSON.stringify(value, null, 2);
    },
    filename: 'adawaty-extracted-value.json',
    type: 'application/json;charset=utf-8',
});

const jsonToXmlConverter = tool({
    id: 'json-to-xml-converter',
    icon: 'XML',
    title: { ar: 'تحويل JSON إلى XML', en: 'JSON to XML Converter' },
    description: { ar: 'حوّل بيانات JSON المتداخلة إلى مستند XML منسق.', en: 'Convert nested JSON data into a formatted XML document.' },
    note: { ar: 'تتحول عناصر المصفوفة إلى وسوم item.', en: 'Array entries are emitted as item elements.' },
    inputs: [
        textareaInput('json', 'بيانات JSON', 'JSON data', '{"user":{"name":"Ahmed","city":"Cairo"}}'),
        textInput('root', 'اسم الجذر', 'Root element', 'root'),
    ],
    transform: (values) => `<?xml version="1.0" encoding="UTF-8"?>\n${jsonToXml(parseJson(values.json), values.root || 'root')}\n`,
    filename: 'adawaty-data.xml',
    type: 'application/xml;charset=utf-8',
});

const ndjsonToJsonConverter = tool({
    id: 'ndjson-to-json-converter',
    icon: '[]',
    title: { ar: 'تحويل JSON Lines إلى JSON', en: 'JSON Lines to JSON Converter' },
    description: { ar: 'اجمع كائنات NDJSON أو JSONL في مصفوفة JSON واحدة.', en: 'Combine NDJSON or JSONL records into one JSON array.' },
    note: { ar: 'يجب أن يحتوي كل سطر غير فارغ على JSON صحيح.', en: 'Every non-empty line must contain valid JSON.' },
    inputs: [textareaInput('ndjson', 'بيانات JSON Lines', 'JSON Lines data', '{"id":1,"name":"Ahmed"}\n{"id":2,"name":"Sara"}')],
    transform(values) {
        const records = String(values.ndjson)
            .replace(/\r\n?/g, '\n')
            .split('\n')
            .filter((line) => line.trim())
            .map((line) => JSON.parse(line));
        return JSON.stringify(records, null, 2);
    },
    filename: 'adawaty-data.json',
    type: 'application/json;charset=utf-8',
});

const csvToExcelConverter = Object.freeze({
    id: 'csv-to-excel-converter',
    category: 'developer',
    icon: 'XLSX',
    action: Object.freeze({ ar: 'حوّل إلى Excel', en: 'Convert to Excel' }),
    title: Object.freeze({ ar: 'تحويل CSV إلى Excel', en: 'CSV to Excel Converter' }),
    description: Object.freeze({
        ar: 'حوّل ملف CSV إلى ورقة Excel (XLSX) جاهزة للتنزيل داخل المتصفح.',
        en: 'Convert a CSV file into a downloadable Excel (XLSX) workbook in your browser.',
    }),
    note: Object.freeze({
        ar: 'المعالجة محلية بالكامل عبر محرك SheetJS. لا يُرفع الملف إلى أي خادم.',
        en: 'Processing is fully local via the SheetJS engine. The file is never uploaded.',
    }),
    inputs: Object.freeze([
        fileInput('file', 'اختر ملف CSV', 'Choose CSV file', 'text/csv,.csv,text/plain'),
        delimiterInput(),
    ]),
    async process(values, language) {
        if (!(values.file instanceof File)) {
            throw new Error(localized(language, 'اختر ملف CSV صالح.', 'Please choose a valid CSV file.'));
        }
        const XLSX = await loadSheetJs();
        const text = await values.file.text();
        const rows = parseDelimited(text, resolveDelimiter(values.delimiter));
        if (!rows.length) {
            throw new Error(localized(language, 'الملف فارغ أو غير صالح.', 'The file is empty or invalid.'));
        }
        const worksheet = XLSX.utils.aoa_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const output = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([output], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const base = safeBaseName(values.file.name);
        return downloadable(
            blob,
            `adawaty-${base}.xlsx`,
            language,
            'ملف Excel جاهز',
            'Excel file is ready',
            localized(
                language,
                `${rows.length} صف · ${rows[0]?.length ?? 0} عمود · معالجة محلية`,
                `${rows.length} rows · ${rows[0]?.length ?? 0} columns · local processing`,
            ),
        );
    },
});

const excelToCsvConverter = Object.freeze({
    id: 'excel-to-csv-converter',
    category: 'developer',
    icon: 'CSV',
    action: Object.freeze({ ar: 'حوّل إلى CSV', en: 'Convert to CSV' }),
    title: Object.freeze({ ar: 'تحويل Excel إلى CSV', en: 'Excel to CSV Converter' }),
    description: Object.freeze({
        ar: 'حوّل ملف Excel (XLSX أو XLS) إلى CSV نصي جاهز للتنزيل داخل المتصفح.',
        en: 'Convert an Excel file (XLSX or XLS) into a downloadable CSV text file in your browser.',
    }),
    note: Object.freeze({
        ar: 'يُستخدم أول ورقة عمل في المصنف. المعالجة محلية بالكامل.',
        en: 'Uses the first worksheet in the workbook. Processing stays fully local.',
    }),
    inputs: Object.freeze([
        fileInput(
            'file',
            'اختر ملف Excel',
            'Choose Excel file',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,.xlsx,.xls',
        ),
        selectInput('delimiter', 'فاصل الإخراج', 'Output delimiter', delimiterOptions),
    ]),
    async process(values, language) {
        if (!(values.file instanceof File)) {
            throw new Error(localized(language, 'اختر ملف Excel صالح.', 'Please choose a valid Excel file.'));
        }
        const XLSX = await loadSheetJs();
        const buffer = await values.file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
            throw new Error(localized(language, 'المصنف لا يحتوي على أوراق عمل.', 'The workbook has no worksheets.'));
        }
        const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
            header: 1,
            defval: '',
            raw: false,
        });
        const delimiter = resolveDelimiter(values.delimiter);
        const csv = stringifyDelimited(rows, delimiter);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const base = safeBaseName(values.file.name);
        return downloadable(
            blob,
            `adawaty-${base}.csv`,
            language,
            'ملف CSV جاهز',
            'CSV file is ready',
            localized(
                language,
                `الورقة: ${sheetName} · ${rows.length} صف · معالجة محلية`,
                `Sheet: ${sheetName} · ${rows.length} rows · local processing`,
            ),
        );
    },
});

const dataFormatToolDefinitions = Object.freeze(Object.fromEntries([
    csvToMarkdownTable,
    csvToHtmlTable,
    csvToSqlInsert,
    csvToJsonLines,
    jsonArrayDeduplicator,
    jsonPropertyRemover,
    jsonArraySorter,
    jsonPathExtractor,
    jsonToXmlConverter,
    ndjsonToJsonConverter,
    csvToExcelConverter,
    excelToCsvConverter,
].map((definition) => [definition.id, definition])));

export {
    dataFormatToolDefinitions,
    jsonToXml,
    loadSheetJs,
    resolvePath,
};

// END OF FILE
