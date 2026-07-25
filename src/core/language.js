/**
 * ============================================================================
 * Adawaty
 * Language Service
 * ----------------------------------------------------------------------------
 * Handles application language management and translations.
 * ============================================================================
 */

import storage from './storage.service.js';
import eventBus from '../core/event-bus.js';

const STORAGE_KEY = 'language';
const DEFAULT_LANGUAGE = 'ar';

const LANGUAGES = Object.freeze({
    AR: 'ar',
    EN: 'en'
});

class LanguageService {

    constructor() {

        /**
         * Current language.
         *
         * @type {string}
         */
        this.language = DEFAULT_LANGUAGE;

        /**
         * Translation dictionaries.
         *
         * @type {Map<string, Object>}
         */
        this.translations = new Map();

    }

    /**
     * Initializes the language service.
     *
     * @returns {void}
     */
    init() {

        const savedLanguage = storage.get(
            STORAGE_KEY,
            DEFAULT_LANGUAGE
        );

        this.setLanguage(
            savedLanguage,
            false
        );

    }

    /**
     * Sets the current language.
     *
     * @param {string} language
     * @param {boolean} save
     * @returns {void}
     */
    setLanguage(language, save = true) {

        if (
            !Object.values(LANGUAGES).includes(language)
        ) {

            language = DEFAULT_LANGUAGE;

        }

        this.language = language;

        document.documentElement.lang = language;

        document.documentElement.dir =
            language === LANGUAGES.AR
                ? 'rtl'
                : 'ltr';

        if (save) {

            storage.set(
                STORAGE_KEY,
                language
            );

        }

        eventBus.emit(
            'language:changed',
            {
                language
            }
        );

    }

    /**
     * Returns current language.
     *
     * @returns {string}
     */
    getLanguage() {

        return this.language;

    }

    /**
     * Returns true if current language is Arabic.
     *
     * @returns {boolean}
     */
    isArabic() {

        return this.language === LANGUAGES.AR;

    }

    /**
     * Returns true if current language is English.
     *
     * @returns {boolean}
     */
    isEnglish() {

        return this.language === LANGUAGES.EN;

    }
	
	    /**
     * Toggles between supported languages.
     *
     * @returns {void}
     */
    toggleLanguage() {

        this.setLanguage(
            this.language === LANGUAGES.AR
                ? LANGUAGES.EN
                : LANGUAGES.AR
        );

    }

    /**
     * Registers a translation dictionary.
     *
     * @param {string} language
     * @param {Object} dictionary
     * @returns {void}
     */
    registerTranslations(language, dictionary) {

        if (
            !Object.values(LANGUAGES).includes(language)
        ) {
            return;
        }

        const current =
            this.translations.get(language) ?? {};

        this.translations.set(
            language,
            {
                ...current,
                ...dictionary
            }
        );

    }

    /**
     * Checks whether translations exist.
     *
     * @param {string} language
     * @returns {boolean}
     */
    hasTranslations(language = this.language) {

        return this.translations.has(language);

    }

    /**
     * Returns a translated string.
     *
     * Supports placeholders:
     *
     * Hello {name}
     * Total: {count}
     *
     * @param {string} key
     * @param {Object} [variables={}]
     * @returns {string}
     */
    translate(
        key,
        variables = {}
    ) {

        const dictionary =
            this.translations.get(
                this.language
            ) ?? {};

        let text =
            dictionary[key] ?? key;

        if (
            typeof text !== 'string'
        ) {
            return key;
        }

        for (
            const [name, value]
            of Object.entries(variables)
        ) {

            text = text.replaceAll(
                `{${name}}`,
                String(value)
            );

        }

        return text;

    }

    /**
     * Alias for translate().
     *
     * @param {string} key
     * @param {Object} [variables={}]
     * @returns {string}
     */
    t(
        key,
        variables = {}
    ) {

        return this.translate(
            key,
            variables
        );

    }
	
	    /**
     * Removes all registered translations.
     *
     * @returns {void}
     */
    clearTranslations() {

        this.translations.clear();

    }

    /**
     * Returns the supported languages.
     *
     * @returns {string[]}
     */
    getSupportedLanguages() {

        return Object.values(
            LANGUAGES
        );

    }

    /**
     * Resets the service.
     *
     * @returns {void}
     */
    destroy() {

        this.language = DEFAULT_LANGUAGE;

        this.translations.clear();

    }

}

const language = new LanguageService();

export {
    LANGUAGES
};

export default language;