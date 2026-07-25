/**
 * ============================================================================
 * Adawaty
 * Tool Discovery Engine
 * ----------------------------------------------------------------------------
 * Discovers, registers and enumerates tools.
 * ============================================================================
 */

class ToolDiscovery {

    /**
     * Registered tool IDs.
     *
     * @type {Set<string>}
     */
    static registry = new Set();

    /**
     * Discovery cache.
     *
     * @type {Map<string, Object>}
     */
    static cache = new Map();

    /**
     * Registers a tool.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static register(id) {

        if (
            typeof id !== 'string' ||
            !id.trim()
        ) {

            return false;

        }

        ToolDiscovery.registry.add(
            id
        );

        return true;

    }

    /**
     * Registers multiple tools.
     *
     * @param {string[]} ids
     * @returns {number}
     */
    static registerMany(
        ids = []
    ) {

        let count = 0;

        ids.forEach(id => {

            if (
                ToolDiscovery.register(id)
            ) {

                count++;

            }

        });

        return count;

    }

    /**
     * Returns true if a tool exists.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static has(id) {

        return ToolDiscovery.registry.has(
            id
        );

    }

    /**
     * Removes a tool.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static remove(id) {

        ToolDiscovery.cache.delete(id);

        return ToolDiscovery.registry.delete(
            id
        );

    }

    /**
     * Clears registry and cache.
     *
     * @returns {void}
     */
    static clear() {

        ToolDiscovery.registry.clear();

        ToolDiscovery.cache.clear();

    }

    /**
     * Returns every registered tool.
     *
     * @returns {string[]}
     */
    static ids() {

        return [
            ...ToolDiscovery.registry
        ].sort();

    }

    /**
     * Returns total tools.
     *
     * @returns {number}
     */
    static count() {

        return ToolDiscovery.registry.size;

    }

    /**
     * Discovers a tool.
     *
     * @param {string} id
     * @param {Object} metadata
     * @returns {boolean}
     */
    static discover(
        id,
        metadata = {}
    ) {

        if (
            !ToolDiscovery.register(id)
        ) {

            return false;

        }

        ToolDiscovery.cache.set(
            id,
            structuredClone(metadata)
        );

        return true;

    }

    /**
     * Discovers multiple tools.
     *
     * @param {Object[]} tools
     * @returns {number}
     */
    static discoverMany(
        tools = []
    ) {

        let discovered = 0;

        tools.forEach(tool => {

            if (
                ToolDiscovery.discover(
                    tool.id,
                    tool
                )
            ) {

                discovered++;

            }

        });

        return discovered;

    }

    /**
     * Stores metadata in cache.
     *
     * @param {string} id
     * @param {Object} metadata
     * @returns {void}
     */
    static cacheMetadata(
        id,
        metadata
    ) {

        ToolDiscovery.cache.set(
            id,
            structuredClone(metadata)
        );

    }

    /**
     * Returns cached metadata.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static cached(id) {

        const value =
            ToolDiscovery.cache.get(id);

        return value
            ? structuredClone(value)
            : null;

    }

    /**
     * Invalidates cache entry.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static invalidate(
        id
    ) {

        return ToolDiscovery.cache.delete(
            id
        );

    }

    /**
     * Returns every discovered tool.
     *
     * @returns {Object[]}
     */
    static enumerate() {

        return ToolDiscovery.ids()

            .map(id => ({

                id,

                metadata:
                    ToolDiscovery.cached(id)

            }));

    }

    /**
     * Returns cache size.
     *
     * @returns {number}
     */
    static cacheSize() {

        return ToolDiscovery.cache.size;

    }

    /**
     * Returns true if metadata
     * exists in cache.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static isCached(id) {

        return ToolDiscovery.cache.has(
            id
        );

    }
	
	    /**
     * Dynamically loads a tool module.
     *
     * @param {Function} loader
     * @returns {Promise<*>}
     */
    static async load(loader) {

        if (
            typeof loader !== 'function'
        ) {

            throw new TypeError(
                'Loader must be a function.'
            );

        }

        return await loader();

    }

    /**
     * Lazy-loads a tool only once.
     *
     * @param {string} id
     * @param {Function} loader
     * @returns {Promise<*>}
     */
    static async lazyLoad(
        id,
        loader
    ) {

        if (
            ToolDiscovery.isCached(id)
        ) {

            return ToolDiscovery.cached(id);

        }

        const module =
            await ToolDiscovery.load(
                loader
            );

        ToolDiscovery.cacheMetadata(
            id,
            module
        );

        return module;

    }

    /**
     * Returns cached manifest.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static manifest(id) {

        return ToolDiscovery.cached(id);

    }

    /**
     * Refreshes cached metadata.
     *
     * @param {string} id
     * @param {Object} metadata
     * @returns {Object}
     */
    static refresh(
        id,
        metadata
    ) {

        ToolDiscovery.cacheMetadata(
            id,
            metadata
        );

        return ToolDiscovery.cached(id);

    }

    /**
     * Reloads a tool.
     *
     * @param {string} id
     * @param {Function} loader
     * @returns {Promise<*>}
     */
    static async reload(
        id,
        loader
    ) {

        ToolDiscovery.invalidate(
            id
        );

        return await ToolDiscovery.lazyLoad(
            id,
            loader
        );

    }

    /**
     * Finds a tool by ID.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static find(id) {

        if (
            !ToolDiscovery.has(id)
        ) {

            return null;

        }

        return {

            id,

            metadata:
                ToolDiscovery.cached(id)

        };

    }

    /**
     * Searches discovered tools.
     *
     * @param {string} query
     * @returns {Object[]}
     */
    static search(
        query = ''
    ) {

        const keyword =
            query
                .trim()
                .toLowerCase();

        if (!keyword) {

            return [];

        }

        return ToolDiscovery.enumerate()

            .filter(tool =>

                tool.id
                    .toLowerCase()
                    .includes(
                        keyword
                    )

            );

    }
	
	
	}

/**
 * Prevent accidental modification
 * of the ToolDiscovery API.
 */
Object.freeze(
    ToolDiscovery
);

export default ToolDiscovery;

// END OF FILE
