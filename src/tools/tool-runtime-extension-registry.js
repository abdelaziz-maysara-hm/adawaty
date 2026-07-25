/**
 * @file Runtime extension registry.
 * @module tools/tool-runtime-extension-registry
 */

class ToolExtensionError extends Error {
    /**
     * @param {string} message
     * @param {{
     *   code?: string,
     *   extensionId?: string,
     *   cause?: unknown
     * }} [options]
     */
    constructor(message, options = {}) {
        super(message, { cause: options.cause });
        this.name = 'ToolExtensionError';
        this.code = options.code ?? 'TOOL_EXTENSION_FAILED';
        this.extensionId = options.extensionId ?? '';
    }
}

/**
 * Registers and manages runtime extensions and their lifecycle.
 */
class ToolRuntimeExtensionRegistry {
    /**
     * @param {{
     *   hookManager?: import('./tool-runtime-hook-manager.js').ToolRuntimeHookManager|null,
     *   now?: () => number
     * }} [options]
     */
    constructor(options = {}) {
        this.hookManager = options.hookManager ?? null;
        this.now = options.now ?? (() => Date.now());

        /** @type {Map<string, Record<string, unknown>>} */
        this.extensions = new Map();
    }

    /**
     * @param {{
     *   id: string,
     *   name?: string,
     *   version?: string,
     *   dependencies?: string[],
     *   metadata?: Record<string, unknown>,
     *   setup?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>,
     *   start?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>,
     *   stop?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>,
     *   dispose?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>
     * }} definition
     */
    register(definition) {
        if (!definition || typeof definition !== 'object') {
            throw new TypeError('extension definition must be an object.');
        }

        const id = requiredText(definition.id, 'extension.id');

        if (this.extensions.has(id)) {
            throw new ToolExtensionError(
                `Extension "${id}" is already registered.`,
                {
                    code: 'TOOL_EXTENSION_DUPLICATE',
                    extensionId: id,
                },
            );
        }

        const record = {
            id,
            name: String(definition.name ?? id),
            version: String(definition.version ?? '1.0.0'),
            dependencies: Object.freeze(
                [...(definition.dependencies ?? [])].map((value) =>
                    requiredText(value, 'extension dependency'),
                ),
            ),
            metadata: Object.freeze({ ...(definition.metadata ?? {}) }),
            setup:
                definition.setup === undefined
                    ? null
                    : requireFunction(definition.setup, 'setup'),
            start:
                definition.start === undefined
                    ? null
                    : requireFunction(definition.start, 'start'),
            stop:
                definition.stop === undefined
                    ? null
                    : requireFunction(definition.stop, 'stop'),
            dispose:
                definition.dispose === undefined
                    ? null
                    : requireFunction(definition.dispose, 'dispose'),
            state: 'registered',
            registeredAt: this.now(),
            startedAt: null,
        };

        this.extensions.set(id, record);
        return this.snapshot(record);
    }

    remove(extensionId) {
        const id = requiredText(extensionId, 'extensionId');
        const record = this.extensions.get(id);

        if (!record) {
            return false;
        }

        if (record.state === 'started') {
            throw new ToolExtensionError(
                `Extension "${id}" must be stopped before removal.`,
                {
                    code: 'TOOL_EXTENSION_ACTIVE',
                    extensionId: id,
                },
            );
        }

        if (this.hookManager) {
            this.hookManager.removeOwner(`extension:${id}`);
        }

        return this.extensions.delete(id);
    }

    get(extensionId) {
        const record = this.extensions.get(
            requiredText(extensionId, 'extensionId'),
        );
        return record ? this.snapshot(record) : null;
    }

    discover() {
        return Object.freeze(
            this.resolveOrder().map((record) => this.snapshot(record)),
        );
    }

    async startAll(context = {}) {
        const started = [];

        for (const record of this.resolveOrder()) {
            if (record.state === 'started') {
                continue;
            }

            const extensionContext = this.createContext(record, context);

            try {
                if (record.state === 'registered' && record.setup) {
                    await record.setup(extensionContext);
                    record.state = 'setup';
                }

                if (record.start) {
                    await record.start(extensionContext);
                }

                record.state = 'started';
                record.startedAt = this.now();
                started.push(record.id);
            } catch (error) {
                throw new ToolExtensionError(
                    `Extension "${record.id}" failed to start.`,
                    {
                        code: 'TOOL_EXTENSION_START_FAILED',
                        extensionId: record.id,
                        cause: error,
                    },
                );
            }
        }

        return Object.freeze(started);
    }

