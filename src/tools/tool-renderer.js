/**
 * ============================================================================
 * Adawaty
 * Tool Renderer
 * ----------------------------------------------------------------------------
 * Responsible for validating, loading and rendering tools.
 * ============================================================================
 */

import loader from './tool-loader.js';
import registry from './tool-registry.js';
import validator from './tool-validator.js';

class ToolRenderer {

    constructor() {

        /**
         * Currently rendered tool.
         *
         * @type {Object|null}
         */
        this.currentTool = null;

        /**
         * Current container.
         *
         * @type {HTMLElement|null}
         */
        this.container = null;

    }

    /**
     * Renders a tool.
     *
     * @param {string} id
     * @param {HTMLElement} container
     * @returns {Promise<Object>}
     */
    async render(
        id,
        container
    ) {

        if (!(container instanceof HTMLElement)) {

            throw new TypeError(
                'A valid container is required.'
            );

        }

        const definition =
            registry.get(id);

        if (!definition) {

            throw new Error(
                `Tool "${id}" is not registered.`
            );

        }

        validator.assert(
            definition
        );

        await this.destroy();

        const tool =
            await loader.load(id);

        this.container =
            container;

        this.currentTool =
            tool;

        await this.mount(
            tool,
            container
        );

        return tool;

    }

    /**
     * Mounts a tool.
     *
     * @private
     * @param {Object} tool
     * @param {HTMLElement} container
     * @returns {Promise<void>}
     */
    async mount(
        tool,
        container
    ) {

        if (
            typeof tool.init !==
            'function'
        ) {

            throw new Error(
                'Tool must implement init().'
            );

        }

        await tool.init({

            container

        });

    }
	
	    /**
     * Destroys the currently rendered tool.
     *
     * @returns {Promise<void>}
     */
    async destroy() {

        if (!this.currentTool) {

            return;

        }

        if (
            typeof this.currentTool.destroy ===
            'function'
        ) {

            await this.currentTool.destroy();

        }

        if (this.container) {

            this.container.replaceChildren();

        }

        this.currentTool = null;

    }

    /**
     * Re-renders the current tool.
     *
     * @returns {Promise<Object|null>}
     */
    async rerender() {

        if (
            !this.currentTool ||
            !this.container
        ) {

            return null;

        }

        const id =
            this.currentTool.id;

        return this.render(
            id,
            this.container
        );

    }

    /**
     * Checks whether a tool
     * is currently rendered.
     *
     * @returns {boolean}
     */
    isRendered() {

        return this.currentTool !== null;

    }

    /**
     * Returns the current tool.
     *
     * @returns {Object|null}
     */
    getCurrentTool() {

        return this.currentTool;

    }

    /**
     * Returns the current render container.
     *
     * @returns {HTMLElement|null}
     */
    getContainer() {

        return this.container;

    }

    /**
     * Returns the current tool id.
     *
     * @returns {string|null}
     */
    getCurrentToolId() {

        return this.currentTool?.id ?? null;

    }

    /**
     * Checks whether a specific tool
     * is currently rendered.
     *
     * @param {string} id
     * @returns {boolean}
     */
    isCurrent(id) {

        return this.getCurrentToolId() === id;

    }
	
	    /**
     * Renders an error inside the current container.
     *
     * @param {Error|string} error
     * @returns {void}
     */
    renderError(error) {

        if (!this.container) {

            return;

        }

        const message =
            error instanceof Error
                ? error.message
                : String(error);

        this.container.replaceChildren();

        const element =
            document.createElement('div');

        element.className =
            'tool-error';

        element.setAttribute(
            'role',
            'alert'
        );

        element.textContent =
            message;

        this.container.append(
            element
        );

    }

    /**
     * Clears the current container.
     *
     * @returns {void}
     */
    clear() {

        this.container?.replaceChildren();

    }

    /**
     * Resets renderer state.
     *
     * @returns {Promise<void>}
     */
    async reset() {

        await this.destroy();

        this.container = null;

    }

}

const renderer =
    new ToolRenderer();

export default renderer;

export {
    ToolRenderer
};

