/**
 * @file Priority runtime scheduler for dependency-aware tool loading.
 * @module tools/tool-runtime-scheduler
 */

const PRIORITY = Object.freeze({
    critical: 400,
    high: 300,
    normal: 200,
    low: 100,
    idle: 0,
});

/**
 * Schedules dependency-aware tool loading with bounded concurrency.
 */
class ToolRuntimeScheduler {
    /**
     * @param {{
     *   loader: import('./runtime-tool-loader.js').RuntimeToolLoader,
     *   graph: import('./tool-dependency-graph.js').ToolDependencyGraph,
     *   concurrency?: number,
     *   idleScheduler?: (callback: () => void) => unknown,
     *   now?: () => number
     * }} options
     */
    constructor(options) {
        if (!options?.loader || !options?.graph) {
            throw new TypeError(
                'ToolRuntimeScheduler requires loader and graph.',
            );
        }

        this.loader = options.loader;
        this.graph = options.graph;
        this.concurrency = normalizePositiveInteger(
            options.concurrency,
            4,
            'concurrency',
        );
        this.idleScheduler =
            options.idleScheduler ??
            ((callback) => {
                if (typeof globalThis.requestIdleCallback === 'function') {
                    return globalThis.requestIdleCallback(callback);
                }

                return setTimeout(callback, 0);
            });
        this.now = options.now ?? (() => Date.now());

        /** @type {Array<Record<string, unknown>>} */
        this.queue = [];

        /** @type {Map<string, Promise<unknown>>} */
        this.inflight = new Map();

        /** @type {Array<Readonly<Record<string, unknown>>>} */
        this.history = [];

        this.sequence = 0;
        this.activeCount = 0;
    }

    /**
     * Loads a tool and all dependencies in valid order.
     *
     * @param {string} toolId
     * @param {{
     *   priority?: keyof typeof PRIORITY|number,
     *   idle?: boolean,
     *   load?: Record<string, unknown>
     * }} [options]
     * @returns {Promise<ReadonlyArray<Readonly<Record<string, unknown>>>>}
     */
    async schedule(toolId, options = {}) {
        const levels = this.graph.resolveLevels(toolId);
        const result = [];

        const execute = async () => {
            for (const level of levels) {
                const loaded = await Promise.all(
                    level.map((id) =>
                        this.enqueue(id, {
                            priority: options.priority,
                            load: options.load,
                        }),
                    ),
                );
                result.push(...loaded);
            }

            return Object.freeze(result);
        };

        if (options.idle === true) {
            return new Promise((resolve, reject) => {
                this.idleScheduler(() => {
                    execute().then(resolve, reject);
                });
            });
        }

        return execute();
    }

    /**
     * Preloads multiple root tools and their dependencies.
     *
     * @param {Iterable<string>} toolIds
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async warmup(toolIds, options = {}) {
        const roots = [...new Set([...toolIds].map(String))];
        const startedAt = this.now();
        const results = await Promise.allSettled(
            roots.map((id) => this.schedule(id, options)),
        );
        const loaded = [];
        const failed = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                loaded.push(roots[index]);
            } else {
                failed.push(
                    Object.freeze({
                        toolId: roots[index],
                        error: result.reason,
                    }),
                );
            }
        });

        return Object.freeze({
            requestedCount: roots.length,
            loadedCount: loaded.length,
            failedCount: failed.length,
            loaded: Object.freeze(loaded),
            failed: Object.freeze(failed),
            durationMs: Math.max(0, this.now() - startedAt),
        });
    }

    /**
     * @param {string} toolId
     * @param {{
     *   priority?: keyof typeof PRIORITY|number,
     *   load?: Record<string, unknown>
     * }} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    enqueue(toolId, options = {}) {
        const id = String(toolId ?? '').trim();

        if (!id) {
            return Promise.reject(new TypeError('toolId is required.'));
        }

        if (this.inflight.has(id)) {
            return this.inflight.get(id);
        }

        const promise = new Promise((resolve, reject) => {
            this.queue.push({
                id,
                priority: normalizePriority(options.priority),
                sequence: ++this.sequence,
                load: options.load ?? {},
                resolve,
                reject,
                queuedAt: this.now(),
            });
            this.sortQueue();
            this.drain();
        }).finally(() => {
            this.inflight.delete(id);
        });

        this.inflight.set(id, promise);
        return promise;
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    getSnapshot() {
        return Object.freeze({
            concurrency: this.concurrency,
            activeCount: this.activeCount,
            queuedCount: this.queue.length,
            inflightCount: this.inflight.size,
            queue: Object.freeze(
                this.queue.map((entry) =>
                    Object.freeze({
                        toolId: entry.id,
                        priority: entry.priority,
                        queuedAt: entry.queuedAt,
                    }),
                ),
            ),
        });
    }

    /**
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getHistory() {
        return Object.freeze([...this.history]);
    }

    /**
     * @private
     */
    drain() {
        while (
            this.activeCount < this.concurrency &&
            this.queue.length > 0
        ) {
            const entry = this.queue.shift();
            this.activeCount += 1;

            Promise.resolve()
                .then(() => this.loader.load(entry.id, entry.load))
                .then((value) => {
                    this.recordHistory('fulfilled', entry);
                    entry.resolve(value);
                })
                .catch((error) => {
                    this.recordHistory('rejected', entry, error);
                    entry.reject(error);
                })
                .finally(() => {
                    this.activeCount -= 1;
                    this.drain();
                });
        }
    }

    /**
     * @private
     */
    sortQueue() {
        this.queue.sort(
            (left, right) =>
                right.priority - left.priority ||
                left.sequence - right.sequence,
        );
    }

    /**
     * @private
     * @param {string} status
     * @param {Record<string, unknown>} entry
     * @param {unknown} [error]
     */
    recordHistory(status, entry, error = null) {
        this.history.push(
            Object.freeze({
                toolId: entry.id,
                status,
                priority: entry.priority,
                queuedAt: entry.queuedAt,
                completedAt: this.now(),
                error,
            }),
        );
    }
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function normalizePriority(value) {
    if (value === undefined) {
        return PRIORITY.normal;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    const key = String(value);

    if (!(key in PRIORITY)) {
        throw new TypeError(`Unknown scheduler priority "${key}".`);
    }

    return PRIORITY[key];
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {string} field
 * @returns {number}
 */
function normalizePositiveInteger(value, fallback, field) {
    if (value === undefined) {
        return fallback;
    }

    if (!Number.isFinite(value) || value < 1) {
        throw new TypeError(`${field} must be a positive number.`);
    }

    return Math.trunc(value);
}

export {
    PRIORITY as TOOL_SCHEDULER_PRIORITY,
    ToolRuntimeScheduler,
};

// END OF FILE
