/**
 * ============================================================================
 * Adawaty
 * Tool Metadata Registry
 * ----------------------------------------------------------------------------
 * Stores searchable metadata for every registered tool.
 * ============================================================================
 */

class ToolMetadata {

    /**
     * Metadata registry.
     *
     * @type {Map<string, Object>}
     */
    static registry = new Map();

    /**
     * Registers metadata.
     *
     * @param {string} id
     * @param {Object} metadata
     * @returns {void}
     */
    static register(
        id,
        metadata
    ) {

        if (
            typeof id !== 'string' ||
            !metadata ||
            typeof metadata !== 'object'
        ) {

            throw new TypeError(
                'Invalid metadata.'
            );

        }

        ToolMetadata.registry.set(
            id,
            structuredClone(metadata)
        );

    }

    /**
     * Returns metadata.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static get(id) {

        const metadata =
            ToolMetadata.registry.get(id);

        return metadata
            ? structuredClone(metadata)
            : null;

    }

    /**
     * Returns true if metadata exists.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static has(id) {

        return ToolMetadata.registry.has(id);

    }

    /**
     * Removes metadata.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static remove(id) {

        return ToolMetadata.registry.delete(id);

    }

    /**
     * Clears registry.
     *
     * @returns {void}
     */
    static clear() {

        ToolMetadata.registry.clear();

    }

    /**
     * Returns all tool IDs.
     *
     * @returns {string[]}
     */
    static ids() {

        return [
            ...ToolMetadata.registry.keys()
        ];

    }

    /**
     * Returns total registered tools.
     *
     * @returns {number}
     */
    static count() {

        return ToolMetadata.registry.size;

    }

}

    /**
     * Updates metadata.
     *
     * @param {string} id
     * @param {Object} updates
     * @returns {boolean}
     */
    static update(
        id,
        updates = {}
    ) {

        const metadata =
            ToolMetadata.get(id);

        if (!metadata) {

            return false;

        }

        ToolMetadata.register(
            id,
            ToolMetadata.merge(
                metadata,
                updates
            )
        );

        return true;

    }

    /**
     * Merges metadata objects.
     *
     * @param {Object} base
     * @param {Object} overrides
     * @returns {Object}
     */
    static merge(
        base = {},
        overrides = {}
    ) {

        return {

            ...structuredClone(base),

            ...structuredClone(overrides)

        };

    }

    /**
     * Creates a deep clone.
     *
     * @param {Object} metadata
     * @returns {Object}
     */
    static clone(metadata) {

        return structuredClone(
            metadata
        );

    }

    /**
     * Returns every metadata object.
     *
     * @returns {Object[]}
     */
    static all() {

        return ToolMetadata.ids()
            .map(id =>
                ToolMetadata.get(id)
            );

    }

    /**
     * Returns every category.
     *
     * @returns {string[]}
     */
    static categories() {

        return [

            ...new Set(

                ToolMetadata.all()

                    .map(
                        item => item.category
                    )

                    .filter(Boolean)

            )

        ].sort();

    }

    /**
     * Returns every tag.
     *
     * @returns {string[]}
     */
    static tags() {

        const tags = new Set();

        ToolMetadata.all()

            .forEach(item => {

                if (
                    Array.isArray(item.tags)
                ) {

                    item.tags.forEach(tag =>
                        tags.add(tag)
                    );

                }

            });

        return [

            ...tags

        ].sort();

    }

    /**
     * Returns every keyword.
     *
     * @returns {string[]}
     */
    static keywords() {

        const keywords =
            new Set();

        ToolMetadata.all()

            .forEach(item => {

                if (
                    Array.isArray(
                        item.keywords
                    )
                ) {

                    item.keywords.forEach(
                        keyword =>
                            keywords.add(
                                keyword
                            )
                    );

                }

            });

        return [

            ...keywords

        ].sort();

    }

    /**
     * Returns metadata by category.
     *
     * @param {string} category
     * @returns {Object[]}
     */
    static byCategory(
        category
    ) {

        return ToolMetadata.all()

            .filter(
                item =>
                    item.category ===
                    category
            );

    }

    /**
     * Returns metadata containing
     * the specified tag.
     *
     * @param {string} tag
     * @returns {Object[]}
     */
    static byTag(tag) {

        return ToolMetadata.all()

            .filter(item =>

                Array.isArray(
                    item.tags
                ) &&

                item.tags.includes(
                    tag
                )

            );

    }
	
	    /**
     * Validates metadata.
     *
     * @param {Object} metadata
     * @returns {boolean}
     */
    static validate(metadata) {

        return (
            metadata &&
            typeof metadata === 'object' &&
            typeof metadata.id === 'string' &&
            typeof metadata.name === 'string'
        );

    }

    /**
     * Searches metadata by text.
     *
     * @param {string} query
     * @returns {Object[]}
     */
    static search(query = '') {

        const keyword =
            query.trim().toLowerCase();

        if (!keyword) {

            return [];

        }

        return ToolMetadata.all()

            .filter(item => {

                const values = [

                    item.name,
                    item.description,
                    item.category,
                    ...(item.tags ?? []),
                    ...(item.keywords ?? [])

                ];

                return values

                    .filter(Boolean)

                    .some(value =>
                        String(value)
                            .toLowerCase()
                            .includes(keyword)
                    );

            });

    }

    /**
     * Returns metadata containing
     * a specific keyword.
     *
     * @param {string} keyword
     * @returns {Object[]}
     */
    static findByKeyword(
        keyword
    ) {

        return ToolMetadata.all()

            .filter(item =>

                Array.isArray(
                    item.keywords
                ) &&

                item.keywords.includes(
                    keyword
                )

            );

    }

    /**
     * Returns SEO metadata.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static seo(id) {

        return ToolMetadata.get(id)?.seo
            ?? null;

    }

    /**
     * Returns author information.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static author(id) {

        return ToolMetadata.get(id)?.author
            ?? null;

    }

    /**
     * Returns version.
     *
     * @param {string} id
     * @returns {string|null}
     */
    static version(id) {

        return ToolMetadata.get(id)?.version
            ?? null;

    }

    /**
     * Returns license.
     *
     * @param {string} id
     * @returns {string|null}
     */
    static license(id) {

        return ToolMetadata.get(id)?.license
            ?? null;

    }

    /**
     * Creates immutable snapshot.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static snapshot(id) {

        const metadata =
            ToolMetadata.get(id);

        if (!metadata) {

            return null;

        }

        return Object.freeze(
            structuredClone(metadata)
        );

    }

    /**
     * Returns true if metadata
     * can be registered.
     *
     * @param {Object} metadata
     * @returns {boolean}
     */
    static canRegister(
        metadata
    ) {

        try {

            return ToolMetadata.validate(
                metadata
            );

        } catch {

            return false;

        }

    }
	
	}

/**
 * Prevent accidental modification
 * of the ToolMetadata API.
 */
Object.freeze(
    ToolMetadata
);

export default ToolMetadata;

// END OF FILE