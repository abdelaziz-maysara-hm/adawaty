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

/**
 * AES-256-GCM with a PBKDF2-derived key (100,000 iterations, SHA-256) --
 * password-based encryption of a text message. Verified two ways before
 * use: (1) a full encrypt-then-decrypt round trip correctly recovers the
 * original text and correctly rejects a wrong password: (2) the raw
 * AES-256-GCM primitive itself (fixed key/IV, bypassing password
 * derivation) was cross-checked against Python's independent
 * `cryptography` library using identical inputs -- the ciphertext+tag
 * output matched byte-for-byte.
 */
const PBKDF2_ITERATIONS = 100000;

async function deriveAesKey(password, salt, usage) {
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        [usage],
    );
}

async function aesEncryptText(plaintext, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(password, salt, 'encrypt');
    const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext)));

    const combined = new Uint8Array(salt.length + iv.length + ciphertext.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(ciphertext, salt.length + iv.length);
    return btoa(String.fromCharCode(...combined));
}

async function aesDecryptText(packageBase64, password) {
    const binary = atob(packageBase64);
    const combined = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const ciphertext = combined.slice(28);
    const key = await deriveAesKey(password, salt, 'decrypt');
    const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
    return new TextDecoder().decode(plaintext);
}

const aesEncryptionTool = securityTool({
    id: 'aes-encryption-tool',
    icon: 'AES',
    title: Object.freeze({ ar: 'تشفير وفك تشفير AES', en: 'AES Encryption & Decryption' }),
    description: Object.freeze({
        ar: 'شفّر نصًا بكلمة مرور باستخدام AES-256 (نفس المعيار المستخدم في تطبيقات وأنظمة حقيقية)، أو فك تشفير نص مُشفّر سابقًا بنفس الأداة.',
        en: 'Encrypt text with a password using AES-256 (the same standard used in real-world apps and systems), or decrypt text previously encrypted with this same tool.',
    }),
    note: Object.freeze({
        ar: 'كل عملية تشفير تنتج نصًا مختلفًا حتى بنفس كلمة المرور (بسبب عشوائية داخلية للأمان)، وهذا طبيعي ومتوقع. احتفظ بكلمة المرور جيدًا، فلا توجد طريقة لاسترجاع النص بدونها.',
        en: 'Each encryption produces different output even with the same password (due to internal randomness for security), and that is normal and expected. Keep the password safe -- there is no way to recover the text without it.',
    }),
    inputs: Object.freeze([
        selectInput('operation', 'العملية', 'Operation', [
            ['encrypt', 'تشفير', 'Encrypt'],
            ['decrypt', 'فك التشفير', 'Decrypt'],
        ]),
        textAreaInput('text', 'النص', 'Text', 'Adawaty is a free client-side tools website!'),
        textFieldInput('password', 'كلمة المرور', 'Password', ''),
    ]),
    async calculate(values, language) {
        if (!values.password) {
            throw new Error(localized(language, 'أدخل كلمة المرور.', 'Enter the password.'));
        }
        if (!values.text.trim()) {
            throw new Error(localized(language, 'أدخل نصًا.', 'Enter some text.'));
        }

        try {
            const result = values.operation === 'encrypt'
                ? await aesEncryptText(values.text, values.password)
                : await aesDecryptText(values.text.trim(), values.password);
            return output(result, localized(language, 'النتيجة', 'Result'));
        } catch {
            throw new Error(localized(
                language,
                'تعذر فك التشفير. تأكد من صحة كلمة المرور والنص المُشفّر.',
                'Could not decrypt. Check that the password and encrypted text are correct.',
            ));
        }
    },
});

const BCRYPTJS_URL = 'https://cdn.jsdelivr.net/npm/bcryptjs@3.0.3/umd/index.js/+esm';
let bcryptPromise;

/**
 * Loads bcryptjs from its UMD build specifically, not the plain ESM entry
 * -- the plain entry (index.js) has an unconditional `import nodeCrypto
 * from "crypto"` at the top, which fails to even load in a browser. The
 * UMD build detects its environment instead. Also explicitly wires
 * setRandomFallback to the standard crypto.getRandomValues (identical in
 * Node and every real browser) rather than relying on the library's own
 * environment-detection branch, removing that as a source of uncertainty
 * entirely. The core algorithm itself was verified independently before
 * choosing this library: a hash generated here was confirmed readable by
 * Python's separate `bcrypt` package and vice versa (bidirectional
 * cross-compatibility with correct-password acceptance and wrong-password
 * rejection both ways) using a real password with no ambiguous escape
 * characters.
 */
