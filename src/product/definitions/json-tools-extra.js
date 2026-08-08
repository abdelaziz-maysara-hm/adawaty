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

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map(([value, optAr, optEn]) => Object.freeze({
            value,
            label: Object.freeze({ ar: optAr, en: optEn }),
        }))),
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

/** Deep-merges b into a: objects merge recursively, arrays concatenate, primitives use b. */
function deepMergeJson(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
        return [...a, ...b];
    }
    if (
        a && b && typeof a === 'object' && typeof b === 'object'
        && !Array.isArray(a) && !Array.isArray(b)
    ) {
        const result = { ...a };
        for (const key of Object.keys(b)) {
            result[key] = key in a ? deepMergeJson(a[key], b[key]) : b[key];
        }
        return result;
    }
    return b;
}

const jsonMerge = Object.freeze({
    id: 'json-merge',
    category: 'developer',
    icon: 'MERGE',
    title: Object.freeze({ ar: 'دمج ملفي JSON', en: 'JSON Merge' }),
    description: Object.freeze({
        ar: 'ادمج كائنَي JSON في كائن واحد: الكائنات المتداخلة تندمج تكراريًا، والمصفوفات تُلحَق، والقيم البسيطة تُستبدل بالقيمة الثانية.',
        en: 'Merge two JSON objects into one: nested objects merge recursively, arrays concatenate, and primitive values are replaced by the second one.',
    }),
    note: Object.freeze({
        ar: 'عند تعارض نوعين مختلفين لنفس المفتاح (مثل نص مقابل رقم)، تفوز قيمة الكائن الثاني.',
        en: 'When the same key holds two different types (like text vs a number), the second object\u2019s value wins.',
    }),
    inputs: Object.freeze([
        textInput('base', { ar: 'JSON الأساسي', en: 'Base JSON' }, '{"name":"Adawaty","tags":["free"]}'),
        textInput('overlay', { ar: 'JSON الإضافي', en: 'Overlay JSON' }, '{"version":2,"tags":["client-side"]}'),
    ]),
    calculate(values, language) {
        const base = parseJsonOrThrow(values.base, language, localized(language, 'JSON الأساسي', 'The base JSON'));
        const overlay = parseJsonOrThrow(values.overlay, language, localized(language, 'JSON الإضافي', 'The overlay JSON'));
        const merged = deepMergeJson(base, overlay);

        return output(
            JSON.stringify(merged, null, 2),
            localized(language, 'النتيجة المدمجة جاهزة', 'The merged result is ready'),
        );
    },
});

const jsonStringEscaper = Object.freeze({
    id: 'json-string-escaper',
    category: 'developer',
    icon: 'ESC',
    title: Object.freeze({ ar: 'ترميز وفك ترميز نص JSON', en: 'JSON String Escape & Unescape' }),
    description: Object.freeze({
        ar: 'رمّز نصًا عاديًا ليكون صالحًا كقيمة نصية داخل JSON، أو فُك ترميز نص JSON إلى نصه الأصلي.',
        en: 'Escape plain text so it is valid inside a JSON string value, or unescape a JSON string back to its original text.',
    }),
    note: Object.freeze({
        ar: 'الترميز يحوّل السطر الجديد وعلامات الاقتباس والخط المائل العكسي لصيغة آمنة داخل JSON.',
        en: 'Escaping converts newlines, quotes, and backslashes into a form that is safe inside JSON.',
    }),
    inputs: Object.freeze([
        selectInput('operation', 'العملية', 'Operation', [
            ['escape', 'ترميز (نص عادي → JSON)', 'Escape (plain text \u2192 JSON)'],
            ['unescape', 'فك الترميز (JSON → نص عادي)', 'Unescape (JSON \u2192 plain text)'],
        ]),
        textInput('text', { ar: 'النص', en: 'Text' }, 'Line 1\nLine 2 with "quotes"'),
    ]),
    calculate(values, language) {
        try {
            const result = values.operation === 'escape'
                ? JSON.stringify(values.text).slice(1, -1)
                : JSON.parse(`"${values.text}"`);
            return output(result, localized(language, 'النتيجة', 'Result'));
        } catch {
            throw new Error(localized(
                language,
                'تعذر فك الترميز. تأكد أن النص المُدخل نص JSON مُرمّز صالح.',
                'Could not unescape. Make sure the input is validly escaped JSON text.',
            ));
        }
    },
});

const jsonToolsExtraDefinitions = Object.freeze({
    [jsonDiff.id]: jsonDiff,
    [jsonMerge.id]: jsonMerge,
    [jsonStringEscaper.id]: jsonStringEscaper,
});

export { jsonToolsExtraDefinitions };

// END OF FILE
