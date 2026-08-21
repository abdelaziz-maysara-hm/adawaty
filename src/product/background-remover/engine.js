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
 *   relative to what" mistake can't recur a fourth time.
 */

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
