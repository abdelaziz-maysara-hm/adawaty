/**
 * ============================================================================
 * Adawaty
 * Internationalization Service (i18n)
 * ============================================================================
 */

import storage from './storage.service.js';
import eventBus from '../core/event-bus.js';
import { STORAGE_KEYS } from '../utils/constants.js';

class I18nService {

    constructor() {
        this.language = storage.get(
            STORAGE_KEYS.LANGUAGE,
            document.documentElement.lang || 'en'
        );

        this.translations = {};
    }

    async init() {

        await this.load(this.language);

    }

    async load(language) {

        try {

            const response = await fetch(`/src/locales/${language}.json`);

            this.translations = await response.json();

            this.language = language;

            storage.set(
                STORAGE_KEYS.LANGUAGE,
                language
            );

            document.documentElement.lang = language;

            document.documentElement.dir =
                language === 'ar'
                    ? 'rtl'
                    : 'ltr';

            eventBus.emit(
                'languageChanged',
                language
            );

        } catch (error) {

            console.error(
                'Unable to load language',
                error
            );

        }

    }

    t(key, fallback = '') {

        const keys = key.split('.');

        let value = this.translations;

        for (const part of keys) {

            value = value?.[part];

            if (value === undefined) {

                return fallback || key;

            }

        }

        return value;

    }

    getLanguage() {

        return this.language;

    }

}

export default new I18nService();