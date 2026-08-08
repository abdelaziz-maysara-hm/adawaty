function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

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

function numberInput(id, ar, en, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1000,
        step: options.step ?? 1,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

/** Strips whitespace between tags and trims the whole document, without touching text content. */
function minifyXmlText(xml) {
    return xml
        .replaceAll(/>\s+</g, '><')
        .trim();
}

const xmlMinifier = Object.freeze({
    id: 'xml-minifier',
    category: 'developer',
    icon: 'XML-',
    title: Object.freeze({ ar: 'ضغط XML', en: 'XML Minifier' }),
    description: Object.freeze({
        ar: 'أزل المسافات والأسطر الفارغة بين وسوم XML لتقليل حجم الملف دون تغيير المحتوى النصي.',
        en: 'Remove whitespace and blank lines between XML tags to shrink file size without touching text content.',
    }),
    note: Object.freeze({
        ar: 'النص الفعلي داخل كل وسم يبقى كما هو دون أي تعديل.',
        en: 'The actual text inside each tag is left completely untouched.',
    }),
    inputs: Object.freeze([
        textInput('xml', { ar: 'XML', en: 'XML' }, '<root>\n  <item>Adawaty</item>\n</root>'),
    ]),
    calculate(values, language) {
        if (!values.xml.trim()) {
            throw new Error(localized(language, 'أدخل محتوى XML.', 'Enter some XML content.'));
        }

        const minified = minifyXmlText(values.xml);
        const savedBytes = values.xml.length - minified.length;
        const savedPercent = values.xml.length > 0
            ? Math.round((savedBytes / values.xml.length) * 100)
            : 0;

        return output(
            minified,
            localized(language, 'XML المضغوط جاهز', 'The minified XML is ready'),
            localized(
                language,
                `تم توفير ${savedBytes} حرفًا (${savedPercent}%)`,
                `Saved ${savedBytes} characters (${savedPercent}%)`,
            ),
        );
    },
});

function generateRandomId(length, alphabet) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let id = '';
    for (let index = 0; index < length; index += 1) {
        id += alphabet[bytes[index] % alphabet.length];
    }
    return id;
}

const NANOID_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

const nanoidGenerator = Object.freeze({
    id: 'nanoid-generator',
    category: 'developer',
    icon: 'ID',
    title: Object.freeze({ ar: 'مولّد Nano ID', en: 'Nano ID Generator' }),
    description: Object.freeze({
        ar: 'أنشئ معرّفًا فريدًا عشوائيًا وآمنًا بطول قابل للتخصيص، بديل أقصر من UUID لأغراض كثيرة.',
        en: 'Generate a cryptographically random, URL-safe unique ID with a customizable length \u2014 a shorter alternative to UUID for many uses.',
    }),
    note: Object.freeze({
        ar: 'يستخدم مولّد أرقام عشوائية آمن تشفيريًا (crypto.getRandomValues) داخل متصفحك.',
        en: 'Uses a cryptographically secure random number generator (crypto.getRandomValues) in your browser.',
    }),
    inputs: Object.freeze([
        numberInput('length', 'طول المعرّف', 'ID length', 21, { min: 4, max: 128, unit: { ar: 'حرف', en: 'chars' } }),
    ]),
    calculate(values, language) {
        const length = Math.round(values.length);
        return output(
            generateRandomId(length, NANOID_ALPHABET),
            localized(language, 'المعرّف الجديد جاهز', 'The new ID is ready'),
        );
    },
});

const xmlAndIdToolDefinitions = Object.freeze({
    [xmlMinifier.id]: xmlMinifier,
    [nanoidGenerator.id]: nanoidGenerator,
});

export { xmlAndIdToolDefinitions };

// END OF FILE
