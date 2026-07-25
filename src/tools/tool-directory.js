/**
 * @file Unified tool directory service.
 * @module tools/tool-directory
 */

import {
    CategoryRegistry,
} from './category-registry.js';
import {
    ToolCatalogue,
} from './tool-catalogue.js';
import {
    RuntimeToolLoader,
} from './runtime-tool-loader.js';
import {
    ToolRegistry,
} from './tool-registry.js';
import {
    ToolSearchIndex,
} from './tool-search-index.js';
import {
    ToolRuntimeHost,
} from './tool-runtime-host.js';
import {
    ToolSandboxManager,
} from './tool-sandbox-manager.js';
import {
    ToolRuntimeMonitor,
} from './tool-runtime-monitor.js';
import {
    ToolDependencyGraph,
} from './tool-dependency-graph.js';
import {
    ToolRuntimeScheduler,
} from './tool-runtime-scheduler.js';
import {
    ToolRuntimeStateStore,
} from './tool-runtime-state-store.js';
import {
    ToolRuntimeTransactionManager,
} from './tool-runtime-transaction-manager.js';
import {
    ToolRuntimeResourceManager,
} from './tool-runtime-resource-manager.js';
import {
    ToolCapabilityManager,
} from './tool-capability-manager.js';
import {
    ToolRuntimeEventBus,
} from './tool-runtime-event-bus.js';
import {
    ToolRuntimeHookManager,
} from './tool-runtime-hook-manager.js';
import {
    ToolRuntimeExtensionRegistry,
} from './tool-runtime-extension-registry.js';
import {
    ToolRuntimeServiceContainer,
} from './tool-runtime-service-container.js';
import {
    ToolRuntimeConfigManager,
} from './tool-runtime-config-manager.js';
import {
    ToolRuntimeFeatureFlags,
} from './tool-runtime-feature-flags.js';
import {
    ToolRuntimePolicyEngine,
} from './tool-runtime-policy-engine.js';
import {
    ToolRuntimeAuditManager,
} from './tool-runtime-audit-manager.js';
import {
    ToolRuntimeDiagnosticsCenter,
} from './tool-runtime-diagnostics-center.js';
import {
    ToolRuntimeTelemetry,
} from './tool-runtime-telemetry.js';

/**
 * Coordinates tool registration, category registration, catalogue access,
 * search and diagnostics through one stable application-facing API.
 */
