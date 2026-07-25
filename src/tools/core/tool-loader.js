/**
 * @file Production-ready dynamic loader for the Adawaty tool engine.
 * @module tools/core/tool-loader
 */

import ToolError, { toError } from './tool-error.js';

/**
 * @typedef {'idle' | 'loading' | 'loaded' | 'failed' | 'disposed'} ToolLoadStatus
 */

/**
 * @typedef {Object} ToolLoaderOptions
 * @property {string} [basePath='']
 * @property {boolean} [cache=true]
 * @property {boolean} [retryFailed=false]
 * @property {number} [timeout=15000]
 * @property {number} [maxRetries=1]
 * @property {number} [retryDelay=250]
 * @property {(specifier: string) => Promise<unknown>} [importer]
 * @property {unknown} [events]
 * @property {unknown} [validator]
 * @property {unknown} [cacheStore]
 */

/**
 * @typedef {Object} ToolLoadRequest
 * @property {string} id
 * @property {string} specifier
 * @property {string} [exportName='default']
 * @property {Record<string, unknown>} [metadata]
 * @property {boolean} [forceReload=false]
 * @property {number} [timeout]
 * @property {AbortSignal} [signal]
 * @property {unknown} [validationSchema]
 */

/**
 * @typedef {Object} ToolLoadRecord
 * @property {string} id
 * @property {string} key
 * @property {string} specifier
 * @property {string} exportName
 * @property {ToolLoadStatus} status
 * @property {unknown} module
 * @property {unknown} value
 * @property {Error | null} error
 * @property {number} attempts
 * @property {number} createdAt
 * @property {number | null} startedAt
 * @property {number | null} completedAt
 * @property {number | null} duration
 * @property {Record<string, unknown>} metadata
 */

/**
 * Error thrown when a module cannot be loaded.
 */
class ToolLoaderError extends ToolError {
    /**
     * @param {string} message
     * @param {{cause?: unknown, request?: ToolLoadRequest, attempts?: number, code?: string}} [details]
     */
    constructor(message, details = {}) {
        super(message, {
            cause: details.cause,
            code: details.code ?? 'TOOL_LOAD_FAILED',
            metadata: {
                requestId: details.request?.id ?? null,
                specifier: details.request?.specifier ?? null,
                attempts: details.attempts ?? 0,
            },
            recoverable: true,
        });
        this.request = details.request ?? null;
        this.attempts = details.attempts ?? 0;
    }
}

/**
 * Creates a stable unique identifier.
 *
 * @param {string} prefix
 * @returns {string}
 */
function createLoaderId(prefix) {
    return `${prefix}-${Date.now().toString(36)}-${Math.random()
        .toString(36)
        .slice(2, 10)}`;
}

/**
 * Waits for a given amount of time.
 *
 * @param {number} milliseconds
 * @param {AbortSignal} [signal]
 * @returns {Promise<void>}
 */
function delay(milliseconds, signal) {
    if (milliseconds <= 0) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, milliseconds);

        signal?.addEventListener(
            'abort',
            () => {
                clearTimeout(timer);
                reject(
                    signal.reason
                    ?? new DOMException('Operation aborted.', 'AbortError'),
                );
            },
            { once: true },
        );
    });
}

/**
 * Creates an AbortSignal that is aborted after a timeout.
 *
 * @param {number} timeout
 * @param {AbortSignal} [externalSignal]
 * @returns {{signal: AbortSignal, cleanup: () => void}}
 */
function createTimeoutSignal(timeout, externalSignal) {
    const controller = new AbortController();
    let timeoutId = null;

    const abortFromExternal = () => {
        controller.abort(
            externalSignal?.reason
            ?? new DOMException('Operation aborted.', 'AbortError'),
        );
    };

    if (externalSignal?.aborted) {
        abortFromExternal();
    } else {
        externalSignal?.addEventListener('abort', abortFromExternal, {
            once: true,
        });
    }

    if (timeout > 0) {
        timeoutId = setTimeout(() => {
            controller.abort(
                new DOMException(
                    `Tool loading timed out after ${timeout} ms.`,
                    'TimeoutError',
                ),
            );
        }, timeout);
    }

    return {
        signal: controller.signal,
        cleanup: () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }

            externalSignal?.removeEventListener('abort', abortFromExternal);
        },
    };
}

