/**
 * @file Executes tool lifecycle hooks with cancellation, timing and cleanup.
 * @module tools/core/tool-runner
 */

import ToolContext from './tool-context.js';

/**
 * @typedef {'idle' | 'starting' | 'running' | 'stopping' | 'stopped' | 'failed'} ToolRunnerStatus
 */

/**
 * @typedef {Object} ToolRunnerOptions
 * @property {ToolContext} [context]
 * @property {AbortSignal} [signal]
 * @property {number} [timeout]
 * @property {boolean} [autoRender]
 * @property {boolean} [autoDestroy]
 */

/**
 * @typedef {Object} ToolRunResult
 * @property {unknown} value
 * @property {number} duration
 * @property {ToolRunnerStatus} status
 */

/**
 * Resolves whether a value is promise-like.
 *
 * @param {unknown} value
 * @returns {value is PromiseLike<unknown>}
 */
function isPromiseLike(value) {
    return (
        value !== null
        && (typeof value === 'object' || typeof value === 'function')
        && typeof /** @type {{then?: unknown}} */ (value).then === 'function'
    );
}

/**
 * Awaits a value only when necessary.
 *
 * @template T
 * @param {T | PromiseLike<T>} value
 * @returns {Promise<T>}
 */
async function resolveValue(value) {
    return isPromiseLike(value) ? await value : value;
}

/**
 * Creates a timeout error.
 *
 * @param {string} phase
 * @param {number} timeout
 * @returns {Error}
 */
function createTimeoutError(phase, timeout) {
    const error = new Error(
        `Tool lifecycle phase "${phase}" exceeded ${timeout} ms.`,
    );

    error.name = 'TimeoutError';

    return error;
}

/**
 * Executes an async operation with optional timeout and cancellation.
 *
 * @template T
 * @param {() => T | PromiseLike<T>} operation
 * @param {{phase: string, timeout?: number, signal?: AbortSignal}} options
 * @returns {Promise<T>}
 */
async function withGuards(operation, options) {
    const { phase, timeout = 0, signal } = options;

    if (signal?.aborted) {
        throw signal.reason ?? new DOMException('Operation aborted.', 'AbortError');
    }

    /** @type {ReturnType<typeof setTimeout> | null} */
    let timeoutId = null;

    /** @type {(() => void) | null} */
    let abortCleanup = null;

    const guards = [];

    if (timeout > 0) {
        guards.push(
            new Promise((_, reject) => {
                timeoutId = setTimeout(
                    () => reject(createTimeoutError(phase, timeout)),
                    timeout,
                );
            }),
        );
    }

    if (signal) {
        guards.push(
            new Promise((_, reject) => {
                const onAbort = () => {
                    reject(
                        signal.reason
                        ?? new DOMException('Operation aborted.', 'AbortError'),
                    );
                };

                signal.addEventListener('abort', onAbort, { once: true });
                abortCleanup = () => signal.removeEventListener('abort', onAbort);
            }),
        );
    }

    try {
        if (guards.length === 0) {
            return await resolveValue(operation());
        }

        return /** @type {T} */ (
            await Promise.race([
                resolveValue(operation()),
                ...guards,
            ])
        );
    } finally {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        abortCleanup?.();
    }
}

/**
 * Returns a high-resolution timestamp when available.
 *
 * @returns {number}
 */
function now() {
    return typeof performance !== 'undefined' && performance.now
        ? performance.now()
        : Date.now();
}

/**
 * Lifecycle runner for individual tools.
 */
class ToolRunner {
    /**
     * Active runners indexed by tool id.
     *
     * @type {Map<string, ToolRunner>}
     */
    static #registry = new Map();

    /** @type {unknown} */
    #tool;

    /** @type {ToolContext} */
    #context;

    /** @type {AbortController} */
    #controller;

    /** @type {AbortSignal | null} */
    #externalSignal = null;

    /** @type {(() => void) | null} */
    #externalAbortCleanup = null;

    /** @type {number} */
    #timeout;

    /** @type {boolean} */
    #autoRender;

    /** @type {boolean} */
    #autoDestroy;

    /** @type {ToolRunnerStatus} */
    #status = 'idle';

    /** @type {unknown} */
    #lastValue;

    /** @type {Error | null} */
    #lastError = null;

    /** @type {number} */
    #duration = 0;

    /** @type {Promise<ToolRunResult> | null} */
    #activeRun = null;

    /**
     * @param {unknown} tool
     * @param {ToolRunnerOptions} [options]
     */
    constructor(tool, options = {}) {
        if (
            tool === null
            || (typeof tool !== 'object' && typeof tool !== 'function')
        ) {
            throw new TypeError('ToolRunner requires a tool instance.');
        }

        if (
            options.context !== undefined
            && !(options.context instanceof ToolContext)
        ) {
            throw new TypeError('ToolRunner context must be a ToolContext.');
        }

        if (
            options.timeout !== undefined
            && (!Number.isFinite(options.timeout) || options.timeout < 0)
        ) {
            throw new TypeError('ToolRunner timeout must be a non-negative number.');
        }

        this.#tool = tool;
        this.#context = options.context ?? ToolContext.create();
        this.#controller = new AbortController();
        this.#timeout = options.timeout ?? 0;
        this.#autoRender = options.autoRender ?? true;
        this.#autoDestroy = options.autoDestroy ?? false;

        if (options.signal) {
            this.#bindExternalSignal(options.signal);
        }

        this.#context.inject(tool);
    }

