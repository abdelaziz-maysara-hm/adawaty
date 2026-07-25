/**
 * ============================================================================
 * Adawaty
 * Schema
 * ----------------------------------------------------------------------------
 * Shared schema validation and parsing utilities.
 * ============================================================================
 */

class Schema {

    /**
     * Registered schemas.
     *
     * @type {Map<string, Object>}
     */
    static schemas = new Map();

    /**
     * Registers a schema.
     *
     * @param {string} name
     * @param {Object} schema
     * @returns {void}
     */
    static register(
        name,
        schema
    ) {

        if (
            typeof name !== 'string' ||
            !schema ||
            typeof schema !== 'object'
        ) {

            throw new TypeError(
                'Invalid schema.'
            );

        }

        Schema.schemas.set(
            name,
            schema
        );

    }

    /**
     * Returns a registered schema.
     *
     * @param {string} name
     * @returns {Object|null}
     */
    static get(name) {

        return Schema.schemas.get(
            name
        ) ?? null;

    }

    /**
     * Checks whether a schema exists.
     *
     * @param {string} name
     * @returns {boolean}
     */
    static has(name) {

        return Schema.schemas.has(
            name
        );

    }

    /**
     * Removes a registered schema.
     *
     * @param {string} name
     * @returns {boolean}
     */
    static remove(name) {

        return Schema.schemas.delete(
            name
        );

    }

    /**
     * Returns all schema names.
     *
     * @returns {string[]}
     */
    static names() {

        return [
            ...Schema.schemas.keys()
        ];

    }

    /**
     * Clears all schemas.
     *
     * @returns {void}
     */
    static clear() {

        Schema.schemas.clear();

    }

