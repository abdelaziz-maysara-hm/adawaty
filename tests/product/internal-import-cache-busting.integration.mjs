import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * A real, confusing bug reported by a live user: after fixing the
 * wasmPaths configuration bug (0.5.132), the AI Background Remover
 * *still* appeared broken in a fresh Incognito tab. Root cause: only
 * the outer app.js script tags had a `?v=...` cache-busting query
 * string; every *internal* static import in the chain underneath
 * (background-remover/engine.js, replace-background/engine.js,
 * background-compositing.js) had none at all. Incognito mode clears
 * local browser cache, but not Cloudflare's own CDN edge cache -- so
 * even a fresh browser tab could still receive a stale cached copy of
 * the exact file the fix lived in, served under the same never-
 * changing URL.
 *
 * Fixed by adding a `?v=...` query string to every same-project
 * internal import in the chain, not just the top-level script tags.
 * This test exists so a future edit to any of these files can't ship
 * without bumping its own import's version string, silently
 * reintroducing the same "fix committed but never actually served"
 * confusion.
 */

const filesToCheck = [
    'src/product/background-remover-app.js',
    'src/product/replace-background-app.js',
    'src/product/replace-background/engine.js',
    'src/product/background-compositing.js',
];

for (const relativeFilePath of filesToCheck) {
    // eslint-disable-next-line no-await-in-loop -- a handful of small file reads, sequential keeps failures attributable to one file
    const source = await readFile(path.join(projectRoot, relativeFilePath), 'utf8');
    const importLines = source.split('\n').filter((line) => /^import\b/.test(line.trim()));

    for (const line of importLines) {
        // Only same-project relative imports need this (a leading '.'
        // or '..') -- imports of vendored third-party libraries (e.g.
        // onnxruntime-web, rembg-web) are loaded via dynamic import()
        // deeper in engine.js, checked separately in
        // onnxruntime-importmap.integration.mjs, and rarely change.
        const isRelativeImport = /from\s+['"]\.{1,2}\//.test(line);
        if (!isRelativeImport) continue;

        assert.match(
            line,
            /\?v=[a-z0-9]+['"]/,
            `${relativeFilePath}: internal import must have a '?v=...' cache-busting query string (Cloudflare's CDN cache can serve a stale copy of this file under its un-versioned URL even in a fresh Incognito tab): ${line.trim()}`,
        );
    }
}

console.log(`Internal import cache-busting verified across ${filesToCheck.length} files in the AI-tool chain.`);

// END OF FILE
