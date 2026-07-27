function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function textareaInput(id, ar, en, placeholder) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows: 12,
        label: Object.freeze({ ar, en }),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function result(text, filename, language, type = 'text/plain') {
    return {
        value: localized(language, `${text.length} حرف`, `${text.length} characters`),
        label: localized(language, 'اكتملت المعالجة', 'Processing complete'),
        details: localized(language, 'النتيجة جاهزة للمعاينة والتنزيل.', 'The result is ready to preview and download.'),
        download: {
            blob: new Blob([text], { type: `${type};charset=utf-8` }),
            filename,
        },
    };
}

function tool(id, icon, title, description, note, input, transform, filename, type) {
    return Object.freeze({
        id,
        category: 'developer',
        icon,
        action: Object.freeze({ ar: 'نفّذ المعالجة', en: 'Process content' }),
        title: Object.freeze(title),
        description: Object.freeze(description),
        note: Object.freeze(note),
        inputs: Object.freeze([input]),
        async process(values, language) {
            return result(transform(values[input.id]), filename, language, type);
        },
    });
}

function parseHtml(value) {
    if (!globalThis.DOMParser) throw new Error('HTML parsing is not supported by this browser.');
    return new DOMParser().parseFromString(String(value), 'text/html');
}

function cleanHtml(value, callback) {
    const document = parseHtml(value);
    callback(document);
    return document.body.innerHTML.trim();
}

function htmlToMarkdown(value) {
    const document = parseHtml(value);
    function render(node) {
        if (node.nodeType === 3) return node.textContent;
        if (node.nodeType !== 1) return '';
        const children = [...node.childNodes].map(render).join('');
        const tag = node.tagName.toLowerCase();
        if (/^h[1-6]$/u.test(tag)) return `${'#'.repeat(Number(tag[1]))} ${children.trim()}\n\n`;
        if (tag === 'p') return `${children.trim()}\n\n`;
        if (tag === 'br') return '\n';
        if (tag === 'strong' || tag === 'b') return `**${children}**`;
        if (tag === 'em' || tag === 'i') return `*${children}*`;
        if (tag === 'code') return `\`${children}\``;
        if (tag === 'a') return `[${children.trim()}](${node.getAttribute('href') || ''})`;
        if (tag === 'img') return `![${node.getAttribute('alt') || ''}](${node.getAttribute('src') || ''})`;
        if (tag === 'li') return `- ${children.trim()}\n`;
        if (tag === 'blockquote') return `${children.trim().split('\n').map((line) => `> ${line}`).join('\n')}\n\n`;
        if (tag === 'hr') return '---\n\n';
        return children;
    }
    return [...document.body.childNodes].map(render).join('').replace(/\n{3,}/gu, '\n\n').trim();
}

const htmlInput = () => textareaInput('html', 'كود HTML', 'HTML code', '<article><h1>Title</h1><p class="intro">Content</p></article>');