class ToolDirectory {
    /**
     * @param {{
     *   toolRegistry?: ToolRegistry,
     *   categoryRegistry?: CategoryRegistry,
     *   fallbackLocale?: string,
     *   loader?: Record<string, unknown>,
     *   runtime?: Record<string, unknown>,
     *   sandbox?: Record<string, unknown>|false,
     *   monitor?: Record<string, unknown>|false,
     *   scheduler?: Record<string, unknown>|false,
     *   state?: Record<string, unknown>|false,
     *   transactions?: Record<string, unknown>|false,
     *   resources?: Record<string, unknown>|false,
     *   capabilities?: Record<string, unknown>|false,
     *   events?: Record<string, unknown>|false,
     *   hooks?: Record<string, unknown>|false,
     *   extensions?: Record<string, unknown>|false,
     *   services?: Record<string, unknown>|false,
     *   config?: Record<string, unknown>|false,
     *   features?: Record<string, unknown>|false,
     *   policies?: Record<string, unknown>|false,
     *   audit?: Record<string, unknown>|false,
     *   diagnostics?: Record<string, unknown>|false
     * }} [options]
     */
    constructor(options = {}) {
        this.toolRegistry = options.toolRegistry ?? new ToolRegistry();
        this.categoryRegistry =
            options.categoryRegistry ?? new CategoryRegistry();
        this.catalogue = new ToolCatalogue({
            toolRegistry: this.toolRegistry,
            categoryRegistry: this.categoryRegistry,
        });
        this.searchIndex = new ToolSearchIndex({
            toolRegistry: this.toolRegistry,
            fallbackLocale: options.fallbackLocale ?? 'ar',
        });
        this.runtimeMonitor =
            options.monitor === false
                ? null
                : new ToolRuntimeMonitor(options.monitor ?? {});
        this.runtimeLoader = new RuntimeToolLoader({
            toolRegistry: this.toolRegistry,
            monitor: this.runtimeMonitor,
            ...(options.loader ?? {}),
        });
        this.sandboxManager =
            options.sandbox === false
                ? null
                : new ToolSandboxManager(options.sandbox ?? {});
        this.runtimeStateStore =
            options.state === false
                ? null
                : new ToolRuntimeStateStore(options.state ?? {});
        this.transactionManager =
            options.transactions === false
                ? null
                : new ToolRuntimeTransactionManager(
                      options.transactions ?? {},
                  );
        this.resourceManager =
            options.resources === false
                ? null
                : new ToolRuntimeResourceManager(
                      options.resources ?? {},
                  );
        this.capabilityManager =
            options.capabilities === false
                ? null
                : new ToolCapabilityManager(
                      options.capabilities ?? {},
                  );
        this.eventBus =
            options.events === false
                ? null
                : new ToolRuntimeEventBus(
                      options.events ?? {},
                  );
        this.hookManager =
            options.hooks === false
                ? null
                : new ToolRuntimeHookManager(
                      options.hooks ?? {},
                  );
        this.extensionRegistry =
            options.extensions === false
                ? null
                : new ToolRuntimeExtensionRegistry({
                      ...(options.extensions ?? {}),
                      hookManager: this.hookManager,
                  });
        this.serviceContainer =
            options.services === false
                ? null
                : new ToolRuntimeServiceContainer(
                      options.services ?? {},
                  );
        this.configManager =
            options.config === false
                ? null
                : new ToolRuntimeConfigManager(
                      options.config ?? {},
                  );
        this.featureFlags =
            options.features === false
                ? null
                : new ToolRuntimeFeatureFlags(
                      options.features ?? {},
                  );
        this.policyEngine =
            options.policies === false
                ? null
                : new ToolRuntimePolicyEngine(
                      options.policies ?? {},
                  );
        this.auditManager =
            options.audit === false
                ? null
                : new ToolRuntimeAuditManager(options.audit ?? {});
        this.diagnosticsCenter =
            options.diagnostics === false
                ? null
                : new ToolRuntimeDiagnosticsCenter(options.diagnostics ?? {});
        this.telemetry =
            options.telemetry === false
                ? null
                : new ToolRuntimeTelemetry(options.telemetry ?? {});
        this.registerDefaultDiagnosticSources();
        this.runtimeHost = new ToolRuntimeHost({
            loader: this.runtimeLoader,
            sandbox: this.sandboxManager,
            monitor: this.runtimeMonitor,
            stateStore: this.runtimeStateStore,
            resourceManager: this.resourceManager,
            capabilityManager: this.capabilityManager,
            eventBus: this.eventBus,
            hookManager: this.hookManager,
            serviceContainer: this.serviceContainer,
            configManager: this.configManager,
            featureFlags: this.featureFlags,
            policyEngine: this.policyEngine,
            auditManager: this.auditManager,
            diagnosticsCenter: this.diagnosticsCenter,
            telemetry: this.telemetry,
            ...(options.runtime ?? {}),
        });
        this.dependencyGraph = new ToolDependencyGraph();
        this.runtimeScheduler =
            options.scheduler === false
                ? null
                : new ToolRuntimeScheduler({
                      loader: this.runtimeLoader,
                      graph: this.dependencyGraph,
                      ...(options.scheduler ?? {}),
                  });
    }

    /**
     * Initializes categories and tools atomically after full preflight.
     *
     * @param {{
     *   categories?: Iterable<Record<string, unknown>>,
     *   tools?: Iterable<Record<string, unknown>>,
     *   modules?: Record<string, unknown>
     * }} [input]
     * @returns {Readonly<Record<string, unknown>>}
     */
    initialize(input = {}) {
        const categoryDefinitions = [...(input.categories ?? [])];
        const toolDefinitions = [
            ...(input.tools ?? []),
            ...extractToolDefinitions(input.modules ?? {}),
        ];

        this.preflight(categoryDefinitions, toolDefinitions);

        const categories = this.categoryRegistry.registerMany(
            categoryDefinitions,
        );
        const tools = this.toolRegistry.registerMany(toolDefinitions);

        this.dependencyGraph.clear();
        this.dependencyGraph.registerMany(
            toolDefinitions.map((definition) => ({
                id: definition.id,
                dependencies: definition.dependencies ?? [],
            })),
        );

        return Object.freeze({
            categories,
            tools,
            diagnostics: this.getDiagnostics(),
        });
    }

    /**
     * @param {Record<string, unknown>} definition
     * @returns {Readonly<Record<string, unknown>>}
     */
    registerTool(definition) {
        this.preflight([], [definition]);
        const tool = this.toolRegistry.register(definition);
        this.dependencyGraph.register(
            tool.id,
            definition.dependencies ?? [],
        );
        return tool;
    }

    /**
     * @param {Record<string, unknown>} definition
     * @returns {Readonly<Record<string, unknown>>}
     */
    registerCategory(definition) {
        this.preflight([definition], []);
        return this.categoryRegistry.register(definition);
    }

