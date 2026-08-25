import './site-navigation.js?v=s7b42';
import { listToolDefinitions } from './tool-definitions.js?v=s7b46';
import { categoryLabels as categories } from './category-labels.js?v=s7b37';
import { rankTools, scoreToolMatch } from './smart-search.js?v=s7b47';
import { getSubcategories, getSubcategoryForTool } from './subcategories.js?v=s7b48';

const copy = Object.freeze({
    ar: Object.freeze({
        all: '\u0643\u0644 \u0627\u0644\u0623\u062f\u0648\u0627\u062a',
        processing: '\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629',
        calculators: '\u0627\u0644\u062d\u0627\u0633\u0628\u0627\u062a \u0648\u0627\u0644\u0645\u0648\u0644\u062f\u0627\u062a',
        search: '\u0627\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u0645\u0647\u0645\u0629 \u0623\u0648 \u0646\u0648\u0639 \u0627\u0644\u0645\u0644\u0641',
        count: '\u0623\u062f\u0627\u0629 \u0645\u062a\u0627\u062d\u0629',
        empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u062f\u0648\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0628\u062d\u062b\u0643.',
        open: '\u0627\u0641\u062a\u062d \u0627\u0644\u0623\u062f\u0627\u0629',
        language: 'English',
        loadMore: '\u0639\u0631\u0636 \u0627\u0644\u0645\u0632\u064a\u062f',
        allSub: '\u0627\u0644\u0643\u0644',
    }),
    en: Object.freeze({
        all: 'All tools',
        processing: 'Processing tools',
        calculators: 'Calculators & generators',
        search: 'Search tools \u2014 name, type, or task',
        count: 'tools available',
        empty: 'No tools match your search.',
        open: 'Open tool',
        language: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
        loadMore: 'Show more',
        allSub: 'All',
    }),
});

