const categoryLabels = Object.freeze({
    health: Object.freeze({ ar: 'الصحة', en: 'Health' }),
    finance: Object.freeze({ ar: 'المال', en: 'Finance' }),
    student: Object.freeze({ ar: 'الطلاب', en: 'Student' }),
    'student-study': Object.freeze({ ar: 'الدراسة والعمل', en: 'Study & Work' }),
    math: Object.freeze({ ar: 'الرياضيات', en: 'Math' }),
    'date-time': Object.freeze({ ar: 'التاريخ والوقت', en: 'Date & Time' }),
    converter: Object.freeze({ ar: 'التحويلات', en: 'Converters' }),
    developer: Object.freeze({ ar: 'المطورون', en: 'Developer' }),
    text: Object.freeze({ ar: 'النصوص', en: 'Text' }),
    engineering: Object.freeze({ ar: 'الهندسة والعلوم', en: 'Engineering' }),
    'security-network': Object.freeze({ ar: 'الأمان والشبكات', en: 'Security & Network' }),
    seo: Object.freeze({ ar: 'تحسين محركات البحث', en: 'SEO' }),
    'color-css': Object.freeze({ ar: 'الألوان وCSS', en: 'Color & CSS' }),
    'home-lifestyle': Object.freeze({ ar: 'المنزل والحياة', en: 'Home & Lifestyle' }),
    islamic: Object.freeze({ ar: 'إسلامية', en: 'Islamic' }),
    image: Object.freeze({ ar: 'الصور والوسائط', en: 'Image & Media' }),
    pdf: Object.freeze({ ar: 'ملفات PDF', en: 'PDF' }),
});

function getCategoryLabel(category, language = 'en', suffix = '') {
    const label = categoryLabels[category]?.[language] ?? category;
    return suffix ? `${label} ${suffix}` : label;
}

export { categoryLabels, getCategoryLabel };

// END OF FILE
