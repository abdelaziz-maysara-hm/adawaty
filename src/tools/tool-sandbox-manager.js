/**
 * @file Capability-based sandbox and session isolation for Adawaty tools.
 * @module tools/tool-sandbox-manager
 */

const DEFAULT_SESSION_TTL_MS = 0;
const DEFAULT_EVENT_BUFFER_SIZE = 100;

/**
 * Error raised when a sandbox policy is violated.
 */
class ToolSandboxError extends Error {
    /**
     * @param {string} message
     * @param {{
     *   code?: string,
     *   toolId?: string,
     *   sessionId?: string,
     *   capability?: string,
     *   cause?: unknown
     * }} [options]
     */
    constructor(message, options = {}) {
        super(message, {
            cause: options.cause,
        });

        this.name = 'ToolSandboxError';
        this.code = options.code ?? 'TOOL_SANDBOX_FAILED';
        this.toolId = options.toolId ?? '';
        this.sessionId = options.sessionId ?? '';
        this.capability = options.capability ?? '';
    }
}

/**
 * Manages isolated runtime sessions with explicit capabilities.
 */
class ToolSandboxManager {
    /**
     * @param {{
     *   allowedCapabilities?: Iterable<string>,
     *   defaultCapabilities?: Iterable<string>,
     *   sessionTtlMs?: number,
     *   eventBufferSize?: number,
     *   telemetry?: (entry: Readonly<Record<string, unknown>>) => void|Promise<void>,
     *   now?: () => number
     * }} [options]
     */
    constructor(options = {}) {
        this.allowedCapabilities = normalizeCapabilitySet(
            options.allowedCapabilities ?? [],
            'allowedCapabilities',
        );
        this.defaultCapabilities = normalizeCapabilitySet(
            options.defaultCapabilities ?? [],
            'defaultCapabilities',
        );

        for (const capability of this.defaultCapabilities) {
            if (
                this.allowedCapabilities.size > 0 &&
                !this.allowedCapabilities.has(capability)
            ) {
                throw new TypeError(
                    `Default capability "${capability}" is not allowed.`,
                );
            }
        }

        this.sessionTtlMs = normalizeNonNegativeInteger(
            options.sessionTtlMs,
            DEFAULT_SESSION_TTL_MS,
            'sessionTtlMs',
        );
        this.eventBufferSize = normalizePositiveInteger(
            options.eventBufferSize,
            DEFAULT_EVENT_BUFFER_SIZE,
            'eventBufferSize',
        );
        this.telemetry =
            options.telemetry === undefined
                ? null
                : normalizeFunction(options.telemetry, 'telemetry');
        this.now =
            options.now === undefined
                ? () => Date.now()
                : normalizeFunction(options.now, 'now');

        /** @type {Map<string, Record<string, unknown>>} */
        this.sessions = new Map();

        /** @type {Map<string, Set<Function>>} */
        this.eventSubscribers = new Map();

        /** @type {Array<Readonly<Record<string, unknown>>>} */
        this.telemetryBuffer = [];

        this.sequence = 0;
    }

    /**
     * Creates an isolated session for one tool instance.
     *
     * @param {{
     *   toolId: string,
     *   slot?: string,
     *   capabilities?: Iterable<string>,
     *   metadata?: Record<string, unknown>
     * }} input
     * @returns {Readonly<Record<string, unknown>>}
     */
    createSession(input) {
        const toolId = normalizeText(input?.toolId, 'toolId');
        const slot = normalizeOptionalText(input?.slot, 'default');
        const requested = normalizeCapabilitySet(
            input?.capabilities ?? this.defaultCapabilities,
            'capabilities',
        );

        this.assertCapabilitiesAllowed(requested, toolId);

        const createdAt = this.now();
        const sessionId = `${toolId}:${slot}:${++this.sequence}`;
        const session = {
            id: sessionId,
            toolId,
            slot,
            capabilities: requested,
            metadata: Object.freeze({
                ...(input?.metadata ?? {}),
            }),
            resources: new Map(),
            createdAt,
            touchedAt: createdAt,
            expiresAt:
                this.sessionTtlMs > 0 ? createdAt + this.sessionTtlMs : null,
            active: true,
        };

        this.sessions.set(sessionId, session);
        this.recordTelemetry('session-created', session, {
            capabilityCount: requested.size,
        });

        return this.createPublicSession(session);
    }

