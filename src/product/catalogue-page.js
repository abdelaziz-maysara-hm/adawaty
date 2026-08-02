import './site-navigation.js?v=s7b42';
import { listToolDefinitions } from './tool-definitions.js?v=s7b37';
import { categoryLabels as categories } from './category-labels.js?v=s7b37';

const copy = Object.freeze({
    ar: Object.freeze({
        all: '\u0643\u0644 \u0627\u0644\u0623\u062f\u0648\u0627\u062a',
        processing: '\u0623\u062f\u0648\u0627\u062a \u0627\u0644\u0645\u0639\u0627\u0644\u062c\u0629',
        calculators: '\u0627\u0644\u062d\u0627\u0633\u0628\u0627\u062a \u0648\u0627\u0644\u0645\u0648\u0644\u062f\u0627\u062a',
        search: '\u0627\u0628\u062d\u062b \u0628\u0627\u0633\u0645 \u0627\u0644\u0623\u062f\u0627\u0629 \u0623\u0648 \u0648\u0635\u0641\u0647\u0627',
        count: '\u0623\u062f\u0627\u0629 \u0645\u062a\u0627\u062d\u0629',
        empty: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u062f\u0648\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0628\u062d\u062b\u0643.',
        open: '\u0627\u0641\u062a\u062d \u0627\u0644\u0623\u062f\u0627\u0629',
        language: 'English',
    }),
    en: Object.freeze({
        all: 'All tools',
        processing: 'Processing tools',
        calculators: 'Calculators & generators',
        search: 'Search by tool name or description',
        count: 'tools available',
        empty: 'No tools match your search.',
        open: 'Open tool',
        language: '\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
    }),
});

const root = document.querySelector('[data-catalogue-page]');
const grid = document.querySelector('#catalogue-grid');
const search = document.querySelector('#catalogue-search');
const filters = document.querySelector('#catalogue-filters');
const count = document.querySelector('#catalogue-count');
const empty = document.querySelector('#catalogue-empty');
const languageToggle = document.querySelector('#catalogue-language-toggle');
const currentYear = document.querySelector('#current-year');
const basePath = root?.dataset.basePath ?? '../';
const fixedCategory = root?.dataset.category ?? '';
const tools = listToolDefinitions();
const isProcessingTool = (tool) => typeof tool.process === 'function' || tool.interactive === true;
let activeCategory = fixedCategory;
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

function getVisibleTools() {
    const query = search.value.trim().toLocaleLowerCase(language);
    return tools.filter((tool) => {
        const matchesCategory = !activeCategory
            || (activeCategory === 'processing' && isProcessingTool(tool))
            || (activeCategory === 'calculators' && !isProcessingTool(tool))
            || tool.category === activeCategory;
        const searchable = [
            tool.title.ar,
            tool.title.en,
            tool.description.ar,
            tool.description.en,
        ].join(' ').toLocaleLowerCase(language);
        return matchesCategory && (!query || searchable.includes(query));
    }).sort((first, second) => {
        const processingOrder = Number(isProcessingTool(second))
            - Number(isProcessingTool(first));
        return processingOrder || first.title[language].localeCompare(
            second.title[language],
            language,
        );
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

function renderTools() {
    const visibleTools = getVisibleTools();
    count.textContent = `${visibleTools.length} ${copy[language].count}`;
    empty.hidden = visibleTools.length > 0;
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
    renderFilters();
    renderTools();
}

filters.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) {
        return;
    }
    activeCategory = button.dataset.category;
    renderFilters();
    renderTools();
});

search.addEventListener('input', renderTools);
languageToggle.addEventListener('click', () => {
    language = language === 'ar' ? 'en' : 'ar';
    applyLanguage();
});

currentYear.textContent = new Date().getFullYear();
applyLanguage();

// END OF FILE