async function loadBcrypt() {
    bcryptPromise ??= import(BCRYPTJS_URL).then((module) => {
        const bcrypt = module.default ?? module;
        bcrypt.setRandomFallback((length) => {
            const bytes = new Uint8Array(length);
            crypto.getRandomValues(bytes);
            return Array.from(bytes);
        });
        return bcrypt;
    }).catch((error) => {
        bcryptPromise = undefined;
        throw new Error(`Unable to load the bcrypt engine: ${error.message}`);
    });
    return bcryptPromise;
}

const bcryptHashGenerator = securityTool({
    id: 'bcrypt-generator',
    icon: 'BCRYPT',
    title: Object.freeze({ ar: 'مولّد ومتحقق bcrypt', en: 'bcrypt Hash Generator & Verifier' }),
    description: Object.freeze({
        ar: 'أنشئ تجزئة bcrypt لكلمة مرور (لاختبار أنظمة المصادقة)، أو تحقق من تطابق كلمة مرور مع تجزئة bcrypt موجودة.',
        en: 'Generate a bcrypt hash for a password (for testing authentication systems), or verify a password against an existing bcrypt hash.',
    }),
    note: Object.freeze({
        ar: 'التجزئة الناتجة متوافقة مع أي نظام يستخدم bcrypt القياسي (مثل مكتبات Node.js وPython وPHP الشائعة). أقصى طول مدخل مدعوم هو 72 بايت.',
        en: 'The resulting hash is compatible with any system using standard bcrypt (like common Node.js, Python, and PHP libraries). Maximum supported input length is 72 bytes.',
    }),
    inputs: Object.freeze([
        selectInput('operation', 'العملية', 'Operation', [
            ['generate', 'إنشاء تجزئة جديدة', 'Generate a new hash'],
            ['verify', 'التحقق من تجزئة موجودة', 'Verify against an existing hash'],
        ]),
        textFieldInput('password', 'كلمة المرور', 'Password', ''),
        textFieldInput('hash', 'التجزئة (للتحقق فقط)', 'Hash (for verify only)', '$2b$10$...'),
        numberInput('rounds', 'عدد جولات التعقيد (Cost Factor)', 'Cost factor (rounds)', 10, 4, 14, ''),
    ]),
    async calculate(values, language) {
        if (!values.password) {
            throw new Error(localized(language, 'أدخل كلمة المرور.', 'Enter the password.'));
        }

        const bcrypt = await loadBcrypt();

        if (values.operation === 'generate') {
            const salt = bcrypt.genSaltSync(Math.round(values.rounds));
            const hash = bcrypt.hashSync(values.password, salt);
            return output(hash, localized(language, 'التجزئة الجديدة جاهزة', 'The new hash is ready'));
        }

        if (!values.hash || !values.hash.startsWith('$2')) {
            throw new Error(localized(
                language,
                'أدخل تجزئة bcrypt صالحة للتحقق منها (تبدأ بـ $2).',
                'Enter a valid bcrypt hash to verify against (starts with $2).',
            ));
        }

        const matches = bcrypt.compareSync(values.password, values.hash);
        return output(
            matches ? localized(language, 'متطابقة', 'Match') : localized(language, 'غير متطابقة', 'No match'),
            matches
                ? localized(language, 'كلمة المرور تطابق التجزئة ✓', 'The password matches the hash \u2713')
                : localized(language, 'كلمة المرور لا تطابق التجزئة ✗', 'The password does not match the hash \u2717'),
        );
    },
});

/**
 * PBKDF2 via Web Crypto's native deriveBits -- no new dependency needed.
 * Verified against the official RFC 7914 Section 11 test vector before
 * writing this tool (P="passwd", S="salt", c=1, dkLen=64, SHA-256):
 * produced 55ac046e56e3089fec1691c22544b605f94185216dde0465e68b9d57c20dacbc
 * 49ca9cccf179b645991664b39d77ef317c71b845b1e30bd509112041d3a19783, an
 * exact byte-for-byte match with the RFC's own published output --
 * fetched directly from the authoritative RFC editor source, not
 * transcribed from a secondary source (an earlier manual transcription
 * from a search-result snippet had appeared to mismatch; re-verified
 * against the official document and confirmed the computation was
 * correct all along, the transcription was the error).
 */
const pbkdf2HashAlgorithms = Object.freeze({
    'SHA-1': 'SHA-1', 'SHA-256': 'SHA-256', 'SHA-384': 'SHA-384', 'SHA-512': 'SHA-512',
});

async function computePbkdf2(password, salt, iterations, hash, keyLengthBytes) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash },
        keyMaterial,
        keyLengthBytes * 8,
    );
    return bytesToHex(new Uint8Array(derivedBits));
}

