/**
 * ============================================================================
 * Adawaty
 * Shared Tool Page
 * ----------------------------------------------------------------------------
 * Base page controller used by every tool.
 * ============================================================================
 */

import BaseTool from '../../core/base-tool.js';

class ToolPage extends BaseTool {

    /**
     * @param {Object} config
     */
    constructor(config = {}) {

        super(config);

        /**
         * Root layout component.
         *
         * @type {HTMLElement|null}
         */
        this.layout = null;

        /**
         * Tool container.
         *
         * @type {HTMLElement|null}
         */
        this.container = null;

    }

    /**
     * Initializes the tool page.
     *
     * @param {Object} options
     * @returns {Promise<void>}
     */
    async init(options = {}) {

        await super.init(options);

        this.container =
            options.container;

        this.createLayout();

        await this.beforeRender();

        await this.render();

        await this.afterRender();

    }

    /**
     * Creates the shared layout.
     *
     * @returns {void}
     */
    createLayout() {

        this.layout =
            document.createElement(
                'tool-layout'
            );

        this.layout.title =
            this.config.name ?? '';

        this.layout.description =
            this.config.description ?? '';

        this.container.append(
            this.layout
        );

    }

    /**
     * Hook executed before render.
     *
     * @returns {Promise<void>}
     */
    async beforeRender() {}

    /**
     * Hook executed after render.
     *
     * @returns {Promise<void>}
     */
    async afterRender() {}


    /**
     * Returns the form slot.
     *
     * @returns {HTMLSlotElement|null}
     */
    getFormSlot() {

        return this.layout?.shadowRoot?.querySelector(
            'slot[name="form"]'
        ) ?? null;

    }

    /**
     * Returns the result slot.
     *
     * @returns {HTMLSlotElement|null}
     */
    getResultSlot() {

        return this.layout?.shadowRoot?.querySelector(
            'slot[name="result"]'
        ) ?? null;

    }

    /**
     * Returns the actions slot.
     *
     * @returns {HTMLSlotElement|null}
     */
    getActionsSlot() {

        return this.layout?.shadowRoot?.querySelector(
            'slot[name="actions"]'
        ) ?? null;

    }

    /**
     * Returns the FAQ slot.
     *
     * @returns {HTMLSlotElement|null}
     */
    getFaqSlot() {

        return this.layout?.shadowRoot?.querySelector(
            'slot[name="faq"]'
        ) ?? null;

    }

    /**
     * Returns the related tools slot.
     *
     * @returns {HTMLSlotElement|null}
     */
    getRelatedSlot() {

        return this.layout?.shadowRoot?.querySelector(
            'slot[name="related"]'
        ) ?? null;

    }

    /**
     * Shows the loading state.
     *
     * @returns {void}
     */
    showLoading() {

        this.layout?.showLoading();

    }

    /**
     * Hides the loading state.
     *
     * @returns {void}
     */
    hideLoading() {

        this.layout?.hideLoading();

    }

    /**
     * Shows an error.
     *
     * @param {Error|string} error
     * @returns {void}
     */
    showError(error) {

        this.layout?.showError(error);

    }

    /**
     * Clears the current error.
     *
     * @returns {void}
     */
    clearError() {

        this.layout?.clearError();

    }

    /**
     * Clears the current result.
     *
     * @returns {void}
     */
    clearResult() {

        this.layout?.clearResult();

    }
	
	    /**
     * Updates the page title.
     *
     * @param {string} title
     * @returns {void}
     */
    setTitle(title) {

        if (this.layout) {

            this.layout.title = title ?? '';

        }

    }

    /**
     * Updates the page description.
     *
     * @param {string} description
     * @returns {void}
     */
    setDescription(description) {

        if (this.layout) {

            this.layout.description =
                description ?? '';

        }

    }

    /**
     * Sets the tool result.
     *
     * @param {Node|string} content
     * @returns {void}
     */
    setResult(content) {

        this.clearResult();

        if (!this.layout) {

            return;

        }

        const element =
            typeof content === 'string'
                ? document.createTextNode(content)
                : content;

        if (element instanceof Node) {

            element.slot = 'result';

            this.layout.append(element);

        }

    }

    /**
     * Appends content to the form slot.
     *
     * @param {Node} node
     * @returns {void}
     */
    appendToForm(node) {

        if (!(node instanceof Node) || !this.layout) {

            return;

        }

        node.slot = 'form';

        this.layout.append(node);

    }

    /**
     * Appends content to the actions slot.
     *
     * @param {Node} node
     * @returns {void}
     */
    appendToActions(node) {

        if (!(node instanceof Node) || !this.layout) {

            return;

        }

        node.slot = 'actions';

        this.layout.append(node);

    }

    /**
     * Appends content to the FAQ slot.
     *
     * @param {Node} node
     * @returns {void}
     */
    appendToFaq(node) {

        if (!(node instanceof Node) || !this.layout) {

            return;

        }

        node.slot = 'faq';

        this.layout.append(node);

    }

    /**
     * Appends content to the related tools slot.
     *
     * @param {Node} node
     * @returns {void}
     */
    appendToRelated(node) {

        if (!(node instanceof Node) || !this.layout) {

            return;

        }

        node.slot = 'related';

        this.layout.append(node);

    }

    /**
     * Appends content to the description slot.
     *
     * @param {Node} node
     * @returns {void}
     */
    appendToDescription(node) {

        if (!(node instanceof Node) || !this.layout) {

            return;

        }

        node.slot = 'description';

        this.layout.append(node);

    }
	
	    /**
     * Resets the tool page state.
     *
     * @returns {void}
     */
    reset() {

        this.clearError();

        this.clearResult();

        if (this.layout) {

            this.layout.reset?.();

        }

    }

    /**
     * Destroys the tool page.
     *
     * @returns {Promise<void>}
     */
    async destroy() {

        this.reset();

        if (
            this.layout &&
            this.layout.isConnected
        ) {

            this.layout.remove();

        }

        this.layout = null;

        this.container = null;

        if (
            typeof super.destroy ===
            'function'
        ) {

            await super.destroy();

        }

    }

    /**
     * Cleans up when disconnected.
     *
     * @returns {Promise<void>}
     */
    async disconnectedCallback() {

        await this.destroy();

    }

}

export default ToolPage;