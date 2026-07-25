/**
 * ============================================================================
 * Adawaty
 * Bootstrap
 * ----------------------------------------------------------------------------
 * Initializes the application and all core services.
 * ============================================================================
 */

import app from './app.js';

import themeService from '../services/theme.service.js';
import i18nService from '../services/i18n.service.js';

import '../components/layout/header.js';
import '../components/layout/footer.js';
import '../components/tool/calculator-layout.js';

/**
 * Application Bootstrap.
 */
class Bootstrap {

    constructor() {

        this.initialized = false;

    }

    /**
     * Starts the application.
     *
     * @returns {Promise<void>}
     */
    async start() {

        if (this.initialized) {
            return;
        }

        try {

            this.lockUI();

            await this.initializeServices();

            await app.init();

            this.initialized = true;

            document.dispatchEvent(
                new CustomEvent('app:ready')
            );

        } catch (error) {

            console.error(
                '[Bootstrap] Startup failed.',
                error
            );

            this.showFatalError(error);

        } finally {

            this.unlockUI();

        }

    }

    /**
     * Initializes core services.
     *
     * @returns {Promise<void>}
     */
    async initializeServices() {

        await themeService.init();

        await i18nService.init();

    }

    /**
     * Prevent interaction while loading.
     */
    lockUI() {

        document.documentElement.classList.add(
            'app-loading'
        );

    }

    /**
     * Enable interaction.
     */
    unlockUI() {

        document.documentElement.classList.remove(
            'app-loading'
        );

    }
	    /**
     * Displays a fatal startup error.
     *
     * @param {Error} error
     */
    showFatalError(error) {

        console.error(error);

        const container = document.createElement('div');

        container.className = 'startup-error';

        container.innerHTML = `
            <div class="startup-error__content">
                <h1>Application Error</h1>
                <p>
                    The application could not be started.
                </p>
                <button id="reload-app">
                    Reload
                </button>
            </div>
        `;

        document.body.replaceChildren(container);

        container
            .querySelector('#reload-app')
            ?.addEventListener(
                'click',
                () => window.location.reload()
            );

    }

}

const bootstrap = new Bootstrap();

/**
 * Start application after DOM is ready.
 */
if (document.readyState === 'loading') {

    document.addEventListener(
        'DOMContentLoaded',
        () => bootstrap.start()
    );

} else {

    bootstrap.start();

}

export default bootstrap;