    /**
     * Current lifecycle status.
     *
     * @returns {ToolRunnerStatus}
     */
    get status() {
        return this.#status;
    }

    /**
     * Tool execution context.
     *
     * @returns {ToolContext}
     */
    get context() {
        return this.#context;
    }

    /**
     * Last returned value.
     *
     * @returns {unknown}
     */
    get value() {
        return this.#lastValue;
    }

    /**
     * Last execution error.
     *
     * @returns {Error | null}
     */
    get error() {
        return this.#lastError;
    }

    /**
     * Duration of the last run in milliseconds.
     *
     * @returns {number}
     */
    get duration() {
        return this.#duration;
    }

    /**
     * Combined cancellation signal.
     *
     * @returns {AbortSignal}
     */
    get signal() {
        return this.#controller.signal;
    }

    /**
     * Whether a run is currently active.
     *
     * @returns {boolean}
     */
    get running() {
        return this.#status === 'starting' || this.#status === 'running';
    }

    /**
     * Starts the complete lifecycle.
     *
     * @param {unknown} [input]
     * @returns {Promise<ToolRunResult>}
     */
    run(input) {
        if (this.#activeRun) {
            return this.#activeRun;
        }

        this.#activeRun = this.#execute(input)
            .finally(() => {
                this.#activeRun = null;
            });

        return this.#activeRun;
    }

