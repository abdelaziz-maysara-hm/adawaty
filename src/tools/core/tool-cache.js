/**
 * @file Production-ready in-memory cache for the Adawaty tool engine.
 * @module tools/core/tool-cache
 */

/**
 * @typedef {'set' | 'get' | 'hit' | 'miss' | 'delete' | 'clear' | 'expire' | 'evict'} ToolCacheEventType
 */

/**
 * @typedef {Object} ToolCacheOptions
 * @property {string} [namespace='default'] Cache namespace.
 * @property {number} [maxEntries=250] Maximum number of live entries.
 * @property {number} [defaultTtl=300000] Default TTL in milliseconds. Use 0 for no expiration.
 * @property {number} [cleanupInterval=60000] Automatic cleanup interval in milliseconds. Use 0 to disable.
 * @property {boolean} [cloneValues=false] Clone values on write and read when supported.
 * @property {boolean} [touchOnGet=true] Refresh LRU position when an entry is read.
 */

/**
 * @typedef {Object} ToolCacheSetOptions
 * @property {number} [ttl] Entry TTL in milliseconds.
 * @property {boolean} [clone] Override clone behavior for this write.
 * @property {Record<string, unknown>} [metadata] Optional serializable metadata.
 */

/**
 * @typedef {Object} ToolCacheEntry
 * @property {unknown} value Cached value.
 * @property {number} createdAt Creation timestamp.
 * @property {number} updatedAt Last update timestamp.
 * @property {number} accessedAt Last access timestamp.
 * @property {number} expiresAt Expiration timestamp, or 0 when persistent.
 * @property {number} hits Number of successful reads.
 * @property {Record<string, unknown>} metadata Entry metadata.
 */

/**
 * @typedef {Object} ToolCacheStats
 * @property {number} hits
 * @property {number} misses
 * @property {number} writes
 * @property {number} deletes
 * @property {number} clears
 * @property {number} expirations
 * @property {number} evictions
 * @property {number} size
 * @property {number} maxEntries
 * @property {number} hitRate
 */

/**
 * @typedef {Object} ToolCacheEvent
 * @property {ToolCacheEventType} type
 * @property {string} namespace
 * @property {string | null} key
 * @property {number} timestamp
 * @property {unknown} [value]
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @callback ToolCacheListener
 * @param {ToolCacheEvent} event
 * @returns {void}
 */

const DEFAULT_OPTIONS = Object.freeze({
    namespace: 'default',
    maxEntries: 250,
    defaultTtl: 300_000,
    cleanupInterval: 60_000,
    cloneValues: false,
    touchOnGet: true,
});

const VALID_EVENT_TYPES = new Set([
    '*',
    'set',
    'get',
    'hit',
    'miss',
    'delete',
    'clear',
    'expire',
    'evict',
]);

/**
 * Returns the current timestamp.
 *
 * @returns {number}
 */
function now() {
    return Date.now();
}

/**
 * Validates a non-negative finite number.
 *
 * @param {unknown} value
 * @param {string} name
 * @returns {number}
 */
function assertNonNegativeNumber(value, name) {
    if (!Number.isFinite(value) || Number(value) < 0) {
        throw new TypeError(`${name} must be a non-negative finite number.`);
    }

    return Number(value);
}

/**
 * Validates a positive integer.
 *
 * @param {unknown} value
 * @param {string} name
 * @returns {number}
 */
function assertPositiveInteger(value, name) {
    if (!Number.isInteger(value) || Number(value) <= 0) {
        throw new TypeError(`${name} must be a positive integer.`);
    }

    return Number(value);
}

/**
 * Normalizes a cache key.
 *
 * @param {unknown} key
 * @returns {string}
 */
function normalizeKey(key) {
    if (typeof key !== 'string' && typeof key !== 'number') {
        throw new TypeError('Cache key must be a string or number.');
    }

    const normalized = String(key).trim();

    if (normalized.length === 0) {
        throw new TypeError('Cache key cannot be empty.');
    }

    return normalized;
}

/**
 * Normalizes a namespace.
 *
 * @param {unknown} namespace
 * @returns {string}
 */
function normalizeNamespace(namespace) {
    if (typeof namespace !== 'string') {
        throw new TypeError('Cache namespace must be a string.');
    }

    const normalized = namespace.trim();

    if (normalized.length === 0) {
        throw new TypeError('Cache namespace cannot be empty.');
    }

    return normalized;
}

