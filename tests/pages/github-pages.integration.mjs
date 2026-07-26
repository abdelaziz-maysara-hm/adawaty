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
assert.match(indexHtml, /Sprint 6 · Batch 11/);
assert.match(indexHtml, /\.\/src\/css\/main\.css/);
assert.match(indexHtml, /\.\/src\/pages\/home\.js/);
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
assert.match(stylesheet, /@media \(max-width: 600px\)/);
assert.match(catalogueHtml, /data-catalogue-page/);
assert.match(catalogueHtml, /catalogue-page\.js/);
assert.match(healthCategoryHtml, /data-category="health"/);
assert.match(converterCategoryHtml, /data-category="converter"/);
assert.match(developerCategoryHtml, /data-category="developer"/);
assert.match(textCategoryHtml, /data-category="text"/);
assert.match(catalogueScript, /getVisibleTools/);
assert.match(catalogueScript, /data-category/);

console.log('Sprint 6 Batch 11 catalogue navigation verification passed.');

// END OF FILE
