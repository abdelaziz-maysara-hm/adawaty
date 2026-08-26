import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { listToolDefinitions } from '../src/product/tool-definitions.js';
import { retiredToolIds } from '../src/product/retired-tool-ids.js';
import { ROUNDUP_CONTENT } from '../src/product/definitions/roundup-content.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = 'https://adawaty.tools';

/**
 * Content-hash-based cache-busting, replacing the previous scheme of
 * hand-maintained version strings (e.g. `const assetVersion = 's7b46'`).
 *
 * A real, live bug this fixes: that hand-maintained string had to be
 * manually bumped after *any* change to tool-definitions.js or
 * anything it pulls in (all 121+ files under src/product/definitions/)
 * for the change to actually reach visitors -- Cloudflare's CDN cache
 * (and browsers) would otherwise keep serving the old cached file
 * under its unchanged URL indefinitely. This was missed for an
 * extended stretch of this project's history (confirmed directly: the
 * string was unchanged across many prior commits that DID touch tool
 * logic), and was the direct, confirmed cause of a live bug report --
 * currency-converter's fix to call a new same-origin API path never
 * reached the browser, because the JS file containing that fix kept
 * being served from cache under its old, unbumped version string.
 *
 * Hashing the actual file contents removes the human "don't forget to
 * bump this" step entirely: any real change to any of these files
 * changes the hash automatically, and an unrelated change changes
 * nothing (avoiding needless cache invalidation for pages that didn't
 * actually change).
 */
async function hashFiles(filePaths) {
    const hash = createHash('sha256');
    for (const filePath of filePaths) {
        // eslint-disable-next-line no-await-in-loop -- a handful of files, and hash order must be deterministic
        const content = await readFile(filePath);
        hash.update(content);
    }
    return hash.digest('hex').slice(0, 10);
}

async function listDefinitionFiles() {
    const definitionsDir = path.join(projectRoot, 'src/product/definitions');
    const entries = await readdir(definitionsDir, { withFileTypes: true });
    return entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.js'))
        .map((entry) => path.join(definitionsDir, entry.name))
        .sort(); // deterministic hash regardless of directory listing order
}

const definitionFiles = await listDefinitionFiles();

const assetVersion = await hashFiles([
    path.join(projectRoot, 'src/product/tool-definitions.js'),
    path.join(projectRoot, 'src/product/tool-page.js'),
    path.join(projectRoot, 'src/product/site-navigation.js'),
    path.join(projectRoot, 'src/product/usage-tracking.js'),
    ...definitionFiles,
]);
const catalogueAssetVersion = await hashFiles([
    path.join(projectRoot, 'src/product/tool-definitions.js'),
    path.join(projectRoot, 'src/product/catalogue-page.js'),
    path.join(projectRoot, 'src/product/site-navigation.js'),
    ...definitionFiles,
]);
const roundupAssetVersion = await hashFiles([
    path.join(projectRoot, 'src/product/roundup-page.js'),
    path.join(projectRoot, 'src/product/definitions/roundup-content.js'),
    path.join(projectRoot, 'src/product/site-navigation.js'),
]);
// main.css and product.css are loaded on every page type (tool,
// category, roundup) with no version string at all before this fix --
// a real, wide-reaching gap found while investigating why a CSS change
// for the new static-links section (added the same session) might not
// have reached visitors: Cloudflare's edge cache could keep serving a
// stale copy of either file under its never-changing URL indefinitely,
// the exact same class of bug already hit and fixed once for JS files.
const cssVersion = await hashFiles([
    path.join(projectRoot, 'src/css/main.css'),
    path.join(projectRoot, 'src/css/product.css'),
]);

