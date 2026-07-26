function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function textInput(id, label, sample, rows = 7) {
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

function developerTool(config) {
    return Object.freeze({
        id: config.id,
        category: 'developer',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate: config.calculate,
    });
}

function sortJson(value) {
    if (Array.isArray(value)) {
        return value.map(sortJson);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.keys(value).sort().map((key) => [key, sortJson(value[key])]),
        );
    }
    return value;
}

function flattenJson(value, prefix = '', target = {}) {
    if (value && typeof value === 'object' && Object.keys(value).length) {
        for (const [key, child] of Object.entries(value)) {
            flattenJson(child, prefix ? `${prefix}.${key}` : key, target);
        }
    } else {
        target[prefix] = value;
    }
    return target;
}

function parseJson(text, language) {
    try {
        return JSON.parse(text);
    } catch {
        throw new Error(localized(language, 'أدخل JSON صالحًا.', 'Enter valid JSON.'));
    }
}

const jsonKeySorter = developerTool({
    id: 'json-key-sorter',
    icon: '{A→Z}',
    title: { ar: 'ترتيب مفاتيح JSON', en: 'JSON Key Sorter' },
    description: { ar: 'رتب مفاتيح كائنات JSON أبجديًا مع الحفاظ على المصفوفات والقيم.', en: 'Sort JSON object keys alphabetically while preserving arrays and values.' },
    note: { ar: 'يُطبق الترتيب على جميع المستويات المتداخلة.', en: 'Sorting is applied recursively at every nested level.' },
    inputs: [textInput('json', { ar: 'JSON', en: 'JSON input' }, '{"z":1,"a":{"y":2,"b":3}}')],
    calculate(values, language) {
        return output(JSON.stringify(sortJson(parseJson(values.json, language)), null, 2), localized(language, 'JSON مرتب', 'Sorted JSON'));
    },
});

const jsonFlattener = developerTool({
    id: 'json-flattener',
    icon: '{→}',
    title: { ar: 'تسطيح JSON', en: 'JSON Flattener' },
    description: { ar: 'حوّل JSON المتداخل إلى كائن مسطح بمسارات مفصولة بنقاط.', en: 'Convert nested JSON into a flat object with dot-separated paths.' },
    note: { ar: 'تظهر فهارس المصفوفات كأجزاء رقمية في المسار.', en: 'Array indexes appear as numeric path segments.' },
    inputs: [textInput('json', { ar: 'JSON متداخل', en: 'Nested JSON' }, '{"user":{"name":"Ali","roles":["admin","editor"]}}')],
    calculate(values, language) {
        const flattened = flattenJson(parseJson(values.json, language));
        return output(JSON.stringify(flattened, null, 2), localized(language, `${Object.keys(flattened).length} مسار`, `${Object.keys(flattened).length} paths`));
    },
});

const jsonUnflattener = developerTool({
    id: 'json-unflattener',
    icon: '{←}',
    title: { ar: 'إعادة بناء JSON المسطح', en: 'JSON Unflattener' },
    description: { ar: 'أعد بناء كائنات JSON متداخلة من مفاتيح بمسارات نقطية.', en: 'Rebuild nested JSON objects from dot-path keys.' },
    note: { ar: 'يجب ألا تتعارض المسارات مع قيم أبسط في المستوى نفسه.', en: 'Paths must not conflict with simpler values at the same level.' },
    inputs: [textInput('json', { ar: 'JSON مسطح', en: 'Flat JSON' }, '{"user.name":"Ali","user.country":"EG"}')],
    calculate(values, language) {
        const flat = parseJson(values.json, language);
        if (!flat || Array.isArray(flat) || typeof flat !== 'object') {
            throw new Error(localized(language, 'أدخل كائن JSON مسطحًا.', 'Enter a flat JSON object.'));
        }
        const nested = {};
        for (const [path, value] of Object.entries(flat)) {
            const keys = path.split('.').filter(Boolean);
            if (!keys.length) {
                throw new Error(localized(language, 'يوجد مسار فارغ.', 'An empty path was found.'));
            }
            let cursor = nested;
            keys.forEach((key, index) => {
                if (index === keys.length - 1) {
                    cursor[key] = value;
                } else {
                    if (cursor[key] !== undefined && (typeof cursor[key] !== 'object' || cursor[key] === null)) {
                        throw new Error(localized(language, 'توجد مسارات متعارضة.', 'Conflicting paths found.'));
                    }
                    cursor[key] ??= {};
                    cursor = cursor[key];
                }
            });
        }
        return output(JSON.stringify(nested, null, 2), localized(language, 'JSON متداخل', 'Nested JSON'));
    },
});

