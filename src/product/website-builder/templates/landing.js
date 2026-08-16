import { createDefaultSpec, generateSectionId } from '../schema.js';

/**
 * A focused, conversion-oriented landing page for a single product or
 * offer. Section IDs referenced by nav links or buttons are generated
 * once and reused consistently (see portfolio.js for why this matters).
 */
function createLandingSpec(overrides = {}) {
    const base = createDefaultSpec('landing');
    const language = overrides.language === 'ar' ? 'ar' : 'en';
    const t = (ar, en) => (language === 'ar' ? ar : en);

    const featuresId = generateSectionId('features');
    const pricingId = generateSectionId('pricing');
    const faqId = generateSectionId('faq');
    const contactId = generateSectionId('contact');

    return Object.freeze({
        ...base,
        site: Object.freeze({
            ...base.site,
            name: overrides.name || t('منتجي', 'My Product'),
            language,
            direction: language === 'ar' ? 'rtl' : 'ltr',
        }),
        navigation: Object.freeze({
            ...base.navigation,
            logoText: overrides.name || t('منتجي', 'My Product'),
            links: Object.freeze([
                Object.freeze({ label: t('المميزات', 'Features'), href: `#${featuresId}` }),
                Object.freeze({ label: t('الأسعار', 'Pricing'), href: `#${pricingId}` }),
                Object.freeze({ label: t('الأسئلة', 'FAQ'), href: `#${faqId}` }),
            ]),
            ctaLabel: t('ابدأ مجانًا', 'Start Free'),
            ctaHref: `#${pricingId}`,
        }),
        sections: Object.freeze([
            Object.freeze({
                id: generateSectionId('hero'), type: 'hero', variant: 'centered',
                content: Object.freeze({
                    headline: t('المنتج الذي كنت تنتظره', 'The Product You\u2019ve Been Waiting For'),
                    subheadline: t('حل بسيط وسريع يساعدك على إنجاز المزيد بجهد أقل.', 'A simple, fast solution that helps you get more done with less effort.'),
                    primaryButtonLabel: t('جرّبه مجانًا', 'Try It Free'),
                    primaryButtonHref: `#${pricingId}`,
                    secondaryButtonLabel: t('شاهد كيف يعمل', 'See How It Works'),
                    secondaryButtonHref: `#${featuresId}`,
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('stats'), type: 'stats', variant: 'default',
                content: Object.freeze({
                    items: Object.freeze([
                        Object.freeze({ value: '5,000+', label: t('مستخدم نشط', 'Active users') }),
                        Object.freeze({ value: '4.9/5', label: t('تقييم المستخدمين', 'User rating') }),
                        Object.freeze({ value: '99.9%', label: t('وقت التشغيل', 'Uptime') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: featuresId, type: 'features', variant: 'grid',
                content: Object.freeze({
                    title: t('لماذا تختارنا', 'Why Choose Us'),
                    items: Object.freeze([
                        Object.freeze({ icon: '⚡', title: t('سريع', 'Fast'), description: t('نتائج فورية دون انتظار.', 'Instant results with no waiting.') }),
                        Object.freeze({ icon: '🔒', title: t('آمن', 'Secure'), description: t('بياناتك محمية دائمًا.', 'Your data is always protected.') }),
                        Object.freeze({ icon: '💡', title: t('بسيط', 'Simple'), description: t('واجهة سهلة لا تحتاج تدريبًا.', 'An easy interface that needs no training.') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('testimonials'), type: 'testimonials', variant: 'single',
                content: Object.freeze({
                    items: Object.freeze([
                        Object.freeze({ quote: t('غيّر هذا المنتج طريقة عملنا بالكامل.', 'This product completely changed the way we work.'), name: t('مستخدم راضٍ', 'Happy User'), role: t('مؤسس شركة ناشئة', 'Startup Founder') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: pricingId, type: 'pricing', variant: 'default',
                content: Object.freeze({
                    title: t('خطط بسيطة وشفافة', 'Simple, Transparent Pricing'),
                    plans: Object.freeze([
                        Object.freeze({
                            name: t('أساسي', 'Basic'), price: t('مجانًا', 'Free'), features: Object.freeze([t('حتى 3 مشاريع', 'Up to 3 projects'), t('دعم عبر البريد', 'Email support')]), buttonLabel: t('ابدأ الآن', 'Get Started'), buttonHref: `#${contactId}`,
                        }),
                        Object.freeze({
                            name: t('احترافي', 'Pro'), price: '$19', period: t('شهريًا', 'month'), highlighted: true, features: Object.freeze([t('مشاريع غير محدودة', 'Unlimited projects'), t('دعم أولوية', 'Priority support'), t('تقارير متقدمة', 'Advanced reports')]), buttonLabel: t('ابدأ الآن', 'Get Started'), buttonHref: `#${contactId}`,
                        }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: faqId, type: 'faq', variant: 'default',
                content: Object.freeze({
                    title: t('الأسئلة الشائعة', 'FAQ'),
                    items: Object.freeze([
                        Object.freeze({ question: t('هل يوجد نسخة تجريبية؟', 'Is there a free trial?'), answer: t('نعم، الخطة الأساسية مجانية بالكامل.', 'Yes, the Basic plan is completely free.') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('cta'), type: 'cta', variant: 'default',
                content: Object.freeze({
                    title: t('جاهز تبدأ؟', 'Ready to get started?'),
                    subtitle: t('انضم لآلاف المستخدمين اليوم.', 'Join thousands of users today.'),
                    buttonLabel: t('ابدأ مجانًا', 'Start Free'),
                    buttonHref: `#${contactId}`,
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: contactId, type: 'contact', variant: 'default',
                content: Object.freeze({
                    title: t('تواصل معنا', 'Get in Touch'),
                    email: 'hello@example.com',
                    showForm: true,
                }),
                settings: Object.freeze({}),
            }),
        ]),
        footer: Object.freeze({
            id: 'footer', type: 'footer', variant: 'simple',
            content: Object.freeze({ name: overrides.name || t('منتجي', 'My Product') }),
            settings: Object.freeze({}),
        }),
    });
}

export { createLandingSpec };

// END OF FILE
