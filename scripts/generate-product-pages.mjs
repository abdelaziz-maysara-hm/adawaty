import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { listToolDefinitions } from '../src/product/tool-definitions.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseUrl = 'https://abdelaziz-maysara-hm.github.io/adawaty';
const tools = listToolDefinitions();

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function createToolPage(tool) {
    const title = escapeHtml(tool.title.ar);
    const description = escapeHtml(tool.description.ar);
    const canonical = `${baseUrl}/tools/${tool.id}/`;

    return `<!doctype html>
<html lang="ar" dir="rtl" data-language="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#07111f">
    <meta name="description" content="${description}">
    <title>${title} | أدواتي</title>
    <link rel="canonical" href="${canonical}">
    <meta property="og:type" content="website">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:url" content="${canonical}">
    <link rel="stylesheet" href="../../src/css/main.css">
    <link rel="stylesheet" href="../../src/css/product.css">
    <script type="module" src="../../src/product/tool-page.js"></script>
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
        <a class="product-back" href="../../#tools"><span aria-hidden="true">←</span><span id="back-label">كل الأدوات</span></a>
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

for (const tool of tools) {
    const directory = path.join(projectRoot, 'tools', tool.id);
    await mkdir(directory, { recursive: true });
    await writeFile(
        path.join(directory, 'index.html'),
        createToolPage(tool),
        'utf8',
    );
}

await writeFile(
    path.join(projectRoot, 'public', 'sitemap.xml'),
    createSitemap(),
    'utf8',
);

process.stdout.write(`Generated ${tools.length} tool pages and sitemap entries.\n`);

// END OF FILE
