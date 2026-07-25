/**
 * ============================================================================
 * Adawaty
 * Calculator Layout Component
 * ============================================================================
 */

class CalculatorLayout extends HTMLElement {

    connectedCallback() {

        this.render();

    }

    render() {

        this.innerHTML = `

<section class="tool-layout">

    <header class="tool-header">

        <h1 id="tool-title"></h1>

        <p id="tool-description"></p>

    </header>

    <section
        id="tool-form"
        class="tool-form">

    </section>

    <section
        id="tool-result"
        class="tool-result">

    </section>

    <section
        id="tool-faq"
        class="tool-faq">

    </section>

    <section
        id="related-tools"
        class="related-tools">

    </section>

</section>

`;

    }

}

customElements.define(
    'calculator-layout',
    CalculatorLayout
);

export default CalculatorLayout;