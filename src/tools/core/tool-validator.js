/**
 * @file Production-ready validation utilities for the Adawaty tool engine.
 * @module tools/core/tool-validator
 */

import ToolError from './tool-error.js';

/**
 * @typedef {'error' | 'warning' | 'info'} ValidationSeverity
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} code
 * @property {string} message
 * @property {string} path
 * @property {ValidationSeverity} severity
 * @property {unknown} value
 * @property {Record<string, unknown>} metadata
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} valid
 * @property {ValidationIssue[]} issues
 * @property {unknown} value
 */

/**
 * @typedef {Object} ValidationContext
 * @property {string} path
 * @property {unknown} root
 * @property {Record<string, unknown>} metadata
 */

/**
 * @callback ValidationRule
 * @param {unknown} value
 * @param {ValidationContext} context
 * @returns {boolean | string | ValidationIssue | ValidationIssue[] | Promise<boolean | string | ValidationIssue | ValidationIssue[]>}
 */

/**
 * @typedef {Object} ValidationRuleOptions
 * @property {string} [code='invalid']
 * @property {string} [message='Validation failed.']
 * @property {ValidationSeverity} [severity='error']
 * @property {boolean} [optional=false]
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @typedef {Object} ValidateOptions
 * @property {boolean} [throwOnError=false]
 * @property {boolean} [stopAtFirstError=false]
 * @property {string} [path='$']
 * @property {Record<string, unknown>} [metadata]
 */

/**
 * @typedef {Object} SchemaNode
 * @property {string} [type]
 * @property {boolean} [required]
 * @property {unknown} [default]
 * @property {unknown[]} [enum]
 * @property {number} [min]
 * @property {number} [max]
 * @property {number} [minLength]
 * @property {number} [maxLength]
 * @property {RegExp | string} [pattern]
 * @property {SchemaNode} [items]
 * @property {Record<string, SchemaNode>} [properties]
 * @property {string[]} [requiredProperties]
 * @property {boolean} [additionalProperties]
 * @property {ValidationRule[]} [rules]
 * @property {(value: unknown) => unknown} [transform]
 */

/**
 * Error thrown when validation fails.
 */
class ToolValidationError extends ToolError {
    /**
     * @param {string} message
     * @param {ValidationIssue[]} issues
     */
    constructor(message, issues = []) {
        const normalizedIssues = Array.isArray(issues) ? [...issues] : [];
        super(message, {
            code: 'TOOL_VALIDATION_FAILED',
            metadata: { issueCount: normalizedIssues.length },
            recoverable: true,
        });
        this.issues = Object.freeze(normalizedIssues);
    }
}

/**
 * Returns whether a value is null or undefined.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isNil(value) {
    return value === null || value === undefined;
}

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
 * Normalizes a validation path.
 *
 * @param {unknown} path
 * @returns {string}
 */
function normalizePath(path) {
    if (typeof path !== 'string') {
        throw new TypeError('Validation path must be a string.');
    }

    const normalized = path.trim();

    return normalized.length > 0 ? normalized : '$';
}

/**
 * Creates an issue object.
 *
 * @param {Partial<ValidationIssue> & Pick<ValidationIssue, 'message'>} input
 * @returns {ValidationIssue}
 */
function createIssue(input) {
    const severity = input.severity ?? 'error';

    if (!['error', 'warning', 'info'].includes(severity)) {
        throw new TypeError('Validation severity must be error, warning, or info.');
    }

    return Object.freeze({
        code: input.code ?? 'invalid',
        message: String(input.message),
        path: normalizePath(input.path ?? '$'),
        severity,
        value: input.value,
        metadata: Object.freeze({ ...(input.metadata ?? {}) }),
    });
}

/**
 * Converts a rule result into issues.
 *
 * @param {unknown} result
 * @param {unknown} value
 * @param {ValidationContext} context
 * @param {Required<ValidationRuleOptions>} options
 * @returns {ValidationIssue[]}
 */
