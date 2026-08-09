function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function textInput(id, ar, en, placeholder = '', type = 'text') {
    return Object.freeze({
        id,
        type,
        rows: type === 'textarea' ? 5 : undefined,
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
        options: Object.freeze(options.map(([value, labelAr, labelEn]) => Object.freeze({
            value,
            label: Object.freeze({ ar: labelAr, en: labelEn }),
        }))),
    });
}

function bytesToBase64(bytes) {
    let binary = '';
    for (const byte of bytes) binary += String.fromCharCode(byte);
    return btoa(binary);
}

function bufferToHex(buffer) {
    return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase();
}

async function createSriHash(file, algorithm = 'SHA-384') {
    const digest = await crypto.subtle.digest(algorithm, await file.arrayBuffer());
    return `${algorithm.toLowerCase().replace('-', '')}-${bytesToBase64(new Uint8Array(digest))}`;
}

function parsePwnedRange(body, suffix) {
    const normalized = suffix.toUpperCase();
    const match = String(body).split(/\r?\n/).find((line) => line.startsWith(`${normalized}:`));
    return match ? Number(match.split(':')[1]) || 0 : 0;
}

function buildCsp(values) {
    const directives = [
        `default-src ${values.defaultSource}`,
        `script-src ${values.scriptSource}`,
        `style-src ${values.styleSource}`,
        `img-src ${values.imageSource}`,
        "object-src 'none'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
    ];
    if (String(values.reportUri ?? '').trim()) {
        directives.push(`report-uri ${String(values.reportUri).trim()}`);
    }
    return directives.join('; ');
}

const passwordBreachChecker = Object.freeze({
    id: 'password-breach-checker',
    category: 'security-network',
    icon: 'HIBP',
    action: Object.freeze({ ar: 'افحص كلمة المرور', en: 'Check password' }),
    title: Object.freeze({ ar: 'فحص تسريب كلمة المرور', en: 'Password Breach Checker' }),
    description: Object.freeze({
        ar: 'تحقق مما إذا ظهرت كلمة مرور في تسريبات معروفة دون إرسالها كاملة أو إرسال بصمتها الكاملة.',
        en: 'Check whether a password appeared in known breaches without sending the password or its complete hash.',
    }),
    note: Object.freeze({
        ar: 'تستخدم الأداة واجهة Pwned Passwords بطريقة k-anonymity؛ يُرسل أول 5 رموز فقط من بصمة SHA-1، لذلك تحتاج اتصالًا بالإنترنت.',
        en: 'Uses the Pwned Passwords k-anonymity API: only the first 5 SHA-1 hash characters are sent, so an internet connection is required.',
    }),
    inputs: Object.freeze([
        textInput('password', 'كلمة المرور', 'Password', '', 'password'),
    ]),
    async calculate(values, language) {
        if (!values.password) throw new Error(localized(language, 'أدخل كلمة مرور لفحصها.', 'Enter a password to check.'));
        const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(values.password));
        const hash = bufferToHex(digest);
        const response = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, {
            headers: { 'Add-Padding': 'true' },
            referrerPolicy: 'no-referrer',
        });
        if (!response.ok) throw new Error(localized(language, 'تعذر الاتصال بخدمة فحص التسريبات.', 'Unable to reach the breach-check service.'));
        const count = parsePwnedRange(await response.text(), hash.slice(5));
        return {
            value: count ? count.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US') : localized(language, 'غير موجودة', 'Not found'),
            label: count ? localized(language, 'مرات الظهور في التسريبات', 'Times seen in breaches') : localized(language, 'لم تظهر في قاعدة البيانات', 'Not found in the breach database'),
            details: count
                ? localized(language, 'غيّر كلمة المرور فورًا ولا تستخدمها في حساب آخر.', 'Change this password now and do not reuse it elsewhere.')
                : localized(language, 'هذه نتيجة مطمئنة، لكنها لا تضمن أن كلمة المرور آمنة تمامًا.', 'This is reassuring, but does not guarantee the password is completely safe.'),
        };
    },
});

