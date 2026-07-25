/**
 * ============================================================================
 * Adawaty
 * DOM Utilities
 * ----------------------------------------------------------------------------
 * Shared DOM helper functions.
 * ============================================================================
 */

/**
 * Returns the first matching element.
 *
 * @param {string} selector
 * @param {ParentNode} [parent=document]
 * @returns {HTMLElement|null}
 */
export function $(selector, parent = document) {

    return parent.querySelector(selector);

}

/**
 * Returns all matching elements.
 *
 * @param {string} selector
 * @param {ParentNode} [parent=document]
 * @returns {HTMLElement[]}
 */
export function $$(selector, parent = document) {

    return [...parent.querySelectorAll(selector)];

}

/**
 * Creates an HTML element.
 *
 * @param {string} tag
 * @param {Object} [attributes={}]
 * @returns {HTMLElement}
 */
export function createElement(
    tag,
    attributes = {}
) {

    const element =
        document.createElement(tag);

    setAttributes(
        element,
        attributes
    );

    return element;

}

/**
 * Sets element attributes.
 *
 * @param {HTMLElement} element
 * @param {Object} attributes
 * @returns {HTMLElement}
 */
export function setAttributes(
    element,
    attributes = {}
) {

    for (
        const [name, value]
        of Object.entries(attributes)
    ) {

        if (
            value === null ||
            value === undefined
        ) {
            continue;
        }

        element.setAttribute(
            name,
            String(value)
        );

    }

    return element;

}

/**
 * Appends children.
 *
 * @param {HTMLElement} parent
 * @param {...Node} children
 * @returns {HTMLElement}
 */
export function append(
    parent,
    ...children
) {

    parent.append(...children);

    return parent;

}

/**
 * Prepends children.
 *
 * @param {HTMLElement} parent
 * @param {...Node} children
 * @returns {HTMLElement}
 */
export function prepend(
    parent,
    ...children
) {

    parent.prepend(...children);

    return parent;

}

/**
 * Removes an element from the DOM.
 *
 * @param {HTMLElement|null} element
 * @returns {void}
 */
export function remove(element) {

    element?.remove();

}

/**
 * Removes all child nodes.
 *
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
export function empty(element) {

    element.replaceChildren();

    return element;

}

/**
 * Shows an element.
 *
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
export function show(element) {

    element.hidden = false;

    return element;

}

/**
 * Hides an element.
 *
 * @param {HTMLElement} element
 * @returns {HTMLElement}
 */
export function hide(element) {

    element.hidden = true;

    return element;

}

/**
 * Toggles element visibility.
 *
 * @param {HTMLElement} element
 * @param {boolean} [visible]
 * @returns {HTMLElement}
 */
export function toggle(
    element,
    visible
) {

    if (typeof visible === 'boolean') {

        element.hidden = !visible;

        return element;

    }

    element.hidden = !element.hidden;

    return element;

}

/**
 * Replaces element text content.
 *
 * @param {HTMLElement} element
 * @param {string} text
 * @returns {HTMLElement}
 */
export function text(
    element,
    text
) {

    element.textContent = text;

    return element;

}

/**
 * Replaces element HTML.
 *
 * Use only with trusted HTML.
 *
 * @param {HTMLElement} element
 * @param {string} html
 * @returns {HTMLElement}
 */
export function html(
    element,
    html
) {

    element.innerHTML = html;

    return element;

}

/**
 * Adds one or more CSS classes.
 *
 * @param {HTMLElement} element
 * @param {...string} classes
 * @returns {HTMLElement}
 */
export function addClass(
    element,
    ...classes
) {

    element.classList.add(...classes);

    return element;

}

/**
 * Removes one or more CSS classes.
 *
 * @param {HTMLElement} element
 * @param {...string} classes
 * @returns {HTMLElement}
 */
export function removeClass(
    element,
    ...classes
) {

    element.classList.remove(...classes);

    return element;

}

/**
 * Toggles a CSS class.
 *
 * @param {HTMLElement} element
 * @param {string} className
 * @param {boolean} [force]
 * @returns {HTMLElement}
 */
export function toggleClass(
    element,
    className,
    force
) {

    if (typeof force === 'boolean') {

        element.classList.toggle(
            className,
            force
        );

    } else {

        element.classList.toggle(
            className
        );

    }

    return element;

}

/**
 * Checks whether an element has a CSS class.
 *
 * @param {HTMLElement} element
 * @param {string} className
 * @returns {boolean}
 */
export function hasClass(
    element,
    className
) {

    return element.classList.contains(
        className
    );

}

/**
 * Replaces a CSS class.
 *
 * @param {HTMLElement} element
 * @param {string} oldClass
 * @param {string} newClass
 * @returns {HTMLElement}
 */
export function replaceClass(
    element,
    oldClass,
    newClass
) {

    element.classList.replace(
        oldClass,
        newClass
    );

    return element;

}

/**
 * Adds an event listener.
 *
 * @param {EventTarget} target
 * @param {string} event
 * @param {EventListener} listener
 * @param {AddEventListenerOptions|boolean} [options]
 * @returns {Function}
 */
export function on(
    target,
    event,
    listener,
    options
) {

    target.addEventListener(
        event,
        listener,
        options
    );

    return () => off(
        target,
        event,
        listener,
        options
    );

}

/**
 * Removes an event listener.
 *
 * @param {EventTarget} target
 * @param {string} event
 * @param {EventListener} listener
 * @param {EventListenerOptions|boolean} [options]
 * @returns {void}
 */
export function off(
    target,
    event,
    listener,
    options
) {

    target.removeEventListener(
        event,
        listener,
        options
    );

}