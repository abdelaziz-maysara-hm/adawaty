import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { listToolDefinitions } from '../src/product/tool-definitions.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = 'https://abdelaziz-maysara-hm.github.io/adawaty';
const assetVersion = 's7b23';
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
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function safeJson(value) {
    return JSON.stringify(value).replaceAll('<', '\\u003c');
}

function createToolPage(tool) {
    const title = escapeHtml(tool.title.ar);
    const description = escapeHtml(tool.description.ar);
    const canonical = `${baseUrl}/tools/${tool.id}/`;
    const structuredData = safeJson({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
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

    return `<!doctype html>
<html lang="ar" dir="rtl" data-language="ar">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Cache-Control" content="no-cache">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#07111f">
    <meta name="description" content="${description}">
    <title>${title} | أدواتي</title>
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <script type="application/ld+json">${structuredData}</script>
    <link rel="stylesheet" href="../../src/css/main.css">
    <link rel="stylesheet" href="../../src/css/product.css">
    <script type="module" src="../../src/product/tool-page.js?v=${assetVersion}"></script>
</head>
<body>
    <header class="site-header">
        <nav class="navigation shell" aria-label="التنقل الرئيسي">
            <a class="brand" href="../../">
                <span class="brand-mark">أ</span>
                <span class="brand-copy"><strong>أدواتي</strong><span>Adawaty Platform</span></span>
            </a>
            <button class="button" id="tool-language-toggle" type="button">English</button>
        </nav>
    </header>
    <main class="product-page shell" data-tool-page="${escapeHtml(tool.id)}">
        <a class="product-back" href="../../all-tools/"><span aria-hidden="true">←</span><span id="back-label">كل الأدوات</span></a>
        <div class="product-grid">
            <section class="product-intro">
                <span class="product-icon" id="tool-icon" aria-hidden="true"></span>
                <h1 id="tool-title">${title}</h1>
                <p class="product-description" id="tool-description">${description}</p>
                <p class="product-note" id="tool-note">${escapeHtml(tool.note.ar)}</p>
            </section>
            <section class="product-calculator" aria-label="Calculator">
                <form class="product-form" id="tool-form"></form>
                <output class="product-result" id="tool-result" tabindex="-1" hidden>
                    <strong class="product-result-value" id="result-value"></strong>
                    <span class="product-result-label" id="result-label"></span>
                    <span class="product-result-details" id="result-details"></span>
                    <img class="product-result-preview" id="result-preview" alt="" hidden>
                    <a class="button button-primary product-download" id="result-download" hidden></a>
                </output>
            </section>
        </div>
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
    return `<!doctype html>
<html lang="ar" dir="rtl" data-language="ar">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Cache-Control" content="no-cache">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#07111f">
    <meta name="description" content="${escapeHtml(description)}">
    <title>${escapeHtml(title)} | أدواتي</title>
    <link rel="canonical" href="${canonical}">
    <script type="application/ld+json">${structuredData}</script>
    <link rel="stylesheet" href="${basePath}src/css/main.css">
    <link rel="stylesheet" href="${basePath}src/css/product.css">
    <script type="module" src="${basePath}src/product/catalogue-page.js?v=${assetVersion}"></script>
</head>
<body>
    <header class="site-header">
        <nav class="navigation shell" aria-label="التنقل الرئيسي">
            <a class="brand" href="${basePath}">
                <span class="brand-mark">أ</span>
                <span class="brand-copy"><strong>أدواتي</strong><span>Adawaty Platform</span></span>
            </a>
            <button class="button" id="catalogue-language-toggle" type="button">English</button>
        </nav>
    </header>
    <main class="catalogue-page shell" data-catalogue-page data-base-path="${basePath}" data-category="${category}">
        <header class="catalogue-header">
            <p class="eyebrow"><span data-copy="ar">دليل الأدوات</span><span data-copy="en">Tools directory</span></p>
            <h1><span data-copy="ar">${escapeHtml(title)}</span><span data-copy="en">${escapeHtml(category ? categories[category].en : 'All Free Tools')}</span></h1>
            <p><span data-copy="ar">${escapeHtml(description)}</span><span data-copy="en">Search and browse fast, free tools in Arabic and English.</span></p>
        </header>
        <section class="catalogue-controls" aria-label="البحث والتصفية">
            <input id="catalogue-search" type="search" autocomplete="off">
            <div class="catalogue-filters" id="catalogue-filters"></div>
            <p id="catalogue-count" aria-live="polite"></p>
        </section>
        <div class="catalogue-grid" id="catalogue-grid"></div>
        <p class="catalogue-empty" id="catalogue-empty" hidden></p>
    </main>
    <footer class="site-footer"><div class="footer-row shell"><p>Adawaty</p><p>© <span id="current-year"></span></p></div></footer>
</body>
</html>
`;
}

for (const tool of tools) {
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

await writeFile(
    path.join(projectRoot, 'public', 'sitemap.xml'),
    createSitemap(),
    'utf8',
);

process.stdout.write(
    `Generated ${tools.length} tool pages, ${Object.keys(categories).length} category pages and sitemap entries.\n`,
);

// END OF FILE
