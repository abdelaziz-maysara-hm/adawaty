/**
 * @file Runtime hooks and interception framework.
 * @module tools/tool-runtime-hook-manager
 */

const DEFAULT_HISTORY_LIMIT = 500;
const DEFAULT_TIMEOUT_MS = 5000;

/**
 * Runtime hook execution error.
 */
class ToolHookError extends Error {
    /**
     * @param {string} message
     * @param {{
     *   code?: string,
     *   hookName?: string,
     *   hookId?: string,
     *   cause?: unknown
     * }} [options]
     */
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolHookError';
        this.code = options.code ?? 'TOOL_HOOK_FAILED';
        this.hookName = options.hookName ?? '';
        this.hookId = options.hookId ?? '';
    }
}

/**
 * Executes before, after and around runtime hooks with owner cleanup.
 */
class ToolRuntimeHookManager {
    /**
     * @param {{
     *   now?: () => number,
     *   historyLimit?: number,
     *   timeoutMs?: number,
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
        this.timeoutMs = positiveInteger(
            options.timeoutMs,
            DEFAULT_TIMEOUT_MS,
            'timeoutMs',
        );
        this.reporter =
            options.reporter === undefined
                ? null
                : requireFunction(options.reporter, 'reporter');

        /** @type {Map<string, Map<string, Record<string, unknown>>>} */
        this.hooks = new Map();

        /** @type {Array<Readonly<Record<string, unknown>>>} */
        this.history = [];

