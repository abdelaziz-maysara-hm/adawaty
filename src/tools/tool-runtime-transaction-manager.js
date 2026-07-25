/**
 * @file Atomic transaction coordination for tool runtime operations.
 * @module tools/tool-runtime-transaction-manager
 */

const DEFAULT_HISTORY_LIMIT = 100;

class ToolTransactionError extends Error {
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolTransactionError';
        this.code = options.code ?? 'TOOL_TRANSACTION_FAILED';
        this.transactionId = options.transactionId ?? '';
        this.rollbackErrors = Object.freeze([
            ...(options.rollbackErrors ?? []),
        ]);
    }
}

class ToolRuntimeTransactionManager {
    /**
     * @param {{
     *   historyLimit?: number,
     *   timeoutMs?: number,
     *   now?: () => number,
     *   createId?: () => string
     * }} [options]
     */
    constructor(options = {}) {
        this.historyLimit = normalizePositiveInteger(
            options.historyLimit,
            DEFAULT_HISTORY_LIMIT,
            'historyLimit',
        );
        this.timeoutMs = normalizeNonNegativeInteger(
            options.timeoutMs,
            0,
            'timeoutMs',
        );
        this.now = normalizeFunction(
            options.now ?? (() => Date.now()),
            'now',
        );
        this.createId = normalizeFunction(
            options.createId ?? createTransactionId,
            'createId',
        );
        this.active = new Map();
        this.history = [];
        this.counters = {
            started: 0,
            committed: 0,
            rolledBack: 0,
            failed: 0,
        };
    }

    /**
     * @template T
     * @param {{
     *   id?: string,
     *   label?: string,
     *   metadata?: Record<string, unknown>,
     *   timeoutMs?: number,
     *   signal?: AbortSignal
     * }} [options]
     * @param {(transaction: Readonly<Record<string, unknown>>) => Promise<T>|T} callback
     * @returns {Promise<T>}
     */
    async run(options = {}, callback) {
        if (typeof options === 'function' && callback === undefined) {
            callback = options;
            options = {};
        }

        if (typeof callback !== 'function') {
            throw new TypeError('Transaction callback must be a function.');
        }

        const id = normalizeText(options.id ?? this.createId(), 'id');

        if (this.active.has(id)) {
            throw new ToolTransactionError(
                `Transaction "${id}" is already active.`,
                {
                    code: 'TOOL_TRANSACTION_DUPLICATE',
                    transactionId: id,
                },
            );
        }

        const startedAt = this.now();
        const state = {
            id,
            label: String(options.label ?? '').trim(),
            metadata: cloneValue(options.metadata ?? {}),
            startedAt,
            status: 'active',
            rollbackHandlers: [],
            commitHandlers: [],
            abortController: new AbortController(),
        };
        const timeoutMs = normalizeNonNegativeInteger(
            options.timeoutMs,
            this.timeoutMs,
            'timeoutMs',
        );
        const removeExternalAbort = linkAbortSignal(
            options.signal,
            state.abortController,
        );
        const timeout = timeoutMs > 0
            ? setTimeout(
                () => state.abortController.abort(
                    new ToolTransactionError(
                        `Transaction "${id}" timed out after ${timeoutMs}ms.`,
                        {
                            code: 'TOOL_TRANSACTION_TIMEOUT',
                            transactionId: id,
                        },
                    ),
                ),
                timeoutMs,
            )
            : null;

        this.active.set(id, state);
        this.counters.started += 1;

        try {
            const result = await raceWithAbort(
                Promise.resolve(callback(createTransactionContext(state))),
                state.abortController.signal,
                id,
            );

            state.status = 'committing';
            await runHandlers(state.commitHandlers, false);
            state.status = 'committed';
            this.counters.committed += 1;
            this.record(state);
            return result;
        } catch (error) {
            state.status = 'rolling-back';
            const rollbackErrors = await runHandlers(
                state.rollbackHandlers,
                true,
            );
            state.status = 'rolled-back';
            state.error = serializeError(error);
            this.counters.rolledBack += 1;
            this.counters.failed += 1;
            this.record(state, rollbackErrors);

            throw new ToolTransactionError(
                `Transaction "${id}" failed and was rolled back.`,
                {
                    code: 'TOOL_TRANSACTION_ROLLED_BACK',
                    transactionId: id,
                    cause: error,
                    rollbackErrors,
                },
            );
        } finally {
            if (timeout !== null) {
                clearTimeout(timeout);
            }

            removeExternalAbort();
            this.active.delete(id);
        }
    }

    getSnapshot() {
        return Object.freeze({
            activeCount: this.active.size,
            historyCount: this.history.length,
            started: this.counters.started,
            committed: this.counters.committed,
            rolledBack: this.counters.rolledBack,
            failed: this.counters.failed,
            active: Object.freeze(
                [...this.active.values()].map((state) =>
                    freezeRecord(state, this.now()),
                ),
            ),
        });
    }

    getHistory() {
        return Object.freeze([...this.history]);
    }

    clearHistory() {
        const count = this.history.length;
        this.history.length = 0;
        return count;
    }

