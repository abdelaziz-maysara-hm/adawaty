function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function textInput(id, label, placeholder, rows = 7) {
    return Object.freeze({
        id, type: 'textarea', rows,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
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

function selectInput(id, label, options) {
    return Object.freeze({
        id, type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze(option))),
    });
}

function frontendTool(config) {
    return Object.freeze({
        id: config.id,
        category: 'developer',
        icon: config.icon,
        title: Object.freeze(config.title),
        description: Object.freeze(config.description),
        note: Object.freeze(config.note),
        inputs: Object.freeze(config.inputs),
        calculate: config.calculate,
    });
}

function escapeHtml(value) {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function decodeHtmlEntities(value) {
    const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
        if (entity[0] === '#') {
            const hexadecimal = entity[1]?.toLowerCase() === 'x';
            const codePoint = Number.parseInt(entity.slice(hexadecimal ? 2 : 1), hexadecimal ? 16 : 10);
            return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : match;
        }
        return entities[entity.toLowerCase()] ?? match;
    });
}

const htmlMinifier = frontendTool({
    id: 'html-minifier',
    icon: '</>',
    title: { ar: 'تصغير HTML', en: 'HTML Minifier' },
    description: { ar: 'قلّل حجم HTML بحذف التعليقات والمسافات الزائدة بين العناصر.', en: 'Reduce HTML size by removing comments and unnecessary whitespace between elements.' },
    note: { ar: 'يحافظ على محتوى pre وtextarea وscript وstyle دون تعديل.', en: 'Content inside pre, textarea, script and style elements is preserved.' },
    inputs: [textInput('html', { ar: 'كود HTML', en: 'HTML code' }, '<main>\n  <h1>Hello</h1>\n  <p>Free tools</p>\n</main>')],
    calculate(values, language) {
        const blocks = [];
        const protectedHtml = values.html.replace(/<(pre|textarea|script|style)\b[\s\S]*?<\/\1>/gi, (block) => {
            blocks.push(block);
            return `___ADAWATY_BLOCK_${blocks.length - 1}___`;
        });
        const minified = protectedHtml
            .replace(/<!--(?!\[if)[\s\S]*?-->/g, '')
            .replace(/>\s+</g, '><')
            .replace(/\s{2,}/g, ' ')
            .trim()
            .replace(/___ADAWATY_BLOCK_(\d+)___/g, (_, index) => blocks[Number(index)]);
        return output(minified, localized(language, `${values.html.length - minified.length} حرفًا تم توفيره`, `${values.html.length - minified.length} characters saved`));
    },
});

const htmlBeautifier = frontendTool({
    id: 'html-beautifier',
    icon: '<↵>',
    title: { ar: 'تنسيق HTML', en: 'HTML Beautifier' },
    description: { ar: 'نسّق بنية HTML بمسافات بادئة وأسطر واضحة.', en: 'Format HTML structure with readable indentation and line breaks.' },
    note: { ar: 'منسق محافظ مناسب للمقاطع والصفحات الصغيرة.', en: 'A conservative formatter intended for snippets and small pages.' },
    inputs: [textInput('html', { ar: 'كود HTML', en: 'HTML code' }, '<main><h1>Hello</h1><p>Free tools</p></main>')],
    calculate(values, language) {
        const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
        const tokens = values.html.trim().replace(/>\s*</g, '><').split(/(<[^>]+>)/).filter((token) => token.trim());
        let depth = 0;
        const lines = [];
        for (const rawToken of tokens) {
            const token = rawToken.trim();
            const closing = /^<\//.test(token);
            const opening = token.match(/^<([a-z][\w:-]*)\b/i);
            if (closing) depth = Math.max(0, depth - 1);
            lines.push(`${'  '.repeat(depth)}${token}`);
            if (opening && !token.endsWith('/>') && !voidTags.has(opening[1].toLowerCase()) && !token.includes(`</${opening[1]}`)) depth += 1;
        }
        return output(lines.join('\n'), localized(language, 'HTML منسق', 'Formatted HTML'));
    },
});

const htmlToText = frontendTool({
    id: 'html-to-text-converter',
    icon: 'HTML→T',
    title: { ar: 'تحويل HTML إلى نص', en: 'HTML to Text Converter' },
    description: { ar: 'استخرج النص المقروء من HTML مع الحفاظ على فواصل الأسطر الأساسية.', en: 'Extract readable text from HTML while preserving useful line breaks.' },
    note: { ar: 'تُحذف عناصر script وstyle بالكامل قبل استخراج النص.', en: 'Script and style elements are removed before text extraction.' },
    inputs: [textInput('html', { ar: 'كود HTML', en: 'HTML code' }, '<h1>Hello</h1><p>Free <strong>tools</strong>.</p>')],
    calculate(values, language) {
        const text = decodeHtmlEntities(values.html
            .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, '')
            .replace(/<(br|hr)\s*\/?>/gi, '\n')
            .replace(/<\/(p|div|section|article|header|footer|h[1-6]|li|tr)>/gi, '\n')
            .replace(/<li\b[^>]*>/gi, '• ')
            .replace(/<[^>]+>/g, ''))
            .replace(/[ \t]+\n/g, '\n')
            .replace(/\n{3,}/g, '\n\n')
            .trim();
        return output(text, localized(language, `${text.length} حرفًا`, `${text.length} characters`));
    },
});

