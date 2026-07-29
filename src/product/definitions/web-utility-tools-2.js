import { canvasToBlob, decodeImage, renderImage } from '../image-processing.js';

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function textInput(id, label, placeholder, rows = 4) {
    return Object.freeze({
        id, type: 'textarea', rows,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function shortTextInput(id, label, placeholder) {
    return Object.freeze({
        id, type: 'text',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id, type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze(option))),
    });
}

function fileOutput(blob, filename, language, arLabel, enLabel) {
    return {
        value: localized(language, 'جاهز للتنزيل', 'Ready to download'),
        label: localized(language, arLabel, enLabel),
        details: '',
        download: { blob, filename },
    };
}

function tool(config) {
    return Object.freeze({
        id: config.id,
        category: config.category ?? 'developer',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate: config.calculate,
        process: config.process,
    });
}

// --- Hash generator (MD5 via a pure-JS implementation, SHA-* via Web Crypto) ---

function md5(input) {
    function rotl(x, c) { return (x << c) | (x >>> (32 - c)); }
    function toBytesUtf8(str) { return new TextEncoder().encode(str); }

    const s = [
        7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
        5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
        4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
        6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
    ];
    const K = new Int32Array(64);
    for (let i = 0; i < 64; i += 1) {
        K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32);
    }

    const bytes = toBytesUtf8(input);
    const bitLength = bytes.length * 8;
    const withOne = new Uint8Array(((bytes.length + 8) >> 6) * 64 + 64);
    withOne.set(bytes);
    withOne[bytes.length] = 0x80;
    const view = new DataView(withOne.buffer);
    view.setUint32(withOne.length - 8, bitLength >>> 0, true);
    view.setUint32(withOne.length - 4, Math.floor(bitLength / 2 ** 32), true);

    let a0 = 0x67452301;
    let b0 = 0xefcdab89;
    let c0 = 0x98badcfe;
    let d0 = 0x10325476;

    for (let chunkStart = 0; chunkStart < withOne.length; chunkStart += 64) {
        const M = new Int32Array(16);
        for (let i = 0; i < 16; i += 1) {
            M[i] = view.getInt32(chunkStart + i * 4, true);
        }
        let [a, b, c, d] = [a0, b0, c0, d0];
        for (let i = 0; i < 64; i += 1) {
            let f;
            let g;
            if (i < 16) { f = (b & c) | (~b & d); g = i; } else if (i < 32) {
                f = (d & b) | (~d & c); g = (5 * i + 1) % 16;
            } else if (i < 48) { f = b ^ c ^ d; g = (3 * i + 5) % 16; } else {
                f = c ^ (b | ~d); g = (7 * i) % 16;
            }
            f = (f + a + K[i] + M[g]) | 0;
            a = d; d = c; c = b;
            b = (b + rotl(f, s[i])) | 0;
        }
        a0 = (a0 + a) | 0; b0 = (b0 + b) | 0; c0 = (c0 + c) | 0; d0 = (d0 + d) | 0;
    }

    const toHex = (n) => {
        const bytesLe = new Uint8Array(4);
        new DataView(bytesLe.buffer).setInt32(0, n, true);
        return [...bytesLe].map((byte) => byte.toString(16).padStart(2, '0')).join('');
    };
    return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0);
}

