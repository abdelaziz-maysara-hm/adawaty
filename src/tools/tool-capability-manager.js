/**
 * @file Versioned plugin runtime capabilities, tokens and secure services.
 * @module tools/tool-capability-manager
 */

const DEFAULT_API_VERSION = '1.0.0';
const DEFAULT_AUDIT_LIMIT = 300;

class ToolCapabilityError extends Error {
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolCapabilityError';
        this.code = options.code ?? 'TOOL_CAPABILITY_FAILED';
        this.capability = options.capability ?? '';
        this.tokenId = options.tokenId ?? '';
        this.toolId = options.toolId ?? '';
    }
}

class ToolCapabilityManager {
    constructor(options = {}) {
        this.apiVersion = normalizeVersion(options.apiVersion ?? DEFAULT_API_VERSION);
        this.auditLimit = positive(options.auditLimit, DEFAULT_AUDIT_LIMIT, 'auditLimit');
        this.now = options.now ?? (() => Date.now());
        this.reporter = options.reporter ?? null;
        this.capabilities = new Map();
        this.tokens = new Map();
        this.audit = [];
        this.sequence = 0;

        for (const definition of options.capabilities ?? []) {
            this.register(definition);
        }
    }

    register(definition) {
        const id = text(definition?.id, 'capability.id');
        if (this.capabilities.has(id)) {
            throw new ToolCapabilityError(`Capability "${id}" is already registered.`, {
                code: 'TOOL_CAPABILITY_EXISTS', capability: id,
            });
        }
        const record = Object.freeze({
            id,
            version: normalizeVersion(definition.version ?? this.apiVersion),
            optional: definition.optional === true,
            description: String(definition.description ?? '').trim(),
            metadata: Object.freeze({ ...(definition.metadata ?? {}) }),
        });
        this.capabilities.set(id, record);
        this.record('capability-registered', { capability: id });
        return record;
    }

    unregister(capability) {
        const id = text(capability, 'capability');
        const removed = this.capabilities.delete(id);
        if (removed) {
            for (const token of this.tokens.values()) {
                if (token.capabilities.has(id)) token.capabilities.delete(id);
            }
            this.record('capability-unregistered', { capability: id });
        }
        return removed;
    }

    negotiate(request = {}) {
        const required = unique(request.required ?? []);
        const optional = unique(request.optional ?? []);
        const minimumApiVersion = normalizeVersion(request.minimumApiVersion ?? '0.0.0');
        if (compareVersions(this.apiVersion, minimumApiVersion) < 0) {
            throw new ToolCapabilityError(
                `Runtime API ${this.apiVersion} does not satisfy ${minimumApiVersion}.`,
                { code: 'TOOL_API_VERSION_UNSUPPORTED' },
            );
        }
        const missing = required.filter((id) => !this.capabilities.has(id));
        if (missing.length > 0) {
            throw new ToolCapabilityError(
                `Required capability "${missing[0]}" is unavailable.`,
                { code: 'TOOL_CAPABILITY_UNAVAILABLE', capability: missing[0] },
            );
        }
        const granted = [...required, ...optional.filter((id) => this.capabilities.has(id))];
        const unavailableOptional = optional.filter((id) => !this.capabilities.has(id));
        const result = Object.freeze({
            apiVersion: this.apiVersion,
            granted: Object.freeze([...new Set(granted)].sort()),
            unavailableOptional: Object.freeze(unavailableOptional.sort()),
        });
        this.record('capabilities-negotiated', { grantedCount: result.granted.length });
        return result;
    }

    issueToken(input) {
        const toolId = text(input?.toolId, 'toolId');
        const negotiation = this.negotiate({
            required: input.required ?? [], optional: input.optional ?? [],
            minimumApiVersion: input.minimumApiVersion,
        });
        const issuedAt = this.now();
        const id = `cap:${issuedAt}:${++this.sequence}`;
        const token = {
            id, toolId, slot: String(input.slot ?? 'default'),
            capabilities: new Set(negotiation.granted),
            apiVersion: negotiation.apiVersion,
            issuedAt,
            expiresAt: Number.isFinite(input.ttlMs) && input.ttlMs > 0 ? issuedAt + Math.trunc(input.ttlMs) : null,
            revokedAt: null,
            active: true,
            metadata: Object.freeze({ ...(input.metadata ?? {}) }),
        };
        this.tokens.set(id, token);
        this.record('token-issued', { tokenId: id, toolId, capabilityCount: token.capabilities.size });
        return this.publicToken(token);
    }

    require(tokenId, capability) {
        const token = this.requireToken(tokenId);
        const id = text(capability, 'capability');
        if (!token.capabilities.has(id)) {
            this.record('capability-denied', { tokenId: token.id, toolId: token.toolId, capability: id });
            throw new ToolCapabilityError(
                `Tool "${token.toolId}" cannot use capability "${id}".`,
                { code: 'TOOL_CAPABILITY_DENIED', tokenId: token.id, toolId: token.toolId, capability: id },
            );
        }
        this.record('capability-used', { tokenId: token.id, toolId: token.toolId, capability: id });
        return true;
    }