const urlParser = developerTool({
    id: 'url-parser',
    icon: 'URL',
    title: { ar: 'محلل الرابط', en: 'URL Parser' },
    description: { ar: 'قسّم الرابط إلى البروتوكول والمضيف والمسار والمعاملات والجزء المرجعي.', en: 'Split a URL into protocol, host, path, query parameters and fragment.' },
    note: { ar: 'تتم المعالجة محليًا دون فتح الرابط.', en: 'The URL is processed locally and is not opened.' },
    inputs: [textInput('url', { ar: 'الرابط الكامل', en: 'Full URL' }, 'https://example.com:8080/tools?q=json#results', 4)],
    calculate(values, language) {
        try {
            const url = new URL(values.url.trim());
            return output(JSON.stringify({
                protocol: url.protocol.replace(':', ''),
                hostname: url.hostname,
                port: url.port,
                pathname: url.pathname,
                query: Object.fromEntries(url.searchParams),
                fragment: url.hash.replace('#', ''),
            }, null, 2), localized(language, 'مكونات الرابط', 'URL components'));
        } catch {
            throw new Error(localized(language, 'أدخل رابطًا كاملًا وصالحًا.', 'Enter a valid absolute URL.'));
        }
    },
});

const urlNormalizer = developerTool({
    id: 'url-normalizer',
    icon: '↻URL',
    title: { ar: 'توحيد صيغة الرابط', en: 'URL Normalizer' },
    description: { ar: 'وحّد حالة المضيف واحذف المنفذ الافتراضي والجزء المرجعي ورتب المعاملات.', en: 'Normalize host case, default ports, fragments and query ordering.' },
    note: { ar: 'قد تتعامل بعض التطبيقات مع ترتيب المعاملات كجزء مهم؛ راجع الناتج.', en: 'Some applications treat query order as significant; review the result.' },
    inputs: [textInput('url', { ar: 'الرابط', en: 'URL' }, 'HTTPS://Example.COM:443/path?z=2&a=1#top', 4)],
    calculate(values, language) {
        try {
            const url = new URL(values.url.trim());
            url.hash = '';
            const entries = [...url.searchParams.entries()].sort(([left], [right]) => left.localeCompare(right));
            url.search = '';
            entries.forEach(([key, value]) => url.searchParams.append(key, value));
            return output(url.toString(), localized(language, 'الرابط الموحد', 'Normalized URL'));
        } catch {
            throw new Error(localized(language, 'أدخل رابطًا صالحًا.', 'Enter a valid URL.'));
        }
    },
});

const regexEscaper = developerTool({
    id: 'regex-escape-tool',
    icon: '.*\\',
    title: { ar: 'أداة Escape لـ Regex', en: 'Regex Escape Tool' },
    description: { ar: 'حوّل النص الحرفي إلى نمط آمن للاستخدام داخل تعبير منتظم.', en: 'Escape literal text for safe use inside a regular expression.' },
    note: { ar: 'تُسبق المحارف الخاصة بشرطة مائلة عكسية.', en: 'Regular-expression metacharacters receive a backslash.' },
    inputs: [textInput('text', { ar: 'النص الحرفي', en: 'Literal text' }, 'price: $10.00 (sale)', 4)],
    calculate(values, language) {
        return output(values.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), localized(language, 'النمط الآمن', 'Escaped pattern'));
    },
});

const javascriptStringEscaper = developerTool({
    id: 'javascript-string-escape-tool',
    icon: '"\\n"',
    title: { ar: 'ترميز نص JavaScript', en: 'JavaScript String Escape Tool' },
    description: { ar: 'حوّل النص إلى محتوى سلسلة JavaScript مع ترميز علامات الاقتباس والأسطر.', en: 'Escape text as JavaScript string content, including quotes and line breaks.' },
    note: { ar: 'يعرض الناتج المحتوى المرمز دون علامتي الاقتباس الخارجيتين.', en: 'The result omits the outer quotation marks.' },
    inputs: [textInput('text', { ar: 'النص', en: 'Text' }, 'Line one\n"Line two"')],
    calculate(values, language) {
        const escaped = JSON.stringify(values.text).slice(1, -1).replaceAll("'", "\\'");
        return output(escaped, localized(language, 'نص JavaScript مرمز', 'Escaped JavaScript string'));
    },
});

const httpStatuses = {
    100: ['Continue', 'متابعة'], 200: ['OK', 'ناجح'], 201: ['Created', 'تم الإنشاء'],
    204: ['No Content', 'لا يوجد محتوى'], 301: ['Moved Permanently', 'نقل دائم'],
    302: ['Found', 'تم العثور'], 304: ['Not Modified', 'غير معدل'],
    400: ['Bad Request', 'طلب غير صالح'], 401: ['Unauthorized', 'غير مصرح'],
    403: ['Forbidden', 'ممنوع'], 404: ['Not Found', 'غير موجود'],
    405: ['Method Not Allowed', 'الطريقة غير مسموحة'], 409: ['Conflict', 'تعارض'],
    422: ['Unprocessable Content', 'محتوى غير قابل للمعالجة'],
    429: ['Too Many Requests', 'طلبات كثيرة'], 500: ['Internal Server Error', 'خطأ داخلي'],
    502: ['Bad Gateway', 'بوابة غير صالحة'], 503: ['Service Unavailable', 'الخدمة غير متاحة'],
};

