import { createDefaultSpec, generateSectionId } from '../schema.js';

/**
 * A creative/professional services agency: services, portfolio gallery,
 * stats, team, testimonials. Section IDs referenced by nav links or
 * buttons are generated once and reused consistently (see portfolio.js
 * for why this matters).
 */
function createAgencySpec(overrides = {}) {
    const base = createDefaultSpec('agency');
    const language = overrides.language === 'ar' ? 'ar' : 'en';
    const t = (ar, en) => (language === 'ar' ? ar : en);

    const servicesId = generateSectionId('services');
    const galleryId = generateSectionId('gallery');
    const aboutId = generateSectionId('about');
    const contactId = generateSectionId('contact');

    return Object.freeze({
        ...base,
        site: Object.freeze({
            ...base.site,
            name: overrides.name || t('وكالتنا', 'Our Agency'),
            language,
            direction: language === 'ar' ? 'rtl' : 'ltr',
        }),
        navigation: Object.freeze({
            ...base.navigation,
            logoText: overrides.name || t('وكالتنا', 'Our Agency'),
            links: Object.freeze([
                Object.freeze({ label: t('خدماتنا', 'Services'), href: `#${servicesId}` }),
                Object.freeze({ label: t('أعمالنا', 'Work'), href: `#${galleryId}` }),
                Object.freeze({ label: t('من نحن', 'About'), href: `#${aboutId}` }),
                Object.freeze({ label: t('تواصل', 'Contact'), href: `#${contactId}` }),
            ]),
            ctaLabel: t('ابدأ مشروعك', 'Start a Project'),
            ctaHref: `#${contactId}`,
        }),
        sections: Object.freeze([
            Object.freeze({
                id: generateSectionId('hero'), type: 'hero', variant: 'split',
                content: Object.freeze({
                    headline: t('نصمم تجارب رقمية مميزة', 'We Design Standout Digital Experiences'),
                    subheadline: t('وكالة إبداعية متخصصة في العلامات التجارية والمواقع والتطبيقات.', 'A creative agency specializing in branding, websites, and apps.'),
                    primaryButtonLabel: t('شاهد أعمالنا', 'View Our Work'),
                    primaryButtonHref: `#${galleryId}`,
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: servicesId, type: 'services', variant: 'default',
                content: Object.freeze({
                    title: t('خدماتنا', 'What We Do'),
                    items: Object.freeze([
                        Object.freeze({ icon: '◆', title: t('الهوية البصرية', 'Branding'), description: t('هوية بصرية تميزك عن المنافسين.', 'A visual identity that sets you apart.') }),
                        Object.freeze({ icon: '◆', title: t('تصميم المواقع', 'Web Design'), description: t('مواقع سريعة وجذابة وسهلة الاستخدام.', 'Fast, beautiful, easy-to-use websites.') }),
                        Object.freeze({ icon: '◆', title: t('التسويق الرقمي', 'Digital Marketing'), description: t('استراتيجيات تسويقية تحقق نتائج حقيقية.', 'Marketing strategies that deliver real results.') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: galleryId, type: 'gallery', variant: 'default',
                content: Object.freeze({
                    title: t('أعمالنا المختارة', 'Selected Work'),
                    items: Object.freeze([
                        Object.freeze({ caption: t('مشروع علامة تجارية', 'Branding Project') }),
                        Object.freeze({ caption: t('مشروع موقع إلكتروني', 'Website Project') }),
                        Object.freeze({ caption: t('حملة تسويقية', 'Marketing Campaign') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('stats'), type: 'stats', variant: 'default',
                content: Object.freeze({
                    items: Object.freeze([
                        Object.freeze({ value: '120+', label: t('مشروع منجز', 'Projects delivered') }),
                        Object.freeze({ value: '15+', label: t('سنة خبرة مجتمعة', 'Years combined experience') }),
                        Object.freeze({ value: '98%', label: t('رضا العملاء', 'Client satisfaction') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: aboutId, type: 'about', variant: 'default',
                content: Object.freeze({
                    title: t('من نحن', 'About Us'),
                    paragraphs: Object.freeze([
                        t('فريق صغير من المبدعين المتخصصين نعمل بشغف لمساعدة العلامات التجارية على النمو.', 'A small team of specialized creatives working passionately to help brands grow.'),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('testimonials'), type: 'testimonials', variant: 'grid',
                content: Object.freeze({
                    title: t('ماذا يقول عملاؤنا', 'What Our Clients Say'),
                    items: Object.freeze([
                        Object.freeze({ quote: t('فريق محترف تجاوز توقعاتنا.', 'A professional team that exceeded our expectations.'), name: t('عميل', 'Client'), role: t('مدير تسويق', 'Marketing Director') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: contactId, type: 'contact', variant: 'default',
                content: Object.freeze({
                    title: t('لنبدأ مشروعك القادم', 'Let\u2019s Start Your Next Project'),
                    email: 'hello@example.com',
                    showForm: true,
                }),
                settings: Object.freeze({}),
            }),
        ]),
        footer: Object.freeze({
            id: 'footer', type: 'footer', variant: 'simple',
            content: Object.freeze({ name: overrides.name || t('وكالتنا', 'Our Agency') }),
            settings: Object.freeze({}),
        }),
    });
}

export { createAgencySpec };

// END OF FILE
