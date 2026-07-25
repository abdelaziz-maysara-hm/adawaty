/**
 * ============================================================================
 * Adawaty
 * Result Card
 * ----------------------------------------------------------------------------
 * Shared result component for all tools.
 * ============================================================================
 */

class ResultCard extends HTMLElement {

    static get observedAttributes() {

        return [
            'title',
            'value',
            'description',
            'variant'
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

                    border-radius:12px;

                    border:1px solid var(
                        --border-color,
                        #ddd
                    );

                    background:var(
                        --card-bg,
                        #fff
                    );

                    overflow:hidden;

                }

                .header{

                    padding:1rem;

                    border-bottom:1px solid #eee;

                    font-weight:600;

                }

                .body{

                    padding:1rem;

                }

                .value{

                    font-size:2rem;

                    font-weight:bold;

                    margin-bottom:.5rem;

                }

                .description{

                    line-height:1.6;

                    color:#666;

                }

                :host([variant="success"]){

                    border-color:#22c55e;

                }

                :host([variant="warning"]){

                    border-color:#f59e0b;

                }

                :host([variant="error"]){

                    border-color:#ef4444;

                }

                :host([variant="info"]){

                    border-color:#3b82f6;

                }

            </style>

            <div class="header"></div>

            <div class="body">

                <div class="value"></div>

                <div class="description"></div>

                <slot></slot>

            </div>
        `;

    }

    update() {

        this.shadowRoot
            .querySelector('.header')
            .textContent =
                this.title;

        this.shadowRoot
            .querySelector('.value')
            .textContent =
                this.value;

        this.shadowRoot
            .querySelector('.description')
            .textContent =
                this.description;

    }
	
	    /**
     * Title property.
     */
    get title() {

        return this.getAttribute('title') ?? '';

    }

    set title(value) {

        this.setAttribute(
            'title',
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
     * Description property.
     */
    get description() {

        return this.getAttribute(
            'description'
        ) ?? '';

    }

    set description(value) {

        this.setAttribute(
            'description',
            value ?? ''
        );

    }

    /**
     * Variant property.
     */
    get variant() {

        return this.getAttribute(
            'variant'
        ) ?? 'info';

    }

    set variant(value) {

        this.setAttribute(
            'variant',
            value ?? 'info'
        );

    }

    /**
     * Updates the component data.
     *
     * @param {Object} data
     * @returns {ResultCard}
     */
    setData(data = {}) {

        if ('title' in data) {

            this.title = data.title;

        }

        if ('value' in data) {

            this.value = data.value;

        }

        if ('description' in data) {

            this.description =
                data.description;

        }

        if ('variant' in data) {

            this.variant =
                data.variant;

        }

        return this;

    }

    /**
     * Clears the current result.
     *
     * @returns {ResultCard}
     */
    clear() {

        this.setData({

            title: '',
            value: '',
            description: '',
            variant: 'info'

        });

        return this;

    }

    /**
     * Checks whether the card
     * contains a result.
     *
     * @returns {boolean}
     */
    hasValue() {

        return this.value !== '';

    }

    /**
     * Returns the current data.
     *
     * @returns {Object}
     */
    getData() {

        return {

            title: this.title,
            value: this.value,
            description: this.description,
            variant: this.variant

        };

    }
	
	    /**
     * Shows the result card.
     *
     * @returns {ResultCard}
     */
    show() {

        this.hidden = false;

        return this;

    }

    /**
     * Hides the result card.
     *
     * @returns {ResultCard}
     */
    hide() {

        this.hidden = true;

        return this;

    }

    /**
     * Copies the result value.
     *
     * @returns {Promise<void>}
     */
    async copy() {

        if (!this.hasValue()) {

            return;

        }

        await navigator.clipboard.writeText(
            this.value
        );

        this.dispatchEvent(
            new CustomEvent(
                'result:copy',
                {
                    detail: this.getData(),
                    bubbles: true,
                    composed: true
                }
            )
        );

    }

    /**
     * Shares the current result.
     *
     * @returns {Promise<void>}
     */
    async share() {

        if (
            !navigator.share ||
            !this.hasValue()
        ) {

            return;

        }

        await navigator.share({

            title: this.title,

            text: `${this.title}\n${this.value}\n${this.description}`

        });

        this.dispatchEvent(
            new CustomEvent(
                'result:share',
                {
                    detail: this.getData(),
                    bubbles: true,
                    composed: true
                }
            )
        );

    }

    /**
     * Prints the current page.
     *
     * @returns {void}
     */
    print() {

        window.print();

        this.dispatchEvent(
            new CustomEvent(
                'result:print',
                {
                    detail: this.getData(),
                    bubbles: true,
                    composed: true
                }
            )
        );

    }

    /**
     * Focuses the card.
     *
     * @returns {void}
     */
    focusCard() {

        this.setAttribute(
            'tabindex',
            '-1'
        );

        this.focus();

    }

    /**
     * Scrolls the card into view.
     *
     * @returns {void}
     */
    scrollIntoViewIfNeeded() {

        this.scrollIntoView({

            behavior: 'smooth',

            block: 'nearest'

        });

    }
	
	    /**
     * Cleans up before the component
     * is removed from the DOM.
     *
     * @returns {void}
     */
    disconnectedCallback() {

        this.clear();

        this.removeAttribute(
            'tabindex'
        );

    }

}

/**
 * Register the custom element once.
 */
if (
    !customElements.get(
        'result-card'
    )
) {

    customElements.define(
        'result-card',
        ResultCard
    );

}

export default ResultCard;