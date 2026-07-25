/**
 * ============================================================================
 * Adawaty
 * I18N
 * ----------------------------------------------------------------------------
 * Shared internationalization service.
 * ============================================================================
 */

class I18n {

    /**
     * Registered translations.
     *
     * @type {Map<string, Object>}
     */
    static translations = new Map();

    /**
     * Current language.
     *
     * @type {string}
     */
    static currentLanguage = 'en';

    /**
     * Fallback language.
     *
     * @type {string}
     */
    static fallbackLanguage = 'en';

    /**
     * Registers translations.
     *
     * @param {string} language
     * @param {Object} messages
     * @returns {void}
     */
    static register(
        language,
        messages
    ) {

        if (
            typeof language !== 'string' ||
            !messages ||
            typeof messages !== 'object'
        ) {

            throw new TypeError(
                'Invalid translation bundle.'
            );

        }

        I18n.translations.set(
            language,
            messages
        );

    }

    /**
     * Returns a translation bundle.
     *
     * @param {string} language
     * @returns {Object|null}
     */
    static get(language) {

        return I18n.translations.get(
            language
        ) ?? null;

    }

    /**
     * Returns all languages.
     *
     * @returns {string[]}
     */
    static languages() {

        return [
            ...I18n.translations.keys()
        ];

    }

    /**
     * Returns true if the language exists.
     *
     * @param {string} language
     * @returns {boolean}
     */
    static has(language) {

        return I18n.translations.has(
            language
        );

    }

    /**
     * Removes a language.
     *
     * @param {string} language
     * @returns {boolean}
     */
    static remove(language) {

        return I18n.translations.delete(
            language
        );

    }

    /**
     * Clears all translations.
     *
     * @returns {void}
     */
    static clear() {

        I18n.translations.clear();

    }

    /**
     * Sets the active language.
     *
     * @param {string} language
     * @returns {boolean}
     */
    static setLanguage(language) {

        if (!I18n.has(language)) {

            return false;

        }

        I18n.currentLanguage =
            language;

        return true;

    }

    /**
     * Returns the active language.
     *
     * @returns {string}
     */
    static getLanguage() {

        return I18n.currentLanguage;

    }

    /**
     * Sets the fallback language.
     *
     * @param {string} language
     * @returns {boolean}
     */
    static setFallbackLanguage(
        language
    ) {

        if (!I18n.has(language)) {

            return false;

        }

        I18n.fallbackLanguage =
            language;

        return true;

    }

    /**
     * Returns the fallback language.
     *
     * @returns {string}
     */
    static getFallbackLanguage() {

        return I18n.fallbackLanguage;

    }

    /**
     * Returns whether a language
     * uses RTL direction.
     *
     * @param {string} language
     * @returns {boolean}
     */
    static isRTL(
        language =
            I18n.currentLanguage
    ) {

        return /^(ar|fa|he|ur)/i.test(
            language
        );

    }

    /**
     * Returns the document direction.
     *
     * @param {string} language
     * @returns {'rtl'|'ltr'}
     */
    static direction(
        language =
            I18n.currentLanguage
    ) {

        return I18n.isRTL(
            language
        )
            ? 'rtl'
            : 'ltr';

    }

    /**
     * Resolves a supported locale.
     *
     * @param {string} language
     * @returns {string}
     */
    static locale(
        language =
            I18n.currentLanguage
    ) {

        return Intl.NumberFormat
            .supportedLocalesOf(
                [language]
            )[0] ??
            I18n.fallbackLanguage;

    }

    /**
     * Returns the translation bundle
     * for the active language.
     *
     * @returns {Object}
     */
    static bundle() {

        return (
            I18n.get(
                I18n.currentLanguage
            ) ??
            I18n.get(
                I18n.fallbackLanguage
            ) ??
            {}
        );

    }

    /**
     * Returns whether the current
     * language is registered.
     *
     * @returns {boolean}
     */
    static ready() {

        return I18n.has(
            I18n.currentLanguage
        );

    }
	
