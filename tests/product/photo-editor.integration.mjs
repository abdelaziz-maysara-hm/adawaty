import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getToolDefinition, listToolDefinitions } from '../../src/product/tool-definitions.js';
import {
    validatePhotoEditSpec, createDefaultSpec, buildFilterString, normalizeCrop,
} from '../../src/product/photo-editor/spec.js';
import { createEditorState, MAX_HISTORY } from '../../src/product/photo-editor/state.js';
import {
    naturalToDisplayed, displayedToNatural, clampBoxToImage, resizeBoxFromHandle, moveBox,
} from '../../src/product/photo-editor/crop-math.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

// ---------------------------------------------------------------------------
// Spec validation
// ---------------------------------------------------------------------------

{
    const filter = buildFilterString(createDefaultSpec());
    assert.equal(filter, 'none', 'an untouched spec must produce the CSS filter value "none"');
}

{
    const spec = validatePhotoEditSpec({ brightness: 120, contrast: 110, grayscale: 50, blur: 3 }, 1000, 800);
    assert.equal(buildFilterString(spec), 'brightness(120%) contrast(110%) grayscale(50%) blur(3px)');
}

{
    // Malformed/malicious input must never throw and must never leak through unsafely.
    const spec = validatePhotoEditSpec({
        rotation: 999,
        brightness: 'not-a-number',
        watermark: { text: '<script>alert(1)</script>', color: 'javascript:alert(1)' },
    }, 1000, 800);
    assert.equal(spec.rotation, 0, 'an invalid rotation must default to 0');
    assert.equal(spec.brightness, 100, 'a non-numeric brightness must default to 100 (neutral)');
    assert.equal(spec.watermark.color, '#ffffff', 'a non-hex-color watermark color must be rejected and defaulted');
    // The watermark TEXT itself is deliberately not HTML-escaped here:
    // it is only ever passed to Canvas fillText() (see engine.js), which
    // draws literal characters and has no HTML/script interpretation at
    // all, unlike the Website Builder's HTML-string rendering pipeline.
    assert.equal(spec.watermark.text, '<script>alert(1)</script>');
}

{
    const empty = validatePhotoEditSpec({ watermark: { text: '   ' } }, 1000, 800);
    assert.equal(empty.watermark, null, 'a watermark with only whitespace text must be dropped entirely');
}

{
    // Crop clamping against real image bounds.
    const crop = normalizeCrop({ x: 900, y: 700, width: 500, height: 500 }, 1000, 800);
    assert.ok(crop.x + crop.width <= 1000 && crop.y + crop.height <= 800, 'a crop box must never extend past the image bounds');
}

{
    // A crop that covers the whole image is not a "real" crop.
    const fullImageCrop = normalizeCrop({
        x: 0, y: 0, width: 1000, height: 800,
    }, 1000, 800);
    assert.equal(fullImageCrop, null);
}

// ---------------------------------------------------------------------------
// Editor state (undo/redo)
// ---------------------------------------------------------------------------

{
    const state = createEditorState(1000, 800);
    assert.equal(state.getSpec().rotation, 0);

    state.update({ brightness: 130 });
    assert.equal(state.getSpec().brightness, 130);
    assert.equal(state.undo(), true);
    assert.equal(state.getSpec().brightness, 100);
    assert.equal(state.redo(), true);
    assert.equal(state.getSpec().brightness, 130);

    // A crop followed by a rotation must clear the crop: its coordinates
    // (in the pre-rotation frame) would be geometrically invalid once
    // the image's own width/height swap.
    state.setCrop({
        x: 100, y: 100, width: 400, height: 300,
    });
    assert.notEqual(state.getSpec().crop, null);
    state.rotateClockwise();
    assert.equal(state.getSpec().crop, null, 'rotating must clear any pending crop');
    assert.equal(state.getSpec().rotation, 90);

    state.toggleFlipX();
    assert.equal(state.getSpec().flipX, true);
    state.toggleFlipX();
    assert.equal(state.getSpec().flipX, false);

    state.setWatermark({ text: 'Test', position: 'center' });
    assert.equal(state.getSpec().watermark.text, 'Test');

    state.reset();
    assert.equal(state.canUndo(), false);
    assert.equal(state.canRedo(), false);
    assert.equal(state.getSpec().watermark, null);
}

{
    // Bounded history.
    const state = createEditorState(1000, 800);
    for (let i = 0; i < MAX_HISTORY + 10; i += 1) state.update({ brightness: 100 + i });
    let undoCount = 0;
    while (state.undo()) undoCount += 1;
    assert.ok(undoCount <= MAX_HISTORY, `undo history must be bounded to ${MAX_HISTORY} steps, got ${undoCount}`);
}

