/**
 * ============================================================================
 * Adawaty
 * Event Bus
 * ----------------------------------------------------------------------------
 * Lightweight event system used for communication
 * between independent modules.
 * ============================================================================
 */

/**
 * @typedef {Function} EventListener
 * @param {*} payload
 * @returns {void}
 */

class EventBus {

    constructor() {

        /**
         * Registered events.
         *
         * @type {Map<string, Set<EventListener>>}
         */
        this.events = new Map();

        /**
         * Enable debug logging.
         *
         * @type {boolean}
         */
        this.debug = false;

    }

    /**
     * Enable or disable debug mode.
     *
     * @param {boolean} enabled
     */
    setDebug(enabled) {

        this.debug = Boolean(enabled);

    }

    /**
     * Subscribe to an event.
     *
     * @param {string} event
     * @param {EventListener} listener
     * @returns {Function} Unsubscribe function.
     */
    on(event, listener) {

        if (typeof event !== 'string') {
            throw new TypeError(
                'Event name must be a string.'
            );
        }

        if (typeof listener !== 'function') {
            throw new TypeError(
                'Listener must be a function.'
            );
        }

        if (!this.events.has(event)) {

            this.events.set(
                event,
                new Set()
            );

        }

        this.events
            .get(event)
            .add(listener);

        return () => {

            this.off(
                event,
                listener
            );

        };

    }
	
	    /**
     * Subscribe to an event once.
     *
     * @param {string} event
     * @param {EventListener} listener
     * @returns {Function} Unsubscribe function.
     */
    once(event, listener) {

        const unsubscribe = this.on(
            event,
            (payload) => {

                unsubscribe();

                listener(payload);

            }
        );

        return unsubscribe;

    }

    /**
     * Remove an event listener.
     *
     * @param {string} event
     * @param {EventListener} listener
     * @returns {boolean}
     */
    off(event, listener) {

        if (!this.events.has(event)) {
            return false;
        }

        const listeners = this.events.get(event);

        const removed = listeners.delete(listener);

        if (listeners.size === 0) {
            this.events.delete(event);
        }

        return removed;

    }

    /**
     * Checks whether an event has listeners.
     *
     * @param {string} event
     * @returns {boolean}
     */
    has(event) {

        return (
            this.events.has(event) &&
            this.events.get(event).size > 0
        );

    }

    /**
     * Removes all listeners.
     *
     * @param {string} [event]
     */
    clear(event) {

        if (typeof event === 'string') {

            this.events.delete(event);

            return;

        }

        this.events.clear();

    }

    /**
     * Returns all registered event names.
     *
     * @returns {string[]}
     */
    getEvents() {

        return [
            ...this.events.keys()
        ];

    }
	
	    /**
     * Emits an event.
     *
     * @param {string} event
     * @param {*} [payload=null]
     */
    emit(event, payload = null) {

        if (typeof event !== 'string') {
            throw new TypeError(
                'Event name must be a string.'
            );
        }

        const listeners = this.events.get(event);

        if (listeners) {

            for (const listener of listeners) {

                try {

                    listener(payload);

                } catch (error) {

                    console.error(
                        `[EventBus] Listener failed for "${event}".`,
                        error
                    );

                }

            }

        }

        this.emitWildcard(event, payload);

        if (this.debug) {

            console.info(
                `[EventBus] ${event}`,
                payload
            );

        }

    }

    /**
     * Emits wildcard events.
     *
     * Example:
     * tool:bmi:calculated
     *
     * Will notify:
     * tool:*
     *
     * @private
     *
     * @param {string} event
     * @param {*} payload
     */
    emitWildcard(event, payload) {

        const separator = ':';

        if (!event.includes(separator)) {
            return;
        }

        const namespace =
            event.split(separator)[0];

        const wildcard =
            `${namespace}:*`;

        const listeners =
            this.events.get(wildcard);

        if (!listeners) {
            return;
        }

        for (const listener of listeners) {

            try {

                listener({
                    event,
                    payload
                });

            } catch (error) {

                console.error(
                    `[EventBus] Wildcard listener failed for "${wildcard}".`,
                    error
                );

            }

        }

    }

    /**
     * Returns number of listeners.
     *
     * @param {string} event
     * @returns {number}
     */
    listenerCount(event) {

        if (!this.events.has(event)) {
            return 0;
        }

        return this.events
            .get(event)
            .size;

    }
	
	    /**
     * Removes all listeners for an event.
     *
     * @param {string} event
     * @returns {void}
     */
    removeAllListeners(event) {

        if (typeof event !== 'string') {
            throw new TypeError(
                'Event name must be a string.'
            );
        }

        this.events.delete(event);

    }

    /**
     * Clears the entire event bus.
     *
     * @returns {void}
     */
    destroy() {

        this.events.clear();

        this.debug = false;

    }

}

const eventBus = new EventBus();

export default eventBus;