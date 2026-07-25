/**
 * ============================================================================
 * Adawaty
 * Validation Helpers
 * ============================================================================
 */

export function isRequired(value) {
    return value !== null &&
        value !== undefined &&
        value !== "";
}

export function isNumber(value) {
    return !Number.isNaN(Number(value));
}

export function isInteger(value) {
    return Number.isInteger(Number(value));
}

export function isPositive(value) {
    return Number(value) > 0;
}

export function isInRange(value, min, max) {
    const number = Number(value);

    return number >= min && number <= max;
}

export function minLength(value, min) {
    return String(value).length >= min;
}

export function maxLength(value, max) {
    return String(value).length <= max;
}

export function isEmail(email) {
    const regex =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(email);
}

export function isURL(url) {
    try {
        new URL(url);

        return true;
    } catch {
        return false;
    }
}

export function isEmpty(value) {
    return (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
    );
}

export function validateNumberInput(
    value,
    {
        required = true,
        min = null,
        max = null,
    } = {}
) {

    if (required && !isRequired(value)) {
        return {
            valid: false,
            message: "Value is required."
        };
    }

    if (!isNumber(value)) {
        return {
            valid: false,
            message: "Invalid number."
        };
    }

    const number = Number(value);

    if (min !== null && number < min) {
        return {
            valid: false,
            message: `Minimum value is ${min}.`
        };
    }

    if (max !== null && number > max) {
        return {
            valid: false,
            message: `Maximum value is ${max}.`
        };
    }

    return {
        valid: true,
        message: ""
    };
}