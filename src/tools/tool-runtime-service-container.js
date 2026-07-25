/**
 * @file Runtime dependency injection and service container.
 * @module tools/tool-runtime-service-container
 */

const DEFAULT_HISTORY_LIMIT = 500;

class ToolServiceError extends Error {
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolServiceError';
        this.code = options.code ?? 'TOOL_SERVICE_FAILED';
        this.serviceId = options.serviceId ?? '';
        this.scopeId = options.scopeId ?? '';
    }
}

class ToolRuntimeServiceContainer {
    constructor(options = {}) {
        this.now = options.now ?? (() => Date.now());
        this.historyLimit = positiveInteger(options.historyLimit, DEFAULT_HISTORY_LIMIT, 'historyLimit');
        this.reporter = options.reporter === undefined ? null : requireFunction(options.reporter, 'reporter');
        this.services = new Map();
        this.singletons = new Map();
        this.scopes = new Map();
        this.history = [];
        this.sequence = 0;
        this.resolutionCount = 0;
        this.failureCount = 0;
    }

    register(definition, options = {}) {
        if (!definition || typeof definition !== 'object') throw new TypeError('service definition must be an object.');
        const id = requiredText(definition.id, 'service.id');
        if (this.services.has(id) && options.override !== true) throw new ToolServiceError(`Service "${id}" is already registered.`, { code: 'TOOL_SERVICE_DUPLICATE', serviceId: id });
        const hasFactory = typeof definition.factory === 'function';
        const hasValue = Object.prototype.hasOwnProperty.call(definition, 'value');
        if (!hasFactory && !hasValue) throw new TypeError(`Service "${id}" requires a factory or value.`);
        if (hasFactory && hasValue) throw new TypeError(`Service "${id}" cannot define both factory and value.`);
        if (options.override === true && this.services.has(id)) this.remove(id, { dispose: false });
        const aliases = Object.freeze([...(definition.aliases ?? [])].map((v) => requiredText(v, 'service alias')));
        for (const alias of aliases) {
            if (alias === id || this.services.has(alias)) throw new ToolServiceError(`Service alias "${alias}" is invalid or already registered.`, { code: 'TOOL_SERVICE_ALIAS_DUPLICATE', serviceId: id });
        }
        const record = { id, lifetime: normalizeLifetime(definition.lifetime), factory: hasFactory ? definition.factory : null, value: hasValue ? definition.value : undefined, dependencies: Object.freeze([...(definition.dependencies ?? [])].map(normalizeDependency)), aliases, metadata: Object.freeze({ ...(definition.metadata ?? {}) }), dispose: definition.dispose === undefined ? null : requireFunction(definition.dispose, 'dispose'), registeredAt: this.now() };
        this.services.set(id, record);
        for (const alias of aliases) this.services.set(alias, { id: alias, aliasOf: id });
        this.record('registered', { serviceId: id, lifetime: record.lifetime, aliases });
        return this.snapshot(record);
    }

    has(serviceId) { return this.services.has(String(serviceId ?? '').trim()); }

    async resolve(serviceId, options = {}) {
        const id = requiredText(serviceId, 'serviceId');
        const trace = [];
        try {
            const value = await this.resolveInternal(id, { scopeId: optionalText(options.scopeId), context: options.context ?? {} }, [], trace);
            this.resolutionCount += 1;
            this.record('resolved', { serviceId: id, scopeId: optionalText(options.scopeId), trace: Object.freeze([...trace]) });
            return value;
        } catch (error) {
            if (options.optional === true && error instanceof ToolServiceError && error.code === 'TOOL_SERVICE_NOT_FOUND') return undefined;
            this.failureCount += 1;
            this.record('resolution-failed', { serviceId: id, error: normalizeError(error), trace: Object.freeze([...trace]) });
            throw error;
        }
    }