    /**
     * Executes one named hook on the tool.
     *
     * Missing hooks are ignored and return undefined.
     *
     * @param {string} name
     * @param {...unknown} args
     * @returns {Promise<unknown>}
     */
    async invoke(name, ...args) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new TypeError('Lifecycle hook name must be a non-empty string.');
        }

        const hook = /** @type {Record<string, unknown>} */ (this.#tool)[
            name.trim()
        ];

        if (typeof hook !== 'function') {
            return undefined;
        }

        return withGuards(
            () => hook.apply(this.#tool, args),
            {
                phase: name.trim(),
                timeout: this.#timeout,
                signal: this.#controller.signal,
            },
        );
    }

    /**
     * Requests cancellation.
     *
     * @param {unknown} [reason]
     * @returns {void}
     */
    abort(reason = new DOMException('Tool execution aborted.', 'AbortError')) {
        if (!this.#controller.signal.aborted) {
            this.#controller.abort(reason);
        }
    }

    /**
     * Runs shutdown hooks and releases references.
     *
     * @param {unknown} [reason]
     * @returns {Promise<void>}
     */
    async stop(reason) {
        if (this.#status === 'stopped' || this.#status === 'stopping') {
            return;
        }

        this.#status = 'stopping';

        if (reason !== undefined) {
            this.abort(reason);
        }

        try {
            await this.invoke('beforeDestroy', this.#context);

            if (typeof /** @type {{destroy?: unknown}} */ (this.#tool).destroy === 'function') {
                await this.invoke('destroy', this.#context);
            } else {
                await this.invoke('shutdown', this.#context);
            }

            await this.invoke('afterDestroy', this.#context);
        } finally {
            this.#externalAbortCleanup?.();
            this.#externalAbortCleanup = null;
            ToolRunner.unregister(this.#context.id, this);
            this.#status = 'stopped';
        }
    }

    /**
     * Returns a serializable execution snapshot.
     *
     * @returns {Record<string, unknown>}
     */
    snapshot() {
        return {
            contextId: this.#context.id,
            status: this.#status,
            duration: this.#duration,
            error: this.#lastError
                ? {
                    name: this.#lastError.name,
                    message: this.#lastError.message,
                }
                : null,
            aborted: this.#controller.signal.aborted,
        };
    }

    /**
     * Executes the lifecycle.
     *
     * @param {unknown} input
     * @returns {Promise<ToolRunResult>}
     */
    async #execute(input) {
        if (this.#status === 'stopped') {
            throw new Error('A stopped ToolRunner cannot be started again.');
        }

        if (this.#controller.signal.aborted) {
            throw this.#controller.signal.reason
                ?? new DOMException('Tool execution aborted.', 'AbortError');
        }

        const startedAt = now();

        this.#status = 'starting';
        this.#lastError = null;

        try {
            await this.invoke('beforeInit', this.#context, input);

            if (typeof /** @type {{init?: unknown}} */ (this.#tool).init === 'function') {
                await this.invoke('init', this.#context, input);
            } else {
                await this.invoke('initialize', this.#context, input);
            }

            await this.invoke('afterInit', this.#context, input);

            this.#status = 'running';

            await this.invoke('beforeRun', this.#context, input);

            let value;

            if (typeof /** @type {{run?: unknown}} */ (this.#tool).run === 'function') {
                value = await this.invoke('run', input, this.#context);
            } else if (
                typeof /** @type {{calculate?: unknown}} */ (this.#tool).calculate
                === 'function'
            ) {
                value = await this.invoke('calculate', input, this.#context);
            } else if (
                typeof /** @type {{execute?: unknown}} */ (this.#tool).execute
                === 'function'
            ) {
                value = await this.invoke('execute', input, this.#context);
            }

            await this.invoke('afterRun', value, this.#context, input);

            if (this.#autoRender) {
                await this.invoke('beforeRender', value, this.#context);
                await this.invoke('render', value, this.#context);
                await this.invoke('afterRender', value, this.#context);
            }

            this.#lastValue = value;
            this.#status = 'running';

            return {
                value,
                duration: now() - startedAt,
                status: this.#status,
            };
        } catch (error) {
            this.#lastError = error instanceof Error
                ? error
                : new Error(String(error));
            this.#status = 'failed';

            try {
                await this.invoke(
                    'onError',
                    this.#lastError,
                    this.#context,
                    input,
                );
            } catch {
                // Preserve the original lifecycle failure.
            }

            throw this.#lastError;
        } finally {
            this.#duration = now() - startedAt;

            if (this.#autoDestroy) {
                await this.stop();
            }
        }
    }

    /**
     * Binds an external cancellation signal.
     *
     * @param {AbortSignal} signal
     * @returns {void}
     */
    #bindExternalSignal(signal) {
        this.#externalSignal = signal;

        if (signal.aborted) {
            this.abort(signal.reason);
            return;
        }

        const onAbort = () => this.abort(signal.reason);

        signal.addEventListener('abort', onAbort, { once: true });
        this.#externalAbortCleanup = () => {
            signal.removeEventListener('abort', onAbort);
        };
    }

    /**
     * Creates a runner.
     *
     * @param {unknown} tool
     * @param {ToolRunnerOptions} [options]
     * @returns {ToolRunner}
     */
    static create(tool, options = {}) {
        return new ToolRunner(tool, options);
    }

    /**
     * Creates, registers and starts a runner.
     *
     * @param {unknown} tool
     * @param {unknown} [input]
     * @param {ToolRunnerOptions} [options]
     * @returns {Promise<ToolRunResult>}
     */
    static async execute(tool, input, options = {}) {
        const runner = new ToolRunner(tool, options);
        ToolRunner.register(runner.context.id, runner);

        return runner.run(input);
    }

    /**
     * Registers a runner.
     *
     * @param {string} id
     * @param {ToolRunner} runner
     * @returns {ToolRunner}
     */
    static register(id, runner) {
        if (typeof id !== 'string' || id.trim().length === 0) {
            throw new TypeError('Runner id must be a non-empty string.');
        }

        if (!(runner instanceof ToolRunner)) {
            throw new TypeError('Only ToolRunner instances can be registered.');
        }

        const normalizedId = id.trim();

        if (ToolRunner.#registry.has(normalizedId)) {
            throw new Error(`ToolRunner "${normalizedId}" is already registered.`);
        }

        ToolRunner.#registry.set(normalizedId, runner);

        return runner;
    }

    /**
     * Returns a registered runner.
     *
     * @param {string} id
     * @returns {ToolRunner | null}
     */
    static get(id) {
        if (typeof id !== 'string') {
            return null;
        }

        return ToolRunner.#registry.get(id.trim()) ?? null;
    }

    /**
     * Returns whether a runner is registered.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static has(id) {
        return typeof id === 'string' && ToolRunner.#registry.has(id.trim());
    }

    /**
     * Unregisters a runner.
     *
     * @param {string} id
     * @param {ToolRunner} [expectedRunner]
     * @returns {boolean}
     */
    static unregister(id, expectedRunner) {
        if (typeof id !== 'string') {
            return false;
        }

        const normalizedId = id.trim();
        const current = ToolRunner.#registry.get(normalizedId);

        if (!current || (expectedRunner && current !== expectedRunner)) {
            return false;
        }

        return ToolRunner.#registry.delete(normalizedId);
    }

    /**
     * Returns all registered runner ids.
     *
     * @returns {string[]}
     */
    static ids() {
        return [...ToolRunner.#registry.keys()].sort();
    }

    /**
     * Stops and removes every registered runner.
     *
     * @param {unknown} [reason]
     * @returns {Promise<void>}
     */
    static async shutdownAll(reason) {
        const runners = [...ToolRunner.#registry.values()];

        await Promise.allSettled(
            runners.map((runner) => runner.stop(reason)),
        );

        ToolRunner.#registry.clear();
    }

    /**
     * Returns the number of registered runners.
     *
     * @returns {number}
     */
    static count() {
        return ToolRunner.#registry.size;
    }
}

Object.freeze(ToolRunner.prototype);

export {
    ToolRunner,
    createTimeoutError,
    isPromiseLike,
    resolveValue,
    withGuards,
};

export default ToolRunner;

// END OF FILE
