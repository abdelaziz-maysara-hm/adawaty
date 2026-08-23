/**
 * Adawaty Cloud Worker -- two distinct endpoints:
 *
 * 1. POST / (or /api/summarize) -- the OPT-IN, explicitly-chosen
 *    "advanced" summarization backend, used only when a visitor clicks
 *    a clearly labeled "Try the advanced (cloud) version" button on
 *    text-summarizer. The site's default behavior stays 100%
 *    client-side (WebLLM in the browser); this endpoint is never
 *    called automatically or silently.
 *
 * 2. GET /api/currency-rates?base=USD -- a plain proxy to
 *    open.er-api.com (ExchangeRate-API's free, no-key public endpoint),
 *    used by currency-converter. NOT an AI feature and not opt-in --
 *    added here specifically to sidestep a genuine, unresolved CORS
 *    uncertainty around calling open.er-api.com directly from a
 *    browser (independent sources disagreed on whether it sends CORS
 *    headers at all). A server-to-server fetch has no CORS
 *    restriction, so proxying through this same-origin Worker removes
 *    the ambiguity entirely rather than gambling on it. Cached at the
 *    edge for 1 hour (matching this data source's own ~daily update
 *    cadence) to reduce load on the upstream free service.
 *
 * Uses Cloudflare's Workers AI binding (env.AI) for the summarization
 * endpoint only, which authenticates automatically via the account's
 * own permissions -- no API token is ever read, stored, or handled by
 * this code at request time. The token you created is only used once,
 * by Wrangler, at deploy time.
 *
 * Model: @cf/meta/llama-3.1-8b-instruct -- a general multilingual
 * instruction model, not Workers AI's dedicated BART summarization
 * model (@cf/facebook/bart-large-cnn), which was deliberately NOT used
 * here: BART was trained on English news data (CNN/DailyMail) and does
 * not handle Arabic input reliably, and this site's summarizer must
 * work in both languages. The same "reply in the same language as the
 * input, summary only, no preamble" system prompt used by the
 * client-side WebLLM version is reused here for consistent behavior
 * regardless of which path a visitor chooses.
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

// Matches this Worker's own set of supported currencies (see
// currency-converter-tool.js's CURRENCIES list) -- a whitelist, not
// just "any 3 letters", so this Worker can't be used as an open proxy
// for arbitrary upstream requests.
const SUPPORTED_CURRENCY_CODES = new Set([
    'EGP', 'USD', 'EUR', 'SAR', 'AED', 'GBP', 'KWD', 'QAR',
    'JOD', 'TRY', 'CHF', 'JPY', 'CNY', 'INR', 'CAD', 'AUD',
]);

/**
 * Proxies open.er-api.com server-to-server, sidestepping the
 * unresolved CORS uncertainty around calling it directly from a
 * browser. Cached at Cloudflare's edge for 1 hour, matching this free
 * upstream's own roughly-daily update cadence.
 */
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

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') ?? '';
        const { pathname } = new URL(request.url);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }

        if (!ALLOWED_ORIGINS.has(origin)) {
            return jsonResponse({ error: 'origin_not_allowed' }, 403, origin);
        }

        if (pathname === '/api/currency-rates') {
            if (request.method !== 'GET') {
                return jsonResponse({ error: 'method_not_allowed' }, 405, origin);
            }
            return handleCurrencyRates(request, origin);
        }

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
    },
};

// END OF FILE
