/**
 * Adawaty's single, unified Worker: serves the static site AND handles
 * /api/* routes (currency rates, opt-in cloud text summarization) from
 * the same Cloudflare project (`adawaty`).
 *
 * Merged into one project after the separate `adawaty-workers` project
 * was deleted -- this file now lives in the SAME repo/deploy pipeline
 * as the site itself, so there is only one Cloudflare project to manage,
 * one deploy pipeline, and one URL family (adawaty.tools) to reason
 * about, rather than two separate Cloudflare projects with two
 * separate deploy steps.
 *
 * SAFETY DESIGN, the most important thing about this file: this Worker
 * script is configured (see wrangler.jsonc's `run_worker_first`) to
 * only run at all for requests to /api/* -- every other request
 * (every page, every tool, every asset on the site) is served directly
 * from static assets and NEVER touches this file's code at all. This
 * means a bug in the /api/* logic below cannot break the rest of the
 * site, by construction, not just by care. The one remaining risk is a
 * deploy-time failure (a syntax error preventing this Worker from
 * building at all); Cloudflare Workers keeps serving the last
 * successfully-deployed version if a new deploy fails, so even that
 * failure mode does not take the live site down.
 *
 * Everything below this point (the actual /api/* logic) is otherwise
 * unchanged from the earlier, standalone `adawaty-workers` Cloudflare
 * project (since deleted in favor of this merged design) -- the
 * reasoning behind each design choice (why open.er-api.com is proxied
 * rather than called directly from the browser, why
 * llama-3.1-8b-instruct rather than the dedicated BART summarization
 * model, the CORS/origin allowlist) is unchanged from that version.
 */

const ALLOWED_ORIGINS = new Set([
    'https://adawaty.tools',
    'https://www.adawaty.tools',
]);

const MAX_INPUT_LENGTH = 20000; // characters; a generous cap against abuse/cost, not a normal-use limit

function corsHeaders(origin) {
    const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : '';
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
    };
}

function jsonResponse(body, status, origin) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
    });
}

// Matches currency-converter-tool.js's CURRENCIES list -- a whitelist,
// not just "any 3 letters", so this endpoint can't be used as an open
// proxy for arbitrary upstream requests.
const SUPPORTED_CURRENCY_CODES = new Set([
    'EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP', 'KWD', 'QAR',
    'JOD', 'TRY', 'CHF', 'JPY', 'CNY', 'INR', 'CAD', 'AUD',
]);

async function handleCurrencyRates(request, origin) {
    const url = new URL(request.url);
    const base = (url.searchParams.get('base') ?? 'USD').toUpperCase();

    if (!SUPPORTED_CURRENCY_CODES.has(base)) {
        return jsonResponse({ error: 'unsupported_currency', base }, 400, origin);
    }

    const cache = caches.default;
    const cacheKey = new Request(`https://cache.internal/currency-rates/${base}`);
    const cached = await cache.match(cacheKey);
    if (cached) {
        const cachedBody = await cached.json();
        return jsonResponse(cachedBody, 200, origin);
    }

    let upstreamResponse;
    try {
        upstreamResponse = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    } catch (error) {
        return jsonResponse({ error: 'upstream_unreachable', message: String(error?.message ?? error) }, 502, origin);
    }
    if (!upstreamResponse.ok) {
        return jsonResponse({ error: 'upstream_error', status: upstreamResponse.status }, 502, origin);
    }

    const data = await upstreamResponse.json();
    if (data.result !== 'success' || !data.rates) {
        return jsonResponse({ error: 'unexpected_upstream_response' }, 502, origin);
    }

    const body = {
        base,
        rates: data.rates,
        updatedAt: data.time_last_update_utc ?? null,
    };

    const cacheResponse = jsonResponse(body, 200, origin);
    cacheResponse.headers.set('Cache-Control', 'public, max-age=3600');
    await cache.put(cacheKey, cacheResponse.clone());

    return jsonResponse(body, 200, origin);
}

async function handleSummarize(request, env, origin) {
    if (request.method !== 'POST') {
        return jsonResponse({ error: 'method_not_allowed' }, 405, origin);
    }

    let payload;
    try {
        payload = await request.json();
    } catch {
        return jsonResponse({ error: 'invalid_json' }, 400, origin);
    }

    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
    const language = payload?.language === 'ar' ? 'ar' : 'en';

    if (!text) {
        return jsonResponse({ error: 'empty_text' }, 400, origin);
    }
    if (text.length > MAX_INPUT_LENGTH) {
        return jsonResponse({ error: 'text_too_long', maxLength: MAX_INPUT_LENGTH }, 400, origin);
    }

    const systemPrompt = language === 'ar'
        ? 'أنت مساعد يلخّص النصوص باختصار ودقة، وترد بنفس لغة النص المُدخل فقط، دون أي مقدمات أو تعليقات إضافية.'
        : 'You are an assistant that summarizes text concisely and accurately, responding only in the same language as the input text, with no preamble or extra commentary.';

    try {
        const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text },
            ],
            max_tokens: 512,
            temperature: 0.3,
        });

        const summary = typeof result?.response === 'string' ? result.response.trim() : '';
        if (!summary) {
            return jsonResponse({ error: 'empty_response' }, 502, origin);
        }
        return jsonResponse({ summary }, 200, origin);
    } catch (error) {
        return jsonResponse({ error: 'ai_request_failed', message: String(error?.message ?? error) }, 502, origin);
    }
}

export default {
    async fetch(request, env) {
        const { pathname } = new URL(request.url);

        // Belt-and-suspenders: even though wrangler.jsonc's
        // run_worker_first already restricts this Worker to /api/*
        // only, this check stays as a second, independent guarantee
        // that nothing here can ever intercept a normal page request
        // even if that configuration were ever changed by mistake.
        if (!pathname.startsWith('/api/')) {
            return env.ASSETS.fetch(request);
        }

        try {
            const origin = request.headers.get('Origin') ?? '';

            if (request.method === 'OPTIONS') {
                return new Response(null, { status: 204, headers: corsHeaders(origin) });
            }

            // /api/* is same-origin now that this logic lives in the
            // site's own Worker (rather than a separate Cloudflare
            // project) -- browsers don't always send an Origin header
            // for a plain same-origin GET request, so an *absent*
            // Origin is expected and legitimate here, not suspicious.
            // Only reject when an Origin header IS present and it's
            // some other site (a genuine cross-origin request), which
            // a same-origin page load from adawaty.tools itself will
            // never trigger.
            if (origin && !ALLOWED_ORIGINS.has(origin)) {
                return jsonResponse({ error: 'origin_not_allowed' }, 403, origin);
            }

            if (pathname === '/api/currency-rates') {
                if (request.method !== 'GET') {
                    return jsonResponse({ error: 'method_not_allowed' }, 405, origin);
                }
                return await handleCurrencyRates(request, origin);
            }

            if (pathname === '/api/summarize') {
                return await handleSummarize(request, env, origin);
            }

            return jsonResponse({ error: 'not_found' }, 404, origin);
        } catch (error) {
            // Any unexpected error in the /api/* logic must never
            // surface as a broken page -- it can only ever affect the
            // /api/* JSON response itself.
            return jsonResponse({ error: 'internal_error', message: String(error?.message ?? error) }, 500, '');
        }
    },
};

// END OF FILE