/**
 * Returns whether a cache entry is expired.
 *
 * @param {ToolCacheEntry} entry
 * @param {number} [timestamp]
 * @returns {boolean}
 */
function isExpired(entry, timestamp = now()) {
    return entry.expiresAt > 0 && entry.expiresAt <= timestamp;
}

/**
 * Clones a value when the platform supports structuredClone.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
function cloneValue(value) {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }

    if (
        value === null
        || typeof value === 'string'
        || typeof value === 'number'
        || typeof value === 'boolean'
        || typeof value === 'undefined'
        || typeof value === 'bigint'
    ) {
        return value;
    }

    throw new TypeError(
        'Value cloning is unavailable for this value in the current runtime.',
    );
}

/**
 * Creates a safe metadata copy.
 *
 * @param {unknown} metadata
 * @returns {Record<string, unknown>}
 */
function normalizeMetadata(metadata) {
    if (metadata === undefined) {
        return {};
    }

    if (
        metadata === null
        || typeof metadata !== 'object'
        || Array.isArray(metadata)
    ) {
        throw new TypeError('Cache metadata must be a plain object.');
    }

    return { .../** @type {Record<string, unknown>} */ (metadata) };
}

/**
 * Creates a normalized cache options object.
 *
 * @param {ToolCacheOptions} [options]
 * @returns {Required<ToolCacheOptions>}
 */
function normalizeOptions(options = {}) {
    const namespace = normalizeNamespace(
        options.namespace ?? DEFAULT_OPTIONS.namespace,
    );
    const maxEntries = assertPositiveInteger(
        options.maxEntries ?? DEFAULT_OPTIONS.maxEntries,
        'maxEntries',
    );
    const defaultTtl = assertNonNegativeNumber(
        options.defaultTtl ?? DEFAULT_OPTIONS.defaultTtl,
        'defaultTtl',
    );
    const cleanupInterval = assertNonNegativeNumber(
        options.cleanupInterval ?? DEFAULT_OPTIONS.cleanupInterval,
        'cleanupInterval',
    );

    return {
        namespace,
        maxEntries,
        defaultTtl,
        cleanupInterval,
        cloneValues: options.cloneValues ?? DEFAULT_OPTIONS.cloneValues,
        touchOnGet: options.touchOnGet ?? DEFAULT_OPTIONS.touchOnGet,
    };
}

/**
 * Production-ready memory cache with TTL, LRU eviction, namespaces,
 * statistics, cleanup and event subscriptions.
 */
class ToolCache {
    /**
     * Shared namespace registry.
     *
     * @type {Map<string, ToolCache>}
     */
    static #registry = new Map();

    /** @type {Map<string, ToolCacheEntry>} */
    #entries = new Map();

    /** @type {Required<ToolCacheOptions>} */
    #options;

    /** @type {Map<ToolCacheEventType | '*', Set<ToolCacheListener>>} */
    #listeners = new Map();

    /** @type {ReturnType<typeof setInterval> | null} */
    #cleanupTimer = null;

    /** @type {boolean} */
    #destroyed = false;

    /** @type {number} */
    #hits = 0;

    /** @type {number} */
    #misses = 0;

    /** @type {number} */
    #writes = 0;

    /** @type {number} */
    #deletes = 0;

    /** @type {number} */
    #clears = 0;

    /** @type {number} */
    #expirations = 0;

    /** @type {number} */
    #evictions = 0;

    /**
     * @param {ToolCacheOptions} [options]
     */
    constructor(options = {}) {
        this.#options = normalizeOptions(options);
        this.#startCleanupTimer();
    }

    /**
     * Cache namespace.
     *
     * @returns {string}
     */
    get namespace() {
        return this.#options.namespace;
    }

    /**
     * Number of live entries.
     *
     * @returns {number}
     */
    get size() {
        this.cleanup();

        return this.#entries.size;
    }

    /**
     * Maximum allowed number of entries.
     *
     * @returns {number}
     */
    get maxEntries() {
        return this.#options.maxEntries;
    }

    /**
     * Whether this cache has been destroyed.
     *
     * @returns {boolean}
     */
    get destroyed() {
        return this.#destroyed;
    }