function normalizeRuleResult(result, value, context, options) {
    if (result === true || result === undefined) {
        return [];
    }

    if (result === false) {
        return [
            createIssue({
                code: options.code,
                message: options.message,
                path: context.path,
                severity: options.severity,
                value,
                metadata: options.metadata,
            }),
        ];
    }

    if (typeof result === 'string') {
        return [
            createIssue({
                code: options.code,
                message: result,
                path: context.path,
                severity: options.severity,
                value,
                metadata: options.metadata,
            }),
        ];
    }

    if (Array.isArray(result)) {
        return result.flatMap((issue) =>
            normalizeRuleResult(issue, value, context, options),
        );
    }

    if (isPlainObject(result) && typeof result.message === 'string') {
        return [
            createIssue({
                ...result,
                path: result.path ?? context.path,
                value: 'value' in result ? result.value : value,
            }),
        ];
    }

    throw new TypeError('Validation rule returned an unsupported result.');
}

/**
 * Normalizes rule options.
 *
 * @param {ValidationRuleOptions} [options]
 * @returns {Required<ValidationRuleOptions>}
 */
function normalizeRuleOptions(options = {}) {
    return {
        code: options.code ?? 'invalid',
        message: options.message ?? 'Validation failed.',
        severity: options.severity ?? 'error',
        optional: options.optional ?? false,
        metadata: { ...(options.metadata ?? {}) },
    };
}

/**
 * Validation rule wrapper.
 */
class ToolValidationRule {
    /** @type {ValidationRule} */
    #rule;

    /** @type {Required<ValidationRuleOptions>} */
    #options;

    /**
     * @param {ValidationRule} rule
     * @param {ValidationRuleOptions} [options]
     */
    constructor(rule, options = {}) {
        if (typeof rule !== 'function') {
            throw new TypeError('Validation rule must be a function.');
        }

        this.#rule = rule;
        this.#options = normalizeRuleOptions(options);
    }

    /**
     * @param {unknown} value
     * @param {ValidationContext} context
     * @returns {Promise<ValidationIssue[]>}
     */
    async validate(value, context) {
        if (this.#options.optional && isNil(value)) {
            return [];
        }

        const result = await this.#rule(value, context);

        return normalizeRuleResult(result, value, context, this.#options);
    }
}

/**
 * Production-ready validation service.
 */
class ToolValidator {
    /** @type {Map<string, ToolValidationRule>} */
    static #registry = new Map();

    /** @type {ToolValidationRule[]} */
    #rules = [];

    /**
     * @param {Array<ToolValidationRule | ValidationRule>} [rules]
     */
    constructor(rules = []) {
        for (const rule of rules) {
            this.use(rule);
        }
    }

    /**
     * Adds a rule.
     *
     * @param {ToolValidationRule | ValidationRule} rule
     * @param {ValidationRuleOptions} [options]
     * @returns {ToolValidator}
     */
    use(rule, options = {}) {
        const normalized = rule instanceof ToolValidationRule
            ? rule
            : new ToolValidationRule(rule, options);

        this.#rules.push(normalized);

        return this;
    }

    /**
     * Validates a value using all configured rules.
     *
     * @param {unknown} value
     * @param {ValidateOptions} [options]
     * @returns {Promise<ValidationResult>}
     */
    async validate(value, options = {}) {
        const path = normalizePath(options.path ?? '$');
        const issues = [];

        /** @type {ValidationContext} */
        const context = {
            path,
            root: value,
            metadata: { ...(options.metadata ?? {}) },
        };

        for (const rule of this.#rules) {
            const result = await rule.validate(value, context);

            issues.push(...result);

            if (
                options.stopAtFirstError
                && result.some((issue) => issue.severity === 'error')
            ) {
                break;
            }
        }

        const validationResult = Object.freeze({
            valid: !issues.some((issue) => issue.severity === 'error'),
            issues: Object.freeze([...issues]),
            value,
        });

        if (!validationResult.valid && options.throwOnError) {
            throw new ToolValidationError(
                `Validation failed at ${path}.`,
                validationResult.issues,
            );
        }

        return validationResult;
    }

