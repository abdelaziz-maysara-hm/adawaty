/**
 * ============================================================================
 * Adawaty
 * Storage Service
 * ----------------------------------------------------------------------------
 * Safe wrapper around localStorage with JSON serialization,
 * namespacing and graceful fallback.
 * ============================================================================
 */

class StorageService {

    /**
     * @param {string} namespace
     */
    constructor(namespace = 'adawaty') {

        /**
         * Storage namespace.
         *
         * @type {string}
         */
        this.namespace = namespace;

        /**
         * Whether localStorage is available.
         *
         * @type {boolean}
         */
        this.available = this.checkAvailability();

    }

    /**
     * Checks whether localStorage is available.
     *
     * @returns {boolean}
     */
    checkAvailability() {

        try {

            const key = '__storage_test__';

            localStorage.setItem(key, key);

            localStorage.removeItem(key);

            return true;

        } catch {

            return false;

        }

    }

    /**
     * Builds the full storage key.
     *
     * @param {string} key
     * @returns {string}
     */
    buildKey(key) {

        return `${this.namespace}:${key}`;

    }

    /**
     * Stores a value.
     *
     * @param {string} key
     * @param {*} value
     * @returns {boolean}
     */
    set(key, value) {

        if (!this.available) {
            return false;
        }

        try {

            localStorage.setItem(
                this.buildKey(key),
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                '[Storage] Failed to save value.',
                error
            );

            return false;

        }

    }

    /**
     * Retrieves a value.
     *
     * @param {string} key
     * @param {*} defaultValue
     * @returns {*}
     */
    get(key, defaultValue = null) {

        if (!this.available) {
            return defaultValue;
        }

        try {

            const value = localStorage.getItem(
                this.buildKey(key)
            );

            if (value === null) {
                return defaultValue;
            }

            return JSON.parse(value);

        } catch (error) {

            console.error(
                '[Storage] Failed to read value.',
                error
            );

            return defaultValue;

        }

    }
	
	    /**
     * Removes a stored value.
     *
     * @param {string} key
     * @returns {boolean}
     */
    remove(key) {

        if (!this.available) {
            return false;
        }

        try {

            localStorage.removeItem(
                this.buildKey(key)
            );

            return true;

        } catch (error) {

            console.error(
                '[Storage] Failed to remove value.',
                error
            );

            return false;

        }

    }

    /**
     * Checks whether a key exists.
     *
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {

        if (!this.available) {
            return false;
        }

        return (
            localStorage.getItem(
                this.buildKey(key)
            ) !== null
        );

    }

    /**
     * Returns all keys within the current namespace.
     *
     * @returns {string[]}
     */
    keys() {

        if (!this.available) {
            return [];
        }

        const prefix = `${this.namespace}:`;
        const keys = [];

        for (let index = 0; index < localStorage.length; index++) {

            const key = localStorage.key(index);

            if (key && key.startsWith(prefix)) {

                keys.push(
                    key.slice(prefix.length)
                );

            }

        }

        return keys;

    }

    /**
     * Removes all values within the current namespace.
     *
     * @returns {void}
     */
    clear() {

        if (!this.available) {
            return;
        }

        for (const key of this.keys()) {

            localStorage.removeItem(
                this.buildKey(key)
            );

        }

    }

    /**
     * Returns the number of stored items.
     *
     * @returns {number}
     */
    size() {

        return this.keys().length;

    }

    /**
     * Destroys the service.
     *
     * @returns {void}
     */
    destroy() {

        this.clear();

        this.available = false;

    }

}

const storage = new StorageService();

export default storage;