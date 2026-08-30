import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [
    indexHtml,
    workflow,
    homeScript,
    stylesheet,
    catalogueHtml,
    healthCategoryHtml,
    catalogueScript,
    converterCategoryHtml,
    developerCategoryHtml,
    textCategoryHtml,
] = await Promise.all([
    readFile(new URL('../../index.html', import.meta.url), 'utf8'),
    readFile(
        new URL('../../.github/workflows/deploy.yml', import.meta.url),
        'utf8',
    ),
    readFile(new URL('../../src/pages/home.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/css/main.css', import.meta.url), 'utf8'),
    readFile(new URL('../../all-tools/index.html', import.meta.url), 'utf8'),
    readFile(
        new URL('../../categories/health/index.html', import.meta.url),
        'utf8',
    ),
    readFile(
        new URL('../../src/product/catalogue-page.js', import.meta.url),
        'utf8',
    ),
    readFile(
        new URL('../../categories/converter/index.html', import.meta.url),
        'utf8',
    ),
    readFile(
        new URL('../../categories/developer/index.html', import.meta.url),
        'utf8',
    ),
    readFile(
        new URL('../../categories/text/index.html', import.meta.url),
        'utf8',
    ),
]);

assert.match(indexHtml, /<html lang="ar" dir="rtl" data-language="ar">/);
assert.match(indexHtml, /600\+ أداة مجانية/);
assert.match(indexHtml, /id="home-search"/);
assert.match(indexHtml, /\.\/tools\/image-batch-processor\//);
assert.match(indexHtml, /\.\/tools\/pdf-to-word-converter\//);
assert.match(indexHtml, /\.\/tools\/video-compressor\//);
assert.match(indexHtml, /\.\/tools\/audio-trimmer\//);
assert.doesNotMatch(indexHtml, /Sprint 7|development preview|اختبارات التكامل/i);
assert.match(indexHtml, /\.\/src\/css\/site\.css/);
assert.match(indexHtml, /\.\/src\/pages\/home\.js\?v=[a-z0-9]{10}/);
assert.match(indexHtml, /http-equiv="Cache-Control" content="no-cache"/);
assert.match(indexHtml, /\.\/all-tools\//);
assert.doesNotMatch(indexHtml, /TODO|PLACEHOLDER/i);

assert.match(workflow, /npm run validate/);
assert.match(workflow, /actions\/deploy-pages@v4/);
assert.match(workflow, /branches:\s*\n\s*- main/);

assert.match(homeScript, /applyLanguage\(getInitialLanguage\(\)\)/);
assert.match(homeScript, /adawaty-language/);
assert.match(homeScript, /adawaty-preview-language/);
assert.match(homeScript, /searchParams\.set\('q'/);
assert.match(stylesheet, /@media \(max-width: 700px\)/);
assert.match(catalogueHtml, /data-catalogue-page/);
assert.match(catalogueHtml, /catalogue-page\.js\?v=[a-z0-9]{10}/);
assert.match(catalogueHtml, /http-equiv="Cache-Control" content="no-cache"/);
assert.match(catalogueHtml, /"@type":"CollectionPage"/);
assert.match(healthCategoryHtml, /data-category="health"/);
assert.match(converterCategoryHtml, /data-category="converter"/);
assert.match(developerCategoryHtml, /data-category="developer"/);
assert.match(textCategoryHtml, /data-category="text"/);
const engineeringCategoryHtml = await readFile(
    new URL('../../categories/engineering/index.html', import.meta.url),
    'utf8',
);
assert.match(engineeringCategoryHtml, /data-category="engineering"/);
const securityNetworkCategoryHtml = await readFile(
    new URL('../../categories/security-network/index.html', import.meta.url),
    'utf8',
);
assert.match(
    securityNetworkCategoryHtml,
    /data-category="security-network"/,
);
const seoCategoryHtml = await readFile(
    new URL('../../categories/seo/index.html', import.meta.url),
    'utf8',
);
assert.match(seoCategoryHtml, /data-category="seo"/);
const colorCssCategoryHtml = await readFile(
    new URL('../../categories/color-css/index.html', import.meta.url),
    'utf8',
);
assert.match(colorCssCategoryHtml, /data-category="color-css"/);
const homeLifestyleCategoryHtml = await readFile(
    new URL('../../categories/home-lifestyle/index.html', import.meta.url),
    'utf8',
);
assert.match(homeLifestyleCategoryHtml, /data-category="home-lifestyle"/);
const islamicCategoryHtml = await readFile(
    new URL('../../categories/islamic/index.html', import.meta.url),
    'utf8',
);
assert.match(islamicCategoryHtml, /data-category="islamic"/);
const imageCategoryHtml = await readFile(
    new URL('../../categories/image/index.html', import.meta.url),
    'utf8',
);
assert.match(imageCategoryHtml, /data-category="image"/);
const pdfCategoryHtml = await readFile(
    new URL('../../categories/pdf/index.html', import.meta.url),
    'utf8',
);
assert.match(pdfCategoryHtml, /data-category="pdf"/);
const videoCategoryHtml = await readFile(
    new URL('../../categories/video/index.html', import.meta.url),
    'utf8',
);
assert.match(videoCategoryHtml, /data-category="video"/);
const audioCategoryHtml = await readFile(
    new URL('../../categories/audio/index.html', import.meta.url),
    'utf8',
);
assert.match(audioCategoryHtml, /data-category="audio"/);
const studentStudyCategoryHtml = await readFile(
    new URL('../../categories/student-study/index.html', import.meta.url),
    'utf8',
);
assert.match(studentStudyCategoryHtml, /data-category="student-study"/);
assert.match(catalogueScript, /getVisibleTools/);
assert.match(catalogueScript, /data-category/);
assert.match(catalogueScript, /Processing tools/);
assert.match(catalogueScript, /Calculators & generators/);
assert.match(catalogueScript, /typeof tool\.process/);
assert.match(catalogueScript, /adawaty-language/);
assert.match(catalogueScript, /URLSearchParams/);
assert.match(catalogueScript, /document\.title =/);
assert.match(catalogueScript, /catalogue-header h1/);

const bmiToolHtml = await readFile(
    new URL('../../tools/bmi-calculator/index.html', import.meta.url),
    'utf8',
);
assert.match(bmiToolHtml, /tool-page\.js\?v=[a-z0-9]{10}/);
assert.match(bmiToolHtml, /http-equiv="Cache-Control" content="no-cache"/);
assert.match(bmiToolHtml, /data-copy="en">Related tools/);

const ilovePdfAlternativeHtml = await readFile(
    new URL('../../best/ilovepdf-alternative/index.html', import.meta.url),
    'utf8',
);
const roundupScript = await readFile(
    new URL('../../src/product/roundup-page.js', import.meta.url),
    'utf8',
);
assert.match(ilovePdfAlternativeHtml, /data-copy="en">Free iLovePDF Alternatives With No Daily Limit/);
assert.match(ilovePdfAlternativeHtml, /roundup-page\.js\?v=[a-z0-9]{10}/);
assert.match(ilovePdfAlternativeHtml, /data-copy="en">All tools/);
assert.match(roundupScript, /adawaty-language/);
assert.match(roundupScript, /element\.hidden = element\.dataset\.copy !== selected/);
assert.match(roundupScript, /document\.title =/);
assert.match(roundupScript, /roundup-page h1/);

const favicon = await readFile(
    new URL('../../favicon.svg', import.meta.url),
    'utf8',
);
// language-bootstrap.js was inlined directly into every generated page
// (and into index.html by hand, since it's manually maintained) to
// eliminate an unnecessary render-blocking network request on every
// page load -- the file itself no longer exists or is referenced
// anywhere. Verify the merged inline script now carries both concerns
// it used to split across two files (language detection + the FOUC-
// prevention CSS injection, which must still run before main.css can
// possibly apply its own copy of the same rule) and that this single
// inline script still appears before main.css in both the homepage and
// the catalogue page.
assert.match(indexHtml, /adawaty-language/);
assert.match(indexHtml, /r\.dataset\.language\s*=\s*l/);
assert.match(indexHtml, /data-language="en"\].*data-copy="ar"/);
assert.ok(
    !indexHtml.includes('language-bootstrap.js'),
    'the separate language-bootstrap.js file reference must be gone, its content is now inlined',
);
assert.ok(
    indexHtml.indexOf('adawaty-language') < indexHtml.indexOf('src/css/site.css'),
    'Home language bootstrap must run before styles are applied.',
);
assert.ok(
    !catalogueHtml.includes('language-bootstrap.js'),
    'the separate language-bootstrap.js file reference must be gone, its content is now inlined',
);
assert.ok(
    catalogueHtml.indexOf('adawaty-language') < catalogueHtml.indexOf('src/css/site.css'),
    'Catalogue language bootstrap must run before styles are applied.',
);
assert.match(indexHtml, /rel="icon" href="\.\/favicon\.svg"/);
assert.match(catalogueHtml, /rel="icon" href="\.\.\/favicon\.svg"/);
assert.match(bmiToolHtml, /rel="icon" href="\.\.\/\.\.\/favicon\.svg"/);
assert.match(catalogueScript, /document\.documentElement\.dataset\.language = language/);
assert.match(favicon, /<svg[\s\S]+Adawaty[\s\S]+#5ce1c5/);

console.log('Localized navigation, no-flash bootstrap and favicon verification passed.');

// END OF FILE
