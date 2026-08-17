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
    ['image-compressor', 'compress-image-to-target-size', 'image-resizer', 'image-cropper', 'image-format-converter', 'jpg-to-png-converter', 'png-to-jpg-converter', 'image-to-text-ocr'],
    ['video-compressor', 'video-trimmer', 'video-splitter', 'video-merge', 'video-audio-remover', 'add-audio-to-video', 'video-audio-extractor', 'video-format-converter'],
    ['audio-compressor-dynamics', 'audio-trimmer', 'audio-splitter', 'audio-merger', 'audio-noise-remover', 'audio-format-converter', 'mp3-to-wav-converter', 'wav-to-mp3-converter'],
    ['word-counter', 'character-counter', 'text-case-converter', 'duplicate-line-remover', 'text-diff-checker', 'grammar-checker', 'text-summarizer'],
    ['seo-checker', 'keyword-density-checker', 'serp-snippet-preview', 'meta-tag-generator', 'open-graph-generator', 'robots-txt-generator', 'sitemap-entry-generator'],
    ['password-generator', 'password-strength-checker', 'password-breach-checker', 'hash-generator', 'sri-hash-generator', 'csp-header-generator'],
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
