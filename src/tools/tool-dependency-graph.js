/**
 * @file Immutable tool dependency graph with validation and resolution.
 * @module tools/tool-dependency-graph
 */

/**
 * Error raised for invalid tool dependency graphs.
 */
class ToolDependencyError extends Error {
    /**
     * @param {string} message
     * @param {{
     *   code?: string,
     *   toolId?: string,
     *   dependencyId?: string,
     *   cycle?: string[]
     * }} [options]
     */
    constructor(message, options = {}) {
        super(message);
        this.name = 'ToolDependencyError';
        this.code = options.code ?? 'TOOL_DEPENDENCY_FAILED';
        this.toolId = options.toolId ?? '';
        this.dependencyId = options.dependencyId ?? '';
        this.cycle = Object.freeze([...(options.cycle ?? [])]);
    }
}

/**
 * Stores dependency relationships and resolves safe execution order.
 */
class ToolDependencyGraph {
    constructor() {
        /** @type {Map<string, Set<string>>} */
        this.dependencies = new Map();
        this.revision = 0;
    }

    /**
     * @param {string} toolId
     * @param {Iterable<string>} [dependencies]
     * @returns {Readonly<Record<string, unknown>>}
     */
    register(toolId, dependencies = []) {
        const id = normalizeId(toolId, 'toolId');
        const normalized = normalizeDependencies(dependencies, id);
        this.dependencies.set(id, normalized);
        this.revision += 1;
        return this.getNode(id);
    }

    /**
     * @param {Iterable<Readonly<Record<string, unknown>>>} entries
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    registerMany(entries) {
        const result = [];

        for (const entry of entries) {
            result.push(
                this.register(entry.id, entry.dependencies ?? []),
            );
        }

        return Object.freeze(result);
    }

    /**
     * @param {string} toolId
     * @returns {boolean}
     */
    has(toolId) {
        return this.dependencies.has(normalizeId(toolId, 'toolId'));
    }

    /**
     * @param {string} toolId
     * @returns {Readonly<Record<string, unknown>>}
     */
    getNode(toolId) {
        const id = normalizeId(toolId, 'toolId');
        const dependencies = this.dependencies.get(id);

        if (!dependencies) {
            throw new ToolDependencyError(
                `Tool "${id}" is not registered in the dependency graph.`,
                {
                    code: 'TOOL_DEPENDENCY_NODE_NOT_FOUND',
                    toolId: id,
                },
            );
        }

        return Object.freeze({
            id,
            dependencies: Object.freeze([...dependencies].sort()),
        });
    }

    /**
     * Resolves dependencies before dependants.
     *
     * @param {string|Iterable<string>} toolIds
     * @param {{allowMissing?: boolean}} [options]
     * @returns {ReadonlyArray<string>}
     */
    resolve(toolIds, options = {}) {
        const roots =
            typeof toolIds === 'string'
                ? [normalizeId(toolIds, 'toolId')]
                : [...toolIds].map((id) => normalizeId(id, 'toolId'));
        const allowMissing = options.allowMissing === true;
        const permanent = new Set();
        const temporary = new Set();
        const order = [];
        const stack = [];

        const visit = (id) => {
            if (permanent.has(id)) {
                return;
            }

            if (temporary.has(id)) {
                const index = stack.indexOf(id);
                const cycle = [...stack.slice(index), id];

                throw new ToolDependencyError(
                    `Circular tool dependency detected: ${cycle.join(' -> ')}`,
                    {
                        code: 'TOOL_DEPENDENCY_CYCLE',
                        toolId: id,
                        cycle,
                    },
                );
            }

            const dependencies = this.dependencies.get(id);

            if (!dependencies) {
                if (allowMissing) {
                    permanent.add(id);
                    order.push(id);
                    return;
                }

                throw new ToolDependencyError(
                    `Tool "${id}" is missing from the dependency graph.`,
                    {
                        code: 'TOOL_DEPENDENCY_NODE_NOT_FOUND',
                        toolId: id,
                    },
                );
            }

            temporary.add(id);
            stack.push(id);

            for (const dependencyId of [...dependencies].sort()) {
                if (!this.dependencies.has(dependencyId) && !allowMissing) {
                    throw new ToolDependencyError(
                        `Tool "${id}" depends on missing tool "${dependencyId}".`,
                        {
                            code: 'TOOL_DEPENDENCY_MISSING',
                            toolId: id,
                            dependencyId,
                        },
                    );
                }

                visit(dependencyId);
            }

            stack.pop();
            temporary.delete(id);
            permanent.add(id);
            order.push(id);
        };

        for (const root of roots) {
            visit(root);
        }

        return Object.freeze(order);
    }

