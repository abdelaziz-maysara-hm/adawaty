/**
 * ============================================================================
 * Adawaty
 * Input Field
 * ----------------------------------------------------------------------------
 * Shared form input component.
 * ============================================================================
 */

class InputField extends HTMLElement {

    static get observedAttributes() {

        return [
            'label',
            'placeholder',
            'value',
            'type',
            'required',
            'disabled',
            'hint',
            'error'
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

    }

    attributeChangedCallback() {

        this.update();

    }

    render() {

        this.shadowRoot.innerHTML = `
            <style>

                :host{

                    display:block;

                    margin:1rem 0;

                }

                label{

                    display:block;

                    margin-bottom:.5rem;

                    font-weight:600;

                }

                input{

                    width:100%;

                    box-sizing:border-box;

                    padding:.75rem;

                    border:1px solid var(
                        --input-border,
                        #d1d5db
                    );

                    border-radius:8px;

                    font:inherit;

                    background:var(
                        --input-bg,
                        #fff
                    );

                    color:inherit;

                }

                input:focus{

                    outline:none;

                    border-color:var(
                        --primary-color,
                        #2563eb
                    );

                }

                .hint{

                    margin-top:.35rem;

                    font-size:.875rem;

                    color:#6b7280;

                }

                .error{

                    margin-top:.35rem;

                    font-size:.875rem;

                    color:#dc2626;

                    display:none;

                }

                :host([invalid]) .error{

                    display:block;

                }

            </style>

            <label></label>

            <input>

            <div class="hint"></div>

            <div
                class="error"
                role="alert"
            ></div>
        `;

    }

    update() {

        const label =
            this.shadowRoot.querySelector(
                'label'
            );

        const input =
            this.shadowRoot.querySelector(
                'input'
            );

        const hint =
            this.shadowRoot.querySelector(
                '.hint'
            );

        const error =
            this.shadowRoot.querySelector(
                '.error'
            );

        label.textContent =
            this.label;

        input.type =
            this.type;

        input.placeholder =
            this.placeholder;

        input.value =
            this.value;

        input.required =
            this.required;

        input.disabled =
            this.disabled;

        hint.textContent =
            this.hint;

        error.textContent =
            this.error;

    }
	
	    /**
     * Label property.
     */
    get label() {

        return this.getAttribute('label') ?? '';

    }

    set label(value) {

        this.setAttribute(
            'label',
            value ?? ''
        );

    }

    /**
     * Value property.
     */
    get value() {

        return this.getAttribute('value') ?? '';

    }

    set value(value) {

        this.setAttribute(
            'value',
            value ?? ''
        );

    }

    /**
     * Placeholder property.
     */
    get placeholder() {

        return this.getAttribute(
            'placeholder'
        ) ?? '';

    }

    set placeholder(value) {

        this.setAttribute(
            'placeholder',
            value ?? ''
        );

    }

    /**
     * Input type.
     */
    get type() {

        return this.getAttribute(
            'type'
        ) ?? 'text';

    }

    set type(value) {

        this.setAttribute(
            'type',
            value ?? 'text'
        );

    }

    /**
     * Hint property.
     */
    get hint() {

        return this.getAttribute(
            'hint'
        ) ?? '';

    }

    set hint(value) {

        this.setAttribute(
            'hint',
            value ?? ''
        );

    }

    /**
     * Error property.
     */
    get error() {

        return this.getAttribute(
            'error'
        ) ?? '';

    }

    set error(value) {

        this.setAttribute(
            'error',
            value ?? ''
        );

        if (value) {

            this.setAttribute(
                'invalid',
                ''
            );

        } else {

            this.removeAttribute(
                'invalid'
            );

        }

    }

    /**
     * Required state.
     */
    get required() {

        return this.hasAttribute(
            'required'
        );

    }

    set required(value) {

        this.toggleAttribute(
            'required',
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
     * Focuses the internal input.
     *
     * @returns {void}
     */
    focus() {

        this.shadowRoot
            ?.querySelector('input')
            ?.focus();

    }

    /**
     * Removes focus from the input.
     *
     * @returns {void}
     */
    blur() {

        this.shadowRoot
            ?.querySelector('input')
            ?.blur();

    }

    /**
     * Selects the current value.
     *
     * @returns {void}
     */
    select() {

        this.shadowRoot
            ?.querySelector('input')
            ?.select();

    }

    /**
     * Returns the native input element.
     *
     * @returns {HTMLInputElement|null}
     */
    getInput() {

        return this.shadowRoot
            ?.querySelector('input') ?? null;

    }
	
	    /**
     * Validates the current value.
     *
     * @returns {boolean}
     */
    validate() {

        const input = this.getInput();

        if (!input) {

            return false;

        }

        const valid = input.checkValidity();

        if (valid) {

            this.error = '';

        } else {

            this.error =
                input.validationMessage;

        }

        return valid;

    }

    /**
     * Clears the current value and error.
     *
     * @returns {InputField}
     */
    clear() {

        this.value = '';

        this.error = '';

        const input = this.getInput();

        if (input) {

            input.value = '';

        }

        return this;

    }

    /**
     * Resets the component.
     *
     * @returns {InputField}
     */
    reset() {

        return this.clear();

    }

    /**
     * Sets a custom validity message.
     *
     * @param {string} message
     * @returns {void}
     */
    setCustomValidity(message = '') {

        const input = this.getInput();

        if (!input) {

            return;

        }

        input.setCustomValidity(message);

        this.error = message;

    }

    /**
     * Registers internal event handlers.
     *
     * @returns {void}
     */
    bindEvents() {

        const input = this.getInput();

        if (!input || this._eventsBound) {

            return;

        }

        this._eventsBound = true;

        input.addEventListener(
            'input',
            () => {

                this.value = input.value;

                this.validate();

                this.dispatchEvent(
                    new CustomEvent(
                        'input',
                        {
                            detail: {
                                value: this.value
                            },
                            bubbles: true,
                            composed: true
                        }
                    )
                );

            }
        );

        input.addEventListener(
            'change',
            () => {

                this.dispatchEvent(
                    new CustomEvent(
                        'change',
                        {
                            detail: {
                                value: this.value
                            },
                            bubbles: true,
                            composed: true
                        }
                    )
                );

            }
        );

        input.addEventListener(
            'focus',
            () => {

                this.dispatchEvent(
                    new CustomEvent(
                        'focus',
                        {
                            bubbles: true,
                            composed: true
                        }
                    )
                );

            }
        );

        input.addEventListener(
            'blur',
            () => {

                this.validate();

                this.dispatchEvent(
                    new CustomEvent(
                        'blur',
                        {
                            detail: {
                                value: this.value,
                                valid: !this.error
                            },
                            bubbles: true,
                            composed: true
                        }
                    )
                );

            }
        );

    }
	
	    /**
     * Initializes the component.
     *
     * @returns {void}
     */
    connectedCallback() {

        this.update();

        this.bindEvents();

    }

    /**
     * Cleans up before removing
     * the component from the DOM.
     *
     * @returns {void}
     */
    disconnectedCallback() {

        this._eventsBound = false;

        this.error = '';

    }

}

/**
 * Register the custom element once.
 */
if (
    !customElements.get(
        'input-field'
    )
) {

    customElements.define(
        'input-field',
        InputField
    );

}

export default InputField;