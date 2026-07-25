/**
 * ============================================================================
 * Adawaty
 * Tool Engine
 * ----------------------------------------------------------------------------
 * Responsible for:
 * - Tool registration
 * - Initialization
 * - Validation
 * - Lazy loading
 * - Lifecycle management
 * ============================================================================
 */

import eventBus from './event-bus.js';

class ToolEngine {

    constructor() {

        /**
         * Registered tools.
         *
         * @type {Map<string, Object>}
         */
        this.tools = new Map();

        /**
         * Active tool.
         *
         * @type {Object|null}
         */
        this.activeTool = null;

    }

    /**
     * Registers a tool.
     *
     * @param {Object} tool
     * @returns {void}
     */
    register(tool) {

        if (!tool || typeof tool !== 'object') {

            throw new TypeError(
                'Invalid tool definition.'
            );

        }

        if (!tool.id) {

            throw new Error(
                'Tool id is required.'
            );

        }

        if (this.tools.has(tool.id)) {

            throw new Error(
                `Tool "${tool.id}" already exists.`
            );

        }

        this.tools.set(
            tool.id,
            tool
        );

        eventBus.emit(
            'tool:registered',
            {
                id: tool.id
            }
        );

    }

    /**
     * Returns a tool.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    get(id) {

        return this.tools.get(id) ?? null;

    }

    /**
     * Checks if a tool exists.
     *
     * @param {string} id
     * @returns {boolean}
     */
    has(id) {

        return this.tools.has(id);

    }

    /**
     * Returns all registered tools.
     *
     * @returns {Object[]}
     */
    getAll() {

        return [
            ...this.tools.values()
        ];

    }
	
	    /**
     * Activates a tool.
     *
     * @param {string} id
     * @returns {Promise<Object>}
     */
    async activate(id) {

        const tool = this.get(id);

        if (!tool) {

            throw new Error(
                `Tool "${id}" is not registered.`
            );

        }

        if (
            this.activeTool &&
            this.activeTool.id === id
        ) {

            return tool;

        }

        if (this.activeTool) {

            await this.deactivate();

        }

        await this.initializeTool(tool);

        this.activeTool = tool;

        eventBus.emit(
            'tool:activated',
            {
                id: tool.id
            }
        );

        return tool;

    }

    /**
     * Deactivates the current tool.
     *
     * @returns {Promise<void>}
     */
    async deactivate() {

        if (!this.activeTool) {
            return;
        }

        await this.destroyTool(
            this.activeTool
        );

        eventBus.emit(
            'tool:deactivated',
            {
                id: this.activeTool.id
            }
        );

        this.activeTool = null;

    }

    /**
     * Initializes a tool.
     *
     * @private
     *
     * @param {Object} tool
     * @returns {Promise<void>}
     */
    async initializeTool(tool) {

        if (
            typeof tool.init !== 'function'
        ) {

            return;

        }

        await tool.init();

    }

    /**
     * Destroys a tool.
     *
     * @private
     *
     * @param {Object} tool
     * @returns {Promise<void>}
     */
    async destroyTool(tool) {

        if (
            typeof tool.destroy !== 'function'
        ) {

            return;

        }

        await tool.destroy();

    }

    /**
     * Returns the active tool.
     *
     * @returns {Object|null}
     */
    getActiveTool() {

        return this.activeTool;

    }

    /**
     * Returns true if a tool is active.
     *
     * @returns {boolean}
     */
    hasActiveTool() {

        return this.activeTool !== null;

    }
	
	    /**
     * Unregisters a tool.
     *
     * @param {string} id
     * @returns {boolean}
     */
    unregister(id) {

        if (
            this.activeTool &&
            this.activeTool.id === id
        ) {

            throw new Error(
                'Cannot unregister the active tool.'
            );

        }

        const removed = this.tools.delete(id);

        if (removed) {

            eventBus.emit(
                'tool:unregistered',
                {
                    id
                }
            );

        }

        return removed;

    }

    /**
     * Removes all registered tools.
     *
     * @returns {void}
     */
    clear() {

        if (this.activeTool) {

            throw new Error(
                'Deactivate the active tool before clearing the registry.'
            );

        }

        this.tools.clear();

        eventBus.emit(
            'tools:cleared'
        );

    }

    /**
     * Returns the number of registered tools.
     *
     * @returns {number}
     */
    count() {

        return this.tools.size;

    }

    /**
     * Iterates over all registered tools.
     *
     * @param {Function} callback
     * @returns {void}
     */
    forEach(callback) {

        this.tools.forEach(
            callback
        );

    }

    /**
     * Finds the first tool matching a predicate.
     *
     * @param {Function} predicate
     * @returns {Object|null}
     */
    find(predicate) {

        for (const tool of this.tools.values()) {

            if (predicate(tool)) {

                return tool;

            }

        }

        return null;

    }

    /**
     * Returns an array of registered tool IDs.
     *
     * @returns {string[]}
     */
    getIds() {

        return [
            ...this.tools.keys()
        ];

    }
	
	    /**
     * Destroys the Tool Engine.
     *
     * Deactivates the active tool (if any),
     * clears the registry and releases resources.
     *
     * @returns {Promise<void>}
     */
    async destroy() {

        if (this.activeTool) {

            await this.deactivate();

        }

        this.tools.clear();

        eventBus.emit(
            'tool-engine:destroyed'
        );

    }

}

const toolEngine = new ToolEngine();

/**
 * Registers a tool.
 *
 * @param {Object} tool
 * @returns {void}
 */
export function registerTool(tool) {

    toolEngine.register(tool);

}

/**
 * Activates a tool.
 *
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function activateTool(id) {

    return toolEngine.activate(id);

}

/**
 * Returns the currently active tool.
 *
 * @returns {Object|null}
 */
export function getActiveTool() {

    return toolEngine.getActiveTool();

}

/**
 * Returns all registered tools.
 *
 * @returns {Object[]}
 */
export function getTools() {

    return toolEngine.getAll();

}

export default toolEngine;