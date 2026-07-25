/**
 * @file Runtime observability, health tracking and circuit breaking.
 * @module tools/tool-runtime-monitor
 */

const DEFAULT_FAILURE_THRESHOLD = 3;
const DEFAULT_COOLDOWN_MS = 30_000;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_HISTORY_LIMIT = 200;

/**
 * Error raised when a runtime circuit is open.
 */
class ToolCircuitOpenError extends Error {
    /**
     * @param {string} message
     * @param {{
     *   toolId?: string,
     *   retryAt?: number|null
     * }} [options]
     */
    constructor(message, options = {}) {
        super(message);
        this.name = 'ToolCircuitOpenError';
        this.code = 'TOOL_CIRCUIT_OPEN';
        this.toolId = options.toolId ?? '';
        this.retryAt = options.retryAt ?? null;
    }
}

/**
 * Tracks tool runtime health and protects unstable tools with a circuit breaker.
 */
class ToolRuntimeMonitor {
    /**
     * @param {{
     *   failureThreshold?: number,
     *   cooldownMs?: number,
     *   windowMs?: number,
     *   historyLimit?: number,
     *   now?: () => number,
     *   reporter?: (entry: Readonly<Record<string, unknown>>) => void|Promise<void>
     * }} [options]
     */
    constructor(options = {}) {
        this.failureThreshold = normalizePositiveInteger(
            options.failureThreshold,
            DEFAULT_FAILURE_THRESHOLD,
            'failureThreshold',
        );
        this.cooldownMs = normalizeNonNegativeInteger(
            options.cooldownMs,
            DEFAULT_COOLDOWN_MS,
            'cooldownMs',
        );
        this.windowMs = normalizePositiveInteger(
            options.windowMs,
            DEFAULT_WINDOW_MS,
            'windowMs',
        );
        this.historyLimit = normalizePositiveInteger(
            options.historyLimit,
            DEFAULT_HISTORY_LIMIT,
            'historyLimit',
        );
        this.now =
            options.now === undefined
                ? () => Date.now()
                : normalizeFunction(options.now, 'now');
        this.reporter =
            options.reporter === undefined
                ? null
                : normalizeFunction(options.reporter, 'reporter');

        /** @type {Map<string, Record<string, unknown>>} */
        this.records = new Map();

        /** @type {Array<Readonly<Record<string, unknown>>>} */
        this.history = [];
    }

    /**
     * Throws when a tool is not currently allowed to execute.
     *
     * @param {string} toolId
     * @returns {Readonly<Record<string, unknown>>}
     */
    assertAvailable(toolId) {
        const record = this.getOrCreate(toolId);
        this.refreshCircuit(record);

        if (record.state === 'open') {
            throw new ToolCircuitOpenError(
                `Tool "${record.toolId}" is temporarily unavailable.`,
                {
                    toolId: record.toolId,
                    retryAt: record.retryAt,
                },
            );
        }

        return this.createPublicRecord(record);
    }

    /**
     * Records a successful runtime operation.
     *
     * @param {string} toolId
     * @param {{
     *   phase?: string,
     *   durationMs?: number,
     *   metadata?: Record<string, unknown>
     * }} [details]
     * @returns {Readonly<Record<string, unknown>>}
     */
    recordSuccess(toolId, details = {}) {
        const record = this.getOrCreate(toolId);
        const timestamp = this.now();

        record.successCount += 1;
        record.consecutiveFailures = 0;
        record.lastSuccessAt = timestamp;
        record.lastError = null;
        record.state = 'closed';
        record.retryAt = null;

        const durationMs = normalizeOptionalDuration(details.durationMs);
        if (durationMs !== null) {
            record.totalDurationMs += durationMs;
            record.durationSamples += 1;
            record.lastDurationMs = durationMs;
            record.maxDurationMs = Math.max(record.maxDurationMs, durationMs);
        }

        this.appendHistory('success', record, details);
        return this.createPublicRecord(record);
    }