    createScope(scopeId = '') {
        const id = optionalText(scopeId) || `scope:${this.now()}:${++this.sequence}`;
        if (this.scopes.has(id)) throw new ToolServiceError(`Scope "${id}" already exists.`, { code: 'TOOL_SERVICE_SCOPE_DUPLICATE', scopeId: id });
        this.scopes.set(id, new Map()); this.record('scope-created', { scopeId: id });
        return Object.freeze({ id, resolve: (serviceId, options = {}) => this.resolve(serviceId, { ...options, scopeId: id }), has: (serviceId) => this.has(serviceId), dispose: () => this.disposeScope(id) });
    }

    async disposeScope(scopeId) {
        const id = requiredText(scopeId, 'scopeId'); const scope = this.scopes.get(id); if (!scope) return 0; let disposed = 0;
        for (const [serviceId, instance] of [...scope.entries()].reverse()) { const record = this.getCanonicalRecord(serviceId); if (record?.dispose) await record.dispose(instance, Object.freeze({ container: this, serviceId: record.id, scopeId: id })); disposed += 1; }
        this.scopes.delete(id); this.record('scope-disposed', { scopeId: id, disposed }); return disposed;
    }

    remove(serviceId, options = {}) {
        const record = this.getCanonicalRecord(requiredText(serviceId, 'serviceId')); if (!record) return false;
        if (options.dispose !== false && (this.singletons.has(record.id) || [...this.scopes.values()].some((s) => s.has(record.id)))) throw new ToolServiceError(`Service "${record.id}" has active instances.`, { code: 'TOOL_SERVICE_ACTIVE_INSTANCE', serviceId: record.id });
        this.services.delete(record.id); for (const alias of record.aliases) this.services.delete(alias); this.record('removed', { serviceId: record.id }); return true;
    }

    async disposeService(serviceId) {
        const record = this.getCanonicalRecord(requiredText(serviceId, 'serviceId')); if (!record) return false;
        if (this.singletons.has(record.id)) { const instance = this.singletons.get(record.id); if (record.dispose) await record.dispose(instance, Object.freeze({ container: this, serviceId: record.id, scopeId: '' })); this.singletons.delete(record.id); }
        for (const [scopeId, scope] of this.scopes) if (scope.has(record.id)) { const instance = scope.get(record.id); if (record.dispose) await record.dispose(instance, Object.freeze({ container: this, serviceId: record.id, scopeId })); scope.delete(record.id); }
        return this.remove(record.id, { dispose: false });
    }

    async disposeAll() {
        for (const id of [...this.scopes.keys()]) await this.disposeScope(id);
        for (const id of [...this.singletons.keys()].reverse()) { const record = this.getCanonicalRecord(id); if (record?.dispose) await record.dispose(this.singletons.get(id), Object.freeze({ container: this, serviceId: id, scopeId: '' })); }
        this.singletons.clear();
    }

    getSnapshot() {
        const services = [...this.services.values()].filter((r) => !r.aliasOf).map((r) => this.snapshot(r));
        return Object.freeze({ serviceCount: services.length, aliasCount: this.services.size - services.length, singletonInstanceCount: this.singletons.size, scopeCount: this.scopes.size, resolutionCount: this.resolutionCount, failureCount: this.failureCount, services: Object.freeze(services) });
    }

    getGraph() {
        const graph = {}; for (const r of this.services.values()) if (!r.aliasOf) graph[r.id] = Object.freeze(r.dependencies.map((d) => Object.freeze({ ...d })));
        return Object.freeze(graph);
    }
    getHistory() { return Object.freeze([...this.history]); }
    clearHistory() { const n = this.history.length; this.history = []; return n; }
    clear() { this.services.clear(); this.singletons.clear(); this.scopes.clear(); this.clearHistory(); }

