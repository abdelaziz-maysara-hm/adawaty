import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseJsonc } from 'jsonc-parser';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

/**
 * worker-entry.js is the single most consequential file added in this
 * session: it's the Worker script for the SAME Cloudflare project that
 * serves the entire live site (adawaty.tools), merged after the
 * separate `adawaty-workers` project was deleted. A bug here has a
 * fundamentally different blast radius than a bug in any tool's own
 * code -- it could, in principle, break every page on the site, not
 * just one tool.
 *
 * The safety design this file relies on: wrangler.jsonc's
 * `assets.run_worker_first: ["/api/*"]` means this Worker script is
 * only invoked at all for /api/* requests -- every other request is
 * served directly from static assets and never touches this file's
 * code. A second, independent guard inside the code itself
 * (`if (!pathname.startsWith('/api/')) return env.ASSETS.fetch(...)`)
 * backs this up in case that configuration is ever changed by mistake.
 * All /api/* logic is wrapped in a single top-level try/catch, so an
 * unexpected error can only ever produce a JSON error response, never
 * an unhandled exception.
 *
 * This suite verifies both the static configuration (wrangler.jsonc)
 * AND the actual runtime behavior via mocked env.ASSETS/env.AI objects
 * (Node has no `caches` or Cloudflare-specific globals, but the
 * routing and error-handling logic itself is plain JavaScript and
 * fully exercisable this way) -- not just that the right strings
 * appear in the source.
 */

// ---------------------------------------------------------------------------
// Static configuration
// ---------------------------------------------------------------------------

{
    const wranglerConfigSource = await readFile(path.join(projectRoot, 'wrangler.jsonc'), 'utf8');
    const parseErrors = [];
    const wranglerConfig = parseJsonc(wranglerConfigSource, parseErrors, { allowTrailingComma: true });
    assert.equal(parseErrors.length, 0, `wrangler.jsonc must be valid JSONC (comments allowed, since this file genuinely contains them -- both here and as read by Wrangler itself): ${JSON.stringify(parseErrors)}`);
    assert.equal(wranglerConfig.main, 'worker-entry.js');
    assert.equal(wranglerConfig.assets?.directory, '.');
    assert.deepEqual(
        wranglerConfig.assets?.run_worker_first,
        ['/api/*'],
        'run_worker_first must be scoped to /api/* only -- this is what guarantees a bug in the API logic can never affect normal page serving. A bare `true` here would route every single request through this Worker script first, losing that guarantee entirely.',
    );
}

// ---------------------------------------------------------------------------
// Runtime behavior, via mocked Cloudflare-specific bindings
// ---------------------------------------------------------------------------

const { default: worker } = await import(path.join(projectRoot, 'worker-entry.js'));

function makeMockEnv({ aiImpl } = {}) {
    let assetsFetchCalled = false;
    return {
        env: {
            ASSETS: {
                fetch: async () => {
                    assetsFetchCalled = true;
                    return new Response('mock asset content', { status: 200 });
                },
            },
            AI: { run: aiImpl ?? (async () => ({ response: 'mock summary' })) },
        },
        wasAssetsFetchCalled: () => assetsFetchCalled,
    };
}

{
    const { env, wasAssetsFetchCalled } = makeMockEnv();
    const response = await worker.fetch(new Request('https://adawaty.tools/tools/pdf-merge/'), env);
    assert.equal(response.status, 200);
    assert.ok(wasAssetsFetchCalled(), 'a normal page request must be served via env.ASSETS.fetch(), never touching the /api/* logic at all');
}

{
    // caches.default doesn't exist in this Node test environment (it's
    // a Cloudflare-specific global), so handleCurrencyRates() will
    // throw here -- what matters is that the top-level try/catch turns
    // that into a clean JSON error response, not an unhandled
    // exception, and critically, that it does NOT fall through to
    // ASSETS.fetch() (an /api/* request must never silently serve HTML
    // instead of JSON).
    const { env, wasAssetsFetchCalled } = makeMockEnv();
    const response = await worker.fetch(new Request('https://adawaty.tools/api/currency-rates?base=USD'), env);
    assert.equal(typeof response.status, 'number');
    assert.ok(response.status >= 400, 'an internal error in /api/* logic must produce an error status, not a silent 200');
    const body = await response.json();
    assert.ok(body.error, 'an /api/* error response must be structured JSON with an error field, not an unhandled crash');
    assert.ok(!wasAssetsFetchCalled(), 'an /api/* request must never fall through to serving a static asset, even when its own logic fails internally');
}

{
    // The core same-origin fix: a request with NO Origin header (the
    // normal case for a same-origin GET from the site's own pages)
    // must not be rejected as if it were an unauthorized cross-site
    // request.
    const { env } = makeMockEnv();
    const response = await worker.fetch(new Request('https://adawaty.tools/api/currency-rates?base=USD', { method: 'GET' }), env);
    assert.notEqual(response.status, 403, 'a request with no Origin header (the normal same-origin case) must not be rejected as origin_not_allowed');
}

{
    // A genuine cross-origin request (Origin header present, and not
    // adawaty.tools) must still be rejected -- the origin allowlist
    // must still do its job for actual third-party requests, not be
    // disabled entirely.
    const { env } = makeMockEnv();
    const response = await worker.fetch(
        new Request('https://adawaty.tools/api/currency-rates?base=USD', {
            method: 'GET',
            headers: { Origin: 'https://some-other-site.example' },
        }),
        env,
    );
    assert.equal(response.status, 403);
    const body = await response.json();
    assert.equal(body.error, 'origin_not_allowed');
}

{
    // An unknown /api/* path must return a clean 404, not fall through
    // to serving a static asset (which would silently serve an HTML
    // page where a caller expected JSON).
    const { env, wasAssetsFetchCalled } = makeMockEnv();
    const response = await worker.fetch(new Request('https://adawaty.tools/api/this-route-does-not-exist'), env);
    assert.equal(response.status, 404);
    assert.ok(!wasAssetsFetchCalled());
}

{
    // A thrown error from env.AI.run() (e.g. a genuine Workers AI
    // outage) must produce a clean error response, never an unhandled
    // exception that could take down the whole request.
    const { env } = makeMockEnv({ aiImpl: async () => { throw new Error('simulated Workers AI outage'); } });
    const response = await worker.fetch(
        new Request('https://adawaty.tools/api/summarize', {
            method: 'POST',
            body: JSON.stringify({ text: 'A sentence to summarize.', language: 'en' }),
            headers: { 'Content-Type': 'application/json' },
        }),
        env,
    );
    assert.equal(response.status, 502);
    const body = await response.json();
    assert.equal(body.error, 'ai_request_failed');
}

console.log('worker-entry.js safety design verified: run_worker_first scoping, ASSETS fallback, error isolation, and the same-origin fix to the origin check.');

// END OF FILE