    /**
     * Returns parallel-safe dependency levels.
     *
     * @param {string|Iterable<string>} toolIds
     * @param {{allowMissing?: boolean}} [options]
     * @returns {ReadonlyArray<ReadonlyArray<string>>}
     */
    resolveLevels(toolIds, options = {}) {
        const order = this.resolve(toolIds, options);
        const included = new Set(order);
        const depths = new Map();

        for (const id of order) {
            const dependencies = this.dependencies.get(id) ?? new Set();
            const relevant = [...dependencies].filter((dependencyId) =>
                included.has(dependencyId),
            );
            const depth =
                relevant.length === 0
                    ? 0
                    : Math.max(
                          ...relevant.map(
                              (dependencyId) =>
                                  (depths.get(dependencyId) ?? 0) + 1,
                          ),
                      );

            depths.set(id, depth);
        }

        const levels = [];

        for (const id of order) {
            const depth = depths.get(id) ?? 0;
            levels[depth] ??= [];
            levels[depth].push(id);
        }

        return Object.freeze(
            levels.map((level) => Object.freeze([...level].sort())),
        );
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    validate() {
        const errors = [];

        for (const [toolId, dependencies] of this.dependencies) {
            for (const dependencyId of dependencies) {
                if (!this.dependencies.has(dependencyId)) {
                    errors.push(
                        Object.freeze({
                            code: 'TOOL_DEPENDENCY_MISSING',
                            toolId,
                            dependencyId,
                        }),
                    );
                }
            }
        }

        try {
            this.resolve(this.dependencies.keys(), {
                allowMissing: true,
            });
        } catch (error) {
            if (error instanceof ToolDependencyError) {
                errors.push(
                    Object.freeze({
                        code: error.code,
                        toolId: error.toolId,
                        cycle: error.cycle,
                    }),
                );
            } else {
                throw error;
            }
        }

        return Object.freeze({
            valid: errors.length === 0,
            errorCount: errors.length,
            errors: Object.freeze(errors),
            revision: this.revision,
        });
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    getSnapshot() {
        const nodes = [...this.dependencies.keys()]
            .sort()
            .map((id) => this.getNode(id));

        return Object.freeze({
            revision: this.revision,
            nodeCount: nodes.length,
            nodes: Object.freeze(nodes),
        });
    }

    clear() {
        this.dependencies.clear();
        this.revision += 1;
    }
}

/**
 * @param {unknown} value
 * @param {string} field
 * @returns {string}
 */
function normalizeId(value, field) {
    const id = String(value ?? '').trim();

    if (!id) {
        throw new TypeError(`${field} is required.`);
    }

    return id;
}

/**
 * @param {Iterable<string>} dependencies
 * @param {string} toolId
 * @returns {Set<string>}
 */
function normalizeDependencies(dependencies, toolId) {
    if (
        dependencies === null ||
        dependencies === undefined ||
        typeof dependencies[Symbol.iterator] !== 'function'
    ) {
        throw new TypeError('dependencies must be iterable.');
    }

    const result = new Set();

    for (const dependency of dependencies) {
        const id = normalizeId(dependency, 'dependency');

        if (id === toolId) {
            throw new ToolDependencyError(
                `Tool "${toolId}" cannot depend on itself.`,
                {
                    code: 'TOOL_DEPENDENCY_SELF_REFERENCE',
                    toolId,
                    dependencyId: id,
                },
            );
        }

        result.add(id);
    }

    return result;
}

export {
    ToolDependencyError,
    ToolDependencyGraph,
};

// END OF FILE