const definitions = [
    tool('html-script-remover', 'JS−',
        { ar: 'حذف JavaScript من HTML', en: 'HTML Script Remover' },
        { ar: 'احذف وسوم script ومحتواها من كود HTML محليًا.', en: 'Remove script elements and their contents from HTML locally.' },
        { ar: 'مفيد لتنظيف المحتوى المنسوخ قبل إعادة استخدامه.', en: 'Useful when cleaning copied content before reuse.' },
        htmlInput(), (value) => cleanHtml(value, (document) => document.querySelectorAll('script').forEach((node) => node.remove())),
        'adawaty-without-scripts.html', 'text/html'),
    tool('html-style-remover', 'CSS−',
        { ar: 'حذف التنسيقات من HTML', en: 'HTML Style Remover' },
        { ar: 'احذف وسوم style وروابط CSS وخصائص style المضمنة.', en: 'Remove style tags, stylesheet links and inline style attributes.' },
        { ar: 'يبقى هيكل المحتوى والنصوص كما هما.', en: 'Content structure and text are preserved.' },
        htmlInput(), (value) => cleanHtml(value, (document) => {
            document.querySelectorAll('style,link[rel~="stylesheet"]').forEach((node) => node.remove());
            document.querySelectorAll('[style]').forEach((node) => node.removeAttribute('style'));
        }), 'adawaty-without-styles.html', 'text/html'),
    tool('html-comment-remover', '<!−−',
        { ar: 'حذف تعليقات HTML', en: 'HTML Comment Remover' },
        { ar: 'احذف جميع تعليقات HTML مع إبقاء العناصر والنصوص.', en: 'Remove every HTML comment while preserving elements and text.' },
        { ar: 'تتم المعالجة داخل المتصفح.', en: 'Processing happens in your browser.' },
        htmlInput(), (value) => cleanHtml(value, (document) => {
            const walker = document.createTreeWalker(document.body, 128);
            const comments = [];
            while (walker.nextNode()) comments.push(walker.currentNode);
            comments.forEach((node) => node.remove());
        }), 'adawaty-without-comments.html', 'text/html'),
    tool('html-inline-event-remover', 'ON−',
        { ar: 'حذف أحداث JavaScript من HTML', en: 'HTML Inline Event Remover' },
        { ar: 'احذف خصائص onclick وonload وبقية معالجات الأحداث المضمنة.', en: 'Remove onclick, onload and other inline event-handler attributes.' },
        { ar: 'لا يحذف الخصائص العادية أو روابط المحتوى.', en: 'Regular attributes and content links remain intact.' },
        htmlInput(), (value) => cleanHtml(value, (document) => {
            document.querySelectorAll('*').forEach((node) => {
                [...node.attributes].filter((attribute) => /^on/iu.test(attribute.name))
                    .forEach((attribute) => node.removeAttribute(attribute.name));
            });
        }), 'adawaty-without-inline-events.html', 'text/html'),
    tool('html-class-extractor', '.CLS',
        { ar: 'استخراج CSS Classes من HTML', en: 'HTML Class Extractor' },
        { ar: 'استخرج قائمة مرتبة وفريدة بكل أسماء classes المستخدمة.', en: 'Extract a sorted, unique list of every class name in HTML.' },
        { ar: 'مفيد لمراجعة CSS وتنظيفه.', en: 'Useful for CSS audits and cleanup.' },
        htmlInput(), (value) => [...new Set([...parseHtml(value).querySelectorAll('[class]')]
            .flatMap((node) => [...node.classList]))].sort().join('\n'),
        'adawaty-html-classes.txt'),
    tool('html-id-extractor', '#ID',
        { ar: 'استخراج IDs من HTML', en: 'HTML ID Extractor' },
        { ar: 'استخرج جميع معرّفات id واكتشف القيم المكررة بسهولة.', en: 'Extract every id attribute so duplicate identifiers are easy to spot.' },
        { ar: 'يحافظ الناتج على ترتيب ظهور العناصر.', en: 'Output preserves document order.' },
        htmlInput(), (value) => [...parseHtml(value).querySelectorAll('[id]')].map((node) => node.id).join('\n'),
        'adawaty-html-ids.txt'),
    tool('html-form-field-extractor', 'FORM',
        { ar: 'استخراج حقول النماذج من HTML', en: 'HTML Form Field Extractor' },
        { ar: 'استخرج أسماء وأنواع وقيم حقول input وselect وtextarea.', en: 'Extract names, types and values from input, select and textarea fields.' },
        { ar: 'يُنزّل الناتج كملف TSV سهل الاستيراد.', en: 'Downloads a TSV file that is easy to import.' },
        htmlInput(), (value) => [...parseHtml(value).querySelectorAll('input,select,textarea')].map((node) => [
            node.tagName.toLowerCase(), node.getAttribute('type') || '', node.getAttribute('name') || '', node.getAttribute('value') || '',
        ].join('\t')).join('\n'), 'adawaty-form-fields.tsv'),
    tool('html-list-to-text-converter', 'UL→',
        { ar: 'تحويل قوائم HTML إلى نص', en: 'HTML List to Text Converter' },
        { ar: 'حوّل عناصر القوائم المرتبة وغير المرتبة إلى أسطر نصية.', en: 'Convert ordered and unordered HTML list items into plain-text lines.' },
        { ar: 'تُضاف أرقام للقوائم المرتبة وعلامات للنقطية.', en: 'Ordered lists receive numbers and unordered lists receive bullets.' },
        htmlInput(), (value) => [...parseHtml(value).querySelectorAll('ol,ul')].flatMap((list) => [...list.children]
            .filter((node) => node.tagName === 'LI')
            .map((node, index) => `${list.tagName === 'OL' ? `${index + 1}.` : '-'} ${node.textContent.trim()}`)).join('\n'),
        'adawaty-html-lists.txt'),
    tool('html-to-markdown-converter', 'H→M',
        { ar: 'تحويل HTML إلى Markdown', en: 'HTML to Markdown Converter' },
        { ar: 'حوّل العناوين والفقرات والروابط والصور والقوائم إلى Markdown.', en: 'Convert headings, paragraphs, links, images and lists to Markdown.' },
        { ar: 'مناسب لنقل المحتوى إلى أنظمة التوثيق والمدونات.', en: 'Ideal for moving content into documentation and blogs.' },
        htmlInput(), htmlToMarkdown, 'adawaty-converted.md', 'text/markdown'),
    tool('html-data-attribute-extractor', 'DATA',
        { ar: 'استخراج Data Attributes من HTML', en: 'HTML Data Attribute Extractor' },
        { ar: 'استخرج كل خصائص data-* مع اسم العنصر والقيمة.', en: 'Extract every data-* attribute with its element name and value.' },
        { ar: 'يُنزّل الناتج كجدول TSV للمراجعة والتحليل.', en: 'Downloads a TSV table for auditing and analysis.' },
        htmlInput(), (value) => [...parseHtml(value).querySelectorAll('*')].flatMap((node) =>
            [...node.attributes]
                .filter((attribute) => attribute.name.startsWith('data-'))
                .map((attribute) => `${node.tagName.toLowerCase()}\t${attribute.name}\t${attribute.value}`))
            .join('\n'), 'adawaty-data-attributes.tsv'),
];

const webTransformToolDefinitions = Object.freeze(Object.fromEntries(
    definitions.map((definition) => [definition.id, definition]),
));

export { htmlToMarkdown, webTransformToolDefinitions };

// END OF FILE