/**
 * Normalizes loader options.
 *
 * @param {ToolLoaderOptions} [options]
 * @returns {Required<Omit<ToolLoaderOptions, 'events' | 'validator' | 'cacheStore'>> & Pick<ToolLoaderOptions, 'events' | 'validator' | 'cacheStore'>}
 */
function normalizeLoaderOptions(options = {}) {
    const timeout = options.timeout ?? 15000;
    const maxRetries = options.maxRetries ?? 1;
    const retryDelay = options.retryDelay ?? 250;

    if (!Number.isFinite(timeout) || timeout < 0) {
        throw new TypeError('Loader timeout must be a non-negative number.');
    }

    if (!Number.isInteger(maxRetries) || maxRetries < 0) {
        throw new TypeError('maxRetries must be a non-negative integer.');
    }

    if (!Number.isFinite(retryDelay) || retryDelay < 0) {
        throw new TypeError('retryDelay must be a non-negative number.');
    }

    return {
        basePath: typeof options.basePath === 'string' ? options.basePath : '',
        cache: options.cache ?? true,
        retryFailed: options.retryFailed ?? false,
        timeout,
        maxRetries,
        retryDelay,
        importer:
            options.importer
            ?? ((specifier) => import(/* @vite-ignore */ specifier)),
        events: options.events,
        validator: options.validator,
        cacheStore: options.cacheStore,
    };
}

/**
 * Resolves a module specifier against an optional base path.
 *
 * @param {string} specifier
 * @param {string} basePath
 * @returns {string}
 */
function resolveSpecifier(specifier, basePath = '') {
    if (typeof specifier !== 'string' || specifier.trim().length === 0) {
        throw new TypeError('Module specifier must be a non-empty string.');
    }

    const normalized = specifier.trim();

    if (
        !basePath
        || /^(?:[a-z]+:)?\/\//i.test(normalized)
        || normalized.startsWith('/')
        || normalized.startsWith('.')
    ) {
        return normalized;
    }

    return `${basePath.replace(/\/+$/, '')}/${normalized.replace(/^\/+/, '')}`;
}

/**
 * Creates a deterministic cache key.
 *
 * @param {string} specifier
 * @param {string} exportName
 * @returns {string}
 */
function createLoadKey(specifier, exportName) {
    return `${specifier}::${exportName}`;
}

/**
 * Production-ready dynamic tool loader.
 */
class ToolLoader {
    /** @type {ReturnType<typeof normalizeLoaderOptions>} */
    #options;

    /** @type {Map<string, ToolLoadRecord>} */
    #records = new Map();

    /** @type {Map<string, Promise<unknown>>} */
    #pending = new Map();

    /** @type {boolean} */
    #disposed = false;

    /**
     * @param {ToolLoaderOptions} [options]
     */
    constructor(options = {}) {
        this.#options = normalizeLoaderOptions(options);
    }

    /**
     * Loads and returns a module export.
     *
     * @param {ToolLoadRequest | string} input
     * @returns {Promise<unknown>}
     */
    async load(input) {
        this.#assertActive();

        const request = this.#normalizeRequest(input);
        const specifier = resolveSpecifier(
            request.specifier,
            this.#options.basePath,
        );
        const key = createLoadKey(specifier, request.exportName);
        const existing = this.#records.get(key);

        if (
            !request.forceReload
            && this.#options.cache
            && existing?.status === 'loaded'
        ) {
            await this.#emit('tool:loader:cache-hit', {
                request,
                record: this.#cloneRecord(existing),
            });

