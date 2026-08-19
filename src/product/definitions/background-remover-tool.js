const backgroundRemover = Object.freeze({
    id: 'background-remover',
    category: 'image',
    icon: 'BG REMOVE',
    interactive: true,
    action: Object.freeze({
        ar: 'أزل الخلفية',
        en: 'Remove background',
    }),
    title: Object.freeze({
        ar: 'إزالة خلفية الصورة',
        en: 'Background Remover',
    }),
    description: Object.freeze({
        ar: 'أزل خلفية أي صورة تلقائيًا بالذكاء الاصطناعي، واحصل على صورة بخلفية شفافة جاهزة للتحميل.',
        en: 'Automatically remove the background from any image using AI, and get a transparent PNG ready to download.',
    }),
    note: Object.freeze({
        ar: 'تتم كل المعالجة داخل متصفحك؛ صورتك لا تُرفع لأي خادم. أول استخدام يتطلب تحميل نموذج ذكاء اصطناعي صغير (حوالي 5 ميجابايت) يُخزَّن بعدها في متصفحك.',
        en: 'All processing happens in your browser; your photo is never uploaded to any server. The first use downloads a small AI model (about 5 MB), which is then cached in your browser.',
    }),
    inputs: Object.freeze([]),
});

const backgroundRemoverToolDefinitions = Object.freeze({
    [backgroundRemover.id]: backgroundRemover,
});

export { backgroundRemoverToolDefinitions };

// END OF FILE
