function output(value, label, details = '') {
    return { value, label, details };
}

function textInput(id, label, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 8,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze({
            value: option.value,
            label: Object.freeze(option.label),
        }))),
    });
}

function encodeBase64(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

function decodeBase64(value) {
    const binary = atob(value.replaceAll(/\s/g, ''));
    return new TextDecoder().decode(
        Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    );
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

const operationOptions = Object.freeze([
    { value: 'encode', label: { ar: 'ترميز', en: 'Encode' } },
    { value: 'decode', label: { ar: 'فك الترميز', en: 'Decode' } },
]);

const jsonFormatter = Object.freeze({
    id: 'json-formatter',
    category: 'developer',
    icon: '{}',
    title: Object.freeze({ ar: 'منسق JSON', en: 'JSON Formatter' }),
    description: Object.freeze({ ar: 'نسّق JSON المضغوط واجعله سهل القراءة والتحقق.', en: 'Format and validate compact JSON for easier reading.' }),
    note: Object.freeze({ ar: 'تظل البيانات داخل متصفحك ولا تُرفع إلى خادم.', en: 'Your data stays in the browser and is not uploaded.' }),
    inputs: Object.freeze([
        textInput('text', { ar: 'JSON', en: 'JSON input' }, '{"name":"Adawaty","tools":41}'),
    ]),
    calculate(values, language) {
        try {
            const formatted = JSON.stringify(JSON.parse(values.text), null, 2);
            return output(
                formatted,
                localized(language, 'JSON صالح ومنسّق', 'Valid formatted JSON'),
                localized(language, 'تم التنسيق بمسافتين لكل مستوى.', 'Formatted with two-space indentation.'),
            );
        } catch {
            throw new Error(localized(language, 'صيغة JSON غير صالحة.', 'Invalid JSON input.'));
        }
    },
});

const base64Tool = Object.freeze({
    id: 'base64-encoder-decoder',
    category: 'developer',
    icon: '64',
    title: Object.freeze({ ar: 'ترميز وفك Base64', en: 'Base64 Encoder & Decoder' }),
    description: Object.freeze({ ar: 'رمّز النصوص إلى Base64 أو استعد النص الأصلي.', en: 'Encode text to Base64 or decode it back.' }),
    note: Object.freeze({ ar: 'يدعم النصوص العربية وUnicode.', en: 'Supports Arabic and other Unicode text.' }),
    inputs: Object.freeze([
        selectInput('operation', { ar: 'العملية', en: 'Operation' }, operationOptions),
        textInput('text', { ar: 'النص', en: 'Text' }, 'Adawaty'),
    ]),
    calculate(values, language) {
        try {
            const result = values.operation === 'encode'
                ? encodeBase64(values.text)
                : decodeBase64(values.text);
            return output(result, localized(language, 'النتيجة', 'Result'));
        } catch {
            throw new Error(localized(language, 'تعذر فك قيمة Base64.', 'Invalid Base64 input.'));
        }
    },
});

const urlTool = Object.freeze({
    id: 'url-encoder-decoder',
    category: 'developer',
    icon: '%',
    title: Object.freeze({ ar: 'ترميز وفك روابط URL', en: 'URL Encoder & Decoder' }),
    description: Object.freeze({ ar: 'رمّز النص للاستخدام داخل الروابط أو فك الترميز.', en: 'Encode text for URLs or decode URL-encoded content.' }),
    note: Object.freeze({ ar: 'يستخدم ترميز مكونات الرابط القياسي.', en: 'Uses standard URL component encoding.' }),
    inputs: Object.freeze([
        selectInput('operation', { ar: 'العملية', en: 'Operation' }, operationOptions),
        textInput('text', { ar: 'النص أو الرابط', en: 'Text or URL value' }, 'hello world'),
    ]),
    calculate(values, language) {
        try {
            return output(
                values.operation === 'encode'
                    ? encodeURIComponent(values.text)
                    : decodeURIComponent(values.text),
                localized(language, 'النتيجة', 'Result'),
            );
        } catch {
            throw new Error(localized(language, 'ترميز URL غير صالح.', 'Invalid URL-encoded input.'));
        }
    },
});

const htmlTool = Object.freeze({
    id: 'html-entity-encoder-decoder',
    category: 'developer',
    icon: '<>',
    title: Object.freeze({ ar: 'ترميز وفك HTML', en: 'HTML Entity Encoder & Decoder' }),
    description: Object.freeze({ ar: 'حوّل رموز HTML الحساسة إلى كيانات آمنة أو اعكس العملية.', en: 'Encode sensitive HTML characters or decode entities.' }),
    note: Object.freeze({ ar: 'يدعم الكيانات الأساسية الأكثر استخدامًا.', en: 'Supports the most common core HTML entities.' }),
    inputs: Object.freeze([
        selectInput('operation', { ar: 'العملية', en: 'Operation' }, operationOptions),
        textInput('text', { ar: 'HTML أو النص', en: 'HTML or text' }, '<h1>Adawaty</h1>'),
    ]),
    calculate(values, language) {
        const encoded = values.text
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
        const decoded = values.text
            .replaceAll('&lt;', '<')
            .replaceAll('&gt;', '>')
            .replaceAll('&quot;', '"')
            .replaceAll('&#39;', "'")
            .replaceAll('&amp;', '&');
        return output(
            values.operation === 'encode' ? encoded : decoded,
            localized(language, 'النتيجة', 'Result'),
        );
    },
});

const caseOptions = Object.freeze([
    { value: 'upper', label: { ar: 'أحرف كبيرة', en: 'UPPER CASE' } },
    { value: 'lower', label: { ar: 'أحرف صغيرة', en: 'lower case' } },
    { value: 'title', label: { ar: 'صيغة العنوان', en: 'Title Case' } },
    { value: 'sentence', label: { ar: 'صيغة الجملة', en: 'Sentence case' } },
]);

const caseConverter = Object.freeze({
    id: 'text-case-converter',
    category: 'text',
    icon: 'Aa',
    title: Object.freeze({ ar: 'محول حالة الأحرف', en: 'Text Case Converter' }),
    description: Object.freeze({ ar: 'حوّل النص بين الأحرف الكبيرة والصغيرة وصيغ العناوين.', en: 'Convert text between upper, lower, title and sentence case.' }),
    note: Object.freeze({ ar: 'لا يغير الأرقام أو علامات الترقيم.', en: 'Numbers and punctuation remain unchanged.' }),
    inputs: Object.freeze([
        selectInput('mode', { ar: 'الصيغة', en: 'Case style' }, caseOptions),
        textInput('text', { ar: 'النص', en: 'Text' }, 'a useful free tool'),
    ]),
    calculate(values, language) {
        const transforms = {
            upper: () => values.text.toLocaleUpperCase(language),
            lower: () => values.text.toLocaleLowerCase(language),
            title: () => values.text.toLocaleLowerCase(language).replace(
                /(^|\s)\p{L}/gu,
                (match) => match.toLocaleUpperCase(language),
            ),
            sentence: () => {
                const lower = values.text.toLocaleLowerCase(language);
                return lower.replace(
                    /(^|[.!?]\s+)\p{L}/gu,
                    (match) => match.toLocaleUpperCase(language),
                );
            },
        };
        return output(transforms[values.mode](), localized(language, 'النص المحوّل', 'Converted text'));
    },
});

function textStatistics(text) {
    const trimmed = text.trim();
    return {
        words: trimmed ? trimmed.split(/\s+/u).length : 0,
        characters: [...text].length,
        charactersWithoutSpaces: [...text.replaceAll(/\s/gu, '')].length,
        lines: text ? text.split(/\r?\n/u).length : 0,
    };
}

const wordCounter = Object.freeze({
    id: 'word-counter',
    category: 'text',
    icon: '123',
    title: Object.freeze({ ar: 'عداد الكلمات', en: 'Word Counter' }),
    description: Object.freeze({ ar: 'احسب الكلمات والحروف والأسطر في أي نص.', en: 'Count words, characters and lines in any text.' }),
    note: Object.freeze({ ar: 'تُفصل الكلمات حسب المسافات البيضاء.', en: 'Words are separated using whitespace.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, { ar: 'اكتب أو الصق النص هنا', en: 'Type or paste text here' })]),
    calculate(values, language) {
        const stats = textStatistics(values.text);
        return output(
            `${stats.words}`,
            localized(language, 'كلمة', 'words'),
            localized(
                language,
                `${stats.characters} حرف — ${stats.lines} سطر`,
                `${stats.characters} characters — ${stats.lines} lines`,
            ),
        );
    },
});

const characterCounter = Object.freeze({
    id: 'character-counter',
    category: 'text',
    icon: '#',
    title: Object.freeze({ ar: 'عداد الحروف', en: 'Character Counter' }),
    description: Object.freeze({ ar: 'احسب عدد الحروف مع المسافات وبدونها.', en: 'Count characters with and without spaces.' }),
    note: Object.freeze({ ar: 'يدعم Unicode والرموز التعبيرية.', en: 'Supports Unicode text and emoji.' }),
    inputs: Object.freeze([textInput('text', { ar: 'النص', en: 'Text' }, 'Adawaty tools')]),
    calculate(values, language) {
        const stats = textStatistics(values.text);
        return output(
            `${stats.characters}`,
            localized(language, 'حرف مع المسافات', 'characters with spaces'),
            localized(
                language,
                `${stats.charactersWithoutSpaces} حرف بدون مسافات`,
                `${stats.charactersWithoutSpaces} characters without spaces`,
            ),
        );
    },
});

const slugGenerator = Object.freeze({
    id: 'slug-generator',
    category: 'text',
    icon: '/-',
    title: Object.freeze({ ar: 'مولد Slug للروابط', en: 'Slug Generator' }),
    description: Object.freeze({ ar: 'حوّل العنوان إلى مسار URL نظيف وسهل القراءة.', en: 'Turn a title into a clean readable URL slug.' }),
    note: Object.freeze({ ar: 'يحافظ على الحروف العربية واللاتينية والأرقام.', en: 'Preserves Arabic, Latin letters and numbers.' }),
    inputs: Object.freeze([textInput('text', { ar: 'العنوان', en: 'Title' }, { ar: 'أفضل أدوات مجانية', en: 'Best free tools' })]),
    calculate(values, language) {
        const slug = values.text
            .normalize('NFKD')
            .replaceAll(/\p{M}/gu, '')
            .toLocaleLowerCase(language)
            .trim()
            .replaceAll(/[^\p{L}\p{N}]+/gu, '-')
            .replaceAll(/^-|-$/gu, '');
        return output(slug, localized(language, 'المسار المقترح', 'Generated slug'));
    },
});

const jwtDecoder = Object.freeze({
    id: 'jwt-decoder',
    category: 'developer',
    icon: 'JWT',
    title: Object.freeze({ ar: 'فك JWT', en: 'JWT Decoder' }),
    description: Object.freeze({ ar: 'اعرض Header وPayload لرمز JWT بدون إرسال البيانات.', en: 'Inspect a JWT header and payload locally.' }),
    note: Object.freeze({ ar: 'فك الرمز لا يتحقق من صحة التوقيع.', en: 'Decoding does not verify the token signature.' }),
    inputs: Object.freeze([textInput('token', { ar: 'رمز JWT', en: 'JWT token' }, 'eyJ...')]),
    calculate(values, language) {
        try {
            const parts = values.token.trim().split('.');
            if (parts.length !== 3) {
                throw new Error('parts');
            }
            const decodePart = (part) => {
                const base64 = part.replaceAll('-', '+').replaceAll('_', '/')
                    .padEnd(Math.ceil(part.length / 4) * 4, '=');
                return JSON.parse(decodeBase64(base64));
            };
            const decoded = {
                header: decodePart(parts[0]),
                payload: decodePart(parts[1]),
            };
            return output(
                JSON.stringify(decoded, null, 2),
                localized(language, 'محتوى الرمز', 'Decoded token'),
                localized(language, 'لم يتم التحقق من التوقيع.', 'Signature was not verified.'),
            );
        } catch {
            throw new Error(localized(language, 'رمز JWT غير صالح.', 'Invalid JWT token.'));
        }
    },
});

const timestampConverter = Object.freeze({
    id: 'unix-timestamp-converter',
    category: 'developer',
    icon: 'UTC',
    title: Object.freeze({ ar: 'محول Unix Timestamp', en: 'Unix Timestamp Converter' }),
    description: Object.freeze({ ar: 'حوّل التاريخ والوقت إلى Unix timestamp.', en: 'Convert a date and time to a Unix timestamp.' }),
    note: Object.freeze({ ar: 'يُفسر الإدخال حسب المنطقة الزمنية المحلية للمتصفح.', en: 'Input is interpreted in the browser local timezone.' }),
    inputs: Object.freeze([
        Object.freeze({
            id: 'dateTime',
            type: 'datetime-local',
            label: Object.freeze({ ar: 'التاريخ والوقت', en: 'Date and time' }),
            unit: Object.freeze({ ar: '', en: '' }),
        }),
    ]),
    calculate(values, language) {
        const date = new Date(values.dateTime);
        if (Number.isNaN(date.getTime())) {
            throw new Error(localized(language, 'التاريخ غير صالح.', 'Invalid date and time.'));
        }
        return output(
            `${Math.floor(date.getTime() / 1000)}`,
            localized(language, 'ثانية منذ Unix epoch', 'seconds since Unix epoch'),
            date.toISOString(),
        );
    },
});

const textDeveloperDefinitions = Object.freeze({
    'json-formatter': jsonFormatter,
    'base64-encoder-decoder': base64Tool,
    'url-encoder-decoder': urlTool,
    'html-entity-encoder-decoder': htmlTool,
    'text-case-converter': caseConverter,
    'word-counter': wordCounter,
    'character-counter': characterCounter,
    'slug-generator': slugGenerator,
    'jwt-decoder': jwtDecoder,
    'unix-timestamp-converter': timestampConverter,
});

export { textDeveloperDefinitions };

// END OF FILE
