import { createDefaultSpec, generateSectionId } from '../schema.js';

/**
 * A display-only product catalog / simple storefront. Per spec, this is
 * intentionally display-only: no checkout, payments, accounts, orders, or
 * cart -- it reuses the "pricing" component (name/price/features/button)
 * as simple product cards, since that's exactly the shape a product
 * listing needs without inventing a dedicated products component.
 */
function createCatalogSpec(overrides = {}) {
    const base = createDefaultSpec('catalog');
    const language = overrides.language === 'ar' ? 'ar' : 'en';
    const t = (ar, en) => (language === 'ar' ? ar : en);

    return Object.freeze({
        ...base,
        site: Object.freeze({
            ...base.site,
            name: overrides.name || t('متجري', 'My Store'),
            language,
            direction: language === 'ar' ? 'rtl' : 'ltr',
        }),
        navigation: Object.freeze({
            ...base.navigation,
            logoText: overrides.name || t('متجري', 'My Store'),
            links: Object.freeze([
                Object.freeze({ label: t('المنتجات', 'Products'), href: '#products' }),
                Object.freeze({ label: t('من نحن', 'About'), href: '#about' }),
                Object.freeze({ label: t('تواصل', 'Contact'), href: '#contact' }),
            ]),
            ctaLabel: t('تواصل للطلب', 'Contact to Order'),
            ctaHref: '#contact',
        }),
        sections: Object.freeze([
            Object.freeze({
                id: generateSectionId('hero'), type: 'hero', variant: 'centered',
                content: Object.freeze({
                    headline: t('منتجات مختارة بعناية', 'Carefully Selected Products'),
                    subheadline: t('جودة تثق بها في كل مرة.', 'Quality you can trust every time.'),
                    primaryButtonLabel: t('تصفح المنتجات', 'Browse Products'),
                    primaryButtonHref: '#products',
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('gallery'), type: 'gallery', variant: 'default',
                content: Object.freeze({
                    title: t('فئات المنتجات', 'Product Categories'),
                    items: Object.freeze([
                        Object.freeze({ caption: t('فئة أولى', 'Category One') }),
                        Object.freeze({ caption: t('فئة ثانية', 'Category Two') }),
                        Object.freeze({ caption: t('فئة ثالثة', 'Category Three') }),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('pricing'), type: 'pricing', variant: 'default',
                content: Object.freeze({
                    title: t('منتجاتنا', 'Our Products'),
                    subtitle: t('لعرض المنتج فقط — تواصل معنا لإتمام الطلب.', 'For display only \u2014 contact us to place an order.'),
                    plans: Object.freeze([
                        Object.freeze({
                            name: t('المنتج الأول', 'Product One'), price: '$29', features: Object.freeze([t('وصف مختصر للمنتج', 'A short product description'), t('متوفر بعدة ألوان', 'Available in multiple colors')]), buttonLabel: t('تواصل للطلب', 'Contact to Order'), buttonHref: '#contact',
                        }),
                        Object.freeze({
                            name: t('المنتج الثاني', 'Product Two'), price: '$49', highlighted: true, features: Object.freeze([t('الأكثر مبيعًا', 'Best seller'), t('جودة ممتازة', 'Excellent quality')]), buttonLabel: t('تواصل للطلب', 'Contact to Order'), buttonHref: '#contact',
                        }),
                        Object.freeze({
                            name: t('المنتج الثالث', 'Product Three'), price: '$39', features: Object.freeze([t('خيار اقتصادي', 'Budget-friendly option')]), buttonLabel: t('تواصل للطلب', 'Contact to Order'), buttonHref: '#contact',
                        }),
                    ]),
                }),
                settings: Object.freeze({ id: 'products' }),
            }),
            Object.freeze({
                id: generateSectionId('about'), type: 'about', variant: 'default',
                content: Object.freeze({
                    title: t('من نحن', 'About Us'),
                    paragraphs: Object.freeze([
                        t('نقدم منتجات مختارة بعناية لضمان أفضل تجربة لعملائنا.', 'We offer carefully selected products to ensure the best experience for our customers.'),
                    ]),
                }),
                settings: Object.freeze({}),
            }),
            Object.freeze({
                id: generateSectionId('contact'), type: 'contact', variant: 'default',
                content: Object.freeze({
                    title: t('اطلب الآن', 'Place an Order'),
                    subtitle: t('تواصل معنا لإتمام طلبك.', 'Contact us to complete your order.'),
                    email: 'orders@example.com',
                    showForm: true,
                }),
                settings: Object.freeze({}),
            }),
        ]),
        footer: Object.freeze({
            id: 'footer', type: 'footer', variant: 'simple',
            content: Object.freeze({ name: overrides.name || t('متجري', 'My Store') }),
            settings: Object.freeze({}),
        }),
    });
}

export { createCatalogSpec };

// END OF FILE
