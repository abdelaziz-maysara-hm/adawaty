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

// END OF FILE
