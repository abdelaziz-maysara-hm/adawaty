/**
 * @file Runtime lifecycle host for mounting and unmounting Adawaty tools.
 * @module tools/tool-runtime-host
 */

const DEFAULT_SLOT = 'default';

/**
 * Error raised when a loaded tool does not satisfy the runtime contract.
 */
class ToolRuntimeError extends Error {
    /**
     * @param {string} message
     * @param {{
     *   code?: string,
     *   toolId?: string,
     *   slot?: string,
     *   cause?: unknown
     * }} [options]
     */
    constructor(message, options = {}) {
        super(message, {
            cause: options.cause,
        });

        this.name = 'ToolRuntimeError';
        this.code = options.code ?? 'TOOL_RUNTIME_FAILED';
        this.toolId = options.toolId ?? '';
        this.slot = options.slot ?? DEFAULT_SLOT;
    }
}

/**
 * Coordinates loaded tool instances across named UI slots.
 */
class ToolRuntimeHost {
    /**
     * @param {{
     *   loader: import('./runtime-tool-loader.js').RuntimeToolLoader,
     *   contextFactory?: (input: Readonly<Record<string, unknown>>) => Record<string, unknown>,
     *   hooks?: {
     *     beforeMount?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>,
     *     afterMount?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>,
     *     beforeUnmount?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>,
     *     afterUnmount?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>,
     *     onError?: (context: Readonly<Record<string, unknown>>) => void|Promise<void>
     *   }
     * }} options
     */
    constructor(options) {
        if (!options?.loader) {
            throw new TypeError('ToolRuntimeHost requires a loader.');
        }

        this.loader = options.loader;
        this.sandbox = options.sandbox ?? null;
        this.monitor = options.monitor ?? null;
        this.stateStore = options.stateStore ?? null;
        this.resourceManager = options.resourceManager ?? null;
        this.capabilityManager = options.capabilityManager ?? null;
        this.eventBus = options.eventBus ?? null;
        this.hookManager = options.hookManager ?? null;
        this.serviceContainer = options.serviceContainer ?? null;
        this.configManager = options.configManager ?? null;
        this.featureFlags = options.featureFlags ?? null;
        this.policyEngine = options.policyEngine ?? null;
        this.auditManager = options.auditManager ?? null;
        this.diagnosticsCenter = options.diagnosticsCenter ?? null;
        this.telemetry = options.telemetry ?? null;
        this.contextFactory = normalizeContextFactory(options.contextFactory);
        this.hooks = normalizeHooks(options.hooks);

        /** @type {Map<string, Readonly<Record<string, unknown>>>} */
        this.instances = new Map();

        /** @type {Map<string, Promise<Readonly<Record<string, unknown>>>>} */
        this.operations = new Map();

        /** @type {number} */
        this.sequence = 0;
    }

