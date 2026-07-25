/**
 * ============================================================================
 * Adawaty
 * Tool Manifest Registry
 * ----------------------------------------------------------------------------
 * Stores and manages tool manifests.
 * ============================================================================
 */

class ToolManifest {

    /**
     * Manifest registry.
     *
     * @type {Map<string, Object>}
     */
    static registry = new Map();

    /**
     * Registers a manifest.
     *
     * @param {string} id
     * @param {Object} manifest
     * @returns {void}
     */
    static register(
        id,
        manifest
    ) {

        if (
            typeof id !== 'string' ||
            !id.trim() ||
            !manifest ||
            typeof manifest !== 'object'
        ) {

            throw new TypeError(
                'Invalid manifest.'
            );

        }

        ToolManifest.registry.set(
            id,
            structuredClone(manifest)
        );

    }

    /**
     * Returns a manifest.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static get(id) {

        const manifest =
            ToolManifest.registry.get(id);

        return manifest
            ? structuredClone(manifest)
            : null;

    }

    /**
     * Returns true if manifest exists.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static has(id) {

        return ToolManifest.registry.has(id);

    }

    /**
     * Removes a manifest.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static remove(id) {

        return ToolManifest.registry.delete(
            id
        );

    }

    /**
     * Clears registry.
     *
     * @returns {void}
     */
    static clear() {

        ToolManifest.registry.clear();

    }

    /**
     * Returns all registered IDs.
     *
     * @returns {string[]}
     */
    static ids() {

        return [
            ...ToolManifest.registry.keys()
        ].sort();

    }

    /**
     * Returns registry size.
     *
     * @returns {number}
     */
    static count() {

        return ToolManifest.registry.size;

    }

}

    /**
     * Updates a manifest.
     *
     * @param {string} id
     * @param {Object} updates
     * @returns {boolean}
     */
    static update(
        id,
        updates = {}
    ) {

        const manifest =
            ToolManifest.get(id);

        if (!manifest) {

            return false;

        }

        ToolManifest.register(
            id,
            ToolManifest.merge(
                manifest,
                updates
            )
        );

        return true;

    }

    /**
     * Merges manifests.
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
     * @param {Object} manifest
     * @returns {Object}
     */
    static clone(manifest) {

        return structuredClone(
            manifest
        );

    }

    /**
     * Returns all manifests.
     *
     * @returns {Object[]}
     */
    static all() {

        return ToolManifest.ids()

            .map(id =>
                ToolManifest.get(id)
            );

    }

    /**
     * Returns manifest dependencies.
     *
     * @param {string} id
     * @returns {string[]}
     */
    static dependencies(id) {

        const manifest =
            ToolManifest.get(id);

        if (!manifest) {

            return [];

        }

        return Array.isArray(
            manifest.dependencies
        )
            ? [
                ...manifest.dependencies
            ]
            : [];

    }

    /**
     * Returns manifest version.
     *
     * @param {string} id
     * @returns {string|null}
     */
    static version(id) {

        return ToolManifest.get(id)
            ?.version
            ?? null;

    }

    /**
     * Returns runtime information.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static runtime(id) {

        return ToolManifest.get(id)
            ?.runtime
            ?? null;

    }

    /**
     * Returns manifest author.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static author(id) {

        return ToolManifest.get(id)
            ?.author
            ?? null;

    }

    /**
     * Returns supported languages.
     *
     * @param {string} id
     * @returns {string[]}
     */
    static languages(id) {

        const manifest =
            ToolManifest.get(id);

        if (!manifest) {

            return [];

        }

        return Array.isArray(
            manifest.languages
        )
            ? [
                ...manifest.languages
            ]
            : [];

    }
	
	    /**
     * Validates a manifest.
     *
     * @param {Object} manifest
     * @returns {boolean}
     */
    static validate(manifest) {

        return (
            manifest &&
            typeof manifest === 'object' &&
            typeof manifest.id === 'string' &&
            typeof manifest.name === 'string' &&
            typeof manifest.version === 'string'
        );

    }

    /**
     * Returns localized manifest data.
     *
     * @param {string} id
     * @param {string} language
     * @returns {Object|null}
     */
    static localize(
        id,
        language
    ) {

        const manifest =
            ToolManifest.get(id);

        if (!manifest) {

            return null;

        }

        const locale =
            manifest.locales?.[language];

        if (!locale) {

            return manifest;

        }

        return {

            ...manifest,

            ...structuredClone(locale)

        };

    }

    /**
     * Resolves runtime configuration.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static resolveRuntime(id) {

        const runtime =
            ToolManifest.runtime(id);

        return runtime
            ? structuredClone(runtime)
            : null;

    }

    /**
     * Exports a manifest.
     *
     * @param {string} id
     * @returns {string|null}
     */
    static export(id) {

        const manifest =
            ToolManifest.get(id);

        if (!manifest) {

            return null;

        }

        return JSON.stringify(
            manifest,
            null,
            2
        );

    }

    /**
     * Imports a manifest.
     *
     * @param {string|Object} manifest
     * @returns {Object}
     */
    static import(manifest) {

        const value =
            typeof manifest === 'string'
                ? JSON.parse(manifest)
                : structuredClone(manifest);

        if (
            !ToolManifest.validate(
                value
            )
        ) {

            throw new Error(
                'Invalid manifest.'
            );

        }

        return value;

    }

    /**
     * Creates immutable snapshot.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static snapshot(id) {

        const manifest =
            ToolManifest.get(id);

        if (!manifest) {

            return null;

        }

        return Object.freeze(
            structuredClone(manifest)
        );

    }

    /**
     * Returns true if manifest
     * can be loaded.
     *
     * @param {string|Object} manifest
     * @returns {boolean}
     */
    static canLoad(manifest) {

        try {

            return ToolManifest.validate(
                ToolManifest.import(
                    manifest
                )
            );

        } catch {

            return false;

        }

    }
	
	}

/**
 * Prevent accidental modification
 * of the ToolManifest API.
 */
Object.freeze(
    ToolManifest
);

export default ToolManifest;

// END OF FILE