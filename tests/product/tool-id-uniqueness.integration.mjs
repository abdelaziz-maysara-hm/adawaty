import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');
const toolDefinitionsPath = path.join(projectRoot, 'src/product/tool-definitions.js');
const definitionsDir = path.join(projectRoot, 'src/product/definitions');

/**
 * Guards against the exact bug class this test was written for: two definition
 * files independently defining a tool with the same `id`. Because
 * tool-definitions.js merges every definitions module into one object via
 * object spread, a duplicate id doesn't throw or warn -- it silently
 * discards whichever definition was spread first, with no error anywhere.
 * This has happened before (css-box-shadow-generator, css-border-radius-
 * generator, and random-string-generator each existed twice, silently
 * overwriting the original, better-tested version). This test parses the
 * real import list from tool-definitions.js, imports every definitions
 * module directly (bypassing the merge), and asserts no tool id is defined
 * in more than one file.
 */
async function findDefinitionModuleImports() {
    const source = await readFile(toolDefinitionsPath, 'utf-8');
    const importPattern = /import\s*\{\s*(\w+)\s*\}\s*from\s*'\.\/definitions\/([^']+)'/g;
    return [...source.matchAll(importPattern)].map(([, exportName, file]) => ({ exportName, file }));
}

const modules = await findDefinitionModuleImports();
assert.ok(
    modules.length > 60,
    `Expected to find 60+ definitions module imports in tool-definitions.js, found ${modules.length}. `
    + 'The import-parsing regex may need updating if the import style changed.',
);

const idToFiles = new Map();

for (const { exportName, file } of modules) {
    // eslint-disable-next-line no-await-in-loop -- sequential import keeps failures easy to trace
    const moduleExports = await import(pathToFileURL(path.join(definitionsDir, file)).href);
    const definitions = moduleExports[exportName];

    assert.ok(
        definitions && typeof definitions === 'object',
        `${file} does not export an object named "${exportName}" as imported in tool-definitions.js.`,
    );

    for (const id of Object.keys(definitions)) {
        if (!idToFiles.has(id)) {
            idToFiles.set(id, []);
        }
        idToFiles.get(id).push(file);
    }
}

const duplicates = [...idToFiles.entries()].filter(([, files]) => files.length > 1);

assert.deepEqual(
    duplicates,
    [],
    `Duplicate tool id(s) defined in more than one file -- whichever file is spread\n`
    + `last into tool-definitions.js silently wins, discarding the other definition\n`
    + `with no error. Rename one of the ids or remove the duplicate:\n`
    + duplicates.map(([id, files]) => `  - "${id}" defined in: ${files.join(', ')}`).join('\n'),
);

console.log(`Tool id uniqueness verified across ${modules.length} definition files (${idToFiles.size} unique ids).`);