const htmlTagCounter = frontendTool({
    id: 'html-tag-counter',
    icon: '<#>',
    title: { ar: 'عداد وسوم HTML', en: 'HTML Tag Counter' },
    description: { ar: 'احسب تكرار وسوم HTML ورتبها من الأكثر استخدامًا.', en: 'Count HTML tags and sort them by frequency.' },
    note: { ar: 'لا تُحسب وسوم الإغلاق بشكل منفصل.', en: 'Closing tags are not counted separately.' },
    inputs: [textInput('html', { ar: 'كود HTML', en: 'HTML code' }, '<main><p>One</p><p>Two</p></main>')],
    calculate(values, language) {
        const counts = {};
        for (const match of values.html.matchAll(/<([a-z][\w:-]*)\b[^>]*>/gi)) {
            const tag = match[1].toLowerCase();
            counts[tag] = (counts[tag] ?? 0) + 1;
        }
        const sorted = Object.fromEntries(Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0])));
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
        return output(JSON.stringify(sorted, null, 2), localized(language, `${total} وسمًا`, `${total} tags`));
    },
});

const markdownToHtml = frontendTool({
    id: 'markdown-to-html-converter',
    icon: 'MD→HTML',
    title: { ar: 'تحويل Markdown إلى HTML', en: 'Markdown to HTML Converter' },
    description: { ar: 'حوّل صياغات Markdown الشائعة إلى HTML آمن وبسيط.', en: 'Convert common Markdown syntax into simple, escaped HTML.' },
    note: { ar: 'يدعم العناوين والقوائم والروابط والنص العريض والمائل والكود.', en: 'Supports headings, lists, links, bold, italic and inline code.' },
    inputs: [textInput('markdown', { ar: 'نص Markdown', en: 'Markdown text' }, '# Tools\n\n- Fast\n- Free\n\nVisit **Adawaty**.')],
    calculate(values, language) {
        const lines = escapeHtml(values.markdown).split(/\r?\n/);
        const rendered = [];
        let inList = false;
        const inline = (line) => line
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
            .replace(/\*([^*]+)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
        for (const line of lines) {
            const list = line.match(/^\s*[-*]\s+(.+)/);
            if (list) {
                if (!inList) rendered.push('<ul>');
                inList = true;
                rendered.push(`  <li>${inline(list[1])}</li>`);
                continue;
            }
            if (inList) {
                rendered.push('</ul>');
                inList = false;
            }
            const heading = line.match(/^(#{1,6})\s+(.+)/);
            if (heading) rendered.push(`<h${heading[1].length}>${inline(heading[2])}</h${heading[1].length}>`);
            else if (line.trim()) rendered.push(`<p>${inline(line)}</p>`);
        }
        if (inList) rendered.push('</ul>');
        return output(rendered.join('\n'), localized(language, 'HTML جاهز', 'Generated HTML'));
    },
});

const cssMinifier = frontendTool({
    id: 'css-minifier',
    icon: '{CSS}',
    title: { ar: 'تصغير CSS', en: 'CSS Minifier' },
    description: { ar: 'احذف التعليقات والمسافات غير الضرورية لتقليل حجم CSS.', en: 'Remove comments and unnecessary whitespace to reduce CSS size.' },
    note: { ar: 'تظل القيم النصية بين علامات الاقتباس دون تعديل.', en: 'Quoted string values are preserved.' },
    inputs: [textInput('css', { ar: 'كود CSS', en: 'CSS code' }, '.card {\n  color: #123456;\n  padding: 1rem 2rem;\n}')],
    calculate(values, language) {
        const strings = [];
        const protectedCss = values.css.replace(/(["'])(?:\\.|(?!\1)[^\\])*\1/g, (value) => {
            strings.push(value);
            return `___ADAWATY_STRING_${strings.length - 1}___`;
        });
        const minified = protectedCss
            .replace(/\/\*[\s\S]*?\*\//g, '')
            .replace(/\s+/g, ' ')
            .replace(/\s*([{}:;,>+~])\s*/g, '$1')
            .replace(/;}/g, '}')
            .trim()
            .replace(/___ADAWATY_STRING_(\d+)___/g, (_, index) => strings[Number(index)]);
        return output(minified, localized(language, `${values.css.length - minified.length} حرفًا تم توفيره`, `${values.css.length - minified.length} characters saved`));
    },
});

const cssSpecificity = frontendTool({
    id: 'css-specificity-calculator',
    icon: '#.tag',
    title: { ar: 'حاسبة أولوية CSS', en: 'CSS Specificity Calculator' },
    description: { ar: 'احسب أولوية محدد CSS بصيغة inline-ID-class-element.', en: 'Calculate CSS selector specificity as inline-ID-class-element.' },
    note: { ar: 'حساب عملي للمحددات الشائعة.', en: 'A practical calculation for common selectors.' },
    inputs: [textInput('selector', { ar: 'محدد CSS', en: 'CSS selector' }, '#app .card:hover > h2::before', 3)],
    calculate(values, language) {
        const selector = values.selector.replace(/(["']).*?\1/g, '');
        const ids = (selector.match(/#[\w-]+/g) ?? []).length;
        const classes = (selector.match(/\.[\w-]+|\[[^\]]+\]|(?<!:):(?!:)[\w-]+(?:\([^)]*\))?/g) ?? []).length;
        const stripped = selector
            .replace(/#[\w-]+|\.[\w-]+|\[[^\]]+\]|::?[\w-]+(?:\([^)]*\))?/g, ' ')
            .replace(/[>+~*,]/g, ' ');
        const elements = (stripped.match(/\b[a-z][\w-]*\b/gi) ?? []).length + (selector.match(/::[\w-]+/g) ?? []).length;
        return output(`0-${ids}-${classes}-${elements}`, localized(language, 'الأولوية', 'Specificity'));
    },
});

const cssUnitConverter = frontendTool({
    id: 'css-px-rem-converter',
    icon: 'px↔rem',
    title: { ar: 'محول PX وREM', en: 'PX to REM Converter' },
    description: { ar: 'حوّل قيم CSS بين px وrem باستخدام حجم خط جذري قابل للتعديل.', en: 'Convert CSS values between px and rem using a configurable root font size.' },
    note: { ar: 'القيمة الافتراضية لحجم الخط الجذري هي 16px.', en: 'The default root font size is 16px.' },
    inputs: [
        numberInput('value', { ar: 'القيمة', en: 'Value' }, 24, 0, 100000, 0.01),
        numberInput('rootSize', { ar: 'حجم الخط الجذري', en: 'Root font size' }, 16, 1, 1000, 0.01),
        selectInput('direction', { ar: 'اتجاه التحويل', en: 'Conversion direction' }, [
            { value: 'px-to-rem', label: { ar: 'px إلى rem', en: 'px to rem' } },
            { value: 'rem-to-px', label: { ar: 'rem إلى px', en: 'rem to px' } },
        ]),
    ],
    calculate(values, language) {
        const result = values.direction === 'rem-to-px' ? values.value * values.rootSize : values.value / values.rootSize;
        const unit = values.direction === 'rem-to-px' ? 'px' : 'rem';
        return output(`${Number(result.toFixed(6))}${unit}`, localized(language, 'القيمة المحولة', 'Converted value'));
    },
});

const dataUriEncoder = frontendTool({
    id: 'data-uri-encoder',
    icon: 'DATA:',
    title: { ar: 'ترميز Data URI', en: 'Data URI Encoder' },
    description: { ar: 'حوّل النص إلى Data URI مدمج باستخدام ترميز URL القياسي.', en: 'Convert text into an embeddable Data URI using standard URL encoding.' },
    note: { ar: 'مناسب للنصوص وSVG وCSS الصغيرة دون رفع البيانات.', en: 'Useful for small text, SVG and CSS payloads without uploading data.' },
    inputs: [
        textInput('content', { ar: 'المحتوى', en: 'Content' }, '<svg xmlns="http://www.w3.org/2000/svg"></svg>'),
        textInput('mimeType', { ar: 'نوع MIME', en: 'MIME type' }, 'image/svg+xml', 2),
    ],
    calculate(values, language) {
        const mimeType = values.mimeType.trim().toLowerCase();
        if (!/^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/i.test(mimeType)) {
            throw new Error(localized(language, 'أدخل نوع MIME صالحًا.', 'Enter a valid MIME type.'));
        }
        return output(`data:${mimeType};charset=utf-8,${encodeURIComponent(values.content)}`, localized(language, 'Data URI', 'Data URI'));
    },
});

const dataUriDecoder = frontendTool({
    id: 'data-uri-decoder',
    icon: 'DATA→T',
    title: { ar: 'فك Data URI', en: 'Data URI Decoder' },
    description: { ar: 'استخرج نوع المحتوى والنص من Data URI المرمز كرابط أو Base64.', en: 'Extract content type and text from URL-encoded or Base64 Data URIs.' },
    note: { ar: 'تتم العملية داخل المتصفح ولا تُرسل البيانات خارجيًا.', en: 'Processing stays in the browser and data is not uploaded.' },
    inputs: [textInput('uri', { ar: 'رابط Data URI', en: 'Data URI' }, 'data:text/plain;charset=utf-8,Hello%20Adawaty')],
    calculate(values, language) {
        const match = values.uri.trim().match(/^data:([^,]*?),(.*)$/s);
        if (!match) throw new Error(localized(language, 'أدخل Data URI صالحًا.', 'Enter a valid Data URI.'));
        const base64 = /;base64(?:;|$)/i.test(match[1]);
        try {
            const decoded = base64
                ? decodeURIComponent(Array.from(atob(match[2]), (character) => `%${character.charCodeAt(0).toString(16).padStart(2, '0')}`).join(''))
                : decodeURIComponent(match[2]);
            return output(decoded, localized(language, match[1] || 'text/plain', match[1] || 'text/plain'));
        } catch {
            throw new Error(localized(language, 'تعذر فك محتوى Data URI.', 'Unable to decode the Data URI payload.'));
        }
    },
});

const frontendDeveloperDefinitions = Object.freeze({
    [htmlMinifier.id]: htmlMinifier,
    [htmlBeautifier.id]: htmlBeautifier,
    [htmlToText.id]: htmlToText,
    [htmlTagCounter.id]: htmlTagCounter,
    [markdownToHtml.id]: markdownToHtml,
    [cssMinifier.id]: cssMinifier,
    [cssSpecificity.id]: cssSpecificity,
    [cssUnitConverter.id]: cssUnitConverter,
    [dataUriEncoder.id]: dataUriEncoder,
    [dataUriDecoder.id]: dataUriDecoder,
});

export { frontendDeveloperDefinitions };

// END OF FILE
