/**
 * @file Production-ready event bus for the Adawaty tool engine.
 * @module tools/core/tool-events
 */

/**
 * @typedef {'serial' | 'parallel'} ToolEventDispatchMode
 */

/**
 * @typedef {Object} ToolEventBusOptions
 * @property {string} [namespace='default'] Logical event bus namespace.
 * @property {boolean} [captureHistory=false] Whether emitted events are stored.
 * @property {number} [historyLimit=100] Maximum history entries.
 * @property {boolean} [throwListenerErrors=false] Re-throw listener failures.
 * @property {ToolEventDispatchMode} [dispatchMode='serial'] Default dispatch mode.
 */

/**
 * @typedef {Object} ToolEventListenerOptions
 * @property {boolean} [once=false] Remove the listener after its first invocation.
 * @property {number} [priority=0] Higher priorities run first.
 * @property {AbortSignal} [signal] Automatically unsubscribe when aborted.
 * @property {(payload: unknown, event: ToolEventRecord) => boolean} [filter]
 * @property {string} [label] Optional debugging label.
 */

/**
 * @typedef {Object} ToolEventEmitOptions
 * @property {ToolEventDispatchMode} [mode]
 * @property {AbortSignal} [signal]
 * @property {boolean} [stopOnError]
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @typedef {Object} ToolEventRecord
 * @property {string} id
 * @property {string} name
 * @property {string} namespace
 * @property {unknown} payload
 * @property {number} timestamp
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} ToolEventListenerRecord
 * @property {string} id
 * @property {string} event
 * @property {(payload: unknown, event: ToolEventRecord) => unknown | Promise<unknown>} handler
 * @property {boolean} once
 * @property {number} priority
 * @property {(payload: unknown, event: ToolEventRecord) => boolean} [filter]
 * @property {string} label
 * @property {number} createdAt
 * @property {number} calls
 * @property {() => void} [abortCleanup]
 */

/**
 * @typedef {Object} ToolEventResult
 * @property {ToolEventRecord} event
 * @property {unknown[]} values
 * @property {Error[]} errors
 * @property {number} listenerCount
 * @property {number} duration
 */

/**
 * @callback ToolEventMiddleware
 * @param {ToolEventRecord} event
 * @param {() => Promise<ToolEventResult>} next
 * @returns {Promise<ToolEventResult>}
 */

const DEFAULT_OPTIONS = Object.freeze({
    namespace: 'default',
    captureHistory: false,
    historyLimit: 100,
    throwListenerErrors: false,
    dispatchMode: 'serial',
});

let sequence = 0;

/**
 * Creates a stable unique identifier.
 *
 * @param {string} prefix
 * @returns {string}
 */
function createId(prefix) {
    sequence += 1;

    return `${prefix}-${Date.now().toString(36)}-${sequence.toString(36)}`;
}

/**
 * Returns a monotonic timestamp where available.
 *
 * @returns {number}
 */
function performanceNow() {
    return typeof performance !== 'undefined' && typeof performance.now === 'function'
        ? performance.now()
        : Date.now();
}

/**
 * Normalizes and validates an event name.
 *
 * @param {unknown} event
 * @returns {string}
 */
function normalizeEventName(event) {
    if (typeof event !== 'string') {
        throw new TypeError('Event name must be a string.');
    }

    const normalized = event.trim();

    if (normalized.length === 0) {
        throw new TypeError('Event name cannot be empty.');
    }

    if (normalized.includes(' ')) {
        throw new TypeError('Event name cannot contain spaces.');
    }

    return normalized;
}

/**
 * Normalizes and validates a namespace.
 *
 * @param {unknown} namespace
 * @returns {string}
 */
function normalizeNamespace(namespace) {
    if (typeof namespace !== 'string') {
        throw new TypeError('Event namespace must be a string.');
    }

    const normalized = namespace.trim();

    if (normalized.length === 0) {
        throw new TypeError('Event namespace cannot be empty.');
    }

    return normalized;
}

