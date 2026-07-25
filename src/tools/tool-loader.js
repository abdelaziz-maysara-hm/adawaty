/**
 * ============================================================================
 * Adawaty
 * Tool Loader
 * ----------------------------------------------------------------------------
 * Responsible for lazy-loading tool modules from the registry.
 * ============================================================================
 */

import registry from './tool-registry.js';

class ToolLoader {

    constructor() {

        /**
         * Loaded tool instances.
         *
         * @type {Map<string, Object>}
         */
        this.loadedTools = new Map();

        /**
         * Pending loading operations.
         *
         * Prevents duplicate imports.
         *
         * @type {Map<string, Promise<Object>>}
         */
        this.loading = new Map();

    }

    /**
     * Loads a tool by id.
     *
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async load(id) {

        if (this.loadedTools.has(id)) {

            return this.loadedTools.get(id);

        }

        if (this.loading.has(id)) {

            return this.loading.get(id);

        }

        const definition =
            registry.get(id);

        if (!definition) {

            throw new Error(
                `Tool "${id}" is not registered.`
            );

        }

        if (
            typeof definition.loader !==
            'function'
        ) {

            throw new TypeError(
                `Tool "${id}" does not provide a loader.`
            );

        }

        const promise =
            this.loadModule(
                id,
                definition
            );

        this.loading.set(
            id,
            promise
        );

        try {

            const tool =
                await promise;

            this.loadedTools.set(
                id,
                tool
            );

            return tool;

        } finally {

            this.loading.delete(id);

        }

    }

    /**
     * Imports the tool module.
     *
     * @private
     * @param {string} id
     * @param {Object} definition
     * @returns {Promise<Object>}
     */
    async loadModule(
        id,
        definition
    ) {

        const module =
            await definition.loader();

        const tool =
            module.default ?? module;

        if (!tool) {

            throw new Error(
                `Tool "${id}" exported nothing.`
            );

        }

        return tool;

    }
	
	    /**
     * Preloads a tool.
     *
     * Any loading errors are intentionally ignored.
     *
     * @param {string} id
     * @returns {Promise<void>}
     */
    async preload(id) {

        try {

            await this.load(id);

        } catch {

            // Ignore preload failures.

        }

    }

    /**
     * Checks whether a tool has already
     * been loaded.
     *
     * @param {string} id
     * @returns {boolean}
     */
    isLoaded(id) {

        return this.loadedTools.has(id);

    }

    /**
     * Returns a loaded tool instance.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    getLoaded(id) {

        return this.loadedTools.get(id) ?? null;

    }

    /**
     * Returns all loaded tools.
     *
     * @returns {Object[]}
     */
    getAllLoaded() {

        return [
            ...this.loadedTools.values()
        ];

    }

    /**
     * Unloads a tool.
     *
     * If the tool exposes a destroy()
     * lifecycle method it will be invoked.
     *
     * @param {string} id
     * @returns {Promise<boolean>}
     */
    async unload(id) {

        const tool =
            this.loadedTools.get(id);

        if (!tool) {

            return false;

        }

        if (
            typeof tool.destroy ===
            'function'
        ) {

            await tool.destroy();

        }

        this.loadedTools.delete(id);

        return true;

    }

    /**
     * Returns the number of
     * loaded tools.
     *
     * @returns {number}
     */
    count() {

        return this.loadedTools.size;

    }

    /**
     * Returns IDs of loaded tools.
     *
     * @returns {string[]}
     */
    getLoadedIds() {

        return [
            ...this.loadedTools.keys()
        ];

    }
	
	    /**
     * Unloads every loaded tool.
     *
     * @returns {Promise<void>}
     */
    async clear() {

        const ids = this.getLoadedIds();

        for (const id of ids) {

            await this.unload(id);

        }

        this.loading.clear();

    }

    /**
     * Destroys the loader.
     *
     * @returns {Promise<void>}
     */
    async destroy() {

        await this.clear();

    }

}

const loader = new ToolLoader();

export default loader;

export {
    ToolLoader
};