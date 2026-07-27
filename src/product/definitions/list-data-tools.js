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

function selectInput(id, ar, en, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze({
            value: option.value,
            label: Object.freeze(option.label),
        }))),
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

const listUnion = listTool({
    id: 'list-union',
    icon: '∪',
    title: { ar: 'دمج قائمتين بدون تكرار', en: 'List Union' },
    description: { ar: 'ادمج عناصر قائمتين في قائمة واحدة مرتبة دون تكرارات.', en: 'Merge two lists into one ordered list without duplicates.' },
    note: { ar: 'يُحفظ ترتيب أول ظهور لكل عنصر.', en: 'The first-seen order of every item is preserved.' },
    inputs: [
        textareaInput('first', 'القائمة الأولى', 'First list', 'Apple\nOrange'),
        textareaInput('second', 'القائمة الثانية', 'Second list', 'Orange\nBanana'),
    ],
    transform: (values) => [...new Set([...nonEmptyLines(values.first), ...nonEmptyLines(values.second)])].join('\n'),
    filename: 'adawaty-list-union.txt',
});

const listReverser = listTool({
    id: 'list-reverser',
    icon: '⇅',
    title: { ar: 'عكس ترتيب القائمة', en: 'List Reverser' },
    description: { ar: 'اعكس ترتيب عناصر قائمة طويلة بضغطة واحدة.', en: 'Reverse the order of a long list in one click.' },
    note: { ar: 'تُهمل الأسطر الفارغة فقط.', en: 'Only empty lines are ignored.' },
    inputs: [textareaInput('items', 'عناصر القائمة', 'List items', 'First\nSecond\nThird')],
    transform: (values) => nonEmptyLines(values.items).reverse().join('\n'),
    filename: 'adawaty-reversed-list.txt',
});

const listNumberer = listTool({
    id: 'list-numberer',
    icon: '1.',
    title: { ar: 'ترقيم عناصر القائمة', en: 'List Numberer' },
    description: { ar: 'حوّل الأسطر إلى قائمة مرقمة مع اختيار رقم البداية.', en: 'Turn lines into a numbered list with a custom starting number.' },
    note: { ar: 'يمكن تنزيل القائمة المرقمة كنص.', en: 'The numbered list can be downloaded as text.' },
    inputs: [
        textareaInput('items', 'عناصر القائمة', 'List items', 'Plan\nBuild\nLaunch'),
        numberInput('start', 'رقم البداية', 'Starting number', 1, -100000, 100000),
    ],
    transform(values) {
        const start = Math.floor(Number(values.start));
        return nonEmptyLines(values.items).map((item, index) => `${start + index}. ${item}`).join('\n');
    },
    filename: 'adawaty-numbered-list.txt',
});

const listFrequencyTable = listTool({
    id: 'list-frequency-table',
    icon: '#',
    title: { ar: 'جدول تكرار عناصر القائمة', en: 'List Frequency Table' },
    description: { ar: 'احسب مرات ظهور كل عنصر ورتّب النتيجة من الأكثر تكرارًا.', en: 'Count item occurrences and rank results by frequency.' },
    note: { ar: 'المقارنة حساسة لحالة الأحرف.', en: 'Comparison is case-sensitive.' },
    inputs: [textareaInput('items', 'عناصر القائمة', 'List items', 'Apple\nBanana\nApple\nOrange\nApple')],
    transform(values) {
        const counts = new Map();
        nonEmptyLines(values.items).forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
        return [...counts.entries()]
            .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
            .map(([item, count]) => `${count}\t${item}`)
            .join('\n');
    },
    filename: 'adawaty-list-frequency.tsv',
});

function csvTool({ id, icon, title, description, note, inputs, transform, filename }) {
    return Object.freeze({
        id,
        category: 'developer',
        icon,
        action: Object.freeze({ ar: 'معالجة CSV', en: 'Process CSV' }),
        title: Object.freeze(title),
        description: Object.freeze(description),
        note: Object.freeze(note),
        inputs: Object.freeze(inputs),
        async process(values, language) {
            const text = transform(values);
            return downloadableText(text, filename, language, 'تمت معالجة البيانات', 'Data processed');
        },
    });
}

