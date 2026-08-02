import { getRecentToolIds } from '../product/usage-tracking.js?v=s7b41';

async function renderRecentTools() {
    const section = document.querySelector('#recent-tools');
    const list = document.querySelector('#recent-tools-list');
    if (!section || !list) return;

    const recent = getRecentToolIds(6);
    if (recent.length === 0) return;

    let index;
    try {
        const response = await fetch('./src/data/tool-index.json');
        index = await response.json();
    } catch {
        return; // Fail silently -- this is a nice-to-have, not critical content.
    }

    const cards = recent
        .map((entry) => ({ id: entry.id, tool: index[entry.id] }))
        .filter((pair) => Boolean(pair.tool))
        .map(({ id, tool }) => {
            const link = document.createElement('a');
            link.href = `./tools/${id}/`;
            link.innerHTML = `<span class="featured-icon">${tool.icon ?? ''}</span>`
                + `<h3><span data-copy="ar">${tool.ar}</span><span data-copy="en">${tool.en}</span></h3>`
                + '<strong><span data-copy="ar">افتح الأداة</span><span data-copy="en">Open tool</span> <i>\u2190</i></strong>';
            return link;
        });

    if (cards.length === 0) return;
    list.replaceChildren(...cards);
    section.hidden = false;
}

const root = document.documentElement;
const languageToggle = document.querySelector('#language-toggle');
const currentYear = document.querySelector('#current-year');
const searchForm = document.querySelector('#home-search');
const searchInput = document.querySelector('#home-search-input');
const languageStorageKey = 'adawaty-language';
const legacyLanguageStorageKey = 'adawaty-preview-language';

const languageSettings = Object.freeze({
    ar: Object.freeze({
        direction: 'rtl',
        title: 'أدواتي | أدوات مجانية للصور وPDF والفيديو والنصوص',
        navigationLabel: 'التنقل الرئيسي',
    }),
    en: Object.freeze({
        direction: 'ltr',
        title: 'Adawaty | Free Image, PDF, Video and Text Tools',
        navigationLabel: 'Primary navigation',
    }),
});

function applyLanguage(language) {
    const settings = languageSettings[language] ?? languageSettings.ar;
    const selectedLanguage = languageSettings[language] ? language : 'ar';
    root.lang = selectedLanguage;
    root.dir = settings.direction;
    root.dataset.language = selectedLanguage;
    document.title = settings.title;
    document.querySelector('.navigation')?.setAttribute(
        'aria-label',
        settings.navigationLabel,
    );
    if (searchInput) {
        searchInput.placeholder = selectedLanguage === 'ar'
            ? searchInput.dataset.hintAr
            : searchInput.dataset.hintEn;
    }
    try {
        localStorage.setItem(languageStorageKey, selectedLanguage);
        localStorage.removeItem(legacyLanguageStorageKey);
    } catch {
        // Language switching remains available when storage is blocked.
    }
}

function getInitialLanguage() {
    try {
        const savedLanguage = localStorage.getItem(languageStorageKey)
            ?? localStorage.getItem(legacyLanguageStorageKey);
        if (languageSettings[savedLanguage]) {
            return savedLanguage;
        }
    } catch {
        // Browser language remains a safe fallback.
    }
    return navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

languageToggle?.addEventListener('click', () => {
    applyLanguage(root.dataset.language === 'ar' ? 'en' : 'ar');
});

searchForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = searchInput?.value.trim() ?? '';
    const target = new URL('./all-tools/', window.location.href);
    if (query) {
        target.searchParams.set('q', query);
    }
    window.location.href = target.href;
});

if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
}

applyLanguage(getInitialLanguage());
renderRecentTools();

// END OF FILE
