import { createDefaultSpec, generateSectionId } from '../schema.js';

/**
 * A restaurant site: story, menu highlights as features, gallery of
 * dishes, hours/location in contact. Section IDs referenced by nav links
 * or buttons are generated once and reused consistently (see
 * portfolio.js for why this matters).
 */
function createRestaurantSpec(overrides = {}) {
    const base = createDefaultSpec('restaurant');
    const language = overrides.language === 'ar' ? 'ar' : 'en';
    const t = (ar, en) => (language === 'ar' ? ar : en);

    const menuId = generateSectionId('features');
    const aboutId = generateSectionId('about');
    const galleryId = generateSectionId('gallery');
    const contactId = generateSectionId('contact');

    return Object.freeze({
        ...base,
        site: Object.freeze({
            ...base.site,
            name: overrides.name || t('مطعمنا', 'Our Restaurant'),
            language,
            direction: language === 'ar' ? 'rtl' : 'ltr',
        }),
        navigation: Object.freeze({
            ...base.navigation,
            logoText: overrides.name || t('مطعمنا', 'Our Restaurant'),
            links: Object.freeze([
                Object.freeze({ label: t('القائمة', 'Menu'), href: `#${menuId}` }),
                Object.freeze({ label: t('عن المطعم', 'About'), href: `#${aboutId}` }),
                Object.freeze({ label: t('الأطباق', 'Gallery'), href: `#${galleryId}` }),
                Object.freeze({ label: t('احجز طاولة', 'Reservations'), href: `#${contactId}` }),
            ]),
            ctaLabel: t('احجز الآن', 'Book a Table'),
            ctaHref: `#${contactId}`,
        }),
        sections: Object.freeze([
            Object.freeze({
                id: generateSectionId('hero'), type: 'hero', variant: 'split',
                content: Object.freeze({
                    headline: t('تجربة طعام لا تُنسى', 'An Unforgettable Dining Experience'),
                    subheadline: t('نكهات أصيلة ومكونات طازجة في أجواء دافئة.', 'Authentic flavors and fresh ingredients in a warm atmosphere.'),
                    primaryButtonLabel: t('احجز طاولة', 'Reserve a Table'),
                    primaryButtonHref: `#${contactId}`,
                    secondaryButtonLabel: t('شاهد القائمة', 'View Menu'),
                    secondaryButtonHref: `#${menuId}`,
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: menuId, type: 'features', variant: 'grid',
                content: Object.freeze({
                    title: t('أشهر أطباقنا', 'Signature Dishes'),
                    subtitle: t('نختار أفضل المكونات كل يوم.', 'We pick the finest ingredients every day.'),
                    items: Object.freeze([
                        Object.freeze({ icon: '🍽', title: t('طبق رئيسي', 'Main Course'), description: t('وصفة تقليدية بلمسة عصرية.', 'A traditional recipe with a modern touch.') }),
                        Object.freeze({ icon: '🥗', title: t('مقبلات', 'Starters'), description: t('طازجة ومحضّرة يوميًا.', 'Fresh and prepared daily.') }),
                        Object.freeze({ icon: '🍰', title: t('حلويات', 'Desserts'), description: t('نهاية مثالية لوجبتك.', 'The perfect ending to your meal.') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: aboutId, type: 'about', variant: 'default',
                content: Object.freeze({
                    title: t('قصتنا', 'Our Story'),
                    paragraphs: Object.freeze([
                        t('بدأنا بشغف بسيط للطهي، ونفخر اليوم بتقديم أشهى الأطباق لضيوفنا منذ سنوات.', 'We started with a simple passion for cooking, and today we\u2019re proud to serve our guests the finest dishes.'),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: galleryId, type: 'gallery', variant: 'default',
                content: Object.freeze({
                    title: t('من مطبخنا', 'From Our Kitchen'),
                    items: Object.freeze([
                        Object.freeze({ caption: t('طبق مميز', 'Featured dish') }),
                        Object.freeze({ caption: t('أجواء المطعم', 'Restaurant ambiance') }),
                        Object.freeze({ caption: t('طبق حلويات', 'Dessert plate') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('testimonials'), type: 'testimonials', variant: 'grid',
                content: Object.freeze({
                    title: t('آراء ضيوفنا', 'What Our Guests Say'),
                    items: Object.freeze([
                        Object.freeze({ quote: t('أفضل تجربة طعام جربتها هذا العام.', 'The best dining experience I\u2019ve had this year.'), name: t('ضيف', 'Guest') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: contactId, type: 'contact', variant: 'default',
                content: Object.freeze({
                    title: t('احجز طاولتك', 'Reserve Your Table'),
                    subtitle: t('نتطلع لاستضافتك.', 'We look forward to hosting you.'),
                    phone: '+1 234 567 8900',
                    address: t('١٢٣ شارع رئيسي، مدينتك', '123 Main Street, Your City'),
                    showForm: true,
                }),
                settings: Object.freeze({}),
            }),
        ]),
        footer: Object.freeze({
            id: 'footer', type: 'footer', variant: 'simple',
            content: Object.freeze({ name: overrides.name || t('مطعمنا', 'Our Restaurant') }),
            settings: Object.freeze({}),
        }),
    });
}

export { createRestaurantSpec };

// END OF FILE
