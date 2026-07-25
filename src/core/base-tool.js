/**
 * ============================================================================
 * Adawaty
 * Base Tool
 * ----------------------------------------------------------------------------
 * Base implementation for all project tools.
 * ============================================================================
 */

import eventBus from './event-bus.js';

export default class BaseTool {

    /**
     * @param {Object} config
     */
    constructor(config = {}) {

        /**
         * Tool configuration.
         *
         * @protected
         * @type {Object}
         */
        this.config = config;

        /**
         * Root element.
         *
         * @protected
         * @type {HTMLElement|null}
         */
        this.root = null;

        /**
         * Initialization state.
         *
         * @protected
         * @type {boolean}
         */
        this.initialized = false;

    }

    /**
     * Initializes the tool.
     *
     * @param {HTMLElement} root
     * @returns {Promise<void>}
     */
    async init(root) {

        if (this.initialized) {
            return;
        }

        this.root = root;

        this.validateConfig();

        await this.beforeInit();

        await this.render();

        await this.afterInit();

        this.initialized = true;

        eventBus.emit(
            'tool:initialized',
            {
                id: this.config.id
            }
        );

    }

    /**
     * Validates configuration.
     *
     * Override when necessary.
     *
     * @protected
     */
    validateConfig() {

        if (!this.config.id) {

            throw new Error(
                'Tool id is required.'
            );

        }

    }

    /**
     * Hook before rendering.
     *
     * @protected
     * @returns {Promise<void>}
     */
    async beforeInit() {}

    /**
     * Renders the tool.
     *
     * Override in derived tools.
     *
     * @protected
     * @returns {Promise<void>}
     */
    async render() {}
	
	    /**
     * Hook after initialization.
     *
     * Override when necessary.
     *
     * @protected
     * @returns {Promise<void>}
     */
    async afterInit() {}

    /**
     * Hook before destroying the tool.
     *
     * Override when necessary.
     *
     * @protected
     * @returns {Promise<void>}
     */
    async beforeDestroy() {}

    /**
     * Destroys the tool.
     *
     * @returns {Promise<void>}
     */
    async destroy() {

        if (!this.initialized) {
            return;
        }

        await this.beforeDestroy();

        if (this.root) {

            this.root.replaceChildren();

        }

        this.initialized = false;

        eventBus.emit(
            'tool:destroyed',
            {
                id: this.config.id
            }
        );

        this.root = null;

    }

    /**
     * Sets the tool root element.
     *
     * @param {HTMLElement|null} root
     * @returns {void}
     */
    setRoot(root) {

        this.root = root;

    }

    /**
     * Returns the tool root element.
     *
     * @returns {HTMLElement|null}
     */
    getRoot() {

        return this.root;

    }

    /**
     * Returns tool configuration.
     *
     * @returns {Object}
     */
    getConfig() {

        return this.config;

    }

    /**
     * Returns the tool identifier.
     *
     * @returns {string}
     */
    getId() {

        return this.config.id;

    }

    /**
     * Indicates whether the tool is initialized.
     *
     * @returns {boolean}
     */
    isInitialized() {

        return this.initialized;

    }

    /**
     * Updates the tool configuration.
     *
     * @param {Object} config
     * @returns {void}
     */
    updateConfig(config = {}) {

        this.config = {
            ...this.config,
            ...config
        };

    }
	
	    /**
     * Finds the first matching element inside the tool root.
     *
     * @param {string} selector
     * @returns {HTMLElement|null}
     */
    $(selector) {

        return this.root?.querySelector(selector) ?? null;

    }

    /**
     * Finds all matching elements inside the tool root.
     *
     * @param {string} selector
     * @returns {HTMLElement[]}
     */
    $$(selector) {

        return this.root
            ? [...this.root.querySelectorAll(selector)]
            : [];

    }

    /**
     * Emits an application event.
     *
     * @param {string} event
     * @param {*} payload
     * @returns {void}
     */
    emit(event, payload = null) {

        eventBus.emit(
            event,
            payload
        );

    }

    /**
     * Subscribes to an application event.
     *
     * @param {string} event
     * @param {Function} listener
     * @returns {Function}
     */
    on(event, listener) {

        return eventBus.on(
            event,
            listener
        );

    }

    /**
     * Subscribes to an application event once.
     *
     * @param {string} event
     * @param {Function} listener
     * @returns {Function}
     */
    once(event, listener) {

        return eventBus.once(
            event,
            listener
        );

    }

    /**
     * Removes an event listener.
     *
     * @param {string} event
     * @param {Function} listener
     * @returns {boolean}
     */
    off(event, listener) {

        return eventBus.off(
            event,
            listener
        );

    }

}