/**
 * @file Aggregated runtime diagnostics and health checks.
 * @module tools/tool-runtime-diagnostics-center
 */

const DEFAULT_HISTORY_LIMIT = 250;

class ToolDiagnosticsError extends Error {
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolDiagnosticsError';
        this.code = options.code ?? 'TOOL_DIAGNOSTICS_FAILED';
        this.probeId = options.probeId ?? '';
    }
}

class ToolRuntimeDiagnosticsCenter {
    constructor(options = {}) {
        this.now = options.now ?? (() => Date.now());
        this.historyLimit = positiveInteger(options.historyLimit, DEFAULT_HISTORY_LIMIT, 'historyLimit');
        this.defaultTimeoutMs = positiveInteger(options.timeoutMs, 3000, 'timeoutMs');
        this.reporter = options.reporter ?? null;
        if (this.reporter !== null && typeof this.reporter !== 'function') {
            throw new TypeError('reporter must be a function.');
        }
        this.probes = new Map();
        this.sources = new Map();
        this.history = [];
        this.sequence = 0;
    }

    registerProbe(definition) {
        if (!definition || typeof definition !== 'object') {
            throw new TypeError('probe definition must be an object.');
        }
        const id = requiredText(definition.id, 'probe.id');
        if (this.probes.has(id)) {
            throw new ToolDiagnosticsError(`Probe "${id}" already exists.`, { code: 'TOOL_DIAGNOSTICS_DUPLICATE_PROBE', probeId: id });
        }
        if (typeof definition.check !== 'function') {
            throw new TypeError('probe.check must be a function.');
        }
        const record = {
            id,
            name: String(definition.name ?? id),
            critical: definition.critical === true,
            tags: Object.freeze([...(definition.tags ?? [])].map(String)),
            timeoutMs: positiveInteger(definition.timeoutMs, this.defaultTimeoutMs, 'timeoutMs'),
            check: definition.check,
            ownerId: String(definition.ownerId ?? '').trim(),
            registeredAt: this.now(),
        };
        this.probes.set(id, record);
        this.record('probe-registered', { probeId: id });
        return this.snapshotProbe(record);
    }

    removeProbe(probeId) {
        const id = requiredText(probeId, 'probeId');
        const removed = this.probes.delete(id);
        if (removed) this.record('probe-removed', { probeId: id });
        return removed;
    }

    removeOwner(ownerId) {
        const id = requiredText(ownerId, 'ownerId');
        let removed = 0;
        for (const [probeId, probe] of this.probes) {
            if (probe.ownerId === id) {
                this.probes.delete(probeId);
                removed += 1;
            }
        }
        this.record('owner-removed', { ownerId: id, removed });
        return removed;
    }

    registerSource(sourceId, snapshot) {
        const id = requiredText(sourceId, 'sourceId');
        if (typeof snapshot !== 'function') throw new TypeError('snapshot must be a function.');
        this.sources.set(id, snapshot);
        return Object.freeze({ id, remove: () => this.sources.delete(id) });
    }

    async check(options = {}) {
        const startedAt = this.now();
        const selected = [...this.probes.values()].filter((probe) => {
            if (options.probeIds && !options.probeIds.includes(probe.id)) return false;
            if (options.tags && !options.tags.some((tag) => probe.tags.includes(tag))) return false;
            return true;
        });
        const results = [];
        for (const probe of selected) {
            const probeStartedAt = this.now();
            try {
                const raw = await withTimeout(Promise.resolve(probe.check(Object.freeze({
                    probeId: probe.id,
                    now: this.now,
                    context: Object.freeze({ ...(options.context ?? {}) }),
                }))), probe.timeoutMs, probe.id);
                const normalized = normalizeResult(raw);
                results.push(Object.freeze({
                    id: probe.id,
                    name: probe.name,
                    critical: probe.critical,
                    tags: probe.tags,
                    status: normalized.status,
                    message: normalized.message,
                    details: normalized.details,
                    durationMs: this.now() - probeStartedAt,
                }));
            } catch (error) {
                results.push(Object.freeze({
                    id: probe.id,
                    name: probe.name,
                    critical: probe.critical,
                    tags: probe.tags,
                    status: 'unhealthy',
                    message: error instanceof Error ? error.message : String(error),
                    details: Object.freeze({ code: error?.code ?? 'TOOL_DIAGNOSTICS_PROBE_FAILED' }),
                    durationMs: this.now() - probeStartedAt,
                }));
            }
        }
        const summary = summarize(results);
        const report = Object.freeze({
            id: `health:${++this.sequence}`,
            status: summary.status,
            healthy: summary.status === 'healthy',
            checkedAt: this.now(),
            durationMs: this.now() - startedAt,
            counts: summary.counts,
            results: Object.freeze(results),
        });
        this.record('health-check', { reportId: report.id, status: report.status, counts: report.counts });
        return report;
    }

