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
        rows: 6,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
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

function base64UrlEncode(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

function base64UrlDecode(text) {
    const padded = text.replaceAll('-', '+').replaceAll('_', '/')
        .padEnd(text.length + ((4 - (text.length % 4)) % 4), '=');
    const binary = atob(padded);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function importHmacKey(secret, usage) {
    return crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        [usage],
    );
}

async function signJwtHs256(header, payload, secret) {
    const encoder = new TextEncoder();
    const headerPart = base64UrlEncode(encoder.encode(JSON.stringify(header)));
    const payloadPart = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
    const signingInput = `${headerPart}.${payloadPart}`;

    const key = await importHmacKey(secret, 'sign');
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(signingInput));
    const signaturePart = base64UrlEncode(new Uint8Array(signature));

    return `${signingInput}.${signaturePart}`;
}

const jwtEncoder = Object.freeze({
    id: 'jwt-encoder',
    category: 'developer',
    icon: 'JWT+',
    title: Object.freeze({ ar: 'إنشاء JWT وتوقيعه', en: 'JWT Encoder' }),
    description: Object.freeze({
        ar: 'أنشئ رمز JWT موقّعًا بخوارزمية HS256 من بيانات Payload وسر مشترك، لاختبار الأنظمة اللي بتتحقق من رموز JWT.',
        en: 'Build and sign an HS256 JWT from your payload data and a shared secret, for testing systems that verify JWT tokens.',
    }),
    note: Object.freeze({
        ar: 'يدعم خوارزمية HS256 فقط. السر يُستخدم محليًا لتوقيع الرمز ولا يُرسل لأي خادم.',
        en: 'Supports HS256 only. The secret is used locally to sign the token and is never sent to any server.',
    }),
    inputs: Object.freeze([
        textInput('payload', { ar: 'Payload (بصيغة JSON)', en: 'Payload (JSON)' }, '{"sub":"user123","role":"admin"}'),
        textFieldInput('secret', 'السر المشترك', 'Shared secret', 'my-secret-key'),
    ]),
    async calculate(values, language) {
        let payload;
        try {
            payload = JSON.parse(values.payload);
        } catch {
            throw new Error(localized(language, 'Payload ليس JSON صالحًا.', 'Payload is not valid JSON.'));
        }
        if (!values.secret || values.secret.trim().length === 0) {
            throw new Error(localized(language, 'أدخل السر المشترك.', 'Enter the shared secret.'));
        }

        const token = await signJwtHs256({ alg: 'HS256', typ: 'JWT' }, payload, values.secret);

        return output(
            token,
            localized(language, 'رمز JWT الموقّع جاهز', 'The signed JWT is ready'),
        );
    },
});

function checkExpiryStatus(payload, language) {
    if (typeof payload.exp !== 'number') {
        return localized(language, 'لا يحتوي على تاريخ انتهاء (exp)', 'No expiry (exp) claim present');
    }
    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowSeconds
        ? localized(language, 'ساري (لم ينتهِ بعد)', 'Valid (not yet expired)')
        : localized(language, 'منتهي الصلاحية', 'Expired');
}

const jwtInspector = Object.freeze({
    id: 'jwt-inspector',
    category: 'developer',
    icon: 'JWT?',
    title: Object.freeze({ ar: 'فحص JWT والتحقق من التوقيع', en: 'JWT Inspector' }),
    description: Object.freeze({
        ar: 'افحص رمز JWT بالكامل: اعرض Header وPayload، وتحقق من صحة التوقيع مقابل سر تدخله، واعرض حالة الانتهاء.',
        en: 'Fully inspect a JWT: view its header and payload, verify the signature against a secret you provide, and check its expiry status.',
    }),
    note: Object.freeze({
        ar: 'يدعم التحقق من توقيع HS256 فقط. كل الفحص يتم محليًا داخل متصفحك.',
        en: 'Signature verification supports HS256 only. Everything runs locally in your browser.',
    }),
    inputs: Object.freeze([
        textInput('token', { ar: 'رمز JWT', en: 'JWT token' }, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjMiLCJuYW1lIjoiQWRhd2F0eSJ9.c2lnbmF0dXJl'),
        textFieldInput('secret', 'السر (اختياري، للتحقق من التوقيع)', 'Secret (optional, to verify signature)', ''),
    ]),
    async calculate(values, language) {
        const parts = values.token.trim().split('.');
        if (parts.length !== 3) {
            throw new Error(localized(language, 'رمز JWT غير صالح: يجب أن يحتوي على 3 أجزاء.', 'Invalid JWT: must contain 3 parts.'));
        }

        let header;
        let payload;
        try {
            header = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
            payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));
        } catch {
            throw new Error(localized(language, 'تعذر فك ترميز الرمز.', 'Could not decode the token.'));
        }

        const expiryStatus = checkExpiryStatus(payload, language);
        let signatureStatus = localized(language, 'لم يُدخل سر للتحقق', 'No secret entered to verify');

        if (values.secret && values.secret.trim().length > 0) {
            if (header.alg !== 'HS256') {
                signatureStatus = localized(
                    language,
                    `الخوارزمية ${header.alg} غير مدعومة للتحقق (HS256 فقط)`,
                    `Algorithm ${header.alg} is not supported for verification (HS256 only)`,
                );
            } else {
                const signingInput = `${parts[0]}.${parts[1]}`;
                const key = await importHmacKey(values.secret, 'verify');
                const isValid = await crypto.subtle.verify(
                    'HMAC',
                    key,
                    base64UrlDecode(parts[2]),
                    new TextEncoder().encode(signingInput),
                );
                signatureStatus = isValid
                    ? localized(language, 'التوقيع صحيح ✓', 'Signature is valid \u2713')
                    : localized(language, 'التوقيع غير صحيح ✗', 'Signature is invalid \u2717');
            }
        }

        const report = [
            localized(language, '# Header', '# Header'),
            JSON.stringify(header, null, 2),
            '',
            localized(language, '# Payload', '# Payload'),
            JSON.stringify(payload, null, 2),
            '',
            `${localized(language, 'حالة الانتهاء', 'Expiry status')}: ${expiryStatus}`,
            `${localized(language, 'حالة التوقيع', 'Signature status')}: ${signatureStatus}`,
        ].join('\n');

        return output(
            report,
            localized(language, 'تقرير فحص JWT جاهز', 'JWT inspection report is ready'),
        );
    },
});

