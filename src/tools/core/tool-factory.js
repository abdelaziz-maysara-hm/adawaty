/**
 * ============================================================================
 * Adawaty
 * Tool Factory
 * ----------------------------------------------------------------------------
 * Creates and initializes tool instances.
 * ============================================================================
 */

class ToolFactory {

    /**
     * Factory registry.
     *
     * @type {Map<string, Function>}
     */
    static registry = new Map();

    /**
     * Registers a tool factory.
     *
     * @param {string} id
     * @param {Function} factory
     * @returns {void}
     */
    static register(
        id,
        factory
    ) {

        if (
            typeof id !== 'string' ||
            !id.trim()
        ) {

            throw new TypeError(
                'Invalid tool id.'
            );

        }

        if (
            typeof factory !== 'function'
        ) {

            throw new TypeError(
                'Factory must be a function.'
            );

        }

        ToolFactory.registry.set(
            id,
            factory
        );

    }

    /**
     * Returns a registered factory.
     *
     * @param {string} id
     * @returns {Function|null}
     */
    static get(id) {

        return ToolFactory.registry.get(id)
            ?? null;

    }

    /**
     * Returns true if a factory exists.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static has(id) {

        return ToolFactory.registry.has(id);

    }

    /**
     * Removes a factory.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static remove(id) {

        return ToolFactory.registry.delete(
            id
        );

    }

    /**
     * Clears registry.
     *
     * @returns {void}
     */
    static clear() {

        ToolFactory.registry.clear();

    }

    /**
     * Returns registered IDs.
     *
     * @returns {string[]}
     */
    static ids() {

        return [
            ...ToolFactory.registry.keys()
        ].sort();

    }

    /**
     * Returns registry size.
     *
     * @returns {number}
     */
    static count() {

        return ToolFactory.registry.size;

    }

    /**
     * Creates a tool instance.
     *
     * @param {string} id
     * @param {Object} context
     * @returns {*}
     */
    static create(
        id,
        context = {}
    ) {

        const factory =
            ToolFactory.get(id);

        if (!factory) {

            throw new Error(
                `Unknown tool: ${id}`
            );

        }

        return factory(
            structuredClone(context)
        );

    }

    /**
     * Creates multiple tool instances.
     *
     * @param {string[]} ids
     * @param {Object} context
     * @returns {Object[]}
     */
    static createMany(
        ids = [],
        context = {}
    ) {

        return ids.map(id =>

            ToolFactory.create(
                id,
                context
            )

        );

    }

    /**
     * Instantiates a tool constructor.
     *
     * @param {Function} Constructor
     * @param {...*} args
     * @returns {Object}
     */
    static instantiate(
        Constructor,
        ...args
    ) {

        if (
            typeof Constructor !==
            'function'
        ) {

            throw new TypeError(
                'Constructor must be a function.'
            );

        }

        return new Constructor(
            ...args
        );

    }

    /**
     * Injects dependencies.
     *
     * @param {Object} instance
     * @param {Object} dependencies
     * @returns {Object}
     */
    static inject(
        instance,
        dependencies = {}
    ) {

        Object.assign(
            instance,
            structuredClone(
                dependencies
            )
        );

        return instance;

    }

    /**
     * Initializes a tool.
     *
     * @param {Object} instance
     * @returns {Object}
     */
    static initialize(
        instance
    ) {

        if (
            typeof instance.init ===
            'function'
        ) {

            instance.init();

        }

        return instance;

    }

    /**
     * Destroys a tool.
     *
     * @param {Object} instance
     * @returns {boolean}
     */
    static destroy(
        instance
    ) {

        if (
            typeof instance.destroy ===
            'function'
        ) {

            instance.destroy();

        }

        return true;

    }

    /**
     * Returns true if a tool
     * can be created.
     *
     * @param {string} id
     * @returns {boolean}
     */
    static canCreate(id) {

        return ToolFactory.has(id);

    }

    /**
     * Returns a registered factory
     * or a fallback.
     *
     * @param {string} id
     * @param {Function|null} fallback
     * @returns {Function|null}
     */
    static resolve(
        id,
        fallback = null
    ) {

        return ToolFactory.get(id)
            ?? fallback;

    }
	
	    /**
     * Binds a context object
     * to a tool instance.
     *
     * @param {Object} instance
     * @param {Object} context
     * @returns {Object}
     */
    static bindContext(
        instance,
        context = {}
    ) {

        instance.context =
            structuredClone(
                context
            );

        return instance;

    }

    /**
     * Singleton registry.
     *
     * @type {Map<string, Object>}
     */
    static singletons = new Map();

    /**
     * Registers a singleton instance.
     *
     * @param {string} id
     * @param {Object} instance
     * @returns {Object}
     */
    static registerSingleton(
        id,
        instance
    ) {

        ToolFactory.singletons.set(
            id,
            instance
        );

        return instance;

    }

    /**
     * Returns a singleton instance.
     *
     * @param {string} id
     * @returns {Object|null}
     */
    static singleton(id) {

        return ToolFactory.singletons.get(id)
            ?? null;

    }

    /**
     * Validates a factory function.
     *
     * @param {Function} factory
     * @returns {boolean}
     */
    static validateFactory(
        factory
    ) {

        return (
            typeof factory ===
            'function'
        );

    }

    /**
     * Boots a tool instance.
     *
     * @param {Object} instance
     * @returns {Object}
     */
    static boot(
        instance
    ) {

        if (
            typeof instance.boot ===
            'function'
        ) {

            instance.boot();

        }

        return instance;

    }

    /**
     * Shuts down a tool instance.
     *
     * @param {Object} instance
     * @returns {Object}
     */
    static shutdown(
        instance
    ) {

        if (
            typeof instance.shutdown ===
            'function'
        ) {

            instance.shutdown();

        }

        return instance;

    }

    /**
     * Clears all singleton instances.
     *
     * @returns {void}
     */
    static reset() {

        ToolFactory.singletons.clear();

    }

    /**
     * Returns every singleton ID.
     *
     * @returns {string[]}
     */
    static singletonIds() {

        return [

            ...ToolFactory.singletons.keys()

        ].sort();

    }

    /**
     * Returns singleton count.
     *
     * @returns {number}
     */
    static singletonCount() {

        return ToolFactory.singletons.size;

    }
	
	}

/**
 * Prevent accidental modification
 * of the ToolFactory API.
 */
Object.freeze(
    ToolFactory
);

export default ToolFactory;

// END OF FILE