const csvTransposer = csvTool({
    id: 'csv-transposer',
    icon: '↘',
    title: { ar: 'تبديل صفوف وأعمدة CSV', en: 'CSV Transposer' },
    description: { ar: 'حوّل صفوف CSV إلى أعمدة والأعمدة إلى صفوف.', en: 'Turn CSV rows into columns and columns into rows.' },
    note: { ar: 'تُملأ الخلايا الناقصة بقيم فارغة.', en: 'Missing cells are filled with empty values.' },
    inputs: [
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,Ahmed,Sara\ncity,Cairo,Alexandria', 12),
        delimiterInput('delimiter', 'فاصل البيانات', 'Data delimiter'),
    ],
    transform(values) {
        const delimiter = resolveDelimiter(values.delimiter);
        const rows = parseDelimited(String(values.csv), delimiter);
        const width = Math.max(0, ...rows.map((row) => row.length));
        const transposed = Array.from({ length: width }, (_, column) => rows.map((row) => row[column] ?? ''));
        return stringifyDelimited(transposed, delimiter);
    },
    filename: 'adawaty-transposed.csv',
});

const csvColumnRemover = csvTool({
    id: 'csv-column-remover',
    icon: '−C',
    title: { ar: 'حذف عمود من CSV', en: 'CSV Column Remover' },
    description: { ar: 'احذف عمودًا كاملًا من بيانات CSV مع الحفاظ على بقية الجدول.', en: 'Remove one complete CSV column while preserving the remaining table.' },
    note: { ar: 'ترقيم الأعمدة يبدأ من 1.', en: 'Column numbering starts at 1.' },
    inputs: [
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,email,city\nAhmed,a@example.com,Cairo', 12),
        delimiterInput('delimiter', 'فاصل البيانات', 'Data delimiter'),
        numberInput('column', 'رقم العمود المراد حذفه', 'Column to remove', 2, 1, 10000),
    ],
    transform(values) {
        const delimiter = resolveDelimiter(values.delimiter);
        const column = Math.max(0, Math.floor(Number(values.column)) - 1);
        const rows = parseDelimited(String(values.csv), delimiter).map((row) => row.filter((_, index) => index !== column));
        return stringifyDelimited(rows, delimiter);
    },
    filename: 'adawaty-column-removed.csv',
});

const csvHeaderRenamer = csvTool({
    id: 'csv-header-renamer',
    icon: 'HDR',
    title: { ar: 'تغيير اسم عمود CSV', en: 'CSV Header Renamer' },
    description: { ar: 'غيّر اسم رأس عمود محدد دون تعديل بيانات الصفوف.', en: 'Rename a selected CSV header without changing row data.' },
    note: { ar: 'يجب أن يحتوي الصف الأول على أسماء الأعمدة.', en: 'The first row must contain column names.' },
    inputs: [
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,city\nAhmed,Cairo', 12),
        delimiterInput('delimiter', 'فاصل البيانات', 'Data delimiter'),
        numberInput('column', 'رقم العمود', 'Column number', 1, 1, 10000),
        textInput('header', 'الاسم الجديد', 'New header', 'full_name'),
    ],
    transform(values) {
        const delimiter = resolveDelimiter(values.delimiter);
        const rows = parseDelimited(String(values.csv), delimiter);
        const column = Math.max(0, Math.floor(Number(values.column)) - 1);
        if (rows[0]) {
            rows[0][column] = String(values.header);
        }
        return stringifyDelimited(rows, delimiter);
    },
    filename: 'adawaty-renamed-header.csv',
});

const csvRowFilter = csvTool({
    id: 'csv-row-filter',
    icon: 'FLT',
    title: { ar: 'تصفية صفوف CSV', en: 'CSV Row Filter' },
    description: { ar: 'احتفظ بالصفوف التي يساوي عمودها قيمة معينة أو يحتوي عليها.', en: 'Keep rows whose selected column equals or contains a value.' },
    note: { ar: 'يُحفظ صف العناوين دائمًا.', en: 'The header row is always preserved.' },
    inputs: [
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,city\nAhmed,Cairo\nSara,Alexandria', 12),
        delimiterInput('delimiter', 'فاصل البيانات', 'Data delimiter'),
        numberInput('column', 'رقم العمود', 'Column number', 2, 1, 10000),
        textInput('query', 'القيمة المطلوبة', 'Filter value', 'Cairo'),
        selectInput('mode', 'طريقة المطابقة', 'Match mode', [
            { value: 'contains', label: { ar: 'يحتوي على', en: 'Contains' } },
            { value: 'equals', label: { ar: 'يساوي', en: 'Equals' } },
        ]),
    ],
    transform(values) {
        const delimiter = resolveDelimiter(values.delimiter);
        const rows = parseDelimited(String(values.csv), delimiter);
        const column = Math.max(0, Math.floor(Number(values.column)) - 1);
        const query = String(values.query).toLocaleLowerCase();
        const matches = (value) => values.mode === 'equals'
            ? String(value).toLocaleLowerCase() === query
            : String(value).toLocaleLowerCase().includes(query);
        return stringifyDelimited([rows[0] ?? [], ...rows.slice(1).filter((row) => matches(row[column] ?? ''))], delimiter);
    },
    filename: 'adawaty-filtered-rows.csv',
});

