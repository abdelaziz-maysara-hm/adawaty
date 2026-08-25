import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { summarizeViaCloud } from '../../src/product/text-summarizer/cloud-engine.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * The opt-in "advanced (cloud)" summarization path, wired up after the
 * Adawaty Cloud Worker's /api/summarize endpoint had existed for a
 * while with no UI ever calling it -- this is what completes that,
 * and gives the ~15-18% of visitors without WebGPU support (who
 * previously hit a dead end) a real, explicitly-chosen fallback.
 *
 * The core design constraint verified here: this must never be the
 * silent default. Local (in-browser WebLLM) stays pre-selected;
 * switching to cloud mode requires an explicit confirmation dialog
 * disclosing that text will be sent to a cloud AI service, and the
 * "browser unsupported" fallback path's own button copy already
 * discloses this before the visitor even reaches the workspace.
 */

// ---------------------------------------------------------------------------
// summarizeViaCloud(): real error-handling behavior via mocked fetch,
// not just that a request gets sent
// ---------------------------------------------------------------------------

const originalFetch = globalThis.fetch;

try {
    globalThis.fetch = async () => new Response(JSON.stringify({ summary: 'This is a summary.' }), { status: 200 });
    const result = await summarizeViaCloud('long text', 'en');
    assert.equal(result, 'This is a summary.', 'a successful response must return the summary text');

    globalThis.fetch = async () => new Response(JSON.stringify({ error: 'ai_request_failed' }), { status: 502 });
    await assert.rejects(
        summarizeViaCloud('long text', 'en'),
        /ai_request_failed/,
        'a non-OK response must throw with the server\'s own error code, not fail silently',
    );

    globalThis.fetch = async () => new Response(JSON.stringify({}), { status: 200 });
    await assert.rejects(
        summarizeViaCloud('long text', 'en'),
        /empty_response/,
        'a 200 response missing the expected summary field must still throw, not silently return undefined',
    );

    globalThis.fetch = async () => { throw new Error('network failure'); };
    await assert.rejects(
        summarizeViaCloud('long text', 'en'),
        /network failure/,
        'a genuine network failure must propagate as a catchable error, not be swallowed',
    );
} finally {
    globalThis.fetch = originalFetch;
}

// ---------------------------------------------------------------------------
// summarizeViaCloud() must call the same-origin /api/summarize route
// ---------------------------------------------------------------------------

{
    const cloudEngineSource = await readFile(path.join(projectRoot, 'src/product/text-summarizer/cloud-engine.js'), 'utf8');
    assert.match(cloudEngineSource, /fetch\('\/api\/summarize'/, 'must call the same-origin /api/summarize route (the merged Worker), not a separate cross-origin URL');
}

// ---------------------------------------------------------------------------
// The UI must never make cloud mode the silent default, and must
// disclose it before use
// ---------------------------------------------------------------------------

{
    const appSource = await readFile(path.join(projectRoot, 'src/product/text-summarizer-app.js'), 'utf8');
    assert.match(appSource, /window\.confirm\(t\('cloudConfirm'\)\)/, 'switching to cloud mode must trigger an explicit confirmation dialog, not activate silently');
    assert.match(appSource, /cloudDisclosureConfirmed = true.*already disclosed via the fallback button/s, 'the unsupported-browser fallback path must be treated as already-disclosed (its own button copy discloses the cloud service before the visitor even reaches the workspace), not re-prompt redundantly');

    const html = await readFile(path.join(projectRoot, 'tools/text-summarizer/index.html'), 'utf8');
    assert.match(html, /value="local"[^>]*checked/, 'Local mode must be the pre-selected default in the HTML, never Cloud');
    assert.ok(html.includes('id="ts-use-cloud-fallback"'), 'the unsupported-browser notice must offer a real cloud fallback button, not just a dead end');
    assert.ok(html.includes('Cloudflare Workers AI') || html.includes('خدمة سحابية'), 'the cloud option must be disclosed by name/nature somewhere in the page, not left vague');
}

console.log('Opt-in cloud summarization: error handling, same-origin routing, and never-silent-default disclosure verified.');

// END OF FILE