/**
 * Validates event bus options.
 *
 * @param {ToolEventBusOptions} [options]
 * @returns {Required<ToolEventBusOptions>}
 */
function normalizeOptions(options = {}) {
    const namespace = normalizeNamespace(
        options.namespace ?? DEFAULT_OPTIONS.namespace,
    );
    const historyLimit = options.historyLimit ?? DEFAULT_OPTIONS.historyLimit;
    const dispatchMode = options.dispatchMode ?? DEFAULT_OPTIONS.dispatchMode;

    if (!Number.isInteger(historyLimit) || historyLimit <= 0) {
        throw new TypeError('historyLimit must be a positive integer.');
    }

    if (dispatchMode !== 'serial' && dispatchMode !== 'parallel') {
        throw new TypeError('dispatchMode must be "serial" or "parallel".');
    }

    return {
        namespace,
        captureHistory: options.captureHistory ?? DEFAULT_OPTIONS.captureHistory,
        historyLimit,
        throwListenerErrors:
            options.throwListenerErrors ?? DEFAULT_OPTIONS.throwListenerErrors,
        dispatchMode,
    };
}

/**
 * Returns whether a pattern matches an event name.
 *
 * Supported forms:
 * - exact: `tool:ready`
 * - global wildcard: `*`
 * - namespace wildcard: `tool:*`
 *
 * @param {string} pattern
 * @param {string} event
 * @returns {boolean}
 */
function matchesEvent(pattern, event) {
    if (pattern === '*' || pattern === event) {
        return true;
    }

    if (!pattern.endsWith('*')) {
        return false;
    }

    return event.startsWith(pattern.slice(0, -1));
}

/**
 * Converts any thrown value into an Error.
 *
 * @param {unknown} value
 * @returns {Error}
 */
function toError(value) {
    return value instanceof Error ? value : new Error(String(value));
}

/**
 * Composes middleware around an event dispatcher.
 *
 * @param {ToolEventMiddleware[]} middleware
 * @param {ToolEventRecord} event
 * @param {() => Promise<ToolEventResult>} dispatch
 * @returns {Promise<ToolEventResult>}
 */
function runMiddleware(middleware, event, dispatch) {
    let index = -1;

    const invoke = async (position) => {
        if (position <= index) {
            throw new Error('Event middleware called next() more than once.');
        }

        index = position;
        const current = middleware[position];

        if (!current) {
            return dispatch();
        }

        return current(event, () => invoke(position + 1));
    };

    return invoke(0);
}

/**
 * Production-ready publish/subscribe event bus.
 */
class ToolEvents {
    /** @type {Map<string, ToolEvents>} */
    static #registry = new Map();

    /** @type {Required<ToolEventBusOptions>} */
    #options;

    /** @type {Map<string, ToolEventListenerRecord[]>} */
    #listeners = new Map();

    /** @type {Map<string, ToolEventListenerRecord[]>} */
    #matchingListenerCache = new Map();

    /** @type {ToolEventMiddleware[]} */
    #middleware = [];

    /** @type {ToolEventRecord[]} */
    #history = [];

    /** @type {boolean} */
    #destroyed = false;

    /** @type {number} */
    #emitted = 0;

    /** @type {number} */
    #delivered = 0;

    /** @type {number} */
    #failures = 0;

    /**
     * @param {ToolEventBusOptions} [options]
     */
    constructor(options = {}) {
        this.#options = normalizeOptions(options);
    }

    /**
     * Namespace assigned to this event bus.
     *
     * @returns {string}
     */
    get namespace() {
        return this.#options.namespace;
    }

    /**
     * Whether the event bus has been destroyed.
     *
     * @returns {boolean}
     */
    get destroyed() {
        return this.#destroyed;
    }