const root = document.querySelector('[data-catalogue-page]');
const grid = document.querySelector('#catalogue-grid');
const search = document.querySelector('#catalogue-search');
const filters = document.querySelector('#catalogue-filters');
const subfilters = document.querySelector('#catalogue-subfilters');
const loadMoreButton = document.querySelector('#catalogue-load-more');
const count = document.querySelector('#catalogue-count');
const empty = document.querySelector('#catalogue-empty');
const languageToggle = document.querySelector('#catalogue-language-toggle');
const currentYear = document.querySelector('#current-year');
const basePath = root?.dataset.basePath ?? '../';
const fixedCategory = root?.dataset.category ?? '';
const tools = listToolDefinitions();
const isProcessingTool = (tool) => typeof tool.process === 'function' || tool.interactive === true;
// Cards rendered per "page": keeps the initial DOM insert light even for
// the biggest categories (developer has 135+ tools) while staying a
// single URL/page -- Google's current guidance favors one page over
// classic pagination when it can be kept fast; a "Show more" button
// (not infinite scroll, so browser history/back-button behavior stays
// predictable) is the practical middle ground.
const PAGE_SIZE = 30;
let visibleCount = PAGE_SIZE;
const priorityGroups = Object.freeze([
    ['pdf-merge', 'pdf-splitter', 'pdf-compressor', 'pdf-to-word-converter', 'word-to-pdf-converter', 'pdf-to-jpg-converter', 'jpg-to-pdf-converter', 'pdf-editor'],
    // 'background-remover' and 'replace-background' added to the front
    // after researching several independent competitor sites (Erase.bg,
    // TinyWow, Slazzer, ShortPixel, ImgCruncher, imagy.app, and others):
    // "Remove background" appears consistently among the top few
    // featured/most-used tools across every one of them, alongside
    // compress/resize/convert/crop -- it had been missing from this
    // list entirely despite that.
    ['background-remover', 'replace-background', 'image-compressor', 'compress-image-to-target-size', 'image-resizer', 'image-cropper', 'image-format-converter', 'jpg-to-png-converter', 'png-to-jpg-converter', 'image-to-text-ocr'],
    ['video-compressor', 'video-trimmer', 'video-splitter', 'video-merge', 'video-audio-remover', 'add-audio-to-video', 'video-audio-extractor', 'video-format-converter'],
    ['audio-compressor-dynamics', 'audio-trimmer', 'audio-splitter', 'audio-merger', 'audio-noise-remover', 'audio-format-converter', 'mp3-to-wav-converter', 'wav-to-mp3-converter'],
    // 'text-summarizer' is now a real, registered tool (added later in
    // this project's history) -- added back to the front of this list.
    // grammar-checker still doesn't exist as a registered tool id, so
    // it's deliberately left out rather than re-added as a dead entry.
    // grammar-checker added after the same competitor research that
    // originally added it to the roadmap: Grammarly/LanguageTool-class
    // demand, now that the tool actually exists (see 0.5.141 for when
    // it shipped).
    ['text-summarizer', 'grammar-checker', 'word-counter', 'character-counter', 'text-case-converter', 'duplicate-line-remover', 'text-diff-checker', 'lorem-ipsum-generator', 'find-and-replace-tool'],
    ['seo-checker', 'keyword-density-checker', 'serp-snippet-preview', 'meta-tag-generator', 'open-graph-generator', 'robots-txt-generator', 'sitemap-entry-generator', 'utm-link-builder', 'click-through-rate-calculator'],
    ['password-generator', 'password-strength-checker', 'password-breach-checker', 'hash-generator', 'sri-hash-generator', 'csp-header-generator', 'ipv4-subnet-calculator', 'mac-address-formatter'],
    // Everyday-life calculators: these categories had no explicit
    // priority ordering at all before -- consistently among the highest-
    // volume, most well-known search terms for each domain.
    ['bmi-calculator', 'calorie-deficit-calculator', 'tdee-calculator', 'bmr-calculator', 'ideal-weight-calculator', 'pregnancy-due-date-calculator', 'body-fat-calculator', 'water-intake-calculator'],
    ['mortgage-calculator', 'loan-calculator', 'compound-interest-calculator', 'tip-calculator', 'roi-calculator', 'vat-calculator', 'savings-goal-calculator', 'net-worth-calculator'],
    ['percentage-calculator', 'quadratic-equation-calculator', 'standard-deviation-calculator', 'z-score-calculator', 'pythagorean-theorem-calculator', 'permutation-calculator', 'combination-calculator', 'probability-calculator'],
    ['qr-code-generator', 'length-converter', 'weight-converter', 'temperature-converter', 'time-unit-converter', 'area-converter', 'volume-converter', 'speed-converter'],
    ['age-calculator', 'date-difference-calculator', 'business-days-calculator', 'timezone-converter', 'work-hours-calculator', 'age-at-date-calculator', 'date-add-subtract-calculator'],
    ['hex-to-rgb-converter', 'rgb-to-hex-converter', 'css-box-shadow-generator', 'wcag-contrast-checker', 'css-linear-gradient-generator', 'css-border-radius-generator'],
    ['json-formatter', 'uuid-generator', 'base64-encoder-decoder', 'regex-tester', 'url-encoder-decoder', 'jwt-decoder', 'html-to-markdown-converter', 'json-validator'],
    // security-network's own priority group, added after the same
    // competitor research pattern used elsewhere in this list: hash
    // generators (unified MD5/SHA tool) and password generators appear
    // consistently as the most-featured tools across independent
    // competitor sites, with AES encryption a close second (added the
    // same session this group was created).
    ['hash-generator', 'password-generator', 'aes-encryption', 'jwt-inspector', 'pbkdf2-generator'],
]);
const priorityOrder = new Map(priorityGroups.flat().map((id, index) => [id, index]));
let activeCategory = fixedCategory;
let activeSubcategory = '';
let language = document.documentElement.dataset.language === 'en' ? 'en' : 'ar';
const initialQuery = new URLSearchParams(window.location.search).get('q')?.trim() ?? '';
if (initialQuery) {
    search.value = initialQuery;
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function categoryMatch(tool) {
    const matchesCategory = !activeCategory
        || (activeCategory === 'processing' && isProcessingTool(tool))
        || (activeCategory === 'calculators' && !isProcessingTool(tool))
        || tool.category === activeCategory;
    if (!matchesCategory) return false;
    if (!activeSubcategory) return true;
    return getSubcategoryForTool(activeCategory, tool.id) === activeSubcategory;
}

function defaultToolOrder(first, second) {
    const firstPriority = priorityOrder.get(first.id);
    const secondPriority = priorityOrder.get(second.id);
    if (firstPriority !== undefined || secondPriority !== undefined) {
        return (firstPriority ?? Number.MAX_SAFE_INTEGER)
            - (secondPriority ?? Number.MAX_SAFE_INTEGER);
    }
    const processingOrder = Number(isProcessingTool(second))
        - Number(isProcessingTool(first));
    return processingOrder || first.title[language].localeCompare(
        second.title[language],
        language,
    );
}

function getVisibleTools() {
    const query = search.value.trim();
    const inCategory = tools.filter(categoryMatch);
    if (!query) {
        return inCategory.slice().sort(defaultToolOrder);
    }
    return rankTools(inCategory, query, {
        categories,
        tieBreaker: defaultToolOrder,
    });
}

function renderFilters() {
    if (fixedCategory) {
        filters.hidden = true;
        return;
    }
    // High-traffic categories first for better user attraction
    const categoryPriority = ['pdf', 'image', 'video', 'audio', 'developer', 'text', 'seo', 'color-css'];
    const availableCategories = [...new Set(tools.map((tool) => tool.category))]
        .sort((first, second) => {
            const firstPriority = categoryPriority.indexOf(first);
            const secondPriority = categoryPriority.indexOf(second);
            if (firstPriority >= 0 || secondPriority >= 0) {
                return (firstPriority < 0 ? 99 : firstPriority)
                    - (secondPriority < 0 ? 99 : secondPriority);
            }
            return (categories[first]?.en ?? first).localeCompare(
                categories[second]?.en ?? second,
            );
        });
    filters.innerHTML = [
        `<button class="catalogue-filter${activeCategory ? '' : ' is-active'}" data-category="" type="button">${copy[language].all}</button>`,
        `<button class="catalogue-filter${activeCategory === 'processing' ? ' is-active' : ''}" data-category="processing" type="button">${copy[language].processing}</button>`,
        `<button class="catalogue-filter${activeCategory === 'calculators' ? ' is-active' : ''}" data-category="calculators" type="button">${copy[language].calculators}</button>`,
        ...availableCategories.map((category) => (
            `<button class="catalogue-filter${activeCategory === category ? ' is-active' : ''}" data-category="${escapeHtml(category)}" type="button">${escapeHtml(categories[category]?.[language] ?? category)}</button>`
        )),
    ].join('');
}

/**
 * Shows a second-row filter for sub-categories of the currently active
 * top-level category (works the same whether that category came from a
 * dedicated /categories/pdf/-style page or from clicking a filter chip
 * on the all-tools page). Hidden entirely for categories with no defined
 * sub-categories (most of the smaller ones), or when "All tools" is
 * active.
 */
function renderSubfilters() {
    const groups = activeCategory ? getSubcategories(activeCategory) : [];
    if (groups.length === 0) {
        subfilters.hidden = true;
        subfilters.innerHTML = '';
        return;
    }
    subfilters.hidden = false;
    subfilters.innerHTML = [
        `<button class="catalogue-subfilter${activeSubcategory ? '' : ' is-active'}" data-subcategory="" type="button">${copy[language].allSub}</button>`,
        ...groups.map(([subcategoryId, label]) => (
            `<button class="catalogue-subfilter${activeSubcategory === subcategoryId ? ' is-active' : ''}" data-subcategory="${escapeHtml(subcategoryId)}" type="button">${escapeHtml(label[language])}</button>`
        )),
    ].join('');
}

function renderTools() {
    const allVisibleTools = getVisibleTools();
    const visibleTools = allVisibleTools.slice(0, visibleCount);
    count.textContent = `${allVisibleTools.length} ${copy[language].count}`;
    empty.hidden = allVisibleTools.length > 0;
    empty.textContent = copy[language].empty;
    grid.innerHTML = visibleTools.map((tool) => `
        <a class="catalogue-card" href="${basePath}tools/${escapeHtml(tool.id)}/">
            <span class="catalogue-card-icon" aria-hidden="true">${escapeHtml(tool.icon)}</span>
            <span class="catalogue-card-category">${escapeHtml(categories[tool.category]?.[language] ?? tool.category)}</span>
            <h2>${escapeHtml(tool.title[language])}</h2>
            <p>${escapeHtml(tool.description[language])}</p>
            <strong>${copy[language].open} <span aria-hidden="true">\u2190</span></strong>
        </a>
    `).join('');

    loadMoreButton.hidden = allVisibleTools.length <= visibleCount;
    loadMoreButton.textContent = copy[language].loadMore;
}

function applyLanguage() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dataset.language = language;
    localStorage.setItem('adawaty-language', language);
    search.placeholder = copy[language].search;
    languageToggle.textContent = copy[language].language;
    document.querySelectorAll('[data-copy]').forEach((element) => {
        element.hidden = element.dataset.copy !== language;
    });
    const heading = document.querySelector(`.catalogue-header h1 [data-copy="${language}"]`);
    if (heading?.textContent.trim()) {
        document.title = `${heading.textContent.trim()} | ${language === 'ar' ? 'أدواتي' : 'Adawaty'}`;
    }
    renderFilters();
    renderSubfilters();
    renderTools();
}

filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) {
        return;
    }
    activeCategory = button.dataset.category;
    activeSubcategory = '';
    visibleCount = PAGE_SIZE;
    renderFilters();
    renderSubfilters();
    renderTools();
});

subfilters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-subcategory]');
    if (!button) {
        return;
    }
    activeSubcategory = button.dataset.subcategory;
    visibleCount = PAGE_SIZE;
    renderSubfilters();
    renderTools();
});

loadMoreButton.addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    renderTools();
});

search.addEventListener('input', () => {
    visibleCount = PAGE_SIZE;
    renderTools();
});
languageToggle.addEventListener('click', () => {
    language = language === 'ar' ? 'en' : 'ar';
    applyLanguage();
});

currentYear.textContent = new Date().getFullYear();
applyLanguage();

// END OF FILE
