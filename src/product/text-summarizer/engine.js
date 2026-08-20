/**
 * Client-side text summarization via WebLLM (Apache-2.0) running
 * Qwen2.5-0.5B-Instruct (Apache-2.0, ~944 MB, official Arabic support --
 * verified directly from the Qwen team's own release notes before
 * choosing this model, not assumed).
 *
 * Hosting note, disclosed here and to the user in the tool's own UI:
 * unlike this site's other AI-powered tool (background-remover, whose
 * ~4.6 MB model is small enough to commit to this repo and serve
 * same-origin), a ~944 MB model file cannot be committed to a git
 * repository at all -- GitHub rejects files over 100 MB outright. The
 * *library* (@mlc-ai/web-llm, 14 MB) is still served same-origin from
 * src/vendor/webllm/, matching every other same-origin dependency on
 * this site, but the *model weights* are fetched from Hugging Face's
 * CDN on first use and cached in the browser (IndexedDB) afterward --
 * the same approach every production WebLLM deployment uses, since
 * self-hosting gigabyte-scale model files isn't practical for most
 * projects. This is a one-time download of public, non-personal model
 * weights (comparable to loading a CDN-hosted JS library), not a
 * transmission of anything the user types: the actual summarization
 * input/output never leaves the browser once the model is loaded --
 * inference runs entirely on the user's own GPU via WebGPU.
 */

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

let enginePromise = null;

function isWebGPUSupported() {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * Lazily creates (and caches) the WebLLM engine for this page's
 * lifetime, so repeated summarizations in one visit don't reload the
 * model or re-run its GPU shader compilation step.
 */
async function getEngine(onProgress) {
    if (!isWebGPUSupported()) {
        throw new Error('WEBGPU_UNSUPPORTED');
    }
    if (!enginePromise) {
        const { CreateMLCEngine } = await import('../../vendor/webllm/index.js');
        enginePromise = CreateMLCEngine(MODEL_ID, {
            initProgressCallback: onProgress,
        });
    }
    return enginePromise;
}

/**
 * Summarizes `text` using a fixed, non-editable system prompt (so this
 * stays a genuine single-purpose "Text Summarizer" tool, not a general
 * chat interface wearing a summarizer's clothes).
 */
async function summarizeText(text, language, onProgress) {
    const engine = await getEngine(onProgress);
    const systemPrompt = language === 'ar'
        ? 'أنت مساعد يلخّص النصوص باختصار ودقة، وترد بنفس لغة النص المُدخل فقط، دون أي مقدمات أو تعليقات إضافية.'
        : 'You are an assistant that summarizes text concisely and accurately, responding only in the same language as the input text, with no preamble or extra commentary.';

    const response = await engine.chat.completions.create({
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text },
        ],
        temperature: 0.3,
        max_tokens: 400,
    });

    return response.choices[0]?.message?.content?.trim() ?? '';
}

export { summarizeText, isWebGPUSupported, MODEL_ID };

// END OF FILE
