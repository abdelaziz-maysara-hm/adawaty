const textSummarizer = Object.freeze({
    id: 'text-summarizer',
    category: 'text',
    icon: 'AI SUMMARY',
    interactive: true,
    action: Object.freeze({
        ar: 'افتح أداة التلخيص',
        en: 'Open summarizer',
    }),
    title: Object.freeze({
        ar: 'تلخيص النصوص بالذكاء الاصطناعي',
        en: 'AI Text Summarizer',
    }),
    description: Object.freeze({
        ar: 'لخّص أي نص طويل تلقائيًا بالذكاء الاصطناعي، يعمل بالكامل داخل متصفحك بدون سيرفر.',
        en: 'Automatically summarize any long text with AI, running entirely in your browser with no server.',
    }),
    note: Object.freeze({
        ar: 'نصّك لا يُرسل لأي خادم أبدًا؛ التلخيص يتم بالكامل على جهازك. أول استخدام يتطلب تحميل نموذج ذكاء اصطناعي (حوالي 950 ميجابايت) يُخزَّن بعدها في متصفحك، ويحتاج متصفحًا يدعم WebGPU.',
        en: 'Your text is never sent to any server; summarization happens entirely on your device. The first use downloads an AI model (about 950 MB), which is then cached in your browser, and requires a browser that supports WebGPU.',
    }),
    inputs: Object.freeze([]),
});

const textSummarizerToolDefinitions = Object.freeze({
    [textSummarizer.id]: textSummarizer,
});

export { textSummarizerToolDefinitions };

// END OF FILE