async function sha(algorithm, input) {
    const buffer = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest(algorithm, buffer);
    return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

const hashGenerator = tool({
    id: 'hash-generator',
    icon: '#',
    title: { ar: 'مولّد Hash (MD5 / SHA)', en: 'Hash Generator (MD5 / SHA)' },
    description: {
        ar: 'احسب بصمة MD5 أو SHA-1 أو SHA-256 أو SHA-512 لأي نص، للتحقق من سلامة الملفات أو النصوص.',
        en: 'Compute the MD5, SHA-1, SHA-256 or SHA-512 hash of any text — useful for verifying file or text integrity.',
    },
    note: {
        ar: 'MD5 وSHA-1 لم يعودا آمنين للاستخدامات الأمنية الحساسة (فقط للتحقق من السلامة)؛ استخدم SHA-256 أو أعلى لأي غرض أمني.',
        en: 'MD5 and SHA-1 are no longer secure for sensitive uses (integrity checks only); use SHA-256 or higher for anything security-related.',
    },
    inputs: [
        textInput('text', { ar: 'النص', en: 'Text' }, 'Adawaty'),
        selectInput('algorithm', { ar: 'الخوارزمية', en: 'Algorithm' }, [
            { value: 'MD5', label: { ar: 'MD5', en: 'MD5' } },
            { value: 'SHA-1', label: { ar: 'SHA-1', en: 'SHA-1' } },
            { value: 'SHA-256', label: { ar: 'SHA-256', en: 'SHA-256' } },
            { value: 'SHA-384', label: { ar: 'SHA-384', en: 'SHA-384' } },
            { value: 'SHA-512', label: { ar: 'SHA-512', en: 'SHA-512' } },
        ]),
    ],
    async process(values, language) {
        const hash = values.algorithm === 'MD5'
            ? md5(values.text)
            : await sha(values.algorithm, values.text);
        return output(hash, localized(language, values.algorithm, values.algorithm));
    },
});

// --- IBAN validator (MOD-97, ISO 7064) ---------------------------------

const ibanValidator = tool({
    id: 'iban-validator',
    icon: 'IBAN',
    title: { ar: 'التحقق من رقم IBAN', en: 'IBAN Validator' },
    description: {
        ar: 'تأكد من صحة تنسيق رقم الحساب المصرفي الدولي (IBAN) قبل استخدامه في التحويلات.',
        en: 'Check whether an International Bank Account Number (IBAN) is structurally valid before using it in a transfer.',
    },
    note: {
        ar: 'التحقق شكلي فقط (طول الدولة وخوارزمية MOD-97)، ولا يؤكد وجود الحساب فعليًا لدى البنك.',
        en: 'This only checks the structure and MOD-97 checksum; it does not confirm the account actually exists at the bank.',
    },
    inputs: [shortTextInput('iban', { ar: 'رقم IBAN', en: 'IBAN' }, 'EG380019000500000000263180002')],
    calculate(values, language) {
        const raw = values.iban.replace(/\s+/g, '').toUpperCase();
        const countryLengths = {
            EG: 29, SA: 24, AE: 23, DE: 22, FR: 27, GB: 22, IT: 27, ES: 24, NL: 18, TR: 26,
            JO: 30, KW: 30, QA: 29, BH: 22, LB: 28, PS: 29, MA: 28, TN: 24, DZ: 26, IQ: 23,
        };
        if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(raw)) {
            return output(
                localized(language, 'غير صالح', 'Invalid'),
                localized(language, 'التنسيق غير صحيح', 'Invalid format'),
            );
        }
        const country = raw.slice(0, 2);
        const expectedLength = countryLengths[country];
        if (expectedLength && raw.length !== expectedLength) {
            return output(
                localized(language, 'غير صالح', 'Invalid'),
                localized(language, `طول ${country} يجب أن يكون ${expectedLength} حرفًا (الحالي: ${raw.length})`, `${country} IBANs must be ${expectedLength} chars (got ${raw.length})`),
            );
        }
        const rearranged = raw.slice(4) + raw.slice(0, 4);
        const numeric = [...rearranged].map((char) => (/[0-9]/.test(char) ? char : String(char.charCodeAt(0) - 55))).join('');
        let remainder = 0;
        for (const digit of numeric) {
            remainder = (remainder * 10 + Number(digit)) % 97;
        }
        const isValid = remainder === 1;
        return output(
            localized(language, isValid ? 'صالح ✓' : 'غير صالح', isValid ? 'Valid ✓' : 'Invalid'),
            localized(language, `الدولة: ${country} — الطول: ${raw.length}`, `Country: ${country} — length: ${raw.length}`),
        );
    },
});

// --- ULID generator -------------------------------------------------------

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

function encodeTime(time, length) {
    let result = '';
    let remaining = time;
    for (let i = length - 1; i >= 0; i -= 1) {
        result = CROCKFORD[remaining % 32] + result;
        remaining = Math.floor(remaining / 32);
    }
    return result;
}

function encodeRandom(length) {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return [...bytes].map((byte) => CROCKFORD[byte % 32]).join('');
}

const ulidGenerator = tool({
    id: 'ulid-generator',
    icon: 'ULID',
    title: { ar: 'مولّد ULID', en: 'ULID Generator' },
    description: {
        ar: 'أنشئ معرّفات ULID فريدة وقابلة للترتيب زمنيًا كبديل لـ UUID في قواعد البيانات.',
        en: 'Generate unique, time-sortable ULID identifiers — a common UUID alternative for databases.',
    },
    note: {
        ar: 'يُنشأ بالكامل داخل متصفحك باستخدام مولّد أرقام عشوائي آمن.',
        en: 'Generated entirely in your browser using a cryptographically secure random source.',
    },
    inputs: [],
    calculate(_values, language) {
        const ulid = encodeTime(Date.now(), 10) + encodeRandom(16);
        return output(ulid, localized(language, 'ULID جديد', 'New ULID'));
    },
});