    async resolveInternal(serviceId, options, stack, trace) {
        const record = this.getCanonicalRecord(serviceId);
        if (!record) throw new ToolServiceError(`Service "${serviceId}" is not registered.`, { code: 'TOOL_SERVICE_NOT_FOUND', serviceId, scopeId: options.scopeId });
        if (stack.includes(record.id)) throw new ToolServiceError(`Circular service dependency: ${[...stack, record.id].join(' -> ')}`, { code: 'TOOL_SERVICE_CIRCULAR_DEPENDENCY', serviceId: record.id, scopeId: options.scopeId });
        trace.push(record.id);
        if (record.lifetime === 'singleton' && this.singletons.has(record.id)) return this.singletons.get(record.id);
        if (record.lifetime === 'scoped') {
            if (!options.scopeId) throw new ToolServiceError(`Scoped service "${record.id}" requires a scope.`, { code: 'TOOL_SERVICE_SCOPE_REQUIRED', serviceId: record.id });
            const scope = this.scopes.get(options.scopeId); if (!scope) throw new ToolServiceError(`Scope "${options.scopeId}" does not exist.`, { code: 'TOOL_SERVICE_SCOPE_NOT_FOUND', serviceId: record.id, scopeId: options.scopeId });
            if (scope.has(record.id)) return scope.get(record.id);
        }
        if (record.factory === null) return record.value;
        const dependencies = {};
        for (const dep of record.dependencies) {
            try { dependencies[dep.id] = await this.resolveInternal(dep.id, options, [...stack, record.id], trace); }
            catch (error) { if (dep.optional && error instanceof ToolServiceError && error.code === 'TOOL_SERVICE_NOT_FOUND') { dependencies[dep.id] = undefined; continue; } throw error; }
        }
        const context = Object.freeze({ container: this, serviceId: record.id, scopeId: options.scopeId, dependencies: Object.freeze(dependencies), runtime: Object.freeze({ ...(options.context ?? {}) }), resolve: (id, nested = {}) => this.resolveInternal(id, { ...options, ...nested }, [...stack, record.id], trace) });
        const instance = await record.factory(context);
        if (record.lifetime === 'singleton') this.singletons.set(record.id, instance); else if (record.lifetime === 'scoped') this.scopes.get(options.scopeId).set(record.id, instance);
        return instance;
    }

    getCanonicalRecord(id) { const r = this.services.get(id); return r?.aliasOf ? this.services.get(r.aliasOf) ?? null : r ?? null; }
    snapshot(r) { return Object.freeze({ id: r.id, lifetime: r.lifetime, dependencies: r.dependencies, aliases: r.aliases, metadata: r.metadata, registeredAt: r.registeredAt }); }
    record(type, details) { const entry = Object.freeze({ type, timestamp: this.now(), ...details }); this.history.push(entry); if (this.history.length > this.historyLimit) this.history.splice(0, this.history.length - this.historyLimit); if (this.reporter) Promise.resolve(this.reporter(entry)).catch(() => undefined); }
}

function normalizeDependency(v) { return typeof v === 'string' ? Object.freeze({ id: requiredText(v, 'dependency id'), optional: false }) : Object.freeze({ id: requiredText(v?.id, 'dependency id'), optional: v?.optional === true }); }
function normalizeLifetime(v) { const x = v ?? 'singleton'; if (['singleton','scoped','transient'].includes(x)) return x; throw new TypeError('lifetime must be singleton, scoped or transient.'); }
function normalizeError(e) { return e instanceof Error ? Object.freeze({ name: e.name, message: e.message, code: e.code ?? null }) : Object.freeze({ name: 'Error', message: String(e), code: null }); }
function requiredText(v, f) { const x = String(v ?? '').trim(); if (!x) throw new TypeError(`${f} is required.`); return x; }
function optionalText(v) { return String(v ?? '').trim(); }
function requireFunction(v, f) { if (typeof v !== 'function') throw new TypeError(`${f} must be a function.`); return v; }
function positiveInteger(v, fallback, f) { if (v === undefined) return fallback; if (!Number.isFinite(v) || v < 1) throw new TypeError(`${f} must be a positive number.`); return Math.trunc(v); }

export { ToolRuntimeServiceContainer, ToolServiceError };

// END OF FILE