    /**
     * Stores a value.
     *
     * @template T
     * @param {string | number} key
     * @param {T} value
     * @param {ToolCacheSetOptions} [options]
     * @returns {T}
     */
    set(key, value, options = {}) {
        this.#assertActive();

        const normalizedKey = normalizeKey(key);
        const timestamp = now();
        const ttl = assertNonNegativeNumber(
            options.ttl ?? this.#options.defaultTtl,
            'ttl',
        );
        const shouldClone = options.clone ?? this.#options.cloneValues;
        const cachedValue = shouldClone ? cloneValue(value) : value;
        const existing = this.#entries.get(normalizedKey);

        /** @type {ToolCacheEntry} */
        const entry = {
            value: cachedValue,
            createdAt: existing?.createdAt ?? timestamp,
            updatedAt: timestamp,
            accessedAt: timestamp,
            expiresAt: ttl > 0 ? timestamp + ttl : 0,
            hits: existing?.hits ?? 0,
            metadata: normalizeMetadata(options.metadata ?? existing?.metadata),
        };

        if (existing) {
            this.#entries.delete(normalizedKey);
        }

        this.#entries.set(normalizedKey, entry);
        this.#writes += 1;
        this.#emit('set', normalizedKey, value, entry.metadata);
        this.#enforceCapacity();

        return value;
    }

    /**
     * Returns a cached value or the provided fallback.
     *
     * @template T
     * @param {string | number} key
     * @param {T} [fallback]
     * @returns {unknown | T}
     */
    get(key, fallback) {
        this.#assertActive();

        const normalizedKey = normalizeKey(key);
        const entry = this.#entries.get(normalizedKey);

        this.#emit('get', normalizedKey);

        if (!entry) {
            this.#misses += 1;
            this.#emit('miss', normalizedKey);

            return fallback;
        }

        if (isExpired(entry)) {
            this.#removeExpired(normalizedKey, entry);
            this.#misses += 1;
            this.#emit('miss', normalizedKey);

            return fallback;
        }

        entry.hits += 1;
        entry.accessedAt = now();
        this.#hits += 1;

        if (this.#options.touchOnGet) {
            this.#entries.delete(normalizedKey);
            this.#entries.set(normalizedKey, entry);
        }

        const value = this.#options.cloneValues
            ? cloneValue(entry.value)
            : entry.value;

        this.#emit('hit', normalizedKey, value, entry.metadata);

        return value;
    }

    /**
     * Returns a cached value without changing hit counters or LRU order.
     *
     * @template T
     * @param {string | number} key
     * @param {T} [fallback]
     * @returns {unknown | T}
     */
    peek(key, fallback) {
        this.#assertActive();

        const normalizedKey = normalizeKey(key);
        const entry = this.#entries.get(normalizedKey);

        if (!entry) {
            return fallback;
        }

        if (isExpired(entry)) {
            this.#removeExpired(normalizedKey, entry);

            return fallback;
        }

        return this.#options.cloneValues
            ? cloneValue(entry.value)
            : entry.value;
    }

    /**
     * Returns whether a live entry exists.
     *
     * @param {string | number} key
     * @returns {boolean}
     */
    has(key) {
        this.#assertActive();

        const normalizedKey = normalizeKey(key);
        const entry = this.#entries.get(normalizedKey);

        if (!entry) {
            return false;
        }

        if (isExpired(entry)) {
            this.#removeExpired(normalizedKey, entry);

            return false;
        }

        return true;
    }

    /**
     * Deletes one entry.
     *
     * @param {string | number} key
     * @returns {boolean}
     */
    delete(key) {
        this.#assertActive();

        const normalizedKey = normalizeKey(key);
        const entry = this.#entries.get(normalizedKey);

        if (!entry) {
            return false;
        }

        const deleted = this.#entries.delete(normalizedKey);

        if (deleted) {
            this.#deletes += 1;
            this.#emit('delete', normalizedKey, entry.value, entry.metadata);
        }

        return deleted;
    }