    /**
     * Mounts one registered tool into a runtime slot.
     *
     * @param {string} id
     * @param {unknown} target
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    mountTool(id, target, options = {}) {
        return this.runtimeHost.mount(id, target, options);
    }

    /**
     * Unmounts the current tool from a runtime slot.
     *
     * @param {string} [slot='default']
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<boolean>}
     */
    unmountTool(slot = 'default', options = {}) {
        return this.runtimeHost.unmount(slot, options);
    }

    /**
     * @param {string} [slot='default']
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getMountedTool(slot = 'default') {
        return this.runtimeHost.getInstance(slot);
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    getRuntimeSnapshot() {
        return this.runtimeHost.getSnapshot();
    }

    /**
     * @param {string} id
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getToolHealth(id) {
        return this.runtimeMonitor
            ? this.runtimeMonitor.getHealth(id)
            : null;
    }

    /**
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getHealthSnapshot() {
        return this.runtimeMonitor
            ? this.runtimeMonitor.getSnapshot()
            : null;
    }

    /**
     * @param {Record<string, unknown>} [filters]
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getRuntimeHistory(filters = {}) {
        return this.runtimeMonitor
            ? this.runtimeMonitor.getHistory(filters)
            : Object.freeze([]);
    }

    /**
     * @param {string} id
     * @returns {boolean}
     */
    resetToolHealth(id) {
        return this.runtimeMonitor
            ? this.runtimeMonitor.reset(id)
            : false;
    }

