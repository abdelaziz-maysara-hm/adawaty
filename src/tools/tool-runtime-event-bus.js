/**
 * @file Runtime event bus and messaging infrastructure.
 * @module tools/tool-runtime-event-bus
 */

const DEFAULT_HISTORY_LIMIT = 500;
const DEFAULT_DEAD_LETTER_LIMIT = 100;
const DEFAULT_MAX_PENDING = 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 5000;

/**
 * Runtime event bus error.
 */
class ToolEventError extends Error {
    /**
     * @param {string} message
     * @param {{
     *   code?: string,
     *   eventName?: string,
     *   listenerId?: string,
     *   cause?: unknown
     * }} [options]
     */
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolEventError';
        this.code = options.code ?? 'TOOL_EVENT_FAILED';
        this.eventName = options.eventName ?? '';
        this.listenerId = options.listenerId ?? '';
    }
}

/**
 * Ordered runtime event bus with scoped subscriptions, middleware and diagnostics.
 */
class ToolRuntimeEventBus {
    /**
     * @param {{
     *   now?: () => number,
     *   historyLimit?: number,
     *   deadLetterLimit?: number,
     *   maxPending?: number,
     *   requestTimeoutMs?: number,
     *   reporter?: (entry: Readonly<Record<string, unknown>>) => void|Promise<void>
     * }} [options]
     */
    constructor(options = {}) {
        this.now = options.now ?? (() => Date.now());
        this.historyLimit = positiveInteger(
            options.historyLimit,
            DEFAULT_HISTORY_LIMIT,
            'historyLimit',
        );
        this.deadLetterLimit = positiveInteger(
            options.deadLetterLimit,
            DEFAULT_DEAD_LETTER_LIMIT,
            'deadLetterLimit',
        );
        this.maxPending = positiveInteger(
            options.maxPending,
            DEFAULT_MAX_PENDING,
            'maxPending',
        );
        this.requestTimeoutMs = positiveInteger(
            options.requestTimeoutMs,
            DEFAULT_REQUEST_TIMEOUT_MS,
            'requestTimeoutMs',
        );
        this.reporter =
            options.reporter === undefined
                ? null
                : requireFunction(options.reporter, 'reporter');

        /** @type {Map<string, Map<string, Record<string, unknown>>>} */
        this.listeners = new Map();

        /** @type {Array<Readonly<Record<string, unknown>>>} */
        this.middleware = [];

        /** @type {Array<Readonly<Record<string, unknown>>>} */
        this.history = [];

        /** @type {Array<Readonly<Record<string, unknown>>>} */
        this.deadLetters = [];

        /** @type {Map<string, Readonly<Record<string, unknown>>>} */
        this.replay = new Map();

        this.sequence = 0;
        this.pending = 0;
        this.publishedCount = 0;
        this.deliveredCount = 0;
        this.failedCount = 0;
        this.cancelledCount = 0;
    }

    /**
     * Adds event middleware.
     *
     * @param {(event: Readonly<Record<string, unknown>>, next: (event?: Readonly<Record<string, unknown>>) => Promise<Readonly<Record<string, unknown>>>) => Promise<Readonly<Record<string, unknown>>>|Readonly<Record<string, unknown>>} middleware
     * @param {{priority?: number, ownerId?: string}} [options]
     * @returns {() => boolean}
     */
    use(middleware, options = {}) {
        requireFunction(middleware, 'middleware');
        const entry = Object.freeze({
            id: `middleware:${++this.sequence}`,
            middleware,
            priority: normalizePriority(options.priority),
            ownerId: optionalText(options.ownerId),
        });

        this.middleware = Object.freeze(
            [...this.middleware, entry].sort(
                (left, right) => right.priority - left.priority,
            ),
        );

        return () => {
            const before = this.middleware.length;
            this.middleware = Object.freeze(
                this.middleware.filter((item) => item.id !== entry.id),
            );
            return this.middleware.length !== before;
        };
    }

    /**
     * Subscribes to an event name or wildcard pattern.
     *
     * Supported wildcard forms:
     * - `*`
     * - `namespace.*`
     *
     * @param {string} eventName
     * @param {(event: Readonly<Record<string, unknown>>) => unknown|Promise<unknown>} listener
     * @param {{
     *   once?: boolean,
     *   priority?: number,
     *   ownerId?: string,
     *   filter?: (event: Readonly<Record<string, unknown>>) => boolean|Promise<boolean>
     * }} [options]
     * @returns {Readonly<Record<string, unknown>>}
     */
    subscribe(eventName, listener, options = {}) {
        const name = normalizeEventPattern(eventName);
        requireFunction(listener, 'listener');

        if (
            options.filter !== undefined &&
            typeof options.filter !== 'function'
        ) {
            throw new TypeError('filter must be a function.');
        }

        const entry = {
            id: `listener:${++this.sequence}`,
            eventName: name,
            listener,
            filter: options.filter ?? null,
            once: options.once === true,
            priority: normalizePriority(options.priority),
            ownerId: optionalText(options.ownerId),
            createdAt: this.now(),
            deliveredCount: 0,
        };

        const bucket = this.listeners.get(name) ?? new Map();
        bucket.set(entry.id, entry);
        this.listeners.set(name, bucket);
        this.record('subscribed', {
            eventName: name,
            listenerId: entry.id,
            ownerId: entry.ownerId,
        });

        return Object.freeze({
            id: entry.id,
            eventName: name,
            ownerId: entry.ownerId,
            unsubscribe: () => this.unsubscribe(entry.id),
        });
    }

