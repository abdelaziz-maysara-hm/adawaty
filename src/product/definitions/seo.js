function localized(language, ar, en) {
    return language === 'ar' ? ar : en;
}

function output(value, label, details = '') {
    return { value: String(value), label, details };
}

function textInput(id, label, placeholder, rows = 3) {
    return Object.freeze({
        id,
        type: 'textarea',
        rows,
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        placeholder,
    });
}

function numberInput(id, label, placeholder, options = {}) {
    return Object.freeze({
        id,
        type: 'number',
        min: options.min ?? 0,
        max: options.max ?? 1_000_000,
        step: options.step ?? 1,
        label: Object.freeze(label),
        unit: Object.freeze(options.unit ?? { ar: '', en: '' }),
        placeholder: String(placeholder),
    });
}

function selectInput(id, label, options) {
    return Object.freeze({
        id,
        type: 'select',
        label: Object.freeze(label),
        unit: Object.freeze({ ar: '', en: '' }),
        options: Object.freeze(options.map((option) => Object.freeze({
            value: option.value,
            label: Object.freeze(option.label),
        }))),
    });
}

function escapeAttribute(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('"', '&quot;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;');
}

function requireUrl(value, language) {
    try {
        return new URL(String(value).trim());
    } catch {
        throw new Error(localized(language, 'أدخل رابطًا كاملًا وصالحًا.', 'Enter a valid absolute URL.'));
    }
}

function normalizeWords(value) {
    return String(value)
        .toLocaleLowerCase()
        .match(/[\p{L}\p{N}]+/gu) ?? [];
}

const robotsOptions = Object.freeze([
    { value: 'index,follow', label: { ar: 'فهرسة وتتبع', en: 'Index and follow' } },
    { value: 'noindex,follow', label: { ar: 'بدون فهرسة مع تتبع', en: 'No index, follow' } },
    { value: 'noindex,nofollow', label: { ar: 'بدون فهرسة أو تتبع', en: 'No index or follow' } },
]);

const metaTagGenerator = Object.freeze({
    id: 'meta-tag-generator',
    category: 'seo',
    icon: '<M>',
    title: Object.freeze({ ar: 'مولد وسوم Meta', en: 'Meta Tag Generator' }),
    description: Object.freeze({ ar: 'أنشئ وسوم العنوان والوصف والكلمات المفتاحية وتعليمات الروبوتات.', en: 'Generate title, description, keyword and robots meta tags.' }),
    note: Object.freeze({ ar: 'راجع طول العنوان والوصف قبل نشر الصفحة.', en: 'Review title and description lengths before publishing.' }),
    inputs: Object.freeze([
        textInput('title', { ar: 'عنوان الصفحة', en: 'Page title' }, 'Free Online Tools | Adawaty'),
        textInput('description', { ar: 'وصف الصفحة', en: 'Page description' }, 'Fast bilingual tools that work in your browser.'),
        textInput('keywords', { ar: 'الكلمات المفتاحية', en: 'Keywords' }, 'online tools, calculators, converters'),
        selectInput('robots', { ar: 'تعليمات الروبوتات', en: 'Robots directive' }, robotsOptions),
    ]),
    calculate(values, language) {
        const tags = [
            `<title>${escapeAttribute(values.title)}</title>`,
            `<meta name="description" content="${escapeAttribute(values.description)}">`,
            `<meta name="keywords" content="${escapeAttribute(values.keywords)}">`,
            `<meta name="robots" content="${escapeAttribute(values.robots)}">`,
        ].join('\n');
        return output(tags, localized(language, 'وسوم Meta', 'Meta tags'), `${values.title.length} title characters · ${values.description.length} description characters`);
    },
});

const openGraphGenerator = Object.freeze({
    id: 'open-graph-generator',
    category: 'seo',
    icon: 'OG',
    title: Object.freeze({ ar: 'مولد وسوم Open Graph', en: 'Open Graph Generator' }),
    description: Object.freeze({ ar: 'أنشئ وسوم المشاركة الاجتماعية لفيسبوك ولينكدإن والمنصات المتوافقة.', en: 'Create social sharing tags for Facebook, LinkedIn and compatible platforms.' }),
    note: Object.freeze({ ar: 'يفضل استخدام صورة بحجم 1200 × 630 بكسل.', en: 'A 1200 × 630 pixel image is recommended.' }),
    inputs: Object.freeze([
        textInput('title', { ar: 'عنوان المشاركة', en: 'Share title' }, 'Adawaty Free Online Tools'),
        textInput('description', { ar: 'وصف المشاركة', en: 'Share description' }, 'Useful tools that run directly in your browser.'),
        textInput('url', { ar: 'رابط الصفحة', en: 'Page URL' }, 'https://example.com/tools/'),
        textInput('image', { ar: 'رابط الصورة', en: 'Image URL' }, 'https://example.com/social-card.png'),
    ]),
    calculate(values, language) {
        const url = requireUrl(values.url, language);
        const image = requireUrl(values.image, language);
        return output([
            '<meta property="og:type" content="website">',
            `<meta property="og:title" content="${escapeAttribute(values.title)}">`,
            `<meta property="og:description" content="${escapeAttribute(values.description)}">`,
            `<meta property="og:url" content="${escapeAttribute(url.href)}">`,
            `<meta property="og:image" content="${escapeAttribute(image.href)}">`,
        ].join('\n'), localized(language, 'وسوم Open Graph', 'Open Graph tags'));
    },
});