const REGEX_PRESETS = Object.freeze({
    email: '^[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}$',
    url: '^https?:\\/\\/[\\w.-]+\\.[a-zA-Z]{2,}(\\/\\S*)?$',
    egyptianPhone: '^01[0-2,5][0-9]{8}$',
    ipv4: '^(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)(\\.(25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]?\\d)){3}$',
    hexColor: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
    strongPassword: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^a-zA-Z\\d]).{8,}$',
});

const regexGenerator = Object.freeze({
    id: 'regex-generator',
    category: 'developer',
    icon: 'REGX',
    title: Object.freeze({ ar: 'مولّد أنماط Regex شائعة', en: 'Common Regex Generator' }),
    description: Object.freeze({
        ar: 'احصل على نمط Regex جاهز ومُختبر لحالات شائعة مثل البريد الإلكتروني والروابط وأرقام الهواتف، بدل كتابته من الصفر.',
        en: 'Get a ready, tested regex pattern for common cases like email, URLs, and phone numbers, instead of writing one from scratch.',
    }),
    note: Object.freeze({
        ar: 'الأنماط عامة وتغطي معظم الحالات الشائعة؛ راجعها لو احتجت قواعد أكثر صرامة لحالتك تحديدًا.',
        en: 'Patterns are general-purpose and cover most common cases; review them if your exact case needs stricter rules.',
    }),
    inputs: Object.freeze([
        selectInput('preset', 'النمط المطلوب', 'Pattern needed', [
            ['email', 'بريد إلكتروني', 'Email address'],
            ['url', 'رابط (URL)', 'URL'],
            ['egyptianPhone', 'رقم هاتف مصري', 'Egyptian phone number'],
            ['ipv4', 'عنوان IPv4', 'IPv4 address'],
            ['hexColor', 'لون HEX', 'HEX color'],
            ['strongPassword', 'كلمة مرور قوية (8+ أحرف، كبيرة وصغيرة ورقم ورمز)', 'Strong password (8+ chars, upper/lower/digit/symbol)'],
        ]),
    ]),
    calculate(values, language) {
        const pattern = REGEX_PRESETS[values.preset];
        return output(
            pattern,
            localized(language, 'نمط Regex جاهز', 'The regex pattern is ready'),
            localized(language, 'انسخه واستخدمه داخل new RegExp() أو أي محرك أنماط.', 'Copy it into new RegExp() or any pattern engine.'),
        );
    },
});

function generateRandomToken(length) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let token = '';
    for (let index = 0; index < length; index += 1) {
        token += alphabet[bytes[index] % alphabet.length];
    }
    return token;
}

const API_KEY_PREFIXES = Object.freeze({
    generic: 'key',
    live: 'live',
    test: 'test',
    secret: 'sk',
});

const apiKeyGenerator = Object.freeze({
    id: 'api-key-generator',
    category: 'developer',
    icon: 'KEY',
    title: Object.freeze({ ar: 'مولّد مفاتيح API تجريبية', en: 'API Key Generator' }),
    description: Object.freeze({
        ar: 'أنشئ مفتاح API عشوائيًا بصيغة شائعة (بادئة + نص عشوائي) لاستخدامه في بيانات اختبار أو نماذج أولية.',
        en: 'Generate a random API key in a common format (prefix + random text) for test data or prototypes.',
    }),
    note: Object.freeze({
        ar: 'هذا مفتاح عشوائي تجريبي فقط وليس مرتبطًا بأي خدمة حقيقية — لا يصلح كمفتاح إنتاج فعلي.',
        en: 'This is a random test key only, not tied to any real service \u2014 not suitable as an actual production key.',
    }),
    inputs: Object.freeze([
        selectInput('style', 'نمط البادئة', 'Prefix style', [
            ['generic', 'key_', 'key_'],
            ['live', 'live_', 'live_'],
            ['test', 'test_', 'test_'],
            ['secret', 'sk_', 'sk_'],
        ]),
        numberInput('length', 'طول الجزء العشوائي', 'Random part length', 32, { min: 16, max: 128, unit: { ar: 'حرف', en: 'chars' } }),
    ]),
    calculate(values, language) {
        const prefix = API_KEY_PREFIXES[values.style] ?? API_KEY_PREFIXES.generic;
        const key = `${prefix}_${generateRandomToken(Math.round(values.length))}`;
        return output(
            key,
            localized(language, 'المفتاح التجريبي جاهز', 'The test key is ready'),
        );
    },
});

const devToolsBatch3Definitions = Object.freeze({
    [jwtEncoder.id]: jwtEncoder,
    [jwtInspector.id]: jwtInspector,
    [regexGenerator.id]: regexGenerator,
    [apiKeyGenerator.id]: apiKeyGenerator,
});

export { devToolsBatch3Definitions };

// END OF FILE
