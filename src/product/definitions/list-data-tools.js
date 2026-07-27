function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function textareaInput(id, ar, en, placeholder, rows = 10) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function textInput(id, ar, en, placeholder = '') {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function numberInput(id, ar, en, value, min = 1, max = 1000) {
    return Object.freeze({
        id,
        type: 'number',
        min,
        max,
        step: 1,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder: String(value),
    });
}

const delimiters = Object.freeze([
    Object.freeze({ value: 'comma', label: Object.freeze({ ar: 'فاصلة (,)', en: 'Comma (,)' }) }),
    Object.freeze({ value: 'tab', label: Object.freeze({ ar: 'علامة تبويب', en: 'Tab' }) }),
    Object.freeze({ value: 'semicolon', label: Object.freeze({ ar: 'فاصلة منقوطة (;)', en: 'Semicolon (;)' }) }),
    Object.freeze({ value: 'pipe', label: Object.freeze({ ar: 'شرطة عمودية (|)', en: 'Pipe (|)' }) }),
]);

function delimiterInput(id, ar, en) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: delimiters,
    });
}

function resolveDelimiter(value) {
    return {
        comma: ',',
        tab: '\t',
        semicolon: ';',
        pipe: '|',
    }[value] ?? ',';
}

function nonEmptyLines(value) {
    return String(value)
        .replace(/\r\n?/g, '\n')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
}

function downloadableText(text, filename, language, arLabel, enLabel) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const lineCount = text ? text.split('\n').length : 0;
    return {
        value: localized(language, `${lineCount} سطر`, `${lineCount} lines`),
        label: localized(language, arLabel, enLabel),
        details: localized(language, 'يمكنك تنزيل النتيجة أو نسخها.', 'Download or copy the result.'),
        download: { blob, filename },
    };
}

function parseDelimited(text, delimiter) {
    const rows = [];
    let row = [];
    let field = '';
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        if (character === '"') {
            if (quoted && text[index + 1] === '"') {
                field += '"';
                index += 1;
            } else {
                quoted = !quoted;
            }
        } else if (!quoted && character === delimiter) {
            row.push(field);
            field = '';
        } else if (!quoted && (character === '\n' || character === '\r')) {
            if (character === '\r' && text[index + 1] === '\n') {
                index += 1;
            }
            row.push(field);
            rows.push(row);
            row = [];
            field = '';
        } else {
            field += character;
        }
    }

    if (quoted) {
        throw new Error('CSV contains an unclosed quoted field.');
    }
    if (field || row.length || text.length) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}

