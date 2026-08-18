import { renderImage, decodeImage, inspectImage } from '../image-processing.js';
import { buildFilterString } from './spec.js';

/**
 * Turns a PhotoEditSpec into a single call to the existing, already-
 * shipped renderImage() from image-processing.js -- the same function
 * already powering image-cropper, image-rotate-flip, image-color-
 * adjuster, image-grayscale-converter, image-sepia-filter, image-color-
 * inverter, image-blur-tool, and image-watermark-tool. No new pixel-
 * manipulation logic is written here; this file only accumulates
 * parameters that module already understands into one call.
 */
async function renderEditedImage(file, spec, options = {}) {
    const filter = buildFilterString(spec);
    const watermark = spec.watermark
        ? {
            text: spec.watermark.text,
            position: spec.watermark.position,
            color: spec.watermark.color,
            opacity: spec.watermark.opacity,
            fontSize: spec.watermark.fontSize,
        }
        : undefined;

    return renderImage({
        file,
        type: options.type ?? file.type,
        quality: options.quality ?? 0.92,
        source: spec.crop ?? undefined,
        rotation: spec.rotation,
        flipX: spec.flipX,
        flipY: spec.flipY,
        filter,
        watermark,
    });
}

export { renderEditedImage, decodeImage, inspectImage };

// END OF FILE
