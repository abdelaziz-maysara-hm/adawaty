import { createDefaultSpec, generateSectionId } from '../schema.js';

/**
 * A general-purpose business site: hero, services, about, stats,
 * testimonials, FAQ, contact.
 *
 * Section IDs referenced by nav links or buttons are generated once and
 * reused consistently (see portfolio.js for why this matters).
 */
function createBusinessSpec(overrides = {}) {
    const base = createDefaultSpec('business');
    const language = overrides.language === 'ar' ? 'ar' : 'en';
    const t = (ar, en) => (language === 'ar' ? ar : en);

    const servicesId = generateSectionId('services');
    const aboutId = generateSectionId('about');
    const contactId = generateSectionId('contact');

    return Object.freeze({
        ...base,
        site: Object.freeze({
            ...base.site,
            name: overrides.name || t('شركتي', 'My Company'),
            language,
            direction: language === 'ar' ? 'rtl' : 'ltr',
        }),
        navigation: Object.freeze({
            ...base.navigation,
            logoText: overrides.name || t('شركتي', 'My Company'),
            links: Object.freeze([
                Object.freeze({ label: t('الرئيسية', 'Home'), href: '#top' }),
                Object.freeze({ label: t('خدماتنا', 'Services'), href: `#${servicesId}` }),
                Object.freeze({ label: t('من نحن', 'About'), href: `#${aboutId}` }),
                Object.freeze({ label: t('تواصل معنا', 'Contact'), href: `#${contactId}` }),
            ]),
            ctaLabel: t('احصل على عرض سعر', 'Get a Quote'),
            ctaHref: `#${contactId}`,
        }),
        sections: Object.freeze([
            Object.freeze({
                id: generateSectionId('hero'), type: 'hero', variant: 'split',
                content: Object.freeze({
                    headline: t('نساعدك على النمو', 'We Help You Grow'),
                    subheadline: t('حلول احترافية مصممة خصيصًا لاحتياجات عملك.', 'Professional solutions tailored to your business needs.'),
                    primaryButtonLabel: t('ابدأ الآن', 'Get Started'),
                    primaryButtonHref: `#${contactId}`,
                    secondaryButtonLabel: t('اعرف المزيد', 'Learn More'),
                    secondaryButtonHref: `#${aboutId}`,
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: servicesId, type: 'services', variant: 'default',
                content: Object.freeze({
                    title: t('خدماتنا', 'Our Services'),
                    subtitle: t('كل ما تحتاجه في مكان واحد.', 'Everything you need in one place.'),
                    items: Object.freeze([
                        Object.freeze({ icon: '◆', title: t('الاستشارات', 'Consulting'), description: t('نصائح خبراء لمساعدتك على اتخاذ القرار الصحيح.', 'Expert advice to help you make the right decision.') }),
                        Object.freeze({ icon: '◆', title: t('التنفيذ', 'Implementation'), description: t('ننفذ الحلول باحترافية وفي الوقت المحدد.', 'We implement solutions professionally and on time.') }),
                        Object.freeze({ icon: '◆', title: t('الدعم', 'Support'), description: t('فريق دعم متاح لمساعدتك في أي وقت.', 'A support team available to help you anytime.') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: aboutId, type: 'about', variant: 'default',
                content: Object.freeze({
                    title: t('من نحن', 'About Us'),
                    paragraphs: Object.freeze([
                        t('نحن فريق شغوف يعمل على تقديم أفضل الحلول لعملائنا منذ سنوات.', 'We are a passionate team delivering the best solutions for our clients for years.'),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('stats'), type: 'stats', variant: 'default',
                content: Object.freeze({
                    items: Object.freeze([
                        Object.freeze({ value: '10+', label: t('سنوات خبرة', 'Years experience') }),
                        Object.freeze({ value: '200+', label: t('عميل سعيد', 'Happy clients') }),
                        Object.freeze({ value: '500+', label: t('مشروع منجز', 'Projects delivered') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('testimonials'), type: 'testimonials', variant: 'grid',
                content: Object.freeze({
                    title: t('آراء عملائنا', 'What Clients Say'),
                    items: Object.freeze([
                        Object.freeze({ quote: t('خدمة ممتازة وفريق محترف.', 'Excellent service and a professional team.'), name: t('عميل سعيد', 'Happy Client'), role: t('مدير شركة', 'Company Manager') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('faq'), type: 'faq', variant: 'default',
                content: Object.freeze({
                    title: t('الأسئلة الشائعة', 'Frequently Asked Questions'),
                    items: Object.freeze([
                        Object.freeze({ question: t('كيف أبدأ؟', 'How do I get started?'), answer: t('تواصل معنا من قسم التواصل وسنرد عليك في أقرب وقت.', 'Reach out through the contact section and we\u2019ll get back to you soon.') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: contactId, type: 'contact', variant: 'default',
                content: Object.freeze({
                    title: t('تواصل معنا', 'Get in Touch'),
                    subtitle: t('يسعدنا التواصل معك.', 'We\u2019d love to hear from you.'),
                    email: 'hello@example.com',
                    showForm: true,
                }),
                settings: Object.freeze({}),
            }),
        ]),
        footer: Object.freeze({
            id: 'footer', type: 'footer', variant: 'simple',
            content: Object.freeze({ name: overrides.name || t('شركتي', 'My Company') }),
            settings: Object.freeze({}),
        }),
    });
}

export { createBusinessSpec };

// END OF FILE
