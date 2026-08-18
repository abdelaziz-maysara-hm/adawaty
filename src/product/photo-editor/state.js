import { validatePhotoEditSpec, createDefaultSpec } from './spec.js';

const MAX_HISTORY = 30;

/**
 * Manages the current PhotoEditSpec plus a bounded undo/redo history --
 * the same proven pattern as the Website Builder's state.js. Needs the
 * image's natural width/height up front since crop validation is
 * bounds-dependent.
 */
function createEditorState(naturalWidth, naturalHeight, initialSpec) {
    let current = validatePhotoEditSpec(initialSpec ?? createDefaultSpec(), naturalWidth, naturalHeight);
    const undoStack = [];
    const redoStack = [];
    const listeners = new Set();

    function notify() {
        for (const listener of listeners) listener(current);
    }

    function subscribe(listener) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    }

    function commit(updater) {
        const nextRaw = updater(current);
        const next = validatePhotoEditSpec(nextRaw, naturalWidth, naturalHeight);

        undoStack.push(current);
        if (undoStack.length > MAX_HISTORY) undoStack.shift();
        redoStack.length = 0;
        current = next;
        notify();
    }

    function undo() {
        if (undoStack.length === 0) return false;
        redoStack.push(current);
        if (redoStack.length > MAX_HISTORY) redoStack.shift();
        current = undoStack.pop();
        notify();
        return true;
    }

    function redo() {
        if (redoStack.length === 0) return false;
        undoStack.push(current);
        if (undoStack.length > MAX_HISTORY) undoStack.shift();
        current = redoStack.pop();
        notify();
        return true;
    }

    function reset() {
        current = createDefaultSpec();
        undoStack.length = 0;
        redoStack.length = 0;
        notify();
    }

    function getSpec() {
        return current;
    }

    function canUndo() {
        return undoStack.length > 0;
    }

    function canRedo() {
        return redoStack.length > 0;
    }

    function update(patch) {
        commit((spec) => ({ ...spec, ...patch }));
    }

    function setCrop(crop) {
        commit((spec) => ({ ...spec, crop }));
    }

    function rotateClockwise() {
        commit((spec) => ({ ...spec, rotation: (spec.rotation + 90) % 360, crop: null }));
    }

    function toggleFlipX() {
        commit((spec) => ({ ...spec, flipX: !spec.flipX }));
    }

    function toggleFlipY() {
        commit((spec) => ({ ...spec, flipY: !spec.flipY }));
    }

    function setWatermark(watermark) {
        commit((spec) => ({ ...spec, watermark }));
    }

    return Object.freeze({
        getSpec,
        subscribe,
        commit,
        undo,
        redo,
        reset,
        canUndo,
        canRedo,
        update,
        setCrop,
        rotateClockwise,
        toggleFlipX,
        toggleFlipY,
        setWatermark,
    });
}

export { createEditorState, MAX_HISTORY };

// END OF FILE
