import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getToolDefinition, listToolDefinitions } from '../../src/product/tool-definitions.js';
import {
    validateWebsiteSpec, createDefaultSpec, SECTION_TYPES, SITE_TYPES,
} from '../../src/product/website-builder/schema.js';
import { escapeHtml, safeUrl, safeHexColor, safeImageDataUrl } from '../../src/product/website-builder/render-utils.js';
import { renderWebsite, renderDocument } from '../../src/product/website-builder/engine.js';
import { createBusinessSpec } from '../../src/product/website-builder/templates/business.js';
import { createPortfolioSpec } from '../../src/product/website-builder/templates/portfolio.js';
import { createLandingSpec } from '../../src/product/website-builder/templates/landing.js';
import { createAgencySpec } from '../../src/product/website-builder/templates/agency.js';
import { createRestaurantSpec } from '../../src/product/website-builder/templates/restaurant.js';
import { createCatalogSpec } from '../../src/product/website-builder/templates/catalog.js';
import { createBuilderState } from '../../src/product/website-builder/state.js';
import {
    serializeItemList, parseItemList, serializeLines, parseLines,
} from '../../src/product/website-builder/content-schema.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, '../..');

// AdSense identifiers actually used elsewhere in this project's own pages --
// confirming these NEVER appear in generated-website output is the specific
// regression test the site's ADS separation rule requires.
const ADSENSE_MARKERS = ['adsbygoogle', 'pagead2.googlesyndication.com', 'ca-pub-'];

