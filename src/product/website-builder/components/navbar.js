import { escapeHtml, safeUrl } from '../render-utils.js';

/**
 * Renders the site navigation bar. Not a "section" in the reorderable
 * sections array -- every generated site has exactly one, driven by
 * spec.navigation.
 */
function renderNavbar(spec) {
    const { navigation, site } = spec;
    const logo = navigation.logoText || site.name || 'Brand';

    const linksHtml = navigation.links
        .map((link) => `<li><a href="${safeUrl(link.href)}">${escapeHtml(link.label)}</a></li>`)
        .join('');

    const ctaHtml = navigation.ctaLabel
        ? `<a class="nav-cta" href="${safeUrl(navigation.ctaHref)}">${escapeHtml(navigation.ctaLabel)}</a>`
        : '';

    return `<header class="site-nav">
  <div class="nav-inner">
    <a class="nav-logo" href="#top">${escapeHtml(logo)}</a>
    <nav aria-label="${site.language === 'ar' ? 'التنقل الرئيسي' : 'Main navigation'}">
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-menu">
        <span></span><span></span><span></span>
        <span class="sr-only">${site.language === 'ar' ? 'فتح القائمة' : 'Open menu'}</span>
      </button>
      <ul class="nav-links" id="nav-menu">${linksHtml}</ul>
    </nav>
    ${ctaHtml}
  </div>
</header>`;
}

export { renderNavbar };

// END OF FILE
