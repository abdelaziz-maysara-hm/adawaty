const grammarChecker = Object.freeze({
    id: 'grammar-checker',
    category: 'text',
    icon: 'AI GRAMMAR',
    interactive: true,
    action: Object.freeze({
        ar: 'افتح أداة التصحيح',
        en: 'Open grammar checker',
    }),
    title: Object.freeze({
        ar: 'تصحيح نحوي وإملائي بالذكاء الاصطناعي',
        en: 'AI Grammar Checker',
    }),
    description: Object.freeze({
        ar: 'صحّح الأخطاء النحوية والإملائية في أي نص تلقائيًا بالذكاء الاصطناعي، يعمل بالكامل داخل متصفحك بدون سيرفر.',
        en: 'Automatically correct grammar and spelling errors in any text with AI, running entirely in your browser with no server.',
    }),
    note: Object.freeze({
        ar: 'نصّك لا يُرسل لأي خادم أبدًا؛ التصحيح يتم بالكامل على جهازك. أول استخدام يتطلب تحميل نموذج ذكاء اصطناعي (حوالي 950 ميجابايت) يُخزَّن بعدها في متصفحك، ويحتاج متصفحًا يدعم WebGPU.',
        en: 'Your text is never sent to any server; correction happens entirely on your device. The first use downloads an AI model (about 950 MB), which is then cached in your browser, and requires a browser that supports WebGPU.',
    }),
    inputs: Object.freeze([]),
});

const grammarCheckerToolDefinitions = Object.freeze({
    [grammarChecker.id]: grammarChecker,
});

export { grammarCheckerToolDefinitions };

// END OF FILE
