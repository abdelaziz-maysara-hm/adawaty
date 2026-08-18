import { validatePhotoEditSpec, createDefaultSpec, generateLayerId } from './spec.js';

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

    // --- Layer management. Every method funnels through commit(), so
    // every layer operation is undoable through the exact same unified
    // history as every other kind of edit -- no separate undo system. ---

    function addLayer(region, adjustments = {}) {
        const layer = {
            id: generateLayerId(), region, visible: true, opacity: 1, ...adjustments,
        };
        commit((spec) => ({ ...spec, layers: [...spec.layers, layer] }));
        return layer.id;
    }

    function removeLayer(layerId) {
        commit((spec) => ({ ...spec, layers: spec.layers.filter((layer) => layer.id !== layerId) }));
    }

    function updateLayer(layerId, patch) {
        commit((spec) => ({
            ...spec,
            layers: spec.layers.map((layer) => (layer.id === layerId ? { ...layer, ...patch } : layer)),
        }));
    }

    function toggleLayerVisibility(layerId) {
        commit((spec) => ({
            ...spec,
            layers: spec.layers.map((layer) => (layer.id === layerId ? { ...layer, visible: !layer.visible } : layer)),
        }));
    }

    /** Moves a layer up or down in paint order (later in the array = painted later = on top). */
    function moveLayer(layerId, direction) {
        commit((spec) => {
            const index = spec.layers.findIndex((layer) => layer.id === layerId);
            if (index === -1) return spec;
            const targetIndex = direction === 'up' ? index + 1 : index - 1;
            if (targetIndex < 0 || targetIndex >= spec.layers.length) return spec;

            const layers = [...spec.layers];
            [layers[index], layers[targetIndex]] = [layers[targetIndex], layers[index]];
            return { ...spec, layers };
        });
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
        addLayer,
        removeLayer,
        updateLayer,
        toggleLayerVisibility,
        moveLayer,
    });
}

export { createEditorState, MAX_HISTORY };

// END OF FILE