    /**
     * Validates synchronously.
     *
     * @param {unknown} value
     * @param {ValidateOptions} [options]
     * @returns {ValidationResult}
     */
    validateSync(value, options = {}) {
        const path = normalizePath(options.path ?? '$');
        const issues = [];

        /** @type {ValidationContext} */
        const context = {
            path,
            root: value,
            metadata: { ...(options.metadata ?? {}) },
        };

        void context;
        void issues;

        throw new Error(
            'validateSync() is unavailable because validation rules may be asynchronous. Use validate().',
        );
    }

    /**
     * Returns number of configured rules.
     *
     * @returns {number}
     */
    count() {
        return this.#rules.length;
    }

    /**
     * Removes all rules.
     *
     * @returns {void}
     */
    clear() {
        this.#rules.length = 0;
    }

    /**
     * Creates a validator from registered rules.
     *
     * @param {string[]} names
     * @returns {ToolValidator}
     */
    static from(names) {
        if (!Array.isArray(names)) {
            throw new TypeError('Rule names must be an array.');
        }

        const validator = new ToolValidator();

        for (const name of names) {
            const rule = ToolValidator.getRule(name);

            if (!rule) {
                throw new Error(`Validation rule "${name}" is not registered.`);
            }

            validator.use(rule);
        }

        return validator;
    }

    /**
     * Registers a reusable rule.
     *
     * @param {string} name
     * @param {ToolValidationRule | ValidationRule} rule
     * @param {ValidationRuleOptions} [options]
     * @returns {ToolValidationRule}
     */
    static registerRule(name, rule, options = {}) {
        if (typeof name !== 'string' || name.trim().length === 0) {
            throw new TypeError('Rule name must be a non-empty string.');
        }

        const normalizedName = name.trim();

        if (ToolValidator.#registry.has(normalizedName)) {
            throw new Error(`Validation rule "${normalizedName}" already exists.`);
        }

        const normalized = rule instanceof ToolValidationRule
            ? rule
            : new ToolValidationRule(rule, options);

        ToolValidator.#registry.set(normalizedName, normalized);

        return normalized;
    }

    /**
     * Returns a registered rule.
     *
     * @param {string} name
     * @returns {ToolValidationRule | null}
     */
    static getRule(name) {
        if (typeof name !== 'string') {
            return null;
        }

        return ToolValidator.#registry.get(name.trim()) ?? null;
    }

    /**
     * Removes a registered rule.
     *
     * @param {string} name
     * @returns {boolean}
     */
    static unregisterRule(name) {
        return typeof name === 'string'
            && ToolValidator.#registry.delete(name.trim());
    }

    /**
     * Returns registered rule names.
     *
     * @returns {string[]}
     */
    static ruleNames() {
        return [...ToolValidator.#registry.keys()].sort();
    }

    /**
     * Clears the rule registry.
     *
     * @returns {void}
     */
    static clearRules() {
        ToolValidator.#registry.clear();
    }

    /**
     * Validates a value against a schema.
     *
     * @param {unknown} value
     * @param {SchemaNode} schema
     * @param {ValidateOptions} [options]
     * @returns {Promise<ValidationResult>}
     */
    static async validateSchema(value, schema, options = {}) {
        if (!isPlainObject(schema)) {
            throw new TypeError('Schema must be a plain object.');
        }

        const issues = [];
        const transformed = await ToolValidator.#validateSchemaNode(
            value,
            schema,
            normalizePath(options.path ?? '$'),
            value,
            issues,
            options,
        );

        const result = Object.freeze({
            valid: !issues.some((issue) => issue.severity === 'error'),
            issues: Object.freeze([...issues]),
            value: transformed,
        });

        if (!result.valid && options.throwOnError) {
            throw new ToolValidationError(
                `Schema validation failed at ${options.path ?? '$'}.`,
                result.issues,
            );
        }

        return result;
    }

