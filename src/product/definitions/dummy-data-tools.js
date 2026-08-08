function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value, label, details };
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

function textFieldInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'text',
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

const FIRST_NAMES = Object.freeze([
    'Ahmed', 'Sara', 'Omar', 'Layla', 'Youssef', 'Mona', 'Khaled', 'Nour', 'Karim', 'Dina',
]);
const LAST_NAMES = Object.freeze([
    'Hassan', 'Ali', 'Ibrahim', 'Mostafa', 'Farouk', 'Sayed', 'Ramzy', 'Adel',
]);
const EMAIL_DOMAINS = Object.freeze(['example.com', 'test.dev', 'mail.io', 'sample.org']);

function pickRandom(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function buildDummyRecord(index) {
    const firstName = pickRandom(FIRST_NAMES);
    const lastName = pickRandom(LAST_NAMES);
    return {
        id: index + 1,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${pickRandom(EMAIL_DOMAINS)}`,
        age: 18 + Math.floor(Math.random() * 50),
        active: Math.random() > 0.5,
    };
}

function buildDummyRecords(count) {
    return Array.from({ length: count }, (_, index) => buildDummyRecord(index));
}

function dummyDataTool(config) {
    return Object.freeze({
        category: 'developer',
        ...config,
    });
}

const dummyJsonGenerator = dummyDataTool({
    id: 'dummy-json-generator',
    icon: 'JSON#',
    title: Object.freeze({ ar: 'مولّد بيانات JSON وهمية', en: 'Dummy JSON Generator' }),
    description: Object.freeze({
        ar: 'أنشئ مصفوفة JSON من سجلات وهمية واقعية الشكل (اسم، إيميل، عمر) لاختبار واجهات برمجية أو نماذج أولية.',
        en: 'Generate a JSON array of realistic-looking dummy records (name, email, age) for testing APIs or prototypes.',
    }),
    note: Object.freeze({
        ar: 'البيانات عشوائية بالكامل ولا تمثل أي أشخاص حقيقيين.',
        en: 'Data is entirely random and does not represent any real people.',
    }),
    inputs: Object.freeze([
        numberInput('count', 'عدد السجلات', 'Number of records', 5, { min: 1, max: 200 }),
    ]),
    calculate(values, language) {
        const records = buildDummyRecords(Math.round(values.count));
        return output(
            JSON.stringify(records, null, 2),
            localized(language, `${records.length} سجل وهمي جاهز`, `${records.length} dummy records ready`),
        );
    },
});

function escapeCsvCell(value) {
    const text = String(value);
    return /["\n,]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function recordsToCsv(records) {
    const headers = Object.keys(records[0]);
    const lines = [headers.join(',')];
    for (const record of records) {
        lines.push(headers.map((header) => escapeCsvCell(record[header])).join(','));
    }
    return lines.join('\n');
}

const dummyCsvGenerator = dummyDataTool({
    id: 'dummy-csv-generator',
    icon: 'CSV#',
    title: Object.freeze({ ar: 'مولّد بيانات CSV وهمية', en: 'Dummy CSV Generator' }),
    description: Object.freeze({
        ar: 'أنشئ جدول CSV من سجلات وهمية واقعية الشكل، مفيد لاختبار استيراد البيانات أو ملء نماذج أولية.',
        en: 'Generate a CSV table of realistic-looking dummy records, useful for testing data import or filling prototypes.',
    }),
    note: Object.freeze({
        ar: 'البيانات عشوائية بالكامل ولا تمثل أي أشخاص حقيقيين.',
        en: 'Data is entirely random and does not represent any real people.',
    }),
    inputs: Object.freeze([
        numberInput('count', 'عدد السجلات', 'Number of records', 5, { min: 1, max: 200 }),
    ]),
    calculate(values, language) {
        const records = buildDummyRecords(Math.round(values.count));
        return output(
            recordsToCsv(records),
            localized(language, `${records.length} سجل وهمي جاهز`, `${records.length} dummy records ready`),
        );
    },
});

function escapeSqlString(value) {
    return `'${String(value).replaceAll("'", "''")}'`;
}

function recordsToSqlInserts(records, tableName) {
    const headers = Object.keys(records[0]);
    return records.map((record) => {
        const values = headers.map((header) => {
            const value = record[header];
            if (typeof value === 'string') return escapeSqlString(value);
            if (typeof value === 'boolean') return value ? '1' : '0';
            return value;
        });
        return `INSERT INTO ${tableName} (${headers.join(', ')}) VALUES (${values.join(', ')});`;
    }).join('\n');
}

const dummySqlGenerator = dummyDataTool({
    id: 'dummy-sql-generator',
    icon: 'SQL#',
    title: Object.freeze({ ar: 'مولّد جمل SQL INSERT وهمية', en: 'Dummy SQL INSERT Generator' }),
    description: Object.freeze({
        ar: 'أنشئ جمل SQL INSERT جاهزة ببيانات وهمية واقعية الشكل لملء جدول اختبار بسرعة.',
        en: 'Generate ready SQL INSERT statements with realistic-looking dummy data to quickly populate a test table.',
    }),
    note: Object.freeze({
        ar: 'راجع اسم الجدول قبل التنفيذ الفعلي، وتجنب تشغيل هذا على قاعدة بيانات إنتاج حقيقية.',
        en: 'Double-check the table name before running these, and avoid running them against a real production database.',
    }),
    inputs: Object.freeze([
        textFieldInput('tableName', 'اسم الجدول', 'Table name', 'users'),
        numberInput('count', 'عدد الجمل', 'Number of statements', 5, { min: 1, max: 200 }),
    ]),
    calculate(values, language) {
        const tableName = values.tableName.trim();
        if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tableName)) {
            throw new Error(localized(
                language,
                'اسم الجدول يجب أن يبدأ بحرف أو شرطة سفلية ويحتوي على حروف وأرقام فقط.',
                'Table name must start with a letter or underscore and contain only letters, digits, and underscores.',
            ));
        }

        const records = buildDummyRecords(Math.round(values.count));
        return output(
            recordsToSqlInserts(records, tableName),
            localized(language, `${records.length} جملة INSERT جاهزة`, `${records.length} INSERT statements ready`),
        );
    },
});

const dummyDataToolDefinitions = Object.freeze({
    [dummyJsonGenerator.id]: dummyJsonGenerator,
    [dummyCsvGenerator.id]: dummyCsvGenerator,
    [dummySqlGenerator.id]: dummySqlGenerator,
});

export { dummyDataToolDefinitions };

// END OF FILE
