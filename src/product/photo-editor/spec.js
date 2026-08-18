/**
 * PhotoEditSpec: the single source of truth for the Photo Editor,
 * mirroring how WebsiteSpec drives the Website Builder. One flat object
 * describes every pending edit; the engine (engine.js) turns it into a
 * single renderImage() call from the existing, already-proven
 * src/product/image-processing.js -- no new image-processing logic is
 * written here, only accumulation and validation of parameters that
 * module already understands (crop as a source region, rotation, flip,
 * a combined CSS filter string, and a text watermark).
 */

const DEFAULT_SPEC = Object.freeze({
    crop: null, // null | { x, y, width, height } in natural image pixel coordinates
    rotation: 0, // 0 | 90 | 180 | 270
    flipX: false,
    flipY: false,
    brightness: 100, // CSS filter percentage, 100 = neutral
    contrast: 100,
    saturation: 100,
    grayscale: 0, // 0-100
    sepia: 0,
    invert: 0,
    blur: 0, // px
    watermark: null, // null | { text, position, color, opacity, fontSize }
});

const ROTATIONS = Object.freeze([0, 90, 180, 270]);
const WATERMARK_POSITIONS = Object.freeze(['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right']);

function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(max, Math.max(min, number));
}

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Validates and clamps a crop box against the known natural image dimensions; returns null if invalid or if it isn't a genuine crop (covers the whole image). */
function normalizeCrop(rawCrop, naturalWidth, naturalHeight) {
    if (!isPlainObject(rawCrop)) return null;
    const x = clampNumber(rawCrop.x, 0, naturalWidth, 0);
    const y = clampNumber(rawCrop.y, 0, naturalHeight, 0);
    const maxWidth = naturalWidth - x;
    const maxHeight = naturalHeight - y;
    const width = clampNumber(rawCrop.width, 1, Math.max(1, maxWidth), maxWidth);
    const height = clampNumber(rawCrop.height, 1, Math.max(1, maxHeight), maxHeight);

    const isFullImage = x === 0 && y === 0 && Math.round(width) === naturalWidth && Math.round(height) === naturalHeight;
    if (isFullImage) return null;

    return Object.freeze({
        x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height),
    });
}

function normalizeWatermark(rawWatermark) {
    if (!isPlainObject(rawWatermark) || !String(rawWatermark.text ?? '').trim()) return null;
    return Object.freeze({
        text: String(rawWatermark.text).slice(0, 120),
        position: WATERMARK_POSITIONS.includes(rawWatermark.position) ? rawWatermark.position : 'bottom-right',
        color: /^#[0-9a-fA-F]{6}$/.test(rawWatermark.color) ? rawWatermark.color : '#ffffff',
        opacity: clampNumber(rawWatermark.opacity, 0.05, 1, 0.7),
        fontSize: clampNumber(rawWatermark.fontSize, 12, 400, 32),
    });
}

/**
 * Validates a raw spec against known image dimensions. Never throws:
 * malformed/out-of-range values are clamped or dropped rather than
 * rejected outright, since this also has to safely absorb a spec
 * restored from localStorage.
 */
function validatePhotoEditSpec(rawSpec, naturalWidth, naturalHeight) {
    const spec = isPlainObject(rawSpec) ? rawSpec : {};
    return Object.freeze({
        crop: normalizeCrop(spec.crop, naturalWidth, naturalHeight),
        rotation: ROTATIONS.includes(Number(spec.rotation)) ? Number(spec.rotation) : 0,
        flipX: spec.flipX === true,
        flipY: spec.flipY === true,
        brightness: clampNumber(spec.brightness, 0, 300, 100),
        contrast: clampNumber(spec.contrast, 0, 300, 100),
        saturation: clampNumber(spec.saturation, 0, 300, 100),
        grayscale: clampNumber(spec.grayscale, 0, 100, 0),
        sepia: clampNumber(spec.sepia, 0, 100, 0),
        invert: clampNumber(spec.invert, 0, 100, 0),
        blur: clampNumber(spec.blur, 0, 50, 0),
        watermark: normalizeWatermark(spec.watermark),
    });
}

function createDefaultSpec() {
    return Object.freeze({ ...DEFAULT_SPEC, crop: null, watermark: null });
}

/** Builds the combined CSS filter string renderImage() expects, in a fixed, sensible application order. */
function buildFilterString(spec) {
    const parts = [];
    if (spec.brightness !== 100) parts.push(`brightness(${spec.brightness}%)`);
    if (spec.contrast !== 100) parts.push(`contrast(${spec.contrast}%)`);
    if (spec.saturation !== 100) parts.push(`saturate(${spec.saturation}%)`);
    if (spec.grayscale > 0) parts.push(`grayscale(${spec.grayscale}%)`);
    if (spec.sepia > 0) parts.push(`sepia(${spec.sepia}%)`);
    if (spec.invert > 0) parts.push(`invert(${spec.invert}%)`);
    if (spec.blur > 0) parts.push(`blur(${spec.blur}px)`);
    return parts.length > 0 ? parts.join(' ') : 'none';
}

export {
    DEFAULT_SPEC,
    ROTATIONS,
    WATERMARK_POSITIONS,
    validatePhotoEditSpec,
    createDefaultSpec,
    buildFilterString,
    normalizeCrop,
};

// END OF FILE
