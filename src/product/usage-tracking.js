// Lightweight client-side usage tracking, stored only in the visitor's own
// browser (localStorage). No data leaves the device, no external analytics
// service is involved. This powers the "Recently Used" homepage section and
// is intentionally NOT used to claim any cross-visitor "trending" or
// "popular" numbers, since a static site with no backend has no way to
// measure that honestly.

const STORAGE_KEY = 'adawaty-recent-tools';
const MAX_ENTRIES = 12;

function readEntries() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeEntries(entries) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
        // Storage unavailable (private browsing, quota, etc.) -- fail silently.
    }
}

/**
 * Record a visit to a tool page. Call this once per tool-page load.
 * @param {string} toolId
 */
function recordToolVisit(toolId) {
    if (!toolId) return;
    const entries = readEntries().filter((entry) => entry.id !== toolId);
    entries.unshift({ id: toolId, visitedAt: Date.now() });
    writeEntries(entries.slice(0, MAX_ENTRIES));
}

/**
 * @param {number} limit
 * @returns {{id: string, visitedAt: number}[]} most recent first
 */
function getRecentToolIds(limit = 6) {
    return readEntries().slice(0, limit);
}

/**
 * Generic reusable event hook for future analytics needs (search, favorites,
 * category navigation, etc.) -- currently a no-op beyond an optional console
 * trace in development, kept dependency-free on purpose. Wiring a real
 * analytics backend later only means implementing the body of this function;
 * every call site elsewhere in the codebase stays unchanged.
 * @param {string} eventName
 * @param {Record<string, unknown>} [detail]
 */
function trackEvent(eventName, detail = {}) {
    document.dispatchEvent(new CustomEvent(`adawaty:${eventName}`, { detail }));
}

export { recordToolVisit, getRecentToolIds, trackEvent };
