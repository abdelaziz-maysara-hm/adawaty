const QRCODE_URL = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.4/+esm';
let qrCodePromise;

function loadQrCode() {
    qrCodePromise ??= import(QRCODE_URL).then((module) => module.default ?? module);
    return qrCodePromise;
}

function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function textInput(id, label, placeholder, rows = 8) {
    return Object.freeze({
        id, type: 'textarea', rows,
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

function numberInput(id, label, placeholder, min, max, step = 1) {
    return Object.freeze({
        id, type: 'number', min, max, step,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
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

// --- Regex tester -----------------------------------------------------

const regexTester = tool({
    id: 'regex-tester',
    icon: '/re/',
    title: { ar: 'اختبار Regex', en: 'Regex Tester' },
    description: {
        ar: 'جرّب تعبيرات نمطية (Regular Expressions) على نص واعرف كل المطابقات فورًا.',
        en: 'Test regular expressions against sample text and see every match instantly.',
    },
    note: {
        ar: 'كل المعالجة تتم في متصفحك، النص لا يُرفع لأي خادم.',
        en: 'All processing happens in your browser; the text is never uploaded.',
    },
    inputs: [
        textInput('pattern', { ar: 'التعبير النمطي (Pattern)', en: 'Pattern' }, '\\b[\\w.-]+@[\\w.-]+\\.\\w+\\b', 2),
        textInput('flags', { ar: 'الخيارات (Flags)', en: 'Flags' }, 'gi', 1),
        textInput('text', { ar: 'النص المراد اختباره', en: 'Text to test' }, 'contact us at hello@example.com or admin@site.org'),
    ],
    calculate(values, language) {
        let regex;
        try {
            regex = new RegExp(values.pattern, values.flags || 'g');
        } catch (error) {
            throw new Error(localized(language, `تعبير نمطي غير صالح: ${error.message}`, `Invalid regular expression: ${error.message}`));
        }
        const matches = [...values.text.matchAll(regex.global ? regex : new RegExp(regex.source, `${regex.flags}g`.replace('gg', 'g')))];
        if (!matches.length) {
            return output(0, localized(language, 'لا توجد مطابقات', 'No matches found'), '');
        }
        const lines = matches.map((match, index) => {
            const groups = match.length > 1 ? ` — groups: ${match.slice(1).map((g) => g ?? '∅').join(', ')}` : '';
            return `${index + 1}. "${match[0]}" @${match.index}${groups}`;
        });
        return output(
            matches.length,
            localized(language, `${matches.length} مطابقة`, `${matches.length} match(es)`),
            lines.join('\n'),
        );
    },
});

// --- Text diff checker --------------------------------------------------

function computeLineDiff(a, b) {
    const linesA = a.split('\n');
    const linesB = b.split('\n');
    const m = linesA.length;
    const n = linesB.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i -= 1) {
        for (let j = n - 1; j >= 0; j -= 1) {
            dp[i][j] = linesA[i] === linesB[j]
                ? dp[i + 1][j + 1] + 1
                : Math.max(dp[i + 1][j], dp[i][j + 1]);
        }
    }
    const result = [];
    let i = 0;
    let j = 0;
    while (i < m && j < n) {
        if (linesA[i] === linesB[j]) {
            result.push({ type: 'equal', line: linesA[i] });
            i += 1;
            j += 1;
        } else if (dp[i + 1][j] >= dp[i][j + 1]) {
            result.push({ type: 'removed', line: linesA[i] });
            i += 1;
        } else {
            result.push({ type: 'added', line: linesB[j] });
            j += 1;
        }
    }
    while (i < m) { result.push({ type: 'removed', line: linesA[i] }); i += 1; }
    while (j < n) { result.push({ type: 'added', line: linesB[j] }); j += 1; }
    return result;
}

const textDiffChecker = tool({
    id: 'text-diff-checker',
    icon: 'A≠B',
    title: { ar: 'مقارنة نصين (Diff)', en: 'Text Diff Checker' },
    description: {
        ar: 'قارن بين نصين سطرًا بسطر واعرف كل الإضافات والحذف بينهما.',
        en: 'Compare two blocks of text line by line and see every addition and removal.',
    },
    note: {
        ar: 'المقارنة محلية بالكامل داخل متصفحك.',
        en: 'The comparison runs entirely in your browser.',
    },
    inputs: [
        textInput('original', { ar: 'النص الأصلي', en: 'Original text' }, 'line one\nline two\nline three'),
        textInput('changed', { ar: 'النص الجديد', en: 'Changed text' }, 'line one\nline two edited\nline three\nline four'),
    ],
    calculate(values, language) {
        const diff = computeLineDiff(values.original, values.changed);
        const added = diff.filter((d) => d.type === 'added').length;
        const removed = diff.filter((d) => d.type === 'removed').length;
        const rendered = diff.map((d) => {
            const marker = d.type === 'added' ? '+ ' : d.type === 'removed' ? '- ' : '  ';
            return `${marker}${d.line}`;
        }).join('\n');
        if (added === 0 && removed === 0) {
            return output(0, localized(language, 'النصان متطابقان', 'The two texts are identical'), '');
        }
        return output(
            `+${added} / -${removed}`,
            localized(language, `${added} إضافة، ${removed} حذف`, `${added} added, ${removed} removed`),
            rendered,
        );
    },
});

// --- JavaScript minifier --------------------------------------------------

const javascriptMinifier = tool({
    id: 'javascript-minifier',
    icon: '{JS}',
    title: { ar: 'تصغير JavaScript', en: 'JavaScript Minifier' },
    description: {
        ar: 'احذف التعليقات والمسافات غير الضرورية لتقليل حجم كود JavaScript.',
        en: 'Strip comments and unnecessary whitespace to reduce JavaScript file size.',
    },
    note: {
        ar: 'أداة تصغير أساسية تعتمد على إزالة التعليقات والمسافات؛ للمشاريع الكبيرة يُفضّل bundler متخصص مثل esbuild أو terser.',
        en: 'A lightweight whitespace/comment minifier; for production bundles consider a dedicated tool like esbuild or terser.',
    },
    inputs: [textInput('code', { ar: 'كود JavaScript', en: 'JavaScript code' }, 'function greet(name) {\n  // says hello\n  console.log("Hello, " + name);\n}', 12)],
    calculate(values, language) {
        const strings = [];
        const protectedCode = values.code
            .replace(/`(?:\\.|[^`\\])*`/g, (value) => { strings.push(value); return `___ADAWATY_STR_${strings.length - 1}___`; })
            .replace(/"(?:\\.|[^"\\])*"/g, (value) => { strings.push(value); return `___ADAWATY_STR_${strings.length - 1}___`; })
            .replace(/'(?:\\.|[^'\\])*'/g, (value) => { strings.push(value); return `___ADAWATY_STR_${strings.length - 1}___`; });
        const minified = protectedCode
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/(^|[^:])\/\/.*$/gm, '$1')
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}()[\];,:=+\-*/<>!&|?])\s*/g, '$1')
            .trim()
            .replace(/___ADAWATY_STR_(\d+)___/g, (_, index) => strings[Number(index)]);
        const saved = values.code.length - minified.length;
        return output(minified, localized(language, `${saved} حرفًا تم توفيره`, `${saved} characters saved`));
    },
});

// --- QR code generator --------------------------------------------------

const qrCodeGenerator = tool({
    id: 'qr-code-generator',
    category: 'converter',
    icon: 'QR',
    title: { ar: 'إنشاء رمز QR', en: 'QR Code Generator' },
    description: {
        ar: 'حوّل أي نص أو رابط إلى رمز QR جاهز للتنزيل كصورة PNG.',
        en: 'Turn any text or link into a downloadable PNG QR code.',
    },
    note: {
        ar: 'يتم إنشاء الرمز محليًا داخل متصفحك دون إرسال البيانات لأي خادم.',
        en: 'The code is generated locally in your browser; nothing is sent to a server.',
    },
    inputs: [
        textInput('text', { ar: 'النص أو الرابط', en: 'Text or URL' }, 'https://abdelaziz-maysara-hm.github.io/adawaty/', 3),
        selectInput('errorCorrection', { ar: 'مستوى تصحيح الخطأ', en: 'Error correction level' }, [
            { value: 'L', label: { ar: 'منخفض (L)', en: 'Low (L)' } },
            { value: 'M', label: { ar: 'متوسط (M)', en: 'Medium (M)' } },
            { value: 'Q', label: { ar: 'جيد (Q)', en: 'Quartile (Q)' } },
            { value: 'H', label: { ar: 'مرتفع (H)', en: 'High (H)' } },
        ]),
        numberInput('size', { ar: 'حجم الصورة (بكسل)', en: 'Image size (px)' }, 512, 128, 2048, 32),
    ],
    async process(values, language) {
        if (!values.text.trim()) {
            throw new Error(localized(language, 'أدخل نصًا أو رابطًا أولًا.', 'Enter some text or a URL first.'));
        }
        const QRCode = await loadQrCode();
        const canvas = document.createElement('canvas');
        await QRCode.toCanvas(canvas, values.text, {
            errorCorrectionLevel: values.errorCorrection || 'M',
            width: Number(values.size) || 512,
            margin: 2,
        });
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        return fileOutput(blob, 'qr-code.png', language, 'رمز QR جاهز', 'QR code is ready');
    },
});

const webUtilityDefinitions = Object.freeze(Object.fromEntries([
    regexTester,
    textDiffChecker,
    javascriptMinifier,
    qrCodeGenerator,
].map((definition) => [definition.id, definition])));

export { webUtilityDefinitions };