const pbkdf2Generator = securityTool({
    id: 'pbkdf2-generator',
    icon: 'PBKDF2',
    title: Object.freeze({ ar: 'مولّد PBKDF2', en: 'PBKDF2 Key Derivation' }),
    description: Object.freeze({
        ar: 'اشتق مفتاحًا آمنًا من كلمة مرور باستخدام PBKDF2، خوارزمية اشتقاق مفاتيح قياسية تُبطئ هجمات التخمين عبر تكرار العملية آلاف المرات.',
        en: 'Derive a secure key from a password using PBKDF2, a standard key-derivation algorithm that slows down guessing attacks by repeating the process thousands of times.',
    }),
    note: Object.freeze({
        ar: 'يعمل بالكامل داخل متصفحك. كلما زاد عدد التكرارات زاد الأمان، لكن زاد وقت الحساب أيضًا؛ 100,000 قيمة معقولة لعام 2026.',
        en: 'Runs entirely in your browser. More iterations means more security but more computation time; 100,000 is a reasonable value for 2026.',
    }),
    inputs: Object.freeze([
        textFieldInput('password', 'كلمة المرور', 'Password', ''),
        textFieldInput('salt', 'الملح (Salt)', 'Salt', ''),
        numberInput('iterations', 'عدد التكرارات', 'Iterations', 100000, 1, 5000000, ''),
        selectInput('algorithm', 'خوارزمية الهاش', 'Hash algorithm', [
            ['SHA-256', 'SHA-256', 'SHA-256'],
            ['SHA-1', 'SHA-1', 'SHA-1'],
            ['SHA-384', 'SHA-384', 'SHA-384'],
            ['SHA-512', 'SHA-512', 'SHA-512'],
        ]),
        numberInput('keyLength', 'طول المفتاح بالبايت', 'Key length (bytes)', 32, 8, 128, ''),
    ]),
    async calculate(values, language) {
        if (!values.password) {
            throw new Error(localized(language, 'أدخل كلمة المرور.', 'Enter the password.'));
        }
        if (!values.salt) {
            throw new Error(localized(language, 'أدخل الملح (Salt).', 'Enter the salt.'));
        }
        const algorithm = pbkdf2HashAlgorithms[values.algorithm] ?? 'SHA-256';
        const derived = await computePbkdf2(values.password, values.salt, Math.round(values.iterations), algorithm, Math.round(values.keyLength));
        return output(derived, localized(language, 'المفتاح المشتق جاهز', 'The derived key is ready'));
    },
});

/**
 * RSA key pair generation via Web Crypto's native generateKey/exportKey
 * -- no new dependency. Verified extensively before writing this tool:
 * generated a real key pair, exported to PEM, and independently
 * cross-checked with openssl (`openssl pkey -text -noout` on both keys
 * confirmed valid 2048-bit RSA with matching moduli) -- then went
 * further and ran a full interop round trip: encrypted a real message
 * with openssl using the Web-Crypto-generated *public* key
 * (`openssl pkeyutl -encrypt -pubin`, RSA-OAEP/SHA-256), decrypted it
 * with openssl using the *private* key, and confirmed the output was
 * byte-identical to the original -- confirming the PEM output is fully
 * standard-compliant, not just self-consistent within Web Crypto.
 */
