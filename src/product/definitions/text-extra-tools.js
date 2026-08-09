function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value, label, details };
}

function textInput(id, ar, en, placeholder, rows = 6) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows,
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
        label: Object.freeze({ ar, en }),
        unit: Object.freeze(typeof unit === 'object' ? unit : { ar: unit, en: unit }),
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

function textTool(config) {
    return Object.freeze({
        category: 'text',
        ...config,
    });
}

function applyCaesarCipher(text, shift) {
    const normalizedShift = ((shift % 26) + 26) % 26;
    return text.replace(/[a-zA-Z]/g, (character) => {
        const base = character <= 'Z' ? 65 : 97;
        return String.fromCharCode(((character.charCodeAt(0) - base + normalizedShift) % 26) + base);
    });
}

const caesarCipherTool = textTool({
    id: 'caesar-cipher',
    icon: 'CAES',
    title: Object.freeze({ ar: 'شيفرة قيصر (Caesar Cipher)', en: 'Caesar Cipher' }),
    description: Object.freeze({
        ar: 'شفّر أو فك تشفير نص بإزاحة كل حرف بعدد مواضع تختاره في الأبجدية، تقنية تشفير كلاسيكية للتعلم أو الألغاز.',
        en: 'Encrypt or decrypt text by shifting each letter a chosen number of positions in the alphabet, a classic cipher for learning or puzzles.',
    }),
    note: Object.freeze({
        ar: 'هذا تشفير كلاسيكي بسيط لأغراض تعليمية فقط، وليس آمنًا لحماية بيانات حقيقية. للفك، استخدم نفس الإزاحة بإشارة سالبة.',
        en: 'This is a simple classical cipher for educational purposes only, not secure for protecting real data. To decrypt, use the same shift with a negative sign.',
    }),
    inputs: Object.freeze([
        textInput('text', 'النص', 'Text', 'Hello World'),
        numberInput('shift', 'مقدار الإزاحة', 'Shift amount', 3, -25, 25, ''),
    ]),
    calculate(values, language) {
        if (!values.text.trim()) {
            throw new Error(localized(language, 'أدخل نصًا.', 'Enter some text.'));
        }
        return output(
            applyCaesarCipher(values.text, values.shift),
            localized(language, 'النص المُشفّر جاهز', 'The ciphered text is ready'),
        );
    },
});

function generateAcronym(text) {
    return text.trim().split(/\s+/)
        .map((word) => word[0]?.toUpperCase() ?? '')
        .join('');
}

const acronymGenerator = textTool({
    id: 'acronym-generator',
    icon: 'ACR',
    title: Object.freeze({ ar: 'مولّد الاختصارات (Acronym)', en: 'Acronym Generator' }),
    description: Object.freeze({
        ar: 'أنشئ اختصارًا من الحرف الأول لكل كلمة في عبارة، زي تحويل "As Soon As Possible" إلى "ASAP".',
        en: 'Build an acronym from the first letter of every word in a phrase, like turning "As Soon As Possible" into "ASAP".',
    }),
    note: Object.freeze({
        ar: 'يأخذ أول حرف من كل كلمة مفصولة بمسافة بغض النظر عن حالة الأحرف الأصلية.',
        en: 'Takes the first letter of every space-separated word regardless of the original letter casing.',
    }),
    inputs: Object.freeze([
        textInput('text', 'العبارة', 'Phrase', 'As Soon As Possible', 3),
    ]),
    calculate(values, language) {
        if (!values.text.trim()) {
            throw new Error(localized(language, 'أدخل عبارة.', 'Enter a phrase.'));
        }
        return output(
            generateAcronym(values.text),
            localized(language, 'الاختصار جاهز', 'The acronym is ready'),
        );
    },
});

function addLineNumbers(text, startAt, separator) {
    const lines = text.split('\n');
    const padWidth = String(startAt + lines.length - 1).length;
    return lines
        .map((line, index) => `${String(startAt + index).padStart(padWidth, '0')}${separator}${line}`)
        .join('\n');
}

