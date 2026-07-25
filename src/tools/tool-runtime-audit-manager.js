/**
 * @file Runtime audit and compliance manager.
 * @module tools/tool-runtime-audit-manager
 */

const DEFAULT_HISTORY_LIMIT = 1000;

class ToolAuditError extends Error {
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolAuditError';
        this.code = options.code ?? 'TOOL_AUDIT_FAILED';
    }
}

class ToolRuntimeAuditManager {
    constructor(options = {}) {
        this.now = options.now ?? (() => Date.now());
        this.historyLimit = Number.isFinite(options.historyLimit) && options.historyLimit > 0
            ? Math.trunc(options.historyLimit)
            : DEFAULT_HISTORY_LIMIT;
        this.redactKeys = new Set((options.redactKeys ?? ['password','token','secret','authorization']).map((value) => String(value).toLowerCase()));
        this.records = [];
        this.sequence = 0;
        this.integritySeed = String(options.integritySeed ?? 'adawaty-runtime-audit');
    }

    record(input = {}) {
        if (!input || typeof input !== 'object') throw new TypeError('audit input must be an object.');
        const action = requiredText(input.action, 'action');
        const timestamp = this.now();
        const previousHash = this.records.at(-1)?.hash ?? this.integritySeed;
        const body = deepFreeze({
            id: `audit:${++this.sequence}`,
            timestamp,
            actor: redact(input.actor ?? null, this.redactKeys),
            action,
            resource: redact(input.resource ?? null, this.redactKeys),
            outcome: String(input.outcome ?? 'success'),
            correlationId: String(input.correlationId ?? ''),
            traceId: String(input.traceId ?? ''),
            toolId: String(input.toolId ?? ''),
            extensionId: String(input.extensionId ?? ''),
            metadata: redact(input.metadata ?? {}, this.redactKeys),
            previousHash,
        });
        const record = deepFreeze({ ...body, hash: hash(stableStringify(body)) });
        this.records.push(record);
        if (this.records.length > this.historyLimit) this.records.splice(0, this.records.length - this.historyLimit);
        return record;
    }

    query(filters = {}) {
        return Object.freeze(this.records.filter((record) => {
            if (filters.action && record.action !== filters.action) return false;
            if (filters.outcome && record.outcome !== filters.outcome) return false;
            if (filters.correlationId && record.correlationId !== filters.correlationId) return false;
            if (filters.traceId && record.traceId !== filters.traceId) return false;
            if (filters.toolId && record.toolId !== filters.toolId) return false;
            if (filters.since !== undefined && record.timestamp < filters.since) return false;
            if (filters.until !== undefined && record.timestamp > filters.until) return false;
            return true;
        }));
    }

    export(filters = {}, options = {}) {
        const records = this.query(filters);
        const format = options.format ?? 'json';
        if (format === 'json') return JSON.stringify(records, null, options.pretty === false ? 0 : 2);
        if (format === 'ndjson') return records.map((record) => JSON.stringify(record)).join('\n');
        throw new ToolAuditError(`Unsupported audit export format "${format}".`, { code: 'TOOL_AUDIT_FORMAT_UNSUPPORTED' });
    }

    validateIntegrity() {
        let previousHash = this.integritySeed;
        for (const record of this.records) {
            const { hash: currentHash, ...body } = record;
            if (body.previousHash !== previousHash || hash(stableStringify(body)) !== currentHash) {
                return Object.freeze({ valid: false, recordId: record.id });
            }
            previousHash = currentHash;
        }
        return Object.freeze({ valid: true, recordId: '' });
    }

    getSnapshot() {
        const outcomes = {};
        for (const record of this.records) outcomes[record.outcome] = (outcomes[record.outcome] ?? 0) + 1;
        return Object.freeze({ recordCount: this.records.length, sequence: this.sequence, outcomes: Object.freeze(outcomes), integrity: this.validateIntegrity() });
    }

    getHistory() { return Object.freeze([...this.records]); }
    clearHistory() { const count=this.records.length; this.records=[]; return count; }
    clear() { this.clearHistory(); }
}

function redact(value, keys, seen = new WeakSet()) {
    if (value === null || typeof value !== 'object') return value;
    if (seen.has(value)) return '[Circular]';
    seen.add(value);
    if (Array.isArray(value)) return value.map((item) => redact(item, keys, seen));
    const output = {};
    for (const [key, item] of Object.entries(value)) output[key] = keys.has(key.toLowerCase()) ? '[REDACTED]' : redact(item, keys, seen);
    return output;
}
function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}
function hash(text) {
    let value = 2166136261;
    for (let i=0;i<text.length;i+=1) { value ^= text.charCodeAt(i); value = Math.imul(value, 16777619); }
    return (value >>> 0).toString(16).padStart(8,'0');
}
function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.freeze(value);
    for (const item of Object.values(value)) deepFreeze(item);
    return value;
}
function requiredText(value, field) { const text=String(value ?? '').trim(); if (!text) throw new TypeError(`${field} is required.`); return text; }

export { ToolAuditError, ToolRuntimeAuditManager };

// END OF FILE
