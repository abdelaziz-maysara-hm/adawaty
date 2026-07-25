/**
 * ============================================================================
 * Adawaty
 * Core Application
 * ----------------------------------------------------------------------------
 * Main application controller.
 * Responsible for initializing all modules and coordinating
 * communication between core services.
 * ============================================================================
 */

import eventBus from './event-bus.js';

import themeService from '../services/theme.service.js';
import i18nService from '../services/i18n.service.js';

class App {

    /**
     * Creates application instance.
     */
    constructor() {

        /**
         * Indicates whether application
         * has already been initialized.
         *
         * @type {boolean}
         */
        this.initialized = false;

        /**
         * Registered modules.
         *
         * @type {Map<string, object>}
         */
        this.modules = new Map();

    }

    /**
     * Initializes application.
     *
     * @returns {Promise<void>}
     */
    async init() {

        if (this.initialized) {
            return;
        }

        this.registerCoreModules();

        this.registerGlobalEvents();

        await this.initializeModules();

        this.initialized = true;

        eventBus.emit('app:initialized');

    }

    /**
     * Registers core modules.
     */
    registerCoreModules() {

        this.modules.set(
            'theme',
            themeService
        );

        this.modules.set(
            'i18n',
            i18nService
        );

    }
	
	    /**
     * Registers global application events.
     */
    registerGlobalEvents() {

        eventBus.on(
            'language:changed',
            language => {

                document.documentElement.lang = language;

            }
        );

        eventBus.on(
            'theme:changed',
            theme => {

                document.documentElement.dataset.theme =
                    theme;

            }
        );

    }

    /**
     * Initializes all registered modules.
     *
     * @returns {Promise<void>}
     */
    async initializeModules() {

        for (const module of this.modules.values()) {

            if (
                typeof module.init === 'function'
            ) {

                await module.init();

            }

        }

    }

    /**
     * Registers a module.
     *
     * @param {string} name
     * @param {object} module
     */
    registerModule(name, module) {

        if (!name || !module) {

            throw new Error(
                'Module name and instance are required.'
            );

        }

        this.modules.set(
            name,
            module
        );

    }

    /**
     * Returns a registered module.
     *
     * @param {string} name
     * @returns {*}
     */
    getModule(name) {

        return this.modules.get(name);

    }
	
	    /**
     * Determines whether the application
     * has finished initialization.
     *
     * @returns {boolean}
     */
    isInitialized() {

        return this.initialized;

    }

    /**
     * Returns all registered modules.
     *
     * @returns {Map<string, object>}
     */
    getModules() {

        return this.modules;

    }

    /**
     * Removes a registered module.
     *
     * @param {string} name
     * @returns {boolean}
     */
    unregisterModule(name) {

        return this.modules.delete(name);

    }

    /**
     * Restarts the application.
     *
     * @returns {Promise<void>}
     */
    async restart() {

        this.initialized = false;

        await this.init();

    }

    /**
     * Destroys the application.
     */
    destroy() {

        this.modules.clear();

        this.initialized = false;

        eventBus.emit('app:destroyed');

    }
	
	}

const app = new App();

/**
 * Registers a module after initialization.
 *
 * @param {string} name
 * @param {object} module
 * @returns {void}
 */
export function registerModule(name, module) {

    app.registerModule(name, module);

}

/**
 * Returns a registered module.
 *
 * @param {string} name
 * @returns {*}
 */
export function getModule(name) {

    return app.getModule(name);

}

/**
 * Returns application initialization state.
 *
 * @returns {boolean}
 */
export function isReady() {

    return app.isInitialized();

}

export default app;