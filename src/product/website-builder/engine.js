import { validateWebsiteSpec } from './schema.js';
import { escapeHtml, escapeAttr, safeHexColor } from './render-utils.js';
import { renderNavbar } from './components/navbar.js';
import { renderHero } from './components/hero.js';
import { renderFeatures } from './components/features.js';
import { renderServices } from './components/services.js';
import { renderAbout } from './components/about.js';
import { renderStats } from './components/stats.js';
import { renderGallery } from './components/gallery.js';
import { renderTestimonials } from './components/testimonials.js';
import { renderPricing } from './components/pricing.js';
import { renderFaq } from './components/faq.js';
import { renderContact } from './components/contact.js';
import { renderCta } from './components/cta.js';
import { renderFooter } from './components/footer.js';

/**
 * "WebsiteSpec -> deterministic renderer -> generated website" is the
 * whole architecture: this is the one function a future AI-generated spec
 * would also flow through, after validateWebsiteSpec. No AI-specific
 * assumptions live here.
 */
const SECTION_RENDERERS = Object.freeze({
    hero: (section) => renderHero(section),
    features: (section) => renderFeatures(section),
    services: (section) => renderServices(section),
    about: (section) => renderAbout(section),
    stats: (section) => renderStats(section),
    gallery: (section) => renderGallery(section),
    testimonials: (section) => renderTestimonials(section),
    pricing: (section) => renderPricing(section),
    faq: (section) => renderFaq(section),
    contact: (section, spec) => renderContact(section, spec),
    cta: (section) => renderCta(section),
});

function renderSection(section, spec) {
    const renderer = SECTION_RENDERERS[section.type];
    return renderer ? renderer(section, spec) : '';
}

const FONT_STACKS = Object.freeze({
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, "Noto Sans Arabic", sans-serif',
    serif: 'Georgia, "Times New Roman", "Noto Naskh Arabic", serif',
    mono: '"SF Mono", "Cascadia Code", Consolas, "Courier New", monospace',
    rounded: '"Segoe UI Rounded", "Nunito", "Noto Sans Arabic", sans-serif',
});

function buildThemeCss(theme) {
    const primary = safeHexColor(theme.primary, '#2563eb');
    const secondary = safeHexColor(theme.secondary, '#f59e0b');
    const background = safeHexColor(theme.background, theme.mode === 'dark' ? '#0b1120' : '#ffffff');
    const text = safeHexColor(theme.text, theme.mode === 'dark' ? '#e5e7eb' : '#111827');
    const fontFamily = FONT_STACKS[theme.fontFamily] ?? FONT_STACKS.system;
    const surface = theme.mode === 'dark' ? '#111827' : '#f8fafc';
    const border = theme.mode === 'dark' ? '#1f2937' : '#e5e7eb';

    return `:root {
  --primary: ${primary};
  --secondary: ${secondary};
  --background: ${background};
  --text: ${text};
  --surface: ${surface};
  --border: ${border};
  --font-family: ${fontFamily};
}`;
}

function buildDocumentHead(spec, extraCssHref, extraJsSrc) {
    const { site } = spec;
    const title = escapeHtml(site.name || 'My Website');
    const description = escapeAttr(spec.sections.find((section) => section.type === 'hero')?.content?.subheadline || site.name || '');

    return `<meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="stylesheet" href="${escapeAttr(extraCssHref)}">`
        + (extraJsSrc ? `\n  <script defer src="${escapeAttr(extraJsSrc)}"></script>` : '');
}

/**
 * Renders a full HTML document for the given spec. `assetPaths` lets the
 * exporter and the live preview point at different relative paths for the
 * stylesheet/script (a real exported file vs. an inline blob URL).
 */
function renderDocument(rawSpec, assetPaths = { css: 'assets/css/style.css', js: 'assets/js/main.js' }) {
    const { spec } = validateWebsiteSpec(rawSpec);
    const { site } = spec;

    const bodyHtml = [
        renderNavbar(spec),
        `<main id="top">${spec.sections.map((section) => renderSection(section, spec)).join('\n')}</main>`,
        renderFooter(spec.footer, spec),
    ].join('\n');

    const hasContactForm = spec.sections.some((section) => section.type === 'contact' && section.content?.showForm !== false);

    return `<!doctype html>
<html lang="${site.language}" dir="${site.direction}">
<head>
  ${buildDocumentHead(spec, assetPaths.css, hasContactForm ? assetPaths.js : '')}
</head>
<body>
${bodyHtml}
</body>
</html>
`;
}

function renderThemeStyles(rawSpec) {
    const { spec } = validateWebsiteSpec(rawSpec);
    return buildThemeCss(spec.theme);
}

/** Renders {html, css, js} for a full website: the shape both the exporter and the live preview consume. */
function renderWebsite(rawSpec, options = {}) {
    const { spec } = validateWebsiteSpec(rawSpec);
    const assetPaths = options.assetPaths ?? { css: 'assets/css/style.css', js: 'assets/js/main.js' };

    const html = renderDocument(spec, assetPaths);
    const themeCss = buildThemeCss(spec.theme);
    const hasContactForm = spec.sections.some((section) => section.type === 'contact' && section.content?.showForm !== false);

    return Object.freeze({
        html,
        themeCss,
        needsJs: hasContactForm,
        spec,
    });
}

export {
    renderWebsite, renderDocument, renderThemeStyles, buildThemeCss, SECTION_RENDERERS,
};

// END OF FILE
