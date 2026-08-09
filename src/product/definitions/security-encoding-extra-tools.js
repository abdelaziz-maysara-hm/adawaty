function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value, label, details };
}

function textFieldInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function textAreaInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 4,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function numberInput(id, ar, en, placeholder, min, max, unit = '') {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 1,
        placeholder: String(placeholder),
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: unit, en: unit }),
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

function securityTool(config) {
    return Object.freeze({
        category: 'security-network',
        ...config,
    });
}

const HMAC_ALGORITHMS = Object.freeze({
    'SHA-1': 'SHA-1', 'SHA-256': 'SHA-256', 'SHA-384': 'SHA-384', 'SHA-512': 'SHA-512',
});

function bytesToHex(bytes) {
    return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function computeHmac(message, secret, hashAlgorithm) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: hashAlgorithm },
        false,
        ['sign'],
    );
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return bytesToHex(new Uint8Array(signature));
}

const hmacGenerator = securityTool({
    id: 'hmac-generator',
    icon: 'HMAC',
    title: Object.freeze({ ar: 'مولّد HMAC', en: 'HMAC Generator' }),
    description: Object.freeze({
        ar: 'احسب توقيع HMAC لرسالة نصية بمفتاح سري، للتحقق من سلامة البيانات وصحة مصدرها في الأنظمة والـ APIs.',
        en: 'Compute an HMAC signature for a text message using a secret key, for verifying data integrity and authenticity in systems and APIs.',
    }),
    note: Object.freeze({
        ar: 'يعمل بالكامل داخل متصفحك؛ المفتاح السري لا يُرسل لأي خادم.',
        en: 'Runs entirely in your browser; the secret key is never sent to any server.',
    }),
    inputs: Object.freeze([
        textAreaInput('message', 'الرسالة', 'Message', 'Hello, Adawaty!'),
        textFieldInput('secret', 'المفتاح السري', 'Secret key', 'my-secret-key'),
        selectInput('algorithm', 'خوارزمية الهاش', 'Hash algorithm', [
            ['SHA-256', 'SHA-256', 'SHA-256'],
            ['SHA-1', 'SHA-1', 'SHA-1'],
            ['SHA-384', 'SHA-384', 'SHA-384'],
            ['SHA-512', 'SHA-512', 'SHA-512'],
        ]),
    ]),
    async calculate(values, language) {
        if (!values.secret) {
            throw new Error(localized(language, 'أدخل المفتاح السري.', 'Enter the secret key.'));
        }
        const algorithm = HMAC_ALGORITHMS[values.algorithm] ?? 'SHA-256';
        const hmac = await computeHmac(values.message, values.secret, algorithm);
        return output(hmac, localized(language, 'توقيع HMAC جاهز', 'The HMAC signature is ready'));
    },
});

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/** RFC 4648 Base32, verified byte-for-byte against Python's base64.b32encode before use. */
function base32Encode(bytes) {
    let bits = '';
    for (const byte of bytes) bits += byte.toString(2).padStart(8, '0');
    let result = '';
    for (let index = 0; index < bits.length; index += 5) {
        const chunk = bits.slice(index, index + 5).padEnd(5, '0');
        result += BASE32_ALPHABET[parseInt(chunk, 2)];
    }
    while (result.length % 8 !== 0) result += '=';
    return result;
}

function base32Decode(text) {
    const clean = text.replace(/=+$/, '').toUpperCase();
    let bits = '';
    for (const character of clean) {
        const index = BASE32_ALPHABET.indexOf(character);
        if (index === -1) throw new Error('invalid character');
        bits += index.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let index = 0; index + 8 <= bits.length; index += 8) {
        bytes.push(parseInt(bits.slice(index, index + 8), 2));
    }
    return new Uint8Array(bytes);
}

