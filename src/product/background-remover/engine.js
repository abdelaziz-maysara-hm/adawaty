/**
 * Client-side, in-browser background removal via rembg-web (MIT) +
 * onnxruntime-web. Two model options, both explained in full in
 * /models/README.md:
 *
 * - 'general' (default): u2netp.onnx, ~4.6 MB, vendored same-origin in
 *   this repo. Fast, works reasonably for most subjects.
 * - 'person': u2net_human_seg.onnx, ~176 MB, loaded at runtime from a
 *   CDN (too large to vendor same-origin -- GitHub rejects repo files
 *   over 100 MB, and Cloudflare Workers' static asset limit is 25 MB
 *   per file). Added after real user feedback: the general model
 *   struggled to fully separate a person from a visually busy,
 *   multi-colored background (a painted wall mural) -- verified with a
 *   real inference run on a synthetic multi-colored-background test
 *   image before shipping this option, not assumed.
 *   A real bug found via a live browser console error report: the
 *   file was first sourced from a GitHub Release URL
 *   (github.com/danielgatis/rembg/releases/...), which was verified
 *   thoroughly (SHA256, ONNX structural validity, a real inference
 *   run) using curl/Python -- tools that don't enforce CORS at all,
 *   since it's a browser-only security mechanism. That verification
 *   never actually caught that GitHub's release-assets CDN sends no
 *   `Access-Control-Allow-Origin` header, so a real browser blocked
 *   the cross-origin fetch outright ("People" mode never worked in
 *   any real browser despite passing every non-browser check). Fixed
 *   by switching to the identical file (confirmed via the exact same
 *   SHA256 hash) re-hosted on Hugging Face
 *   (huggingface.co/tomjackson2023/rembg), whose CDN is already
 *   proven to support direct cross-origin browser fetches in
 *   production on this very site -- text-summarizer's much larger
 *   Qwen2.5 model is fetched the same way. This project's own sandbox
 *   has no network access to huggingface.co to re-verify the CORS
 *   header directly the way GitHub's failure was confirmed, so this
 *   fix still needs a real-browser smoke test after deploying, the
 *   same disclosure pattern already used elsewhere in this project.
 *   Slower (~2.5x the processing time of 'general', per rembg-web's
 *   own published benchmarks) and a much larger one-time download, so
 *   this is an explicit, user-chosen option in the UI, never the
 *   silent default.
 *
 * Explicit configuration choices, each deliberate:
 *
 * - executionProviders: ['wasm'] -- forces plain CPU/WASM execution,
 *   never WebGPU/WebNN/JSEP. This keeps the same-origin vendor bundle
 *   small (avoids needing the much larger .jsep WASM variant) and
 *   matches rembg-web's own documented guidance that none of its
 *   models are currently WebGPU-compatible in ONNX Runtime Web.
 * - numThreads: 1 -- disables WASM multi-threading entirely. Real
 *   multi-threading needs SharedArrayBuffer, which needs
 *   Cross-Origin-Opener-Policy/Cross-Origin-Embedder-Policy response
 *   headers on every page. Setting COEP: require-corp site-wide is a
 *   real risk to this site's AdSense integration (COEP restricts which
 *   cross-origin resources may load at all), so single-threaded
 *   execution was chosen deliberately over adding those headers --  a
 *   slower but safe tradeoff, not an oversight.
 * - wasmPaths set explicitly, as an object naming the exact vendored
 *   files, to the same-origin vendor path -- no CDN dependency,
 *   matching how ffmpeg.wasm is already served same-origin elsewhere
 *   on this site. Three real bugs were found here via live browser
 *   error reports and fixed one after another:
 *   (a) the path depth was wrong twice in a row before landing on
 *       (b) -- first assumed relative-to-the-page, then relative-to-
 *       this-module. Both wrong: traced the library's own source to
 *       confirm the dynamic import() that consumes this path executes
 *       *inside ort.min.mjs itself*.
 *   (b) passing wasmPaths as a bare string prefix let the library fall
 *       back to its own hardcoded default filename, the WebGPU/JSEP
 *       variant, which was never vendored here. Fixed with an explicit
 *       { mjs, wasm } object naming the exact two vendored files.
 *   (c) that object's filenames had no leading "./" -- e.g. just
 *       'ort-wasm-simd-threaded.mjs' -- which is a genuinely different
 *       bug from (a)/(b), not a leftover of them: per the ES module
 *       specification, any specifier that doesn't start with "/", "./",
 *       or "../" is a *bare* specifier (the same rule already hit once
 *       before with the plain 'onnxruntime-web' import, fixed via an
 *       import map), not a relative path, so it can never resolve
 *       without an import map entry -- and the previous "just the
 *       filename" fix, however correct about *directory depth*, was
 *       still syntactically a bare specifier the whole time.
 *   Fixed all three at once here with absolute, root-relative URLs
 *   ("/src/vendor/..."): unambiguous regardless of which module or
 *   directory depth is doing the resolving, so this class of "wrong
 *   relative to what" mistake can't recur a fourth time. The person
 *   model's URL is a full external https:// URL (passed to
 *   u2net_custom's modelPath), so it has no such ambiguity to begin
 *   with.
 */

const HUMAN_SEG_MODEL_URL = 'https://huggingface.co/tomjackson2023/rembg/resolve/main/u2net_human_seg.onnx';

let configured = false;

async function configureRuntime() {
    if (configured) return;
    const ort = await import('../../vendor/onnxruntime-web/ort.min.mjs');
    // Resolved relative to the *page* (tools/background-remover/), the
    // same convention every other same-origin asset reference uses
    // across this site -- not relative to this module file.
    ort.env.wasm.wasmPaths = {
        mjs: '/src/vendor/onnxruntime-web/ort-wasm-simd-threaded.mjs',
        wasm: '/src/vendor/onnxruntime-web/ort-wasm-simd-threaded.wasm',
    };
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = true;
    configured = true;
}

const sessionPromises = new Map(); // modelMode -> Promise<session>, so switching modes mid-visit doesn't discard the other one's already-loaded session

/**
 * Lazily creates (and caches, per model mode) the inference session, so
 * repeated removals in one visit -- even switching between 'general'
 * and 'person' -- don't reload a model that's already loaded.
 */
async function getSession(onProgress, modelMode = 'general') {
    await configureRuntime();
    if (!sessionPromises.has(modelMode)) {
        const { newSession } = await import('../../vendor/rembg-web/index.js');
        const sessionOptions = { executionProviders: ['wasm'], numThreads: 1, onProgress };
        const promise = modelMode === 'person'
            ? newSession('u2net_custom', { modelPath: HUMAN_SEG_MODEL_URL }, sessionOptions)
            : newSession('u2netp', undefined, sessionOptions);
        sessionPromises.set(modelMode, promise);
    }
    return sessionPromises.get(modelMode);
}

/**
 * Removes the background from an image, returning a transparent PNG blob.
 * @param {File|Blob} file
 * @param {(info: {step: string, progress: number, message: string}) => void} [onProgress]
 * @param {'general'|'person'} [modelMode] -- 'general' (default, fast, same-origin) or 'person' (slower, larger download, specialized for photos of people)
 */
async function removeBackground(file, onProgress, modelMode = 'general') {
    const { remove } = await import('../../vendor/rembg-web/index.js');
    const session = await getSession(onProgress, modelMode);
    return remove(file, { session, onProgress, postProcessMask: true });
}

export { removeBackground, getSession };

// END OF FILE