    /**
     * @param {unknown} value
     * @param {SchemaNode} schema
     * @param {string} path
     * @param {unknown} root
     * @param {ValidationIssue[]} issues
     * @param {ValidateOptions} options
     * @returns {Promise<unknown>}
     */
    static async #validateSchemaNode(
        value,
        schema,
        path,
        root,
        issues,
        options,
    ) {
        let current = value;

        if (isNil(current)) {
            if (schema.default !== undefined) {
                current = typeof schema.default === 'function'
                    ? schema.default()
                    : schema.default;
            } else if (schema.required) {
                issues.push(
                    createIssue({
                        code: 'required',
                        message: 'Value is required.',
                        path,
                        value: current,
                    }),
                );

                return current;
            } else {
                return current;
            }
        }

        if (typeof schema.transform === 'function') {
            current = await schema.transform(current);
        }

        if (schema.type && !ToolValidator.#matchesType(current, schema.type)) {
            issues.push(
                createIssue({
                    code: 'type',
                    message: `Expected type "${schema.type}".`,
                    path,
                    value: current,
                    metadata: { expected: schema.type },
                }),
            );

            if (options.stopAtFirstError) {
                return current;
            }
        }

        if (schema.enum && !schema.enum.includes(current)) {
            issues.push(
                createIssue({
                    code: 'enum',
                    message: 'Value is not in the allowed set.',
                    path,
                    value: current,
                    metadata: { allowed: [...schema.enum] },
                }),
            );
        }

        if (typeof current === 'number') {
            if (schema.min !== undefined && current < schema.min) {
                issues.push(
                    createIssue({
                        code: 'min',
                        message: `Value must be at least ${schema.min}.`,
                        path,
                        value: current,
                    }),
                );
            }

            if (schema.max !== undefined && current > schema.max) {
                issues.push(
                    createIssue({
                        code: 'max',
                        message: `Value must be at most ${schema.max}.`,
                        path,
                        value: current,
                    }),
                );
            }
        }

        if (typeof current === 'string' || Array.isArray(current)) {
            if (
                schema.minLength !== undefined
                && current.length < schema.minLength
            ) {
                issues.push(
                    createIssue({
                        code: 'minLength',
                        message: `Length must be at least ${schema.minLength}.`,
                        path,
                        value: current,
                    }),
                );
            }

            if (
                schema.maxLength !== undefined
                && current.length > schema.maxLength
            ) {
                issues.push(
                    createIssue({
                        code: 'maxLength',
                        message: `Length must be at most ${schema.maxLength}.`,
                        path,
                        value: current,
                    }),
                );
            }
        }

        if (typeof current === 'string' && schema.pattern !== undefined) {
            const pattern = schema.pattern instanceof RegExp
                ? schema.pattern
                : new RegExp(schema.pattern);

            pattern.lastIndex = 0;

            if (!pattern.test(current)) {
                issues.push(
                    createIssue({
                        code: 'pattern',
                        message: 'Value does not match the required pattern.',
                        path,
                        value: current,
                    }),
                );
            }
        }

        if (Array.isArray(current) && schema.items) {
            const next = [];

            for (let index = 0; index < current.length; index += 1) {
                next.push(
                    await ToolValidator.#validateSchemaNode(
                        current[index],
                        schema.items,
                        `${path}[${index}]`,
                        root,
                        issues,
                        options,
                    ),
                );

                if (
                    options.stopAtFirstError
                    && issues.some((issue) => issue.severity === 'error')
                ) {
                    break;
                }
            }

            current = next;
        }

        if (isPlainObject(current) && schema.properties) {
            const output = {};
            const required = new Set(schema.requiredProperties ?? []);

            for (const [key, childSchema] of Object.entries(schema.properties)) {
                const nextSchema = required.has(key)
                    ? { ...childSchema, required: true }
                    : childSchema;

                output[key] = await ToolValidator.#validateSchemaNode(
                    current[key],
                    nextSchema,
                    `${path}.${key}`,
                    root,
                    issues,
                    options,
                );

                if (
                    options.stopAtFirstError
                    && issues.some((issue) => issue.severity === 'error')
                ) {
                    break;
                }
            }