const base32EncoderDecoder = securityTool({
    id: 'base32-encoder-decoder',
    icon: '32',
    title: Object.freeze({ ar: 'ترميز وفك Base32', en: 'Base32 Encoder & Decoder' }),
    description: Object.freeze({
        ar: 'رمّز نصًا إلى Base32 أو استعد النص الأصلي منه، الصيغة القياسية المستخدمة في مفاتيح التطبيقات ذات المصادقة الثنائية (RFC 4648).',
        en: 'Encode text to Base32 or decode it back, the standard format (RFC 4648) used in two-factor authentication app secret keys.',
    }),
    note: Object.freeze({
        ar: 'يدعم النصوص العربية وUnicode.',
        en: 'Supports Arabic and other Unicode text.',
    }),
    inputs: Object.freeze([
        selectInput('operation', 'العملية', 'Operation', [
            ['encode', 'ترميز', 'Encode'],
            ['decode', 'فك الترميز', 'Decode'],
        ]),
        textAreaInput('text', 'النص', 'Text', 'Adawaty'),
    ]),
    calculate(values, language) {
        try {
            if (values.operation === 'encode') {
                const bytes = new TextEncoder().encode(values.text);
                return output(base32Encode(bytes), localized(language, 'النتيجة', 'Result'));
            }
            const decodedBytes = base32Decode(values.text);
            return output(new TextDecoder().decode(decodedBytes), localized(language, 'النتيجة', 'Result'));
        } catch {
            throw new Error(localized(language, 'تعذر فك قيمة Base32.', 'Invalid Base32 input.'));
        }
    },
});

/** Standard IEEE 802.3 CRC-32, verified against Python's zlib.crc32 and a well-known reference value. */
let crcTable;
function getCrcTable() {
    if (crcTable) return crcTable;
    crcTable = new Array(256);
    for (let n = 0; n < 256; n += 1) {
        let c = n;
        for (let k = 0; k < 8; k += 1) {
            c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        }
        crcTable[n] = c;
    }
    return crcTable;
}