    /**
     * Creates a deep copy
     * of a schema.
     *
     * @param {Object} schema
     * @returns {Object}
     */
    static clone(schema) {

        return structuredClone(
            schema
        );

    }

}

    /**
     * Validates data against a schema.
     *
     * @param {Object} data
     * @param {Object} schema
     * @returns {boolean}
     */
    static validate(
        data,
        schema
    ) {

        return Object.entries(
            schema
        ).every(
            ([key, definition]) => {

                const value = data[key];

                return (
                    Schema.validateRequired(
                        value,
                        definition
                    ) &&
                    Schema.validateType(
                        value,
                        definition
                    ) &&
                    Schema.validateEnum(
                        value,
                        definition
                    ) &&
                    Schema.validateProperties(
                        value,
                        definition
                    )
                );

            }
        );

    }

    /**
     * Validates a value type.
     *
     * @param {*} value
     * @param {Object} definition
     * @returns {boolean}
     */
    static validateType(
        value,
        definition
    ) {

        if (
            value === undefined ||
            definition.type === undefined
        ) {

            return true;

        }

        switch (
            definition.type
        ) {

            case 'string':
                return typeof value === 'string';

            case 'number':
                return (
                    typeof value === 'number' &&
                    Number.isFinite(value)
                );

            case 'boolean':
                return typeof value === 'boolean';

            case 'array':
                return Array.isArray(value);

            case 'object':
                return (
                    value !== null &&
                    typeof value === 'object' &&
                    !Array.isArray(value)
                );

            default:
                return true;

        }

    }

    /**
     * Validates required fields.
     *
     * @param {*} value
     * @param {Object} definition
     * @returns {boolean}
     */
    static validateRequired(
        value,
        definition
    ) {

        if (
            !definition.required
        ) {

            return true;

        }

        return (
            value !== undefined &&
            value !== null
        );

    }

    /**
     * Validates enum values.
     *
     * @param {*} value
     * @param {Object} definition
     * @returns {boolean}
     */
    static validateEnum(
        value,
        definition
    ) {

        if (
            !Array.isArray(
                definition.enum
            )
        ) {

            return true;

        }

        return definition.enum.includes(
            value
        );

    }

    /**
     * Validates nested object properties.
     *
     * @param {*} value
     * @param {Object} definition
     * @returns {boolean}
     */
    static validateProperties(
        value,
        definition
    ) {

        if (
            definition.type !== 'object' ||
            !definition.properties
        ) {

            return true;

        }

        return Schema.validate(
            value,
            definition.properties
        );

    }

    /**
     * Returns whether the schema
     * contains nested properties.
     *
     * @param {Object} definition
     * @returns {boolean}
     */
    static hasProperties(
        definition
    ) {

        return (
            definition &&
            typeof definition === 'object' &&
            typeof definition.properties === 'object'
        );

    }


    /**
     * Registered custom validators.
     *
     * @type {Map<string, Function>}
     */
    static validators = new Map();

    /**
     * Validates array items.
     *
     * @param {Array} value
     * @param {Object} definition
     * @returns {boolean}
     */
    static validateArray(
        value,
        definition
    ) {

        if (
            definition.type !== 'array'
        ) {

            return true;

        }

        if (!Array.isArray(value)) {

            return false;

        }

        if (!definition.items) {

            return true;

        }

        return value.every(item =>
            Schema.validateType(
                item,
                definition.items
            )
        );

    }

    /**
     * Applies default values.
     *
     * @param {Object} data
     * @param {Object} schema
     * @returns {Object}
     */
    static applyDefaults(
        data,
        schema
    ) {

        const result = {
            ...data
        };

        Object.entries(schema)
            .forEach(
                ([key, definition]) => {

                    if (
                        result[key] === undefined &&
                        definition.default !== undefined
                    ) {

                        result[key] =
                            definition.default;

                    }

                }
            );

        return result;

    }

    /**
     * Coerces primitive types.
     *
     * @param {Object} data
     * @param {Object} schema
     * @returns {Object}
     */
    static coerceTypes(
        data,
        schema
    ) {

        const result = {
            ...data
        };

        Object.entries(schema)
            .forEach(
                ([key, definition]) => {

                    if (
                        result[key] === undefined
                    ) {

                        return;

                    }

                    switch (
                        definition.type
                    ) {

                        case 'number':

                            result[key] =
                                Number(
                                    result[key]
                                );

                            break;

                        case 'boolean':

                            result[key] =
                                Boolean(
                                    result[key]
                                );

                            break;

                        case 'string':

                            result[key] =
                                String(
                                    result[key]
                                );

                            break;

                    }

                }
            );

        return result;

    }

    /**
     * Parses data using
     * defaults and coercion.
     *
     * @param {Object} data
     * @param {Object} schema
     * @returns {Object}
     */
    static parse(
        data,
        schema
    ) {

        return Schema.coerceTypes(
            Schema.applyDefaults(
                data,
                schema
            ),
            schema
        );

    }

    /**
     * Registers a custom validator.
     *
     * @param {string} name
     * @param {Function} validator
     * @returns {void}
     */
    static registerValidator(
        name,
        validator
    ) {

        if (
            typeof validator !== 'function'
        ) {

            throw new TypeError(
                'Validator must be a function.'
            );

        }

        Schema.validators.set(
            name,
            validator
        );

    }

    /**
     * Executes a custom validator.
     *
     * @param {string} name
     * @param {...*} args
     * @returns {boolean}
     */
    static runValidator(
        name,
        ...args
    ) {

        const validator =
            Schema.validators.get(
                name
            );

        if (!validator) {

            throw new Error(
                `Validator "${name}" does not exist.`
            );

        }

        return Boolean(
            validator(...args)
        );

    }
	
	
	    /**
     * Removes a registered validator.
     *
     * @param {string} name
     * @returns {boolean}
     */
    static removeValidator(name) {

        return Schema.validators.delete(
            name
        );

    }

    /**
     * Returns all registered validator names.
     *
     * @returns {string[]}
     */
    static validatorNames() {

        return [
            ...Schema.validators.keys()
        ];

    }

    /**
     * Clears all registered validators.
     *
     * @returns {void}
     */
    static clearValidators() {

        Schema.validators.clear();

    }

}

/**
 * Freeze helper methods.
 */
Object.freeze(
    Schema
);

export default Schema;

// END OF FILE