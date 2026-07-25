/**
 * ============================================================================
 * Adawaty
 * Router Service
 * ----------------------------------------------------------------------------
 * Lightweight client-side router.
 * ============================================================================
 */

import eventBus from '../core/event-bus.js';

class RouterService {

    constructor() {

        /**
         * Registered routes.
         *
         * @type {Map<string, Function>}
         */
        this.routes = new Map();

        /**
         * Current path.
         *
         * @type {string}
         */
        this.currentPath = '/';

    }

    /**
     * Initializes the router.
     *
     * @returns {void}
     */
    init() {

        this.currentPath = this.normalize(
            window.location.pathname
        );

        window.addEventListener(
            'popstate',
            () => {

                this.handleRoute();

            }
        );

        document.addEventListener(
            'click',
            (event) => {

                const link = event.target.closest(
                    'a[data-router]'
                );

                if (!link) {
                    return;
                }

                const href = link.getAttribute('href');

                if (!href) {
                    return;
                }

                event.preventDefault();

                this.navigate(href);

            }
        );

        this.handleRoute();

    }

    /**
     * Registers a route.
     *
     * @param {string} path
     * @param {Function} handler
     * @returns {void}
     */
    register(path, handler) {

        if (typeof handler !== 'function') {

            throw new TypeError(
                'Route handler must be a function.'
            );

        }

        this.routes.set(
            this.normalize(path),
            handler
        );

    }

    /**
     * Navigates to a route.
     *
     * @param {string} path
     * @returns {void}
     */
    navigate(path) {

        const normalized =
            this.normalize(path);

        if (normalized === this.currentPath) {
            return;
        }

        history.pushState(
            {},
            '',
            normalized
        );

        this.currentPath = normalized;

        this.handleRoute();

    }
	
	    /**
     * Handles the current route.
     *
     * @returns {void}
     */
    handleRoute() {

        const path = this.normalize(
            window.location.pathname
        );

        this.currentPath = path;

        const handler = this.routes.get(path);

        if (handler) {

            handler(path);

            eventBus.emit(
                'router:changed',
                {
                    path
                }
            );

            return;

        }

        eventBus.emit(
            'router:not-found',
            {
                path
            }
        );

    }

    /**
     * Normalizes a route path.
     *
     * @param {string} path
     * @returns {string}
     */
    normalize(path) {

        if (
            typeof path !== 'string' ||
            path.trim() === ''
        ) {

            return '/';

        }

        let normalized = path.trim();

        if (!normalized.startsWith('/')) {

            normalized = `/${normalized}`;

        }

        if (
            normalized.length > 1 &&
            normalized.endsWith('/')
        ) {

            normalized = normalized.slice(
                0,
                -1
            );

        }

        return normalized;

    }

    /**
     * Returns the current path.
     *
     * @returns {string}
     */
    getCurrentPath() {

        return this.currentPath;

    }

    /**
     * Checks whether a route exists.
     *
     * @param {string} path
     * @returns {boolean}
     */
    hasRoute(path) {

        return this.routes.has(
            this.normalize(path)
        );

    }

    /**
     * Returns all registered routes.
     *
     * @returns {string[]}
     */
    getRoutes() {

        return [
            ...this.routes.keys()
        ];

    }
	
	    /**
     * Removes a registered route.
     *
     * @param {string} path
     * @returns {boolean}
     */
    removeRoute(path) {

        return this.routes.delete(
            this.normalize(path)
        );

    }

    /**
     * Removes all registered routes.
     *
     * @returns {void}
     */
    clearRoutes() {

        this.routes.clear();

    }

    /**
     * Navigates to the browser's previous page.
     *
     * @returns {void}
     */
    back() {

        window.history.back();

    }

    /**
     * Navigates to the browser's next page.
     *
     * @returns {void}
     */
    forward() {

        window.history.forward();

    }

    /**
     * Reloads the current page.
     *
     * @returns {void}
     */
    refresh() {

        window.location.reload();

    }

    /**
     * Destroys the router service.
     *
     * @returns {void}
     */
    destroy() {

        this.clearRoutes();

        this.currentPath = '/';

    }

}

const router = new RouterService();

export default router;