    /**
     * Deletes entries matching a predicate.
     *
     * @param {(value: unknown, key: string, entry: Readonly<ToolCacheEntry>) => boolean} predicate
     * @returns {number}
     */
    deleteWhere(predicate) {
        this.#assertActive();

        if (typeof predicate !== 'function') {
            throw new TypeError('deleteWhere requires a predicate function.');
        }

        let count = 0;

        for (const [key, entry] of [...this.#entries.entries()]) {
            if (isExpired(entry)) {
                this.#removeExpired(key, entry);
                continue;
            }

            if (predicate(entry.value, key, Object.freeze({ ...entry }))) {
                if (this.delete(key)) {
                    count += 1;
                }
            }
        }

        return count;
    }

    /**
     * Deletes keys with the provided prefix.
     *
     * @param {string} prefix
     * @returns {number}
     */
    invalidatePrefix(prefix) {
        if (typeof prefix !== 'string' || prefix.length === 0) {
            throw new TypeError('Prefix must be a non-empty string.');
        }

        return this.deleteWhere((_value, key) => key.startsWith(prefix));
    }

    /**
     * Deletes keys matching a regular expression.
     *
     * @param {RegExp} expression
     * @returns {number}
     */
    invalidateMatching(expression) {
        if (!(expression instanceof RegExp)) {
            throw new TypeError('invalidateMatching requires a RegExp.');
        }

        return this.deleteWhere((_value, key) => {
            expression.lastIndex = 0;

            return expression.test(key);
        });
    }

    /**
     * Clears all entries.
     *
     * @returns {number} Number of removed entries.
     */
    clear() {
        this.#assertActive();

        const removed = this.#entries.size;

        if (removed === 0) {
            return 0;
        }

        this.#entries.clear();
        this.#clears += 1;
        this.#emit('clear', null, removed);

        return removed;
    }

    /**
     * Removes expired entries.
     *
     * @returns {number}
     */
    cleanup() {
        this.#assertActive();

        const timestamp = now();
        let removed = 0;

        for (const [key, entry] of this.#entries) {
            if (isExpired(entry, timestamp)) {
                this.#removeExpired(key, entry);
                removed += 1;
            }
        }

        return removed;
    }

    /**
     * Returns or computes a value.
     *
     * Concurrent requests for the same missing key are naturally deduplicated
     * when the producer returns a Promise because the Promise itself is cached.
     *
     * @template T
     * @param {string | number} key
     * @param {() => T | Promise<T>} producer
     * @param {ToolCacheSetOptions} [options]
     * @returns {T | Promise<T>}
     */
    remember(key, producer, options = {}) {
        this.#assertActive();

        if (typeof producer !== 'function') {
            throw new TypeError('remember requires a producer function.');
        }

        const normalizedKey = normalizeKey(key);

        if (this.has(normalizedKey)) {
            return /** @type {T | Promise<T>} */ (this.get(normalizedKey));
        }

        let value;

        try {
            value = producer();
        } catch (error) {
            throw error;
        }

        this.set(normalizedKey, value, options);

        if (value instanceof Promise) {
            value.catch(() => {
                if (this.has(normalizedKey) && this.peek(normalizedKey) === value) {
                    this.delete(normalizedKey);
                }
            });
        }

        return value;
    }

    /**
     * Returns entry metadata without exposing the stored entry object.
     *
     * @param {string | number} key
     * @returns {Readonly<Omit<ToolCacheEntry, 'value'>> | null}
     */
    inspect(key) {
        this.#assertActive();

        const normalizedKey = normalizeKey(key);
        const entry = this.#entries.get(normalizedKey);

        if (!entry) {
            return null;
        }

        if (isExpired(entry)) {
            this.#removeExpired(normalizedKey, entry);

            return null;
        }

        const { value: _value, ...details } = entry;

        return Object.freeze({
            ...details,
            metadata: { ...details.metadata },
        });
    }

    /**
     * Returns all live keys in LRU order, oldest first.
     *
     * @returns {string[]}
     */
    keys() {
        this.cleanup();

        return [...this.#entries.keys()];
    }

    /**
     * Returns all live values in LRU order.
     *
     * @returns {unknown[]}
     */
    values() {
        this.cleanup();

        return [...this.#entries.values()].map((entry) => (
            this.#options.cloneValues
                ? cloneValue(entry.value)
                : entry.value
        ));
    }

    /**
     * Returns live entries in LRU order.
     *
     * @returns {Array<[string, unknown]>}
     */
    entries() {
        this.cleanup();

        return [...this.#entries.entries()].map(([key, entry]) => [
            key,
            this.#options.cloneValues
                ? cloneValue(entry.value)
                : entry.value,
        ]);
    }

