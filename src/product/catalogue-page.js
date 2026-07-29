import { listToolDefinitions } from './tool-definitions.js?v=s7b26';
import { categoryLabels as categories } from './category-labels.js?v=s7b26';

const copy = Object.freeze({
    ar: Object.freeze({
        all: 'كل الأدوات',
        processing: 'أدوات المعالجة',
        calculators: 'الحاسبات والمولدات',
        search: 'ابحث باسم الأداة أو وصفها',
        count: 'أداة متاحة',
        empty: 'لا توجد أدوات مطابقة لبحثك.',
        open: 'افتح الأداة',
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
        language: 'العربية',
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
let activeCategory = fixedCategory;
let language = localStorage.getItem('adawaty-language') === 'en' ? 'en' : 'ar';
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
            || (activeCategory === 'processing' && typeof tool.process === 'function')
            || (activeCategory === 'calculators' && typeof tool.process !== 'function')
            || tool.category === activeCategory;
        const searchable = [
            tool.title.ar,
            tool.title.en,
            tool.description.ar,
            tool.description.en,
        ].join(' ').toLocaleLowerCase(language);
        return matchesCategory && (!query || searchable.includes(query));
    }).sort((first, second) => {
        const processingOrder = Number(typeof second.process === 'function')
            - Number(typeof first.process === 'function');
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
            <strong>${copy[language].open} <span aria-hidden="true">←</span></strong>
        </a>
    `).join('');
}

function applyLanguage() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
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