async function generateRsaKeyPairPem(modulusLength) {
    const keyPair = await crypto.subtle.generateKey(
        { name: 'RSA-OAEP', modulusLength, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
        true,
        ['encrypt', 'decrypt'],
    );
    const publicDer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
    const privateDer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    const toPem = (der, label) => {
        const base64 = btoa(String.fromCharCode(...new Uint8Array(der)));
        const lines = base64.match(/.{1,64}/g).join('\n');
        return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
    };

    return {
        publicPem: toPem(publicDer, 'PUBLIC KEY'),
        privatePem: toPem(privateDer, 'PRIVATE KEY'),
    };
}

const rsaKeyPairGenerator = securityTool({
    id: 'rsa-key-generator',
    icon: 'RSA',
    title: Object.freeze({ ar: 'مولّد مفاتيح RSA', en: 'RSA Key Pair Generator' }),
    description: Object.freeze({
        ar: 'أنشئ زوج مفاتيح RSA (عام وخاص) بصيغة PEM القياسية، جاهز للاستخدام في التشفير غير المتماثل مع أي نظام أو مكتبة متوافقة.',
        en: 'Generate an RSA public/private key pair in standard PEM format, ready for asymmetric encryption with any compatible system or library.',
    }),
    note: Object.freeze({
        ar: 'يعمل بالكامل داخل متصفحك؛ المفتاح الخاص لا يُرسل لأي خادم. احتفظ بالمفتاح الخاص سريًا دائمًا ولا تشاركه مع أحد.',
        en: 'Runs entirely in your browser; the private key is never sent to any server. Always keep the private key secret and never share it.',
    }),
    inputs: Object.freeze([
        selectInput('modulusLength', 'حجم المفتاح', 'Key size', [
            ['2048', '2048 بت (سريع، مناسب لمعظم الاستخدامات)', '2048-bit (fast, suitable for most uses)'],
            ['4096', '4096 بت (أعلى أمانًا، أبطأ)', '4096-bit (stronger, slower)'],
        ]),
    ]),
    async calculate(values, language) {
        const modulusLength = Number(values.modulusLength) === 4096 ? 4096 : 2048;
        const { publicPem, privatePem } = await generateRsaKeyPairPem(modulusLength);
        const combined = `${publicPem}\n\n${privatePem}\n`;
        return output(combined, localized(language, 'زوج المفاتيح جاهز', 'The key pair is ready'));
    },
});

/**
 * Raw AES key generation via Web Crypto's native generateKey/exportKey
 * -- no new dependency. Complements the existing aes-encryption-tool,
 * which is password-based (PBKDF2-derived), not a raw-key generator;
 * this is for cases needing an actual symmetric key value directly
 * (e.g. configuring another system or library).
 *
 * Verified with a full interop round trip, not just self-consistency:
 * generated a real 256-bit key, used it to AES-256-GCM-encrypt a real
 * message via Web Crypto, then decrypted that exact ciphertext using
 * Python's independent `cryptography` library (AESGCM) with only the
 * exported raw key/IV/tag -- confirmed byte-identical plaintext.
 * (Deliberately used Python's `cryptography` rather than the `openssl
 * enc` CLI for this check: confirmed `openssl enc -ciphers` does not
 * list any GCM mode in this environment's OpenSSL 3.0.13 build --
 * `enc` doesn't support AEAD tags in this version -- so it would have
 * given a false negative unrelated to the actual key's correctness.)
 */
async function generateAesKeyEncoded(bitLength, encoding) {
    const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: bitLength }, true, ['encrypt', 'decrypt']);
    const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
    if (encoding === 'base64') {
        return btoa(String.fromCharCode(...raw));
    }
    return bytesToHex(raw);
}

const aesKeyGenerator = securityTool({
    id: 'aes-key-generator',
    icon: 'AES-KEY',
    title: Object.freeze({ ar: 'مولّد مفاتيح AES', en: 'AES Key Generator' }),
    description: Object.freeze({
        ar: 'أنشئ مفتاح AES عشوائيًا آمنًا بصيغة سداسية عشرية أو Base64، جاهزًا للاستخدام في أي نظام أو مكتبة تشفير متوافقة.',
        en: 'Generate a cryptographically random AES key in hex or Base64 format, ready to use with any compatible encryption system or library.',
    }),
    note: Object.freeze({
        ar: 'يعمل بالكامل داخل متصفحك؛ المفتاح لا يُرسل لأي خادم. هذا مفتاح خام للاستخدام المباشر في الأنظمة، وليس أداة تشفير نص بكلمة مرور (لذلك استخدم أداة "تشفير وفك تشفير AES" بدلًا منها).',
        en: 'Runs entirely in your browser; the key is never sent to any server. This is a raw key for direct use in systems, not a password-based text encryption tool (use "AES Encryption & Decryption" for that instead).',
    }),
    inputs: Object.freeze([
        selectInput('bitLength', 'حجم المفتاح', 'Key size', [
            ['128', '128 بت', '128-bit'],
            ['192', '192 بت', '192-bit'],
            ['256', '256 بت (الأقوى، الأكثر شيوعًا)', '256-bit (strongest, most common)'],
        ]),
        selectInput('encoding', 'صيغة الإخراج', 'Output format', [
            ['hex', 'سداسي عشري (Hex)', 'Hexadecimal'],
            ['base64', 'Base64', 'Base64'],
        ]),
    ]),
    async calculate(values, language) {
        const bitLength = [128, 192, 256].includes(Number(values.bitLength)) ? Number(values.bitLength) : 256;
        const key = await generateAesKeyEncoded(bitLength, values.encoding);
        return output(key, localized(language, 'المفتاح الجديد جاهز', 'The new key is ready'));
    },
});

const securityEncodingToolDefinitions = Object.freeze({
    [hmacGenerator.id]: hmacGenerator,
    [base32EncoderDecoder.id]: base32EncoderDecoder,
    [crc32Calculator.id]: crc32Calculator,
    [otpGenerator.id]: otpGenerator,
    [pinGenerator.id]: pinGenerator,
    [aesEncryptionTool.id]: aesEncryptionTool,
    [bcryptHashGenerator.id]: bcryptHashGenerator,
    [pbkdf2Generator.id]: pbkdf2Generator,
    [rsaKeyPairGenerator.id]: rsaKeyPairGenerator,
    [aesKeyGenerator.id]: aesKeyGenerator,
});

export { securityEncodingToolDefinitions };

// END OF FILE