    /**
     * Iterates over live entries.
     *
     * @param {(value: unknown, key: string, cache: ToolCache) => void} callback
     * @returns {void}
     */
    forEach(callback) {
        this.#assertActive();

        if (typeof callback !== 'function') {
            throw new TypeError('forEach requires a callback function.');
        }

        for (const [key, value] of this.entries()) {
            callback(value, key, this);
        }
    }

    /**
     * Returns cache statistics.
     *
     * @returns {Readonly<ToolCacheStats>}
     */
    stats() {
        this.cleanup();

        const attempts = this.#hits + this.#misses;

        return Object.freeze({
            hits: this.#hits,
            misses: this.#misses,
            writes: this.#writes,
            deletes: this.#deletes,
            clears: this.#clears,
            expirations: this.#expirations,
            evictions: this.#evictions,
            size: this.#entries.size,
            maxEntries: this.#options.maxEntries,
            hitRate: attempts > 0 ? this.#hits / attempts : 0,
        });
    }

    /**
     * Resets statistics without changing entries.
     *
     * @returns {void}
     */
    resetStats() {
        this.#assertActive();

        this.#hits = 0;
        this.#misses = 0;
        this.#writes = 0;
        this.#deletes = 0;
        this.#clears = 0;
        this.#expirations = 0;
        this.#evictions = 0;
    }

    /**
     * Subscribes to cache events.
     *
     * Use "*" to receive all events.
     *
     * @param {ToolCacheEventType | '*'} type
     * @param {ToolCacheListener} listener
     * @returns {() => void} Unsubscribe callback.
     */
    on(type, listener) {
        this.#assertActive();

        if (!VALID_EVENT_TYPES.has(type)) {
            throw new TypeError(`Unsupported cache event type: ${String(type)}`);
        }

        if (typeof listener !== 'function') {
            throw new TypeError('Cache listener must be a function.');
        }

        const listeners = this.#listeners.get(type) ?? new Set();

        listeners.add(listener);
        this.#listeners.set(type, listeners);

        return () => this.off(type, listener);
    }

    /**
     * Removes an event listener.
     *
     * @param {ToolCacheEventType | '*'} type
     * @param {ToolCacheListener} listener
     * @returns {boolean}
     */
    off(type, listener) {
        const listeners = this.#listeners.get(type);

        if (!listeners) {
            return false;
        }

        const removed = listeners.delete(listener);

        if (listeners.size === 0) {
            this.#listeners.delete(type);
        }

        return removed;
    }