    /**
     * Returns a restricted service facade for a session.
     *
     * @param {string} sessionId
     * @param {Record<string, unknown>} services
     * @param {Record<string, string>} [serviceCapabilities]
     * @returns {Readonly<Record<string, unknown>>}
     */
    createServiceFacade(sessionId, services, serviceCapabilities = {}) {
        const session = this.requireSession(sessionId);
        const source = normalizeRecord(services, 'services');
        const rules = normalizeRecord(
            serviceCapabilities,
            'serviceCapabilities',
        );
        const facade = {};

        for (const [name, service] of Object.entries(source)) {
            const requiredCapability = rules[name];

            if (
                requiredCapability &&
                !session.capabilities.has(requiredCapability)
            ) {
                continue;
            }

            facade[name] = service;
        }

        this.touch(session);
        return Object.freeze(facade);
    }

    /**
     * Verifies that a session owns a capability.
     *
     * @param {string} sessionId
     * @param {string} capability
     * @returns {true}
     */
    requireCapability(sessionId, capability) {
        const session = this.requireSession(sessionId);
        const normalized = normalizeText(capability, 'capability');

        if (!session.capabilities.has(normalized)) {
            const error = new ToolSandboxError(
                `Tool "${session.toolId}" is not allowed to use capability "${normalized}".`,
                {
                    code: 'TOOL_CAPABILITY_DENIED',
                    toolId: session.toolId,
                    sessionId: session.id,
                    capability: normalized,
                },
            );

            this.recordTelemetry('capability-denied', session, {
                capability: normalized,
            });
            throw error;
        }

        this.touch(session);
        return true;
    }

    /**
     * Registers a disposable resource owned by a session.
     *
     * @param {string} sessionId
     * @param {string} resourceId
     * @param {unknown} resource
     * @param {(resource: unknown, context: Readonly<Record<string, unknown>>) => void|Promise<void>} [dispose]
     * @returns {Readonly<Record<string, unknown>>}
     */
    registerResource(sessionId, resourceId, resource, dispose) {
        const session = this.requireSession(sessionId);
        const id = normalizeText(resourceId, 'resourceId');

        if (session.resources.has(id)) {
            throw new ToolSandboxError(
                `Resource "${id}" is already registered for session "${session.id}".`,
                {
                    code: 'TOOL_RESOURCE_EXISTS',
                    toolId: session.toolId,
                    sessionId: session.id,
                },
            );
        }

        if (dispose !== undefined && typeof dispose !== 'function') {
            throw new TypeError('Resource dispose handler must be a function.');
        }

        const entry = Object.freeze({
            id,
            resource,
            dispose: dispose ?? null,
            registeredAt: this.now(),
        });

        session.resources.set(id, entry);
        this.touch(session);
        this.recordTelemetry('resource-registered', session, {
            resourceId: id,
        });

        return entry;
    }

    /**
     * Removes and optionally disposes one resource.
     *
     * @param {string} sessionId
     * @param {string} resourceId
     * @param {{reason?: string}} [options]
     * @returns {Promise<boolean>}
     */
    async releaseResource(sessionId, resourceId, options = {}) {
        const session = this.requireSession(sessionId);
        const id = normalizeText(resourceId, 'resourceId');
        const entry = session.resources.get(id);

        if (!entry) {
            return false;
        }

        try {
            if (entry.dispose) {
                await entry.dispose(
                    entry.resource,
                    Object.freeze({
                        sessionId: session.id,
                        toolId: session.toolId,
                        resourceId: id,
                        reason: normalizeOptionalText(
                            options.reason,
                            'manual',
                        ),
                    }),
                );
            }
        } catch (error) {
            throw new ToolSandboxError(
                `Failed to release resource "${id}" for tool "${session.toolId}".`,
                {
                    code: 'TOOL_RESOURCE_RELEASE_FAILED',
                    toolId: session.toolId,
                    sessionId: session.id,
                    cause: error,
                },
            );
        } finally {
            session.resources.delete(id);
            this.touch(session);
        }

        this.recordTelemetry('resource-released', session, {
            resourceId: id,
        });
        return true;
    }

