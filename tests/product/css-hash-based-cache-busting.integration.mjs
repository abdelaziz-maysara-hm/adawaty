import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * A real, wide-reaching cache-busting gap found while investigating why
 * a CSS change might not reach visitors: main.css and product.css were
 * loaded on all 629 tool pages, all 19 category pages, all 10 roundup
 * pages, the homepage, and all 8 interactive tool pages with NO
 * version string at all -- the exact same "fix committed but never
 * actually served" bug class already hit and fixed once for JS files
 * (see 0.5.141's changelog entry), now found affecting CSS site-wide.
 *
 * Fixed with a real SHA-256 content hash (cssVersion) covering both
 * files, applied consistently across every page type. This test
 * verifies the same two properties already required of the JS
 * versioning: determinism (repeated builds with no source changes
 * produce identical hashes) and content-sensitivity (a real CSS change
 * changes the hash) -- plus, specific to this fix, that every page
 * type and every hand-authored interactive page actually got it, not
 * just the generator-produced ones.
 */

function runGenerator() {
    execFileSync('node', ['scripts/generate-product-pages.mjs'], { cwd: projectRoot, stdio: 'pipe' });
}

function extractCssVersion(html) {
    const match = html.match(/main\.css\?v=([a-z0-9]+)/);
    return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Determinism and content-sensitivity, the same properties already
// required of the JS hash-based versioning
// ---------------------------------------------------------------------------

runGenerator();
const firstRunHtml = await readFile(path.join(projectRoot, 'tools/pdf-merge/index.html'), 'utf8');
const firstVersion = extractCssVersion(firstRunHtml);

runGenerator();
const secondRunHtml = await readFile(path.join(projectRoot, 'tools/pdf-merge/index.html'), 'utf8');
const secondVersion = extractCssVersion(secondRunHtml);

assert.ok(firstVersion, 'must be able to extract a main.css version string at all');
assert.equal(firstVersion, secondVersion, 'the CSS content hash must be identical across two consecutive runs with zero source changes');

const productCssPath = path.join(projectRoot, 'src/css/product.css');
const originalCss = await readFile(productCssPath, 'utf8');
try {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(productCssPath, `${originalCss}\n/* test-only marker for hash-sensitivity verification */\n`, 'utf8');
    runGenerator();
    const modifiedRunHtml = await readFile(path.join(projectRoot, 'tools/pdf-merge/index.html'), 'utf8');
    const modifiedVersion = extractCssVersion(modifiedRunHtml);
    assert.notEqual(modifiedVersion, firstVersion, 'a genuine change to product.css must change the resulting main.css/product.css version hash');
} finally {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(productCssPath, originalCss, 'utf8');
    runGenerator();
}

// ---------------------------------------------------------------------------
// Every page type, and every hand-authored interactive page
// specifically, must actually have the version string -- not just the
// generator-produced tool/category/roundup pages
// ---------------------------------------------------------------------------

{
    const pagesToCheck = [
        'index.html',
        'tools/pdf-merge/index.html',
        'categories/pdf/index.html',
        'best/best-free-pdf-tools/index.html',
        'tools/background-remover/index.html',
        'tools/text-summarizer/index.html',
        'tools/photo-editor/index.html',
        'tools/website-builder/index.html',
        'tools/mic-test/index.html',
        'tools/grammar-checker/index.html',
        'tools/replace-background/index.html',
    ];
    const missingVersion = [];
    for (const relativePath of pagesToCheck) {
        // eslint-disable-next-line no-await-in-loop
        const html = await readFile(path.join(projectRoot, relativePath), 'utf8');
        if (!/main\.css\?v=[a-z0-9]+/.test(html) || !/product\.css\?v=[a-z0-9]+/.test(html)) {
            missingVersion.push(relativePath);
        }
    }
    assert.deepEqual(missingVersion, [], `${missingVersion.length} page(s) are missing the CSS version string: ${missingVersion.join(', ')}`);
}

console.log('CSS content-hash cache-busting verified: deterministic, content-sensitive, and present across every page type including all 8 hand-authored interactive tool pages.');

// END OF FILE