    /**
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getSandboxSnapshot() {
        return this.sandboxManager
            ? this.sandboxManager.getSnapshot()
            : null;
    }

    /**
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getSandboxTelemetry() {
        return this.sandboxManager
            ? this.sandboxManager.getTelemetry()
            : Object.freeze([]);
    }

    registerDiagnosticProbe(definition) {
        if (!this.diagnosticsCenter) throw new Error('Runtime diagnostics are disabled.');
        return this.diagnosticsCenter.registerProbe(definition);
    }

    removeDiagnosticProbe(probeId) {
        return this.diagnosticsCenter ? this.diagnosticsCenter.removeProbe(probeId) : false;
    }

    checkRuntimeHealth(options = {}) {
        return this.diagnosticsCenter
            ? this.diagnosticsCenter.check({ ...options, context: { directory: this, ...(options.context ?? {}) } })
            : Promise.resolve(null);
    }

    diagnoseRuntime(options = {}) {
        return this.diagnosticsCenter
            ? this.diagnosticsCenter.diagnose({ ...options, context: { directory: this, ...(options.context ?? {}) } })
            : Promise.resolve(null);
    }

    getDiagnosticsSnapshot() {
        return this.diagnosticsCenter ? this.diagnosticsCenter.getSnapshot() : null;
    }

    getDiagnosticsHistory() {
        return this.diagnosticsCenter ? this.diagnosticsCenter.getHistory() : Object.freeze([]);
    }

    clearDiagnosticsHistory() {
        return this.diagnosticsCenter ? this.diagnosticsCenter.clearHistory() : 0;
    }

    registerDefaultDiagnosticSources() {
        if (!this.diagnosticsCenter) return;
        const sources = {
            directory: () => this.getDiagnostics(),
            runtimeHost: () => this.runtimeHost ? this.runtimeHost.getSnapshot() : null,
            loader: () => this.runtimeLoader.getSnapshot(),
            monitor: () => this.runtimeMonitor ? this.runtimeMonitor.getSnapshot() : null,
            scheduler: () => this.runtimeScheduler ? this.runtimeScheduler.getSnapshot() : null,
            resources: () => this.resourceManager ? this.resourceManager.getSnapshot() : null,
            capabilities: () => this.capabilityManager ? this.capabilityManager.getSnapshot() : null,
            events: () => this.eventBus ? this.eventBus.getSnapshot() : null,
            hooks: () => this.hookManager ? this.hookManager.getSnapshot() : null,
            services: () => this.serviceContainer ? this.serviceContainer.getSnapshot() : null,
            config: () => this.configManager ? this.configManager.getSnapshot() : null,
            features: () => this.featureFlags ? this.featureFlags.getSnapshot() : null,
            policies: () => this.policyEngine ? this.policyEngine.getSnapshot() : null,
            audit: () => this.auditManager ? this.auditManager.getSnapshot() : null,
            telemetry: () => this.telemetry ? this.telemetry.getSnapshot() : null,
        };
        for (const [id, snapshot] of Object.entries(sources)) {
            this.diagnosticsCenter.registerSource(id, snapshot);
        }
    }

    registerMetric(definition) {
        if (!this.telemetry) throw new Error('Runtime telemetry is disabled.');
        return this.telemetry.registerMetric(definition);
    }

    recordMetric(name, value = 1, options = {}) {
        if (!this.telemetry) throw new Error('Runtime telemetry is disabled.');
        return this.telemetry.record(name, value, options);
    }

    startTrace(input = {}) {
        if (!this.telemetry) throw new Error('Runtime telemetry is disabled.');
        return this.telemetry.startTrace(input);
    }

    finishTrace(traceId, spanId, options = {}) {
        if (!this.telemetry) throw new Error('Runtime telemetry is disabled.');
        return this.telemetry.finishTrace(traceId, spanId, options);
    }

    getTelemetrySnapshot() { return this.telemetry ? this.telemetry.getSnapshot() : null; }
    getTelemetryHistory() { return this.telemetry ? this.telemetry.getHistory() : Object.freeze([]); }
    clearTelemetryHistory() { return this.telemetry ? this.telemetry.clearHistory() : 0; }

    recordAudit(input) {
        if (!this.auditManager) throw new Error('Runtime audit is disabled.');
        return this.auditManager.record(input);
    }

    queryAudit(filters = {}) { return this.auditManager ? this.auditManager.query(filters) : Object.freeze([]); }
    exportAudit(filters = {}, options = {}) { return this.auditManager ? this.auditManager.export(filters, options) : '[]'; }
    validateAuditIntegrity() { return this.auditManager ? this.auditManager.validateIntegrity() : Object.freeze({ valid: true, recordId: '' }); }
    getAuditSnapshot() { return this.auditManager ? this.auditManager.getSnapshot() : null; }
    getAuditHistory() { return this.auditManager ? this.auditManager.getHistory() : Object.freeze([]); }
    clearAuditHistory() { return this.auditManager ? this.auditManager.clearHistory() : 0; }

    registerPolicy(definition, options = {}) {
        if (!this.policyEngine) throw new Error('Runtime security policies are disabled.');
        return this.policyEngine.register(definition, options);
    }

    removePolicy(policyId) {
        return this.policyEngine ? this.policyEngine.remove(policyId) : false;
    }

    authorize(request) {
        if (!this.policyEngine) return Promise.resolve(Object.freeze({ allowed: true, effect: 'allow', reason: 'Policy engine disabled.' }));
        return this.policyEngine.authorize(request);
    }

    requireAuthorization(request) {
        if (!this.policyEngine) return Promise.resolve(Object.freeze({ allowed: true, effect: 'allow', reason: 'Policy engine disabled.' }));
        return this.policyEngine.require(request);
    }

    can(request) {
        return this.policyEngine ? this.policyEngine.can(request) : Promise.resolve(true);
    }

    getPolicySnapshot() { return this.policyEngine ? this.policyEngine.getSnapshot() : null; }
    getPolicyHistory() { return this.policyEngine ? this.policyEngine.getHistory() : Object.freeze([]); }
    clearPolicyHistory() { return this.policyEngine ? this.policyEngine.clearHistory() : 0; }

    setConfig(path, value, options = {}) {
        if (!this.configManager) throw new Error('Runtime configuration is disabled.');
        return this.configManager.set(path, value, options);
    }

    getConfig(path, options = {}) {
        return this.configManager
            ? this.configManager.get(path, options)
            : options.fallback;
    }

    hasConfig(path, options = {}) {
        return this.configManager
            ? this.configManager.has(path, options)
            : false;
    }

    removeConfig(path, options = {}) {
        return this.configManager
            ? this.configManager.remove(path, options)
            : false;
    }

    registerConfigSchema(schemaId, schema, options = {}) {
        if (!this.configManager) throw new Error('Runtime configuration is disabled.');
        return this.configManager.registerSchema(schemaId, schema, options);
    }

    getConfigSnapshot(toolId = '') {
        return this.configManager
            ? this.configManager.snapshot(toolId)
            : null;
    }

    getConfigHistory() {
        return this.configManager
            ? this.configManager.getHistory()
            : Object.freeze([]);
    }

    clearConfigHistory() {
        return this.configManager
            ? this.configManager.clearHistory()
            : 0;
    }

    registerFeatureFlag(definition, options = {}) {
        if (!this.featureFlags) throw new Error('Runtime feature flags are disabled.');
        return this.featureFlags.register(definition, options);
    }

    evaluateFeatureFlag(flagId, context = {}, options = {}) {
        if (!this.featureFlags) return options.fallback;
        return this.featureFlags.evaluate(flagId, context, options);
    }

    isFeatureEnabled(flagId, context = {}, options = {}) {
        return this.featureFlags
            ? this.featureFlags.isEnabled(flagId, context, options)
            : options.fallback ?? false;
    }

    overrideFeatureFlag(flagId, value, options = {}) {
        if (!this.featureFlags) throw new Error('Runtime feature flags are disabled.');
        return this.featureFlags.override(flagId, value, options);
    }

    removeFeatureFlagOverride(flagId, options = {}) {
        return this.featureFlags
            ? this.featureFlags.removeOverride(flagId, options)
            : false;
    }

    getFeatureFlagSnapshot() {
        return this.featureFlags
            ? this.featureFlags.getSnapshot()
            : null;
    }

    getFeatureFlagHistory() {
        return this.featureFlags
            ? this.featureFlags.getHistory()
            : Object.freeze([]);
    }

    clearFeatureFlagHistory() {
        return this.featureFlags
            ? this.featureFlags.clearHistory()
            : 0;
    }

    registerService(definition, options = {}) {
        if (!this.serviceContainer) throw new Error('Runtime services are disabled.');
        return this.serviceContainer.register(definition, options);
    }

    resolveService(serviceId, options = {}) {
        if (!this.serviceContainer) return Promise.reject(new Error('Runtime services are disabled.'));
        return this.serviceContainer.resolve(serviceId, options);
    }

    removeService(serviceId, options = {}) {
        return this.serviceContainer ? this.serviceContainer.remove(serviceId, options) : false;
    }

    disposeService(serviceId) {
        return this.serviceContainer ? this.serviceContainer.disposeService(serviceId) : Promise.resolve(false);
    }

    createServiceScope(scopeId = '') {
        if (!this.serviceContainer) throw new Error('Runtime services are disabled.');
        return this.serviceContainer.createScope(scopeId);
    }

    disposeServiceScope(scopeId) {
        return this.serviceContainer ? this.serviceContainer.disposeScope(scopeId) : Promise.resolve(0);
    }

    getServiceSnapshot() { return this.serviceContainer ? this.serviceContainer.getSnapshot() : null; }
    getServiceGraph() { return this.serviceContainer ? this.serviceContainer.getGraph() : Object.freeze({}); }
    getServiceHistory() { return this.serviceContainer ? this.serviceContainer.getHistory() : Object.freeze([]); }
    clearServiceHistory() { return this.serviceContainer ? this.serviceContainer.clearHistory() : 0; }

    registerHook(hookName, phase, handler, options = {}) {
        if (!this.hookManager) {
            throw new Error('Runtime hooks are disabled.');
        }

        return this.hookManager.register(
            hookName,
            phase,
            handler,
            options,
        );
    }

    removeHook(hookId) {
        return this.hookManager
            ? this.hookManager.remove(hookId)
            : false;
    }

    executeHook(hookName, context = {}, operation = async () => undefined) {
        if (!this.hookManager) {
            return Promise.resolve().then(operation);
        }

        return this.hookManager.execute(
            hookName,
            context,
            operation,
        );
    }

    getHookSnapshot() {
        return this.hookManager
            ? this.hookManager.getSnapshot()
            : null;
    }

    getHookHistory() {
        return this.hookManager
            ? this.hookManager.getHistory()
            : Object.freeze([]);
    }

    clearHookHistory() {
        return this.hookManager
            ? this.hookManager.clearHistory()
            : 0;
    }

    registerExtension(definition) {
        if (!this.extensionRegistry) {
            throw new Error('Runtime extensions are disabled.');
        }

        return this.extensionRegistry.register(definition);
    }

    removeExtension(extensionId) {
        return this.extensionRegistry
            ? this.extensionRegistry.remove(extensionId)
            : false;
    }

    discoverExtensions() {
        return this.extensionRegistry
            ? this.extensionRegistry.discover()
            : Object.freeze([]);
    }

    startExtensions(context = {}) {
        return this.extensionRegistry
            ? this.extensionRegistry.startAll({
                  directory: this,
                  ...context,
              })
            : Promise.resolve(Object.freeze([]));
    }

    stopExtensions(context = {}) {
        return this.extensionRegistry
            ? this.extensionRegistry.stopAll({
                  directory: this,
                  ...context,
              })
            : Promise.resolve(Object.freeze([]));
    }

    getExtensionSnapshot() {
        return this.extensionRegistry
            ? this.extensionRegistry.getSnapshot()
            : null;
    }

    publishEvent(eventName, payload, options = {}) {
        if (!this.eventBus) {
            return Promise.reject(
                new Error('Runtime events are disabled.'),
            );
        }

        return this.eventBus.publish(eventName, payload, options);
    }

    publishEventAsync(eventName, payload, options = {}) {
        return this.publishEvent(eventName, payload, options);
    }

    deferEvent(eventName, payload, options = {}) {
        if (!this.eventBus) {
            throw new Error('Runtime events are disabled.');
        }

        return this.eventBus.defer(eventName, payload, options);
    }

    subscribeEvent(eventName, listener, options = {}) {
        if (!this.eventBus) {
            throw new Error('Runtime events are disabled.');
        }

        return this.eventBus.subscribe(
            eventName,
            listener,
            options,
        );
    }

    onceEvent(eventName, listener, options = {}) {
        if (!this.eventBus) {
            throw new Error('Runtime events are disabled.');
        }

        return this.eventBus.once(
            eventName,
            listener,
            options,
        );
    }

    unsubscribeEvent(listenerId) {
        return this.eventBus
            ? this.eventBus.unsubscribe(listenerId)
            : false;
    }

    requestEvent(eventName, payload, options = {}) {
        if (!this.eventBus) {
            return Promise.reject(
                new Error('Runtime events are disabled.'),
            );
        }

        return this.eventBus.request(
            eventName,
            payload,
            options,
        );
    }

    useEventMiddleware(middleware, options = {}) {
        if (!this.eventBus) {
            throw new Error('Runtime events are disabled.');
        }

        return this.eventBus.use(middleware, options);
    }

    getEventSnapshot() {
        return this.eventBus
            ? this.eventBus.getSnapshot()
            : null;
    }

    getEventHistory() {
        return this.eventBus
            ? this.eventBus.getHistory()
            : Object.freeze([]);
    }

    clearEventHistory() {
        return this.eventBus
            ? this.eventBus.clearHistory()
            : 0;
    }

    getEventDeadLetters() {
        return this.eventBus
            ? this.eventBus.getDeadLetters()
            : Object.freeze([]);
    }

    clearEventDeadLetters() {
        return this.eventBus
            ? this.eventBus.clearDeadLetters()
            : 0;
    }

    registerCapability(definition) {
        if (!this.capabilityManager) {
            throw new Error('Runtime capabilities are disabled.');
        }
        return this.capabilityManager.register(definition);
    }

    negotiateCapabilities(request = {}) {
        if (!this.capabilityManager) {
            throw new Error('Runtime capabilities are disabled.');
        }
        return this.capabilityManager.negotiate(request);
    }

    revokeCapabilityToken(tokenId, reason = 'manual') {
        return this.capabilityManager
            ? this.capabilityManager.revoke(tokenId, reason)
            : false;
    }

    discoverCapabilities() {
        return this.capabilityManager
            ? this.capabilityManager.discover()
            : null;
    }

    getCapabilitySnapshot() {
        return this.capabilityManager
            ? this.capabilityManager.getSnapshot()
            : null;
    }

    getCapabilityAuditLog() {
        return this.capabilityManager
            ? this.capabilityManager.getAuditLog()
            : Object.freeze([]);
    }

    registerResource(definition) {
        if (!this.resourceManager) {
            throw new Error('Runtime resource management is disabled.');
        }
        return this.resourceManager.register(definition);
    }

    releaseResource(resourceId, options = {}) {
        return this.resourceManager
            ? this.resourceManager.release(resourceId, options)
            : Promise.resolve(null);
    }

    disposeOwnerResources(ownerId, options = {}) {
        return this.resourceManager
            ? this.resourceManager.disposeOwner(ownerId, options)
            : Promise.resolve(null);
    }

    cleanupIdleResources(options = {}) {
        return this.resourceManager
            ? this.resourceManager.cleanupIdle(options)
            : Promise.resolve(null);
    }

    detectResourceLeaks(options = {}) {
        return this.resourceManager
            ? this.resourceManager.detectLeaks(options)
            : null;
    }

    getResourceSnapshot() {
        return this.resourceManager
            ? this.resourceManager.getSnapshot()
            : null;
    }

    getResourceHistory() {
        return this.resourceManager
            ? this.resourceManager.getHistory()
            : Object.freeze([]);
    }

    /**
     * Runs an atomic runtime transaction.
     *
     * @template T
     * @param {Record<string, unknown>} options
     * @param {(transaction: Readonly<Record<string, unknown>>) => Promise<T>|T} callback
     * @returns {Promise<T>}
     */
    runTransaction(options, callback) {
        if (!this.transactionManager) {
            return Promise.reject(
                new Error('Runtime transactions are disabled.'),
            );
        }

        return this.transactionManager.run(options, callback);
    }

