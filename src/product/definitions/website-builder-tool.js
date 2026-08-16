const websiteBuilder = Object.freeze({
    id: 'website-builder',
    category: 'developer',
    icon: 'WEB',
    interactive: true,
    action: Object.freeze({
        ar: 'افتح المنشئ',
        en: 'Open builder',
    }),
    title: Object.freeze({
        ar: 'منشئ المواقع',
        en: 'Website Builder',
    }),
    description: Object.freeze({
        ar: 'أنشئ موقعًا احترافيًا ومتجاوبًا مباشرة داخل متصفحك، ثم عاينه وحمّل ملفات HTML وCSS وJavaScript كاملة.',
        en: 'Build a professional responsive website directly in your browser, preview it, and download the complete HTML, CSS and JavaScript source.',
    }),
    note: Object.freeze({
        ar: 'يتم إنشاء الموقع بالكامل داخل متصفحك ولا يتم رفع محتوى مشروعك إلى خوادمنا.',
        en: 'Your website is generated entirely in your browser. Your project content is not uploaded to our servers.',
    }),
    inputs: Object.freeze([]),
});

const websiteBuilderToolDefinitions = Object.freeze({
    [websiteBuilder.id]: websiteBuilder,
});

export { websiteBuilderToolDefinitions };

// END OF FILE
