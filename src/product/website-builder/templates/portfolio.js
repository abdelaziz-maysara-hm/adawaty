import { createDefaultSpec, generateSectionId } from '../schema.js';

/**
 * A personal portfolio: hero, gallery of work, about, skills-as-features,
 * testimonials, contact.
 *
 * Section IDs referenced by nav links or buttons are generated once and
 * reused consistently (nav href, hero button href, and the section's own
 * `id`) -- a real bug found via user testing: anchor links previously
 * assumed short fixed ids like "#work"/"#about" that never actually
 * matched the real auto-generated section ids, so every nav link silently
 * pointed at nothing.
 */
function createPortfolioSpec(overrides = {}) {
    const base = createDefaultSpec('portfolio');
    const language = overrides.language === 'ar' ? 'ar' : 'en';
    const t = (ar, en) => (language === 'ar' ? ar : en);

    const galleryId = generateSectionId('gallery');
    const aboutId = generateSectionId('about');
    const contactId = generateSectionId('contact');

    return Object.freeze({
        ...base,
        site: Object.freeze({
            ...base.site,
            name: overrides.name || t('اسمي', 'My Name'),
            language,
            direction: language === 'ar' ? 'rtl' : 'ltr',
        }),
        navigation: Object.freeze({
            ...base.navigation,
            logoText: overrides.name || t('اسمي', 'My Name'),
            links: Object.freeze([
                Object.freeze({ label: t('أعمالي', 'Work'), href: `#${galleryId}` }),
                Object.freeze({ label: t('عني', 'About'), href: `#${aboutId}` }),
                Object.freeze({ label: t('تواصل', 'Contact'), href: `#${contactId}` }),
            ]),
            ctaLabel: t('تواصل معي', 'Contact Me'),
            ctaHref: `#${contactId}`,
        }),
        sections: Object.freeze([
            Object.freeze({
                id: generateSectionId('hero'), type: 'hero', variant: 'centered',
                content: Object.freeze({
                    headline: t('مرحبًا، أنا مصمم/مطوّر', 'Hi, I\u2019m a Designer & Developer'),
                    subheadline: t('أصنع تجارب رقمية جميلة وعملية.', 'I craft beautiful, practical digital experiences.'),
                    primaryButtonLabel: t('شاهد أعمالي', 'View My Work'),
                    primaryButtonHref: `#${galleryId}`,
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: galleryId, type: 'gallery', variant: 'default',
                content: Object.freeze({
                    title: t('أعمالي', 'Selected Work'),
                    items: Object.freeze([
                        Object.freeze({ caption: t('مشروع واحد', 'Project One') }),
                        Object.freeze({ caption: t('مشروع اثنين', 'Project Two') }),
                        Object.freeze({ caption: t('مشروع ثلاثة', 'Project Three') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: aboutId, type: 'about', variant: 'default',
                content: Object.freeze({
                    title: t('عني', 'About Me'),
                    paragraphs: Object.freeze([
                        t('أعمل في هذا المجال منذ سنوات وأحب تحويل الأفكار إلى واقع.', 'I\u2019ve worked in this field for years and love turning ideas into reality.'),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('features'), type: 'features', variant: 'list',
                content: Object.freeze({
                    title: t('مهاراتي', 'Skills'),
                    items: Object.freeze([
                        Object.freeze({ icon: '•', title: t('التصميم', 'Design'), description: t('واجهات مستخدم بديهية وجذابة.', 'Intuitive, appealing user interfaces.') }),
                        Object.freeze({ icon: '•', title: t('التطوير', 'Development'), description: t('كود نظيف وقابل للصيانة.', 'Clean, maintainable code.') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('testimonials'), type: 'testimonials', variant: 'single',
                content: Object.freeze({
                    items: Object.freeze([
                        Object.freeze({ quote: t('عمل رائع وسريع الاستجابة.', 'Great work and responsive communication.'), name: t('عميل سابق', 'Past Client') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: contactId, type: 'contact', variant: 'default',
                content: Object.freeze({
                    title: t('لنعمل معًا', 'Let\u2019s Work Together'),
                    email: 'hello@example.com',
                    showForm: true,
                }),
                settings: Object.freeze({}),
            }),
        ]),
        footer: Object.freeze({
            id: 'footer', type: 'footer', variant: 'simple',
            content: Object.freeze({ name: overrides.name || t('اسمي', 'My Name') }),
            settings: Object.freeze({}),
        }),
    });
}

export { createPortfolioSpec };

// END OF FILE