	    /**
     * Translates a key.
     *
     * @param {string} key
     * @param {Object} variables
     * @returns {string}
     */
    static translate(
        key,
        variables = {}
    ) {

        let value =
            I18n.resolveKey(
                I18n.bundle(),
                key
            );

        if (
            value === undefined
        ) {

            value = I18n.resolveKey(
                I18n.get(
                    I18n.fallbackLanguage
                ) ?? {},
                key
            );

        }

        if (
            value === undefined
        ) {

            return key;

        }

        if (
            typeof value !== 'string'
        ) {

            return String(value);

        }

        return value.replace(
            /\{\{\s*(.*?)\s*\}\}/g,
            (
                _,
                name
            ) => {

                return variables[name]
                    ?? '';

            }
        );

    }

    /**
     * Resolves a nested translation key.
     *
     * Example:
     * common.buttons.save
     *
     * @param {Object} object
     * @param {string} key
     * @returns {*}
     */
    static resolveKey(
        object,
        key
    ) {

        return key
            .split('.')
            .reduce(
                (
                    current,
                    part
                ) => {

                    if (
                        current &&
                        typeof current === 'object'
                    ) {

                        return current[
                            part
                        ];

                    }

                    return undefined;

                },
                object
            );

    }

    /**
     * Checks whether a translation
     * key exists.
     *
     * @param {string} key
     * @returns {boolean}
     */
    static exists(key) {

        return (
            I18n.resolveKey(
                I18n.bundle(),
                key
            ) !== undefined
        );

    }

    /**
     * Resolves a pluralized value.
     *
     * Translation format:
     *
     * items:
     *   one: ...
     *   other: ...
     *
     * @param {string} key
     * @param {number} count
     * @param {Object} variables
     * @returns {string}
     */
    static plural(
        key,
        count,
        variables = {}
    ) {

        const entry =
            I18n.resolveKey(
                I18n.bundle(),
                key
            );

        if (
            !entry ||
            typeof entry !== 'object'
        ) {

            return key;

        }

        const rule =
            new Intl.PluralRules(
                I18n.currentLanguage
            ).select(
                count
            );

        const template =
            entry[rule] ??
            entry.other ??
            '';

        return String(
            template
        ).replace(
            /\{\{\s*(.*?)\s*\}\}/g,
            (
                _,
                name
            ) => {

                if (
                    name === 'count'
                ) {

                    return count;

                }

                return variables[name]
                    ?? '';

            }
        );

    }

    /**
     * Alias for translate().
     *
     * @param {string} key
     * @param {Object} variables
     * @returns {string}
     */
    static t(
        key,
        variables = {}
    ) {

        return I18n.translate(
            key,
            variables
        );

    }
	
	    /**
     * Dispatches a language change event.
     *
     * @param {string} previousLanguage
     * @param {string} currentLanguage
     * @returns {void}
     */
    static dispatchLanguageChange(
        previousLanguage,
        currentLanguage
    ) {

        document.dispatchEvent(
            new CustomEvent(
                'language:change',
                {
                    detail: {
                        previousLanguage,
                        currentLanguage,
                        direction: I18n.direction(
                            currentLanguage
                        )
                    }
                }
            )
        );

    }

    /**
     * Changes the active language
     * and notifies listeners.
     *
     * @param {string} language
     * @returns {boolean}
     */
    static changeLanguage(
        language
    ) {

        if (!I18n.has(language)) {

            return false;

        }

        const previousLanguage =
            I18n.currentLanguage;

        if (
            previousLanguage === language
        ) {

            return true;

        }

        I18n.currentLanguage =
            language;

        I18n.dispatchLanguageChange(
            previousLanguage,
            language
        );

        return true;

    }

}

/**
 * Freeze helper methods.
 */
Object.freeze(
    I18n
);

export default I18n;

// END OF FILE
