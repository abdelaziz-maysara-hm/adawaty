/**
 * @file Versioned runtime state persistence and recovery.
 * @module tools/tool-runtime-state-store
 */

const DEFAULT_NAMESPACE = 'adawaty.tools';
const DEFAULT_MAX_BYTES = 1_048_576;

/**
 * Error raised for invalid or failed runtime state operations.
 */
class ToolStateError extends Error {
    /**
     * @param {string} message
     * @param {{
     *   code?: string,
     *   toolId?: string,
     *   slot?: string,
     *   cause?: unknown
     * }} [options]
     */
    constructor(message, options = {}) {
        super(message, {
            cause: options.cause,
        });

        this.name = 'ToolStateError';
        this.code = options.code ?? 'TOOL_STATE_FAILED';
        this.toolId = options.toolId ?? '';
        this.slot = options.slot ?? 'default';
    }
}

/**
 * In-memory adapter implementing the state storage contract.
 */
class MemoryToolStateAdapter {
    constructor() {
        this.records = new Map();
    }

    async get(key) {
        return this.records.has(key)
            ? cloneValue(this.records.get(key))
            : null;
    }

    async set(key, value) {
        this.records.set(key, cloneValue(value));
    }

    async delete(key) {
        return this.records.delete(key);
    }

    async keys(prefix = '') {
        return [...this.records.keys()]
            .filter((key) => key.startsWith(prefix))
            .sort();
    }

    async clear(prefix = '') {
        let count = 0;

        for (const key of await this.keys(prefix)) {
            if (this.records.delete(key)) {
                count += 1;
            }
        }

        return count;
    }
}

/**
 * Stores immutable, versioned tool runtime state.
 */
class ToolRuntimeStateStore {
    /**
     * @param {{
     *   adapter?: Record<string, Function>,
     *   namespace?: string,
     *   version?: number,
     *   maxBytes?: number,
     *   ttlMs?: number,
     *   now?: () => number,
     *   migrations?: Record<string, Function>
     * }} [options]
     */
    constructor(options = {}) {
        this.adapter = options.adapter ?? new MemoryToolStateAdapter();
        validateAdapter(this.adapter);

        this.namespace = normalizeText(
            options.namespace ?? DEFAULT_NAMESPACE,
            'namespace',
        );
        this.version = normalizePositiveInteger(
            options.version,
            1,
            'version',
        );
        this.maxBytes = normalizePositiveInteger(
            options.maxBytes,
            DEFAULT_MAX_BYTES,
            'maxBytes',
        );
        this.ttlMs = normalizeNonNegativeInteger(
            options.ttlMs,
            0,
            'ttlMs',
        );
        this.now =
            options.now === undefined
                ? () => Date.now()
                : normalizeFunction(options.now, 'now');
        this.migrations = Object.freeze({
            ...(options.migrations ?? {}),
        });
    }

    /**
     * @param {string} toolId
     * @param {string} slot
     * @param {unknown} state
     * @param {{metadata?: Record<string, unknown>}} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async save(toolId, slot, state, options = {}) {
        const id = normalizeText(toolId, 'toolId');
        const normalizedSlot = normalizeSlot(slot);
        const clonedState = cloneValue(state);
        const savedAt = this.now();
        const record = {
            toolId: id,
            slot: normalizedSlot,
            version: this.version,
            savedAt,
            expiresAt:
                this.ttlMs > 0 ? savedAt + this.ttlMs : null,
            metadata: cloneValue(options.metadata ?? {}),
            state: clonedState,
        };

        const bytes = measureBytes(record);

        if (bytes > this.maxBytes) {
            throw new ToolStateError(
                `State for tool "${id}" exceeds the ${this.maxBytes} byte limit.`,
                {
                    code: 'TOOL_STATE_TOO_LARGE',
                    toolId: id,
                    slot: normalizedSlot,
                },
            );
        }

        try {
            await this.adapter.set(
                this.createKey(id, normalizedSlot),
                record,
            );
        } catch (error) {
            throw new ToolStateError(
                `Failed to persist state for tool "${id}".`,
                {
                    code: 'TOOL_STATE_SAVE_FAILED',
                    toolId: id,
                    slot: normalizedSlot,
                    cause: error,
                },
            );
        }

        return freezeRecord(record, bytes);
    }

    /**
     * @param {string} toolId
     * @param {string} slot
     * @returns {Promise<Readonly<Record<string, unknown>>|null>}
     */
    async load(toolId, slot = 'default') {
        const id = normalizeText(toolId, 'toolId');
        const normalizedSlot = normalizeSlot(slot);
        const key = this.createKey(id, normalizedSlot);
        let record;

        try {
            record = await this.adapter.get(key);
        } catch (error) {
            throw new ToolStateError(
                `Failed to load state for tool "${id}".`,
                {
                    code: 'TOOL_STATE_LOAD_FAILED',
                    toolId: id,
                    slot: normalizedSlot,
                    cause: error,
                },
            );
        }

        if (!record) {
            return null;
        }

        if (
            record.expiresAt !== null &&
            record.expiresAt <= this.now()
        ) {
            await this.adapter.delete(key);
            return null;
        }

        const migrated = await this.migrate(record, id, normalizedSlot);
        return freezeRecord(migrated, measureBytes(migrated));
    }