    /**
     * Subscribes for one delivery.
     */
    once(eventName, listener, options = {}) {
        return this.subscribe(eventName, listener, {
            ...options,
            once: true,
        });
    }

    /**
     * Removes one listener by id.
     *
     * @param {string} listenerId
     * @returns {boolean}
     */
    unsubscribe(listenerId) {
        const id = String(listenerId ?? '');

        for (const [eventName, bucket] of this.listeners) {
            const entry = bucket.get(id);

            if (!entry) {
                continue;
            }

            bucket.delete(id);

            if (bucket.size === 0) {
                this.listeners.delete(eventName);
            }

            this.record('unsubscribed', {
                eventName,
                listenerId: id,
                ownerId: entry.ownerId,
            });
            return true;
        }

        return false;
    }

    /**
     * Removes all listeners and middleware owned by one owner.
     *
     * @param {string} ownerId
     * @returns {Readonly<Record<string, unknown>>}
     */
    unsubscribeOwner(ownerId) {
        const id = requiredText(ownerId, 'ownerId');
        let listenersRemoved = 0;

        for (const [eventName, bucket] of this.listeners) {
            for (const [listenerId, entry] of bucket) {
                if (entry.ownerId === id) {
                    bucket.delete(listenerId);
                    listenersRemoved += 1;
                }
            }

            if (bucket.size === 0) {
                this.listeners.delete(eventName);
            }
        }

        const middlewareBefore = this.middleware.length;
        this.middleware = Object.freeze(
            this.middleware.filter((entry) => entry.ownerId !== id),
        );

        const result = Object.freeze({
            ownerId: id,
            listenersRemoved,
            middlewareRemoved:
                middlewareBefore - this.middleware.length,
        });

        this.record('owner-unsubscribed', result);
        return result;
    }

    /**
     * Publishes an event and awaits ordered listener delivery.
     *
     * @param {string} eventName
     * @param {unknown} payload
     * @param {{
     *   source?: string,
     *   traceId?: string,
     *   correlationId?: string,
     *   metadata?: Record<string, unknown>,
     *   replay?: boolean,
     *   cancellable?: boolean,
     *   signal?: AbortSignal
     * }} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async publish(eventName, payload, options = {}) {
        if (this.pending >= this.maxPending) {
            throw new ToolEventError(
                'Runtime event backpressure limit was reached.',
                {
                    code: 'TOOL_EVENT_BACKPRESSURE',
                    eventName: String(eventName ?? ''),
                },
            );
        }

        const event = createEvent(
            eventName,
            payload,
            options,
            this.now,
            ++this.sequence,
        );

        if (options.signal?.aborted) {
            throw new ToolEventError(
                `Event "${event.name}" was aborted.`,
                {
                    code: 'TOOL_EVENT_ABORTED',
                    eventName: event.name,
                    cause: options.signal.reason,
                },
            );
        }

        this.pending += 1;
        this.publishedCount += 1;

        try {
            const processed = await this.runMiddleware(event);

            if (processed.cancelled) {
                this.cancelledCount += 1;
                this.record('cancelled', processed);

                return Object.freeze({
                    event: processed,
                    deliveredCount: 0,
                    failedCount: 0,
                    cancelled: true,
                    results: Object.freeze([]),
                });
            }

            if (processed.replay) {
                this.replay.set(processed.name, processed);
            }

            const listeners = this.resolveListeners(processed.name);
            const results = [];
            let failedCount = 0;

            for (const entry of listeners) {
                if (options.signal?.aborted) {
                    throw new ToolEventError(
                        `Event "${processed.name}" was aborted.`,
                        {
                            code: 'TOOL_EVENT_ABORTED',
                            eventName: processed.name,
                            cause: options.signal.reason,
                        },
                    );
                }

                if (
                    entry.filter &&
                    !(await entry.filter(processed))
                ) {
                    continue;
                }

                try {
                    const value = await entry.listener(processed);
                    entry.deliveredCount += 1;
                    this.deliveredCount += 1;
                    results.push(
                        Object.freeze({
                            listenerId: entry.id,
                            status: 'fulfilled',
                            value,
                        }),
                    );
                } catch (error) {
                    failedCount += 1;
                    this.failedCount += 1;

                    const failure = Object.freeze({
                        listenerId: entry.id,
                        status: 'rejected',
                        error,
                    });
                    results.push(failure);
                    this.addDeadLetter(processed, entry, error);
                } finally {
                    if (entry.once) {
                        this.unsubscribe(entry.id);
                    }
                }
            }

            this.record('published', {
                ...processed,
                deliveredCount:
                    results.length - failedCount,
                failedCount,
            });

            return Object.freeze({
                event: processed,
                deliveredCount:
                    results.length - failedCount,
                failedCount,
                cancelled: false,
                results: Object.freeze(results),
            });
        } finally {
            this.pending -= 1;
        }
    }

    /**
     * Alias for asynchronous publish.
     */
    publishAsync(eventName, payload, options = {}) {
        return this.publish(eventName, payload, options);
    }