    async diagnose(options = {}) {
        const health = await this.check(options);
        const sources = {};
        for (const [id, snapshot] of this.sources) {
            try {
                sources[id] = await snapshot();
            } catch (error) {
                sources[id] = Object.freeze({ error: error instanceof Error ? error.message : String(error) });
            }
        }
        return Object.freeze({
            generatedAt: this.now(),
            health,
            sources: deepFreeze(sources),
        });
    }

    getSnapshot() {
        return Object.freeze({
            probeCount: this.probes.size,
            sourceCount: this.sources.size,
            probes: Object.freeze([...this.probes.values()].map((probe) => this.snapshotProbe(probe))),
        });
    }

    getHistory() { return Object.freeze([...this.history]); }
    clearHistory() { const count = this.history.length; this.history = []; return count; }
    clear() { this.probes.clear(); this.sources.clear(); this.clearHistory(); }

    snapshotProbe(probe) {
        return Object.freeze({
            id: probe.id,
            name: probe.name,
            critical: probe.critical,
            tags: probe.tags,
            timeoutMs: probe.timeoutMs,
            ownerId: probe.ownerId,
            registeredAt: probe.registeredAt,
        });
    }

    record(type, details) {
        const entry = Object.freeze({ type, timestamp: this.now(), ...details });
        this.history.push(entry);
        if (this.history.length > this.historyLimit) this.history.splice(0, this.history.length - this.historyLimit);
        if (this.reporter) Promise.resolve(this.reporter(entry)).catch(() => undefined);
    }
}

function normalizeResult(value) {
    if (value === true || value === undefined) return { status: 'healthy', message: '', details: Object.freeze({}) };
    if (value === false) return { status: 'unhealthy', message: '', details: Object.freeze({}) };
    if (!value || typeof value !== 'object') throw new TypeError('Probe result must be boolean, undefined or an object.');
    const status = value.status ?? (value.healthy === false ? 'unhealthy' : 'healthy');
    if (!['healthy', 'degraded', 'unhealthy'].includes(status)) throw new TypeError(`Invalid health status "${status}".`);
    return { status, message: String(value.message ?? ''), details: deepFreeze({ ...(value.details ?? {}) }) };
}

function summarize(results) {
    const counts = { healthy: 0, degraded: 0, unhealthy: 0 };
    for (const result of results) counts[result.status] += 1;
    let status = counts.unhealthy > 0 ? 'unhealthy' : counts.degraded > 0 ? 'degraded' : 'healthy';
    if (results.some((result) => result.critical && result.status === 'unhealthy')) status = 'unhealthy';
    return { status, counts: Object.freeze(counts) };
}

function withTimeout(promise, timeoutMs, probeId) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new ToolDiagnosticsError(`Probe "${probeId}" timed out.`, { code: 'TOOL_DIAGNOSTICS_TIMEOUT', probeId })), timeoutMs);
        promise.then((value) => { clearTimeout(timer); resolve(value); }, (error) => { clearTimeout(timer); reject(error); });
    });
}

function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    for (const item of Object.values(value)) deepFreeze(item);
    return Object.freeze(value);
}

function requiredText(value, field) {
    const text = String(value ?? '').trim();
    if (!text) throw new TypeError(`${field} is required.`);
    return text;
}

function positiveInteger(value, fallback, field) {
    if (value === undefined) return fallback;
    if (!Number.isFinite(value) || value < 1) throw new TypeError(`${field} must be a positive number.`);
    return Math.trunc(value);
}

export { ToolDiagnosticsError, ToolRuntimeDiagnosticsCenter };

// END OF FILE
