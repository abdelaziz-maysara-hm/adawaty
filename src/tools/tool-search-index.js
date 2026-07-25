/**
 * @file Indexed bilingual search for the Adawaty tool catalogue.
 * @module tools/tool-search-index
 */

import {
    resolveLocalizedText,
} from './tool-manifest.js';

const DEFAULT_LOCALE = 'ar';
const DEFAULT_LIMIT = 50;

/**
 * Provides revision-aware indexed search over a ToolRegistry.
 */
class ToolSearchIndex {
    /**
     * @param {{
     *   toolRegistry: import('./tool-registry.js').ToolRegistry,
     *   fallbackLocale?: string
     * }} options
     */
    constructor(options) {
        if (!options?.toolRegistry) {
            throw new TypeError('ToolSearchIndex requires a toolRegistry.');
        }

        this.toolRegistry = options.toolRegistry;
        this.fallbackLocale = normalizeLocale(
            options.fallbackLocale ?? DEFAULT_LOCALE,
        );

        /** @type {number} */
        this.indexedRevision = -1;

        /** @type {ReadonlyArray<Readonly<Record<string, unknown>>>} */
        this.documents = Object.freeze([]);
    }

    /**
     * Rebuilds the index only when the registry revision changes.
     *
     * @returns {boolean}
     */
    ensureFresh() {
        const revision = this.toolRegistry.getRevision();

        if (revision === this.indexedRevision) {
            return false;
        }

        this.documents = Object.freeze(
            this.toolRegistry.getAll().map((tool) =>
                createSearchDocument(tool, this.fallbackLocale),
            ),
        );
        this.indexedRevision = revision;

        return true;
    }

    /**
     * Searches registered tools using weighted fields and structured filters.
     *
     * @param {string} query
     * @param {{
     *   locale?: string,
     *   category?: string,
     *   tags?: Iterable<string>,
     *   languages?: Iterable<string>,
     *   status?: string|Iterable<string>,
     *   featured?: boolean,
     *   includeDeprecated?: boolean,
     *   limit?: number
     * }} [options]
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    search(query = '', options = {}) {
        this.ensureFresh();

        const locale = normalizeLocale(options.locale ?? this.fallbackLocale);
        const normalizedQuery = normalizeSearchText(query);
        const tokens = tokenize(normalizedQuery);
        const filters = normalizeFilters(options);
        const limit = normalizeLimit(options.limit);

        const results = [];

        for (const document of this.documents) {
            if (!matchesFilters(document, filters)) {
                continue;
            }

            const score = scoreDocument(
                document,
                normalizedQuery,
                tokens,
                locale,
            );

            if (normalizedQuery && score <= 0) {
                continue;
            }

            results.push(
                Object.freeze({
                    tool: document.tool,
                    score,
                    matchedFields: Object.freeze(
                        getMatchedFields(
                            document,
                            normalizedQuery,
                            tokens,
                            locale,
                        ),
                    ),
                }),
            );
        }

        results.sort((left, right) => {
            if (left.score !== right.score) {
                return right.score - left.score;
            }

            if (left.tool.order !== right.tool.order) {
                return left.tool.order - right.tool.order;
            }

            return left.tool.id.localeCompare(right.tool.id);
        });

        return Object.freeze(results.slice(0, limit));
    }

    /**
     * Returns only the matched tool manifests.
     *
     * @param {string} query
     * @param {Record<string, unknown>} [options]
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    findTools(query = '', options = {}) {
        return Object.freeze(
            this.search(query, options).map((result) => result.tool),
        );
    }

    /**
     * Returns autocomplete suggestions from names, tags and keywords.
     *
     * @param {string} query
     * @param {{locale?: string, limit?: number}} [options]
     * @returns {ReadonlyArray<string>}
     */
    suggest(query = '', options = {}) {
        this.ensureFresh();

        const locale = normalizeLocale(options.locale ?? this.fallbackLocale);
        const normalizedQuery = normalizeSearchText(query);
        const limit = normalizeLimit(options.limit ?? 8);

        if (!normalizedQuery) {
            return Object.freeze([]);
        }

        const suggestions = new Map();

        for (const document of this.documents) {
            const candidates = [
                {
                    value: resolveLocalizedText(document.tool.name, locale),
                    priority: 3,
                },
                ...document.tool.tags.map((value) => ({
                    value,
                    priority: 2,
                })),
                ...document.tool.keywords.map((value) => ({
                    value,
                    priority: 1,
                })),
            ];

            for (const candidate of candidates) {
                const normalizedCandidate = normalizeSearchText(
                    candidate.value,
                );

                if (!normalizedCandidate.includes(normalizedQuery)) {
                    continue;
                }

                const matchScore =
                    normalizedCandidate === normalizedQuery
                        ? 100
                        : normalizedCandidate.startsWith(normalizedQuery)
                          ? 80
                          : 50;
                const score = matchScore + candidate.priority;
                const existing = suggestions.get(normalizedCandidate);

                if (!existing || score > existing.score) {
                    suggestions.set(
                        normalizedCandidate,
                        Object.freeze({
                            value: candidate.value,
                            score,
                        }),
                    );
                }
            }
        }

        return Object.freeze(
            [...suggestions.values()]
                .sort((left, right) => {
                    if (left.score !== right.score) {
                        return right.score - left.score;
                    }

                    return left.value.localeCompare(right.value, locale);
                })
                .slice(0, limit)
                .map((suggestion) => suggestion.value),
        );
    }

