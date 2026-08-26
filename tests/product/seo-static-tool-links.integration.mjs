import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getToolDefinition, listToolDefinitions } from '../../src/product/tool-definitions.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * A real, significant SEO gap found via a Google Search Console
 * screenshot showing 342 pages "Discovered - currently not indexed"
 * (a rising trend): investigating found that EVERY browse/category page
 * on this entire site rendered its tool list purely client-side via
 * catalogue-page.js, meaning the raw HTML search engines see (before
 * any JavaScript execution) contained zero real links to any tool
 * page -- discovery relied entirely on sitemap.xml with no internal-
 * linking "vote" behind it at all, a documented common cause of this
 * exact indexing status.
 *
 * Fixed by adding a real, genuinely visible (not hidden via CSS) list
 * of every tool in scope to each category page and the all-tools page,
 * generated statically at build time -- deliberately visible rather
 * than hidden, both because it has real standalone value to a visitor
 * wanting a scannable full list, and because hidden links that differ
 * from what users see risk being read as manipulative by search
 * engines.
 */

async function findAllIndexPages(directory) {
    const { readdir } = await import('node:fs/promises');
    const entries = await readdir(directory, { withFileTypes: true });
    const pages = [];
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            // eslint-disable-next-line no-await-in-loop
            pages.push(...await findAllIndexPages(fullPath));
        } else if (entry.name === 'index.html') {
            pages.push(fullPath);
        }
    }
    return pages;
}

// ---------------------------------------------------------------------------
// The all-tools page must contain a real, static <a href> for every
// single registered tool
// ---------------------------------------------------------------------------

{
    const html = await readFile(path.join(projectRoot, 'all-tools/index.html'), 'utf8');
    assert.ok(html.includes('catalogue-static-links'), 'all-tools page must contain the static links section');

    const allTools = listToolDefinitions();
    const missingTools = allTools.filter((tool) => !html.includes(`tools/${tool.id}/`));
    assert.deepEqual(
        missingTools.map((tool) => tool.id),
        [],
        `${missingTools.length} tool(s) have no static link on the all-tools page: ${missingTools.slice(0, 5).map((tool) => tool.id).join(', ')}`,
    );
}

// ---------------------------------------------------------------------------
// Every category page must statically link every tool in that
// category specifically -- not just some, not tools from other
// categories
// ---------------------------------------------------------------------------

{
    const categoryDirectories = await (await import('node:fs/promises')).readdir(path.join(projectRoot, 'categories'), { withFileTypes: true });
    const categorySlugs = categoryDirectories.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
    assert.ok(categorySlugs.length >= 15, `expected at least 15 category directories, found ${categorySlugs.length} -- the directory walk itself may be broken`);

    for (const categorySlug of categorySlugs) {
        // eslint-disable-next-line no-await-in-loop
        const html = await readFile(path.join(projectRoot, 'categories', categorySlug, 'index.html'), 'utf8');
        const categoryTools = listToolDefinitions().filter((tool) => tool.category === categorySlug);
        const missingTools = categoryTools.filter((tool) => !html.includes(`tools/${tool.id}/`));
        assert.deepEqual(
            missingTools.map((tool) => tool.id),
            [],
            `categories/${categorySlug}/: ${missingTools.length} tool(s) in this category have no static link on its own category page: ${missingTools.slice(0, 5).map((tool) => tool.id).join(', ')}`,
        );
    }
}

// ---------------------------------------------------------------------------
// The static links must be genuinely visible, not hidden via CSS --
// checked directly against the actual stylesheet, not just assumed
// from how the generator writes the HTML
// ---------------------------------------------------------------------------

{
    const css = await readFile(path.join(projectRoot, 'src/css/product.css'), 'utf8');
    const sectionRuleMatch = css.match(/\.catalogue-static-links\s*{([^}]*)}/);
    assert.ok(sectionRuleMatch, 'the .catalogue-static-links CSS rule must exist');
    assert.doesNotMatch(sectionRuleMatch[1], /display:\s*none/, 'the static links section must never be hidden via display:none -- a hidden link list that differs from what users see risks being read as manipulative by search engines; this must be a genuine, visible feature');
    assert.doesNotMatch(sectionRuleMatch[1], /visibility:\s*hidden/, 'the static links section must never use visibility:hidden for the same reason');
}

// ---------------------------------------------------------------------------
// The registration test that catches missing tools drifting out of
// sync with reality: confirm a spot-checked real tool ID is present
// ---------------------------------------------------------------------------

{
    assert.ok(getToolDefinition('pdf-merge'), 'sanity check: pdf-merge must be a real, registered tool for the category-coverage test above to be meaningful');
}

console.log('Static SEO tool-links: verified every tool is statically linked from its category page and all-tools, and confirmed the section is genuinely visible (not hidden).');

// END OF FILE
