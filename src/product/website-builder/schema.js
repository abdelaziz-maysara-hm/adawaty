/**
 * WebsiteSpec: the single source of truth for the Website Builder.
 *
 * The builder UI never renders directly from ad-hoc state -- every visible
 * change updates a WebsiteSpec object, and the renderer (engine.js) turns
 * that spec into HTML/CSS/JS deterministically. This is deliberate: a
 * future AI layer only needs to produce a valid WebsiteSpec and hand it to
 * the exact same renderer, no separate code path.
 *
 * Shape (see createDefaultSpec for a concrete example):
 * {
 *   version: 1,
 *   site: { name, language, direction, type },
 *   theme: { mode, primary, secondary, background, text, fontFamily },
 *   navigation: { logoText, links: [{ label, href }], ctaLabel, ctaHref },
 *   sections: [ { id, type, variant, content, settings } ],
 *   footer: { id, type: 'footer', variant, content, settings },
 * }
 *
 * `navigation` and `footer` are fixed, single, non-reorderable parts of
 * every generated site. `sections` is the ordered, editable middle content
 * (hero, features, about, ...) that the builder UI lets a user add,
 * remove, and reorder.
 */

const SCHEMA_VERSION = 1;

const SITE_TYPES = Object.freeze(['business', 'portfolio', 'landing', 'agency', 'restaurant', 'catalog']);
const LANGUAGES = Object.freeze(['ar', 'en']);
const THEME_MODES = Object.freeze(['light', 'dark']);
const FONT_FAMILIES = Object.freeze([
    'system', 'serif', 'mono', 'rounded',
]);
const SECTION_TYPES = Object.freeze([
    'hero', 'features', 'services', 'about', 'stats', 'gallery',
    'testimonials', 'pricing', 'faq', 'contact', 'cta',
]);

const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const DEFAULT_THEME = Object.freeze({
    mode: 'light',
    primary: '#2563eb',
    secondary: '#f59e0b',
    background: '#ffffff',
    text: '#111827',
    fontFamily: 'system',
});

function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function sanitizeColor(value, fallback) {
    return typeof value === 'string' && HEX_COLOR_PATTERN.test(value.trim()) ? value.trim() : fallback;
}

function sanitizeHref(value, fallback = '#') {
    if (typeof value !== 'string') return fallback;
    const trimmed = value.trim();
    if (trimmed.length === 0) return fallback;
    // Reject anything that could execute script or escape a normal link
    // context: javascript:, data:, vbscript: URIs are never valid here.
    if (/^\s*(javascript|data|vbscript):/i.test(trimmed)) return fallback;
    return trimmed;
}

let sectionIdCounter = 0;
function generateSectionId(prefix = 'section') {
    sectionIdCounter += 1;
    return `${prefix}-${Date.now().toString(36)}-${sectionIdCounter}`;
}

/** Normalizes one section object, defaulting/discarding anything unsafe rather than throwing. */
function normalizeSection(rawSection, errors) {
    if (!isPlainObject(rawSection)) {
        errors.push('A section entry was not an object and was skipped.');
        return null;
    }

    const type = SECTION_TYPES.includes(rawSection.type) ? rawSection.type : null;
    if (!type) {
        errors.push(`Unsupported section type "${String(rawSection.type)}" was skipped.`);
        return null;
    }

    return Object.freeze({
        id: isNonEmptyString(rawSection.id) ? rawSection.id : generateSectionId(type),
        type,
        variant: isNonEmptyString(rawSection.variant) ? rawSection.variant : 'default',
        content: isPlainObject(rawSection.content) ? Object.freeze({ ...rawSection.content }) : Object.freeze({}),
        settings: isPlainObject(rawSection.settings) ? Object.freeze({ ...rawSection.settings }) : Object.freeze({}),
    });
}

function normalizeNavigation(rawNavigation) {
    const nav = isPlainObject(rawNavigation) ? rawNavigation : {};
    const links = Array.isArray(nav.links)
        ? nav.links
            .filter((link) => isPlainObject(link) && isNonEmptyString(link.label))
            .slice(0, 8)
            .map((link) => Object.freeze({
                label: String(link.label).slice(0, 60),
                href: sanitizeHref(link.href, '#'),
            }))
        : [];

    return Object.freeze({
        logoText: isNonEmptyString(nav.logoText) ? String(nav.logoText).slice(0, 40) : '',
        links: Object.freeze(links),
        ctaLabel: isNonEmptyString(nav.ctaLabel) ? String(nav.ctaLabel).slice(0, 40) : '',
        ctaHref: sanitizeHref(nav.ctaHref, '#contact'),
    });
}

