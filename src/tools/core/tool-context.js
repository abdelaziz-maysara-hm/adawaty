/**
 * @file Tool execution context.
 * @module tools/core/tool-context
 */

/**
 * Default immutable environment values.
 *
 * @type {Readonly<Record<string, unknown>>}
 */
const DEFAULT_ENVIRONMENT = Object.freeze({
    mode: 'production',
    baseUrl: '/',
    isBrowser: typeof window !== 'undefined',
    isDevelopment: false,
    isProduction: true,
});

/**
 * Returns whether a value is a plain object.
 *
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
    if (value === null || typeof value !== 'object') {
        return false;
    }

    const prototype = Object.getPrototypeOf(value);

    return prototype === Object.prototype || prototype === null;
}

/**
 * Creates a defensive deep clone of supported context values.
 *
 * Functions, DOM nodes, class instances and service objects are intentionally
 * retained by reference. Plain objects, arrays, maps, sets and dates are cloned.
 *
 * @template T
 * @param {T} value
 * @param {WeakMap<object, unknown>} [seen]
 * @returns {T}
 */
function cloneValue(value, seen = new WeakMap()) {
    if (
        value === null
        || typeof value !== 'object'
        || typeof value === 'function'
    ) {
        return value;
    }

    if (seen.has(value)) {
        return /** @type {T} */ (seen.get(value));
    }

    if (value instanceof Date) {
        return /** @type {T} */ (new Date(value.getTime()));
    }

    if (value instanceof Map) {
        const output = new Map();
        seen.set(value, output);

        for (const [key, entry] of value.entries()) {
            output.set(cloneValue(key, seen), cloneValue(entry, seen));
        }

        return /** @type {T} */ (output);
    }

    if (value instanceof Set) {
        const output = new Set();
        seen.set(value, output);

        for (const entry of value.values()) {
            output.add(cloneValue(entry, seen));
        }

        return /** @type {T} */ (output);
    }

    if (Array.isArray(value)) {
        const output = [];
        seen.set(value, output);

        for (const entry of value) {
            output.push(cloneValue(entry, seen));
        }

        return /** @type {T} */ (output);
    }

    if (isPlainObject(value)) {
        const output = Object.create(Object.getPrototypeOf(value));
        seen.set(value, output);

        for (const key of Reflect.ownKeys(value)) {
            const descriptor = Object.getOwnPropertyDescriptor(value, key);

            if (!descriptor) {
                continue;
            }

            if ('value' in descriptor) {
                descriptor.value = cloneValue(descriptor.value, seen);
            }

            Object.defineProperty(output, key, descriptor);
        }

        return /** @type {T} */ (output);
    }

    return value;
}

/**
 * Deeply merges plain objects without mutating the inputs.
 *
 * Arrays and non-plain objects are replaced rather than concatenated.
 *
 * @param {Record<string, unknown>} target
 * @param {Record<string, unknown>} source
 * @returns {Record<string, unknown>}
 */
function deepMerge(target, source) {
    const output = cloneValue(target);

    for (const [key, sourceValue] of Object.entries(source)) {
        const targetValue = output[key];

        if (isPlainObject(targetValue) && isPlainObject(sourceValue)) {
            output[key] = deepMerge(targetValue, sourceValue);
            continue;
        }

        output[key] = cloneValue(sourceValue);
    }

    return output;
}

/**
 * Normalizes and validates a context identifier.
 *
 * @param {unknown} value
 * @returns {string}
 */
function normalizeId(value) {
    if (typeof value !== 'string') {
        throw new TypeError('ToolContext id must be a string.');
    }

    const id = value.trim();

    if (id.length === 0) {
        throw new TypeError('ToolContext id cannot be empty.');
    }

    return id;
}

/**
 * Normalizes a language code.
 *
 * @param {unknown} value
 * @returns {string}
 */
function normalizeLanguage(value) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return 'en';
    }

    return value.trim().toLowerCase();
}

/**
 * Resolves text direction from a language code.
 *
 * @param {string} language
 * @returns {'rtl' | 'ltr'}
 */
function resolveDirection(language) {
    const primaryLanguage = language.split('-')[0];
    const rtlLanguages = new Set([
        'ar',
        'dv',
        'fa',
        'ha',
        'he',
        'ku',
        'ps',
        'ur',
        'yi',
    ]);

    return rtlLanguages.has(primaryLanguage) ? 'rtl' : 'ltr';
}

