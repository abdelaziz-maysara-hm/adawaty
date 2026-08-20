import { hasAnyTransparency, compositeOntoBackground } from '../background-compositing.js';
import { removeBackground } from '../background-remover/engine.js';

/**
 * The combined "remove + replace in one step" tool: given ANY image
 * (transparent or not), produces a version with the requested new
 * background. Built after a real conversation about scope -- the site
 * already had 3 standalone Add Background tools (which require an
 * already-transparent input, e.g. from background-remover) and a
 * separate background-remover tool; a user explicitly asked for a single
 * tool that does both steps automatically rather than two manual ones.
 *
 * No new pixel-manipulation logic here: this is purely an orchestration
 * layer over the two already-shipped, already-verified engines
 * (background-remover's AI removal, and the shared compositing logic
 * used by the standalone Add Background tools).
 */

/**
 * @param {File} file - the source image, transparent or not
 * @param {(context: CanvasRenderingContext2D, width: number, height: number) => void} drawBackground
 * @param {(info: {step: string, progress: number}) => void} [onProgress]
 * @returns {Promise<{blob: Blob, width: number, height: number, backgroundRemovalRan: boolean}>}
 */
async function replaceBackground(file, drawBackground, onProgress) {
    const alreadyTransparent = await hasAnyTransparency(file);

    let foregroundFile = file;
    if (!alreadyTransparent) {
        const removedBlob = await removeBackground(file, onProgress);
        // removeBackground() returns a Blob; compositeOntoBackground()
        // (via decodeImage()) accepts any Blob/File via
        // URL.createObjectURL, so passing the Blob straight through
        // works without an extra File wrapper.
        foregroundFile = removedBlob;
    }

    const { blob, width, height } = await compositeOntoBackground(foregroundFile, drawBackground, 'image/jpeg', 0.92);
    return {
        blob, width, height, backgroundRemovalRan: !alreadyTransparent,
    };
}

export { replaceBackground };

// END OF FILE