    async stopAll(context = {}) {
        const stopped = [];
        const ordered = [...this.resolveOrder()].reverse();

        for (const record of ordered) {
            if (record.state !== 'started') {
                continue;
            }

            try {
                if (record.stop) {
                    await record.stop(this.createContext(record, context));
                }

                record.state = 'stopped';
                record.startedAt = null;
                stopped.push(record.id);
            } catch (error) {
                throw new ToolExtensionError(
                    `Extension "${record.id}" failed to stop.`,
                    {
                        code: 'TOOL_EXTENSION_STOP_FAILED',
                        extensionId: record.id,
                        cause: error,
                    },
                );
            }
        }

        return Object.freeze(stopped);
    }

    async disposeAll(context = {}) {
        await this.stopAll(context);
        const disposed = [];

        for (const record of [...this.resolveOrder()].reverse()) {
            try {
                if (record.dispose) {
                    await record.dispose(
                        this.createContext(record, context),
                    );
                }

                if (this.hookManager) {
                    this.hookManager.removeOwner(
                        `extension:${record.id}`,
                    );
                }

                record.state = 'disposed';
                disposed.push(record.id);
            } catch (error) {
                throw new ToolExtensionError(
                    `Extension "${record.id}" failed to dispose.`,
                    {
                        code: 'TOOL_EXTENSION_DISPOSE_FAILED',
                        extensionId: record.id,
                        cause: error,
                    },
                );
            }
        }

        return Object.freeze(disposed);
    }

    getSnapshot() {
        const stateCounts = {};

        for (const record of this.extensions.values()) {
            stateCounts[record.state] =
                (stateCounts[record.state] ?? 0) + 1;
        }

        return Object.freeze({
            extensionCount: this.extensions.size,
            stateCounts: Object.freeze(stateCounts),
            extensions: Object.freeze(
                this.resolveOrder().map((record) =>
                    this.snapshot(record),
                ),
            ),
        });
    }

    clear() {
        this.extensions.clear();
    }

    /**
     * @private
     */
    createContext(record, context) {
        const ownerId = `extension:${record.id}`;

        return Object.freeze({
            ...context,
            extension: this.snapshot(record),
            hooks: this.hookManager
                ? Object.freeze({
                      before: (hookName, handler, options = {}) =>
                          this.hookManager.before(
                              hookName,
                              handler,
                              {
                                  ...options,
                                  ownerId,
                              },
                          ),
                      after: (hookName, handler, options = {}) =>
                          this.hookManager.after(
                              hookName,
                              handler,
                              {
                                  ...options,
                                  ownerId,
                              },
                          ),
                      around: (hookName, handler, options = {}) =>
                          this.hookManager.around(
                              hookName,
                              handler,
                              {
                                  ...options,
                                  ownerId,
                              },
                          ),
                  })
                : null,
        });
    }

    /**
     * @private
     */
    resolveOrder() {
        const ordered = [];
        const visiting = new Set();
        const visited = new Set();

        const visit = (record) => {
            if (visited.has(record.id)) {
                return;
            }

            if (visiting.has(record.id)) {
                throw new ToolExtensionError(
                    `Extension dependency cycle includes "${record.id}".`,
                    {
                        code: 'TOOL_EXTENSION_DEPENDENCY_CYCLE',
                        extensionId: record.id,
                    },
                );
            }

            visiting.add(record.id);

            for (const dependencyId of record.dependencies) {
                const dependency = this.extensions.get(dependencyId);

                if (!dependency) {
                    throw new ToolExtensionError(
                        `Missing dependency "${dependencyId}" for extension "${record.id}".`,
                        {
                            code: 'TOOL_EXTENSION_DEPENDENCY_MISSING',
                            extensionId: record.id,
                        },
                    );
                }

                visit(dependency);
            }

            visiting.delete(record.id);
            visited.add(record.id);
            ordered.push(record);
        };

        for (const record of this.extensions.values()) {
            visit(record);
        }

        return ordered;
    }

    /**
     * @private
     */
    snapshot(record) {
        return Object.freeze({
            id: record.id,
            name: record.name,
            version: record.version,
            dependencies: record.dependencies,
            metadata: record.metadata,
            state: record.state,
            registeredAt: record.registeredAt,
            startedAt: record.startedAt,
        });
    }
}

function requiredText(value, field) {
    const text = String(value ?? '').trim();

    if (!text) {
        throw new TypeError(`${field} is required.`);
    }

    return text;
}

function requireFunction(value, field) {
    if (typeof value !== 'function') {
        throw new TypeError(`${field} must be a function.`);
    }

    return value;
}

export {
    ToolExtensionError,
    ToolRuntimeExtensionRegistry,
};

// END OF FILE
