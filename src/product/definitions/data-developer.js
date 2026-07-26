function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function textInput(id, label, sample, rows = 8) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: sample,
    });
}

function numberInput(id, label, sample, min, max) {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 1,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(sample),
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((item) => Object.freeze({
            value: item.value,
            label: Object.freeze(item.label),
        }))),
    });
}

function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];

        if (quoted) {
            if (character === '"' && text[index + 1] === '"') {
                field += '"';
                index += 1;
            } else if (character === '"') {
                quoted = false;
            } else {
                field += character;
            }
        } else if (character === '"') {
            quoted = true;
        } else if (character === ',') {
            row.push(field);
            field = '';
        } else if (character === '\n') {
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else if (character !== '\r') {
            field += character;
        }
    }

    if (quoted) {
        throw new Error('Unclosed quoted field.');
    }

    row.push(field);
    rows.push(row);
    return rows.filter((item) => item.some((value) => value !== ''));
}

function escapeCsv(value) {
    const text = value === null || value === undefined
        ? ''
        : typeof value === 'object' ? JSON.stringify(value) : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function formatXml(source) {
    const compact = source
        .trim()
        .replace(/>\s+</g, '><')
        .replace(/(>)(<)(\/*)/g, '$1\n$2$3');
    let depth = 0;

    return compact.split('\n').map((line) => {
        const trimmed = line.trim();
        if (/^<\//.test(trimmed)) {
            depth = Math.max(0, depth - 1);
        }
        const rendered = `${'  '.repeat(depth)}${trimmed}`;
        const opensElement = /^<[^!?/][^>]*>$/.test(trimmed)
            && !/\/>$/.test(trimmed)
            && !/<\/[^>]+>$/.test(trimmed);
        if (opensElement) {
            depth += 1;
        }
        return rendered;
    }).join('\n');
}

function randomBytes(length) {
    const bytes = new Uint8Array(length);
    globalThis.crypto.getRandomValues(bytes);
    return bytes;
}

const csvToJson = Object.freeze({
    id: 'csv-to-json-converter',
    category: 'developer',
    icon: 'CSV',
    title: Object.freeze({ ar: 'تحويل CSV إلى JSON', en: 'CSV to JSON Converter' }),
    description: Object.freeze({ ar: 'حوّل بيانات CSV ذات العناوين إلى مصفوفة JSON منظمة داخل المتصفح.', en: 'Convert CSV data with headers into a structured JSON array in your browser.' }),
    note: Object.freeze({ ar: 'يدعم الحقول المحاطة بعلامات اقتباس والفواصل والأسطر داخلها.', en: 'Supports quoted fields containing commas and line breaks.' }),
    inputs: Object.freeze([
        textInput('csv', { ar: 'بيانات CSV', en: 'CSV data' }, 'name,score\nAli,95\nSara,98'),
    ]),
    calculate(values, language) {
        try {
            const rows = parseCsv(values.csv);
            if (rows.length < 2) {
                throw new Error();
            }
            const headers = rows[0].map((header) => header.trim());
            if (headers.some((header) => !header) || new Set(headers).size !== headers.length) {
                throw new Error();
            }
            const records = rows.slice(1).map((row) => Object.fromEntries(
                headers.map((header, index) => [header, row[index] ?? '']),
            ));
            return output(
                JSON.stringify(records, null, 2),
                localized(language, `${records.length} سجل`, `${records.length} records`),
                localized(language, 'تم التحويل محليًا.', 'Converted locally.'),
            );
        } catch {
            throw new Error(localized(language, 'تعذر قراءة CSV. تحقق من العناوين وعلامات الاقتباس.', 'Unable to parse CSV. Check headers and quotes.'));
        }
    },
});

const jsonToCsv = Object.freeze({
    id: 'json-to-csv-converter',
    category: 'developer',
    icon: '⇄',
    title: Object.freeze({ ar: 'تحويل JSON إلى CSV', en: 'JSON to CSV Converter' }),
    description: Object.freeze({ ar: 'حوّل مصفوفة من كائنات JSON إلى جدول CSV صالح للتنزيل والنسخ.', en: 'Convert an array of JSON objects into copy-ready CSV.' }),
    note: Object.freeze({ ar: 'تُجمع أسماء الأعمدة من جميع السجلات دون فقد الحقول.', en: 'Column names are collected from every record without dropping fields.' }),
    inputs: Object.freeze([
        textInput('json', { ar: 'مصفوفة JSON', en: 'JSON array' }, '[{"name":"Ali","score":95},{"name":"Sara","score":98}]'),
    ]),
    calculate(values, language) {
        try {
            const records = JSON.parse(values.json);
            if (!Array.isArray(records) || records.length === 0
                || records.some((record) => !record || Array.isArray(record) || typeof record !== 'object')) {
                throw new Error();
            }
            const headers = [...new Set(records.flatMap((record) => Object.keys(record)))];
            const csv = [
                headers.map(escapeCsv).join(','),
                ...records.map((record) => headers.map((header) => escapeCsv(record[header])).join(',')),
            ].join('\n');
            return output(csv, localized(language, `${records.length} سجل`, `${records.length} records`));
        } catch {
            throw new Error(localized(language, 'أدخل مصفوفة JSON صالحة تحتوي على كائنات.', 'Enter a valid JSON array of objects.'));
        }
    },
});

const jsonMinifier = Object.freeze({
    id: 'json-minifier',
    category: 'developer',
    icon: '{·}',
    title: Object.freeze({ ar: 'ضغط JSON', en: 'JSON Minifier' }),
    description: Object.freeze({ ar: 'احذف المسافات والأسطر غير الضرورية من JSON مع التحقق من صحته.', en: 'Remove unnecessary whitespace from JSON while validating it.' }),
    note: Object.freeze({ ar: 'لا تتغير القيم أو أسماء الخصائص.', en: 'Values and property names remain unchanged.' }),
    inputs: Object.freeze([textInput('json', { ar: 'JSON', en: 'JSON input' }, '{\n  "name": "Adawaty",\n  "active": true\n}')]),
    calculate(values, language) {
        try {
            const minified = JSON.stringify(JSON.parse(values.json));
            const saved = Math.max(0, values.json.length - minified.length);
            return output(minified, localized(language, `تم توفير ${saved} حرف`, `${saved} characters saved`));
        } catch {
            throw new Error(localized(language, 'صيغة JSON غير صالحة.', 'Invalid JSON input.'));
        }
    },
});

const jsonValidator = Object.freeze({
    id: 'json-validator',
    category: 'developer',
    icon: '✓{}',
    title: Object.freeze({ ar: 'مدقق JSON', en: 'JSON Validator' }),
    description: Object.freeze({ ar: 'تحقق من صحة JSON واعرض نوع القيمة الجذرية وعدد عناصرها.', en: 'Validate JSON and inspect its root type and item count.' }),
    note: Object.freeze({ ar: 'يعرض المتصفح موضع الخطأ عندما توفره محرك JavaScript.', en: 'The parser error is shown when JavaScript provides useful details.' }),
    inputs: Object.freeze([textInput('json', { ar: 'JSON للفحص', en: 'JSON to validate' }, '{"tools":161,"valid":true}')]),
    calculate(values, language) {
        try {
            const parsed = JSON.parse(values.json);
            const type = Array.isArray(parsed) ? 'array' : parsed === null ? 'null' : typeof parsed;
            const count = parsed && typeof parsed === 'object' ? Object.keys(parsed).length : 1;
            return output(
                localized(language, 'صالح', 'Valid'),
                localized(language, `النوع: ${type}`, `Root type: ${type}`),
                localized(language, `عدد العناصر: ${count}`, `Items: ${count}`),
            );
        } catch (error) {
            throw new Error(localized(language, 'JSON غير صالح.', `Invalid JSON: ${error.message}`));
        }
    },
});

const xmlFormatter = Object.freeze({
    id: 'xml-formatter',
    category: 'developer',
    icon: '</>',
    title: Object.freeze({ ar: 'منسق XML', en: 'XML Formatter' }),
    description: Object.freeze({ ar: 'رتب عناصر XML المتداخلة بمسافات بادئة واضحة للقراءة.', en: 'Indent nested XML elements into a readable structure.' }),
    note: Object.freeze({ ar: 'تتم المعالجة محليًا ولا تُرسل البيانات إلى خادم.', en: 'Processing happens locally and no data is uploaded.' }),
    inputs: Object.freeze([textInput('xml', { ar: 'نص XML', en: 'XML input' }, '<catalog><tool id="1">BMI</tool><tool id="2">JSON</tool></catalog>')]),
    calculate(values, language) {
        const trimmed = values.xml.trim();
        if (!trimmed.startsWith('<') || !trimmed.endsWith('>')) {
            throw new Error(localized(language, 'أدخل نص XML صالحًا.', 'Enter valid XML markup.'));
        }
        const formatted = formatXml(trimmed);
        return output(formatted, localized(language, 'XML منسق', 'Formatted XML'));
    },
});

const sqlFormatter = Object.freeze({
    id: 'sql-formatter',
    category: 'developer',
    icon: 'SQL',
    title: Object.freeze({ ar: 'منسق SQL', en: 'SQL Formatter' }),
    description: Object.freeze({ ar: 'نسّق استعلامات SQL الشائعة إلى أسطر وفقرات أسهل في المراجعة.', en: 'Format common SQL queries into readable clauses and lines.' }),
    note: Object.freeze({ ar: 'يحافظ المنسق على النصوص المحاطة بعلامات اقتباس كما هي.', en: 'Quoted string values are preserved.' }),
    inputs: Object.freeze([textInput('sql', { ar: 'استعلام SQL', en: 'SQL query' }, 'select id,name from tools where active=1 order by name;')]),
    calculate(values, language) {
        const keywords = [
            'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING',
            'LIMIT', 'OFFSET', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
            'FULL JOIN', 'UNION', 'VALUES', 'SET',
        ];
        let formatted = values.sql.trim().replace(/\s+/g, ' ');
        for (const keyword of keywords) {
            const pattern = new RegExp(`\\s*\\b${keyword.replace(' ', '\\s+')}\\b\\s*`, 'gi');
            formatted = formatted.replace(pattern, `\n${keyword} `);
        }
        formatted = formatted.trim().replace(/,\s*/g, ', ');
        return output(formatted, localized(language, 'SQL منسق', 'Formatted SQL'));
    },
});

