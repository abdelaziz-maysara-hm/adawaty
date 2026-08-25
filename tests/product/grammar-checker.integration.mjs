import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getToolDefinition } from '../../src/product/tool-definitions.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * grammar-checker: added alongside currency-converter after researching
 * genuinely high-search-volume tool categories missing from this site
 * (Grammarly, LanguageTool, QuillBot, and similar competitors).
 *
 * Deliberately built as a sibling to text-summarizer rather than a
 * standalone tool: both need a real LLM (not just rule-based checks) to
 * be competitive, and both use the exact same model. Extracted the
 * engine-loading logic (getSharedEngine in webllm-shared.js) out of
 * text-summarizer's own engine file so the two tools share one cached
 * engine instance -- a visitor using both in the same visit should not
 * download or GPU-compile the ~944 MB model twice.
 */

{
    const tool = getToolDefinition('grammar-checker');
    assert.ok(tool, 'grammar-checker must be registered in tool-definitions.js');
    assert.equal(tool.interactive, true);
    assert.equal(tool.category, 'text');
    assert.ok(tool.title.ar && tool.title.en);
    assert.ok(tool.description.ar && tool.description.en);
}

{
    const pagePath = path.join(projectRoot, 'tools/grammar-checker/index.html');
    const html = await readFile(pagePath, 'utf8');
    assert.ok(html.includes('data-tool-page="grammar-checker"'));
    assert.ok(html.includes('id="gc-input"'));
    assert.ok(html.includes('id="gc-correct"'));
    assert.ok(html.includes('product-faq'), 'must have FAQ content like every other tool page');
    assert.ok(html.includes('"@type":"FAQPage"'));
}

{
    // The shared-engine design is the whole point of this tool's
    // architecture (avoiding a duplicate model load if a visitor uses
    // both AI text tools) -- verified directly from source, not just
    // that the tool happens to work.
    const engineSource = await readFile(path.join(projectRoot, 'src/product/grammar-checker/engine.js'), 'utf8');
    assert.match(engineSource, /from ['"]\.\.\/webllm-shared\.js(\?v=[a-z0-9]+)?['"]/, 'grammar-checker must reuse the shared WebLLM engine loader, not duplicate its own copy of the loading logic');
    assert.match(engineSource, /getSharedEngine/, 'must call the shared engine getter');

    const summarizerEngineSource = await readFile(path.join(projectRoot, 'src/product/text-summarizer/engine.js'), 'utf8');
    assert.match(summarizerEngineSource, /from ['"]\.\.\/webllm-shared\.js(\?v=[a-z0-9]+)?['"]/, 'text-summarizer must also have been refactored onto the shared loader (both tools sharing one engine instance is the point)');

    const sharedSource = await readFile(path.join(projectRoot, 'src/product/webllm-shared.js'), 'utf8');
    assert.match(sharedSource, /let enginePromise = null/, 'the shared module must cache a single engine promise, not create a fresh one per call');
}

{
    // The corrected-text-only design (no explanation/diff) is a
    // deliberate scope choice, not an oversight -- verify the system
    // prompt reflects it, so a future edit can't silently turn this
    // into a chat-style "explain the changes" tool without a
    // conscious decision to do so.
    const engineSource = await readFile(path.join(projectRoot, 'src/product/grammar-checker/engine.js'), 'utf8');
    assert.match(engineSource, /دون أي شرح/, 'the Arabic system prompt must explicitly instruct no explanation, just the corrected text');
    assert.match(engineSource, /no explanation/, 'the English system prompt must likewise instruct no explanation');
}

console.log('Grammar Checker: product-registration, page-structure, and shared-engine architecture checks passed.');

// END OF FILE