    createServiceFacade(tokenId, services, requirements = {}) {
        const token = this.requireToken(tokenId);
        const facade = {};
        for (const [name, service] of Object.entries(services ?? {})) {
            const capability = requirements[name];
            if (!capability || token.capabilities.has(capability)) facade[name] = service;
        }
        this.record('service-facade-created', { tokenId: token.id, toolId: token.toolId, serviceCount: Object.keys(facade).length });
        return Object.freeze(facade);
    }

    revoke(tokenId, reason = 'manual') {
        const token = this.tokens.get(String(tokenId ?? ''));
        if (!token || !token.active) return false;
        token.active = false;
        token.revokedAt = this.now();
        this.record('token-revoked', { tokenId: token.id, toolId: token.toolId, reason: String(reason) });
        return true;
    }

    revokeTool(toolId, reason = 'tool-revoked') {
        const id = text(toolId, 'toolId');
        let count = 0;
        for (const token of this.tokens.values()) {
            if (token.toolId === id && this.revoke(token.id, reason)) count += 1;
        }
        return count;
    }

    discover() {
        return Object.freeze({
            apiVersion: this.apiVersion,
            capabilities: Object.freeze([...this.capabilities.values()].sort((a,b)=>a.id.localeCompare(b.id))),
        });
    }

    getSnapshot() {
        const active = [...this.tokens.values()].filter((token) => token.active && !this.isExpired(token));
        return Object.freeze({
            apiVersion: this.apiVersion,
            capabilityCount: this.capabilities.size,
            tokenCount: this.tokens.size,
            activeTokenCount: active.length,
            revokedTokenCount: [...this.tokens.values()].filter((token)=>!token.active).length,
            auditCount: this.audit.length,
        });
    }

    getAuditLog() { return Object.freeze([...this.audit]); }

    requireToken(tokenId) {
        const id = String(tokenId ?? '');
        const token = this.tokens.get(id);
        if (!token) {
            throw new ToolCapabilityError(`Capability token "${id}" was not found.`, {
                code: 'TOOL_CAPABILITY_TOKEN_NOT_FOUND', tokenId: id,
            });
        }
        if (!token.active) {
            throw new ToolCapabilityError(`Capability token "${id}" was revoked.`, {
                code: 'TOOL_CAPABILITY_TOKEN_REVOKED', tokenId: id, toolId: token.toolId,
            });
        }
        if (this.isExpired(token)) {
            token.active = false;
            token.revokedAt = this.now();
            throw new ToolCapabilityError(`Capability token "${id}" expired.`, {
                code: 'TOOL_CAPABILITY_TOKEN_EXPIRED', tokenId: id, toolId: token.toolId,
            });
        }
        return token;
    }

    isExpired(token) { return token.expiresAt !== null && token.expiresAt <= this.now(); }

    publicToken(token) {
        return Object.freeze({
            id: token.id, toolId: token.toolId, slot: token.slot,
            capabilities: Object.freeze([...token.capabilities].sort()),
            apiVersion: token.apiVersion, issuedAt: token.issuedAt,
            expiresAt: token.expiresAt, revokedAt: token.revokedAt,
            active: token.active && !this.isExpired(token), metadata: token.metadata,
        });
    }

    record(type, details = {}) {
        const entry = Object.freeze({ type, timestamp: this.now(), ...details });
        this.audit.push(entry);
        if (this.audit.length > this.auditLimit) this.audit.splice(0, this.audit.length - this.auditLimit);
        if (typeof this.reporter === 'function') Promise.resolve(this.reporter(entry)).catch(()=>undefined);
    }
}

function compareVersions(left, right) {
    const a = normalizeVersion(left).split('.').map(Number);
    const b = normalizeVersion(right).split('.').map(Number);
    for (let i = 0; i < 3; i += 1) if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
    return 0;
}
function normalizeVersion(value) {
    const version = String(value ?? '').trim();
    if (!/^\d+\.\d+\.\d+$/.test(version)) throw new TypeError('Version must use semantic major.minor.patch format.');
    return version;
}
function unique(values) { return [...new Set([...values].map((value)=>text(value,'capability')))]; }
function text(value, field) { const result=String(value??'').trim(); if(!result) throw new TypeError(`${field} is required.`); return result; }
function positive(value, fallback, field) { if(value===undefined)return fallback; if(!Number.isFinite(value)||value<1)throw new TypeError(`${field} must be positive.`); return Math.trunc(value); }

export { ToolCapabilityError, ToolCapabilityManager, compareVersions };

// END OF FILE
