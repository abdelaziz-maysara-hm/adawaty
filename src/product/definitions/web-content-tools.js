import { stringifyDelimited } from './list-data-tools.js';

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

function result(text, filename, language) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    return {
        value: localized(language, `${text ? text.split('\n').length : 0} سطر`, `${text ? text.split('\n').length : 0} lines`),
        label: localized(language, 'اكتملت المعالجة', 'Processing complete'),
        details: localized(language, 'النتيجة جاهزة للتنزيل.', 'The result is ready to download.'),
        download: { blob, filename },
    };
}

function tool(id, icon, title, description, note, input, transform, filename) {
    return Object.freeze({
        id,
        category: 'developer',
        icon,
        action: Object.freeze({ ar: 'استخرج النتيجة', en: 'Extract result' }),
        title: Object.freeze(title),
        description: Object.freeze(description),
        note: Object.freeze(note),
        inputs: Object.freeze([input]),
        async process(values, language) {
            return result(transform(values[input.id]), filename, language);
        },
    });
}

function parseHtml(value) {
    if (!globalThis.DOMParser) throw new Error('HTML parsing is not supported by this browser.');
    return new DOMParser().parseFromString(String(value), 'text/html');
}

const htmlInput = () => textareaInput('html', 'كود HTML', 'HTML code', '<article><h1>Title</h1><a href="https://example.com">Example</a></article>');
const textInput = () => textareaInput('text', 'النص', 'Text', 'https://example.com/page?utm_source=test&id=1');

const htmlLinkExtractor = tool(
    'html-link-extractor', 'A',
    { ar: 'استخراج الروابط من HTML', en: 'HTML Link Extractor' },
    { ar: 'استخرج قيم href ونصوص جميع الروابط من HTML.', en: 'Extract href values and labels from every HTML link.' },
    { ar: 'تُزال الروابط المكررة.', en: 'Duplicate links are removed.' },
    htmlInput(),
    (value) => [...new Map([...parseHtml(value).querySelectorAll('a[href]')].map((node) => [node.href, `${node.href}\t${node.textContent.trim()}`])).values()].join('\n'),
    'adawaty-html-links.tsv',
);

const htmlImageSourceExtractor = tool(
    'html-image-source-extractor', 'IMG',
    { ar: 'استخراج الصور من HTML', en: 'HTML Image Source Extractor' },
    { ar: 'استخرج src وalt لجميع الصور داخل HTML.', en: 'Extract src and alt values for every HTML image.' },
    { ar: 'تظهر كل صورة في سطر منفصل.', en: 'Each image is written on a separate line.' },
    htmlInput(),
    (value) => [...parseHtml(value).querySelectorAll('img[src]')].map((node) => `${node.src}\t${node.alt || ''}`).join('\n'),
    'adawaty-html-images.tsv',
);

const htmlHeadingExtractor = tool(
    'html-heading-extractor', 'H1',
    { ar: 'استخراج عناوين HTML', en: 'HTML Heading Extractor' },
    { ar: 'استخرج H1 إلى H6 بالترتيب لمراجعة بنية الصفحة.', en: 'Extract H1 through H6 in order to audit page structure.' },
    { ar: 'مفيد لمراجعة SEO وهيكل المحتوى.', en: 'Useful for SEO and content-structure audits.' },
    htmlInput(),
    (value) => [...parseHtml(value).querySelectorAll('h1,h2,h3,h4,h5,h6')].map((node) => `${node.tagName}\t${node.textContent.trim()}`).join('\n'),
    'adawaty-html-headings.tsv',
);

const htmlTableToCsv = tool(
    'html-table-to-csv-converter', 'TABLE',
    { ar: 'تحويل جدول HTML إلى CSV', en: 'HTML Table to CSV Converter' },
    { ar: 'حوّل أول جدول HTML إلى بيانات CSV مقتبسة بشكل صحيح.', en: 'Convert the first HTML table into correctly quoted CSV data.' },
    { ar: 'تُقرأ خلايا th وtd.', en: 'Both th and td cells are read.' },
    htmlInput(),
    (value) => {
        const table = parseHtml(value).querySelector('table');
        if (!table) throw new Error('No HTML table was found.');
        return stringifyDelimited([...table.rows].map((row) => [...row.cells].map((cell) => cell.textContent.trim())), ',');
    },
    'adawaty-html-table.csv',
);

