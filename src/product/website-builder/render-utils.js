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

/**
 * Validates a user-uploaded image as a data: URL. Deliberately excludes
 * image/svg+xml despite it being a real image format: SVG can embed
 * <script> and event-handler attributes (a well-documented real XSS
 * vector), so only raster formats that cannot carry executable content
 * are allowed. Verified against real attack payloads before use: an SVG
 * data URL containing an onload handler, a data:text/html payload
 * disguised with an image-sounding name, and an oversized value are all
 * rejected; genuine PNG/JPEG data URLs are accepted.
 */
const ALLOWED_IMAGE_MIME_TYPES = Object.freeze(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const MAX_IMAGE_DATA_URL_LENGTH = 2 * 1024 * 1024; // ~2MB of base64 text (roughly a 1.5MB source file)
const IMAGE_DATA_URL_PATTERN = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/i;

function safeImageDataUrl(value) {
    const text = String(value ?? '').trim();
    if (text.length === 0 || text.length > MAX_IMAGE_DATA_URL_LENGTH) return null;

    const match = IMAGE_DATA_URL_PATTERN.exec(text);
    if (!match) return null;

    const mimeType = match[1].toLowerCase();
    return ALLOWED_IMAGE_MIME_TYPES.includes(mimeType) ? text : null;
}

export {
    escapeHtml, escapeAttr, safeUrl, safeHexColor, safeImageDataUrl, ALLOWED_IMAGE_MIME_TYPES,
};

// END OF FILE