const twitterCardGenerator = Object.freeze({
    id: 'twitter-card-generator',
    category: 'seo',
    icon: 'X',
    title: Object.freeze({ ar: 'مولد Twitter Card', en: 'Twitter Card Generator' }),
    description: Object.freeze({ ar: 'أنشئ وسوم بطاقة مشاركة محسنة لمنصة X وتويتر.', en: 'Generate optimized social card tags for X and Twitter.' }),
    note: Object.freeze({ ar: 'استخدم اسم الحساب مسبوقًا بعلامة @ إن وجد.', en: 'Include the @ prefix for the account name when available.' }),
    inputs: Object.freeze([
        textInput('title', { ar: 'العنوان', en: 'Title' }, 'Adawaty Online Tools'),
        textInput('description', { ar: 'الوصف', en: 'Description' }, 'Free calculators and utilities.'),
        textInput('image', { ar: 'رابط الصورة', en: 'Image URL' }, 'https://example.com/card.png'),
        textInput('site', { ar: 'حساب الموقع', en: 'Site account' }, '@adawaty'),
    ]),
    calculate(values, language) {
        const image = requireUrl(values.image, language);
        return output([
            '<meta name="twitter:card" content="summary_large_image">',
            `<meta name="twitter:title" content="${escapeAttribute(values.title)}">`,
            `<meta name="twitter:description" content="${escapeAttribute(values.description)}">`,
            `<meta name="twitter:image" content="${escapeAttribute(image.href)}">`,
            `<meta name="twitter:site" content="${escapeAttribute(values.site)}">`,
        ].join('\n'), localized(language, 'وسوم Twitter Card', 'Twitter Card tags'));
    },
});

const utmBuilder = Object.freeze({
    id: 'utm-link-builder',
    category: 'seo',
    icon: 'UTM',
    title: Object.freeze({ ar: 'منشئ روابط UTM', en: 'UTM Link Builder' }),
    description: Object.freeze({ ar: 'أضف معاملات تتبع الحملات إلى روابطك بطريقة صحيحة.', en: 'Add correctly encoded campaign tracking parameters to a URL.' }),
    note: Object.freeze({ ar: 'المصدر والوسيط واسم الحملة أهم معاملات التتبع.', en: 'Source, medium and campaign are the core tracking parameters.' }),
    inputs: Object.freeze([
        textInput('url', { ar: 'الرابط الأساسي', en: 'Base URL' }, 'https://example.com/landing-page'),
        textInput('source', { ar: 'مصدر الحملة', en: 'Campaign source' }, 'newsletter'),
        textInput('medium', { ar: 'وسيط الحملة', en: 'Campaign medium' }, 'email'),
        textInput('campaign', { ar: 'اسم الحملة', en: 'Campaign name' }, 'summer_launch'),
        textInput('content', { ar: 'محتوى الإعلان', en: 'Campaign content' }, 'hero_button'),
    ]),
    calculate(values, language) {
        const url = requireUrl(values.url, language);
        url.searchParams.set('utm_source', values.source.trim());
        url.searchParams.set('utm_medium', values.medium.trim());
        url.searchParams.set('utm_campaign', values.campaign.trim());
        if (values.content.trim()) {
            url.searchParams.set('utm_content', values.content.trim());
        }
        return output(url.href, localized(language, 'رابط الحملة', 'Campaign URL'));
    },
});

