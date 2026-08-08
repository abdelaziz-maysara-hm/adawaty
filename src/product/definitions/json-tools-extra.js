function output(value, label, details = '') {
    return { value, label, details };
}

function textInput(id, label, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 10,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function parseJsonOrThrow(text, language, label) {
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(localized(
            language,
            `${label} ليس JSON صالحًا.`,
            `${label} is not valid JSON.`,
        ));
    }
}

/** Recursively compares two JSON-decoded values and lists every difference. */
function diffJsonValues(a, b, path = '') {
    const diffs = [];

    if (typeof a !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
        diffs.push({ path: path || '(root)', type: 'type-mismatch' });
        return diffs;
    }
    if (a === null || b === null || typeof a !== 'object') {
        if (a !== b) diffs.push({ path: path || '(root)', type: 'value', a, b });
        return diffs;
    }

    const keysA = Array.isArray(a) ? a.map((_, index) => index) : Object.keys(a);
    const keysB = Array.isArray(b) ? b.map((_, index) => index) : Object.keys(b);
    const allKeys = [...new Set([...keysA, ...keysB])];

    for (const key of allKeys) {
        const childPath = path ? `${path}.${key}` : String(key);
        if (!(key in a)) {
            diffs.push({ path: childPath, type: 'added', b: b[key] });
            continue;
        }
        if (!(key in b)) {
            diffs.push({ path: childPath, type: 'removed', a: a[key] });
            continue;
        }
        diffs.push(...diffJsonValues(a[key], b[key], childPath));
    }

    return diffs;
}

function describeDiff(diff, language) {
    if (diff.type === 'added') {
        return localized(language, `+ ${diff.path}: أُضيف (${JSON.stringify(diff.b)})`, `+ ${diff.path}: added (${JSON.stringify(diff.b)})`);
    }
    if (diff.type === 'removed') {
        return localized(language, `- ${diff.path}: حُذف (كان ${JSON.stringify(diff.a)})`, `- ${diff.path}: removed (was ${JSON.stringify(diff.a)})`);
    }
    if (diff.type === 'type-mismatch') {
        return localized(language, `~ ${diff.path}: نوع مختلف`, `~ ${diff.path}: different type`);
    }
    return localized(
        language,
        `~ ${diff.path}: ${JSON.stringify(diff.a)} → ${JSON.stringify(diff.b)}`,
        `~ ${diff.path}: ${JSON.stringify(diff.a)} → ${JSON.stringify(diff.b)}`,
    );
}

const jsonDiff = Object.freeze({
    id: 'json-diff',
    category: 'developer',
    icon: 'DIFF',
    title: Object.freeze({ ar: 'مقارنة ملفي JSON', en: 'JSON Diff' }),
    description: Object.freeze({
        ar: 'قارن بين نصّي JSON واعرض كل قيمة أُضيفت أو حُذفت أو تغيّرت، بما في ذلك داخل العناصر المتداخلة.',
        en: 'Compare two JSON texts and list every value that was added, removed, or changed, including nested fields.',
    }),
    note: Object.freeze({
        ar: 'المقارنة تتم بالمفتاح لا بترتيب الظهور، فترتيب الحقول في الكائن لا يُعتبر فرقًا.',
        en: 'Comparison is by key, not appearance order, so field order inside an object is not treated as a difference.',
    }),
    inputs: Object.freeze([
        textInput('before', { ar: 'JSON الأول (قبل)', en: 'First JSON (before)' }, '{"name":"Adawaty","version":1}'),
        textInput('after', { ar: 'JSON الثاني (بعد)', en: 'Second JSON (after)' }, '{"name":"Adawaty","version":2,"tools":465}'),
    ]),
    calculate(values, language) {
        const before = parseJsonOrThrow(values.before, language, localized(language, 'النص الأول', 'The first input'));
        const after = parseJsonOrThrow(values.after, language, localized(language, 'النص الثاني', 'The second input'));
        const diffs = diffJsonValues(before, after);

        if (diffs.length === 0) {
            return output(
                localized(language, 'لا توجد فروق', 'No differences'),
                localized(language, 'النصان متطابقان تمامًا', 'Both inputs are identical'),
            );
        }

        return output(
            String(diffs.length),
            localized(language, 'فرق تم العثور عليه', 'Differences found'),
            diffs.map((diff) => describeDiff(diff, language)).join('\n'),
        );
    },
});

