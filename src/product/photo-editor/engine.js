import { renderImage, decodeImage, inspectImage } from '../image-processing.js';
import { buildFilterString } from './spec.js';

/**
 * Turns a PhotoEditSpec into image output, reusing the existing,
 * already-shipped renderImage() from image-processing.js -- the same
 * function already powering image-cropper, image-rotate-flip, image-
 * color-adjuster, image-grayscale-converter, image-sepia-filter, image-
 * color-inverter, image-blur-tool, and image-watermark-tool. No new
 * pixel-manipulation logic is written here for the base render; layer
 * compositing (below) only adds the same drawImage()-region technique
 * verified directly with node-canvas before writing any UI for it.
 *
 * Layers apply in the SAME coordinate space as the global crop/rotate/
 * flip -- i.e. layers operate on what's currently displayed (post-crop),
 * not the raw original image -- which matches what a user actually sees
 * while selecting a region. This is why both the base render and every
 * layer's render below share the exact same crop/rotation/flipX/flipY
 * parameters (only the `filter` differs): their output canvases end up
 * pixel-aligned, so compositing a specific region between them is
 * geometrically valid.
 */
async function renderEditedImage(file, spec, options = {}) {
    if (spec.layers.length === 0) {
        return renderSingleLayer(file, spec, spec, options);
    }
    return renderWithLayers(file, spec, options);
}

function buildWatermarkParam(spec) {
    return spec.watermark
        ? {
            text: spec.watermark.text,
            position: spec.watermark.position,
            color: spec.watermark.color,
            opacity: spec.watermark.opacity,
            fontSize: spec.watermark.fontSize,
        }
        : undefined;
}

/** Renders one flat pass (base OR a single layer's full-frame render) via the existing renderImage(), sharing crop/rotation/flip with `frame`. */
async function renderSingleLayer(file, frame, filterSource, options = {}) {
    return renderImage({
        file,
        type: options.type ?? file.type,
        quality: options.quality ?? 0.92,
        source: frame.crop ?? undefined,
        rotation: frame.rotation,
        flipX: frame.flipX,
        flipY: frame.flipY,
        filter: buildFilterString(filterSource),
        watermark: options.includeWatermark === false ? undefined : buildWatermarkParam(frame),
    });
}

/**
 * Composites the base render with every visible layer's own filtered
 * render, restricted to that layer's region, then draws the watermark
 * last so it always sits on top of everything.
 */
async function renderWithLayers(file, spec, options = {}) {
    const baseResult = await renderSingleLayer(file, spec, spec, { ...options, includeWatermark: false });
    const baseImage = await decodeBlob(baseResult.blob);

    const canvas = document.createElement('canvas');
    canvas.width = baseResult.width;
    canvas.height = baseResult.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable in this browser.');
    context.drawImage(baseImage, 0, 0);

    for (const layer of spec.layers) {
        if (!layer.visible) continue;
        // eslint-disable-next-line no-await-in-loop -- layers must composite in order, not in parallel
        const layerResult = await renderSingleLayer(file, spec, layer, { ...options, includeWatermark: false });
        // eslint-disable-next-line no-await-in-loop
        const layerImage = await decodeBlob(layerResult.blob);
        context.save();
        context.globalAlpha = layer.opacity;
        context.drawImage(
            layerImage,
            layer.region.x, layer.region.y, layer.region.width, layer.region.height,
            layer.region.x, layer.region.y, layer.region.width, layer.region.height,
        );
        context.restore();
    }

    if (spec.watermark) {
        drawWatermarkOnCanvas(context, canvas.width, canvas.height, spec.watermark);
    }

    const type = options.type ?? file.type;
    const quality = options.quality ?? 0.92;
    const blob = await canvasToBlobLocal(canvas, type, quality);
    return { blob, width: canvas.width, height: canvas.height };
}

function decodeBlob(blob) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(blob);
        const image = new Image();
        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Unable to decode an intermediate layer render.'));
        };
        image.src = url;
    });
}

function canvasToBlobLocal(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(
            (blob) => (blob ? resolve(blob) : reject(new Error('Unable to create the processed image.'))),
            type,
            quality,
        );
    });
}

/**
 * The exact same watermark-drawing logic as image-processing.js's
 * renderImage(), duplicated here (rather than exported and reused)
 * because the layered-composite path needs to draw the watermark onto
 * an already-composited canvas as a final pass, not as part of a single
 * renderImage() call. Kept deliberately identical position math to the
 * original so a watermark looks the same whether or not layers are in
 * use.
 */
function drawWatermarkOnCanvas(context, canvasWidth, canvasHeight, watermark) {
    const fontSize = Math.max(12, Number(watermark.fontSize) || 32);
    const padding = Math.max(12, Math.round(fontSize * 0.6));
    context.save();
    context.globalAlpha = Math.min(1, Math.max(0.05, Number(watermark.opacity) || 0.7));
    context.fillStyle = watermark.color || '#ffffff';
    context.font = `700 ${fontSize}px system-ui, sans-serif`;
    context.textBaseline = 'bottom';
    const textWidth = context.measureText(watermark.text).width;
    const positions = {
        'top-left': [padding, padding + fontSize],
        'top-right': [canvasWidth - padding - textWidth, padding + fontSize],
        center: [(canvasWidth - textWidth) / 2, (canvasHeight + fontSize) / 2],
        'bottom-left': [padding, canvasHeight - padding],
        'bottom-right': [canvasWidth - padding - textWidth, canvasHeight - padding],
    };
    const [x, y] = positions[watermark.position] ?? positions['bottom-right'];
    context.fillText(watermark.text, Math.max(padding, x), y);
    context.restore();
}

export { renderEditedImage, decodeImage, inspectImage };

// END OF FILE