    /**
     * Registers an event listener.
     *
     * @param {string} event
     * @param {(payload: unknown, event: ToolEventRecord) => unknown | Promise<unknown>} handler
     * @param {ToolEventListenerOptions} [options]
     * @returns {() => boolean} Unsubscribe callback.
     */
    on(event, handler, options = {}) {
        this.#assertActive();

        const normalizedEvent = normalizeEventName(event);

        if (typeof handler !== 'function') {
            throw new TypeError('Event listener must be a function.');
        }

        const priority = options.priority ?? 0;

        if (!Number.isFinite(priority)) {
            throw new TypeError('Listener priority must be a finite number.');
        }

        /** @type {ToolEventListenerRecord} */
        const record = {
            id: createId('listener'),
            event: normalizedEvent,
            handler,
            once: options.once ?? false,
            priority,
            filter: options.filter,
            label: options.label?.trim() || handler.name || 'anonymous',
            createdAt: Date.now(),
            calls: 0,
        };

        if (record.filter !== undefined && typeof record.filter !== 'function') {
            throw new TypeError('Listener filter must be a function.');
        }

        const listeners = this.#listeners.get(normalizedEvent) ?? [];

        listeners.push(record);
        listeners.sort(
            (first, second) =>
                second.priority - first.priority
                || first.createdAt - second.createdAt,
        );
        this.#listeners.set(normalizedEvent, listeners);
        this.#invalidateMatchingListenerCache();

        if (options.signal) {
            const unsubscribe = () => {
                this.off(normalizedEvent, record.id);
            };

            if (options.signal.aborted) {
                unsubscribe();
            } else {
                options.signal.addEventListener('abort', unsubscribe, { once: true });
                record.abortCleanup = () => {
                    options.signal?.removeEventListener('abort', unsubscribe);
                };
            }
        }

        return () => this.off(normalizedEvent, record.id);
    }

    /**
     * Registers a one-time listener.
     *
     * @param {string} event
     * @param {(payload: unknown, event: ToolEventRecord) => unknown | Promise<unknown>} handler
     * @param {Omit<ToolEventListenerOptions, 'once'>} [options]
     * @returns {() => boolean}
     */
    once(event, handler, options = {}) {
        return this.on(event, handler, { ...options, once: true });
    }

    /**
     * Removes listeners by id or function reference.
     *
     * @param {string} event
     * @param {string | Function} listener
     * @returns {boolean}
     */
    off(event, listener) {
        this.#assertActive();

        const normalizedEvent = normalizeEventName(event);
        const listeners = this.#listeners.get(normalizedEvent);

        if (!listeners) {
            return false;
        }

        let removed = false;
        const remaining = [];

        for (const record of listeners) {
            const matches =
                typeof listener === 'string'
                    ? record.id === listener
                    : record.handler === listener;

            if (matches) {
                record.abortCleanup?.();
                removed = true;
            } else {
                remaining.push(record);
            }
        }

        if (remaining.length === 0) {
            this.#listeners.delete(normalizedEvent);
        } else {
            this.#listeners.set(normalizedEvent, remaining);
        }

        if (removed) {
            this.#invalidateMatchingListenerCache();
        }

        return removed;
    }

    /**
     * Emits an event.
     *
     * @param {string} event
     * @param {unknown} [payload]
     * @param {ToolEventEmitOptions} [options]
     * @returns {Promise<ToolEventResult>}
     */
    async emit(event, payload, options = {}) {
        this.#assertActive();

        const normalizedEvent = normalizeEventName(event);
        const mode = options.mode ?? this.#options.dispatchMode;

        if (mode !== 'serial' && mode !== 'parallel') {
            throw new TypeError('Event mode must be "serial" or "parallel".');
        }

        if (options.signal?.aborted) {
            throw options.signal.reason
                ?? new DOMException('Event emission aborted.', 'AbortError');
        }

        /** @type {ToolEventRecord} */
        const record = Object.freeze({
            id: createId('event'),
            name: normalizedEvent,
            namespace: this.namespace,
            payload,
            timestamp: Date.now(),
            metadata: Object.freeze({ ...(options.metadata ?? {}) }),
        });

        this.#emitted += 1;
        this.#capture(record);

        return runMiddleware(
            this.#middleware,
            record,
            () => this.#dispatch(record, mode, options),
        );
    }

