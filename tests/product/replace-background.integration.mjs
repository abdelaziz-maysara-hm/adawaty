import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getToolDefinition, listToolDefinitions } from '../../src/product/tool-definitions.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * replace-background is a pure orchestration layer over two already-
 * shipped, already-verified engines: background-remover's AI removal
 * (verified via real ONNX inference on a synthetic test image) and the
 * shared compositing logic in background-compositing.js (verified via
 * real node-canvas pixel checks, including the exact transparency-
 * detection case this tool depends on to decide whether AI removal is
 * needed at all). No new pixel-manipulation logic exists in this tool,
 * so what's checked here is the orchestration itself: product
 * registration, page structure, and that the engine module correctly
 * branches on transparency detection rather than always running removal.
 */

{
    const tool = getToolDefinition('replace-background');
    assert.ok(tool, 'replace-background must be registered in tool-definitions.js');
    assert.equal(tool.interactive, true);
    assert.equal(tool.category, 'image');
    assert.ok(tool.title.ar && tool.title.en);
    assert.ok(tool.description.ar && tool.description.en);
    assert.ok(listToolDefinitions().some((candidate) => candidate.id === 'replace-background'));
}

{
    const pagePath = path.join(projectRoot, 'tools/replace-background/index.html');
    const html = await readFile(pagePath, 'utf8');
    assert.ok(html.includes('data-tool-page="replace-background"'));
    assert.ok(html.includes('id="rb-drop-zone"'));
    assert.ok(html.includes('id="rb-generate"'));
    // All 3 background types from the standalone Add Background tools
    // must be represented here too, since this tool is meant to fully
    // replace the need to visit those tools separately for a
    // non-transparent starting image.
    assert.ok(html.includes('data-bg-type="color"'));
    assert.ok(html.includes('data-bg-type="gradient"'));
    assert.ok(html.includes('data-bg-type="image"'));
    assert.ok(html.includes('product-faq'), 'must have FAQ content like every other tool page');
    assert.ok(html.includes('"@type":"FAQPage"'));
}

{
    // The engine must genuinely branch on transparency detection --
    // confirmed by reading the source directly rather than assumed,
    // since silently always running AI removal (even on an already-
    // transparent image) would waste real processing time for no
    // benefit, and the whole point of hasAnyTransparency() existing is
    // to make that branch possible.
    const engineSource = await readFile(path.join(projectRoot, 'src/product/replace-background/engine.js'), 'utf8');
    assert.match(engineSource, /hasAnyTransparency/, 'the engine must check for existing transparency before deciding whether to run AI removal');
    assert.match(engineSource, /removeBackground/, 'the engine must reuse the existing background-remover engine, not reimplement AI removal');
    assert.match(engineSource, /compositeOntoBackground/, 'the engine must reuse the shared compositing logic, not reimplement pixel compositing');
    assert.match(engineSource, /if\s*\(\s*!alreadyTransparent\s*\)/, 'AI removal must be conditional on the image NOT already being transparent');
}

console.log('Replace Background: product-registration, page-structure, and orchestration-logic checks passed.');

// END OF FILE