// --- Base58 encoder/decoder ------------------------------------------------

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes) {
    if (bytes.length === 0) return '';
    let leadingZeros = 0;
    while (leadingZeros < bytes.length && bytes[leadingZeros] === 0) leadingZeros += 1;
    let value = 0n;
    for (const byte of bytes) value = value * 256n + BigInt(byte);
    let output58 = '';
    while (value > 0n) {
        const remainder = value % 58n;
        value /= 58n;
        output58 = BASE58_ALPHABET[Number(remainder)] + output58;
    }
    return '1'.repeat(leadingZeros) + output58;
}

function base58Decode(text) {
    let value = 0n;
    for (const char of text) {
        const index = BASE58_ALPHABET.indexOf(char);
        if (index === -1) throw new Error('invalid base58 character');
        value = value * 58n + BigInt(index);
    }
    let leadingZeros = 0;
    while (leadingZeros < text.length && text[leadingZeros] === '1') leadingZeros += 1;
    const bytes = [];
    while (value > 0n) {
        bytes.unshift(Number(value % 256n));
        value /= 256n;
    }
    return new Uint8Array([...new Array(leadingZeros).fill(0), ...bytes]);
}

const base58Tool = tool({
    id: 'base58-encoder-decoder',
    icon: '58',
    title: { ar: 'ترميز وفك Base58', en: 'Base58 Encoder & Decoder' },
    description: {
        ar: 'رمّز النصوص إلى Base58 (المستخدم في عناوين البيتكوين) أو فك الترميز.',
        en: 'Encode text to Base58 (used in Bitcoin addresses) or decode it back.',
    },
    note: {
        ar: 'يتجنب Base58 الحروف المتشابهة بصريًا مثل 0/O وI/l.',
        en: 'Base58 avoids visually similar characters like 0/O and I/l.',
    },
    inputs: [
        selectInput('operation', { ar: 'العملية', en: 'Operation' }, [
            { value: 'encode', label: { ar: 'ترميز', en: 'Encode' } },
            { value: 'decode', label: { ar: 'فك الترميز', en: 'Decode' } },
        ]),
        textInput('text', { ar: 'النص', en: 'Text' }, 'Adawaty'),
    ],
    calculate(values, language) {
        try {
            if (values.operation === 'encode') {
                return output(base58Encode(new TextEncoder().encode(values.text)), localized(language, 'النتيجة', 'Result'));
            }
            return output(new TextDecoder().decode(base58Decode(values.text.trim())), localized(language, 'النتيجة', 'Result'));
        } catch {
            throw new Error(localized(language, 'قيمة Base58 غير صالحة.', 'Invalid Base58 input.'));
        }
    },
});

// --- Semver comparator -------------------------------------------------

function parseSemver(value) {
    const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?/.exec(value.trim());
    if (!match) return null;
    return {
        major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), pre: match[4] ?? '',
    };
}

function compareSemver(a, b) {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    if (a.patch !== b.patch) return a.patch - b.patch;
    if (a.pre === b.pre) return 0;
    if (a.pre === '') return 1;
    if (b.pre === '') return -1;
    return a.pre < b.pre ? -1 : 1;
}

const semverComparator = tool({
    id: 'semver-calculator',
    icon: 'semver',
    title: { ar: 'مقارنة إصدارات Semver', en: 'Semver Comparator' },
    description: {
        ar: 'قارن بين رقمي إصدار بنظام Semantic Versioning واعرف أيهما أحدث.',
        en: 'Compare two Semantic Versioning (semver) version numbers and see which is newer.',
    },
    note: {
        ar: 'يدعم صيغة major.minor.patch مع لاحقة ما قبل الإصدار (مثل 1.2.0-beta.1).',
        en: 'Supports major.minor.patch with an optional pre-release suffix (e.g. 1.2.0-beta.1).',
    },
    inputs: [
        shortTextInput('versionA', { ar: 'الإصدار الأول', en: 'Version A' }, '1.4.0'),
        shortTextInput('versionB', { ar: 'الإصدار الثاني', en: 'Version B' }, '1.4.0-beta.1'),
    ],
    calculate(values, language) {
        const a = parseSemver(values.versionA);
        const b = parseSemver(values.versionB);
        if (!a || !b) {
            throw new Error(localized(language, 'صيغة إصدار غير صحيحة، استخدم major.minor.patch.', 'Invalid version format, use major.minor.patch.'));
        }
        const comparison = compareSemver(a, b);
        const result = comparison === 0
            ? localized(language, 'الإصداران متساويان', 'Both versions are equal')
            : comparison > 0
                ? localized(language, `${values.versionA} أحدث`, `${values.versionA} is newer`)
                : localized(language, `${values.versionB} أحدث`, `${values.versionB} is newer`);
        return output(comparison === 0 ? '=' : comparison > 0 ? 'A > B' : 'A < B', result);
    },
});

