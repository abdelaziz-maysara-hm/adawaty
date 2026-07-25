const root = document.documentElement;
const languageToggle = document.querySelector('#language-toggle');
const currentYear = document.querySelector('#current-year');

const languageSettings = Object.freeze({
    ar: Object.freeze({
        direction: 'rtl',
        title: 'أدواتي | منصة الأدوات العربية والإنجليزية',
        navigationLabel: 'التنقل الرئيسي',
    }),
    en: Object.freeze({
        direction: 'ltr',
        title: 'Adawaty | Arabic and English Tools Platform',
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

    try {
        localStorage.setItem('adawaty-preview-language', selectedLanguage);
    } catch {
        // The preview remains functional when storage is unavailable.
    }
}

function getInitialLanguage() {
    try {
        const savedLanguage = localStorage.getItem('adawaty-preview-language');

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

if (currentYear) {
    currentYear.textContent = String(new Date().getFullYear());
}

applyLanguage(getInitialLanguage());

// END OF FILE