const tools = listToolDefinitions();
const categories = Object.freeze({
    health: Object.freeze({ ar: 'أدوات الصحة', en: 'Health Tools' }),
    finance: Object.freeze({ ar: 'الأدوات المالية', en: 'Finance Tools' }),
    student: Object.freeze({ ar: 'أدوات الطلاب', en: 'Student Tools' }),
    'student-study': Object.freeze({ ar: 'أدوات الدراسة والعمل', en: 'Study & Work Tools' }),
    math: Object.freeze({ ar: 'أدوات الرياضيات', en: 'Math Tools' }),
    'date-time': Object.freeze({ ar: 'أدوات التاريخ والوقت', en: 'Date & Time Tools' }),
    converter: Object.freeze({ ar: 'أدوات التحويل', en: 'Converters' }),
    developer: Object.freeze({ ar: 'أدوات المطورين', en: 'Developer Tools' }),
    text: Object.freeze({ ar: 'أدوات النصوص', en: 'Text Tools' }),
    engineering: Object.freeze({ ar: 'أدوات الهندسة والعلوم', en: 'Engineering Tools' }),
    'security-network': Object.freeze({ ar: 'أدوات الأمان والشبكات', en: 'Security & Network Tools' }),
    seo: Object.freeze({ ar: 'أدوات تحسين محركات البحث', en: 'SEO Tools' }),
    'color-css': Object.freeze({ ar: 'أدوات الألوان وCSS', en: 'Color & CSS Tools' }),
    'home-lifestyle': Object.freeze({ ar: 'أدوات المنزل والحياة', en: 'Home & Lifestyle Tools' }),
    islamic: Object.freeze({ ar: 'الأدوات الإسلامية', en: 'Islamic Tools' }),
    image: Object.freeze({ ar: 'أدوات الصور والوسائط', en: 'Image & Media Tools' }),
    video: Object.freeze({ ar: 'أدوات الفيديو', en: 'Video Tools' }),
    audio: Object.freeze({ ar: 'أدوات الصوت والبودكاست', en: 'Audio & Podcast Tools' }),
    pdf: Object.freeze({ ar: 'أدوات PDF', en: 'PDF Tools' }),
});

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&')
        .replaceAll('<', '<')
        .replaceAll('>', '>')
        .replaceAll('"', '"')
        .replaceAll("'", '&#39;');
}

function safeJson(value) {
    return JSON.stringify(value).replaceAll('<', '\\u003c');
}

/**
 * Generates 3 genuinely true, tool-specific FAQ items reflecting this
 * site's actual, verified architecture (100% client-side, no account, no
 * server upload) rather than generic filler. FAQPage rich results (the
 * visible expandable dropdown in Google Search) were deprecated by
 * Google on 2026-05-07 across all sites, so this is NOT expected to
 * produce a search-result rich snippet -- the value here is genuine page
 * content depth (a real ranking-relevant signal, unlike a thin form-only
 * page) and answering real first-time-visitor questions, not a rich-
 * result bet. The JSON-LD is still included since it's a harmless, valid
 * schema.org type that costs nothing and may still help automated
 * content understanding (including AI-search summarization), even
 * without a visible SERP feature.
 */
function buildFaqItems(tool) {
    const isFileTool = tool.inputs.some((input) => input.type === 'file');
    const nameAr = tool.title.ar;
    const nameEn = tool.title.en;

    const items = [
        {
            questionAr: `هل استخدام ${nameAr} مجاني بالكامل؟`,
            questionEn: `Is ${nameEn} completely free?`,
            answerAr: 'نعم، بدون أي رسوم مخفية أو حاجة لإنشاء حساب أو تثبيت أي برنامج.',
            answerEn: 'Yes, with no hidden fees, no account required, and nothing to install.',
        },
        isFileTool
            ? {
                questionAr: `هل يتم رفع ملفي إلى خادم خارجي؟`,
                questionEn: `Is my file uploaded to an external server?`,
                answerAr: `لا، تعمل أداة ${nameAr} بالكامل داخل متصفحك؛ ملفك لا يغادر جهازك أبدًا ولا يُرسل لأي خادم.`,
                answerEn: `No, ${nameEn} runs entirely inside your browser; your file never leaves your device or gets sent to any server.`,
            }
            : {
                questionAr: `هل يتم إرسال بياناتي إلى خادم خارجي؟`,
                questionEn: `Is my data sent to an external server?`,
                answerAr: `لا، تعمل أداة ${nameAr} بالكامل داخل متصفحك، ولا تُرسل أي بيانات تدخلها إلى أي خادم.`,
                answerEn: `No, ${nameEn} runs entirely inside your browser, and nothing you enter is sent to any server.`,
            },
        {
            questionAr: `هل أحتاج إلى تثبيت برنامج لاستخدام ${nameAr}؟`,
            questionEn: `Do I need to install anything to use ${nameEn}?`,
            answerAr: 'لا، تعمل الأداة مباشرة من داخل متصفحك على الكمبيوتر أو الهاتف، بدون أي تثبيت.',
            answerEn: 'No, it runs directly in your browser on desktop or mobile, with nothing to install.',
        },
    ];

    return items;
}