            return existing.value;
        }

        if (
            !request.forceReload
            && existing?.status === 'failed'
            && !this.#options.retryFailed
        ) {
            throw new ToolLoaderError(
                `Module "${specifier}" previously failed to load.`,
                {
                    cause: existing.error,
                    request,
                    attempts: existing.attempts,
                },
            );
        }

        const pending = this.#pending.get(key);

        if (!request.forceReload && pending) {
            return pending;
        }

        const operation = this.#loadInternal({
            ...request,
            specifier,
        }, key);

        this.#pending.set(key, operation);

        try {
            return await operation;
        } finally {
            if (this.#pending.get(key) === operation) {
                this.#pending.delete(key);
            }
        }
    }

    /**
     * Loads multiple tools.
     *
     * @param {Array<ToolLoadRequest | string>} requests
     * @param {{concurrency?: number, stopOnError?: boolean}} [options]
     * @returns {Promise<Array<{status: 'fulfilled', value: unknown} | {status: 'rejected', reason: Error}>>}
     */
    async loadMany(requests, options = {}) {
        this.#assertActive();

        if (!Array.isArray(requests)) {
            throw new TypeError('loadMany requests must be an array.');
        }

        const concurrency = options.concurrency ?? 4;

        if (!Number.isInteger(concurrency) || concurrency <= 0) {
            throw new TypeError('Concurrency must be a positive integer.');
        }

        const results = new Array(requests.length);
        let nextIndex = 0;
        let stopped = false;

        const worker = async () => {
            while (!stopped) {
                const index = nextIndex;
                nextIndex += 1;

                if (index >= requests.length) {
                    return;
                }

                try {
                    const value = await this.load(requests[index]);
                    results[index] = { status: 'fulfilled', value };
                } catch (error) {
                    const normalized = toError(error);
                    results[index] = {
                        status: 'rejected',
                        reason: normalized,
                    };

                    if (options.stopOnError) {
                        stopped = true;
                        throw normalized;
                    }
                }
            }
        };

        const workers = Array.from(
            { length: Math.min(concurrency, requests.length) },
            () => worker(),
        );

        await Promise.all(workers);

        return results;
    }

    /**
     * Preloads modules and ignores returned exports.
     *
     * @param {Array<ToolLoadRequest | string>} requests
     * @param {{concurrency?: number}} [options]
     * @returns {Promise<void>}
     */
    async preload(requests, options = {}) {
        await this.loadMany(requests, options);
    }

    /**
     * Returns a load record.
     *
     * @param {string} specifier
     * @param {string} [exportName='default']
     * @returns {ToolLoadRecord | null}
     */
    getRecord(specifier, exportName = 'default') {
        this.#assertActive();

        const resolved = resolveSpecifier(specifier, this.#options.basePath);
        const record = this.#records.get(createLoadKey(resolved, exportName));

        return record ? this.#cloneRecord(record) : null;
    }

    /**
     * Returns all load records.
     *
     * @returns {ToolLoadRecord[]}
     */
    records() {
        this.#assertActive();

        return [...this.#records.values()].map((record) =>
            this.#cloneRecord(record),
        );
    }

    /**
     * Invalidates one cached entry.
     *
     * @param {string} specifier
     * @param {string} [exportName='default']
     * @returns {boolean}
     */
    invalidate(specifier, exportName = 'default') {
        this.#assertActive();

        const resolved = resolveSpecifier(specifier, this.#options.basePath);
        const key = createLoadKey(resolved, exportName);
        const removed = this.#records.delete(key);

        this.#deleteExternalCache(key);

        return removed;
    }

    /**
     * Clears all records and external cache entries known to this loader.
     *
     * @returns {number}
     */
    clear() {
        this.#assertActive();

        const count = this.#records.size;

        for (const key of this.#records.keys()) {
            this.#deleteExternalCache(key);
        }

        this.#records.clear();

        return count;
    }

    /**
     * Returns loader statistics.
     *
     * @returns {Readonly<Record<string, number>>}
     */
    stats() {
        this.#assertActive();

        const stats = {
            total: this.#records.size,
            idle: 0,
            loading: 0,
            loaded: 0,
            failed: 0,
            pending: this.#pending.size,
        };

        for (const record of this.#records.values()) {
            if (record.status in stats) {
                stats[record.status] += 1;
            }
        }

        return Object.freeze(stats);
    }

    /**
     * Disposes the loader.
     *
     * @returns {void}
     */
    dispose() {
        if (this.#disposed) {
            return;
        }

        this.#records.clear();
        this.#pending.clear();
        this.#disposed = true;
    }

    /**
     * @param {ToolLoadRequest} request
     * @param {string} key
     * @returns {Promise<unknown>}
     */
    async #loadInternal(request, key) {
        const createdAt = Date.now();

        /** @type {ToolLoadRecord} */
        const record = {
            id: request.id,
            key,
            specifier: request.specifier,
            exportName: request.exportName,
            status: 'loading',
            module: null,
            value: null,
            error: null,
            attempts: 0,
            createdAt,
            startedAt: createdAt,
            completedAt: null,
            duration: null,
            metadata: { ...(request.metadata ?? {}) },
        };

        this.#records.set(key, record);

        await this.#emit('tool:loader:start', {
            request,
            record: this.#cloneRecord(record),
        });

        const cached = await this.#readExternalCache(key);

        if (!request.forceReload && cached !== undefined) {
            record.status = 'loaded';
            record.value = cached;
            record.completedAt = Date.now();
            record.duration = record.completedAt - record.startedAt;

            await this.#emit('tool:loader:cache-hit', {
                request,
                record: this.#cloneRecord(record),
            });

            return cached;
        }

        const timeout = request.timeout ?? this.#options.timeout;
        const maximumAttempts = this.#options.maxRetries + 1;
        let lastError = null;

        for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
            record.attempts = attempt;

            const { signal, cleanup } = createTimeoutSignal(
                timeout,
                request.signal,
            );

            try {
                if (signal.aborted) {
                    throw signal.reason;
                }

                const module = await Promise.race([
                    this.#options.importer(request.specifier),
                    new Promise((_, reject) => {
                        signal.addEventListener(
                            'abort',
                            () => reject(signal.reason),
                            { once: true },
                        );
                    }),
                ]);

                const value = this.#selectExport(
                    module,
                    request.exportName,
                    request.specifier,
                );

                await this.#validate(value, request);

                record.status = 'loaded';
                record.module = module;
                record.value = value;
                record.error = null;
                record.completedAt = Date.now();
                record.duration = record.completedAt - record.startedAt;

                await this.#writeExternalCache(key, value);

                await this.#emit('tool:loader:success', {
                    request,
                    record: this.#cloneRecord(record),
                });

                return value;
            } catch (error) {
                lastError = toError(error);
                record.error = lastError;

                await this.#emit('tool:loader:attempt-failed', {
                    request,
                    attempt,
                    error: lastError,
                });

                if (attempt < maximumAttempts) {
                    await delay(
                        this.#options.retryDelay * attempt,
                        request.signal,
                    );
                }
            } finally {
                cleanup();
            }
        }

        record.status = 'failed';
        record.completedAt = Date.now();
        record.duration = record.completedAt - record.startedAt;

        const finalError = new ToolLoaderError(
            `Failed to load "${request.specifier}" after ${record.attempts} attempt(s).`,
            {
                cause: lastError,
                request,
                attempts: record.attempts,
            },
        );

        record.error = finalError;

        await this.#emit('tool:loader:failure', {
            request,
            error: finalError,
            record: this.#cloneRecord(record),
        });

        throw finalError;
    }

    /**
     * @param {ToolLoadRequest | string} input
     * @returns {ToolLoadRequest}
     */
    #normalizeRequest(input) {
        const request =
            typeof input === 'string'
                ? { specifier: input }
                : { ...(input ?? {}) };

        if (
            typeof request.specifier !== 'string'
            || request.specifier.trim().length === 0
        ) {
            throw new TypeError('Load request requires a module specifier.');
        }

        const exportName = request.exportName ?? 'default';

        if (typeof exportName !== 'string' || exportName.trim().length === 0) {
            throw new TypeError('exportName must be a non-empty string.');
        }

        return {
            id: request.id ?? createLoaderId('load'),
            specifier: request.specifier.trim(),
            exportName: exportName.trim(),
            metadata: { ...(request.metadata ?? {}) },
            forceReload: request.forceReload ?? false,
            timeout: request.timeout,
            signal: request.signal,
            validationSchema: request.validationSchema,
        };
    }

    /**
     * @param {unknown} module
     * @param {string} exportName
     * @param {string} specifier
     * @returns {unknown}
     */
    #selectExport(module, exportName, specifier) {
        if (
            module === null
            || (typeof module !== 'object' && typeof module !== 'function')
        ) {
            throw new ToolLoaderError(
                `Module "${specifier}" returned an invalid namespace object.`,
            );
        }

        if (exportName === '*') {
            return module;
        }

        if (!(exportName in module)) {
            throw new ToolLoaderError(
                `Export "${exportName}" was not found in "${specifier}".`,
            );
        }

        return module[exportName];
    }

    /**
     * @param {unknown} value
     * @param {ToolLoadRequest} request
     * @returns {Promise<void>}
     */
    async #validate(value, request) {
        if (!request.validationSchema || !this.#options.validator) {
            return;
        }

        const validator = this.#options.validator;

        let result;

        if (typeof validator.validateSchema === 'function') {
            result = await validator.validateSchema(
                value,
                request.validationSchema,
                {
                    path: '$module',
                    throwOnError: false,
                },
            );
        } else if (typeof validator.validate === 'function') {
            result = await validator.validate(value, {
                schema: request.validationSchema,
                path: '$module',
            });
        } else {
            throw new ToolLoaderError(
                'Configured validator does not expose a supported validation method.',
            );
        }

        if (result?.valid === false) {
            throw new ToolLoaderError(
                `Loaded export from "${request.specifier}" failed validation.`,
                { cause: result.issues },
            );
        }
    }

    /**
     * @param {string} event
     * @param {unknown} payload
     * @returns {Promise<void>}
     */
    async #emit(event, payload) {
        const events = this.#options.events;

        if (!events) {
            return;
        }

        if (typeof events.emit === 'function') {
            await events.emit(event, payload);
            return;
        }

        if (typeof events.publish === 'function') {
            events.publish(event, payload);
        }
    }

    /**
     * @param {string} key
     * @returns {Promise<unknown>}
     */
    async #readExternalCache(key) {
        if (!this.#options.cache || !this.#options.cacheStore) {
            return undefined;
        }

        const cache = this.#options.cacheStore;

        if (typeof cache.get === 'function') {
            return cache.get(key);
        }

        return undefined;
    }

    /**
     * @param {string} key
     * @param {unknown} value
     * @returns {Promise<void>}
     */
    async #writeExternalCache(key, value) {
        if (!this.#options.cache || !this.#options.cacheStore) {
            return;
        }

        const cache = this.#options.cacheStore;

        if (typeof cache.set === 'function') {
            await cache.set(key, value);
        }
    }

    /**
     * @param {string} key
     * @returns {void}
     */
    #deleteExternalCache(key) {
        const cache = this.#options.cacheStore;

        if (!cache) {
            return;
        }

        if (typeof cache.delete === 'function') {
            void cache.delete(key);
        } else if (typeof cache.remove === 'function') {
            void cache.remove(key);
        }
    }

    /**
     * @param {ToolLoadRecord} record
     * @returns {ToolLoadRecord}
     */
    #cloneRecord(record) {
        return Object.freeze({
            ...record,
            metadata: Object.freeze({ ...record.metadata }),
        });
    }

    /**
     * @returns {void}
     */
    #assertActive() {
        if (this.#disposed) {
            throw new Error('ToolLoader has been disposed.');
        }
    }
}

Object.freeze(ToolLoader.prototype);

export {
    ToolLoader,
    ToolLoaderError,
    createLoadKey,
    createLoaderId,
    createTimeoutSignal,
    delay,
    normalizeLoaderOptions,
    resolveSpecifier,
};

export default ToolLoader;

// END OF FILE
