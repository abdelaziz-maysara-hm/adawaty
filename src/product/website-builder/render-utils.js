/**
 * Shared escaping helpers for the Website Builder's renderer. Every
 * component MUST run user-supplied text through escapeHtml/escapeAttr
 * before interpolating it into a template string -- there is no other
 * sanitization layer between a user's content field and the generated
 * website's HTML.
 */

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

/** Same escaping as escapeHtml -- HTML attribute values need the same 5 characters escaped. */
function escapeAttr(value) {
    return escapeHtml(value);
}

const UNSAFE_URL_SCHEME = /^\s*(javascript|data|vbscript):/i;

/** Only allow http(s), mailto, tel, and same-page anchors; anything else (or empty) becomes "#". */
function safeUrl(value) {
    const text = String(value ?? '').trim();
    if (text.length === 0) return '#';
    if (UNSAFE_URL_SCHEME.test(text)) return '#';
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(text)) return escapeAttr(text);
    // A bare domain or relative path without a scheme is treated as a safe relative link.
    if (!/^[a-z][a-z0-9+.-]*:/i.test(text)) return escapeAttr(text);
    return '#';
}

/** Strips anything that isn't a hex digit or '#', for safe use inside inline CSS custom properties. */
function safeHexColor(value, fallback = '#000000') {
    const text = String(value ?? '').trim();
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(text) ? text : fallback;
}

export {
    escapeHtml, escapeAttr, safeUrl, safeHexColor,
};

// END OF FILE
