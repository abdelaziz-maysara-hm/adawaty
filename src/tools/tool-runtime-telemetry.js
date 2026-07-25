/**
 * @file Runtime telemetry, metrics and tracing primitives.
 * @module tools/tool-runtime-telemetry
 */

const freeze = (value) => {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    for (const child of Object.values(value)) freeze(child);
    return Object.freeze(value);
};

const now = () => Date.now();
const randomId = (prefix) => `${prefix}-${now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const normalizeName = (value, label = 'name') => {
    const name = String(value ?? '').trim();
    if (!name) throw new ToolTelemetryError('TELEMETRY_INVALID_NAME', `${label} must be a non-empty string.`);
    return name;
};
const normalizeLabels = (labels = {}) => freeze(Object.fromEntries(Object.entries(labels).map(([key, value]) => [String(key), String(value)])));
const metricKey = (name, labels) => `${name}|${JSON.stringify(labels)}`;

class ToolTelemetryError extends Error {
    constructor(code, message, details = {}) {
        super(message);
        this.name = 'ToolTelemetryError';
        this.code = code;
        this.details = freeze({ ...details });
    }
}

class ToolRuntimeTelemetry {
    constructor(options = {}) {
        this.historyLimit = Math.max(1, Number(options.historyLimit ?? 500));
        this.slowOperationMs = Math.max(0, Number(options.slowOperationMs ?? 1000));
        this.metrics = new Map();
        this.metricHistory = [];
        this.traces = new Map();
        this.finishedTraces = [];
    }

    registerMetric(definition) {
        const name = normalizeName(definition?.name);
        const type = String(definition?.type ?? 'counter').toLowerCase();
        if (!['counter', 'gauge', 'histogram', 'summary'].includes(type)) {
            throw new ToolTelemetryError('TELEMETRY_INVALID_TYPE', `Unsupported metric type "${type}".`, { name, type });
        }
        const labels = normalizeLabels(definition?.labels);
        const key = metricKey(name, labels);
        if (this.metrics.has(key)) throw new ToolTelemetryError('TELEMETRY_DUPLICATE_METRIC', `Metric "${name}" already exists for these labels.`, { name, labels });
        const metric = { name, type, labels, ownerId: definition?.ownerId ? String(definition.ownerId) : '', value: type === 'histogram' || type === 'summary' ? [] : Number(definition?.initialValue ?? 0), createdAt: now(), updatedAt: now() };
        this.metrics.set(key, metric);
        return this.snapshotMetric(metric);
    }

    record(name, value = 1, options = {}) {
        const metricName = normalizeName(name);
        const labels = normalizeLabels(options.labels);
        const key = metricKey(metricName, labels);
        let metric = this.metrics.get(key);
        if (!metric) {
            this.registerMetric({ name: metricName, type: options.type ?? 'counter', labels, ownerId: options.ownerId });
            metric = this.metrics.get(key);
        }
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) throw new ToolTelemetryError('TELEMETRY_INVALID_VALUE', 'Metric value must be finite.', { name: metricName, value });
        if (metric.type === 'counter') {
            if (numeric < 0) throw new ToolTelemetryError('TELEMETRY_COUNTER_DECREASE', 'Counter increments cannot be negative.', { name: metricName, value: numeric });
            metric.value += numeric;
        } else if (metric.type === 'gauge') metric.value = numeric;
        else metric.value.push(numeric);
        metric.updatedAt = now();
        const entry = freeze({ id: randomId('metric'), name: metric.name, type: metric.type, labels: metric.labels, value: numeric, ownerId: metric.ownerId, recordedAt: metric.updatedAt });
        this.metricHistory.push(entry);
        if (this.metricHistory.length > this.historyLimit) this.metricHistory.splice(0, this.metricHistory.length - this.historyLimit);
        return this.snapshotMetric(metric);
    }

    increment(name, amount = 1, options = {}) { return this.record(name, amount, { ...options, type: 'counter' }); }
    gauge(name, value, options = {}) { return this.record(name, value, { ...options, type: 'gauge' }); }
    histogram(name, value, options = {}) { return this.record(name, value, { ...options, type: 'histogram' }); }

    timer(name, options = {}) {
        const startedAt = now();
        let stopped = false;
        return freeze({
            stop: (extra = {}) => {
                if (stopped) throw new ToolTelemetryError('TELEMETRY_TIMER_STOPPED', `Timer "${name}" was already stopped.`);
                stopped = true;
                const durationMs = now() - startedAt;
                this.histogram(name, durationMs, { ...options, ...extra });
                return durationMs;
            },
        });
    }

    startTrace(input = {}) {
        const traceId = input.traceId ? String(input.traceId) : randomId('trace');
        const spanId = input.spanId ? String(input.spanId) : randomId('span');
        const trace = this.traces.get(traceId) ?? { id: traceId, name: normalizeName(input.name ?? 'runtime-operation'), startedAt: now(), endedAt: null, status: 'active', attributes: freeze({ ...(input.attributes ?? {}) }), spans: [] };
        if (this.traces.has(traceId) && trace.spans.some((span) => span.id === spanId)) throw new ToolTelemetryError('TELEMETRY_DUPLICATE_SPAN', `Span "${spanId}" already exists.`, { traceId, spanId });
        trace.spans.push({ id: spanId, parentSpanId: input.parentSpanId ? String(input.parentSpanId) : '', name: normalizeName(input.spanName ?? input.name ?? 'span'), startedAt: now(), endedAt: null, durationMs: null, status: 'active', error: null, attributes: freeze({ ...(input.spanAttributes ?? {}) }) });
        this.traces.set(traceId, trace);
        return freeze({ traceId, spanId });
    }

    finishTrace(traceId, spanId, options = {}) {
        const trace = this.traces.get(String(traceId));
        if (!trace) throw new ToolTelemetryError('TELEMETRY_TRACE_NOT_FOUND', `Trace "${traceId}" was not found.`);
        const span = trace.spans.find((item) => item.id === String(spanId));
        if (!span) throw new ToolTelemetryError('TELEMETRY_SPAN_NOT_FOUND', `Span "${spanId}" was not found.`, { traceId });
        if (span.endedAt !== null) return this.snapshotTrace(trace);
        span.endedAt = now();
        span.durationMs = span.endedAt - span.startedAt;
        span.status = options.error ? 'error' : String(options.status ?? 'ok');
        span.error = options.error ? freeze({ name: options.error.name ?? 'Error', message: options.error.message ?? String(options.error) }) : null;
        if (options.attributes) span.attributes = freeze({ ...span.attributes, ...options.attributes });
        if (trace.spans.every((item) => item.endedAt !== null)) {
            trace.endedAt = Math.max(...trace.spans.map((item) => item.endedAt));
            trace.status = trace.spans.some((item) => item.status === 'error') ? 'error' : 'ok';
            const snapshot = this.snapshotTrace(trace);
            this.finishedTraces.push(snapshot);
            if (this.finishedTraces.length > this.historyLimit) this.finishedTraces.splice(0, this.finishedTraces.length - this.historyLimit);
            this.traces.delete(trace.id);
            return snapshot;
        }
        return this.snapshotTrace(trace);
    }

    async span(name, operation, options = {}) {
        if (typeof operation !== 'function') throw new ToolTelemetryError('TELEMETRY_INVALID_OPERATION', 'Span operation must be a function.');
        const started = this.startTrace({ ...options, name, spanName: name });
        try {
            const result = await operation(started);
            this.finishTrace(started.traceId, started.spanId);
            return result;
        } catch (error) {
            this.finishTrace(started.traceId, started.spanId, { error });
            throw error;
        }
    }

    removeOwner(ownerId) {
        const owner = String(ownerId);
        let removed = 0;
        for (const [key, metric] of this.metrics) if (metric.ownerId === owner) { this.metrics.delete(key); removed += 1; }
        return removed;
    }

    snapshotMetric(metric) {
        const values = Array.isArray(metric.value) ? [...metric.value].sort((a, b) => a - b) : null;
        const percentile = (p) => values?.length ? values[Math.min(values.length - 1, Math.floor((values.length - 1) * p))] : null;
        return freeze({ name: metric.name, type: metric.type, labels: metric.labels, ownerId: metric.ownerId, value: values ? undefined : metric.value, count: values?.length ?? undefined, min: values?.[0], max: values?.[values.length - 1], average: values?.length ? values.reduce((sum, item) => sum + item, 0) / values.length : undefined, p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99), createdAt: metric.createdAt, updatedAt: metric.updatedAt });
    }

    snapshotTrace(trace) {
        const endedAt = trace.endedAt;
        return freeze({ id: trace.id, name: trace.name, startedAt: trace.startedAt, endedAt, durationMs: endedAt === null ? null : endedAt - trace.startedAt, status: trace.status, attributes: trace.attributes, slow: endedAt !== null && endedAt - trace.startedAt >= this.slowOperationMs, spans: trace.spans.map((span) => freeze({ ...span })) });
    }

    getSnapshot() {
        return freeze({ metricCount: this.metrics.size, activeTraceCount: this.traces.size, completedTraceCount: this.finishedTraces.length, metrics: [...this.metrics.values()].map((metric) => this.snapshotMetric(metric)), activeTraces: [...this.traces.values()].map((trace) => this.snapshotTrace(trace)), completedTraces: [...this.finishedTraces] });
    }

    getHistory() { return freeze([...this.metricHistory]); }
    clearHistory() { const count = this.metricHistory.length + this.finishedTraces.length; this.metricHistory.length = 0; this.finishedTraces.length = 0; return count; }
    clear() { const count = this.metrics.size + this.traces.size + this.metricHistory.length + this.finishedTraces.length; this.metrics.clear(); this.traces.clear(); this.metricHistory.length = 0; this.finishedTraces.length = 0; return count; }
}

export { ToolRuntimeTelemetry, ToolTelemetryError };

// END OF FILE
