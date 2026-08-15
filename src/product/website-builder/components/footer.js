import { escapeHtml, safeUrl } from '../render-utils.js';

function renderFooter(footer, spec) {
    const { content } = footer;
    const language = spec.site.language;
    const year = new Date().getFullYear();
    const name = content.name || spec.navigation.logoText || spec.site.name;

    const links = Array.isArray(content.links) ? content.links : [];
    const linksHtml = links.length > 0
        ? `<ul class="footer-links">${links.map((link) => `<li><a href="${safeUrl(link.href)}">${escapeHtml(link.label)}</a></li>`).join('')}</ul>`
        : '';

    return `<footer class="site-footer">
  <div class="section-inner footer-inner">
    <p class="footer-brand">${escapeHtml(name)}</p>
    ${linksHtml}
    <p class="footer-copyright">© ${year} ${escapeHtml(name)}. ${language === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
  </div>
</footer>`;
}

export { renderFooter };

// END OF FILE