            if (schema.additionalProperties !== false) {
                for (const [key, child] of Object.entries(current)) {
                    if (!(key in schema.properties)) {
                        output[key] = child;
                    }
                }
            } else {
                for (const key of Object.keys(current)) {
                    if (!(key in schema.properties)) {
                        issues.push(
                            createIssue({
                                code: 'additionalProperty',
                                message: `Unexpected property "${key}".`,
                                path: `${path}.${key}`,
                                value: current[key],
                            }),
                        );
                    }
                }
            }

            current = output;
        }

        if (schema.rules) {
            for (const rule of schema.rules) {
                const wrapped = rule instanceof ToolValidationRule
                    ? rule
                    : new ToolValidationRule(rule);

                issues.push(
                    ...(await wrapped.validate(current, {
                        path,
                        root,
                        metadata: { ...(options.metadata ?? {}) },
                    })),
                );
            }
        }

        return current;
    }

    /**
     * @param {unknown} value
     * @param {string} type
     * @returns {boolean}
     */
    static #matchesType(value, type) {
        switch (type) {
            case 'array':
                return Array.isArray(value);
            case 'object':
                return isPlainObject(value);
            case 'integer':
                return Number.isInteger(value);
            case 'number':
                return typeof value === 'number' && Number.isFinite(value);
            case 'null':
                return value === null;
            case 'date':
                return value instanceof Date && !Number.isNaN(value.getTime());
            default:
                return typeof value === type;
        }
    }

    /**
     * Creates a required rule.
     *
     * @param {string} [message]
     * @returns {ToolValidationRule}
     */
    static required(message = 'Value is required.') {
        return new ToolValidationRule(
            (value) => !isNil(value) && value !== '',
            { code: 'required', message },
        );
    }

    /**
     * Creates a type rule.
     *
     * @param {string} type
     * @param {string} [message]
     * @returns {ToolValidationRule}
     */
    static type(type, message = `Value must be of type ${type}.`) {
        return new ToolValidationRule(
            (value) => ToolValidator.#matchesType(value, type),
            { code: 'type', message },
        );
    }

    /**
     * Creates a range rule.
     *
     * @param {number} min
     * @param {number} max
     * @returns {ToolValidationRule}
     */
    static range(min, max) {
        if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) {
            throw new TypeError('Invalid validation range.');
        }

        return new ToolValidationRule(
            (value) =>
                typeof value === 'number'
                && Number.isFinite(value)
                && value >= min
                && value <= max,
            {
                code: 'range',
                message: `Value must be between ${min} and ${max}.`,
            },
        );
    }

    /**
     * Creates an enum rule.
     *
     * @param {unknown[]} allowed
     * @returns {ToolValidationRule}
     */
    static oneOf(allowed) {
        if (!Array.isArray(allowed) || allowed.length === 0) {
            throw new TypeError('Allowed values must be a non-empty array.');
        }

        return new ToolValidationRule(
            (value) => allowed.includes(value),
            {
                code: 'enum',
                message: 'Value is not in the allowed set.',
                metadata: { allowed: [...allowed] },
            },
        );
    }

    /**
     * Creates a pattern rule.
     *
     * @param {RegExp} pattern
     * @returns {ToolValidationRule}
     */
    static pattern(pattern) {
        if (!(pattern instanceof RegExp)) {
            throw new TypeError('Pattern rule requires a RegExp.');
        }

        return new ToolValidationRule(
            (value) => {
                if (typeof value !== 'string') {
                    return false;
                }

                pattern.lastIndex = 0;

                return pattern.test(value);
            },
            {
                code: 'pattern',
                message: 'Value does not match the required pattern.',
            },
        );
    }
}

Object.freeze(ToolValidationRule.prototype);
Object.freeze(ToolValidator.prototype);

export {
    ToolValidationError,
    ToolValidationRule,
    ToolValidator,
    createIssue,
    isNil,
    isPlainObject,
    normalizePath,
    normalizeRuleOptions,
    normalizeRuleResult,
};

export default ToolValidator;

// END OF FILE
