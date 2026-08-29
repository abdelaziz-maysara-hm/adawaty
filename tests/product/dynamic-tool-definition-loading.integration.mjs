import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { listToolDefinitions } from '../../src/product/tool-definitions.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * A real, measured performance bug found via a live PageSpeed Insights
 * report: every generated tool page previously imported
 * tool-definitions.js statically, which itself statically imports all
 * 123 definition files (~1.7 MB combined) just to look up one tool's
 * definition -- confirmed as the direct cause of a 42/100 mobile
 * performance score (vs. 98/100 desktop), with "Reduce unused
 * JavaScript -- Est savings of 255 KiB" as a specific Lighthouse
 * finding.
 *
 * Fixed by having generate-product-pages.mjs build a tool-id -> single
 * definitions-file-path manifest at build time (by inspecting each
 * file's real exports, not guessed from naming conventions), embedding
 * that single path per page as a data attribute, and having
 * tool-page.js dynamically import() only that one file at runtime
 * instead of the aggregated tool-definitions.js. Confirmed directly:
 * a typical tool page went from needing ~1.7 MB of combined JS to
 * ~12 KB (pdf-merge's own definitions file).
 *
 * While extracting the 20 tools that used to be defined inline
 * directly inside tool-definitions.js (unreachable by this per-file
 * scheme otherwise), 4 real, previously-hidden duplicate tool ids were
 * found and resolved in favor of the more complete existing
 * implementation (percentage-calculator, discount-calculator,
 * age-calculator, bmi-calculator) -- tests/product/tool-id-uniqueness
 * .integration.mjs could not have caught these before, since one side
 * of each duplicate was inline in tool-definitions.js itself rather
 * than in a real file under definitions/ that it scans.
 */

// ---------------------------------------------------------------------------
// Every generated tool page must carry a data-tool-definition-file
// attribute pointing to a real, existing file
// ---------------------------------------------------------------------------

{
    const allTools = listToolDefinitions();
    const interactiveToolIds = new Set(allTools.filter((tool) => tool.interactive).map((tool) => tool.id));
    const missingAttribute = [];
    const brokenPaths = [];

    for (const tool of allTools) {
        if (interactiveToolIds.has(tool.id)) continue; // hand-authored pages, out of scope for this generator-only mechanism

        // eslint-disable-next-line no-await-in-loop -- one file read per tool; keeps a failure attributable to one exact page
        const html = await readFile(path.join(projectRoot, 'tools', tool.id, 'index.html'), 'utf8');
        const match = html.match(/data-tool-definition-file="([^"]*)"/);
        if (!match || !match[1]) {
            missingAttribute.push(tool.id);
            continue;
        }

        const resolvedPath = path.join(projectRoot, 'src/product', match[1]);
        try {
            // eslint-disable-next-line no-await-in-loop
            await readFile(resolvedPath);
        } catch {
            brokenPaths.push(`${tool.id} -> ${match[1]}`);
        }
    }

    assert.deepEqual(missingAttribute, [], `${missingAttribute.length} non-interactive tool page(s) are missing data-tool-definition-file: ${missingAttribute.slice(0, 5).join(', ')}`);
    assert.deepEqual(brokenPaths, [], `${brokenPaths.length} tool page(s) reference a definitions file that doesn't exist on disk: ${brokenPaths.slice(0, 5).join(', ')}`);
}

// ---------------------------------------------------------------------------
// The dynamic-loading logic itself must actually find the right tool
// in the file it's pointed at, for every single non-interactive tool
// -- not just that the path exists, but that loading it produces the
// correct tool definition
// ---------------------------------------------------------------------------

async function loadToolDefinition(id, definitionFilePath) {
    if (!definitionFilePath) return null;
    const module = await import(path.join(projectRoot, 'src/product', definitionFilePath.replace('./', '')));
    for (const exportedValue of Object.values(module)) {
        if (exportedValue && typeof exportedValue === 'object' && id in exportedValue) {
            return exportedValue[id];
        }
    }
    return null;
}

{
    const allTools = listToolDefinitions();
    const interactiveToolIds = new Set(allTools.filter((tool) => tool.interactive).map((tool) => tool.id));
    const failed = [];

    for (const tool of allTools) {
        if (interactiveToolIds.has(tool.id)) continue;

        // eslint-disable-next-line no-await-in-loop
        const html = await readFile(path.join(projectRoot, 'tools', tool.id, 'index.html'), 'utf8');
        const match = html.match(/data-tool-definition-file="([^"]*)"/);
        const defPath = match?.[1] ?? '';

        // eslint-disable-next-line no-await-in-loop
        const loaded = await loadToolDefinition(tool.id, defPath).catch(() => null);
        if (!loaded || loaded.id !== tool.id) {
            failed.push(tool.id);
        }
    }

    assert.deepEqual(failed, [], `${failed.length} tool(s) failed to load correctly via the scoped dynamic import: ${failed.slice(0, 5).join(', ')}`);
}

// ---------------------------------------------------------------------------
// The core performance win itself: a typical tool page's definitions
// file must be a small fraction of the old combined size, not the
// whole aggregator
// ---------------------------------------------------------------------------

{
    const definitionsDir = path.join(projectRoot, 'src/product/definitions');
    const files = (await readdir(definitionsDir)).filter((name) => name.endsWith('.js'));
    let totalBytes = 0;
    for (const file of files) {
        // eslint-disable-next-line no-await-in-loop
        const stats = await (await import('node:fs/promises')).stat(path.join(definitionsDir, file));
        totalBytes += stats.size;
    }

    const pdfMergeHtml = await readFile(path.join(projectRoot, 'tools/pdf-merge/index.html'), 'utf8');
    const pdfMergeDefPath = pdfMergeHtml.match(/data-tool-definition-file="([^"]*)"/)[1];
    const pdfMergeDefStats = await (await import('node:fs/promises')).stat(path.join(projectRoot, 'src/product', pdfMergeDefPath.replace('./', '')));

    assert.ok(
        pdfMergeDefStats.size < totalBytes * 0.1,
        `pdf-merge's own definitions file (${pdfMergeDefStats.size} bytes) should be well under 10% of the combined size of all definition files (${totalBytes} bytes) -- if this fails, a page may be back to loading far more than its own tool's code`,
    );
}

// ---------------------------------------------------------------------------
// tool-page.js itself must no longer statically import the aggregated
// tool-definitions.js -- the actual architectural fix, checked
// directly from source
// ---------------------------------------------------------------------------

{
    const toolPageSource = await readFile(path.join(projectRoot, 'src/product/tool-page.js'), 'utf8');
    assert.doesNotMatch(
        toolPageSource,
        /^import\s*\{[^}]*getToolDefinition[^}]*\}\s*from\s*['"]\.\/tool-definitions\.js/m,
        'tool-page.js must not statically import getToolDefinition from the aggregated tool-definitions.js anymore -- that import alone reintroduces the original bug regardless of anything else in this file',
    );
    assert.match(toolPageSource, /await import\(/, 'tool-page.js must use a dynamic import() to load only the current page\'s own definitions file');
}

console.log('Per-tool dynamic definition loading verified: every non-interactive tool page has a valid, working scoped import path, and a typical page loads a small fraction of the old combined size.');

// END OF FILE
