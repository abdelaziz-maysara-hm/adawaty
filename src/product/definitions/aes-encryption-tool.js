function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function fileInputTextArea(id, ar, en, placeholder, rows = 6) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function passwordInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
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
        options: Object.freeze(options.map((option) => Object.freeze(option))),
    });
}

const PBKDF2_ITERATIONS = 200000; // OWASP's 2023+ minimum recommendation for PBKDF2-HMAC-SHA256
const SALT_LENGTH_BYTES = 16;
const IV_LENGTH_BYTES = 12; // AES-GCM's standard, recommended IV length (96 bits)

/**
 * Derives an AES-GCM key from a password + salt via PBKDF2, matching
 * the self-contained "salt + IV + ciphertext, all Base64-encoded
 * together" format used by every competitor tool researched
 * (kordu.tools, geekformat.com) -- the user only needs to remember
 * their password, not separately track a salt/IV.
 */
async function deriveKey(password, salt) {
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveKey'],
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
    );
}

function bufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(base64) {
    return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function encryptText(plainText, password) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
    const key = await deriveKey(password, salt);
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        new TextEncoder().encode(plainText),
    );

    // Self-contained payload: salt (16 bytes) + IV (12 bytes) + ciphertext, concatenated then Base64-encoded.
    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);
    return bufferToBase64(combined);
}

async function decryptText(encodedPayload, password) {
    let combined;
    try {
        combined = base64ToBuffer(encodedPayload.trim());
    } catch {
        throw new Error('INVALID_BASE64');
    }
    if (combined.length < SALT_LENGTH_BYTES + IV_LENGTH_BYTES) {
        throw new Error('PAYLOAD_TOO_SHORT');
    }

    const salt = combined.slice(0, SALT_LENGTH_BYTES);
    const iv = combined.slice(SALT_LENGTH_BYTES, SALT_LENGTH_BYTES + IV_LENGTH_BYTES);
    const ciphertext = combined.slice(SALT_LENGTH_BYTES + IV_LENGTH_BYTES);
    const key = await deriveKey(password, salt);

    try {
        const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
        return new TextDecoder().decode(plainBuffer);
    } catch {
        // AES-GCM authentication failure: wrong password, or the
        // ciphertext was tampered with/corrupted. Either way, a single
        // clear error rather than a cryptic low-level exception.
        throw new Error('DECRYPTION_FAILED');
    }
}

const aesEncryption = Object.freeze({
    id: 'aes-encryption',
    category: 'security-network',
    icon: 'AES',
    title: Object.freeze({
        ar: 'تشفير AES',
        en: 'AES Encryption',
    }),
    description: Object.freeze({
        ar: 'شفّر أو فك تشفير أي نص بمعيار AES-256-GCM المعتمد، باستخدام كلمة سر، مباشرة في متصفحك.',
        en: 'Encrypt or decrypt any text with industry-standard AES-256-GCM, using a password, directly in your browser.',
    }),
    note: Object.freeze({
        ar: 'يستخدم AES-256-GCM (تشفير موثّق يكتشف أي تلاعب بالنص المشفر) مع اشتقاق مفتاح PBKDF2 (200,000 تكرار). النتيجة تحتوي على كل ما يلزم لفك التشفير عدا كلمة السر؛ احتفظ بكلمة السر في مكان آمن، فلا يمكن استرجاع النص الأصلي بدونها.',
        en: 'Uses AES-256-GCM (authenticated encryption that detects any tampering with the ciphertext) with PBKDF2 key derivation (200,000 iterations). The result contains everything needed to decrypt except the password; keep your password safe, as the original text cannot be recovered without it.',
    }),
    inputs: Object.freeze([
        selectInput('mode', 'العملية', 'Operation', [
            { value: 'encrypt', label: { ar: 'تشفير', en: 'Encrypt' } },
            { value: 'decrypt', label: { ar: 'فك تشفير', en: 'Decrypt' } },
        ]),
        fileInputTextArea('text', 'النص', 'Text', 'اكتب النص هنا أو الصق النص المشفر لفك تشفيره...'),
        passwordInput('password', 'كلمة السر', 'Password', 'كلمة سر قوية'),
    ]),
    async process(values, language) {
        const text = (values.text ?? '').trim();
        const password = values.password ?? '';

        if (!text) {
            throw new Error(localized(language, 'اكتب نصًا أولًا.', 'Please enter some text first.'));
        }
        if (!password) {
            throw new Error(localized(language, 'اكتب كلمة سر أولًا.', 'Please enter a password first.'));
        }

        if (values.mode === 'decrypt') {
            let plainText;
            try {
                plainText = await decryptText(text, password);
            } catch (error) {
                if (error.message === 'INVALID_BASE64' || error.message === 'PAYLOAD_TOO_SHORT') {
                    throw new Error(localized(language, 'النص المُدخل ليس نصًا مشفرًا صالحًا لهذه الأداة.', 'The entered text is not a valid ciphertext produced by this tool.'));
                }
                throw new Error(localized(language, 'تعذّر فك التشفير. تأكد من صحة كلمة السر والنص المشفر.', 'Could not decrypt. Check that the password and ciphertext are correct.'));
            }
            return output(plainText, localized(language, 'النص الأصلي', 'Decrypted text'));
        }

        const cipherText = await encryptText(text, password);
        return output(cipherText, localized(language, 'النص المشفر (Base64)', 'Encrypted text (Base64)'));
    },
});

const aesEncryptionToolDefinitions = Object.freeze({
    [aesEncryption.id]: aesEncryption,
});

export { aesEncryptionToolDefinitions, deriveKey, encryptText, decryptText };

// END OF FILE