    /**
     * Records a failed runtime operation and opens the circuit when required.
     *
     * @param {string} toolId
     * @param {unknown} error
     * @param {{
     *   phase?: string,
     *   durationMs?: number,
     *   metadata?: Record<string, unknown>
     * }} [details]
     * @returns {Readonly<Record<string, unknown>>}
     */
    recordFailure(toolId, error, details = {}) {
        const record = this.getOrCreate(toolId);
        const timestamp = this.now();

        this.pruneFailureWindow(record, timestamp);
        record.failureTimestamps.push(timestamp);
        record.failureCount += 1;
        record.consecutiveFailures += 1;
        record.lastFailureAt = timestamp;
        record.lastError = normalizeError(error);

        const durationMs = normalizeOptionalDuration(details.durationMs);
        if (durationMs !== null) {
            record.totalDurationMs += durationMs;
            record.durationSamples += 1;
            record.lastDurationMs = durationMs;
            record.maxDurationMs = Math.max(record.maxDurationMs, durationMs);
        }

        if (record.failureTimestamps.length >= this.failureThreshold) {
            record.state = 'open';
            record.openedAt = timestamp;
            record.retryAt = timestamp + this.cooldownMs;
        }

        this.appendHistory('failure', record, {
            ...details,
            error: record.lastError,
        });

        return this.createPublicRecord(record);
    }

    /**
     * Executes an operation under circuit-breaker protection.
     *
     * @template T
     * @param {string} toolId
     * @param {() => Promise<T>|T} operation
     * @param {{phase?: string, metadata?: Record<string, unknown>}} [details]
     * @returns {Promise<T>}
     */
    async run(toolId, operation, details = {}) {
        this.assertAvailable(toolId);
        const startedAt = this.now();

        try {
            const result = await operation();

            this.recordSuccess(toolId, {
                ...details,
                durationMs: Math.max(0, this.now() - startedAt),
            });

            return result;
        } catch (error) {
            if (error instanceof ToolCircuitOpenError) {
                throw error;
            }

            this.recordFailure(toolId, error, {
                ...details,
                durationMs: Math.max(0, this.now() - startedAt),
            });
            throw error;
        }
    }

    /**
     * Explicitly resets a tool circuit and health counters.
     *
     * @param {string} toolId
     * @returns {boolean}
     */
    reset(toolId) {
        const id = normalizeToolId(toolId);
        const existed = this.records.delete(id);

        if (existed) {
            this.appendRawHistory(
                Object.freeze({
                    type: 'reset',
                    toolId: id,
                    timestamp: this.now(),
                }),
            );
        }

        return existed;
    }

