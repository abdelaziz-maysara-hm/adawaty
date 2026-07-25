/**
 * ============================================================================
 * Adawaty
 * Action Bar
 * ----------------------------------------------------------------------------
 * Shared action buttons component.
 * ============================================================================
 */

class ActionBar extends HTMLElement {

    static get observedAttributes() {

        return [
            'loading',
            'disabled'
        ];

    }

    constructor() {

        super();

        this.attachShadow({

            mode: 'open'

        });

        this.render();

    }

    connectedCallback() {

        this.update();

        this.bindEvents();

    }

    attributeChangedCallback() {

        this.update();

    }

    render() {

        this.shadowRoot.innerHTML = `
            <style>

                :host{

                    display:flex;

                    flex-wrap:wrap;

                    gap:.75rem;

                    margin-top:1.5rem;

                }

                button{

                    appearance:none;

                    border:none;

                    border-radius:8px;

                    padding:.8rem 1.2rem;

                    cursor:pointer;

                    font:inherit;

                    transition:.2s;

                }

                button:disabled{

                    opacity:.6;

                    cursor:not-allowed;

                }

                .primary{

                    background:var(
                        --primary-color,
                        #2563eb
                    );

                    color:#fff;

                }

                .secondary{

                    background:#f3f4f6;

                }

                .danger{

                    background:#dc2626;

                    color:#fff;

                }

            </style>

            <button
                class="primary calculate"
                type="button"
            >
                Calculate
            </button>

            <button
                class="secondary reset"
                type="button"
            >
                Reset
            </button>

            <button
                class="secondary copy"
                type="button"
            >
                Copy
            </button>

            <button
                class="secondary share"
                type="button"
            >
                Share
            </button>

            <button
                class="secondary print"
                type="button"
            >
                Print
            </button>

        `;

    }

    update() {

        const disabled =
            this.disabled ||
            this.loading;

        this.shadowRoot
            .querySelectorAll('button')
            .forEach(button => {

                button.disabled =
                    disabled;

            });

    }
	
	    /**
     * Loading state.
     */
    get loading() {

        return this.hasAttribute(
            'loading'
        );

    }

    set loading(value) {

        this.toggleAttribute(
            'loading',
            Boolean(value)
        );

    }

    /**
     * Disabled state.
     */
    get disabled() {

        return this.hasAttribute(
            'disabled'
        );

    }

    set disabled(value) {

        this.toggleAttribute(
            'disabled',
            Boolean(value)
        );

    }

    /**
     * Enables all buttons.
     *
     * @returns {ActionBar}
     */
    enable() {

        this.disabled = false;

        this.update();

        return this;

    }

    /**
     * Disables all buttons.
     *
     * @returns {ActionBar}
     */
    disable() {

        this.disabled = true;

        this.update();

        return this;

    }

    /**
     * Starts loading mode.
     *
     * @returns {ActionBar}
     */
    startLoading() {

        this.loading = true;

        this.update();

        return this;

    }

    /**
     * Stops loading mode.
     *
     * @returns {ActionBar}
     */
    stopLoading() {

        this.loading = false;

        this.update();

        return this;

    }

    /**
     * Shows a button.
     *
     * @param {string} className
     * @returns {void}
     */
    showButton(className) {

        const button =
            this.shadowRoot?.querySelector(
                `.${className}`
            );

        if (!button) {

            return;

        }

        button.hidden = false;

    }

    /**
     * Hides a button.
     *
     * @param {string} className
     * @returns {void}
     */
    hideButton(className) {

        const button =
            this.shadowRoot?.querySelector(
                `.${className}`
            );

        if (!button) {

            return;

        }

        button.hidden = true;

    }

    /**
     * Returns a button by its class name.
     *
     * @param {string} className
     * @returns {HTMLButtonElement|null}
     */
    getButton(className) {

        return this.shadowRoot?.querySelector(
            `.${className}`
        ) ?? null;

    }

    /**
     * Changes a button label.
     *
     * @param {string} className
     * @param {string} text
     * @returns {void}
     */
    setButtonLabel(
        className,
        text
    ) {

        const button =
            this.getButton(className);

        if (!button) {

            return;

        }

        button.textContent = text;

    }
	
	    /**
     * Dispatches an action event.
     *
     * @param {string} action
     * @returns {void}
     */
    dispatchAction(action) {

        this.dispatchEvent(
            new CustomEvent(
                `action:${action}`,
                {
                    detail: {
                        action
                    },
                    bubbles: true,
                    composed: true
                }
            )
        );

    }

    /**
     * Registers button event listeners.
     *
     * @returns {void}
     */
    bindEvents() {

        if (this._eventsBound) {

            return;

        }

        this._eventsBound = true;

        const actions = [

            'calculate',

            'reset',

            'copy',

            'share',

            'print'

        ];

        actions.forEach(action => {

            const button =
                this.getButton(action);

            if (!button) {

                return;

            }

            button.addEventListener(
                'click',
                () => {

                    this.dispatchAction(
                        action
                    );

                }
            );

        });

    }

    /**
     * Clicks the Calculate button.
     *
     * @returns {void}
     */
    calculate() {

        this.dispatchAction(
            'calculate'
        );

    }

    /**
     * Clicks the Reset button.
     *
     * @returns {void}
     */
    reset() {

        this.dispatchAction(
            'reset'
        );

    }

    /**
     * Clicks the Copy button.
     *
     * @returns {void}
     */
    copy() {

        this.dispatchAction(
            'copy'
        );

    }

    /**
     * Clicks the Share button.
     *
     * @returns {void}
     */
    share() {

        this.dispatchAction(
            'share'
        );

    }

    /**
     * Clicks the Print button.
     *
     * @returns {void}
     */
    print() {

        this.dispatchAction(
            'print'
        );

    }
	
	    /**
     * Cleans up before removing the
     * component from the DOM.
     *
     * @returns {void}
     */
    disconnectedCallback() {

        this._eventsBound = false;

        this.loading = false;

        this.disabled = false;

    }

}

/**
 * Register the custom element once.
 */
if (
    !customElements.get(
        'action-bar'
    )
) {

    customElements.define(
        'action-bar',
        ActionBar
    );

}

export default ActionBar;

// END OF FILE