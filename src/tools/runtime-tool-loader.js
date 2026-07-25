/**
 * @file Resilient runtime loader for registered Adawaty tools.
 * @module tools/runtime-tool-loader
 */

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRIES = 0;
const DEFAULT_RETRY_DELAY_MS = 0;

/**
 * Error raised when a tool cannot be loaded.
 */
class ToolLoadError extends Error {
    /**
     * @param {string} message
     * @param {{
     *   code?: string,
     *   toolId?: string,
     *   attempt?: number,
     *   cause?: unknown
     * }} [options]
     */
    constructor(message, options = {}) {
        super(message, {
            cause: options.cause,
        });

        this.name = 'ToolLoadError';
        this.code = options.code ?? 'TOOL_LOAD_FAILED';
        this.toolId = options.toolId ?? '';
        this.attempt = options.attempt ?? 0;
    }
}

/**
 * Loads tool modules lazily with concurrency deduplication, retries,
 * timeouts, lifecycle hooks and an explicit module cache.
 */
class RuntimeToolLoader {
    /**
     * @param {{
     *   toolRegistry: import('./tool-registry.js').ToolRegistry,
     *   timeoutMs?: number,
     *   retries?: number,
     *   retryDelayMs?: number|((attempt: number, error: ToolLoadError) => number),
     *   hooks?: {
     *     beforeLoad?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>,
     *     afterLoad?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>,
     *     onError?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>
     *   }
     * }} options
     */
    constructor(options) {
        if (!options?.toolRegistry) {
            throw new TypeError('RuntimeToolLoader requires a toolRegistry.');
        }

        this.toolRegistry = options.toolRegistry;
        this.monitor = options.monitor ?? null;
        this.timeoutMs = normalizeNonNegativeInteger(
            options.timeoutMs,
            DEFAULT_TIMEOUT_MS,
            'timeoutMs',
        );
        this.retries = normalizeNonNegativeInteger(
            options.retries,
            DEFAULT_RETRIES,
            'retries',
        );
        this.retryDelayMs = normalizeRetryDelay(options.retryDelayMs);
        this.hooks = normalizeHooks(options.hooks);

        /** @type {Map<string, Readonly<Record<string, unknown>>>} */
        this.cache = new Map();

        /** @type {Map<string, Promise<Readonly<Record<string, unknown>>>>} */
        this.inFlight = new Map();

        /** @type {Map<string, ToolLoadError>} */
        this.failures = new Map();
    }

    /**
     * Loads a registered tool module.
     *
     * @param {string} toolId
     * @param {{
     *   force?: boolean,
     *   timeoutMs?: number,
     *   retries?: number,
     *   signal?: AbortSignal
     * }} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async load(toolId, options = {}) {
        const id = normalizeToolId(toolId);
        const manifest = this.toolRegistry.get(id);

        if (!manifest) {
            throw new ToolLoadError(`Tool "${id}" is not registered.`, {
                code: 'TOOL_NOT_FOUND',
                toolId: id,
            });
        }

        if (options.signal?.aborted) {
            throw createAbortError(id, options.signal.reason);
        }

        if (!options.force && this.cache.has(id)) {
            return this.cache.get(id);
        }

        if (!options.force && this.inFlight.has(id)) {
            return this.inFlight.get(id);
        }

        if (options.force) {
            this.invalidate(id);
        }

        const operation = this.loadWithRetry(manifest, options)
            .then((record) => {
                this.cache.set(id, record);
                this.failures.delete(id);
                return record;
            })
            .finally(() => {
                this.inFlight.delete(id);
            });

        this.inFlight.set(id, operation);
        return operation;
    }

    /**
     * Loads several tools without failing the complete batch when one fails.
     *
     * @param {Iterable<string>} toolIds
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async preload(toolIds, options = {}) {
        const ids = [...new Set([...toolIds].map(normalizeToolId))];
        const settled = await Promise.allSettled(
            ids.map((id) => this.load(id, options)),
        );
        const loaded = {};
        const failed = {};

        settled.forEach((result, index) => {
            const id = ids[index];

            if (result.status === 'fulfilled') {
                loaded[id] = result.value;
            } else {
                failed[id] = normalizeLoadError(result.reason, id, 0);
            }
        });

        return Object.freeze({
            loaded: Object.freeze(loaded),
            failed: Object.freeze(failed),
        });
    }

    /**
     * @param {string} toolId
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getCached(toolId) {
        return this.cache.get(normalizeToolId(toolId)) ?? null;
    }

    /**
     * @param {string} toolId
     * @returns {boolean}
     */
    isLoaded(toolId) {
        return this.cache.has(normalizeToolId(toolId));
    }

    /**
     * @param {string} toolId
     * @returns {boolean}
     */
    isLoading(toolId) {
        return this.inFlight.has(normalizeToolId(toolId));
    }

