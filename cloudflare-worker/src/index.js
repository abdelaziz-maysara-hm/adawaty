/**
 * Adawaty Cloud AI Worker -- the OPT-IN, explicitly-chosen "advanced"
 * summarization backend, used only when a visitor clicks a clearly
 * labeled "Try the advanced (cloud) version" button on text-summarizer.
 * The site's default behavior stays 100% client-side (WebLLM in the
 * browser, see src/product/text-summarizer/engine.js); this Worker is
 * never called automatically or silently.
 *
 * Uses Cloudflare's Workers AI binding (env.AI), which authenticates
 * automatically via the account's own permissions -- no API token is
 * ever read, stored, or handled by this code at request time. The
 * token you created is only used once, by Wrangler, at deploy time.
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
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') ?? '';

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders(origin) });
        }

        if (!ALLOWED_ORIGINS.has(origin)) {
            return jsonResponse({ error: 'origin_not_allowed' }, 403, origin);
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
