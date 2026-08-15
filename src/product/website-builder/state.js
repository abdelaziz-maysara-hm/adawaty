import { validateWebsiteSpec, generateSectionId } from './schema.js';

const MAX_HISTORY = 30;

/**
 * Manages the current WebsiteSpec plus a bounded undo/redo history. This
 * is intentionally separate from storage.js (persistence) and the DOM/UI
 * layer -- state.js only knows about specs and history, never about
 * localStorage or rendering.
 */
function createBuilderState(initialSpec) {
    const { spec } = validateWebsiteSpec(initialSpec);
    let current = spec;
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

    /** Pushes the current spec onto the undo stack, applies `updater(current) -> newSpec`, clears redo. */
    function commit(updater) {
        const nextRaw = updater(current);
        const { spec: next } = validateWebsiteSpec(nextRaw);

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

    function reset(nextSpec) {
        const { spec: normalized } = validateWebsiteSpec(nextSpec);
        current = normalized;
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

    // --- Convenience mutators, all funnel through commit() so every
    // change is undoable and re-validated. ---

    function updateSite(patch) {
        commit((spec) => ({ ...spec, site: { ...spec.site, ...patch } }));
    }

    function updateTheme(patch) {
        commit((spec) => ({ ...spec, theme: { ...spec.theme, ...patch } }));
    }

    function updateNavigation(patch) {
        commit((spec) => ({ ...spec, navigation: { ...spec.navigation, ...patch } }));
    }

    function updateFooter(patch) {
        commit((spec) => ({ ...spec, footer: { ...spec.footer, ...patch } }));
    }

    function addSection(type, content = {}, variant = 'default') {
        commit((spec) => ({
            ...spec,
            sections: [
                ...spec.sections,
                {
                    id: generateSectionId(type), type, variant, content, settings: {},
                },
            ],
        }));
    }

    function removeSection(sectionId) {
        commit((spec) => ({
            ...spec,
            sections: spec.sections.filter((section) => section.id !== sectionId),
        }));
    }

    function updateSection(sectionId, patch) {
        commit((spec) => ({
            ...spec,
            sections: spec.sections.map((section) => (
                section.id === sectionId ? { ...section, ...patch } : section
            )),
        }));
    }

    function updateSectionContent(sectionId, contentPatch) {
        commit((spec) => ({
            ...spec,
            sections: spec.sections.map((section) => (
                section.id === sectionId
                    ? { ...section, content: { ...section.content, ...contentPatch } }
                    : section
            )),
        }));
    }

    function moveSection(sectionId, direction) {
        commit((spec) => {
            const index = spec.sections.findIndex((section) => section.id === sectionId);
            if (index === -1) return spec;
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            if (targetIndex < 0 || targetIndex >= spec.sections.length) return spec;

            const sections = [...spec.sections];
            [sections[index], sections[targetIndex]] = [sections[targetIndex], sections[index]];
            return { ...spec, sections };
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
        updateSite,
        updateTheme,
        updateNavigation,
        updateFooter,
        addSection,
        removeSection,
        updateSection,
        updateSectionContent,
        moveSection,
    });
}

export { createBuilderState, MAX_HISTORY };

// END OF FILE