const queryStringParser = Object.freeze({
    id: 'query-string-parser',
    category: 'developer',
    icon: '?=',
    title: Object.freeze({ ar: 'تحليل Query String', en: 'Query String Parser' }),
    description: Object.freeze({ ar: 'حوّل معاملات الرابط إلى JSON مع دعم المفاتيح المتكررة.', en: 'Convert URL query parameters into JSON with repeated-key support.' }),
    note: Object.freeze({ ar: 'يمكن إدخال رابط كامل أو الجزء الذي يبدأ بعلامة الاستفهام.', en: 'Accepts a full URL or only the portion beginning with a question mark.' }),
    inputs: Object.freeze([textInput('query', { ar: 'الرابط أو المعاملات', en: 'URL or query string' }, 'https://example.com/search?q=tools&lang=ar&tag=free&tag=web', 4)]),
    calculate(values, language) {
        const source = values.query.includes('?') ? values.query.split('?')[1].split('#')[0] : values.query.replace(/^\?/, '');
        const parameters = new URLSearchParams(source);
        const record = {};
        for (const [key, value] of parameters) {
            if (Object.hasOwn(record, key)) {
                record[key] = Array.isArray(record[key]) ? [...record[key], value] : [record[key], value];
            } else {
                record[key] = value;
            }
        }
        return output(
            JSON.stringify(record, null, 2),
            localized(language, `${[...parameters].length} معامل`, `${[...parameters].length} parameters`),
        );
    },
});