const lineNumberAdder = textTool({
    id: 'line-number-adder',
    icon: '1.',
    title: Object.freeze({ ar: 'إضافة أرقام للأسطر', en: 'Line Number Adder' }),
    description: Object.freeze({
        ar: 'أضف رقمًا تسلسليًا في بداية كل سطر من نص، مفيد لمراجعة الكود أو قوائم طويلة أو نصوص للطباعة.',
        en: 'Prefix every line of text with a sequential number, useful for reviewing code, long lists, or text meant for printing.',
    }),
    note: Object.freeze({
        ar: 'الأرقام تُكمّل بأصفار تلقائيًا لتتساوى في العرض حسب عدد الأسطر.',
        en: 'Numbers are automatically zero-padded to a consistent width based on the line count.',
    }),
    inputs: Object.freeze([
        textInput('text', 'النص', 'Text', 'first line\nsecond line\nthird line'),
        numberInput('startAt', 'يبدأ من', 'Start at', 1, 0, 100000, ''),
        selectInput('separator', 'الفاصل بعد الرقم', 'Separator after number', [
            ['. ', 'نقطة ومسافة', 'Dot + space'],
            [') ', 'قوس ومسافة', 'Parenthesis + space'],
            [': ', 'نقطتان ومسافة', 'Colon + space'],
            [' ', 'مسافة فقط', 'Space only'],
        ]),
    ]),
    calculate(values, language) {
        if (!values.text.trim()) {
            throw new Error(localized(language, 'أدخل نصًا.', 'Enter some text.'));
        }
        return output(
            addLineNumbers(values.text, Math.round(values.startAt), values.separator),
            localized(language, 'النص المرقّم جاهز', 'The numbered text is ready'),
        );
    },
});

function wrapTextToWidth(text, maxWidth) {
    return text.split('\n').map((line) => {
        const words = line.split(' ');
        const wrappedLines = [];
        let current = '';

        for (const word of words) {
            const candidate = current ? `${current} ${word}` : word;
            if (candidate.length > maxWidth && current) {
                wrappedLines.push(current);
                current = word;
            } else {
                current = candidate;
            }
        }
        if (current) wrappedLines.push(current);

        return wrappedLines.join('\n');
    }).join('\n');
}

const textWordWrapper = textTool({
    id: 'text-word-wrapper',
    icon: 'WRAP',
    title: Object.freeze({ ar: 'التفاف النص (Word Wrap)', en: 'Text Word Wrapper' }),
    description: Object.freeze({
        ar: 'قسّم نصًا طويلًا لأسطر جديدة عند عرض معيّن دون قطع أي كلمة في المنتصف، مفيد لتنسيق نصوص كود أو ملفات تكوين ثابتة العرض.',
        en: 'Break long text into new lines at a chosen width without cutting any word in the middle, useful for formatting code comments or fixed-width config files.',
    }),
    note: Object.freeze({
        ar: 'الأسطر الفارغة الموجودة أصلًا في النص تُحفظ كما هي.',
        en: 'Existing blank lines in the text are preserved as-is.',
    }),
    inputs: Object.freeze([
        textInput('text', 'النص', 'Text', 'This is a long line of text that needs wrapping at a specific width', 8),
        numberInput('width', 'أقصى عرض للسطر', 'Maximum line width', 40, 10, 300, { ar: 'حرف', en: 'characters' }),
    ]),
    calculate(values, language) {
        if (!values.text.trim()) {
            throw new Error(localized(language, 'أدخل نصًا.', 'Enter some text.'));
        }
        return output(
            wrapTextToWidth(values.text, Math.round(values.width)),
            localized(language, 'النص الملتف جاهز', 'The wrapped text is ready'),
        );
    },
});

const textExtraToolDefinitions = Object.freeze({
    [caesarCipherTool.id]: caesarCipherTool,
    [acronymGenerator.id]: acronymGenerator,
    [lineNumberAdder.id]: lineNumberAdder,
    [textWordWrapper.id]: textWordWrapper,
});

export { textExtraToolDefinitions };

// END OF FILE
