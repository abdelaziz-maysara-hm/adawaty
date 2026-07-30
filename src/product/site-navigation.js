const labels = Object.freeze({
    ar: Object.freeze({
        all: '\u0643\u0644 \u0627\u0644\u0623\u062f\u0648\u0627\u062a',
        popular: '\u0627\u0644\u0623\u0643\u062b\u0631 \u0627\u0633\u062a\u062e\u062f\u0627\u0645\u064b\u0627',
        image: '\u0627\u0644\u0635\u0648\u0631',
        pdf: 'PDF',
        video: '\u0627\u0644\u0641\u064a\u062f\u064a\u0648',
        audio: '\u0627\u0644\u0635\u0648\u062a',
        text: '\u0627\u0644\u0646\u0635\u0648\u0635',
    }),
    en: Object.freeze({
        all: 'All tools',
        popular: 'Popular',
        image: 'Images',
        pdf: 'PDF',
        video: 'Video',
        audio: 'Audio',
        text: 'Text',
    }),
});

const destinations = Object.freeze([
    ['all', 'all-tools/'],
    ['popular', '#popular-tools'],
    ['image', 'categories/image/'],
    ['pdf', 'categories/pdf/'],
    ['video', 'categories/video/'],
    ['audio', 'categories/audio/'],
    ['text', 'categories/text/'],
]);

function initializeSiteNavigation() {
    const navigation = document.querySelector('.navigation');
    const brand = navigation?.querySelector('.brand');
    if (!navigation || !brand || navigation.querySelector('.site-nav-links')) return;
    navigation.classList.add('has-site-nav');

    const homeUrl = new URL(brand.getAttribute('href') || './', window.location.href);
    const links = document.createElement('div');
    links.className = 'primary-nav site-nav-links';
    links.setAttribute('aria-label', 'Tool categories');

    for (const [key, path] of destinations) {
        const link = document.createElement('a');
        link.href = path.startsWith('#')
            ? new URL(path, homeUrl).href
            : new URL(path, homeUrl).href;
        link.dataset.navLabel = key;
        links.append(link);
    }

    const actions = navigation.querySelector('.nav-actions');
    navigation.insertBefore(links, actions || navigation.lastElementChild);

    const update = () => {
        const language = document.documentElement.dataset.language === 'en' ? 'en' : 'ar';
        for (const link of links.querySelectorAll('[data-nav-label]')) {
            link.textContent = labels[language][link.dataset.navLabel];
        }
        links.setAttribute('aria-label', language === 'ar'
            ? '\u062a\u0635\u0646\u064a\u0641\u0627\u062a \u0627\u0644\u0623\u062f\u0648\u0627\u062a'
            : 'Tool categories');
    };

    update();
    new MutationObserver(update).observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-language'],
    });
}

initializeSiteNavigation();

export { initializeSiteNavigation };

// END OF FILE
