import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * A real, live bug: the generator's cache-busting version strings
 * (assetVersion, catalogueAssetVersion, roundupAssetVersion, plus
 * index.html's own hand-maintained home.js version) used to be
 * hand-written constants (e.g. `const assetVersion = 's7b46'`) that had
 * to be manually bumped after any change to tool-definitions.js or
 * anything it pulls in for that change to actually reach visitors.
 * Confirmed directly via `git log` that this string was unchanged
 * across many prior commits that DID touch tool logic -- and this was
 * the direct, confirmed cause of a live user-reported bug: a fix to
 * currency-converter's Worker URL never reached the browser, because
 * the JS file containing that fix kept being served from cache under
 * its old, unbumped version string.
 *
 * Replaced with a real SHA-256 content hash of the actual files that
 * affect each page type, removing the "don't forget to bump this"
 * human step entirely. This test verifies the two properties that
 * actually matter for this to work correctly:
 *   1. Deterministic: running the generator twice with zero source
 *      changes must produce the identical hash both times (otherwise
 *      every single deploy would needlessly invalidate every visitor's
 *      cache, even for pages that didn't actually change).
 *   2. Content-sensitive: a real change to a relevant file must change
 *      the hash (otherwise this is no better than the constant it
 *      replaced).
 */

function runGenerator() {
    execFileSync('node', ['scripts/generate-product-pages.mjs'], { cwd: projectRoot, stdio: 'pipe' });
}

function extractVersion(html, scriptName) {
    const match = html.match(new RegExp(`${scriptName}\\.js\\?v=([a-z0-9]+)`));
    return match?.[1] ?? null;
}

// ---------------------------------------------------------------------------
// Property 1: determinism across repeated runs with no source changes
// ---------------------------------------------------------------------------

runGenerator();
const firstRunHtml = await readFile(path.join(projectRoot, 'tools/currency-converter/index.html'), 'utf8');
const firstRunHomeHtml = await readFile(path.join(projectRoot, 'index.html'), 'utf8');
const firstToolVersion = extractVersion(firstRunHtml, 'tool-page');
const firstHomeVersion = extractVersion(firstRunHomeHtml, 'home');

runGenerator();
const secondRunHtml = await readFile(path.join(projectRoot, 'tools/currency-converter/index.html'), 'utf8');
const secondRunHomeHtml = await readFile(path.join(projectRoot, 'index.html'), 'utf8');
const secondToolVersion = extractVersion(secondRunHtml, 'tool-page');
const secondHomeVersion = extractVersion(secondRunHomeHtml, 'home');

assert.ok(firstToolVersion, 'must be able to extract a tool-page.js version string at all');
assert.equal(firstToolVersion, secondToolVersion, 'the tool-page.js content hash must be identical across two consecutive runs with zero source changes -- a real regression here would needlessly invalidate every visitor\'s cache on every single deploy');
assert.ok(firstHomeVersion, 'must be able to extract a home.js version string at all');
assert.equal(firstHomeVersion, secondHomeVersion, 'the home.js content hash must likewise be deterministic across runs -- this specific value had an ordering bug during development (hashing home.js\'s content before vs. after substituting its own usage-tracking.js version reference produced a different, unstable hash every run) that was caught and fixed before this test was written');

// ---------------------------------------------------------------------------
// Property 2: content-sensitivity -- a real change must change the hash
// ---------------------------------------------------------------------------

const currencyToolPath = path.join(projectRoot, 'src/product/definitions/currency-converter-tool.js');
const originalContent = await readFile(currencyToolPath, 'utf8');
try {
    await writeFile(currencyToolPath, `${originalContent}\n// test-only marker for hash-sensitivity verification\n`, 'utf8');
    runGenerator();
    const modifiedRunHtml = await readFile(path.join(projectRoot, 'tools/currency-converter/index.html'), 'utf8');
    const modifiedVersion = extractVersion(modifiedRunHtml, 'tool-page');
    assert.notEqual(modifiedVersion, firstToolVersion, 'a genuine content change to a tool definition file must change the resulting tool-page.js version hash -- otherwise a real code fix could again silently fail to reach visitors, the exact bug this mechanism replaced');
} finally {
    // Always restore the original file content, pass or fail, so this
    // test never leaves the repo in a modified state.
    await writeFile(currencyToolPath, originalContent, 'utf8');
    runGenerator();
}

// ---------------------------------------------------------------------------
// No stale hand-maintained version strings remain anywhere
// ---------------------------------------------------------------------------

const finalToolHtml = await readFile(path.join(projectRoot, 'tools/currency-converter/index.html'), 'utf8');
assert.doesNotMatch(finalToolHtml, /\?v=s7b\d+/, 'no page should reference the old hand-maintained "s7bNN" version scheme anymore');

console.log('Content-hash cache-busting verified: deterministic across repeated runs, sensitive to real content changes, and no stale hand-maintained version strings remain.');

// END OF FILE
