/**
 * ============================================================================
 * Adawaty
 * Theme Service
 * ----------------------------------------------------------------------------
 * Handles application theme management.
 * Supports:
 * - light
 * - dark
 * - system
 * ============================================================================
 */

import storage from './storage.service.js';
import eventBus from '../core/event-bus.js';

const STORAGE_KEY = 'theme';
const DEFAULT_THEME = 'system';

const THEMES = Object.freeze({
    LIGHT: 'light',
    DARK: 'dark',
    SYSTEM: 'system'
});

class ThemeService {

    constructor() {

        /**
         * Current theme.
         *
         * @type {string}
         */
        this.theme = DEFAULT_THEME;

    }

    /**
     * Initializes the theme service.
     *
     * @returns {void}
     */
    init() {

        const savedTheme = storage.get(
            STORAGE_KEY,
            DEFAULT_THEME
        );

        this.setTheme(savedTheme, false);

        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener(
                'change',
                () => {

                    if (this.theme === THEMES.SYSTEM) {

                        this.applyTheme();

                    }

                }
            );

    }

    /**
     * Sets the application theme.
     *
     * @param {string} theme
     * @param {boolean} save
     * @returns {void}
     */
    setTheme(theme, save = true) {

        if (
            !Object.values(THEMES).includes(theme)
        ) {

            theme = DEFAULT_THEME;

        }

        this.theme = theme;

        this.applyTheme();

        if (save) {

            storage.set(
                STORAGE_KEY,
                theme
            );

        }

        eventBus.emit(
            'theme:changed',
            {
                theme: this.getResolvedTheme(),
                mode: this.theme
            }
        );

    }

    /**
     * Returns the selected mode.
     *
     * @returns {string}
     */
    getTheme() {

        return this.theme;

    }

    /**
     * Returns the actual applied theme.
     *
     * @returns {string}
     */
    getResolvedTheme() {

        if (this.theme !== THEMES.SYSTEM) {

            return this.theme;

        }

        return window.matchMedia(
            '(prefers-color-scheme: dark)'
        ).matches
            ? THEMES.DARK
            : THEMES.LIGHT;

    }
	
	    /**
     * Applies the current theme to the document.
     *
     * @returns {void}
     */
    applyTheme() {

        const resolvedTheme = this.getResolvedTheme();

        document.documentElement.dataset.theme =
            resolvedTheme;

        document.documentElement.style.colorScheme =
            resolvedTheme;

    }

    /**
     * Toggles between light and dark themes.
     *
     * If the current mode is "system",
     * it switches to the opposite of the
     * currently resolved theme.
     *
     * @returns {void}
     */
    toggleTheme() {

        const current = this.getResolvedTheme();

        this.setTheme(
            current === THEMES.DARK
                ? THEMES.LIGHT
                : THEMES.DARK
        );

    }

    /**
     * Returns true if the active theme is dark.
     *
     * @returns {boolean}
     */
    isDark() {

        return this.getResolvedTheme() === THEMES.DARK;

    }

    /**
     * Returns true if the active theme is light.
     *
     * @returns {boolean}
     */
    isLight() {

        return this.getResolvedTheme() === THEMES.LIGHT;

    }

    /**
     * Resets the service to its default state.
     *
     * @returns {void}
     */
    destroy() {

        this.theme = DEFAULT_THEME;

    }

}

const theme = new ThemeService();

export {
    THEMES
};

export default theme;