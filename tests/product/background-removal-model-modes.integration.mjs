import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * The "General"/"People" model-mode choice added after real user
 * feedback: the general-purpose u2netp model struggled to fully
 * separate a person from a visually busy, multi-colored background (a
 * painted wall mural in the actual reported photo). u2net_human_seg
 * (~176 MB, loaded from a GitHub Release URL -- too large to vendor
 * same-origin, see /models/README.md) was verified separately with a
 * real inference run on a synthetic multi-colored-background test
 * image before this feature was built on top of it.
 *
 * What's checked here is the *wiring*: that the engine genuinely
 * branches on modelMode rather than ignoring it, that both tool pages
 * offer the choice with real size/speed guidance (not silently
 * defaulting to the large model, or hiding the tradeoff), and that
 * replace-background threads the selection through to the same shared
 * engine rather than duplicating model logic.
 */

{
    const engineSource = await readFile(path.join(projectRoot, 'src/product/background-remover/engine.js'), 'utf8');
    assert.match(engineSource, /HUMAN_SEG_MODEL_URL\s*=\s*'https:\/\/github\.com\/danielgatis\/rembg\/releases\/download\/v0\.0\.0\/u2net_human_seg\.onnx'/, 'the human-segmentation model URL must be the same verified GitHub Release source used for u2netp');
    assert.match(engineSource, /modelMode\s*===\s*'person'/, 'getSession must branch on modelMode to choose between the general and person-specific model');
    assert.match(engineSource, /u2net_custom/, 'the person model must be loaded via u2net_custom (the only session type that accepts an arbitrary external modelPath)');
    assert.match(engineSource, /sessionPromises\.set\(modelMode/, 'sessions must be cached per model mode, not a single shared cache -- switching modes mid-visit must not discard the other mode\'s already-loaded session');
}

{
    const replaceEngineSource = await readFile(path.join(projectRoot, 'src/product/replace-background/engine.js'), 'utf8');
    assert.match(replaceEngineSource, /modelMode\s*=\s*'general'/, 'replaceBackground must accept a modelMode parameter, defaulting to general');
    assert.match(replaceEngineSource, /removeBackground\(file,\s*onProgress,\s*modelMode\)/, 'replaceBackground must thread modelMode through to background-remover\'s engine, not silently drop it');
}

for (const [toolDir, appFile, radioName] of [
    ['background-remover', 'background-remover-app.js', 'bgr-model'],
    ['replace-background', 'replace-background-app.js', 'rb-model'],
]) {
    // eslint-disable-next-line no-await-in-loop -- a handful of small file reads, sequential keeps failures attributable to one file
    const html = await readFile(path.join(projectRoot, 'tools', toolDir, 'index.html'), 'utf8');
    assert.ok(html.includes(`name="${radioName}"`), `${toolDir}: must offer a model-mode choice via radio inputs`);
    assert.ok(html.includes('value="general"') && html.includes('value="person"'), `${toolDir}: must offer both 'general' and 'person' options`);
    assert.match(html, /value="general"[^>]*checked/, `${toolDir}: 'general' must be the pre-selected default, never a silent large-download default`);
    // The size/speed tradeoff must be genuinely disclosed to the user, not just implemented silently.
    assert.match(html, /176\s*(ميجا|MB)/, `${toolDir}: the ~176 MB download size for 'person' mode must be disclosed in the UI, not hidden`);

    // eslint-disable-next-line no-await-in-loop
    const appSource = await readFile(path.join(projectRoot, 'src/product', appFile), 'utf8');
    assert.match(appSource, /getSelectedModelMode/, `${toolDir}: the app script must read the user's model-mode selection`);
    assert.match(appSource, new RegExp(`input\\[name="${radioName}"\\]`), `${toolDir}: getSelectedModelMode must read the correct radio group`);
}

console.log('Background-removal model-mode selection (General/People) verified across both tool pages and their shared engine.');

// END OF FILE
