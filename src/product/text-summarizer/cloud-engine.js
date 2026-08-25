/**
 * The opt-in, explicitly-chosen "advanced (cloud)" summarization path.
 * The site's default stays 100% client-side (WebLLM in the browser,
 * see text-summarizer/engine.js); this is only ever called after a
 * visitor deliberately clicks a clearly labeled button and confirms
 * they understand their text will be sent to a cloud AI service --
 * never automatically, and never silently.
 *
 * Calls the same-origin /api/summarize route (see /worker-entry.js),
 * which forwards to Cloudflare Workers AI (@cf/meta/llama-3.1-8b-instruct).
 */
async function summarizeViaCloud(text, language) {
    const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
    });

    if (!response.ok) {
        let errorBody;
        try {
            errorBody = await response.json();
        } catch {
            errorBody = {};
        }
        throw new Error(errorBody.error ?? `HTTP ${response.status}`);
    }

    const data = await response.json();
    if (typeof data.summary !== 'string' || !data.summary) {
        throw new Error('empty_response');
    }
    return data.summary;
}

export { summarizeViaCloud };

// END OF FILE