    /**
     * Publishes without awaiting delivery.
     *
     * @returns {Readonly<Record<string, unknown>>}
     */
    defer(eventName, payload, options = {}) {
        const scheduledAt = this.now();

        queueMicrotask(() => {
            this.publish(eventName, payload, options).catch((error) => {
                this.addDeadLetter(
                    createEvent(
                        eventName,
                        payload,
                        options,
                        this.now,
                        ++this.sequence,
                    ),
                    null,
                    error,
                );
            });
        });

        return Object.freeze({
            eventName: normalizeEventName(eventName),
            scheduledAt,
        });
    }

    /**
     * Request/response helper.
     *
     * Responders subscribe to `${eventName}:request` and publish
     * `${eventName}:response` using the same correlation id.
     */
    async request(eventName, payload, options = {}) {
        const name = normalizeEventName(eventName);
        const correlationId =
            optionalText(options.correlationId) ||
            `correlation:${this.now()}:${++this.sequence}`;
        const timeoutMs = positiveInteger(
            options.timeoutMs,
            this.requestTimeoutMs,
            'timeoutMs',
        );

        return new Promise((resolve, reject) => {
            let timer = null;

            const subscription = this.subscribe(
                `${name}:response`,
                (event) => {
                    if (event.correlationId !== correlationId) {
                        return;
                    }

                    clearTimeout(timer);
                    subscription.unsubscribe();
                    resolve(event.payload);
                },
                {
                    ownerId: options.ownerId,
                },
            );

            timer = setTimeout(() => {
                subscription.unsubscribe();
                reject(
                    new ToolEventError(
                        `Event request "${name}" timed out.`,
                        {
                            code: 'TOOL_EVENT_REQUEST_TIMEOUT',
                            eventName: name,
                        },
                    ),
                );
            }, timeoutMs);

            this.publish(`${name}:request`, payload, {
                ...options,
                correlationId,
            }).catch((error) => {
                clearTimeout(timer);
                subscription.unsubscribe();
                reject(error);
            });
        });
    }