const robotsTxtGenerator = Object.freeze({
    id: 'robots-txt-generator',
    category: 'seo',
    icon: 'BOT',
    title: Object.freeze({ ar: 'مولد ملف robots.txt', en: 'robots.txt Generator' }),
    description: Object.freeze({ ar: 'أنشئ قواعد أساسية للزحف مع رابط خريطة الموقع.', en: 'Generate basic crawler rules with a sitemap reference.' }),
    note: Object.freeze({ ar: 'اختبر الملف قبل منع أي مسار مهم من الزحف.', en: 'Test the file before blocking important paths.' }),
    inputs: Object.freeze([
        textInput('domain', { ar: 'نطاق الموقع', en: 'Website URL' }, 'https://example.com/'),
        textInput('disallow', { ar: 'المسارات الممنوعة، كل مسار في سطر', en: 'Blocked paths, one per line' }, '/admin/\n/private/', 5),
    ]),
    calculate(values, language) {
        const domain = requireUrl(values.domain, language);
        const blocked = values.disallow
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean);
        const lines = ['User-agent: *', 'Allow: /'];
        for (const path of blocked) {
            lines.push(`Disallow: ${path.startsWith('/') ? path : `/${path}`}`);
        }
        lines.push(`Sitemap: ${new URL('sitemap.xml', domain).href}`);
        return output(lines.join('\n'), localized(language, 'محتوى robots.txt', 'robots.txt content'));
    },
});

const canonicalGenerator = Object.freeze({
    id: 'canonical-tag-generator',
    category: 'seo',
    icon: 'URL',
    title: Object.freeze({ ar: 'مولد الرابط الأساسي Canonical', en: 'Canonical Tag Generator' }),
    description: Object.freeze({ ar: 'أنشئ وسم canonical لتحديد النسخة الأساسية من الصفحة.', en: 'Generate a canonical tag that identifies the preferred page URL.' }),
    note: Object.freeze({ ar: 'استخدم رابطًا مطلقًا قابلًا للفهرسة.', en: 'Use an absolute, indexable URL.' }),
    inputs: Object.freeze([textInput('url', { ar: 'الرابط الأساسي', en: 'Canonical URL' }, 'https://example.com/guides/seo/')]),
    calculate(values, language) {
        const url = requireUrl(values.url, language);
        return output(`<link rel="canonical" href="${escapeAttribute(url.href)}">`, localized(language, 'وسم Canonical', 'Canonical tag'));
    },
});

const hreflangGenerator = Object.freeze({
    id: 'hreflang-tag-generator',
    category: 'seo',
    icon: 'AR/EN',
    title: Object.freeze({ ar: 'مولد وسوم hreflang', en: 'hreflang Tag Generator' }),
    description: Object.freeze({ ar: 'أنشئ روابط النسختين العربية والإنجليزية والنسخة الافتراضية.', en: 'Generate Arabic, English and default alternate-language links.' }),
    note: Object.freeze({ ar: 'يجب أن تشير كل نسخة إلى نفسها وإلى النسخ الأخرى.', en: 'Each localized page should reference itself and all alternates.' }),
    inputs: Object.freeze([
        textInput('arabicUrl', { ar: 'رابط النسخة العربية', en: 'Arabic page URL' }, 'https://example.com/ar/tools/'),
        textInput('englishUrl', { ar: 'رابط النسخة الإنجليزية', en: 'English page URL' }, 'https://example.com/en/tools/'),
    ]),
    calculate(values, language) {
        const arabic = requireUrl(values.arabicUrl, language);
        const english = requireUrl(values.englishUrl, language);
        return output([
            `<link rel="alternate" hreflang="ar" href="${escapeAttribute(arabic.href)}">`,
            `<link rel="alternate" hreflang="en" href="${escapeAttribute(english.href)}">`,
            `<link rel="alternate" hreflang="x-default" href="${escapeAttribute(english.href)}">`,
        ].join('\n'), localized(language, 'وسوم اللغات البديلة', 'Alternate-language tags'));
    },
});

