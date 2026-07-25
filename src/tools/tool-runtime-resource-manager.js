/**
 * @file Runtime resource management and leak detection.
 * @module tools/tool-runtime-resource-manager
 */

class ToolResourceError extends Error {
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolResourceError';
        this.code = options.code ?? 'TOOL_RESOURCE_FAILED';
        this.resourceId = options.resourceId ?? '';
        this.ownerId = options.ownerId ?? '';
    }
}

class ToolRuntimeResourceManager {
    constructor(options = {}) {
        this.now = options.now ?? (() => Date.now());
        this.maxResourcesPerOwner = normalizePositive(options.maxResourcesPerOwner, 100, 'maxResourcesPerOwner');
        this.idleTimeoutMs = normalizeNonNegative(options.idleTimeoutMs, 0, 'idleTimeoutMs');
        this.historyLimit = normalizePositive(options.historyLimit, 200, 'historyLimit');
        this.reporter = options.reporter ?? null;
        this.resources = new Map();
        this.owners = new Map();
        this.history = [];
        this.sequence = 0;
        this.unsubscribeMemoryPressure = null;
        if (options.memoryPressureSource) this.attachMemoryPressureSource(options.memoryPressureSource);
    }

    register(definition) {
        const ownerId = requiredText(definition?.ownerId, 'ownerId');
        const type = requiredText(definition?.type, 'type');
        const owned = this.owners.get(ownerId) ?? new Set();
        if (owned.size >= this.maxResourcesPerOwner) {
            throw new ToolResourceError(`Owner "${ownerId}" exceeded its resource quota.`, { code: 'TOOL_RESOURCE_QUOTA_EXCEEDED', ownerId });
        }
        if (definition.dispose !== undefined && typeof definition.dispose !== 'function') throw new TypeError('dispose must be a function.');
        const createdAt = this.now();
        const record = {
            id: `resource:${createdAt}:${++this.sequence}`,
            ownerId,
            type,
            value: definition.value,
            dispose: definition.dispose ?? null,
            policy: normalizePolicy(definition.policy),
            metadata: Object.freeze({ ...(definition.metadata ?? {}) }),
            referenceCount: 1,
            state: 'active',
            createdAt,
            lastUsedAt: createdAt,
            disposedAt: null,
        };
        this.resources.set(record.id, record);
        owned.add(record.id);
        this.owners.set(ownerId, owned);
        this.record('registered', record);
        return this.handle(record);
    }

    retain(resourceId) {
        const record = this.requireActive(resourceId);
        record.referenceCount += 1;
        record.lastUsedAt = this.now();
        this.record('retained', record);
        return this.handle(record);
    }

    touch(resourceId) {
        const record = this.requireActive(resourceId);
        record.lastUsedAt = this.now();
        this.record('touched', record);
        return this.handle(record);
    }

    async release(resourceId, options = {}) {
        const record = this.requireActive(resourceId);
        record.referenceCount = Math.max(0, record.referenceCount - 1);
        record.lastUsedAt = this.now();
        this.record('released', record);
        if (record.referenceCount === 0 && options.disposeWhenZero !== false) {
            return this.dispose(record.id, { reason: options.reason ?? 'reference-count-zero' });
        }
        return this.handle(record);
    }

    async dispose(resourceId, options = {}) {
        const id = String(resourceId ?? '');
        const record = this.resources.get(id);
        if (!record) throw new ToolResourceError(`Resource "${id}" was not found.`, { code: 'TOOL_RESOURCE_NOT_FOUND', resourceId: id });
        if (record.state === 'disposed') return this.handle(record);
        record.state = 'disposing';
        try {
            if (record.dispose) await record.dispose(record.value, Object.freeze({ resourceId: record.id, ownerId: record.ownerId, reason: String(options.reason ?? 'manual') }));
            record.state = 'disposed';
            record.referenceCount = 0;
            record.disposedAt = this.now();
            this.owners.get(record.ownerId)?.delete(record.id);
            this.record('disposed', record, { reason: String(options.reason ?? 'manual') });
            return this.handle(record);
        } catch (cause) {
            record.state = 'dispose-failed';
            this.record('dispose-failed', record);
            throw new ToolResourceError(`Failed to dispose resource "${record.id}".`, { code: 'TOOL_RESOURCE_DISPOSE_FAILED', resourceId: record.id, ownerId: record.ownerId, cause });
        }
    }

    async disposeOwner(ownerId, options = {}) {
        const id = requiredText(ownerId, 'ownerId');
        const disposed = [];
        const failed = [];
        for (const resourceId of [...(this.owners.get(id) ?? [])]) {
            const record = this.resources.get(resourceId);
            if (!record || record.state === 'disposed' || (record.policy === 'manual' && options.includeManual !== true)) continue;
            try { await this.dispose(resourceId, { reason: options.reason ?? 'owner-disposed' }); disposed.push(resourceId); }
            catch (error) { failed.push(Object.freeze({ resourceId, error })); }
        }
        return Object.freeze({ ownerId: id, disposedCount: disposed.length, failedCount: failed.length, disposed: Object.freeze(disposed), failed: Object.freeze(failed) });
    }