    /**
     * Emits an event without awaiting completion.
     *
     * @param {string} event
     * @param {unknown} [payload]
     * @param {ToolEventEmitOptions} [options]
     * @returns {void}
     */
    publish(event, payload, options = {}) {
        void this.emit(event, payload, options).catch((error) => {
            if (this.#options.throwListenerErrors) {
                queueMicrotask(() => {
                    throw error;
                });
            }
        });
    }

    /**
     * Adds middleware to the emission pipeline.
     *
     * @param {ToolEventMiddleware} middleware
     * @returns {() => boolean}
     */
    use(middleware) {
        this.#assertActive();

        if (typeof middleware !== 'function') {
            throw new TypeError('Event middleware must be a function.');
        }

        this.#middleware.push(middleware);

        return () => {
            const index = this.#middleware.indexOf(middleware);

            if (index === -1) {
                return false;
            }

            this.#middleware.splice(index, 1);

            return true;
        };
    }

    /**
     * Waits for the next matching event.
     *
     * @param {string} event
     * @param {{signal?: AbortSignal, timeout?: number, filter?: ToolEventListenerOptions['filter']}} [options]
     * @returns {Promise<ToolEventRecord>}
     */
    waitFor(event, options = {}) {
        this.#assertActive();

        const timeout = options.timeout ?? 0;

        if (!Number.isFinite(timeout) || timeout < 0) {
            throw new TypeError('waitFor timeout must be non-negative.');
        }

        if (options.signal?.aborted) {
            return Promise.reject(
                options.signal.reason
                ?? new DOMException('Waiting aborted.', 'AbortError'),
            );
        }

        return new Promise((resolve, reject) => {
            /** @type {ReturnType<typeof setTimeout> | null} */
            let timer = null;
            let settled = false;
            let unsubscribe = () => false;

            const cleanup = () => {
                unsubscribe();

                if (timer !== null) {
                    clearTimeout(timer);
                    timer = null;
                }

                options.signal?.removeEventListener('abort', onAbort);
            };

            const settle = (callback, value) => {
                if (settled) {
                    return;
                }

                settled = true;
                cleanup();
                callback(value);
            };

            const onAbort = () => {
                settle(
                    reject,
                    options.signal?.reason
                    ?? new DOMException('Waiting aborted.', 'AbortError'),
                );
            };

            unsubscribe = this.once(
                event,
                (_payload, record) => settle(resolve, record),
                { filter: options.filter },
            );

            if (timeout > 0) {
                timer = setTimeout(() => {
                    settle(
                        reject,
                        new Error(
                            `Timed out waiting for event "${event}" after ${timeout} ms.`,
                        ),
                    );
                }, timeout);
            }

            options.signal?.addEventListener('abort', onAbort, { once: true });
        });
    }

    /**
     * Removes all listeners for one event or all events.
     *
     * @param {string} [event]
     * @returns {number} Number of removed listeners.
     */
    clear(event) {
        this.#assertActive();

        if (event !== undefined) {
            const normalizedEvent = normalizeEventName(event);
            const listeners = this.#listeners.get(normalizedEvent) ?? [];

            for (const listener of listeners) {
                listener.abortCleanup?.();
            }

            this.#listeners.delete(normalizedEvent);

            if (listeners.length > 0) {
                this.#invalidateMatchingListenerCache();
            }

            return listeners.length;
        }

        let count = 0;

        for (const listeners of this.#listeners.values()) {
            count += listeners.length;

            for (const listener of listeners) {
                listener.abortCleanup?.();
            }
        }

        this.#listeners.clear();
        this.#invalidateMatchingListenerCache();

        return count;
    }