    /**
     * @param {string} toolId
     * @returns {Readonly<Record<string, unknown>>}
     */
    getHealth(toolId) {
        const record = this.getOrCreate(toolId);
        this.refreshCircuit(record);
        return this.createPublicRecord(record);
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    getSnapshot() {
        const tools = [...this.records.values()]
            .map((record) => {
                this.refreshCircuit(record);
                return this.createPublicRecord(record);
            })
            .sort((left, right) => left.toolId.localeCompare(right.toolId));

        const counts = tools.reduce(
            (result, tool) => {
                result[tool.state] += 1;
                return result;
            },
            {
                closed: 0,
                open: 0,
                halfOpen: 0,
            },
        );

        return Object.freeze({
            toolCount: tools.length,
            healthyCount: counts.closed,
            openCount: counts.open,
            halfOpenCount: counts.halfOpen,
            tools: Object.freeze(tools),
        });
    }

    /**
     * @param {{toolId?: string, type?: string}} [filters]
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getHistory(filters = {}) {
        const toolId =
            filters.toolId === undefined
                ? null
                : normalizeToolId(filters.toolId);
        const type =
            filters.type === undefined
                ? null
                : String(filters.type).trim();

        return Object.freeze(
            this.history.filter(
                (entry) =>
                    (!toolId || entry.toolId === toolId) &&
                    (!type || entry.type === type),
            ),
        );
    }

    /**
     * @private
     * @param {string} toolId
     * @returns {Record<string, unknown>}
     */
    getOrCreate(toolId) {
        const id = normalizeToolId(toolId);

        if (!this.records.has(id)) {
            this.records.set(id, {
                toolId: id,
                state: 'closed',
                successCount: 0,
                failureCount: 0,
                consecutiveFailures: 0,
                failureTimestamps: [],
                lastSuccessAt: null,
                lastFailureAt: null,
                lastError: null,
                openedAt: null,
                retryAt: null,
                totalDurationMs: 0,
                durationSamples: 0,
                lastDurationMs: null,
                maxDurationMs: 0,
            });
        }

        return this.records.get(id);
    }

    /**
     * @private
     * @param {Record<string, unknown>} record
     * @returns {void}
     */
    refreshCircuit(record) {
        if (
            record.state === 'open' &&
            record.retryAt !== null &&
            this.now() >= record.retryAt
        ) {
            record.state = 'halfOpen';
        }
    }

    /**
     * @private
     * @param {Record<string, unknown>} record
     * @param {number} now
     * @returns {void}
     */
    pruneFailureWindow(record, now) {
        const minimum = now - this.windowMs;
        record.failureTimestamps = record.failureTimestamps.filter(
            (timestamp) => timestamp >= minimum,
        );
    }

    /**
     * @private
     * @param {string} type
     * @param {Record<string, unknown>} record
     * @param {Record<string, unknown>} details
     * @returns {void}
     */
    appendHistory(type, record, details) {
        const entry = Object.freeze({
            type,
            toolId: record.toolId,
            state: record.state,
            phase: String(details.phase ?? 'runtime'),
            timestamp: this.now(),
            durationMs: normalizeOptionalDuration(details.durationMs),
            error: details.error ?? null,
            metadata: Object.freeze({
                ...(details.metadata ?? {}),
            }),
        });

        this.appendRawHistory(entry);
    }

    /**
     * @private
     * @param {Readonly<Record<string, unknown>>} entry
     * @returns {void}
     */
    appendRawHistory(entry) {
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
     * @param {Record<string, unknown>} record
     * @returns {Readonly<Record<string, unknown>>}
     */
    createPublicRecord(record) {
        const averageDurationMs =
            record.durationSamples > 0
                ? record.totalDurationMs / record.durationSamples
                : null;

        return Object.freeze({
            toolId: record.toolId,
            state: record.state,
            successCount: record.successCount,
            failureCount: record.failureCount,
            consecutiveFailures: record.consecutiveFailures,
            lastSuccessAt: record.lastSuccessAt,
            lastFailureAt: record.lastFailureAt,
            lastError: record.lastError,
            openedAt: record.openedAt,
            retryAt: record.retryAt,
            lastDurationMs: record.lastDurationMs,
            averageDurationMs,
            maxDurationMs: record.maxDurationMs,
        });
    }
}

/**
 * @param {unknown} error
 * @returns {Readonly<Record<string, unknown>>}
 */
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

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function normalizeOptionalDuration(value) {
    if (value === undefined || value === null) {
        return null;
    }

    if (!Number.isFinite(value) || value < 0) {
        throw new TypeError('durationMs must be a non-negative number.');
    }

    return value;
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
 * @param {number} fallback
 * @param {string} field
 * @returns {number}
 */
function normalizePositiveInteger(value, fallback, field) {
    const normalized = normalizeNonNegativeInteger(value, fallback, field);

    if (normalized < 1) {
        throw new TypeError(`${field} must be greater than zero.`);
    }

    return normalized;
}

/**
 * @param {unknown} value
 * @param {string} field
 * @returns {Function}
 */
function normalizeFunction(value, field) {
    if (typeof value !== 'function') {
        throw new TypeError(`${field} must be a function.`);
    }

    return value;
}

export {
    ToolCircuitOpenError,
    ToolRuntimeMonitor,
};

// END OF FILE