// --- curl command generator -----------------------------------------------

const curlGenerator = tool({
    id: 'curl-command-generator',
    icon: 'curl',
    title: { ar: 'مولّد أوامر curl', en: 'curl Command Generator' },
    description: {
        ar: 'اكتب الرابط والـ headers والـ body وخلي الأداة تبني لك أمر curl جاهز للنسخ.',
        en: 'Fill in the URL, headers, and body, and get a ready-to-copy curl command.',
    },
    note: {
        ar: 'كل سطر في خانة الـ headers لازم يكون بصيغة Header: Value.',
        en: 'Each line in the headers box should look like Header: Value.',
    },
    inputs: [
        selectInput('method', { ar: 'الطريقة (Method)', en: 'Method' }, [
            { value: 'GET', label: { ar: 'GET', en: 'GET' } },
            { value: 'POST', label: { ar: 'POST', en: 'POST' } },
            { value: 'PUT', label: { ar: 'PUT', en: 'PUT' } },
            { value: 'PATCH', label: { ar: 'PATCH', en: 'PATCH' } },
            { value: 'DELETE', label: { ar: 'DELETE', en: 'DELETE' } },
        ]),
        shortTextInput('url', { ar: 'الرابط', en: 'URL' }, 'https://api.example.com/users'),
        textInput('headers', { ar: 'Headers (سطر لكل واحد)', en: 'Headers (one per line)' }, 'Content-Type: application/json\nAuthorization: Bearer TOKEN', 3),
        textInput('body', { ar: 'الـ Body (JSON اختياري)', en: 'Body (optional JSON)' }, '{\n  "name": "Adawaty"\n}', 4),
    ],
    calculate(values, language) {
        const parts = [`curl -X ${values.method} '${values.url}'`];
        const headerLines = values.headers.split('\n').map((line) => line.trim()).filter(Boolean);
        for (const line of headerLines) {
            parts.push(`  -H '${line.replace(/'/g, "'\\''")}'`);
        }
        const body = values.body.trim();
        if (body && values.method !== 'GET') {
            parts.push(`  -d '${body.replace(/'/g, "'\\''")}'`);
        }
        return output(parts.join(' \\\n'), localized(language, 'أمر curl', 'curl command'));
    },
});

// --- CSS beautifier ------------------------------------------------------

const cssBeautifier = tool({
    id: 'css-beautifier',
    icon: '{css}',
    title: { ar: 'تنسيق CSS', en: 'CSS Beautifier' },
    description: {
        ar: 'أعد تنسيق كود CSS المضغوط بمسافات بادئة وأسطر واضحة لسهولة القراءة.',
        en: 'Reformat minified or messy CSS with clear indentation and line breaks.',
    },
    note: {
        ar: 'تنسيق بسيط قائم على القواعد؛ لا يغيّر منطق الكود.',
        en: 'A simple rule-based formatter; it never changes the logic of the code.',
    },
    inputs: [textInput('code', { ar: 'كود CSS', en: 'CSS code' }, '.card{display:flex;padding:16px}.card h2{font-size:1.2rem;color:#111}', 10)],
    calculate(values, language) {
        let depth = 0;
        const tokens = values.code.replace(/\s+/g, ' ').trim().split(/(?<=[{;}])|(?=})/g);
        const lines = [];
        for (const rawToken of tokens) {
            const token = rawToken.trim();
            if (!token) continue;
            if (token === '}') {
                depth = Math.max(0, depth - 1);
                lines.push(`${'    '.repeat(depth)}}`);
            } else if (token.endsWith('{')) {
                lines.push(`${'    '.repeat(depth)}${token}`);
                depth += 1;
            } else {
                lines.push(`${'    '.repeat(depth)}${token}`);
            }
        }
        return output(lines.join('\n'), localized(language, 'الكود المنسّق', 'Formatted code'));
    },
});

// --- SVG to PNG converter --------------------------------------------------

function fileInput(id, label, accept) {
    return Object.freeze({
        id, type: 'file', accept,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
    });
}

function numberInput(id, label, placeholder, min, max) {
    return Object.freeze({
        id, type: 'number', min, max, step: 1,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: 'px', en: 'px' }),
        placeholder: String(placeholder),
    });
}