function normalizeFooter(rawFooter) {
    if (isPlainObject(rawFooter) && rawFooter.type === 'footer') {
        return Object.freeze({
            id: isNonEmptyString(rawFooter.id) ? rawFooter.id : 'footer',
            type: 'footer',
            variant: isNonEmptyString(rawFooter.variant) ? rawFooter.variant : 'simple',
            content: isPlainObject(rawFooter.content) ? Object.freeze({ ...rawFooter.content }) : Object.freeze({}),
            settings: Object.freeze({}),
        });
    }
    return Object.freeze({
        id: 'footer', type: 'footer', variant: 'simple', content: Object.freeze({}), settings: Object.freeze({}),
    });
}

/**
 * Validates and normalizes an arbitrary value into a safe WebsiteSpec.
 * Never throws: unsupported/malformed pieces are dropped (with a reason
 * recorded in `errors`) and replaced with safe defaults, so a corrupted
 * localStorage entry or a future AI-produced spec with a mistake in one
 * section can't break the whole builder.
 *
 * @returns {{ spec: object, errors: string[], valid: boolean }}
 *   `valid` is true only if the input needed no corrections at all.
 */
function validateWebsiteSpec(rawSpec) {
    const errors = [];

    if (!isPlainObject(rawSpec)) {
        return { spec: createDefaultSpec('business'), errors: ['Input was not an object; a default spec was used.'], valid: false };
    }

    const rawSite = isPlainObject(rawSpec.site) ? rawSpec.site : {};
    const site = Object.freeze({
        name: isNonEmptyString(rawSite.name) ? String(rawSite.name).slice(0, 80) : 'My Website',
        language: LANGUAGES.includes(rawSite.language) ? rawSite.language : 'en',
        direction: rawSite.language === 'ar' ? 'rtl' : 'ltr',
        type: SITE_TYPES.includes(rawSite.type) ? rawSite.type : 'business',
    });
    if (!SITE_TYPES.includes(rawSite.type)) errors.push(`Unsupported site type; defaulted to "business".`);

    const rawTheme = isPlainObject(rawSpec.theme) ? rawSpec.theme : {};
    const theme = Object.freeze({
        mode: THEME_MODES.includes(rawTheme.mode) ? rawTheme.mode : DEFAULT_THEME.mode,
        primary: sanitizeColor(rawTheme.primary, DEFAULT_THEME.primary),
        secondary: sanitizeColor(rawTheme.secondary, DEFAULT_THEME.secondary),
        background: sanitizeColor(rawTheme.background, DEFAULT_THEME.background),
        text: sanitizeColor(rawTheme.text, DEFAULT_THEME.text),
        fontFamily: FONT_FAMILIES.includes(rawTheme.fontFamily) ? rawTheme.fontFamily : DEFAULT_THEME.fontFamily,
    });

    const navigation = normalizeNavigation(rawSpec.navigation);
    const footer = normalizeFooter(rawSpec.footer);

    const rawSections = Array.isArray(rawSpec.sections) ? rawSpec.sections : [];
    if (!Array.isArray(rawSpec.sections)) errors.push('Sections list was missing or invalid; started with an empty page.');
    const sections = Object.freeze(
        rawSections
            .map((section) => normalizeSection(section, errors))
            .filter((section) => section !== null),
    );

    const spec = Object.freeze({
        version: SCHEMA_VERSION,
        site,
        theme,
        navigation,
        sections,
        footer,
    });

    return { spec, errors, valid: errors.length === 0 };
}

function createDefaultSpec(siteType = 'business') {
    const type = SITE_TYPES.includes(siteType) ? siteType : 'business';
    return Object.freeze({
        version: SCHEMA_VERSION,
        site: Object.freeze({
            name: 'My Website', language: 'en', direction: 'ltr', type,
        }),
        theme: Object.freeze({ ...DEFAULT_THEME }),
        navigation: Object.freeze({
            logoText: 'Brand',
            links: Object.freeze([
                Object.freeze({ label: 'Home', href: '#home' }),
                Object.freeze({ label: 'About', href: '#about' }),
                Object.freeze({ label: 'Contact', href: '#contact' }),
            ]),
            ctaLabel: 'Get Started',
            ctaHref: '#contact',
        }),
        sections: Object.freeze([]),
        footer: Object.freeze({
            id: 'footer', type: 'footer', variant: 'simple', content: Object.freeze({}), settings: Object.freeze({}),
        }),
    });
}

export {
    SCHEMA_VERSION,
    SITE_TYPES,
    LANGUAGES,
    THEME_MODES,
    FONT_FAMILIES,
    SECTION_TYPES,
    DEFAULT_THEME,
    validateWebsiteSpec,
    createDefaultSpec,
    generateSectionId,
    sanitizeHref,
};

// END OF FILE
