/**
 * ============================================================================
 * Adawaty
 * App Footer
 * ============================================================================
 */

class AppFooter extends HTMLElement {

    connectedCallback() {

        this.render();

    }

    render() {

        const year = new Date().getFullYear();

        this.innerHTML = `
<footer class="app-footer">

    <div class="container">

        <div class="footer-brand">

            <h3>Adawaty</h3>

            <p>
                Free Online Tools for Everyone.
            </p>

        </div>

        <nav class="footer-links">

            <a href="/about/">
                About
            </a>

            <a href="/privacy/">
                Privacy
            </a>

            <a href="/terms/">
                Terms
            </a>

            <a href="/contact/">
                Contact
            </a>

        </nav>

        <div class="footer-copy">

            © ${year} Adawaty

        </div>

    </div>

</footer>
`;

    }

}

customElements.define(
    "app-footer",
    AppFooter
);

export default AppFooter;