const sitemapEntryGenerator = Object.freeze({
    id: 'sitemap-entry-generator',
    category: 'seo',
    icon: 'XML',
    title: Object.freeze({ ar: 'مولد إدخال Sitemap', en: 'Sitemap Entry Generator' }),
    description: Object.freeze({ ar: 'أنشئ إدخال XML صالحًا لإضافته إلى خريطة الموقع.', en: 'Generate a valid XML URL entry for a sitemap.' }),
    note: Object.freeze({ ar: 'الأولوية قيمة نسبية بين صفحات موقعك وليست ضمانًا للترتيب.', en: 'Priority is relative within your site and does not guarantee ranking.' }),
    inputs: Object.freeze([
        textInput('url', { ar: 'رابط الصفحة', en: 'Page URL' }, 'https://example.com/tools/calculator/'),
        selectInput('changeFrequency', { ar: 'معدل التغيير', en: 'Change frequency' }, [
            { value: 'daily', label: { ar: 'يومي', en: 'Daily' } },
            { value: 'weekly', label: { ar: 'أسبوعي', en: 'Weekly' } },
            { value: 'monthly', label: { ar: 'شهري', en: 'Monthly' } },
            { value: 'yearly', label: { ar: 'سنوي', en: 'Yearly' } },
        ]),
        numberInput('priority', { ar: 'الأولوية', en: 'Priority' }, 0.8, { min: 0, max: 1, step: 0.1 }),
    ]),
    calculate(values, language) {
        const url = requireUrl(values.url, language);
        return output([
            '<url>',
            `  <loc>${escapeAttribute(url.href)}</loc>`,
            `  <changefreq>${values.changeFrequency}</changefreq>`,
            `  <priority>${Number(values.priority).toFixed(1)}</priority>`,
            '</url>',
        ].join('\n'), localized(language, 'إدخال XML', 'XML sitemap entry'));
    },
});

const keywordDensity = Object.freeze({
    id: 'keyword-density-checker',
    category: 'seo',
    icon: 'KW',
    title: Object.freeze({ ar: 'فاحص كثافة الكلمات المفتاحية', en: 'Keyword Density Checker' }),
    description: Object.freeze({ ar: 'احسب مرات ظهور كلمة أو عبارة ونسبتها داخل النص.', en: 'Calculate how often a keyword or phrase appears in a text.' }),
    note: Object.freeze({ ar: 'اكتب للقارئ أولًا وتجنب الحشو غير الطبيعي للكلمات.', en: 'Write for readers first and avoid unnatural keyword stuffing.' }),
    inputs: Object.freeze([
        textInput('keyword', { ar: 'الكلمة أو العبارة', en: 'Keyword or phrase' }, 'online tools'),
        textInput('text', { ar: 'النص', en: 'Text' }, 'Online tools make everyday calculations easier. These online tools work in the browser.', 10),
    ]),
    calculate(values, language) {
        const words = normalizeWords(values.text);
        const phrase = normalizeWords(values.keyword);
        if (!phrase.length || !words.length) {
            throw new Error(localized(language, 'أدخل كلمة مفتاحية ونصًا صالحين.', 'Enter a valid keyword and text.'));
        }
        let occurrences = 0;
        for (let index = 0; index <= words.length - phrase.length; index += 1) {
            if (phrase.every((word, offset) => words[index + offset] === word)) {
                occurrences += 1;
            }
        }
        const density = (occurrences * phrase.length / words.length) * 100;
        return output(
            `${density.toFixed(2)}%`,
            localized(language, 'كثافة الكلمة المفتاحية', 'Keyword density'),
            `${occurrences} occurrences · ${words.length} words`,
        );
    },
});

const serpPreview = Object.freeze({
    id: 'serp-snippet-preview',
    category: 'seo',
    icon: 'SERP',
    title: Object.freeze({ ar: 'معاينة نتيجة البحث', en: 'SERP Snippet Preview' }),
    description: Object.freeze({ ar: 'عاين شكل عنوان صفحتك ورابطها ووصفها في نتائج البحث.', en: 'Preview a page title, URL and description as a search result.' }),
    note: Object.freeze({ ar: 'قد تعيد محركات البحث كتابة العنوان أو الوصف تلقائيًا.', en: 'Search engines may rewrite titles and descriptions automatically.' }),
    inputs: Object.freeze([
        textInput('title', { ar: 'عنوان SEO', en: 'SEO title' }, 'Free Online Calculators and Tools | Adawaty'),
        textInput('url', { ar: 'رابط الصفحة', en: 'Page URL' }, 'https://example.com/free-tools/'),
        textInput('description', { ar: 'وصف Meta', en: 'Meta description' }, 'Use fast, private and bilingual calculators directly in your browser.'),
    ]),
    calculate(values, language) {
        const url = requireUrl(values.url, language);
        return output(
            `${values.title}\n${url.href}\n${values.description}`,
            localized(language, 'معاينة المقتطف', 'Snippet preview'),
            `${values.title.length}/60 title · ${values.description.length}/160 description`,
        );
    },
});