    /**
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getTransactionSnapshot() {
        return this.transactionManager
            ? this.transactionManager.getSnapshot()
            : null;
    }

    /**
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getTransactionHistory() {
        return this.transactionManager
            ? this.transactionManager.getHistory()
            : Object.freeze([]);
    }

    /**
     * Saves runtime state for a tool slot.
     *
     * @param {string} id
     * @param {string} slot
     * @param {unknown} state
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>|null>}
     */
    saveToolState(id, slot, state, options = {}) {
        return this.runtimeStateStore
            ? this.runtimeStateStore.save(id, slot, state, options)
            : Promise.resolve(null);
    }

    /**
     * Loads runtime state for a tool slot.
     *
     * @param {string} id
     * @param {string} [slot]
     * @returns {Promise<Readonly<Record<string, unknown>>|null>}
     */
    loadToolState(id, slot = 'default') {
        return this.runtimeStateStore
            ? this.runtimeStateStore.load(id, slot)
            : Promise.resolve(null);
    }

    /**
     * Removes runtime state for a tool slot.
     *
     * @param {string} id
     * @param {string} [slot]
     * @returns {Promise<boolean>}
     */
    clearToolState(id, slot = 'default') {
        return this.runtimeStateStore
            ? this.runtimeStateStore.remove(id, slot)
            : Promise.resolve(false);
    }