    /**
     * Subscribes to events emitted inside a session scope.
     *
     * @param {string} sessionId
     * @param {string} eventName
     * @param {(payload: unknown, context: Readonly<Record<string, unknown>>) => void|Promise<void>} listener
     * @returns {() => void}
     */
    on(sessionId, eventName, listener) {
        const session = this.requireSession(sessionId);
        const name = normalizeText(eventName, 'eventName');
        const callback = normalizeFunction(listener, 'listener');
        const key = createEventKey(session.id, name);
        const subscribers = this.eventSubscribers.get(key) ?? new Set();

        subscribers.add(callback);
        this.eventSubscribers.set(key, subscribers);
        this.touch(session);

        return () => {
            subscribers.delete(callback);

            if (subscribers.size === 0) {
                this.eventSubscribers.delete(key);
            }
        };
    }

    /**
     * Emits an event only to listeners in the same session.
     *
     * @param {string} sessionId
     * @param {string} eventName
     * @param {unknown} payload
     * @returns {Promise<number>}
     */
    async emit(sessionId, eventName, payload) {
        const session = this.requireSession(sessionId);
        const name = normalizeText(eventName, 'eventName');
        const listeners = [
            ...(this.eventSubscribers.get(createEventKey(session.id, name)) ??
                []),
        ];
        const context = Object.freeze({
            sessionId: session.id,
            toolId: session.toolId,
            eventName: name,
            emittedAt: this.now(),
        });

        for (const listener of listeners) {
            await listener(payload, context);
        }

        this.touch(session);
        this.recordTelemetry('event-emitted', session, {
            eventName: name,
            listenerCount: listeners.length,
        });
        return listeners.length;
    }

    /**
     * Closes a session and disposes all registered resources.
     *
     * @param {string} sessionId
     * @param {{reason?: string}} [options]
     * @returns {Promise<boolean>}
     */
    async closeSession(sessionId, options = {}) {
        const session = this.sessions.get(String(sessionId ?? ''));

        if (!session || !session.active) {
            return false;
        }

        const resourceIds = [...session.resources.keys()].reverse();
        const errors = [];

        for (const resourceId of resourceIds) {
            try {
                await this.releaseResource(session.id, resourceId, {
                    reason: options.reason ?? 'session-close',
                });
            } catch (error) {
                errors.push(error);
            }
        }

        for (const key of [...this.eventSubscribers.keys()]) {
            if (key.startsWith(`${session.id}\u0000`)) {
                this.eventSubscribers.delete(key);
            }
        }

        session.active = false;
        session.touchedAt = this.now();
        this.sessions.delete(session.id);
        this.recordTelemetry('session-closed', session, {
            reason: normalizeOptionalText(options.reason, 'manual'),
            releaseErrorCount: errors.length,
        });

        if (errors.length > 0) {
            throw new AggregateError(
                errors,
                `One or more resources failed to close for session "${session.id}".`,
            );
        }

        return true;
    }

    /**
     * Removes sessions that exceeded their TTL.
     *
     * @returns {Promise<number>}
     */
    async sweepExpiredSessions() {
        const now = this.now();
        const expired = [...this.sessions.values()].filter(
            (session) =>
                session.active &&
                session.expiresAt !== null &&
                session.expiresAt <= now,
        );

        for (const session of expired) {
            await this.closeSession(session.id, {
                reason: 'expired',
            });
        }

        return expired.length;
    }

    /**
     * @param {string} sessionId
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getSession(sessionId) {
        const session = this.sessions.get(String(sessionId ?? ''));

        return session && session.active
            ? this.createPublicSession(session)
            : null;
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    getSnapshot() {
        const sessions = [...this.sessions.values()]
            .filter((session) => session.active)
            .sort((left, right) => left.id.localeCompare(right.id))
            .map((session) => this.createPublicSession(session));

        return Object.freeze({
            sessionCount: sessions.length,
            sessions: Object.freeze(sessions),
            telemetryCount: this.telemetryBuffer.length,
        });
    }

    /**
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getTelemetry() {
        return Object.freeze([...this.telemetryBuffer]);
    }

    /**
     * @private
     * @param {Set<string>} capabilities
     * @param {string} toolId
     * @returns {void}
     */
    assertCapabilitiesAllowed(capabilities, toolId) {
        if (this.allowedCapabilities.size === 0) {
            return;
        }

        for (const capability of capabilities) {
            if (!this.allowedCapabilities.has(capability)) {
                throw new ToolSandboxError(
                    `Capability "${capability}" is not allowed for tool "${toolId}".`,
                    {
                        code: 'TOOL_CAPABILITY_NOT_ALLOWED',
                        toolId,
                        capability,
                    },
                );
            }
        }
    }