function buildFaqSection(faqItems) {
    const itemsHtml = faqItems.map((item) => `
    <details class="faq-item">
      <summary><span data-copy="ar">${item.questionAr}</span><span data-copy="en">${item.questionEn}</span></summary>
      <p><span data-copy="ar">${item.answerAr}</span><span data-copy="en">${item.answerEn}</span></p>
    </details>`).join('');

    return `<section class="product-faq">
    <h2><span data-copy="ar">الأسئلة الشائعة</span><span data-copy="en">Frequently Asked Questions</span></h2>${itemsHtml}
  </section>`;
}

function buildFaqStructuredData(faqItems) {
    return safeJson({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map((item) => ({
            '@type': 'Question',
            name: item.questionEn,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.answerEn,
            },
        })),
    });
}

function createToolPage(tool) {
    const title = escapeHtml(tool.title.ar);
    const titleEn = escapeHtml(tool.title.en);
    const description = escapeHtml(tool.description.ar);
    const descriptionEn = escapeHtml(tool.description.en);
    const noteEn = escapeHtml(tool.note.en ?? '');
    const canonical = `${baseUrl}/tools/${tool.id}/`;
    const categoryLabel = categories[tool.category]?.ar ?? tool.category;
    const categoryUrl = `${baseUrl}/categories/${tool.category}/`;
    const relatedTools = tools
        .filter((candidate) => candidate.category === tool.category && candidate.id !== tool.id)
        .slice(0, 6);
    const structuredData = safeJson({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: tool.title.en,
        alternateName: tool.title.ar,
        description: tool.description.en,
        url: canonical,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript',
        offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
        },
        isAccessibleForFree: true,
        inLanguage: ['ar', 'en'],
    });
    const breadcrumbData = safeJson({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'أدواتي', item: `${baseUrl}/` },
            { '@type': 'ListItem', position: 2, name: categoryLabel, item: categoryUrl },
            { '@type': 'ListItem', position: 3, name: tool.title.ar, item: canonical },
        ],
    });
    const relatedData = relatedTools.length ? safeJson({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        itemListElement: relatedTools.map((related, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${baseUrl}/tools/${related.id}/`,
            name: related.title.ar,
        })),
    }) : '';
    const faqItems = buildFaqItems(tool);
    const faqSectionHtml = buildFaqSection(faqItems);
    const faqData = buildFaqStructuredData(faqItems);

    return `<!doctype html>
<html lang="ar" dir="rtl" data-language="ar">
<head>
    <meta charset="UTF-8">
    <script>(function(){var l='';try{l=localStorage.getItem('adawaty-language')||localStorage.getItem('adawaty-preview-language')||''}catch(e){}if(l!=='ar'&&l!=='en')l=(navigator.language||'').toLowerCase().startsWith('ar')?'ar':'en';var r=document.documentElement;r.lang=l;r.dir=l==='ar'?'rtl':'ltr';r.dataset.language=l;var s=document.createElement('style');s.textContent='[data-language="en"] [data-copy="ar"],[data-language="ar"] [data-copy="en"]{display:none!important}';r.appendChild(s);})();(function(){var i='G-N9X0ZTH17N';window.dataLayer=window.dataLayer||[];function g(){dataLayer.push(arguments)}window.gtag=g;g('js',new Date());g('config',i);var t=document.createElement('script');t.async=true;t.src='https://www.googletagmanager.com/gtag/js?id='+i;document.head.appendChild(t);})();</script>
    <link rel="icon" href="../../favicon.svg" type="image/svg+xml"><link rel="shortcut icon" href="../../favicon.ico">
    <meta http-equiv="Cache-Control" content="no-cache">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=()">
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="preconnect" href="https://cdn.sheetjs.com" crossorigin>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#07111f">
    <meta name="description" content="${description}">
    <title>${title} | أدواتي</title>
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" hreflang="ar" href="${canonical}">
    <link rel="alternate" hreflang="en" href="${canonical}">
    <link rel="alternate" hreflang="x-default" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${baseUrl}/og-image.svg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="أدواتي — Adawaty">
    <meta property="og:locale" content="ar_AR">
    <meta property="og:locale:alternate" content="en_US">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${baseUrl}/og-image.svg">
    <script type="application/ld+json">${structuredData}</script>
    <script type="application/ld+json">${breadcrumbData}</script>
    ${relatedData ? `<script type="application/ld+json">${relatedData}</script>` : ''}
    <script type="application/ld+json">${faqData}</script>
    <link rel="stylesheet" href="../../src/css/main.css?v=${cssVersion}">
    <link rel="stylesheet" href="../../src/css/product.css?v=${cssVersion}">
    <script type="module" src="../../src/product/tool-page.js?v=${assetVersion}"></script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9572691438076734" crossorigin="anonymous"></script>
</head>
<body>
    <header class="site-header">
        <nav class="navigation shell" aria-label="التنقل الرئيسي">
            <a class="brand" href="../../">
                <span class="brand-mark">أ</span>
                <span class="brand-copy"><strong><span data-copy="ar">&#1571;&#1583;&#1608;&#1575;&#1578;&#1610;</span><span data-copy="en">Adawaty</span></strong><span><span data-copy="ar">Adawaty</span><span data-copy="en">Tools Platform</span></span></span>
            </a>
            <button class="button" id="tool-language-toggle" type="button">English</button>
        </nav>
    </header>
    <main class="product-page shell" data-tool-page="${escapeHtml(tool.id)}">
        <a class="product-back" href="../../all-tools/"><span aria-hidden="true">←</span><span id="back-label">كل الأدوات</span></a>
        <div class="product-grid">
            <section class="product-intro">
                <span class="product-icon" id="tool-icon" aria-hidden="true"></span>
                <h1 id="tool-title"><span data-copy="ar">${title}</span><span data-copy="en">${titleEn}</span></h1>
                <p class="product-description" id="tool-description"><span data-copy="ar">${description}</span><span data-copy="en">${descriptionEn}</span></p>
                <p class="product-note" id="tool-note"><span data-copy="ar">${escapeHtml(tool.note.ar)}</span><span data-copy="en">${noteEn}</span></p>
            </section>
            <section class="product-calculator" aria-label="Calculator">
                <form class="product-form" id="tool-form"></form>
                <div class="product-progress" id="tool-progress" role="status" aria-live="polite" hidden>
                    <div class="product-progress-bar"></div>
                    <span class="product-progress-label" id="tool-progress-label"></span>
                </div>
                <output class="product-result" id="tool-result" tabindex="-1" hidden>
                    <strong class="product-result-value" id="result-value"></strong>
                    <span class="product-result-label" id="result-label"></span>
                    <span class="product-result-details" id="result-details"></span>
                    <img class="product-result-preview" id="result-preview" alt="" hidden>
                    <a class="button button-primary product-download" id="result-download" hidden></a>
                </output>
            </section>
        </div>
        ${relatedTools.length ? `<section class="product-related">
            <h2><span data-copy="ar">أدوات ذات صلة</span><span data-copy="en">Related tools</span></h2>
            <div class="product-related-grid">
                ${relatedTools.map((related) => `<a class="product-related-card" href="../../tools/${related.id}/">
                    <span class="product-related-icon" aria-hidden="true">${escapeHtml(related.icon ?? '')}</span>
                    <span class="product-related-title"><span data-copy="ar">${escapeHtml(related.title.ar)}</span><span data-copy="en">${escapeHtml(related.title.en)}</span></span>
                </a>`).join('\n                ')}
            </div>
        </section>` : ''}
        ${faqSectionHtml}
    </main>
    <footer class="site-footer"><div class="footer-row shell"><p>Adawaty</p><p>© <span id="current-year"></span></p></div></footer>
</body>
</html>
`;
}

function createSitemap() {
    const urls = [
        { location: `${baseUrl}/`, priority: '1.0', frequency: 'weekly' },
        { location: `${baseUrl}/all-tools/`, priority: '0.9', frequency: 'weekly' },
        ...Object.keys(categories).map((category) => ({
            location: `${baseUrl}/categories/${category}/`,
            priority: '0.8',
            frequency: 'weekly',
        })),
        ...tools.map((tool) => ({
            location: `${baseUrl}/tools/${tool.id}/`,
            priority: '0.9',
            frequency: 'monthly',
        })),
        ...ROUNDUP_CONTENT.map((entry) => ({
            location: `${baseUrl}/best/${entry.slug}/`,
            priority: '0.85',
            frequency: 'monthly',
        })),
    ];

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((entry) => `    <url>
        <loc>${entry.location}</loc>
        <changefreq>${entry.frequency}</changefreq>
        <priority>${entry.priority}</priority>
    </url>`).join('\n')}
</urlset>
`;
}

function createCataloguePage({
    title,
    description,
    basePath,
    canonical,
    category = '',
}) {
    const structuredData = safeJson({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: title,
        description,
        url: canonical,
        isPartOf: {
            '@type': 'WebSite',
            name: 'Adawaty',
            url: `${baseUrl}/`,
        },
        inLanguage: ['ar', 'en'],
    });
    const breadcrumbItems = [
        { '@type': 'ListItem', position: 1, name: 'أدواتي', item: `${baseUrl}/` },
        { '@type': 'ListItem', position: 2, name: title, item: canonical },
    ];
    const breadcrumbData = safeJson({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
    });
    const categoryRoundups = category ? ROUNDUP_CONTENT.filter((entry) => entry.category === category) : [];
    const roundupLinksHtml = categoryRoundups.length ? `<div class="catalogue-roundup-links">
            ${categoryRoundups.map((entry) => `<a href="${basePath}best/${entry.slug}/"><span data-copy="ar">${escapeHtml(entry.titleAr)}</span><span data-copy="en">${escapeHtml(entry.titleEn)}</span></a>`).join('\n            ')}
        </div>` : '';

    // A real, visible, statically-generated list of every tool in this
    // page's scope (this category, or every tool for all-tools/) --
    // added after a real SEO gap was found: the JS-rendered
    // catalogue-grid above is the only source of tool links on every
    // browse/category page across this entire site, meaning search
    // engines had zero real internal links to any tool page in the raw
    // HTML, relying entirely on sitemap.xml for discovery with no
    // internal-linking "vote" backing it up -- a documented, common
    // cause of Google Search Console's "Discovered - currently not
    // indexed" status. Deliberately made genuinely visible (not hidden
    // via CSS), both because it has real standalone value to a visitor
    // wanting a quick, scannable full list, and because hidden links
    // that differ from what users see risk being read as manipulative
    // by search engines -- the safe, legitimate version of this fix is
    // a real, visible link list, not a hidden one.
    const scopedTools = category ? tools.filter((tool) => tool.category === category) : tools;
    const staticToolLinksHtml = scopedTools.length ? `<section class="catalogue-static-links" aria-label="كل الأدوات">
            <h2><span data-copy="ar">كل الأدوات${category ? ` في ${escapeHtml(categories[category]?.ar ?? category)}` : ''}</span><span data-copy="en">All tools${category ? ` in ${escapeHtml(categories[category]?.en ?? category)}` : ''}</span></h2>
            <ul>
                ${scopedTools.map((tool) => `<li><a href="${basePath}tools/${tool.id}/"><span data-copy="ar">${escapeHtml(tool.title.ar)}</span><span data-copy="en">${escapeHtml(tool.title.en)}</span></a></li>`).join('\n                ')}
            </ul>
        </section>` : '';

    return `<!doctype html>
<html lang="ar" dir="rtl" data-language="ar">
<head>
    <meta charset="UTF-8">
    <script>(function(){var l='';try{l=localStorage.getItem('adawaty-language')||localStorage.getItem('adawaty-preview-language')||''}catch(e){}if(l!=='ar'&&l!=='en')l=(navigator.language||'').toLowerCase().startsWith('ar')?'ar':'en';var r=document.documentElement;r.lang=l;r.dir=l==='ar'?'rtl':'ltr';r.dataset.language=l;var s=document.createElement('style');s.textContent='[data-language="en"] [data-copy="ar"],[data-language="ar"] [data-copy="en"]{display:none!important}';r.appendChild(s);})();(function(){var i='G-N9X0ZTH17N';window.dataLayer=window.dataLayer||[];function g(){dataLayer.push(arguments)}window.gtag=g;g('js',new Date());g('config',i);var t=document.createElement('script');t.async=true;t.src='https://www.googletagmanager.com/gtag/js?id='+i;document.head.appendChild(t);})();</script>
    <link rel="icon" href="${basePath}favicon.svg" type="image/svg+xml"><link rel="shortcut icon" href="${basePath}favicon.ico">
    <meta http-equiv="Cache-Control" content="no-cache">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=()">
    <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
    <link rel="preconnect" href="https://cdn.sheetjs.com" crossorigin>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#07111f">
    <meta name="description" content="${escapeHtml(description)}">
    <title>${escapeHtml(title)} | أدواتي</title>
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" hreflang="ar" href="${canonical}">
    <link rel="alternate" hreflang="en" href="${canonical}">
    <link rel="alternate" hreflang="x-default" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${baseUrl}/og-image.svg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="أدواتي — Adawaty">
    <meta property="og:locale" content="ar_AR">
    <meta property="og:locale:alternate" content="en_US">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${baseUrl}/og-image.svg">
    <script type="application/ld+json">${structuredData}</script>
    <script type="application/ld+json">${breadcrumbData}</script>
    <link rel="stylesheet" href="${basePath}src/css/main.css?v=${cssVersion}">
    <link rel="stylesheet" href="${basePath}src/css/product.css?v=${cssVersion}">
    <script type="module" src="${basePath}src/product/catalogue-page.js?v=${catalogueAssetVersion}"></script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9572691438076734" crossorigin="anonymous"></script>
</head>
<body>
    <header class="site-header">
        <nav class="navigation shell" aria-label="التنقل الرئيسي">
            <a class="brand" href="${basePath}">
                <span class="brand-mark">أ</span>
                <span class="brand-copy"><strong><span data-copy="ar">&#1571;&#1583;&#1608;&#1575;&#1578;&#1610;</span><span data-copy="en">Adawaty</span></strong><span><span data-copy="ar">Adawaty</span><span data-copy="en">Tools Platform</span></span></span>
            </a>
            <button class="button" id="catalogue-language-toggle" type="button">English</button>
        </nav>
    </header>
    <main class="catalogue-page shell" data-catalogue-page data-base-path="${basePath}" data-category="${category}">
        <header class="catalogue-header">
            <p class="eyebrow"><span data-copy="ar">دليل الأدوات</span><span data-copy="en">Tools directory</span></p>
            <h1><span data-copy="ar">${escapeHtml(title)}</span><span data-copy="en">${escapeHtml(category ? categories[category].en : 'All Free Tools')}</span></h1>
            <p><span data-copy="ar">${escapeHtml(description)}</span><span data-copy="en">Search and browse fast, free tools in Arabic and English.</span></p>
            ${roundupLinksHtml}
        </header>
        <section class="catalogue-controls" aria-label="البحث والتصفية">
            <input id="catalogue-search" type="search" autocomplete="off">
            <div class="catalogue-filters" id="catalogue-filters"></div>
            <div class="catalogue-subfilters" id="catalogue-subfilters" hidden></div>
            <p id="catalogue-count" aria-live="polite"></p>
        </section>
        <div class="catalogue-grid" id="catalogue-grid"></div>
        <p class="catalogue-empty" id="catalogue-empty" hidden></p>
        <button class="catalogue-load-more" id="catalogue-load-more" type="button" hidden></button>
        ${staticToolLinksHtml}
    </main>
    <footer class="site-footer"><div class="footer-row shell"><p>Adawaty</p><p>© <span id="current-year"></span></p></div></footer>
</body>
</html>
`;
}

function createRoundupPage(entry) {
    const title = escapeHtml(entry.titleAr);
    const canonical = `${baseUrl}/best/${entry.slug}/`;
    const description = escapeHtml(entry.introAr[0]);
    const items = entry.toolIds
        .map((id) => tools.find((tool) => tool.id === id))
        .filter(Boolean);
    const categoryLabel = categories[entry.category]?.ar ?? entry.category;
    const categoryUrl = `${baseUrl}/categories/${entry.category}/`;

    const structuredData = safeJson({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: entry.titleEn,
        description: entry.introEn[0],
        url: canonical,
        itemListElement: items.map((tool, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${baseUrl}/tools/${tool.id}/`,
            name: tool.title.en,
        })),
    });
    const breadcrumbData = safeJson({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'أدواتي', item: `${baseUrl}/` },
            { '@type': 'ListItem', position: 2, name: categoryLabel, item: categoryUrl },
            { '@type': 'ListItem', position: 3, name: entry.titleAr, item: canonical },
        ],
    });

    return `<!doctype html>
<html lang="ar" dir="rtl" data-language="ar">
<head>
    <meta charset="UTF-8">
    <script>(function(){var l='';try{l=localStorage.getItem('adawaty-language')||localStorage.getItem('adawaty-preview-language')||''}catch(e){}if(l!=='ar'&&l!=='en')l=(navigator.language||'').toLowerCase().startsWith('ar')?'ar':'en';var r=document.documentElement;r.lang=l;r.dir=l==='ar'?'rtl':'ltr';r.dataset.language=l;var s=document.createElement('style');s.textContent='[data-language="en"] [data-copy="ar"],[data-language="ar"] [data-copy="en"]{display:none!important}';r.appendChild(s);})();(function(){var i='G-N9X0ZTH17N';window.dataLayer=window.dataLayer||[];function g(){dataLayer.push(arguments)}window.gtag=g;g('js',new Date());g('config',i);var t=document.createElement('script');t.async=true;t.src='https://www.googletagmanager.com/gtag/js?id='+i;document.head.appendChild(t);})();</script>
    <link rel="icon" href="../../favicon.svg" type="image/svg+xml"><link rel="shortcut icon" href="../../favicon.ico">
    <meta http-equiv="Cache-Control" content="no-cache">
    <meta name="referrer" content="strict-origin-when-cross-origin">
    <meta http-equiv="Permissions-Policy" content="camera=(), microphone=(), geolocation=(), payment=(), usb=()">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#07111f">
    <meta name="description" content="${description}">
    <title>${title} | أدواتي</title>
    <link rel="canonical" href="${canonical}">
    <link rel="alternate" hreflang="ar" href="${canonical}">
    <link rel="alternate" hreflang="en" href="${canonical}">
    <link rel="alternate" hreflang="x-default" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:image" content="${baseUrl}/og-image.svg">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="أدواتي — Adawaty">
    <meta property="og:locale" content="ar_AR">
    <meta property="og:locale:alternate" content="en_US">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${title}">
    <meta name="twitter:description" content="${description}">
    <meta name="twitter:image" content="${baseUrl}/og-image.svg">
    <script type="application/ld+json">${structuredData}</script>
    <script type="application/ld+json">${breadcrumbData}</script>
    <link rel="stylesheet" href="../../src/css/main.css?v=${cssVersion}">
    <link rel="stylesheet" href="../../src/css/product.css?v=${cssVersion}">
    <script type="module" src="../../src/product/roundup-page.js?v=${roundupAssetVersion}"></script>
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9572691438076734" crossorigin="anonymous"></script>
</head>
<body>
    <header class="site-header">
        <nav class="navigation shell" aria-label="التنقل الرئيسي">
            <a class="brand" href="../../">
                <span class="brand-mark">أ</span>
                <span class="brand-copy"><strong><span data-copy="ar">أدواتي</span><span data-copy="en">Adawaty</span></strong><span><span data-copy="ar">Adawaty</span><span data-copy="en">Tools Platform</span></span></span>
            </a>
            <button class="button" id="roundup-language-toggle" type="button">English</button>
        </nav>
    </header>
    <main class="product-page shell">
        <a class="product-back" href="../../all-tools/"><span aria-hidden="true">←</span><span data-copy="ar">كل الأدوات</span><span data-copy="en">All tools</span></a>
        <article class="roundup-page">
            <h1><span data-copy="ar">${title}</span><span data-copy="en">${escapeHtml(entry.titleEn)}</span></h1>
            <div data-copy="ar">${entry.introAr.map((paragraph) => `<p class="roundup-intro">${escapeHtml(paragraph)}</p>`).join('\n            ')}</div>
            <div data-copy="en">${entry.introEn.map((paragraph) => `<p class="roundup-intro">${escapeHtml(paragraph)}</p>`).join('\n            ')}</div>
            <section class="product-related">
                <h2><span data-copy="ar">الأدوات</span><span data-copy="en">Tools</span></h2>
                <div class="product-related-grid">
                    ${items.map((tool) => `<a class="product-related-card" href="../../tools/${tool.id}/">
                        <span class="product-related-icon" aria-hidden="true">${escapeHtml(tool.icon ?? '')}</span>
                        <span class="product-related-title"><span data-copy="ar">${escapeHtml(tool.title.ar)}</span><span data-copy="en">${escapeHtml(tool.title.en)}</span></span>
                    </a>`).join('\n                    ')}
                </div>
            </section>
        </article>
    </main>
    <footer class="site-footer"><div class="footer-row shell"><p>Adawaty</p><p>© <span id="current-year"></span></p></div></footer>
</body>
</html>
`;
}

for (const retiredToolId of retiredToolIds) {
    await rm(path.join(projectRoot, 'tools', retiredToolId), {
        recursive: true,
        force: true,
    });
}

for (const tool of tools) {
    if (tool.interactive) continue;
    const directory = path.join(projectRoot, 'tools', tool.id);
    await mkdir(directory, { recursive: true });
    await writeFile(
        path.join(directory, 'index.html'),
        createToolPage(tool),
        'utf8',
    );
}

const allToolsDirectory = path.join(projectRoot, 'all-tools');
await mkdir(allToolsDirectory, { recursive: true });
await writeFile(
    path.join(allToolsDirectory, 'index.html'),
    createCataloguePage({
        title: 'كل الأدوات المجانية',
        description: 'ابحث وتصفح جميع أدواتنا المجانية باللغة العربية والإنجليزية.',
        basePath: '../',
        canonical: `${baseUrl}/all-tools/`,
    }),
    'utf8',
);

for (const [category, categoryCopy] of Object.entries(categories)) {
    const directory = path.join(projectRoot, 'categories', category);
    await mkdir(directory, { recursive: true });
    await writeFile(
        path.join(directory, 'index.html'),
        createCataloguePage({
            title: categoryCopy.ar,
            description: `تصفح ${categoryCopy.ar} المجانية المتاحة على منصة أدواتي.`,
            basePath: '../../',
            canonical: `${baseUrl}/categories/${category}/`,
            category,
        }),
        'utf8',
    );
}

for (const entry of ROUNDUP_CONTENT) {
    const directory = path.join(projectRoot, 'best', entry.slug);
    await mkdir(directory, { recursive: true });
    await writeFile(
        path.join(directory, 'index.html'),
        createRoundupPage(entry),
        'utf8',
    );
}

await writeFile(
    path.join(projectRoot, 'sitemap.xml'),
    createSitemap(),
    'utf8',
);

await writeFile(
    path.join(projectRoot, 'src', 'data', 'tool-index.json'),
    JSON.stringify(
        Object.fromEntries(tools.map((tool) => [
            tool.id,
            { ar: tool.title.ar, en: tool.title.en, icon: tool.icon, category: tool.category },
        ])),
    ),
    'utf8',
);

// index.html and src/pages/home.js are hand-authored, static files
// (not generated by this script), but their own cache-busting version
// strings suffered from the exact same "must remember to bump this by
// hand" problem the rest of this script's versioning did -- fixed the
// same way, with a real content hash rather than a manually-maintained
// string.
{
    const usageTrackingVersion = await hashFiles([
        path.join(projectRoot, 'src/product/usage-tracking.js'),
    ]);

    let homeJsContent = await readFile(path.join(projectRoot, 'src/pages/home.js'), 'utf8');
    homeJsContent = homeJsContent.replace(
        /usage-tracking\.js\?v=[a-z0-9]+/,
        `usage-tracking.js?v=${usageTrackingVersion}`,
    );
    await writeFile(path.join(projectRoot, 'src/pages/home.js'), homeJsContent, 'utf8');

    // Hashed AFTER the replace above and from the in-memory string that
    // was actually written to disk (not re-read from disk, and not
    // hashed before the replace) -- hashing the pre-replace content
    // here would make each run's hash depend on the *previous* run's
    // already-substituted version string, producing a different hash
    // every single run even with zero real logic changes (confirmed
    // this exact failure mode directly: two back-to-back runs with no
    // source changes produced different hashes before this fix).
    const homeAssetVersion = createHash('sha256').update(homeJsContent).digest('hex').slice(0, 10);

    let indexHtmlContent = await readFile(path.join(projectRoot, 'index.html'), 'utf8');
    indexHtmlContent = indexHtmlContent.replace(
        /home\.js\?v=[a-z0-9]+/,
        `home.js?v=${homeAssetVersion}`,
    );
    await writeFile(path.join(projectRoot, 'index.html'), indexHtmlContent, 'utf8');
}

// main.css/product.css version markers on the homepage and every
// hand-authored interactive tool page -- these pages aren't produced
// by the templates above, so they need the same fix applied
// separately. Found via the same investigation as the css-hash-based
// versioning fix above: every one of these pages was loading both
// files with no version string at all.
{
    const interactiveToolPages = [
        'index.html',
        'tools/background-remover/index.html',
        'tools/text-summarizer/index.html',
        'tools/photo-editor/index.html',
        'tools/website-builder/index.html',
        'tools/mic-test/index.html',
        'tools/grammar-checker/index.html',
        'tools/replace-background/index.html',
    ];
    for (const relativePath of interactiveToolPages) {
        const fullPath = path.join(projectRoot, relativePath);
        // eslint-disable-next-line no-await-in-loop -- a handful of small file rewrites, sequential keeps failures attributable to one exact file
        let pageContent = await readFile(fullPath, 'utf8');
        pageContent = pageContent
            .replace(/src\/css\/main\.css(\?v=[a-z0-9]+)?"/g, `src/css/main.css?v=${cssVersion}"`)
            .replace(/src\/css\/product\.css(\?v=[a-z0-9]+)?"/g, `src/css/product.css?v=${cssVersion}"`);
        // eslint-disable-next-line no-await-in-loop
        await writeFile(fullPath, pageContent, 'utf8');
    }
}

process.stdout.write(
    `Generated ${tools.length} tool pages, ${Object.keys(categories).length} category pages, ${ROUNDUP_CONTENT.length} roundup pages and sitemap entries.\n`,
);
