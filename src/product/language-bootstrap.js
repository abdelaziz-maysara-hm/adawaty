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

(function injectLangFoucCss() {
    if (document.getElementById('lang-fouc')) return;
    var s = document.createElement('style');
    s.id = 'lang-fouc';
    s.textContent = '[data-language="en"] [data-copy="ar"],[data-language="ar"] [data-copy="en"]{display:none!important}';
    document.documentElement.appendChild(s);
}());

(function bootstrapGoogleAnalytics() {
    const measurementId = 'G-N9X0ZTH17N';
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId);
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
    document.head.appendChild(script);
}());

// END OF FILE