{
    // Crop bounds are validated against the specific image's own dimensions passed at creation.
    const state = createEditorState(500, 400);
    state.setCrop({
        x: 480, y: 380, width: 200, height: 200,
    });
    const crop = state.getSpec().crop;
    assert.ok(crop.x + crop.width <= 500 && crop.y + crop.height <= 400);
}

// ---------------------------------------------------------------------------
// Crop overlay coordinate math
// ---------------------------------------------------------------------------

{
    const natural = {
        x: 100, y: 200, width: 400, height: 300,
    };
    const scale = 0.5;
    const displayed = naturalToDisplayed(natural, scale);
    const roundTrip = displayedToNatural(displayed, scale);
    assert.deepEqual(roundTrip, natural, 'natural -> displayed -> natural must be lossless for clean numbers');
}

{
    const box = {
        x: 100, y: 100, width: 200, height: 150,
    };
    const resizedSE = resizeBoxFromHandle(box, 'se', 50, 30, 1000, 800);
    assert.deepEqual(resizedSE, {
        x: 100, y: 100, width: 250, height: 180,
    }, 'an SE-handle resize must only change width/height, not the anchored top-left corner');

    const resizedNW = resizeBoxFromHandle(box, 'nw', 20, 10, 1000, 800);
    assert.deepEqual(resizedNW, {
        x: 120, y: 110, width: 180, height: 140,
    }, 'an NW-handle resize must move both position and size together');
}

{
    // The exact regression case: an SE-handle resize hitting the image's
    // right/bottom edge must cap width/height, not shift the anchored
    // top-left corner -- caught via this exact scenario during
    // development before it ever reached the interactive UI.
    const nearEdge = {
        x: 900, y: 700, width: 50, height: 50,
    };
    const grown = resizeBoxFromHandle(nearEdge, 'se', 200, 200, 1000, 800);
    assert.equal(grown.x, 900, 'the anchored (top-left) corner must never move for an SE resize');
    assert.equal(grown.y, 700);
    assert.equal(grown.x + grown.width, 1000, 'width must be capped exactly at the image edge');
    assert.equal(grown.y + grown.height, 800);
}

{
    // The symmetric case for the opposite corner: an NW-handle resize
    // dragged past the image's own origin must cap at (0,0) without
    // moving the (bottom-right) anchor.
    const nearOrigin = {
        x: 50, y: 50, width: 100, height: 100,
    };
    const shrunk = resizeBoxFromHandle(nearOrigin, 'nw', -200, -200, 1000, 800);
    assert.equal(shrunk.x, 0);
    assert.equal(shrunk.y, 0);
    assert.equal(shrunk.x + shrunk.width, 150, 'the anchored (bottom-right) corner must never move for an NW resize');
    assert.equal(shrunk.y + shrunk.height, 150);
}

{
    const resized = resizeBoxFromHandle({
        x: 100, y: 100, width: 200, height: 150,
    }, 'e', -190, 0, 1000, 800, 20);
    assert.equal(resized.width, 20, 'a resize must never shrink a box below the minimum usable size');
}

{
    const moved = moveBox({
        x: 50, y: 50, width: 200, height: 150,
    }, 900, 700, 1000, 800);
    assert.ok(moved.x + moved.width <= 1000 && moved.y + moved.height <= 800, 'moving a box must clamp it within the image bounds');

    const movedNegative = moveBox({
        x: 50, y: 50, width: 200, height: 150,
    }, -200, -200, 1000, 800);
    assert.equal(movedNegative.x, 0);
    assert.equal(movedNegative.y, 0);
}

{
    const clamped = clampBoxToImage({
        x: 900, y: 700, width: 500, height: 500,
    }, 1000, 800);
    assert.ok(clamped.x + clamped.width <= 1000 && clamped.y + clamped.height <= 800);
}

// ---------------------------------------------------------------------------
// Product integration
// ---------------------------------------------------------------------------

{
    const tool = getToolDefinition('photo-editor');
    assert.ok(tool, 'photo-editor must be registered in tool-definitions.js');
    assert.equal(tool.interactive, true);
    assert.equal(tool.category, 'image');
    assert.ok(tool.title.ar && tool.title.en);
    assert.ok(tool.description.ar && tool.description.en);
    assert.ok(listToolDefinitions().some((candidate) => candidate.id === 'photo-editor'));
}

{
    const pagePath = path.join(projectRoot, 'tools/photo-editor/index.html');
    const html = await readFile(pagePath, 'utf8');
    assert.ok(html.includes('data-tool-page="photo-editor"'));
    assert.ok(html.includes('id="editor-preview-image"'));
    assert.ok(html.includes('id="editor-crop-box"'));
}

console.log('Photo Editor: spec validation, undo/redo state, crop coordinate math, and product-integration checks passed.');

// END OF FILE
