/**
 * @file Shared error model for the Adawaty tool runtime.
 * @module tools/core/tool-error
 */

/**
 * @typedef {Object} ToolErrorDetails
 * @property {string} [code]
 * @property {unknown} [cause]
 * @property {Record<string, unknown>} [metadata]
 * @property {boolean} [recoverable]
 */

/**
 * Stable base error for every public core-runtime failure.
 */
class ToolError extends Error {
    /**
     * @param {string} message
     * @param {ToolErrorDetails} [details]
     */
    constructor(message, details = {}) {
        if (typeof message !== 'string' || message.trim().length === 0) {
            throw new TypeError('ToolError message must be a non-empty string.');
        }

        super(message, details.cause === undefined ? undefined : { cause: details.cause });
        this.name = new.target.name;
        this.code = normalizeErrorCode(details.code ?? 'TOOL_ERROR');
        this.metadata = Object.freeze({ ...(details.metadata ?? {}) });
        this.recoverable = details.recoverable === true;
    }

    /**
     * Creates a serializable diagnostic representation.
     *
     * @returns {Readonly<Record<string, unknown>>}
     */
    toJSON() {
        return Object.freeze({
            name: this.name,
            message: this.message,
            code: this.code,
            recoverable: this.recoverable,
            metadata: this.metadata,
        });
    }
}

/**
 * Normalizes stable machine-readable error codes.
 *
 * @param {unknown} value
 * @returns {string}
 */
function normalizeErrorCode(value) {
    if (typeof value !== 'string') {
        throw new TypeError('Error code must be a string.');
    }

    const normalized = value.trim().toUpperCase().replace(/[^A-Z0-9_]+/g, '_');

    if (normalized.length === 0) {
        throw new TypeError('Error code cannot be empty.');
    }

    return normalized;
}

/**
 * Converts any thrown value into an Error without losing an existing instance.
 *
 * @param {unknown} value
 * @param {string} [fallbackMessage='Unknown runtime failure.']
 * @returns {Error}
 */
function toError(value, fallbackMessage = 'Unknown runtime failure.') {
    if (value instanceof Error) {
        return value;
    }

    if (value === null || value === undefined || String(value).length === 0) {
        return new Error(fallbackMessage);
    }

    return new Error(String(value));
}

/**
 * Returns whether a value is an abort-like error.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
function isAbortError(value) {
    return value instanceof Error && value.name === 'AbortError';
}

Object.freeze(ToolError.prototype);

export { ToolError, isAbortError, normalizeErrorCode, toError };
export default ToolError;

// END OF FILE