    /**
     * Returns the most recent replayable event by name.
     */
    getReplay(eventName) {
        return this.replay.get(normalizeEventName(eventName)) ?? null;
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    getSnapshot() {
        let listenerCount = 0;

        for (const bucket of this.listeners.values()) {
            listenerCount += bucket.size;
        }

        return Object.freeze({
            listenerCount,
            eventPatternCount: this.listeners.size,
            middlewareCount: this.middleware.length,
            replayCount: this.replay.size,
            pendingCount: this.pending,
            publishedCount: this.publishedCount,
            deliveredCount: this.deliveredCount,
            failedCount: this.failedCount,
            cancelledCount: this.cancelledCount,
            deadLetterCount: this.deadLetters.length,
            maxPending: this.maxPending,
        });
    }

    getHistory() {
        return Object.freeze([...this.history]);
    }

    clearHistory() {
        const count = this.history.length;
        this.history = [];
        return count;
    }

    getDeadLetters() {
        return Object.freeze([...this.deadLetters]);
    }

    clearDeadLetters() {
        const count = this.deadLetters.length;
        this.deadLetters = [];
        return count;
    }

    clear() {
        this.listeners.clear();
        this.middleware = Object.freeze([]);
        this.replay.clear();
        this.clearHistory();
        this.clearDeadLetters();
    }

    /**
     * @private
     */
    async runMiddleware(event) {
        const pipeline = this.middleware;

        const dispatch = async (index, current) => {
            if (index >= pipeline.length) {
                return current;
            }

            const entry = pipeline[index];

            return entry.middleware(
                current,
                (nextEvent = current) =>
                    dispatch(index + 1, normalizeEventObject(nextEvent)),
            );
        };

        const result = await dispatch(0, event);
        return normalizeEventObject(result);
    }

    /**
     * @private
     */
    resolveListeners(eventName) {
        const matched = [];

        for (const [pattern, bucket] of this.listeners) {
            if (!matchesPattern(pattern, eventName)) {
                continue;
            }

            matched.push(...bucket.values());
        }

        return matched.sort((left, right) => {
            if (right.priority !== left.priority) {
                return right.priority - left.priority;
            }

            return left.createdAt - right.createdAt;
        });
    }

    /**
     * @private
     */
    record(type, details) {
        const entry = Object.freeze({
            type,
            timestamp: this.now(),
            ...details,
        });

        this.history.push(entry);

        if (this.history.length > this.historyLimit) {
            this.history.splice(
                0,
                this.history.length - this.historyLimit,
            );
        }

        if (this.reporter) {
            Promise.resolve(this.reporter(entry)).catch(() => undefined);
        }
    }

    /**
     * @private
     */
    addDeadLetter(event, listener, error) {
        const entry = Object.freeze({
            event,
            listenerId: listener?.id ?? '',
            ownerId: listener?.ownerId ?? '',
            error: normalizeError(error),
            timestamp: this.now(),
        });

        this.deadLetters.push(entry);

        if (this.deadLetters.length > this.deadLetterLimit) {
            this.deadLetters.splice(
                0,
                this.deadLetters.length - this.deadLetterLimit,
            );
        }

        this.record('dead-lettered', {
            eventName: event.name,
            listenerId: entry.listenerId,
            ownerId: entry.ownerId,
            error: entry.error,
        });
    }
}

function createEvent(name, payload, options, now, sequence) {
    return Object.freeze({
        id: `event:${now()}:${sequence}`,
        name: normalizeEventName(name),
        namespace: normalizeEventName(name).split('.')[0],
        payload,
        source: optionalText(options.source),
        traceId:
            optionalText(options.traceId) ||
            `trace:${now()}:${sequence}`,
        correlationId: optionalText(options.correlationId),
        metadata: Object.freeze({ ...(options.metadata ?? {}) }),
        replay: options.replay === true,
        cancellable: options.cancellable !== false,
        cancelled: false,
        timestamp: now(),
    });
}

function normalizeEventObject(event) {
    if (!event || typeof event !== 'object') {
        throw new ToolEventError(
            'Event middleware must return an event object.',
            {
                code: 'TOOL_EVENT_INVALID_MIDDLEWARE_RESULT',
            },
        );
    }

    return Object.freeze({
        ...event,
        name: normalizeEventName(event.name),
        metadata: Object.freeze({ ...(event.metadata ?? {}) }),
        cancelled: event.cancelled === true,
    });
}

function matchesPattern(pattern, eventName) {
    if (pattern === '*') {
        return true;
    }

    if (pattern.endsWith('.*')) {
        return eventName.startsWith(pattern.slice(0, -1));
    }

    return pattern === eventName;
}

function normalizeEventPattern(value) {
    const pattern = requiredText(value, 'eventName');

    if (pattern === '*') {
        return pattern;
    }

    if (pattern.endsWith('.*')) {
        normalizeEventName(pattern.slice(0, -2));
        return pattern;
    }

    return normalizeEventName(pattern);
}

function normalizeEventName(value) {
    const name = requiredText(value, 'eventName');

    if (!/^[a-z0-9][a-z0-9._:-]*$/i.test(name)) {
        throw new TypeError(`Invalid event name "${name}".`);
    }

    return name;
}

function normalizePriority(value) {
    if (value === undefined) {
        return 0;
    }

    if (!Number.isFinite(value)) {
        throw new TypeError('priority must be a number.');
    }

    return Math.trunc(value);
}

function normalizeError(error) {
    if (error instanceof Error) {
        return Object.freeze({
            name: error.name,
            message: error.message,
            code: error.code ?? null,
        });
    }

    return Object.freeze({
        name: 'Error',
        message: String(error),
        code: null,
    });
}

function requiredText(value, field) {
    const text = String(value ?? '').trim();

    if (!text) {
        throw new TypeError(`${field} is required.`);
    }

    return text;
}

function optionalText(value) {
    return String(value ?? '').trim();
}

function requireFunction(value, field) {
    if (typeof value !== 'function') {
        throw new TypeError(`${field} must be a function.`);
    }

    return value;
}

function positiveInteger(value, fallback, field) {
    if (value === undefined) {
        return fallback;
    }

    if (!Number.isFinite(value) || value < 1) {
        throw new TypeError(`${field} must be a positive number.`);
    }

    return Math.trunc(value);
}

export {
    ToolEventError,
    ToolRuntimeEventBus,
};

// END OF FILE