    /**
     * @returns {number}
     */
    getIndexedRevision() {
        return this.indexedRevision;
    }

    /**
     * @returns {number}
     */
    size() {
        this.ensureFresh();
        return this.documents.length;
    }

    /**
     * Releases the in-memory index.
     *
     * @returns {void}
     */
    clear() {
        this.documents = Object.freeze([]);
        this.indexedRevision = -1;
    }
}

/**
 * @param {Readonly<Record<string, unknown>>} tool
 * @param {string} fallbackLocale
 * @returns {Readonly<Record<string, unknown>>}
 */
function createSearchDocument(tool, fallbackLocale) {
    const localizedNames = collectLocalizedValues(tool.name);
    const localizedDescriptions = collectLocalizedValues(tool.description);

    return Object.freeze({
        tool,
        id: normalizeSearchText(tool.id),
        category: normalizeSearchText(tool.category),
        names: Object.freeze(localizedNames),
        descriptions: Object.freeze(localizedDescriptions),
        tags: Object.freeze(tool.tags.map(normalizeSearchText)),
        keywords: Object.freeze(tool.keywords.map(normalizeSearchText)),
        languages: Object.freeze(
            tool.languages.map((language) => normalizeLocale(language)),
        ),
        fallbackName: normalizeSearchText(
            resolveLocalizedText(tool.name, fallbackLocale),
        ),
        fallbackDescription: normalizeSearchText(
            resolveLocalizedText(tool.description, fallbackLocale),
        ),
    });
}

/**
 * @param {unknown} value
 * @returns {Record<string, string>}
 */
function collectLocalizedValues(value) {
    if (typeof value === 'string') {
        return {
            '*': normalizeSearchText(value),
        };
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(value).map(([locale, text]) => [
            normalizeLocale(locale),
            normalizeSearchText(text),
        ]),
    );
}

/**
 * @param {Readonly<Record<string, unknown>>} document
 * @param {string} query
 * @param {ReadonlyArray<string>} tokens
 * @param {string} locale
 * @returns {number}
 */
function scoreDocument(document, query, tokens, locale) {
    if (!query) {
        return document.tool.featured ? 10 : 1;
    }

    const localizedName =
        document.names[locale] ??
        document.names[locale.split('-')[0]] ??
        document.fallbackName;
    const localizedDescription =
        document.descriptions[locale] ??
        document.descriptions[locale.split('-')[0]] ??
        document.fallbackDescription;

    let score = 0;

    score += scoreField(document.id, query, tokens, 120, 80, 20);
    score += scoreField(localizedName, query, tokens, 100, 70, 18);
    score += scoreField(document.category, query, tokens, 55, 35, 10);
    score += scoreList(document.tags, query, tokens, 60, 40, 12);
    score += scoreList(document.keywords, query, tokens, 50, 30, 10);
    score += scoreField(localizedDescription, query, tokens, 30, 18, 5);

    if (score > 0 && document.tool.featured) {
        score += 3;
    }

    return score;
}

/**
 * @param {string} value
 * @param {string} query
 * @param {ReadonlyArray<string>} tokens
 * @param {number} exactWeight
 * @param {number} prefixWeight
 * @param {number} tokenWeight
 * @returns {number}
 */
function scoreField(
    value,
    query,
    tokens,
    exactWeight,
    prefixWeight,
    tokenWeight,
) {
    if (!value) {
        return 0;
    }

    if (value === query) {
        return exactWeight;
    }

    let score = value.startsWith(query) ? prefixWeight : 0;

    if (!score && value.includes(query)) {
        score += Math.max(1, Math.floor(prefixWeight / 2));
    }

    for (const token of tokens) {
        if (value === token) {
            score += tokenWeight * 2;
        } else if (value.startsWith(token)) {
            score += tokenWeight;
        } else if (value.includes(token)) {
            score += Math.max(1, Math.floor(tokenWeight / 2));
        }
    }

    return score;
}