    /**
     * Exports all persisted runtime state.
     *
     * @returns {Promise<Readonly<Record<string, unknown>>|null>}
     */
    exportToolState() {
        return this.runtimeStateStore
            ? this.runtimeStateStore.exportSnapshot()
            : Promise.resolve(null);
    }

    /**
     * Imports a runtime state snapshot.
     *
     * @param {Readonly<Record<string, unknown>>} snapshot
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>|null>}
     */
    importToolState(snapshot, options = {}) {
        return this.runtimeStateStore
            ? this.runtimeStateStore.importSnapshot(snapshot, options)
            : Promise.resolve(null);
    }

    /**
     * @returns {Promise<Readonly<Record<string, unknown>>|null>}
     */
    getStateSnapshot() {
        return this.runtimeStateStore
            ? this.runtimeStateStore.getSnapshot()
            : Promise.resolve(null);
    }

    /**
     * Resolves the complete dependency order for one or more tools.
     *
     * @param {string|Iterable<string>} ids
     * @returns {ReadonlyArray<string>}
     */
    resolveToolDependencies(ids) {
        return this.dependencyGraph.resolve(ids);
    }

    /**
     * Loads a tool and all dependencies through the runtime scheduler.
     *
     * @param {string} id
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    scheduleTool(id, options = {}) {
        if (!this.runtimeScheduler) {
            return Promise.reject(
                new Error('Runtime scheduler is disabled.'),
            );
        }

        return this.runtimeScheduler.schedule(id, options);
    }

    /**
     * Preloads multiple tools and dependencies.
     *
     * @param {Iterable<string>} ids
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    warmupTools(ids, options = {}) {
        if (!this.runtimeScheduler) {
            return Promise.reject(
                new Error('Runtime scheduler is disabled.'),
            );
        }

        return this.runtimeScheduler.warmup(ids, options);
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    getDependencySnapshot() {
        return this.dependencyGraph.getSnapshot();
    }

    /**
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getSchedulerSnapshot() {
        return this.runtimeScheduler
            ? this.runtimeScheduler.getSnapshot()
            : null;
    }

    /**
     * Loads one registered tool module at runtime.
     *
     * @param {string} id
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    loadTool(id, options = {}) {
        return this.runtimeLoader.load(id, options);
    }

    /**
     * Preloads a collection of registered tool modules.
     *
     * @param {Iterable<string>} ids
     * @param {Record<string, unknown>} [options]
     * @returns {Promise<Readonly<Record<string, unknown>>>}
     */
    preloadTools(ids, options = {}) {
        return this.runtimeLoader.preload(ids, options);
    }