function escapeCsvCell(value) {
    const text = value === null || value === undefined ? '' : String(value);
    return /["\n,]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function jsonArrayToCsv(rows, language) {
    if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error(localized(
            language,
            'أدخل مصفوفة JSON بها عنصر واحد على الأقل.',
            'Enter a JSON array with at least one item.',
        ));
    }

    const headers = [...new Set(rows.flatMap((row) => (
        row && typeof row === 'object' ? Object.keys(row) : []
    )))];

    if (headers.length === 0) {
        throw new Error(localized(
            language,
            'عناصر المصفوفة يجب أن تكون كائنات لها حقول.',
            'Array items must be objects with fields.',
        ));
    }

    const lines = [headers.map(escapeCsvCell).join(',')];
    for (const row of rows) {
        lines.push(headers.map((header) => escapeCsvCell(row?.[header])).join(','));
    }

    return { csv: lines.join('\n'), rowCount: rows.length, columnCount: headers.length };
}

const jsonToCsvTool = Object.freeze({
    id: 'json-to-csv',
    category: 'developer',
    icon: 'JSON→CSV',
    title: Object.freeze({ ar: 'تحويل JSON إلى CSV', en: 'JSON to CSV' }),
    description: Object.freeze({
        ar: 'حوّل مصفوفة كائنات JSON إلى جدول CSV، مع دعم الفواصل والاقتباسات داخل القيم.',
        en: 'Convert a JSON array of objects into a CSV table, handling commas and quotes inside values.',
    }),
    note: Object.freeze({
        ar: 'أعمدة الجدول تُبنى من كل الحقول الموجودة في أي عنصر، حتى لو اختلفت بين العناصر.',
        en: 'Table columns are built from every field appearing in any item, even if items have different fields.',
    }),
    inputs: Object.freeze([
        textInput('json', { ar: 'مصفوفة JSON', en: 'JSON array' }, '[{"name":"Ahmed","age":30},{"name":"Sara","age":25}]'),
    ]),
    calculate(values, language) {
        const parsed = parseJsonOrThrow(values.json, language, localized(language, 'المدخل', 'The input'));
        const { csv, rowCount, columnCount } = jsonArrayToCsv(parsed, language);

        return output(
            csv,
            localized(language, 'جدول CSV جاهز', 'The CSV table is ready'),
            localized(
                language,
                `${rowCount} صفوف · ${columnCount} أعمدة`,
                `${rowCount} rows · ${columnCount} columns`,
            ),
        );
    },
});

function parseCsvLine(line) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];

        if (inQuotes) {
            if (character === '"' && line[index + 1] === '"') {
                current += '"';
                index += 1;
            } else if (character === '"') {
                inQuotes = false;
            } else {
                current += character;
            }
            continue;
        }

        if (character === '"') {
            inQuotes = true;
        } else if (character === ',') {
            cells.push(current);
            current = '';
        } else {
            current += character;
        }
    }

    cells.push(current);
    return cells;
}

function csvTextToJson(csvText, language) {
    const lines = csvText.trim().split(/\r?\n/).filter((line) => line.length > 0);
    if (lines.length < 2) {
        throw new Error(localized(
            language,
            'يجب أن يحتوي CSV على صف عناوين وصف بيانات واحد على الأقل.',
            'CSV must contain a header row and at least one data row.',
        ));
    }

    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map((line) => {
        const cells = parseCsvLine(line);
        const row = {};
        headers.forEach((header, index) => {
            row[header] = cells[index] ?? '';
        });
        return row;
    });

    return rows;
}

const csvToJsonTool = Object.freeze({
    id: 'csv-to-json',
    category: 'developer',
    icon: 'CSV→JSON',
    title: Object.freeze({ ar: 'تحويل CSV إلى JSON', en: 'CSV to JSON' }),
    description: Object.freeze({
        ar: 'حوّل جدول CSV إلى مصفوفة كائنات JSON، مع فهم صحيح للقيم المحاطة باقتباسات.',
        en: 'Convert a CSV table into a JSON array of objects, correctly handling quoted values.',
    }),
    note: Object.freeze({
        ar: 'الصف الأول يُعامل كصف عناوين الأعمدة دائمًا.',
        en: 'The first row is always treated as the column header row.',
    }),
    inputs: Object.freeze([
        textInput('csv', { ar: 'نص CSV', en: 'CSV text' }, 'name,age\nAhmed,30\nSara,25'),
    ]),
    calculate(values, language) {
        const rows = csvTextToJson(values.csv, language);
        const json = JSON.stringify(rows, null, 2);

        return output(
            json,
            localized(language, 'مصفوفة JSON جاهزة', 'The JSON array is ready'),
            localized(language, `${rows.length} عنصر`, `${rows.length} items`),
        );
    },
});

const jsonToolsExtraDefinitions = Object.freeze({
    [jsonDiff.id]: jsonDiff,
    [jsonToCsvTool.id]: jsonToCsvTool,
    [csvToJsonTool.id]: csvToJsonTool,
});

export { jsonToolsExtraDefinitions };

// END OF FILE