function stringifyDelimited(rows, delimiter) {
    return rows.map((row) => row.map((value) => {
        const field = String(value);
        return /["\r\n]/.test(field) || field.includes(delimiter)
            ? `"${field.replaceAll('"', '""')}"`
            : field;
    }).join(delimiter)).join('\n');
}

function listTool({ id, icon, title, description, note, inputs, transform, filename }) {
    return Object.freeze({
        id,
        category: 'text',
        icon,
        action: Object.freeze({ ar: 'معالجة القائمة', en: 'Process list' }),
        title: Object.freeze(title),
        description: Object.freeze(description),
        note: Object.freeze(note),
        inputs: Object.freeze(inputs),
        async process(values, language) {
            return downloadableText(
                transform(values),
                filename,
                language,
                'تمت معالجة القائمة',
                'List processed',
            );
        },
    });
}

const listRandomizer = listTool({
    id: 'list-randomizer',
    icon: '↝',
    title: { ar: 'ترتيب القائمة عشوائيًا', en: 'List Randomizer' },
    description: { ar: 'اخلط عناصر قائمة متعددة الأسطر فورًا داخل المتصفح.', en: 'Shuffle a multi-line list instantly in your browser.' },
    note: { ar: 'لا تُرفع قائمتك إلى أي خادم.', en: 'Your list never leaves your device.' },
    inputs: [textareaInput('items', 'عناصر القائمة', 'List items', 'Ahmed\nMona\nSara\nOmar')],
    transform(values) {
        const items = nonEmptyLines(values.items);
        for (let index = items.length - 1; index > 0; index -= 1) {
            const swapIndex = Math.floor(Math.random() * (index + 1));
            [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
        }
        return items.join('\n');
    },
    filename: 'adawaty-randomized-list.txt',
});

const listIntersection = listTool({
    id: 'list-intersection',
    icon: '∩',
    title: { ar: 'تقاطع قائمتين', en: 'List Intersection' },
    description: { ar: 'استخرج العناصر المشتركة بين قائمتين مع إزالة التكرارات.', en: 'Extract unique items shared by two lists.' },
    note: { ar: 'المقارنة حساسة لحالة الأحرف.', en: 'Comparison is case-sensitive.' },
    inputs: [
        textareaInput('first', 'القائمة الأولى', 'First list', 'Apple\nOrange\nBanana'),
        textareaInput('second', 'القائمة الثانية', 'Second list', 'Banana\nApple\nMango'),
    ],
    transform(values) {
        const second = new Set(nonEmptyLines(values.second));
        return [...new Set(nonEmptyLines(values.first))].filter((item) => second.has(item)).join('\n');
    },
    filename: 'adawaty-list-intersection.txt',
});

const listDifference = listTool({
    id: 'list-difference',
    icon: '−',
    title: { ar: 'الفرق بين قائمتين', en: 'List Difference' },
    description: { ar: 'اعثر على عناصر القائمة الأولى غير الموجودة في الثانية.', en: 'Find first-list items that are absent from the second list.' },
    note: { ar: 'تُزال العناصر المكررة من النتيجة.', en: 'Duplicate result items are removed.' },
    inputs: [
        textareaInput('first', 'القائمة الأولى', 'First list', 'Apple\nOrange\nBanana'),
        textareaInput('second', 'القائمة الثانية', 'Second list', 'Banana\nMango'),
    ],
    transform(values) {
        const second = new Set(nonEmptyLines(values.second));
        return [...new Set(nonEmptyLines(values.first))].filter((item) => !second.has(item)).join('\n');
    },
    filename: 'adawaty-list-difference.txt',
});

const listChunker = listTool({
    id: 'list-chunker',
    icon: '▦',
    title: { ar: 'تقسيم القائمة إلى مجموعات', en: 'List Chunker' },
    description: { ar: 'قسّم قائمة طويلة إلى مجموعات متساوية يسهل نسخها ومشاركتها.', en: 'Split a long list into equal-sized, copy-ready groups.' },
    note: { ar: 'يفصل سطر فارغ بين كل مجموعتين.', en: 'A blank line separates each group.' },
    inputs: [
        textareaInput('items', 'عناصر القائمة', 'List items', 'Item 1\nItem 2\nItem 3\nItem 4'),
        numberInput('size', 'عدد العناصر في المجموعة', 'Items per group', 10),
    ],
    transform(values) {
        const items = nonEmptyLines(values.items);
        const size = Math.max(1, Math.floor(Number(values.size)));
        const groups = [];
        for (let index = 0; index < items.length; index += size) {
            groups.push(items.slice(index, index + size).join('\n'));
        }
        return groups.join('\n\n');
    },
    filename: 'adawaty-chunked-list.txt',
});

const linePrefixAdder = listTool({
    id: 'line-prefix-adder',
    icon: '+›',
    title: { ar: 'إضافة بادئة لكل سطر', en: 'Line Prefix Adder' },
    description: { ar: 'أضف نصًا ثابتًا في بداية كل سطر دفعة واحدة.', en: 'Add fixed text to the beginning of every line in one pass.' },
    note: { ar: 'تُحفظ الأسطر الفارغة كما هي.', en: 'Blank lines are preserved.' },
    inputs: [
        textareaInput('text', 'النص', 'Text', 'First\nSecond\nThird'),
        textInput('affix', 'البادئة', 'Prefix', '- '),
    ],
    transform: (values) => String(values.text).replace(/\r\n?/g, '\n').split('\n').map((line) => `${values.affix}${line}`).join('\n'),
    filename: 'adawaty-prefixed-lines.txt',
});

const lineSuffixAdder = listTool({
    id: 'line-suffix-adder',
    icon: '‹+',
    title: { ar: 'إضافة لاحقة لكل سطر', en: 'Line Suffix Adder' },
    description: { ar: 'أضف نصًا ثابتًا في نهاية كل سطر دفعة واحدة.', en: 'Append fixed text to every line in one pass.' },
    note: { ar: 'مفيد لإعداد القوائم والأوامر والبيانات.', en: 'Useful for lists, commands and data preparation.' },
    inputs: [
        textareaInput('text', 'النص', 'Text', 'First\nSecond\nThird'),
        textInput('affix', 'اللاحقة', 'Suffix', ','),
    ],
    transform: (values) => String(values.text).replace(/\r\n?/g, '\n').split('\n').map((line) => `${line}${values.affix}`).join('\n'),
    filename: 'adawaty-suffixed-lines.txt',
});

const emailAddressExtractor = listTool({
    id: 'email-address-extractor',
    icon: '@',
    title: { ar: 'استخراج عناوين البريد الإلكتروني', en: 'Email Address Extractor' },
    description: { ar: 'استخرج عناوين البريد الفريدة من أي نص أو سجل.', en: 'Extract unique email addresses from text or logs.' },
    note: { ar: 'تعمل الأداة محليًا ولا ترسل النص.', en: 'Processing is local and the text is not uploaded.' },
    inputs: [textareaInput('text', 'النص المصدر', 'Source text', 'Contact hello@example.com or sales@example.org.')],
    transform(values) {
        const matches = String(values.text).match(/[\w.!#$%&'*+/=?^`{|}~-]+@[\w-]+(?:\.[\w-]+)+/gu) ?? [];
        return [...new Set(matches)].join('\n');
    },
    filename: 'adawaty-email-addresses.txt',
});

const urlExtractor = listTool({
    id: 'url-extractor',
    icon: 'URL',
    title: { ar: 'استخراج الروابط من النص', en: 'URL Extractor' },
    description: { ar: 'استخرج روابط HTTP وHTTPS الفريدة من النصوص والسجلات.', en: 'Extract unique HTTP and HTTPS URLs from text and logs.' },
    note: { ar: 'تُزال علامات الترقيم الشائعة من نهاية الرابط.', en: 'Common trailing punctuation is removed.' },
    inputs: [textareaInput('text', 'النص المصدر', 'Source text', 'Visit https://example.com and https://openai.com/.')],
    transform(values) {
        const matches = String(values.text).match(/https?:\/\/[^\s<>"']+/giu) ?? [];
        return [...new Set(matches.map((url) => url.replace(/[),.;!?]+$/u, '')))].join('\n');
    },
    filename: 'adawaty-extracted-urls.txt',
});

const csvDelimiterConverter = Object.freeze({
    id: 'csv-delimiter-converter',
    category: 'developer',
    icon: 'CSV',
    action: Object.freeze({ ar: 'تحويل البيانات', en: 'Convert data' }),
    title: Object.freeze({ ar: 'تحويل فاصل CSV', en: 'CSV Delimiter Converter' }),
    description: Object.freeze({ ar: 'حوّل CSV بين الفاصلة وعلامة التبويب والفاصلة المنقوطة والشرطة العمودية.', en: 'Convert CSV between comma, tab, semicolon and pipe delimiters.' }),
    note: Object.freeze({ ar: 'يدعم الحقول المقتبسة والفواصل والأسطر داخلها.', en: 'Quoted fields, delimiters and line breaks are supported.' }),
    inputs: Object.freeze([
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,city\nAhmed,Cairo\nSara,Alexandria', 12),
        delimiterInput('sourceDelimiter', 'الفاصل الحالي', 'Current delimiter'),
        delimiterInput('targetDelimiter', 'الفاصل الجديد', 'New delimiter'),
    ]),
    async process(values, language) {
        const rows = parseDelimited(String(values.csv), resolveDelimiter(values.sourceDelimiter));
        const text = stringifyDelimited(rows, resolveDelimiter(values.targetDelimiter));
        return downloadableText(text, 'adawaty-converted-data.csv', language, 'تم تحويل البيانات', 'Data converted');
    },
});

const csvColumnExtractor = Object.freeze({
    id: 'csv-column-extractor',
    category: 'developer',
    icon: 'COL',
    action: Object.freeze({ ar: 'استخراج العمود', en: 'Extract column' }),
    title: Object.freeze({ ar: 'استخراج عمود من CSV', en: 'CSV Column Extractor' }),
    description: Object.freeze({ ar: 'استخرج عمودًا واحدًا من ملف CSV كنص مرتب قابل للتنزيل.', en: 'Extract one CSV column as clean downloadable text.' }),
    note: Object.freeze({ ar: 'ترقيم الأعمدة يبدأ من 1 ويشمل صف العناوين.', en: 'Column numbering starts at 1 and includes the header row.' }),
    inputs: Object.freeze([
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,city\nAhmed,Cairo\nSara,Alexandria', 12),
        delimiterInput('delimiter', 'فاصل البيانات', 'Data delimiter'),
        numberInput('column', 'رقم العمود', 'Column number', 1, 1, 10000),
    ]),
    async process(values, language) {
        const rows = parseDelimited(String(values.csv), resolveDelimiter(values.delimiter));
        const index = Math.max(0, Math.floor(Number(values.column)) - 1);
        const text = rows.map((row) => row[index] ?? '').join('\n');
        return downloadableText(text, 'adawaty-csv-column.txt', language, 'تم استخراج العمود', 'Column extracted');
    },
});

const listDataToolDefinitions = Object.freeze(Object.fromEntries([
    listRandomizer,
    listIntersection,
    listDifference,
    listChunker,
    linePrefixAdder,
    lineSuffixAdder,
    emailAddressExtractor,
    urlExtractor,
    csvDelimiterConverter,
    csvColumnExtractor,
].map((tool) => [tool.id, tool])));

export {
    listDataToolDefinitions,
    parseDelimited,
    stringifyDelimited,
};

// END OF FILE
