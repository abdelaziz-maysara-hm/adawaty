/**
 * @file Integrated runtime kernel for the Adawaty tool engine.
 * @module tools/core/tool-kernel
 */

import ToolCache from './tool-cache.js';
import ToolError, { toError } from './tool-error.js';
import ToolContext from './tool-context.js';
import ToolEvents from './tool-events.js';
import ToolLoader from './tool-loader.js';
import ToolRunner from './tool-runner.js';
import ToolValidator from './tool-validator.js';

/**
 * @typedef {Object} ToolKernelOptions
 * @property {string} [namespace='adawaty']
 * @property {string} [language='ar']
 * @property {'ltr' | 'rtl'} [direction]
 * @property {Record<string, unknown>} [config]
 * @property {Record<string, unknown>} [metadata]
 * @property {Record<string, unknown>} [environment]
 * @property {Record<string, unknown>} [services]
 * @property {Record<string, unknown>} [cache]
 * @property {Record<string, unknown>} [events]
 * @property {Record<string, unknown>} [loader]
 */

/**
 * Error thrown when the integrated kernel cannot complete an operation.
 */
class ToolKernelError extends ToolError {
    /**
     * @param {string} message
     * @param {{cause?: unknown, code?: string, metadata?: Record<string, unknown>, recoverable?: boolean}} [details]
     */
    constructor(message, details = {}) {
        super(message, {
            cause: details.cause,
            code: details.code ?? 'TOOL_KERNEL_ERROR',
            metadata: details.metadata,
            recoverable: details.recoverable,
        });
    }
}

/**
 * Normalizes a namespace.
 *
 * @param {unknown} value
 * @returns {string}
 */
function normalizeKernelNamespace(value) {
    if (typeof value !== 'string') {
        throw new TypeError('Kernel namespace must be a string.');
    }

    const normalized = value.trim();

    if (normalized.length === 0) {
        throw new TypeError('Kernel namespace cannot be empty.');
    }

    return normalized;
}

/**
 * Integrated facade for the core tool runtime.
 */
class ToolKernel {
    /** @type {string} */
    #namespace;

    /** @type {ToolEvents} */
    #events;

    /** @type {ToolCache} */
    #cache;

    /** @type {ToolValidator} */
    #validator;

    /** @type {ToolLoader} */
    #loader;

    /** @type {ToolContext} */
    #context;

    /** @type {Set<ToolRunner>} */
    #runners = new Set();

    /** @type {boolean} */
    #disposed = false;

    /** @type {Promise<void> | null} */
    #disposePromise = null;

    /**
     * @param {ToolKernelOptions} [options]
     */
    constructor(options = {}) {
        this.#namespace = normalizeKernelNamespace(
            options.namespace ?? 'adawaty',
        );

