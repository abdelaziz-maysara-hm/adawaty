const replaceBackground = Object.freeze({
    id: 'replace-background',
    category: 'image',
    icon: 'BG REPLACE',
    interactive: true,
    action: Object.freeze({
        ar: 'استبدل الخلفية',
        en: 'Replace background',
    }),
    title: Object.freeze({
        ar: 'استبدال خلفية الصورة',
        en: 'Replace Background',
    }),
    description: Object.freeze({
        ar: 'ارفع أي صورة (حتى لو بلا شفافية)، واحصل على نسخة بخلفية جديدة (لون أو تدرج أو صورة) في خطوة واحدة. تُزال الخلفية القديمة تلقائيًا بالذكاء الاصطناعي عند الحاجة.',
        en: 'Upload any image (even without transparency) and get a version with a new background (color, gradient, or photo) in one step. The old background is removed automatically with AI when needed.',
    }),
    note: Object.freeze({
        ar: 'تتم كل المعالجة داخل متصفحك؛ صورتك لا تُرفع لأي خادم. لو الصورة بلا شفافية، أول استخدام يتطلب تحميل نموذج ذكاء اصطناعي صغير (حوالي 5 ميجابايت) يُخزَّن بعدها في متصفحك.',
        en: 'All processing happens in your browser; your photo is never uploaded to any server. If the image has no transparency, the first use downloads a small AI model (about 5 MB), which is then cached in your browser.',
    }),
    inputs: Object.freeze([]),
});

const replaceBackgroundToolDefinitions = Object.freeze({
    [replaceBackground.id]: replaceBackground,
});

export { replaceBackgroundToolDefinitions };

// END OF FILE