    /**
     * @param {string} toolId
     * @returns {ToolLoadError|null}
     */
    getFailure(toolId) {
        return this.failures.get(normalizeToolId(toolId)) ?? null;
    }

    /**
     * Removes one loaded module and its last recorded failure.
     *
     * @param {string} toolId
     * @returns {boolean}
     */
    invalidate(toolId) {
        const id = normalizeToolId(toolId);
        const removed = this.cache.delete(id);
        this.failures.delete(id);
        return removed;
    }

    /**
     * Returns an immutable operational snapshot.
     *
     * @returns {Readonly<Record<string, unknown>>}
     */
    getSnapshot() {
        return Object.freeze({
            loadedIds: Object.freeze([...this.cache.keys()].sort()),
            loadingIds: Object.freeze([...this.inFlight.keys()].sort()),
            failedIds: Object.freeze([...this.failures.keys()].sort()),
            loadedCount: this.cache.size,
            loadingCount: this.inFlight.size,
            failedCount: this.failures.size,
        });
    }

    /**
     * Clears cached modules and recorded failures.
     *
     * @returns {void}
     */
    clear() {
        this.cache.clear();
        this.failures.clear();
    }

    /**
     * @private
     * @param {Readonly<Record<string, unknown>>} manifest
     * @param {Record<string, unknown>} options
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async loadWithRetry(manifest, options) {
        const retries = normalizeNonNegativeInteger(
            options.retries,
            this.retries,
            'retries',
        );
        const timeoutMs = normalizeNonNegativeInteger(
            options.timeoutMs,
            this.timeoutMs,
            'timeoutMs',
        );
        let lastError;

        for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
            try {
                const execute = () =>
                    this.loadAttempt(
                        manifest,
                        attempt,
                        timeoutMs,
                        options.signal,
                    );

                return this.monitor
                    ? await this.monitor.run(manifest.id, execute, {
                          phase: 'load',
                          metadata: {
                              attempt,
                          },
                      })
                    : await execute();
            } catch (error) {
                lastError = normalizeLoadError(error, manifest.id, attempt);
                this.failures.set(manifest.id, lastError);

                await invokeHook(this.hooks.onError, {
                    id: manifest.id,
                    manifest,
                    attempt,
                    error: lastError,
                    willRetry: attempt <= retries,
                });

                if (attempt > retries || lastError.code === 'TOOL_LOAD_ABORTED') {
                    throw lastError;
                }

                const delay = resolveRetryDelay(
                    this.retryDelayMs,
                    attempt,
                    lastError,
                );

                if (delay > 0) {
                    await wait(delay, options.signal, manifest.id);
                }
            }
        }

        throw lastError;
    }

    /**
     * @private
     * @param {Readonly<Record<string, unknown>>} manifest
     * @param {number} attempt
     * @param {number} timeoutMs
     * @param {AbortSignal|undefined} signal
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async loadAttempt(manifest, attempt, timeoutMs, signal) {
        const startedAt = Date.now();
        const context = Object.freeze({
            id: manifest.id,
            manifest,
            attempt,
            startedAt,
        });

        await invokeHook(this.hooks.beforeLoad, context);

        const moduleValue = await raceOperation(
            Promise.resolve().then(() =>
                manifest.loader({
                    id: manifest.id,
                    manifest,
                    attempt,
                    signal,
                }),
            ),
            {
                id: manifest.id,
                timeoutMs,
                signal,
            },
        );

        const normalizedModule = normalizeModule(moduleValue, manifest.id);
        const record = Object.freeze({
            id: manifest.id,
            manifest,
            module: normalizedModule,
            defaultExport: normalizedModule.default ?? null,
            loadedAt: Date.now(),
            durationMs: Date.now() - startedAt,
            attempt,
        });

        await invokeHook(this.hooks.afterLoad, {
            ...context,
            record,
        });

        return record;
    }
}

/**
 * @param {unknown} moduleValue
 * @param {string} toolId
 * @returns {Readonly<Record<string, unknown>>}
 */
function normalizeModule(moduleValue, toolId) {
    if (
        (typeof moduleValue !== 'object' || moduleValue === null) &&
        typeof moduleValue !== 'function'
    ) {
        throw new ToolLoadError(
            `Tool "${toolId}" loader returned an invalid module.`,
            {
                code: 'TOOL_INVALID_MODULE',
                toolId,
            },
        );
    }

    if (typeof moduleValue === 'function') {
        return Object.freeze({
            default: moduleValue,
        });
    }

    return Object.freeze({
        ...moduleValue,
    });
}

/**
 * @param {Promise<unknown>} operation
 * @param {{id: string, timeoutMs: number, signal?: AbortSignal}} options
 * @returns {Promise<unknown>}
 */
function raceOperation(operation, options) {
    const competitors = [operation];
    let timeoutId;
    let abortHandler;

    if (options.timeoutMs > 0) {
        competitors.push(
            new Promise((_, reject) => {
                timeoutId = setTimeout(() => {
                    reject(
                        new ToolLoadError(
                            `Tool "${options.id}" loading timed out after ${options.timeoutMs}ms.`,
                            {
                                code: 'TOOL_LOAD_TIMEOUT',
                                toolId: options.id,
                            },
                        ),
                    );
                }, options.timeoutMs);
            }),
        );
    }

    if (options.signal) {
        competitors.push(
            new Promise((_, reject) => {
                abortHandler = () => {
                    reject(createAbortError(options.id, options.signal.reason));
                };
                options.signal.addEventListener('abort', abortHandler, {
                    once: true,
                });
            }),
        );
    }

    return Promise.race(competitors).finally(() => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        if (options.signal && abortHandler) {
            options.signal.removeEventListener('abort', abortHandler);
        }
    });
}