function computeCrc32(bytes) {
    const table = getCrcTable();
    let crc = 0xFFFFFFFF;
    for (const byte of bytes) {
        crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

const crc32Calculator = securityTool({
    id: 'crc32-calculator',
    icon: 'CRC',
    title: Object.freeze({ ar: 'حاسبة CRC32', en: 'CRC32 Calculator' }),
    description: Object.freeze({
        ar: 'احسب قيمة CRC32 لنص، خوارزمية تحقق سريعة وشائعة الاستخدام في ملفات ZIP وبروتوكولات الشبكات.',
        en: 'Compute a text\u2019s CRC32 value, a fast checksum algorithm commonly used in ZIP files and network protocols.',
    }),
    note: Object.freeze({
        ar: 'CRC32 للتحقق من الأخطاء العرضية فقط، وليس آمنًا تشفيريًا ولا يصلح للتحقق الأمني.',
        en: 'CRC32 is for detecting accidental errors only, not cryptographically secure and unsuitable for security verification.',
    }),
    inputs: Object.freeze([
        textAreaInput('text', 'النص', 'Text', 'Hello, Adawaty!'),
    ]),
    calculate(values, language) {
        const bytes = new TextEncoder().encode(values.text);
        const crc = computeCrc32(bytes);
        return output(crc.toString(16).padStart(8, '0'), localized(language, 'قيمة CRC32 (بصيغة Hex)', 'CRC32 value (hex)'));
    },
});

/**
 * TOTP per RFC 6238 (HMAC-SHA1 by default, the near-universal choice for
 * 2FA apps). Verified exactly against RFC 6238's own published test vector
 * (secret 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', time=59s, 8 digits, SHA-1)
 * before use: produced '94287082', matching the spec precisely.
 */
async function generateTotp(base32Secret, timeStepSeconds, digits, forTimeMs) {
    const keyBytes = base32Decode(base32Secret);
    const counter = Math.floor(forTimeMs / 1000 / timeStepSeconds);
    const counterBuffer = new ArrayBuffer(8);
    new DataView(counterBuffer).setUint32(4, counter, false);

    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const hmac = new Uint8Array(await crypto.subtle.sign('HMAC', key, counterBuffer));

    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary = ((hmac[offset] & 0x7f) << 24)
        | ((hmac[offset + 1] & 0xff) << 16)
        | ((hmac[offset + 2] & 0xff) << 8)
        | (hmac[offset + 3] & 0xff);
    const otp = binary % (10 ** digits);
    return String(otp).padStart(digits, '0');
}

const otpGenerator = securityTool({
    id: 'otp-generator',
    icon: 'OTP',
    title: Object.freeze({ ar: 'مولّد رمز مصادقة مؤقت (TOTP)', en: 'TOTP Code Generator' }),
    description: Object.freeze({
        ar: 'أنشئ رمز مصادقة ثنائية مؤقت (TOTP) من مفتاح سري بصيغة Base32، بنفس الطريقة المستخدمة في تطبيقات مثل Google Authenticator.',
        en: 'Generate a time-based one-time password (TOTP) from a Base32 secret key, the same method used by apps like Google Authenticator.',
    }),
    note: Object.freeze({
        ar: 'الرمز صالح لمدة 30 ثانية من وقت إنشائه فقط، ويتغيّر تلقائيًا بعدها.',
        en: 'The code is valid for 30 seconds from generation time only, then automatically changes.',
    }),
    inputs: Object.freeze([
        textFieldInput('secret', 'المفتاح السري (Base32)', 'Secret key (Base32)', 'JBSWY3DPEHPK3PXP'),
        numberInput('digits', 'عدد الأرقام', 'Number of digits', 6, 6, 8, ''),
    ]),
    async calculate(values, language) {
        if (!values.secret.trim()) {
            throw new Error(localized(language, 'أدخل المفتاح السري.', 'Enter the secret key.'));
        }
        try {
            const code = await generateTotp(values.secret.trim(), 30, Math.round(values.digits), Date.now());
            const secondsRemaining = 30 - (Math.floor(Date.now() / 1000) % 30);
            return output(
                code,
                localized(language, 'الرمز الحالي', 'Current code'),
                localized(language, `صالح لمدة ${secondsRemaining} ثانية أخرى`, `Valid for ${secondsRemaining} more seconds`),
            );
        } catch {
            throw new Error(localized(language, 'المفتاح السري غير صالح، تأكد أنه بصيغة Base32.', 'Invalid secret key, make sure it\u2019s in Base32 format.'));
        }
    },
});

function generateRandomPin(length) {
    const digits = new Uint8Array(length);
    crypto.getRandomValues(digits);
    return Array.from(digits, (byte) => byte % 10).join('');
}

const pinGenerator = securityTool({
    id: 'pin-generator',
    icon: 'PIN',
    title: Object.freeze({ ar: 'مولّد رقم PIN', en: 'PIN Generator' }),
    description: Object.freeze({
        ar: 'أنشئ رقم PIN عشوائيًا وآمنًا تشفيريًا بطول تختاره، لأقفال الشاشات أو حسابات تحتاج رمزًا رقميًا فقط.',
        en: 'Generate a cryptographically random PIN of a chosen length, for screen locks or accounts needing a numeric-only code.',
    }),
    note: Object.freeze({
        ar: 'يستخدم مولّد أرقام عشوائية آمن تشفيريًا (crypto.getRandomValues) داخل متصفحك.',
        en: 'Uses a cryptographically secure random number generator (crypto.getRandomValues) in your browser.',
    }),
    inputs: Object.freeze([
        numberInput('length', 'عدد الأرقام', 'Number of digits', 4, 3, 12, ''),
    ]),
    calculate(values, language) {
        return output(
            generateRandomPin(Math.round(values.length)),
            localized(language, 'رقم PIN الجديد جاهز', 'The new PIN is ready'),
        );
    },
});

const securityEncodingToolDefinitions = Object.freeze({
    [hmacGenerator.id]: hmacGenerator,
    [base32EncoderDecoder.id]: base32EncoderDecoder,
    [crc32Calculator.id]: crc32Calculator,
    [otpGenerator.id]: otpGenerator,
    [pinGenerator.id]: pinGenerator,
});

export { securityEncodingToolDefinitions };

// END OF FILE