        this.sequence = 0;
        this.executedCount = 0;
        this.failedCount = 0;
    }

    /**
     * Registers a hook.
     *
     * @param {string} hookName
     * @param {'before'|'after'|'around'} phase
     * @param {Function} handler
     * @param {{
     *   priority?: number,
     *   ownerId?: string,
     *   once?: boolean,
     *   condition?: (context: Readonly<Record<string, unknown>>) => boolean|Promise<boolean>,
     *   timeoutMs?: number
     * }} [options]
     * @returns {Readonly<Record<string, unknown>>}
     */
    register(hookName, phase, handler, options = {}) {
        const name = normalizeHookName(hookName);
        const normalizedPhase = normalizePhase(phase);
        requireFunction(handler, 'handler');

        if (
            options.condition !== undefined &&
            typeof options.condition !== 'function'
        ) {
            throw new TypeError('condition must be a function.');
        }

        const entry = {
            id: `hook:${++this.sequence}`,
            hookName: name,
            phase: normalizedPhase,
            handler,
            priority: normalizePriority(options.priority),
            ownerId: optionalText(options.ownerId),
            once: options.once === true,
            condition: options.condition ?? null,
            timeoutMs: positiveInteger(
                options.timeoutMs,
                this.timeoutMs,
                'timeoutMs',
            ),
            createdAt: this.now(),
            executionCount: 0,
            failureCount: 0,
        };

        const bucket = this.hooks.get(name) ?? new Map();
        bucket.set(entry.id, entry);
        this.hooks.set(name, bucket);
        this.record('registered', {
            hookName: name,
            hookId: entry.id,
            phase: normalizedPhase,
            ownerId: entry.ownerId,
        });

        return Object.freeze({
            id: entry.id,
            hookName: name,
            phase: normalizedPhase,
            ownerId: entry.ownerId,
            remove: () => this.remove(entry.id),
        });
    }

    before(hookName, handler, options = {}) {
        return this.register(hookName, 'before', handler, options);
    }

    after(hookName, handler, options = {}) {
        return this.register(hookName, 'after', handler, options);
    }

    around(hookName, handler, options = {}) {
        return this.register(hookName, 'around', handler, options);
    }

    /**
     * Removes a hook by id.
     *
     * @param {string} hookId
     * @returns {boolean}
     */
    remove(hookId) {
        const id = String(hookId ?? '');

        for (const [hookName, bucket] of this.hooks) {
            const entry = bucket.get(id);

            if (!entry) {
                continue;
            }

            bucket.delete(id);

            if (bucket.size === 0) {
                this.hooks.delete(hookName);
            }

            this.record('removed', {
                hookName,
                hookId: id,
                phase: entry.phase,
                ownerId: entry.ownerId,
            });
            return true;
        }

        return false;
    }

    /**
     * Removes all hooks owned by one owner.
     *
     * @param {string} ownerId
     * @returns {number}
     */
    removeOwner(ownerId) {
        const id = requiredText(ownerId, 'ownerId');
        let removed = 0;

        for (const [hookName, bucket] of this.hooks) {
            for (const [hookId, entry] of bucket) {
                if (entry.ownerId === id) {
                    bucket.delete(hookId);
                    removed += 1;
                }
            }

            if (bucket.size === 0) {
                this.hooks.delete(hookName);
            }
        }

        this.record('owner-removed', {
            ownerId: id,
            removed,
        });

        return removed;
    }

    /**
     * Executes a hook pipeline around an operation.
     *
     * @template T
     * @param {string} hookName
     * @param {Readonly<Record<string, unknown>>} context
     * @param {() => T|Promise<T>} operation
     * @returns {Promise<T>}
     */
    async execute(hookName, context = {}, operation = async () => undefined) {
        const name = normalizeHookName(hookName);
        requireFunction(operation, 'operation');

        const startedAt = this.now();
        const hooks = this.resolve(name);
        const beforeHooks = hooks.filter((entry) => entry.phase === 'before');
        const afterHooks = hooks.filter((entry) => entry.phase === 'after');
        const aroundHooks = hooks.filter((entry) => entry.phase === 'around');
        const immutableContext = Object.freeze({
            ...context,
            hookName: name,
        });

        try {
            for (const entry of beforeHooks) {
                await this.invoke(entry, immutableContext);
            }

            const invokeOperation = aroundHooks.reduceRight(
                (next, entry) => async () =>
                    this.invoke(entry, immutableContext, next),
                async () => operation(),
            );

            let result = await invokeOperation();

            for (const entry of afterHooks) {
                const transformed = await this.invoke(
                    entry,
                    Object.freeze({
                        ...immutableContext,
                        result,
                    }),
                );

                if (transformed !== undefined) {
                    result = transformed;
                }
            }

            this.executedCount += 1;
            this.record('executed', {
                hookName: name,
                durationMs: this.now() - startedAt,
                hookCount: hooks.length,
                success: true,
            });

            return result;
        } catch (error) {
            this.failedCount += 1;
            this.record('failed', {
                hookName: name,
                durationMs: this.now() - startedAt,
                hookCount: hooks.length,
                success: false,
                error: normalizeError(error),
            });

            if (error instanceof ToolHookError) {
                throw error;
            }

            throw new ToolHookError(
                `Hook pipeline "${name}" failed.`,
                {
                    code: 'TOOL_HOOK_PIPELINE_FAILED',
                    hookName: name,
                    cause: error,
                },
            );
        }
    }

    getSnapshot() {
        let hookCount = 0;

        for (const bucket of this.hooks.values()) {
            hookCount += bucket.size;
        }

        return Object.freeze({
            hookCount,
            hookNameCount: this.hooks.size,
            executedCount: this.executedCount,
            failedCount: this.failedCount,
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

    clear() {
        this.hooks.clear();
        this.clearHistory();
    }

    /**
     * @private
     */
    resolve(hookName) {
        const matched = [];

        for (const [pattern, bucket] of this.hooks) {
            if (matchesHookPattern(pattern, hookName)) {
                matched.push(...bucket.values());
            }
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
    async invoke(entry, context, next) {
        if (
            entry.condition &&
            !(await entry.condition(context))
        ) {
            return undefined;
        }

        try {
            const task =
                entry.phase === 'around'
                    ? Promise.resolve(entry.handler(context, next))
                    : Promise.resolve(entry.handler(context));

            const result = await withTimeout(
                task,
                entry.timeoutMs,
                () =>
                    new ToolHookError(
                        `Hook "${entry.id}" timed out.`,
                        {
                            code: 'TOOL_HOOK_TIMEOUT',
                            hookName: entry.hookName,
                            hookId: entry.id,
                        },
                    ),
            );

            entry.executionCount += 1;

            if (entry.once) {
                this.remove(entry.id);
            }

            return result;
        } catch (error) {
            entry.failureCount += 1;

            if (entry.once) {
                this.remove(entry.id);
            }

            if (error instanceof ToolHookError) {
                throw error;
            }

            throw new ToolHookError(
                `Hook "${entry.id}" failed.`,
                {
                    code: 'TOOL_HOOK_HANDLER_FAILED',
                    hookName: entry.hookName,
                    hookId: entry.id,
                    cause: error,
                },
            );
        }
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
}

function normalizeHookName(value) {
    const name = requiredText(value, 'hookName');

    if (!/^[a-z0-9][a-z0-9._:-]*(?:\.\*)?$/i.test(name)) {
        throw new TypeError(`Invalid hook name "${name}".`);
    }

    return name;
}

function normalizePhase(value) {
    if (value === 'before' || value === 'after' || value === 'around') {
        return value;
    }

    throw new TypeError('phase must be before, after or around.');
}

function matchesHookPattern(pattern, hookName) {
    if (pattern === '*') {
        return true;
    }

    if (pattern.endsWith('.*')) {
        return hookName.startsWith(pattern.slice(0, -1));
    }

    return pattern === hookName;
}

function withTimeout(promise, timeoutMs, createError) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(createError()), timeoutMs);

        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            },
        );
    });
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
    ToolHookError,
    ToolRuntimeHookManager,
};

// END OF FILE