/**
 * @param {ReadonlyArray<string>} values
 * @param {string} query
 * @param {ReadonlyArray<string>} tokens
 * @param {number} exactWeight
 * @param {number} prefixWeight
 * @param {number} tokenWeight
 * @returns {number}
 */
function scoreList(
    values,
    query,
    tokens,
    exactWeight,
    prefixWeight,
    tokenWeight,
) {
    return values.reduce(
        (highest, value) =>
            Math.max(
                highest,
                scoreField(
                    value,
                    query,
                    tokens,
                    exactWeight,
                    prefixWeight,
                    tokenWeight,
                ),
            ),
        0,
    );
}

/**
 * @param {Readonly<Record<string, unknown>>} document
 * @param {string} query
 * @param {ReadonlyArray<string>} tokens
 * @param {string} locale
 * @returns {Array<string>}
 */
function getMatchedFields(document, query, tokens, locale) {
    if (!query) {
        return [];
    }

    const fields = {
        id: [document.id],
        name: [
            document.names[locale] ??
                document.names[locale.split('-')[0]] ??
                document.fallbackName,
        ],
        description: [
            document.descriptions[locale] ??
                document.descriptions[locale.split('-')[0]] ??
                document.fallbackDescription,
        ],
        category: [document.category],
        tags: document.tags,
        keywords: document.keywords,
    };

    return Object.entries(fields)
        .filter(([, values]) =>
            values.some((value) =>
                matchesText(value, query, tokens),
            ),
        )
        .map(([field]) => field);
}

/**
 * @param {string} value
 * @param {string} query
 * @param {ReadonlyArray<string>} tokens
 * @returns {boolean}
 */
function matchesText(value, query, tokens) {
    return (
        value.includes(query) ||
        tokens.some((token) => value.includes(token))
    );
}

/**
 * @param {Readonly<Record<string, unknown>>} document
 * @param {Readonly<Record<string, unknown>>} filters
 * @returns {boolean}
 */
function matchesFilters(document, filters) {
    if (
        !filters.includeDeprecated &&
        document.tool.status === 'deprecated'
    ) {
        return false;
    }

    if (
        filters.category &&
        document.category !== filters.category
    ) {
        return false;
    }

    if (
        filters.featured !== null &&
        document.tool.featured !== filters.featured
    ) {
        return false;
    }

    if (
        filters.statuses.size > 0 &&
        !filters.statuses.has(document.tool.status)
    ) {
        return false;
    }

    if (
        filters.tags.size > 0 &&
        ![...filters.tags].every((tag) => document.tags.includes(tag))
    ) {
        return false;
    }

    if (
        filters.languages.size > 0 &&
        ![...filters.languages].every((language) =>
            document.languages.includes(language),
        )
    ) {
        return false;
    }

    return true;
}

/**
 * @param {Record<string, unknown>} options
 * @returns {Readonly<Record<string, unknown>>}
 */
function normalizeFilters(options) {
    return Object.freeze({
        category: normalizeSearchText(options.category ?? ''),
        tags: new Set(
            normalizeIterable(options.tags).map(normalizeSearchText),
        ),
        languages: new Set(
            normalizeIterable(options.languages).map(normalizeLocale),
        ),
        statuses: new Set(
            normalizeIterable(options.status).map(String),
        ),
        featured:
            typeof options.featured === 'boolean'
                ? options.featured
                : null,
        includeDeprecated: Boolean(options.includeDeprecated),
    });
}

/**
 * @param {unknown} value
 * @returns {Array<unknown>}
 */
function normalizeIterable(value) {
    if (value === null || value === undefined || value === '') {
        return [];
    }

    if (typeof value === 'string') {
        return [value];
    }

    if (value[Symbol.iterator]) {
        return [...value];
    }

    throw new TypeError('Search filters must be strings or iterables.');
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function normalizeLimit(value) {
    if (value === undefined) {
        return DEFAULT_LIMIT;
    }

    if (!Number.isFinite(value) || value < 1) {
        throw new TypeError('Search limit must be a positive number.');
    }

    return Math.min(500, Math.trunc(value));
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeLocale(value) {
    return String(value ?? DEFAULT_LOCALE).trim() || DEFAULT_LOCALE;
}

/**
 * Normalizes Arabic diacritics, tatweel, punctuation and whitespace.
 *
 * @param {unknown} value
 * @returns {string}
 */
function normalizeSearchText(value) {
    return String(value ?? '')
        .normalize('NFKD')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/\u0640/g, '')
        .replace(/[^\p{L}\p{N}]+/gu, ' ')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

/**
 * @param {string} value
 * @returns {ReadonlyArray<string>}
 */
function tokenize(value) {
    return Object.freeze(
        value
            .split(' ')
            .map((token) => token.trim())
            .filter(Boolean),
    );
}

export {
    ToolSearchIndex,
    normalizeSearchText,
};

// END OF FILE
