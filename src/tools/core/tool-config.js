/**
 * ============================================================================
 * Adawaty
 * Tool Configuration
 * ----------------------------------------------------------------------------
 * Shared configuration manager for all tools.
 * ============================================================================
 */

class ToolConfig {

    /**
     * Registered tool configurations.
     *
     * @type {Map<string, Object>}
     */
    static configs = new Map();

    /**
     * Registers a tool configuration.
     *
     * @param {string} id
     * @param {Object} config
     * @returns {void}
     */
    static register(
        id,
        config
    ) {

        if (
            typeof id !== 'string' ||
            !config ||
            typeof config !== 'object'
        ) {

            throw new TypeError(
                'Invalid tool configuration.'
            );

        }

        ToolConfig.configs.set(
            id,
            structuredClone(config)
        );

    }

    /**
     * Returns a configuration.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static get(id) {

        const config =
            ToolConfig.configs.get(id);

        return config
            ? structuredClone(config)
            : null;

    }

    /**
     * Returns true if a configuration exists.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static has(id) {

        return ToolConfig.configs.has(
            id
        );

    }

    /**
     * Removes a configuration.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static remove(id) {

        return ToolConfig.configs.delete(
            id
        );

    }

    /**
     * Clears all configurations.
     *
     * @returns {void}
     */
    static clear() {

        ToolConfig.configs.clear();

    }

    /**
     * Returns all registered IDs.
     *
     * @returns {string[]}
     */
    static ids() {

        return [
            ...ToolConfig.configs.keys()
        ];

    }

}

    /**
     * Merges two configurations.
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
     * Updates a registered configuration.
     *
     * @param {string} id
     * @param {Object} updates
     * @returns {boolean}
     */
    static update(
        id,
        updates = {}
    ) {

        const current =
            ToolConfig.get(id);

        if (!current) {

            return false;

        }

        ToolConfig.register(
            id,
            ToolConfig.merge(
                current,
                updates
            )
        );

        return true;

    }

    /**
     * Creates an immutable copy.
     *
     * @param {Object} config
     * @returns {Object}
     */
    static freeze(config) {

        return Object.freeze(
            structuredClone(config)
        );

    }

    /**
     * Creates a deep clone.
     *
     * @param {Object} config
     * @returns {Object}
     */
    static clone(config) {

        return structuredClone(
            config
        );

    }

    /**
     * Applies default values.
     *
     * @param {Object} config
     * @param {Object} defaults
     * @returns {Object}
     */
    static defaults(
        config = {},
        defaults = {}
    ) {

        return {

            ...structuredClone(defaults),

            ...structuredClone(config)

        };

    }

    /**
     * Exports a configuration.
     *
     * @param {string} id
     * @returns {string|null}
     */
    static export(id) {

        const config =
            ToolConfig.get(id);

        if (!config) {

            return null;

        }

        return JSON.stringify(
            config,
            null,
            2
        );

    }

    /**
     * Returns the number of
     * registered configurations.
     *
     * @returns {number}
     */
    static count() {

        return ToolConfig.configs.size;

    }

    /**
     * Returns every configuration.
     *
     * @returns {Object[]}
     */
    static all() {

        return ToolConfig.ids()
            .map(id =>
                ToolConfig.get(id)
            );

    }
	
	    /**
     * Validates a configuration object.
     *
     * @param {Object} config
     * @returns {boolean}
     */
    static validate(config) {

        return (
            config &&
            typeof config === 'object' &&
            typeof config.id === 'string' &&
            typeof config.name === 'string'
        );

    }

    /**
     * Imports a configuration.
     *
     * @param {string|Object} config
     * @returns {Object}
     */
    static import(config) {

        const value =
            typeof config === 'string'
                ? JSON.parse(config)
                : structuredClone(config);

        if (
            !ToolConfig.validate(
                value
            )
        ) {

            throw new Error(
                'Invalid configuration.'
            );

        }

        return value;

    }

    /**
     * Creates an immutable snapshot.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static snapshot(id) {

        const config =
            ToolConfig.get(id);

        if (!config) {

            return null;

        }

        return ToolConfig.freeze(
            config
        );

    }

    /**
     * Restores a snapshot.
     *
     * @param {string} id
     * @param {Object} snapshot
     * @returns {boolean}
     */
    static restore(
        id,
        snapshot
    ) {

        if (
            !ToolConfig.validate(
                snapshot
            )
        ) {

            return false;

        }

        ToolConfig.register(
            id,
            snapshot
        );

        return true;

    }

    /**
     * Applies environment overrides.
     *
     * @param {Object} config
     * @param {Object} overrides
     * @returns {Object}
     */
    static environment(
        config = {},
        overrides = {}
    ) {

        return ToolConfig.merge(
            config,
            overrides
        );

    }

    /**
     * Returns a configuration with
     * defaults and environment applied.
     *
     * @param {Object} config
     * @param {Object} defaults
     * @param {Object} overrides
     * @returns {Object}
     */
    static resolve(
        config = {},
        defaults = {},
        overrides = {}
    ) {

        return ToolConfig.environment(

            ToolConfig.defaults(
                config,
                defaults
            ),

            overrides

        );

    }

    /**
     * Returns true if a configuration
     * can be imported.
     *
     * @param {string|Object} config
     * @returns {boolean}
     */
    static canImport(config) {

        try {

            ToolConfig.import(
                config
            );

            return true;

        } catch {

            return false;

        }

    }
	
	}

/**
 * Prevent accidental modification
 * of the ToolConfig API.
 */
Object.freeze(
    ToolConfig
);

export default ToolConfig;

// END OF FILE