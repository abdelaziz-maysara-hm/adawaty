(function bootstrapLanguage() {
    let language = '';
    try {
        language = localStorage.getItem('adawaty-language')
            || localStorage.getItem('adawaty-preview-language')
            || '';
    } catch {
        // Browser preference remains available when storage is blocked.
    }
    if (language !== 'ar' && language !== 'en') {
        language = navigator.language.toLowerCase().startsWith('ar') ? 'ar' : 'en';
    }
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    root.dataset.language = language;
}());

// END OF FILE