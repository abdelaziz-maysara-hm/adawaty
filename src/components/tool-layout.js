/**
 * ============================================================================
 * Adawaty
 * Tool Layout Component
 * ----------------------------------------------------------------------------
 * Shared layout used by all tools.
 * ============================================================================
 */

class ToolLayout extends HTMLElement {

    constructor() {

        super();

        this.attachShadow({
            mode: 'open'
        });

    }

    connectedCallback() {

        this.render();

    }

    /**
     * Renders the component.
     *
     * @returns {void}
     */
    render() {

        this.shadowRoot.innerHTML = `
            <style>
                :host{
                    display:block;
                    width:100%;
                }

                .tool{
                    display:flex;
                    flex-direction:column;
                    gap:2rem;
                }

                .tool__header{
                    display:flex;
                    flex-direction:column;
                    gap:.75rem;
                }

                .tool__title{
                    margin:0;
                }

                .tool__description{
                    margin:0;
                }

                .tool__content{
                    display:flex;
                    flex-direction:column;
                    gap:2rem;
                }

                .tool__form{
                    display:block;
                }

                .tool__result{
                    display:block;
                }

                .tool__actions{
                    display:flex;
                    flex-wrap:wrap;
                    gap:.75rem;
                }

                .tool__footer{
                    display:flex;
                    flex-direction:column;
                    gap:2rem;
                }
            </style>

            <article class="tool">

                <header class="tool__header">

                    <slot name="title"></slot>

                    <slot name="description"></slot>

                </header>

                <section class="tool__content">

                    <section class="tool__form">

                        <slot name="form"></slot>

                    </section>

                    <section class="tool__result">

                        <slot name="result"></slot>

                    </section>

                    <section class="tool__actions">

                        <slot name="actions"></slot>

                    </section>

                </section>

                <footer class="tool__footer">

                    <slot name="faq"></slot>

                    <slot name="related"></slot>

                </footer>

            </article>
        `;

    }
	
	    /**
     * Attributes observed by the component.
     *
     * @returns {string[]}
     */
    static get observedAttributes() {

        return [
            'title',
            'description'
        ];

    }

    /**
     * Called when an observed attribute changes.
     *
     * @param {string} name
     * @param {string|null} oldValue
     * @param {string|null} newValue
     * @returns {void}
     */
    attributeChangedCallback(
        name,
        oldValue,
        newValue
    ) {

        if (oldValue === newValue) {
            return;
        }

        switch (name) {

            case 'title':
                this.updateTitle(newValue);
                break;

            case 'description':
                this.updateDescription(newValue);
                break;

            default:
                break;

        }

    }

    /**
     * Updates the title.
     *
     * Used only when no slotted title exists.
     *
     * @param {string|null} value
     * @returns {void}
     */
    updateTitle(value) {

        const slot = this.shadowRoot.querySelector(
            'slot[name="title"]'
        );

        if (
            slot &&
            slot.assignedElements().length > 0
        ) {
            return;
        }

        let element = this.shadowRoot.querySelector(
            '.tool__generated-title'
        );

        if (!element) {

            element = document.createElement('h1');

            element.className =
                'tool__title tool__generated-title';

            const header =
                this.shadowRoot.querySelector(
                    '.tool__header'
                );

            header.prepend(element);

        }

        element.textContent = value ?? '';

    }

    /**
     * Updates the description.
     *
     * Used only when no slotted description exists.
     *
     * @param {string|null} value
     * @returns {void}
     */
    updateDescription(value) {

        const slot = this.shadowRoot.querySelector(
            'slot[name="description"]'
        );

        if (
            slot &&
            slot.assignedElements().length > 0
        ) {
            return;
        }

        let element = this.shadowRoot.querySelector(
            '.tool__generated-description'
        );

        if (!element) {

            element = document.createElement('p');

            element.className =
                'tool__description tool__generated-description';

            const header =
                this.shadowRoot.querySelector(
                    '.tool__header'
                );

            header.append(element);

        }

        element.textContent = value ?? '';

    }

