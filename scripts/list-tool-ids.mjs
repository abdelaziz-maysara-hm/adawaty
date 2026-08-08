/**
 * Lists every real tool id + Arabic title currently in the product, read
 * directly from the running code rather than grepped from source text.
 *
 * Why this exists: a plain-text grep for `id: '...'` misses any definitions
 * file written in a different style -- for example
 * web-transform-tools.js and web-content-tools.js pass the id as a
 * *positional function argument* (`tool('some-id', icon, title, ...)`)
 * rather than an `id: '...'` object key, so it never matches that pattern
 * at all. This script instead imports every definitions module the same
 * way tool-definitions.js does and reads the real, final `id` property off
 * each exported tool object -- so it can't miss a tool just because of how
 * its file happens to be written.
 *
 * Use this BEFORE writing any new tool, not just after: dump the list, and
 * actually read it for a similar id or title before assuming a catalogue
 * item is missing. Exact-id collisions and near-duplicate functionality
 * under a different name have both happened before (see CHANGELOG 0.5.47
 * and 0.5.49) from skipping this step or only grepping source text.
 *
 * Usage:
 *   node scripts/list-tool-ids.mjs            # prints id + Arabic title for every tool
 *   node scripts/list-tool-ids.mjs --json      # prints the same as JSON (id, title, file)
 *   node scripts/list-tool-ids.mjs cron        # filters to ids/titles containing "cron"
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '..');
const toolDefinitionsPath = path.join(projectRoot, 'src/product/tool-definitions.js');
const definitionsDir = path.join(projectRoot, 'src/product/definitions');

async function findDefinitionModuleImports() {
    const source = await readFile(toolDefinitionsPath, 'utf-8');
    const importPattern = /import\s*\{\s*(\w+)\s*\}\s*from\s*'\.\/definitions\/([^']+)'/g;
    return [...source.matchAll(importPattern)].map(([, exportName, file]) => ({ exportName, file }));
}

async function listAllTools() {
    const modules = await findDefinitionModuleImports();
    const allTools = [];

    for (const { exportName, file } of modules) {
        // eslint-disable-next-line no-await-in-loop -- sequential import keeps failures easy to trace
        const moduleExports = await import(path.join(definitionsDir, file));
        const definitions = moduleExports[exportName];
        if (!definitions) continue;

        for (const [id, tool] of Object.entries(definitions)) {
            allTools.push({
                id,
                titleAr: tool.title?.ar ?? '',
                titleEn: tool.title?.en ?? '',
                descriptionAr: tool.description?.ar ?? '',
                file,
            });
        }
    }

    return allTools;
}

const args = process.argv.slice(2);
const wantsJson = args.includes('--json');
const filterTerm = args.find((arg) => !arg.startsWith('--'))?.toLowerCase();

const tools = await listAllTools();
const filtered = filterTerm
    ? tools.filter((tool) => (
        tool.id.toLowerCase().includes(filterTerm)
        || tool.titleAr.includes(filterTerm)
        || tool.titleEn.toLowerCase().includes(filterTerm)
        || tool.descriptionAr.includes(filterTerm)
    ))
    : tools;

if (wantsJson) {
    console.log(JSON.stringify(filtered, null, 2));
} else {
    console.log(`${filtered.length} of ${tools.length} total tools${filterTerm ? ` matching "${filterTerm}"` : ''}:\n`);
    for (const tool of filtered) {
        console.log(`  ${tool.id.padEnd(40)} ${tool.titleAr}  (${tool.file})`);
    }
}
