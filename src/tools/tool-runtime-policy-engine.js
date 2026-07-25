/**
 * @file Runtime security policy and authorization engine.
 * @module tools/tool-runtime-policy-engine
 */

const DEFAULT_HISTORY_LIMIT = 500;

class ToolPolicyError extends Error {
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolPolicyError';
        this.code = options.code ?? 'TOOL_POLICY_ERROR';
        this.policyId = options.policyId ?? '';
        this.action = options.action ?? '';
        this.resource = options.resource ?? '';
    }
}

class ToolRuntimePolicyEngine {
    constructor(options = {}) {
        this.defaultEffect = options.defaultEffect === 'allow' ? 'allow' : 'deny';
        this.historyLimit = positiveInteger(options.historyLimit, DEFAULT_HISTORY_LIMIT, 'historyLimit');
        this.now = options.now ?? (() => Date.now());
        this.reporter = options.reporter ?? null;
        if (this.reporter !== null && typeof this.reporter !== 'function') {
            throw new TypeError('reporter must be a function.');
        }
        this.policies = new Map();
        this.history = [];
        this.sequence = 0;
        this.evaluationCount = 0;
        this.deniedCount = 0;
    }

    register(definition, options = {}) {
        if (!definition || typeof definition !== 'object') {
            throw new TypeError('policy definition must be an object.');
        }
        const id = requiredText(definition.id, 'policy.id');
        if (this.policies.has(id) && options.override !== true) {
            throw new ToolPolicyError(`Policy "${id}" is already registered.`, {
                code: 'TOOL_POLICY_DUPLICATE', policyId: id,
            });
        }
        const record = {
            id,
            effect: normalizeEffect(definition.effect),
            priority: normalizePriority(definition.priority),
            actions: freezeList(definition.actions ?? ['*']),
            resources: freezeList(definition.resources ?? ['*']),
            subjects: freezeList(definition.subjects ?? ['*']),
            roles: freezeList(definition.roles ?? []),
            toolIds: freezeList(definition.toolIds ?? []),
            extensionIds: freezeList(definition.extensionIds ?? []),
            environments: freezeList(definition.environments ?? []),
            condition: definition.condition ?? null,
            metadata: Object.freeze({ ...(definition.metadata ?? {}) }),
            registeredAt: this.now(),
            sequence: ++this.sequence,
        };
        if (record.condition !== null && typeof record.condition !== 'function') {
            throw new TypeError('policy condition must be a function.');
        }
        this.policies.set(id, record);
        this.record('registered', { policyId: id, effect: record.effect });
        return snapshotPolicy(record);
    }

    remove(policyId) {
        const id = requiredText(policyId, 'policyId');
        const removed = this.policies.delete(id);
        if (removed) this.record('removed', { policyId: id });
        return removed;
    }

    async authorize(input = {}) {
        const request = normalizeRequest(input);
        const matches = [];
        for (const policy of this.policies.values()) {
            if (await this.matches(policy, request)) matches.push(policy);
        }
        matches.sort((a, b) => b.priority - a.priority || a.sequence - b.sequence);
        const deny = matches.find((policy) => policy.effect === 'deny');
        const allow = matches.find((policy) => policy.effect === 'allow');
        const winner = deny ?? allow ?? null;
        const effect = winner?.effect ?? this.defaultEffect;
        const allowed = effect === 'allow';
        this.evaluationCount += 1;
        if (!allowed) this.deniedCount += 1;
        const decision = Object.freeze({
            allowed,
            effect,
            reason: winner
                ? `Matched ${winner.effect} policy "${winner.id}".`
                : `No matching policy; default ${this.defaultEffect}.`,
            policyId: winner?.id ?? null,
            request,
            matchedPolicyIds: Object.freeze(matches.map((policy) => policy.id)),
            evaluatedAt: this.now(),
        });
        this.record('decision', {
            allowed, effect, policyId: decision.policyId,
            action: request.action, resource: request.resource,
            toolId: request.toolId,
        });
        return decision;
    }