    /**
     * Creates a serializable cache snapshot.
     *
     * @returns {Record<string, unknown>}
     */
    snapshot() {
        this.cleanup();

        return {
            namespace: this.namespace,
            options: { ...this.#options },
            stats: this.stats(),
            entries: [...this.#entries.entries()].map(([key, entry]) => ({
                key,
                createdAt: entry.createdAt,
                updatedAt: entry.updatedAt,
                accessedAt: entry.accessedAt,
                expiresAt: entry.expiresAt,
                hits: entry.hits,
                metadata: { ...entry.metadata },
            })),
        };
    }

    /**
     * Stops cleanup and releases all resources.
     *
     * @returns {void}
     */
    destroy() {
        if (this.#destroyed) {
            return;
        }

        if (this.#cleanupTimer !== null) {
            clearInterval(this.#cleanupTimer);
            this.#cleanupTimer = null;
        }

        this.#entries.clear();
        this.#listeners.clear();
        this.#destroyed = true;
        ToolCache.#registry.delete(this.namespace);
    }

    /**
     * Emits a cache event.
     *
     * @param {ToolCacheEventType} type
     * @param {string | null} key
     * @param {unknown} [value]
     * @param {Record<string, unknown>} [metadata]
     * @returns {void}
     */
    #emit(type, key, value, metadata) {
        const typedListeners = this.#listeners.get(type);
        const wildcardListeners = this.#listeners.get('*');

        if (!typedListeners?.size && !wildcardListeners?.size) {
            return;
        }

        /** @type {ToolCacheEvent} */
        const event = Object.freeze({
            type,
            namespace: this.namespace,
            key,
            timestamp: now(),
            value,
            metadata,
        });

        const notify = (listeners) => {
            if (!listeners) {
                return;
            }

            for (const listener of [...listeners]) {
                try {
                    listener(event);
                } catch {
                    // Listener failures must never break cache operations.
                }
            }
        };

        notify(typedListeners);

        if (wildcardListeners !== typedListeners) {
            notify(wildcardListeners);
        }
    }

    /**
     * Removes an expired entry.
     *
     * @param {string} key
     * @param {ToolCacheEntry} entry
     * @returns {void}
     */
    #removeExpired(key, entry) {
        if (this.#entries.delete(key)) {
            this.#expirations += 1;
            this.#emit('expire', key, entry.value, entry.metadata);
        }
    }

    /**
     * Enforces the configured capacity using LRU order.
     *
     * @returns {void}
     */
    #enforceCapacity() {
        this.cleanup();

        while (this.#entries.size > this.#options.maxEntries) {
            const oldestKey = this.#entries.keys().next().value;

            if (oldestKey === undefined) {
                break;
            }

            const entry = this.#entries.get(oldestKey);

            this.#entries.delete(oldestKey);
            this.#evictions += 1;
            this.#emit(
                'evict',
                oldestKey,
                entry?.value,
                entry?.metadata,
            );
        }
    }

    /**
     * Starts automatic expiration cleanup.
     *
     * @returns {void}
     */
    #startCleanupTimer() {
        if (this.#options.cleanupInterval <= 0) {
            return;
        }

        this.#cleanupTimer = setInterval(() => {
            if (!this.#destroyed) {
                this.cleanup();
            }
        }, this.#options.cleanupInterval);

        if (
            this.#cleanupTimer
            && typeof this.#cleanupTimer === 'object'
            && 'unref' in this.#cleanupTimer
            && typeof this.#cleanupTimer.unref === 'function'
        ) {
            this.#cleanupTimer.unref();
        }
    }

    /**
     * Ensures this cache can still be used.
     *
     * @returns {void}
     */
    #assertActive() {
        if (this.#destroyed) {
            throw new Error(`ToolCache "${this.namespace}" has been destroyed.`);
        }
    }

    /**
     * Creates a standalone cache.
     *
     * @param {ToolCacheOptions} [options]
     * @returns {ToolCache}
     */
    static create(options = {}) {
        return new ToolCache(options);
    }

    /**
     * Returns a shared cache for a namespace.
     *
     * @param {string} namespace
     * @param {Omit<ToolCacheOptions, 'namespace'>} [options]
     * @returns {ToolCache}
     */
    static namespace(namespace, options = {}) {
        const normalizedNamespace = normalizeNamespace(namespace);
        const existing = ToolCache.#registry.get(normalizedNamespace);

        if (existing && !existing.destroyed) {
            return existing;
        }

        const cache = new ToolCache({
            ...options,
            namespace: normalizedNamespace,
        });

        ToolCache.#registry.set(normalizedNamespace, cache);

        return cache;
    }

    /**
     * Returns a registered namespace cache.
     *
     * @param {string} namespace
     * @returns {ToolCache | null}
     */
    static getNamespace(namespace) {
        const normalizedNamespace = normalizeNamespace(namespace);
        const cache = ToolCache.#registry.get(normalizedNamespace);

        return cache && !cache.destroyed ? cache : null;
    }

    /**
     * Returns registered namespaces.
     *
     * @returns {string[]}
     */
    static namespaces() {
        return [...ToolCache.#registry.entries()]
            .filter(([, cache]) => !cache.destroyed)
            .map(([namespace]) => namespace)
            .sort();
    }

    /**
     * Destroys a shared namespace cache.
     *
     * @param {string} namespace
     * @returns {boolean}
     */
    static destroyNamespace(namespace) {
        const cache = ToolCache.getNamespace(namespace);

        if (!cache) {
            return false;
        }

        cache.destroy();

        return true;
    }

    /**
     * Destroys all shared caches.
     *
     * @returns {void}
     */
    static destroyAll() {
        for (const cache of [...ToolCache.#registry.values()]) {
            cache.destroy();
        }

        ToolCache.#registry.clear();
    }
}

Object.freeze(ToolCache.prototype);

export {
    DEFAULT_OPTIONS,
    ToolCache,
    cloneValue,
    isExpired,
    normalizeKey,
    normalizeNamespace,
    normalizeOptions,
};

export default ToolCache;

// END OF FILE
