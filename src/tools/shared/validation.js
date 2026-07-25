/**
 * ============================================================================
 * Adawaty
 * Validation
 * ----------------------------------------------------------------------------
 * Shared validation utilities.
 * ============================================================================
 */

/**
 * Validation helper.
 */
class Validation {

    /**
     * Returns true when the value exists.
     *
     * @param {*} value
     * @returns {boolean}
     */
    static required(value) {

        return value !== null &&
            value !== undefined &&
            String(value).trim() !== '';

    }

    /**
     * Minimum length validation.
     *
     * @param {string} value
     * @param {number} length
     * @returns {boolean}
     */
    static minLength(
        value,
        length
    ) {

        return String(value).length >= length;

    }

    /**
     * Maximum length validation.
     *
     * @param {string} value
     * @param {number} length
     * @returns {boolean}
     */
    static maxLength(
        value,
        length
    ) {

        return String(value).length <= length;

    }

    /**
     * Minimum numeric value.
     *
     * @param {number|string} value
     * @param {number} min
     * @returns {boolean}
     */
    static min(
        value,
        min
    ) {

        return Number(value) >= min;

    }

    /**
     * Maximum numeric value.
     *
     * @param {number|string} value
     * @param {number} max
     * @returns {boolean}
     */
    static max(
        value,
        max
    ) {

        return Number(value) <= max;

    }

    /**
     * Checks if the value is numeric.
     *
     * @param {*} value
     * @returns {boolean}
     */
    static number(value) {

        return (
            value !== '' &&
            !Number.isNaN(
                Number(value)
            )
        );

    }

    /**
     * Integer validation.
     *
     * @param {*} value
     * @returns {boolean}
     */
    static integer(value) {

        return Number.isInteger(
            Number(value)
        );

    }

    /**
     * Decimal validation.
     *
     * @param {*} value
     * @returns {boolean}
     */
    static decimal(value) {

        return /^-?\d+(\.\d+)?$/.test(
            String(value)
        );

    }


    /**
     * Validates an email address.
     *
     * @param {string} value
     * @returns {boolean}
     */
    static email(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
            String(value).trim()
        );

    }

    /**
     * Validates a URL.
     *
     * @param {string} value
     * @returns {boolean}
     */
    static url(value) {

        try {

            new URL(value);

            return true;

        } catch {

            return false;

        }

    }

    /**
     * Validates a phone number.
     *
     * @param {string} value
     * @returns {boolean}
     */
    static phone(value) {

        return /^\+?[0-9\s\-()]{6,20}$/.test(
            String(value).trim()
        );

    }

    /**
     * Validates against a regular expression.
     *
     * @param {string} value
     * @param {RegExp} pattern
     * @returns {boolean}
     */
    static regex(
        value,
        pattern
    ) {

        return pattern.test(
            String(value)
        );

    }

    /**
     * Checks whether a value is between
     * two numeric limits (inclusive).
     *
     * @param {number|string} value
     * @param {number} min
     * @param {number} max
     * @returns {boolean}
     */
    static between(
        value,
        min,
        max
    ) {

        const number =
            Number(value);

        return (
            number >= min &&
            number <= max
        );

    }

    /**
     * Alias for between().
     *
     * @param {number|string} value
     * @param {number} min
     * @param {number} max
     * @returns {boolean}
     */
    static inRange(
        value,
        min,
        max
    ) {

        return Validation.between(
            value,
            min,
            max
        );

    }

    /**
     * Checks strict equality.
     *
     * @param {*} value
     * @param {*} expected
     * @returns {boolean}
     */
    static equals(
        value,
        expected
    ) {

        return value === expected;

    }

    /**
     * Returns true if the value
     * contains non-whitespace text.
     *
     * @param {*} value
     * @returns {boolean}
     */
    static notEmpty(value) {

        return String(value)
            .trim()
            .length > 0;

    }

    /**
     * Validates that the value exists
     * inside the provided array.
     *
     * @param {*} value
     * @param {Array} values
     * @returns {boolean}
     */
    static oneOf(
        value,
        values
    ) {

        return Array.isArray(values)
            && values.includes(value);

    }

    /**
     * Validates that the value does
     * not exist inside the array.
     *
     * @param {*} value
     * @param {Array} values
     * @returns {boolean}
     */
    static notOneOf(
        value,
        values
    ) {

        return Array.isArray(values)
            && !values.includes(value);

    }
	
	    /**
     * Registered custom validation rules.
     *
     * @type {Map<string, Function>}
     */
    static rules = new Map();

    /**
     * Registers a custom validation rule.
     *
     * @param {string} name
     * @param {Function} callback
     * @returns {void}
     */
    static registerRule(
        name,
        callback
    ) {

        if (
            typeof name !== 'string' ||
            typeof callback !== 'function'
        ) {

            throw new TypeError(
                'Invalid validation rule.'
            );

        }

        Validation.rules.set(
            name,
            callback
        );

    }

    /**
     * Executes a registered rule.
     *
     * @param {string} name
     * @param {...*} args
     * @returns {boolean}
     */
    static runRule(
        name,
        ...args
    ) {

        const rule =
            Validation.rules.get(
                name
            );

        if (!rule) {

            throw new Error(
                `Validation rule "${name}" was not found.`
            );

        }

        return Boolean(
            rule(...args)
        );

    }

    /**
     * Validates a value using
     * multiple rules.
     *
     * @param {*} value
     * @param {Array<Function>} rules
     * @returns {boolean}
     */
    static validate(
        value,
        rules = []
    ) {

        return rules.every(
            rule => rule(value)
        );

    }

    /**
     * Validates multiple fields.
     *
     * @param {Object} values
     * @param {Object} schema
     * @returns {boolean}
     */
    static validateAll(
        values,
        schema
    ) {

        return Object.entries(
            schema
        ).every(
            ([key, rules]) =>
                Validation.validate(
                    values[key],
                    rules
                )
        );

    }

    /**
     * Collects validation errors.
     *
     * @param {Object} values
     * @param {Object} schema
     * @returns {Object}
     */
    static collectErrors(
        values,
        schema
    ) {

        const errors = {};

        Object.entries(schema)
            .forEach(
                ([key, rules]) => {

                    for (
                        const rule
                        of rules
                    ) {

                        if (
                            !rule(
                                values[key]
                            )
                        ) {

                            errors[key] = true;

                            break;

                        }

                    }

                }
            );

        return errors;

    }

    /**
     * Removes all registered
     * custom validation rules.
     *
     * @returns {void}
     */
    static clearRules() {

        Validation.rules.clear();

    }

    /**
     * Returns true if the rule exists.
     *
     * @param {string} name
     * @returns {boolean}
     */
    static hasRule(name) {

        return Validation.rules.has(
            name
        );

    }
	
	
	    /**
     * Removes a registered validation rule.
     *
     * @param {string} name
     * @returns {boolean}
     */
    static removeRule(name) {

        return Validation.rules.delete(
            name
        );

    }

    /**
     * Returns all registered rule names.
     *
     * @returns {string[]}
     */
    static getRuleNames() {

        return [
            ...Validation.rules.keys()
        ];

    }

}

/**
 * Freeze the helper to prevent
 * accidental runtime mutation.
 */
Object.freeze(
    Validation
);

export default Validation;

// END OF FILE