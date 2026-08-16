import { validateWebsiteSpec, createDefaultSpec, SCHEMA_VERSION } from './schema.js';

const STORAGE_KEY = 'adawaty-website-builder-project';

/**
 * Loads the saved project from localStorage. Never throws: a missing key,
 * invalid JSON, a spec from an incompatible future schema version, or any
 * other corruption all fail safely into a fresh default spec, since a
 * broken save must never leave the builder unusable.
 */
function loadProject() {
    let raw;
    try {
        raw = localStorage.getItem(STORAGE_KEY);
    } catch {
        return { spec: createDefaultSpec('business'), restored: false, reason: 'storage-unavailable' };
    }

    if (!raw) {
        return { spec: createDefaultSpec('business'), restored: false, reason: 'empty' };
    }

    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return { spec: createDefaultSpec('business'), restored: false, reason: 'invalid-json' };
    }

    if (!parsed || typeof parsed !== 'object' || parsed.version > SCHEMA_VERSION) {
        return { spec: createDefaultSpec('business'), restored: false, reason: 'incompatible-version' };
    }

    const { spec, valid } = validateWebsiteSpec(parsed);
    return { spec, restored: true, reason: valid ? 'ok' : 'partially-corrected' };
}

/** Saves the current spec. Never throws (e.g. storage quota exceeded, private browsing). */
function saveProject(spec) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(spec));
        return true;
    } catch {
        return false;
    }
}

function clearProject() {
    try {
        localStorage.removeItem(STORAGE_KEY);
        return true;
    } catch {
        return false;
    }
}

export {
    loadProject, saveProject, clearProject, STORAGE_KEY,
};

// END OF FILE
