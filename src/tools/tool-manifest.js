/**
 * @file Tool manifest normalization and validation.
 * @module tools/tool-manifest
 */

const TOOL_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const LANGUAGE_PATTERN = /^[a-z]{2}(?:-[A-Z]{2})?$/;
const DEFAULT_LANGUAGE = 'ar';
const DEFAULT_STATUS = 'stable';
const VALID_STATUSES = new Set(['experimental', 'stable', 'deprecated']);

/**
 * Creates an immutable, normalized tool manifest.
 *
 * @param {Record<string, unknown>} input
 * @returns {Readonly<Record<string, unknown>>}
 */
function createToolManifest(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new TypeError('Tool manifest must be an object.');
    }

    const id = normalizeRequiredString(input.id, 'id');

    if (!TOOL_ID_PATTERN.test(id)) {
        throw new TypeError(
            `Tool id "${id}" must use lowercase kebab-case characters.`,
        );
    }

    const name = normalizeLocalizedText(input.name, 'name');
    const description = normalizeLocalizedText(
        input.description,
        'description',
    );
    const category = normalizeRequiredString(input.category, 'category');

    if (typeof input.loader !== 'function') {
        throw new TypeError(`Tool "${id}" must provide a loader function.`);
    }

    const status = normalizeOptionalString(input.status, DEFAULT_STATUS);

    if (!VALID_STATUSES.has(status)) {
        throw new TypeError(`Tool "${id}" has an unsupported status "${status}".`);
    }

    const manifest = {
        id,
        name,
        description,
        category,
        loader: input.loader,
        status,
        languages: normalizeLanguages(input.languages),
        tags: normalizeStringList(input.tags),
        keywords: normalizeStringList(input.keywords),
        featured: Boolean(input.featured),
        order: normalizeOrder(input.order),
        icon: normalizeOptionalString(input.icon, ''),
        route: normalizeOptionalString(input.route, `/tools/${id}/`),
        version: normalizeOptionalString(input.version, '1.0.0'),
    };

    return deepFreeze(manifest);
}

/**
 * Resolves localized text from a manifest field.
 *
 * @param {unknown} value
 * @param {string} locale
 * @param {string} [fallbackLocale='ar']
 * @returns {string}
 */
function resolveLocalizedText(value, locale, fallbackLocale = DEFAULT_LANGUAGE) {
    if (typeof value === 'string') {
        return value;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return '';
    }

    const normalizedLocale = String(locale || '').trim();
    const baseLocale = normalizedLocale.split('-')[0];

    return (
        value[normalizedLocale] ??
        value[baseLocale] ??
        value[fallbackLocale] ??
        Object.values(value).find((item) => typeof item === 'string') ??
        ''
    );
}

/**
 * @param {unknown} value
 * @param {string} field
 * @returns {string}
 */
function normalizeRequiredString(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new TypeError(`Tool manifest field "${field}" is required.`);
    }

    return value.trim();
}

/**
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
function normalizeOptionalString(value, fallback) {
    return typeof value === 'string' && value.trim() !== ''
        ? value.trim()
        : fallback;
}

/**
 * @param {unknown} value
 * @param {string} field
 * @returns {string|Readonly<Record<string, string>>}
 */
function normalizeLocalizedText(value, field) {
    if (typeof value === 'string') {
        return normalizeRequiredString(value, field);
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError(
            `Tool manifest field "${field}" must be a string or locale map.`,
        );
    }

    const entries = Object.entries(value)
        .filter(
            ([locale, text]) =>
                LANGUAGE_PATTERN.test(locale) &&
                typeof text === 'string' &&
                text.trim() !== '',
        )
        .map(([locale, text]) => [locale, text.trim()]);

    if (entries.length === 0) {
        throw new TypeError(
            `Tool manifest field "${field}" has no valid localized values.`,
        );
    }

    return Object.freeze(Object.fromEntries(entries));
}

/**
 * @param {unknown} value
 * @returns {ReadonlyArray<string>}
 */
function normalizeLanguages(value) {
    const languages = normalizeStringList(value ?? [DEFAULT_LANGUAGE]);

    for (const language of languages) {
        if (!LANGUAGE_PATTERN.test(language)) {
            throw new TypeError(`Invalid tool language "${language}".`);
        }
    }

    return languages.length > 0
        ? languages
        : Object.freeze([DEFAULT_LANGUAGE]);
}

/**
 * @param {unknown} value
 * @returns {ReadonlyArray<string>}
 */
function normalizeStringList(value) {
    if (!Array.isArray(value)) {
        return Object.freeze([]);
    }

    return Object.freeze([
        ...new Set(
            value
                .filter((item) => typeof item === 'string')
                .map((item) => item.trim())
                .filter(Boolean),
        ),
    ]);
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function normalizeOrder(value) {
    return Number.isFinite(value) && value >= 0
        ? Math.trunc(value)
        : Number.MAX_SAFE_INTEGER;
}

/**
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
        return value;
    }

    for (const nestedValue of Object.values(value)) {
        deepFreeze(nestedValue);
    }

    return Object.freeze(value);
}

export {
    createToolManifest,
    resolveLocalizedText,
};

// END OF FILE
