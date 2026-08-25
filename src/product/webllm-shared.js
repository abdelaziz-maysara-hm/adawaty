/**
 * Shared WebLLM engine loader for all client-side LLM-powered tools on
 * this site (currently text-summarizer and grammar-checker). Extracted
 * out of text-summarizer/engine.js so both tools share one cached
 * engine instance: if a visitor uses one tool and then the other in
 * the same visit, the ~944 MB model does not get downloaded or
 * GPU-shader-compiled twice.
 *
 * Model: Qwen2.5-0.5B-Instruct-q4f16_1-MLC (Apache-2.0, ~944 MB,
 * official Arabic support -- verified directly from the Qwen team's
 * own release notes before choosing this model, not assumed).
 *
 * Hosting note: unlike this site's other AI-powered tools
 * (background-remover, whose ~4.6 MB model is small enough to commit
 * to this repo and serve same-origin), a ~944 MB model file cannot be
 * committed to a git repository at all -- GitHub rejects files over
 * 100 MB outright. The *library* (@mlc-ai/web-llm, 14 MB) is still
 * served same-origin from src/vendor/webllm/, matching every other
 * same-origin dependency on this site, but the *model weights* are
 * fetched from Hugging Face's CDN on first use and cached in the
 * browser (IndexedDB) afterward -- the same approach every production
 * WebLLM deployment uses. This is a one-time download of public,
 * non-personal model weights (comparable to loading a CDN-hosted JS
 * library), not a transmission of anything the user types: the actual
 * tool input/output never leaves the browser once the model is
 * loaded -- inference runs entirely on the user's own GPU via WebGPU.
 */

const MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC';

let enginePromise = null;

function isWebGPUSupported() {
    return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

/**
 * Lazily creates (and caches, across every tool that calls this) the
 * WebLLM engine for this page's lifetime.
 */
async function getSharedEngine(onProgress) {
    if (!isWebGPUSupported()) {
        throw new Error('WEBGPU_UNSUPPORTED');
    }
    if (!enginePromise) {
        const { CreateMLCEngine } = await import('../vendor/webllm/index.js');
        enginePromise = CreateMLCEngine(MODEL_ID, {
            initProgressCallback: onProgress,
        });
    }
    return enginePromise;
}

export { getSharedEngine, isWebGPUSupported, MODEL_ID };

// END OF FILE
