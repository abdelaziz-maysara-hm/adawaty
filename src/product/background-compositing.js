import { canvasToBlob, decodeImage } from './image-processing.js?v=rb2';

/**
 * Shared background-compositing logic used by both the standalone Add
 * Background tools (add-solid-background, add-gradient-background,
 * add-image-background) and replace-background (the combined "remove +
 * replace in one step" tool). Extracted here rather than duplicated so
 * both places share the exact same, already-verified implementation.
 */

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Validates a HEX color, falling back to a safe default rather than ever passing unvalidated input to canvas fillStyle. */
function safeHexColor(value, fallback) {
    return HEX_COLOR_PATTERN.test(String(value ?? '').trim()) ? String(value).trim() : fallback;
}

/**
 * Composites `foregroundImage` (expected to have transparency, e.g. the
 * output of background-remover) onto a background drawn first via
 * `drawBackground(context, width, height)` -- a small callback so every
 * background type (solid/gradient/image) shares this exact composite
 * logic, verified directly with node-canvas before any tool was written
 * on top of it: a transparent foreground correctly shows the background
 * underneath, and an opaque foreground pixel correctly stays opaque and
 * unchanged.
 */
async function compositeOntoBackground(foregroundFile, drawBackground, type, quality) {
    const foregroundImage = await decodeImage(foregroundFile);
    const canvas = document.createElement('canvas');
    canvas.width = foregroundImage.naturalWidth;
    canvas.height = foregroundImage.naturalHeight;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable in this browser.');

    drawBackground(context, canvas.width, canvas.height);
    context.drawImage(foregroundImage, 0, 0);

    const blob = await canvasToBlob(canvas, type, quality);
    return { blob, width: canvas.width, height: canvas.height };
}

/**
 * Detects whether an image has any genuinely transparent pixels at all --
 * added after real user feedback: uploading a normal, fully-opaque photo
 * (not the output of background-remover) makes the composite tools appear
 * to "do nothing", since the opaque foreground fully covers the new
 * background with nothing showing through. Not a processing bug -- the
 * composite was always working correctly -- but a real, easy-to-hit
 * confusion worth catching proactively.
 *
 * Samples a small downscaled copy (64x64) rather than every pixel of the
 * original: checking for the *presence* of any real transparency doesn't
 * need full resolution, and this keeps the check fast even for large
 * uploads. Verified with real image data via node-canvas: a fully-opaque
 * photo correctly detected as having none, a genuinely transparent region
 * correctly detected, and a modest transparent patch on a large image
 * still correctly detected after the downscale.
 */
async function hasAnyTransparency(file) {
    const image = await decodeImage(file);
    const sampleSize = 64;
    const canvas = document.createElement('canvas');
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    const context = canvas.getContext('2d');
    if (!context) return true; // fail open: don't block a tool if the check itself can't run

    context.drawImage(image, 0, 0, sampleSize, sampleSize);
    const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) return true; // found a pixel with real transparency
    }
    return false;
}

export {
    safeHexColor, compositeOntoBackground, hasAnyTransparency,
};

// END OF FILE