    async require(input = {}) {
        const decision = await this.authorize(input);
        if (!decision.allowed) {
            throw new ToolPolicyError(
                `Authorization denied for "${decision.request.action}" on "${decision.request.resource}".`,
                {
                    code: 'TOOL_POLICY_DENIED',
                    policyId: decision.policyId ?? '',
                    action: decision.request.action,
                    resource: decision.request.resource,
                },
            );
        }
        return decision;
    }

    async can(input = {}) {
        return (await this.authorize(input)).allowed;
    }

    async explain(input = {}) {
        return this.authorize(input);
    }

    getSnapshot() {
        return Object.freeze({
            policyCount: this.policies.size,
            defaultEffect: this.defaultEffect,
            evaluationCount: this.evaluationCount,
            deniedCount: this.deniedCount,
            policies: Object.freeze([...this.policies.values()]
                .sort((a, b) => b.priority - a.priority || a.sequence - b.sequence)
                .map(snapshotPolicy)),
        });
    }

    getHistory() { return Object.freeze([...this.history]); }
    clearHistory() { const count = this.history.length; this.history = []; return count; }
    clear() { this.policies.clear(); this.clearHistory(); }

    async matches(policy, request) {
        if (!matchesList(policy.actions, request.action)) return false;
        if (!matchesList(policy.resources, request.resource)) return false;
        if (!matchesList(policy.subjects, request.subject)) return false;
        if (policy.roles.length && !request.roles.some((role) => matchesList(policy.roles, role))) return false;
        if (policy.toolIds.length && !matchesList(policy.toolIds, request.toolId)) return false;
        if (policy.extensionIds.length && !matchesList(policy.extensionIds, request.extensionId)) return false;
        if (policy.environments.length && !matchesList(policy.environments, request.environment)) return false;
        return policy.condition ? Boolean(await policy.condition(request)) : true;
    }

    record(type, details) {
        const entry = Object.freeze({ type, timestamp: this.now(), ...redact(details) });
        this.history.push(entry);
        if (this.history.length > this.historyLimit) {
            this.history.splice(0, this.history.length - this.historyLimit);
        }
        if (this.reporter) Promise.resolve(this.reporter(entry)).catch(() => undefined);
    }
}

function normalizeRequest(input) {
    return Object.freeze({
        subject: String(input.subject ?? 'anonymous'),
        roles: Object.freeze([...(input.roles ?? [])].map(String)),
        action: requiredText(input.action, 'action'),
        resource: requiredText(input.resource, 'resource'),
        toolId: String(input.toolId ?? ''),
        extensionId: String(input.extensionId ?? ''),
        environment: String(input.environment ?? ''),
        attributes: Object.freeze({ ...(input.attributes ?? {}) }),
    });
}
function snapshotPolicy(policy) {
    return Object.freeze({
        id: policy.id, effect: policy.effect, priority: policy.priority,
        actions: policy.actions, resources: policy.resources,
        subjects: policy.subjects, roles: policy.roles,
        toolIds: policy.toolIds, extensionIds: policy.extensionIds,
        environments: policy.environments, metadata: policy.metadata,
        registeredAt: policy.registeredAt,
    });
}
function matchesList(patterns, value) {
    return patterns.some((pattern) => pattern === '*' || pattern === value ||
        (pattern.endsWith('*') && value.startsWith(pattern.slice(0, -1))));
}
function freezeList(values) { return Object.freeze([...values].map(String)); }
function normalizeEffect(value) {
    const effect = value ?? 'deny';
    if (effect !== 'allow' && effect !== 'deny') throw new TypeError('effect must be allow or deny.');
    return effect;
}
function normalizePriority(value) {
    if (value === undefined) return 0;
    if (!Number.isFinite(value)) throw new TypeError('priority must be a number.');
    return Math.trunc(value);
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
function redact(value) {
    const blocked = new Set(['password', 'token', 'secret', 'authorization']);
    const walk = (input) => {
        if (Array.isArray(input)) return Object.freeze(input.map(walk));
        if (!input || typeof input !== 'object') return input;
        const output = {};
        for (const [key, item] of Object.entries(input)) output[key] = blocked.has(key.toLowerCase()) ? '[REDACTED]' : walk(item);
        return Object.freeze(output);
    };
    return walk(value);
}

export { ToolPolicyError, ToolRuntimePolicyEngine };

// END OF FILE
