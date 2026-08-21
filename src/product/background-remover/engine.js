/**
 * Client-side, in-browser background removal via rembg-web (MIT) +
 * onnxruntime-web, running the u2netp.onnx model (Apache-2.0, see
 * /models/README.md for the full license/verification trail).
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
 *   on this site. Two real bugs were found here via a live browser
 *   error report and fixed together:
 *   (a) the path depth was wrong twice in a row before landing on the
 *       right answer -- first assumed relative-to-the-page ('../../
 *       src/vendor/...', which produced a doubled '/src/src/vendor/
 *       ...' 404), then assumed relative-to-this-module
 *       (background-remover/engine.js). Both were wrong: traced the
 *       library's own minified source directly (not guessed) and
 *       confirmed the actual dynamic import() that consumes this path
 *       executes *inside ort.min.mjs itself*
 *       (src/vendor/onnxruntime-web/ort.min.mjs) via ES modules'
 *       standard "resolve relative to the executing module" rule --
 *       not relative to the page, and not relative to whichever file
 *       happened to import ort.min.mjs. Since every vendored file
 *       (ort.min.mjs, ort-wasm-simd-threaded.mjs/.wasm) sits in the
 *       same directory, the correct value is just the bare filename,
 *       no "../" at all.
 *   (b) passing wasmPaths as a bare string prefix let the library fall
 *       back to its own hardcoded default filename, "ort-wasm-simd-
 *       threaded.jsep.mjs" (the WebGPU/JSEP variant), which was never
 *       vendored here -- producing a 404 regardless of
 *       executionProviders being set to ['wasm']. Fixed by passing an
 *       explicit { mjs, wasm } object naming the exact two files that
 *       were actually vendored (the plain, non-jsep variant).
 */

let configured = false;

async function configureRuntime() {
    if (configured) return;
    const ort = await import('../../vendor/onnxruntime-web/ort.min.mjs');
    // Resolved relative to the *page* (tools/background-remover/), the
    // same convention every other same-origin asset reference uses
    // across this site -- not relative to this module file.
    ort.env.wasm.wasmPaths = {
        mjs: 'ort-wasm-simd-threaded.mjs',
        wasm: 'ort-wasm-simd-threaded.wasm',
    };
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = true;
    configured = true;
}

let sessionPromise = null;

/** Lazily creates (and caches) the u2netp inference session, so repeated removals in one visit don't reload the model. */
async function getSession(onProgress) {
    await configureRuntime();
    if (!sessionPromise) {
        const { newSession } = await import('../../vendor/rembg-web/index.js');
        sessionPromise = newSession('u2netp', undefined, {
            executionProviders: ['wasm'],
            numThreads: 1,
            onProgress,
        });
    }
    return sessionPromise;
}

/**
 * Removes the background from an image, returning a transparent PNG blob.
 * @param {File|Blob} file
 * @param {(info: {step: string, progress: number, message: string}) => void} [onProgress]
 */
async function removeBackground(file, onProgress) {
    const { remove } = await import('../../vendor/rembg-web/index.js');
    const session = await getSession(onProgress);
    return remove(file, { session, onProgress, postProcessMask: true });
}

export { removeBackground, getSession };

// END OF FILE