const htmlMetaTagExtractor = tool(
    'html-meta-tag-extractor', 'META',
    { ar: 'استخراج Meta Tags من HTML', en: 'HTML Meta Tag Extractor' },
    { ar: 'استخرج name وproperty وcontent لجميع وسوم meta.', en: 'Extract name, property and content from every meta tag.' },
    { ar: 'يشمل Open Graph وTwitter Cards.', en: 'Includes Open Graph and Twitter Card metadata.' },
    htmlInput(),
    (value) => [...parseHtml(value).querySelectorAll('meta')].map((node) => `${node.getAttribute('name') || node.getAttribute('property') || 'meta'}\t${node.getAttribute('content') || ''}`).join('\n'),
    'adawaty-meta-tags.tsv',
);

const markdownLinkExtractor = tool(
    'markdown-link-extractor', '[]()',
    { ar: 'استخراج روابط Markdown', en: 'Markdown Link Extractor' },
    { ar: 'استخرج عناوين وروابط Markdown العادية.', en: 'Extract labels and URLs from standard Markdown links.' },
    { ar: 'لا تُحسب الصور كروابط.', en: 'Markdown images are excluded.' },
    textareaInput('markdown', 'نص Markdown', 'Markdown text', '[OpenAI](https://openai.com)\n[Example](https://example.com)'),
    (value) => [...String(value).matchAll(/(?<!!)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu)].map((match) => `${match[2]}\t${match[1]}`).join('\n'),
    'adawaty-markdown-links.tsv',
);

const markdownImageExtractor = tool(
    'markdown-image-extractor', '![]',
    { ar: 'استخراج صور Markdown', en: 'Markdown Image Extractor' },
    { ar: 'استخرج مصدر الصورة والنص البديل من Markdown.', en: 'Extract image sources and alt text from Markdown.' },
    { ar: 'تُكتب كل صورة في سطر.', en: 'Each image is written on one line.' },
    textareaInput('markdown', 'نص Markdown', 'Markdown text', '![Logo](https://example.com/logo.png)'),
    (value) => [...String(value).matchAll(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu)].map((match) => `${match[2]}\t${match[1]}`).join('\n'),
    'adawaty-markdown-images.tsv',
);

const urlDomainExtractor = tool(
    'url-domain-extractor', 'HOST',
    { ar: 'استخراج النطاقات من الروابط', en: 'URL Domain Extractor' },
    { ar: 'حوّل قائمة روابط إلى قائمة نطاقات فريدة.', en: 'Turn a URL list into a unique domain list.' },
    { ar: 'يتم تجاهل الروابط غير الصحيحة.', en: 'Invalid URLs are ignored.' },
    textInput(),
    (value) => [...new Set(String(value).split(/\s+/).map((item) => {
        try { return new URL(item).hostname; } catch { return ''; }
    }).filter(Boolean))].join('\n'),
    'adawaty-domains.txt',
);

const urlQueryParameterRemover = tool(
    'url-query-parameter-remover', '?×',
    { ar: 'حذف معاملات URL', en: 'URL Query Parameter Remover' },
    { ar: 'احذف query string وhash من قائمة روابط مع الحفاظ على المسارات.', en: 'Remove query strings and hashes from URLs while preserving paths.' },
    { ar: 'مفيد لتنظيف روابط التتبع.', en: 'Useful for cleaning tracking URLs.' },
    textInput(),
    (value) => String(value).split(/\s+/).filter(Boolean).map((item) => {
        const url = new URL(item);
        url.search = '';
        url.hash = '';
        return url.href;
    }).join('\n'),
    'adawaty-clean-urls.txt',
);

const urlListDeduplicator = tool(
    'url-list-deduplicator', 'URL1',
    { ar: 'تنظيف وتوحيد قائمة روابط', en: 'URL List Deduplicator' },
    { ar: 'وحّد الروابط واحذف التكرارات والـhash مع ترتيب ثابت.', en: 'Normalize URLs and remove duplicates and fragments in stable order.' },
    { ar: 'تُوحّد أسماء النطاقات إلى أحرف صغيرة.', en: 'Hostnames are normalized to lowercase.' },
    textInput(),
    (value) => [...new Set(String(value).split(/\s+/).filter(Boolean).map((item) => {
        const url = new URL(item);
        url.hash = '';
        return url.href;
    }))].join('\n'),
    'adawaty-unique-urls.txt',
);

const webContentToolDefinitions = Object.freeze(Object.fromEntries([
    htmlLinkExtractor,
    htmlImageSourceExtractor,
    htmlHeadingExtractor,
    htmlTableToCsv,
    htmlMetaTagExtractor,
    markdownLinkExtractor,
    markdownImageExtractor,
    urlDomainExtractor,
    urlQueryParameterRemover,
    urlListDeduplicator,
].map((definition) => [definition.id, definition])));

export { webContentToolDefinitions };

// END OF FILE