/**
 * @param {number} durationMs
 * @param {AbortSignal|undefined} signal
 * @param {string} toolId
 * @returns {Promise<void>}
 */
function wait(durationMs, signal, toolId) {
    return raceOperation(
        new Promise((resolve) => {
            setTimeout(resolve, durationMs);
        }),
        {
            id: toolId,
            timeoutMs: 0,
            signal,
        },
    );
}

/**
 * @param {unknown} error
 * @param {string} toolId
 * @param {number} attempt
 * @returns {ToolLoadError}
 */
function normalizeLoadError(error, toolId, attempt) {
    if (error instanceof ToolLoadError) {
        if (!error.toolId) {
            error.toolId = toolId;
        }

        if (!error.attempt) {
            error.attempt = attempt;
        }

        return error;
    }

    return new ToolLoadError(
        `Tool "${toolId}" failed to load: ${getErrorMessage(error)}`,
        {
            code:
                error instanceof Error && typeof error.code === 'string'
                    ? error.code
                    : 'TOOL_LOAD_FAILED',
            toolId,
            attempt,
            cause: error,
        },
    );
}

/**
 * @param {string} toolId
 * @param {unknown} reason
 * @returns {ToolLoadError}
 */
function createAbortError(toolId, reason) {
    return new ToolLoadError(
        `Tool "${toolId}" loading was aborted.`,
        {
            code: 'TOOL_LOAD_ABORTED',
            toolId,
            cause: reason,
        },
    );
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function getErrorMessage(value) {
    return value instanceof Error ? value.message : String(value);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeToolId(value) {
    const id = String(value ?? '').trim();

    if (!id) {
        throw new TypeError('Tool id is required.');
    }

    return id;
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {string} field
 * @returns {number}
 */
function normalizeNonNegativeInteger(value, fallback, field) {
    if (value === undefined) {
        return fallback;
    }

    if (!Number.isFinite(value) || value < 0) {
        throw new TypeError(`${field} must be a non-negative number.`);
    }

    return Math.trunc(value);
}

/**
 * @param {unknown} value
 * @returns {number|((attempt: number, error: ToolLoadError) => number)}
 */
function normalizeRetryDelay(value) {
    if (value === undefined) {
        return DEFAULT_RETRY_DELAY_MS;
    }

    if (typeof value === 'function') {
        return value;
    }

    return normalizeNonNegativeInteger(
        value,
        DEFAULT_RETRY_DELAY_MS,
        'retryDelayMs',
    );
}

/**
 * @param {unknown} hooks
 * @returns {Readonly<Record<string, Function|null>>}
 */
function normalizeHooks(hooks) {
    const source = hooks ?? {};

    if (!source || typeof source !== 'object' || Array.isArray(source)) {
        throw new TypeError('Runtime loader hooks must be an object.');
    }

    return Object.freeze({
        beforeLoad: normalizeHook(source.beforeLoad, 'beforeLoad'),
        afterLoad: normalizeHook(source.afterLoad, 'afterLoad'),
        onError: normalizeHook(source.onError, 'onError'),
    });
}

/**
 * @param {unknown} value
 * @param {string} name
 * @returns {Function|null}
 */
function normalizeHook(value, name) {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value !== 'function') {
        throw new TypeError(`Runtime loader hook "${name}" must be a function.`);
    }

    return value;
}

/**
 * @param {Function|null} hook
 * @param {Record<string, unknown>} context
 * @returns {Promise<void>}
 */
async function invokeHook(hook, context) {
    if (hook) {
        await hook(Object.freeze(context));
    }
}

/**
 * @param {number|Function} retryDelay
 * @param {number} attempt
 * @param {ToolLoadError} error
 * @returns {number}
 */
function resolveRetryDelay(retryDelay, attempt, error) {
    const value =
        typeof retryDelay === 'function'
            ? retryDelay(attempt, error)
            : retryDelay;

    return normalizeNonNegativeInteger(value, 0, 'retryDelayMs');
}

export {
    RuntimeToolLoader,
    ToolLoadError,
};

// END OF FILE