    /**
     * Mounts a tool into a named slot.
     *
     * Any existing instance in the slot is unmounted first.
     *
     * @param {string} toolId
     * @param {unknown} target
     * @param {{
     *   slot?: string,
     *   props?: Record<string, unknown>,
     *   services?: Record<string, unknown>,
     *   locale?: string,
     *   direction?: string,
     *   signal?: AbortSignal,
     *   load?: Record<string, unknown>,
     *   capabilities?: Iterable<string>,
     *   serviceCapabilities?: Record<string, string>,
     *   metadata?: Record<string, unknown>,
     *   restoreState?: boolean,
     *   initialState?: unknown
     * }} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    mount(toolId, target, options = {}) {
        const slot = normalizeSlot(options.slot);

        return this.queue(slot, async () => {
            if (options.signal?.aborted) {
                throw createRuntimeError(
                    'TOOL_MOUNT_ABORTED',
                    toolId,
                    slot,
                    'Tool mounting was aborted.',
                    options.signal.reason,
                );
            }

            if (this.instances.has(slot)) {
                await this.unmountInternal(slot, {
                    reason: 'replaced',
                });
            }

            const record = await this.loader.load(toolId, {
                ...(options.load ?? {}),
                signal: options.signal,
            });
            const runtime = resolveRuntime(record, slot);
            const restoredRecord =
                this.stateStore && options.restoreState !== false
                    ? await this.stateStore.load(record.id, slot)
                    : null;
            const initialState =
                options.initialState !== undefined
                    ? options.initialState
                    : restoredRecord?.state ?? null;
            const hookOwnerId = `${record.id}:${slot}`;
            const hookApi = this.hookManager
                ? Object.freeze({
                      before: (hookName, handler, hookOptions = {}) =>
                          this.hookManager.before(
                              hookName,
                              handler,
                              {
                                  ...hookOptions,
                                  ownerId: hookOwnerId,
                              },
                          ),
                      after: (hookName, handler, hookOptions = {}) =>
                          this.hookManager.after(
                              hookName,
                              handler,
                              {
                                  ...hookOptions,
                                  ownerId: hookOwnerId,
                              },
                          ),
                      around: (hookName, handler, hookOptions = {}) =>
                          this.hookManager.around(
                              hookName,
                              handler,
                              {
                                  ...hookOptions,
                                  ownerId: hookOwnerId,
                              },
                          ),
                      execute: (hookName, hookContext, operation) =>
                          this.hookManager.execute(
                              hookName,
                              hookContext,
                              operation,
                          ),
                      remove: (hookId) =>
                          this.hookManager.remove(hookId),
                  })
                : null;
            const eventOwnerId = `${record.id}:${slot}`;
            const eventApi = this.eventBus
                ? Object.freeze({
                      ownerId: eventOwnerId,
                      publish: (eventName, payload, eventOptions = {}) =>
                          this.eventBus.publish(eventName, payload, {
                              ...eventOptions,
                              source:
                                  eventOptions.source ??
                                  eventOwnerId,
                          }),
                      publishAsync: (eventName, payload, eventOptions = {}) =>
                          this.eventBus.publishAsync(
                              eventName,
                              payload,
                              {
                                  ...eventOptions,
                                  source:
                                      eventOptions.source ??
                                      eventOwnerId,
                              },
                          ),
                      defer: (eventName, payload, eventOptions = {}) =>
                          this.eventBus.defer(eventName, payload, {
                              ...eventOptions,
                              source:
                                  eventOptions.source ??
                                  eventOwnerId,
                          }),
                      subscribe: (eventName, listener, subscribeOptions = {}) =>
                          this.eventBus.subscribe(
                              eventName,
                              listener,
                              {
                                  ...subscribeOptions,
                                  ownerId: eventOwnerId,
                              },
                          ),
                      once: (eventName, listener, subscribeOptions = {}) =>
                          this.eventBus.once(
                              eventName,
                              listener,
                              {
                                  ...subscribeOptions,
                                  ownerId: eventOwnerId,
                              },
                          ),
                      unsubscribe: (listenerId) =>
                          this.eventBus.unsubscribe(listenerId),
                      request: (eventName, payload, requestOptions = {}) =>
                          this.eventBus.request(
                              eventName,
                              payload,
                              {
                                  ...requestOptions,
                                  ownerId: eventOwnerId,
                                  source:
                                      requestOptions.source ??
                                      eventOwnerId,
                              },
                          ),
                  })
                : null;
            const resourceOwnerId = `${record.id}:${slot}`;
            const resourceApi = this.resourceManager
                ? Object.freeze({
                      ownerId: resourceOwnerId,
                      register: (definition) =>
                          this.resourceManager.register({
                              ...definition,
                              ownerId: resourceOwnerId,
                          }),
                      retain: (resourceId) =>
                          this.resourceManager.retain(resourceId),
                      release: (resourceId, releaseOptions = {}) =>
                          this.resourceManager.release(resourceId, releaseOptions),
                      touch: (resourceId) =>
                          this.resourceManager.touch(resourceId),
                      dispose: (resourceId, disposeOptions = {}) =>
                          this.resourceManager.dispose(resourceId, disposeOptions),
                  })
                : null;
            const stateApi = this.stateStore
                ? Object.freeze({
                      restored: restoredRecord !== null,
                      value: initialState,
                      save: (state, saveOptions = {}) =>
                          this.stateStore.save(
                              record.id,
                              slot,
                              state,
                              saveOptions,
                          ),
                      clear: () =>
                          this.stateStore.remove(record.id, slot),
                  })
                : Object.freeze({
                      restored: false,
                      value: initialState,
                      save: async () => null,
                      clear: async () => false,
                  });
            const capabilityToken =
                this.capabilityManager &&
                this.capabilityManager.discover().capabilities.length > 0
                    ? this.capabilityManager.issueToken({
                      toolId: record.id,
                      slot,
                      required: options.capabilities ?? [],
                      optional: options.optionalCapabilities ?? [],
                      minimumApiVersion: options.minimumApiVersion,
                      ttlMs: options.capabilityTtlMs,
                      metadata: options.metadata ?? {},
                      })
                    : null;
            const capabilityApi = capabilityToken
                ? Object.freeze({
                      token: capabilityToken,
                      has: (capability) =>
                          capabilityToken.capabilities.includes(capability),
                      require: (capability) =>
                          this.capabilityManager.require(
                              capabilityToken.id,
                              capability,
                          ),
                      discover: () =>
                          this.capabilityManager.discover(),
                  })
                : null;
            const sandboxSession = this.sandbox
                ? this.sandbox.createSession({
                      toolId: record.id,
                      slot,
                      capabilities: options.capabilities ?? [],
                      metadata: options.metadata ?? {},
                  })
                : null;
            const services = this.capabilityManager && capabilityToken
                ? this.capabilityManager.createServiceFacade(
                      capabilityToken.id,
                      options.services ?? {},
                      options.serviceCapabilities ?? {},
                  )
                : this.sandbox
                  ? this.sandbox.createServiceFacade(
                        sandboxSession.id,
                        options.services ?? {},
                        options.serviceCapabilities ?? {},
                    )
                  : Object.freeze({
                        ...(options.services ?? {}),
                    });
            const configApi = this.configManager
                ? Object.freeze({
                      get: (path, configOptions = {}) =>
                          this.configManager.get(path, {
                              ...configOptions,
                              toolId: record.id,
                          }),
                      has: (path, configOptions = {}) =>
                          this.configManager.has(path, {
                              ...configOptions,
                              toolId: record.id,
                          }),
                      snapshot: () =>
                          this.configManager.snapshot(record.id),
                  })
                : null;
            const featureApi = this.featureFlags
                ? Object.freeze({
                      isEnabled: (flagId, evaluationContext = {}, flagOptions = {}) =>
                          this.featureFlags.isEnabled(
                              flagId,
                              {
                                  ...evaluationContext,
                                  toolId: record.id,
                              },
                              flagOptions,
                          ),
                      evaluate: (flagId, evaluationContext = {}, flagOptions = {}) =>
                          this.featureFlags.evaluate(
                              flagId,
                              {
                                  ...evaluationContext,
                                  toolId: record.id,
                              },
                              flagOptions,
                          ),
                  })
                : null;
            const telemetryOwnerId = `${record.id}:${slot}`;
            const telemetryApi = this.telemetry
                ? Object.freeze({
                      counter: (name, amount = 1, metricOptions = {}) => this.telemetry.increment(name, amount, { ...metricOptions, ownerId: telemetryOwnerId }),
                      gauge: (name, value, metricOptions = {}) => this.telemetry.gauge(name, value, { ...metricOptions, ownerId: telemetryOwnerId }),
                      histogram: (name, value, metricOptions = {}) => this.telemetry.histogram(name, value, { ...metricOptions, ownerId: telemetryOwnerId }),
                      timer: (name, metricOptions = {}) => this.telemetry.timer(name, { ...metricOptions, ownerId: telemetryOwnerId }),
                      trace: (input = {}) => this.telemetry.startTrace({ ...input, attributes: { ...(input.attributes ?? {}), toolId: record.id, slot } }),
                      finishTrace: (traceId, spanId, traceOptions = {}) => this.telemetry.finishTrace(traceId, spanId, traceOptions),
                      span: (name, operation, spanOptions = {}) => this.telemetry.span(name, operation, { ...spanOptions, attributes: { ...(spanOptions.attributes ?? {}), toolId: record.id, slot } }),
                      snapshot: () => this.telemetry.getSnapshot(),
                  })
                : null;
            const diagnosticsOwnerId = `${record.id}:${slot}`;
            const diagnosticsApi = this.diagnosticsCenter
                ? Object.freeze({
                      register: (definition) => this.diagnosticsCenter.registerProbe({ ...definition, ownerId: diagnosticsOwnerId }),
                      remove: (probeId) => this.diagnosticsCenter.removeProbe(probeId),
                      check: (options = {}) => this.diagnosticsCenter.check({ ...options, context: { ...(options.context ?? {}), toolId: record.id, slot } }),
                      diagnose: (options = {}) => this.diagnosticsCenter.diagnose({ ...options, context: { ...(options.context ?? {}), toolId: record.id, slot } }),
                  })
                : null;
            const auditApi = this.auditManager
                ? Object.freeze({
                      record: (input) => this.auditManager.record({ ...input, toolId: input.toolId ?? record.id }),
                      query: (filters = {}) => this.auditManager.query({ ...filters, toolId: filters.toolId ?? record.id }),
                      export: (filters = {}, exportOptions = {}) => this.auditManager.export({ ...filters, toolId: filters.toolId ?? record.id }, exportOptions),
                      trace: (traceId) => this.auditManager.query({ traceId, toolId: record.id }),
                  })
                : null;
            const securityApi = this.policyEngine
                ? Object.freeze({
                      authorize: (request) =>
                          this.policyEngine.authorize({
                              ...request,
                              toolId: request.toolId ?? record.id,
                          }),
                      require: (request) =>
                          this.policyEngine.require({
                              ...request,
                              toolId: request.toolId ?? record.id,
                          }),
                      can: (request) =>
                          this.policyEngine.can({
                              ...request,
                              toolId: request.toolId ?? record.id,
                          }),
                      explain: (request) =>
                          this.policyEngine.explain({
                              ...request,
                              toolId: request.toolId ?? record.id,
                          }),
                  })
                : null;
            const serviceScopeId = `${record.id}:${slot}`;
            const serviceScope = this.serviceContainer
                ? this.serviceContainer.createScope(serviceScopeId)
                : null;
            const serviceApi = Object.freeze({
                ...services,
                ...(serviceScope
                    ? {
                          scopeId: serviceScope.id,
                          resolve: (serviceId, serviceOptions = {}) =>
                              serviceScope.resolve(serviceId, {
                                  ...serviceOptions,
                                  context: {
                                      ...(serviceOptions.context ?? {}),
                                      toolId: record.id,
                                      slot,
                                  },
                              }),
                          has: (serviceId) => serviceScope.has(serviceId),
                      }
                    : {}),
            });
            const sandboxApi = sandboxSession
                ? Object.freeze({
                      session: sandboxSession,
                      require: (capability) =>
                          this.sandbox.requireCapability(
                              sandboxSession.id,
                              capability,
                          ),
                      registerResource: (resourceId, resource, dispose) =>
                          this.sandbox.registerResource(
                              sandboxSession.id,
                              resourceId,
                              resource,
                              dispose,
                          ),
                      releaseResource: (resourceId, releaseOptions = {}) =>
                          this.sandbox.releaseResource(
                              sandboxSession.id,
                              resourceId,
                              releaseOptions,
                          ),
                      on: (eventName, listener) =>
                          this.sandbox.on(
                              sandboxSession.id,
                              eventName,
                              listener,
                          ),
                      emit: (eventName, payload) =>
                          this.sandbox.emit(
                              sandboxSession.id,
                              eventName,
                              payload,
                          ),
                  })
                : null;
            const mountContext = this.createContext({
                toolId: record.id,
                slot,
                target,
                manifest: record.manifest,
                module: record.module,
                props: Object.freeze({
                    ...(options.props ?? {}),
                }),
                services: serviceApi,
                config: configApi,
                features: featureApi,
                security: securityApi,
                audit: auditApi,
                diagnostics: diagnosticsApi,
                telemetry: telemetryApi,
                sandbox: sandboxApi,
                state: stateApi,
                resources: resourceApi,
                capabilities: capabilityApi,
                events: eventApi,
                hooks: hookApi,
                locale: normalizeLocale(options.locale),
                direction: normalizeDirection(options.direction),
                signal: options.signal,
            });

            await invokeHook(this.hooks.beforeMount, {
                ...mountContext,
                runtime,
            });

            let mountResult;

            try {
                const execute = () => runtime.mount(mountContext);
                mountResult = this.monitor
                    ? await this.monitor.run(record.id, execute, {
                          phase: 'mount',
                          metadata: {
                              slot,
                          },
                      })
                    : await execute();
            } catch (error) {
                if (
                    error instanceof Error &&
                    error.code === 'TOOL_CIRCUIT_OPEN'
                ) {
                    throw error;
                }

                const runtimeError = createRuntimeError(
                    'TOOL_MOUNT_FAILED',
                    record.id,
                    slot,
                    `Tool "${record.id}" failed to mount.`,
                    error,
                );

                await this.notifyError(runtimeError, {
                    phase: 'mount',
                    context: mountContext,
                });
                throw runtimeError;
            }

            const cleanup = resolveCleanup(mountResult, record.id, slot);
            const instance = Object.freeze({
                id: `${record.id}:${slot}:${++this.sequence}`,
                toolId: record.id,
                slot,
                target,
                manifest: record.manifest,
                module: record.module,
                runtime,
                context: mountContext,
                cleanup,
                sandboxSessionId: sandboxSession?.id ?? null,
                capabilityTokenId: capabilityToken?.id ?? null,
                serviceScopeId,
                mountedAt: Date.now(),
            });

            this.instances.set(slot, instance);

            await invokeHook(this.hooks.afterMount, {
                ...mountContext,
                runtime,
                instance,
            });

            return instance;
        });
    }

    /**
     * Unmounts the current tool from a slot.
     *
     * @param {string} [slot='default']
     * @param {{reason?: string}} [options]
     * @returns {Promise<boolean>}
     */
    unmount(slot = DEFAULT_SLOT, options = {}) {
        const normalizedSlot = normalizeSlot(slot);

        return this.queue(normalizedSlot, () =>
            this.unmountInternal(normalizedSlot, options),
        );
    }