const queryStringBuilder = Object.freeze({
    id: 'query-string-builder',
    category: 'developer',
    icon: '&=',
    title: Object.freeze({ ar: 'إنشاء Query String', en: 'Query String Builder' }),
    description: Object.freeze({ ar: 'حوّل كائن JSON بسيطًا إلى معاملات رابط مشفرة بطريقة صحيحة.', en: 'Convert a simple JSON object into a correctly encoded query string.' }),
    note: Object.freeze({ ar: 'تُكرر المصفوفات بنفس المفتاح لتوافق واسع مع الخوادم.', en: 'Arrays repeat the same key for broad server compatibility.' }),
    inputs: Object.freeze([textInput('json', { ar: 'كائن JSON', en: 'JSON object' }, '{"q":"free tools","lang":"ar","tag":["web","seo"]}')]),
    calculate(values, language) {
        try {
            const record = JSON.parse(values.json);
            if (!record || Array.isArray(record) || typeof record !== 'object') {
                throw new Error();
            }
            const parameters = new URLSearchParams();
            for (const [key, rawValue] of Object.entries(record)) {
                const items = Array.isArray(rawValue) ? rawValue : [rawValue];
                for (const item of items) {
                    parameters.append(key, item === null ? '' : String(item));
                }
            }
            return output(`?${parameters}`, localized(language, `${[...parameters].length} معامل`, `${[...parameters].length} parameters`));
        } catch {
            throw new Error(localized(language, 'أدخل كائن JSON بسيطًا وصالحًا.', 'Enter a valid simple JSON object.'));
        }
    },
});

