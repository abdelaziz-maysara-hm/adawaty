/**
 * Pure coordinate-transformation helpers for the crop overlay. Kept
 * separate from the DOM drag-event wiring so the actual math (the part
 * most likely to have an off-by-one or scale-factor bug) can be tested
 * directly with plain numbers, independent of real mouse/touch events
 * this environment can't simulate.
 *
 * The crop rectangle is always tracked and stored in *natural image
 * pixel* coordinates (matching what PhotoEditSpec.crop and
 * renderImage()'s `source` parameter expect) -- only the on-screen
 * *displayed* box (which may be scaled down to fit the viewport) needs
 * conversion at the boundary, in both directions.
 */

/** Natural-image pixels -> on-screen displayed pixels, given the display scale factor (displayedWidth / naturalWidth). */
function naturalToDisplayed(box, scale) {
    return Object.freeze({
        x: box.x * scale,
        y: box.y * scale,
        width: box.width * scale,
        height: box.height * scale,
    });
}

/** On-screen displayed pixels -> natural-image pixels, given the same scale factor. */
function displayedToNatural(box, scale) {
    return Object.freeze({
        x: box.x / scale,
        y: box.y / scale,
        width: box.width / scale,
        height: box.height / scale,
    });
}

/** Clamps a natural-coordinate box so it never extends past the image's own bounds, preserving width/height where possible. */
function clampBoxToImage(box, naturalWidth, naturalHeight) {
    const width = Math.min(box.width, naturalWidth);
    const height = Math.min(box.height, naturalHeight);
    const x = Math.min(Math.max(0, box.x), naturalWidth - width);
    const y = Math.min(Math.max(0, box.y), naturalHeight - height);
    return Object.freeze({ x, y, width, height });
}

/**
 * Resizes a box from one of its 8 handles (n/s/e/w/ne/nw/se/sw), given
 * how far the pointer moved (deltaX/deltaY, already in the same
 * coordinate space as the box), clamped to a minimum usable size and to
 * the image's own bounds.
 *
 * Boundary clamping is handle-aware rather than delegated to a generic
 * "fit this box in the image" clamp: for an edge/corner that expands
 * outward (e.g. dragging the SE corner), the *anchor* corner (here, the
 * fixed NW corner) must never move -- only the width/height may shrink
 * to stay in bounds. A generic clamp that just repositions x/y to make
 * an oversized box fit (correct for *moving* a box, see moveBox) would
 * incorrectly shift the anchored corner here instead of capping the
 * size -- caught via a real test case (SE-handle resize hitting the
 * right image edge moved the box's left edge, which is wrong) before
 * this ever reached the interactive UI.
 */
function resizeBoxFromHandle(box, handle, deltaX, deltaY, naturalWidth, naturalHeight, minSize = 20) {
    let { x, y, width, height } = box;

    if (handle.includes('e')) width = box.width + deltaX;
    if (handle.includes('s')) height = box.height + deltaY;
    if (handle.includes('w')) {
        x = box.x + deltaX;
        width = box.width - deltaX;
    }
    if (handle.includes('n')) {
        y = box.y + deltaY;
        height = box.height - deltaY;
    }

    // Clamp the *moving* edge(s) first: 'w'/'n' can push x/y below 0, so
    // pull them back to 0 and shrink width/height to compensate (the
    // opposite, fixed edge must stay put).
    if (x < 0) { width += x; x = 0; }
    if (y < 0) { height += y; y = 0; }

    // Clamp the *anchored* edge(s): for a handle that expands rightward/
    // downward, the fixed x/y must never move -- only cap how far
    // width/height can extend before hitting the image's far edge.
    width = Math.min(width, naturalWidth - x);
    height = Math.min(height, naturalHeight - y);

    // Finally enforce the minimum usable size, without ever moving the
    // anchor corner implied by the handle being dragged.
    if (width < minSize) {
        if (handle.includes('w')) x -= (minSize - width);
        width = minSize;
    }
    if (height < minSize) {
        if (handle.includes('n')) y -= (minSize - height);
        height = minSize;
    }

    return Object.freeze({
        x: Math.max(0, x), y: Math.max(0, y), width, height,
    });
}

/** Moves (not resizes) a box by a delta, clamped so it can't be dragged outside the image. */
function moveBox(box, deltaX, deltaY, naturalWidth, naturalHeight) {
    return clampBoxToImage({ x: box.x + deltaX, y: box.y + deltaY, width: box.width, height: box.height }, naturalWidth, naturalHeight);
}

export {
    naturalToDisplayed, displayedToNatural, clampBoxToImage, resizeBoxFromHandle, moveBox,
};

// END OF FILE