    /**
     * @param {string} toolId
     * @param {string} slot
     * @returns {Promise<boolean>}
     */
    async remove(toolId, slot = 'default') {
        const id = normalizeText(toolId, 'toolId');
        return this.adapter.delete(this.createKey(id, normalizeSlot(slot)));
    }

    /**
     * @returns {Promise<number>}
     */
    async clear() {
        return this.adapter.clear(`${this.namespace}:`);
    }

    /**
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async exportSnapshot() {
        const keys = await this.adapter.keys(`${this.namespace}:`);
        const records = [];

        for (const key of keys) {
            const record = await this.adapter.get(key);

            if (record) {
                records.push(record);
            }
        }

        return Object.freeze({
            namespace: this.namespace,
            version: this.version,
            exportedAt: this.now(),
            recordCount: records.length,
            records: Object.freeze(
                records.map((record) =>
                    freezeRecord(record, measureBytes(record)),
                ),
            ),
        });
    }

    /**
     * @param {Readonly<Record<string, unknown>>} snapshot
     * @param {{replace?: boolean}} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async importSnapshot(snapshot, options = {}) {
        if (!snapshot || !Array.isArray(snapshot.records)) {
            throw new ToolStateError(
                'State snapshot must contain a records array.',
                {
                    code: 'TOOL_STATE_SNAPSHOT_INVALID',
                },
            );
        }

        if (options.replace === true) {
            await this.clear();
        }

        let importedCount = 0;

        for (const record of snapshot.records) {
            await this.save(
                record.toolId,
                record.slot,
                record.state,
                {
                    metadata: record.metadata,
                },
            );
            importedCount += 1;
        }

        return Object.freeze({
            importedCount,
            replaced: options.replace === true,
        });
    }

    /**
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async getSnapshot() {
        const exported = await this.exportSnapshot();
        const totalBytes = exported.records.reduce(
            (sum, record) => sum + record.bytes,
            0,
        );

        return Object.freeze({
            namespace: this.namespace,
            version: this.version,
            recordCount: exported.recordCount,
            totalBytes,
            maxBytesPerRecord: this.maxBytes,
            ttlMs: this.ttlMs,
        });
    }

    /**
     * @private
     */
    async migrate(record, toolId, slot) {
        let current = cloneValue(record);

        while (current.version < this.version) {
            const migration = this.migrations[String(current.version)];

            if (typeof migration !== 'function') {
                throw new ToolStateError(
                    `No migration exists from state version ${current.version}.`,
                    {
                        code: 'TOOL_STATE_MIGRATION_MISSING',
                        toolId,
                        slot,
                    },
                );
            }

            try {
                const nextState = await migration(
                    cloneValue(current.state),
                    Object.freeze({
                        toolId,
                        slot,
                        fromVersion: current.version,
                        toVersion: current.version + 1,
                        metadata: cloneValue(current.metadata),
                    }),
                );

                current = {
                    ...current,
                    version: current.version + 1,
                    state: cloneValue(nextState),
                };
            } catch (error) {
                throw new ToolStateError(
                    `Failed to migrate state for tool "${toolId}".`,
                    {
                        code: 'TOOL_STATE_MIGRATION_FAILED',
                        toolId,
                        slot,
                        cause: error,
                    },
                );
            }
        }

        if (current.version > this.version) {
            throw new ToolStateError(
                `Stored state version ${current.version} is newer than supported version ${this.version}.`,
                {
                    code: 'TOOL_STATE_VERSION_UNSUPPORTED',
                    toolId,
                    slot,
                },
            );
        }

        if (current.version !== record.version) {
            await this.adapter.set(
                this.createKey(toolId, slot),
                current,
            );
        }

        return current;
    }

    /**
     * @private
     */
    createKey(toolId, slot) {
        return `${this.namespace}:${encodeURIComponent(toolId)}:${encodeURIComponent(slot)}`;
    }
}

function validateAdapter(adapter) {
    for (const method of ['get', 'set', 'delete', 'keys', 'clear']) {
        if (typeof adapter?.[method] !== 'function') {
            throw new TypeError(
                `State adapter must implement ${method}().`,
            );
        }
    }
}

function freezeRecord(record, bytes) {
    return Object.freeze({
        toolId: record.toolId,
        slot: record.slot,
        version: record.version,
        savedAt: record.savedAt,
        expiresAt: record.expiresAt,
        metadata: deepFreeze(cloneValue(record.metadata)),
        state: deepFreeze(cloneValue(record.state)),
        bytes,
    });
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

function cloneValue(value) {
    try {
        return structuredClone(value);
    } catch (error) {
        throw new ToolStateError(
            'Runtime state must be structured-clone compatible.',
            {
                code: 'TOOL_STATE_NOT_SERIALIZABLE',
                cause: error,
            },
        );
    }
}

function measureBytes(value) {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

function normalizeText(value, field) {
    const text = String(value ?? '').trim();

    if (!text) {
        throw new TypeError(`${field} is required.`);
    }

    return text;
}

function normalizeSlot(value) {
    return String(value ?? 'default').trim() || 'default';
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
    const normalized = normalizeNonNegativeInteger(value, fallback, field);

    if (normalized < 1) {
        throw new TypeError(`${field} must be greater than zero.`);
    }

    return normalized;
}

function normalizeFunction(value, field) {
    if (typeof value !== 'function') {
        throw new TypeError(`${field} must be a function.`);
    }

    return value;
}

export {
    MemoryToolStateAdapter,
    ToolRuntimeStateStore,
    ToolStateError,
};

// END OF FILE
