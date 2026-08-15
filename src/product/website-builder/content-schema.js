/**
 * Describes which content fields each section type exposes for editing,
 * and how to serialize/parse list-based fields (items, paragraphs, plans)
 * to and from a simple one-line-per-entry textarea format. This keeps the
 * section editor generic (one panel implementation for all 13 section
 * types) instead of needing a bespoke editor UI per type.
 */

const FIELD_LABELS = Object.freeze({
    title: Object.freeze({ ar: 'العنوان', en: 'Title' }),
    subtitle: Object.freeze({ ar: 'العنوان الفرعي', en: 'Subtitle' }),
    headline: Object.freeze({ ar: 'العنوان الرئيسي', en: 'Headline' }),
    subheadline: Object.freeze({ ar: 'الوصف تحت العنوان', en: 'Subheadline' }),
    primaryButtonLabel: Object.freeze({ ar: 'نص الزر الأساسي', en: 'Primary button label' }),
    primaryButtonHref: Object.freeze({ ar: 'رابط الزر الأساسي', en: 'Primary button link' }),
    secondaryButtonLabel: Object.freeze({ ar: 'نص الزر الثانوي', en: 'Secondary button label' }),
    secondaryButtonHref: Object.freeze({ ar: 'رابط الزر الثانوي', en: 'Secondary button link' }),
    buttonLabel: Object.freeze({ ar: 'نص الزر', en: 'Button label' }),
    buttonHref: Object.freeze({ ar: 'رابط الزر', en: 'Button link' }),
    email: Object.freeze({ ar: 'البريد الإلكتروني', en: 'Email' }),
    phone: Object.freeze({ ar: 'الهاتف', en: 'Phone' }),
    address: Object.freeze({ ar: 'العنوان', en: 'Address' }),
    paragraphs: Object.freeze({ ar: 'الفقرات (سطر لكل فقرة)', en: 'Paragraphs (one per line)' }),
    items: Object.freeze({ ar: 'العناصر', en: 'Items' }),
    plans: Object.freeze({ ar: 'الباقات', en: 'Plans' }),
});

/** field types: 'text' | 'textarea' | 'url' | 'checkbox' | 'lines' (one paragraph per line) | 'itemList' (structured list, format described per section) */
const SECTION_SCHEMAS = Object.freeze({
    hero: Object.freeze([
        Object.freeze({ key: 'headline', type: 'text' }),
        Object.freeze({ key: 'subheadline', type: 'textarea' }),
        Object.freeze({ key: 'primaryButtonLabel', type: 'text' }),
        Object.freeze({ key: 'primaryButtonHref', type: 'url' }),
        Object.freeze({ key: 'secondaryButtonLabel', type: 'text' }),
        Object.freeze({ key: 'secondaryButtonHref', type: 'url' }),
    ]),
    features: Object.freeze([
        Object.freeze({ key: 'title', type: 'text' }),
        Object.freeze({ key: 'subtitle', type: 'textarea' }),
        Object.freeze({
            key: 'items', type: 'itemList', itemFields: ['title', 'description'], hint: { ar: 'سطر لكل عنصر: العنوان :: الوصف', en: 'One per line: Title :: Description' },
        }),
    ]),
    services: Object.freeze([
        Object.freeze({ key: 'title', type: 'text' }),
        Object.freeze({ key: 'subtitle', type: 'textarea' }),
        Object.freeze({
            key: 'items', type: 'itemList', itemFields: ['title', 'description'], hint: { ar: 'سطر لكل عنصر: العنوان :: الوصف', en: 'One per line: Title :: Description' },
        }),
    ]),
    about: Object.freeze([
        Object.freeze({ key: 'title', type: 'text' }),
        Object.freeze({ key: 'paragraphs', type: 'lines' }),
    ]),
    stats: Object.freeze([
        Object.freeze({ key: 'title', type: 'text' }),
        Object.freeze({
            key: 'items', type: 'itemList', itemFields: ['value', 'label'], hint: { ar: 'سطر لكل رقم: القيمة :: الوصف', en: 'One per line: Value :: Label' },
        }),
    ]),
    gallery: Object.freeze([
        Object.freeze({ key: 'title', type: 'text' }),
        Object.freeze({
            key: 'items', type: 'itemList', itemFields: ['caption'], hint: { ar: 'سطر لكل صورة: التعليق', en: 'One per line: caption' },
        }),
    ]),
    testimonials: Object.freeze([
        Object.freeze({ key: 'title', type: 'text' }),
        Object.freeze({
            key: 'items', type: 'itemList', itemFields: ['quote', 'name', 'role'], hint: { ar: 'سطر لكل رأي: النص :: الاسم :: الدور', en: 'One per line: Quote :: Name :: Role' },
        }),
    ]),
    pricing: Object.freeze([
        Object.freeze({ key: 'title', type: 'text' }),
        Object.freeze({ key: 'subtitle', type: 'textarea' }),
        Object.freeze({
            key: 'plans', type: 'itemList', itemFields: ['name', 'price', 'period'], hint: { ar: 'سطر لكل باقة: الاسم :: السعر :: الفترة', en: 'One per line: Name :: Price :: Period' },
        }),
    ]),
    faq: Object.freeze([
        Object.freeze({ key: 'title', type: 'text' }),
        Object.freeze({
            key: 'items', type: 'itemList', itemFields: ['question', 'answer'], hint: { ar: 'سطر لكل سؤال: السؤال :: الإجابة', en: 'One per line: Question :: Answer' },
        }),
    ]),
    contact: Object.freeze([
        Object.freeze({ key: 'title', type: 'text' }),
        Object.freeze({ key: 'subtitle', type: 'textarea' }),
        Object.freeze({ key: 'email', type: 'text' }),
        Object.freeze({ key: 'phone', type: 'text' }),
        Object.freeze({ key: 'address', type: 'text' }),
        Object.freeze({ key: 'showForm', type: 'checkbox' }),
    ]),
    cta: Object.freeze([
        Object.freeze({ key: 'title', type: 'text' }),
        Object.freeze({ key: 'subtitle', type: 'textarea' }),
        Object.freeze({ key: 'buttonLabel', type: 'text' }),
        Object.freeze({ key: 'buttonHref', type: 'url' }),
    ]),
});

const ITEM_SEPARATOR = ' :: ';

/** Turns an array of item objects into one-line-per-item text, e.g. "Title :: Description". */
function serializeItemList(items, itemFields) {
    if (!Array.isArray(items)) return '';
    return items
        .map((item) => itemFields.map((field) => (item?.[field] ?? '')).join(ITEM_SEPARATOR))
        .join('\n');
}

/** Parses that same one-line-per-item text format back into an array of item objects. */
function parseItemList(text, itemFields) {
    return String(text ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
            const parts = line.split(ITEM_SEPARATOR);
            const item = {};
            itemFields.forEach((field, index) => {
                item[field] = (parts[index] ?? '').trim();
            });
            return item;
        });
}

function serializeLines(paragraphs) {
    return Array.isArray(paragraphs) ? paragraphs.join('\n') : '';
}

function parseLines(text) {
    return String(text ?? '')
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
}

function getSchemaForSection(sectionType) {
    return SECTION_SCHEMAS[sectionType] ?? [];
}

export {
    SECTION_SCHEMAS,
    FIELD_LABELS,
    getSchemaForSection,
    serializeItemList,
    parseItemList,
    serializeLines,
    parseLines,
};

// END OF FILE