/**
 * @typedef {Object} ToolContextOptions
 * @property {string} [id]
 * @property {string} [language]
 * @property {'rtl' | 'ltr'} [direction]
 * @property {Record<string, unknown>} [config]
 * @property {Record<string, unknown>} [metadata]
 * @property {Record<string, unknown>} [services]
 * @property {Record<string, unknown>} [state]
 * @property {Record<string, unknown>} [environment]
 * @property {Record<string, unknown>} [runtime]
 */

/**
 * Runtime context supplied to every tool instance.
 *
 * The class keeps mutable state private, exposes defensive snapshots and
 * deliberately retains service objects by reference.
 */
class ToolContext {
    /** @type {Map<string, ToolContext>} */
    static #registry = new Map();

    /** @type {ToolContextOptions} */
    static #defaults = Object.freeze({
        language: 'en',
        direction: 'ltr',
        config: {},
        metadata: {},
        services: {},
        state: {},
        environment: DEFAULT_ENVIRONMENT,
        runtime: {},
    });

    /** @type {string} */
    #id;

    /** @type {string} */
    #language;

    /** @type {'rtl' | 'ltr'} */
    #direction;

    /** @type {Record<string, unknown>} */
    #config;

    /** @type {Record<string, unknown>} */
    #metadata;

    /** @type {Record<string, unknown>} */
    #services;

    /** @type {Record<string, unknown>} */
    #state;

    /** @type {Record<string, unknown>} */
    #environment;

    /** @type {Record<string, unknown>} */
    #runtime;

    /** @type {boolean} */
    #disposed = false;

    /**
     * @param {ToolContextOptions} [options]
     */
    constructor(options = {}) {
        if (!isPlainObject(options)) {
            throw new TypeError('ToolContext options must be a plain object.');
        }

        const defaults = ToolContext.#defaults;
        const language = normalizeLanguage(options.language ?? defaults.language);
        const direction = options.direction ?? resolveDirection(language);

        if (direction !== 'rtl' && direction !== 'ltr') {
            throw new TypeError('ToolContext direction must be "rtl" or "ltr".');
        }

        this.#id = normalizeId(
            options.id
            ?? `tool-context-${cryptoRandomId()}`,
        );
        this.#language = language;
        this.#direction = direction;
        this.#config = deepMerge(
            /** @type {Record<string, unknown>} */ (defaults.config ?? {}),
            options.config ?? {},
        );
        this.#metadata = deepMerge(
            /** @type {Record<string, unknown>} */ (defaults.metadata ?? {}),
            options.metadata ?? {},
        );
        this.#services = {
            .../** @type {Record<string, unknown>} */ (defaults.services ?? {}),
            ...(options.services ?? {}),
        };
        this.#state = deepMerge(
            /** @type {Record<string, unknown>} */ (defaults.state ?? {}),
            options.state ?? {},
        );
        this.#environment = deepMerge(
            /** @type {Record<string, unknown>} */ (
                defaults.environment ?? DEFAULT_ENVIRONMENT
            ),
            options.environment ?? {},
        );
        this.#runtime = deepMerge(
            /** @type {Record<string, unknown>} */ (defaults.runtime ?? {}),
            options.runtime ?? {},
        );
    }

    /** @returns {string} */
    get id() {
        return this.#id;
    }

    /** @returns {string} */
    get language() {
        this.#assertActive();
        return this.#language;
    }

    /** @returns {'rtl' | 'ltr'} */
    get direction() {
        this.#assertActive();
        return this.#direction;
    }

    /** @returns {boolean} */
    get disposed() {
        return this.#disposed;
    }

    /** @returns {Readonly<Record<string, unknown>>} */
    get config() {
        this.#assertActive();
        return Object.freeze(cloneValue(this.#config));
    }

    /** @returns {Readonly<Record<string, unknown>>} */
    get metadata() {
        this.#assertActive();
        return Object.freeze(cloneValue(this.#metadata));
    }

    /** @returns {Readonly<Record<string, unknown>>} */
    get services() {
        this.#assertActive();
        return Object.freeze({ ...this.#services });
    }

    /** @returns {Readonly<Record<string, unknown>>} */
    get state() {
        this.#assertActive();
        return Object.freeze(cloneValue(this.#state));
    }

    /** @returns {Readonly<Record<string, unknown>>} */
    get environment() {
        this.#assertActive();
        return Object.freeze(cloneValue(this.#environment));
    }

    /** @returns {Readonly<Record<string, unknown>>} */
    get runtime() {
        this.#assertActive();
        return Object.freeze(cloneValue(this.#runtime));
    }

    /**
     * @param {string} language
     * @param {'rtl' | 'ltr'} [direction]
     * @returns {ToolContext}
     */
    setLanguage(language, direction = resolveDirection(normalizeLanguage(language))) {
        this.#assertActive();
        const normalizedLanguage = normalizeLanguage(language);

        if (direction !== 'rtl' && direction !== 'ltr') {
            throw new TypeError('ToolContext direction must be "rtl" or "ltr".');
        }

        this.#language = normalizedLanguage;
        this.#direction = direction;

        return this;
    }

    /**
     * @template T
     * @param {string} name
     * @param {T} [fallback]
     * @returns {T}
     */
    service(name, fallback = /** @type {T} */ (undefined)) {
        this.#assertActive();

        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new TypeError('Service name must be a non-empty string.');
        }

        const key = name.trim();

        return Object.prototype.hasOwnProperty.call(this.#services, key)
            ? /** @type {T} */ (this.#services[key])
            : fallback;
    }

    /**
     * @param {string} name
     * @returns {boolean}
     */
    hasService(name) {
        this.#assertActive();

        return (
            typeof name === 'string'
            && Object.prototype.hasOwnProperty.call(this.#services, name.trim())
        );
    }

    /**
     * @param {string} name
     * @param {unknown} service
     * @returns {ToolContext}
     */
    provide(name, service) {
        this.#assertActive();

        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new TypeError('Service name must be a non-empty string.');
        }

        this.#services[name.trim()] = service;
        return this;
    }

    /**
     * @param {Record<string, unknown>} services
     * @returns {ToolContext}
     */
    provideMany(services) {
        this.#assertActive();

        if (!isPlainObject(services)) {
            throw new TypeError('Services must be a plain object.');
        }

        for (const [name, service] of Object.entries(services)) {
            this.provide(name, service);
        }

        return this;
    }

    /**
     * @param {string} name
     * @returns {boolean}
     */
    revoke(name) {
        this.#assertActive();

        if (typeof name !== 'string' || name.trim().length === 0) {
            return false;
        }

        return delete this.#services[name.trim()];
    }

    /**
     * @template T
     * @param {string} path
     * @param {T} [fallback]
     * @returns {T}
     */
    getState(path, fallback = /** @type {T} */ (undefined)) {
        this.#assertActive();

        if (typeof path !== 'string' || path.trim().length === 0) {
            return /** @type {T} */ (cloneValue(this.#state));
        }

        const segments = path.split('.').filter(Boolean);
        let cursor = /** @type {unknown} */ (this.#state);

        for (const segment of segments) {
            if (
                cursor === null
                || typeof cursor !== 'object'
                || !Object.prototype.hasOwnProperty.call(cursor, segment)
            ) {
                return fallback;
            }

            cursor = /** @type {Record<string, unknown>} */ (cursor)[segment];
        }

        return /** @type {T} */ (cloneValue(cursor));
    }

    /**
     * @param {string} path
     * @param {unknown} value
     * @returns {ToolContext}
     */
    setState(path, value) {
        this.#assertActive();

        if (typeof path !== 'string' || path.trim().length === 0) {
            throw new TypeError('State path must be a non-empty string.');
        }

        const segments = path
            .split('.')
            .map((segment) => segment.trim())
            .filter(Boolean);

        if (segments.length === 0) {
            throw new TypeError('State path must contain at least one key.');
        }

        let cursor = this.#state;

        for (let index = 0; index < segments.length - 1; index += 1) {
            const segment = segments[index];
            const current = cursor[segment];

            if (!isPlainObject(current)) {
                cursor[segment] = {};
            }

            cursor = /** @type {Record<string, unknown>} */ (cursor[segment]);
        }

        cursor[segments.at(-1)] = cloneValue(value);
        return this;
    }

    /**
     * @param {Record<string, unknown>} patch
     * @returns {ToolContext}
     */
    patchState(patch) {
        this.#assertActive();

        if (!isPlainObject(patch)) {
            throw new TypeError('State patch must be a plain object.');
        }

        this.#state = deepMerge(this.#state, patch);
        return this;
    }

    /**
     * @param {Record<string, unknown>} state
     * @returns {ToolContext}
     */
    replaceState(state) {
        this.#assertActive();

        if (!isPlainObject(state)) {
            throw new TypeError('State must be a plain object.');
        }

        this.#state = cloneValue(state);
        return this;
    }

    /** @returns {ToolContext} */
    clearState() {
        this.#assertActive();
        this.#state = {};
        return this;
    }

    /**
     * @param {Record<string, unknown>} runtime
     * @returns {ToolContext}
     */
    patchRuntime(runtime) {
        this.#assertActive();

        if (!isPlainObject(runtime)) {
            throw new TypeError('Runtime patch must be a plain object.');
        }

        this.#runtime = deepMerge(this.#runtime, runtime);
        return this;
    }

    /**
     * @param {Record<string, unknown>} environment
     * @returns {ToolContext}
     */
    patchEnvironment(environment) {
        this.#assertActive();

        if (!isPlainObject(environment)) {
            throw new TypeError('Environment patch must be a plain object.');
        }

        this.#environment = deepMerge(this.#environment, environment);
        return this;
    }

    /**
     * @param {ToolContextOptions} [overrides]
     * @returns {ToolContext}
     */
    clone(overrides = {}) {
        this.#assertActive();

        if (!isPlainObject(overrides)) {
            throw new TypeError('Context overrides must be a plain object.');
        }

        return new ToolContext({
            id: overrides.id ?? `${this.#id}-clone-${cryptoRandomId()}`,
            language: overrides.language ?? this.#language,
            direction: overrides.direction ?? this.#direction,
            config: deepMerge(this.#config, overrides.config ?? {}),
            metadata: deepMerge(this.#metadata, overrides.metadata ?? {}),
            services: {
                ...this.#services,
                ...(overrides.services ?? {}),
            },
            state: deepMerge(this.#state, overrides.state ?? {}),
            environment: deepMerge(this.#environment, overrides.environment ?? {}),
            runtime: deepMerge(this.#runtime, overrides.runtime ?? {}),
        });
    }

    /**
     * @template T
     * @param {T} instance
     * @returns {T}
     */
    inject(instance) {
        this.#assertActive();

        if (
            instance === null
            || (typeof instance !== 'object' && typeof instance !== 'function')
        ) {
            throw new TypeError('A tool instance is required for context injection.');
        }

        if (
            'setContext' in instance
            && typeof /** @type {{setContext?: unknown}} */ (instance).setContext === 'function'
        ) {
            /** @type {{setContext: (context: ToolContext) => void}} */ (
                instance
            ).setContext(this);

            return instance;
        }

        const descriptor = Object.getOwnPropertyDescriptor(instance, 'context');

        if (descriptor && descriptor.writable === false && !descriptor.set) {
            throw new TypeError('The target context property is read-only.');
        }

        Object.defineProperty(instance, 'context', {
            configurable: true,
            enumerable: false,
            writable: true,
            value: this,
        });

        return instance;
    }

    /** @returns {Record<string, unknown>} */
    toJSON() {
        this.#assertActive();

        return {
            id: this.#id,
            language: this.#language,
            direction: this.#direction,
            config: cloneValue(this.#config),
            metadata: cloneValue(this.#metadata),
            state: cloneValue(this.#state),
            environment: cloneValue(this.#environment),
            runtime: cloneValue(this.#runtime),
            serviceNames: Object.keys(this.#services).sort(),
        };
    }

    /** @returns {void} */
    dispose() {
        if (this.#disposed) {
            return;
        }

        ToolContext.unregister(this.#id, this);
        this.#services = {};
        this.#state = {};
        this.#runtime = {};
        this.#config = {};
        this.#metadata = {};
        this.#environment = {};
        this.#disposed = true;
    }

    /** @returns {void} */
    #assertActive() {
        if (this.#disposed) {
            throw new Error(`ToolContext "${this.#id}" has been disposed.`);
        }
    }

    /**
     * @param {ToolContextOptions} [options]
     * @returns {ToolContext}
     */
    static create(options = {}) {
        return new ToolContext(options);
    }

    /**
     * @param {string} id
     * @param {ToolContextOptions | ToolContext} [options]
     * @returns {ToolContext}
     */
    static register(id, options = {}) {
        const normalizedId = normalizeId(id);

        if (ToolContext.#registry.has(normalizedId)) {
            throw new Error(`ToolContext "${normalizedId}" is already registered.`);
        }

        const context = options instanceof ToolContext
            ? options
            : new ToolContext({
                ...options,
                id: normalizedId,
            });

        if (context.id !== normalizedId) {
            throw new Error('Registered ToolContext id does not match the registry key.');
        }

        ToolContext.#registry.set(normalizedId, context);
        return context;
    }

    /**
     * @param {string} id
     * @returns {ToolContext | null}
     */
    static get(id) {
        if (typeof id !== 'string') {
            return null;
        }

        return ToolContext.#registry.get(id.trim()) ?? null;
    }

    /**
     * @param {string} id
     * @returns {boolean}
     */
    static has(id) {
        return typeof id === 'string' && ToolContext.#registry.has(id.trim());
    }

    /**
     * @param {string} id
     * @param {ToolContext} [expectedContext]
     * @returns {boolean}
     */
    static unregister(id, expectedContext) {
        if (typeof id !== 'string') {
            return false;
        }

        const normalizedId = id.trim();
        const current = ToolContext.#registry.get(normalizedId);

        if (!current || (expectedContext && current !== expectedContext)) {
            return false;
        }

        return ToolContext.#registry.delete(normalizedId);
    }

    /** @returns {string[]} */
    static ids() {
        return [...ToolContext.#registry.keys()].sort();
    }

    /** @returns {number} */
    static count() {
        return ToolContext.#registry.size;
    }

    /**
     * @param {{dispose?: boolean}} [options]
     * @returns {void}
     */
    static clear(options = {}) {
        const shouldDispose = options.dispose ?? true;
        const contexts = [...ToolContext.#registry.values()];

        ToolContext.#registry.clear();

        if (shouldDispose) {
            for (const context of contexts) {
                context.dispose();
            }
        }
    }

    /**
     * @param {ToolContextOptions} defaults
     * @returns {void}
     */
    static configure(defaults) {
        if (!isPlainObject(defaults)) {
            throw new TypeError('ToolContext defaults must be a plain object.');
        }

        const current = ToolContext.#defaults;
        const language = normalizeLanguage(defaults.language ?? current.language);
        const direction = defaults.direction ?? resolveDirection(language);

        if (direction !== 'rtl' && direction !== 'ltr') {
            throw new TypeError('ToolContext direction must be "rtl" or "ltr".');
        }

        ToolContext.#defaults = Object.freeze({
            language,
            direction,
            config: deepMerge(
                /** @type {Record<string, unknown>} */ (current.config ?? {}),
                defaults.config ?? {},
            ),
            metadata: deepMerge(
                /** @type {Record<string, unknown>} */ (current.metadata ?? {}),
                defaults.metadata ?? {},
            ),
            services: {
                .../** @type {Record<string, unknown>} */ (current.services ?? {}),
                ...(defaults.services ?? {}),
            },
            state: deepMerge(
                /** @type {Record<string, unknown>} */ (current.state ?? {}),
                defaults.state ?? {},
            ),
            environment: deepMerge(
                /** @type {Record<string, unknown>} */ (
                    current.environment ?? DEFAULT_ENVIRONMENT
                ),
                defaults.environment ?? {},
            ),
            runtime: deepMerge(
                /** @type {Record<string, unknown>} */ (current.runtime ?? {}),
                defaults.runtime ?? {},
            ),
        });
    }

    /** @returns {void} */
    static resetDefaults() {
        ToolContext.#defaults = Object.freeze({
            language: 'en',
            direction: 'ltr',
            config: {},
            metadata: {},
            services: {},
            state: {},
            environment: DEFAULT_ENVIRONMENT,
            runtime: {},
        });
    }

    /** @returns {Readonly<ToolContextOptions>} */
    static defaults() {
        const defaults = ToolContext.#defaults;

        return Object.freeze({
            language: defaults.language,
            direction: defaults.direction,
            config: cloneValue(defaults.config ?? {}),
            metadata: cloneValue(defaults.metadata ?? {}),
            services: Object.freeze({ ...(defaults.services ?? {}) }),
            state: cloneValue(defaults.state ?? {}),
            environment: cloneValue(defaults.environment ?? DEFAULT_ENVIRONMENT),
            runtime: cloneValue(defaults.runtime ?? {}),
        });
    }
}

/**
 * Creates a compact runtime-safe identifier.
 *
 * @returns {string}
 */
function cryptoRandomId() {
    if (
        typeof globalThis.crypto !== 'undefined'
        && typeof globalThis.crypto.randomUUID === 'function'
    ) {
        return globalThis.crypto.randomUUID();
    }

    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 12);

    return `${timestamp}-${random}`;
}

Object.freeze(ToolContext.prototype);

export {
    DEFAULT_ENVIRONMENT,
    ToolContext,
    cloneValue,
    deepMerge,
    isPlainObject,
    resolveDirection,
};

export default ToolContext;

// END OF FILE