const uuidGenerator = Object.freeze({
    id: 'uuid-generator',
    category: 'developer',
    icon: 'UUID',
    title: Object.freeze({ ar: 'مولد UUID', en: 'UUID Generator' }),
    description: Object.freeze({ ar: 'أنشئ معرّفات UUID الإصدار الرابع آمنة عشوائيًا داخل المتصفح.', en: 'Generate cryptographically random UUID version 4 identifiers locally.' }),
    note: Object.freeze({ ar: 'يستخدم مولد الأرقام العشوائية الآمن في المتصفح.', en: 'Uses the browser secure random-number generator.' }),
    inputs: Object.freeze([numberInput('count', { ar: 'عدد المعرّفات', en: 'Number of UUIDs' }, 5, 1, 100)]),
    calculate(values, language) {
        const identifiers = Array.from({ length: values.count }, () => globalThis.crypto.randomUUID());
        return output(identifiers.join('\n'), localized(language, `${values.count} معرّف`, `${values.count} UUIDs`));
    },
});

const randomStringGenerator = Object.freeze({
    id: 'random-string-generator',
    category: 'developer',
    icon: 'Aa#',
    title: Object.freeze({ ar: 'مولد نص عشوائي', en: 'Random String Generator' }),
    description: Object.freeze({ ar: 'أنشئ نصًا عشوائيًا آمنًا بطول ومجموعة محارف تختارها.', en: 'Generate a secure random string with your chosen length and character set.' }),
    note: Object.freeze({ ar: 'مناسب للرموز المؤقتة ومعرّفات الاختبار وليس بديلًا عن إدارة الأسرار.', en: 'Useful for temporary tokens and test IDs, not a substitute for secret management.' }),
    inputs: Object.freeze([
        numberInput('length', { ar: 'الطول', en: 'Length' }, 32, 4, 512),
        selectInput('charset', { ar: 'مجموعة المحارف', en: 'Character set' }, [
            { value: 'alphanumeric', label: { ar: 'حروف وأرقام', en: 'Letters and numbers' } },
            { value: 'hex', label: { ar: 'سداسي عشري', en: 'Hexadecimal' } },
            { value: 'numeric', label: { ar: 'أرقام فقط', en: 'Numbers only' } },
        ]),
    ]),
    calculate(values, language) {
        const alphabets = {
            alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
            hex: '0123456789abcdef',
            numeric: '0123456789',
        };
        const alphabet = alphabets[values.charset];
        const bytes = randomBytes(values.length);
        const value = [...bytes].map((byte) => alphabet[byte % alphabet.length]).join('');
        return output(value, localized(language, `${values.length} حرف`, `${values.length} characters`));
    },
});

const dataDeveloperDefinitions = Object.freeze({
    [csvToJson.id]: csvToJson,
    [jsonToCsv.id]: jsonToCsv,
    [jsonMinifier.id]: jsonMinifier,
    [jsonValidator.id]: jsonValidator,
    [xmlFormatter.id]: xmlFormatter,
    [sqlFormatter.id]: sqlFormatter,
    [queryStringParser.id]: queryStringParser,
    [queryStringBuilder.id]: queryStringBuilder,
    [uuidGenerator.id]: uuidGenerator,
    [randomStringGenerator.id]: randomStringGenerator,
});

export { dataDeveloperDefinitions };

// END OF FILE