const httpStatusLookup = developerTool({
    id: 'http-status-code-lookup',
    icon: '200',
    title: { ar: 'دليل رموز HTTP', en: 'HTTP Status Code Lookup' },
    description: { ar: 'اعرف الاسم والفئة لرموز استجابة HTTP الشائعة.', en: 'Look up the name and category of common HTTP response codes.' },
    note: { ar: 'يشمل الدليل الرموز الأكثر استخدامًا في تطبيقات الويب.', en: 'Covers status codes most commonly used in web applications.' },
    inputs: [numberInput('code', { ar: 'رمز HTTP', en: 'HTTP status code' }, 404, 100, 599)],
    calculate(values, language) {
        const entry = httpStatuses[values.code];
        if (!entry) {
            throw new Error(localized(language, 'الرمز غير موجود في الدليل المختصر.', 'Code not found in the compact reference.'));
        }
        const category = values.code < 200 ? 'Informational' : values.code < 300 ? 'Success' : values.code < 400 ? 'Redirection' : values.code < 500 ? 'Client error' : 'Server error';
        return output(entry[language === 'ar' ? 1 : 0], localized(language, `HTTP ${values.code}`, `HTTP ${values.code}`), category);
    },
});

const mimeTypes = {
    html: 'text/html', css: 'text/css', js: 'text/javascript', json: 'application/json',
    xml: 'application/xml', txt: 'text/plain', csv: 'text/csv', pdf: 'application/pdf',
    png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif',
    svg: 'image/svg+xml', webp: 'image/webp', ico: 'image/x-icon', mp3: 'audio/mpeg',
    mp4: 'video/mp4', webm: 'video/webm', zip: 'application/zip', wasm: 'application/wasm',
    woff: 'font/woff', woff2: 'font/woff2',
};

const mimeLookup = developerTool({
    id: 'mime-type-lookup',
    icon: 'MIME',
    title: { ar: 'دليل أنواع MIME', en: 'MIME Type Lookup' },
    description: { ar: 'اعرف نوع MIME الشائع من امتداد الملف.', en: 'Find a common MIME type from a file extension.' },
    note: { ar: 'يمكن إدخال الامتداد منفردًا أو اسم ملف كامل.', en: 'Enter an extension or a complete filename.' },
    inputs: [textInput('filename', { ar: 'اسم الملف أو الامتداد', en: 'Filename or extension' }, 'data.json', 3)],
    calculate(values, language) {
        const extension = values.filename.trim().toLowerCase().split('.').pop();
        const type = mimeTypes[extension];
        if (!type) {
            throw new Error(localized(language, 'الامتداد غير موجود في الدليل المختصر.', 'Extension not found in the compact reference.'));
        }
        return output(type, localized(language, `امتداد .${extension}`, `.${extension} files`));
    },
});

const cronBuilder = developerTool({
    id: 'cron-expression-builder',
    icon: '⏲',
    title: { ar: 'منشئ تعبير Cron', en: 'Cron Expression Builder' },
    description: { ar: 'كوّن تعبير Cron قياسي من حقول الدقيقة والساعة واليوم والشهر والأسبوع.', en: 'Build a standard Cron expression from minute, hour, day, month and weekday fields.' },
    note: { ar: 'يدعم الأرقام والنجمة والفواصل والشرطات والشرطة المائلة.', en: 'Supports numbers, wildcards, lists, ranges and step syntax.' },
    inputs: [
        textInput('minute', { ar: 'الدقيقة', en: 'Minute' }, '0', 2),
        textInput('hour', { ar: 'الساعة', en: 'Hour' }, '9', 2),
        textInput('day', { ar: 'يوم الشهر', en: 'Day of month' }, '*', 2),
        textInput('month', { ar: 'الشهر', en: 'Month' }, '*', 2),
        textInput('weekday', { ar: 'يوم الأسبوع', en: 'Day of week' }, '1-5', 2),
    ],
    calculate(values, language) {
        const parts = [values.minute, values.hour, values.day, values.month, values.weekday].map((part) => part.trim());
        if (parts.some((part) => !/^[\d*/,\-]+$/.test(part))) {
            throw new Error(localized(language, 'أحد حقول Cron يحتوي على محارف غير صالحة.', 'A Cron field contains invalid characters.'));
        }
        return output(parts.join(' '), localized(language, 'تعبير Cron', 'Cron expression'), localized(language, 'راجع النطاقات وفق نظام التشغيل المستخدم.', 'Verify field ranges for your target scheduler.'));
    },
});

const webDeveloperDefinitions = Object.freeze({
    [jsonKeySorter.id]: jsonKeySorter,
    [jsonFlattener.id]: jsonFlattener,
    [jsonUnflattener.id]: jsonUnflattener,
    [urlParser.id]: urlParser,
    [urlNormalizer.id]: urlNormalizer,
    [regexEscaper.id]: regexEscaper,
    [javascriptStringEscaper.id]: javascriptStringEscaper,
    [httpStatusLookup.id]: httpStatusLookup,
    [mimeLookup.id]: mimeLookup,
    [cronBuilder.id]: cronBuilder,
});

export { webDeveloperDefinitions };

// END OF FILE