    /**
     * Returns the title attribute.
     *
     * @returns {string}
     */
    get title() {

        return this.getAttribute('title') ?? '';

    }

    /**
     * Returns the description attribute.
     *
     * @returns {string}
     */
    get description() {

        return this.getAttribute('description') ?? '';

    }
	
	    /**
     * Shows the loading state.
     *
     * @returns {void}
     */
    showLoading() {

        this.setAttribute(
            'aria-busy',
            'true'
        );

        this.classList.add(
            'is-loading'
        );

    }

    /**
     * Hides the loading state.
     *
     * @returns {void}
     */
    hideLoading() {

        this.removeAttribute(
            'aria-busy'
        );

        this.classList.remove(
            'is-loading'
        );

    }

    /**
     * Displays an error message.
     *
     * @param {string} message
     * @returns {void}
     */
    showError(message) {

        let element = this.shadowRoot.querySelector(
            '.tool__error'
        );

        if (!element) {

            element = document.createElement(
                'div'
            );

            element.className =
                'tool__error';

            element.setAttribute(
                'role',
                'alert'
            );

            element.setAttribute(
                'aria-live',
                'assertive'
            );

            const content =
                this.shadowRoot.querySelector(
                    '.tool__content'
                );

            content.prepend(element);

        }

        element.hidden = false;

        element.textContent =
            message ?? 'Unexpected error.';

    }

    /**
     * Removes the error message.
     *
     * @returns {void}
     */
    clearError() {

        const element =
            this.shadowRoot.querySelector(
                '.tool__error'
            );

        if (!element) {
            return;
        }

        element.hidden = true;

        element.textContent = '';

    }

    /**
     * Clears the result container.
     *
     * @returns {void}
     */
    clearResult() {

        const slot =
            this.shadowRoot.querySelector(
                'slot[name="result"]'
            );

        if (!slot) {
            return;
        }

        const elements =
            slot.assignedElements();

        for (const element of elements) {

            element.replaceChildren();

        }

    }

    /**
     * Enables accessibility attributes.
     *
     * @returns {void}
     */
    setupAccessibility() {

        this.setAttribute(
            'role',
            'region'
        );

        this.setAttribute(
            'aria-live',
            'polite'
        );

    }
	
	    /**
     * Shows the loading state.
     *
     * @returns {void}
     */
    showLoading() {

        this.setAttribute(
            'aria-busy',
            'true'
        );

        this.classList.add(
            'is-loading'
        );

    }

    /**
     * Hides the loading state.
     *
     * @returns {void}
     */
    hideLoading() {

        this.removeAttribute(
            'aria-busy'
        );

        this.classList.remove(
            'is-loading'
        );

    }

    /**
     * Displays an error message.
     *
     * @param {string} message
     * @returns {void}
     */
    showError(message) {

        let element = this.shadowRoot.querySelector(
            '.tool__error'
        );

        if (!element) {

            element = document.createElement(
                'div'
            );

            element.className =
                'tool__error';

            element.setAttribute(
                'role',
                'alert'
            );

            element.setAttribute(
                'aria-live',
                'assertive'
            );

            const content =
                this.shadowRoot.querySelector(
                    '.tool__content'
                );

            content.prepend(element);

        }

        element.hidden = false;

        element.textContent =
            message ?? 'Unexpected error.';

    }

    /**
     * Removes the error message.
     *
     * @returns {void}
     */
    clearError() {

        const element =
            this.shadowRoot.querySelector(
                '.tool__error'
            );

        if (!element) {
            return;
        }

        element.hidden = true;

        element.textContent = '';

    }

    /**
     * Clears the result container.
     *
     * @returns {void}
     */
    clearResult() {

        const slot =
            this.shadowRoot.querySelector(
                'slot[name="result"]'
            );

        if (!slot) {
            return;
        }

        const elements =
            slot.assignedElements();

        for (const element of elements) {

            element.replaceChildren();

        }

    }

    /**
     * Enables accessibility attributes.
     *
     * @returns {void}
     */
    setupAccessibility() {

        this.setAttribute(
            'role',
            'region'
        );

        this.setAttribute(
            'aria-live',
            'polite'
        );

    }