    /**
     * Re-mounts the current tool in a slot with new runtime options.
     *
     * @param {string} [slot='default']
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    async remount(slot = DEFAULT_SLOT, options = {}) {
        const normalizedSlot = normalizeSlot(slot);
        const current = this.instances.get(normalizedSlot);

        if (!current) {
            throw createRuntimeError(
                'TOOL_INSTANCE_NOT_FOUND',
                '',
                normalizedSlot,
                `No mounted tool exists in slot "${normalizedSlot}".`,
            );
        }

        return this.mount(current.toolId, current.target, {
            ...options,
            slot: normalizedSlot,
        });
    }

    /**
     * @param {string} [slot='default']
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getInstance(slot = DEFAULT_SLOT) {
        return this.instances.get(normalizeSlot(slot)) ?? null;
    }

    /**
     * @param {string} [slot='default']
     * @returns {boolean}
     */
    isMounted(slot = DEFAULT_SLOT) {
        return this.instances.has(normalizeSlot(slot));
    }

    /**
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getInstances() {
        return Object.freeze(
            [...this.instances.values()].sort((left, right) =>
                left.slot.localeCompare(right.slot),
            ),
        );
    }

    /**
     * Unmounts every active slot.
     *
     * @param {{reason?: string}} [options]
     * @returns {Promise<Readonly<Record<string, boolean>>>}
     */
    async unmountAll(options = {}) {
        const entries = await Promise.all(
            [...this.instances.keys()].map(async (slot) => [
                slot,
                await this.unmount(slot, options),
            ]),
        );

        return Object.freeze(Object.fromEntries(entries));
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    getSnapshot() {
        const instances = this.getInstances();

        return Object.freeze({
            mountedCount: instances.length,
            busySlots: Object.freeze([...this.operations.keys()].sort()),
            instances: Object.freeze(
                instances.map((instance) =>
                    Object.freeze({
                        id: instance.id,
                        toolId: instance.toolId,
                        slot: instance.slot,
                        mountedAt: instance.mountedAt,
                    }),
                ),
            ),
        });
    }

    /**
     * @private
     * @param {string} slot
     * @param {{reason?: string}} options
     * @returns {Promise<boolean>}
     */
    async unmountInternal(slot, options = {}) {
        const instance = this.instances.get(slot);

        if (!instance) {
            return false;
        }

        const context = Object.freeze({
            ...instance.context,
            instance,
            reason: normalizeReason(options.reason),
        });

        await invokeHook(this.hooks.beforeUnmount, context);

        try {
            const execute = async () => {
                if (
                    this.stateStore &&
                    typeof instance.runtime.captureState === 'function'
                ) {
                    const capturedState =
                        await instance.runtime.captureState(context);

                    if (capturedState !== undefined) {
                        await this.stateStore.save(
                            instance.toolId,
                            slot,
                            capturedState,
                            {
                                metadata: {
                                    reason: context.reason,
                                },
                            },
                        );
                    }
                }

                if (instance.cleanup) {
                    await instance.cleanup(context);
                }

                if (instance.runtime.unmount) {
                    await instance.runtime.unmount(context);
                }
            };

            if (this.monitor) {
                await this.monitor.run(instance.toolId, execute, {
                    phase: 'unmount',
                    metadata: {
                        slot,
                        reason: context.reason,
                    },
                });
            } else {
                await execute();
            }
        } catch (error) {
            if (
                error instanceof Error &&
                error.code === 'TOOL_CIRCUIT_OPEN'
            ) {
                throw error;
            }

            const runtimeError = createRuntimeError(
                'TOOL_UNMOUNT_FAILED',
                instance.toolId,
                slot,
                `Tool "${instance.toolId}" failed to unmount.`,
                error,
            );

            await this.notifyError(runtimeError, {
                phase: 'unmount',
                context,
            });
            throw runtimeError;
        } finally {
            if (instance.sandboxSessionId && this.sandbox) {
                await this.sandbox.closeSession(instance.sandboxSessionId, {
                    reason: context.reason,
                });
            }

            if (this.resourceManager) {
                await this.resourceManager.disposeOwner(
                    `${instance.toolId}:${slot}`,
                    { reason: context.reason },
                );
            }

            if (this.eventBus) {
                this.eventBus.unsubscribeOwner(
                    `${instance.toolId}:${slot}`,
                );
            }

            if (this.hookManager) {
                this.hookManager.removeOwner(
                    `${instance.toolId}:${slot}`,
                );
            }

            if (this.diagnosticsCenter) {
                this.diagnosticsCenter.removeOwner(
                    `${instance.toolId}:${slot}`,
                );
            }

            if (this.telemetry) {
                this.telemetry.removeOwner(`${instance.toolId}:${slot}`);
            }

            if (this.serviceContainer && instance.serviceScopeId) {
                await this.serviceContainer.disposeScope(
                    instance.serviceScopeId,
                );
            }

            if (instance.capabilityTokenId && this.capabilityManager) {
                this.capabilityManager.revoke(
                    instance.capabilityTokenId,
                    context.reason,
                );
            }

            this.instances.delete(slot);
        }

        await invokeHook(this.hooks.afterUnmount, context);
        return true;
    }

    /**
     * Serializes operations for one slot.
     *
     * @private
     * @template T
     * @param {string} slot
     * @param {() => Promise<T>|T} operation
     * @returns {Promise<T>}
     */
    queue(slot, operation) {
        const previous = this.operations.get(slot) ?? Promise.resolve();
        const next = previous
            .catch(() => undefined)
            .then(operation)
            .finally(() => {
                if (this.operations.get(slot) === next) {
                    this.operations.delete(slot);
                }
            });

        this.operations.set(slot, next);
        return next;
    }

    /**
     * @private
     * @param {Record<string, unknown>} input
     * @returns {Readonly<Record<string, unknown>>}
     */
    createContext(input) {
        const extension = this.contextFactory(
            Object.freeze({
                ...input,
            }),
        );

        if (
            extension === null ||
            typeof extension !== 'object' ||
            Array.isArray(extension)
        ) {
            throw new TypeError('Tool runtime contextFactory must return an object.');
        }

        return Object.freeze({
            ...input,
            ...extension,
        });
    }

    /**
     * @private
     * @param {ToolRuntimeError} error
     * @param {Record<string, unknown>} details
     * @returns {Promise<void>}
     */
    async notifyError(error, details) {
        await invokeHook(this.hooks.onError, {
            error,
            ...details,
        });
    }
}

/**
 * @param {Readonly<Record<string, unknown>>} record
 * @param {string} slot
 * @returns {Readonly<Record<string, Function|null>>}
 */
function resolveRuntime(record, slot) {
    const candidate = record.defaultExport ?? record.module;

    if (typeof candidate === 'function') {
        return Object.freeze({
            mount: candidate,
            unmount: null,
            captureState: null,
        });
    }

    if (!candidate || typeof candidate !== 'object') {
        throw createRuntimeError(
            'TOOL_RUNTIME_INVALID',
            record.id,
            slot,
            `Tool "${record.id}" does not expose a mountable runtime.`,
        );
    }

    const mount =
        typeof candidate.mount === 'function'
            ? candidate.mount.bind(candidate)
            : typeof candidate.render === 'function'
              ? candidate.render.bind(candidate)
              : null;

    if (!mount) {
        throw createRuntimeError(
            'TOOL_RUNTIME_INVALID',
            record.id,
            slot,
            `Tool "${record.id}" must expose mount(), render(), or a default function.`,
        );
    }

    return Object.freeze({
        mount,
        unmount:
            typeof candidate.unmount === 'function'
                ? candidate.unmount.bind(candidate)
                : typeof candidate.destroy === 'function'
                  ? candidate.destroy.bind(candidate)
                  : null,
        captureState:
            typeof candidate.captureState === 'function'
                ? candidate.captureState.bind(candidate)
                : null,
    });
}

/**
 * @param {unknown} value
 * @param {string} toolId
 * @param {string} slot
 * @returns {Function|null}
 */
function resolveCleanup(value, toolId, slot) {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value === 'function') {
        return value;
    }

