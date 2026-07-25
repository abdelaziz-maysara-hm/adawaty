import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [indexHtml, workflow, homeScript, stylesheet] = await Promise.all([
    readFile(new URL('../../index.html', import.meta.url), 'utf8'),
    readFile(
        new URL('../../.github/workflows/deploy.yml', import.meta.url),
        'utf8',
    ),
    readFile(new URL('../../src/pages/home.js', import.meta.url), 'utf8'),
    readFile(new URL('../../src/css/main.css', import.meta.url), 'utf8'),
]);

assert.match(indexHtml, /<html lang="ar" dir="rtl" data-language="ar">/);
assert.match(indexHtml, /Sprint 6 · Batch 3/);
assert.match(indexHtml, /\.\/src\/css\/main\.css/);
assert.match(indexHtml, /\.\/src\/pages\/home\.js/);
assert.match(indexHtml, /\.\/tools\/bmi-calculator\//);
assert.match(indexHtml, /\.\/tools\/percentage-calculator\//);
assert.match(indexHtml, /\.\/tools\/age-calculator\//);
assert.match(indexHtml, /\.\/tools\/loan-calculator\//);
assert.match(indexHtml, /\.\/tools\/date-difference-calculator\//);
assert.match(indexHtml, /\.\/tools\/bmr-calculator\//);
assert.match(indexHtml, /\.\/tools\/tdee-calculator\//);
assert.match(indexHtml, /\.\/tools\/water-intake-calculator\//);
assert.doesNotMatch(indexHtml, /TODO|PLACEHOLDER/i);

assert.match(workflow, /npm run validate/);
assert.match(workflow, /actions\/deploy-pages@v4/);
assert.match(workflow, /branches:\s*\n\s*- main/);

assert.match(homeScript, /applyLanguage\(getInitialLanguage\(\)\)/);
assert.match(stylesheet, /@media \(max-width: 600px\)/);

console.log('Sprint 5 Batch 23 GitHub Pages preview verification passed.');

// END OF FILE