    async cleanupIdle(options = {}) {
        const timeout = normalizeNonNegative(options.idleTimeoutMs, this.idleTimeoutMs, 'idleTimeoutMs');
        const cutoff = this.now() - timeout;
        const candidates = [...this.resources.values()].filter((record) => record.state === 'active' && record.policy === 'idle' && record.lastUsedAt <= cutoff);
        const disposed=[]; const failed=[];
        for (const record of candidates) {
            try { await this.dispose(record.id, { reason: options.reason ?? 'idle-timeout' }); disposed.push(record.id); }
            catch (error) { failed.push(Object.freeze({ resourceId: record.id, error })); }
        }
        return Object.freeze({ candidateCount: candidates.length, disposedCount: disposed.length, failedCount: failed.length, disposed: Object.freeze(disposed), failed: Object.freeze(failed) });
    }

    detectLeaks(options = {}) {
        const olderThanMs = normalizeNonNegative(options.olderThanMs, 0, 'olderThanMs');
        const ownerId = String(options.ownerId ?? '').trim();
        const cutoff = this.now() - olderThanMs;
        const resources = [...this.resources.values()].filter((record) => record.state !== 'disposed' && record.createdAt <= cutoff && (!ownerId || record.ownerId === ownerId)).map((record) => this.handle(record));
        return Object.freeze({ detectedAt: this.now(), ownerId, olderThanMs, leakCount: resources.length, resources: Object.freeze(resources) });
    }

    getSnapshot() {
        const records=[...this.resources.values()];
        return Object.freeze({
            resourceCount: records.length,
            activeCount: records.filter((r)=>r.state==='active').length,
            disposedCount: records.filter((r)=>r.state==='disposed').length,
            failedCount: records.filter((r)=>r.state==='dispose-failed').length,
            ownerCount: [...this.owners.values()].filter((ids)=>ids.size>0).length,
            maxResourcesPerOwner: this.maxResourcesPerOwner,
            idleTimeoutMs: this.idleTimeoutMs,
        });
    }

    getHistory() { return Object.freeze([...this.history]); }

    async close() {
        this.unsubscribeMemoryPressure?.();
        this.unsubscribeMemoryPressure = null;
        for (const ownerId of [...this.owners.keys()]) await this.disposeOwner(ownerId, { reason: 'manager-close', includeManual: true });
    }

    attachMemoryPressureSource(source) {
        if (typeof source?.subscribe !== 'function') throw new TypeError('memoryPressureSource must implement subscribe().');
        const unsubscribe = source.subscribe((level='unknown') => { this.cleanupIdle({ idleTimeoutMs: 0, reason: `memory-pressure:${level}` }).catch(() => undefined); });
        if (unsubscribe !== undefined && typeof unsubscribe !== 'function') throw new TypeError('Memory pressure subscription must return a function or undefined.');
        this.unsubscribeMemoryPressure = unsubscribe ?? null;
    }

    requireActive(resourceId) {
        const id=String(resourceId ?? '');
        const record=this.resources.get(id);
        if (!record) throw new ToolResourceError(`Resource "${id}" was not found.`, { code:'TOOL_RESOURCE_NOT_FOUND', resourceId:id });
        if (record.state !== 'active') throw new ToolResourceError(`Resource "${id}" is not active.`, { code:'TOOL_RESOURCE_NOT_ACTIVE', resourceId:id, ownerId:record.ownerId });
        return record;
    }

    handle(record) {
        return Object.freeze({ id:record.id, ownerId:record.ownerId, type:record.type, policy:record.policy, metadata:record.metadata, referenceCount:record.referenceCount, state:record.state, createdAt:record.createdAt, lastUsedAt:record.lastUsedAt, disposedAt:record.disposedAt });
    }

    record(type, resource, details={}) {
        const entry=Object.freeze({ type, resourceId:resource.id, ownerId:resource.ownerId, resourceType:resource.type, state:resource.state, referenceCount:resource.referenceCount, timestamp:this.now(), ...details });
        this.history.push(entry);
        if (this.history.length > this.historyLimit) this.history.splice(0, this.history.length-this.historyLimit);
        if (typeof this.reporter === 'function') Promise.resolve(this.reporter(entry)).catch(() => undefined);
    }
}

function normalizePolicy(value) { const result=String(value ?? 'owner'); if (!['owner','idle','manual'].includes(result)) throw new TypeError(`Unknown resource policy "${result}".`); return result; }
function requiredText(value, field) { const result=String(value ?? '').trim(); if (!result) throw new TypeError(`${field} is required.`); return result; }
function normalizePositive(value, fallback, field) { if (value===undefined) return fallback; if (!Number.isFinite(value)||value<1) throw new TypeError(`${field} must be positive.`); return Math.trunc(value); }
function normalizeNonNegative(value, fallback, field) { if (value===undefined) return fallback; if (!Number.isFinite(value)||value<0) throw new TypeError(`${field} must be non-negative.`); return Math.trunc(value); }

export { ToolResourceError, ToolRuntimeResourceManager };

// END OF FILE