    if (typeof value === 'object') {
        const cleanup =
            typeof value.cleanup === 'function'
                ? value.cleanup.bind(value)
                : typeof value.unmount === 'function'
                  ? value.unmount.bind(value)
                  : typeof value.destroy === 'function'
                    ? value.destroy.bind(value)
                    : null;

        if (cleanup) {
            return cleanup;
        }
    }

    throw createRuntimeError(
        'TOOL_CLEANUP_INVALID',
        toolId,
        slot,
        `Tool "${toolId}" returned an invalid cleanup value.`,
    );
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeSlot(value) {
    const slot = String(value ?? DEFAULT_SLOT).trim();

    if (!slot) {
        throw new TypeError('Tool runtime slot cannot be empty.');
    }

    return slot;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeLocale(value) {
    return String(value ?? 'ar').trim() || 'ar';
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeDirection(value) {
    const direction = String(value ?? 'rtl').trim().toLowerCase();

    if (!['ltr', 'rtl', 'auto'].includes(direction)) {
        throw new TypeError('Tool runtime direction must be ltr, rtl, or auto.');
    }

    return direction;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeReason(value) {
    return String(value ?? 'manual').trim() || 'manual';
}

/**
 * @param {unknown} value
 * @returns {(input: Readonly<Record<string, unknown>>) => Record<string, unknown>}
 */
function normalizeContextFactory(value) {
    if (value === undefined) {
        return () => ({});
    }

    if (typeof value !== 'function') {
        throw new TypeError('Tool runtime contextFactory must be a function.');
    }

    return value;
}

/**
 * @param {unknown} hooks
 * @returns {Readonly<Record<string, Function|null>>}
 */
function normalizeHooks(hooks) {
    const source = hooks ?? {};

    if (!source || typeof source !== 'object' || Array.isArray(source)) {
        throw new TypeError('Tool runtime hooks must be an object.');
    }

    return Object.freeze({
        beforeMount: normalizeHook(source.beforeMount, 'beforeMount'),
        afterMount: normalizeHook(source.afterMount, 'afterMount'),
        beforeUnmount: normalizeHook(source.beforeUnmount, 'beforeUnmount'),
        afterUnmount: normalizeHook(source.afterUnmount, 'afterUnmount'),
        onError: normalizeHook(source.onError, 'onError'),
    });
}

/**
 * @param {unknown} value
 * @param {string} name
 * @returns {Function|null}
 */
function normalizeHook(value, name) {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value !== 'function') {
        throw new TypeError(`Tool runtime hook "${name}" must be a function.`);
    }

    return value;
}

/**
 * @param {Function|null} hook
 * @param {Record<string, unknown>} context
 * @returns {Promise<void>}
 */
async function invokeHook(hook, context) {
    if (hook) {
        await hook(Object.freeze(context));
    }
}

/**
 * @param {string} code
 * @param {unknown} toolId
 * @param {string} slot
 * @param {string} message
 * @param {unknown} [cause]
 * @returns {ToolRuntimeError}
 */
function createRuntimeError(code, toolId, slot, message, cause) {
    return new ToolRuntimeError(message, {
        code,
        toolId: String(toolId ?? ''),
        slot,
        cause,
    });
}

export {
    ToolRuntimeError,
    ToolRuntimeHost,
};

// END OF FILE
