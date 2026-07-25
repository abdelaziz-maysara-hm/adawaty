/**
 * ============================================================================
 * Adawaty
 * Global Helper Functions
 * ============================================================================
 */

export const $ = (selector, parent = document) => parent.querySelector(selector);

export const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

export function createElement(tag, options = {}) {
    const element = document.createElement(tag);

    if (options.className) {
        element.className = options.className;
    }

    if (options.id) {
        element.id = options.id;
    }

    if (options.text) {
        element.textContent = options.text;
    }

    if (options.html) {
        element.innerHTML = options.html;
    }

    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }

    return element;
}

export function debounce(callback, delay = 300) {
    let timeout;

    return (...args) => {
        clearTimeout(timeout);

        timeout = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

export function throttle(callback, delay = 200) {
    let waiting = false;

    return (...args) => {

        if (waiting) return;

        callback(...args);

        waiting = true;

        setTimeout(() => {
            waiting = false;
        }, delay);
    };
}

export function formatNumber(number, locale = "en-US") {

    return new Intl.NumberFormat(locale).format(number);

}

export function round(number, decimals = 2) {

    return Number(number.toFixed(decimals));

}

export function clamp(value, min, max) {

    return Math.min(Math.max(value, min), max);

}

export function randomId(prefix = "id") {

    return `${prefix}-${crypto.randomUUID()}`;

}

export function copyToClipboard(text) {

    return navigator.clipboard.writeText(text);

}

export function downloadText(filename, text) {

    const blob = new Blob([text], {
        type: "text/plain;charset=utf-8"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);

}

export function isEmpty(value) {

    return (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
    );

}

export function capitalize(text) {

    if (!text) return "";

    return text.charAt(0).toUpperCase() + text.slice(1);

}

export function slugify(text) {

    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

}

export function sleep(ms) {

    return new Promise(resolve => setTimeout(resolve, ms));

}