    /**
     * Returns listener count for one event or the entire bus.
     *
     * @param {string} [event]
     * @returns {number}
     */
    listenerCount(event) {
        this.#assertActive();

        if (event !== undefined) {
            return (this.#listeners.get(normalizeEventName(event)) ?? []).length;
        }

        let count = 0;

        for (const listeners of this.#listeners.values()) {
            count += listeners.length;
        }

        return count;
    }

    /**
     * Returns registered event patterns.
     *
     * @returns {string[]}
     */
    eventNames() {
        this.#assertActive();

        return [...this.#listeners.keys()].sort();
    }

    /**
     * Returns listener descriptors without exposing functions.
     *
     * @param {string} [event]
     * @returns {Array<Record<string, unknown>>}
     */
    inspect(event) {
        this.#assertActive();

        const entries = event === undefined
            ? [...this.#listeners.entries()]
            : [[
                normalizeEventName(event),
                this.#listeners.get(normalizeEventName(event)) ?? [],
            ]];

        return entries.flatMap(([name, listeners]) =>
            listeners.map((listener) => ({
                id: listener.id,
                event: name,
                once: listener.once,
                priority: listener.priority,
                label: listener.label,
                createdAt: listener.createdAt,
                calls: listener.calls,
            })),
        );
    }

    /**
     * Returns captured history.
     *
     * @param {{event?: string, limit?: number}} [options]
     * @returns {ToolEventRecord[]}
     */
    history(options = {}) {
        this.#assertActive();

        const limit = options.limit ?? this.#options.historyLimit;

        if (!Number.isInteger(limit) || limit <= 0) {
            throw new TypeError('History limit must be a positive integer.');
        }

        const filtered = options.event
            ? this.#history.filter((record) =>
                matchesEvent(normalizeEventName(options.event), record.name),
            )
            : this.#history;

        return filtered.slice(-limit);
    }

    /**
     * Clears captured history.
     *
     * @returns {number}
     */
    clearHistory() {
        this.#assertActive();

        const count = this.#history.length;

        this.#history.length = 0;

        return count;
    }

    /**
     * Returns event bus statistics.
     *
     * @returns {Readonly<Record<string, number>>}
     */
    stats() {
        return Object.freeze({
            emitted: this.#emitted,
            delivered: this.#delivered,
            failures: this.#failures,
            listeners: this.listenerCount(),
            events: this.#listeners.size,
            middleware: this.#middleware.length,
            history: this.#history.length,
        });
    }

    /**
     * Destroys the event bus.
     *
     * @returns {void}
     */
    destroy() {
        if (this.#destroyed) {
            return;
        }

        this.clear();
        this.#middleware.length = 0;
        this.#history.length = 0;
        this.#destroyed = true;
        ToolEvents.#registry.delete(this.namespace);
    }

    /**
     * Dispatches a record to matching listeners.
     *
     * @param {ToolEventRecord} event
     * @param {ToolEventDispatchMode} mode
     * @param {ToolEventEmitOptions} options
     * @returns {Promise<ToolEventResult>}
     */
    async #dispatch(event, mode, options) {
        const startedAt = performanceNow();
        const listeners = this.#matchingListeners(event.name);
        const values = [];
        const errors = [];

        const execute = async (listener) => {
            if (options.signal?.aborted) {
                throw options.signal.reason
                    ?? new DOMException('Event emission aborted.', 'AbortError');
            }

            if (listener.filter && !listener.filter(event.payload, event)) {
                return undefined;
            }

            try {
                listener.calls += 1;
                const value = await listener.handler(event.payload, event);

                this.#delivered += 1;

                return value;
            } catch (error) {
                const normalizedError = toError(error);

                this.#failures += 1;
                errors.push(normalizedError);

                if (
                    options.stopOnError
                    || this.#options.throwListenerErrors
                ) {
                    throw normalizedError;
                }

                return undefined;
            } finally {
                if (listener.once) {
                    this.off(listener.event, listener.id);
                }
            }
        };

        if (mode === 'parallel') {
            const settled = await Promise.allSettled(
                listeners.map((listener) => execute(listener)),
            );

            for (const result of settled) {
                if (result.status === 'fulfilled') {
                    values.push(result.value);
                } else {
                    const error = toError(result.reason);

                    if (!errors.includes(error)) {
                        errors.push(error);
                    }

                    if (
                        options.stopOnError
                        || this.#options.throwListenerErrors
                    ) {
                        throw error;
                    }
                }
            }
        } else {
            for (const listener of listeners) {
                values.push(await execute(listener));
            }
        }

        return Object.freeze({
            event,
            values,
            errors,
            listenerCount: listeners.length,
            duration: performanceNow() - startedAt,
        });
    }

    /**
     * Collects listeners matching an event.
     *
     * @param {string} event
     * @returns {ToolEventListenerRecord[]}
     */
    #matchingListeners(event) {
        const cached = this.#matchingListenerCache.get(event);

        if (cached) {
            return cached;
        }

        const matched = [];

        for (const [pattern, listeners] of this.#listeners) {
            if (matchesEvent(pattern, event)) {
                matched.push(...listeners);
            }
        }

        matched.sort(
            (first, second) =>
                second.priority - first.priority
                || first.createdAt - second.createdAt,
        );

        this.#matchingListenerCache.set(event, matched);

        return matched;
    }

