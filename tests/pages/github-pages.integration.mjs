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
assert.match(indexHtml, /Sprint 7 · Batch 12/);
assert.match(indexHtml, /\.\/src\/css\/main\.css/);
assert.match(indexHtml, /\.\/src\/pages\/home\.js\?v=s7b12/);
assert.match(indexHtml, /http-equiv="Cache-Control" content="no-cache"/);
assert.match(indexHtml, /\.\/tools\/bmi-calculator\//);
assert.match(indexHtml, /\.\/tools\/percentage-calculator\//);
assert.match(indexHtml, /\.\/tools\/age-calculator\//);
assert.match(indexHtml, /\.\/tools\/loan-calculator\//);
assert.match(indexHtml, /\.\/tools\/date-difference-calculator\//);
assert.match(indexHtml, /\.\/tools\/bmr-calculator\//);
assert.match(indexHtml, /\.\/tools\/tdee-calculator\//);
assert.match(indexHtml, /\.\/tools\/grade-calculator\//);
assert.match(indexHtml, /\.\/tools\/gpa-calculator\//);
assert.match(indexHtml, /\.\/tools\/ratio-calculator\//);
assert.match(indexHtml, /\.\/tools\/water-intake-calculator\//);
assert.match(indexHtml, /\.\/all-tools\//);
assert.doesNotMatch(indexHtml, /TODO|PLACEHOLDER/i);

assert.match(workflow, /npm run validate/);
assert.match(workflow, /actions\/deploy-pages@v4/);
assert.match(workflow, /branches:\s*\n\s*- main/);

assert.match(homeScript, /applyLanguage\(getInitialLanguage\(\)\)/);
assert.match(homeScript, /adawaty-language/);
assert.match(homeScript, /adawaty-preview-language/);
assert.match(stylesheet, /@media \(max-width: 600px\)/);
assert.match(catalogueHtml, /data-catalogue-page/);
assert.match(catalogueHtml, /catalogue-page\.js\?v=s7b12/);
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

const bmiToolHtml = await readFile(
    new URL('../../tools/bmi-calculator/index.html', import.meta.url),
    'utf8',
);
assert.match(bmiToolHtml, /tool-page\.js\?v=s7b12/);
assert.match(bmiToolHtml, /http-equiv="Cache-Control" content="no-cache"/);

console.log('Sprint 7 Batch 12 catalogue navigation verification passed.');

// END OF FILE