        this.#events = ToolEvents.namespace(this.#namespace, {
            captureHistory: true,
            historyLimit: 200,
            ...(options.events ?? {}),
        });

        this.#cache = ToolCache.namespace(this.#namespace, {
            ...(options.cache ?? {}),
        });

        this.#validator = new ToolValidator();

        this.#loader = new ToolLoader({
            cacheStore: this.#cache,
            events: this.#events,
            validator: ToolValidator,
            ...(options.loader ?? {}),
        });

        this.#context = new ToolContext({
            id: `${this.#namespace}-context`,
            language: options.language ?? 'ar',
            direction: options.direction,
            config: options.config ?? {},
            metadata: options.metadata ?? {},
            environment: options.environment ?? {},
            services: {
                events: this.#events,
                cache: this.#cache,
                validator: this.#validator,
                loader: this.#loader,
                ...(options.services ?? {}),
            },
        });
    }

    /**
     * Whether this kernel has begun or completed disposal.
     *
     * @returns {boolean}
     */
    get isDisposed() {
        return this.#disposed;
    }

    /**
     * Kernel namespace.
     *
     * @returns {string}
     */
    get namespace() {
        return this.#namespace;
    }

    /**
     * Shared event bus.
     *
     * @returns {ToolEvents}
     */
    get events() {
        this.#assertActive();

        return this.#events;
    }

    /**
     * Shared cache.
     *
     * @returns {ToolCache}
     */
    get cache() {
        this.#assertActive();

        return this.#cache;
    }

    /**
     * Shared validator.
     *
     * @returns {ToolValidator}
     */
    get validator() {
        this.#assertActive();

        return this.#validator;
    }

    /**
     * Shared loader.
     *
     * @returns {ToolLoader}
     */
    get loader() {
        this.#assertActive();

        return this.#loader;
    }

    /**
     * Root context.
     *
     * @returns {ToolContext}
     */
    get context() {
        this.#assertActive();

        return this.#context;
    }

    /**
     * Loads a tool module export.
     *
     * @param {import('./tool-loader.js').ToolLoadRequest | string} request
     * @returns {Promise<unknown>}
     */
    load(request) {
        this.#assertActive();

        return this.#loader.load(request);
    }

    /**
     * Creates a runner using the shared context.
     *
     * @param {unknown} tool
     * @param {Record<string, unknown>} [options]
     * @returns {ToolRunner}
     */
    createRunner(tool, options = {}) {
        this.#assertActive();

        const runner = new ToolRunner(tool, {
            context: this.#context,
            ...options,
        });

        this.#runners.add(runner);

        return runner;
    }

    /**
     * Executes a tool and releases the runner registration afterward.
     *
     * @param {unknown} tool
     * @param {unknown} input
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<unknown>}
     */
    async run(tool, input, options = {}) {
        this.#assertActive();

        const runner = this.createRunner(tool, options);

        try {
            await this.#events.emit('tool:kernel:run-start', {
                namespace: this.#namespace,
            });

            const result = await runner.run(input);

            await this.#events.emit('tool:kernel:run-success', {
                namespace: this.#namespace,
            });

            return result;
        } catch (error) {
            const cause = toError(error, 'Tool execution failed.');

            try {
                await this.#events.emit('tool:kernel:run-failure', {
                    namespace: this.#namespace,
                    error: cause,
                });
            } catch {
                // Diagnostic listeners must never replace the original failure.
            }

            throw new ToolKernelError('Tool execution failed.', {
                cause,
                code: 'TOOL_EXECUTION_FAILED',
                metadata: { namespace: this.#namespace },
            });
        } finally {
            this.#runners.delete(runner);
        }
    }

    /**
     * Returns an immutable diagnostic snapshot.
     *
     * @returns {Readonly<Record<string, unknown>>}
     */
    diagnostics() {
        this.#assertActive();

        return Object.freeze({
            namespace: this.#namespace,
            disposed: this.#disposed,
            activeRunners: this.#runners.size,
            events: this.#events.stats(),
            cache: this.#cache.stats(),
            loader: this.#loader.stats(),
            validationRules: this.#validator.count(),
            language: this.#context.language,
            direction: this.#context.direction,
        });
    }

    /**
     * Releases all resources owned by this kernel.
     *
     * @returns {void}
     */
    dispose() {
        void this.disposeAsync();
    }

    /**
     * Releases every owned resource and waits for active runners to stop.
     * Repeated calls share the same disposal promise.
     *
     * @returns {Promise<void>}
     */
    disposeAsync() {
        if (this.#disposePromise !== null) {
            return this.#disposePromise;
        }

        this.#disposed = true;
        this.#disposePromise = this.#performDispose();

        return this.#disposePromise;
    }

    /**
     * @param {ToolRunner} runner
     * @returns {boolean}
     */
    releaseRunner(runner) {
        if (!(runner instanceof ToolRunner)) {
            throw new TypeError('releaseRunner requires a ToolRunner instance.');
        }

        return this.#runners.delete(runner);
    }

    /**
     * @returns {Promise<void>}
     */
    async #performDispose() {
        const stops = [];

        for (const runner of this.#runners) {
            if (typeof runner.stop === 'function') {
                stops.push(Promise.resolve(runner.stop('Kernel disposed.')));
            }
        }

        await Promise.allSettled(stops);
        this.#runners.clear();
        this.#loader.dispose();
        this.#validator.clear();
        this.#context.dispose();
        ToolCache.destroyNamespace(this.#namespace);
        ToolEvents.destroyNamespace(this.#namespace);
    }

    /**
     * @returns {void}
     */
    #assertActive() {
        if (this.#disposed) {
            throw new ToolKernelError('ToolKernel has been disposed.', {
                code: 'TOOL_KERNEL_DISPOSED',
            });
        }
    }
}

/**
 * Creates a fully integrated core runtime.
 *
 * @param {ToolKernelOptions} [options]
 * @returns {ToolKernel}
 */
function createToolKernel(options = {}) {
    return new ToolKernel(options);
}

Object.freeze(ToolKernel.prototype);

export {
    ToolKernel,
    ToolKernelError,
    createToolKernel,
    normalizeKernelNamespace,
};

export default ToolKernel;

// END OF FILE
