import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

const SKIP_DIRECTORIES = new Set(['node_modules', '.git']);

/**
 * A real gap found via a direct user report: the site's favicon was
 * missing on every interactive tool page (background-remover, mic-test,
 * photo-editor, replace-background, text-summarizer, website-builder --
 * every manually-authored page that bypasses the generator template,
 * the exact same class of gap already hit once with FAQ coverage in
 * 0.5.124 and once with AdSense coverage in 0.5.125). A live browser
 * console also separately showed a 404 for /favicon.ico specifically:
 * this site never had a .ico file at all, only favicon.svg, and some
 * browsers/contexts request /favicon.ico as a fallback regardless of
 * an explicit <link rel="icon"> pointing elsewhere.
 *
 * Fixed by generating a real favicon.ico from the existing SVG source
 * and adding both <link rel="icon" ... type="image/svg+xml"> (the
 * modern, already-used format) and <link rel="shortcut icon"
 * href="....favicon.ico"> (the classic fallback) to every page,
 * including the 6 interactive tool pages and the homepage which had
 * neither before this fix.
 */

async function findAllIndexPages(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const pages = [];
    for (const entry of entries) {
        if (SKIP_DIRECTORIES.has(entry.name)) continue;
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            // eslint-disable-next-line no-await-in-loop -- a directory walk, inherently sequential
            pages.push(...await findAllIndexPages(fullPath));
        } else if (entry.name === 'index.html') {
            pages.push(fullPath);
        }
    }
    return pages;
}

// favicon.ico must exist and be a genuinely valid, non-empty file --
// not just referenced from HTML.
{
    const icoPath = path.join(projectRoot, 'favicon.ico');
    const icoBuffer = await readFile(icoPath);
    assert.ok(icoBuffer.length > 0, 'favicon.ico must exist and not be empty');
    // A valid .ico file's header: reserved=0, type=1 (icon), at least one image.
    const reserved = icoBuffer.readUInt16LE(0);
    const imageType = icoBuffer.readUInt16LE(2);
    const imageCount = icoBuffer.readUInt16LE(4);
    assert.equal(reserved, 0, 'favicon.ico must have a valid ICO header (reserved field must be 0)');
    assert.equal(imageType, 1, 'favicon.ico must have a valid ICO header (type field must be 1 for icon)');
    assert.ok(imageCount >= 1, 'favicon.ico must contain at least one embedded image');
}

const allPages = await findAllIndexPages(projectRoot);
assert.ok(allPages.length > 600, `expected to find over 600 pages, found ${allPages.length} -- the directory walk itself may be broken`);

const missingSvgIcon = [];
const missingIcoFallback = [];

for (const pagePath of allPages) {
    // eslint-disable-next-line no-await-in-loop -- hundreds of small sequential reads; keeps a failure attributable to one exact file
    const html = await readFile(pagePath, 'utf8');
    const relativePath = path.relative(projectRoot, pagePath);
    if (!html.includes('rel="icon"') || !html.includes('favicon.svg')) {
        missingSvgIcon.push(relativePath);
    }
    if (!html.includes('rel="shortcut icon"') || !html.includes('favicon.ico')) {
        missingIcoFallback.push(relativePath);
    }
}

assert.deepEqual(missingSvgIcon, [], `${missingSvgIcon.length} page(s) are missing the SVG favicon link: ${missingSvgIcon.slice(0, 5).join(', ')}${missingSvgIcon.length > 5 ? '...' : ''}`);
assert.deepEqual(missingIcoFallback, [], `${missingIcoFallback.length} page(s) are missing the .ico fallback favicon link: ${missingIcoFallback.slice(0, 5).join(', ')}${missingIcoFallback.length > 5 ? '...' : ''}`);

// The generator template itself must include both links, not just the
// currently-generated output -- otherwise this guarantee would only
// hold until the next content update, not for tools built after this
// test was written.
{
    const generatorSource = await readFile(path.join(projectRoot, 'scripts/generate-product-pages.mjs'), 'utf8');
    const svgOccurrences = generatorSource.split('favicon.svg').length - 1;
    const icoOccurrences = generatorSource.split('favicon.ico').length - 1;
    assert.ok(svgOccurrences >= 3, `expected favicon.svg in all 3 page templates (tool/category/roundup) inside the generator source, found it ${svgOccurrences} time(s)`);
    assert.ok(icoOccurrences >= 3, `expected favicon.ico in all 3 page templates (tool/category/roundup) inside the generator source, found it ${icoOccurrences} time(s)`);
}

console.log(`Favicon coverage (SVG + .ico fallback) verified across all ${allPages.length} pages on disk, plus favicon.ico's own file validity and the generator template.`);

// END OF FILE