const seoChecker = Object.freeze({
    id: 'seo-checker',
    category: 'seo',
    icon: 'SEO',
    title: Object.freeze({ ar: 'فاحص SEO للصفحات', en: 'Website SEO Checker' }),
    description: Object.freeze({
        ar: 'افحص كود HTML واكتشف مشكلات العنوان والوصف والعناوين والصور والروابط ووسوم المشاركة.',
        en: 'Audit HTML for title, description, headings, images, links, canonical and social metadata issues.',
    }),
    note: Object.freeze({
        ar: 'ألصق مصدر HTML للصفحة؛ يتم الفحص محليًا داخل متصفحك ولا يُرفع الكود لأي خادم.',
        en: 'Paste the page HTML source. The audit runs locally in your browser and uploads nothing.',
    }),
    inputs: Object.freeze([
        textInput('html', { ar: 'كود HTML', en: 'HTML source' }, '<!doctype html><html><head><title>Example page</title><meta name="description" content="A useful page description."></head><body><h1>Example page</h1></body></html>', 16),
    ]),
    calculate(values, language) {
        const source = String(values.html ?? '').trim();
        if (!source) {
            throw new Error(localized(language, 'ألصق كود HTML صالحًا لفحصه.', 'Paste valid HTML source to audit.'));
        }
        const tagContent = (tag) => source.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1]
            ?.replace(/<[^>]+>/g, '').trim() ?? '';
        const tags = (tag) => source.match(new RegExp(`<${tag}\\b[^>]*>`, 'gi')) ?? [];
        const hasAttribute = (markup, name) => new RegExp(`\\s${name}(?:\\s*=|\\s|>)`, 'i').test(`${markup}>`);
        const hasMeta = (attribute, value) => new RegExp(`<meta\\b[^>]*\\s${attribute}\\s*=\\s*["']${value}["'][^>]*>`, 'i').test(source);
        const title = tagContent('title');
        const descriptionTag = source.match(/<meta\b[^>]*\sname\s*=\s*["']description["'][^>]*>/i)?.[0] ?? '';
        const description = descriptionTag.match(/\scontent\s*=\s*["']([^"']*)["']/i)?.[1].trim() ?? '';
        const h1Count = tags('h1').length;
        const images = tags('img');
        const links = source.match(/<a\b[^>]*\shref\s*=\s*["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi) ?? [];
        const tests = [
            [title.length >= 30 && title.length <= 60, localized(language, `طول العنوان ${title.length}/30–60`, `Title length ${title.length}/30–60`), 20],
            [description.length >= 70 && description.length <= 160, localized(language, `طول الوصف ${description.length}/70–160`, `Description length ${description.length}/70–160`), 20],
            [h1Count === 1, localized(language, `عدد عناوين H1: ${h1Count} (المطلوب واحد)`, `H1 count: ${h1Count} (expected one)`), 15],
            [/<link\b[^>]*\srel\s*=\s*["']canonical["'][^>]*>/i.test(source), localized(language, 'رابط Canonical', 'Canonical URL'), 10],
            [hasMeta('name', 'viewport'), localized(language, 'دعم شاشة الموبايل', 'Mobile viewport'), 10],
            [/<html\b[^>]*\slang\s*=\s*["'][^"']+["']/i.test(source), localized(language, 'لغة الصفحة', 'Document language'), 5],
            [images.every((image) => hasAttribute(image, 'alt')), localized(language, `نصوص الصور البديلة: ${images.filter((image) => hasAttribute(image, 'alt')).length}/${images.length}`, `Image alt text: ${images.filter((image) => hasAttribute(image, 'alt')).length}/${images.length}`), 10],
            [hasMeta('property', 'og:title'), localized(language, 'وسوم Open Graph', 'Open Graph tags'), 5],
            [links.every((link) => /<a\b[^>]*\saria-label\s*=|>\s*[^<\s]/i.test(link)), localized(language, 'أسماء الروابط', 'Accessible link names'), 5],
        ];
        const score = tests.reduce((total, [passed, , points]) => total + (passed ? points : 0), 0);
        const report = tests.map(([passed, label]) => `${passed ? '✓' : '✗'} ${label}`).join('\n');
        return output(`${score}/100`, localized(language, 'نتيجة فحص SEO', 'SEO audit score'), report);
    },
});

const seoDefinitions = Object.freeze({
    [seoChecker.id]: seoChecker,
    [metaTagGenerator.id]: metaTagGenerator,
    [openGraphGenerator.id]: openGraphGenerator,
    [twitterCardGenerator.id]: twitterCardGenerator,
    [utmBuilder.id]: utmBuilder,
    [robotsTxtGenerator.id]: robotsTxtGenerator,
    [canonicalGenerator.id]: canonicalGenerator,
    [hreflangGenerator.id]: hreflangGenerator,
    [sitemapEntryGenerator.id]: sitemapEntryGenerator,
    [keywordDensity.id]: keywordDensity,
    [serpPreview.id]: serpPreview,
});

export { seoDefinitions };

// END OF FILE