    abort(id, reason) {
        const state = this.active.get(String(id ?? '').trim());

        if (!state) {
            return false;
        }

        state.abortController.abort(
            reason ?? new ToolTransactionError(
                `Transaction "${state.id}" was aborted.`,
                {
                    code: 'TOOL_TRANSACTION_ABORTED',
                    transactionId: state.id,
                },
            ),
        );
        return true;
    }

    record(state, rollbackErrors = []) {
        const record = Object.freeze({
            ...freezeRecord(state, this.now()),
            metadata: deepFreeze(cloneValue(state.metadata)),
            error: state.error ?? null,
            rollbackErrors: Object.freeze(
                rollbackErrors.map(serializeError),
            ),
        });

        this.history.push(record);

        if (this.history.length > this.historyLimit) {
            this.history.splice(0, this.history.length - this.historyLimit);
        }
    }
}

function createTransactionContext(state) {
    const assertActive = () => {
        if (state.status !== 'active') {
            throw new ToolTransactionError(
                `Transaction "${state.id}" is not active.`,
                {
                    code: 'TOOL_TRANSACTION_INACTIVE',
                    transactionId: state.id,
                },
            );
        }

        if (state.abortController.signal.aborted) {
            throw state.abortController.signal.reason;
        }
    };

    return Object.freeze({
        id: state.id,
        label: state.label,
        signal: state.abortController.signal,
        metadata: deepFreeze(cloneValue(state.metadata)),
        deferRollback(handler) {
            assertActive();
            state.rollbackHandlers.push(
                normalizeFunction(handler, 'rollback handler'),
            );
        },
        deferCommit(handler) {
            assertActive();
            state.commitHandlers.push(
                normalizeFunction(handler, 'commit handler'),
            );
        },
        assertActive,
    });
}

async function runHandlers(handlers, reverse) {
    const queue = reverse ? [...handlers].reverse() : [...handlers];
    const errors = [];

    for (const handler of queue) {
        try {
            await handler();
        } catch (error) {
            errors.push(error);
        }
    }

    if (!reverse && errors.length > 0) {
        throw errors[0];
    }

    return errors;
}

function raceWithAbort(promise, signal, transactionId) {
    if (signal.aborted) {
        return Promise.reject(signal.reason);
    }

    return new Promise((resolve, reject) => {
        const handleAbort = () => {
            reject(
                signal.reason ?? new ToolTransactionError(
                    `Transaction "${transactionId}" was aborted.`,
                    {
                        code: 'TOOL_TRANSACTION_ABORTED',
                        transactionId,
                    },
                ),
            );
        };

        signal.addEventListener('abort', handleAbort, { once: true });
        promise.then(resolve, reject).finally(() => {
            signal.removeEventListener('abort', handleAbort);
        });
    });
}

function linkAbortSignal(signal, controller) {
    if (!signal) {
        return () => {};
    }

    if (!(signal instanceof AbortSignal)) {
        throw new TypeError('signal must be an AbortSignal.');
    }

    const handleAbort = () => controller.abort(signal.reason);

    if (signal.aborted) {
        handleAbort();
    } else {
        signal.addEventListener('abort', handleAbort, { once: true });
    }

    return () => signal.removeEventListener('abort', handleAbort);
}

function freezeRecord(state, endedAt) {
    return Object.freeze({
        id: state.id,
        label: state.label,
        status: state.status,
        startedAt: state.startedAt,
        endedAt: state.status === 'active' ? null : endedAt,
        durationMs: Math.max(0, endedAt - state.startedAt),
        rollbackHandlerCount: state.rollbackHandlers.length,
        commitHandlerCount: state.commitHandlers.length,
    });
}

function serializeError(error) {
    return Object.freeze({
        name: String(error?.name ?? 'Error'),
        message: String(error?.message ?? error ?? 'Unknown error'),
        code: error?.code ? String(error.code) : '',
    });
}

function cloneValue(value) {
    try {
        return structuredClone(value);
    } catch (error) {
        throw new ToolTransactionError(
            'Transaction metadata must be structured-clone compatible.',
            {
                code: 'TOOL_TRANSACTION_METADATA_INVALID',
                cause: error,
            },
        );
    }
}

function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
        return value;
    }

    for (const child of Object.values(value)) {
        deepFreeze(child);
    }

    return Object.freeze(value);
}

function createTransactionId() {
    return globalThis.crypto?.randomUUID?.()
        ?? `transaction-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeText(value, field) {
    const text = String(value ?? '').trim();

    if (!text) {
        throw new TypeError(`${field} is required.`);
    }

    return text;
}

function normalizeFunction(value, field) {
    if (typeof value !== 'function') {
        throw new TypeError(`${field} must be a function.`);
    }

    return value;
}

function normalizeNonNegativeInteger(value, fallback, field) {
    if (value === undefined) {
        return fallback;
    }

    if (!Number.isFinite(value) || value < 0) {
        throw new TypeError(`${field} must be a non-negative number.`);
    }

    return Math.trunc(value);
}

function normalizePositiveInteger(value, fallback, field) {
    const number = normalizeNonNegativeInteger(value, fallback, field);

    if (number < 1) {
        throw new TypeError(`${field} must be greater than zero.`);
    }

    return number;
}

export {
    ToolRuntimeTransactionManager,
    ToolTransactionError,
};

// END OF FILE