    /**
     * Removes one module from the runtime cache.
     *
     * @param {string} id
     * @returns {boolean}
     */
    invalidateTool(id) {
        return this.runtimeLoader.invalidate(id);
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    getLoaderSnapshot() {
        return this.runtimeLoader.getSnapshot();
    }

    /**
     * @param {string} query
     * @param {Record<string, unknown>} [options]
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    search(query = '', options = {}) {
        return this.searchIndex.search(query, options);
    }

    /**
     * @param {string} query
     * @param {Record<string, unknown>} [options]
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    findTools(query = '', options = {}) {
        return this.searchIndex.findTools(query, options);
    }

    /**
     * @param {string} query
     * @param {Record<string, unknown>} [options]
     * @returns {ReadonlyArray<string>}
     */
    suggest(query = '', options = {}) {
        return this.searchIndex.suggest(query, options);
    }

    /**
     * @param {Record<string, unknown>} [options]
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getCatalogue(options = {}) {
        return this.catalogue.getCatalogue(options);
    }

    /**
     * @param {string} locale
     * @returns {ReadonlyArray<Readonly<Record<string, unknown>>>}
     */
    getNavigation(locale = 'ar') {
        return this.catalogue.getNavigation(locale);
    }

    /**
     * @param {string} id
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getTool(id) {
        return this.toolRegistry.get(id);
    }

    /**
     * @param {string} id
     * @returns {Readonly<Record<string, unknown>>|null}
     */
    getCategory(id) {
        return this.catalogue.getCategory(id);
    }

    /**
     * Returns a serializable, immutable state snapshot.
     *
     * @returns {Readonly<Record<string, unknown>>}
     */
    getSnapshot() {
        return Object.freeze({
            toolCount: this.toolRegistry.count(),
            categoryCount: this.categoryRegistry.count(),
            toolRevision: this.toolRegistry.getRevision(),
            categoryRevision: this.categoryRegistry.getRevision(),
            tools: this.toolRegistry.getSorted(),
            categories: this.categoryRegistry.getAll({
                includeHidden: true,
            }),
        });
    }

    /**
     * @returns {Readonly<Record<string, unknown>>}
     */
    getDiagnostics() {
        const orphanTools = this.catalogue.getOrphanTools();
        const emptyCategories = this.catalogue
            .getCatalogue({
                includeEmpty: true,
                includeHidden: true,
            })
            .filter((category) => category.toolCount === 0);

        return Object.freeze({
            valid: orphanTools.length === 0,
            orphanTools,
            emptyCategories: Object.freeze(emptyCategories),
            toolCount: this.toolRegistry.count(),
            categoryCount: this.categoryRegistry.count(),
        });
    }

    /**
     * Unmounts all tools and clears the complete directory.
     *
     * @returns {Promise<void>}
     */
    async clearAsync() {
        await this.runtimeHost.unmountAll({
            reason: 'directory-clear',
        });
        if (this.resourceManager) {
            await this.resourceManager.close();
        }
        if (this.extensionRegistry) {
            await this.extensionRegistry.disposeAll({
                directory: this,
            });
            this.extensionRegistry.clear();
        }
        if (this.serviceContainer) {
            await this.serviceContainer.disposeAll();
            this.serviceContainer.clear();
        }
        if (this.configManager) {
            this.configManager.clear();
        }
        if (this.featureFlags) {
            this.featureFlags.clear();
        }
        if (this.policyEngine) {
            this.policyEngine.clear();
        }
        if (this.auditManager) {
            this.auditManager.clear();
        }
        if (this.diagnosticsCenter) {
            this.diagnosticsCenter.clear();
        }
        if (this.telemetry) {
            this.telemetry.clear();
        }
        if (this.hookManager) {
            this.hookManager.clear();
        }
        if (this.eventBus) {
            this.eventBus.clear();
        }
        this.clear();
    }

    /**
     * Removes all directory data and search documents.
     *
     * @returns {void}
     */
    clear() {
        if (this.runtimeHost.getSnapshot().mountedCount > 0) {
            throw new Error(
                'Cannot clear ToolDirectory while tools are mounted. Use clearAsync().',
            );
        }

        this.toolRegistry.clear();
        this.dependencyGraph.clear();
        this.categoryRegistry.clear();
        this.searchIndex.clear();
        this.runtimeLoader.clear();
    }

    /**
     * Validates a batch without mutating live registries.
     *
     * @private
     * @param {Array<Record<string, unknown>>} categories
     * @param {Array<Record<string, unknown>>} tools
     * @returns {void}
     */
    preflight(categories, tools) {
        const categoryProbe = new CategoryRegistry();
        const toolProbe = new ToolRegistry();

        categoryProbe.registerMany(categories);
        toolProbe.registerMany(tools);

        for (const category of categories) {
            if (this.categoryRegistry.has(category.id)) {
                throw new Error(
                    `Category "${category.id}" is already registered.`,
                );
            }
        }

        for (const tool of tools) {
            if (this.toolRegistry.has(tool.id)) {
                throw new Error(`Tool "${tool.id}" is already registered.`);
            }
        }
    }
}

/**
 * Extracts manifest definitions from a Vite-compatible module map.
 *
 * @param {Record<string, unknown>} modules
 * @returns {Array<Record<string, unknown>>}
 */
function extractToolDefinitions(modules) {
    if (!modules || typeof modules !== 'object' || Array.isArray(modules)) {
        throw new TypeError('Tool discovery modules must be an object map.');
    }

    return Object.entries(modules)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([path, moduleValue]) => {
            const definition =
                moduleValue?.default ??
                moduleValue?.manifest ??
                moduleValue;

            if (
                !definition ||
                typeof definition !== 'object' ||
                Array.isArray(definition)
            ) {
                throw new TypeError(
                    `Tool manifest module "${path}" exported no manifest.`,
                );
            }

            return definition;
        });
}

/**
 * Creates an isolated directory instance.
 *
 * @param {ConstructorParameters<typeof ToolDirectory>[0]} [options]
 * @returns {ToolDirectory}
 */
function createToolDirectory(options = {}) {
    return new ToolDirectory(options);
}

export {
    ToolDirectory,
    createToolDirectory,
    extractToolDefinitions,
};

// END OF FILE
