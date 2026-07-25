/**
 * @file Canonical registry for tool manifests.
 * @module tools/tool-registry
 */

import {
    createToolManifest,
    resolveLocalizedText,
} from './tool-manifest.js';

class ToolRegistry {
    constructor() {
        /** @type {Map<string, Readonly<Record<string, unknown>>>} */
        this.registry = new Map();

        /** @type {Map<string, ReadonlyArray<Readonly<Record<string, unknown>>>>} */
        this.categoryIndex = new Map();

        /** @type {Map<string, Set<string>>} */
        this.tagIndex = new Map();

        /** @type {number} */
        this.revision = 0;
    }

    /**
     * @param {Record<string, unknown>} definition
     * @returns {Readonly<Record<string, unknown>>}
     */
    register(definition) {
        const manifest = createToolManifest(definition);

        if (this.registry.has(manifest.id)) {
            throw new Error(`Tool "${manifest.id}" is already registered.`);
        }

        this.registry.set(manifest.id, manifest);
        this.rebuildIndexes();
        return manifest;
    }

    /**
     * @param {Iterable<Record<string, unknown>>} definitions
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    registerMany(definitions) {
        const manifests = [...definitions].map(createToolManifest);
        const seen = new Set(this.registry.keys());

        for (const manifest of manifests) {
            if (seen.has(manifest.id)) {
                throw new Error(`Tool "${manifest.id}" is already registered.`);
            }

            seen.add(manifest.id);
        }

        for (const manifest of manifests) {
            this.registry.set(manifest.id, manifest);
        }

        this.rebuildIndexes();
        return Object.freeze(manifests);
    }

    /**
     * Registers manifests exported by eager module maps.
     *
     * @param {Record<string, unknown>} modules
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    discover(modules) {
        if (!modules || typeof modules !== 'object' || Array.isArray(modules)) {
            throw new TypeError('Tool discovery modules must be an object map.');
        }

        const definitions = Object.entries(modules)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([path, moduleValue]) => {
                const definition =
                    moduleValue?.default ??
                    moduleValue?.manifest ??
                    moduleValue;

                if (
                    !definition ||
                    typeof definition !== 'object' ||
                    Array.isArray(definition)
                ) {
                    throw new TypeError(
                        `Tool manifest module "${path}" exported no manifest.`,
                    );
                }

                return definition;
            });

        return this.registerMany(definitions);
    }

    /**
     * @param {string} id
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    get(id) {
        return this.registry.get(String(id)) ?? null;
    }

    /**
     * @param {string} id
     * @returns {boolean}
     */
    has(id) {
        return this.registry.has(String(id));
    }

    /**
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getAll() {
        return Object.freeze([...this.registry.values()]);
    }

    /**
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getSorted() {
        return Object.freeze(
            [...this.registry.values()].sort((left, right) => {
                if (left.order !== right.order) {
                    return left.order - right.order;
                }

                return resolveLocalizedText(left.name, 'ar').localeCompare(
                    resolveLocalizedText(right.name, 'ar'),
                    'ar',
                    { sensitivity: 'base' },
                );
            }),
        );
    }

    /**
     * @param {string} category
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getToolsByCategory(category) {
        return (
            this.categoryIndex.get(normalizeToken(category)) ??
            Object.freeze([])
        );
    }

    /**
     * @param {string} tag
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getToolsByTag(tag) {
        const ids = this.tagIndex.get(normalizeToken(tag));

        if (!ids) {
            return Object.freeze([]);
        }

        return Object.freeze(
            [...ids]
                .map((id) => this.registry.get(id))
                .filter(Boolean),
        );
    }

    /**
     * @returns {ReadonlyArray<string>}
     */
    getCategories() {
        return Object.freeze([...this.categoryIndex.keys()].sort());
    }

    /**
     * @returns {ReadonlyArray<string>}
     */
    getTags() {
        return Object.freeze([...this.tagIndex.keys()].sort());
    }

    /**
     * @param {string} query
     * @param {{locale?: string, includeDeprecated?: boolean}} [options]
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    search(query = '', options = {}) {
        const normalizedQuery = normalizeSearchText(query);
        const locale = options.locale ?? 'ar';
        const includeDeprecated = options.includeDeprecated ?? false;

        return Object.freeze(
            this.getSorted().filter((tool) => {
                if (!includeDeprecated && tool.status === 'deprecated') {
                    return false;
                }

                if (!normalizedQuery) {
                    return true;
                }

                const searchable = [
                    tool.id,
                    tool.category,
                    resolveLocalizedText(tool.name, locale),
                    resolveLocalizedText(tool.description, locale),
                    ...tool.tags,
                    ...tool.keywords,
                ]
                    .map(normalizeSearchText)
                    .join(' ');

                return searchable.includes(normalizedQuery);
            }),
        );
    }

    /**
     * @param {(tool: Readonly<Record<string, unknown>>) => boolean} predicate
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    filter(predicate) {
        if (typeof predicate !== 'function') {
            throw new TypeError('Tool registry filter requires a predicate.');
        }

        return Object.freeze([...this.registry.values()].filter(predicate));
    }

    /**
     * @param {(tool: Readonly<Record<string, unknown>>, id: string) => void} callback
     * @returns {void}
     */
    forEach(callback) {
        if (typeof callback !== 'function') {
            throw new TypeError('Tool registry forEach requires a callback.');
        }

        this.registry.forEach(callback);
    }

    /**
     * @param {string} id
     * @returns {boolean}
     */
    unregister(id) {
        const deleted = this.registry.delete(String(id));

        if (deleted) {
            this.rebuildIndexes();
        }

        return deleted;
    }

    /**
     * @returns {void}
     */
    clear() {
        if (this.registry.size === 0) {
            return;
        }

        this.registry.clear();
        this.rebuildIndexes();
    }

    /**
     * @returns {number}
     */
    count() {
        return this.registry.size;
    }

    /**
     * @returns {ReadonlyArray<string>}
     */
    getIds() {
        return Object.freeze([...this.registry.keys()]);
    }

    /**
     * @returns {number}
     */
    getRevision() {
        return this.revision;
    }

    /**
     * @returns {void}
     */
    destroy() {
        this.clear();
    }

    /**
     * @private
     * @returns {void}
     */
    rebuildIndexes() {
        const categories = new Map();
        const tags = new Map();

        for (const manifest of this.registry.values()) {
            const category = normalizeToken(manifest.category);
            const categoryTools = categories.get(category) ?? [];
            categoryTools.push(manifest);
            categories.set(category, categoryTools);

            for (const tagValue of manifest.tags) {
                const tag = normalizeToken(tagValue);
                const ids = tags.get(tag) ?? new Set();
                ids.add(manifest.id);
                tags.set(tag, ids);
            }
        }

        this.categoryIndex = new Map(
            [...categories].map(([category, tools]) => [
                category,
                Object.freeze(
                    tools.sort((left, right) => left.order - right.order),
                ),
            ]),
        );
        this.tagIndex = tags;
        this.revision += 1;
    }
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeToken(value) {
    return String(value ?? '').trim().toLowerCase();
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeSearchText(value) {
    return String(value ?? '')
        .normalize('NFKD')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/\u0640/g, '')
        .trim()
        .toLowerCase();
}

const registry = new ToolRegistry();

export default registry;

export {
    ToolRegistry,
};

// END OF FILE