const csvRowSorter = csvTool({
    id: 'csv-row-sorter',
    icon: 'A↓',
    title: { ar: 'ترتيب صفوف CSV', en: 'CSV Row Sorter' },
    description: { ar: 'رتّب صفوف CSV حسب عمود محدد تصاعديًا أو تنازليًا.', en: 'Sort CSV rows by a selected column in ascending or descending order.' },
    note: { ar: 'يتعرف الترتيب تلقائيًا على القيم الرقمية.', en: 'Numeric values are detected automatically.' },
    inputs: [
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,score\nAhmed,85\nSara,92', 12),
        delimiterInput('delimiter', 'فاصل البيانات', 'Data delimiter'),
        numberInput('column', 'رقم عمود الترتيب', 'Sort column', 2, 1, 10000),
        selectInput('direction', 'اتجاه الترتيب', 'Sort direction', [
            { value: 'ascending', label: { ar: 'تصاعدي', en: 'Ascending' } },
            { value: 'descending', label: { ar: 'تنازلي', en: 'Descending' } },
        ]),
    ],
    transform(values) {
        const delimiter = resolveDelimiter(values.delimiter);
        const rows = parseDelimited(String(values.csv), delimiter);
        const column = Math.max(0, Math.floor(Number(values.column)) - 1);
        const direction = values.direction === 'descending' ? -1 : 1;
        const data = rows.slice(1).sort((first, second) => {
            const left = first[column] ?? '';
            const right = second[column] ?? '';
            const numeric = Number(left);
            const otherNumeric = Number(right);
            return direction * (
                Number.isFinite(numeric) && Number.isFinite(otherNumeric)
                    ? numeric - otherNumeric
                    : String(left).localeCompare(String(right))
            );
        });
        return stringifyDelimited([rows[0] ?? [], ...data], delimiter);
    },
    filename: 'adawaty-sorted-rows.csv',
});

const csvDeduplicator = csvTool({
    id: 'csv-deduplicator',
    icon: '1×',
    title: { ar: 'حذف صفوف CSV المكررة', en: 'CSV Deduplicator' },
    description: { ar: 'احذف الصفوف المتطابقة مع الاحتفاظ بأول نسخة وصف العناوين.', en: 'Remove identical CSV rows while keeping the first copy and header.' },
    note: { ar: 'تتم مقارنة جميع خلايا الصف.', en: 'Every cell in each row is compared.' },
    inputs: [
        textareaInput('csv', 'بيانات CSV', 'CSV data', 'name,city\nAhmed,Cairo\nAhmed,Cairo\nSara,Alexandria', 12),
        delimiterInput('delimiter', 'فاصل البيانات', 'Data delimiter'),
    ],
    transform(values) {
        const delimiter = resolveDelimiter(values.delimiter);
        const rows = parseDelimited(String(values.csv), delimiter);
        const seen = new Set();
        const unique = rows.slice(1).filter((row) => {
            const key = JSON.stringify(row);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        return stringifyDelimited([rows[0] ?? [], ...unique], delimiter);
    },
    filename: 'adawaty-deduplicated.csv',
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
    listUnion,
    listReverser,
    listNumberer,
    listFrequencyTable,
    csvTransposer,
    csvColumnRemover,
    csvHeaderRenamer,
    csvRowFilter,
    csvRowSorter,
    csvDeduplicator,
].map((tool) => [tool.id, tool])));

export {
    listDataToolDefinitions,
    parseDelimited,
    stringifyDelimited,
};

// END OF FILE
