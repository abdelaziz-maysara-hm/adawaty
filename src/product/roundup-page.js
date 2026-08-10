import './site-navigation.js?v=s7b44';

const root = document.documentElement;
const toggle = document.querySelector('#roundup-language-toggle');
const year = document.querySelector('#current-year');

function applyLanguage(language) {
    const selected = language === 'en' ? 'en' : 'ar';
    root.lang = selected;
    root.dir = selected === 'ar' ? 'rtl' : 'ltr';
    root.dataset.language = selected;
    document.querySelectorAll('[data-copy]').forEach((element) => {
        element.hidden = element.dataset.copy !== selected;
    });
    const heading = document.querySelector(`.roundup-page h1 [data-copy="${selected}"]`);
    if (heading?.textContent.trim()) {
        document.title = `${heading.textContent.trim()} | ${selected === 'ar' ? 'أدواتي' : 'Adawaty'}`;
    }
    if (toggle) toggle.textContent = selected === 'ar' ? 'English' : 'العربية';
    try {
        localStorage.setItem('adawaty-language', selected);
    } catch {
        // Language switching remains available without storage.
    }
}

toggle?.addEventListener('click', () => {
    applyLanguage(root.dataset.language === 'en' ? 'ar' : 'en');
});

if (year) year.textContent = String(new Date().getFullYear());
applyLanguage(root.dataset.language);

// END OF FILE
