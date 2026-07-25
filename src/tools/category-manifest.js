/**
 * @file Category manifest normalization and validation.
 * @module tools/category-manifest
 */

const CATEGORY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGUAGE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/;

function createCategoryManifest(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new TypeError('Category manifest must be an object.');
    }

    const id = normalizeRequiredString(input.id, 'id');

    if (!CATEGORY_ID_PATTERN.test(id)) {
        throw new TypeError(
            `Category id "${id}" must use lowercase kebab-case characters.`,
        );
    }

    return deepFreeze({
        id,
        name: normalizeLocalizedText(input.name, 'name'),
        description: normalizeLocalizedText(input.description, 'description'),
        icon: normalizeOptionalString(input.icon, ''),
        route: normalizeOptionalString(input.route, `/categories/${id}/`),
        order: normalizeOrder(input.order),
        featured: Boolean(input.featured),
        hidden: Boolean(input.hidden),
    });
}

function normalizeRequiredString(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new TypeError(`Category field "${field}" is required.`);
    }
    return value.trim();
}

function normalizeOptionalString(value, fallback) {
    return typeof value === 'string' && value.trim() !== '' ? value.trim() : fallback;
}

function normalizeLocalizedText(value, field) {
    if (typeof value === 'string') return normalizeRequiredString(value, field);
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError(`Category field "${field}" must be a string or locale map.`);
    }
    const entries = Object.entries(value)
        .filter(([locale, text]) => LANGUAGE_PATTERN.test(locale) && typeof text === 'string' && text.trim() !== '')
        .map(([locale, text]) => [locale, text.trim()]);
    if (entries.length === 0) {
        throw new TypeError(`Category field "${field}" has no valid localized values.`);
    }
    return Object.freeze(Object.fromEntries(entries));
}

function normalizeOrder(value) {
    return Number.isFinite(value) && value >= 0 ? Math.trunc(value) : Number.MAX_SAFE_INTEGER;
}

function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    for (const nestedValue of Object.values(value)) deepFreeze(nestedValue);
    return Object.freeze(value);
}

export { createCategoryManifest };

// END OF FILE