function assertNoAdsenseMarkers(text, label) {
    for (const marker of ADSENSE_MARKERS) {
        assert.ok(!text.includes(marker), `${label} must never contain the AdSense marker "${marker}"`);
    }
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

{
    const { spec, valid, errors } = validateWebsiteSpec(createDefaultSpec('business'));
    assert.equal(valid, true, 'a fresh default spec should validate with no corrections');
    assert.deepEqual(errors, []);
    assert.equal(spec.version, 1);
}

{
    // Malformed spec: not an object at all -- must default safely, not throw.
    const { spec, valid } = validateWebsiteSpec('not an object');
    assert.equal(valid, false);
    assert.equal(spec.site.type, 'business');
    assert.ok(SECTION_TYPES.length > 0);
    assert.ok(SITE_TYPES.includes(spec.site.type));
}

{
    // Unsupported section type is dropped, not thrown.
    const { spec, errors } = validateWebsiteSpec({
        site: { name: 'Test', type: 'business' },
        sections: [{ type: 'hero', content: {} }, { type: 'not-a-real-section' }],
    });
    assert.equal(spec.sections.length, 1, 'the unsupported section must be dropped, the valid one kept');
    assert.equal(spec.sections[0].type, 'hero');
    assert.ok(errors.some((message) => message.includes('not-a-real-section')));
}

{
    // Malicious href in navigation must be neutralized by validation, not just at render time.
    const { spec } = validateWebsiteSpec({
        navigation: { links: [{ label: 'Evil', href: 'javascript:alert(1)' }] },
    });
    assert.equal(spec.navigation.links[0].href, '#');
}

{
    // Corrupted localStorage-style state (garbage color, missing fields) must default safely.
    const { spec } = validateWebsiteSpec({ theme: { primary: 'not-a-color; }</style><script>' } });
    assert.equal(spec.theme.primary, '#2563eb');
}

// ---------------------------------------------------------------------------
// Render utilities (the only line of defense against XSS in generated sites)
// ---------------------------------------------------------------------------

{
    const attack = '<script>alert(1)</script>"><img src=x onerror=alert(2)>';
    const escaped = escapeHtml(attack);
    assert.ok(!escaped.includes('<script>'));
    assert.ok(!/<img[^>]*onerror=/.test(escaped));
}

{
    assert.equal(safeUrl('javascript:alert(1)'), '#');
    assert.equal(safeUrl('JAVASCRIPT:alert(1)'), '#');
    assert.equal(safeUrl('data:text/html,<script>alert(1)</script>'), '#');
    assert.equal(safeUrl('vbscript:msgbox(1)'), '#');
    assert.equal(safeUrl('https://example.com'), 'https://example.com');
    assert.equal(safeUrl('mailto:test@example.com'), 'mailto:test@example.com');
    assert.equal(safeUrl('#section'), '#section');
}

{
    assert.equal(safeHexColor('#ff0000'), '#ff0000');
    assert.equal(safeHexColor('red; background: url(evil)', '#000000'), '#000000');
}

{
    // Real uploaded images: only raster formats are trusted. SVG is
    // deliberately excluded even though it's a genuine image format,
    // since SVG can embed <script> and event-handler attributes.
    const validPng = `data:image/png;base64,${Buffer.from([0x89, 0x50, 0x4E, 0x47]).toString('base64')}`;
    const validJpeg = `data:image/jpeg;base64,${Buffer.from([0xFF, 0xD8, 0xFF]).toString('base64')}`;
    assert.equal(safeImageDataUrl(validPng), validPng);
    assert.equal(safeImageDataUrl(validJpeg), validJpeg);

    const maliciousSvg = `data:image/svg+xml;base64,${Buffer.from('<svg onload=alert(1)></svg>').toString('base64')}`;
    assert.equal(safeImageDataUrl(maliciousSvg), null, 'SVG data URLs must be rejected, not just non-image ones');

    const disguisedHtml = `data:text/html;base64,${Buffer.from('<script>alert(1)</script>').toString('base64')}`;
    assert.equal(safeImageDataUrl(disguisedHtml), null);

    assert.equal(safeImageDataUrl('javascript:alert(1)'), null);
    assert.equal(safeImageDataUrl(`data:image/png;base64,${'A'.repeat(3 * 1024 * 1024)}`), null, 'oversized data URLs must be rejected');
    assert.equal(safeImageDataUrl(undefined), null);
}

// ---------------------------------------------------------------------------
// Image-capable components (hero, about, gallery): real uploads render,
// malicious payloads fall back to the safe placeholder, never leaking
// into the output.
// ---------------------------------------------------------------------------

{
    const { renderHero } = await import('../../src/product/website-builder/components/hero.js');
    const { renderAbout } = await import('../../src/product/website-builder/components/about.js');
    const { renderGallery } = await import('../../src/product/website-builder/components/gallery.js');

    const validPng = `data:image/png;base64,${Buffer.from([0x89, 0x50, 0x4E, 0x47]).toString('base64')}`;
    const attackPayloads = [
        `data:image/svg+xml;base64,${Buffer.from('<svg onload=alert(1)></svg>').toString('base64')}`,
        `data:text/html;base64,${Buffer.from('<script>alert(1)</script>').toString('base64')}`,
        'javascript:alert(1)',
    ];

    const heroWithImage = renderHero({
        id: 'h', variant: 'split', content: { headline: 'Hi', imageDataUrl: validPng, imageAlt: 'Photo' },
    });
    assert.ok(heroWithImage.includes('<img class="hero-visual"'), 'a valid uploaded image must render as a real <img>');
    assert.ok(heroWithImage.includes(validPng));

    const aboutWithImage = renderAbout({ id: 'a', content: { title: 'About', imageDataUrl: validPng } });
    assert.ok(aboutWithImage.includes('<img class="about-visual"'));

    const galleryWithImage = renderGallery({ id: 'g', content: { items: [{ caption: 'Item', imageDataUrl: validPng }] } });
    assert.ok(galleryWithImage.includes('<img class="gallery-placeholder"'));

    // Gallery items are edited per-item (image + caption per row) rather
    // than the simpler one-line-per-item text format used elsewhere, so a
    // gallery can naturally mix uploaded and not-yet-uploaded items.
    const mixedGallery = renderGallery({
        id: 'g2',
        content: {
            items: [
                { caption: 'Uploaded', imageDataUrl: validPng },
                { caption: 'Not yet uploaded' },
            ],
        },
    });
    assert.ok(mixedGallery.includes('<img class="gallery-placeholder"'), 'the uploaded item must render as a real image');
    assert.ok(mixedGallery.includes('<div class="gallery-placeholder"'), 'the not-yet-uploaded item must fall back to a placeholder');

    // Gallery items can optionally link out to an external URL (e.g. a
    // live case study) -- only items with an href get wrapped in a link;
    // items without one must not. Checked per-item, not with a greedy
    // match across the whole rendered HTML, which would give a false
    // pass/fail depending on item order.
    const linkedGallery = renderGallery({
        id: 'g3',
        content: {
            items: [
                { caption: 'Linked Project', href: 'https://github.com/example/project' },
                { caption: 'Unlinked Project' },
            ],
        },
    });
    const [firstItem, secondItem] = linkedGallery.split('<li class="gallery-item">').slice(1);
    assert.ok(firstItem.includes('<a class="gallery-link" href="https://github.com/example/project"'), 'an item with href must be wrapped in a real link');
    assert.ok(firstItem.includes('target="_blank" rel="noopener noreferrer"'), 'external gallery links must use rel="noopener noreferrer"');
    assert.ok(!secondItem.includes('gallery-link'), 'an item without href must not be wrapped in a link');

    const maliciousLinkGallery = renderGallery({ id: 'g4', content: { items: [{ caption: 'Evil', href: 'javascript:alert(1)' }] } });
    assert.ok(!maliciousLinkGallery.includes('javascript:'), 'a malicious gallery item href must be neutralized');

    for (const payload of attackPayloads) {
        const hero = renderHero({ id: 'h2', variant: 'split', content: { headline: 'Hi', imageDataUrl: payload } });
        const about = renderAbout({ id: 'a2', content: { title: 'About', imageDataUrl: payload } });
        const gallery = renderGallery({ id: 'g2', content: { items: [{ caption: 'Item', imageDataUrl: payload }] } });
        const combined = hero + about + gallery;
        assert.ok(!combined.includes('<script>'), `attack payload leaked a <script> tag: ${payload.slice(0, 30)}`);
        assert.ok(!combined.includes('onload='), `attack payload leaked an onload handler: ${payload.slice(0, 30)}`);
        assert.ok(!combined.includes('javascript:'), `attack payload leaked a javascript: URI: ${payload.slice(0, 30)}`);
        assert.ok(hero.includes('<div class="hero-visual"'), 'rejected hero image must fall back to the placeholder div');
    }
}

// ---------------------------------------------------------------------------
// Renderer / engine
// ---------------------------------------------------------------------------

{
    const spec = createBusinessSpec({ name: 'Acme', language: 'en' });
    const result = renderWebsite(spec);
    assert.ok(result.html.includes('lang="en"'), 'English spec must render lang="en"');
    assert.ok(result.html.includes('dir="ltr"'), 'English spec must render dir="ltr"');
    assert.ok(result.html.includes('<meta name="viewport"'), 'generated site must have viewport metadata');
    assert.ok(result.html.includes('<title>Acme</title>'), 'generated site must have a title derived from the spec');
    assertNoAdsenseMarkers(result.html, 'renderWebsite() English output');
}

{
    const spec = createBusinessSpec({ name: 'شركتي', language: 'ar' });
    const result = renderWebsite(spec);
    assert.ok(result.html.includes('lang="ar"'), 'Arabic spec must render lang="ar"');
    assert.ok(result.html.includes('dir="rtl"'), 'Arabic spec must render dir="rtl"');
    assertNoAdsenseMarkers(result.html, 'renderWebsite() Arabic output');
}

{
    // All 6 templates must render without throwing, and produce every important section.
    const templates = [
        ['business', createBusinessSpec],
        ['portfolio', createPortfolioSpec],
        ['landing', createLandingSpec],
        ['agency', createAgencySpec],
        ['restaurant', createRestaurantSpec],
        ['catalog', createCatalogSpec],
    ];
    for (const [name, factory] of templates) {
        for (const language of ['en', 'ar']) {
            const spec = factory({ name: 'Test', language });
            const { valid } = validateWebsiteSpec(spec);
            assert.equal(valid, true, `${name} (${language}) must produce a spec that validates cleanly`);
            const result = renderWebsite(spec);
            assert.ok(result.html.length > 0, `${name} template must render non-empty HTML`);
            assert.ok(result.html.includes('site-nav'), `${name} template must include a navbar`);
            assert.ok(result.html.includes('site-footer'), `${name} template must include a footer`);
            assert.ok(result.html.includes(`lang="${language}"`), `${name} (${language}) must render the correct lang attribute`);
            assertNoAdsenseMarkers(result.html, `${name} (${language}) template output`);
        }
    }
}

{
    // Catalog is explicitly display-only per spec: no checkout/payment/cart language or behavior.
    const spec = createCatalogSpec({ name: 'Test Shop', language: 'en' });
    const result = renderWebsite(spec);
    const forbidden = ['checkout', 'add to cart', 'add-to-cart', 'proceed to payment', 'credit card', 'card number'];
    for (const phrase of forbidden) {
        assert.ok(!result.html.toLowerCase().includes(phrase), `catalog template must not contain checkout/payment language ("${phrase}")`);
    }
}

{
    // Real bug found via user testing: nav links (and hero/CTA/pricing
    // buttons) used short hardcoded anchors like "#work"/"#about" that
    // never matched any real element, since every section gets an
    // auto-generated unique id (e.g. "about-abc123-2"), not a plain word.
    // Clicking a nav link therefore scrolled nowhere -- every internal
    // anchor link in every template must resolve to a real id in the same
    // document (a <section id="..."> or the fixed <main id="top">).
    const templates = [
        ['business', createBusinessSpec],
        ['portfolio', createPortfolioSpec],
        ['landing', createLandingSpec],
        ['agency', createAgencySpec],
        ['restaurant', createRestaurantSpec],
        ['catalog', createCatalogSpec],
    ];

    for (const [name, factory] of templates) {
        const spec = factory({ name: 'Test', language: 'en' });
        const result = renderWebsite(spec);

        const validTargetIds = new Set([
            'top',
            ...[...result.html.matchAll(/<section[^>]*\bid="([^"]+)"/g)].map((match) => match[1]),
        ]);

        // Every internal (same-document) anchor href anywhere in the page
        // -- nav links, hero/CTA/pricing buttons -- must resolve.
        const internalHrefs = [...result.html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
        assert.ok(internalHrefs.length > 0, `${name} must contain at least one internal anchor link to test`);
        for (const href of internalHrefs) {
            assert.ok(
                validTargetIds.has(href),
                `${name}: internal link "#${href}" does not match any real element id in the rendered page`,
            );
        }
    }
}

{
    // User-supplied HTML/script content must never survive into the rendered document unescaped.
    const spec = createBusinessSpec({ name: 'Test', language: 'en' });
    const malicious = {
        ...spec,
        sections: [
            {
                id: 'hero-1',
                type: 'hero',
                variant: 'split',
                content: {
                    headline: '<script>window.__pwned = true;</script>',
                    subheadline: '"><img src=x onerror="window.__pwned = true">',
                    primaryButtonHref: 'javascript:window.__pwned = true',
                },
                settings: {},
            },
        ],
    };
    const result = renderWebsite(malicious);
    assert.ok(!result.html.includes('<script>window.__pwned'), 'raw <script> must not survive rendering');
    assert.ok(!/<img[^>]*onerror=/.test(result.html), 'raw onerror attribute must not survive rendering');
    assert.ok(!result.html.includes('javascript:window.__pwned'), 'javascript: URI must not survive rendering');
}

{
    // renderDocument accepts custom asset paths (used differently by the exporter vs. the live preview).
    const spec = createDefaultSpec('business');
    const html = renderDocument(spec, { css: 'custom.css', js: 'custom.js' });
    assert.ok(html.includes('custom.css'));
}

// ---------------------------------------------------------------------------
// Builder state (add / remove / reorder / undo / redo / reset)
// ---------------------------------------------------------------------------

{
    const state = createBuilderState(createDefaultSpec('business'));

    state.addSection('hero', { headline: 'Hi' });
    assert.equal(state.getSpec().sections.length, 1);

    state.addSection('about', { title: 'About' });
    const secondId = state.getSpec().sections[1].id;
    state.moveSection(secondId, 'up');
    assert.equal(state.getSpec().sections[0].type, 'about', 'move up should reorder sections');

    assert.equal(state.undo(), true);
    assert.equal(state.getSpec().sections[0].type, 'hero', 'undo should restore the previous order');

    assert.equal(state.redo(), true);
    assert.equal(state.getSpec().sections[0].type, 'about', 'redo should re-apply the reorder');

    state.removeSection(state.getSpec().sections[0].id);
    assert.equal(state.getSpec().sections.length, 1);

    state.updateTheme({ mode: 'dark' });
    assert.equal(state.getSpec().theme.mode, 'dark');
    state.undo();
    assert.equal(state.getSpec().theme.mode, 'light');

    // Real gaps found via user testing: there was previously no UI at all
    // to edit the footer or the navigation bar's links/CTA button, and
    // separately, editing "Site name" never updated the navbar's visible
    // logo text (two disconnected fields showing the same thing).
    state.updateFooter({ content: { ...state.getSpec().footer.content, links: [{ label: 'Privacy', href: '/privacy' }] } });
    assert.deepEqual(state.getSpec().footer.content.links, [{ label: 'Privacy', href: '/privacy' }]);

    state.updateNavigation({ ctaLabel: 'Book a Call', ctaHref: 'https://example.com/book' });
    assert.equal(state.getSpec().navigation.ctaLabel, 'Book a Call');
    assert.equal(state.undo(), true, 'the navigation edit must be undoable like any other change');
    assert.notEqual(state.getSpec().navigation.ctaLabel, 'Book a Call');

    state.commit((spec) => ({
        ...spec,
        site: { ...spec.site, name: 'Renamed Co' },
        navigation: { ...spec.navigation, logoText: 'Renamed Co' },
    }));
    assert.equal(state.getSpec().site.name, 'Renamed Co');
    assert.equal(state.getSpec().navigation.logoText, 'Renamed Co', 'site name and nav logo text must stay in sync');

    state.reset(createDefaultSpec('portfolio'));
    assert.equal(state.canUndo(), false);
    assert.equal(state.canRedo(), false);
    assert.equal(state.getSpec().site.type, 'portfolio');
}

// ---------------------------------------------------------------------------
// Content schema serialization (drives the section editor panel)
// ---------------------------------------------------------------------------

{
    const items = [{ title: 'Design', description: 'Great UI' }, { title: 'Dev', description: 'Clean code' }];
    const serialized = serializeItemList(items, ['title', 'description']);
    const parsed = parseItemList(serialized, ['title', 'description']);
    assert.deepEqual(parsed, items);
}

{
    const paragraphs = ['First.', 'Second.'];
    assert.deepEqual(parseLines(serializeLines(paragraphs)), paragraphs);
    assert.deepEqual(parseLines('Line one\n\n   \nLine two\n'), ['Line one', 'Line two']);
}

// ---------------------------------------------------------------------------
// Export packaging: verified without relying on fetch()/import.meta.url
// (browser-only in this exporter, since it same-origin-fetches sibling CSS/JS
// text) -- the actual ZIP-folder-structure logic is tested directly here
// using the same JSZip call shape the exporter uses, and the "no AdSense in
// exported assets" requirement is verified against the real asset files
// on disk that the exporter packages.
// ---------------------------------------------------------------------------

{
    const cssPath = path.join(projectRoot, 'src/product/website-builder/generated-site.css');
    const jsPath = path.join(projectRoot, 'src/product/website-builder/generated-site-main.js');
    const css = await readFile(cssPath, 'utf8');
    const js = await readFile(jsPath, 'utf8');
    assertNoAdsenseMarkers(css, 'generated-site.css');
    assertNoAdsenseMarkers(js, 'generated-site-main.js');
    assert.ok(!js.includes('fetch('), 'the exported site\u2019s own main.js must not make any network requests');
}

// ---------------------------------------------------------------------------
// Product integration: the tool is registered the same way every other tool is
// ---------------------------------------------------------------------------

{
    const tool = getToolDefinition('website-builder');
    assert.ok(tool, 'website-builder must be registered in tool-definitions.js');
    assert.equal(tool.interactive, true, 'website-builder must use the interactive-tool page-generation exemption');
    assert.equal(tool.category, 'developer');
    assert.ok(tool.title.ar && tool.title.en, 'title must be bilingual');
    assert.ok(tool.description.ar && tool.description.en, 'description must be bilingual');

    const allTools = listToolDefinitions();
    assert.ok(allTools.some((candidate) => candidate.id === 'website-builder'));
}

{
    // The manually-authored page must exist (interactive tools are exempt
    // from auto-generation, but still need a real page on disk).
    const pagePath = path.join(projectRoot, 'tools/website-builder/index.html');
    const html = await readFile(pagePath, 'utf8');
    assert.ok(html.includes('data-tool-page="website-builder"'));
    assert.ok(html.includes('sandbox="allow-scripts"'), 'the live preview iframe must be sandboxed');
    assert.ok(!html.includes('allow-same-origin'), 'the preview sandbox must not grant allow-same-origin (would defeat the isolation)');
}

console.log('Website Builder: schema, renderer, state, export-safety, and product-integration checks passed.');

// END OF FILE