const sriHashGenerator = Object.freeze({
    id: 'sri-hash-generator',
    category: 'security-network',
    icon: 'SRI',
    action: Object.freeze({ ar: 'أنشئ بصمة SRI', en: 'Generate SRI hash' }),
    title: Object.freeze({ ar: 'مولد بصمة SRI للملفات', en: 'SRI Hash Generator' }),
    description: Object.freeze({ ar: 'أنشئ قيمة Subresource Integrity لملفات JavaScript وCSS محليًا.', en: 'Generate a Subresource Integrity value for JavaScript and CSS files locally.' }),
    note: Object.freeze({ ar: 'لا يغادر الملف جهازك. يُنصح باستخدام SHA-384 لمعظم موارد الويب.', en: 'The file never leaves your device. SHA-384 is recommended for most web resources.' }),
    inputs: Object.freeze([
        Object.freeze({ id: 'file', type: 'file', accept: '.js,.css,text/css,text/javascript,application/javascript', label: Object.freeze({ ar: 'اختر ملف JS أو CSS', en: 'Choose a JS or CSS file' }), unit: Object.freeze({ ar: '', en: '' }) }),
        selectInput('algorithm', 'خوارزمية البصمة', 'Hash algorithm', [
            ['SHA-384', 'SHA-384 (موصى بها)', 'SHA-384 (recommended)'],
            ['SHA-256', 'SHA-256', 'SHA-256'],
            ['SHA-512', 'SHA-512', 'SHA-512'],
        ]),
    ]),
    async process(values, language) {
        if (!values.file) throw new Error(localized(language, 'اختر ملفًا أولًا.', 'Choose a file first.'));
        const integrity = await createSriHash(values.file, values.algorithm);
        return { value: integrity, label: localized(language, 'قيمة integrity', 'Integrity value'), details: `integrity="${integrity}" crossorigin="anonymous"` };
    },
});

const cspHeaderGenerator = Object.freeze({
    id: 'csp-header-generator',
    category: 'security-network',
    icon: 'CSP',
    action: Object.freeze({ ar: 'أنشئ سياسة CSP', en: 'Generate CSP' }),
    title: Object.freeze({ ar: 'مولد ترويسة CSP', en: 'CSP Header Generator' }),
    description: Object.freeze({ ar: 'أنشئ ترويسة Content-Security-Policy آمنة كبداية لموقعك.', en: 'Build a secure Content-Security-Policy header as a starting point for your site.' }),
    note: Object.freeze({ ar: 'اختبر السياسة أولًا في وضع التقرير قبل تطبيقها على موقع إنتاجي.', en: 'Test the policy in report-only mode before enforcing it on a production site.' }),
    inputs: Object.freeze([
        selectInput('defaultSource', 'المصدر الافتراضي', 'Default source', [["'self'", 'نفس الموقع فقط', 'Same origin only'], ["'none'", 'حظر افتراضي', 'Block by default']]),
        selectInput('scriptSource', 'مصادر السكربت', 'Script sources', [["'self'", 'نفس الموقع فقط', 'Same origin only'], ["'self' https:", 'نفس الموقع وHTTPS', 'Same origin and HTTPS']]),
        selectInput('styleSource', 'مصادر التنسيق', 'Style sources', [["'self'", 'نفس الموقع فقط', 'Same origin only'], ["'self' 'unsafe-inline'", 'السماح بالتنسيق المضمن', 'Allow inline styles']]),
        selectInput('imageSource', 'مصادر الصور', 'Image sources', [["'self' data:", 'نفس الموقع وData URLs', 'Same origin and data URLs'], ["'self' data: https:", 'إضافة صور HTTPS', 'Also allow HTTPS images']]),
        textInput('reportUri', 'رابط تقارير المخالفات (اختياري)', 'Violation report URL (optional)', 'https://example.com/csp-report'),
    ]),
    calculate(values, language) {
        const policy = buildCsp(values);
        return { value: policy, label: localized(language, 'ترويسة CSP جاهزة', 'CSP header ready'), details: `Content-Security-Policy: ${policy}` };
    },
});

const popularSecurityToolDefinitions = Object.freeze({
    [passwordBreachChecker.id]: passwordBreachChecker,
    [sriHashGenerator.id]: sriHashGenerator,
    [cspHeaderGenerator.id]: cspHeaderGenerator,
});

export {
    buildCsp,
    createSriHash,
    parsePwnedRange,
    popularSecurityToolDefinitions,
};

// END OF FILE