const svgToPngConverter = tool({
    id: 'svg-to-png-converter',
    category: 'image',
    icon: 'SVG',
    title: { ar: 'تحويل SVG إلى PNG', en: 'SVG to PNG Converter' },
    description: {
        ar: 'حوّل ملف SVG (رسم متجه) إلى صورة PNG بأي أبعاد تريدها.',
        en: 'Convert an SVG (vector) file to a raster PNG image at any size you choose.',
    },
    note: {
        ar: 'الخلفيات الشفافة في SVG تبقى شفافة في PNG الناتج.',
        en: 'Transparent SVG backgrounds stay transparent in the resulting PNG.',
    },
    inputs: [
        fileInput('svg', { ar: 'اختر ملف SVG', en: 'Choose an SVG file' }, 'image/svg+xml,.svg'),
        numberInput('width', { ar: 'العرض', en: 'Width' }, 512, 16, 4096),
        numberInput('height', { ar: 'الارتفاع', en: 'Height' }, 512, 16, 4096),
    ],
    async process(values, language) {
        const file = values.svg;
        if (!(file instanceof File)) {
            throw new Error(localized(language, 'اختر ملف SVG أولًا.', 'Choose an SVG file first.'));
        }
        const image = await decodeImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(values.width) || image.naturalWidth || 512;
        canvas.height = Math.round(values.height) || image.naturalHeight || 512;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await canvasToBlob(canvas, 'image/png');
        const base = file.name.replace(/\.svg$/i, '') || 'image';
        return fileOutput(blob, `${base}.png`, language, 'ملف PNG جاهز', 'PNG file is ready');
    },
});

// --- Color blindness simulator ---------------------------------------------

const CVD_MATRICES = {
    protanopia: [0.567, 0.433, 0, 0.558, 0.442, 0, 0, 0.242, 0.758],
    deuteranopia: [0.625, 0.375, 0, 0.7, 0.3, 0, 0, 0.3, 0.7],
    tritanopia: [0.95, 0.05, 0, 0, 0.433, 0.567, 0, 0.475, 0.525],
};

const colorBlindnessSimulator = tool({
    id: 'color-blindness-simulator',
    category: 'image',
    icon: 'CVD',
    title: { ar: 'محاكاة عمى الألوان', en: 'Color Blindness Simulator' },
    description: {
        ar: 'شوف كيف تظهر صورتك أو تصميمك لمن يعانون من أنواع عمى الألوان الشائعة.',
        en: 'See how your image or design appears to people with common types of color blindness.',
    },
    note: {
        ar: 'محاكاة تقريبية مبنية على مصفوفات تحويل ألوان معروفة، وليست بديلاً عن اختبار طبي.',
        en: 'An approximate simulation using well-known color transform matrices, not a medical test substitute.',
    },
    inputs: [
        fileInput('image', { ar: 'اختر صورة', en: 'Choose an image' }, 'image/*'),
        selectInput('type', { ar: 'نوع عمى الألوان', en: 'Color blindness type' }, [
            { value: 'protanopia', label: { ar: 'بروتانوبيا (عمى الأحمر)', en: 'Protanopia (red-blind)' } },
            { value: 'deuteranopia', label: { ar: 'ديوترانوبيا (عمى الأخضر)', en: 'Deuteranopia (green-blind)' } },
            { value: 'tritanopia', label: { ar: 'تريتانوبيا (عمى الأزرق)', en: 'Tritanopia (blue-blind)' } },
        ]),
    ],
    async process(values, language) {
        const file = values.image;
        if (!(file instanceof File)) {
            throw new Error(localized(language, 'اختر صورة أولًا.', 'Choose an image first.'));
        }
        const image = await decodeImage(file);
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const [m0, m1, m2, m3, m4, m5, m6, m7, m8] = CVD_MATRICES[values.type];
        const { data } = imageData;
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            data[i] = r * m0 + g * m1 + b * m2;
            data[i + 1] = r * m3 + g * m4 + b * m5;
            data[i + 2] = r * m6 + g * m7 + b * m8;
        }
        context.putImageData(imageData, 0, 0);
        const blob = await canvasToBlob(canvas, 'image/png');
        const base = file.name.replace(/\.[^.]+$/, '') || 'image';
        return fileOutput(blob, `${base}-${values.type}.png`, language, 'الصورة المحاكاة جاهزة', 'Simulated image is ready');
    },
});

const webUtility2Definitions = Object.freeze(Object.fromEntries([
    hashGenerator,
    ibanValidator,
    ulidGenerator,
    base58Tool,
    semverComparator,
    curlGenerator,
    cssBeautifier,
    svgToPngConverter,
    colorBlindnessSimulator,
].map((definition) => [definition.id, definition])));

export { webUtility2Definitions };