    /**
     * Invalidates cached listener plans after subscription changes.
     *
     * @returns {void}
     */
    #invalidateMatchingListenerCache() {
        this.#matchingListenerCache.clear();
    }

    /**
     * Captures event history if enabled.
     *
     * @param {ToolEventRecord} event
     * @returns {void}
     */
    #capture(event) {
        if (!this.#options.captureHistory) {
            return;
        }

        this.#history.push(event);

        const overflow = this.#history.length - this.#options.historyLimit;

        if (overflow > 0) {
            this.#history.splice(0, overflow);
        }
    }

    /**
     * Ensures the instance is still active.
     *
     * @returns {void}
     */
    #assertActive() {
        if (this.#destroyed) {
            throw new Error(`ToolEvents "${this.namespace}" has been destroyed.`);
        }
    }

    /**
     * Creates a standalone event bus.
     *
     * @param {ToolEventBusOptions} [options]
     * @returns {ToolEvents}
     */
    static create(options = {}) {
        return new ToolEvents(options);
    }

    /**
     * Returns a shared namespaced event bus.
     *
     * @param {string} namespace
     * @param {Omit<ToolEventBusOptions, 'namespace'>} [options]
     * @returns {ToolEvents}
     */
    static namespace(namespace, options = {}) {
        const normalizedNamespace = normalizeNamespace(namespace);
        const existing = ToolEvents.#registry.get(normalizedNamespace);

        if (existing && !existing.destroyed) {
            return existing;
        }

        const events = new ToolEvents({
            ...options,
            namespace: normalizedNamespace,
        });

        ToolEvents.#registry.set(normalizedNamespace, events);

        return events;
    }

    /**
     * Returns a shared namespace if it exists.
     *
     * @param {string} namespace
     * @returns {ToolEvents | null}
     */
    static getNamespace(namespace) {
        const normalizedNamespace = normalizeNamespace(namespace);
        const events = ToolEvents.#registry.get(normalizedNamespace);

        return events && !events.destroyed ? events : null;
    }

    /**
     * Returns registered namespaces.
     *
     * @returns {string[]}
     */
    static namespaces() {
        return [...ToolEvents.#registry.entries()]
            .filter(([, events]) => !events.destroyed)
            .map(([namespace]) => namespace)
            .sort();
    }

    /**
     * Destroys one shared namespace.
     *
     * @param {string} namespace
     * @returns {boolean}
     */
    static destroyNamespace(namespace) {
        const events = ToolEvents.getNamespace(namespace);

        if (!events) {
            return false;
        }

        events.destroy();

        return true;
    }

    /**
     * Destroys all shared event buses.
     *
     * @returns {void}
     */
    static destroyAll() {
        for (const events of [...ToolEvents.#registry.values()]) {
            events.destroy();
        }

        ToolEvents.#registry.clear();
    }
}

Object.freeze(ToolEvents.prototype);

export {
    DEFAULT_OPTIONS,
    ToolEvents,
    createId,
    matchesEvent,
    normalizeEventName,
    normalizeNamespace,
    normalizeOptions,
    runMiddleware,
};

export default ToolEvents;

// END OF FILE