    /**
     * @private
     * @param {string} sessionId
     * @returns {Record<string, unknown>}
     */
    requireSession(sessionId) {
        const session = this.sessions.get(String(sessionId ?? ''));

        if (!session || !session.active) {
            throw new ToolSandboxError(
                `Sandbox session "${sessionId}" is not active.`,
                {
                    code: 'TOOL_SESSION_NOT_FOUND',
                    sessionId: String(sessionId ?? ''),
                },
            );
        }

        if (
            session.expiresAt !== null &&
            session.expiresAt <= this.now()
        ) {
            throw new ToolSandboxError(
                `Sandbox session "${session.id}" has expired.`,
                {
                    code: 'TOOL_SESSION_EXPIRED',
                    toolId: session.toolId,
                    sessionId: session.id,
                },
            );
        }

        return session;
    }

    /**
     * @private
     * @param {Record<string, unknown>} session
     * @returns {void}
     */
    touch(session) {
        const touchedAt = this.now();
        session.touchedAt = touchedAt;

        if (this.sessionTtlMs > 0) {
            session.expiresAt = touchedAt + this.sessionTtlMs;
        }
    }

    /**
     * @private
     * @param {Record<string, unknown>} session
     * @returns {Readonly<Record<string, unknown>>}
     */
    createPublicSession(session) {
        return Object.freeze({
            id: session.id,
            toolId: session.toolId,
            slot: session.slot,
            capabilities: Object.freeze(
                [...session.capabilities].sort(),
            ),
            metadata: session.metadata,
            resourceCount: session.resources.size,
            createdAt: session.createdAt,
            touchedAt: session.touchedAt,
            expiresAt: session.expiresAt,
            active: session.active,
        });
    }

    /**
     * @private
     * @param {string} type
     * @param {Record<string, unknown>} session
     * @param {Record<string, unknown>} details
     * @returns {void}
     */
    recordTelemetry(type, session, details = {}) {
        const entry = Object.freeze({
            type,
            sessionId: session.id,
            toolId: session.toolId,
            slot: session.slot,
            timestamp: this.now(),
            ...details,
        });

        this.telemetryBuffer.push(entry);

        if (this.telemetryBuffer.length > this.eventBufferSize) {
            this.telemetryBuffer.splice(
                0,
                this.telemetryBuffer.length - this.eventBufferSize,
            );
        }

        if (this.telemetry) {
            Promise.resolve(this.telemetry(entry)).catch(() => undefined);
        }
    }
}

/**
 * @param {unknown} value
 * @param {string} field
 * @returns {Set<string>}
 */
function normalizeCapabilitySet(value, field) {
    if (
        value === null ||
        value === undefined ||
        typeof value[Symbol.iterator] !== 'function'
    ) {
        throw new TypeError(`${field} must be iterable.`);
    }

    const capabilities = new Set();

    for (const capability of value) {
        capabilities.add(normalizeText(capability, 'capability'));
    }

    return capabilities;
}

/**
 * @param {unknown} value
 * @param {string} field
 * @returns {Record<string, unknown>}
 */
function normalizeRecord(value, field) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError(`${field} must be an object.`);
    }

    return value;
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

/**
 * @param {unknown} value
 * @param {string} field
 * @returns {string}
 */
function normalizeText(value, field) {
    const text = String(value ?? '').trim();

    if (!text) {
        throw new TypeError(`${field} is required.`);
    }

    return text;
}

/**
 * @param {unknown} value
 * @param {string} fallback
 * @returns {string}
 */
function normalizeOptionalText(value, fallback) {
    return String(value ?? fallback).trim() || fallback;
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
 * @param {string} sessionId
 * @param {string} eventName
 * @returns {string}
 */
function createEventKey(sessionId, eventName) {
    return `${sessionId}\u0000${eventName}`;
}

export {
    ToolSandboxError,
    ToolSandboxManager,
};

// END OF FILE
