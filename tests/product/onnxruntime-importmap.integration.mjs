import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * A real bug found via user testing on the live site: `rembg-web`
 * (the vendored background-removal library, see src/vendor/rembg-web/)
 * contains `import * as ort from 'onnxruntime-web';` -- a *bare*
 * module specifier, valid syntax that only resolves in bundler-based
 * projects (webpack, vite, etc.) unless the browser is given an
 * import map. This site deliberately has no bundler (plain
 * `<script type="module">` loaded directly), so without an import map
 * this fails at runtime with "Failed to resolve module specifier
 * 'onnxruntime-web'" -- confirmed directly from the browser console
 * error the user reported, not guessed.
 *
 * Fixed with a standard `<script type="importmap">` (the browser-
 * native mechanism for exactly this situation) rather than patching
 * the vendored library's source directly, which would silently be
 * lost on any future `npm update`. This test exists so a *future*
 * page that pulls in this same engine (directly or indirectly, like
 * replace-background does through background-remover's engine)
 * can't ship without the same fix silently missing again.
 */

async function findAllIndexPages(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const pages = [];
    for (const entry of entries) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
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

const toolsDirectory = path.join(projectRoot, 'tools');
const allToolPages = await findAllIndexPages(toolsDirectory);

const pagesNeedingImportMap = [];
for (const pagePath of allToolPages) {
    // eslint-disable-next-line no-await-in-loop -- sequential reads keep failures attributable to one exact file
    const html = await readFile(pagePath, 'utf8');
    // Any page that pulls in background-remover's engine -- directly
    // (background-remover itself) or indirectly (replace-background,
    // which imports it through its own engine) -- transitively needs
    // onnxruntime-web resolved, whether or not that import appears
    // literally in this page's own script tag.
    if (html.includes('background-remover/engine.js') || html.includes('background-remover-app.js') || html.includes('replace-background-app.js')) {
        pagesNeedingImportMap.push(pagePath);
    }
}

assert.ok(pagesNeedingImportMap.length >= 2, `expected at least 2 pages needing the import map (background-remover, replace-background), found ${pagesNeedingImportMap.length}`);

for (const pagePath of pagesNeedingImportMap) {
    // eslint-disable-next-line no-await-in-loop
    const html = await readFile(pagePath, 'utf8');
    const relativePath = path.relative(projectRoot, pagePath);

    const importMapMatch = html.match(/<script type="importmap">(.*?)<\/script>/s);
    assert.ok(importMapMatch, `${relativePath}: must have a <script type="importmap"> resolving the bare 'onnxruntime-web' specifier`);

    let importMap;
    try {
        importMap = JSON.parse(importMapMatch[1]);
    } catch (error) {
        assert.fail(`${relativePath}: import map is not valid JSON: ${error.message}`);
    }
    const mappedPath = importMap.imports?.['onnxruntime-web'];
    assert.ok(mappedPath, `${relativePath}: import map must map 'onnxruntime-web'`);

    // The import map must appear BEFORE the module script that needs
    // it, or the browser won't apply it in time.
    const importMapIndex = html.indexOf('<script type="importmap">');
    const moduleScriptIndex = html.indexOf('<script type="module"');
    assert.ok(importMapIndex < moduleScriptIndex, `${relativePath}: the import map must appear before the module script that depends on it`);

    // The mapped path must resolve to a real file on disk, relative to
    // the page's own directory (matching how the browser would resolve it).
    const resolvedTargetPath = path.resolve(path.dirname(pagePath), mappedPath);
    await assert.doesNotReject(
        readFile(resolvedTargetPath),
        `${relativePath}: import map points to '${mappedPath}', which does not resolve to a real file on disk`,
    );
}

// ---------------------------------------------------------------------------
// wasmPaths configuration: two more real bugs found via a live browser error
// report, on top of the import map issue above. Traced onnxruntime-web's own
// minified source directly (not guessed) to confirm the dynamic import()
// that consumes wasmPaths executes *inside ort.min.mjs itself*, so a bare
// filename (not a relative path with any '../' segments) is the only
// correct value, since every vendored onnxruntime-web file sits in the same
// directory as ort.min.mjs. Also confirmed the library falls back to its
// own hardcoded ".jsep.mjs" (WebGPU) filename unless wasmPaths is an
// explicit object naming both files directly -- a bare string prefix was
// not enough.
// ---------------------------------------------------------------------------

{
    const engineSource = await readFile(path.join(projectRoot, 'src/product/background-remover/engine.js'), 'utf8');
    const wasmPathsMatch = engineSource.match(/wasmPaths\s*=\s*\{([^}]+)\}/);
    assert.ok(wasmPathsMatch, 'engine.js must configure ort.env.wasm.wasmPaths as an explicit object, not a bare string prefix (the library silently falls back to its own .jsep.mjs default filename otherwise)');

    const mjsMatch = wasmPathsMatch[1].match(/mjs:\s*'([^']+)'/);
    const wasmMatch = wasmPathsMatch[1].match(/wasm:\s*'([^']+)'/);
    assert.ok(mjsMatch && wasmMatch, 'wasmPaths must explicitly name both the .mjs and .wasm files');

    for (const [key, value] of [['mjs', mjsMatch[1]], ['wasm', wasmMatch[1]]]) {
        assert.ok(!value.includes('/'), `wasmPaths.${key} ('${value}') must be a bare filename with no path segments -- it resolves relative to ort.min.mjs's own location (all vendored files share one directory), not relative to the page or to engine.js`);
        const resolvedPath = path.join(projectRoot, 'src/vendor/onnxruntime-web', value);
        // eslint-disable-next-line no-await-in-loop
        await assert.doesNotReject(readFile(resolvedPath), `wasmPaths.${key} ('${value}') does not resolve to a real vendored file`);
    }
}

console.log(`onnxruntime-web import map verified across ${pagesNeedingImportMap.length} page(s) that need it: ${pagesNeedingImportMap.map((p) => path.relative(projectRoot, p)).join(', ')}.`);

// END OF FILE
