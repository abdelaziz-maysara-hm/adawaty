function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function textInput(id, label, placeholder, rows = 8) {
    return Object.freeze({
        id, type: 'textarea', rows,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function typeLabel(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return `array(${value.length})`;
    return typeof value;
}

function isExpandable(value) {
    return value !== null && typeof value === 'object';
}

function buildTree(value, prefix, isLast, lines, keyLabel, isRoot) {
    const connector = isRoot ? '' : (isLast ? '└─ ' : '├─ ');
    const childPrefix = isRoot ? '' : (prefix + (isLast ? '   ' : '│  '));

    if (isExpandable(value)) {
        lines.push(`${prefix}${connector}${keyLabel}${keyLabel ? ': ' : ''}${typeLabel(value)}`);
        const entries = Array.isArray(value)
            ? value.map((item, index) => [String(index), item])
            : Object.entries(value);
        entries.forEach(([key, child], index) => {
            buildTree(child, childPrefix, index === entries.length - 1, lines, key, false);
        });
    } else {
        const rendered = typeof value === 'string' ? `"${value}"` : String(value);
        lines.push(`${prefix}${connector}${keyLabel}: ${rendered}`);
    }
}

const jsonTreeViewer = Object.freeze({
    id: 'json-tree-viewer',
    category: 'developer',
    icon: '🌳',
    title: Object.freeze({ ar: 'عرض JSON كشجرة', en: 'JSON Tree Viewer' }),
    description: Object.freeze({
        ar: 'اعرض بنية بيانات JSON كشجرة نصية واضحة توضح المستويات والأنواع بسهولة.',
        en: 'Render JSON data as a clear text tree, making nesting levels and types easy to scan.',
    }),
    note: Object.freeze({
        ar: 'مختلف عن أداة تنسيق JSON العادية: هنا التركيز على إظهار الهيكل الشجري ونوع كل قيمة.',
        en: 'Different from the plain JSON formatter: this focuses on visualizing the tree structure and each value\'s type.',
    }),
    inputs: Object.freeze([
        textInput('text', { ar: 'JSON', en: 'JSON input' }, '{\n  "name": "Adawaty",\n  "tools": 446,\n  "categories": ["pdf", "image", "developer"],\n  "active": true\n}'),
    ]),
    calculate(values, language) {
        let data;
        try {
            data = JSON.parse(values.text);
        } catch (error) {
            throw new Error(localized(language, `JSON غير صالح: ${error.message}`, `Invalid JSON: ${error.message}`));
        }
        const lines = [];
        buildTree(data, '', true, lines, '', true);
        const tree = lines.join('\n').replace(/^: /, '');
        return output(tree, localized(language, 'الشجرة', 'Tree view'));
    },
});

const jsonTreeViewerDefinitions = Object.freeze({ [jsonTreeViewer.id]: jsonTreeViewer });

export { jsonTreeViewerDefinitions };
