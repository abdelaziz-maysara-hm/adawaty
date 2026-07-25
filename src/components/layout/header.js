/**
 * ============================================================================
 * Adawaty
 * App Header
 * ============================================================================
 */

class AppHeader extends HTMLElement {

    connectedCallback() {

        this.render();

    }

    render() {

        this.innerHTML = `
<header class="app-header">

    <div class="container">

        <a href="/" class="logo">

            Adawaty

        </a>

        <nav class="main-nav">

            <a href="/">Home</a>

            <a href="/tools/">Tools</a>

            <a href="/categories/">Categories</a>

            <a href="/articles/">Articles</a>

        </nav>

        <div class="header-actions">

            <button
                id="theme-toggle"
                aria-label="Toggle Theme">

                🌙

            </button>

            <button
                id="language-toggle"
                aria-label="Change Language">

                العربية

            </button>

        </div>

    </div>

</header>
`;

    }

}

customElements.define(
    "app-header",
    AppHeader
);

export default AppHeader;